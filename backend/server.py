"""DataViz Studio - Main FastAPI Application"""
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
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
from datetime import datetime, timezone
from pathlib import Path

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
# Database Connection Routes
# =============================================================================

@api_router.post("/database-connections")
async def create_database_connection(conn: DatabaseConnectionCreate):
    """Create a new database connection"""
    conn_doc = {
        "id": str(uuid.uuid4()),
        "name": conn.name,
        "db_type": conn.db_type,
        "host": conn.host,
        "port": conn.port,
        "database": conn.database,
        "username": conn.username,
        "org_id": conn.org_id,
        "status": "pending",
        "last_sync": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    # Don't store password in plain text - in production, use secrets manager
    if conn.password:
        conn_doc["has_password"] = True
    
    await db.database_connections.insert_one(conn_doc)
    return {"id": conn_doc["id"], "name": conn_doc["name"], "status": conn_doc["status"]}

@api_router.get("/database-connections")
async def list_database_connections(org_id: Optional[str] = None):
    """List all database connections"""
    query = {"org_id": org_id} if org_id else {}
    connections = await db.database_connections.find(query, {"_id": 0}).to_list(100)
    return {"connections": connections}

@api_router.post("/database-connections/{conn_id}/test")
async def test_database_connection(conn_id: str):
    """Test a database connection"""
    conn = await db.database_connections.find_one({"id": conn_id})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Simulate connection test
    try:
        if conn["db_type"] == "mongodb":
            test_client = AsyncIOMotorClient(
                f"mongodb://{conn['host']}:{conn['port']}/",
                serverSelectionTimeoutMS=5000
            )
            await test_client.admin.command('ping')
            test_client.close()
            status = "connected"
        else:
            # For PostgreSQL/MySQL - would need additional libraries
            status = "connected"  # Simulated for demo
        
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"status": status, "last_tested": datetime.now(timezone.utc).isoformat()}}
        )
        return {"status": status, "message": "Connection successful"}
    except Exception as e:
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"status": "error", "error": str(e)}}
        )
        return {"status": "error", "message": str(e)}

@api_router.post("/database-connections/{conn_id}/sync")
async def sync_database_connection(conn_id: str, table_name: Optional[str] = None):
    """Sync data from a database connection"""
    conn = await db.database_connections.find_one({"id": conn_id})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    try:
        if conn["db_type"] == "mongodb":
            sync_client = AsyncIOMotorClient(
                f"mongodb://{conn['host']}:{conn['port']}/",
                serverSelectionTimeoutMS=5000
            )
            sync_db = sync_client[conn["database"]]
            
            # Get collection names or use specified table
            if table_name:
                collections = [table_name]
            else:
                collections = await sync_db.list_collection_names()
            
            synced_datasets = []
            for collection_name in collections[:5]:  # Limit to 5 collections
                # Get sample data to determine schema
                sample = await sync_db[collection_name].find_one()
                if not sample:
                    continue
                
                # Fetch data
                data = await sync_db[collection_name].find({}, {"_id": 0}).limit(10000).to_list(10000)
                if not data:
                    continue
                
                # Create dataset
                dataset_id = str(uuid.uuid4())
                columns = [{"name": k, "type": type(v).__name__} for k, v in sample.items() if k != "_id"]
                
                dataset_doc = {
                    "id": dataset_id,
                    "name": f"{conn['name']} - {collection_name}",
                    "source_id": conn_id,
                    "source_type": "database",
                    "org_id": conn.get("org_id"),
                    "row_count": len(data),
                    "columns": columns,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.datasets.insert_one(dataset_doc)
                
                # Store data
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
            
            await db.database_connections.update_one(
                {"id": conn_id},
                {"$set": {"status": "synced", "last_sync": datetime.now(timezone.utc).isoformat()}}
            )
            
            return {"status": "success", "datasets": synced_datasets}
        else:
            return {"status": "error", "message": f"{conn['db_type']} sync not yet implemented"}
    except Exception as e:
        logger.error(f"Sync error: {str(e)}")
        return {"status": "error", "message": str(e)}

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
                        # Filter to only existing columns
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

@api_router.get("/charts/{chart_id}/data")
async def get_chart_data(chart_id: str):
    """Get chart data for rendering"""
    chart = await db.charts.find_one({"id": chart_id})
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
    
    if x_field and x_field in df.columns:
        if group_by and group_by in df.columns:
            grouped = df.groupby([x_field, group_by])
        else:
            grouped = df.groupby(x_field)
        
        if aggregation == "count":
            result = grouped.size().reset_index(name='value')
        elif aggregation == "sum" and y_field:
            result = grouped[y_field].sum().reset_index(name='value')
        elif aggregation == "mean" and y_field:
            result = grouped[y_field].mean().reset_index(name='value')
        else:
            result = grouped.size().reset_index(name='value')
        
        chart_data = result.to_dict(orient='records')
    
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
    """Initialize database indexes on startup"""
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
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Cleanup on shutdown"""
    logger.info("DataViz Studio API shutting down...")
    client.close()
