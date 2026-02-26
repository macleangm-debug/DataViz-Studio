"""Database connection models"""
from pydantic import BaseModel
from typing import Optional


class DatabaseConnectionCreate(BaseModel):
    name: str
    type: str  # mongodb, postgresql, mysql
    host: str
    port: int
    database: str
    username: str
    password: str
    org_id: Optional[str] = None
