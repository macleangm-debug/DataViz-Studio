"""Export service - handles PDF and data exports"""
import base64
import math
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import logging

from core.database import db

logger = logging.getLogger(__name__)


class ExportService:
    """Service for export operations"""
    
    @staticmethod
    async def export_csv(dataset_id: str) -> str:
        """Export dataset as CSV"""
        data = await db.dataset_data.find(
            {"dataset_id": dataset_id},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(100000)
        
        if not data:
            return ""
        
        df = pd.DataFrame(data)
        return df.to_csv(index=False)
    
    @staticmethod
    async def export_json(dataset_id: str) -> List[Dict[str, Any]]:
        """Export dataset as JSON"""
        data = await db.dataset_data.find(
            {"dataset_id": dataset_id},
            {"_id": 0, "dataset_id": 0, "_dataset_row_id": 0}
        ).to_list(100000)
        return data
    
    @staticmethod
    async def generate_professional_pdf(
        charts: List[Dict[str, Any]],
        title: str = "Chart Report",
        company_name: str = "DataViz Studio",
        include_data_summary: bool = True
    ) -> Dict[str, Any]:
        """Generate professional PDF with WeasyPrint"""
        from weasyprint import HTML
        
        if not charts:
            raise ValueError("No charts to export")
        
        date_str = datetime.now().strftime("%B %d, %Y")
        
        # Calculate pagination - 6 charts per page
        charts_per_page = 6
        total_chart_pages = math.ceil(len(charts) / charts_per_page)
        total_pages = total_chart_pages + (1 if include_data_summary else 0)
        
        # Build chart cards HTML
        def build_chart_card(chart: Dict) -> str:
            return f'''
            <div class="chart-card">
                <div class="chart-title">{chart.get("name", "Chart")}</div>
                <div class="chart-image">
                    <img src="data:image/png;base64,{chart.get("image_base64", "")}" alt="{chart.get("name", "")}" />
                </div>
            </div>
            '''
        
        # Build chart pages
        chart_pages_html = ""
        for page_idx in range(total_chart_pages):
            start_idx = page_idx * charts_per_page
            end_idx = min(start_idx + charts_per_page, len(charts))
            page_charts = charts[start_idx:end_idx]
            current_page = page_idx + 1
            
            chart_pages_html += f'''
            <div class="page">
                <div class="header">
                    <div class="header-left">
                        <div class="header-date">{date_str}</div>
                        <div class="header-title">{'Chart Report' if page_idx == 0 else 'Charts (continued)'}</div>
                    </div>
                    <div class="logo">
                        <div class="logo-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path d="M8 5 Q4 12, 12 12 Q20 12, 16 19" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <span class="logo-text">{company_name}</span>
                    </div>
                </div>
                
                <div class="chart-grid">
                    {''.join(build_chart_card(c) for c in page_charts)}
                </div>
                
                <div class="footer">
                    <div class="footer-logo">
                        <div class="footer-logo-icon">
                            <svg viewBox="0 0 24 24" width="12" height="12">
                                <path d="M8 5 Q4 12, 12 12 Q20 12, 16 19" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <span>{company_name}</span>
                    </div>
                    <span>Page {current_page} of {total_pages}</span>
                </div>
            </div>
            '''
        
        # Build data summary page
        summary_page_html = ""
        if include_data_summary:
            summary_rows = ""
            total_items = 0
            grand_total = 0
            
            for chart in charts:
                chart_data = chart.get("data", [])
                if chart_data:
                    items = len(chart_data)
                    total = sum(d.get("value", 0) for d in chart_data)
                    max_val = max((d.get("value", 0) for d in chart_data), default=0)
                    min_val = min((d.get("value", 0) for d in chart_data), default=0)
                    avg_val = int(total / items) if items else 0
                    total_items += items
                    grand_total += total
                    
                    summary_rows += f'''
                    <tr>
                        <td class="cell-name">{chart.get("name", "Chart")}</td>
                        <td class="cell-type">{chart.get("type", "bar")}</td>
                        <td class="cell-num">{items}</td>
                        <td class="cell-num">{total:,}</td>
                        <td class="cell-num">{max_val:,}</td>
                        <td class="cell-num">{min_val:,}</td>
                        <td class="cell-num">{avg_val:,}</td>
                    </tr>
                    '''
            
            summary_page_html = f'''
            <div class="page">
                <div class="header">
                    <div class="header-left">
                        <div class="header-date">{date_str}</div>
                        <div class="header-title">Data Summary</div>
                    </div>
                    <div class="logo">
                        <div class="logo-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path d="M8 5 Q4 12, 12 12 Q20 12, 16 19" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <span class="logo-text">{company_name}</span>
                    </div>
                </div>
                
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>Chart Name</th>
                            <th>Type</th>
                            <th class="th-num">Items</th>
                            <th class="th-num">Total</th>
                            <th class="th-num">Max</th>
                            <th class="th-num">Min</th>
                            <th class="th-num">Avg</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary_rows}
                    </tbody>
                </table>
                
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-label">Total Charts</div>
                        <div class="stat-value">{len(charts)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Data Points</div>
                        <div class="stat-value">{total_items}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Grand Total</div>
                        <div class="stat-value">{grand_total:,}</div>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="footer-logo">
                        <div class="footer-logo-icon">
                            <svg viewBox="0 0 24 24" width="12" height="12">
                                <path d="M8 5 Q4 12, 12 12 Q20 12, 16 19" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <span>{company_name}</span>
                    </div>
                    <span>Page {total_pages} of {total_pages}</span>
                </div>
            </div>
            '''
        
        # Complete HTML document with CSS
        html_content = ExportService._get_pdf_template(chart_pages_html, summary_page_html)
        
        # Generate PDF with WeasyPrint
        pdf_bytes = HTML(string=html_content).write_pdf()
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        return {
            "status": "success",
            "pdf_base64": pdf_base64,
            "filename": f"DataViz_Report_{datetime.now().strftime('%Y%m%d')}.pdf",
            "pages": total_pages,
            "charts_exported": len(charts)
        }
    
    @staticmethod
    def _get_pdf_template(chart_pages_html: str, summary_page_html: str) -> str:
        """Get complete HTML template for PDF"""
        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @page {{
                    size: A4;
                    margin: 12mm 12mm 18mm 12mm;
                }}
                * {{
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    font-size: 10pt;
                    color: #1a1a1a;
                    background: #fafafa;
                    line-height: 1.4;
                }}
                .page {{
                    page-break-after: always;
                    min-height: 267mm;
                    position: relative;
                    padding-bottom: 25mm;
                }}
                .page:last-child {{
                    page-break-after: avoid;
                }}
                .header {{
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 0 0 12px 0;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #8b5cf6;
                }}
                .header-left {{ flex: 1; }}
                .header-date {{ font-size: 9pt; color: #666; margin-bottom: 3px; }}
                .header-title {{ font-size: 20pt; font-weight: 700; color: #000; letter-spacing: -0.5px; }}
                .logo {{ display: flex; align-items: center; gap: 8px; }}
                .logo-icon {{
                    width: 28px; height: 34px;
                    background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                }}
                .logo-text {{ font-size: 12pt; font-weight: 500; color: #333; }}
                .chart-grid {{ display: flex; flex-wrap: wrap; gap: 12px; }}
                .chart-card {{
                    width: calc(33.33% - 8px);
                    background: #fff;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid #e5e5e5;
                }}
                .chart-title {{
                    font-size: 9pt; font-weight: 600; color: #000;
                    padding: 8px 10px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #eee;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }}
                .chart-image {{
                    height: 130px;
                    display: flex; align-items: center; justify-content: center;
                    padding: 6px;
                    background: #fff;
                }}
                .chart-image img {{
                    max-width: 100%;
                    max-height: 118px;
                    object-fit: contain;
                }}
                .summary-table {{
                    width: 100%;
                    border-collapse: collapse;
                    background: #fff;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid #e5e5e5;
                    margin-bottom: 20px;
                }}
                .summary-table th {{
                    background: #f8f9fa;
                    padding: 10px 12px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 9pt;
                    color: #333;
                    border-bottom: 2px solid #e5e5e5;
                }}
                .summary-table .th-num {{ text-align: right; }}
                .summary-table td {{
                    padding: 8px 12px;
                    border-bottom: 1px solid #eee;
                    font-size: 9pt;
                }}
                .summary-table .cell-name {{ font-weight: 500; color: #000; }}
                .summary-table .cell-type {{ color: #666; text-transform: capitalize; }}
                .summary-table .cell-num {{
                    text-align: right;
                    font-family: 'SF Mono', Monaco, monospace;
                    color: #000;
                }}
                .stats-row {{ display: flex; gap: 12px; }}
                .stat-card {{
                    flex: 1;
                    background: #fff;
                    border-radius: 8px;
                    padding: 14px;
                    border: 1px solid #e5e5e5;
                }}
                .stat-label {{
                    font-size: 8pt;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }}
                .stat-value {{
                    font-size: 22pt;
                    font-weight: 700;
                    color: #000;
                }}
                .footer {{
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 8px;
                    border-top: 1px solid #ddd;
                    font-size: 8pt;
                    color: #666;
                }}
                .footer-logo {{ display: flex; align-items: center; gap: 5px; }}
                .footer-logo-icon {{
                    width: 16px; height: 20px;
                    background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                }}
            </style>
        </head>
        <body>
            {chart_pages_html}
            {summary_page_html}
        </body>
        </html>
        '''
