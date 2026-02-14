import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Home,
  BarChart3,
  Database,
  Brain,
  Upload,
  LayoutDashboard,
  Settings,
  FileDown,
  ZoomIn,
  Calendar,
  Play,
  PieChart,
  LineChart,
  Table,
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Content parser - converts markdown images to HTML
const parseContent = (content) => {
  if (!content) return '';
  
  // Parse markdown images: ![Alt text](/images/docs/filename.jpg)
  let parsed = content.replace(
    /!\[(.*?)\]\((.*?)\)/g, 
    '<img src="$2" alt="$1" class="rounded-lg border my-4 shadow-lg max-w-full" />'
  );
  
  // Parse headers
  parsed = parsed.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">$1</h3>');
  parsed = parsed.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-4 text-foreground">$1</h2>');
  parsed = parsed.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-foreground">$1</h1>');
  
  // Parse bold and italic
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Parse inline code
  parsed = parsed.replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Parse bullet lists
  parsed = parsed.replace(/^- (.*$)/gm, '<li class="ml-4 mb-2">$1</li>');
  parsed = parsed.replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc list-inside my-4 space-y-1">$&</ul>');
  
  // Parse numbered lists
  parsed = parsed.replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-2">$1</li>');
  
  // Parse paragraphs (lines not already wrapped)
  parsed = parsed.replace(/^(?!<[hulo]|<li|<img)(.*\S.*)$/gm, '<p class="mb-4 text-muted-foreground leading-relaxed">$1</p>');
  
  return parsed;
};

