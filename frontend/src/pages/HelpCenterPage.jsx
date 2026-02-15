/**
 * HelpCenter Component - Main Help Center Page for DataViz Studio
 */
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, HelpCircle, ChevronRight, ChevronDown, Users, BarChart3, Settings, 
  Zap, AlertCircle, ThumbsUp, ThumbsDown, Keyboard, ArrowLeft, ClipboardList, 
  Sparkles, Layout, FileText, Database, Layers, Play, PieChart, LineChart,
  Upload, Table, Gauge, Map
} from 'lucide-react';
import { HelpAssistant } from '../components/HelpAssistant';
import { DashboardLayout } from '../layouts/DashboardLayout';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

// ========== DATAVIZ STUDIO HELP CATEGORIES ==========
const HELP_CATEGORIES = [
  {
    id: 'getting-started', title: 'Getting Started', icon: Play,
    description: 'Learn the basics of DataViz Studio', color: 'emerald',
    articles: [
      { id: 'welcome', title: 'Welcome to DataViz Studio', readTime: '3 min', popular: true },
      { id: 'dashboard-overview', title: 'Dashboard Overview', readTime: '4 min' },
      { id: 'navigation', title: 'Navigating the Interface', readTime: '3 min' },
    ]
  },
  {
    id: 'dashboards', title: 'Dashboards', icon: Layout,
    description: 'Create and customize interactive dashboards', color: 'violet',
    articles: [
      { id: 'create-dashboard', title: 'Creating Your First Dashboard', readTime: '5 min', popular: true },
      { id: 'templates', title: 'Using Dashboard Templates', readTime: '4 min' },
      { id: 'widgets', title: 'Adding & Configuring Widgets', readTime: '6 min' },
      { id: 'save-template', title: 'Saving as Custom Template', readTime: '3 min' },
    ]
  },
  {
    id: 'charts', title: 'Charts & Visualization', icon: BarChart3,
    description: 'Create stunning data visualizations', color: 'blue',
    articles: [
      { id: 'chart-types', title: 'Chart Types Guide', readTime: '8 min', popular: true },
      { id: 'chart-studio', title: 'Using Chart Studio', readTime: '6 min' },
      { id: 'annotations', title: 'Adding Annotations', readTime: '4 min' },
      { id: 'chart-styling', title: 'Styling & Customization', readTime: '5 min' },
    ]
  },
  {
    id: 'reports', title: 'Report Builder', icon: FileText,
    description: 'Build professional infographic reports', color: 'rose',
    articles: [
      { id: 'report-overview', title: 'Report Builder Overview', readTime: '5 min', popular: true },
      { id: 'add-sections', title: 'Adding Report Sections', readTime: '4 min' },
      { id: 'themes', title: 'Themes & Custom Colors', readTime: '3 min' },
      { id: 'pdf-export', title: 'Exporting to PDF', readTime: '3 min' },
    ]
  },
  {
    id: 'data', title: 'Data Management', icon: Database,
    description: 'Import, transform, and manage your data', color: 'amber',
    articles: [
      { id: 'upload-data', title: 'Uploading Data Files', readTime: '4 min' },
      { id: 'data-transform', title: 'Data Transformation Tools', readTime: '7 min' },
      { id: 'database-connections', title: 'Connecting to Databases', readTime: '6 min' },
      { id: 'scheduled-refresh', title: 'Scheduled Data Refresh', readTime: '4 min' },
    ]
  },
  {
    id: 'widgets', title: 'Widget Types', icon: Layers,
    description: 'Explore all 12 widget types', color: 'teal',
    articles: [
      { id: 'stat-cards', title: 'Stat Cards', readTime: '3 min' },
      { id: 'gauges', title: 'Gauges & Progress Bars', readTime: '4 min' },
      { id: 'tables', title: 'Tables & Lists', readTime: '4 min' },
      { id: 'maps', title: 'Maps & Heatmaps', readTime: '5 min' },
    ]
  },
];

