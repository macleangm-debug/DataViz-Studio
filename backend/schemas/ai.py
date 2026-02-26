"""AI models"""
from pydantic import BaseModel
from typing import Optional, List


class AIQueryRequest(BaseModel):
    dataset_id: str
    query: str
    context: Optional[str] = None


class HelpAssistantRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    context: Optional[str] = None
