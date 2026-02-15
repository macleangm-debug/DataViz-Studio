import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Book, HelpCircle, MessageCircle, Keyboard, 
  ChevronRight, ChevronDown, ExternalLink, Play, Star,
  BarChart3, PieChart, Table, FileText, Download, Upload,
  Layout, Palette, Settings, Database, Sparkles, Zap,
  AlertCircle, CheckCircle, Info, ArrowRight, Clock,
  TrendingUp, Users, Target, Activity, Layers, X,
  Monitor, MousePointer, Grid, Columns, Image
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import HelpAssistant, { HelpAssistantButton } from '../components/HelpAssistant';
import { useAuthStore } from '../store';

// =============================================================================
// SCREENSHOT/IMAGE DATA - Using preview URLs
// =============================================================================

const SCREENSHOT_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Helper to get screenshot path
const getScreenshotUrl = (path) => `/images/docs/${path}`;

// =============================================================================
// DETAILED ARTICLE CONTENT WITH SCREENSHOTS
// =============================================================================

const DETAILED_ARTICLES = {
  'getting-started': {
    title: 'Getting Started with DataViz Studio',
    icon: Play,
    color: 'from-green-500 to-emerald-600',
    sections: [
      {
        title: 'Welcome to DataViz Studio',
        content: `DataViz Studio is your complete data visualization and analytics platform. 
        Transform raw data into beautiful, interactive dashboards and reports.`,
        features: [
          'Upload CSV, Excel, or JSON files instantly',
          'Create interactive dashboards with 12+ widget types',
          'Build professional infographic-style reports',
          'Get AI-powered insights from your data',
          'Export to PDF with one click'
        ],
        screenshot: {
          description: 'Main Dashboard showing Quick Actions, Statistics, and Recent Datasets',
          elements: [
            { label: 'Stats Cards', position: 'top', desc: 'View counts of Datasets, Dashboards, Charts, and Data Sources' },
            { label: 'Quick Actions', position: 'middle', desc: 'Upload Data, Create Dashboard, New Chart, AI Insights' },
            { label: 'Recent Datasets', position: 'bottom', desc: 'Your recently uploaded data files' }
          ]
        }
      },
      {
        title: 'Navigating the Interface',
        content: `The sidebar on the left provides access to all major features. The top bar includes global search and user settings.`,
        features: [
          'Home - Your personalized dashboard overview',
          'Data - Upload files, manage datasets, connect databases',
          'Visualize - Create dashboards and charts',
          'Analyze - AI Insights and statistics',
          'Export - Report Builder, share, and export options',
          'Settings - Profile, appearance, and preferences'
        ],
        screenshot: {
          description: 'Sidebar Navigation with all main sections',
          elements: [
            { label: 'Sidebar', position: 'left', desc: 'Main navigation menu' },
            { label: 'Search Bar', position: 'top', desc: 'Search datasets, dashboards, and charts' },
            { label: 'User Menu', position: 'top-right', desc: 'Profile and logout options' }
          ]
        }
      }
    ]
  },
  'dashboards': {
    title: 'Creating & Managing Dashboards',
    icon: Layout,
    color: 'from-violet-500 to-purple-600',
    sections: [
      {
        title: 'Dashboard Templates',
        content: `Start quickly with one of 10 pre-built dashboard templates, or create your own from scratch.`,
        features: [
          'Sales Dashboard - Revenue, orders, and sales metrics',
          'Marketing Analytics - Campaign performance and traffic',
          'Customer Insights - Behavior and demographics',
          'Financial Summary - P&L, cash flow, budgets',
          'Operations Monitor - Inventory and logistics',
          'Executive Summary - High-level KPIs',
          '...and 4 more specialized templates'
        ],
        steps: [
          'Go to Visualize > Dashboards',
          'Click the "Templates" button in the top-right',
          'Browse Preset templates or your My Templates',
          'Click any template to create a new dashboard instantly'
        ],
        screenshot: {
          description: 'Templates Dialog showing 10 preset templates with category filter',
          elements: [
            { label: 'Preset Tab', position: 'top', desc: '10 pre-built templates' },
            { label: 'My Templates Tab', position: 'top', desc: 'Your saved custom templates' },
            { label: 'Category Filter', position: 'top-right', desc: 'Filter by sales, marketing, finance, etc.' },
            { label: 'Template Cards', position: 'center', desc: 'Click to create dashboard' }
          ]
        }
      },
      {
        title: 'Adding Widgets',
        content: `Dashboards are built from widgets - individual components that display your data.`,
        features: [
          'Stat Cards - Show key metrics with icons',
          'Charts - Bar, Line, Pie, Area, and more',
          'Tables - Display tabular data',
          'Gauges - Show progress towards goals',
          'Maps - Geographic visualizations',
          'Sparklines - Mini inline charts'
        ],
        steps: [
          'Open a dashboard or create a new one',
          'Click "Add Widget" button',
          'Select widget type from the panel',
          'Configure the widget settings',
          'Drag to position and resize as needed'
        ],
        screenshot: {
          description: 'Dashboard Builder with widgets and Add Widget panel',
          elements: [
            { label: 'Add Widget Button', position: 'top-right', desc: 'Opens widget selection panel' },
            { label: 'Widget Grid', position: 'center', desc: 'Drag to reposition widgets' },
            { label: 'Widget Settings', position: 'right', desc: 'Configure data source and appearance' }
          ]
        }
      },
      {
        title: 'Saving as Template',
        content: `Save any dashboard as a reusable template for future use or sharing with your team.`,
        steps: [
          'Open the dashboard you want to save',
          'Click "Save as Template" in the header',
          'Enter a name and optional description',
          'Click Save',
          'Find your template in the "My Templates" tab'
        ],
        screenshot: {
          description: 'Save as Template button and dialog',
          elements: [
            { label: 'Save as Template Button', position: 'top', desc: 'In dashboard header' },
            { label: 'Template Name Input', position: 'center', desc: 'Name your template' },
            { label: 'Save Button', position: 'bottom', desc: 'Creates the template' }
          ]
        }
      }
    ]
  },
  'charts': {
    title: 'Charts & Visualizations',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-600',
    sections: [
      {
        title: 'Chart Types',
        content: `DataViz Studio supports 9 different chart types to visualize your data.`,
        features: [
          'Bar Chart - Compare values across categories',
          'Line Chart - Show trends over time',
          'Area Chart - Visualize cumulative totals',
          'Pie Chart - Show proportions of a whole',
          'Donut Chart - Like pie with center space',
          'Scatter Plot - Show correlation between variables',
          'Radar Chart - Multi-dimensional comparison',
          'Heatmap - Density and intensity visualization',
          'Funnel Chart - Stage-based conversion'
        ],
        screenshot: {
          description: 'Chart Studio with chart type selector and live preview',
          elements: [
            { label: 'Chart Type Selector', position: 'left', desc: '9 chart types to choose from' },
            { label: 'Data Configuration', position: 'left', desc: 'Select X and Y axis fields' },
            { label: 'Live Preview', position: 'center', desc: 'See chart update in real-time' },
            { label: 'Style Options', position: 'right', desc: 'Colors, labels, and formatting' }
          ]
        }
      },
      {
        title: 'Adding Annotations',
        content: `Annotations help highlight important data points, trends, or reference values on your charts.`,
        features: [
          'Text Labels - Add notes to specific points',
          'Reference Lines - Horizontal or vertical markers',
          'Highlight Regions - Shade areas of interest'
        ],
        steps: [
          'Open Chart Studio or edit an existing chart',
          'Scroll to the Annotations section',
          'Click "Add Annotation"',
          'Choose annotation type (Text, Line, or Region)',
          'Configure position, label, and color',
          'Toggle visibility on/off as needed'
        ],
        screenshot: {
          description: 'Annotations panel showing different annotation types',
          elements: [
            { label: 'Add Annotation Button', position: 'top', desc: 'Opens annotation dialog' },
            { label: 'Annotation List', position: 'center', desc: 'Manage existing annotations' },
            { label: 'Toggle Switch', position: 'right', desc: 'Show/hide each annotation' }
          ]
        }
      }
    ]
  },
  'reports': {
    title: 'Report Builder',
    icon: FileText,
    color: 'from-rose-500 to-pink-600',
    sections: [
      {
        title: 'Report Builder Overview',
        content: `Create professional, infographic-style reports with the WYSIWYG Report Builder.`,
        features: [
          'Customizable header with title, subtitle, and company name',
          '6 built-in color themes plus custom colors',
          'Drag-and-drop section reordering',
          'Side-by-side layouts (25%, 50%, 75%, 100% widths)',
          'Real-time preview panel',
          'Multi-page PDF export'
        ],
        screenshot: {
          description: 'Report Builder interface with header settings and preview',
          elements: [
            { label: 'Header Settings', position: 'top', desc: 'Title, subtitle, company name' },
            { label: 'Theme Selector', position: 'top-right', desc: 'Choose color theme' },
            { label: 'Preview Panel', position: 'center', desc: 'Live report preview' },
            { label: 'Export PDF Button', position: 'top-right', desc: 'Generate PDF download' }
          ]
        }
      },
      {
        title: 'Adding Sections',
        content: `Reports are built from sections. Add any combination of charts, stats, tables, and text.`,
        features: [
          'Key Metrics - 4 stat cards with icons',
          'Bar Chart - Vertical bar visualization',
          'Pie Chart - Circular proportions',
          'Line Chart - Trend visualization',
          'Data Table - Tabular information',
          'Text/Notes - Custom text blocks',
          'Introduction/Conclusion - Narrative sections'
        ],
        steps: [
          'Scroll to the "Add Section" panel',
          'Click on the section type you want',
          'The section appears in the preview',
          'Use arrows to reorder sections',
          'Use the trash icon to remove sections'
        ],
        screenshot: {
          description: 'Add Section panel with 7 section types',
          elements: [
            { label: 'Section Type Buttons', position: 'center', desc: 'Click to add section' },
            { label: 'Reorder Arrows', position: 'right', desc: 'Move sections up/down' },
            { label: 'Delete Button', position: 'right', desc: 'Remove section' }
          ]
        }
      },
      {
        title: 'Section Resizing',
        content: `Create flexible layouts by adjusting the width of each section.`,
        features: [
          '100% - Full width section',
          '75% - Three-quarter width',
          '50% - Half width (side-by-side layouts)',
          '25% - Quarter width (4 columns)'
        ],
        steps: [
          'Find the width dropdown in the section header',
          'Click to open width options',
          'Select desired width (25%, 50%, 75%, 100%)',
          'Sections automatically flow side-by-side'
        ],
        screenshot: {
          description: 'Width dropdown showing resize options',
          elements: [
            { label: 'Width Dropdown', position: 'top-right', desc: 'Per-section width control' },
            { label: 'Side-by-side Preview', position: 'center', desc: 'Two 50% sections together' }
          ]
        }
      },
      {
        title: 'PDF Export',
        content: `Export your report as a professional PDF document with automatic page breaks.`,
        features: [
          'Automatic page breaks at section boundaries',
          'Continuation header on pages 2+',
          'Footer with DataViz Studio branding',
          'Page numbers on all pages',
          'High-quality 2x resolution'
        ],
        steps: [
          'Click "Preview" to see final layout',
          'Click "Export PDF" button',
          'Wait for generation (few seconds)',
          'PDF downloads automatically',
          'Filename includes timestamp'
        ],
        screenshot: {
          description: 'Export PDF button and multi-page preview',
          elements: [
            { label: 'Export PDF Button', position: 'top-right', desc: 'Generates and downloads PDF' },
            { label: 'Preview Mode', position: 'center', desc: 'Shows exact PDF layout' }
          ]
        }
      }
    ]
  },
  'data': {
    title: 'Data Management',
    icon: Database,
    color: 'from-amber-500 to-orange-600',
    sections: [
      {
        title: 'Uploading Data',
        content: `Import your data from CSV, Excel, or JSON files in seconds.`,
        features: [
          'Drag-and-drop file upload',
          'CSV with automatic delimiter detection',
          'Excel (.xlsx, .xls) with sheet selection',
          'JSON with nested structure parsing',
          'Up to 50MB file size'
        ],
        steps: [
          'Go to Data > Upload Data',
          'Drag your file or click "Browse Files"',
          'Wait for upload and parsing',
          'Preview your data structure',
          'Dataset is now ready for visualization'
        ],
        screenshot: {
          description: 'Upload Data page with drag-drop zone',
          elements: [
            { label: 'Drop Zone', position: 'center', desc: 'Drag files here' },
            { label: 'Browse Button', position: 'center', desc: 'Open file picker' },
            { label: 'Supported Formats', position: 'bottom', desc: 'CSV, Excel, JSON icons' }
          ]
        }
      },
      {
        title: 'Data Transformation',
        content: `Clean and prepare your data with built-in transformation tools.`,
        features: [
          'Filter Rows - Remove rows based on conditions',
          'Rename Column - Change column names',
          'Change Type - Convert data types',
          'Calculate Field - Create computed columns',
          'Fill Missing - Handle null values',
          'Drop Column - Remove unwanted columns',
          'Sort Data - Order by any column'
        ],
        steps: [
          'Go to Data > Datasets',
          'Click the transform icon (wand) on a dataset',
          'Add transformation steps',
          'Preview changes before applying',
          'Click "Save Changes" to apply permanently'
        ],
        screenshot: {
          description: 'Data Transform page with transformation steps',
          elements: [
            { label: 'Transformation Panel', position: 'left', desc: 'Add and configure steps' },
            { label: 'Data Preview', position: 'right', desc: 'See changes in real-time' },
            { label: 'Save Changes Button', position: 'bottom', desc: 'Apply transformations' }
          ]
        }
      },
      {
        title: 'Database Connections',
        content: `Connect directly to MongoDB, PostgreSQL, or MySQL databases for real-time data.`,
        features: [
          'MongoDB - Connect to document databases',
          'PostgreSQL - Enterprise SQL databases',
          'MySQL - Popular relational databases',
          'Test connection before saving',
          'Scheduled data refresh',
          'Schema introspection'
        ],
        steps: [
          'Go to Data > Database Connections',
          'Click "Add Connection"',
          'Select database type',
          'Enter connection details (host, port, credentials)',
          'Click "Test Connection" to verify',
          'Click "Save" to create connection',
          'Use "Sync" to pull data'
        ],
        screenshot: {
          description: 'Database Connections page with MongoDB, PostgreSQL, MySQL options',
          elements: [
            { label: 'Database Type Cards', position: 'top', desc: 'MongoDB, PostgreSQL, MySQL' },
            { label: 'Add Connection Button', position: 'top-right', desc: 'Opens connection dialog' },
            { label: 'Connection List', position: 'center', desc: 'Manage existing connections' }
          ]
        }
      }
    ]
  },
  'widgets': {
    title: 'Widget Types Reference',
    icon: Layers,
    color: 'from-teal-500 to-green-600',
    sections: [
      {
        title: 'Stat Cards',
        content: `Display key metrics prominently with icons and trend indicators.`,
        features: [
          'Large number display',
          'Customizable icon and color',
          'Trend arrow (up/down)',
          'Percentage change indicator',
          'Description text'
        ],
        screenshot: {
          description: 'Stat card widget showing revenue with trend',
          elements: [
            { label: 'Value', position: 'center', desc: 'Large metric number' },
            { label: 'Icon', position: 'top-left', desc: 'Visual indicator' },
            { label: 'Trend', position: 'bottom', desc: 'Change percentage' }
          ]
        }
      },
      {
        title: 'Gauges & Progress',
        content: `Visualize progress towards goals with circular gauges and progress bars.`,
        features: [
          'Circular gauge with needle',
          'Progress bar (horizontal)',
          'Custom min/max values',
          'Color zones (green/yellow/red)',
          'Target markers'
        ],
        screenshot: {
          description: 'Gauge widget showing completion percentage',
          elements: [
            { label: 'Gauge Arc', position: 'center', desc: 'Visual progress indicator' },
            { label: 'Value Display', position: 'center', desc: 'Current value' },
            { label: 'Target Line', position: 'right', desc: 'Goal marker' }
          ]
        }
      },
      {
        title: 'Tables & Lists',
        content: `Display structured data in sortable, filterable tables.`,
        features: [
          'Column sorting (click header)',
          'Pagination for large datasets',
          'Column visibility toggle',
          'Row selection',
          'Export table data'
        ],
        screenshot: {
          description: 'Data table widget with sorting and pagination',
          elements: [
            { label: 'Column Headers', position: 'top', desc: 'Click to sort' },
            { label: 'Data Rows', position: 'center', desc: 'Your tabular data' },
            { label: 'Pagination', position: 'bottom', desc: 'Navigate pages' }
          ]
        }
      },
      {
        title: 'Maps & Heatmaps',
        content: `Geographic and density visualizations for location-based data.`,
        features: [
          'World map with regions',
          'US state map',
          'Marker placement',
          'Color intensity by value',
          'Hover tooltips'
        ],
        screenshot: {
          description: 'Map widget showing regional data',
          elements: [
            { label: 'Map View', position: 'center', desc: 'Geographic visualization' },
            { label: 'Legend', position: 'bottom', desc: 'Color scale' },
            { label: 'Tooltip', position: 'center', desc: 'Hover for details' }
          ]
        }
      }
    ]
  }
};