const FAQ_DATA = [
  {
    category: 'Getting Started',
    questions: [
      { q: 'What is DataViz Studio?', a: 'DataViz Studio is a comprehensive data visualization and analytics platform. Upload data, create interactive dashboards with 12+ widget types, build infographic-style reports, and get AI-powered insights.' },
      { q: 'How do I upload my data?', a: 'Go to Data > Upload Data. You can drag-and-drop or browse for CSV, Excel (.xlsx), or JSON files up to 50MB. Data is automatically parsed and ready for visualization.' },
      { q: 'Is there a free trial?', a: 'Yes! DataViz Studio offers a free tier with basic features including dashboard creation, chart building, and data upload. Upgrade anytime for advanced features.' },
    ]
  },
  {
    category: 'Dashboards & Templates',
    questions: [
      { q: 'How do I create a dashboard from a template?', a: 'Go to Dashboards page, click "Templates" button. Choose from 10 preset templates (Sales, Marketing, Finance, etc.) or your custom templates. Click any template to create a new dashboard instantly.' },
      { q: 'Can I save my dashboard as a template?', a: 'Yes! Open your dashboard, click "Save as Template" in the header. Enter a name and description. Your template appears in the "My Templates" tab for future use.' },
      { q: 'What widget types are available?', a: 'DataViz Studio supports 12 widget types: Stat cards, Charts, Tables, Gauges, Progress bars, Maps, Funnels, Heatmaps, Scorecards, Lists, Timelines, and Sparklines.' },
    ]
  },
  {
    category: 'Reports & Export',
    questions: [
      { q: 'How do I export a report to PDF?', a: 'In Report Builder, click "Export PDF" in the top-right. The report generates a multi-page PDF with headers, footers, and page numbers. Downloads automatically.' },
      { q: 'Can I resize sections in reports?', a: 'Yes! Each section has a width dropdown (25%, 50%, 75%, 100%). Create side-by-side layouts like 50%/50% or 25%/75%.' },
      { q: 'What themes are available?', a: '6 preset themes (Blue & Coral, Purple & Teal, Green & Orange, etc.) plus custom colors. Click theme selector to preview and apply.' },
    ]
  },
  {
    category: 'Data & Charts',
    questions: [
      { q: 'What chart types are supported?', a: '9 chart types: Bar, Line, Area, Pie, Donut, Scatter, Radar, Heatmap, and Funnel. Each can be customized with colors and annotations.' },
      { q: 'How do I add annotations to charts?', a: 'In Chart Studio, go to Annotations section. Add text labels, reference lines, or highlight regions. Each annotation can be customized with position, color, and style.' },
      { q: 'How do I transform my data?', a: 'Go to Datasets, click transform icon (wand). Apply operations: filter rows, rename columns, change types, calculate fields, fill missing values. Preview before saving.' },
    ]
  },
];

const TROUBLESHOOTING_DATA = [
  { id: 'widgets-loading', title: 'Dashboard widgets not loading', symptoms: ['Blank widgets', 'Loading spinner stuck', 'Error message'], solutions: ['Refresh the page', 'Check internet connection', 'Clear browser cache', 'Ensure data source is connected', 'Contact support if persists'] },
  { id: 'pdf-blank', title: 'PDF export shows blank pages', symptoms: ['Empty pages', 'Missing charts', 'Cut-off content'], solutions: ['Switch to Preview mode first', 'Wait for all charts to load', 'Check section widths', 'Try different browser', 'Reduce number of sections'] },
  { id: 'upload-fails', title: 'Data upload fails', symptoms: ['Upload error', 'File rejected', 'Parsing error'], solutions: ['Check file format (CSV, XLSX, JSON)', 'Ensure file under 50MB', 'Verify CSV delimiter is comma', 'Check for special characters', 'Try re-saving the file'] },
  { id: 'chart-annotations', title: 'Annotations not displaying', symptoms: ['Missing labels', 'Invisible lines', 'No regions'], solutions: ['Check annotation position values', 'Ensure chart type supports annotations', 'Toggle annotation visibility', 'Verify color contrast', 'Refresh the chart'] },
  { id: 'template-save', title: 'Template not saving', symptoms: ['Save button unresponsive', 'Error on save', 'Template missing'], solutions: ['Ensure you are logged in', 'Enter template name', 'Check network connection', 'Try refreshing page', 'Contact support'] },
  { id: 'session-expired', title: 'Session expired unexpectedly', symptoms: ['Logged out', 'Session timeout', 'Lost changes'], solutions: ['Log in again', 'Check "Remember me" option', 'Dashboards auto-save', 'Enable browser cookies', 'Clear browser data'] },
];

