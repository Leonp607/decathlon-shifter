from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_branch
from app.schemas.branch import Branch, BranchCreate, BranchWithUsers
from app.api.deps import get_current_user
from app.db.models.user import User

router = APIRouter()

@router.post("/", response_model=Branch)
def create_new_branch(branch_in: BranchCreate,db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user) ):
    existing_branch = crud_branch.get_branch_by_name(db, branch_name=branch_in.name)
    if existing_branch:
        raise HTTPException(
            status_code=400,
            detail="Branch with this name already exists",
        )
    return crud_branch.create_branch(db=db, branch_in=branch_in)

@router.get("/", response_model=List[Branch])
def read_branches(db: Session = Depends(deps.get_db),skip: int = 0,limit: int = 100):
    return crud_branch.get_branches(db=db, skip=skip, limit=limit)

@router.get("/{branch_id}", response_model=BranchWithUsers)
def read_branch(branch_id: int, db: Session=Depends(deps.get_db),current_user: User = Depends(deps.get_current_user)):
    db_branch = crud_branch.get_branch(db, branch_id=branch_id)
    if not db_branch:
        raise HTTPException(
            status_code=404,
            detail="Branch not found",
        )
    return db_branch