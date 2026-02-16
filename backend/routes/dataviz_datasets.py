"""DataViz Studio - Dataset Routes"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import pandas as pd

router = APIRouter(prefix="/datasets", tags=["Datasets"])


class TransformRequest(BaseModel):
    transformations: List[Dict[str, Any]]


@router.get("")
async def list_datasets(request: Request, org_id: Optional[str] = None):
    """List all datasets"""
    db = request.app.state.db
    
    query = {"org_id": org_id} if org_id else {}
    datasets = await db.datasets.find(query, {"_id": 0}).to_list(100)
    return {"datasets": datasets}


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str, request: Request):
    """Get dataset details"""
    db = request.app.state.db
    
    dataset = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.get("/{dataset_id}/data")
async def get_dataset_data(dataset_id: str, request: Request, page: int = 1, limit: int = 100):
    """Get dataset data with pagination"""
    db = request.app.state.db
    
    dataset = await db.datasets.find_one({"id": dataset_id})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    skip = (page - 1) * limit
    data = await db.dataset_data.find(
        {"dataset_id": dataset_id},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.dataset_data.count_documents({"dataset_id": dataset_id})
    
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/{dataset_id}/stats")
async def get_dataset_stats(dataset_id: str, request: Request):
    """Get basic statistics for a dataset"""
    db = request.app.state.db
    
    dataset = await db.datasets.find_one({"id": dataset_id})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Get all data
    data = await db.dataset_data.find(
        {"dataset_id": dataset_id},
        {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
    ).to_list(10000)
    
    if not data:
        return {"stats": {}, "row_count": 0}
    
    df = pd.DataFrame(data)
    stats = {}
    
    for col in df.columns:
        col_stats = {"name": col, "type": str(df[col].dtype)}
        
        if pd.api.types.is_numeric_dtype(df[col]):
            col_stats.update({
                "min": float(df[col].min()) if not pd.isna(df[col].min()) else None,
                "max": float(df[col].max()) if not pd.isna(df[col].max()) else None,
                "mean": float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
                "std": float(df[col].std()) if not pd.isna(df[col].std()) else None,
                "missing": int(df[col].isna().sum())
            })
        else:
            value_counts = df[col].value_counts().head(10).to_dict()
            col_stats.update({
                "unique": int(df[col].nunique()),
                "top_values": {str(k): int(v) for k, v in value_counts.items()},
                "missing": int(df[col].isna().sum())
            })
        
        stats[col] = col_stats
    
    return {"stats": stats, "row_count": len(df)}


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str, request: Request):
    """Delete a dataset"""
    db = request.app.state.db
    
    await db.datasets.delete_one({"id": dataset_id})
    await db.dataset_data.delete_many({"dataset_id": dataset_id})
    return {"status": "deleted"}


@router.post("/{dataset_id}/transform/preview")
async def preview_transformation(dataset_id: str, transform_request: TransformRequest, request: Request):
    """Preview data transformations without saving"""
    db = request.app.state.db
    
    # Get dataset data
    data_docs = await db.dataset_data.find({"dataset_id": dataset_id}).to_list(1000)
    if not data_docs:
        return {"data": [], "columns": []}
    
    df = pd.DataFrame(data_docs)
    # Remove MongoDB fields
    df = df.drop(columns=["_id", "dataset_id"], errors='ignore')
    
    # Apply transformations
    df = _apply_transformations(df, transform_request.transformations)
    
    # Convert to records
    df = df.reset_index(drop=True)
    data = df.head(100).to_dict('records')
    columns = list(df.columns)
    
    return {"data": data, "columns": columns, "row_count": len(df)}


@router.post("/{dataset_id}/transform/apply")
async def apply_transformation(dataset_id: str, transform_request: TransformRequest, request: Request):
    """Apply and save data transformations"""
    db = request.app.state.db
    
    # Get dataset data
    data_docs = await db.dataset_data.find({"dataset_id": dataset_id}).to_list(100000)
    if not data_docs:
        return {"error": "No data found"}
    
    df = pd.DataFrame(data_docs)
    df = df.drop(columns=["_id", "dataset_id"], errors='ignore')
    
    # Apply transformations
    df = _apply_transformations(df, transform_request.transformations)
    
    # Delete old data
    await db.dataset_data.delete_many({"dataset_id": dataset_id})
    
    # Insert transformed data
    df = df.reset_index(drop=True)
    records = df.to_dict('records')
    for record in records:
        record['dataset_id'] = dataset_id
    
    if records:
        await db.dataset_data.insert_many(records)
    
    # Update dataset metadata
    await db.datasets.update_one(
        {"id": dataset_id},
        {"$set": {
            "columns": list(df.columns),
            "row_count": len(df),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "status": "success",
        "row_count": len(df),
        "columns": list(df.columns)
    }


def _apply_transformations(df: pd.DataFrame, transformations: List[Dict[str, Any]]) -> pd.DataFrame:
    """Apply a list of transformations to a DataFrame"""
    for transform in transformations:
        if not transform.get('enabled', True):
            continue
            
        t_type = transform.get('type')
        config = transform.get('config', {})
        
        try:
            if t_type == 'filter':
                df = _apply_filter(df, config)
            elif t_type == 'rename':
                col = config.get('column')
                new_name = config.get('new_name')
                if col in df.columns and new_name:
                    df = df.rename(columns={col: new_name})
            elif t_type == 'cast':
                df = _apply_cast(df, config)
            elif t_type == 'fill_missing':
                df = _apply_fill_missing(df, config)
            elif t_type == 'drop':
                col = config.get('column')
                if col in df.columns:
                    df = df.drop(columns=[col])
            elif t_type == 'sort':
                col = config.get('column')
                order = config.get('order', 'asc')
                if col in df.columns:
                    df = df.sort_values(by=col, ascending=(order == 'asc'))
            elif t_type == 'calculate':
                df = _apply_calculate(df, config)
        except Exception as e:
            print(f"Transform error: {e}")
            continue
    
    return df


def _apply_filter(df: pd.DataFrame, config: dict) -> pd.DataFrame:
    """Apply filter transformation"""
    col = config.get('column')
    op = config.get('operator')
    val = config.get('value')
    
    if col not in df.columns:
        return df
        
    if op == 'eq':
        df = df[df[col] == val]
    elif op == 'neq':
        df = df[df[col] != val]
    elif op == 'gt':
        df = df[pd.to_numeric(df[col], errors='coerce') > float(val)]
    elif op == 'gte':
        df = df[pd.to_numeric(df[col], errors='coerce') >= float(val)]
    elif op == 'lt':
        df = df[pd.to_numeric(df[col], errors='coerce') < float(val)]
    elif op == 'lte':
        df = df[pd.to_numeric(df[col], errors='coerce') <= float(val)]
    elif op == 'contains':
        df = df[df[col].astype(str).str.contains(str(val), na=False)]
    elif op == 'starts_with':
        df = df[df[col].astype(str).str.startswith(str(val), na=False)]
    elif op == 'ends_with':
        df = df[df[col].astype(str).str.endswith(str(val), na=False)]
    elif op == 'is_null':
        df = df[df[col].isna()]
    elif op == 'not_null':
        df = df[df[col].notna()]
    
    return df


def _apply_cast(df: pd.DataFrame, config: dict) -> pd.DataFrame:
    """Apply type casting transformation"""
    col = config.get('column')
    new_type = config.get('new_type')
    
    if col not in df.columns:
        return df
    
    if new_type == 'int':
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
    elif new_type == 'float':
        df[col] = pd.to_numeric(df[col], errors='coerce')
    elif new_type == 'string':
        df[col] = df[col].astype(str)
    elif new_type == 'date':
        df[col] = pd.to_datetime(df[col], errors='coerce')
    elif new_type == 'bool':
        df[col] = df[col].astype(bool)
    
    return df


def _apply_fill_missing(df: pd.DataFrame, config: dict) -> pd.DataFrame:
    """Apply fill missing values transformation"""
    col = config.get('column')
    method = config.get('method')
    fill_val = config.get('value')
    
    if col not in df.columns:
        return df
    
    if method == 'value':
        df[col] = df[col].fillna(fill_val)
    elif method == 'mean':
        df[col] = df[col].fillna(pd.to_numeric(df[col], errors='coerce').mean())
    elif method == 'median':
        df[col] = df[col].fillna(pd.to_numeric(df[col], errors='coerce').median())
    elif method == 'mode':
        mode_val = df[col].mode()
        df[col] = df[col].fillna(mode_val[0] if len(mode_val) > 0 else None)
    elif method == 'forward':
        df[col] = df[col].ffill()
    elif method == 'backward':
        df[col] = df[col].bfill()
    elif method == 'drop':
        df = df.dropna(subset=[col])
    
    return df


def _apply_calculate(df: pd.DataFrame, config: dict) -> pd.DataFrame:
    """Apply calculated field transformation"""
    new_col = config.get('new_column')
    formula = config.get('formula', '')
    
    if not new_col or not formula:
        return df
    
    try:
        eval_formula = formula
        for col in df.columns:
            if col in formula:
                eval_formula = eval_formula.replace(col, f"df['{col}']")
        df[new_col] = eval(eval_formula)
    except Exception as e:
        print(f"Formula error: {e}")
    
    return df
