"""Export service - handles PDF and data exports with production-grade templates"""
import base64
import math
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path
import logging

from jinja2 import Template
from core.database import db

logger = logging.getLogger(__name__)


def load_inline_svg_logo() -> str:
    """
    Reads /app/frontend/public/icons/icon-192x192.svg and injects a class for sizing.
    Falls back to a simple inline SVG if file not found.
    """
    svg_path = Path("/app/frontend/public/icons/icon-192x192.svg")
    if svg_path.exists():
        svg = svg_path.read_text(encoding="utf-8")
        # Ensure root <svg> has class="brand-logo" so CSS sizing works.
        if "<svg" in svg:
            # Insert class if missing on the first <svg ...>
            head = svg.split("<svg", 1)
            after = head[1]
            if 'class="' not in after[:200]:
                svg = svg.replace("<svg", '<svg class="brand-logo"', 1)
            else:
                # If class exists, append brand-logo if not present
                svg = svg.replace('class="', 'class="brand-logo ', 1)
        return svg

    # fallback
    return """<svg class="brand-logo" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="Logo">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#7c3aed"/>
          <stop offset="1" stop-color="#5b21b6"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#g)"/>
      <path d="M22 34c6-10 14-10 20 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    </svg>"""


REPORT_TEMPLATE = Template(r"""
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      margin: 14mm 12mm 18mm 12mm;

      @bottom-left {
        content: "{{ company_name }}";
        font-size: 9.5pt;
        color: #6b7280;
      }
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9.5pt;
        color: #6b7280;
      }
    }

    :root{
      --ink:#111827;
      --muted:#6b7280;
      --line:#e5e7eb;
      --panel:#f9fafb;
      --brand:#6d28d9;
      --radius:10px;
    }

    html, body { padding:0; margin:0; }
    body{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Helvetica Neue", Helvetica, sans-serif;
      color: var(--ink);
      font-size: 11pt;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .header{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      padding: 2mm 0 4mm 0;
      border-bottom: 2px solid var(--brand);
      margin-bottom: 6mm;
    }
    .title-block .date{
      font-size: 10pt;
      color: var(--muted);
      margin-bottom: 2mm;
    }
    .title-block h1{
      font-size: 22pt;
      margin: 0;
      letter-spacing: -0.2px;
    }

    .brand{
      display:flex;
      align-items:center;
      gap: 8px;
      min-width: 45mm;
      justify-content:flex-end;
    }
    .brand-logo{
      width: 28px;
      height: 28px;
      display:block;
    }
    .brand-name{
      font-weight: 750;
      font-size: 12pt;
      line-height: 1.1;
    }
    .brand-sub{
      font-size: 10pt;
      color: var(--muted);
      margin-top: 1px;
    }

    .meta{
      display:flex;
      gap: 10mm;
      margin: 0 0 6mm 0;
      color: var(--muted);
      font-size: 10pt;
      flex-wrap: wrap;
    }
    .meta div strong { color: var(--ink); font-weight: 600; }

    .section-title{
      font-size: 12.5pt;
      font-weight: 800;
      margin: 0 0 3mm 0;
    }

    .grid{
      display:grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .card{
      border: 1px solid var(--line);
      border-radius: var(--radius);
      overflow: hidden;
      background: white;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .card-head{
      background: var(--panel);
      padding: 8px 10px;
      font-weight: 700;
      font-size: 10.5pt;
      border-bottom: 1px solid var(--line);
      display:flex;
      justify-content:space-between;
      gap: 8px;
    }
    .pill{
      font-size: 9pt;
      color: var(--muted);
      border: 1px solid var(--line);
      background: white;
      border-radius: 999px;
      padding: 1px 8px;
      white-space: nowrap;
    }

    .card-body{
      padding: 10px;
    }

    .chart-img{
      width: 100%;
      height: auto;
      display:block;
      border-radius: 6px;
    }

    .caption{
      margin-top: 6px;
      font-size: 9.5pt;
      color: var(--muted);
    }

    /* ---- Data Summary Page ---- */
    .page-break{
      break-before: page;
      page-break-before: always;
    }

    table{
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    th, td{
      border: 1px solid var(--line);
      padding: 6px 8px;
      vertical-align: top;
    }
    th{
      background: var(--panel);
      text-align: left;
      font-weight: 700;
    }
    .small-muted { color: var(--muted); font-size: 9.5pt; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 9.5pt; }
  </style>
</head>

<body>
  <div class="header">
    <div class="title-block">
      <div class="date">{{ report_date }}</div>
      <h1>{{ title }}</h1>
    </div>

    <div class="brand">
      {{ logo_svg | safe }}
      <div>
        <div class="brand-name">{{ brand_top }}</div>
        <div class="brand-sub">{{ brand_bottom }}</div>
      </div>
    </div>
  </div>

  <div class="meta">
    <div><strong>Company:</strong> {{ company_name }}</div>
    <div><strong>Generated:</strong> {{ generated_at }}</div>
    <div><strong>Charts:</strong> {{ charts_count }}</div>
  </div>

  <div class="section-title">Charts Overview</div>

  <div class="grid">
    {% for c in charts %}
    <div class="card">
      <div class="card-head">
        <div>{{ c.name }}</div>
        <div class="pill">{{ c.type }}</div>
      </div>
      <div class="card-body">
        <img class="chart-img" src="{{ c.base64_png }}" alt="{{ c.name }}" />
        {% if c.caption %}
        <div class="caption">{{ c.caption }}</div>
        {% endif %}
      </div>
    </div>
    {% endfor %}
  </div>

  {% if include_data_summary %}
  <div class="page-break"></div>

  <div class="section-title">Data Summary</div>
  <div class="small-muted" style="margin-bottom: 4mm;">
    Summary tables show a small sample (first {{ summary_sample_size }} rows) of each chart's raw data payload.
  </div>

  {% for s in summaries %}
    <div style="margin: 0 0 6mm 0; break-inside: avoid; page-break-inside: avoid;">
      <div style="font-weight:800; margin: 0 0 2mm 0;">{{ s.name }} <span class="pill">{{ s.type }}</span></div>
      {% if s.columns and s.rows %}
        <table>
          <thead>
            <tr>
              {% for col in s.columns %}
                <th>{{ col }}</th>
              {% endfor %}
            </tr>
          </thead>
          <tbody>
            {% for row in s.rows %}
              <tr>
                {% for col in s.columns %}
                  <td class="mono">{{ row.get(col, "") }}</td>
                {% endfor %}
              </tr>
            {% endfor %}
          </tbody>
        </table>
      {% else %}
        <div class="small-muted">No raw data provided for this chart.</div>
      {% endif %}
    </div>
  {% endfor %}
  {% endif %}
</body>
</html>
""")


