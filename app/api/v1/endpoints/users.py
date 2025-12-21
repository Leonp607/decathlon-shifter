from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any
from app.api import deps
from app.crud import crud_user
from app.schemas.user import UserCreate, UserOut
from app.api.deps import oauth2_scheme
from app.db.models.user import User  # וודא שהשורה הזו קיימת

router = APIRouter()

@router.post("/", response_model=UserOut)
def create_new_user(user_in: UserCreate,db: Session = Depends(deps.get_db)) -> Any:
    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )
    new_user = crud_user.create_user(db=db, user_in=user_in)
    return new_user

@router.get("/test-token")
def test_token(token: str = Depends(oauth2_scheme)) -> Any:
    return {"message": "Success!", "your_token": token}

@router.get("/me", response_model=UserOut)
def read_user_me(
    current_user: User = Depends(deps.get_current_user)
):
    """
    מחזיר את פרטי המשתמש המחובר (כולל ה-Role שלו)
    """
    return current_user

