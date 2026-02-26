"""
Public Chart Data Routes
Secure endpoint for fetching chart data in public dashboard view
"""
from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional, List, Dict, Any, Set
import pandas as pd

router = APIRouter(prefix="/api/public", tags=["Public Charts"])


def extract_chart_ids_from_dashboard(dashboard: Dict[str, Any], db_widgets: List[Dict] = None) -> Set[str]:
    """
    Extract all chart IDs from dashboard widgets.
    Supports multiple widget formats including widgets stored in separate collection.
    """
    ids: Set[str] = set()
    
    # Check widgets from separate collection (passed as db_widgets)
    if db_widgets:
        for w in db_widgets:
            if not isinstance(w, dict):
                continue
            cid = w.get("chart_id") or w.get("chartId")
            if cid:
                ids.add(str(cid))
            # Check config
            config = w.get("config") or {}
            if isinstance(config, dict):
                cid2 = config.get("chart_id") or config.get("chartId")
                if cid2:
                    ids.add(str(cid2))
    
    # Check inline widgets array
    widgets = dashboard.get("widgets") or []
    for w in widgets:
        if isinstance(w, str):
            # It's a widget ID, already handled above via db_widgets
            continue
        if not isinstance(w, dict):
            continue
        cid = w.get("chart_id") or w.get("chartId") or w.get("chart")
        if cid:
            ids.add(str(cid))
        config = w.get("config") or {}
        if isinstance(config, dict):
            cid2 = config.get("chart_id") or config.get("chartId")
            if cid2:
                ids.add(str(cid2))
    
    # Check layout array (for react-grid-layout style)
    layout = dashboard.get("layout") or []
    for item in layout:
        if not isinstance(item, dict):
            continue
        cid = item.get("chart_id") or item.get("chartId")
        if cid:
            ids.add(str(cid))
        widget_config = item.get("config") or {}
        chart_id = widget_config.get("chart_id") or widget_config.get("chartId")
        if chart_id:
            ids.add(str(chart_id))
    
    return ids


@router.get("/charts/{chart_id}/data")
async def get_public_chart_data(
    request: Request,
    chart_id: str,
    public_id: str = Query(..., description="Public dashboard ID"),
    password: Optional[str] = Query(None, description="Dashboard password if protected")
):
    """
    Get chart data for public dashboard view.
    Validates that:
    1. Dashboard is public and accessible
    2. Chart belongs to that dashboard
    """
    db = request.app.state.db
    
    # 1. Find and validate public dashboard
    dashboard = await db.dashboards.find_one(
        {"public_id": public_id, "is_public": True},
        {"_id": 0}
    )
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Public dashboard not found")
    
    # 2. Check expiry
    from datetime import datetime, timezone
    if dashboard.get("share_expires_at"):
        try:
            expires_at = datetime.fromisoformat(
                dashboard["share_expires_at"].replace('Z', '+00:00')
            )
            if datetime.now(timezone.utc) > expires_at:
                raise HTTPException(status_code=410, detail="Share link has expired")
        except ValueError:
            pass
    
    # 3. Check password if required
    if dashboard.get("password_protected"):
        if not password:
            raise HTTPException(
                status_code=401, 
                detail="Password required",
                headers={"X-Password-Required": "true"}
            )
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if password_hash != dashboard.get("password_hash"):
            raise HTTPException(status_code=401, detail="Invalid password")
    
    # 4. Validate chart belongs to this dashboard
    allowed_chart_ids = extract_chart_ids_from_dashboard(dashboard)
    if str(chart_id) not in allowed_chart_ids:
        raise HTTPException(
            status_code=403, 
            detail="Chart not available in this public dashboard"
        )
    
    # 5. Get chart
    chart = await db.charts.find_one({"id": chart_id}, {"_id": 0})
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    # 6. Get chart data
    data = await db.dataset_data.find(
        {"dataset_id": chart.get("dataset_id")},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).to_list(10000)
    
    if not data:
        return {"chart": chart, "data": []}
    
    # 7. Aggregate data based on chart config
    df = pd.DataFrame(data)
    config = chart.get("config", {})
    x_field = config.get("x_field")
    y_field = config.get("y_field")
    
    chart_data = []
    if x_field and x_field in df.columns:
        if y_field and y_field in df.columns:
            grouped = df.groupby(x_field)[y_field].sum().reset_index()
            grouped.columns = ["name", "value"]
        else:
            grouped = df.groupby(x_field).size().reset_index()
            grouped.columns = ["name", "value"]
        chart_data = grouped.sort_values('value', ascending=False).to_dict(orient='records')
    
    # Return sanitized response (no sensitive fields)
    return {
        "chart": {
            "id": chart["id"],
            "name": chart.get("name"),
            "type": chart.get("type"),
            "config": {
                "x_field": config.get("x_field"),
                "y_field": config.get("y_field"),
                "colors": config.get("colors"),
                "annotations": config.get("annotations", [])
            }
        },
        "data": chart_data
    }


