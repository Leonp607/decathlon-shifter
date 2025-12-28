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
        minute = s.start_time.minute
        
        # Morning: 8:00 to 15:00 (shifts starting 8:00-10:59)
        # Middle: 11:00 to 19:30 (shifts starting 11:00-19:29)
        # Evening: 15:00 to 22:15 (shifts starting 15:00-22:14)
        if 8 <= hour < 11:
            summary["morning"] += 1
        elif 11 <= hour < 15:
            summary["afternoon"] += 1
        elif 15 <= hour < 19:
            summary["evening"] += 1
        elif hour == 19:
            if minute < 30:
                summary["afternoon"] += 1
            else:
                summary["evening"] += 1
        elif hour == 20 or hour == 21:
            summary["evening"] += 1
        elif hour == 22 and minute <= 15:
            summary["evening"] += 1
        else:
            # Shifts outside normal hours go to evening
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

        # Initialize position-based structure
        day_info = {
            "date": current_date.isoformat(),
            "morning_staff": [],
            "afternoon_staff": [],
            "evening_staff": [],
            "morning_by_position": {},
            "afternoon_by_position": {},
            "evening_by_position": {},
            "counts": {"morning": 0, "afternoon": 0, "evening": 0}
        }

        for s in shifts:
            # הגנה מפני משמרות ללא משתמש (הגורם לשגיאה 500)
            if s.user:
                full_name = f"{s.user.first_name} {s.user.last_name}"
            else:
                full_name = f"Unknown User ({s.user_id})"

            # Get local time (handle timezone if needed)
            start_time_local = s.start_time
            # If timezone-aware, convert to naive local time
            if start_time_local.tzinfo is not None:
                # Convert to local timezone (assuming UTC, adjust if needed)
                start_time_local = start_time_local.replace(tzinfo=None)
            
            hour = start_time_local.hour
            minute = start_time_local.minute
            position = s.position or "Unknown"

            # Initialize position list if not exists
            if position not in day_info["morning_by_position"]:
                day_info["morning_by_position"][position] = []
            if position not in day_info["afternoon_by_position"]:
                day_info["afternoon_by_position"][position] = []
            if position not in day_info["evening_by_position"]:
                day_info["evening_by_position"][position] = []

            # Morning: 8:00 to 15:00 (shifts starting 8:00-14:59 should be morning)
            # Middle: 11:00 to 19:30 (shifts starting 11:00-19:29 should be middle)
            # Evening: 15:00 to 22:15 (shifts starting 15:00-22:14 should be evening)
            # Note: There's overlap, so we prioritize based on start time
            
            # Debug: Print shift info for troubleshooting (uncomment if needed)
            # print(f"DEBUG Shift: {full_name}, Start: {start_time_local}, Hour: {hour}, Minute: {minute}, Position: {position}, Date: {current_date}")
            
            # Create employee info object with name and notes
            employee_info = {
                "name": full_name,
                "notes": s.notes if s.notes else None
            }
            
            if 8 <= hour < 11:
                # 8:00-10:59 → Morning
                day_info["morning_staff"].append(full_name)
                day_info["morning_by_position"][position].append(employee_info)
                day_info["counts"]["morning"] += 1
            elif 11 <= hour < 15:
                # 11:00-14:59 → Middle (in the middle range, even though it overlaps with morning)
                day_info["afternoon_staff"].append(full_name)
                day_info["afternoon_by_position"][position].append(employee_info)
                day_info["counts"]["afternoon"] += 1
            elif 15 <= hour < 19:
                # 15:00-18:59 → Evening (15:00 is start of evening range)
                day_info["evening_staff"].append(full_name)
                day_info["evening_by_position"][position].append(employee_info)
                day_info["counts"]["evening"] += 1
            elif hour == 19:
                if minute < 30:
                    # 19:00-19:29 → Middle
                    day_info["afternoon_staff"].append(full_name)
                    day_info["afternoon_by_position"][position].append(employee_info)
                    day_info["counts"]["afternoon"] += 1
                else:
                    # 19:30-19:59 → Evening
                    day_info["evening_staff"].append(full_name)
                    day_info["evening_by_position"][position].append(employee_info)
                    day_info["counts"]["evening"] += 1
            elif 20 <= hour <= 21:
                # 20:00-21:59 → Evening
                day_info["evening_staff"].append(full_name)
                day_info["evening_by_position"][position].append(employee_info)
                day_info["counts"]["evening"] += 1
            elif hour == 22 and minute <= 15:
                # 22:00-22:15 → Evening
                day_info["evening_staff"].append(full_name)
                day_info["evening_by_position"][position].append(employee_info)
                day_info["counts"]["evening"] += 1
            else:
                # Shifts outside normal hours - check if it's early morning (0-7) or late (22:16-23:59)
                if hour < 8:
                    # Very early shifts (0:00-7:59) - could be morning or previous day's evening
                    # For now, put in evening
                    day_info["evening_staff"].append(full_name)
                    day_info["evening_by_position"][position].append(employee_info)
                    day_info["counts"]["evening"] += 1
                else:
                    # Late shifts (22:16-23:59) → Evening
                    day_info["evening_staff"].append(full_name)
                    day_info["evening_by_position"][position].append(employee_info)
                    day_info["counts"]["evening"] += 1

        weekly_data.append(day_info)

    return weekly_data

