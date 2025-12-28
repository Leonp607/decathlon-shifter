from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List
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


@router.get("/branch-staff/{branch_id}", response_model=List[UserOut])
def get_staff_by_branch(
        branch_id: int,
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_user)
):
    """
    מחזיר את כל העובדים ששייכים לסניף מסוים (לצורך בחירה בתוך רשימה)
    """
    # רק מנהל יכול לראות את כל רשימת העובדים
    if current_user.role.lower() != "store leader":
        raise HTTPException(status_code=403, detail="Not authorized")

    users = db.query(User).filter(User.branch_id == branch_id).all()
    return users