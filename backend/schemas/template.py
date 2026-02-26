"""Template models"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class TemplateCreate(BaseModel):
    name: str
    description: str = ""
    category: str = "general"
    layout: List[Dict[str, Any]] = []
    preview_image: Optional[str] = None
    is_public: bool = False


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    layout: Optional[List[Dict[str, Any]]] = None
    preview_image: Optional[str] = None
    is_public: Optional[bool] = None
