"""
DataViz Studio - Main Application Entry Point (Refactored)

This is the new modular entry point. For backward compatibility,
the original server.py is still operational. This file demonstrates
the target architecture.

Usage:
    uvicorn main:app --reload --port 8001

Structure:
    /app/backend/
        main.py          <- You are here (new entry point)
        server.py        <- Legacy monolith (still works)
        core/            <- Config, DB, Security, Scheduler
        models/          <- Pydantic schemas
        routers/         <- FastAPI routes (thin)
        services/        <- Business logic (fat)
        repositories/    <- Data access (future)
        utils/           <- Helpers
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Core imports
from core.config import settings
from core.database import db, close_database
from core.scheduler import init_scheduler, shutdown_scheduler

# Router imports
from routers import (
    auth_router,
    datasets_router,
    charts_router,
    dashboards_router,
    ai_router,
    reports_router,
    connections_router,
    health_router,
    public_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Application factory"""
    
    app = FastAPI(
        title=settings.APP_NAME,
        description="Interactive Analytics & Visualization Platform",
        version=settings.APP_VERSION,
        docs_url="/api/docs",
        redoc_url="/api/redoc"
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Store db in app state
    app.state.db = db
    
    # Include routers with /api prefix
    app.include_router(health_router, prefix="/api")
    app.include_router(auth_router, prefix="/api")
    app.include_router(datasets_router, prefix="/api")
    app.include_router(charts_router, prefix="/api")
    app.include_router(dashboards_router, prefix="/api")
    app.include_router(ai_router, prefix="/api")
    app.include_router(reports_router, prefix="/api")
    app.include_router(connections_router, prefix="/api")
    app.include_router(public_router, prefix="/api")
    
    # Startup event
    @app.on_event("startup")
    async def startup():
        logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
        init_scheduler()
        logger.info("Scheduler initialized")
    
    # Shutdown event
    @app.on_event("shutdown")
    async def shutdown():
        logger.info("Shutting down...")
        shutdown_scheduler()
        await close_database()
    
    return app


# Create the app instance
# Note: For now, the original server.py is still the main entry point
# This is the target architecture after full migration
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