def get_hours_by_position_weekly(db: Session, branch_id: int, start_date: date):
    """
    Calculate total hours worked per position for a week
    Returns a dictionary with position as key and total hours as value
    """
    end_date = start_date + timedelta(days=6)
    
    shifts = db.query(Shift).filter(
        Shift.branch_id == branch_id,
        Shift.start_time >= datetime.combine(start_date, datetime.min.time()),
        Shift.start_time <= datetime.combine(end_date, datetime.max.time())
    ).all()
    
    hours_by_position = {}
    
    for shift in shifts:
        position = shift.position or "Unknown"
        
        # Calculate hours
        duration = shift.end_time - shift.start_time
        hours = duration.total_seconds() / 3600  # Convert to hours
        
        if position not in hours_by_position:
            hours_by_position[position] = 0
        
        hours_by_position[position] += hours
    
    return hours_by_position


def get_shifts_by_employee(db: Session, branch_id: int, user_id: str):
    """
    Get all shifts for a specific employee in a branch
    """
    shifts = db.query(Shift).filter(
        Shift.branch_id == branch_id,
        Shift.user_id == user_id
    ).order_by(Shift.start_time.desc()).all()
    
    return shifts


def update_shift(db: Session, shift_id: int, shift_in: ShiftCreate):
    # 1. מציאת המשמרת הקיימת
    db_shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not db_shift:
        return None

    # 2. בדיקת חפיפה (מוודאים שהזמן החדש לא מתנגש עם משמרות אחרות של אותו עובד)
    # אנחנו מחפשים חפיפה, אבל מוסיפים תנאי שה-ID לא יהיה ה-ID של המשמרת שאנחנו עורכים כרגע
    overlap = db.query(Shift).filter(
        Shift.user_id == shift_in.user_id,
        Shift.id != shift_id,  # אל תבדוק חפיפה מול עצמי
        and_(
            Shift.start_time < shift_in.end_time,
            Shift.end_time > shift_in.start_time
        )
    ).first()

    if overlap:
        raise HTTPException(
            status_code=400,
            detail=f"Conflict: Employee already has another shift from {overlap.start_time.strftime('%H:%M')} to {overlap.end_time.strftime('%H:%M')}"
        )

    # 3. עדכון הנתונים
    db_shift.start_time = shift_in.start_time
    db_shift.end_time = shift_in.end_time
    db_shift.position = shift_in.position
    db_shift.notes = shift_in.notes
    db_shift.user_id = shift_in.user_id
    db_shift.branch_id = shift_in.branch_id

    db.commit()
    db.refresh(db_shift)
    return db_shift