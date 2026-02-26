"""Theme models"""
from pydantic import BaseModel
from typing import List, Optional


class CustomChartTheme(BaseModel):
    name: str
    colors: List[str]
    background_color: str = "#ffffff"
    text_color: str = "#333333"
    grid_color: str = "#eeeeee"