@router.get("/dashboards/{public_id}/charts")
async def list_public_dashboard_charts(
    request: Request,
    public_id: str,
    password: Optional[str] = Query(None, description="Dashboard password if protected")
):
    """
    List all charts available in a public dashboard.
    Returns chart metadata and data for rendering.
    """
    db = request.app.state.db
    
    # 1. Validate public dashboard access
    dashboard = await db.dashboards.find_one(
        {"public_id": public_id, "is_public": True},
        {"_id": 0}
    )
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Public dashboard not found")
    
    # Check expiry
    from datetime import datetime, timezone
    if dashboard.get("share_expires_at"):
        try:
            expires_at = datetime.fromisoformat(
                dashboard["share_expires_at"].replace('Z', '+00:00')
            )
            if datetime.now(timezone.utc) > expires_at:
                raise HTTPException(status_code=410, detail="Share link has expired")
        except ValueError:
            pass
    
    # Check password
    if dashboard.get("password_protected"):
        if not password:
            raise HTTPException(
                status_code=401, 
                detail="Password required",
                headers={"X-Password-Required": "true"}
            )
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if password_hash != dashboard.get("password_hash"):
            raise HTTPException(status_code=401, detail="Invalid password")
    
    # 2. Get widgets from widgets collection if dashboard has widget IDs
    db_widgets = []
    widget_ids = dashboard.get("widgets", [])
    if widget_ids and isinstance(widget_ids[0], str):
        # Widget IDs stored, fetch from widgets collection
        db_widgets = await db.widgets.find(
            {"dashboard_id": dashboard.get("id")},
            {"_id": 0}
        ).to_list(100)
    
    # 3. Get all chart IDs from dashboard
    chart_ids = extract_chart_ids_from_dashboard(dashboard, db_widgets)
    
    if not chart_ids:
        return {"charts": []}
    
    # 4. Fetch all charts with their data
    charts_with_data = []
    
    for chart_id in chart_ids:
        chart = await db.charts.find_one({"id": chart_id}, {"_id": 0})
        if not chart:
            continue
        
        # Get data
        data = await db.dataset_data.find(
            {"dataset_id": chart.get("dataset_id")},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(10000)
        
        chart_data = []
        if data:
            df = pd.DataFrame(data)
            config = chart.get("config", {})
            x_field = config.get("x_field")
            y_field = config.get("y_field")
            
            if x_field and x_field in df.columns:
                if y_field and y_field in df.columns:
                    grouped = df.groupby(x_field)[y_field].sum().reset_index()
                    grouped.columns = ["name", "value"]
                else:
                    grouped = df.groupby(x_field).size().reset_index()
                    grouped.columns = ["name", "value"]
                chart_data = grouped.sort_values('value', ascending=False).to_dict(orient='records')
        
        charts_with_data.append({
            "id": chart["id"],
            "name": chart.get("name"),
            "type": chart.get("type"),
            "config": {
                "x_field": chart.get("config", {}).get("x_field"),
                "y_field": chart.get("config", {}).get("y_field"),
                "colors": chart.get("config", {}).get("colors"),
            },
            "data": chart_data
        })
    
    return {"charts": charts_with_data}
