from sqlalchemy.orm import Session
from app.db.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

def create_user(db: Session, user_in:UserCreate):
    #Hash the password before storing it
    hashed_password = get_password_hash(user_in.password)

    db_user= User(
        id = user_in.id,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role,
        branch_id=user_in.branch_id
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email:str):
    return db.query(User).filter(User.email == email).first()


