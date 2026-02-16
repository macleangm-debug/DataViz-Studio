/**
 * Interactive Demo Page for DataViz Studio
 * Showcases dashboards, charts, reports, and data visualization features
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, PieChart, LineChart, LayoutDashboard, FileText, Database,
  Upload, Settings, Users, TrendingUp, TrendingDown, ArrowRight, Lock,
  Table, Gauge, Map, Layers, Activity, Eye, Download, Share2, Plus,
  ChevronDown, X, Sparkles, Play, Check, AlertCircle, Calendar,
  Filter, Search, MoreHorizontal, RefreshCw, Zap, Target, DollarSign,
  ShoppingCart, UserCheck, Clock, Globe, Home, HelpCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';

// Sample Data for Demo
const SAMPLE_DATASETS = [
  { id: 1, name: 'Sales Data 2024', rows: 12450, columns: 18, type: 'CSV', updated: '2 hours ago' },
  { id: 2, name: 'Customer Analytics', rows: 8320, columns: 24, type: 'Excel', updated: '1 day ago' },
  { id: 3, name: 'Marketing Campaigns', rows: 2100, columns: 12, type: 'JSON', updated: '3 days ago' },
  { id: 4, name: 'Product Inventory', rows: 5600, columns: 15, type: 'CSV', updated: '5 hours ago' },
];

const SAMPLE_DASHBOARDS = [
  { id: 1, name: 'Sales Overview', widgets: 8, views: 1240, shared: true, template: 'Sales Dashboard' },
  { id: 2, name: 'Marketing Analytics', widgets: 6, views: 890, shared: false, template: 'Marketing Analytics' },
  { id: 3, name: 'Executive Summary', widgets: 10, views: 2100, shared: true, template: 'Executive Summary' },
  { id: 4, name: 'Operations Monitor', widgets: 7, views: 560, shared: false, template: 'Operations Monitor' },
];

const SAMPLE_CHARTS = [
  { id: 1, name: 'Revenue by Region', type: 'Bar', dataset: 'Sales Data 2024' },
  { id: 2, name: 'Customer Segments', type: 'Pie', dataset: 'Customer Analytics' },
  { id: 3, name: 'Monthly Trends', type: 'Line', dataset: 'Sales Data 2024' },
  { id: 4, name: 'Conversion Funnel', type: 'Funnel', dataset: 'Marketing Campaigns' },
];

const SAMPLE_METRICS = [
  { label: 'Total Revenue', value: '$2.4M', change: '+12.5%', trend: 'up', icon: DollarSign },
  { label: 'Active Users', value: '18,420', change: '+8.2%', trend: 'up', icon: Users },
  { label: 'Conversion Rate', value: '3.8%', change: '-0.5%', trend: 'down', icon: Target },
  { label: 'Avg. Order Value', value: '$127', change: '+4.1%', trend: 'up', icon: ShoppingCart },
];

const CHART_DATA = {
  bar: [
    { name: 'North', value: 4200 },
    { name: 'South', value: 3100 },
    { name: 'East', value: 2800 },
    { name: 'West', value: 3600 },
    { name: 'Central', value: 2400 },
  ],
  pie: [
    { name: 'Enterprise', value: 45, color: '#8b5cf6' },
    { name: 'SMB', value: 30, color: '#06b6d4' },
    { name: 'Startup', value: 15, color: '#f59e0b' },
    { name: 'Individual', value: 10, color: '#10b981' },
  ],
  line: [
    { month: 'Jan', value: 65 },
    { month: 'Feb', value: 72 },
    { month: 'Mar', value: 68 },
    { month: 'Apr', value: 85 },
    { month: 'May', value: 92 },
    { month: 'Jun', value: 88 },
  ],
};

const INDUSTRY_DATA = {
  retail: { name: 'Retail Analytics', icon: ShoppingCart, color: 'purple' },
  finance: { name: 'Financial Services', icon: DollarSign, color: 'green' },
  healthcare: { name: 'Healthcare', icon: Activity, color: 'blue' },
  marketing: { name: 'Marketing', icon: Target, color: 'pink' },
};

// Animation Variants
const tabVariants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction * 60,
    scale: 0.98,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.08,
    },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction * -60,
    scale: 0.98,
  }),
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Demo Banner Component
function DemoBanner({ onSignUp }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white px-4 py-2.5 overflow-hidden"
    >
      {/* Shimmer effect */}
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
      />
      
      <div className="relative flex items-center justify-center gap-4 text-sm">
        <Sparkles className="w-4 h-4" />
        <span className="font-medium">
          You're viewing an interactive demo of DataViz Studio
        </span>
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/20 hover:bg-white/30 text-white border-0 h-7"
          onClick={onSignUp}
        >
          Sign Up Free
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

