/**
 * Dashboard Templates Library
 * Features:
 * - Pre-built dashboard templates
 * - Template preview
 * - Quick apply functionality
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutTemplate,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Activity,
  Globe,
  Briefcase,
  HeartPulse,
  GraduationCap,
  Factory,
  Truck,
  Eye,
  Copy,
  Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { toast } from 'sonner';

// Template definitions
const dashboardTemplates = [
  {
    id: 'sales-overview',
    name: 'Sales Overview',
    description: 'Track revenue, orders, and sales performance',
    category: 'Business',
    icon: DollarSign,
    color: 'emerald',
    preview: '/templates/sales-preview.png',
    widgets: [
      { type: 'kpi', title: 'Total Revenue', chartType: 'gauge' },
      { type: 'chart', title: 'Revenue Trend', chartType: 'line' },
      { type: 'chart', title: 'Sales by Region', chartType: 'bar' },
      { type: 'chart', title: 'Top Products', chartType: 'horizontal_bar' },
      { type: 'chart', title: 'Revenue Distribution', chartType: 'pie' },
      { type: 'table', title: 'Recent Orders' }
    ],
    tags: ['sales', 'revenue', 'ecommerce']
  },
  {
    id: 'marketing-analytics',
    name: 'Marketing Analytics',
    description: 'Monitor campaigns, conversions, and ROI',
    category: 'Marketing',
    icon: TrendingUp,
    color: 'purple',
    widgets: [
      { type: 'kpi', title: 'Conversion Rate', chartType: 'gauge' },
      { type: 'chart', title: 'Traffic Sources', chartType: 'pie' },
      { type: 'chart', title: 'Campaign Performance', chartType: 'bar' },
      { type: 'chart', title: 'Funnel Analysis', chartType: 'funnel' },
      { type: 'chart', title: 'Monthly Trends', chartType: 'area' }
    ],
    tags: ['marketing', 'analytics', 'campaigns']
  },
  {
    id: 'customer-360',
    name: 'Customer 360',
    description: 'Complete view of customer metrics and behavior',
    category: 'Customer',
    icon: Users,
    color: 'blue',
    widgets: [
      { type: 'kpi', title: 'Active Customers', chartType: 'gauge' },
      { type: 'chart', title: 'Customer Growth', chartType: 'line' },
      { type: 'chart', title: 'Customer Segments', chartType: 'treemap' },
      { type: 'chart', title: 'Satisfaction Score', chartType: 'radar' },
      { type: 'chart', title: 'Retention Rate', chartType: 'area' }
    ],
    tags: ['customers', 'retention', 'segments']
  },
  {
    id: 'financial-dashboard',
    name: 'Financial Dashboard',
    description: 'Track P&L, cash flow, and financial KPIs',
    category: 'Finance',
    icon: Briefcase,
    color: 'cyan',
    widgets: [
      { type: 'kpi', title: 'Net Profit', chartType: 'gauge' },
      { type: 'chart', title: 'P&L Statement', chartType: 'stacked_bar' },
      { type: 'chart', title: 'Cash Flow', chartType: 'area' },
      { type: 'chart', title: 'Expense Breakdown', chartType: 'pie' },
      { type: 'chart', title: 'Budget vs Actual', chartType: 'bar' }
    ],
    tags: ['finance', 'budget', 'profit']
  },
  {
    id: 'hr-analytics',
    name: 'HR Analytics',
    description: 'Employee metrics, hiring, and workforce insights',
    category: 'HR',
    icon: Users,
    color: 'orange',
    widgets: [
      { type: 'kpi', title: 'Headcount', chartType: 'gauge' },
      { type: 'chart', title: 'Hiring Pipeline', chartType: 'funnel' },
      { type: 'chart', title: 'Department Distribution', chartType: 'pie' },
      { type: 'chart', title: 'Turnover Rate', chartType: 'line' },
      { type: 'chart', title: 'Skills Matrix', chartType: 'radar' }
    ],
    tags: ['hr', 'employees', 'hiring']
  },
  {
    id: 'operations-dashboard',
    name: 'Operations Dashboard',
    description: 'Monitor operational efficiency and KPIs',
    category: 'Operations',
    icon: Factory,
    color: 'yellow',
    widgets: [
      { type: 'kpi', title: 'Efficiency Rate', chartType: 'gauge' },
      { type: 'chart', title: 'Production Output', chartType: 'bar' },
      { type: 'chart', title: 'Quality Metrics', chartType: 'line' },
      { type: 'chart', title: 'Downtime Analysis', chartType: 'pie' },
      { type: 'chart', title: 'Resource Utilization', chartType: 'radar' }
    ],
    tags: ['operations', 'efficiency', 'production']
  },
  {
    id: 'ecommerce-dashboard',
    name: 'E-commerce Dashboard',
    description: 'Online store performance and customer insights',
    category: 'E-commerce',
    icon: ShoppingCart,
    color: 'pink',
    widgets: [
      { type: 'kpi', title: 'GMV', chartType: 'gauge' },
      { type: 'chart', title: 'Orders by Day', chartType: 'bar' },
      { type: 'chart', title: 'Conversion Funnel', chartType: 'funnel' },
      { type: 'chart', title: 'Top Categories', chartType: 'treemap' },
      { type: 'chart', title: 'Cart Abandonment', chartType: 'line' }
    ],
    tags: ['ecommerce', 'orders', 'conversion']
  },
  {
    id: 'healthcare-dashboard',
    name: 'Healthcare Dashboard',
    description: 'Patient metrics and healthcare analytics',
    category: 'Healthcare',
    icon: HeartPulse,
    color: 'red',
    widgets: [
      { type: 'kpi', title: 'Patient Count', chartType: 'gauge' },
      { type: 'chart', title: 'Appointments', chartType: 'bar' },
      { type: 'chart', title: 'Department Load', chartType: 'pie' },
      { type: 'chart', title: 'Wait Times', chartType: 'line' },
      { type: 'chart', title: 'Satisfaction', chartType: 'radar' }
    ],
    tags: ['healthcare', 'patients', 'medical']
  },
  {
    id: 'logistics-dashboard',
    name: 'Logistics Dashboard',
    description: 'Shipping, delivery, and supply chain metrics',
    category: 'Logistics',
    icon: Truck,
    color: 'indigo',
    widgets: [
      { type: 'kpi', title: 'On-Time Delivery', chartType: 'gauge' },
      { type: 'chart', title: 'Shipments by Region', chartType: 'bar' },
      { type: 'chart', title: 'Delivery Status', chartType: 'pie' },
      { type: 'chart', title: 'Fleet Utilization', chartType: 'line' },
      { type: 'chart', title: 'Cost Analysis', chartType: 'area' }
    ],
    tags: ['logistics', 'shipping', 'delivery']
  }
];

const colorClasses = {
  emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  pink: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  red: 'bg-red-500/10 text-red-500 border-red-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
};

function TemplateCard({ template, onSelect }) {
  const Icon = template.icon;
  const colorClass = colorClasses[template.color] || colorClasses.purple;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="cursor-pointer hover:border-primary/50 transition-all h-full"
        onClick={() => onSelect(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-lg border ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <Badge variant="secondary" className="text-xs">
              {template.widgets.length} widgets
            </Badge>
          </div>
          <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {template.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="mt-4 flex gap-1">
            {template.widgets.slice(0, 5).map((widget, i) => {
              const chartIcons = {
                bar: BarChart3,
                line: LineChart,
                pie: PieChart,
                gauge: Activity,
                funnel: TrendingUp,
                default: BarChart3
              };
              const ChartIcon = chartIcons[widget.chartType] || chartIcons.default;
              return (
                <div 
                  key={i} 
                  className="w-8 h-8 rounded bg-muted flex items-center justify-center"
                  title={widget.title}
                >
                  <ChartIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              );
            })}
            {template.widgets.length > 5 && (
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{template.widgets.length - 5}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TemplatePreview({ template, onApply, onClose }) {
  const [isApplying, setIsApplying] = useState(false);
  const Icon = template.icon;
  const colorClass = colorClasses[template.color] || colorClasses.purple;

  const handleApply = async () => {
    setIsApplying(true);
    // Simulate applying template
    await new Promise(resolve => setTimeout(resolve, 1000));
    onApply(template);
    setIsApplying(false);
  };

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg border ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{template.name}</h3>
          <p className="text-muted-foreground">{template.description}</p>
          <div className="flex gap-2 mt-2">
            <Badge>{template.category}</Badge>
            <Badge variant="outline">{template.widgets.length} widgets</Badge>
          </div>
        </div>
      </div>

      {/* Widget Preview */}
      <div>
        <h4 className="font-medium mb-3">Included Widgets</h4>
        <div className="grid grid-cols-2 gap-2">
          {template.widgets.map((widget, i) => (
            <div 
              key={i}
              className="p-3 rounded-lg bg-muted/50 border border-border/50"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{widget.title}</span>
              </div>
              <span className="text-xs text-muted-foreground capitalize">
                {widget.chartType?.replace('_', ' ')} • {widget.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleApply} disabled={isApplying}>
          {isApplying ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="w-4 h-4 mr-2" />
              </motion.div>
              Applying...
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Use This Template
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function DashboardTemplates({ onSelectTemplate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...new Set(dashboardTemplates.map(t => t.category))];

  const filteredTemplates = dashboardTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleApply = (template) => {
    onSelectTemplate?.(template);
    setIsOpen(false);
    setSelectedTemplate(null);
    toast.success(`"${template.name}" template applied!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LayoutTemplate className="w-4 h-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" />
            Dashboard Templates
          </DialogTitle>
          <DialogDescription>
            Start with a pre-built template and customize it to your needs
          </DialogDescription>
        </DialogHeader>

        {selectedTemplate ? (
          <TemplatePreview
            template={selectedTemplate}
            onApply={handleApply}
            onClose={() => setSelectedTemplate(null)}
          />
        ) : (
          <>
            {/* Filters */}
            <div className="flex gap-4 py-4 border-b">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-1">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="capitalize"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={setSelectedTemplate}
                  />
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <LayoutTemplate className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No templates found</p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DashboardTemplates;
