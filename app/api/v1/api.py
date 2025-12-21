from fastapi import APIRouter
from app.api.v1.endpoints import users, branches, auth, shifts

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(branches.router, prefix="/branches", tags=["branches"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(shifts.router, prefix="/shifts", tags=["shifts"])