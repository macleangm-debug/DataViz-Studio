"""
Redis Caching Utility for DataViz Studio
Provides caching for dashboards, charts, and query results
"""
import os
import json
import hashlib
import logging
from typing import Optional, Any, Callable
from functools import wraps
import redis.asyncio as aioredis
from datetime import timedelta

logger = logging.getLogger(__name__)

# Redis connection settings
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
CACHE_ENABLED = os.environ.get("CACHE_ENABLED", "true").lower() == "true"

# Cache TTL settings (in seconds)
CACHE_TTL = {
    "dashboard": 300,      # 5 minutes for dashboard data
    "chart": 180,          # 3 minutes for chart data
    "dataset_meta": 600,   # 10 minutes for dataset metadata
    "query_result": 120,   # 2 minutes for query results
    "user_session": 3600,  # 1 hour for user sessions
    "aggregation": 300,    # 5 minutes for aggregated data
    "template": 1800,      # 30 minutes for templates
}

# Redis connection pool
_redis_pool: Optional[aioredis.Redis] = None


async def get_redis() -> Optional[aioredis.Redis]:
    """Get Redis connection from pool"""
    global _redis_pool
    
    if not CACHE_ENABLED:
        return None
    
    if _redis_pool is None:
        try:
            _redis_pool = aioredis.from_url(
                REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=20
            )
            # Test connection
            await _redis_pool.ping()
            logger.info("Redis cache connected successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed, caching disabled: {e}")
            return None
    
    return _redis_pool


async def close_redis():
    """Close Redis connection pool"""
    global _redis_pool
    if _redis_pool:
        await _redis_pool.close()
        _redis_pool = None
        logger.info("Redis connection closed")


def generate_cache_key(*args, **kwargs) -> str:
    """Generate a unique cache key from arguments"""
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()


class CacheManager:
    """Cache manager for handling Redis operations"""
    
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """Get value from cache"""
        redis = await get_redis()
        if not redis:
            return None
        
        try:
            value = await redis.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.warning(f"Cache get error for key {key}: {e}")
        
        return None
    
    @staticmethod
    async def set(key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with TTL"""
        redis = await get_redis()
        if not redis:
            return False
        
        try:
            await redis.setex(key, ttl, json.dumps(value, default=str))
            return True
        except Exception as e:
            logger.warning(f"Cache set error for key {key}: {e}")
            return False
    
    @staticmethod
    async def delete(key: str) -> bool:
        """Delete key from cache"""
        redis = await get_redis()
        if not redis:
            return False
        
        try:
            await redis.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Cache delete error for key {key}: {e}")
            return False
    
    @staticmethod
    async def delete_pattern(pattern: str) -> int:
        """Delete all keys matching a pattern"""
        redis = await get_redis()
        if not redis:
            return 0
        
        try:
            keys = []
            async for key in redis.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                await redis.delete(*keys)
            return len(keys)
        except Exception as e:
            logger.warning(f"Cache delete pattern error for {pattern}: {e}")
            return 0
    
    @staticmethod
    async def invalidate_dashboard(dashboard_id: str):
        """Invalidate all cache related to a dashboard"""
        await CacheManager.delete_pattern(f"dashboard:{dashboard_id}:*")
        await CacheManager.delete(f"dashboard:{dashboard_id}")
    
    @staticmethod
    async def invalidate_dataset(dataset_id: str):
        """Invalidate all cache related to a dataset"""
        await CacheManager.delete_pattern(f"dataset:{dataset_id}:*")
        await CacheManager.delete(f"dataset:{dataset_id}")
        # Also invalidate charts/dashboards using this dataset
        await CacheManager.delete_pattern(f"chart:*:dataset:{dataset_id}:*")
    
    @staticmethod
    async def invalidate_user_cache(user_id: str):
        """Invalidate all cache related to a user"""
        await CacheManager.delete_pattern(f"user:{user_id}:*")
    
    @staticmethod
    async def get_stats() -> dict:
        """Get cache statistics"""
        redis = await get_redis()
        if not redis:
            return {"enabled": False, "connected": False}
        
        try:
            info = await redis.info("stats")
            memory = await redis.info("memory")
            return {
                "enabled": True,
                "connected": True,
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "memory_used": memory.get("used_memory_human", "N/A"),
                "total_keys": await redis.dbsize()
            }
        except Exception as e:
            return {"enabled": True, "connected": False, "error": str(e)}


def cached(cache_type: str = "query_result", key_prefix: str = ""):
    """Decorator for caching async function results"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            func_key = f"{key_prefix}:{func.__name__}" if key_prefix else func.__name__
            cache_key = f"{func_key}:{generate_cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_value = await CacheManager.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_value
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            ttl = CACHE_TTL.get(cache_type, 300)
            await CacheManager.set(cache_key, result, ttl)
            logger.debug(f"Cache miss for {cache_key}, stored with TTL {ttl}s")
            
            return result
        return wrapper
    return decorator


# Specific cache helpers for common operations
async def cache_dashboard_data(dashboard_id: str, data: dict, ttl: int = None):
    """Cache dashboard data"""
    key = f"dashboard:{dashboard_id}"
    await CacheManager.set(key, data, ttl or CACHE_TTL["dashboard"])


async def get_cached_dashboard(dashboard_id: str) -> Optional[dict]:
    """Get cached dashboard data"""
    return await CacheManager.get(f"dashboard:{dashboard_id}")


async def cache_chart_data(dashboard_id: str, widget_id: str, data: dict, ttl: int = None):
    """Cache chart/widget data"""
    key = f"dashboard:{dashboard_id}:widget:{widget_id}"
    await CacheManager.set(key, data, ttl or CACHE_TTL["chart"])


async def get_cached_chart(dashboard_id: str, widget_id: str) -> Optional[dict]:
    """Get cached chart/widget data"""
    return await CacheManager.get(f"dashboard:{dashboard_id}:widget:{widget_id}")


async def cache_query_result(query_hash: str, result: Any, ttl: int = None):
    """Cache a query result"""
    key = f"query:{query_hash}"
    await CacheManager.set(key, result, ttl or CACHE_TTL["query_result"])


async def get_cached_query(query_hash: str) -> Optional[Any]:
    """Get cached query result"""
    return await CacheManager.get(f"query:{query_hash}")


async def cache_aggregation(dataset_id: str, agg_type: str, params: dict, result: Any):
    """Cache aggregation result"""
    params_hash = generate_cache_key(params)
    key = f"dataset:{dataset_id}:agg:{agg_type}:{params_hash}"
    await CacheManager.set(key, result, CACHE_TTL["aggregation"])


async def get_cached_aggregation(dataset_id: str, agg_type: str, params: dict) -> Optional[Any]:
    """Get cached aggregation result"""
    params_hash = generate_cache_key(params)
    key = f"dataset:{dataset_id}:agg:{agg_type}:{params_hash}"
    return await CacheManager.get(key)
