"""Security utilities - JWT, password hashing, authentication"""
import hashlib
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Depends
import logging

from .config import settings
from .database import db

logger = logging.getLogger(__name__)


def get_password_hash(password: str) -> str:
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return get_password_hash(plain_password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=settings.JWT_EXPIRATION_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


async def get_user_from_token(request: Request) -> dict:
    """Extract and validate user from JWT token in request header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_auth(request: Request) -> dict:
    """Dependency that requires authentication"""
    return await get_user_from_token(request)


async def check_ai_usage(user: dict, feature: str) -> tuple:
    """Check if user can use AI feature based on tier limits"""
    from .config import TIER_LIMITS
    
    tier = user.get("tier", "free")
    limits = TIER_LIMITS.get(tier, TIER_LIMITS["free"])
    
    if not limits.get("has_ai_features", False):
        return False, f"AI features require Professional or Enterprise tier. Current tier: {tier}"
    
    # Get limit for specific feature
    limit_key = f"{feature}_limit"
    limit = limits.get(limit_key, 0)
    
    if limit == -1:  # Unlimited
        return True, ""
    
    if limit == 0:
        return False, f"{feature} is not available on {tier} tier"
    
    # Check current usage
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    usage_key = f"{feature}_{current_month}"
    current_usage = user.get("ai_usage", {}).get(usage_key, 0)
    
    if current_usage >= limit:
        return False, f"Monthly {feature} limit reached ({limit}). Upgrade for more."
    
    return True, ""


async def increment_ai_usage(user_id: str, feature: str):
    """Increment AI usage counter for user"""
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    usage_key = f"ai_usage.{feature}_{current_month}"
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {usage_key: 1}}
    )
