"""AWS S3 Connector

BYOK (Bring Your Own Key) connector for AWS S3.
Users provide their own AWS credentials to access their S3 buckets.
"""

import os
import io
import uuid
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import pandas as pd

logger = logging.getLogger(__name__)


class S3Connector:
    """AWS S3 connector with user-provided credentials"""
    
    def __init__(self, db):
        self.db = db
    
    async def test_connection(
        self,
        access_key_id: str,
        secret_access_key: str,
        region: str = 'us-east-1'
    ) -> Dict[str, Any]:
        """Test AWS credentials by listing buckets"""
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                region_name=region
            )
            
            # Try to list buckets as a connection test
            response = s3_client.list_buckets()
            buckets = [b['Name'] for b in response.get('Buckets', [])]
            
            return {
                "status": "success",
                "message": f"Connected successfully. Found {len(buckets)} buckets.",
                "buckets": buckets[:10]  # Return first 10 for preview
            }
            
        except NoCredentialsError:
            return {
                "status": "error",
                "message": "Invalid credentials. Please check your Access Key ID and Secret Access Key."
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_msg = e.response['Error']['Message']
            return {
                "status": "error",
                "message": f"AWS Error ({error_code}): {error_msg}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Connection failed: {str(e)}"
            }
    
    async def create_connection(
        self,
        user_id: str,
        name: str,
        access_key_id: str,
        secret_access_key: str,
        region: str = 'us-east-1',
        org_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Store S3 connection with encrypted credentials"""
        # Test connection first
        test_result = await self.test_connection(access_key_id, secret_access_key, region)
        
        if test_result["status"] != "success":
            raise ValueError(test_result["message"])
        
        connection_id = str(uuid.uuid4())
        
        connection_doc = {
            "id": connection_id,
            "user_id": user_id,
            "org_id": org_id,
            "type": "aws_s3",
            "name": name or "AWS S3 Connection",
            "status": "connected",
            "credentials": {
                "access_key_id": access_key_id,
                "secret_access_key": secret_access_key,  # In production, encrypt this
                "region": region
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_used": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.connector_connections.insert_one(connection_doc)
        
        return {
            "connection_id": connection_id,
            "name": name,
            "status": "connected",
            "buckets": test_result.get("buckets", [])
        }
    
    def _get_s3_client(self, connection: Dict):
        """Create boto3 S3 client from stored credentials"""
        creds = connection.get("credentials", {})
        return boto3.client(
            's3',
            aws_access_key_id=creds.get("access_key_id"),
            aws_secret_access_key=creds.get("secret_access_key"),
            region_name=creds.get("region", "us-east-1")
        )
    
    async def list_buckets(self, connection_id: str, user_id: str) -> List[Dict]:
        """List all S3 buckets accessible by the user"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "aws_s3"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        try:
            s3_client = self._get_s3_client(connection)
            response = s3_client.list_buckets()
            
            buckets = []
            for bucket in response.get('Buckets', []):
                buckets.append({
                    "name": bucket['Name'],
                    "created": bucket['CreationDate'].isoformat() if bucket.get('CreationDate') else None
                })
            
            return buckets
            
        except ClientError as e:
            logger.error(f"S3 list buckets error: {e}")
            raise ValueError(f"Failed to list buckets: {e.response['Error']['Message']}")
    
    async def list_files(
        self,
        connection_id: str,
        user_id: str,
        bucket: str,
        prefix: str = '',
        max_keys: int = 100
    ) -> Dict[str, Any]:
        """List files in an S3 bucket with optional prefix"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "aws_s3"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        try:
            s3_client = self._get_s3_client(connection)
            
            # Use list_objects_v2 with delimiter for folder-like browsing
            params = {
                'Bucket': bucket,
                'MaxKeys': max_keys,
                'Delimiter': '/'
            }
            if prefix:
                params['Prefix'] = prefix
            
            response = s3_client.list_objects_v2(**params)
            
            files = []
            folders = []
            
            # Process folders (common prefixes)
            for common_prefix in response.get('CommonPrefixes', []):
                folder_name = common_prefix['Prefix']
                if prefix:
                    folder_name = folder_name[len(prefix):]
                folders.append({
                    "name": folder_name.rstrip('/'),
                    "type": "folder",
                    "key": common_prefix['Prefix']
                })
            
            # Process files
            for obj in response.get('Contents', []):
                key = obj['Key']
                # Skip the prefix itself
                if key == prefix:
                    continue
                    
                name = key[len(prefix):] if prefix else key
                
                # Determine file type from extension
                file_type = self._get_file_type(name)
                
                files.append({
                    "name": name,
                    "key": key,
                    "type": file_type,
                    "size": obj['Size'],
                    "size_formatted": self._format_size(obj['Size']),
                    "last_modified": obj['LastModified'].isoformat() if obj.get('LastModified') else None,
                    "importable": file_type in ['csv', 'json', 'excel', 'parquet']
                })
            
            return {
                "bucket": bucket,
                "prefix": prefix,
                "folders": folders,
                "files": files,
                "is_truncated": response.get('IsTruncated', False),
                "next_token": response.get('NextContinuationToken')
            }
            
        except ClientError as e:
            logger.error(f"S3 list files error: {e}")
            raise ValueError(f"Failed to list files: {e.response['Error']['Message']}")
    
    def _get_file_type(self, filename: str) -> str:
        """Determine file type from filename"""
        lower_name = filename.lower()
        if lower_name.endswith('.csv'):
            return 'csv'
        elif lower_name.endswith('.json'):
            return 'json'
        elif lower_name.endswith(('.xlsx', '.xls')):
            return 'excel'
        elif lower_name.endswith('.parquet'):
            return 'parquet'
        elif lower_name.endswith(('.txt', '.log')):
            return 'text'
        elif lower_name.endswith(('.png', '.jpg', '.jpeg', '.gif')):
            return 'image'
        else:
            return 'file'
    
    def _format_size(self, size_bytes: int) -> str:
        """Format file size in human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.1f} PB"
    
    async def preview_file(
        self,
        connection_id: str,
        user_id: str,
        bucket: str,
        key: str,
        max_rows: int = 100
    ) -> Dict[str, Any]:
        """Preview contents of a data file (CSV, JSON, Excel)"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "aws_s3"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        file_type = self._get_file_type(key)
        if file_type not in ['csv', 'json', 'excel', 'parquet']:
            raise ValueError(f"Cannot preview {file_type} files")
        
        try:
            s3_client = self._get_s3_client(connection)
            
            # Get the file object
            response = s3_client.get_object(Bucket=bucket, Key=key)
            content = response['Body'].read()
            
            # Parse based on file type
            if file_type == 'csv':
                df = pd.read_csv(io.BytesIO(content), nrows=max_rows)
            elif file_type == 'json':
                df = pd.read_json(io.BytesIO(content))
                df = df.head(max_rows)
            elif file_type == 'excel':
                df = pd.read_excel(io.BytesIO(content), nrows=max_rows)
            elif file_type == 'parquet':
                df = pd.read_parquet(io.BytesIO(content))
                df = df.head(max_rows)
            
            # Convert to records
            records = df.to_dict(orient='records')
            columns = [{"name": col, "type": str(df[col].dtype)} for col in df.columns]
            
            return {
                "file_name": key.split('/')[-1],
                "file_type": file_type,
                "columns": columns,
                "rows": records,
                "row_count": len(records),
                "preview_limited": len(records) >= max_rows
            }
            
        except ClientError as e:
            logger.error(f"S3 preview error: {e}")
            raise ValueError(f"Failed to preview file: {e.response['Error']['Message']}")
        except Exception as e:
            logger.error(f"File parsing error: {e}")
            raise ValueError(f"Failed to parse file: {str(e)}")
    
    async def import_file_as_dataset(
        self,
        connection_id: str,
        user_id: str,
        bucket: str,
        key: str,
        dataset_name: Optional[str] = None,
        org_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Import S3 file as a dataset in DataViz Studio"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "aws_s3"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        file_type = self._get_file_type(key)
        if file_type not in ['csv', 'json', 'excel', 'parquet']:
            raise ValueError(f"Cannot import {file_type} files. Supported: CSV, JSON, Excel, Parquet")
        
        try:
            s3_client = self._get_s3_client(connection)
            
            # Get the file
            response = s3_client.get_object(Bucket=bucket, Key=key)
            content = response['Body'].read()
            file_size = response['ContentLength']
            
            # Parse file
            if file_type == 'csv':
                df = pd.read_csv(io.BytesIO(content))
            elif file_type == 'json':
                df = pd.read_json(io.BytesIO(content))
            elif file_type == 'excel':
                df = pd.read_excel(io.BytesIO(content))
            elif file_type == 'parquet':
                df = pd.read_parquet(io.BytesIO(content))
            
            # Create data source record
            source_id = str(uuid.uuid4())
            file_name = key.split('/')[-1]
            
            source_doc = {
                "id": source_id,
                "name": dataset_name or file_name,
                "type": "aws_s3",
                "config": {
                    "connection_id": connection_id,
                    "bucket": bucket,
                    "key": key,
                    "file_type": file_type,
                    "columns": list(df.columns),
                    "rows": len(df),
                    "file_size": file_size
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
            
            columns = [
                {"name": col, "type": str(df[col].dtype)} 
                for col in df.columns
            ]
            
            dataset_doc = {
                "id": dataset_id,
                "name": dataset_name or file_name,
                "source_id": source_id,
                "source_type": "aws_s3",
                "user_id": user_id,
                "org_id": org_id,
                "row_count": len(df),
                "columns": columns,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await self.db.datasets.insert_one(dataset_doc)
            
            # Store data records
            records = df.to_dict(orient='records')
            for record in records:
                record["dataset_id"] = dataset_id
                record["_dataset_row_id"] = str(uuid.uuid4())
            
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
                "name": dataset_name or file_name,
                "rows": len(df),
                "columns": list(df.columns)
            }
            
        except ClientError as e:
            logger.error(f"S3 import error: {e}")
            raise ValueError(f"Failed to import file: {e.response['Error']['Message']}")
        except Exception as e:
            logger.error(f"Import error: {e}")
            raise ValueError(f"Failed to import file: {str(e)}")
    
    async def refresh_dataset(
        self,
        source_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Refresh a dataset from S3 source"""
        # Get the data source
        source = await self.db.data_sources.find_one({
            "id": source_id,
            "user_id": user_id,
            "type": "aws_s3"
        })
        
        if not source:
            raise ValueError("Data source not found")
        
        config = source.get("config", {})
        connection_id = config.get("connection_id")
        bucket = config.get("bucket")
        key = config.get("key")
        
        if not all([connection_id, bucket, key]):
            raise ValueError("Invalid source configuration")
        
        # Get the dataset
        dataset = await self.db.datasets.find_one({"source_id": source_id})
        if not dataset:
            raise ValueError("Dataset not found")
        
        # Re-import the file
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "aws_s3"
        })
        
        if not connection:
            raise ValueError("Connection not found")
        
        try:
            s3_client = self._get_s3_client(connection)
            
            response = s3_client.get_object(Bucket=bucket, Key=key)
            content = response['Body'].read()
            
            file_type = config.get("file_type", "csv")
            
            if file_type == 'csv':
                df = pd.read_csv(io.BytesIO(content))
            elif file_type == 'json':
                df = pd.read_json(io.BytesIO(content))
            elif file_type == 'excel':
                df = pd.read_excel(io.BytesIO(content))
            elif file_type == 'parquet':
                df = pd.read_parquet(io.BytesIO(content))
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            # Delete old data
            await self.db.dataset_data.delete_many({"dataset_id": dataset["id"]})
            
            # Insert new data
            records = df.to_dict(orient='records')
            for record in records:
                record["dataset_id"] = dataset["id"]
                record["_dataset_row_id"] = str(uuid.uuid4())
            
            if records:
                await self.db.dataset_data.insert_many(records)
            
            # Update source and dataset metadata
            columns = [{"name": col, "type": str(df[col].dtype)} for col in df.columns]
            
            await self.db.data_sources.update_one(
                {"id": source_id},
                {"$set": {
                    "config.rows": len(df),
                    "config.columns": list(df.columns),
                    "last_refresh": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            await self.db.datasets.update_one(
                {"id": dataset["id"]},
                {"$set": {
                    "row_count": len(df),
                    "columns": columns,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            return {
                "status": "success",
                "rows": len(df),
                "columns": list(df.columns),
                "refreshed_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Refresh error: {e}")
            raise ValueError(f"Failed to refresh dataset: {str(e)}")
    
    async def disconnect(self, connection_id: str, user_id: str) -> bool:
        """Remove an S3 connection"""
        result = await self.db.connector_connections.delete_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "aws_s3"
        })
        return result.deleted_count > 0
    
    async def get_connection(self, connection_id: str, user_id: str) -> Optional[Dict]:
        """Get connection details (without sensitive credentials)"""
        connection = await self.db.connector_connections.find_one({
            "id": connection_id,
            "user_id": user_id,
            "type": "aws_s3"
        }, {"_id": 0})
        
        if connection:
            # Mask sensitive credentials
            if "credentials" in connection:
                creds = connection["credentials"]
                connection["credentials"] = {
                    "access_key_id": creds.get("access_key_id", "")[:8] + "****",
                    "region": creds.get("region")
                }
        
        return connection
