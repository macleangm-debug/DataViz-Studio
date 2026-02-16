"""DataViz Studio - Data Source Routes"""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import pandas as pd
import io

# Database drivers
import asyncpg
import aiomysql
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/data-sources", tags=["Data Sources"])

# Store encrypted passwords in memory (in production, use secrets manager)
_connection_passwords: Dict[str, str] = {}


class DataSourceCreate(BaseModel):
    name: str
    type: str  # file, database, api
    config: Dict[str, Any] = {}
    org_id: Optional[str] = None


class DatabaseConnectionCreate(BaseModel):
    name: str
    db_type: str  # mongodb, postgresql, mysql
    host: str
    port: int
    database: str
    username: Optional[str] = None
    password: Optional[str] = None
    org_id: Optional[str] = None


@router.post("")
async def create_data_source(source: DataSourceCreate, request: Request):
    """Create a new data source connection"""
    db = request.app.state.db
    
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


@router.get("")
async def list_data_sources(request: Request, org_id: Optional[str] = None):
    """List all data sources"""
    db = request.app.state.db
    
    query = {"org_id": org_id} if org_id else {}
    sources = await db.data_sources.find(query, {"_id": 0}).to_list(100)
    return {"sources": sources}


@router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    org_id: Optional[str] = Form(None)
):
    """Upload a file (CSV, Excel, JSON) as a data source"""
    db = request.app.state.db
    
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


@router.delete("/{source_id}")
async def delete_data_source(source_id: str, request: Request):
    """Delete a data source"""
    db = request.app.state.db
    
    await db.data_sources.delete_one({"id": source_id})
    return {"status": "deleted"}


# =============================================================================
# Database Connection Routes
# =============================================================================

@router.post("/database-connections")
async def create_database_connection(conn: DatabaseConnectionCreate, request: Request):
    """Create a new database connection"""
    db = request.app.state.db
    
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
    
    # Store password securely
    if conn.password:
        conn_doc["has_password"] = True
        _connection_passwords[conn_id] = conn.password
    
    await db.database_connections.insert_one(conn_doc)
    return {"id": conn_doc["id"], "name": conn_doc["name"], "status": conn_doc["status"]}


@router.get("/database-connections")
async def list_database_connections(request: Request, org_id: Optional[str] = None):
    """List all database connections"""
    db = request.app.state.db
    
    query = {"org_id": org_id} if org_id else {}
    connections = await db.database_connections.find(query, {"_id": 0}).to_list(100)
    return {"connections": connections}


@router.get("/database-connections/{conn_id}")
async def get_database_connection(conn_id: str, request: Request):
    """Get a single database connection"""
    db = request.app.state.db
    
    conn = await db.database_connections.find_one({"id": conn_id}, {"_id": 0})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return conn


@router.post("/database-connections/{conn_id}/test")
async def test_database_connection(conn_id: str, request: Request):
    """Test a database connection"""
    db = request.app.state.db
    
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
        
    except Exception as e:
        error_msg = str(e)
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"status": "error", "error": error_msg}}
        )
        return {"status": "error", "message": error_msg}


@router.post("/database-connections/{conn_id}/sync")
async def sync_database_connection(conn_id: str, request: Request, table_name: Optional[str] = None):
    """Sync data from a database connection"""
    db = request.app.state.db
    
    conn = await db.database_connections.find_one({"id": conn_id})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    password = _connection_passwords.get(conn_id, "")
    
    try:
        if conn["db_type"] == "mongodb":
            synced_datasets = await _sync_mongodb(db, conn, password, table_name)
        elif conn["db_type"] == "postgresql":
            synced_datasets = await _sync_postgresql(db, conn, password, table_name)
        elif conn["db_type"] == "mysql":
            synced_datasets = await _sync_mysql(db, conn, password, table_name)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported database type: {conn['db_type']}")
        
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"status": "synced", "last_sync": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"status": "success", "datasets": synced_datasets}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/database-connections/{conn_id}/tables")
async def list_database_tables(conn_id: str, request: Request):
    """List tables/collections in a database"""
    db = request.app.state.db
    
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


@router.delete("/database-connections/{conn_id}")
async def delete_database_connection(conn_id: str, request: Request):
    """Delete a database connection"""
    db = request.app.state.db
    
    await db.database_connections.delete_one({"id": conn_id})
    if conn_id in _connection_passwords:
        del _connection_passwords[conn_id]
    return {"status": "deleted"}


# =============================================================================
# Sync Helper Functions
# =============================================================================

async def _sync_mongodb(db, conn: dict, password: str, table_name: Optional[str] = None) -> List[dict]:
    """Sync data from MongoDB"""
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
            "source_id": conn["id"],
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
    return synced_datasets


async def _sync_postgresql(db, conn: dict, password: str, table_name: Optional[str] = None) -> List[dict]:
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
            columns_result = await pg_conn.fetch("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
            """, tbl)
            
            columns = [{"name": row['column_name'], "type": row['data_type']} for row in columns_result]
            
            data = await pg_conn.fetch(f'SELECT * FROM "{tbl}" LIMIT 10000')
            if not data:
                continue
            
            records = [dict(row) for row in data]
            
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
            
            for record in records:
                for k, v in record.items():
                    if isinstance(v, datetime):
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


async def _sync_mysql(db, conn: dict, password: str, table_name: Optional[str] = None) -> List[dict]:
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
            if table_name:
                tables = [table_name]
            else:
                await cursor.execute("SHOW TABLES")
                tables_result = await cursor.fetchall()
                tables = [list(row.values())[0] for row in tables_result]
            
            for tbl in tables[:5]:
                await cursor.execute(f"DESCRIBE `{tbl}`")
                columns_result = await cursor.fetchall()
                columns = [{"name": row['Field'], "type": row['Type']} for row in columns_result]
                
                await cursor.execute(f"SELECT * FROM `{tbl}` LIMIT 10000")
                records = await cursor.fetchall()
                
                if not records:
                    continue
                
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
                
                for record in records:
                    for k, v in record.items():
                        if isinstance(v, datetime):
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