// Help Center Articles Data
const HELP_ARTICLES = {
  'getting-started': {
    id: 'getting-started',
    title: 'Getting Started with DataViz Studio',
    category: 'Basics',
    icon: Home,
    description: 'Learn the basics of DataViz Studio and start visualizing your data in minutes.',
    content: `
# Getting Started with DataViz Studio

Welcome to DataViz Studio! This guide will help you get up and running quickly.

![DataViz Studio Dashboard](/images/docs/dashboard-overview.png)

## What is DataViz Studio?

DataViz Studio is a powerful data visualization platform that helps you:

- **Upload and manage datasets** from various sources
- **Create interactive charts** with our Chart Studio
- **Build custom dashboards** with drag-and-drop widgets
- **Get AI-powered insights** using GPT-5.2
- **Connect to external databases** (MongoDB, PostgreSQL, MySQL)
- **Export professional PDF reports**

## Quick Start Steps

### 1. Upload Your Data

Navigate to **Data > Upload** to import your first dataset. We support:
- CSV files
- Excel spreadsheets (.xlsx)
- JSON files

![Upload Data Page](/images/docs/upload-data.png)

### 2. Create Your First Chart

Go to **Visualize > Charts** and click **Create Chart** to open the Chart Studio.

### 3. Build a Dashboard

Use the Dashboard Builder to arrange your charts and widgets in a custom layout.

### 4. Get AI Insights

Visit **Analyze > AI Insights** to ask questions about your data using natural language.
    `
  },
  'chart-studio': {
    id: 'chart-studio',
    title: 'Using the Chart Studio',
    category: 'Visualization',
    icon: BarChart3,
    description: 'Create stunning visualizations with our powerful Chart Studio featuring 9 chart types.',
    content: `
# Chart Studio Guide

The Chart Studio is your creative workspace for building powerful visualizations.

![Chart Studio Interface](/images/docs/chart-studio.png)

## Available Chart Types

DataViz Studio offers 9 professional chart types powered by Apache ECharts:

- **Bar Chart** - Compare categories
- **Line Chart** - Show trends over time
- **Pie Chart** - Display proportions
- **Area Chart** - Visualize cumulative data
- **Scatter Plot** - Show correlations
- **Radar Chart** - Compare multiple variables
- **Funnel Chart** - Visualize conversion flows
- **Gauge Chart** - Display single metrics
- **Heatmap** - Show data density

## Creating a Chart

### Step 1: Open Chart Studio

Navigate to **Visualize > Charts** and click the **Create Chart** button.

![Create Chart Button](/images/docs/create-chart-btn.png)

### Step 2: Configure Your Chart

1. Enter a **Chart Name**
2. Select your **Dataset**
3. Choose a **Chart Type**
4. Select **X-Axis Field** (category)
5. Select **Y-Axis Field** (value) - optional
6. Choose **Aggregation** method (count, sum, average, etc.)

### Step 3: Customize Appearance

![Chart Style Options](/images/docs/chart-style-options.png)

- Choose from 6 **Color Themes**: Violet, Ocean, Forest, Sunset, Berry, Mono
- Toggle **Show Legend** and **Show Labels**
- For pie charts, enable **Donut Style**
- For line charts, enable **Smooth Curves** and **Area Fill**

### Step 4: Preview and Save

The live preview updates in real-time as you configure. Click **Save Chart** when satisfied.

## AI-Powered Suggestions

Click **Get AI Suggestions** after selecting a dataset to receive intelligent chart recommendations based on your data structure.
    `
  },
  'database-connections': {
    id: 'database-connections',
    title: 'Connecting to Databases',
    category: 'Data Sources',
    icon: Database,
    description: 'Connect to MongoDB, PostgreSQL, or MySQL databases for real-time data sync.',
    content: `
# Database Connections

Connect DataViz Studio to your external databases for real-time data synchronization.

![Database Connections Page](/images/docs/database-connections.png)

## Supported Databases

- **MongoDB** - NoSQL document database
- **PostgreSQL** - Advanced relational database
- **MySQL** - Popular relational database

## Adding a Connection

### Step 1: Navigate to Database Connections

Go to **Data > Database Connections** and click **Add Connection**.

### Step 2: Enter Connection Details

![Add Connection Dialog](/images/docs/add-connection-dialog.png)

Fill in the required fields:
- **Connection Name** - A friendly name for this connection
- **Database Type** - MongoDB, PostgreSQL, or MySQL
- **Host** - Database server address
- **Port** - Database port (defaults: MongoDB 27017, PostgreSQL 5432, MySQL 3306)
- **Database** - Database name to connect to
- **Username** - Database user (optional for MongoDB)
- **Password** - Database password

### Step 3: Test Connection

Click **Test** to verify the connection works before saving.

### Step 4: Sync Data

After adding the connection, click **Sync** to import data from your database tables/collections into DataViz Studio datasets.

## Scheduled Data Refresh

![Schedule Dialog](/images/docs/schedule-dialog.png)

Set up automatic data synchronization:

1. Click the **Schedule** button on a connection
2. Enable **Scheduled Refresh**
3. Choose interval: **Hourly**, **Daily**, **Weekly**, or **Custom Cron**
4. Click **Save Schedule**

Your data will automatically refresh at the configured intervals.
    `
  },
  'ai-insights': {
    id: 'ai-insights',
    title: 'AI-Powered Insights',
    category: 'Analysis',
    icon: Brain,
    description: 'Use GPT-5.2 to ask questions about your data and get intelligent insights.',
    content: `
# AI-Powered Insights

DataViz Studio integrates GPT-5.2 to provide intelligent analysis of your data.

![AI Insights Page](/images/docs/ai-insights.png)

## How It Works

The AI Insights feature analyzes your datasets and can:

- **Summarize data** - Get quick overviews
- **Identify trends** - Discover patterns automatically
- **Suggest visualizations** - Recommend the best charts
- **Detect anomalies** - Find unusual data points
- **Answer questions** - Ask anything about your data

## Using AI Insights

### Step 1: Navigate to AI Insights

Go to **Analyze > AI Insights** from the sidebar.

### Step 2: Select a Dataset (Optional)

Use the dropdown to focus on a specific dataset, or leave as "All datasets" for cross-dataset analysis.

### Step 3: Ask a Question

Type your question in the chat input. Try suggested prompts like:
- "Summarize this dataset"
- "What are the key trends?"
- "Show me anomalies"

### Step 4: Review Insights

The AI will analyze your data and provide detailed insights with actionable recommendations.

## Example Questions

- "What is the average sales by category?"
- "Which products are underperforming?"
- "Identify the top 5 customers by revenue"
- "Are there any unusual patterns in the last month?"
- "What visualization would best show this data?"
    `
  },
  'dashboard-builder': {
    id: 'dashboard-builder',
    title: 'Building Dashboards',
    category: 'Visualization',
    icon: LayoutDashboard,
    description: 'Create interactive dashboards with drag-and-drop widgets.',
    content: `
# Dashboard Builder Guide

Create powerful, interactive dashboards with our drag-and-drop builder.

![Dashboard Builder](/images/docs/dashboard-builder.png)

## Widget Types

The Dashboard Builder supports multiple widget types:

- **Stat Cards** - Display key metrics (count, sum, average, max, min)
- **Chart Widgets** - Embed any chart type
- **Table Widgets** - Show data in tabular format
- **Text Blocks** - Add titles, descriptions, and notes

## Creating a Dashboard

### Step 1: Navigate to Dashboards

Go to **Visualize > Dashboards** and click **Create Dashboard**.

### Step 2: Add Widgets

Click **Add Widget** and select the widget type:

![Add Widget](/images/docs/add-widget.png)

### Step 3: Configure Widget

Each widget has specific configuration options:

**Stat Card:**
- Select dataset
- Choose metric field
- Pick aggregation (count, sum, mean, max, min)

**Chart Widget:**
- Select an existing chart or create new
- Choose chart type and configure axes

**Table Widget:**
- Select dataset
- Choose columns to display

### Step 4: Arrange Layout

Drag widgets to reposition them. Resize by dragging the corners.

![Dashboard Layout](/images/docs/dashboard-layout.png)

### Step 5: Save Dashboard

Click **Save** to preserve your dashboard layout.
    `
  },
  'drill-down': {
    id: 'drill-down',
    title: 'Chart Drill-Down',
    category: 'Analysis',
    icon: ZoomIn,
    description: 'Explore your data deeper with interactive drill-down capabilities.',
    content: `
# Chart Drill-Down

Drill-down allows you to explore data hierarchically by clicking on chart elements.

![Drill-Down Feature](/images/docs/drill-down.png)

## How Drill-Down Works

When viewing a chart, you can click on categories to filter and see detailed breakdowns.

### Example Flow:

1. **Start**: View sales by Category (Electronics, Furniture, Clothing)
2. **Drill**: Click on "Electronics" to see products in that category
3. **Drill deeper**: Click on "Laptops" to see individual sales

## Using Drill-Down

### Step 1: Open a Chart

Click on any chart card in the Charts page to open the detailed view.

### Step 2: View Drill Options

Below the chart, you'll see **"Click to Drill Down"** with available filter fields.

![Drill Options](/images/docs/drill-options.png)

### Step 3: Click a Filter

Click any value button to filter the data. The chart updates to show only matching records.

### Step 4: Navigate with Breadcrumbs

A breadcrumb trail appears showing your filter path:

\`Reset > category: Electronics > region: North\`

Click **Reset** to return to the original view.

## Drill-Down Tips

- The row count shows how many records match your filters
- Additional drill options appear based on remaining categorical fields
- Export filtered data to PDF using the **Export PDF** button
    `
  },
  'pdf-export': {
    id: 'pdf-export',
    title: 'Exporting PDF Reports',
    category: 'Export',
    icon: FileDown,
    description: 'Generate professional PDF reports from your charts and dashboards.',
    content: `
# PDF Report Export

Generate professional PDF reports containing your charts and data tables.

![PDF Export](/images/docs/pdf-export.png)

## Export Options

### Export All Charts

From the **Charts** page, click **Export All to PDF** to generate a report with all your charts.

### Export Single Chart

When viewing a chart in the detail dialog, click **Export PDF** to export just that chart.

### Export Dashboard

From any dashboard, use the export option to generate a full dashboard report.

## What's Included

PDF reports contain:

- **Report Title** with timestamp
- **Chart visualizations** rendered as bar charts
- **Data tables** with category and value columns
- **Professional styling** with DataViz Studio branding

## Customization

When exporting, you can choose to:

- Include or exclude data tables
- Set a custom report title
- Select specific charts to include

## Tips for Best Results

- Ensure charts have meaningful names
- Use clear axis labels
- Choose chart types that translate well to static images (bar, pie, line work best)
    `
  },
  'upload-data': {
    id: 'upload-data',
    title: 'Uploading Data',
    category: 'Data Sources',
    icon: Upload,
    description: 'Import CSV, Excel, and JSON files to create datasets.',
    content: `
# Uploading Data

Import your data files to create datasets for visualization.

![Upload Page](/images/docs/upload-page.png)

## Supported Formats

- **CSV** - Comma-separated values
- **Excel** - .xlsx spreadsheets
- **JSON** - JavaScript Object Notation

## Upload Process

### Step 1: Navigate to Upload

Go to **Data > Upload Data** from the sidebar.

### Step 2: Select File

Click the upload area or drag and drop your file.

### Step 3: Preview Data

After upload, preview your data to verify it was parsed correctly.

### Step 4: Name Your Dataset

Give your dataset a meaningful name for easy identification.

### Step 5: Confirm Import

Click **Import** to create the dataset.

## Data Requirements

For best results:

- Include column headers in the first row
- Use consistent data types in each column
- Avoid special characters in column names
- Keep file size under 10MB for optimal performance

## After Upload

Your dataset will be available in:
- **Datasets** page for browsing and management
- **Chart Studio** for creating visualizations
- **Dashboard Builder** for adding to dashboards
- **AI Insights** for intelligent analysis
    `
  }
};

