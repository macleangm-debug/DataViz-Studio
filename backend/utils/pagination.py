"""
Pagination Utilities for DataViz Studio
Provides cursor-based and offset pagination for large datasets
"""
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from bson import ObjectId
import base64
import json
from datetime import datetime


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=50, ge=1, le=1000, description="Items per page")
    sort_by: Optional[str] = Field(default=None, description="Field to sort by")
    sort_order: str = Field(default="desc", description="Sort order: asc or desc")
    cursor: Optional[str] = Field(default=None, description="Cursor for cursor-based pagination")


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    next_cursor: Optional[str] = None
    prev_cursor: Optional[str] = None


def encode_cursor(data: dict) -> str:
    """Encode cursor data to base64 string"""
    json_str = json.dumps(data, default=str)
    return base64.urlsafe_b64encode(json_str.encode()).decode()


def decode_cursor(cursor: str) -> dict:
    """Decode cursor from base64 string"""
    try:
        json_str = base64.urlsafe_b64decode(cursor.encode()).decode()
        return json.loads(json_str)
    except Exception:
        return {}


async def paginate_mongodb(
    collection,
    query: dict = None,
    params: PaginationParams = None,
    projection: dict = None
) -> PaginatedResponse:
    """
    Paginate MongoDB collection results
    Supports both offset and cursor-based pagination
    """
    if params is None:
        params = PaginationParams()
    
    if query is None:
        query = {}
    
    # Get total count
    total = await collection.count_documents(query)
    
    # Calculate pagination
    total_pages = (total + params.page_size - 1) // params.page_size
    skip = (params.page - 1) * params.page_size
    
    # Build sort
    sort_direction = 1 if params.sort_order == "asc" else -1
    sort_field = params.sort_by or "_id"
    
    # Handle cursor-based pagination
    if params.cursor:
        cursor_data = decode_cursor(params.cursor)
        if cursor_data:
            cursor_value = cursor_data.get("value")
            cursor_id = cursor_data.get("id")
            
            if cursor_value is not None:
                if sort_direction == 1:
                    query["$or"] = [
                        {sort_field: {"$gt": cursor_value}},
                        {sort_field: cursor_value, "_id": {"$gt": ObjectId(cursor_id)}}
                    ]
                else:
                    query["$or"] = [
                        {sort_field: {"$lt": cursor_value}},
                        {sort_field: cursor_value, "_id": {"$lt": ObjectId(cursor_id)}}
                    ]
            skip = 0  # Reset skip for cursor-based pagination
    
    # Execute query
    cursor = collection.find(query, projection)
    cursor = cursor.sort([(sort_field, sort_direction), ("_id", sort_direction)])
    cursor = cursor.skip(skip).limit(params.page_size)
    
    items = await cursor.to_list(length=params.page_size)
    
    # Convert ObjectId to string for JSON serialization
    for item in items:
        if "_id" in item:
            item["_id"] = str(item["_id"])
    
    # Generate cursors
    next_cursor = None
    prev_cursor = None
    
    if items:
        last_item = items[-1]
        first_item = items[0]
        
        if params.page < total_pages:
            next_cursor = encode_cursor({
                "value": last_item.get(sort_field),
                "id": last_item.get("_id") or str(last_item.get("id"))
            })
        
        if params.page > 1:
            prev_cursor = encode_cursor({
                "value": first_item.get(sort_field),
                "id": first_item.get("_id") or str(first_item.get("id")),
                "direction": "prev"
            })
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
        has_next=params.page < total_pages,
        has_prev=params.page > 1,
        next_cursor=next_cursor,
        prev_cursor=prev_cursor
    )


def paginate_list(
    items: List[Any],
    params: PaginationParams = None
) -> PaginatedResponse:
    """
    Paginate a Python list (for in-memory data)
    """
    if params is None:
        params = PaginationParams()
    
    total = len(items)
    total_pages = (total + params.page_size - 1) // params.page_size
    
    # Sort if specified
    if params.sort_by:
        reverse = params.sort_order == "desc"
        try:
            items = sorted(items, key=lambda x: x.get(params.sort_by, ""), reverse=reverse)
        except (TypeError, AttributeError):
            pass
    
    # Slice
    start = (params.page - 1) * params.page_size
    end = start + params.page_size
    page_items = items[start:end]
    
    return PaginatedResponse(
        items=page_items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
        has_next=params.page < total_pages,
        has_prev=params.page > 1
    )


def paginate_dataframe(
    df,
    params: PaginationParams = None
) -> Tuple[Any, PaginatedResponse]:
    """
    Paginate a pandas DataFrame
    Returns (sliced_df, pagination_info)
    """
    import pandas as pd
    
    if params is None:
        params = PaginationParams()
    
    total = len(df)
    total_pages = (total + params.page_size - 1) // params.page_size
    
    # Sort if specified
    if params.sort_by and params.sort_by in df.columns:
        ascending = params.sort_order == "asc"
        df = df.sort_values(by=params.sort_by, ascending=ascending)
    
    # Slice
    start = (params.page - 1) * params.page_size
    end = start + params.page_size
    page_df = df.iloc[start:end]
    
    pagination_info = PaginatedResponse(
        items=[],  # Will be filled by caller
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
        has_next=params.page < total_pages,
        has_prev=params.page > 1
    )
    
    return page_df, pagination_info


class StreamingPaginator:
    """
    Streaming paginator for very large datasets
    Yields pages of data one at a time
    """
    
    def __init__(self, collection, query: dict = None, page_size: int = 1000):
        self.collection = collection
        self.query = query or {}
        self.page_size = page_size
        self.current_page = 0
        self._total = None
    
    async def get_total(self) -> int:
        """Get total count (cached)"""
        if self._total is None:
            self._total = await self.collection.count_documents(self.query)
        return self._total
    
    async def __aiter__(self):
        """Async iterator for streaming pages"""
        total = await self.get_total()
        total_pages = (total + self.page_size - 1) // self.page_size
        
        for page in range(1, total_pages + 1):
            skip = (page - 1) * self.page_size
            cursor = self.collection.find(self.query).skip(skip).limit(self.page_size)
            items = await cursor.to_list(length=self.page_size)
            
            yield {
                "page": page,
                "total_pages": total_pages,
                "items": items,
                "is_last": page == total_pages
            }


# Utility functions for common pagination patterns
def get_pagination_links(
    base_url: str,
    params: PaginationParams,
    total_pages: int
) -> dict:
    """Generate pagination links for API responses"""
    links = {}
    
    if params.page > 1:
        links["first"] = f"{base_url}?page=1&page_size={params.page_size}"
        links["prev"] = f"{base_url}?page={params.page - 1}&page_size={params.page_size}"
    
    if params.page < total_pages:
        links["next"] = f"{base_url}?page={params.page + 1}&page_size={params.page_size}"
        links["last"] = f"{base_url}?page={total_pages}&page_size={params.page_size}"
    
    if params.sort_by:
        for key in links:
            links[key] += f"&sort_by={params.sort_by}&sort_order={params.sort_order}"
    
    return links
