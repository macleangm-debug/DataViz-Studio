"""Dataset and data source models"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class DataSourceCreate(BaseModel):
    name: str
    type: str  # csv, excel, json, api
    config: dict = {}
    org_id: Optional[str] = None


class DatasetCreate(BaseModel):
    name: str
    source_id: str
    columns: list = []
    row_count: int = 0


class TransformStep(BaseModel):
    type: str  # filter, rename, calculate, fill_missing, drop_column, sort, change_type
    config: Dict[str, Any]
    enabled: bool = True


class TransformRequest(BaseModel):
    steps: List[TransformStep]
