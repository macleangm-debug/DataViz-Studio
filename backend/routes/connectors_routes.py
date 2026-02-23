"""DataViz Studio - Data Connectors API Routes

Unified API routes for all data source connectors:
- Google Sheets / Google Drive (OAuth)
- AWS S3 (BYOK credentials)
- Salesforce (OAuth)
- HubSpot (OAuth)
- Dropbox (OAuth)
"""

from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging

from connectors.google_connector import GoogleConnector
from connectors.s3_connector import S3Connector
from connectors.salesforce_connector import SalesforceConnector
from connectors.hubspot_connector import HubSpotConnector
from connectors.dropbox_connector import DropboxConnector

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/connectors", tags=["Data Connectors"])


# =============================================================================
# Request/Response Models
# =============================================================================

class GoogleOAuthInitRequest(BaseModel):
    client_id: str
    client_secret: str
    redirect_uri: str
    connector_type: str = "google_sheets"  # google_sheets or google_drive


class GoogleOAuthCallbackRequest(BaseModel):
    code: str
    state: str
    client_id: str
    client_secret: str
    redirect_uri: str


class S3ConnectionRequest(BaseModel):
    name: str
    access_key_id: str
    secret_access_key: str
    region: str = "us-east-1"
    org_id: Optional[str] = None


class S3TestRequest(BaseModel):
    access_key_id: str
    secret_access_key: str
    region: str = "us-east-1"


class ImportSpreadsheetRequest(BaseModel):
    spreadsheet_id: str
    sheet_name: Optional[str] = None
    dataset_name: Optional[str] = None
    org_id: Optional[str] = None


class ImportS3FileRequest(BaseModel):
    bucket: str
    key: str
    dataset_name: Optional[str] = None
    org_id: Optional[str] = None


# =============================================================================
# Helper function to get current user
# =============================================================================

async def get_current_user(request: Request) -> dict:
    """Get current user from JWT token"""
    import jwt
    import os
    
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")
    
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.environ.get("JWT_SECRET", "dataviz-studio-secret")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id") or payload.get("sub")
        return {"id": user_id}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# =============================================================================
# Connection Listing & Management
# =============================================================================

@router.get("")
async def list_connections(
    request: Request,
    connector_type: Optional[str] = None
):
    """List all data connector connections for the current user"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    query = {"user_id": user_id}
    if connector_type:
        query["type"] = connector_type
    
    connections = await db.connector_connections.find(
        query, 
        {"_id": 0, "credentials.secret_access_key": 0, "oauth_config.client_secret": 0}
    ).to_list(100)
    
    # Mask sensitive data
    for conn in connections:
        if "credentials" in conn and "access_key_id" in conn.get("credentials", {}):
            conn["credentials"]["access_key_id"] = conn["credentials"]["access_key_id"][:8] + "****"
    
    return {"connections": connections}


@router.delete("/{connection_id}")
async def delete_connection(connection_id: str, request: Request):
    """Delete a connector connection"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    result = await db.connector_connections.delete_one({
        "id": connection_id,
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    return {"status": "deleted", "connection_id": connection_id}


# =============================================================================
# Google Sheets / Drive OAuth Routes
# =============================================================================

