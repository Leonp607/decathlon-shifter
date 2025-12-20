from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: str
    branch_id: int


class UserOut(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True
