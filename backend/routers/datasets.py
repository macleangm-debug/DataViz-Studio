"""Datasets router"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from typing import Optional, List

from services.dataset_service import DatasetService
from models.dataset import TransformRequest

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.get("")
async def list_datasets(org_id: Optional[str] = None):
    """List all datasets"""
    datasets = await DatasetService.list_datasets(org_id)
    return {"datasets": datasets}


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get dataset by ID"""
    dataset = await DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.get("/{dataset_id}/data")
async def get_dataset_data(
    dataset_id: str,
    limit: int = Query(1000, le=10000),
    offset: int = Query(0, ge=0)
):
    """Get dataset data rows"""
    data = await DatasetService.get_dataset_data(dataset_id, limit, offset)
    return {"data": data}


@router.get("/{dataset_id}/stats")
async def get_dataset_stats(dataset_id: str):
    """Get dataset statistics"""
    try:
        stats = await DatasetService.get_dataset_stats(dataset_id)
        return stats
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete dataset"""
    deleted = await DatasetService.delete_dataset(dataset_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"message": "Dataset deleted"}


@router.post("/{dataset_id}/transform/preview")
async def preview_transformation(dataset_id: str, request: TransformRequest):
    """Preview transformation without applying"""
    result = await DatasetService.preview_transformation(
        dataset_id, 
        [s.dict() for s in request.steps]
    )
    return result


@router.post("/{dataset_id}/transform/apply")
async def apply_transformation(dataset_id: str, request: TransformRequest):
    """Apply transformation and save"""
    try:
        result = await DatasetService.apply_transformation(
            dataset_id,
            [s.dict() for s in request.steps]
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
