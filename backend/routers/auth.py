"""Authentication router"""
from fastapi import APIRouter, HTTPException, Request

from schemas.auth import UserCreate, UserLogin
from services.auth_service import AuthService
from core.security import get_user_from_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
async def register(user: UserCreate):
    """Register a new user"""
    try:
        result = await AuthService.register(user)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(credentials: UserLogin):
    """Login and get access token"""
    try:
        result = await AuthService.login(credentials)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
async def get_current_user(request: Request):
    """Get current authenticated user"""
    user = await get_user_from_token(request)
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "tier": user.get("tier", "free"),
        "ai_usage": user.get("ai_usage", {})
    }
