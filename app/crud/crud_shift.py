from sqlalchemy.orm import Session
from app.db.models.shift import Shift
from app.schemas.shift import ShiftCreate
from datetime import datetime, date

def create_shift(db: Session, shift_in: ShiftCreate):
    db_shift = Shift(
        user_id = shift_in.user_id,
        branch_id = shift_in.branch_id,
        start_time = shift_in.start_time,
        end_time = shift_in.end_time,
        position = shift_in.position,
        notes = shift_in.notes
    )
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift

def get_branch_shifts(db: Session, branch_id: int):
    return db.query(Shift).filter(Shift.branch_id == branch_id).all()


def get_shift_summary(db: Session, branch_id: int, target_date: date):
    # שליפת כל המשמרות של הסניף ביום המבוקש
    shifts = db.query(Shift).filter(
        Shift.branch_id == branch_id,
        # בודק אם המשמרת מתחילה ביום הזה
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