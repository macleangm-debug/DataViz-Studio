# DataViz Studio - Product Requirements Document

## Overview
DataViz Studio is a full-featured data visualization application built with React frontend, FastAPI backend, and MongoDB database. The application enables users to create, customize, and share interactive data visualizations and dashboards.

## Core Features

### Completed Features
- **User Authentication**: JWT-based auth with email/password
- **Dashboard Builder**: Create and customize dashboards with multiple chart types
- **Chart Types**: Bar, Line, Area, Pie, and more
- **Data Import**: Upload CSV/Excel files or connect to external databases
- **Export to PDF**: Production-grade PDF generation using WeasyPrint
- **Public Dashboard Sharing**: Share dashboards via secure public links with optional password protection and expiry
- **AI-Powered Insights**: Uses Emergent LLM Key for AI features

### Export to PDF (Production-Grade) - COMPLETED Mar 1, 2026
- Implemented server-side PDF generation using WeasyPrint
- Uses Jinja2 templates for clean, maintainable HTML generation
- Features:
  - Professional header with inline SVG logo
  - 3-column grid layout for charts
  - Clean typography and spacing
  - @page CSS for proper footers (company name + page numbers)
  - Data Summary page with sample tables (8 rows per chart)
  - page-break-inside: avoid for clean pagination

### Public Dashboard Sharing - COMPLETED
- Secure public links with unique public_id
- Optional password protection (hashed)
- Optional expiry dates
- Share dialog UI in Dashboard Builder

## Tech Stack
- **Frontend**: React 18, Recharts, ECharts, TailwindCSS, Shadcn/UI
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB
- **PDF Generation**: WeasyPrint + Jinja2 templates
- **Chart Capture**: html2canvas (frontend)

## API Endpoints

### PDF Export
- `POST /api/reports/export/professional_pdf` - Generate production-grade PDF report
  - Payload: `{ charts, title, company_name, include_data_summary }`
  - Returns: `{ status, pdf_base64, filename, charts_exported }`

### Public Sharing
- `GET /api/public/dashboards/{public_id}` - Fetch public dashboard layout
- `GET /api/public/charts/{chart_id}/data` - Fetch chart data for public view
- `GET /api/dashboards/{id}/share` - Get sharing status
- `POST /api/dashboards/{id}/share` - Enable/update sharing

## Architecture

```
/app/
├── backend/
│   ├── core/           # Config, database, security
│   ├── schemas/        # Pydantic models
│   ├── services/       # Business logic
│   │   └── export_service.py  # PDF generation (production-grade template)
│   ├── routers/        # API endpoints (in progress)
│   └── server.py       # Legacy monolithic file (4500+ lines)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── ChartsPage.jsx
│       │   ├── DashboardBuilderPage.jsx
│       │   └── PublicDashboardPage.jsx
│       └── components/
│           └── dialogs/
│               └── ShareDashboardDialog.jsx
```

## Pending Tasks

### P0 - Critical
- [ ] **Backend Refactoring**: Migrate logic from monolithic `server.py` (4500+ lines) into modular structure
  - Move endpoints to `routers/`
  - Move business logic to `services/`
  - Order: auth → datasets → charts → dashboards → reports

### P1 - High Priority
- [ ] Complete new chart types & color scheme selector
- [ ] Implement SSO Integration (Survey360, FieldForce, DataPulse)
- [ ] Activate Scheduled Report Delivery UI (backend resend integration exists)

### P2 - Medium Priority
- [ ] Advanced Data Connectors (Lineage, Row-Level Security, Alerts)
- [ ] Team Collaboration (roles, permissions)
- [ ] Load Testing with locustfile.py

## Test Credentials
- **Email**: `test@dataviz.com`
- **Password**: `test123`

## Third-Party Integrations
- **WeasyPrint**: Server-side PDF generation
- **html2canvas**: Frontend chart image capture
- **echarts & recharts**: Charting libraries
- **emergentintegrations**: AI features (Emergent LLM Key)
- **resend**: Email delivery for scheduled reports (requires user API key)

## Last Updated
March 1, 2026 - PDF Export Production Template Implementation
