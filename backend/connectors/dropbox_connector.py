"""Dropbox Connector

OAuth 2.0 flow for connecting user's Dropbox account.
Supports browsing and importing files from Dropbox.
"""

import os
import io
import uuid
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx
import pandas as pd

logger = logging.getLogger(__name__)

# Dropbox OAuth Configuration
DROPBOX_AUTH_URL = "https://www.dropbox.com/oauth2/authorize"
DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token"
DROPBOX_API_URL = "https://api.dropboxapi.com/2"
DROPBOX_CONTENT_URL = "https://content.dropboxapi.com/2"


class DropboxConnector:
    """Dropbox connector with OAuth 2.0"""
    
    def __init__(self, db):
        self.db = db
    
    async def get_oauth_url(
        self, 
        user_id: str, 
        client_id: str, 
        redirect_uri: str
    ) -> Dict[str, str]:
        """Generate OAuth authorization URL for Dropbox"""
        state = str(uuid.uuid4())
        
        # Store OAuth state
        await self.db.oauth_states.insert_one({
            "state": state,
            "user_id": user_id,
            "connector_type": "dropbox",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'token_access_type': 'offline',
            'state': state
        }
        
        auth_url = f"{DROPBOX_AUTH_URL}?{urlencode(params)}"
        
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
        """Exchange authorization code for tokens"""
        # Verify state
        oauth_state = await self.db.oauth_states.find_one({"state": state, "user_id": user_id})
        if not oauth_state:
            raise ValueError("Invalid or expired OAuth state")
        
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            response = await client.post(
                DROPBOX_TOKEN_URL,
                data={
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': redirect_uri
                },
                auth=(client_id, client_secret)
            )
            
            if response.status_code != 200:
                raise ValueError(f"Token exchange failed: {response.text}")
            
            tokens = response.json()
        
        # Get account info
        account_info = await self._get_account_info(tokens.get("access_token"))
        
        # Store connection
        connection_id = str(uuid.uuid4())
        
        connection_doc = {
            "id": connection_id,
            "user_id": user_id,
            "type": "dropbox",
            "name": f"Dropbox - {account_info.get('name', 'Account')}",
            "status": "connected",
            "credentials": {
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "token_type": tokens.get("token_type"),
                "account_id": tokens.get("account_id")
            },
            "oauth_config": {
                "client_id": client_id,
                "client_secret": client_secret
            },
            "account_info": account_info,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_used": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.connector_connections.insert_one(connection_doc)
        
        # Clean up OAuth state
        await self.db.oauth_states.delete_one({"state": state})
        
        return {
            "connection_id": connection_id,
            "type": "dropbox",
            "status": "connected",
            "account_name": account_info.get("name")
        }
    
    async def _get_account_info(self, access_token: str) -> Dict:
        """Get Dropbox account info"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{DROPBOX_API_URL}/users/get_current_account",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "name": data.get("name", {}).get("display_name", "Unknown"),
                        "email": data.get("email", ""),
                        "account_type": data.get("account_type", {}).get(".tag", "")
                    }
        except Exception as e:
            logger.error(f"Failed to get account info: {e}")
        
        return {"name": "Dropbox Account"}
    
    async def _get_access_token(self, connection: Dict) -> str:
        """Get valid access token, refreshing if needed"""
        creds = connection.get("credentials", {})
        oauth_config = connection.get("oauth_config", {})
        
        # Try to refresh token
        if creds.get("refresh_token"):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        DROPBOX_TOKEN_URL,
                        data={
                            'grant_type': 'refresh_token',
                            'refresh_token': creds.get("refresh_token")
                        },
                        auth=(oauth_config.get("client_id"), oauth_config.get("client_secret"))
                    )
                    
                    if response.status_code == 200:
                        tokens = response.json()
                        new_token = tokens.get("access_token")
                        
                        await self.db.connector_connections.update_one(
                            {"id": connection["id"]},
                            {"$set": {
                                "credentials.access_token": new_token,
                                "last_refreshed": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                        return new_token
            except Exception as e:
                logger.error(f"Token refresh failed: {e}")
        
        return creds.get("access_token")
    
    async def list_files(
        self,
        connection_id: str,
        user_id: str,
        path: str = "",
        limit: int = 100
    ) -> Dict[str, Any]:
        """List files and folders in Dropbox"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "dropbox"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        access_token = await self._get_access_token(connection)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{DROPBOX_API_URL}/files/list_folder",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "path": path if path else "",
                        "limit": limit,
                        "recursive": False
                    }
                )
                
                if response.status_code != 200:
                    raise ValueError(f"Failed to list files: {response.text}")
                
                data = response.json()
                entries = data.get("entries", [])
                
                files = []
                folders = []
                
                for entry in entries:
                    tag = entry.get(".tag")
                    name = entry.get("name", "")
                    
                    if tag == "folder":
                        folders.append({
                            "name": name,
                            "path": entry.get("path_display", ""),
                            "type": "folder"
                        })
                    elif tag == "file":
                        file_type = self._get_file_type(name)
                        files.append({
                            "name": name,
                            "path": entry.get("path_display", ""),
                            "type": file_type,
                            "size": entry.get("size", 0),
                            "size_formatted": self._format_size(entry.get("size", 0)),
                            "modified": entry.get("server_modified"),
                            "importable": file_type in ['csv', 'json', 'excel']
                        })
                
                return {
                    "path": path,
                    "folders": folders,
                    "files": files,
                    "has_more": data.get("has_more", False),
                    "cursor": data.get("cursor")
                }
                
        except httpx.HTTPError as e:
            logger.error(f"Dropbox API error: {e}")
            raise ValueError(f"Failed to list files: {e}")
    
    def _get_file_type(self, filename: str) -> str:
        """Determine file type from filename"""
        lower_name = filename.lower()
        if lower_name.endswith('.csv'):
            return 'csv'
        elif lower_name.endswith('.json'):
            return 'json'
        elif lower_name.endswith(('.xlsx', '.xls')):
            return 'excel'
        elif lower_name.endswith(('.txt', '.log')):
            return 'text'
        elif lower_name.endswith(('.png', '.jpg', '.jpeg', '.gif')):
            return 'image'
        elif lower_name.endswith('.pdf'):
            return 'pdf'
        else:
            return 'file'
    
    def _format_size(self, size_bytes: int) -> str:
        """Format file size"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.1f} TB"
    
    async def download_file(
        self,
        connection_id: str,
        user_id: str,
        file_path: str
    ) -> bytes:
        """Download a file from Dropbox"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "dropbox"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        access_token = await self._get_access_token(connection)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{DROPBOX_CONTENT_URL}/files/download",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Dropbox-API-Arg": f'{{"path": "{file_path}"}}'
                    }
                )
                
                if response.status_code != 200:
                    raise ValueError(f"Failed to download file: {response.text}")
                
                return response.content
                
        except httpx.HTTPError as e:
            logger.error(f"Dropbox download error: {e}")
            raise ValueError(f"Failed to download file: {e}")
    
    async def preview_file(
        self,
        connection_id: str,
        user_id: str,
        file_path: str,
        max_rows: int = 100
    ) -> Dict[str, Any]:
        """Preview file contents"""
        file_type = self._get_file_type(file_path)
        if file_type not in ['csv', 'json', 'excel']:
            raise ValueError(f"Cannot preview {file_type} files")
        
        content = await self.download_file(connection_id, user_id, file_path)
        
        try:
            if file_type == 'csv':
                df = pd.read_csv(io.BytesIO(content), nrows=max_rows)
            elif file_type == 'json':
                df = pd.read_json(io.BytesIO(content))
                df = df.head(max_rows)
            elif file_type == 'excel':
                df = pd.read_excel(io.BytesIO(content), nrows=max_rows)
            
            records = df.to_dict(orient='records')
            columns = [{"name": col, "type": str(df[col].dtype)} for col in df.columns]
            
            return {
                "file_name": file_path.split('/')[-1],
                "file_type": file_type,
                "columns": columns,
                "rows": records,
                "row_count": len(records)
            }
            
        except Exception as e:
            logger.error(f"File parsing error: {e}")
            raise ValueError(f"Failed to parse file: {e}")
    
    async def import_file_as_dataset(
        self,
        connection_id: str,
        user_id: str,
        file_path: str,
        dataset_name: Optional[str] = None,
        org_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Import Dropbox file as dataset"""
        file_type = self._get_file_type(file_path)
        if file_type not in ['csv', 'json', 'excel']:
            raise ValueError(f"Cannot import {file_type} files")
        
        content = await self.download_file(connection_id, user_id, file_path)
        
        try:
            if file_type == 'csv':
                df = pd.read_csv(io.BytesIO(content))
            elif file_type == 'json':
                df = pd.read_json(io.BytesIO(content))
            elif file_type == 'excel':
                df = pd.read_excel(io.BytesIO(content))
            
            file_name = file_path.split('/')[-1]
            
            # Create data source
            source_id = str(uuid.uuid4())
            source_doc = {
                "id": source_id,
                "name": dataset_name or file_name,
                "type": "dropbox",
                "config": {
                    "connection_id": connection_id,
                    "file_path": file_path,
                    "file_type": file_type,
                    "columns": list(df.columns),
                    "rows": len(df)
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
            columns = [{"name": col, "type": str(df[col].dtype)} for col in df.columns]
            
            dataset_doc = {
                "id": dataset_id,
                "name": dataset_name or file_name,
                "source_id": source_id,
                "source_type": "dropbox",
                "user_id": user_id,
                "org_id": org_id,
                "row_count": len(df),
                "columns": columns,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await self.db.datasets.insert_one(dataset_doc)
            
            # Store records
            records = df.to_dict(orient='records')
            for record in records:
                record["dataset_id"] = dataset_id
                record["_dataset_row_id"] = str(uuid.uuid4())
            
            if records:
                await self.db.dataset_data.insert_many(records)
            
            # Update connection
            await self.db.connector_connections.update_one(
                {"id": connection_id},
                {"$set": {"last_used": datetime.now(timezone.utc).isoformat()}}
            )
            
            return {
                "source_id": source_id,
                "dataset_id": dataset_id,
                "name": dataset_name or file_name,
                "rows": len(df),
                "columns": list(df.columns)
            }
            
        except Exception as e:
            logger.error(f"Import error: {e}")
            raise ValueError(f"Failed to import file: {e}")
    
    async def disconnect(self, connection_id: str, user_id: str) -> bool:
        """Remove a Dropbox connection"""
        result = await self.db.connector_connections.delete_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "dropbox"
        })
        return result.deleted_count > 0
