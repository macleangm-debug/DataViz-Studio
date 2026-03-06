# DataViz Studio - Product Requirements Document

## Overview
DataViz Studio is a full-featured data visualization application built with React frontend, FastAPI backend, and MongoDB database. The application enables users to create, customize, and share interactive data visualizations and dashboards.

## Core Features

### Completed Features
- **User Authentication**: JWT-based auth with email/password
- **Dashboard Builder**: Create and customize dashboards with multiple chart types
- **Chart Types**: 12 types (Bar, Horizontal Bar, Stacked Bar, Line, Area, Pie, Donut, Scatter, Radar, Treemap, Funnel, Gauge)
- **Data Import**: Upload CSV/Excel files or connect to external databases
- **Export to PDF**: Production-grade PDF generation using WeasyPrint
- **Public Dashboard Sharing**: Share dashboards via secure public links with optional password protection and expiry
- **AI-Powered Insights**: Uses Emergent LLM Key for AI features
- **Custom Color Picker**: Full color picker with hex/RGB input, save custom palettes, brand color extraction from images
- **User Profile**: Profile editing, avatar upload, password change
- **User Management (Admin)**: Invite users, bulk CSV import, suspend/activate/deactivate, role management
- **Notification Center**: Real-time notifications with categories and read/unread status
- **Theme Toggle**: Dark/Light/System theme support
- **Keyboard Shortcuts**: Global shortcuts with command palette (⌘K)
- **Dashboard Templates**: Pre-built templates for various use cases

## Tech Stack
- **Frontend**: React 18, Recharts, ECharts, TailwindCSS, Shadcn/UI, react-colorful
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB
- **PDF Generation**: WeasyPrint + Jinja2 templates
- **Chart Capture**: html2canvas (frontend)

## Architecture

```
/app/
├── backend/
│   ├── core/           # Config, database, security
│   ├── schemas/        # Pydantic models
│   ├── services/       # Business logic
│   │   └── export_service.py  # PDF generation
│   ├── routers/        # API endpoints
│   │   ├── auth.py
│   │   ├── charts.py
│   │   ├── dashboards.py
│   │   ├── datasets.py
│   │   ├── public.py
│   │   ├── reports.py
│   │   └── users.py    # User management & profile
│   └── server.py       # Legacy monolithic file
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ColorPicker.jsx         # Custom color picker
│       │   ├── NotificationCenter.jsx  # Notifications
│       │   ├── ThemeProvider.jsx       # Theme toggle
│       │   ├── KeyboardShortcuts.jsx   # Shortcuts
│       │   └── DashboardTemplates.jsx  # Templates library
│       ├── pages/
│       │   ├── ProfilePage.jsx         # User profile
│       │   ├── UserManagementPage.jsx  # Admin user management
│       │   └── ...
│       └── layouts/
│           └── DashboardLayout.jsx     # Main layout
```

## Recent Changes

### March 6, 2026 - Chart Studio Phase 1B (Thumbnails, Tags, Analytics)

#### Chart Preview Thumbnails
- ECharts `getDataURL()` capture on save
- Base64 PNG preview stored with chart
- ChartPreview component exposes ref for capture
- Preview displayed in chart cards instead of icons

#### Chart Tags System
- Tags input in Chart Studio (up to 5 tags per chart)
- Tag badges displayed on chart cards
- Filter charts by tag in the filter bar
- Backend schema updated to support tags

#### Chart Analytics
- View tracking with `POST /api/charts/{id}/view` endpoint
- Views counter displayed on card footer
- Exports and shares fields added to schema
- Backend tracks views automatically

### March 6, 2026 - Cross-Filtering (Phase 2A) Implementation

#### Cross-Filtering MVP Features
- **Click-to-Filter**: Click any bar/pie chart data point to apply cross-filter
- **Active Filters Bar**: Violet-themed filter bar with removable chips
- **Filter Chips**: Display format "field: value" with X to remove
- **Clear All**: One-click to remove all active filters
- **Filtered Badge**: Visual indicator on widgets affected by filters
- **Multi-Widget Update**: All non-source widgets refresh with filtered data
- **Toast Notifications**: Feedback when filter is applied

#### New Components Created
- `/contexts/DashboardFilterContext.jsx` - Shared filter state management
- `/components/ActiveFiltersBar.jsx` - Filter chips UI component

#### Backend Endpoints Added
- `POST /api/widgets/{id}/data` - Returns filtered widget data
  - Request: `{ filters: { field: "value" } }`
  - Response: `{ data: [...], filtered: true, widget: {...} }`

### March 6, 2026 - Dashboards Page Phase 1B Enhancement

#### Enhanced Dashboards Page (Matching Charts Page)
- **Favorites System**: Star dashboards, toggle favorite filter
- **Sorting Options**: Sort by Recent, Name, Most Viewed, Favorites First
- **View Modes**: Grid view (cards) and List view toggle
- **Hover Quick Actions**: Open, Duplicate, Delete
- **View Tracking**: Track dashboard views with `POST /api/dashboards/{id}/view`
- **Preview Thumbnails**: Support for dashboard screenshots
- **Tags System**: Tags input and display on dashboard cards
- **Improved Card Design**:
  - Widget count badges
  - Timestamp footer (relative time)
  - View count display
  - Hover animations
  