// =============================================================================
// HELP CATEGORIES (simplified)
// =============================================================================

const HELP_CATEGORIES = Object.entries(DETAILED_ARTICLES).map(([id, data]) => ({
  id,
  title: data.title,
  icon: data.icon,
  color: data.color,
  description: data.sections[0]?.content?.substring(0, 60) + '...',
  articles: data.sections.map(s => ({ title: s.title, path: `#${s.title.toLowerCase().replace(/\s+/g, '-')}` }))
}));

const FAQ_DATA = [
  {
    question: "How do I create a dashboard from a template?",
    answer: "Go to Dashboards page, click the 'Templates' button in the header. You'll see 10 preset templates (Sales, Marketing, Customer, etc.) plus your custom templates. Click any template to instantly create a new dashboard with pre-configured widgets.",
    category: "dashboards"
  },
  {
    question: "How do I export a report to PDF?",
    answer: "In the Report Builder, click the 'Export PDF' button in the top-right corner. The report will automatically switch to preview mode and generate a multi-page PDF with headers and footers. The PDF is downloaded to your device.",
    category: "reports"
  },
  {
    question: "What chart types are available?",
    answer: "DataViz Studio supports 9 chart types: Bar, Line, Area, Pie, Donut, Scatter, Radar, Heatmap, and Funnel. Each chart type can be customized with colors, annotations, and interactive features.",
    category: "charts"
  },
  {
    question: "How do I save a dashboard as a template?",
    answer: "Open your dashboard and click 'Save as Template' in the header. Enter a name and optional description, then click Save. Your template will appear in the 'My Templates' tab of the Templates dialog.",
    category: "dashboards"
  },
  {
    question: "How do I add annotations to a chart?",
    answer: "Open the chart editor and navigate to the 'Annotations' tab. You can add text labels, reference lines, or highlight regions. Each annotation can be customized with position, color, and style.",
    category: "charts"
  },
  {
    question: "How do I transform my dataset?",
    answer: "From the Datasets page, click the transform icon (wand) on any dataset. You can filter rows, rename columns, change data types, calculate new fields, fill missing values, and more. Preview changes before applying.",
    category: "data"
  },
  {
    question: "What widget types can I add to dashboards?",
    answer: "DataViz Studio supports 12 widget types: Stat cards, Charts, Tables, Gauges, Progress bars, Maps, Funnels, Heatmaps, Scorecards, Lists, Timelines, and Sparklines. Each has unique configuration options.",
    category: "widgets"
  },
  {
    question: "How do I resize sections in Report Builder?",
    answer: "In the Report Builder, each section has a width dropdown (25%, 50%, 75%, 100%) in its header. Select the desired width to resize. You can create side-by-side layouts like 50%/50% or 25%/75%.",
    category: "reports"
  },
  {
    question: "Can I use custom colors in my reports?",
    answer: "Yes! Click the theme selector in the Report Builder header. Choose from 6 preset themes or click 'Custom Colors' to pick your own primary and accent colors using the color picker.",
    category: "reports"
  },
  {
    question: "How do I upload data?",
    answer: "Go to Data page and click 'Upload Data'. You can upload CSV, Excel (.xlsx), or JSON files. After upload, the data is automatically parsed and you can start creating visualizations immediately.",
    category: "data"
  }
];

