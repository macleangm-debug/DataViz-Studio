"""Chart models"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class ChartCreate(BaseModel):
    name: str
    type: str  # bar, line, pie, area, scatter, radar, funnel, gauge, heatmap
    dataset_id: str
    config: dict = {}


class DrillDownRequest(BaseModel):
    drill_path: List[Dict[str, str]] = []
    field: str
    value: str


class ChartExportData(BaseModel):
    name: str
    type: str
    image_base64: str  # Base64 encoded PNG image of the chart
    data: List[Dict[str, Any]] = []
