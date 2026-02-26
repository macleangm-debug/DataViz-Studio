"""Charts router"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List

from services.chart_service import ChartService
from schemas.chart import ChartCreate, DrillDownRequest

router = APIRouter(prefix="/charts", tags=["Charts"])


@router.post("")
async def create_chart(chart: ChartCreate):
    """Create a new chart"""
    result = await ChartService.create_chart(
        name=chart.name,
        chart_type=chart.type,
        dataset_id=chart.dataset_id,
        config=chart.config
    )
    return result


@router.get("")
async def list_charts(
    org_id: Optional[str] = None,
    dataset_id: Optional[str] = None
):
    """List charts with optional filters"""
    charts = await ChartService.list_charts(org_id, dataset_id)
    return {"charts": charts}


@router.get("/{chart_id}")
async def get_chart(chart_id: str):
    """Get chart by ID"""
    chart = await ChartService.get_chart(chart_id)
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    return chart


@router.put("/{chart_id}")
async def update_chart(chart_id: str, chart: ChartCreate):
    """Update chart"""
    result = await ChartService.update_chart(
        chart_id=chart_id,
        name=chart.name,
        chart_type=chart.type,
        dataset_id=chart.dataset_id,
        config=chart.config
    )
    if not result:
        raise HTTPException(status_code=404, detail="Chart not found")
    return result


@router.get("/{chart_id}/data")
async def get_chart_data(chart_id: str):
    """Get aggregated data for chart rendering"""
    try:
        result = await ChartService.get_chart_data(chart_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{chart_id}")
async def delete_chart(chart_id: str):
    """Delete chart"""
    deleted = await ChartService.delete_chart(chart_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Chart not found")
    return {"message": "Chart deleted"}


@router.post("/{chart_id}/drill-down")
async def drill_down_chart(chart_id: str, request: DrillDownRequest):
    """Perform drill-down on chart data"""
    try:
        result = await ChartService.drill_down(
            chart_id=chart_id,
            drill_path=request.drill_path,
            field=request.field,
            value=request.value
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{chart_id}/drill-options")
async def get_drill_options(chart_id: str):
    """Get available drill-down options"""
    try:
        result = await ChartService.get_drill_options(chart_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
