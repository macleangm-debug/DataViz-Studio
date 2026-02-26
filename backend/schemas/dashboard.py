"""Dashboard models"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class DashboardCreate(BaseModel):
    name: str
    description: str = ""
    layout: list = []
    org_id: Optional[str] = None


class DashboardLayoutUpdate(BaseModel):
    layout: list


class WidgetCreate(BaseModel):
    dashboard_id: str
    type: str  # chart, metric, text, table
    config: dict = {}
    position: dict = {}
