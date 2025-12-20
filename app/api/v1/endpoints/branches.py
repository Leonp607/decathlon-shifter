from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.db.models.branch import Branch

# תוריד מכאן את ה-prefix וה-tags
router = APIRouter()

@router.get("/")
def get_branches(db: Session = Depends(deps.get_db)):
    return db.query(Branch).all()