from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    id: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str
    branch_id: Optional[int] = None


class UserOut(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    branch_id: Optional[int] = None

    class Config:
        from_attributes = True