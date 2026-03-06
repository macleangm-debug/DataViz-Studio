import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GridLayout from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  Save,
  ArrowLeft,
  Trash2,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Hash,
  Table2,
  Type,
  GripVertical,
  X,
  Database,
  Share2,
  ScatterChart as ScatterIcon,
  Radar as RadarIcon,
  LayoutGrid,
  Filter,
  Gauge,
  Layers,
  Loader2,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useOrgStore, useAuthStore } from '../store';
import { toast } from 'sonner';
import axios from 'axios';
import { ShareDashboardDialog } from '../components/ShareDashboardDialog';
import SaveAsTemplateButton from '../components/SaveAsTemplateButton';
import { DashboardFilterProvider, useDashboardFilters } from '../contexts/DashboardFilterContext';
import ActiveFiltersBar from '../components/ActiveFiltersBar';
import DrillBreadcrumb from '../components/DrillBreadcrumb';
import AIInsightsPanel from '../components/AIInsightsPanel';
import NaturalLanguageChart from '../components/NaturalLanguageChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart as ReLineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
  Legend
} from 'recharts';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WIDGET_TYPES = [
  { type: 'stat', label: 'Stat Card', icon: Hash, desc: 'Show a single metric' },
  { type: 'chart', label: 'Chart', icon: BarChart3, desc: 'Visualize data' },
  { type: 'table', label: 'Data Table', icon: Table2, desc: 'Show data rows' },
  { type: 'text', label: 'Text Block', icon: Type, desc: 'Add rich text' },
];

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'horizontal_bar', label: 'Horizontal Bar', icon: BarChart3 },
  { value: 'stacked_bar', label: 'Stacked Bar', icon: Layers },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'area', label: 'Area Chart', icon: LineChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'donut', label: 'Donut Chart', icon: PieChart },
  { value: 'scatter', label: 'Scatter Plot', icon: ScatterIcon },
  { value: 'radar', label: 'Radar Chart', icon: RadarIcon },
  { value: 'treemap', label: 'Treemap', icon: LayoutGrid },
  { value: 'funnel', label: 'Funnel Chart', icon: Filter },
  { value: 'gauge', label: 'Gauge/KPI', icon: Gauge },
];

const COLOR_SCHEMES = {
  purple: {
    name: 'Purple Violet',
    colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9'],
    gradient: ['#a78bfa', '#8b5cf6'],
    accent: '#8b5cf6'
  },
  blue: {
    name: 'Ocean Blue',
    colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'],
    gradient: ['#60a5fa', '#3b82f6'],
    accent: '#3b82f6'
  },
  emerald: {
    name: 'Emerald Green',
    colors: ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857'],
    gradient: ['#34d399', '#10b981'],
    accent: '#10b981'
  },
  orange: {
    name: 'Sunset Orange',
    colors: ['#f97316', '#fb923c', '#fdba74', '#ea580c', '#c2410c'],
    gradient: ['#fb923c', '#f97316'],
    accent: '#f97316'
  },
  pink: {
    name: 'Rose Pink',
    colors: ['#ec4899', '#f472b6', '#f9a8d4', '#db2777', '#be185d'],
    gradient: ['#f472b6', '#ec4899'],
    accent: '#ec4899'
  },
  cyan: {
    name: 'Cyan Teal',
    colors: ['#06b6d4', '#22d3ee', '#67e8f9', '#0891b2', '#0e7490'],
    gradient: ['#22d3ee', '#06b6d4'],
    accent: '#06b6d4'
  },
  rainbow: {
    name: 'Rainbow Mix',
    colors: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
    gradient: ['#8b5cf6', '#ec4899'],
    accent: '#8b5cf6'
  },
  monochrome: {
    name: 'Monochrome',
    colors: ['#6b7280', '#9ca3af', '#d1d5db', '#4b5563', '#374151'],
    gradient: ['#9ca3af', '#6b7280'],
    accent: '#6b7280'
  }
};

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

