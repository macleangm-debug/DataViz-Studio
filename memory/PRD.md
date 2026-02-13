# DataViz Studio - Product Requirements Document

## Original Problem Statement
Transform the DataPulse repository into DataViz Studio - a comprehensive data visualization platform with AI integration, real-time database connections, and advanced charting capabilities.

## Product Overview
DataViz Studio is an interactive analytics and visualization platform that enables users to upload data, connect to external databases, create dashboards, build charts with ECharts, get AI-powered insights, and export professional reports.

## User Personas
1. **Data Analyst** - Needs to quickly visualize and analyze datasets
2. **Business User** - Wants to create dashboards without technical expertise  
3. **Decision Maker** - Requires AI-powered insights for quick decision making

## Core Requirements
- File upload support (CSV, Excel, JSON)
- Real-time database connections (MongoDB, PostgreSQL, MySQL)
- Scheduled data refresh with APScheduler
- Interactive dashboard builder with drag-drop
- Multiple chart types (9 types via ECharts)
- AI-powered insights using GPT-5.2
- PDF report export with charts and data tables
- Chart drill-down capabilities

## What's Been Implemented

### Session 1 - Initial MVP
- [x] Complete rebranding from DataPulse to DataViz Studio
- [x] Authentication system (register/login)
- [x] Data upload support (CSV, Excel, JSON)
- [x] Dataset management with statistics

### Session 2 - Dashboard Builder & Database Connections
- [x] Dashboard Widget Drag-Drop Builder (react-grid-layout)
- [x] MongoDB database connections with test & sync

### Session 3 - Chart Studio & AI Insights
- [x] Enhanced Chart Studio with Apache ECharts
- [x] 9 chart types with live preview
- [x] AI-powered chart suggestions (GPT-5.2)
- [x] AI Insights page working

### Session 4 (Feb 13, 2026) - Advanced Database & Export Features
- [x] **PostgreSQL Database Connection**
  - Using `asyncpg` for async PostgreSQL operations
  - Schema introspection for table/column discovery
  - Full data sync from PostgreSQL tables

- [x] **MySQL Database Connection**
  - Using `aiomysql` for async MySQL operations
  - Schema introspection and data sync

- [x] **Scheduled Data Refresh (Industry Standard)**
  - APScheduler integration for background tasks
  - Interval triggers: Hourly, Daily, Weekly
  - Custom cron expression support
  - Schedule persistence in database
  - Auto-restore schedules on server restart

- [x] **PDF Report Export**
  - Using `fpdf2` (pure Python, no system dependencies)
  - Bar charts rendered in PDF
  - Data tables with formatting
  - Multiple charts per report
  - Full dashboard export support

- [x] **Chart Drill-Down Capabilities**
  - Click to filter data by category value
  - Navigate to detail view (drill path)
  - Breadcrumb navigation with reset
  - Shows filtered row count
  - Suggests next drill-down options

### Backend API Endpoints (Complete List)
```
Authentication:
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/me

Data Sources:
  GET  /api/data-sources
  POST /api/data-sources/upload

Database Connections:
  GET  /api/database-connections
  POST /api/database-connections
  GET  /api/database-connections/{id}
  DELETE /api/database-connections/{id}
  POST /api/database-connections/{id}/test
  POST /api/database-connections/{id}/sync
  GET  /api/database-connections/{id}/tables
  POST /api/database-connections/{id}/schedule
  GET  /api/database-connections/{id}/schedule
  DELETE /api/database-connections/{id}/schedule

Datasets:
  GET  /api/datasets
  GET  /api/datasets/{id}
  GET  /api/datasets/{id}/data
  GET  /api/datasets/{id}/stats
  GET  /api/datasets/{id}/drill-hierarchy

Charts:
  GET  /api/charts
  POST /api/charts
  GET  /api/charts/{id}
  PUT  /api/charts/{id}
  DELETE /api/charts/{id}
  GET  /api/charts/{id}/data
  GET  /api/charts/{id}/drill-options
  POST /api/charts/{id}/drill-down

AI:
  POST /api/ai/query
  POST /api/ai/suggest-charts

Reports:
  POST /api/reports/export/pdf
  GET  /api/reports/export/pdf/{dashboard_id}

Exports:
  GET  /api/exports/{id}/csv
  GET  /api/exports/{id}/json
```

### Tech Stack
- **Frontend:** React, TailwindCSS, shadcn/ui, Framer Motion, ECharts, react-grid-layout
- **Backend:** FastAPI, Motor (async MongoDB), asyncpg, aiomysql, APScheduler, fpdf2
- **AI:** GPT-5.2 via Emergent LLM key
- **Database:** MongoDB (main), PostgreSQL/MySQL (external connections)

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Dashboard widget drag-drop builder
- [x] Real-time database connections (MongoDB)
- [x] Chart Studio with ECharts
- [x] AI Insights with GPT-5.2

### P1 (High Priority) - COMPLETED
- [x] PostgreSQL/MySQL actual connections
- [x] Scheduled data refresh
- [x] PDF report export
- [x] Chart drill-down

### P2 (Medium Priority)
- [ ] Dashboard templates
- [ ] Chart annotations
- [ ] Data transformation/cleaning tools
- [ ] Scheduled report delivery via email

### P3 (Nice to Have)
- [ ] Team collaboration features
- [ ] Public dashboard sharing
- [ ] White-labeling options
- [ ] Mobile app version
- [ ] Integration marketplace
- [ ] Custom chart themes

## Test Status
- **Backend Tests:** 100% (24/24 passed)
- **Frontend Tests:** 100% (all features verified)
- **Test Credentials:** test@dataviz.com / test123
- **Test Data:** Sales Data (14 rows), 5 columns

## Known Limitations
- External preview URL occasionally has platform caching issues
- PostgreSQL/MySQL connections require actual database servers to test fully

## Next Recommended Task
Consider implementing **scheduled report delivery via email** using SendGrid or Resend integration.
