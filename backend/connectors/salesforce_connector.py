"""Salesforce Connector

OAuth 2.0 flow for connecting user's Salesforce account.
Supports importing Salesforce objects (Contacts, Leads, Accounts, Opportunities, etc.)
"""

import os
import uuid
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx

logger = logging.getLogger(__name__)

# Salesforce OAuth Configuration
SALESFORCE_AUTH_URL = "https://login.salesforce.com/services/oauth2/authorize"
SALESFORCE_TOKEN_URL = "https://login.salesforce.com/services/oauth2/token"
SALESFORCE_SCOPES = ["api", "refresh_token", "offline_access"]

# Common Salesforce objects that can be imported
SALESFORCE_OBJECTS = [
    {"name": "Contact", "label": "Contacts", "description": "People you do business with"},
    {"name": "Lead", "label": "Leads", "description": "Potential customers"},
    {"name": "Account", "label": "Accounts", "description": "Companies or organizations"},
    {"name": "Opportunity", "label": "Opportunities", "description": "Potential deals"},
    {"name": "Case", "label": "Cases", "description": "Customer support cases"},
    {"name": "Task", "label": "Tasks", "description": "Activities and to-dos"},
    {"name": "Event", "label": "Events", "description": "Calendar events"},
    {"name": "Campaign", "label": "Campaigns", "description": "Marketing campaigns"},
]


