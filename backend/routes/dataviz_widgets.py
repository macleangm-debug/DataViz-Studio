"""DataViz Studio - Widget Routes"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import pandas as pd

router = APIRouter(prefix="/widgets", tags=["Widgets"])


class WidgetCreate(BaseModel):
    dashboard_id: str
    type: str  # stat, chart, table, text
    title: str
    config: Dict[str, Any] = {}
    position: Dict[str, Any] = {}  # x, y, w, h for grid layout
    dataset_id: Optional[str] = None


@router.post("")
async def create_widget(widget: WidgetCreate, request: Request):
    """Create a new widget"""
    db = request.app.state.db
    
    widget_id = str(uuid.uuid4())
    widget_doc = {
        "id": widget_id,
        "dashboard_id": widget.dashboard_id,
        "type": widget.type,
        "title": widget.title,
        "config": widget.config,
        "position": widget.position or {"x": 0, "y": 0, "w": 3, "h": 2},
        "dataset_id": widget.dataset_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.widgets.insert_one(widget_doc)
    
    # Add to dashboard's widget list
    await db.dashboards.update_one(
        {"id": widget.dashboard_id},
        {"$push": {"widgets": widget_id}}
    )
    
    return {"id": widget_id, "type": widget.type, "title": widget.title}


@router.get("/{widget_id}/data")
async def get_widget_data(widget_id: str, request: Request):
    """Get data for a specific widget"""
    db = request.app.state.db
    
    widget = await db.widgets.find_one({"id": widget_id}, {"_id": 0})
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    # If no dataset linked, return sample data
    if not widget.get("dataset_id"):
        sample_data = _get_sample_data_for_widget(widget["type"], widget.get("config", {}))
        return {"widget_id": widget_id, "data": sample_data}
    
    # Get actual data from dataset
    data = await db.dataset_data.find(
        {"dataset_id": widget["dataset_id"]},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).to_list(1000)
    
    # Process data based on widget type
    processed_data = _process_widget_data(widget["type"], widget.get("config", {}), data)
    
    return {"widget_id": widget_id, "data": processed_data}


def _get_sample_data_for_widget(widget_type: str, config: dict) -> dict:
    """Generate sample data for widgets without datasets"""
    if widget_type == "stat":
        return {
            "value": 12345,
            "change": 8.5,
            "changeType": "increase"
        }
    elif widget_type == "gauge":
        return {
            "value": config.get("target", 75),
            "min": config.get("min", 0),
            "max": config.get("max", 100)
        }
    elif widget_type == "chart":
        chart_type = config.get("chart_type", "bar")
        if chart_type in ["pie", "donut"]:
            return {
                "labels": ["Category A", "Category B", "Category C", "Other"],
                "values": [35, 25, 20, 20]
            }
        else:
            return {
                "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                "datasets": [{
                    "label": "Sales",
                    "data": [65, 59, 80, 81, 56, 72]
                }]
            }
    elif widget_type == "table":
        return {
            "columns": ["Name", "Value", "Status"],
            "rows": [
                ["Item 1", 100, "Active"],
                ["Item 2", 200, "Pending"],
                ["Item 3", 150, "Active"],
                ["Item 4", 300, "Completed"],
                ["Item 5", 250, "Active"]
            ]
        }
    elif widget_type == "funnel":
        return {
            "stages": config.get("stages", ["Leads", "Qualified", "Proposal", "Closed"]),
            "values": [1000, 750, 400, 200]
        }
    elif widget_type == "heatmap":
        return {
            "x_labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "y_labels": ["9AM", "12PM", "3PM", "6PM", "9PM"],
            "values": [
                [10, 20, 30, 15, 25, 5, 8],
                [35, 45, 50, 40, 30, 15, 20],
                [25, 35, 40, 45, 35, 10, 15],
                [40, 50, 55, 60, 45, 20, 25],
                [15, 25, 30, 20, 15, 8, 10]
            ]
        }
    elif widget_type == "progress":
        return {
            "targets": config.get("targets", [
                {"name": "Goal A", "current": 75, "target": 100},
                {"name": "Goal B", "current": 50, "target": 100}
            ])
        }
    elif widget_type == "scorecard":
        return {
            "value": 1250000,
            "comparison": "last_month",
            "change": 12.5,
            "changeType": "increase",
            "target": config.get("target")
        }
    elif widget_type == "sparkline":
        return {
            "values": [23, 25, 22, 28, 30, 27, 32, 35, 33, 38],
            "trend": "up"
        }
    elif widget_type == "list":
        return {
            "items": [
                {"name": "Item 1", "value": 500},
                {"name": "Item 2", "value": 420},
                {"name": "Item 3", "value": 380},
                {"name": "Item 4", "value": 350},
                {"name": "Item 5", "value": 300}
            ]
        }
    elif widget_type == "timeline":
        return {
            "events": [
                {"date": "2026-02-20", "title": "Milestone 1", "status": "completed"},
                {"date": "2026-03-15", "title": "Milestone 2", "status": "in_progress"},
                {"date": "2026-04-01", "title": "Milestone 3", "status": "upcoming"},
                {"date": "2026-05-01", "title": "Milestone 4", "status": "upcoming"}
            ]
        }
    elif widget_type == "map":
        return {
            "regions": [
                {"name": "North", "value": 45},
                {"name": "South", "value": 30},
                {"name": "East", "value": 15},
                {"name": "West", "value": 10}
            ]
        }
    else:
        return {"message": f"No sample data for widget type: {widget_type}"}


def _process_widget_data(widget_type: str, config: dict, raw_data: list) -> dict:
    """Process raw data for specific widget types"""
    if not raw_data:
        return _get_sample_data_for_widget(widget_type, config)
    
    df = pd.DataFrame(raw_data)
    
    if widget_type == "stat":
        # Get aggregation from config
        agg = config.get("aggregation", "count")
        col = config.get("column")
        
        if agg == "count":
            value = len(df)
        elif agg == "sum" and col and col in df.columns:
            value = float(df[col].sum())
        elif agg == "mean" and col and col in df.columns:
            value = float(df[col].mean())
        else:
            value = len(df)
        
        return {
            "value": value,
            "change": 5.2,
            "changeType": "increase"
        }
    
    elif widget_type == "chart":
        chart_type = config.get("chart_type", "bar")
        x_col = config.get("x_column") or (df.columns[0] if len(df.columns) > 0 else None)
        y_col = config.get("y_column") or (df.columns[1] if len(df.columns) > 1 else None)
        
        if not x_col or not y_col:
            return _get_sample_data_for_widget(widget_type, config)
        
        if chart_type in ["pie", "donut"]:
            grouped = df.groupby(x_col)[y_col].sum().head(10)
            return {
                "labels": grouped.index.tolist(),
                "values": grouped.values.tolist()
            }
        else:
            grouped = df.groupby(x_col)[y_col].sum()
            return {
                "labels": grouped.index.tolist(),
                "datasets": [{
                    "label": y_col,
                    "data": grouped.values.tolist()
                }]
            }
    
    elif widget_type == "table":
        columns = df.columns.tolist()[:config.get("max_columns", 5)]
        rows = df[columns].head(config.get("limit", 10)).values.tolist()
        return {
            "columns": columns,
            "rows": rows
        }
    
    # Default fallback
    return _get_sample_data_for_widget(widget_type, config)


@router.put("/{widget_id}")
async def update_widget(widget_id: str, widget: WidgetCreate, request: Request):
    """Update a widget"""
    db = request.app.state.db
    
    await db.widgets.update_one(
        {"id": widget_id},
        {"$set": {
            "type": widget.type,
            "title": widget.title,
            "config": widget.config,
            "position": widget.position,
            "dataset_id": widget.dataset_id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"status": "updated"}


@router.delete("/{widget_id}")
async def delete_widget(widget_id: str, request: Request):
    """Delete a widget"""
    db = request.app.state.db
    
    # Get widget to find dashboard
    widget = await db.widgets.find_one({"id": widget_id})
    if widget:
        # Remove from dashboard's widget list
        await db.dashboards.update_one(
            {"id": widget["dashboard_id"]},
            {"$pull": {"widgets": widget_id}}
        )
    
    await db.widgets.delete_one({"id": widget_id})
    return {"status": "deleted"}
