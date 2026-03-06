"""Dashboards router"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import uuid
import secrets
from datetime import datetime, timezone

from services.dashboard_service import DashboardService
from schemas.dashboard import DashboardCreate, DashboardUpdate, DashboardLayoutUpdate, WidgetCreate
from core.database import db

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.post("")
async def create_dashboard(dashboard: DashboardCreate):
    """Create a new dashboard"""
    result = await DashboardService.create_dashboard(
        name=dashboard.name,
        description=dashboard.description,
        layout=dashboard.layout,
        org_id=dashboard.org_id,
        tags=dashboard.tags,
        preview_image=dashboard.preview_image,
        is_favorite=dashboard.is_favorite
    )
    return result


@router.get("")
async def list_dashboards(org_id: Optional[str] = None):
    """List all dashboards"""
    dashboards = await DashboardService.list_dashboards(org_id)
    return {"dashboards": dashboards}


@router.get("/{dashboard_id}")
async def get_dashboard(dashboard_id: str):
    """Get dashboard by ID"""
    dashboard = await DashboardService.get_dashboard(dashboard_id)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dashboard


@router.put("/{dashboard_id}")
async def update_dashboard(dashboard_id: str, dashboard: DashboardUpdate):
    """Update dashboard"""
    result = await DashboardService.update_dashboard(
        dashboard_id=dashboard_id,
        name=dashboard.name,
        description=dashboard.description,
        layout=dashboard.layout,
        tags=dashboard.tags,
        preview_image=dashboard.preview_image,
        is_favorite=dashboard.is_favorite
    )
    if not result:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return result


@router.post("/{dashboard_id}/favorite")
async def toggle_dashboard_favorite(dashboard_id: str):
    """Toggle dashboard favorite status"""
    result = await DashboardService.toggle_favorite(dashboard_id)
    if not result:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return result


@router.post("/{dashboard_id}/view")
async def track_dashboard_view(dashboard_id: str):
    """Track a view on a dashboard"""
    await DashboardService.increment_views(dashboard_id)
    return {"message": "View tracked"}


@router.put("/{dashboard_id}/layout")
async def update_dashboard_layout(dashboard_id: str, layout: DashboardLayoutUpdate):
    """Update dashboard layout only"""
    result = await DashboardService.update_layout(dashboard_id, layout.layout)
    if not result:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return result


@router.delete("/{dashboard_id}")
async def delete_dashboard(dashboard_id: str):
    """Delete dashboard"""
    deleted = await DashboardService.delete_dashboard(dashboard_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return {"message": "Dashboard deleted"}


# Widget endpoints
@router.post("/{dashboard_id}/widgets")
async def create_widget(dashboard_id: str, widget: WidgetCreate):
    """Create a widget in dashboard"""
    result = await DashboardService.create_widget(
        dashboard_id=dashboard_id,
        widget_type=widget.type,
        config=widget.config,
        position=widget.position
    )
    return result


@router.get("/{dashboard_id}/widgets")
async def get_dashboard_widgets(dashboard_id: str):
    """Get all widgets for dashboard"""
    widgets = await DashboardService.get_dashboard_widgets(dashboard_id)
    return {"widgets": widgets}


@router.put("/widgets/{widget_id}")
async def update_widget(widget_id: str, widget: WidgetCreate):
    """Update a widget"""
    result = await DashboardService.update_widget(
        widget_id=widget_id,
        widget_type=widget.type,
        config=widget.config,
        position=widget.position
    )
    if not result:
        raise HTTPException(status_code=404, detail="Widget not found")
    return result


@router.delete("/widgets/{widget_id}")
async def delete_widget(widget_id: str):
    """Delete a widget"""
    deleted = await DashboardService.delete_widget(widget_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Widget not found")
    return {"message": "Widget deleted"}


# Public sharing endpoints
@router.get("/{dashboard_id}/share")
async def get_share_settings(dashboard_id: str):
    """Get current sharing settings for a dashboard"""
    dashboard = await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    return {
        "is_public": dashboard.get("is_public", False),
        "public_id": dashboard.get("public_id"),
        "has_password": bool(dashboard.get("password")),
        "expires_at": dashboard.get("expires_at")
    }


@router.post("/{dashboard_id}/share")
async def update_share_settings(dashboard_id: str, settings: dict):
    """Enable or update public sharing for a dashboard"""
    dashboard = await db.dashboards.find_one({"id": dashboard_id})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    is_public = settings.get("is_public", False)
    
    update_data = {
        "is_public": is_public,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if is_public:
        # Generate public ID if enabling
        if not dashboard.get("public_id"):
            update_data["public_id"] = secrets.token_urlsafe(16)
        
        # Handle password
        if settings.get("password"):
            # In production, hash the password
            update_data["password"] = settings["password"]
        elif settings.get("remove_password"):
            update_data["password"] = None
            
        # Handle expiry
        if settings.get("expires_at"):
            update_data["expires_at"] = settings["expires_at"]
        elif settings.get("remove_expiry"):
            update_data["expires_at"] = None
    else:
        # When disabling, clear sharing settings
        update_data["public_id"] = None
        update_data["password"] = None
        update_data["expires_at"] = None
    
    await db.dashboards.update_one(
        {"id": dashboard_id},
        {"$set": update_data}
    )
    
    # Return updated settings
    updated = await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})
    return {
        "is_public": updated.get("is_public", False),
        "public_id": updated.get("public_id"),
        "has_password": bool(updated.get("password")),
        "expires_at": updated.get("expires_at")
    }

