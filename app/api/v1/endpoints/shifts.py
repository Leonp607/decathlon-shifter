from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_shift
from app.schemas.shift import ShiftOut, ShiftCreate, ShiftSummary, WeeklyReport
from app.db.models.user import User
from datetime import date

router = APIRouter()


@router.post("/", response_model=ShiftOut)
def create_new_shift(
        shift_in: ShiftCreate,
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
):
    # בדיקת הרשאה: רק Store Leader יכול ליצור משמרת
    if current_user.role.lower() != "store leader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only a Store Leader can schedule shifts"
        )
    return crud_shift.create_shift(db=db, shift_in=shift_in)


@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_shift(
        shift_id: int,
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
):
    # בדיקת הרשאה: רק Store Leader יכול למחוק משמרת
    if current_user.role.lower() != "store leader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only a Store Leader can delete shifts"
        )

    success = crud_shift.delete_shift(db, shift_id=shift_id)
    if not success:
        raise HTTPException(status_code=404, detail="Shift not found")
    return None


@router.get("/branch/{branch_id}", response_model=List[ShiftOut])
def get_shifts_by_branch(
        branch_id: int,
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
):
    return crud_shift.get_branch_shifts(db, branch_id=branch_id)


@router.get("/summary/{branch_id}", response_model=ShiftSummary)  # תיקנתי מ-summery ל-summary
def read_shifts_summary(
        branch_id: int,
        target_date: date,
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
):
    result = crud_shift.get_shift_summary(db, branch_id=branch_id, target_date=target_date)
    return {
        "date": str(target_date),
        "morning": result["morning"],
        "afternoon": result["afternoon"],
        "evening": result["evening"],
        "total": result["total"]
    }


@router.get("/weekly-board/{branch_id}", response_model=WeeklyReport)
def get_weekly_board_view(
        branch_id: int,
        start_date: date,
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
):
    """
    מציג לוח שבועי עם שמות העובדים מחולקים לפי בוקר/אמצע/ערב
    """
    # ניקוי רווחים והפיכה לאותיות קטנות כדי למנוע "Access Denied" סתמי
    user_role = current_user.role.strip().lower()

    if user_role != "store leader":
        raise HTTPException(
            status_code=403,
            detail=f"Access denied. Role '{user_role}' is not authorized."
        )

    schedule = crud_shift.get_weekly_board(db, branch_id=branch_id, start_date=start_date)
    return {"branch_id": branch_id, "schedule": schedule}


@router.put("/{shift_id}", response_model=ShiftOut)
def update_existing_shift(
        shift_id: int,
        shift_in: ShiftCreate,
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
):
    # רק Store Leader יכול לעדכן
    if current_user.role.lower() != "store leader":
        raise HTTPException(status_code=403, detail="Only a Store Leader can update shifts")

    updated_shift = crud_shift.update_shift(db, shift_id=shift_id, shift_in=shift_in)
    if not updated_shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    return updated_shift