"""HubSpot Connector

OAuth 2.0 flow for connecting user's HubSpot account.
Supports importing HubSpot CRM data (Contacts, Companies, Deals, etc.)
"""

import os
import uuid
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx

logger = logging.getLogger(__name__)

# HubSpot OAuth Configuration
HUBSPOT_AUTH_URL = "https://app.hubspot.com/oauth/authorize"
HUBSPOT_TOKEN_URL = "https://api.hubapi.com/oauth/v1/token"
HUBSPOT_API_URL = "https://api.hubapi.com"
HUBSPOT_SCOPES = [
    "crm.objects.contacts.read",
    "crm.objects.companies.read",
    "crm.objects.deals.read",
    "crm.schemas.contacts.read",
    "crm.schemas.companies.read",
    "crm.schemas.deals.read"
]

# Common HubSpot objects
HUBSPOT_OBJECTS = [
    {"name": "contacts", "label": "Contacts", "description": "People in your CRM"},
    {"name": "companies", "label": "Companies", "description": "Organizations in your CRM"},
    {"name": "deals", "label": "Deals", "description": "Sales opportunities"},
    {"name": "tickets", "label": "Tickets", "description": "Support tickets"},
    {"name": "products", "label": "Products", "description": "Product catalog"},
    {"name": "line_items", "label": "Line Items", "description": "Items in deals"},
]


