"""Application configuration and environment variables"""
import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')


class Settings(BaseModel):
    """Application settings loaded from environment"""
    
    # Database
    MONGO_URL: str = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    DB_NAME: str = os.environ.get('DB_NAME', 'dataviz_studio')
    
    # Security
    JWT_SECRET: str = os.environ.get('JWT_SECRET', 'dataviz-secret-key-change-in-production')
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # AI Integration
    EMERGENT_API_KEY: Optional[str] = os.environ.get('EMERGENT_API_KEY')
    
    # Email (Resend)
    RESEND_API_KEY: Optional[str] = os.environ.get('RESEND_API_KEY')
    
    # Cache
    REDIS_URL: str = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    CACHE_TTL: int = int(os.environ.get('CACHE_TTL', '300'))
    
    # App Info
    APP_NAME: str = "DataViz Studio"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    class Config:
        env_file = ".env"


# Tier limits configuration
TIER_LIMITS = {
    "free": {
        "ai_summary_limit": 0,
        "ai_chart_suggest_limit": 0,
        "custom_themes_limit": 3,
        "has_ai_features": False
    },
    "starter": {
        "ai_summary_limit": 0,
        "ai_chart_suggest_limit": 0,
        "custom_themes_limit": 3,
        "has_ai_features": False
    },
    "professional": {
        "ai_summary_limit": 50,
        "ai_chart_suggest_limit": 100,
        "custom_themes_limit": 10,
        "has_ai_features": True
    },
    "enterprise": {
        "ai_summary_limit": -1,  # unlimited
        "ai_chart_suggest_limit": -1,  # unlimited
        "custom_themes_limit": -1,  # unlimited
        "has_ai_features": True
    }
}

# Create singleton settings instance
settings = Settings()