def _split_company_name(company_name: str) -> Dict[str, str]:
    """
    Splits "DataViz Studio" -> ("DataViz", "Studio") for header styling.
    If it's a single word, second line becomes empty.
    """
    parts = (company_name or "DataViz Studio").split()
    if len(parts) >= 2:
        return {"top": parts[0], "bottom": " ".join(parts[1:])}
    return {"top": company_name or "DataViz", "bottom": ""}


def _make_chart_base64_png(image_base64: str) -> str:
    """
    Ensures proper data URI prefix for <img src="...">
    """
    if not image_base64:
        return ""
    if image_base64.startswith("data:image"):
        return image_base64
    return f"data:image/png;base64,{image_base64}"


def _build_data_summaries(charts: List[Dict[str, Any]], sample_size: int = 8):
    summaries = []
    for c in charts:
        rows = c.get("data") or []
        if isinstance(rows, list) and rows:
            # collect columns from first row (stable order)
            first = rows[0] if isinstance(rows[0], dict) else {}
            columns = list(first.keys())
            # sample
            sample_rows = [r for r in rows[:sample_size] if isinstance(r, dict)]
        else:
            columns = []
            sample_rows = []
        summaries.append({
            "name": c.get("name") or "Untitled Chart",
            "type": c.get("type") or "chart",
            "columns": columns,
            "rows": sample_rows,
        })
    return summaries


def build_report_html_from_payload(payload: Dict[str, Any]) -> str:
    """Build production-grade HTML report from the API payload"""
    charts = payload.get("charts") or []
    title = payload.get("title") or "Chart Report"
    company_name = payload.get("company_name") or "DataViz Studio"
    include_data_summary = bool(payload.get("include_data_summary", True))

    now = datetime.now(timezone.utc)
    brand = _split_company_name(company_name)
    logo_svg = load_inline_svg_logo()

    # normalize charts for template
    normalized = []
    for c in charts:
        normalized.append({
            "name": c.get("name") or "Untitled Chart",
            "type": (c.get("type") or "chart").upper(),
            "base64_png": _make_chart_base64_png(c.get("image_base64") or ""),
            "caption": None,  # you can add later if desired
            "data": c.get("data") or [],
        })

    summaries = _build_data_summaries(normalized, sample_size=8)

    return REPORT_TEMPLATE.render(
        report_date=now.strftime("%B %d, %Y"),
        generated_at=now.strftime("%Y-%m-%d %H:%M UTC"),
        title=title,
        company_name=company_name,
        brand_top=brand["top"],
        brand_bottom=brand["bottom"],
        logo_svg=logo_svg,
        charts=normalized,
        charts_count=len(normalized),
        include_data_summary=include_data_summary,
        summaries=summaries,
        summary_sample_size=8,
    )


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
    ) -> bytes:
        """Generate professional PDF with WeasyPrint using production-grade template"""
        from weasyprint import HTML
        
        if not charts:
            raise ValueError("No charts to export")
        
        # Build payload for template
        payload = {
            "charts": charts,
            "title": title,
            "company_name": company_name,
            "include_data_summary": include_data_summary
        }
        
        # Generate HTML from template
        html_content = build_report_html_from_payload(payload)
        
        # Generate PDF with WeasyPrint
        pdf_bytes = HTML(
            string=html_content,
            base_url="/app"
        ).write_pdf(presentational_hints=True)
        
        return pdf_bytes
