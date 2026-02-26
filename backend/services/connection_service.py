"""Database connection service - handles external DB connections and sync"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import asyncpg
import aiomysql
import logging

from core.database import db, create_postgres_pool, create_mysql_pool
from core.scheduler import scheduler, add_interval_job, add_cron_job, remove_job

logger = logging.getLogger(__name__)


class ConnectionService:
    """Service for external database connections"""
    
    @staticmethod
    async def create_connection(
        name: str,
        conn_type: str,
        host: str,
        port: int,
        database: str,
        username: str,
        password: str,
        org_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new database connection"""
        connection = {
            "id": str(uuid.uuid4()),
            "name": name,
            "type": conn_type,
            "host": host,
            "port": port,
            "database": database,
            "username": username,
            "password": password,  # In production, encrypt this
            "org_id": org_id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.database_connections.insert_one(connection)
        
        # Return without password
        connection.pop("password")
        return connection
    
    @staticmethod
    async def list_connections(org_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all database connections"""
        query = {"org_id": org_id} if org_id else {}
        connections = await db.database_connections.find(
            query, 
            {"_id": 0, "password": 0}
        ).to_list(100)
        return connections
    
    @staticmethod
    async def get_connection(conn_id: str) -> Optional[Dict[str, Any]]:
        """Get connection by ID"""
        return await db.database_connections.find_one(
            {"id": conn_id}, 
            {"_id": 0, "password": 0}
        )
    
    @staticmethod
    async def test_connection(conn_id: str) -> Dict[str, Any]:
        """Test database connection"""
        conn = await db.database_connections.find_one({"id": conn_id})
        if not conn:
            raise ValueError("Connection not found")
        
        conn_type = conn["type"]
        
        try:
            if conn_type == "postgresql":
                pool = await create_postgres_pool(
                    conn["host"], conn["port"], conn["database"],
                    conn["username"], conn["password"]
                )
                async with pool.acquire() as connection:
                    result = await connection.fetchval("SELECT 1")
                await pool.close()
                
            elif conn_type == "mysql":
                pool = await create_mysql_pool(
                    conn["host"], conn["port"], conn["database"],
                    conn["username"], conn["password"]
                )
                async with pool.acquire() as connection:
                    async with connection.cursor() as cursor:
                        await cursor.execute("SELECT 1")
                        result = await cursor.fetchone()
                pool.close()
                await pool.wait_closed()
                
            else:
                raise ValueError(f"Unsupported connection type: {conn_type}")
            
            # Update status
            await db.database_connections.update_one(
                {"id": conn_id},
                {"$set": {"status": "connected", "last_tested": datetime.now(timezone.utc).isoformat()}}
            )
            
            return {"status": "success", "message": "Connection successful"}
            
        except Exception as e:
            await db.database_connections.update_one(
                {"id": conn_id},
                {"$set": {"status": "error", "last_error": str(e)}}
            )
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    async def sync_connection(conn_id: str, table_name: Optional[str] = None) -> Dict[str, Any]:
        """Sync data from external database"""
        conn = await db.database_connections.find_one({"id": conn_id})
        if not conn:
            raise ValueError("Connection not found")
        
        conn_type = conn["type"]
        synced_datasets = []
        
        try:
            if conn_type == "postgresql":
                synced_datasets = await ConnectionService._sync_postgresql(conn, table_name)
            elif conn_type == "mysql":
                synced_datasets = await ConnectionService._sync_mysql(conn, table_name)
            else:
                raise ValueError(f"Unsupported connection type: {conn_type}")
            
            # Update last sync time
            await db.database_connections.update_one(
                {"id": conn_id},
                {"$set": {"last_synced": datetime.now(timezone.utc).isoformat()}}
            )
            
            return {
                "status": "success",
                "datasets_synced": len(synced_datasets),
                "datasets": synced_datasets
            }
            
        except Exception as e:
            logger.error(f"Sync error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    async def _sync_postgresql(conn: Dict, table_name: Optional[str] = None) -> List[Dict]:
        """Sync data from PostgreSQL"""
        import pandas as pd
        
        pool = await create_postgres_pool(
            conn["host"], conn["port"], conn["database"],
            conn["username"], conn["password"]
        )
        
        synced = []
        
        try:
            async with pool.acquire() as connection:
                # Get tables
                if table_name:
                    tables = [{"table_name": table_name}]
                else:
                    tables = await connection.fetch("""
                        SELECT table_name FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                    """)
                
                for table in tables:
                    tbl_name = table["table_name"]
                    
                    # Get columns
                    columns = await connection.fetch(f"""
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = '{tbl_name}'
                    """)
                    
                    # Get data
                    rows = await connection.fetch(f"SELECT * FROM {tbl_name} LIMIT 10000")
                    
                    if rows:
                        # Create dataset
                        dataset_id = str(uuid.uuid4())
                        source_id = str(uuid.uuid4())
                        
                        # Create source
                        await db.data_sources.insert_one({
                            "id": source_id,
                            "name": f"PostgreSQL: {tbl_name}",
                            "type": "postgresql",
                            "connection_id": conn["id"],
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
                        
                        # Create dataset
                        col_info = [{"name": c["column_name"], "type": c["data_type"]} for c in columns]
                        await db.datasets.insert_one({
                            "id": dataset_id,
                            "name": tbl_name,
                            "source_id": source_id,
                            "columns": col_info,
                            "row_count": len(rows),
                            "connection_id": conn["id"],
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
                        
                        # Insert data
                        records = [dict(r) for r in rows]
                        for i, record in enumerate(records):
                            record["dataset_id"] = dataset_id
                            record["_dataset_row_id"] = i
                        await db.dataset_data.insert_many(records)
                        
                        synced.append({
                            "id": dataset_id,
                            "name": tbl_name,
                            "row_count": len(rows)
                        })
        finally:
            await pool.close()
        
        return synced
    
    @staticmethod
    async def _sync_mysql(conn: Dict, table_name: Optional[str] = None) -> List[Dict]:
        """Sync data from MySQL"""
        pool = await create_mysql_pool(
            conn["host"], conn["port"], conn["database"],
            conn["username"], conn["password"]
        )
        
        synced = []
        
        try:
            async with pool.acquire() as connection:
                async with connection.cursor(aiomysql.DictCursor) as cursor:
                    # Get tables
                    if table_name:
                        tables = [{"table_name": table_name}]
                    else:
                        await cursor.execute("SHOW TABLES")
                        tables_raw = await cursor.fetchall()
                        tables = [{"table_name": list(t.values())[0]} for t in tables_raw]
                    
                    for table in tables:
                        tbl_name = table["table_name"]
                        
                        # Get columns
                        await cursor.execute(f"DESCRIBE {tbl_name}")
                        columns = await cursor.fetchall()
                        
                        # Get data
                        await cursor.execute(f"SELECT * FROM {tbl_name} LIMIT 10000")
                        rows = await cursor.fetchall()
                        
                        if rows:
                            dataset_id = str(uuid.uuid4())
                            source_id = str(uuid.uuid4())
                            
                            await db.data_sources.insert_one({
                                "id": source_id,
                                "name": f"MySQL: {tbl_name}",
                                "type": "mysql",
                                "connection_id": conn["id"],
                                "created_at": datetime.now(timezone.utc).isoformat()
                            })
                            
                            col_info = [{"name": c["Field"], "type": c["Type"]} for c in columns]
                            await db.datasets.insert_one({
                                "id": dataset_id,
                                "name": tbl_name,
                                "source_id": source_id,
                                "columns": col_info,
                                "row_count": len(rows),
                                "connection_id": conn["id"],
                                "created_at": datetime.now(timezone.utc).isoformat()
                            })
                            
                            for i, record in enumerate(rows):
                                record["dataset_id"] = dataset_id
                                record["_dataset_row_id"] = i
                            await db.dataset_data.insert_many(rows)
                            
                            synced.append({
                                "id": dataset_id,
                                "name": tbl_name,
                                "row_count": len(rows)
                            })
        finally:
            pool.close()
            await pool.wait_closed()
        
        return synced
    
    @staticmethod
    async def list_tables(conn_id: str) -> List[Dict[str, Any]]:
        """List tables in external database"""
        conn = await db.database_connections.find_one({"id": conn_id})
        if not conn:
            raise ValueError("Connection not found")
        
        tables = []
        
        try:
            if conn["type"] == "postgresql":
                pool = await create_postgres_pool(
                    conn["host"], conn["port"], conn["database"],
                    conn["username"], conn["password"]
                )
                async with pool.acquire() as connection:
                    result = await connection.fetch("""
                        SELECT table_name FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                    """)
                    tables = [{"name": r["table_name"]} for r in result]
                await pool.close()
                
            elif conn["type"] == "mysql":
                pool = await create_mysql_pool(
                    conn["host"], conn["port"], conn["database"],
                    conn["username"], conn["password"]
                )
                async with pool.acquire() as connection:
                    async with connection.cursor(aiomysql.DictCursor) as cursor:
                        await cursor.execute("SHOW TABLES")
                        result = await cursor.fetchall()
                        tables = [{"name": list(r.values())[0]} for r in result]
                pool.close()
                await pool.wait_closed()
        except Exception as e:
            logger.error(f"List tables error: {str(e)}")
            raise
        
        return tables
    
    @staticmethod
    async def delete_connection(conn_id: str) -> bool:
        """Delete database connection"""
        # Remove any scheduled jobs
        remove_job(f"sync_{conn_id}")
        
        result = await db.database_connections.delete_one({"id": conn_id})
        return result.deleted_count > 0
    
    @staticmethod
    async def set_schedule(
        conn_id: str,
        interval_type: str,
        interval_hours: int = 1,
        cron_expression: Optional[str] = None,
        enabled: bool = True
    ) -> Dict[str, Any]:
        """Set refresh schedule for connection"""
        conn = await db.database_connections.find_one({"id": conn_id})
        if not conn:
            raise ValueError("Connection not found")
        
        job_id = f"sync_{conn_id}"
        
        # Remove existing job
        remove_job(job_id)
        
        if enabled:
            # Create sync function
            async def scheduled_sync():
                await ConnectionService.sync_connection(conn_id)
            
            if interval_type == "custom" and cron_expression:
                add_cron_job(job_id, scheduled_sync, cron_expression)
            else:
                hours = {
                    "hourly": 1,
                    "daily": 24,
                    "weekly": 168
                }.get(interval_type, interval_hours)
                add_interval_job(job_id, scheduled_sync, hours=hours)
        
        # Save schedule config
        schedule_config = {
            "interval_type": interval_type,
            "interval_hours": interval_hours,
            "cron_expression": cron_expression,
            "enabled": enabled
        }
        
        await db.database_connections.update_one(
            {"id": conn_id},
            {"$set": {"schedule": schedule_config}}
        )
        
        return schedule_config
    
    @staticmethod
    async def get_schedule(conn_id: str) -> Optional[Dict[str, Any]]:
        """Get schedule for connection"""
        conn = await db.database_connections.find_one(
            {"id": conn_id},
            {"_id": 0, "schedule": 1}
        )
        return conn.get("schedule") if conn else None
    
    @staticmethod
    async def delete_schedule(conn_id: str) -> bool:
        """Delete schedule for connection"""
        remove_job(f"sync_{conn_id}")
        
        result = await db.database_connections.update_one(
            {"id": conn_id},
            {"$unset": {"schedule": ""}}
        )
        return result.modified_count > 0