const TROUBLESHOOTING_DATA = [
  {
    problem: "Dashboard widgets not loading",
    solution: "Try refreshing the page. If the issue persists, check your internet connection. Widgets require an active connection to fetch data from the server.",
    severity: "medium"
  },
  {
    problem: "PDF export shows blank pages",
    solution: "Make sure you're in Preview mode before exporting. Also ensure all charts have loaded completely. Try waiting a few seconds after switching to Preview before clicking Export.",
    severity: "low"
  },
  {
    problem: "Data upload fails",
    solution: "Check that your file is in a supported format (CSV, XLSX, JSON). Ensure the file size is under 50MB. For CSV files, verify the delimiter is comma-separated.",
    severity: "medium"
  },
  {
    problem: "Chart annotations not displaying",
    solution: "Annotations may be positioned outside the visible chart area. Try adjusting the position values. Also ensure the annotation type matches your chart type.",
    severity: "low"
  },
  {
    problem: "Template not saving",
    solution: "Ensure you're logged in. Template saving requires authentication. Check that you've entered a template name before clicking Save.",
    severity: "high"
  },
  {
    problem: "Session expired / Logged out unexpectedly",
    solution: "Sessions expire after inactivity. Simply log in again to continue. Your dashboards and reports are saved automatically.",
    severity: "low"
  }
];

