# Dashboard Template Library - Reusable Code

## Instructions for Other Emergent Tab

Paste this message in your other Emergent tab:

---

**START COPY HERE** ⬇️

```
I need you to add a Dashboard Template Library feature to my project. Here's the complete code:

## 1. First, install dependencies:
yarn add framer-motion lucide-react sonner @radix-ui/react-dialog

## 2. Create the Dashboard Templates data file at `src/data/dashboardTemplates.js`:

```javascript
import { DollarSign, Target, Users, Activity, TrendingUp, Layers } from 'lucide-react';

export const DASHBOARD_TEMPLATES = [
  {
    id: 'sales_overview',
    name: 'Sales Overview',
    description: 'Track sales performance, revenue, and key metrics',
    icon: DollarSign,
    color: 'from-emerald-500 to-emerald-600',
    widgets: [
      { type: 'stat', title: 'Total Revenue', config: { aggregation: 'sum' }, position: { x: 0, y: 0, w: 3, h: 2 } },
      { type: 'stat', title: 'Orders', config: { aggregation: 'count' }, position: { x: 3, y: 0, w: 3, h: 2 } },
      { type: 'stat', title: 'Avg Order Value', config: { aggregation: 'mean' }, position: { x: 6, y: 0, w: 3, h: 2 } },
      { type: 'stat', title: 'Customers', config: { aggregation: 'count' }, position: { x: 9, y: 0, w: 3, h: 2 } },
      { type: 'chart', title: 'Revenue Trend', config: { chart_type: 'line' }, position: { x: 0, y: 2, w: 8, h: 4 } },
      { type: 'chart', title: 'Sales by Category', config: { chart_type: 'pie' }, position: { x: 8, y: 2, w: 4, h: 4 } },
      { type: 'table', title: 'Top Products', config: { limit: 5 }, position: { x: 0, y: 6, w: 6, h: 4 } },
      { type: 'chart', title: 'Monthly Comparison', config: { chart_type: 'bar' }, position: { x: 6, y: 6, w: 6, h: 4 } },
    ]
  },
  {
    id: 'marketing_analytics',
    name: 'Marketing Analytics',
    description: 'Monitor campaigns, engagement, and conversion rates',
    icon: Target,
    color: 'from-violet-500 to-violet-600',
    widgets: [
      { type: 'stat', title: 'Visitors', config: { aggregation: 'sum' }, position: { x: 0, y: 0, w: 3, h: 2 } },
      { type: 'stat', title: 'Conversion Rate', config: { aggregation: 'mean' }, position: { x: 3, y: 0, w: 3, h: 2 } },
      { type: 'stat', title: 'Leads', config: { aggregation: 'count' }, position: { x: 6, y: 0, w: 3, h: 2 } },
      { type: 'stat', title: 'Cost per Lead', config: { aggregation: 'mean' }, position: { x: 9, y: 0, w: 3, h: 2 } },
      { type: 'chart', title: 'Traffic Sources', config: { chart_type: 'pie' }, position: { x: 0, y: 2, w: 4, h: 4 } },
      { type: 'chart', title: 'Visitor Trend', config: { chart_type: 'area' }, position: { x: 4, y: 2, w: 8, h: 4 } },
      { type: 'chart', title: 'Campaign Performance', config: { chart_type: 'bar' }, position: { x: 0, y: 6, w: 12, h: 4 } },
    ]
  },
  {
    id: 'customer_insights',
    name: 'Customer Insights',
    description: 'Understand customer behavior and demographics',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    widgets: [
      { type: 'stat', title: 'Total Customers', config: { aggregation: 'count' }, position: { x: 0, y: 0, w: 4, h: 2 } },
      { type: 'stat', title: 'New Customers', config: { aggregation: 'count' }, position: { x: 4, y: 0, w: 4, h: 2 } },
      { type: 'stat', title: 'Retention Rate', config: { aggregation: 'mean' }, position: { x: 8, y: 0, w: 4, h: 2 } },
      { type: 'chart', title: 'Customer Segments', config: { chart_type: 'pie' }, position: { x: 0, y: 2, w: 6, h: 4 } },
      { type: 'chart', title: 'Growth Over Time', config: { chart_type: 'line' }, position: { x: 6, y: 2, w: 6, h: 4 } },
      { type: 'table', title: 'Top Customers', config: { limit: 10 }, position: { x: 0, y: 6, w: 12, h: 4 } },
    ]
  },
  {
    id: 'operations_monitor',
    name: 'Operations Monitor',
    description: 'Track inventory, orders, and operational KPIs',
    icon: Activity,
    color: 'from-amber-500 to-amber-600',
    widgets: [
      { type: 'stat', title: 'Pending Orders', config: { aggregation: 'count' }, position: { x: 0, y: 0, w: 3, h: 2 } },
      { type: 'stat', title: 'In Stock Items', config: { aggregation: 'count' }, position: { x: 3, y: 0, w: 3, h: 2 } },
      { type: 'stat', title: 'Low Stock Alerts', config: { aggregation: 'count' }, position: { x: 6, y: 0, w: 3, h: 2 } },
      { type: 'stat', title: 'Fulfillment Rate', config: { aggregation: 'mean' }, position: { x: 9, y: 0, w: 3, h: 2 } },
      { type: 'chart', title: 'Order Status', config: { chart_type: 'pie' }, position: { x: 0, y: 2, w: 4, h: 4 } },
      { type: 'chart', title: 'Daily Orders', config: { chart_type: 'bar' }, position: { x: 4, y: 2, w: 8, h: 4 } },
      { type: 'table', title: 'Recent Orders', config: { limit: 8 }, position: { x: 0, y: 6, w: 12, h: 4 } },
    ]
  },
  {
    id: 'financial_summary',
    name: 'Financial Summary',
    description: 'Monitor P&L, expenses, and financial health',
    icon: TrendingUp,
    color: 'from-rose-500 to-rose-600',
    widgets: [
      { type: 'stat', title: 'Total Revenue', config: { aggregation: 'sum' }, position: { x: 0, y: 0, w: 4, h: 2 } },
      { type: 'stat', title: 'Total Expenses', config: { aggregation: 'sum' }, position: { x: 4, y: 0, w: 4, h: 2 } },
      { type: 'stat', title: 'Net Profit', config: { aggregation: 'sum' }, position: { x: 8, y: 0, w: 4, h: 2 } },
      { type: 'chart', title: 'Revenue vs Expenses', config: { chart_type: 'line' }, position: { x: 0, y: 2, w: 8, h: 4 } },
      { type: 'chart', title: 'Expense Breakdown', config: { chart_type: 'pie' }, position: { x: 8, y: 2, w: 4, h: 4 } },
      { type: 'chart', title: 'Monthly P&L', config: { chart_type: 'bar' }, position: { x: 0, y: 6, w: 12, h: 4 } },
    ]
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with an empty dashboard',
    icon: Layers,
    color: 'from-gray-500 to-gray-600',
    widgets: []
  }
];
```

## 3. Create the DashboardTemplatesDialog component at `src/components/DashboardTemplatesDialog.jsx`:

```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { DASHBOARD_TEMPLATES } from '../data/dashboardTemplates';

