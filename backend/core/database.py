"""Database connections - MongoDB, PostgreSQL, MySQL"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import asyncpg
import aiomysql
import logging

from .config import settings

logger = logging.getLogger(__name__)

# MongoDB connection
client: AsyncIOMotorClient = AsyncIOMotorClient(
    settings.MONGO_URL,
    minPoolSize=5,
    maxPoolSize=50,
    maxIdleTimeMS=30000,
    serverSelectionTimeoutMS=5000
)
db: AsyncIOMotorDatabase = client[settings.DB_NAME]


def get_database() -> AsyncIOMotorDatabase:
    """Get the MongoDB database instance"""
    return db


# PostgreSQL connection helpers
async def create_postgres_pool(host: str, port: int, database: str, user: str, password: str):
    """Create a PostgreSQL connection pool"""
    try:
        pool = await asyncpg.create_pool(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            min_size=1,
            max_size=10
        )
        return pool
    except Exception as e:
        logger.error(f"PostgreSQL connection failed: {str(e)}")
        raise


# MySQL connection helpers
async def create_mysql_pool(host: str, port: int, database: str, user: str, password: str):
    """Create a MySQL connection pool"""
    try:
        pool = await aiomysql.create_pool(
            host=host,
            port=port,
            db=database,
            user=user,
            password=password,
            minsize=1,
            maxsize=10,
            autocommit=True
        )
        return pool
    except Exception as e:
        logger.error(f"MySQL connection failed: {str(e)}")
        raise


async def close_database():
    """Close database connections on shutdown"""
    client.close()
    logger.info("MongoDB connection closed")
