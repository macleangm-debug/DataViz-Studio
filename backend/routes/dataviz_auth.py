"""DataViz Studio - Authentication Routes"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime, timezone
import uuid
import os
import bcrypt
import jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])

JWT_SECRET = os.environ.get('JWT_SECRET', 'dataviz-studio-secret')


class UserCreate(BaseModel):
    email: str
    password: str
    name: str


class UserLogin(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(user: UserCreate, request: Request):
    """Register a new user"""
    db = request.app.state.db
    
    # Check if user exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt())
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "name": user.name,
        "password_hash": hashed.decode(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "role": "user"
    }
    
    await db.users.insert_one(user_doc)
    
    # Create default org
    org_doc = {
        "id": str(uuid.uuid4()),
        "name": f"{user.name}'s Workspace",
        "slug": user.email.split('@')[0],
        "owner_id": user_doc["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.organizations.insert_one(org_doc)
    
    # Generate token
    token = jwt.encode(
        {"user_id": user_doc["id"], "email": user.email},
        JWT_SECRET,
        algorithm="HS256"
    )
    
    return {
        "token": token,
        "user": {"id": user_doc["id"], "email": user.email, "name": user.name},
        "organization": {"id": org_doc["id"], "name": org_doc["name"]}
    }


@router.post("/login")
async def login(credentials: UserLogin, request: Request):
    """Login user"""
    db = request.app.state.db
    
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(credentials.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Get user's org
    org = await db.organizations.find_one({"owner_id": user["id"]})
    
    token = jwt.encode(
        {"user_id": user["id"], "email": user["email"]},
        JWT_SECRET,
        algorithm="HS256"
    )
    
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
        "organization": {"id": org["id"], "name": org["name"]} if org else None
    }


@router.get("/me")
async def get_current_user(request: Request):
    """Get current user info"""
    db = request.app.state.db
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        orgs = await db.organizations.find({"owner_id": user["id"]}).to_list(100)
        
        return {
            "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
            "organizations": [{"id": o["id"], "name": o["name"], "slug": o.get("slug", "")} for o in orgs]
        }
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
