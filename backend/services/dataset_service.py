"""Dataset service - handles data upload, transformation, and statistics"""
import uuid
import pandas as pd
import io
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from core.database import db
from models.dataset import TransformRequest


class DatasetService:
    """Service for dataset operations"""
    
    @staticmethod
    async def create_from_upload(
        file_content: bytes,
        filename: str,
        name: str,
        org_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create dataset from uploaded file"""
        # Determine file type and parse
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file_content))
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(file_content))
        elif filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(file_content))
        else:
            raise ValueError("Unsupported file format")
        
        # Create data source
        source_id = str(uuid.uuid4())
        source = {
            "id": source_id,
            "name": filename,
            "type": filename.split('.')[-1],
            "org_id": org_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.data_sources.insert_one(source)
        
        # Create dataset
        dataset_id = str(uuid.uuid4())
        columns = [
            {"name": col, "type": str(df[col].dtype)}
            for col in df.columns
        ]
        
        dataset = {
            "id": dataset_id,
            "name": name or filename.rsplit('.', 1)[0],
            "source_id": source_id,
            "columns": columns,
            "row_count": len(df),
            "org_id": org_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.datasets.insert_one(dataset)
        
        # Store data rows
        records = df.to_dict(orient='records')
        if records:
            for i, record in enumerate(records):
                record["dataset_id"] = dataset_id
                record["_dataset_row_id"] = i
            await db.dataset_data.insert_many(records)
        
        return {
            "id": dataset_id,
            "name": dataset["name"],
            "columns": columns,
            "row_count": len(df),
            "source_id": source_id
        }
    
    @staticmethod
    async def list_datasets(org_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all datasets"""
        query = {"org_id": org_id} if org_id else {}
        datasets = await db.datasets.find(query, {"_id": 0}).to_list(1000)
        return datasets
    
    @staticmethod
    async def get_dataset(dataset_id: str) -> Optional[Dict[str, Any]]:
        """Get dataset by ID"""
        return await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
    
    @staticmethod
    async def get_dataset_data(
        dataset_id: str,
        limit: int = 1000,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get dataset data rows"""
        data = await db.dataset_data.find(
            {"dataset_id": dataset_id},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).skip(offset).limit(limit).to_list(limit)
        return data
    
    @staticmethod
    async def get_dataset_stats(dataset_id: str) -> Dict[str, Any]:
        """Calculate dataset statistics"""
        dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
        if not dataset:
            raise ValueError("Dataset not found")
        
        data = await db.dataset_data.find(
            {"dataset_id": dataset_id},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(10000)
        
        if not data:
            return {"columns": [], "row_count": 0}
        
        df = pd.DataFrame(data)
        stats = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": []
        }
        
        for col in df.columns:
            col_stats = {
                "name": col,
                "type": str(df[col].dtype),
                "null_count": int(df[col].isnull().sum()),
                "unique_count": int(df[col].nunique())
            }
            
            if pd.api.types.is_numeric_dtype(df[col]):
                col_stats.update({
                    "min": float(df[col].min()) if not df[col].isnull().all() else None,
                    "max": float(df[col].max()) if not df[col].isnull().all() else None,
                    "mean": float(df[col].mean()) if not df[col].isnull().all() else None,
                    "std": float(df[col].std()) if not df[col].isnull().all() else None
                })
            
            stats["columns"].append(col_stats)
        
        return stats
    
    @staticmethod
    async def delete_dataset(dataset_id: str) -> bool:
        """Delete dataset and its data"""
        await db.dataset_data.delete_many({"dataset_id": dataset_id})
        result = await db.datasets.delete_one({"id": dataset_id})
        return result.deleted_count > 0
    
    @staticmethod
    async def preview_transformation(
        dataset_id: str,
        steps: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Preview transformation without applying"""
        data = await db.dataset_data.find(
            {"dataset_id": dataset_id},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(10000)
        
        if not data:
            return {"data": [], "row_count": 0, "columns": []}
        
        df = pd.DataFrame(data)
        original_count = len(df)
        
        # Apply each transformation step
        for step in steps:
            if not step.get("enabled", True):
                continue
            
            step_type = step.get("type")
            config = step.get("config", {})
            
            df = DatasetService._apply_transform_step(df, step_type, config)
        
        return {
            "data": df.head(100).to_dict(orient='records'),
            "row_count": len(df),
            "original_count": original_count,
            "columns": [
                {"name": col, "type": str(df[col].dtype)}
                for col in df.columns
            ]
        }
    
    @staticmethod
    async def apply_transformation(
        dataset_id: str,
        steps: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Apply transformation and save"""
        data = await db.dataset_data.find(
            {"dataset_id": dataset_id},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(10000)
        
        if not data:
            raise ValueError("No data found")
        
        df = pd.DataFrame(data)
        
        # Apply each transformation step
        for step in steps:
            if not step.get("enabled", True):
                continue
            
            step_type = step.get("type")
            config = step.get("config", {})
            
            df = DatasetService._apply_transform_step(df, step_type, config)
        
        # Delete old data and insert new
        await db.dataset_data.delete_many({"dataset_id": dataset_id})
        
        records = df.to_dict(orient='records')
        for i, record in enumerate(records):
            record["dataset_id"] = dataset_id
            record["_dataset_row_id"] = i
        
        if records:
            await db.dataset_data.insert_many(records)
        
        # Update dataset metadata
        columns = [
            {"name": col, "type": str(df[col].dtype)}
            for col in df.columns
        ]
        await db.datasets.update_one(
            {"id": dataset_id},
            {"$set": {"columns": columns, "row_count": len(df)}}
        )
        
        return {
            "row_count": len(df),
            "columns": columns,
            "message": "Transformation applied successfully"
        }
    
    @staticmethod
    def _apply_transform_step(df: pd.DataFrame, step_type: str, config: dict) -> pd.DataFrame:
        """Apply a single transformation step"""
        if step_type == "filter":
            column = config.get("column")
            operator = config.get("operator")
            value = config.get("value")
            
            if column and operator and column in df.columns:
                if operator == "equals":
                    df = df[df[column] == value]
                elif operator == "not_equals":
                    df = df[df[column] != value]
                elif operator == "greater_than":
                    df = df[df[column] > float(value)]
                elif operator == "less_than":
                    df = df[df[column] < float(value)]
                elif operator == "contains":
                    df = df[df[column].astype(str).str.contains(str(value), na=False)]
                elif operator == "not_contains":
                    df = df[~df[column].astype(str).str.contains(str(value), na=False)]
                elif operator == "is_null":
                    df = df[df[column].isnull()]
                elif operator == "is_not_null":
                    df = df[df[column].notnull()]
        
        elif step_type == "rename":
            old_name = config.get("old_name")
            new_name = config.get("new_name")
            if old_name and new_name and old_name in df.columns:
                df = df.rename(columns={old_name: new_name})
        
        elif step_type == "drop_column":
            column = config.get("column")
            if column and column in df.columns:
                df = df.drop(columns=[column])
        
        elif step_type == "fill_missing":
            column = config.get("column")
            method = config.get("method", "value")
            value = config.get("value")
            
            if column and column in df.columns:
                if method == "value":
                    df[column] = df[column].fillna(value)
                elif method == "mean":
                    df[column] = df[column].fillna(df[column].mean())
                elif method == "median":
                    df[column] = df[column].fillna(df[column].median())
                elif method == "mode":
                    mode_val = df[column].mode()
                    if len(mode_val) > 0:
                        df[column] = df[column].fillna(mode_val[0])
                elif method == "forward":
                    df[column] = df[column].ffill()
                elif method == "backward":
                    df[column] = df[column].bfill()
                elif method == "drop":
                    df = df.dropna(subset=[column])
        
        elif step_type == "sort":
            column = config.get("column")
            ascending = config.get("ascending", True)
            if column and column in df.columns:
                df = df.sort_values(by=column, ascending=ascending)
        
        elif step_type == "change_type":
            column = config.get("column")
            new_type = config.get("new_type")
            if column and new_type and column in df.columns:
                try:
                    if new_type == "string":
                        df[column] = df[column].astype(str)
                    elif new_type == "int":
                        df[column] = pd.to_numeric(df[column], errors='coerce').astype('Int64')
                    elif new_type == "float":
                        df[column] = pd.to_numeric(df[column], errors='coerce')
                    elif new_type == "date":
                        df[column] = pd.to_datetime(df[column], errors='coerce')
                    elif new_type == "bool":
                        df[column] = df[column].astype(bool)
                except Exception:
                    pass
        
        elif step_type == "calculate":
            new_column = config.get("new_column")
            formula = config.get("formula")
            if new_column and formula:
                try:
                    # Simple formula evaluation (be careful with security)
                    df[new_column] = df.eval(formula)
                except Exception:
                    pass
        
        return df
