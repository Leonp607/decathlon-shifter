from sqlalchemy.orm import Session
from app.db.models.branch import Branch
from app.schemas.branch import BranchCreate

def get_branch(db: Session, branch_id: int):
    return db.query(Branch).filter(Branch.id == branch_id).first()

def get_branches(db: Session, skip: int=0, limit: int=100):
    return db.query(Branch).offset(skip).limit(limit).all()

def create_branch(db: Session, branch_in: BranchCreate):
    db_branch = Branch(
        name=branch_in.name,
        location=branch_in.location,
    )
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)
    return db_branch

def get_branch_by_name(db: Session, branch_name: str):
    return db.query(Branch).filter(Branch.name == branch_name).first()
