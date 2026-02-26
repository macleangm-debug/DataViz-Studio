"""Database connections router"""
from fastapi import APIRouter, HTTPException
from typing import Optional

from services.connection_service import ConnectionService
from schemas.database import DatabaseConnectionCreate
from schemas.schedule import ScheduleConfig

router = APIRouter(prefix="/database-connections", tags=["Database Connections"])


@router.post("")
async def create_connection(conn: DatabaseConnectionCreate):
    """Create a new database connection"""
    result = await ConnectionService.create_connection(
        name=conn.name,
        conn_type=conn.type,
        host=conn.host,
        port=conn.port,
        database=conn.database,
        username=conn.username,
        password=conn.password,
        org_id=conn.org_id
    )
    return result


@router.get("")
async def list_connections(org_id: Optional[str] = None):
    """List all database connections"""
    connections = await ConnectionService.list_connections(org_id)
    return {"connections": connections}


@router.get("/{conn_id}")
async def get_connection(conn_id: str):
    """Get connection by ID"""
    conn = await ConnectionService.get_connection(conn_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return conn


@router.post("/{conn_id}/test")
async def test_connection(conn_id: str):
    """Test database connection"""
    try:
        result = await ConnectionService.test_connection(conn_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{conn_id}/sync")
async def sync_connection(conn_id: str, table_name: Optional[str] = None):
    """Sync data from external database"""
    try:
        result = await ConnectionService.sync_connection(conn_id, table_name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{conn_id}/tables")
async def list_tables(conn_id: str):
    """List tables in external database"""
    try:
        tables = await ConnectionService.list_tables(conn_id)
        return {"tables": tables}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{conn_id}")
async def delete_connection(conn_id: str):
    """Delete database connection"""
    deleted = await ConnectionService.delete_connection(conn_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"message": "Connection deleted"}


# Schedule endpoints
@router.post("/{conn_id}/schedule")
async def set_schedule(conn_id: str, config: ScheduleConfig):
    """Set refresh schedule for connection"""
    try:
        result = await ConnectionService.set_schedule(
            conn_id=conn_id,
            interval_type=config.interval_type,
            interval_hours=config.interval_hours,
            cron_expression=config.cron_expression,
            enabled=config.enabled
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{conn_id}/schedule")
async def get_schedule(conn_id: str):
    """Get schedule for connection"""
    schedule = await ConnectionService.get_schedule(conn_id)
    if schedule is None:
        return {"schedule": None}
    return {"schedule": schedule}


@router.delete("/{conn_id}/schedule")
async def delete_schedule(conn_id: str):
    """Delete schedule for connection"""
    deleted = await ConnectionService.delete_schedule(conn_id)
    return {"message": "Schedule deleted" if deleted else "No schedule found"}