// Locked Feature Button
function LockedButton({ children, className }) {
  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="sm"
        className={`opacity-50 cursor-not-allowed ${className}`}
        disabled
      >
        {children}
        <Lock className="w-3 h-3 ml-1.5" />
      </Button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Sign up to unlock
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ metric, onClick }) {
  const Icon = metric.icon;
  const isUp = metric.trend === 'up';
  
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-[#0f1d32] rounded-xl p-5 border border-white/10 cursor-pointer hover:border-purple-500/30 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        <div className={`flex items-center gap-1 text-sm ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {metric.change}
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
      <p className="text-sm text-gray-400">{metric.label}</p>
    </motion.div>
  );
}

// Mini Bar Chart Component
function MiniBarChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((item, idx) => (
        <motion.div
          key={item.name}
          initial={{ height: 0 }}
          animate={{ height: `${(item.value / maxValue) * 100}%` }}
          transition={{ delay: idx * 0.1, duration: 0.5 }}
          className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-md relative group"
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Mini Pie Chart Component
function MiniPieChart({ data }) {
  let cumulativePercent = 0;
  
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        {data.map((segment, idx) => {
          const percent = segment.value;
          const dashArray = `${percent} ${100 - percent}`;
          const dashOffset = -cumulativePercent;
          cumulativePercent += percent;
          
          return (
            <motion.circle
              key={segment.name}
              initial={{ strokeDasharray: '0 100' }}
              animate={{ strokeDasharray: dashArray }}
              transition={{ delay: idx * 0.2, duration: 0.8 }}
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={segment.color}
              strokeWidth="3"
              strokeDashoffset={dashOffset}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">100%</span>
      </div>
    </div>
  );
}

// Mini Line Chart Component
function MiniLineChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.value));
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (d.value / maxValue) * 100,
  }));
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  return (
    <div className="h-24 w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <motion.path
          d={pathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Dashboard Tab Content
function DashboardTab() {
  return (
    <motion.div variants={tabVariants} initial="initial" animate="animate" exit="exit" custom={1}>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {SAMPLE_METRICS.map((metric, idx) => (
          <StatCard key={idx} metric={metric} onClick={() => {}} />
        ))}
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Bar Chart Widget */}
        <motion.div variants={itemVariants} className="bg-[#0f1d32] rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Revenue by Region</h3>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <MiniBarChart data={CHART_DATA.bar} />
          <div className="flex justify-between mt-3 text-xs text-gray-500">
            {CHART_DATA.bar.map(d => <span key={d.name}>{d.name}</span>)}
          </div>
        </motion.div>
        
        {/* Pie Chart Widget */}
        <motion.div variants={itemVariants} className="bg-[#0f1d32] rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Customer Segments</h3>
            <PieChart className="w-4 h-4 text-gray-400" />
          </div>
          <MiniPieChart data={CHART_DATA.pie} />
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {CHART_DATA.pie.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-gray-400">{d.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Line Chart Widget */}
        <motion.div variants={itemVariants} className="bg-[#0f1d32] rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Monthly Trend</h3>
            <LineChart className="w-4 h-4 text-gray-400" />
          </div>
          <MiniLineChart data={CHART_DATA.line} />
          <div className="flex justify-between mt-3 text-xs text-gray-500">
            {CHART_DATA.line.map(d => <span key={d.month}>{d.month}</span>)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Datasets Tab Content
function DatasetsTab() {
  return (
    <motion.div variants={tabVariants} initial="initial" animate="animate" exit="exit" custom={1}>
      <div className="bg-[#0f1d32] rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search datasets..."
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 w-64"
              />
            </div>
            <LockedButton><Filter className="w-4 h-4 mr-1" /> Filter</LockedButton>
          </div>
          <LockedButton><Plus className="w-4 h-4 mr-1" /> Upload Data</LockedButton>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 border-b border-white/10">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Rows</th>
              <th className="px-4 py-3 font-medium">Columns</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_DATASETS.map((dataset, idx) => (
              <motion.tr
                key={dataset.id}
                variants={itemVariants}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Database className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-white font-medium">{dataset.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{dataset.rows.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-400">{dataset.columns}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{dataset.type}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-400">{dataset.updated}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <LockedButton className="h-8 px-2"><Download className="w-4 h-4" /></LockedButton>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// Dashboards Tab Content
function DashboardsTab() {
  return (
    <motion.div variants={tabVariants} initial="initial" animate="animate" exit="exit" custom={1}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-white/10 text-gray-300">
            <Layers className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <LockedButton><Plus className="w-4 h-4 mr-1" /> New Dashboard</LockedButton>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {SAMPLE_DASHBOARDS.map((dashboard, idx) => (
          <motion.div
            key={dashboard.id}
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-[#0f1d32] rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-purple-500/30 transition-colors"
          >
            {/* Dashboard Preview */}
            <div className="h-32 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 p-4 relative">
              <div className="grid grid-cols-3 gap-2 h-full opacity-60">
                <div className="bg-white/10 rounded" />
                <div className="bg-white/10 rounded col-span-2" />
                <div className="bg-white/10 rounded col-span-2" />
                <div className="bg-white/10 rounded" />
              </div>
              {dashboard.shared && (
                <Badge className="absolute top-2 right-2 bg-green-500/20 text-green-400 border-green-500/30">
                  <Share2 className="w-3 h-3 mr-1" /> Shared
                </Badge>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-white mb-1">{dashboard.name}</h3>
                  <p className="text-xs text-gray-500">Template: {dashboard.template}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" /> {dashboard.widgets} widgets
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {dashboard.views} views
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Charts Tab Content
function ChartsTab() {
  return (
    <motion.div variants={tabVariants} initial="initial" animate="animate" exit="exit" custom={1}>
      <div className="grid grid-cols-2 gap-4">
        {SAMPLE_CHARTS.map((chart, idx) => (
          <motion.div
            key={chart.id}
            variants={itemVariants}
            className="bg-[#0f1d32] rounded-xl border border-white/10 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">{chart.name}</h3>
                <p className="text-xs text-gray-500">Source: {chart.dataset}</p>
              </div>
              <Badge variant="outline" className="text-xs">{chart.type}</Badge>
            </div>
            
            {/* Chart Preview */}
            <div className="h-40 flex items-center justify-center">
              {chart.type === 'Bar' && <MiniBarChart data={CHART_DATA.bar} />}
              {chart.type === 'Pie' && <MiniPieChart data={CHART_DATA.pie} />}
              {chart.type === 'Line' && <MiniLineChart data={CHART_DATA.line} />}
              {chart.type === 'Funnel' && (
                <div className="w-full space-y-2">
                  {[100, 75, 50, 30].map((width, i) => (
                    <motion.div
                      key={i}
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ delay: i * 0.2 }}
                      className="h-6 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded mx-auto"
                      style={{ opacity: 1 - i * 0.2 }}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
              <Button variant="ghost" size="sm" className="flex-1">
                <Eye className="w-4 h-4 mr-1" /> Preview
              </Button>
              <LockedButton className="flex-1"><Download className="w-4 h-4 mr-1" /> Export</LockedButton>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Reports Tab Content
function ReportsTab() {
  return (
    <motion.div variants={tabVariants} initial="initial" animate="animate" exit="exit" custom={1}>
      <div className="bg-[#0f1d32] rounded-xl border border-white/10 overflow-hidden">
        {/* Report Preview */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
          <div className="max-w-2xl mx-auto">
            {/* Report Header */}
            <div className="text-center mb-6 pb-4 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white mb-1">Q4 Sales Report</h2>
              <p className="text-gray-400">Comprehensive Analysis</p>
            </div>
            
            {/* Key Metrics Row */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {SAMPLE_METRICS.slice(0, 4).map((m, i) => (
                <div key={i} className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-white">{m.value}</p>
                  <p className="text-xs text-gray-400">{m.label}</p>
                </div>
              ))}
            </div>
            
            {/* Mini Charts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3">Revenue by Region</h4>
                <div className="h-20">
                  <MiniBarChart data={CHART_DATA.bar.slice(0, 4)} />
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3">Monthly Trend</h4>
                <MiniLineChart data={CHART_DATA.line} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Report Actions */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              Blue & Coral Theme
            </Badge>
            <span className="text-sm text-gray-400">4 sections</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-white/10">
              <Eye className="w-4 h-4 mr-1" /> Preview
            </Button>
            <LockedButton><Download className="w-4 h-4 mr-1" /> Export PDF</LockedButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Main Interactive Demo Page Component
export function InteractiveDemoPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [direction, setDirection] = useState(1);
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('retail');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard },
    { id: 'charts', label: 'Charts', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const handleTabChange = (tabId) => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    const newIndex = tabs.findIndex(t => t.id === tabId);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'datasets': return <DatasetsTab />;
      case 'dashboards': return <DashboardsTab />;
      case 'charts': return <ChartsTab />;
      case 'reports': return <ReportsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Demo Banner */}
      <DemoBanner onSignUp={() => navigate('/register')} />
      
      {/* Header */}
      <header className="bg-[#0f1d32] border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 via-fuchsia-500 to-purple-600 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">DataViz Studio</span>
            </div>
            
            {/* Industry Selector */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-gray-300"
                onClick={() => setShowIndustrySelector(!showIndustrySelector)}
              >
                {INDUSTRY_DATA[selectedIndustry].name}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              
              <AnimatePresence>
                {showIndustrySelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-[#0f1d32] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {Object.entries(INDUSTRY_DATA).map(([key, industry]) => {
                      const Icon = industry.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedIndustry(key);
                            setShowIndustrySelector(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                            selectedIndustry === key ? 'bg-purple-500/10 text-purple-400' : 'text-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{industry.name}</span>
                          {selectedIndustry === key && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => navigate('/help')}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Help
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-0"
              onClick={() => navigate('/register')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Sign Up Free
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-[#0f1d32] border-r border-white/10 min-h-[calc(100vh-100px)] p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-lg border border-purple-500/30"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <tab.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            ))}
          </nav>
          
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 rounded-xl p-4 border border-purple-500/20">
              <Zap className="w-6 h-6 text-purple-400 mb-2" />
              <h4 className="font-medium text-white mb-1">Unlock All Features</h4>
              <p className="text-xs text-gray-400 mb-3">
                Sign up to access all charts, export options, and AI insights.
              </p>
              <Button
                size="sm"
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => navigate('/register')}
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-gray-400">
              Explore {INDUSTRY_DATA[selectedIndustry].name.toLowerCase()} sample data
            </p>
          </div>
          
          <AnimatePresence mode="wait" custom={direction}>
            {renderTabContent()}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default InteractiveDemoPage;
