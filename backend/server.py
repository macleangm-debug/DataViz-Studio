"""DataViz Studio - Main FastAPI Application"""
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Request, BackgroundTasks
from fastapi.responses import JSONResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import logging
import uuid
import json
import pandas as pd
import io
import base64
from datetime import datetime, timezone, timedelta
from pathlib import Path
import asyncio

# Database drivers
import asyncpg
import aiomysql

# Scheduler for data refresh
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

# PDF generation
from fpdf import FPDF
import math

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(
    mongo_url,
    minPoolSize=5,
    maxPoolSize=50,
    maxIdleTimeMS=30000,
    serverSelectionTimeoutMS=5000
)
db = client[os.environ.get('DB_NAME')]

# Create the main app
app = FastAPI(
    title="DataViz Studio API",
    description="Interactive Analytics & Visualization Platform",
    version="1.0.0"
)

# Store db in app state for route access
app.state.db = db

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# Models
# =============================================================================

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class DataSourceCreate(BaseModel):
    name: str
    type: str  # file, database, api
    config: Dict[str, Any] = {}
    org_id: Optional[str] = None

class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    source_id: Optional[str] = None
    org_id: Optional[str] = None

class DashboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    org_id: Optional[str] = None
    widgets: List[Dict[str, Any]] = []

class ChartCreate(BaseModel):
    name: str
    type: str  # bar, line, pie, scatter, etc.
    dataset_id: str
    config: Dict[str, Any] = {}
    org_id: Optional[str] = None

class AIQueryRequest(BaseModel):
    query: str
    dataset_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class DatabaseConnectionCreate(BaseModel):
    name: str
    db_type: str  # mongodb, postgresql, mysql
    host: str
    port: int
    database: str
    username: Optional[str] = None
    password: Optional[str] = None
    org_id: Optional[str] = None

class WidgetCreate(BaseModel):
    dashboard_id: str
    type: str  # stat, chart, table, text
    title: str
    config: Dict[str, Any] = {}
    position: Dict[str, Any] = {}  # x, y, w, h for grid layout
    dataset_id: Optional[str] = None

class DashboardLayoutUpdate(BaseModel):
    widgets: List[Dict[str, Any]]

class ScheduleConfig(BaseModel):
    conn_id: str
    interval_type: str  # hourly, daily, weekly, custom
    interval_value: int = 1  # e.g., every 2 hours
    custom_cron: Optional[str] = None  # for custom schedules
    enabled: bool = True

class DrillDownRequest(BaseModel):
    chart_id: str
    filter_field: str
    filter_value: str
    drill_to_field: Optional[str] = None

class ReportSection(BaseModel):
    id: str
    type: str  # "intro", "methodology", "chart", "conclusion", "custom"
    title: Optional[str] = None
    content: Optional[str] = None  # For text sections
    chart_id: Optional[str] = None  # For chart sections
    position: Optional[dict] = None  # {x, y, w, h} for drag-drop layout

class ReportLayout(BaseModel):
    columns: int = 2  # 1, 2, or 3 column layout
    sections: List[ReportSection] = []

class ReportExportRequest(BaseModel):
    dashboard_id: Optional[str] = None
    chart_ids: Optional[List[str]] = None
    include_data_tables: bool = True
    title: Optional[str] = None
    subtitle: Optional[str] = None
    company_name: Optional[str] = None
    report_date: Optional[str] = None
    # Theme settings
    theme: Optional[str] = "blue_coral"  # blue_coral, purple_teal, green_orange, slate_amber, custom
    header_color: Optional[str] = None  # For custom theme
    accent_color: Optional[str] = None  # For custom theme
    # Section toggles
    include_summary_cards: bool = True
    include_intro: bool = True
    include_methodology: bool = False
    include_conclusions: bool = True
    # Editable content
    intro_text: Optional[str] = None
    methodology_text: Optional[str] = None
    conclusions_text: Optional[str] = None
    # Layout
    layout: Optional[ReportLayout] = None
    layout_style: str = "auto"  # auto, single_column, two_column, grid


# Preset color themes
REPORT_THEMES = {
    "blue_coral": {"primary": "#3B82F6", "accent": "#EF4444", "name": "Blue & Coral"},
    "purple_teal": {"primary": "#8B5CF6", "accent": "#14B8A6", "name": "Purple & Teal"},
    "green_orange": {"primary": "#10B981", "accent": "#F59E0B", "name": "Green & Orange"},
    "slate_amber": {"primary": "#475569", "accent": "#F59E0B", "name": "Slate & Amber"},
    "indigo_rose": {"primary": "#6366F1", "accent": "#F43F5E", "name": "Indigo & Rose"},
    "cyan_pink": {"primary": "#06B6D4", "accent": "#EC4899", "name": "Cyan & Pink"},
}


# =============================================================================
# Auth Routes
# =============================================================================

import bcrypt
import jwt

JWT_SECRET = os.environ.get('JWT_SECRET', 'dataviz-studio-secret')

