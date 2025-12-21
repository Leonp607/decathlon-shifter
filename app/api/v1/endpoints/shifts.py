from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_shift
from app.schemas.shift import ShiftOut, ShiftCreate, ShiftSummary
from app.db.models.user import User
from datetime import date

router = APIRouter()

@router.post("/", response_model=ShiftOut)
def create_new_shift(shift_in: ShiftCreate, db: Session = Depends(deps.get_db),current_user: User = Depends(deps.get_current_user)):
    return crud_shift.create_shift(db=db, shift_in=shift_in)

@router.get("/branch/{branch_id}", response_model=List[ShiftOut])
def get_shifts_by_branch( branch_id: int, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    return crud_shift.get_branch_shifts(db, branch_id=branch_id)

@router.get("/summery/{branch_id}", response_model=ShiftSummary)
def read_shifts_summary(
    branch_id: int,
    target_date: date, # FastAPI יודע לקבל תאריך בפורמט YYYY-MM-DD
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    קבלת סיכום כמות עובדים לפי חלקי היום עבור סניף ותאריך ספציפי
    """
    result = crud_shift.get_shift_summary(db, branch_id=branch_id, target_date=target_date)
    return {
        "date": str(target_date),
        "morning": result["morning"],
        "afternoon": result["afternoon"],
        "evening": result["evening"],
        "total": result["total"]
    }