# Routers module exports
from .auth import router as auth_router
from .datasets import router as datasets_router
from .charts import router as charts_router
from .dashboards import router as dashboards_router
from .ai import router as ai_router
from .reports import router as reports_router
from .connections import router as connections_router
from .health import router as health_router

__all__ = [
    "auth_router",
    "datasets_router",
    "charts_router",
    "dashboards_router",
    "ai_router",
    "reports_router",
    "connections_router",
    "health_router"
]