const DashboardTemplatesDialog = ({ isOpen, onClose, onSelectTemplate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h2 className="text-xl font-bold">Dashboard Templates</h2>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Choose a pre-built template to get started quickly
          </p>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DASHBOARD_TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectTemplate(template)}
                  className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg hover:border-violet-300 transition-all"
                >
                  <div className={`h-24 bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {template.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {template.widgets.length === 0 ? 'Empty canvas' : `${template.widgets.length} widgets`}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardTemplatesDialog;
```

## 4. Usage example - Add to your dashboard page:

```jsx
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import DashboardTemplatesDialog from '../components/DashboardTemplatesDialog';

function YourDashboardPage() {
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSelectTemplate = (template) => {
    console.log('Selected template:', template);
    // template.widgets contains all the pre-configured widgets
    // Use this to create a new dashboard with these widgets
    
    // Example: Create dashboard API call
    // await createDashboard({
    //   name: `${template.name} Dashboard`,
    //   description: template.description,
    //   widgets: template.widgets
    // });
    
    setShowTemplates(false);
  };

  return (
    <div>
      {/* Templates Button */}
      <button
        onClick={() => setShowTemplates(true)}
        className="flex items-center gap-2 px-4 py-2 border border-violet-200 rounded-lg hover:bg-violet-50"
      >
        <Sparkles className="w-4 h-4 text-violet-500" />
        Templates
      </button>

      {/* Templates Dialog */}
      <DashboardTemplatesDialog
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
```

The template widgets array contains pre-configured widget definitions with:
- `type`: 'stat', 'chart', or 'table'
- `title`: Widget display name
- `config`: Widget-specific configuration (chart_type, aggregation, etc.)
- `position`: Grid position (x, y, width, height) for react-grid-layout

Connect this to your existing dashboard creation API to instantly create dashboards from templates!
```

**END COPY HERE** ⬆️

---
