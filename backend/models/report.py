"""Report models"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class ReportSection(BaseModel):
    type: str  # chart, text, metric, table
    title: str = ""
    content: Any = None
    chart_id: Optional[str] = None
    width: str = "full"  # full, half, third


class ReportLayout(BaseModel):
    title: str
    sections: List[ReportSection]
    theme: str = "default"


class ReportExportRequest(BaseModel):
    dashboard_id: Optional[str] = None
    chart_ids: Optional[List[str]] = None
    title: str = "Report"
    theme: str = "professional"


class ReportSectionData(BaseModel):
    type: str
    title: str
    subtitle: str = ""
    value: str = ""
    change: str = ""
    icon: str = ""


class GenerateSummaryRequest(BaseModel):
    sections: List[ReportSectionData]
    title: str = "Executive Summary"
    company: str = "Company"
    date_range: str = ""


class SummaryResponse(BaseModel):
    summary: str
    key_insights: List[str]
    recommendations: List[str]
    generated_at: str
    method: str = "template"


class ProfessionalPdfRequest(BaseModel):
    charts: List[Dict[str, Any]]  # ChartExportData as dict
    title: str = "Chart Report"
    company_name: str = "DataViz Studio"
    include_data_summary: bool = True