class SalesforceConnector:
    """Salesforce connector with OAuth 2.0"""
    
    def __init__(self, db):
        self.db = db
    
    async def get_oauth_url(
        self, 
        user_id: str, 
        client_id: str, 
        redirect_uri: str
    ) -> Dict[str, str]:
        """Generate OAuth authorization URL for Salesforce"""
        state = str(uuid.uuid4())
        
        # Store OAuth state for verification
        await self.db.oauth_states.insert_one({
            "state": state,
            "user_id": user_id,
            "connector_type": "salesforce",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': ' '.join(SALESFORCE_SCOPES),
            'state': state
        }
        
        auth_url = f"{SALESFORCE_AUTH_URL}?{urlencode(params)}"
        
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
        # Verify state
        oauth_state = await self.db.oauth_states.find_one({"state": state, "user_id": user_id})
        if not oauth_state:
            raise ValueError("Invalid or expired OAuth state")
        
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            response = await client.post(SALESFORCE_TOKEN_URL, data={
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code'
            })
            
            if response.status_code != 200:
                raise ValueError(f"Token exchange failed: {response.text}")
            
            tokens = response.json()
        
        # Get user info from Salesforce
        instance_url = tokens.get("instance_url", "")
        
        # Store connection
        connection_id = str(uuid.uuid4())
        
        connection_doc = {
            "id": connection_id,
            "user_id": user_id,
            "type": "salesforce",
            "name": "Salesforce",
            "status": "connected",
            "credentials": {
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "instance_url": instance_url,
                "token_type": tokens.get("token_type"),
                "issued_at": tokens.get("issued_at")
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
            "type": "salesforce",
            "status": "connected",
            "instance_url": instance_url
        }
    
    async def _get_access_token(self, connection: Dict) -> str:
        """Get valid access token, refreshing if needed"""
        creds = connection.get("credentials", {})
        oauth_config = connection.get("oauth_config", {})
        
        # Try to refresh token
        async with httpx.AsyncClient() as client:
            response = await client.post(SALESFORCE_TOKEN_URL, data={
                'grant_type': 'refresh_token',
                'refresh_token': creds.get("refresh_token"),
                'client_id': oauth_config.get("client_id"),
                'client_secret': oauth_config.get("client_secret")
            })
            
            if response.status_code == 200:
                tokens = response.json()
                new_token = tokens.get("access_token")
                
                # Update stored token
                await self.db.connector_connections.update_one(
                    {"id": connection["id"]},
                    {"$set": {
                        "credentials.access_token": new_token,
                        "last_refreshed": datetime.now(timezone.utc).isoformat()
                    }}
                )
                return new_token
            
        return creds.get("access_token")
    
    async def list_objects(self, connection_id: str, user_id: str) -> List[Dict]:
        """List available Salesforce objects"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "salesforce"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        # Return predefined common objects
        return SALESFORCE_OBJECTS
    
    async def get_object_fields(
        self, 
        connection_id: str, 
        user_id: str,
        object_name: str
    ) -> List[Dict]:
        """Get fields for a Salesforce object"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "salesforce"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        creds = connection.get("credentials", {})
        instance_url = creds.get("instance_url")
        access_token = await self._get_access_token(connection)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{instance_url}/services/data/v59.0/sobjects/{object_name}/describe",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code != 200:
                    raise ValueError(f"Failed to get object fields: {response.text}")
                
                data = response.json()
                fields = data.get("fields", [])
                
                return [{
                    "name": f["name"],
                    "label": f["label"],
                    "type": f["type"],
                    "length": f.get("length"),
                    "filterable": f.get("filterable", False)
                } for f in fields]
                
        except httpx.HTTPError as e:
            logger.error(f"Salesforce API error: {e}")
            raise ValueError(f"Failed to fetch object fields: {e}")
    
    async def query_object(
        self,
        connection_id: str,
        user_id: str,
        object_name: str,
        fields: Optional[List[str]] = None,
        limit: int = 1000
    ) -> Dict[str, Any]:
        """Query records from a Salesforce object"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "salesforce"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        creds = connection.get("credentials", {})
        instance_url = creds.get("instance_url")
        access_token = await self._get_access_token(connection)
        
        # If no fields specified, get common fields
        if not fields:
            fields = ["Id", "Name", "CreatedDate", "LastModifiedDate"]
        
        # Build SOQL query
        field_list = ", ".join(fields)
        soql = f"SELECT {field_list} FROM {object_name} LIMIT {limit}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{instance_url}/services/data/v59.0/query",
                    params={"q": soql},
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code != 200:
                    raise ValueError(f"Query failed: {response.text}")
                
                data = response.json()
                records = data.get("records", [])
                
                # Clean up records (remove attributes)
                cleaned_records = []
                for record in records:
                    cleaned = {k: v for k, v in record.items() if k != "attributes"}
                    cleaned_records.append(cleaned)
                
                return {
                    "object_name": object_name,
                    "total_size": data.get("totalSize", 0),
                    "records": cleaned_records,
                    "columns": fields
                }
                
        except httpx.HTTPError as e:
            logger.error(f"Salesforce query error: {e}")
            raise ValueError(f"Failed to query Salesforce: {e}")
    
    async def import_object_as_dataset(
        self,
        connection_id: str,
        user_id: str,
        object_name: str,
        fields: Optional[List[str]] = None,
        dataset_name: Optional[str] = None,
        org_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Import Salesforce object as a dataset"""
        # Query the object
        query_result = await self.query_object(
            connection_id, user_id, object_name, fields
        )
        
        if not query_result["records"]:
            raise ValueError(f"No records found in {object_name}")
        
        # Create data source
        source_id = str(uuid.uuid4())
        source_doc = {
            "id": source_id,
            "name": dataset_name or f"Salesforce - {object_name}",
            "type": "salesforce",
            "config": {
                "connection_id": connection_id,
                "object_name": object_name,
                "fields": query_result["columns"],
                "rows": len(query_result["records"])
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
        sample_record = query_result["records"][0] if query_result["records"] else {}
        for col in query_result["columns"]:
            value = sample_record.get(col)
            col_type = "string"
            if isinstance(value, bool):
                col_type = "boolean"
            elif isinstance(value, (int, float)):
                col_type = "number"
            columns.append({"name": col, "type": col_type})
        
        dataset_doc = {
            "id": dataset_id,
            "name": dataset_name or f"Salesforce - {object_name}",
            "source_id": source_id,
            "source_type": "salesforce",
            "user_id": user_id,
            "org_id": org_id,
            "row_count": len(query_result["records"]),
            "columns": columns,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.datasets.insert_one(dataset_doc)
        
        # Store records
        records = []
        for record in query_result["records"]:
            record["dataset_id"] = dataset_id
            record["_dataset_row_id"] = str(uuid.uuid4())
            records.append(record)
        
        if records:
            await self.db.dataset_data.insert_many(records)
        
        # Update connection last used
        await self.db.connector_connections.update_one(
            {"id": connection_id},
            {"$set": {"last_used": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {
            "source_id": source_id,
            "dataset_id": dataset_id,
            "name": dataset_name or f"Salesforce - {object_name}",
            "rows": len(query_result["records"]),
            "columns": query_result["columns"]
        }
    
    async def disconnect(self, connection_id: str, user_id: str) -> bool:
        """Remove a Salesforce connection"""
        result = await self.db.connector_connections.delete_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "salesforce"
        })
        return result.deleted_count > 0