const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'S'], action: 'Save current work', category: 'General' },
  { keys: ['Ctrl', 'Z'], action: 'Undo last action', category: 'General' },
  { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo action', category: 'General' },
  { keys: ['Ctrl', 'P'], action: 'Export to PDF', category: 'Reports' },
  { keys: ['Ctrl', 'N'], action: 'Create new item', category: 'General' },
  { keys: ['Esc'], action: 'Close dialog/modal', category: 'Navigation' },
  { keys: ['?'], action: 'Open Help Center', category: 'Help' },
  { keys: ['Ctrl', 'K'], action: 'Quick search', category: 'Navigation' },
  { keys: ['Tab'], action: 'Navigate between elements', category: 'Navigation' },
  { keys: ['Enter'], action: 'Confirm/Submit', category: 'General' }
];

const WHATS_NEW = [
  {
    version: "2.6.0",
    date: "Feb 2026",
    title: "Comprehensive Help Center",
    features: [
      "Visual documentation with screenshots",
      "AI-powered Help Assistant (GPT-4o)",
      "Searchable FAQs and troubleshooting",
      "Keyboard shortcuts reference"
    ],
    type: "major"
  },
  {
    version: "2.5.0",
    date: "Feb 2026",
    title: "Dashboard Template Library",
    features: [
      "10 preset dashboard templates",
      "Save dashboards as custom templates",
      "Category filtering for templates",
      "Edit and delete custom templates",
      "12 widget types supported"
    ],
    type: "major"
  },
  {
    version: "2.4.0",
    date: "Feb 2026",
    title: "Chart Resizing & Refactoring",
    features: [
      "Width control for report sections (25%, 50%, 75%, 100%)",
      "Improved Report Builder performance",
      "Modular component architecture"
    ],
    type: "minor"
  },
  {
    version: "2.3.0",
    date: "Feb 2026",
    title: "Text/Notes Blocks",
    features: [
      "Add custom text blocks anywhere in reports",
      "Editable section titles",
      "Flexible notes and observations"
    ],
    type: "minor"
  },
  {
    version: "2.2.0",
    date: "Feb 2026",
    title: "Multi-Page PDF Export",
    features: [
      "Intelligent page breaks",
      "Continuation headers on page 2+",
      "Branded footers with page numbers"
    ],
    type: "major"
  }
];

