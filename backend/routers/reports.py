"""Reports and exports router"""
from fastapi import APIRouter, HTTPException, Request, Response
from typing import Optional, List

from services.export_service import ExportService
from schemas.report import ReportExportRequest, ProfessionalPdfRequest
from schemas.chart import ChartExportData

router = APIRouter(tags=["Reports"])


@router.get("/exports/{dataset_id}/csv")
async def export_csv(dataset_id: str):
    """Export dataset as CSV"""
    csv_data = await ExportService.export_csv(dataset_id)
    if not csv_data:
        raise HTTPException(status_code=404, detail="Dataset not found or empty")
    
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={dataset_id}.csv"}
    )


@router.get("/exports/{dataset_id}/json")
async def export_json(dataset_id: str):
    """Export dataset as JSON"""
    data = await ExportService.export_json(dataset_id)
    if not data:
        raise HTTPException(status_code=404, detail="Dataset not found or empty")
    return {"data": data}


@router.post("/reports/export/professional_pdf")
async def export_professional_pdf(request: ProfessionalPdfRequest):
    """Generate professional PDF with chart images using WeasyPrint"""
    try:
        # Convert chart dicts to proper format
        charts = []
        for chart in request.charts:
            charts.append({
                "name": chart.get("name", "Chart"),
                "type": chart.get("type", "bar"),
                "image_base64": chart.get("image_base64", ""),
                "data": chart.get("data", [])
            })
        
        result = await ExportService.generate_professional_pdf(
            charts=charts,
            title=request.title,
            company_name=request.company_name,
            include_data_summary=request.include_data_summary
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
