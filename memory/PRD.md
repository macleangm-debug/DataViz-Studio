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
- **Perfect Square Widget Layout**: Dashboard widgets now use rowHeight=80, w=4, h=4 for professional square cards
- **Cross-Filtering**: Click chart data points to filter all widgets on dashboard
- **Drill-Down**: Navigate hierarchical data within charts (Region → State → City)

## Tech Stack
- **Frontend**: React 18, Recharts, ECharts, TailwindCSS, Shadcn/UI, react-colorful, react-grid-layout
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
│   └── server.py       # Legacy monolithic file (contains dashboard/widget/AI logic)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ColorPicker.jsx         # Custom color picker
│       │   ├── NotificationCenter.jsx  # Notifications
│       │   ├── ThemeProvider.jsx       # Theme toggle
│       │   ├── KeyboardShortcuts.jsx   # Shortcuts
│       │   ├── DashboardTemplates.jsx  # Templates library
│       │   ├── AIInsightsPanel.jsx     # AI insights for widgets
│       │   ├── NaturalLanguageChart.jsx # NL to chart generation
│       │   ├── ActiveFiltersBar.jsx    # Cross-filter display
│       │   └── DrillBreadcrumb.jsx     # Drill-down navigation
│       ├── pages/
│       │   ├── ProfilePage.jsx         # User profile
│       │   ├── UserManagementPage.jsx  # Admin user management
│       │   ├── DashboardBuilderPage.jsx # Dashboard editor with square widgets
│       │   └── ...
│       ├── contexts/
│       │   └── DashboardFilterContext.jsx # Cross-filter state
│       └── layouts/
│           └── DashboardLayout.jsx     # Main layout
```

## Recent Changes

### March 6, 2026 - Dashboard Square Widget Layout (P0 UI Fix)

#### Perfect Square Widget Cards
- **GridLayout**: `rowHeight={80}`, `margin={[16, 16]}`, `cols={12}`
- **Widget Dimensions**: `w=4, h=4` for 3 equal square widgets per row
- **Chart Container**: `h-full w-full` with flex-1 to fill card completely
- **Pie/Donut Charts**: Centered at `cy="55%"` with radius `["42%", "68%"]`
- **Bar Charts**: Grid margins `{top: 16, right: 10, left: 8, bottom: 28}`
- **Stat Cards**: Centered with `flex items-center justify-center` and `text-4xl font-bold`

#### Widget Shell Styling
- Background: `bg-[#0B1730]` with `border border-white/10`
- Header: Compact with drag handle, title, and hover actions
- Chart area: `h-[calc(100%-44px)] p-3` for proper spacing

### March 6, 2026 - Feature Parity for Dashboard Widgets (P1)

#### Hover Action Buttons
- **Star (Favorite)**: Toggle favorite status with toast notification, amber fill when active
- **Maximize (View Expand)**: Opens fullscreen modal with chart, Export and AI Insights buttons
- **Sparkles (AI Insights)**: Opens AI analysis panel (charts only, not stat cards)
- **Download (Export)**: Downloads widget data as JSON file
- **Settings (Edit)**: Opens widget edit dialog with all configuration options
- **Trash (Delete)**: Deletes widget with red hover color

#### Implementation Details
- Buttons appear via CSS opacity transition (`opacity-0 group-hover:opacity-100`)
- Event propagation stopped on all button clicks
- AI Insights conditionally rendered only for `widget.type === 'chart'`
- Expanded modal includes chart preview, Export button, and AI Insights access
- Favorites stored in client-side state (not persisted to backend)

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

### March 6, 2026 - AI Features (Phase 2C) Implementation

#### AI Insights Panel
- **Endpoint**: `POST /api/ai/insights`
- **Features**: Generates statistical insights from widget data
- **Insight Types**: trend_up, trend_down, outlier, target, insight
- **Fallback**: Basic statistical analysis if AI unavailable
- **Component**: `/components/AIInsightsPanel.jsx`

#### Natural Language to Chart
- **Endpoint**: `POST /api/ai/generate-chart`
- **Features**: Convert plain English to chart configuration
- **Example Queries**: "Show sales by region", "Compare sales across quarters"
- **Output**: chart_type, title, dataset_id, x_field, y_field, aggregation, explanation
- **Component**: `/components/NaturalLanguageChart.jsx`

#### Compact Dashboard Layout
- **Row Height**: 32px (reduced from 40px)
- **Widget Height**: 4 units (reduced from 5)
- **Margin**: 6px (reduced from 10px)
- **Widgets per Row**: 3 (using w=4 in 12-col grid)

### March 6, 2026 - Drill Down (Phase 2B) Implementation

#### Drill Down MVP Features
- **Drill Hierarchy**: Configure drill path (e.g., Region → Quarter → Month)
- **Click-to-Drill**: Click bar/pie in drillable chart to navigate deeper
- **Breadcrumb Navigation**: Shows current drill path with clickable levels
- **Home/Reset Button**: Return to top level with one click
- **Drill Badge**: Visual indicator "Drill" for drillable charts, "Drilled" when navigated
- **Widget Config**: Add drilldown array in widget config (e.g., `["Region", "Quarter"]`)

#### New Components Created
- `/components/DrillBreadcrumb.jsx` - Navigation breadcrumb for drill path

#### Updated Components
- `DashboardFilterContext.jsx` - Added drill state management:
  - `initDrillState`, `getDrillState`, `drillDown`, `drillNavigate`, `drillReset`
  - `hasDrillDown`, `isDrilledDown`, `canDrillFurther`, `getCurrentDrillField`
- `DashboardBuilderPage.jsx` - Drill handlers, 3-widget-per-row layout

#### Backend Updates
- `POST /api/widgets/{id}/data` - Now accepts `drill_level` parameter
  - Request: `{ filters: {...}, drill_level: "Quarter" }`
  - Response: `{ data: [...], drilled: true, drill_level: "Quarter" }`

#### Layout Improvements
- Changed widget default width to 4 (3 widgets per row in 12-col grid)
- Reduced padding and margins for compact view
- Smaller widget titles and badges for more chart space

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

### P0 - Immediate Priority (Remaining)
- [ ] Visual Data Explorer - Tableau-like drag-and-drop interface
- [ ] Chart thumbnail capture on save (getDataURL integration)

### P1 - High Priority
- [ ] Real-time collaboration (WebSocket for multi-user editing)
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

### Phase 2C: AI Features ✅
- AI Insights Panel with GPT-5.2
- Natural Language to Chart
- Compact 3-per-row widget layout

### Phase 2B: Drill Down ✅
- Drill hierarchy configuration in widget
- Breadcrumb navigation
- Click-to-drill on bar/pie charts
- Drill/Drilled badges

### Phase 2A: Cross-Filtering ✅

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
