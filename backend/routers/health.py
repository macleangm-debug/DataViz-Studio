"""Health and status router"""
from fastapi import APIRouter
from datetime import datetime, timezone

from core.database import db
from utils.cache import CacheManager

router = APIRouter(tags=["Health"])


@router.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "DataViz Studio API",
        "version": "2.0.0",
        "status": "operational"
    }


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check MongoDB
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # Check Redis cache
    cache_manager = CacheManager()
    cache_status = {
        "enabled": cache_manager.enabled,
        "connected": cache_manager.redis is not None
    }
    if not cache_manager.redis:
        try:
            await cache_manager.connect()
            cache_status["connected"] = cache_manager.redis is not None
        except Exception as e:
            cache_status["error"] = str(e)
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "cache": cache_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics"""
    cache_manager = CacheManager()
    stats = await cache_manager.get_stats()
    return stats
