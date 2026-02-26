"""AI router"""
from fastapi import APIRouter, HTTPException, Request

from services.ai_service import AIService
from models.ai import AIQueryRequest, HelpAssistantRequest
from core.security import get_user_from_token

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/query")
async def ai_query(request: AIQueryRequest, req: Request):
    """Query dataset using natural language"""
    user = await get_user_from_token(req)
    
    result = await AIService.query_dataset(
        dataset_id=request.dataset_id,
        query=request.query,
        user=user,
        context=request.context
    )
    
    if "error" in result and result["error"]:
        raise HTTPException(status_code=403, detail=result["error"])
    
    return result


@router.post("/suggest-charts")
async def suggest_charts(dataset_id: str, request: Request):
    """Get AI-powered chart suggestions"""
    user = await get_user_from_token(request)
    
    result = await AIService.suggest_charts(
        dataset_id=dataset_id,
        user=user
    )
    
    if "error" in result and result["error"]:
        raise HTTPException(status_code=403, detail=result["error"])
    
    return result
