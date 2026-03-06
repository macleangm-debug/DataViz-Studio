"""Dashboard service - handles dashboard CRUD and widgets"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from core.database import db


class DashboardService:
    """Service for dashboard operations"""
    
    @staticmethod
    async def create_dashboard(
        name: str,
        description: str = "",
        layout: List[Dict] = None,
        org_id: Optional[str] = None,
        tags: List[str] = None,
        preview_image: str = None,
        is_favorite: bool = False
    ) -> Dict[str, Any]:
        """Create a new dashboard"""
        dashboard = {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": description,
            "layout": layout or [],
            "org_id": org_id,
            "tags": tags or [],
            "preview_image": preview_image,
            "is_favorite": is_favorite,
            "views": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.dashboards.insert_one(dashboard)
        
        return {
            "id": dashboard["id"],
            "name": dashboard["name"],
            "description": dashboard["description"],
            "layout": dashboard["layout"],
            "tags": dashboard["tags"],
            "preview_image": dashboard["preview_image"],
            "is_favorite": dashboard["is_favorite"],
            "views": dashboard["views"]
        }
    
    @staticmethod
    async def list_dashboards(org_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all dashboards"""
        query = {"org_id": org_id} if org_id else {}
        dashboards = await db.dashboards.find(query, {"_id": 0}).to_list(1000)
        return dashboards
    
    @staticmethod
    async def get_dashboard(dashboard_id: str) -> Optional[Dict[str, Any]]:
        """Get dashboard by ID"""
        return await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})
    
    @staticmethod
    async def update_dashboard(
        dashboard_id: str,
        name: str = None,
        description: str = None,
        layout: List[Dict] = None,
        org_id: Optional[str] = None,
        tags: List[str] = None,
        preview_image: str = None,
        is_favorite: bool = None
    ) -> Optional[Dict[str, Any]]:
        """Update dashboard"""
        update_data = {
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        if layout is not None:
            update_data["layout"] = layout
        if org_id is not None:
            update_data["org_id"] = org_id
        if tags is not None:
            update_data["tags"] = tags
        if preview_image is not None:
            update_data["preview_image"] = preview_image
        if is_favorite is not None:
            update_data["is_favorite"] = is_favorite
        
        result = await db.dashboards.update_one(
            {"id": dashboard_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            return await DashboardService.get_dashboard(dashboard_id)
        return None
    
    @staticmethod
    async def toggle_favorite(dashboard_id: str) -> Optional[Dict[str, Any]]:
        """Toggle dashboard favorite status"""
        dashboard = await DashboardService.get_dashboard(dashboard_id)
        if not dashboard:
            return None
        
        new_favorite = not dashboard.get("is_favorite", False)
        await db.dashboards.update_one(
            {"id": dashboard_id},
            {"$set": {"is_favorite": new_favorite}}
        )
        
        return await DashboardService.get_dashboard(dashboard_id)
    
    @staticmethod
    async def increment_views(dashboard_id: str) -> None:
        """Increment dashboard view count"""
        await db.dashboards.update_one(
            {"id": dashboard_id},
            {"$inc": {"views": 1}}
        )
    
    @staticmethod
    async def update_layout(
        dashboard_id: str,
        layout: List[Dict]
    ) -> Optional[Dict[str, Any]]:
        """Update dashboard layout only"""
        result = await db.dashboards.update_one(
            {"id": dashboard_id},
            {"$set": {
                "layout": layout,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.modified_count > 0:
            return await DashboardService.get_dashboard(dashboard_id)
        return None
    
    @staticmethod
    async def delete_dashboard(dashboard_id: str) -> bool:
        """Delete dashboard and its widgets"""
        await db.widgets.delete_many({"dashboard_id": dashboard_id})
        result = await db.dashboards.delete_one({"id": dashboard_id})
        return result.deleted_count > 0
    
    # Widget operations
    @staticmethod
    async def create_widget(
        dashboard_id: str,
        widget_type: str,
        config: Dict[str, Any],
        position: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a widget in a dashboard"""
        widget = {
            "id": str(uuid.uuid4()),
            "dashboard_id": dashboard_id,
            "type": widget_type,
            "config": config,
            "position": position,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.widgets.insert_one(widget)
        
        return {
            "id": widget["id"],
            "dashboard_id": widget["dashboard_id"],
            "type": widget["type"],
            "config": widget["config"],
            "position": widget["position"]
        }
    
    @staticmethod
    async def get_dashboard_widgets(dashboard_id: str) -> List[Dict[str, Any]]:
        """Get all widgets for a dashboard"""
        widgets = await db.widgets.find(
            {"dashboard_id": dashboard_id},
            {"_id": 0}
        ).to_list(100)
        return widgets
    
    @staticmethod
    async def update_widget(
        widget_id: str,
        widget_type: str,
        config: Dict[str, Any],
        position: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a widget"""
        result = await db.widgets.update_one(
            {"id": widget_id},
            {"$set": {
                "type": widget_type,
                "config": config,
                "position": position,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.modified_count > 0:
            return await db.widgets.find_one({"id": widget_id}, {"_id": 0})
        return None
    
    @staticmethod
    async def delete_widget(widget_id: str) -> bool:
        """Delete a widget"""
        result = await db.widgets.delete_one({"id": widget_id})
        return result.deleted_count > 0