// Category grouping
const CATEGORIES = [
  { name: 'Basics', icon: Home, color: 'text-blue-500' },
  { name: 'Data Sources', icon: Database, color: 'text-green-500' },
  { name: 'Visualization', icon: BarChart3, color: 'text-violet-500' },
  { name: 'Analysis', icon: Brain, color: 'text-amber-500' },
  { name: 'Export', icon: FileDown, color: 'text-rose-500' },
];

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const articles = Object.values(HELP_ARTICLES);

  const filteredArticles = useMemo(() => {
    let result = articles;
    
    if (selectedCategory) {
      result = result.filter(a => a.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [articles, searchQuery, selectedCategory]);

  const groupedArticles = useMemo(() => {
    const groups = {};
    filteredArticles.forEach(article => {
      if (!groups[article.category]) {
        groups[article.category] = [];
      }
      groups[article.category].push(article);
    });
    return groups;
  }, [filteredArticles]);

  // Article Detail View
  if (selectedArticle) {
    const article = HELP_ARTICLES[selectedArticle];
    if (!article) return null;

    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto" data-testid="help-article-view">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setSelectedArticle(null)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help Center
          </Button>

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <article.icon className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <Badge variant="secondary">{article.category}</Badge>
                <h1 className="text-3xl font-bold text-foreground mt-1">{article.title}</h1>
              </div>
            </div>
            <p className="text-lg text-muted-foreground">{article.description}</p>
          </div>

          {/* Article Content */}
          <Card>
            <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: parseContent(article.content) }}
                className="article-content"
              />
            </CardContent>
          </Card>

          {/* Related Articles */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {articles
                .filter(a => a.category === article.category && a.id !== article.id)
                .slice(0, 2)
                .map(related => (
                  <Card 
                    key={related.id}
                    className="cursor-pointer hover:border-violet-300 transition-colors"
                    onClick={() => setSelectedArticle(related.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <related.icon className="w-5 h-5 text-violet-600" />
                      <div>
                        <p className="font-medium text-foreground">{related.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{related.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Help Center Home
  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="help-center-page">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-violet-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Help Center</h1>
          <p className="text-muted-foreground">
            Learn how to use DataViz Studio with guides, tutorials, and documentation
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
              data-testid="help-search-input"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {CATEGORIES.map(cat => (
            <Button
              key={cat.name}
              variant={selectedCategory === cat.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.name)}
              className="gap-2"
            >
              <cat.icon className={`w-4 h-4 ${selectedCategory === cat.name ? '' : cat.color}`} />
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Articles Grid */}
        {Object.keys(groupedArticles).length > 0 ? (
          <div className="space-y-8">
            {CATEGORIES.filter(cat => groupedArticles[cat.name]).map(category => (
              <div key={category.name}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <category.icon className={`w-5 h-5 ${category.color}`} />
                  {category.name}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedArticles[category.name].map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="h-full cursor-pointer hover:border-violet-300 hover:shadow-lg transition-all group"
                        onClick={() => setSelectedArticle(article.id)}
                        data-testid={`article-card-${article.id}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                              <article.icon className="w-5 h-5 text-violet-600" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <CardTitle className="text-lg mt-3">{article.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="line-clamp-2">
                            {article.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No articles found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or category filter
              </p>
            </CardContent>
          </Card>
        )}

        {/* Need More Help */}
        <Card className="max-w-2xl mx-auto border-violet-200 dark:border-violet-800">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-8 h-8 text-violet-600 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Need more help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try our AI-powered assistant to get instant answers about your data
            </p>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Brain className="w-4 h-4 mr-2" />
              Open AI Insights
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default HelpCenterPage;
