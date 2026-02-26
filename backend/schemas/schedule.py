"""Schedule models"""
from pydantic import BaseModel
from typing import Optional


class ScheduleConfig(BaseModel):
    interval_type: str  # hourly, daily, weekly, custom
    interval_hours: int = 1
    cron_expression: Optional[str] = None
    enabled: bool = True
