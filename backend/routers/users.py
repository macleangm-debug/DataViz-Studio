"""User management router - handles user CRUD, profile, and admin operations"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import hashlib

from core.database import db
from services.auth_service import AuthService

router = APIRouter(tags=["Users"])


# Helper to get current user from token
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    user = await AuthService.get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


# Profile endpoints
@router.get("/user/profile")
async def get_profile(request: Request):
    """Get current user's profile"""
    user = await get_current_user(request)
    return {
        "id": user.get("id"),
        "name": user.get("name"),
        "email": user.get("email"),
        "avatar": user.get("avatar"),
        "tier": user.get("tier", "free"),
        "created_at": user.get("created_at")
    }


@router.put("/user/profile")
async def update_profile(request: Request):
    """Update current user's profile"""
    user = await get_current_user(request)
    data = await request.json()
    
    update_data = {}
    if "name" in data:
        update_data["name"] = data["name"]
    if "email" in data:
        # Check if email is already taken
        existing = await db.users.find_one({"email": data["email"], "id": {"$ne": user["id"]}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = data["email"]
    if "avatar" in data:
        update_data["avatar"] = data["avatar"]
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
        
        # Log activity
        await log_activity(user["id"], "profile_update", "Profile updated")
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return {"user": updated_user}


@router.post("/user/change-password")
async def change_password(request: Request):
    """Change current user's password"""
    user = await get_current_user(request)
    data = await request.json()
    
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Both current and new password required")
    
    # Verify current password
    full_user = await db.users.find_one({"id": user["id"]})
    if not AuthService.verify_password(current_password, full_user.get("password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    hashed_password = AuthService.hash_password(new_password)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password": hashed_password, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Log activity
    await log_activity(user["id"], "password_change", "Password changed")
    
    return {"message": "Password updated successfully"}


@router.delete("/user/delete-account")
async def delete_account(request: Request):
    """Delete current user's account"""
    user = await get_current_user(request)
    
    # Delete user data
    await db.users.delete_one({"id": user["id"]})
    await db.dashboards.delete_many({"user_id": user["id"]})
    await db.charts.delete_many({"user_id": user["id"]})
    await db.datasets.delete_many({"user_id": user["id"]})
    
    return {"message": "Account deleted"}


# Activity log
async def log_activity(user_id: str, activity_type: str, description: str, ip: str = None, device: str = None):
    """Log user activity"""
    activity = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": activity_type,
        "description": description,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ip": ip,
        "device": device,
        "status": "success"
    }
    await db.activity_logs.insert_one(activity)


@router.get("/user/activity-log")
async def get_activity_log(request: Request, limit: int = 50):
    """Get current user's activity log"""
    user = await get_current_user(request)
    
    activities = await db.activity_logs.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {"activities": activities}


# Admin endpoints
@router.get("/admin/users")
async def list_all_users(request: Request):
    """List all users (admin only)"""
    user = await get_current_user(request)
    
    # Check admin role
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find(
        {},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    # Get last active time from activity logs
    for u in users:
        last_activity = await db.activity_logs.find_one(
            {"user_id": u["id"]},
            {"_id": 0, "timestamp": 1}
        )
        u["lastActive"] = last_activity.get("timestamp") if last_activity else u.get("created_at")
        u["status"] = u.get("status", "active")
    
    return {"users": users}


@router.post("/admin/users/invite")
async def invite_user(request: Request):
    """Invite a new user (admin only)"""
    user = await get_current_user(request)
    
    if user.get("role") not in ["admin", "super_admin", "manager"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    data = await request.json()
    email = data.get("email")
    name = data.get("name", email.split("@")[0] if email else "")
    role = data.get("role", "viewer")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    # Check if user already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # For now, directly create the user with a temp password
    temp_password = str(uuid.uuid4())[:8]
    new_user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": name,
        "password": AuthService.hash_password(temp_password),
        "role": role,
        "status": "active",
        "org_id": user.get("org_id"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    
    return {"message": f"User invited: {email}", "temp_password": temp_password}


@router.post("/admin/users/{user_id}/suspend")
async def suspend_user(user_id: str, request: Request):
    """Suspend a user (admin only)"""
    admin = await get_current_user(request)
    
    if admin.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": "suspended", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User suspended"}


@router.post("/admin/users/{user_id}/activate")
async def activate_user(user_id: str, request: Request):
    """Activate a user (admin only)"""
    admin = await get_current_user(request)
    
    if admin.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": "active", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User activated"}


@router.post("/admin/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, request: Request):
    """Deactivate a user (admin only)"""
    admin = await get_current_user(request)
    
    if admin.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": "deactivated", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deactivated"}


@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    """Delete a user (admin only)"""
    admin = await get_current_user(request)
    
    if admin.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Don't allow self-deletion through admin
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Clean up user data
    await db.activity_logs.delete_many({"user_id": user_id})
    
    return {"message": "User deleted"}


@router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, request: Request):
    """Update a user's role (admin only)"""
    admin = await get_current_user(request)
    
    if admin.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    data = await request.json()
    new_role = data.get("role")
    
    if new_role not in ["admin", "manager", "analyst", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": new_role, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User role updated to {new_role}"}
