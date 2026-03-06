"""Chart service - handles chart creation, data queries, and drill-down"""
import uuid
import pandas as pd
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from core.database import db


class ChartService:
    """Service for chart operations"""
    
    @staticmethod
    async def create_chart(
        name: str,
        chart_type: str,
        dataset_id: str,
        config: Dict[str, Any],
        tags: List[str] = None,
        preview_image: str = None,
        is_favorite: bool = False
    ) -> Dict[str, Any]:
        """Create a new chart"""
        chart = {
            "id": str(uuid.uuid4()),
            "name": name,
            "type": chart_type,
            "dataset_id": dataset_id,
            "config": config,
            "tags": tags or [],
            "preview_image": preview_image,
            "is_favorite": is_favorite,
            "views": 0,
            "exports": 0,
            "shares": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.charts.insert_one(chart)
        
        return {
            "id": chart["id"],
            "name": chart["name"],
            "type": chart["type"],
            "dataset_id": chart["dataset_id"],
            "config": chart["config"],
            "tags": chart["tags"],
            "preview_image": chart["preview_image"],
            "is_favorite": chart["is_favorite"],
            "views": chart["views"]
        }
    
    @staticmethod
    async def list_charts(
        org_id: Optional[str] = None,
        dataset_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List charts with optional filters"""
        query = {}
        if dataset_id:
            query["dataset_id"] = dataset_id
        
        charts = await db.charts.find(query, {"_id": 0}).to_list(1000)
        return charts
    
    @staticmethod
    async def get_chart(chart_id: str) -> Optional[Dict[str, Any]]:
        """Get chart by ID"""
        return await db.charts.find_one({"id": chart_id}, {"_id": 0})
    
    @staticmethod
    async def update_chart(
        chart_id: str,
        name: str,
        chart_type: str,
        dataset_id: str,
        config: Dict[str, Any],
        tags: List[str] = None,
        preview_image: str = None,
        is_favorite: bool = None
    ) -> Optional[Dict[str, Any]]:
        """Update chart"""
        update_data = {
            "name": name,
            "type": chart_type,
            "dataset_id": dataset_id,
            "config": config,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Only update optional fields if provided
        if tags is not None:
            update_data["tags"] = tags
        if preview_image is not None:
            update_data["preview_image"] = preview_image
        if is_favorite is not None:
            update_data["is_favorite"] = is_favorite
            
        result = await db.charts.update_one(
            {"id": chart_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return await ChartService.get_chart(chart_id)
        return None
    
    @staticmethod
    async def delete_chart(chart_id: str) -> bool:
        """Delete chart"""
        result = await db.charts.delete_one({"id": chart_id})
        return result.deleted_count > 0
    
    @staticmethod
    async def get_chart_data(chart_id: str) -> Dict[str, Any]:
        """Get aggregated data for chart rendering"""
        chart = await db.charts.find_one({"id": chart_id}, {"_id": 0})
        if not chart:
            raise ValueError("Chart not found")
        
        # Get dataset data
        data = await db.dataset_data.find(
            {"dataset_id": chart["dataset_id"]},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(10000)
        
        if not data:
            return {"chart": chart, "data": []}
        
        df = pd.DataFrame(data)
        config = chart.get("config", {})
        
        # Get x and y fields from config
        x_field = config.get("x_field")
        y_field = config.get("y_field")
        
        chart_data = []
        
        if x_field and x_field in df.columns:
            if y_field and y_field in df.columns:
                # Aggregate by x_field, sum y_field
                grouped = df.groupby(x_field)[y_field].sum().reset_index()
                grouped.columns = ["name", "value"]
            else:
                # Count by x_field
                grouped = df.groupby(x_field).size().reset_index()
                grouped.columns = ["name", "value"]
            
            chart_data = grouped.sort_values('value', ascending=False).to_dict(orient='records')
        
        return {
            "chart": chart,
            "data": chart_data
        }
    
    @staticmethod
    async def drill_down(
        chart_id: str,
        drill_path: List[Dict[str, str]],
        field: str,
        value: str
    ) -> Dict[str, Any]:
        """Perform drill-down on chart data"""
        chart = await db.charts.find_one({"id": chart_id}, {"_id": 0})
        if not chart:
            raise ValueError("Chart not found")
        
        # Get all data
        data = await db.dataset_data.find(
            {"dataset_id": chart["dataset_id"]},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(10000)
        
        if not data:
            return {"data": [], "drill_path": drill_path}
        
        df = pd.DataFrame(data)
        
        # Apply existing drill path filters
        for drill_step in drill_path:
            drill_field = drill_step.get("field")
            drill_value = drill_step.get("value")
            if drill_field and drill_value and drill_field in df.columns:
                df = df[df[drill_field] == drill_value]
        
        # Apply new drill
        if field in df.columns:
            df = df[df[field] == value]
        
        # Update drill path
        new_drill_path = drill_path + [{"field": field, "value": value}]
        
        # Get available next drill options
        config = chart.get("config", {})
        x_field = config.get("x_field")
        y_field = config.get("y_field")
        
        chart_data = []
        if x_field and x_field in df.columns:
            if y_field and y_field in df.columns:
                grouped = df.groupby(x_field)[y_field].sum().reset_index()
                grouped.columns = ["name", "value"]
            else:
                grouped = df.groupby(x_field).size().reset_index()
                grouped.columns = ["name", "value"]
            chart_data = grouped.to_dict(orient='records')
        
        # Find next drill options
        next_options = []
        drilled_fields = [d["field"] for d in new_drill_path]
        for col in df.columns:
            if col not in drilled_fields and col not in ['dataset_id', '_dataset_row_id']:
                unique_values = df[col].nunique()
                if unique_values > 1 and unique_values < 50:
                    next_options.append({
                        "field": col,
                        "unique_values": int(unique_values)
                    })
        
        return {
            "data": chart_data,
            "drill_path": new_drill_path,
            "row_count": len(df),
            "next_options": next_options
        }
    
    @staticmethod
    async def get_drill_options(chart_id: str) -> Dict[str, Any]:
        """Get available drill-down options for a chart"""
        chart = await db.charts.find_one({"id": chart_id}, {"_id": 0})
        if not chart:
            raise ValueError("Chart not found")
        
        data = await db.dataset_data.find(
            {"dataset_id": chart["dataset_id"]},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(10000)
        
        if not data:
            return {"options": []}
        
        df = pd.DataFrame(data)
        
        options = []
        for col in df.columns:
            unique_values = df[col].nunique()
            if unique_values > 1 and unique_values < 50:
                sample_values = df[col].dropna().unique()[:5].tolist()
                options.append({
                    "field": col,
                    "unique_values": int(unique_values),
                    "sample_values": sample_values
                })
        
        return {"options": options}
