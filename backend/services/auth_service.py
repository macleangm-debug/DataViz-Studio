"""Authentication service - handles user registration, login, and token management"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from core.database import db
from core.security import get_password_hash, verify_password, create_access_token
from models.auth import UserCreate, UserLogin


class AuthService:
    """Service for authentication operations"""
    
    @staticmethod
    async def register(user_data: UserCreate) -> Dict[str, Any]:
        """Register a new user"""
        # Check if user exists
        existing = await db.users.find_one({"email": user_data.email})
        if existing:
            raise ValueError("Email already registered")
        
        # Create user
        user = {
            "id": str(uuid.uuid4()),
            "email": user_data.email,
            "password": get_password_hash(user_data.password),
            "name": user_data.name,
            "tier": "free",
            "ai_usage": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user)
        
        # Generate token
        token = create_access_token({"user_id": user["id"]})
        
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "tier": user["tier"]
            }
        }
    
    @staticmethod
    async def login(credentials: UserLogin) -> Dict[str, Any]:
        """Authenticate user and return token"""
        user = await db.users.find_one({"email": credentials.email})
        
        if not user or not verify_password(credentials.password, user["password"]):
            raise ValueError("Invalid email or password")
        
        token = create_access_token({"user_id": user["id"]})
        
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "tier": user.get("tier", "free")
            }
        }
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        return user
    
    @staticmethod
    async def update_user_tier(user_id: str, tier: str) -> bool:
        """Update user tier"""
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {"tier": tier}}
        )
        return result.modified_count > 0