const KEYBOARD_SHORTCUTS = [
  { category: 'General', shortcuts: [{ keys: ['Ctrl', 'S'], action: 'Save current work' }, { keys: ['Ctrl', 'Z'], action: 'Undo last action' }, { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo action' }, { keys: ['Ctrl', 'N'], action: 'Create new item' }] },
  { category: 'Reports', shortcuts: [{ keys: ['Ctrl', 'P'], action: 'Export to PDF' }, { keys: ['Ctrl', 'E'], action: 'Toggle edit/preview mode' }] },
  { category: 'Navigation', shortcuts: [{ keys: ['Ctrl', 'K'], action: 'Open quick search' }, { keys: ['Esc'], action: 'Close modal/dialog' }, { keys: ['Tab'], action: 'Navigate elements' }] },
  { category: 'Help', shortcuts: [{ keys: ['?'], action: 'Open Help Center' }, { keys: ['Ctrl', '/'], action: 'Show keyboard shortcuts' }] },
];

const WHATS_NEW = [
  { version: '2.6.0', date: 'February 2026', highlights: [
    { type: 'feature', title: 'Help Center Redesign', description: 'New sidebar navigation, improved search, and AI Assistant' },
    { type: 'feature', title: 'Visual Documentation', description: 'Detailed articles with features, steps, and visual guides' }
  ]},
  { version: '2.5.0', date: 'February 2026', highlights: [
    { type: 'feature', title: 'Dashboard Template Library', description: '10 preset templates + save your own custom templates' },
    { type: 'feature', title: '12 Widget Types', description: 'Stat cards, gauges, maps, funnels, heatmaps, and more' }
  ]},
  { version: '2.4.0', date: 'February 2026', highlights: [
    { type: 'feature', title: 'Section Resizing', description: 'Width controls (25%, 50%, 75%, 100%) for flexible layouts' },
    { type: 'improvement', title: 'Performance', description: 'Faster Report Builder with modular components' }
  ]},
  { version: '2.3.0', date: 'February 2026', highlights: [
    { type: 'feature', title: 'Text/Notes Blocks', description: 'Add custom text sections anywhere in reports' },
    { type: 'feature', title: 'Custom Color Picker', description: 'Choose your own primary and accent colors' }
  ]},
  { version: '2.2.0', date: 'February 2026', highlights: [
    { type: 'feature', title: 'Multi-Page PDF Export', description: 'Smart page breaks with headers and footers' },
    { type: 'feature', title: 'Chart Annotations', description: 'Text labels, reference lines, highlight regions' }
  ]},
];

// ========== ARTICLE CONTENT ==========
const ARTICLE_CONTENT = {
  'welcome': { 
    title: 'Welcome to DataViz Studio', 
    content: `Welcome to DataViz Studio - your complete data visualization and analytics platform!

## What You Can Do

### Upload & Manage Data
- Import CSV, Excel (.xlsx), or JSON files up to 50MB
- Connect to MongoDB, PostgreSQL, or MySQL databases
- Transform and clean data with built-in tools
- Schedule automatic data refresh

### Create Interactive Dashboards
- Choose from 10 preset dashboard templates
- Add 12 different widget types
- Customize layouts and styling
- Save your own templates for reuse

### Build Professional Reports
- WYSIWYG Report Builder with infographic layout
- 6 color themes plus custom colors
- Side-by-side sections (25%, 50%, 75%, 100%)
- Multi-page PDF export with headers/footers

### Visualize with Charts
- 9 chart types: Bar, Line, Area, Pie, Donut, Scatter, Radar, Heatmap, Funnel
- Add annotations (text labels, reference lines, highlight regions)
- AI-powered chart suggestions

### Get AI Insights
- Ask questions about your data
- Get automatic trend analysis
- Receive visualization recommendations

## Quick Start Guide
1. **Upload Data** - Go to Data > Upload Data
2. **Create Dashboard** - Go to Dashboards > New Dashboard
3. **Add Widgets** - Click "Add Widget" and configure
4. **Build Report** - Go to Export > Report Builder
5. **Export PDF** - Click "Export PDF" when ready` 
  },
  'dashboard-overview': { 
    title: 'Dashboard Overview', 
    content: `The main Dashboard is your command center in DataViz Studio.

## Main Elements

### Statistics Cards (Top Row)
- **Datasets** - Number of uploaded data files
- **Dashboards** - Total dashboards created
- **Charts** - Individual charts created
- **Data Sources** - Connected databases

### Quick Actions (Middle Section)
Fast access to common tasks:
- **Upload Data** - Import new files
- **Create Dashboard** - Start building
- **New Chart** - Create visualization
- **AI Insights** - Get data analysis

### Recent Datasets (Bottom)
Shows your recently uploaded or modified data files with:
- File name
- Row and column counts
- Last modified date
- Quick actions (view, transform, delete)

## Navigation Sidebar
The left sidebar provides access to all features:
- **Home** - Dashboard overview
- **Data** - Upload, datasets, database connections
- **Visualize** - Dashboards and charts
- **Analyze** - AI Insights and statistics
- **Export** - Report Builder, share options
- **Settings** - Profile, appearance, preferences` 
  },
  'templates': { 
    title: 'Using Dashboard Templates', 
    content: `DataViz Studio includes 10 pre-built dashboard templates to get you started quickly.

## Available Templates

### Sales Dashboard
- Revenue tracking, order metrics
- Sales funnel, regional breakdown
- 9 widgets included

### Marketing Analytics
- Campaign performance, traffic sources
- Conversion metrics, engagement
- 9 widgets included

### Customer Insights
- Customer segments, demographics
- Behavior analysis, satisfaction
- 9 widgets included

### Financial Summary
- P&L overview, cash flow
- Budget tracking, expenses
- 8 widgets included

### Operations Monitor
- Inventory levels, order status
- Logistics, supply chain
- 8 widgets included

### And 5 More...
- Web Analytics, Executive Summary
- Project Tracker, Support Dashboard
- Blank Canvas (start from scratch)

## How to Use Templates
1. Go to **Dashboards** page
2. Click **"Templates"** button (top-right)
3. Browse **Preset** tab or **My Templates** tab
4. Use **Category Filter** to narrow options
5. **Click any template** to create dashboard

## Saving Custom Templates
1. Open your finished dashboard
2. Click **"Save as Template"** in header
3. Enter **name** and **description**
4. Click **Save**
5. Find it in **"My Templates"** tab` 
  },
  'chart-types': { 
    title: 'Chart Types Guide', 
    content: `DataViz Studio supports 9 chart types for visualizing your data.

## Bar Chart
**Best for:** Comparing values across categories
- Vertical or horizontal orientation
- Grouped or stacked bars
- Custom colors per category

## Line Chart
**Best for:** Showing trends over time
- Multiple series support
- Smooth or stepped lines
- Area fill option

## Area Chart
**Best for:** Cumulative totals, part-to-whole
- Stacked or overlapping
- Gradient fill options
- Trend visualization

## Pie Chart
**Best for:** Proportions of a whole
- Up to 10 slices recommended
- Labels and percentages
- Exploded slice option

## Donut Chart
**Best for:** Similar to pie, with center space
- Center label/value display
- Ring thickness control
- Good for single metrics

## Scatter Plot
**Best for:** Correlation between variables
- X/Y axis mapping
- Point size and color
- Trend line option

## Radar Chart
**Best for:** Multi-dimensional comparison
- 3-8 dimensions ideal
- Multiple series overlay
- Skills/performance analysis

## Heatmap
**Best for:** Density visualization
- Color intensity by value
- Grid-based layout
- Time-based patterns

## Funnel Chart
**Best for:** Stage-based conversion
- Sales pipeline
- User journey stages
- Dropout analysis` 
  },
  'report-overview': { 
    title: 'Report Builder Overview', 
    content: `Create professional, infographic-style reports with the WYSIWYG Report Builder.

## Key Features

### Header Settings
- **Report Title** - Main heading
- **Subtitle** - Secondary description
- **Company Name** - Optional branding

### Color Themes
6 preset themes available:
- Blue & Coral (default)
- Purple & Teal
- Green & Orange
- Slate & Amber
- Indigo & Rose
- Cyan & Pink

Plus **Custom Colors** option!

### Section Types
Add any combination of:
- **Key Metrics** - 4 stat cards with icons
- **Bar Chart** - Vertical bar visualization
- **Pie Chart** - Circular proportions
- **Line Chart** - Trend visualization
- **Data Table** - Tabular information
- **Text/Notes** - Custom text blocks
- **Introduction/Conclusion** - Narrative

### Layout Features
- **Width Control** - 25%, 50%, 75%, 100%
- **Drag Reorder** - Up/down arrows
- **Delete Sections** - Trash button
- **Real-time Preview** - See changes instantly

## PDF Export
- **Multi-page** - Smart page breaks
- **Continuation Headers** - On pages 2+
- **Footers** - Branding + page numbers
- **High Quality** - 2x resolution` 
  },
  'pdf-export': { 
    title: 'Exporting to PDF', 
    content: `Export your reports as professional PDF documents.

## How to Export

### Step 1: Prepare Report
- Add all sections you need
- Configure section widths
- Review content in preview

### Step 2: Switch to Preview
- Click **"Preview"** button
- Verify layout looks correct
- Check all charts are loaded

### Step 3: Export
- Click **"Export PDF"** button
- Wait for generation (few seconds)
- PDF downloads automatically

## PDF Features

### Page Breaks
- Intelligent automatic breaks
- Sections don't split mid-content
- Clean page transitions

### Headers
- Report title on page 1
- "Report Title (continued)" on pages 2+
- Consistent styling

### Footers
- DataViz Studio branding
- Page numbers (Page X of Y)
- On all pages

### Quality
- 2x resolution rendering
- Crisp text and charts
- Professional appearance

## Filename Format
\`Report_Title_YYYYMMDD_HHMMSS.pdf\`

## Troubleshooting
- Blank pages? → Ensure Preview mode
- Missing charts? → Wait for load
- Cut off content? → Adjust section widths` 
  },
  'upload-data': { 
    title: 'Uploading Data Files', 
    content: `Import your data from CSV, Excel, or JSON files.

## Supported Formats

### CSV Files
- Comma-separated values
- Auto-delimiter detection
- UTF-8 encoding recommended

### Excel Files
- .xlsx and .xls formats
- First sheet imported
- Headers from row 1

### JSON Files
- Array of objects format
- Nested structure parsing
- Auto field detection

## File Size Limit
Maximum **50MB** per file

## How to Upload

### Step 1: Navigate
Go to **Data > Upload Data**

### Step 2: Select File
- **Drag and drop** file onto zone
- Or click **"Browse Files"**

### Step 3: Wait for Processing
- Upload progress shown
- Automatic parsing
- Preview appears

### Step 4: Confirm
- Review column names
- Check data types
- Dataset ready!

## After Upload
Your dataset is immediately available for:
- Dashboard widgets
- Chart Studio
- Data transformation
- AI Insights analysis` 
  },
  'data-transform': { 
    title: 'Data Transformation Tools', 
    content: `Clean and prepare your data with built-in transformation tools.

## Available Transformations

### Filter Rows
Remove rows based on conditions:
- Equals, not equals
- Greater than, less than
- Contains, starts with
- Is null, is not null
- 10+ operators available

### Rename Column
Change column names for clarity

### Change Type
Convert data types:
- String (text)
- Integer (whole numbers)
- Float (decimals)
- Date/DateTime
- Boolean (true/false)

### Calculate Field
Create computed columns:
- Math operations (+, -, *, /)
- Concatenation
- Conditional logic

### Fill Missing
Handle null values:
- Replace with value
- Use mean/median/mode
- Forward/backward fill
- Drop rows with nulls

### Drop Column
Remove unwanted columns

### Sort Data
Order by any column (asc/desc)

## How to Transform

### Step 1: Open Transform
Go to **Data > Datasets**, click **transform icon** (wand)

### Step 2: Add Steps
Click **"Add Transformation"**, select type

### Step 3: Configure
Set parameters for each step

### Step 4: Preview
Click **"Preview"** to see changes

### Step 5: Apply
Click **"Save Changes"** to apply permanently

## Tips
- Steps can be toggled on/off
- Reorder steps as needed
- Preview before saving!` 
  },
};

// ========== MAIN COMPONENT ==========
export function HelpCenterPage({ isDark = true }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || null);
  const [activeArticle, setActiveArticle] = useState(searchParams.get('article') || null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [articleFeedback, setArticleFeedback] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);

  const bgPrimary = isDark ? 'bg-[#0a1628]' : 'bg-gray-50';
  const bgSecondary = isDark ? 'bg-[#0f1d32]' : 'bg-white';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-400';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100';

  const searchResults = searchQuery.trim() ? HELP_CATEGORIES.flatMap(cat => cat.articles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase())).map(a => ({ ...a, category: cat }))) : [];

  const handleArticleClick = (categoryId, articleId) => {
    setActiveCategory(categoryId);
    setActiveArticle(articleId);
    setActiveTab('article');
    setSearchParams({ tab: 'article', category: categoryId, article: articleId });
  };

  const getArticleContent = (articleId) => ARTICLE_CONTENT[articleId] || { title: 'Article Not Found', content: 'This article is not available yet. Please check back later or use the AI Assistant for help.' };

  const colorMap = {
    emerald: 'text-emerald-500',
    violet: 'text-violet-500',
    blue: 'text-blue-500',
    rose: 'text-rose-500',
    amber: 'text-amber-500',
    teal: 'text-teal-500',
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'article':
        const article = getArticleContent(activeArticle);
        return (
          <div className="space-y-6">
            <button onClick={() => { setActiveTab('home'); setSearchParams({}); }} className={cn("flex items-center gap-2 text-sm", textSecondary, hoverBg, "px-3 py-2 rounded-lg")}>
              <ArrowLeft className="w-4 h-4" />Back to Help Center
            </button>
            <div className={cn(bgSecondary, borderColor, "border rounded-xl p-6")}>
              <h1 className={cn("text-2xl font-bold mb-6", textPrimary)}>{article.title}</h1>
              <div className={cn("prose prose-invert max-w-none", textSecondary)}>
                {article.content.split('\n').map((line, idx) => {
                  if (line.startsWith('## ')) {
                    return <h2 key={idx} className={cn("text-xl font-bold mt-6 mb-3", textPrimary)}>{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={idx} className={cn("text-lg font-semibold mt-4 mb-2", textPrimary)}>{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('- ')) {
                    return <li key={idx} className={cn("ml-4", textSecondary)}>{line.replace('- ', '')}</li>;
                  }
                  if (line.match(/^\d+\./)) {
                    return <li key={idx} className={cn("ml-4 list-decimal", textSecondary)}>{line.replace(/^\d+\.\s*/, '')}</li>;
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={idx} className={cn("font-semibold", textPrimary)}>{line.replace(/\*\*/g, '')}</p>;
                  }
                  if (line.trim() === '') {
                    return <br key={idx} />;
                  }
                  return <p key={idx} className={textSecondary}>{line}</p>;
                })}
              </div>
            </div>
            <div className={cn(bgSecondary, borderColor, "border rounded-xl p-4")}>
              <p className={cn("text-sm font-medium mb-3", textPrimary)}>Was this article helpful?</p>
              <div className="flex gap-2">
                <button onClick={() => setArticleFeedback(p => ({ ...p, [activeArticle]: 'yes' }))} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors", articleFeedback[activeArticle] === 'yes' ? "bg-green-500/20 text-green-400" : cn(hoverBg, textSecondary))}>
                  <ThumbsUp className="w-4 h-4" />Yes, thanks!
                </button>
                <button onClick={() => setArticleFeedback(p => ({ ...p, [activeArticle]: 'no' }))} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors", articleFeedback[activeArticle] === 'no' ? "bg-red-500/20 text-red-400" : cn(hoverBg, textSecondary))}>
                  <ThumbsDown className="w-4 h-4" />Could be better
                </button>
              </div>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-6">
            <h2 className={cn("text-xl font-bold", textPrimary)}>Frequently Asked Questions</h2>
            {FAQ_DATA.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-3">
                <h3 className={cn("font-semibold text-violet-400")}>{cat.category}</h3>
                {cat.questions.map((faq, qIdx) => {
                  const faqId = `${catIdx}-${qIdx}`;
                  const isExpanded = expandedFaq === faqId;
                  return (
                    <div key={qIdx} className={cn(bgSecondary, borderColor, "border rounded-xl overflow-hidden")}>
                      <button onClick={() => setExpandedFaq(isExpanded ? null : faqId)} className={cn("w-full flex items-center justify-between p-4 text-left", hoverBg)}>
                        <span className={cn("font-medium", textPrimary)}>{faq.q}</span>
                        <ChevronDown className={cn("w-5 h-5 transition-transform", textSecondary, isExpanded && "rotate-180")} />
                      </button>
                      {isExpanded && <div className={cn("px-4 pb-4", textSecondary)}>{faq.a}</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );

      case 'troubleshooting':
        return (
          <div className="space-y-6">
            <h2 className={cn("text-xl font-bold", textPrimary)}>Troubleshooting Guide</h2>
            <p className={textSecondary}>Find solutions to common issues</p>
            {TROUBLESHOOTING_DATA.map((issue) => (
              <div key={issue.id} className={cn(bgSecondary, borderColor, "border rounded-xl p-4 cursor-pointer transition-colors", hoverBg)} onClick={() => setSelectedIssue(selectedIssue === issue.id ? null : issue.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h3 className={cn("font-semibold", textPrimary)}>{issue.title}</h3>
                  </div>
                  <ChevronRight className={cn("w-5 h-5 transition-transform", textSecondary, selectedIssue === issue.id && "rotate-90")} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3 ml-8">
                  {issue.symptoms.map((s, idx) => <span key={idx} className={cn("text-xs px-2 py-1 rounded-full", isDark ? "bg-white/10" : "bg-gray-100", textSecondary)}>{s}</span>)}
                </div>
                {selectedIssue === issue.id && (
                  <div className="mt-4 ml-8 pt-4 border-t border-white/10">
                    <p className={cn("text-sm font-medium mb-3", textPrimary)}>Solutions:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      {issue.solutions.map((sol, idx) => <li key={idx} className={cn("text-sm", textSecondary)}>{sol}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-6">
            <h2 className={cn("text-xl font-bold", textPrimary)}>Keyboard Shortcuts</h2>
            <p className={textSecondary}>Speed up your workflow with these shortcuts</p>
            {KEYBOARD_SHORTCUTS.map((group, idx) => (
              <div key={idx} className={cn(bgSecondary, borderColor, "border rounded-xl p-5")}>
                <h3 className={cn("font-semibold mb-4 text-violet-400")}>{group.category}</h3>
                <div className="space-y-3">
                  {group.shortcuts.map((s, sIdx) => (
                    <div key={sIdx} className="flex items-center justify-between">
                      <span className={textSecondary}>{s.action}</span>
                      <div className="flex gap-1">
                        {s.keys.map((key, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd className={cn("px-2.5 py-1 text-xs rounded font-mono", isDark ? "bg-white/10 border border-white/20" : "bg-gray-100 border border-gray-300", textPrimary)}>{key}</kbd>
                            {kIdx < s.keys.length - 1 && <span className={textMuted}>+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'whats-new':
        return (
          <div className="space-y-6">
            <h2 className={cn("text-xl font-bold", textPrimary)}>What's New in DataViz Studio</h2>
            <p className={textSecondary}>Latest features and improvements</p>
            {WHATS_NEW.map((release, idx) => (
              <div key={idx} className={cn(bgSecondary, borderColor, "border rounded-xl p-5")}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={cn("px-3 py-1 rounded-full text-sm font-semibold bg-violet-500/20 text-violet-400")}>v{release.version}</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className={textMuted}>{release.date}</span>
                </div>
                <div className="space-y-3">
                  {release.highlights.map((item, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded mt-0.5", item.type === 'feature' ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400")}>{item.type}</span>
                      <div>
                        <p className={cn("font-medium", textPrimary)}>{item.title}</p>
                        <p className={cn("text-sm", textSecondary)}>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      default: // home
        return (
          <div className="space-y-6">
            {/* Quick Links */}
            <div className={cn(bgSecondary, borderColor, "border rounded-xl p-5")}>
              <h2 className={cn("font-semibold mb-4", textPrimary)}>Quick Links</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { tab: 'faq', icon: HelpCircle, label: 'FAQs', color: 'text-blue-400' },
                  { tab: 'troubleshooting', icon: AlertCircle, label: 'Troubleshooting', color: 'text-amber-400' },
                  { tab: 'shortcuts', icon: Keyboard, label: 'Shortcuts', color: 'text-green-400' },
                  { tab: 'whats-new', icon: Sparkles, label: "What's New", color: 'text-violet-400' },
                ].map(({ tab, icon: Icon, label, color }) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all", isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200", borderColor, "border hover:border-violet-500/30")}>
                    <Icon className={cn("w-5 h-5", color)} />
                    <span className={cn("text-sm font-medium", textPrimary)}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Articles */}
            <div className={cn(bgSecondary, borderColor, "border rounded-xl p-5")}>
              <h2 className={cn("font-semibold mb-4", textPrimary)}>Popular Articles</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {HELP_CATEGORIES.flatMap(cat => cat.articles.filter(a => a.popular).map(a => ({ ...a, category: cat }))).slice(0, 4).map((article) => {
                  const Icon = article.category.icon;
                  return (
                    <button key={article.id} onClick={() => handleArticleClick(article.category.id, article.id)} className={cn("flex items-center gap-4 p-4 rounded-xl text-left transition-all", isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200", borderColor, "border hover:border-violet-500/30")}>
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isDark ? "bg-white/10" : "bg-gray-200")}>
                        <Icon className={cn("w-5 h-5", colorMap[article.category.color])} />
                      </div>
                      <div className="flex-1">
                        <h3 className={cn("font-medium", textPrimary)}>{article.title}</h3>
                        <p className={cn("text-sm", textMuted)}>{article.category.title} • {article.readTime}</p>
                      </div>
                      <ChevronRight className={cn("w-5 h-5", textMuted)} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categories Preview */}
            {HELP_CATEGORIES.slice(0, 3).map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className={cn(bgSecondary, borderColor, "border rounded-xl p-5")}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isDark ? "bg-white/10" : "bg-gray-200")}>
                      <Icon className={cn("w-5 h-5", colorMap[category.color])} />
                    </div>
                    <div>
                      <h2 className={cn("font-semibold", textPrimary)}>{category.title}</h2>
                      <p className={cn("text-sm", textMuted)}>{category.description}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {category.articles.slice(0, 2).map((article) => (
                      <button key={article.id} onClick={() => handleArticleClick(category.id, article.id)} className={cn("text-left p-4 rounded-xl transition-all", isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200", borderColor, "border hover:border-violet-500/30")}>
                        <h3 className={cn("font-medium mb-1", textPrimary)}>{article.title}</h3>
                        <p className={cn("text-sm", textMuted)}>{article.readTime} read</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className={cn("min-h-screen", bgPrimary)} data-testid="help-center-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className={cn("text-3xl font-bold mb-2", textPrimary)}>Help Center</h1>
          <p className={textSecondary}>Find answers, tutorials, and documentation for DataViz Studio</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", textMuted)} />
          <input 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Search articles, FAQs, and more..." 
            className={cn("w-full pl-12 py-4 rounded-xl text-sm", bgSecondary, borderColor, "border", textPrimary, "placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500/50")} 
            data-testid="help-search-input"
          />
          {searchQuery && searchResults.length > 0 && (
            <div className={cn("absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto z-50 rounded-xl shadow-xl", bgSecondary, borderColor, "border")}>
              {searchResults.map((result, idx) => (
                <button key={idx} onClick={() => { handleArticleClick(result.category.id, result.id); setSearchQuery(''); }} className={cn("w-full text-left px-4 py-3 border-b last:border-0", borderColor, hoverBg)}>
                  <p className={cn("text-sm font-medium", textPrimary)}>{result.title}</p>
                  <p className={cn("text-xs", textMuted)}>{result.category.title} • {result.readTime}</p>
                </button>
              ))}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && (
            <div className={cn("absolute top-full left-0 right-0 mt-2 p-4 rounded-xl shadow-xl text-center", bgSecondary, borderColor, "border")}>
              <p className={textSecondary}>No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Main Layout */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className={cn("w-72 flex-shrink-0 rounded-xl p-5 h-fit sticky top-4", bgSecondary, borderColor, "border")}>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <ClipboardList className="w-4 h-4 text-violet-500" />
              </div>
              <h2 className={cn("font-semibold", textPrimary)}>Categories</h2>
            </div>
            <nav className="space-y-1">
              {HELP_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isExpanded = expandedCategory === category.id;
                return (
                  <div key={category.id}>
                    <button onClick={() => setExpandedCategory(isExpanded ? null : category.id)} className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors", isExpanded ? cn(isDark ? "bg-white/5" : "bg-gray-100", textPrimary) : cn(textSecondary, hoverBg))}>
                      <div className="flex items-center gap-3">
                        <Icon className={cn("w-4 h-4", colorMap[category.color])} />
                        <span>{category.title}</span>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90")} />
                    </button>
                    {isExpanded && (
                      <div className="ml-10 mt-1 space-y-1">
                        {category.articles.map((article) => (
                          <button key={article.id} onClick={() => handleArticleClick(category.id, article.id)} className={cn("w-full text-left px-3 py-1.5 text-sm transition-colors rounded", textMuted, "hover:text-violet-400")}>
                            {article.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            
            {/* Sidebar Links */}
            <div className={cn("mt-6 pt-4 border-t space-y-1", borderColor)}>
              {[
                { tab: 'faq', icon: HelpCircle, label: 'FAQs' },
                { tab: 'troubleshooting', icon: AlertCircle, label: 'Troubleshooting' },
                { tab: 'shortcuts', icon: Keyboard, label: 'Shortcuts' },
                { tab: 'whats-new', icon: Sparkles, label: "What's New" },
              ].map(({ tab, icon: Icon, label }) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setSearchParams({ tab }); }} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors", activeTab === tab ? cn(isDark ? "bg-white/5" : "bg-gray-100", textPrimary) : cn(textSecondary, hoverBg))} data-testid={`tab-${tab}`}>
                  <Icon className="w-4 h-4 text-violet-500/70" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>

        {/* AI Assistant */}
        <HelpAssistant isDark={isDark} />
      </div>
    </DashboardLayout>
  );
}

export default HelpCenterPage;
