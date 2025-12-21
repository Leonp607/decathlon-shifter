from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List


class ShiftBase(BaseModel):
    user_id: str
    branch_id: int
    start_time: datetime
    end_time: datetime
    position: str
    notes: Optional[str] = None

class ShiftCreate(ShiftBase):
    @field_validator('end_time')
    @classmethod
    def check_times(cls, v: datetime, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

class ShiftOut(ShiftBase):
    id: int
    class Config:
        from_attributes = True

class ShiftSummary(BaseModel):
    date: str
    morning: int   # 06:00 - 14:00
    afternoon: int # 14:00 - 18:00
    evening: int   # 18:00 - 23:00
    total: int

class DaySchedule(BaseModel):
    date: str
    morning_staff: List[str]   # שמות העובדים
    afternoon_staff: List[str]
    evening_staff: List[str]
    counts: dict               # למשל: {"morning": 2, "afternoon": 1, "evening": 3}

class WeeklyReport(BaseModel):
    branch_id: int
    schedule: List[DaySchedule]