class HubSpotConnector:
    """HubSpot connector with OAuth 2.0"""
    
    def __init__(self, db):
        self.db = db
    
    async def get_oauth_url(
        self, 
        user_id: str, 
        client_id: str, 
        redirect_uri: str
    ) -> Dict[str, str]:
        """Generate OAuth authorization URL for HubSpot"""
        state = str(uuid.uuid4())
        
        # Store OAuth state
        await self.db.oauth_states.insert_one({
            "state": state,
            "user_id": user_id,
            "connector_type": "hubspot",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'scope': ' '.join(HUBSPOT_SCOPES),
            'state': state
        }
        
        auth_url = f"{HUBSPOT_AUTH_URL}?{urlencode(params)}"
        
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
            response = await client.post(HUBSPOT_TOKEN_URL, data={
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code'
            })
            
            if response.status_code != 200:
                raise ValueError(f"Token exchange failed: {response.text}")
            
            tokens = response.json()
        
        # Store connection
        connection_id = str(uuid.uuid4())
        
        connection_doc = {
            "id": connection_id,
            "user_id": user_id,
            "type": "hubspot",
            "name": "HubSpot CRM",
            "status": "connected",
            "credentials": {
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "expires_in": tokens.get("expires_in"),
                "token_type": tokens.get("token_type")
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
            "type": "hubspot",
            "status": "connected"
        }
    
    async def _get_access_token(self, connection: Dict) -> str:
        """Get valid access token, refreshing if needed"""
        creds = connection.get("credentials", {})
        oauth_config = connection.get("oauth_config", {})
        
        # Try to refresh token
        async with httpx.AsyncClient() as client:
            response = await client.post(HUBSPOT_TOKEN_URL, data={
                'grant_type': 'refresh_token',
                'refresh_token': creds.get("refresh_token"),
                'client_id': oauth_config.get("client_id"),
                'client_secret': oauth_config.get("client_secret")
            })
            
            if response.status_code == 200:
                tokens = response.json()
                new_token = tokens.get("access_token")
                
                await self.db.connector_connections.update_one(
                    {"id": connection["id"]},
                    {"$set": {
                        "credentials.access_token": new_token,
                        "credentials.refresh_token": tokens.get("refresh_token", creds.get("refresh_token")),
                        "last_refreshed": datetime.now(timezone.utc).isoformat()
                    }}
                )
                return new_token
        
        return creds.get("access_token")
    
    async def list_objects(self, connection_id: str, user_id: str) -> List[Dict]:
        """List available HubSpot objects"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "hubspot"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        return HUBSPOT_OBJECTS
    
    async def get_object_properties(
        self,
        connection_id: str,
        user_id: str,
        object_type: str
    ) -> List[Dict]:
        """Get properties for a HubSpot object"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "hubspot"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        access_token = await self._get_access_token(connection)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{HUBSPOT_API_URL}/crm/v3/properties/{object_type}",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code != 200:
                    raise ValueError(f"Failed to get properties: {response.text}")
                
                data = response.json()
                properties = data.get("results", [])
                
                return [{
                    "name": p["name"],
                    "label": p["label"],
                    "type": p["type"],
                    "description": p.get("description", "")
                } for p in properties]
                
        except httpx.HTTPError as e:
            logger.error(f"HubSpot API error: {e}")
            raise ValueError(f"Failed to fetch properties: {e}")
    
    async def get_records(
        self,
        connection_id: str,
        user_id: str,
        object_type: str,
        properties: Optional[List[str]] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Get records from a HubSpot object"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "hubspot"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        access_token = await self._get_access_token(connection)
        
        # Default properties if not specified
        if not properties:
            if object_type == "contacts":
                properties = ["email", "firstname", "lastname", "phone", "company", "createdate"]
            elif object_type == "companies":
                properties = ["name", "domain", "industry", "phone", "city", "createdate"]
            elif object_type == "deals":
                properties = ["dealname", "amount", "dealstage", "pipeline", "closedate", "createdate"]
            else:
                properties = ["createdate"]
        
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "limit": min(limit, 100),
                    "properties": ",".join(properties)
                }
                
                response = await client.get(
                    f"{HUBSPOT_API_URL}/crm/v3/objects/{object_type}",
                    params=params,
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code != 200:
                    raise ValueError(f"Failed to get records: {response.text}")
                
                data = response.json()
                results = data.get("results", [])
                
                # Flatten records
                records = []
                for result in results:
                    record = {"id": result["id"]}
                    record.update(result.get("properties", {}))
                    records.append(record)
                
                return {
                    "object_type": object_type,
                    "total": len(records),
                    "records": records,
                    "columns": ["id"] + properties
                }
                
        except httpx.HTTPError as e:
            logger.error(f"HubSpot API error: {e}")
            raise ValueError(f"Failed to fetch records: {e}")
    
    async def import_object_as_dataset(
        self,
        connection_id: str,
        user_id: str,
        object_type: str,
        properties: Optional[List[str]] = None,
        dataset_name: Optional[str] = None,
        org_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Import HubSpot object as a dataset"""
        # Get records
        result = await self.get_records(
            connection_id, user_id, object_type, properties, limit=1000
        )
        
        if not result["records"]:
            raise ValueError(f"No records found in {object_type}")
        
        # Create data source
        source_id = str(uuid.uuid4())
        object_info = next((o for o in HUBSPOT_OBJECTS if o["name"] == object_type), {})
        
        source_doc = {
            "id": source_id,
            "name": dataset_name or f"HubSpot - {object_info.get('label', object_type)}",
            "type": "hubspot",
            "config": {
                "connection_id": connection_id,
                "object_type": object_type,
                "properties": result["columns"],
                "rows": len(result["records"])
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
        
        columns = [{"name": col, "type": "string"} for col in result["columns"]]
        
        dataset_doc = {
            "id": dataset_id,
            "name": dataset_name or f"HubSpot - {object_info.get('label', object_type)}",
            "source_id": source_id,
            "source_type": "hubspot",
            "user_id": user_id,
            "org_id": org_id,
            "row_count": len(result["records"]),
            "columns": columns,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.datasets.insert_one(dataset_doc)
        
        # Store records
        records = []
        for record in result["records"]:
            record["dataset_id"] = dataset_id
            record["_dataset_row_id"] = str(uuid.uuid4())
            records.append(record)
        
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
            "name": dataset_name or f"HubSpot - {object_info.get('label', object_type)}",
            "rows": len(result["records"]),
            "columns": result["columns"]
        }
    
    async def disconnect(self, connection_id: str, user_id: str) -> bool:
        """Remove a HubSpot connection"""
        result = await self.db.connector_connections.delete_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "hubspot"
        })
        return result.deleted_count > 0