// Widget Component with Cross-Filtering and Drill-Down Support
function DashboardWidget({ 
  widget, 
  data, 
  onEdit, 
  onDelete, 
  onDataClick, 
  onDrillDown,
  isFiltered, 
  isLoading,
  drillState,
  onDrillNavigate,
  onDrillReset,
  canDrill,
  isDrilled
}) {
  const colorScheme = COLOR_SCHEMES[widget.config?.color_scheme] || COLOR_SCHEMES.purple;
  
  // Handle chart click - drill or cross-filter
  const handleChartClick = (chartData) => {
    if (!chartData || chartData.name === undefined) return;
    
    const drillHierarchy = widget.config?.drilldown;
    const xField = widget.config?.x_field;
    
    // If widget has drilldown hierarchy and can drill further, drill down
    if (drillHierarchy && drillHierarchy.length > 1 && canDrill) {
      const currentLevel = drillState?.level || 0;
      const currentField = drillHierarchy[currentLevel];
      if (onDrillDown) {
        onDrillDown(widget.id, currentField, chartData.name);
      }
    } 
    // Otherwise, use cross-filtering
    else if (onDataClick && xField) {
      onDataClick(xField, chartData.name, widget.id);
    }
  };
  
  const renderContent = () => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      );
    }
    
    if (!data) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <Database className="w-8 h-8 opacity-50" />
        </div>
      );
    }

    switch (widget.type) {
      case 'stat':
        return (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-foreground">
              {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{data.aggregation}</p>
          </div>
        );

      case 'chart':
        const chartType = widget.config?.chart_type || 'bar';
        const widgetId = widget.id;
        if (!Array.isArray(data) || data.length === 0) {
          return <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>;
        }
        
        // Common tooltip style
        const tooltipStyle = {
          contentStyle: { 
            backgroundColor: 'rgba(17, 17, 27, 0.95)', 
            border: `1px solid ${colorScheme.accent}40`,
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            padding: '12px 16px'
          },
          labelStyle: { color: '#fff', fontWeight: 600, marginBottom: '4px' },
          itemStyle: { color: colorScheme.colors[1] }
        };
        
        // Pie Chart
        if (chartType === 'pie') {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="75%"
                  paddingAngle={2}
                  strokeWidth={0}
                  onClick={handleChartClick}
                  cursor="pointer"
                >
                  {data.map((_, index) => (
                    <Cell 
                      key={index} 
                      fill={colorScheme.colors[index % colorScheme.colors.length]} 
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                    />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(value, name) => [value.toLocaleString(), name]} />
              </RePieChart>
            </ResponsiveContainer>
          );
        }
        
        // Donut Chart
        if (chartType === 'donut') {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="80%"
                  paddingAngle={3}
                  strokeWidth={0}
                  onClick={handleChartClick}
                  cursor="pointer"
                >
                  {data.map((_, index) => (
                    <Cell 
                      key={index} 
                      fill={colorScheme.colors[index % colorScheme.colors.length]} 
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                    />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(value, name) => [value.toLocaleString(), name]} />
              </RePieChart>
            </ResponsiveContainer>
          );
        }
        
        // Line Chart
        if (chartType === 'line') {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }} onClick={(e) => e?.activePayload && handleChartClick(e.activePayload[0]?.payload)}>
                <defs>
                  <linearGradient id={`lineGradient-${widgetId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={colorScheme.gradient[0]}/>
                    <stop offset="100%" stopColor={colorScheme.gradient[1]}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip {...tooltipStyle} formatter={(value) => [value.toLocaleString(), 'Value']} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={`url(#lineGradient-${widgetId})`}
                  strokeWidth={3} 
                  dot={{ fill: colorScheme.accent, strokeWidth: 0, r: 4, cursor: 'pointer' }}
                  activeDot={{ fill: colorScheme.colors[1], strokeWidth: 0, r: 6, cursor: 'pointer' }}
                />
              </ReLineChart>
            </ResponsiveContainer>
          );
        }
        
        // Area Chart
        if (chartType === 'area') {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id={`areaGradient-${widgetId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorScheme.accent} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={colorScheme.accent} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip {...tooltipStyle} formatter={(value) => [value.toLocaleString(), 'Value']} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={colorScheme.accent}
                  strokeWidth={2} 
                  fill={`url(#areaGradient-${widgetId})`}
                  dot={false}
                />
              </ReLineChart>
            </ResponsiveContainer>
          );
        }
        
        // Horizontal Bar Chart
        if (chartType === 'horizontal_bar') {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }} barCategoryGap="25%">
                <defs>
                  <linearGradient id={`hbarGradient-${widgetId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={colorScheme.gradient[1]} stopOpacity={0.8}/>
                    <stop offset="100%" stopColor={colorScheme.gradient[0]} stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip {...tooltipStyle} cursor={{ fill: `${colorScheme.accent}15` }} formatter={(value) => [value.toLocaleString(), 'Value']} />
                <Bar dataKey="value" fill={`url(#hbarGradient-${widgetId})`} radius={[0, 6, 6, 0]} maxBarSize={35} onClick={handleChartClick} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          );
        }

        // Stacked Bar Chart
        if (chartType === 'stacked_bar') {
          // For stacked bar, we need data with multiple value keys
          // We'll check if data has value2, value3 etc. or use value as default
          const hasMultipleValues = data[0] && (data[0].value2 !== undefined || data[0].series);
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" stackId="stack" fill={colorScheme.colors[0]} radius={[0, 0, 0, 0]} />
                {hasMultipleValues && data[0].value2 !== undefined && (
                  <Bar dataKey="value2" stackId="stack" fill={colorScheme.colors[1]} radius={[0, 0, 0, 0]} />
                )}
                {hasMultipleValues && data[0].value3 !== undefined && (
                  <Bar dataKey="value3" stackId="stack" fill={colorScheme.colors[2]} radius={[8, 8, 0, 0]} />
                )}
                {!hasMultipleValues && (
                  <Bar dataKey="value" fill={colorScheme.colors[0]} radius={[8, 8, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          );
        }

        // Scatter Plot
        if (chartType === 'scatter') {
          // Scatter expects data with x and y values, or we map from name/value
          const scatterData = data.map((d, i) => ({
            x: d.x !== undefined ? d.x : i + 1,
            y: d.y !== undefined ? d.y : d.value,
            name: d.name,
            z: d.z || d.value || 100
          }));
          return (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" dataKey="x" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="y" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <ZAxis type="number" dataKey="z" range={[60, 400]} />
                <Tooltip {...tooltipStyle} formatter={(value, name) => [value.toLocaleString(), name]} />
                <Scatter data={scatterData} fill={colorScheme.accent}>
                  {scatterData.map((_, index) => (
                    <Cell key={index} fill={colorScheme.colors[index % colorScheme.colors.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          );
        }

        // Radar Chart
        if (chartType === 'radar') {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke={colorScheme.accent}
                  fill={colorScheme.accent}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip {...tooltipStyle} formatter={(value) => [value.toLocaleString(), 'Value']} />
              </RadarChart>
            </ResponsiveContainer>
          );
        }

        // Treemap Chart
        if (chartType === 'treemap') {
          const treemapData = data.map((d, i) => ({
            name: d.name,
            size: d.value,
            fill: colorScheme.colors[i % colorScheme.colors.length]
          }));
          return (
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4/3}
                stroke="rgba(0,0,0,0.3)"
                content={({ x, y, width, height, name, fill }) => (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                      rx={4}
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
                    />
                    {width > 40 && height > 25 && (
                      <text
                        x={x + width / 2}
                        y={y + height / 2}
                        fill="#fff"
                        fontSize={11}
                        fontWeight={600}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {name}
                      </text>
                    )}
                  </g>
                )}
              />
            </ResponsiveContainer>
          );
        }

        // Funnel Chart
        if (chartType === 'funnel') {
          const funnelData = data.map((d, i) => ({
            name: d.name,
            value: d.value,
            fill: colorScheme.colors[i % colorScheme.colors.length]
          }));
          return (
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                <Tooltip {...tooltipStyle} formatter={(value, name) => [value.toLocaleString(), name]} />
                <Funnel
                  data={funnelData}
                  dataKey="value"
                  nameKey="name"
                  isAnimationActive
                >
                  <LabelList
                    position="center"
                    fill="#fff"
                    fontSize={11}
                    fontWeight={600}
                    formatter={(value) => value.toLocaleString()}
                  />
                  {funnelData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          );
        }

        // Gauge/KPI Chart (Custom SVG implementation)
        if (chartType === 'gauge') {
          const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
          const maxValue = Math.max(...data.map(d => d.value || 0));
          const percentage = total > 0 ? Math.min((maxValue / total) * 100, 100) : 0;
          const value = data[0]?.value || 0;
          
          // SVG gauge parameters
          const size = 200;
          const strokeWidth = 20;
          const radius = (size - strokeWidth) / 2;
          const circumference = radius * Math.PI; // Half circle
          const offset = circumference - (percentage / 100) * circumference;
          
          return (
            <div className="h-full flex flex-col items-center justify-center">
              <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
                <defs>
                  <linearGradient id={`gaugeGradient-${widgetId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={colorScheme.gradient[0]} />
                    <stop offset="100%" stopColor={colorScheme.gradient[1]} />
                  </linearGradient>
                </defs>
                {/* Background arc */}
                <path
                  d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                {/* Value arc */}
                <path
                  d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                  fill="none"
                  stroke={`url(#gaugeGradient-${widgetId})`}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                {/* Center value */}
                <text
                  x={size / 2}
                  y={size / 2 - 5}
                  textAnchor="middle"
                  fill="hsl(var(--foreground))"
                  fontSize="28"
                  fontWeight="700"
                >
                  {value.toLocaleString()}
                </text>
                <text
                  x={size / 2}
                  y={size / 2 + 20}
                  textAnchor="middle"
                  fill="hsl(var(--muted-foreground))"
                  fontSize="12"
                >
                  {data[0]?.name || 'Value'}
                </text>
              </svg>
            </div>
          );
        }
        
        // Default: Vertical Bar Chart
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }} barCategoryGap="20%">
              <defs>
                <linearGradient id={`barGradient-${widgetId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorScheme.gradient[0]} stopOpacity={1}/>
                  <stop offset="100%" stopColor={colorScheme.gradient[1]} stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip {...tooltipStyle} cursor={{ fill: `${colorScheme.accent}15`, radius: 4 }} formatter={(value) => [value.toLocaleString(), 'Value']} />
              <Bar 
                dataKey="value" 
                fill={`url(#barGradient-${widgetId})`} 
                radius={[8, 8, 0, 0]} 
                maxBarSize={60}
                onClick={handleChartClick}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'table':
        if (!Array.isArray(data) || data.length === 0) {
          return <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>;
        }
        const columns = Object.keys(data[0] || {});
        return (
          <div className="overflow-auto h-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {columns.map(col => (
                    <th key={col} className="text-left p-2 font-medium text-muted-foreground">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    {columns.map(col => (
                      <td key={col} className="p-2 text-foreground">{String(row[col] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'text':
        return (
          <div className="h-full p-2 prose prose-sm dark:prose-invert">
            <p>{widget.config?.content || 'Add some text...'}</p>
          </div>
        );

      default:
        return null;
    }
  };

  const hasDrillHierarchy = widget.config?.drilldown && widget.config.drilldown.length > 1;

  return (
    <Card className={`h-full flex flex-col overflow-hidden group bg-card/50 backdrop-blur-sm border-border/50 ${isFiltered ? 'ring-1 ring-violet-500/30' : ''} ${isDrilled ? 'ring-1 ring-cyan-500/30' : ''}`}>
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/30 bg-muted/20">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <GripVertical className="w-3 h-3 text-muted-foreground/50 cursor-move drag-handle hover:text-muted-foreground transition-colors flex-shrink-0" />
          <span className="font-medium text-xs text-foreground/90 truncate">{widget.title}</span>
          {hasDrillHierarchy && !isDrilled && (
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[9px] px-1 py-0 h-3.5 flex-shrink-0">
              <Layers className="w-2 h-2 mr-0.5" />
              Drill
            </Badge>
          )}
          {isDrilled && (
            <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 text-[9px] px-1 py-0 h-3.5 flex-shrink-0">
              <Layers className="w-2 h-2 mr-0.5" />
              Drilled
            </Badge>
          )}
          {isFiltered && (
            <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 text-[9px] px-1 py-0 h-3.5 flex-shrink-0">
              <Filter className="w-2 h-2 mr-0.5" />
              Filtered
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onEdit(widget)}>
            <Settings className="w-2.5 h-2.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => onDelete(widget.id)}>
            <Trash2 className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>
      
      {/* Drill Breadcrumb */}
      {isDrilled && drillState && (
        <div className="px-2 py-1 border-b border-border/20">
          <DrillBreadcrumb
            path={drillState.path}
            hierarchy={drillState.hierarchy}
            onNavigate={(index) => onDrillNavigate && onDrillNavigate(widget.id, index)}
            onReset={() => onDrillReset && onDrillReset(widget.id)}
          />
        </div>
      )}
      
      <div className="flex-1 p-1.5 overflow-hidden">
        {renderContent()}
      </div>
    </Card>
  );
}

// Inner component that uses filter context
function DashboardBuilderInner() {
  const { dashboardId } = useParams();
  const navigate = useNavigate();
  const { currentOrg } = useOrgStore();
  const { token } = useAuthStore();
  const { 
    filters, setFilter, hasFilters, setWidgetLoading, isWidgetLoading, filterSources,
    initDrillState, getDrillState, drillDown, drillNavigate, drillReset, 
    hasDrillDown, isDrilledDown, getCurrentDrillField, canDrillFurther
  } = useDashboardFilters();
  
  const [dashboard, setDashboard] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [widgetData, setWidgetData] = useState({});
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showNLChart, setShowNLChart] = useState(false);
  const [selectedWidgetForInsights, setSelectedWidgetForInsights] = useState(null);
  const [newWidget, setNewWidget] = useState({
    type: 'stat',
    title: '',
    dataset_id: '',
    config: {}
  });

  useEffect(() => {
    if (dashboardId) {
      fetchDashboardData();
    }
  }, [dashboardId]);

  const fetchDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [dashboardRes, widgetsRes, datasetsRes] = await Promise.all([
        axios.get(`${API_URL}/api/dashboards/${dashboardId}`, { headers }),
        axios.get(`${API_URL}/api/dashboards/${dashboardId}/widgets`, { headers }),
        axios.get(`${API_URL}/api/datasets`, { headers })
      ]);
      
      setDashboard(dashboardRes.data);
      const fetchedWidgets = widgetsRes.data.widgets || [];
      setWidgets(fetchedWidgets);
      setDatasets(datasetsRes.data.datasets || []);
      
      // Initialize drill state for widgets with drilldown hierarchy
      fetchedWidgets.forEach(w => {
        if (w.config?.drilldown && w.config.drilldown.length > 1) {
          initDrillState(w.id, w.config.drilldown);
        }
      });
      
      // Fetch data for each widget
      const widgetDataPromises = fetchedWidgets.map(async (w) => {
        try {
          const res = await axios.get(`${API_URL}/api/widgets/${w.id}/data`, { headers });
          return { id: w.id, data: res.data.data };
        } catch {
          return { id: w.id, data: null };
        }
      });
      
      const dataResults = await Promise.all(widgetDataPromises);
      const dataMap = {};
      dataResults.forEach(r => { dataMap[r.id] = r.data; });
      setWidgetData(dataMap);
      
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Cross-filter effect: Re-fetch widget data when filters change
  useEffect(() => {
    if (!hasFilters || widgets.length === 0) return;
    
    const fetchFilteredData = async () => {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch filtered data for all widgets except the source widget
      const fetchPromises = widgets.map(async (w) => {
        // Skip if this widget is the source of the filter
        const isSource = Object.values(filterSources).includes(w.id);
        if (isSource) {
          return { id: w.id, data: widgetData[w.id], filtered: false };
        }
        
        setWidgetLoading(w.id, true);
        try {
          const res = await axios.post(`${API_URL}/api/widgets/${w.id}/data`, {
            filters: filters
          }, { headers });
          return { id: w.id, data: res.data.data, filtered: res.data.filtered };
        } catch (error) {
          console.error(`Error fetching filtered data for widget ${w.id}:`, error);
          return { id: w.id, data: widgetData[w.id], filtered: false };
        } finally {
          setWidgetLoading(w.id, false);
        }
      });
      
      const results = await Promise.all(fetchPromises);
      const newDataMap = { ...widgetData };
      results.forEach(r => { newDataMap[r.id] = r.data; });
      setWidgetData(newDataMap);
    };
    
    fetchFilteredData();
  }, [filters, filterSources]);

  // Re-fetch all data when filters are cleared
  useEffect(() => {
    if (!hasFilters && widgets.length > 0) {
      const fetchUnfilteredData = async () => {
        const headers = { Authorization: `Bearer ${token}` };
        
        const fetchPromises = widgets.map(async (w) => {
          try {
            const res = await axios.get(`${API_URL}/api/widgets/${w.id}/data`, { headers });
            return { id: w.id, data: res.data.data };
          } catch {
            return { id: w.id, data: null };
          }
        });
        
        const results = await Promise.all(fetchPromises);
        const newDataMap = {};
        results.forEach(r => { newDataMap[r.id] = r.data; });
        setWidgetData(newDataMap);
      };
      
      // Only refetch if we had filters before
      if (Object.keys(widgetData).length > 0) {
        fetchUnfilteredData();
      }
    }
  }, [hasFilters]);

  // Handle chart click for cross-filtering
  const handleDataClick = (field, value, sourceWidgetId) => {
    setFilter(field, value, sourceWidgetId);
    toast.success(`Filtered by ${field}: ${value}`, { duration: 2000 });
  };

  // Handle drill down click
  const handleDrillDown = async (widgetId, field, value) => {
    drillDown(widgetId, field, value);
    
    // Fetch new data for the drilled widget
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    const drillState = getDrillState(widgetId);
    const newPath = { ...drillState.path, [field]: value };
    const newLevel = drillState.level + 1;
    const nextField = widget.config?.drilldown?.[newLevel];
    
    setWidgetLoading(widgetId, true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/api/widgets/${widgetId}/data`, {
        filters: { ...filters, ...newPath },
        drill_level: nextField
      }, { headers });
      
      setWidgetData(prev => ({ ...prev, [widgetId]: res.data.data }));
      toast.success(`Drilled into ${field}: ${value}`, { duration: 2000 });
    } catch (error) {
      console.error('Error fetching drilled data:', error);
      toast.error('Failed to drill down');
    } finally {
      setWidgetLoading(widgetId, false);
    }
  };

  // Handle drill breadcrumb navigation
  const handleDrillNavigate = async (widgetId, targetIndex) => {
    drillNavigate(widgetId, targetIndex);
    
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    const drillState = getDrillState(widgetId);
    const pathEntries = Object.entries(drillState.path);
    const newPath = {};
    pathEntries.slice(0, targetIndex + 1).forEach(([k, v]) => { newPath[k] = v; });
    
    const newLevel = targetIndex + 1;
    const nextField = widget.config?.drilldown?.[newLevel];
    
    setWidgetLoading(widgetId, true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/api/widgets/${widgetId}/data`, {
        filters: { ...filters, ...newPath },
        drill_level: nextField
      }, { headers });
      
      setWidgetData(prev => ({ ...prev, [widgetId]: res.data.data }));
    } catch (error) {
      console.error('Error navigating drill:', error);
    } finally {
      setWidgetLoading(widgetId, false);
    }
  };

  // Handle drill reset
  const handleDrillReset = async (widgetId) => {
    drillReset(widgetId);
    
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    const originalXField = widget.config?.drilldown?.[0] || widget.config?.x_field;
    
    setWidgetLoading(widgetId, true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/api/widgets/${widgetId}/data`, {
        filters: filters,
        drill_level: originalXField
      }, { headers });
      
      setWidgetData(prev => ({ ...prev, [widgetId]: res.data.data }));
      toast.success('Drill reset to top level', { duration: 2000 });
    } catch (error) {
      console.error('Error resetting drill:', error);
    } finally {
      setWidgetLoading(widgetId, false);
    }
  };

  const handleLayoutChange = async (newLayout) => {
    // Update widget positions
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = newLayout.find(l => l.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        };
      }
      return widget;
    });
    setWidgets(updatedWidgets);
  };

  const saveLayout = async () => {
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const layoutData = widgets.map(w => ({
        id: w.id,
        x: w.position?.x || 0,
        y: w.position?.y || 0,
        w: w.position?.w || 4,
        h: w.position?.h || 3
      }));
      
      await axios.put(`${API_URL}/api/dashboards/${dashboardId}/layout`, {
        widgets: layoutData
      }, { headers });
      
      toast.success('Dashboard saved');
    } catch (error) {
      toast.error('Failed to save dashboard');
    } finally {
      setSaving(false);
    }
  };

  const addWidget = async () => {
    if (!newWidget.title) {
      toast.error('Please enter a widget title');
      return;
    }
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Calculate position for new widget
      const maxY = widgets.reduce((max, w) => 
        Math.max(max, (w.position?.y || 0) + (w.position?.h || 3)), 0);
      
      const widgetData = {
        dashboard_id: dashboardId,
        type: newWidget.type,
        title: newWidget.title,
        dataset_id: newWidget.dataset_id || null,
        config: newWidget.config,
        position: { x: 0, y: maxY, w: 4, h: 3 }
      };
      
      const response = await axios.post(`${API_URL}/api/widgets`, widgetData, { headers });
      
      const createdWidget = {
        id: response.data.id,
        ...widgetData,
        position: response.data.position
      };
      
      setWidgets([...widgets, createdWidget]);
      
      // Fetch data for new widget
      if (newWidget.dataset_id) {
        const dataRes = await axios.get(`${API_URL}/api/widgets/${response.data.id}/data`, { headers });
        setWidgetData(prev => ({ ...prev, [response.data.id]: dataRes.data.data }));
      }
      
      setShowAddWidget(false);
      setNewWidget({ type: 'stat', title: '', dataset_id: '', config: {} });
      toast.success('Widget added');
    } catch (error) {
      toast.error('Failed to add widget');
    }
  };

  const updateWidget = async () => {
    if (!editingWidget) return;
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`${API_URL}/api/widgets/${editingWidget.id}`, {
        dashboard_id: dashboardId,
        type: editingWidget.type,
        title: editingWidget.title,
        dataset_id: editingWidget.dataset_id,
        config: editingWidget.config,
        position: editingWidget.position
      }, { headers });
      
      setWidgets(widgets.map(w => w.id === editingWidget.id ? editingWidget : w));
      
      // Refresh widget data
      if (editingWidget.dataset_id) {
        const dataRes = await axios.get(`${API_URL}/api/widgets/${editingWidget.id}/data`, { headers });
        setWidgetData(prev => ({ ...prev, [editingWidget.id]: dataRes.data.data }));
      }
      
      setEditingWidget(null);
      toast.success('Widget updated');
    } catch (error) {
      toast.error('Failed to update widget');
    }
  };

  const deleteWidget = async (widgetId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/widgets/${widgetId}`, { headers });
      setWidgets(widgets.filter(w => w.id !== widgetId));
      toast.success('Widget deleted');
    } catch (error) {
      toast.error('Failed to delete widget');
    }
  };

  const getSelectedDataset = (datasetId) => {
    return datasets.find(d => d.id === datasetId);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboard) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Dashboard not found</p>
          <Button onClick={() => navigate('/dashboards')} className="mt-4">
            Back to Dashboards
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Layout: 3 widgets per row (w=4 for each in a 12-col grid)
  // Reduced height (h=4) for more compact dashboard view
  const layout = widgets.map((w, index) => ({
    i: w.id,
    x: w.position?.x ?? ((index % 3) * 4),  // 0, 4, 8 for 3 per row
    y: w.position?.y ?? (Math.floor(index / 3) * 4),
    w: w.position?.w || 4,  // 4 columns = 3 widgets per row
    h: w.position?.h || 4,  // Compact height
    minW: 2,
    minH: 2
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="dashboard-builder-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboards')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{dashboard.name}</h1>
              <p className="text-sm text-muted-foreground">{widgets.length} widgets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShareDialogOpen(true)}
              data-testid="share-dashboard-btn"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <SaveAsTemplateButton 
              dashboardId={dashboardId} 
              dashboardName={dashboard.name} 
              token={token}
            />
            <Button 
              variant="outline" 
              onClick={() => setShowNLChart(true)} 
              className="border-violet-500/30 hover:bg-violet-500/10"
              data-testid="ai-chart-btn"
            >
              <Sparkles className="w-4 h-4 mr-2 text-violet-400" />
              AI Chart
            </Button>
            <Button variant="outline" onClick={() => setShowAddWidget(true)} data-testid="add-widget-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>
            <Button onClick={saveLayout} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Natural Language Chart Dialog */}
        <AnimatePresence>
          {showNLChart && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowNLChart(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <NaturalLanguageChart
                  datasets={datasets}
                  token={token}
                  onChartGenerated={async (chartConfig) => {
                    try {
                      const headers = { Authorization: `Bearer ${token}` };
                      await axios.post(`${API_URL}/api/widgets`, {
                        dashboard_id: dashboardId,
                        type: 'chart',
                        title: chartConfig.title,
                        dataset_id: chartConfig.dataset_id,
                        config: {
                          chart_type: chartConfig.chart_type,
                          x_field: chartConfig.x_field,
                          y_field: chartConfig.y_field,
                          color_scheme: 'purple'
                        },
                        position: { x: 0, y: 0, w: 4, h: 4 }
                      }, { headers });
                      
                      fetchDashboardData();
                      setShowNLChart(false);
                    } catch (error) {
                      toast.error('Failed to create chart');
                    }
                  }}
                  onClose={() => setShowNLChart(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Bar */}
        <ActiveFiltersBar />

        {/* Grid Layout - 3 widgets per row */}
        <div className="bg-muted/30 rounded-xl p-2 min-h-[400px]">
          {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-center">
              <LayoutDashboard className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No widgets yet</h3>
              <p className="text-muted-foreground mb-4">Add your first widget to start building</p>
              <Button onClick={() => setShowAddWidget(true)} className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Widget
              </Button>
            </div>
          ) : (
            <GridLayout
              className="layout"
              layout={layout}
              cols={12}
              rowHeight={32}
              width={1150}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
              compactType="vertical"
              preventCollision={false}
              margin={[6, 6]}
              containerPadding={[0, 0]}
            >
              {widgets.map(widget => {
                const isSource = Object.values(filterSources).includes(widget.id);
                const isFiltered = hasFilters && !isSource;
                const drillState = getDrillState(widget.id);
                const canDrill = canDrillFurther(widget.id);
                const isDrilled = isDrilledDown(widget.id);
                
                return (
                  <div key={widget.id} data-testid={`widget-${widget.id}`}>
                    <DashboardWidget
                      widget={widget}
                      data={widgetData[widget.id]}
                      onEdit={setEditingWidget}
                      onDelete={deleteWidget}
                      onDataClick={handleDataClick}
                      onDrillDown={handleDrillDown}
                      onDrillNavigate={handleDrillNavigate}
                      onDrillReset={handleDrillReset}
                      isFiltered={isFiltered}
                      isLoading={isWidgetLoading(widget.id)}
                      drillState={drillState}
                      canDrill={canDrill}
                      isDrilled={isDrilled}
                    />
                  </div>
                );
              })}
            </GridLayout>
          )}
        </div>

        {/* Add Widget Dialog */}
        <Sheet open={showAddWidget} onOpenChange={setShowAddWidget}>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add Widget</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              {/* Widget Type Selection */}
              <div className="space-y-3">
                <Label>Widget Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {WIDGET_TYPES.map((wt) => (
                    <button
                      key={wt.type}
                      onClick={() => setNewWidget({ ...newWidget, type: wt.type, config: {} })}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        newWidget.type === wt.type
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-border hover:border-violet-300'
                      }`}
                    >
                      <wt.icon className={`w-5 h-5 mb-2 ${
                        newWidget.type === wt.type ? 'text-violet-600' : 'text-muted-foreground'
                      }`} />
                      <p className="font-medium text-sm text-foreground">{wt.label}</p>
                      <p className="text-xs text-muted-foreground">{wt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Widget Title</Label>
                <Input
                  value={newWidget.title}
                  onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
                  placeholder="Enter widget title"
                  data-testid="widget-title-input"
                />
              </div>

              {newWidget.type !== 'text' && (
                <div className="space-y-2">
                  <Label>Data Source</Label>
                  <Select
                    value={newWidget.dataset_id}
                    onValueChange={(v) => setNewWidget({ ...newWidget, dataset_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((ds) => (
                        <SelectItem key={ds.id} value={ds.id}>
                          {ds.name} ({ds.row_count} rows)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Type-specific config */}
              {newWidget.type === 'stat' && newWidget.dataset_id && (
                <>
                  <div className="space-y-2">
                    <Label>Field</Label>
                    <Select
                      value={newWidget.config.field || ''}
                      onValueChange={(v) => setNewWidget({
                        ...newWidget,
                        config: { ...newWidget.config, field: v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSelectedDataset(newWidget.dataset_id)?.columns?.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Aggregation</Label>
                    <Select
                      value={newWidget.config.aggregation || 'count'}
                      onValueChange={(v) => setNewWidget({
                        ...newWidget,
                        config: { ...newWidget.config, aggregation: v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">Count</SelectItem>
                        <SelectItem value="sum">Sum</SelectItem>
                        <SelectItem value="mean">Average</SelectItem>
                        <SelectItem value="max">Maximum</SelectItem>
                        <SelectItem value="min">Minimum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {newWidget.type === 'chart' && newWidget.dataset_id && (
                <>
                  <div className="space-y-2">
                    <Label>Chart Type</Label>
                    <Select
                      value={newWidget.config.chart_type || 'bar'}
                      onValueChange={(v) => setNewWidget({
                        ...newWidget,
                        config: { ...newWidget.config, chart_type: v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHART_TYPES.map((ct) => (
                          <SelectItem key={ct.value} value={ct.value}>
                            {ct.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Color Scheme</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
                        <button
                          key={key}
                          onClick={() => setNewWidget({
                            ...newWidget,
                            config: { ...newWidget.config, color_scheme: key }
                          })}
                          className={`p-2 rounded-lg border transition-all ${
                            (newWidget.config.color_scheme || 'purple') === key
                              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-500/30'
                              : 'border-border hover:border-violet-300'
                          }`}
                          title={scheme.name}
                        >
                          <div className="flex gap-0.5 justify-center">
                            {scheme.colors.slice(0, 4).map((color, i) => (
                              <div
                                key={i}
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">{scheme.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>X-Axis Field</Label>
                    <Select
                      value={newWidget.config.x_field || ''}
                      onValueChange={(v) => setNewWidget({
                        ...newWidget,
                        config: { ...newWidget.config, x_field: v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSelectedDataset(newWidget.dataset_id)?.columns?.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Y-Axis Field (optional)</Label>
                    <Select
                      value={newWidget.config.y_field || ''}
                      onValueChange={(v) => setNewWidget({
                        ...newWidget,
                        config: { ...newWidget.config, y_field: v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">Count</SelectItem>
                        {getSelectedDataset(newWidget.dataset_id)?.columns
                          ?.filter(c => c.type.includes('int') || c.type.includes('float'))
                          .map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Drill Down Hierarchy */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-cyan-500" />
                      Drill Down Hierarchy (optional)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Select fields for drill-down navigation (e.g., Region → State → City)
                    </p>
                    <Input
                      placeholder="e.g., Region, State, City"
                      value={(newWidget.config.drilldown || []).join(', ')}
                      onChange={(e) => {
                        const fields = e.target.value.split(',').map(f => f.trim()).filter(f => f);
                        setNewWidget({
                          ...newWidget,
                          config: { ...newWidget.config, drilldown: fields }
                        });
                      }}
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {getSelectedDataset(newWidget.dataset_id)?.columns?.map((col) => (
                        <button
                          key={col.name}
                          onClick={() => {
                            const current = newWidget.config.drilldown || [];
                            if (!current.includes(col.name)) {
                              setNewWidget({
                                ...newWidget,
                                config: { ...newWidget.config, drilldown: [...current, col.name] }
                              });
                            }
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-violet-500/20 transition-colors"
                        >
                          + {col.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {newWidget.type === 'text' && (
                <div className="space-y-2">
                  <Label>Content</Label>
                  <textarea
                    value={newWidget.config.content || ''}
                    onChange={(e) => setNewWidget({
                      ...newWidget,
                      config: { ...newWidget.config, content: e.target.value }
                    })}
                    placeholder="Enter text content..."
                    className="w-full min-h-[100px] p-3 rounded-lg border bg-background resize-none"
                  />
                </div>
              )}

              <Button onClick={addWidget} className="w-full bg-violet-600 hover:bg-violet-700">
                Add Widget
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit Widget Dialog */}
        <Sheet open={!!editingWidget} onOpenChange={() => setEditingWidget(null)}>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Widget</SheetTitle>
            </SheetHeader>
            {editingWidget && (
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label>Widget Title</Label>
                  <Input
                    value={editingWidget.title}
                    onChange={(e) => setEditingWidget({ ...editingWidget, title: e.target.value })}
                  />
                </div>

                {editingWidget.type !== 'text' && (
                  <div className="space-y-2">
                    <Label>Data Source</Label>
                    <Select
                      value={editingWidget.dataset_id || ''}
                      onValueChange={(v) => setEditingWidget({ ...editingWidget, dataset_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dataset" />
                      </SelectTrigger>
                      <SelectContent>
                        {datasets.map((ds) => (
                          <SelectItem key={ds.id} value={ds.id}>
                            {ds.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {editingWidget.type === 'stat' && (
                  <>
                    <div className="space-y-2">
                      <Label>Field</Label>
                      <Select
                        value={editingWidget.config?.field || ''}
                        onValueChange={(v) => setEditingWidget({
                          ...editingWidget,
                          config: { ...editingWidget.config, field: v }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSelectedDataset(editingWidget.dataset_id)?.columns?.map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Aggregation</Label>
                      <Select
                        value={editingWidget.config?.aggregation || 'count'}
                        onValueChange={(v) => setEditingWidget({
                          ...editingWidget,
                          config: { ...editingWidget.config, aggregation: v }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="count">Count</SelectItem>
                          <SelectItem value="sum">Sum</SelectItem>
                          <SelectItem value="mean">Average</SelectItem>
                          <SelectItem value="max">Maximum</SelectItem>
                          <SelectItem value="min">Minimum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {editingWidget.type === 'chart' && (
                  <>
                    <div className="space-y-2">
                      <Label>Chart Type</Label>
                      <Select
                        value={editingWidget.config?.chart_type || 'bar'}
                        onValueChange={(v) => setEditingWidget({
                          ...editingWidget,
                          config: { ...editingWidget.config, chart_type: v }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHART_TYPES.map((ct) => (
                            <SelectItem key={ct.value} value={ct.value}>
                              {ct.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>X-Axis Field</Label>
                      <Select
                        value={editingWidget.config?.x_field || ''}
                        onValueChange={(v) => setEditingWidget({
                          ...editingWidget,
                          config: { ...editingWidget.config, x_field: v }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSelectedDataset(editingWidget.dataset_id)?.columns?.map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {editingWidget.type === 'text' && (
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <textarea
                      value={editingWidget.config?.content || ''}
                      onChange={(e) => setEditingWidget({
                        ...editingWidget,
                        config: { ...editingWidget.config, content: e.target.value }
                      })}
                      className="w-full min-h-[100px] p-3 rounded-lg border bg-background resize-none"
                    />
                  </div>
                )}

                <Button onClick={updateWidget} className="w-full bg-violet-600 hover:bg-violet-700">
                  Save Changes
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Share Dashboard Dialog */}
      <ShareDashboardDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        dashboardId={dashboardId}
        dashboardName={dashboard?.name}
        token={token}
      />
    </DashboardLayout>
  );
}

// Main wrapper component with Filter Provider
export function DashboardBuilderPage() {
  return (
    <DashboardFilterProvider>
      <DashboardBuilderInner />
    </DashboardFilterProvider>
  );
}

export default DashboardBuilderPage;
