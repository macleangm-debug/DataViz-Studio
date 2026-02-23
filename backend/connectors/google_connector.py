"""Google Sheets / Google Drive Connector

OAuth 2.0 flow for connecting user's Google account.
Supports:
- Google Sheets: Read spreadsheet data
- Google Drive: Browse and import files
"""

import os
import json
import uuid
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from urllib.parse import urlencode

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

# OAuth Configuration (users provide their own credentials)
GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
]


class GoogleConnector:
    """Google Sheets and Drive connector with OAuth 2.0"""
    
    def __init__(self, db):
        self.db = db
    
    async def get_oauth_url(
        self, 
        user_id: str, 
        client_id: str, 
        redirect_uri: str,
        connector_type: str = 'google_sheets'
    ) -> Dict[str, str]:
        """Generate OAuth authorization URL for Google"""
        state = str(uuid.uuid4())
        
        # Store OAuth state for verification
        await self.db.oauth_states.insert_one({
            "state": state,
            "user_id": user_id,
            "connector_type": connector_type,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': ' '.join(GOOGLE_SCOPES),
            'access_type': 'offline',
            'prompt': 'consent',
            'state': state
        }
        
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        
        return {
            "auth_url": auth_url,
            "state": state
        }
    
    async def handle_oauth_callback(
        self,
        code: str,
        state: str,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Exchange authorization code for tokens and store connection"""
        import httpx
        
        # Verify state
        oauth_state = await self.db.oauth_states.find_one({"state": state, "user_id": user_id})
        if not oauth_state:
            raise ValueError("Invalid or expired OAuth state")
        
        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data={
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code'
            })
            
            if response.status_code != 200:
                raise ValueError(f"Token exchange failed: {response.text}")
            
            tokens = response.json()
        
        # Store connection with encrypted tokens
        connection_id = str(uuid.uuid4())
        connector_type = oauth_state.get("connector_type", "google_sheets")
        
        connection_doc = {
            "id": connection_id,
            "user_id": user_id,
            "type": connector_type,
            "name": f"Google {connector_type.replace('_', ' ').title()}",
            "status": "connected",
            "credentials": {
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "token_type": tokens.get("token_type"),
                "expires_in": tokens.get("expires_in"),
                "scope": tokens.get("scope")
            },
            "oauth_config": {
                "client_id": client_id,
                "client_secret": client_secret
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_used": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.connector_connections.insert_one(connection_doc)
        
        # Clean up OAuth state
        await self.db.oauth_states.delete_one({"state": state})
        
        return {
            "connection_id": connection_id,
            "type": connector_type,
            "status": "connected"
        }
    
    def _get_credentials(self, connection: Dict) -> Credentials:
        """Build Google credentials from stored tokens"""
        creds_data = connection.get("credentials", {})
        oauth_config = connection.get("oauth_config", {})
        
        return Credentials(
            token=creds_data.get("access_token"),
            refresh_token=creds_data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=oauth_config.get("client_id"),
            client_secret=oauth_config.get("client_secret"),
            scopes=GOOGLE_SCOPES
        )
    
    async def _refresh_token_if_needed(self, connection: Dict) -> Credentials:
        """Refresh access token if expired"""
        creds = self._get_credentials(connection)
        
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                
                # Update stored credentials
                await self.db.connector_connections.update_one(
                    {"id": connection["id"]},
                    {"$set": {
                        "credentials.access_token": creds.token,
                        "last_refreshed": datetime.now(timezone.utc).isoformat()
                    }}
                )
            except Exception as e:
                logger.error(f"Token refresh failed: {e}")
                raise ValueError("Token refresh failed. Please reconnect your Google account.")
        
        return creds
    
    async def list_spreadsheets(self, connection_id: str, user_id: str) -> List[Dict]:
        """List Google Sheets accessible by the user"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id, 
            "user_id": user_id,
            "type": {"$in": ["google_sheets", "google_drive"]}
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        creds = await self._refresh_token_if_needed(connection)
        
        try:
            service = build('drive', 'v3', credentials=creds)
            
            # Query for Google Sheets files
            results = service.files().list(
                q="mimeType='application/vnd.google-apps.spreadsheet'",
                pageSize=50,
                fields="nextPageToken, files(id, name, modifiedTime, owners)"
            ).execute()
            
            files = results.get('files', [])
            
            return [{
                "id": f["id"],
                "name": f["name"],
                "modified_time": f.get("modifiedTime"),
                "owner": f.get("owners", [{}])[0].get("displayName", "Unknown")
            } for f in files]
            
        except HttpError as e:
            logger.error(f"Google API error: {e}")
            raise ValueError(f"Failed to list spreadsheets: {e}")
    
    async def get_spreadsheet_data(
        self, 
        connection_id: str, 
        user_id: str,
        spreadsheet_id: str,
        sheet_name: Optional[str] = None,
        range_notation: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fetch data from a Google Sheet"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id, 
            "user_id": user_id,
            "type": {"$in": ["google_sheets", "google_drive"]}
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        creds = await self._refresh_token_if_needed(connection)
        
        try:
            service = build('sheets', 'v4', credentials=creds)
            
            # Get spreadsheet metadata first
            spreadsheet = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
            sheets = spreadsheet.get('sheets', [])
            sheet_titles = [s['properties']['title'] for s in sheets]
            
            # Determine range to fetch
            target_sheet = sheet_name or sheet_titles[0] if sheet_titles else 'Sheet1'
            data_range = range_notation or f"'{target_sheet}'"
            
            # Fetch values
            result = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=data_range
            ).execute()
            
            values = result.get('values', [])
            
            if not values:
                return {
                    "spreadsheet_name": spreadsheet.get('properties', {}).get('title'),
                    "sheet_name": target_sheet,
                    "sheets": sheet_titles,
                    "columns": [],
                    "rows": [],
                    "row_count": 0
                }
            
            # First row as headers
            headers = values[0] if values else []
            rows = values[1:] if len(values) > 1 else []
            
            # Normalize row lengths
            normalized_rows = []
            for row in rows:
                normalized_row = row + [''] * (len(headers) - len(row))
                normalized_rows.append(dict(zip(headers, normalized_row[:len(headers)])))
            
            return {
                "spreadsheet_name": spreadsheet.get('properties', {}).get('title'),
                "sheet_name": target_sheet,
                "sheets": sheet_titles,
                "columns": headers,
                "rows": normalized_rows,
                "row_count": len(normalized_rows)
            }
            
        except HttpError as e:
            logger.error(f"Google Sheets API error: {e}")
            raise ValueError(f"Failed to fetch spreadsheet data: {e}")
    
    async def import_spreadsheet_as_dataset(
        self,
        connection_id: str,
        user_id: str,
        spreadsheet_id: str,
        sheet_name: Optional[str] = None,
        dataset_name: Optional[str] = None,
        org_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Import Google Sheet as a dataset in DataViz Studio"""
        # Fetch data from Google Sheets
        sheet_data = await self.get_spreadsheet_data(
            connection_id, user_id, spreadsheet_id, sheet_name
        )
        
        if not sheet_data["rows"]:
            raise ValueError("No data found in spreadsheet")
        
        # Create data source record
        source_id = str(uuid.uuid4())
        source_doc = {
            "id": source_id,
            "name": dataset_name or sheet_data["spreadsheet_name"],
            "type": "google_sheets",
            "config": {
                "connection_id": connection_id,
                "spreadsheet_id": spreadsheet_id,
                "sheet_name": sheet_data["sheet_name"],
                "columns": sheet_data["columns"],
                "rows": sheet_data["row_count"]
            },
            "user_id": user_id,
            "org_id": org_id,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_refresh": datetime.now(timezone.utc).isoformat()
        }
        await self.db.data_sources.insert_one(source_doc)
        
        # Create dataset
        dataset_id = str(uuid.uuid4())
        
        # Infer column types
        columns = []
        for col in sheet_data["columns"]:
            # Sample first few values to determine type
            sample_values = [r.get(col) for r in sheet_data["rows"][:10] if r.get(col)]
            col_type = self._infer_column_type(sample_values)
            columns.append({"name": col, "type": col_type})
        
        dataset_doc = {
            "id": dataset_id,
            "name": dataset_name or sheet_data["spreadsheet_name"],
            "source_id": source_id,
            "source_type": "google_sheets",
            "user_id": user_id,
            "org_id": org_id,
            "row_count": sheet_data["row_count"],
            "columns": columns,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.datasets.insert_one(dataset_doc)
        
        # Store data records
        records = []
        for row in sheet_data["rows"]:
            record = dict(row)
            record["dataset_id"] = dataset_id
            record["_dataset_row_id"] = str(uuid.uuid4())
            records.append(record)
        
        if records:
            await self.db.dataset_data.insert_many(records)
        
        # Update last used timestamp
        await self.db.connector_connections.update_one(
            {"id": connection_id},
            {"$set": {"last_used": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {
            "source_id": source_id,
            "dataset_id": dataset_id,
            "name": dataset_name or sheet_data["spreadsheet_name"],
            "rows": sheet_data["row_count"],
            "columns": sheet_data["columns"]
        }
    
    def _infer_column_type(self, values: List) -> str:
        """Infer column type from sample values"""
        if not values:
            return "string"
        
        # Try to detect numeric
        numeric_count = 0
        for v in values:
            try:
                float(str(v).replace(',', ''))
                numeric_count += 1
            except (ValueError, TypeError):
                pass
        
        if numeric_count > len(values) * 0.7:
            return "float64"
        
        return "string"
    
    async def list_drive_files(
        self, 
        connection_id: str, 
        user_id: str,
        folder_id: Optional[str] = None,
        file_types: Optional[List[str]] = None
    ) -> List[Dict]:
        """List files in Google Drive"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id, 
            "user_id": user_id,
            "type": {"$in": ["google_sheets", "google_drive"]}
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        creds = await self._refresh_token_if_needed(connection)
        
        try:
            service = build('drive', 'v3', credentials=creds)
            
            # Build query
            query_parts = []
            if folder_id:
                query_parts.append(f"'{folder_id}' in parents")
            
            if file_types:
                mime_queries = []
                for ft in file_types:
                    if ft == 'spreadsheet':
                        mime_queries.append("mimeType='application/vnd.google-apps.spreadsheet'")
                    elif ft == 'csv':
                        mime_queries.append("mimeType='text/csv'")
                    elif ft == 'folder':
                        mime_queries.append("mimeType='application/vnd.google-apps.folder'")
                if mime_queries:
                    query_parts.append(f"({' or '.join(mime_queries)})")
            
            query = ' and '.join(query_parts) if query_parts else None
            
            results = service.files().list(
                q=query,
                pageSize=100,
                fields="nextPageToken, files(id, name, mimeType, modifiedTime, size, parents)"
            ).execute()
            
            files = results.get('files', [])
            
            return [{
                "id": f["id"],
                "name": f["name"],
                "type": self._get_file_type(f.get("mimeType", "")),
                "mime_type": f.get("mimeType"),
                "modified_time": f.get("modifiedTime"),
                "size": f.get("size"),
                "is_folder": f.get("mimeType") == "application/vnd.google-apps.folder"
            } for f in files]
            
        except HttpError as e:
            logger.error(f"Google Drive API error: {e}")
            raise ValueError(f"Failed to list files: {e}")
    
    def _get_file_type(self, mime_type: str) -> str:
        """Convert MIME type to friendly file type"""
        mime_map = {
            "application/vnd.google-apps.spreadsheet": "spreadsheet",
            "application/vnd.google-apps.document": "document",
            "application/vnd.google-apps.folder": "folder",
            "text/csv": "csv",
            "application/vnd.ms-excel": "excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel"
        }
        return mime_map.get(mime_type, "file")
    
    async def disconnect(self, connection_id: str, user_id: str) -> bool:
        """Remove a Google connection"""
        result = await self.db.connector_connections.delete_one({
            "id": connection_id,
            "user_id": user_id,
            "type": {"$in": ["google_sheets", "google_drive"]}
        })
        return result.deleted_count > 0
