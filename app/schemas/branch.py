from typing import Optional, List
from pydantic import BaseModel
from app.schemas.user import UserOut


#what the user have to send to create a branch
class BranchCreate(BaseModel):
    name: str
    location: Optional[str] = None


class Branch(BaseModel):
    id: int
    name: str
    location: Optional[str] = None

    class Config:
        #this allows SQAlchemy to work with Pydantic
        from_attributes = True

class BranchWithUsers(Branch):
    users: List[UserOut]

