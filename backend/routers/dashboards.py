"""Dashboards router"""
from fastapi import APIRouter, HTTPException
from typing import Optional

from services.dashboard_service import DashboardService
from schemas.dashboard import DashboardCreate, DashboardLayoutUpdate, WidgetCreate

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.post("")
async def create_dashboard(dashboard: DashboardCreate):
    """Create a new dashboard"""
    result = await DashboardService.create_dashboard(
        name=dashboard.name,
        description=dashboard.description,
        layout=dashboard.layout,
        org_id=dashboard.org_id
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
async def update_dashboard(dashboard_id: str, dashboard: DashboardCreate):
    """Update dashboard"""
    result = await DashboardService.update_dashboard(
        dashboard_id=dashboard_id,
        name=dashboard.name,
        description=dashboard.description,
        layout=dashboard.layout,
        org_id=dashboard.org_id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return result


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