@api_router.post("/auth/register")
async def register(user: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt())
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "name": user.name,
        "password_hash": hashed.decode(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "role": "user"
    }
    
    await db.users.insert_one(user_doc)
    
    # Create default org
    org_doc = {
        "id": str(uuid.uuid4()),
        "name": f"{user.name}'s Workspace",
        "slug": user.email.split('@')[0],
        "owner_id": user_doc["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.organizations.insert_one(org_doc)
    
    # Generate token
    token = jwt.encode(
        {"user_id": user_doc["id"], "email": user.email},
        JWT_SECRET,
        algorithm="HS256"
    )
    
    return {
        "token": token,
        "user": {"id": user_doc["id"], "email": user.email, "name": user.name},
        "organization": {"id": org_doc["id"], "name": org_doc["name"]}
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(credentials.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Get user's org
    org = await db.organizations.find_one({"owner_id": user["id"]})
    
    token = jwt.encode(
        {"user_id": user["id"], "email": user["email"]},
        JWT_SECRET,
        algorithm="HS256"
    )
    
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
        "organization": {"id": org["id"], "name": org["name"]} if org else None
    }

@api_router.get("/auth/me")
async def get_current_user(request: Request):
    """Get current user info"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        orgs = await db.organizations.find({"owner_id": user["id"]}).to_list(100)
        
        return {
            "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
            "organizations": [{"id": o["id"], "name": o["name"], "slug": o.get("slug", "")} for o in orgs]
        }
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================================
# Data Source Routes
# =============================================================================

@api_router.post("/data-sources")
async def create_data_source(source: DataSourceCreate):
    """Create a new data source connection"""
    source_doc = {
        "id": str(uuid.uuid4()),
        "name": source.name,
        "type": source.type,
        "config": source.config,
        "org_id": source.org_id,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.data_sources.insert_one(source_doc)
    return {"id": source_doc["id"], "name": source_doc["name"], "type": source_doc["type"]}

@api_router.get("/data-sources")
async def list_data_sources(org_id: Optional[str] = None):
    """List all data sources"""
    query = {"org_id": org_id} if org_id else {}
    sources = await db.data_sources.find(query, {"_id": 0}).to_list(100)
    return {"sources": sources}

@api_router.post("/data-sources/upload")
async def upload_file(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    org_id: Optional[str] = Form(None)
):
    """Upload a file (CSV, Excel, JSON) as a data source"""
    content = await file.read()
    filename = file.filename or "uploaded_file"
    
    # Parse file based on type
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
        elif filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    
    # Create data source
    source_id = str(uuid.uuid4())
    source_doc = {
        "id": source_id,
        "name": name or filename,
        "type": "file",
        "config": {"filename": filename, "rows": len(df), "columns": list(df.columns)},
        "org_id": org_id,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.data_sources.insert_one(source_doc)
    
    # Create dataset from file
    dataset_id = str(uuid.uuid4())
    
    # Convert data to records
    records = df.to_dict(orient='records')
    
    # Store dataset metadata
    dataset_doc = {
        "id": dataset_id,
        "name": name or filename,
        "source_id": source_id,
        "org_id": org_id,
        "row_count": len(records),
        "columns": [
            {"name": col, "type": str(df[col].dtype)} 
            for col in df.columns
        ],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.datasets.insert_one(dataset_doc)
    
    # Store data records
    for record in records:
        record["dataset_id"] = dataset_id
        record["_dataset_row_id"] = str(uuid.uuid4())
    
    if records:
        await db.dataset_data.insert_many(records)
    
    return {
        "source_id": source_id,
        "dataset_id": dataset_id,
        "name": name or filename,
        "rows": len(records),
        "columns": list(df.columns)
    }

@api_router.delete("/data-sources/{source_id}")
async def delete_data_source(source_id: str):
    """Delete a data source"""
    await db.data_sources.delete_one({"id": source_id})
    return {"status": "deleted"}

# =============================================================================
# Database Connection Routes (PostgreSQL, MySQL, MongoDB)
# =============================================================================

# Store encrypted passwords in memory (in production, use secrets manager)
_connection_passwords: Dict[str, str] = {}

@api_router.post("/database-connections")
async def create_database_connection(conn: DatabaseConnectionCreate):
    """Create a new database connection"""
    conn_id = str(uuid.uuid4())
    conn_doc = {
        "id": conn_id,
        "name": conn.name,
        "db_type": conn.db_type,
        "host": conn.host,
        "port": conn.port,
        "database": conn.database,
        "username": conn.username,
        "org_id": conn.org_id,
        "status": "pending",
        "last_sync": None,
        "schedule": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Store password securely (in production, use secrets manager like AWS Secrets Manager)
    if conn.password:
        conn_doc["has_password"] = True
        _connection_passwords[conn_id] = conn.password
    
    await db.database_connections.insert_one(conn_doc)
    return {"id": conn_doc["id"], "name": conn_doc["name"], "status": conn_doc["status"]}

@api_router.get("/database-connections")
async def list_database_connections(org_id: Optional[str] = None):
    """List all database connections"""
    query = {"org_id": org_id} if org_id else {}
    connections = await db.database_connections.find(query, {"_id": 0}).to_list(100)
    return {"connections": connections}

@api_router.get("/database-connections/{conn_id}")
async def get_database_connection(conn_id: str):
    """Get a single database connection"""
    conn = await db.database_connections.find_one({"id": conn_id}, {"_id": 0})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return conn

@api_router.post("/database-connections/{conn_id}/test")
async def test_database_connection(conn_id: str):
    """Test a database connection"""
    conn = await db.database_connections.find_one({"id": conn_id})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    password = _connection_passwords.get(conn_id, "")
    
    try:
        if conn["db_type"] == "mongodb":
            # MongoDB connection test
            if conn.get("username"):
                uri = f"mongodb://{conn['username']}:{password}@{conn['host']}:{conn['port']}/"
            else:
                uri = f"mongodb://{conn['host']}:{conn['port']}/"
            test_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
            await test_client.admin.command('ping')
            test_client.close()
            status = "connected"
            message = "MongoDB connection successful"
            
        elif conn["db_type"] == "postgresql":
            # PostgreSQL connection test
            pg_conn = await asyncpg.connect(
                host=conn["host"],
                port=conn["port"],
                database=conn["database"],
                user=conn.get("username"),
                password=password,
                timeout=10
            )
            version = await pg_conn.fetchval("SELECT version()")
            await pg_conn.close()
            status = "connected"
            message = f"PostgreSQL connection successful: {version[:50]}..."
            
        elif conn["db_type"] == "mysql":
            # MySQL connection test
            mysql_conn = await aiomysql.connect(
                host=conn["host"],
                port=conn["port"],
                db=conn["database"],
                user=conn.get("username", "root"),
                password=password,
                connect_timeout=10
            )
            async with mysql_conn.cursor() as cursor:
                await cursor.execute("SELECT VERSION()")
                version = await cursor.fetchone()
            mysql_conn.close()
            status = "connected"
            message = f"MySQL connection successful: {version[0]}"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported database type: {conn['db_type']}")
        
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"status": status, "last_tested": datetime.now(timezone.utc).isoformat()}}
        )
        return {"status": status, "message": message}
        
    except asyncpg.PostgresError as e:
        error_msg = f"PostgreSQL error: {str(e)}"
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"status": "error", "error": error_msg}}
        )
        return {"status": "error", "message": error_msg}
    except Exception as e:
        error_msg = str(e)
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"status": "error", "error": error_msg}}
        )
        return {"status": "error", "message": error_msg}

async def _sync_postgresql(conn: dict, password: str, table_name: Optional[str] = None) -> List[dict]:
    """Sync data from PostgreSQL database"""
    synced_datasets = []
    
    pg_conn = await asyncpg.connect(
        host=conn["host"],
        port=conn["port"],
        database=conn["database"],
        user=conn.get("username"),
        password=password,
        timeout=30
    )
    
    try:
        # Get table names
        if table_name:
            tables = [table_name]
        else:
            tables_result = await pg_conn.fetch("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                LIMIT 10
            """)
            tables = [row['table_name'] for row in tables_result]
        
        for tbl in tables[:5]:
            # Get column info
            columns_result = await pg_conn.fetch("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
            """, tbl)
            
            columns = [{"name": row['column_name'], "type": row['data_type']} for row in columns_result]
            
            # Fetch data
            data = await pg_conn.fetch(f'SELECT * FROM "{tbl}" LIMIT 10000')
            if not data:
                continue
            
            # Convert to list of dicts
            records = [dict(row) for row in data]
            
            # Create dataset
            dataset_id = str(uuid.uuid4())
            dataset_doc = {
                "id": dataset_id,
                "name": f"{conn['name']} - {tbl}",
                "source_id": conn["id"],
                "source_type": "postgresql",
                "org_id": conn.get("org_id"),
                "row_count": len(records),
                "columns": columns,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.datasets.insert_one(dataset_doc)
            
            # Store data records
            for record in records:
                # Convert non-serializable types
                for k, v in record.items():
                    if isinstance(v, (datetime,)):
                        record[k] = v.isoformat()
                    elif hasattr(v, '__str__') and not isinstance(v, (str, int, float, bool, list, dict, type(None))):
                        record[k] = str(v)
                record["dataset_id"] = dataset_id
                record["_dataset_row_id"] = str(uuid.uuid4())
            
            if records:
                await db.dataset_data.insert_many(records)
            
            synced_datasets.append({
                "dataset_id": dataset_id,
                "name": tbl,
                "rows": len(records)
            })
    finally:
        await pg_conn.close()
    
    return synced_datasets

async def _sync_mysql(conn: dict, password: str, table_name: Optional[str] = None) -> List[dict]:
    """Sync data from MySQL database"""
    synced_datasets = []
    
    mysql_conn = await aiomysql.connect(
        host=conn["host"],
        port=conn["port"],
        db=conn["database"],
        user=conn.get("username", "root"),
        password=password,
        connect_timeout=30
    )
    
    try:
        async with mysql_conn.cursor(aiomysql.DictCursor) as cursor:
            # Get table names
            if table_name:
                tables = [table_name]
            else:
                await cursor.execute("SHOW TABLES")
                tables_result = await cursor.fetchall()
                tables = [list(row.values())[0] for row in tables_result]
            
            for tbl in tables[:5]:
                # Get column info
                await cursor.execute(f"DESCRIBE `{tbl}`")
                columns_result = await cursor.fetchall()
                columns = [{"name": row['Field'], "type": row['Type']} for row in columns_result]
                
                # Fetch data
                await cursor.execute(f"SELECT * FROM `{tbl}` LIMIT 10000")
                records = await cursor.fetchall()
                
                if not records:
                    continue
                
                # Create dataset
                dataset_id = str(uuid.uuid4())
                dataset_doc = {
                    "id": dataset_id,
                    "name": f"{conn['name']} - {tbl}",
                    "source_id": conn["id"],
                    "source_type": "mysql",
                    "org_id": conn.get("org_id"),
                    "row_count": len(records),
                    "columns": columns,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.datasets.insert_one(dataset_doc)
                
                # Store data records
                for record in records:
                    # Convert non-serializable types
                    for k, v in record.items():
                        if isinstance(v, (datetime,)):
                            record[k] = v.isoformat()
                        elif isinstance(v, bytes):
                            record[k] = v.decode('utf-8', errors='replace')
                        elif hasattr(v, '__str__') and not isinstance(v, (str, int, float, bool, list, dict, type(None))):
                            record[k] = str(v)
                    record["dataset_id"] = dataset_id
                    record["_dataset_row_id"] = str(uuid.uuid4())
                
                if records:
                    await db.dataset_data.insert_many(records)
                
                synced_datasets.append({
                    "dataset_id": dataset_id,
                    "name": tbl,
                    "rows": len(records)
                })
    finally:
        mysql_conn.close()
    
    return synced_datasets

@api_router.post("/database-connections/{conn_id}/sync")
async def sync_database_connection(conn_id: str, table_name: Optional[str] = None):
    """Sync data from a database connection"""
    conn = await db.database_connections.find_one({"id": conn_id})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    password = _connection_passwords.get(conn_id, "")
    
    try:
        if conn["db_type"] == "mongodb":
            # MongoDB sync
            if conn.get("username"):
                uri = f"mongodb://{conn['username']}:{password}@{conn['host']}:{conn['port']}/"
            else:
                uri = f"mongodb://{conn['host']}:{conn['port']}/"
            sync_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
            sync_db = sync_client[conn["database"]]
            
            if table_name:
                collections = [table_name]
            else:
                collections = await sync_db.list_collection_names()
            
            synced_datasets = []
            for collection_name in collections[:5]:
                sample = await sync_db[collection_name].find_one()
                if not sample:
                    continue
                
                data = await sync_db[collection_name].find({}, {"_id": 0}).limit(10000).to_list(10000)
                if not data:
                    continue
                
                dataset_id = str(uuid.uuid4())
                columns = [{"name": k, "type": type(v).__name__} for k, v in sample.items() if k != "_id"]
                
                dataset_doc = {
                    "id": dataset_id,
                    "name": f"{conn['name']} - {collection_name}",
                    "source_id": conn_id,
                    "source_type": "mongodb",
                    "org_id": conn.get("org_id"),
                    "row_count": len(data),
                    "columns": columns,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.datasets.insert_one(dataset_doc)
                
                for record in data:
                    record["dataset_id"] = dataset_id
                    record["_dataset_row_id"] = str(uuid.uuid4())
                
                if data:
                    await db.dataset_data.insert_many(data)
                
                synced_datasets.append({
                    "dataset_id": dataset_id,
                    "name": collection_name,
                    "rows": len(data)
                })
            
            sync_client.close()
            
        elif conn["db_type"] == "postgresql":
            synced_datasets = await _sync_postgresql(conn, password, table_name)
            
        elif conn["db_type"] == "mysql":
            synced_datasets = await _sync_mysql(conn, password, table_name)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported database type: {conn['db_type']}")
        
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"status": "synced", "last_sync": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"status": "success", "datasets": synced_datasets}
        
    except Exception as e:
        logger.error(f"Sync error: {str(e)}")
        return {"status": "error", "message": str(e)}

@api_router.get("/database-connections/{conn_id}/tables")
async def list_database_tables(conn_id: str):
    """List tables/collections in a database"""
    conn = await db.database_connections.find_one({"id": conn_id})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    password = _connection_passwords.get(conn_id, "")
    
    try:
        if conn["db_type"] == "mongodb":
            if conn.get("username"):
                uri = f"mongodb://{conn['username']}:{password}@{conn['host']}:{conn['port']}/"
            else:
                uri = f"mongodb://{conn['host']}:{conn['port']}/"
            test_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
            db_conn = test_client[conn["database"]]
            tables = await db_conn.list_collection_names()
            test_client.close()
            
        elif conn["db_type"] == "postgresql":
            pg_conn = await asyncpg.connect(
                host=conn["host"], port=conn["port"], database=conn["database"],
                user=conn.get("username"), password=password, timeout=10
            )
            result = await pg_conn.fetch("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            """)
            tables = [row['table_name'] for row in result]
            await pg_conn.close()
            
        elif conn["db_type"] == "mysql":
            mysql_conn = await aiomysql.connect(
                host=conn["host"], port=conn["port"], db=conn["database"],
                user=conn.get("username", "root"), password=password, connect_timeout=10
            )
            async with mysql_conn.cursor() as cursor:
                await cursor.execute("SHOW TABLES")
                result = await cursor.fetchall()
                tables = [row[0] for row in result]
            mysql_conn.close()
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported database type")
        
        return {"tables": tables, "count": len(tables)}
    except Exception as e:
        return {"status": "error", "message": str(e), "tables": []}

@api_router.delete("/database-connections/{conn_id}")
async def delete_database_connection(conn_id: str):
    """Delete a database connection"""
    await db.database_connections.delete_one({"id": conn_id})
    return {"status": "deleted"}

# =============================================================================
# Dataset Routes
# =============================================================================

@api_router.get("/datasets")
async def list_datasets(org_id: Optional[str] = None):
    """List all datasets"""
    query = {"org_id": org_id} if org_id else {}
    datasets = await db.datasets.find(query, {"_id": 0}).to_list(100)
    return {"datasets": datasets}

@api_router.get("/datasets/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get dataset details"""
    dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@api_router.get("/datasets/{dataset_id}/data")
async def get_dataset_data(
    dataset_id: str,
    page: int = 1,
    limit: int = 100
):
    """Get dataset data with pagination"""
    dataset = await db.datasets.find_one({"id": dataset_id})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    skip = (page - 1) * limit
    data = await db.dataset_data.find(
        {"dataset_id": dataset_id},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.dataset_data.count_documents({"dataset_id": dataset_id})
    
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/datasets/{dataset_id}/stats")
async def get_dataset_stats(dataset_id: str):
    """Get basic statistics for a dataset"""
    dataset = await db.datasets.find_one({"id": dataset_id})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Get all data
    data = await db.dataset_data.find(
        {"dataset_id": dataset_id},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).to_list(10000)
    
    if not data:
        return {"stats": {}, "row_count": 0}
    
    df = pd.DataFrame(data)
    stats = {}
    
    for col in df.columns:
        col_stats = {"name": col, "type": str(df[col].dtype)}
        
        if pd.api.types.is_numeric_dtype(df[col]):
            col_stats.update({
                "min": float(df[col].min()) if not pd.isna(df[col].min()) else None,
                "max": float(df[col].max()) if not pd.isna(df[col].max()) else None,
                "mean": float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
                "std": float(df[col].std()) if not pd.isna(df[col].std()) else None,
                "missing": int(df[col].isna().sum())
            })
        else:
            value_counts = df[col].value_counts().head(10).to_dict()
            col_stats.update({
                "unique": int(df[col].nunique()),
                "top_values": {str(k): int(v) for k, v in value_counts.items()},
                "missing": int(df[col].isna().sum())
            })
        
        stats[col] = col_stats
    
    return {"stats": stats, "row_count": len(df)}

@api_router.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset"""
    await db.datasets.delete_one({"id": dataset_id})
    await db.dataset_data.delete_many({"dataset_id": dataset_id})
    return {"status": "deleted"}

# =============================================================================
# Dashboard Routes
# =============================================================================

@api_router.post("/dashboards")
async def create_dashboard(dashboard: DashboardCreate):
    """Create a new dashboard"""
    dashboard_doc = {
        "id": str(uuid.uuid4()),
        "name": dashboard.name,
        "description": dashboard.description,
        "org_id": dashboard.org_id,
        "widgets": dashboard.widgets,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.dashboards.insert_one(dashboard_doc)
    return {"id": dashboard_doc["id"], "name": dashboard_doc["name"]}

@api_router.get("/dashboards")
async def list_dashboards(org_id: Optional[str] = None):
    """List all dashboards"""
    query = {"org_id": org_id} if org_id else {}
    dashboards = await db.dashboards.find(query, {"_id": 0}).to_list(100)
    return {"dashboards": dashboards}

@api_router.get("/dashboards/{dashboard_id}")
async def get_dashboard(dashboard_id: str):
    """Get dashboard details"""
    dashboard = await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dashboard

@api_router.put("/dashboards/{dashboard_id}")
async def update_dashboard(dashboard_id: str, dashboard: DashboardCreate):
    """Update a dashboard"""
    update_doc = {
        "name": dashboard.name,
        "description": dashboard.description,
        "widgets": dashboard.widgets,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.dashboards.update_one({"id": dashboard_id}, {"$set": update_doc})
    return {"status": "updated"}

@api_router.delete("/dashboards/{dashboard_id}")
async def delete_dashboard(dashboard_id: str):
    """Delete a dashboard"""
    await db.dashboards.delete_one({"id": dashboard_id})
    # Also delete widgets
    await db.widgets.delete_many({"dashboard_id": dashboard_id})
    return {"status": "deleted"}

@api_router.put("/dashboards/{dashboard_id}/layout")
async def update_dashboard_layout(dashboard_id: str, layout: DashboardLayoutUpdate):
    """Update dashboard widget layout"""
    # Update widget positions
    for widget_data in layout.widgets:
        widget_id = widget_data.get("id")
        if widget_id:
            await db.widgets.update_one(
                {"id": widget_id},
                {"$set": {
                    "position": {
                        "x": widget_data.get("x", 0),
                        "y": widget_data.get("y", 0),
                        "w": widget_data.get("w", 4),
                        "h": widget_data.get("h", 3)
                    }
                }}
            )
    
    await db.dashboards.update_one(
        {"id": dashboard_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "updated"}

# =============================================================================
# Widget Routes
# =============================================================================

@api_router.post("/widgets")
async def create_widget(widget: WidgetCreate):
    """Create a new dashboard widget"""
    widget_doc = {
        "id": str(uuid.uuid4()),
        "dashboard_id": widget.dashboard_id,
        "type": widget.type,
        "title": widget.title,
        "config": widget.config,
        "position": widget.position or {"x": 0, "y": 0, "w": 4, "h": 3},
        "dataset_id": widget.dataset_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.widgets.insert_one(widget_doc)
    return {
        "id": widget_doc["id"],
        "type": widget_doc["type"],
        "title": widget_doc["title"],
        "position": widget_doc["position"]
    }

@api_router.get("/dashboards/{dashboard_id}/widgets")
async def get_dashboard_widgets(dashboard_id: str):
    """Get all widgets for a dashboard"""
    widgets = await db.widgets.find(
        {"dashboard_id": dashboard_id},
        {"_id": 0}
    ).to_list(100)
    return {"widgets": widgets}

@api_router.get("/widgets/{widget_id}/data")
async def get_widget_data(widget_id: str):
    """Get data for a widget"""
    widget = await db.widgets.find_one({"id": widget_id})
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    result = {"widget": widget, "data": None}
    
    if widget.get("dataset_id"):
        # Fetch data based on widget type
        dataset_id = widget["dataset_id"]
        config = widget.get("config", {})
        
        data = await db.dataset_data.find(
            {"dataset_id": dataset_id},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).limit(1000).to_list(1000)
        
        if data:
            try:
                df = pd.DataFrame(data)
                
                if widget["type"] == "stat":
                    # Stat widget - show aggregate value
                    field = config.get("field")
                    aggregation = config.get("aggregation", "count")
                    
                    if field and field in df.columns:
                        if aggregation == "sum":
                            value = float(df[field].sum())
                        elif aggregation == "mean":
                            value = float(df[field].mean())
                        elif aggregation == "max":
                            value = float(df[field].max())
                        elif aggregation == "min":
                            value = float(df[field].min())
                        else:
                            value = len(df)
                    else:
                        value = len(df)
                    
                    result["data"] = {"value": value, "aggregation": aggregation}
                    
                elif widget["type"] == "chart":
                    # Chart widget - return grouped data
                    x_field = config.get("x_field")
                    y_field = config.get("y_field")
                    
                    if x_field and x_field in df.columns:
                        if y_field and y_field in df.columns:
                            grouped = df.groupby(x_field)[y_field].sum().reset_index()
                            grouped.columns = ["name", "value"]
                        else:
                            grouped = df.groupby(x_field).size().reset_index()
                            grouped.columns = ["name", "value"]
                        result["data"] = grouped.to_dict(orient="records")
                    else:
                        result["data"] = []
                        
                elif widget["type"] == "table":
                    # Table widget - return paginated data
                    limit = config.get("limit", 10)
                    columns = config.get("columns")
                    if columns:
                        valid_cols = [c for c in columns if c in df.columns]
                        if valid_cols:
                            result["data"] = df[valid_cols].head(limit).to_dict(orient="records")
                        else:
                            result["data"] = df.head(limit).to_dict(orient="records")
                    else:
                        result["data"] = df.head(limit).to_dict(orient="records")
                else:
                    result["data"] = data[:100]
            except Exception as e:
                logger.error(f"Widget data processing error: {str(e)}")
                result["data"] = data[:100] if data else []
    
    return result

@api_router.put("/widgets/{widget_id}")
async def update_widget(widget_id: str, widget: WidgetCreate):
    """Update a widget"""
    update_doc = {
        "type": widget.type,
        "title": widget.title,
        "config": widget.config,
        "position": widget.position,
        "dataset_id": widget.dataset_id,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.widgets.update_one({"id": widget_id}, {"$set": update_doc})
    return {"status": "updated"}

@api_router.delete("/widgets/{widget_id}")
async def delete_widget(widget_id: str):
    """Delete a widget"""
    await db.widgets.delete_one({"id": widget_id})
    return {"status": "deleted"}

# =============================================================================
# Chart Routes
# =============================================================================

@api_router.post("/charts")
async def create_chart(chart: ChartCreate):
    """Create a new chart"""
    chart_doc = {
        "id": str(uuid.uuid4()),
        "name": chart.name,
        "type": chart.type,
        "dataset_id": chart.dataset_id,
        "config": chart.config,
        "org_id": chart.org_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.charts.insert_one(chart_doc)
    return {"id": chart_doc["id"], "name": chart_doc["name"]}

@api_router.get("/charts")
async def list_charts(org_id: Optional[str] = None, dataset_id: Optional[str] = None):
    """List all charts"""
    query = {}
    if org_id:
        query["org_id"] = org_id
    if dataset_id:
        query["dataset_id"] = dataset_id
    charts = await db.charts.find(query, {"_id": 0}).to_list(100)
    return {"charts": charts}

@api_router.get("/charts/{chart_id}")
async def get_chart(chart_id: str):
    """Get a single chart by ID"""
    chart = await db.charts.find_one({"id": chart_id}, {"_id": 0})
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    return chart

@api_router.put("/charts/{chart_id}")
async def update_chart(chart_id: str, chart: ChartCreate):
    """Update a chart"""
    existing = await db.charts.find_one({"id": chart_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    update_doc = {
        "name": chart.name,
        "type": chart.type,
        "dataset_id": chart.dataset_id,
        "config": chart.config,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.charts.update_one({"id": chart_id}, {"$set": update_doc})
    return {"status": "updated", "id": chart_id}

@api_router.get("/charts/{chart_id}/data")
async def get_chart_data(chart_id: str):
    """Get chart data for rendering"""
    chart = await db.charts.find_one({"id": chart_id}, {"_id": 0})
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    # Get dataset data
    data = await db.dataset_data.find(
        {"dataset_id": chart["dataset_id"]},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).to_list(10000)
    
    if not data:
        return {"chart": chart, "data": []}
    
    df = pd.DataFrame(data)
    config = chart.get("config", {})
    
    # Prepare chart data based on config
    x_field = config.get("x_field")
    y_field = config.get("y_field")
    group_by = config.get("group_by")
    aggregation = config.get("aggregation", "count")
    
    chart_data = []
    
    try:
        if x_field and x_field in df.columns:
            if group_by and group_by in df.columns:
                grouped = df.groupby([x_field, group_by])
            else:
                grouped = df.groupby(x_field)
            
            if aggregation == "count":
                result = grouped.size().reset_index(name='value')
            elif aggregation == "sum" and y_field and y_field in df.columns:
                result = grouped[y_field].sum().reset_index(name='value')
            elif aggregation == "mean" and y_field and y_field in df.columns:
                result = grouped[y_field].mean().reset_index(name='value')
            elif aggregation == "max" and y_field and y_field in df.columns:
                result = grouped[y_field].max().reset_index(name='value')
            elif aggregation == "min" and y_field and y_field in df.columns:
                result = grouped[y_field].min().reset_index(name='value')
            else:
                result = grouped.size().reset_index(name='value')
            
            # Rename x_field column to 'name' for consistent frontend handling
            result = result.rename(columns={x_field: 'name'})
            
            # Sort by value descending and limit to top 20
            result = result.sort_values('value', ascending=False).head(20)
            
            # Round numeric values
            result['value'] = result['value'].round(2)
            
            chart_data = result.to_dict(orient='records')
    except Exception as e:
        logger.error(f"Error processing chart data: {str(e)}")
        chart_data = []
    
    return {"chart": chart, "data": chart_data}

@api_router.delete("/charts/{chart_id}")
async def delete_chart(chart_id: str):
    """Delete a chart"""
    await db.charts.delete_one({"id": chart_id})
    return {"status": "deleted"}

# =============================================================================
# AI Copilot Routes
# =============================================================================

from emergentintegrations.llm.chat import LlmChat, UserMessage

@api_router.post("/ai/query")
async def ai_query(request: AIQueryRequest):
    """Query AI for data insights"""
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    # Get dataset context if provided
    context_str = ""
    if request.dataset_id:
        dataset = await db.datasets.find_one({"id": request.dataset_id})
        if dataset:
            columns = dataset.get("columns", [])
            context_str = f"Dataset: {dataset['name']}\nColumns: {json.dumps(columns)}\nRows: {dataset.get('row_count', 0)}"
            
            # Get sample data
            sample = await db.dataset_data.find(
                {"dataset_id": request.dataset_id},
                {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
            ).limit(5).to_list(5)
            if sample:
                context_str += f"\nSample data: {json.dumps(sample[:3])}"
    
    system_message = """You are DataViz Studio AI Assistant, an expert in data analysis and visualization.
Help users understand their data, suggest visualizations, and provide insights.
When analyzing data, be specific and actionable. Suggest appropriate chart types for the data.
If asked about statistics, provide clear explanations."""
    
    if context_str:
        system_message += f"\n\nCurrent data context:\n{context_str}"
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"dataviz-{uuid.uuid4()}",
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=request.query)
        response = await chat.send_message(user_message)
        
        return {"response": response, "query": request.query}
    except Exception as e:
        logger.error(f"AI query error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.post("/ai/suggest-charts")
async def suggest_charts(dataset_id: str):
    """Get AI suggestions for charts based on dataset"""
    dataset = await db.datasets.find_one({"id": dataset_id})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    columns = dataset.get("columns", [])
    
    # Get sample data
    sample = await db.dataset_data.find(
        {"dataset_id": dataset_id},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).limit(10).to_list(10)
    
    prompt = f"""Analyze this dataset and suggest 3-5 useful visualizations.

Dataset: {dataset['name']}
Columns: {json.dumps(columns)}
Row count: {dataset.get('row_count', 0)}
Sample data: {json.dumps(sample[:5] if sample else [])}

Return suggestions as JSON array with format:
[{{"type": "bar|line|pie|scatter|area", "title": "Chart Title", "x_field": "column_name", "y_field": "column_name", "description": "Why this chart is useful"}}]

Only return the JSON array, no other text."""

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"dataviz-suggest-{uuid.uuid4()}",
            system_message="You are a data visualization expert. Return only valid JSON."
        ).with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse JSON response
        try:
            suggestions = json.loads(response)
        except:
            suggestions = []
        
        return {"suggestions": suggestions, "dataset_id": dataset_id}
    except Exception as e:
        logger.error(f"AI suggest error: {str(e)}")
        return {"suggestions": [], "error": str(e)}

# =============================================================================
# Export Routes
# =============================================================================

@api_router.get("/exports/{dataset_id}/csv")
async def export_csv(dataset_id: str):
    """Export dataset as CSV"""
    data = await db.dataset_data.find(
        {"dataset_id": dataset_id},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).to_list(100000)
    
    if not data:
        raise HTTPException(status_code=404, detail="No data found")
    
    df = pd.DataFrame(data)
    csv_content = df.to_csv(index=False)
    
    return JSONResponse(
        content={"csv": csv_content, "rows": len(df)},
        headers={"Content-Type": "application/json"}
    )

@api_router.get("/exports/{dataset_id}/json")
async def export_json(dataset_id: str):
    """Export dataset as JSON"""
    data = await db.dataset_data.find(
        {"dataset_id": dataset_id},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).to_list(100000)
    
    return {"data": data, "rows": len(data)}

# =============================================================================
# Scheduled Data Refresh Routes
# =============================================================================

# Initialize scheduler
scheduler = AsyncIOScheduler()
_scheduled_jobs: Dict[str, str] = {}  # conn_id -> job_id mapping

async def _execute_scheduled_sync(conn_id: str):
    """Execute scheduled sync for a connection"""
    logger.info(f"Executing scheduled sync for connection: {conn_id}")
    try:
        conn = await db.database_connections.find_one({"id": conn_id})
        if not conn:
            logger.error(f"Connection {conn_id} not found for scheduled sync")
            return
        
        password = _connection_passwords.get(conn_id, "")
        
        # Remove old datasets from this source before sync
        old_datasets = await db.datasets.find({"source_id": conn_id}).to_list(100)
        for ds in old_datasets:
            await db.dataset_data.delete_many({"dataset_id": ds["id"]})
            await db.datasets.delete_one({"id": ds["id"]})
        
        # Sync based on database type
        if conn["db_type"] == "postgresql":
            synced = await _sync_postgresql(conn, password)
        elif conn["db_type"] == "mysql":
            synced = await _sync_mysql(conn, password)
        elif conn["db_type"] == "mongodb":
            # Simplified MongoDB sync for scheduled job
            if conn.get("username"):
                uri = f"mongodb://{conn['username']}:{password}@{conn['host']}:{conn['port']}/"
            else:
                uri = f"mongodb://{conn['host']}:{conn['port']}/"
            sync_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
            sync_db = sync_client[conn["database"]]
            collections = await sync_db.list_collection_names()
            
            synced = []
            for coll in collections[:5]:
                data = await sync_db[coll].find({}, {"_id": 0}).limit(10000).to_list(10000)
                if data:
                    dataset_id = str(uuid.uuid4())
                    sample = data[0] if data else {}
                    columns = [{"name": k, "type": type(v).__name__} for k, v in sample.items()]
                    
                    await db.datasets.insert_one({
                        "id": dataset_id, "name": f"{conn['name']} - {coll}",
                        "source_id": conn_id, "source_type": "mongodb",
                        "org_id": conn.get("org_id"), "row_count": len(data),
                        "columns": columns, "created_at": datetime.now(timezone.utc).isoformat()
                    })
                    
                    for record in data:
                        record["dataset_id"] = dataset_id
                        record["_dataset_row_id"] = str(uuid.uuid4())
                    await db.dataset_data.insert_many(data)
                    synced.append({"name": coll, "rows": len(data)})
            sync_client.close()
        else:
            synced = []
        
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"status": "synced", "last_sync": datetime.now(timezone.utc).isoformat()}}
        )
        logger.info(f"Scheduled sync completed for {conn_id}: {len(synced)} datasets")
        
    except Exception as e:
        logger.error(f"Scheduled sync error for {conn_id}: {str(e)}")
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"status": "error", "error": str(e)}}
        )

@api_router.post("/database-connections/{conn_id}/schedule")
async def set_refresh_schedule(conn_id: str, config: ScheduleConfig):
    """Set up scheduled data refresh for a connection"""
    conn = await db.database_connections.find_one({"id": conn_id})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Remove existing schedule if any
    if conn_id in _scheduled_jobs:
        try:
            scheduler.remove_job(_scheduled_jobs[conn_id])
        except:
            pass
    
    if not config.enabled:
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"schedule": None}}
        )
        if conn_id in _scheduled_jobs:
            del _scheduled_jobs[conn_id]
        return {"status": "disabled", "message": "Schedule disabled"}
    
    # Create new schedule
    job_id = f"sync_{conn_id}"
    
    if config.interval_type == "hourly":
        trigger = IntervalTrigger(hours=config.interval_value)
        schedule_desc = f"Every {config.interval_value} hour(s)"
    elif config.interval_type == "daily":
        trigger = IntervalTrigger(days=config.interval_value)
        schedule_desc = f"Every {config.interval_value} day(s)"
    elif config.interval_type == "weekly":
        trigger = IntervalTrigger(weeks=config.interval_value)
        schedule_desc = f"Every {config.interval_value} week(s)"
    elif config.interval_type == "custom" and config.custom_cron:
        trigger = CronTrigger.from_crontab(config.custom_cron)
        schedule_desc = f"Custom: {config.custom_cron}"
    else:
        raise HTTPException(status_code=400, detail="Invalid schedule configuration")
    
    # Add job to scheduler
    scheduler.add_job(
        _execute_scheduled_sync,
        trigger=trigger,
        args=[conn_id],
        id=job_id,
        replace_existing=True
    )
    _scheduled_jobs[conn_id] = job_id
    
    # Store schedule in database
    schedule_doc = {
        "interval_type": config.interval_type,
        "interval_value": config.interval_value,
        "custom_cron": config.custom_cron,
        "enabled": True,
        "description": schedule_desc,
        "next_run": scheduler.get_job(job_id).next_run_time.isoformat() if scheduler.get_job(job_id) else None
    }
    
    await db.database_connections.update_one(
        {"id": conn_id},
        {"$set": {"schedule": schedule_doc}}
    )
    
    return {
        "status": "scheduled",
        "schedule": schedule_desc,
        "next_run": schedule_doc["next_run"]
    }

@api_router.get("/database-connections/{conn_id}/schedule")
async def get_refresh_schedule(conn_id: str):
    """Get the current refresh schedule for a connection"""
    conn = await db.database_connections.find_one({"id": conn_id}, {"_id": 0})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    schedule = conn.get("schedule")
    if not schedule:
        return {"status": "not_scheduled", "schedule": None}
    
    # Update next run time
    if conn_id in _scheduled_jobs:
        job = scheduler.get_job(_scheduled_jobs[conn_id])
        if job:
            schedule["next_run"] = job.next_run_time.isoformat() if job.next_run_time else None
    
    return {"status": "scheduled", "schedule": schedule}

@api_router.delete("/database-connections/{conn_id}/schedule")
async def delete_refresh_schedule(conn_id: str):
    """Remove scheduled refresh for a connection"""
    conn = await db.database_connections.find_one({"id": conn_id})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if conn_id in _scheduled_jobs:
        try:
            scheduler.remove_job(_scheduled_jobs[conn_id])
            del _scheduled_jobs[conn_id]
        except:
            pass
    
    await db.database_connections.update_one(
        {"id": conn_id},
        {"$set": {"schedule": None}}
    )
    
    return {"status": "removed"}

# =============================================================================
# PDF Report Export Routes - Professional Infographic Style
# =============================================================================

def hex_to_rgb(hex_color: str) -> tuple:
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def _generate_chart_svg(chart_data: List[dict], chart_type: str, config: dict) -> str:
    """Generate SVG representation of a chart for PDF"""
    if not chart_data:
        return '<svg width="400" height="200"><text x="200" y="100" text-anchor="middle">No data</text></svg>'
    
    width, height = 500, 300
    padding = 50
    chart_width = width - 2 * padding
    chart_height = height - 2 * padding
    
    max_value = max(d.get('value', 0) for d in chart_data) or 1
    
    if chart_type in ['bar', 'column']:
        bar_width = chart_width / len(chart_data) * 0.8
        gap = chart_width / len(chart_data) * 0.2
        
        bars = []
        labels = []
        for i, d in enumerate(chart_data[:10]):
            bar_height = (d.get('value', 0) / max_value) * chart_height
            x = padding + i * (bar_width + gap)
            y = padding + chart_height - bar_height
            bars.append(f'<rect x="{x}" y="{y}" width="{bar_width}" height="{bar_height}" fill="#8b5cf6" rx="4"/>')
            labels.append(f'<text x="{x + bar_width/2}" y="{height - 10}" text-anchor="middle" font-size="10">{str(d.get("name", ""))[:8]}</text>')
        
        return f'''<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="{width}" height="{height}" fill="#f8fafc"/>
            {"".join(bars)}
            {"".join(labels)}
        </svg>'''
    
    elif chart_type == 'pie':
        cx, cy, r = width/2, height/2, min(chart_width, chart_height)/2 - 20
        total = sum(d.get('value', 0) for d in chart_data)
        if total == 0:
            total = 1
        
        colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
        slices = []
        start_angle = 0
        
        for i, d in enumerate(chart_data[:6]):
            value = d.get('value', 0)
            angle = (value / total) * 360
            end_angle = start_angle + angle
            
            large_arc = 1 if angle > 180 else 0
            start_rad = start_angle * 3.14159 / 180
            end_rad = end_angle * 3.14159 / 180
            
            x1 = cx + r * round(1000 * (0 if start_angle == 0 else __import__('math').cos(start_rad))) / 1000
            y1 = cy + r * round(1000 * (0 if start_angle == 0 else __import__('math').sin(start_rad))) / 1000
            x2 = cx + r * round(1000 * __import__('math').cos(end_rad)) / 1000
            y2 = cy + r * round(1000 * __import__('math').sin(end_rad)) / 1000
            
            path = f'M {cx} {cy} L {x1} {y1} A {r} {r} 0 {large_arc} 1 {x2} {y2} Z'
            slices.append(f'<path d="{path}" fill="{colors[i % len(colors)]}"/>')
            start_angle = end_angle
        
        return f'''<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="{width}" height="{height}" fill="#f8fafc"/>
            {"".join(slices)}
        </svg>'''
    
    else:  # line chart
        points = []
        for i, d in enumerate(chart_data[:10]):
            x = padding + (i / max(len(chart_data) - 1, 1)) * chart_width
            y = padding + chart_height - (d.get('value', 0) / max_value) * chart_height
            points.append(f'{x},{y}')
        
        return f'''<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="{width}" height="{height}" fill="#f8fafc"/>
            <polyline points="{' '.join(points)}" fill="none" stroke="#8b5cf6" stroke-width="3"/>
        </svg>'''

@api_router.post("/reports/export/pdf")
async def export_report_pdf(request: ReportExportRequest):
    """Export dashboard or charts as professional infographic-style PDF report"""
    charts_to_export = []
    all_chart_data = []
    
    if request.dashboard_id:
        dashboard = await db.dashboards.find_one({"id": request.dashboard_id}, {"_id": 0})
        if not dashboard:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        
        widgets = await db.widgets.find(
            {"dashboard_id": request.dashboard_id, "type": "chart"},
            {"_id": 0}
        ).to_list(50)
        
        for widget in widgets:
            if widget.get("dataset_id"):
                chart_info = {
                    "title": widget.get("title", "Chart"),
                    "type": widget.get("config", {}).get("chart_type", "bar"),
                    "dataset_id": widget["dataset_id"],
                    "config": widget.get("config", {})
                }
                charts_to_export.append(chart_info)
    
    if request.chart_ids:
        for chart_id in request.chart_ids:
            chart = await db.charts.find_one({"id": chart_id}, {"_id": 0})
            if chart:
                charts_to_export.append({
                    "title": chart.get("name", "Chart"),
                    "type": chart.get("type", "bar"),
                    "dataset_id": chart.get("dataset_id"),
                    "config": chart.get("config", {})
                })
    
    if not charts_to_export:
        raise HTTPException(status_code=400, detail="No charts to export")
    
    # Fetch all chart data first
    for chart_info in charts_to_export:
        data = await db.dataset_data.find(
            {"dataset_id": chart_info["dataset_id"]},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(1000)
        
        if data:
            df = pd.DataFrame(data)
            config = chart_info.get("config", {})
            x_field = config.get("x_field")
            y_field = config.get("y_field")
            
            chart_data = []
            if x_field and x_field in df.columns:
                if y_field and y_field in df.columns:
                    grouped = df.groupby(x_field)[y_field].sum().reset_index()
                    grouped.columns = ["name", "value"]
                else:
                    grouped = df.groupby(x_field).size().reset_index()
                    grouped.columns = ["name", "value"]
                chart_data = grouped.sort_values('value', ascending=False).head(10).to_dict(orient='records')
            
            all_chart_data.append({
                **chart_info,
                "data": chart_data,
                "total": sum(d.get('value', 0) for d in chart_data)
            })
    
    # Colors from request or defaults (blue/coral theme like reference)
    primary_color = hex_to_rgb(request.header_color or "#3B82F6")
    accent_color = hex_to_rgb(request.accent_color or "#EF4444")
    
    # Report settings
    report_title = request.title or "Survey Results Infographics"
    report_subtitle = request.subtitle or ""
    company_name = request.company_name or "DataViz Studio"
    report_date = request.report_date or datetime.now(timezone.utc).strftime("%B %d, %Y")
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    
    class InfographicPDF(FPDF):
        def __init__(self, primary, accent, title, subtitle, company, date):
            super().__init__()
            self.primary = primary
            self.accent = accent
            self.report_title = title
            self.report_subtitle = subtitle
            self.company = company
            self.report_date = date
            
        def header(self):
            # Top color bar
            self.set_fill_color(*self.primary)
            self.rect(0, 0, 210, 8, 'F')
            
            # Small accent bar
            self.set_fill_color(*self.accent)
            self.rect(0, 8, 60, 2, 'F')
            
        def footer(self):
            self.set_y(-20)
            # Footer bar
            self.set_fill_color(*self.primary)
            self.rect(0, 282, 210, 15, 'F')
            self.set_y(-12)
            self.set_font('Helvetica', '', 9)
            self.set_text_color(255, 255, 255)
            self.cell(0, 10, f'{self.company}  |  Page {self.page_no()}  |  {self.report_date}', align='C')
    
    pdf = InfographicPDF(primary_color, accent_color, report_title, report_subtitle, company_name, report_date)
    pdf.set_auto_page_break(auto=True, margin=25)
    pdf.add_page()
    
    # ========== TITLE SECTION ==========
    pdf.set_y(20)
    pdf.set_font('Helvetica', 'B', 28)
    pdf.set_text_color(*primary_color)
    pdf.cell(0, 12, report_title, align='C', new_x='LMARGIN', new_y='NEXT')
    
    if report_subtitle:
        pdf.set_font('Helvetica', '', 12)
        pdf.set_text_color(100, 116, 139)
        pdf.cell(0, 8, report_subtitle, align='C', new_x='LMARGIN', new_y='NEXT')
    
    pdf.ln(10)
    
    # ========== SUMMARY STAT CARDS ==========
    if request.include_summary_cards and all_chart_data:
        card_y = pdf.get_y()
        card_width = 42
        card_height = 35
        card_gap = 5
        start_x = 15
        
        # Calculate summary stats from all data
        total_value = sum(c.get('total', 0) for c in all_chart_data)
        num_categories = sum(len(c.get('data', [])) for c in all_chart_data)
        
        # Create up to 4 stat cards
        stat_cards = []
        for i, chart in enumerate(all_chart_data[:4]):
            if chart.get('data'):
                top_item = chart['data'][0]
                percentage = int((top_item.get('value', 0) / chart.get('total', 1)) * 100) if chart.get('total', 0) > 0 else 0
                stat_cards.append({
                    'value': f"{percentage}%",
                    'label': str(top_item.get('name', 'Top'))[:15],
                    'sublabel': chart.get('title', '')[:20],
                    'color': primary_color if i % 2 == 0 else accent_color
                })
        
        # Draw stat cards
        for i, card in enumerate(stat_cards):
            x = start_x + i * (card_width + card_gap)
            
            # Card background
            pdf.set_fill_color(*card['color'])
            pdf.rect(x, card_y, card_width, card_height, 'F')
            
            # Rounded corner effect (small white triangles)
            pdf.set_fill_color(255, 255, 255)
            
            # Large percentage
            pdf.set_xy(x, card_y + 5)
            pdf.set_font('Helvetica', 'B', 18)
            pdf.set_text_color(255, 255, 255)
            pdf.cell(card_width, 10, card['value'], align='C')
            
            # Label
            pdf.set_xy(x, card_y + 18)
            pdf.set_font('Helvetica', '', 8)
            pdf.cell(card_width, 5, card['label'], align='C')
            
            # Sublabel
            pdf.set_xy(x, card_y + 24)
            pdf.set_font('Helvetica', '', 6)
            pdf.set_text_color(230, 230, 250)
            pdf.cell(card_width, 5, card['sublabel'], align='C')
        
        pdf.set_y(card_y + card_height + 15)
    
    # ========== CHARTS SECTION ==========
    for idx, chart_info in enumerate(all_chart_data):
        chart_data = chart_info.get('data', [])
        if not chart_data:
            continue
        
        chart_y = pdf.get_y()
        
        # Check if we need a new page
        if chart_y > 200:
            pdf.add_page()
            chart_y = pdf.get_y()
        
        # Section divider line
        pdf.set_draw_color(*primary_color)
        pdf.set_line_width(0.5)
        pdf.line(15, chart_y, 195, chart_y)
        pdf.ln(5)
        
        # Chart title with accent
        title_y = pdf.get_y()
        pdf.set_fill_color(*primary_color)
        pdf.rect(15, title_y, 4, 10, 'F')
        
        pdf.set_xy(22, title_y)
        pdf.set_font('Helvetica', 'B', 14)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(0, 10, chart_info['title'], new_x='LMARGIN', new_y='NEXT')
        pdf.ln(3)
        
        # Calculate chart dimensions
        chart_start_y = pdf.get_y()
        chart_width = 85
        chart_height = 55
        
        max_val = max(d.get('value', 0) for d in chart_data) or 1
        total_val = sum(d.get('value', 0) for d in chart_data)
        
        # ===== LEFT SIDE: BAR CHART =====
        bar_x = 20
        bar_count = min(len(chart_data), 6)
        bar_total_width = 70
        bar_width = bar_total_width / bar_count * 0.7
        bar_gap = bar_total_width / bar_count * 0.3
        
        # Y-axis labels
        pdf.set_font('Helvetica', '', 7)
        pdf.set_text_color(150, 150, 150)
        for i, val in enumerate([max_val, max_val/2, 0]):
            y_pos = chart_start_y + (i * chart_height / 2)
            pdf.set_xy(10, y_pos - 2)
            pdf.cell(8, 4, f"{int(val):,}", align='R')
        
        # Grid lines
        pdf.set_draw_color(230, 230, 230)
        pdf.set_line_width(0.2)
        for i in range(3):
            y_line = chart_start_y + (i * chart_height / 2)
            pdf.line(bar_x, y_line, bar_x + bar_total_width, y_line)
        
        # Draw bars with alternating colors
        bar_colors = [primary_color, accent_color, (100, 116, 139), primary_color, accent_color]
        
        for i, d in enumerate(chart_data[:bar_count]):
            bar_height = (d.get('value', 0) / max_val) * chart_height
            x = bar_x + i * (bar_width + bar_gap)
            y = chart_start_y + chart_height - bar_height
            
            color = bar_colors[i % len(bar_colors)]
            pdf.set_fill_color(*color)
            pdf.rect(x, y, bar_width, bar_height, 'F')
            
            # Value on top of bar
            pdf.set_font('Helvetica', 'B', 7)
            pdf.set_text_color(*color)
            pdf.set_xy(x, y - 5)
            pdf.cell(bar_width, 4, f"{int(d.get('value', 0)):,}", align='C')
            
            # Category label below
            pdf.set_font('Helvetica', '', 6)
            pdf.set_text_color(80, 80, 80)
            pdf.set_xy(x, chart_start_y + chart_height + 2)
            pdf.cell(bar_width, 4, str(d.get('name', ''))[:8], align='C')
        
        # ===== RIGHT SIDE: CALLOUT BOXES =====
        callout_x = 110
        callout_width = 80
        callout_item_height = 12
        
        # Top items as callout cards
        for i, d in enumerate(chart_data[:4]):
            cy = chart_start_y + i * (callout_item_height + 3)
            percentage = int((d.get('value', 0) / total_val * 100)) if total_val > 0 else 0
            
            # Callout background color
            if i == 0:
                pdf.set_fill_color(*accent_color)
                text_color = (255, 255, 255)
            elif i == 1:
                pdf.set_fill_color(*primary_color)
                text_color = (255, 255, 255)
            else:
                pdf.set_fill_color(241, 245, 249)
                text_color = (30, 41, 59)
            
            # Draw callout box
            pdf.rect(callout_x, cy, callout_width, callout_item_height, 'F')
            
            # Percentage badge
            badge_width = 18
            pdf.set_fill_color(*accent_color if i > 1 else (255, 255, 255))
            pdf.rect(callout_x + 2, cy + 2, badge_width, callout_item_height - 4, 'F')
            
            pdf.set_font('Helvetica', 'B', 9)
            if i > 1:
                pdf.set_text_color(255, 255, 255)
            else:
                pdf.set_text_color(*accent_color if i == 0 else primary_color)
            pdf.set_xy(callout_x + 2, cy + 2)
            pdf.cell(badge_width, callout_item_height - 4, f"{percentage}%", align='C')
            
            # Category name
            pdf.set_font('Helvetica', 'B', 8)
            pdf.set_text_color(*text_color)
            pdf.set_xy(callout_x + badge_width + 5, cy + 2)
            pdf.cell(callout_width - badge_width - 8, 5, str(d.get('name', ''))[:20])
            
            # Value
            pdf.set_font('Helvetica', '', 6)
            pdf.set_xy(callout_x + badge_width + 5, cy + 7)
            pdf.cell(callout_width - badge_width - 8, 4, f"Value: {d.get('value', 0):,.0f}")
        
        pdf.set_y(chart_start_y + chart_height + 15)
        
        # ===== DATA TABLE (if enabled) =====
        if request.include_data_tables:
            table_y = pdf.get_y()
            
            if table_y > 230:
                pdf.add_page()
                table_y = pdf.get_y()
            
            # Table header
            pdf.set_fill_color(*primary_color)
            pdf.set_text_color(255, 255, 255)
            pdf.set_font('Helvetica', 'B', 9)
            pdf.cell(90, 8, '  Category', border=0, fill=True)
            pdf.cell(45, 8, 'Value', border=0, fill=True, align='R')
            pdf.cell(45, 8, 'Percentage  ', border=0, fill=True, align='R', new_x='LMARGIN', new_y='NEXT')
            
            # Table rows
            pdf.set_font('Helvetica', '', 8)
            for i, row in enumerate(chart_data[:8]):
                pct = int((row.get('value', 0) / total_val * 100)) if total_val > 0 else 0
                
                if i % 2 == 0:
                    pdf.set_fill_color(248, 250, 252)
                else:
                    pdf.set_fill_color(255, 255, 255)
                
                pdf.set_text_color(30, 41, 59)
                pdf.cell(90, 7, f"  {str(row.get('name', ''))[:35]}", border=0, fill=True)
                pdf.cell(45, 7, f"{row.get('value', 0):,.0f}", border=0, fill=True, align='R')
                
                # Percentage with mini bar
                pdf.set_text_color(*accent_color)
                pdf.cell(45, 7, f"{pct}%  ", border=0, fill=True, align='R', new_x='LMARGIN', new_y='NEXT')
            
            pdf.ln(8)
        
        pdf.ln(5)
    
    # Generate PDF bytes
    try:
        pdf_bytes = bytes(pdf.output())
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        return {
            "status": "success",
            "pdf_base64": pdf_base64,
            "filename": f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
            "charts_included": len(charts_to_export)
        }
    except Exception as e:
        logger.error(f"PDF generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@api_router.get("/reports/export/pdf/{dashboard_id}")
async def export_dashboard_pdf(
    dashboard_id: str, 
    include_tables: bool = True,
    title: Optional[str] = None,
    subtitle: Optional[str] = None,
    company_name: Optional[str] = None
):
    """Quick endpoint to export a dashboard as PDF"""
    return await export_report_pdf(ReportExportRequest(
        dashboard_id=dashboard_id,
        include_data_tables=include_tables,
        title=title,
        subtitle=subtitle,
        company_name=company_name
    ))

# =============================================================================
# Chart Drill-Down Routes
# =============================================================================

@api_router.post("/charts/{chart_id}/drill-down")
async def drill_down_chart(chart_id: str, request: DrillDownRequest):
    """Drill down into chart data by filtering"""
    chart = await db.charts.find_one({"id": chart_id}, {"_id": 0})
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    # Get filtered data
    query = {
        "dataset_id": chart["dataset_id"],
        request.filter_field: request.filter_value
    }
    
    data = await db.dataset_data.find(
        query,
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).to_list(10000)
    
    if not data:
        return {
            "chart": chart,
            "filter": {"field": request.filter_field, "value": request.filter_value},
            "data": [],
            "drill_options": []
        }
    
    df = pd.DataFrame(data)
    config = chart.get("config", {})
    
    # If drill_to_field specified, aggregate by that field
    drill_field = request.drill_to_field or config.get("x_field")
    y_field = config.get("y_field")
    
    if drill_field and drill_field in df.columns:
        if y_field and y_field in df.columns:
            result = df.groupby(drill_field)[y_field].sum().reset_index()
            result.columns = ["name", "value"]
        else:
            result = df.groupby(drill_field).size().reset_index()
            result.columns = ["name", "value"]
        
        chart_data = result.sort_values('value', ascending=False).head(20).to_dict(orient='records')
    else:
        chart_data = data[:100]
    
    # Determine possible drill options (other categorical columns)
    drill_options = []
    for col in df.columns:
        col_dtype = str(df[col].dtype).lower()
        is_string_type = col_dtype in ('object', 'str', 'string') or 'str' in col_dtype
        if is_string_type and col not in [request.filter_field, drill_field]:
            unique_count = df[col].nunique()
            if 2 <= unique_count <= 50:
                drill_options.append({
                    "field": col,
                    "unique_values": unique_count,
                    "sample_values": df[col].unique()[:5].tolist()
                })
    
    return {
        "chart": chart,
        "filter": {"field": request.filter_field, "value": request.filter_value},
        "data": chart_data,
        "total_rows": len(data),
        "drill_options": drill_options[:5],
        "breadcrumb": [
            {"field": request.filter_field, "value": request.filter_value}
        ]
    }

@api_router.get("/charts/{chart_id}/drill-options")
async def get_drill_options(chart_id: str):
    """Get available drill-down options for a chart"""
    chart = await db.charts.find_one({"id": chart_id}, {"_id": 0})
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    # Get sample data
    data = await db.dataset_data.find(
        {"dataset_id": chart["dataset_id"]},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).limit(1000).to_list(1000)
    
    if not data:
        return {"drill_options": []}
    
    df = pd.DataFrame(data)
    config = chart.get("config", {})
    x_field = config.get("x_field")
    
    # Find categorical columns suitable for drill-down
    drill_options = []
    for col in df.columns:
        # Check for string-like dtypes (object, string, StringDtype)
        col_dtype = str(df[col].dtype).lower()
        is_string_type = col_dtype in ('object', 'str', 'string') or 'str' in col_dtype
        if is_string_type:
            unique_values = df[col].unique()
            unique_count = len(unique_values)
            if 2 <= unique_count <= 50:
                drill_options.append({
                    "field": col,
                    "unique_values": unique_count,
                    "values": unique_values[:10].tolist(),
                    "is_current_x_axis": col == x_field
                })
    
    return {
        "chart_id": chart_id,
        "chart_type": chart.get("type"),
        "drill_options": drill_options
    }

@api_router.get("/datasets/{dataset_id}/drill-hierarchy")
async def get_dataset_drill_hierarchy(dataset_id: str):
    """Analyze dataset and suggest drill-down hierarchy"""
    dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    data = await db.dataset_data.find(
        {"dataset_id": dataset_id},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).limit(1000).to_list(1000)
    
    if not data:
        return {"hierarchy": [], "suggested_path": []}
    
    df = pd.DataFrame(data)
    
    # Analyze columns for hierarchy
    column_info = []
    for col in df.columns:
        unique_count = df[col].nunique()
        col_type = str(df[col].dtype)
        
        if df[col].dtype == 'object' and 2 <= unique_count <= 100:
            column_info.append({
                "field": col,
                "unique_values": unique_count,
                "type": col_type,
                "sample_values": df[col].unique()[:5].tolist()
            })
    
    # Sort by unique count (fewer unique = higher level in hierarchy)
    column_info.sort(key=lambda x: x["unique_values"])
    
    # Suggest hierarchy path
    suggested_path = [c["field"] for c in column_info[:4]]
    
    return {
        "hierarchy": column_info,
        "suggested_path": suggested_path,
        "total_columns": len(df.columns),
        "categorical_columns": len(column_info)
    }

# =============================================================================
# Health & Root
# =============================================================================

@api_router.get("/")
async def root():
    return {"message": "DataViz Studio API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    """Initialize database indexes and scheduler on startup"""
    logger.info("DataViz Studio API starting up...")
    
    try:
        # Users
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        
        # Organizations
        await db.organizations.create_index("id", unique=True)
        
        # Data Sources
        await db.data_sources.create_index("id", unique=True)
        await db.data_sources.create_index("org_id")
        
        # Datasets
        await db.datasets.create_index("id", unique=True)
        await db.datasets.create_index("org_id")
        
        # Dataset Data
        await db.dataset_data.create_index("dataset_id")
        
        # Dashboards
        await db.dashboards.create_index("id", unique=True)
        await db.dashboards.create_index("org_id")
        
        # Charts
        await db.charts.create_index("id", unique=True)
        await db.charts.create_index("dataset_id")
        
        # Database Connections
        await db.database_connections.create_index("id", unique=True)
        await db.database_connections.create_index("org_id")
        
        logger.info("Database indexes created successfully")
        
        # Start the scheduler for scheduled data refreshes
        scheduler.start()
        logger.info("APScheduler started for scheduled data refreshes")
        
        # Restore any existing schedules from database
        connections_with_schedules = await db.database_connections.find(
            {"schedule.enabled": True}, {"_id": 0}
        ).to_list(100)
        
        for conn in connections_with_schedules:
            try:
                schedule = conn.get("schedule", {})
                if schedule.get("enabled"):
                    job_id = f"sync_{conn['id']}"
                    interval_type = schedule.get("interval_type")
                    interval_value = schedule.get("interval_value", 1)
                    
                    if interval_type == "hourly":
                        trigger = IntervalTrigger(hours=interval_value)
                    elif interval_type == "daily":
                        trigger = IntervalTrigger(days=interval_value)
                    elif interval_type == "weekly":
                        trigger = IntervalTrigger(weeks=interval_value)
                    elif interval_type == "custom" and schedule.get("custom_cron"):
                        trigger = CronTrigger.from_crontab(schedule["custom_cron"])
                    else:
                        continue
                    
                    scheduler.add_job(
                        _execute_scheduled_sync,
                        trigger=trigger,
                        args=[conn["id"]],
                        id=job_id,
                        replace_existing=True
                    )
                    _scheduled_jobs[conn["id"]] = job_id
                    logger.info(f"Restored schedule for connection: {conn['name']}")
            except Exception as e:
                logger.error(f"Error restoring schedule for {conn.get('name')}: {e}")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Cleanup on shutdown"""
    logger.info("DataViz Studio API shutting down...")
    
    # Shutdown scheduler gracefully
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")
    
    client.close()
