import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Book, HelpCircle, MessageCircle, Keyboard, 
  ChevronRight, ChevronDown, ExternalLink, Play, Star,
  BarChart3, PieChart, Table, FileText, Download, Upload,
  Layout, Palette, Settings, Database, Sparkles, Zap,
  AlertCircle, CheckCircle, Info, ArrowRight, Clock,
  TrendingUp, Users, Target, Activity, Layers
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import HelpAssistant, { HelpAssistantButton } from '../components/HelpAssistant';
import { useAuthStore } from '../store';

// =============================================================================
// DATAVIZ STUDIO HELP CENTER DATA
// =============================================================================

const HELP_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Play,
    color: 'from-green-500 to-emerald-600',
    description: 'Learn the basics of DataViz Studio',
    articles: [
      { title: 'Welcome to DataViz Studio', path: '#welcome' },
      { title: 'Creating Your First Dashboard', path: '#first-dashboard' },
      { title: 'Uploading Data', path: '#uploading-data' },
      { title: 'Understanding the Interface', path: '#interface' },
    ]
  },
  {
    id: 'dashboards',
    title: 'Dashboards',
    icon: Layout,
    color: 'from-violet-500 to-purple-600',
    description: 'Create and customize dashboards',
    articles: [
      { title: 'Dashboard Templates', path: '#templates' },
      { title: 'Adding Widgets', path: '#widgets' },
      { title: 'Saving as Template', path: '#save-template' },
      { title: 'Dashboard Layouts', path: '#layouts' },
    ]
  },
  {
    id: 'charts',
    title: 'Charts & Visualization',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-600',
    description: 'Create stunning visualizations',
    articles: [
      { title: 'Chart Types Guide', path: '#chart-types' },
      { title: 'Adding Annotations', path: '#annotations' },
      { title: 'Customizing Colors', path: '#colors' },
      { title: 'Interactive Features', path: '#interactive' },
    ]
  },
  {
    id: 'reports',
    title: 'Report Builder',
    icon: FileText,
    color: 'from-rose-500 to-pink-600',
    description: 'Build professional reports',
    articles: [
      { title: 'Report Builder Overview', path: '#report-overview' },
      { title: 'Adding Sections', path: '#sections' },
      { title: 'Resizing Components', path: '#resizing' },
      { title: 'PDF Export', path: '#pdf-export' },
    ]
  },
  {
    id: 'data',
    title: 'Data Management',
    icon: Database,
    color: 'from-amber-500 to-orange-600',
    description: 'Import, transform, and manage data',
    articles: [
      { title: 'Importing Datasets', path: '#import' },
      { title: 'Data Transformation', path: '#transform' },
      { title: 'Connecting Sources', path: '#sources' },
      { title: 'Data Refresh', path: '#refresh' },
    ]
  },
  {
    id: 'widgets',
    title: 'Widget Types',
    icon: Layers,
    color: 'from-teal-500 to-green-600',
    description: 'Explore all widget types',
    articles: [
      { title: 'Stat Cards', path: '#stat-cards' },
      { title: 'Gauges & Progress', path: '#gauges' },
      { title: 'Tables & Lists', path: '#tables' },
      { title: 'Maps & Heatmaps', path: '#maps' },
    ]
  }
];

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
                      onClick={() => setSelectedCategory(category)}
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
                    { title: 'Getting Started with DataViz Studio', icon: Play, color: 'text-green-500' },
                    { title: 'Creating Dashboards from Templates', icon: Layout, color: 'text-violet-500' },
                    { title: 'Exporting Reports to PDF', icon: Download, color: 'text-blue-500' },
                    { title: 'Understanding Widget Types', icon: Layers, color: 'text-amber-500' },
                    { title: 'Data Transformation Guide', icon: Database, color: 'text-rose-500' },
                  ].map((article, index) => (
                    <a
                      key={index}
                      href="#"
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <article.icon className={`w-5 h-5 ${article.color}`} />
                        <span className="text-gray-900 dark:text-white">{article.title}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </a>
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

        {/* Category Detail Modal */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedCategory(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`p-6 bg-gradient-to-br ${selectedCategory.color}`}>
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <selectedCategory.icon className="w-8 h-8" />
                      <h2 className="text-xl font-bold">{selectedCategory.title}</h2>
                    </div>
                    <button onClick={() => setSelectedCategory(null)} className="p-2 hover:bg-white/10 rounded-lg">
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-white/80 mt-2">{selectedCategory.description}</p>
                </div>
                <div className="p-4 max-h-[400px] overflow-y-auto">
                  <div className="space-y-2">
                    {selectedCategory.articles.map((article, index) => (
                      <a
                        key={index}
                        href={article.path}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-gray-900 dark:text-white">{article.title}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
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
