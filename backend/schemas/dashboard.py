"""Dashboard models"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class DashboardCreate(BaseModel):
    name: str
    description: str = ""
    layout: list = []
    org_id: Optional[str] = None
    tags: List[str] = []
    preview_image: Optional[str] = None
    is_favorite: bool = False


class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    layout: Optional[list] = None
    tags: Optional[List[str]] = None
    preview_image: Optional[str] = None
    is_favorite: Optional[bool] = None


class DashboardLayoutUpdate(BaseModel):
    layout: list


class WidgetCreate(BaseModel):
    dashboard_id: str
    type: str  # chart, metric, text, table
    config: dict = {}
    position: dict = {}
