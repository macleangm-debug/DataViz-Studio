"""DataViz Studio - Dashboard Routes"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


class DashboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    org_id: Optional[str] = None
    widgets: List[Dict[str, Any]] = []


class DashboardLayoutUpdate(BaseModel):
    widgets: List[Dict[str, Any]]


@router.post("")
async def create_dashboard(dashboard: DashboardCreate, request: Request):
    """Create a new dashboard"""
    db = request.app.state.db
    
    dashboard_id = str(uuid.uuid4())
    dashboard_doc = {
        "id": dashboard_id,
        "name": dashboard.name,
        "description": dashboard.description,
        "org_id": dashboard.org_id,
        "widgets": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.dashboards.insert_one(dashboard_doc)
    
    # If widgets were provided (e.g., from a template), insert them
    widget_ids = []
    if dashboard.widgets:
        for widget_data in dashboard.widgets:
            widget_id = str(uuid.uuid4())
            widget_doc = {
                "id": widget_id,
                "dashboard_id": dashboard_id,
                "type": widget_data.get("type", "stat"),
                "title": widget_data.get("title", "Widget"),
                "dataset_id": widget_data.get("dataset_id"),
                "config": widget_data.get("config", {}),
                "position": widget_data.get("position", {"x": 0, "y": 0, "w": 3, "h": 2}),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.widgets.insert_one(widget_doc)
            widget_ids.append(widget_id)
        
        # Update dashboard with widget IDs
        await db.dashboards.update_one(
            {"id": dashboard_id},
            {"$set": {"widgets": widget_ids}}
        )
    
    return {
        "id": dashboard_id,
        "name": dashboard.name,
        "widgets": widget_ids
    }


@router.get("")
async def list_dashboards(request: Request, org_id: Optional[str] = None):
    """List all dashboards"""
    db = request.app.state.db
    
    query = {"org_id": org_id} if org_id else {}
    dashboards = await db.dashboards.find(query, {"_id": 0}).to_list(100)
    return {"dashboards": dashboards}


@router.get("/{dashboard_id}")
async def get_dashboard(dashboard_id: str, request: Request):
    """Get a dashboard by ID"""
    db = request.app.state.db
    
    dashboard = await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dashboard


@router.put("/{dashboard_id}")
async def update_dashboard(dashboard_id: str, dashboard: DashboardCreate, request: Request):
    """Update a dashboard"""
    db = request.app.state.db
    
    await db.dashboards.update_one(
        {"id": dashboard_id},
        {"$set": {
            "name": dashboard.name,
            "description": dashboard.description,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"status": "updated"}


@router.delete("/{dashboard_id}")
async def delete_dashboard(dashboard_id: str, request: Request):
    """Delete a dashboard"""
    db = request.app.state.db
    
    await db.dashboards.delete_one({"id": dashboard_id})
    await db.widgets.delete_many({"dashboard_id": dashboard_id})
    return {"status": "deleted"}


@router.put("/{dashboard_id}/layout")
async def update_dashboard_layout(dashboard_id: str, layout: DashboardLayoutUpdate, request: Request):
    """Update dashboard widget layout"""
    db = request.app.state.db
    
    # Update each widget's position
    for widget_data in layout.widgets:
        widget_id = widget_data.get("id") or widget_data.get("i")
        if widget_id:
            await db.widgets.update_one(
                {"id": widget_id},
                {"$set": {
                    "position": {
                        "x": widget_data.get("x", 0),
                        "y": widget_data.get("y", 0),
                        "w": widget_data.get("w", 3),
                        "h": widget_data.get("h", 2)
                    }
                }}
            )
    
    await db.dashboards.update_one(
        {"id": dashboard_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"status": "layout_updated"}


@router.get("/{dashboard_id}/widgets")
async def get_dashboard_widgets(dashboard_id: str, request: Request):
    """Get all widgets for a dashboard"""
    db = request.app.state.db
    
    widgets = await db.widgets.find(
        {"dashboard_id": dashboard_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"widgets": widgets}