// =============================================================================
// COMPONENTS
// =============================================================================

const CategoryCard = ({ category, onClick }) => {
  const Icon = category.icon;
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{category.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{category.description}</p>
      <div className="flex items-center text-violet-600 dark:text-violet-400 text-sm font-medium">
        <span>{category.articles.length} articles</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </motion.div>
  );
};

const ScreenshotPreview = ({ screenshot }) => (
  <div className="bg-gray-900 rounded-xl p-4 mb-6">
    <div className="flex items-center gap-2 mb-3">
      <Monitor className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-400">{screenshot.description}</span>
    </div>
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="grid gap-3">
        {screenshot.elements.map((element, idx) => (
          <div key={idx} className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-violet-400 font-medium">{element.label}</span>
              <span className="text-gray-500 mx-2">—</span>
              <span className="text-gray-300">{element.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
      <Image className="w-3 h-3" />
      <span>Visual guide - Navigate to this page to see the actual interface</span>
    </div>
  </div>
);

const ArticleSection = ({ section, index }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold text-sm">
        {index + 1}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{section.title}</h3>
    </div>
    
    <p className="text-gray-600 dark:text-gray-300 mb-4">{section.content}</p>
    
    {section.features && (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Features
        </h4>
        <ul className="space-y-2">
          {section.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    )}
    
    {section.steps && (
      <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <MousePointer className="w-4 h-4 text-violet-500" />
          Step-by-Step
        </h4>
        <ol className="space-y-2">
          {section.steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="w-5 h-5 rounded-full bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-medium flex-shrink-0">
                {idx + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    )}
    
    {section.screenshot && <ScreenshotPreview screenshot={section.screenshot} />}
  </div>
);

const DetailedArticleView = ({ categoryId, onClose }) => {
  const article = DETAILED_ARTICLES[categoryId];
  if (!article) return null;
  
  const Icon = article.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 bg-gradient-to-br ${article.color}`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{article.title}</h2>
                <p className="text-white/70 text-sm">{article.sections.length} sections</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {article.sections.map((section, index) => (
            <ArticleSection key={index} section={section} index={index} />
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Was this helpful? Use the AI Assistant for more questions.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
            >
              Close Guide
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FAQItem = ({ faq, isOpen, onToggle }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
      <span className="font-medium text-gray-900 dark:text-white text-left">{faq.question}</span>
      <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 text-sm">
            {faq.answer}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const TroubleshootingItem = ({ item }) => {
  const severityColors = {
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span className="font-medium text-gray-900 dark:text-white">{item.problem}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${severityColors[item.severity]}`}>
          {item.severity}
        </span>
      </div>
      <div className="flex items-start gap-2 mt-3">
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600 dark:text-gray-300">{item.solution}</p>
      </div>
    </div>
  );
};

const KeyboardShortcut = ({ shortcut }) => (
  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
    <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.action}</span>
    <div className="flex items-center gap-1">
      {shortcut.keys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300 shadow-sm">
            {key}
          </kbd>
          {index < shortcut.keys.length - 1 && <span className="text-gray-400 text-xs">+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const WhatsNewItem = ({ item }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          item.type === 'major' 
            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          v{item.version}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{item.date}</span>
      </div>
      {item.type === 'major' && <Star className="w-4 h-4 text-amber-500" />}
    </div>
    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h4>
    <ul className="space-y-1">
      {item.features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Zap className="w-3 h-3 text-violet-500" />
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

// =============================================================================
// MAIN HELP CENTER PAGE
// =============================================================================

const HelpCenterPage = () => {
  const { token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertCircle },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'whats-new', label: "What's New", icon: Sparkles },
  ];

  const filteredFAQs = FAQ_DATA.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedShortcuts = KEYBOARD_SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="help-center-page">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
              <p className="text-lg text-white/80 mb-8">
                Search our knowledge base or browse categories below
              </p>
              
              {/* Search */}
              <div className="max-w-2xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for help articles..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  data-testid="help-search-input"
                />
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-center gap-8 mt-8 text-sm">
                <div className="flex items-center gap-2">
                  <Book className="w-4 h-4" />
                  <span>{HELP_CATEGORIES.reduce((acc, cat) => acc + cat.articles.length, 0)} articles</span>
                </div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>{FAQ_DATA.length} FAQs</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>AI Assistant</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Browse by Category
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {HELP_CATEGORIES.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onClick={() => setSelectedCategory(category.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Popular Articles */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Popular Articles
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                  {[
                    { title: 'Getting Started with DataViz Studio', icon: Play, color: 'text-green-500', category: 'getting-started' },
                    { title: 'Creating Dashboards from Templates', icon: Layout, color: 'text-violet-500', category: 'dashboards' },
                    { title: 'Exporting Reports to PDF', icon: Download, color: 'text-blue-500', category: 'reports' },
                    { title: 'Understanding Widget Types', icon: Layers, color: 'text-amber-500', category: 'widgets' },
                    { title: 'Data Transformation Guide', icon: Database, color: 'text-rose-500', category: 'data' },
                  ].map((article, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCategory(article.category)}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <article.icon className={`w-5 h-5 ${article.color}`} />
                        <span className="text-gray-900 dark:text-white">{article.title}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Quick Actions
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowAssistant(true)}
                    className="bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl p-6 text-left hover:shadow-lg transition-shadow"
                  >
                    <MessageCircle className="w-8 h-8 mb-3" />
                    <h3 className="font-semibold mb-1">Chat with AI</h3>
                    <p className="text-sm text-white/80">Get instant answers from our AI assistant</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('faq')}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 text-left border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                  >
                    <HelpCircle className="w-8 h-8 mb-3 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Browse FAQs</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Find answers to common questions</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('troubleshooting')}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 text-left border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                  >
                    <AlertCircle className="w-8 h-8 mb-3 text-amber-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Troubleshooting</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Solve common issues</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Frequently Asked Questions
              </h2>
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((faq, index) => (
                  <FAQItem
                    key={index}
                    faq={faq}
                    isOpen={openFAQ === index}
                    onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No FAQs found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}

          {/* Troubleshooting Tab */}
          {activeTab === 'troubleshooting' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Troubleshooting Guide
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {TROUBLESHOOTING_DATA.map((item, index) => (
                  <TroubleshootingItem key={index} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Keyboard Shortcuts
              </h2>
              {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{category}</h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut, index) => (
                      <KeyboardShortcut key={index} shortcut={shortcut} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* What's New Tab */}
          {activeTab === 'whats-new' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                What's New in DataViz Studio
              </h2>
              <div className="space-y-4">
                {WHATS_NEW.map((item, index) => (
                  <WhatsNewItem key={index} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detailed Article Modal */}
        <AnimatePresence>
          {selectedCategory && (
            <DetailedArticleView 
              categoryId={selectedCategory} 
              onClose={() => setSelectedCategory(null)} 
            />
          )}
        </AnimatePresence>

        {/* AI Assistant */}
        {!showAssistant && <HelpAssistantButton onClick={() => setShowAssistant(true)} />}
        <HelpAssistant 
          isOpen={showAssistant} 
          onClose={() => setShowAssistant(false)} 
          token={token}
        />
      </div>
    </DashboardLayout>
  );
};

export default HelpCenterPage;
