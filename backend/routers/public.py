"""Public routes for shared dashboards and charts"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import Optional

from core.database import db

router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/dashboards/{public_id}")
async def get_public_dashboard(public_id: str, password: Optional[str] = None):
    """Get a publicly shared dashboard by its public ID"""
    dashboard = await db.dashboards.find_one(
        {"public_id": public_id, "is_public": True},
        {"_id": 0}
    )
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found or not public")
    
    # Check expiry
    expires_at = dashboard.get("expires_at")
    if expires_at:
        try:
            exp_date = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > exp_date:
                raise HTTPException(status_code=410, detail="This shared link has expired")
        except ValueError:
            pass
    
    # Check password
    if dashboard.get("password"):
        if not password or password != dashboard.get("password"):
            raise HTTPException(status_code=401, detail="Password required")
    
    # Return dashboard without sensitive fields
    return {
        "id": dashboard.get("id"),
        "name": dashboard.get("name"),
        "description": dashboard.get("description"),
        "layout": dashboard.get("layout", [])
    }


@router.get("/charts/{chart_id}/data")
async def get_public_chart_data(chart_id: str):
    """Get data for a chart on a public dashboard"""
    # First verify the chart belongs to a public dashboard
    chart = await db.charts.find_one({"id": chart_id}, {"_id": 0})
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    # Get the dashboard this chart belongs to (via widget)
    widget = await db.widgets.find_one({"config.chart_id": chart_id}, {"_id": 0})
    if widget:
        dashboard = await db.dashboards.find_one(
            {"id": widget.get("dashboard_id")},
            {"_id": 0}
        )
        if not dashboard or not dashboard.get("is_public"):
            raise HTTPException(status_code=403, detail="Chart not accessible")
    
    # Get chart data
    dataset_id = chart.get("dataset_id")
    if not dataset_id:
        return {"data": chart.get("data", [])}
    
    # Fetch data from dataset
    data = await db.dataset_data.find(
        {"dataset_id": dataset_id},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).to_list(10000)
    
    return {"data": data, "chart": chart}