@router.post("/google/oauth/init")
async def google_oauth_init(
    data: GoogleOAuthInitRequest,
    request: Request
):
    """Initialize Google OAuth flow"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = GoogleConnector(db)
    
    result = await connector.get_oauth_url(
        user_id=user_id,
        client_id=data.client_id,
        redirect_uri=data.redirect_uri,
        connector_type=data.connector_type
    )
    
    return result


@router.post("/google/oauth/callback")
async def google_oauth_callback(
    data: GoogleOAuthCallbackRequest,
    request: Request
):
    """Handle Google OAuth callback"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = GoogleConnector(db)
    
    try:
        result = await connector.handle_oauth_callback(
            code=data.code,
            state=data.state,
            client_id=data.client_id,
            client_secret=data.client_secret,
            redirect_uri=data.redirect_uri,
            user_id=user_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/google/{connection_id}/spreadsheets")
async def list_google_spreadsheets(
    connection_id: str,
    request: Request
):
    """List Google Sheets accessible via a connection"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = GoogleConnector(db)
    
    try:
        spreadsheets = await connector.list_spreadsheets(connection_id, user_id)
        return {"spreadsheets": spreadsheets}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/google/{connection_id}/spreadsheet/{spreadsheet_id}")
async def get_spreadsheet_data(
    connection_id: str,
    spreadsheet_id: str,
    request: Request,
    sheet_name: Optional[str] = None
):
    """Get data from a Google Sheet"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = GoogleConnector(db)
    
    try:
        data = await connector.get_spreadsheet_data(
            connection_id, user_id, spreadsheet_id, sheet_name
        )
        return data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/google/{connection_id}/import")
async def import_google_spreadsheet(
    connection_id: str,
    data: ImportSpreadsheetRequest,
    request: Request
):
    """Import a Google Sheet as a dataset"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = GoogleConnector(db)
    
    try:
        result = await connector.import_spreadsheet_as_dataset(
            connection_id=connection_id,
            user_id=user_id,
            spreadsheet_id=data.spreadsheet_id,
            sheet_name=data.sheet_name,
            dataset_name=data.dataset_name,
            org_id=data.org_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/google/{connection_id}/drive")
async def list_google_drive_files(
    connection_id: str,
    request: Request,
    folder_id: Optional[str] = None
):
    """List files in Google Drive"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = GoogleConnector(db)
    
    try:
        files = await connector.list_drive_files(
            connection_id, user_id, folder_id
        )
        return {"files": files}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# AWS S3 BYOK Routes
# =============================================================================

@router.post("/s3/test")
async def test_s3_connection(
    data: S3TestRequest,
    request: Request
):
    """Test AWS S3 credentials before saving"""
    await get_current_user(request)  # Validate auth
    db = request.app.state.db
    
    connector = S3Connector(db)
    
    result = await connector.test_connection(
        access_key_id=data.access_key_id,
        secret_access_key=data.secret_access_key,
        region=data.region
    )
    
    return result


@router.post("/s3/connect")
async def create_s3_connection(
    data: S3ConnectionRequest,
    request: Request
):
    """Create a new S3 connection with user credentials"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = S3Connector(db)
    
    try:
        result = await connector.create_connection(
            user_id=user_id,
            name=data.name,
            access_key_id=data.access_key_id,
            secret_access_key=data.secret_access_key,
            region=data.region,
            org_id=data.org_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/s3/{connection_id}/buckets")
async def list_s3_buckets(
    connection_id: str,
    request: Request
):
    """List S3 buckets for a connection"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = S3Connector(db)
    
    try:
        buckets = await connector.list_buckets(connection_id, user_id)
        return {"buckets": buckets}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/s3/{connection_id}/files")
async def list_s3_files(
    connection_id: str,
    request: Request,
    bucket: str = Query(...),
    prefix: str = Query(default="")
):
    """List files in an S3 bucket"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = S3Connector(db)
    
    try:
        result = await connector.list_files(
            connection_id, user_id, bucket, prefix
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/s3/{connection_id}/preview")
async def preview_s3_file(
    connection_id: str,
    request: Request,
    bucket: str = Query(...),
    key: str = Query(...)
):
    """Preview contents of an S3 file"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = S3Connector(db)
    
    try:
        result = await connector.preview_file(
            connection_id, user_id, bucket, key
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/s3/{connection_id}/import")
async def import_s3_file(
    connection_id: str,
    data: ImportS3FileRequest,
    request: Request
):
    """Import an S3 file as a dataset"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = S3Connector(db)
    
    try:
        result = await connector.import_file_as_dataset(
            connection_id=connection_id,
            user_id=user_id,
            bucket=data.bucket,
            key=data.key,
            dataset_name=data.dataset_name,
            org_id=data.org_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/s3/sources/{source_id}/refresh")
async def refresh_s3_dataset(
    source_id: str,
    request: Request
):
    """Refresh a dataset from its S3 source"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    connector = S3Connector(db)
    
    try:
        result = await connector.refresh_dataset(source_id, user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# Generic Connector Connect Endpoint (for frontend compatibility)
# =============================================================================

class GenericConnectRequest(BaseModel):
    connector_type: str
    name: Optional[str] = None
    config: Dict[str, Any] = {}
    org_id: Optional[str] = None


@router.post("/connect")
async def generic_connect(
    data: GenericConnectRequest,
    request: Request
):
    """Generic connect endpoint that routes to specific connector"""
    user = await get_current_user(request)
    user_id = user.get("id")
    db = request.app.state.db
    
    if data.connector_type == "aws_s3":
        connector = S3Connector(db)
        try:
            result = await connector.create_connection(
                user_id=user_id,
                name=data.name or "AWS S3 Connection",
                access_key_id=data.config.get("access_key_id", ""),
                secret_access_key=data.config.get("secret_access_key", ""),
                region=data.config.get("region", "us-east-1"),
                org_id=data.org_id
            )
            return {"source_id": result["connection_id"], **result}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    elif data.connector_type in ["google_sheets", "google_drive"]:
        # For OAuth connectors, return instructions
        return {
            "status": "oauth_required",
            "message": "This connector requires OAuth. Use the OAuth init endpoint.",
            "endpoint": "/api/connectors/google/oauth/init"
        }
    
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported connector type: {data.connector_type}"
        )