#### Backend Enhancements
- `POST /api/dashboards/{id}/favorite` - Toggle dashboard favorite
- `POST /api/dashboards/{id}/view` - Track dashboard view
- `POST /api/charts/{id}/favorite` - Toggle chart favorite  
- `POST /api/charts/{id}/view` - Track chart view
- Updated schemas: DashboardCreate, ChartCreate with tags, preview_image, is_favorite, views fields

### March 6, 2026 - Chart Studio Phase 1A (BI Platform Upgrade)

#### Enhanced Charts Page
- **Hover Quick Actions**: View, Duplicate, Export, Add to Dashboard, Delete - all on hover
- **Chart Tags & Filters**: Filter by tags (e.g., #sales, #marketing)
- **Favorites System**: Star charts, filter to show only favorites
- **Sorting Options**: Sort by Recent, Name, Most Viewed, Favorites First
- **View Modes**: Grid view (cards) and List view
- **Improved Card Design**:
  - Chart type badges with icons
  - Field info display (X → Y)
  - Timestamp footer
  - Hover animations
- **Add to Dashboard Dialog**: Select dashboard to add chart
- **View Tracking**: Track chart views with counter

### March 2, 2026 - Major Feature Release

#### Custom Color Picker
- Full color picker with hex/RGB input (react-colorful)
- Save and manage custom palettes
- Brand color extraction from uploaded images using canvas

#### User Management
- Profile page with tabs: Profile, Security, Activity Log, Notifications
- Avatar upload, name/email editing
- Password change functionality
- Admin user management page
- Bulk CSV user import with progress
- User suspend/activate/deactivate
- Role management (admin, manager, analyst, viewer)

#### Frontend Features
- **Notification Center**: Badge count, categories (All, Unread, System, Team), mark as read
- **Theme Toggle**: Dark/Light/System with localStorage persistence
- **Keyboard Shortcuts**: Global shortcuts with help dialog (⌘/)
- **Command Palette**: Quick navigation (⌘K)
- **Dashboard Templates**: 9 industry templates (Sales, Marketing, Customer, Finance, HR, Operations, E-commerce, Healthcare, Logistics)

#### New Chart Types (6 new)
- Stacked Bar, Scatter Plot, Radar Chart, Treemap, Funnel Chart, Gauge/KPI
- Total: 12 chart types

### March 2, 2026 - Left-Aligned Settings Pages
- Fixed Settings, API Keys, Team pages layout

### March 1, 2026 - PDF Export Production Template
- Integrated production-grade HTML/CSS template using Jinja2
- Features: inline SVG logo, 3-column grid, @page footers, Data Summary tables

## API Endpoints

### User Management
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update profile
- `POST /api/user/change-password` - Change password
- `DELETE /api/user/delete-account` - Delete account
- `GET /api/user/activity-log` - Get activity log

### Admin (User Management)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/invite` - Invite user
- `POST /api/admin/users/{id}/suspend` - Suspend user
- `POST /api/admin/users/{id}/activate` - Activate user
- `DELETE /api/admin/users/{id}` - Delete user
- `PUT /api/admin/users/{id}/role` - Update role

### PDF Export
- `POST /api/reports/export/professional_pdf` - Generate PDF

### Public Sharing
- `GET /api/public/dashboards/{public_id}` - View shared dashboard
- `GET /api/public/charts/{chart_id}/data` - Get chart data

## Pending Tasks

### P0 - Immediate Priority (Phase 2 - Remaining)
- [ ] Drill Down - Hierarchical data exploration (Region → Country → City)
- [ ] AI Insights Panel - AI-powered textual analysis of charts
- [ ] Natural Language to Chart - Generate charts by typing commands
- [ ] Visual Data Explorer - Tableau-like drag-and-drop interface

### P1 - High Priority
- [ ] Real-time collaboration (WebSocket for multi-user editing)
- [ ] Chart Preview Thumbnails capture on save (getDataURL integration)
- [ ] SSO Integration (Survey360, FieldForce, DataPulse)
- [ ] Scheduled Report Delivery UI
- [ ] Mobile responsive improvements

### P2 - Medium Priority (Phase 3)
- [ ] Chart Version History
- [ ] Chart Comments
- [ ] Embeddable Charts
- [ ] Real-time Data Refresh
- [ ] Advanced Data Connectors
- [ ] Team Collaboration (permissions system)
- [ ] Complete backend refactoring (migrate remaining server.py endpoints)

### P3 - Additional Pages to Build
- [ ] `/data-explorer` - Visual Data Explorer (drag & drop)
- [ ] `/scheduled-reports` - Scheduled Reports Management
- [ ] `/workspaces` - Workspace Management
- [ ] `/data-lineage` - Data Lineage View
- [ ] `/audit-log` - Audit Log Page
- [ ] `/alerts` - Data Alerts Page
- [ ] `/embed-manager` - Embed Code Manager
- [ ] `/favorites` - Favorites Hub
- [ ] `/recent` - Recently Viewed

## Completed Features (March 2026)

## Test Credentials
- **Email**: `test@dataviz.com`
- **Password**: `test123`

## Third-Party Integrations
- **WeasyPrint**: Server-side PDF generation
- **html2canvas**: Frontend chart image capture
- **react-colorful**: Color picker component
- **echarts & recharts**: Charting libraries
- **emergentintegrations**: AI features (Emergent LLM Key)
- **resend**: Email delivery (requires user API key)

## Last Updated
March 6, 2026
