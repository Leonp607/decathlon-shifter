from sqlalchemy.orm import Session
from app.db.models.shift import Shift
from app.schemas.shift import ShiftCreate
from datetime import datetime, date, timedelta
from sqlalchemy import and_
from fastapi import HTTPException

def check_shift_overlap(db: Session, user_id: str, start_time: datetime, end_time: datetime):
    return db.query(Shift).filter(
        Shift.user_id == user_id,
        and_(
            Shift.start_time < end_time,
            Shift.end_time > start_time
        )
    ).first()

def create_shift(db: Session, shift_in: ShiftCreate):
    overlap = check_shift_overlap(db, user_id=shift_in.user_id, start_time=shift_in.start_time, end_time=shift_in.end_time)
    if overlap:
        raise HTTPException(
            status_code=400,
            detail=f"Conflict: Employee has a shift from {overlap.start_time.strftime('%H:%M')} to {overlap.end_time.strftime('%H:%M')}"
        )

    db_shift = Shift(
        user_id=shift_in.user_id,
        branch_id=shift_in.branch_id,
        start_time=shift_in.start_time,
        end_time=shift_in.end_time,
        position=shift_in.position,
        notes=shift_in.notes
    )
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift

def delete_shift(db: Session, shift_id: int) -> bool:
    db_shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if db_shift:
        db.delete(db_shift)
        db.commit()
        return True
    return False

def get_branch_shifts(db: Session, branch_id: int):
    return db.query(Shift).filter(Shift.branch_id == branch_id).all()

def get_shift_summary(db: Session, branch_id: int, target_date: date):
    shifts = db.query(Shift).filter(
        Shift.branch_id == branch_id,
        Shift.start_time >= datetime.combine(target_date, datetime.min.time()),
        Shift.start_time <= datetime.combine(target_date, datetime.max.time())
    ).all()

    summary = {"morning": 0, "afternoon": 0, "evening": 0, "total": len(shifts)}

    for s in shifts:
        hour = s.start_time.hour
        if 6 <= hour < 14:
            summary["morning"] += 1
        elif 14 <= hour < 18:
            summary["afternoon"] += 1
        else:
            summary["evening"] += 1
    return summary


def get_weekly_board(db: Session, branch_id: int, start_date: date):
    weekly_data = []

    for i in range(7):
        current_date = start_date + timedelta(days=i)

        shifts = db.query(Shift).filter(
            Shift.branch_id == branch_id,
            Shift.start_time >= datetime.combine(current_date, datetime.min.time()),
            Shift.start_time <= datetime.combine(current_date, datetime.max.time())
        ).all()

        day_info = {
            "date": current_date.isoformat(),
            "morning_staff": [],
            "afternoon_staff": [],
            "evening_staff": [],
            "counts": {"morning": 0, "afternoon": 0, "evening": 0}
        }

        for s in shifts:
            # הגנה מפני משמרות ללא משתמש (הגורם לשגיאה 500)
            if s.user:
                full_name = f"{s.user.first_name} {s.user.last_name}"
            else:
                full_name = f"Unknown User ({s.user_id})"

            hour = s.start_time.hour

            if 6 <= hour < 12:
                day_info["morning_staff"].append(full_name)
                day_info["counts"]["morning"] += 1
            elif 12 <= hour < 17:
                day_info["afternoon_staff"].append(full_name)
                day_info["counts"]["afternoon"] += 1
            else:
                day_info["evening_staff"].append(full_name)
                day_info["counts"]["evening"] += 1

        weekly_data.append(day_info)

    return weekly_data