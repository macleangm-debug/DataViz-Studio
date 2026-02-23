import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  PieChart,
  BarChart3,
  LineChart,
  Plus,
  Trash2,
  Search,
  TrendingUp,
  Sparkles,
  Settings2,
  Maximize2,
  X,
  Save,
  Eye,
  Palette,
  ScatterChart,
  Radar,
  Activity,
  Target,
  Layers,
  ChevronRight,
  Download,
  Copy,
  Check,
  ArrowLeft,
  FileDown,
  ZoomIn,
  Filter,
  RefreshCw,
  MessageSquare,
  Minus,
  Type,
  AlertCircle,
  Paintbrush,
  Crown,
  Lock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
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
  DialogDescription,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useOrgStore, useAuthStore } from '../store';
import { toast } from 'sonner';
import axios from 'axios';
import { ChartPreviews, ChartTypeButton } from '../components/ChartTypePreview';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Annotation types for charts
const ANNOTATION_TYPES = [
  { value: 'text', label: 'Text Label', icon: Type, description: 'Add a text note at a specific point' },
  { value: 'line', label: 'Reference Line', icon: Minus, description: 'Draw a horizontal or vertical line' },
  { value: 'region', label: 'Highlight Region', icon: Layers, description: 'Shade an area on the chart' },
];

// Extended chart types with ECharts support
const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3, category: 'Basic' },
  { value: 'line', label: 'Line Chart', icon: LineChart, category: 'Basic' },
  { value: 'pie', label: 'Pie Chart', icon: PieChart, category: 'Basic' },
  { value: 'area', label: 'Area Chart', icon: TrendingUp, category: 'Basic' },
  { value: 'scatter', label: 'Scatter Plot', icon: ScatterChart, category: 'Advanced' },
  { value: 'radar', label: 'Radar Chart', icon: Radar, category: 'Advanced' },
  { value: 'funnel', label: 'Funnel Chart', icon: Target, category: 'Advanced' },
  { value: 'gauge', label: 'Gauge Chart', icon: Activity, category: 'Advanced' },
  { value: 'heatmap', label: 'Heatmap', icon: Layers, category: 'Advanced' },
  // New Chart Types
  { value: 'treemap', label: 'Treemap', icon: Layers, category: 'Hierarchy' },
  { value: 'waterfall', label: 'Waterfall', icon: BarChart3, category: 'Financial' },
  { value: 'boxplot', label: 'Box Plot', icon: Activity, category: 'Statistical' },
  { value: 'sankey', label: 'Sankey', icon: TrendingUp, category: 'Flow' },
  { value: 'candlestick', label: 'Candlestick', icon: BarChart3, category: 'Financial' },
];

// Color themes for charts
const COLOR_THEMES = {
  violet: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9'],
  ocean: ['#06b6d4', '#22d3ee', '#67e8f9', '#0891b2', '#0e7490'],
  forest: ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857'],
  sunset: ['#f59e0b', '#fbbf24', '#fcd34d', '#d97706', '#b45309'],
  berry: ['#ec4899', '#f472b6', '#f9a8d4', '#db2777', '#be185d'],
  mono: ['#6b7280', '#9ca3af', '#d1d5db', '#4b5563', '#374151'],
};

// Generate annotation config for ECharts markLine and markPoint
const generateAnnotationConfig = (annotations = [], data = []) => {
  const markLine = { data: [], silent: false, symbol: ['none', 'none'] };
  const markPoint = { data: [], symbol: 'pin', symbolSize: 40 };
  const markArea = { data: [] };
  
  annotations.forEach(annotation => {
    if (annotation.type === 'line') {
      if (annotation.axis === 'y') {
        // Horizontal reference line
        markLine.data.push({
          name: annotation.label || '',
          yAxis: annotation.value,
          label: { 
            show: true, 
            formatter: annotation.label || `${annotation.value}`,
            position: 'end',
            color: annotation.color || '#f59e0b'
          },
          lineStyle: { 
            color: annotation.color || '#f59e0b', 
            type: annotation.lineStyle || 'dashed',
            width: 2
          }
        });
      } else {
        // Vertical reference line (at x-axis point)
        markLine.data.push({
          name: annotation.label || '',
          xAxis: annotation.value,
          label: { 
            show: true, 
            formatter: annotation.label || annotation.value,
            position: 'end',
            color: annotation.color || '#f59e0b'
          },
          lineStyle: { 
            color: annotation.color || '#f59e0b', 
            type: annotation.lineStyle || 'dashed',
            width: 2
          }
        });
      }
    } else if (annotation.type === 'text') {
      // Find the data point index for the x value
      const dataIndex = data.findIndex(d => d.name === annotation.xValue);
      if (dataIndex >= 0) {
        markPoint.data.push({
          name: annotation.label,
          coord: [annotation.xValue, annotation.yValue || data[dataIndex]?.value],
          value: annotation.label,
          label: {
            show: true,
            formatter: annotation.label,
            color: '#fff',
            fontSize: 10
          },
          itemStyle: { color: annotation.color || '#8b5cf6' }
        });
      }
    } else if (annotation.type === 'region') {
      markArea.data.push([
        { 
          name: annotation.label || '',
          xAxis: annotation.startX,
          itemStyle: { 
            color: (annotation.color || '#8b5cf6') + '30' // Add transparency
          },
          label: {
            show: true,
            position: 'insideTop',
            formatter: annotation.label || '',
            color: annotation.color || '#8b5cf6'
          }
        },
        { xAxis: annotation.endX }
      ]);
    }
  });
  
  return { markLine, markPoint, markArea };
};

// Generate ECharts options based on chart type and data
const generateChartOptions = (chartType, data, config, theme = 'violet') => {
  const colors = COLOR_THEMES[theme] || COLOR_THEMES.violet;
  const annotations = config?.annotations || [];
  const annotationConfig = generateAnnotationConfig(annotations, data);
  const primaryColor = colors[0];
  const secondaryColor = colors[1];
  
  const baseOptions = {
    backgroundColor: '#11111b',
    color: colors,
    tooltip: {
      trigger: chartType === 'pie' ? 'item' : 'axis',
      backgroundColor: 'rgba(17, 17, 27, 0.95)',
      borderColor: `${primaryColor}40`,
      borderWidth: 1,
      borderRadius: 12,
      padding: [12, 16],
      textStyle: { color: '#fff', fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.3);',
    },
    legend: {
      show: config?.showLegend !== false,
      bottom: 10,
      textStyle: { color: '#9ca3af', fontSize: 11 },
      itemGap: 16,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: config?.showLegend !== false ? '15%' : '10%',
      top: '12%',
      containLabel: true,
    },
  };

  if (!data || data.length === 0) {
    return { ...baseOptions, title: { text: 'No data available', left: 'center', top: 'center', textStyle: { color: '#6b7280', fontSize: 14 } } };
  }

  switch (chartType) {
    case 'bar':
      return {
        ...baseOptions,
        xAxis: {
          type: 'category',
          data: data.map(d => d.name),
          axisLabel: { color: '#9ca3af', rotate: data.length > 8 ? 45 : 0, fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#9ca3af', fontSize: 11, formatter: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
        },
        series: [{
          type: 'bar',
          data: data.map((d, i) => ({
            value: d.value,
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: secondaryColor },
                  { offset: 1, color: primaryColor }
                ]
              }
            }
          })),
          barMaxWidth: 60,
          emphasis: { 
            itemStyle: { 
              shadowBlur: 15, 
              shadowColor: `${primaryColor}50`,
              shadowOffsetY: 5
            } 
          },
          markLine: annotationConfig.markLine,
          markPoint: annotationConfig.markPoint,
          markArea: annotationConfig.markArea,
        }],
      };

    case 'line':
      return {
        ...baseOptions,
        xAxis: {
          type: 'category',
          data: data.map(d => d.name),
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#9ca3af', fontSize: 11, formatter: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
        },
        series: [{
          type: 'line',
          data: data.map(d => d.value),
          smooth: config?.smooth !== false,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { 
            width: 3,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: secondaryColor },
                { offset: 1, color: primaryColor }
              ]
            }
          },
          itemStyle: { color: primaryColor, borderColor: '#11111b', borderWidth: 2 },
          areaStyle: config?.showArea ? { 
            opacity: 0.4,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${primaryColor}60` },
                { offset: 1, color: `${primaryColor}05` }
              ]
            }
          } : undefined,
          markLine: annotationConfig.markLine,
          markPoint: annotationConfig.markPoint,
          markArea: annotationConfig.markArea,
        }],
      };

    case 'area':
      return {
        ...baseOptions,
        xAxis: {
          type: 'category',
          data: data.map(d => d.name),
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
          boundaryGap: false,
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#9ca3af', fontSize: 11, formatter: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
        },
        series: [{
          type: 'line',
          data: data.map(d => d.value),
          smooth: true,
          lineStyle: { 
            width: 2,
            color: primaryColor
          },
          areaStyle: { 
            opacity: 0.6,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${primaryColor}80` },
                { offset: 1, color: `${primaryColor}10` }
              ]
            }
          },
          markLine: annotationConfig.markLine,
          markPoint: annotationConfig.markPoint,
          markArea: annotationConfig.markArea,
        }],
      };

    case 'pie':
      return {
        ...baseOptions,
        series: [{
          type: 'pie',
          radius: config?.donut ? ['45%', '75%'] : '70%',
          center: ['50%', '48%'],
          data: data.map((d, i) => ({ 
            name: d.name, 
            value: d.value,
            itemStyle: { 
              borderRadius: 6, 
              borderColor: '#11111b', 
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.3)'
            }
          })),
          label: {
            show: config?.showLabels !== false,
            color: '#9ca3af',
            fontSize: 11,
            formatter: '{b}: {d}%',
          },
          emphasis: {
            itemStyle: { 
              shadowBlur: 25, 
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              shadowOffsetY: 5
            },
            label: { show: true, fontWeight: 'bold', color: '#fff' },
            scale: true,
            scaleSize: 8,
          },
        }],
      };

    case 'scatter':
      return {
        ...baseOptions,
        xAxis: {
          type: 'value',
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
        },
        series: [{
          type: 'scatter',
          data: data.map((d, i) => [i, d.value]),
          symbolSize: 14,
          itemStyle: { 
            opacity: 0.85,
            shadowBlur: 10,
            shadowColor: `${primaryColor}50`
          },
          emphasis: {
            itemStyle: { shadowBlur: 20, shadowColor: primaryColor }
          }
        }],
      };

    case 'radar':
      const maxValue = Math.max(...data.map(d => d.value));
      return {
        ...baseOptions,
        radar: {
          indicator: data.map(d => ({ name: d.name, max: maxValue * 1.2 })),
          shape: 'polygon',
          splitNumber: 4,
          axisName: { color: '#9ca3af', fontSize: 11 },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
          splitArea: { 
            areaStyle: { 
              color: [`${primaryColor}15`, 'transparent', `${primaryColor}08`, 'transparent'] 
            } 
          },
        },
        series: [{
          type: 'radar',
          data: [{ 
            value: data.map(d => d.value), 
            name: 'Values',
            areaStyle: { 
              opacity: 0.4,
              color: {
                type: 'radial',
                x: 0.5, y: 0.5, r: 0.5,
                colorStops: [
                  { offset: 0, color: `${primaryColor}60` },
                  { offset: 1, color: `${primaryColor}20` }
                ]
              }
            },
          }],
          lineStyle: { width: 2, color: primaryColor },
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: primaryColor, borderColor: '#11111b', borderWidth: 2 }
        }],
      };

    case 'funnel':
      const sortedData = [...data].sort((a, b) => b.value - a.value);
      return {
        ...baseOptions,
        series: [{
          type: 'funnel',
          left: '10%',
          top: 50,
          bottom: 50,
          width: '80%',
          min: 0,
          max: Math.max(...data.map(d => d.value)),
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 3,
          label: { show: true, position: 'inside', color: '#fff', fontSize: 12, fontWeight: 500 },
          emphasis: { 
            label: { fontSize: 14, fontWeight: 'bold' },
            itemStyle: { shadowBlur: 15, shadowColor: 'rgba(0,0,0,0.4)' }
          },
          itemStyle: {
            borderColor: '#11111b',
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.2)'
          },
          data: sortedData.map((d, i) => ({ 
            name: d.name, 
            value: d.value,
            itemStyle: { 
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: colors[i % colors.length] },
                  { offset: 1, color: colors[(i + 1) % colors.length] }
                ]
              }
            }
          })),
        }],
      };

    case 'gauge':
      const total = data.reduce((sum, d) => sum + d.value, 0);
      const avg = total / data.length;
      return {
        ...baseOptions,
        series: [{
          type: 'gauge',
          center: ['50%', '60%'],
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: Math.max(...data.map(d => d.value)) * 1.2,
          splitNumber: 5,
          itemStyle: { 
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: secondaryColor },
                { offset: 1, color: primaryColor }
              ]
            }
          },
          progress: { show: true, width: 22, roundCap: true },
          pointer: { show: true, length: '55%', width: 6, itemStyle: { color: primaryColor } },
          axisLine: { 
            lineStyle: { 
              width: 22, 
              color: [[1, 'rgba(255,255,255,0.08)']] 
            },
            roundCap: true
          },
          axisTick: { show: false },
          splitLine: { distance: -35, length: 8, lineStyle: { color: '#9ca3af', width: 2 } },
          axisLabel: { distance: -30, color: '#9ca3af', fontSize: 11 },
          detail: { 
            valueAnimation: true, 
            color: '#fff',
            fontSize: 28,
            fontWeight: 'bold',
            offsetCenter: [0, '75%'],
            formatter: (value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value
          },
          data: [{ value: Math.round(avg), name: 'Average' }],
        }],
      };

    case 'heatmap':
      // Simplified heatmap
      const heatData = data.map((d, i) => [i % 5, Math.floor(i / 5), d.value]);
      return {
        ...baseOptions,
        grid: { ...baseOptions.grid, top: '10%' },
        xAxis: { 
          type: 'category', 
          data: data.slice(0, 5).map(d => d.name), 
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false }
        },
        yAxis: { 
          type: 'category', 
          data: ['Row 1', 'Row 2'], 
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false }
        },
        visualMap: {
          min: 0,
          max: Math.max(...data.map(d => d.value)),
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: 0,
          inRange: { color: ['#11111b', secondaryColor, primaryColor] },
          textStyle: { color: '#9ca3af' },
        },
        series: [{
          type: 'heatmap',
          data: heatData,
          itemStyle: { borderRadius: 4 },
          emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.4)' } },
        }],
      };

    case 'treemap':
      return {
        ...baseOptions,
        series: [{
          type: 'treemap',
          data: data.map((d, i) => ({
            name: d.name,
            value: d.value,
            itemStyle: { 
              color: colors[i % colors.length],
              borderColor: '#11111b',
              borderWidth: 3,
              borderRadius: 6,
              shadowBlur: 8,
              shadowColor: 'rgba(0,0,0,0.3)'
            },
          })),
          label: { show: true, color: '#fff', fontSize: 12, fontWeight: 500 },
          breadcrumb: { show: false },
          roam: false,
          nodeClick: false,
          levels: [{
            itemStyle: { borderColor: '#11111b', borderWidth: 3, gapWidth: 4 },
          }],
        }],
      };

    case 'waterfall':
      // Calculate cumulative values for waterfall
      let cumulative = 0;
      const waterfallData = data.map((d, i) => {
        const start = cumulative;
        cumulative += d.value;
        return {
          name: d.name,
          value: [start, cumulative],
          itemStyle: { color: d.value >= 0 ? primaryColor : '#ef4444' },
        };
      });
      return {
        ...baseOptions,
        xAxis: {
          type: 'category',
          data: data.map(d => d.name),
          axisLabel: { color: '#9ca3af', fontSize: 11, rotate: data.length > 6 ? 45 : 0 },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#9ca3af', fontSize: 11, formatter: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
        },
        series: [{
          type: 'bar',
          stack: 'waterfall',
          data: waterfallData.map(d => ({ 
            value: d.value[0], 
            itemStyle: { color: 'transparent' } 
          })),
        }, {
          type: 'bar',
          stack: 'waterfall',
          data: waterfallData.map((d, i) => ({ 
            value: d.value[1] - d.value[0],
            itemStyle: { 
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: (d.value[1] - d.value[0]) >= 0 ? secondaryColor : '#f87171' },
                  { offset: 1, color: (d.value[1] - d.value[0]) >= 0 ? primaryColor : '#ef4444' }
                ]
              },
              borderRadius: [6, 6, 0, 0],
              shadowBlur: 8,
              shadowColor: (d.value[1] - d.value[0]) >= 0 ? `${primaryColor}40` : 'rgba(239,68,68,0.3)'
            },
          })),
          label: {
            show: true,
            position: 'top',
            color: '#9ca3af',
            fontSize: 10,
            formatter: (params) => params.value >= 1000 ? `${(params.value/1000).toFixed(1)}k` : params.value,
          },
        }],
      };

    case 'boxplot':
      // Generate boxplot statistics from data
      const values = data.map(d => d.value).sort((a, b) => a - b);
      const q1 = values[Math.floor(values.length * 0.25)];
      const median = values[Math.floor(values.length * 0.5)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const min = values[0];
      const max = values[values.length - 1];
      return {
        ...baseOptions,
        xAxis: {
          type: 'category',
          data: ['Distribution'],
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#9ca3af', fontSize: 11, formatter: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
        },
        series: [{
          type: 'boxplot',
          data: [[min, q1, median, q3, max]],
          itemStyle: { 
            color: `${primaryColor}30`, 
            borderColor: primaryColor,
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: `${primaryColor}40`
          },
        }, {
          type: 'scatter',
          data: data.map((d, i) => [0, d.value]),
          symbolSize: 8,
          itemStyle: { color: secondaryColor, opacity: 0.8, shadowBlur: 5, shadowColor: `${secondaryColor}50` },
        }],
      };

    case 'sankey':
      // Create sankey links from data
      const nodes = data.map(d => ({ name: d.name }));
      const links = data.slice(0, -1).map((d, i) => ({
        source: d.name,
        target: data[i + 1].name,
        value: Math.min(d.value, data[i + 1].value),
      }));
      return {
        ...baseOptions,
        series: [{
          type: 'sankey',
          layout: 'none',
          emphasis: { focus: 'adjacency' },
          data: nodes.map((n, i) => ({ ...n, itemStyle: { color: colors[i % colors.length] } })),
          links: links,
          lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.6 },
          itemStyle: { borderWidth: 2, borderColor: '#11111b' },
          label: { color: '#9ca3af', fontSize: 11 },
        }],
      };

    case 'candlestick':
      // Generate candlestick data (open, close, low, high)
      const candleData = data.map(d => {
        const base = d.value;
        const variance = base * 0.1;
        return [
          base - variance * Math.random(), // open
          base + variance * Math.random(), // close
          base - variance * (1 + Math.random()), // low
          base + variance * (1 + Math.random()), // high
        ];
      });
      return {
        ...baseOptions,
        xAxis: {
          type: 'category',
          data: data.map(d => d.name),
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#9ca3af', fontSize: 11, formatter: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
          scale: true,
        },
        series: [{
          type: 'candlestick',
          data: candleData,
          itemStyle: {
            color: '#10b981', // bullish
            color0: '#ef4444', // bearish
            borderColor: '#34d399',
            borderColor0: '#f87171',
            borderWidth: 1.5,
            shadowBlur: 5,
            shadowColor: 'rgba(0,0,0,0.2)'
          },
        }],
      };

    default:
      return baseOptions;
  }
};

// Chart Preview Component
const ChartPreview = ({ chartType, data, config, theme, fullscreen, onClose }) => {
  const options = useMemo(() => 
    generateChartOptions(chartType, data, config, theme),
    [chartType, data, config, theme]
  );

  if (fullscreen) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[80vh] bg-[#11111b] border-violet-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Chart Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-[500px]">
            <ReactECharts
              option={options}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ReactECharts
      option={options}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

// Chart Studio Mode - Full editor
const ChartStudio = ({ 
  datasets, 
  chartData, 
  onSave, 
  onCancel, 
  initialChart = null,
  token,
  orgId 
}) => {
  const [activeTab, setActiveTab] = useState('data');
  const [selectedDataset, setSelectedDataset] = useState(initialChart?.dataset_id || '');
  const [chartName, setChartName] = useState(initialChart?.name || '');
  const [chartType, setChartType] = useState(initialChart?.type || 'bar');
  const [xField, setXField] = useState(initialChart?.config?.x_field || '');
  const [yField, setYField] = useState(initialChart?.config?.y_field || '');
  const [aggregation, setAggregation] = useState(initialChart?.config?.aggregation || 'count');
  const [colorTheme, setColorTheme] = useState(initialChart?.config?.theme || 'violet');
  const [showLegend, setShowLegend] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isDonut, setIsDonut] = useState(false);
  const [isSmooth, setIsSmooth] = useState(true);
  const [showArea, setShowArea] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [tierRestricted, setTierRestricted] = useState(false);
  const [tierMessage, setTierMessage] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Custom themes state
  const [customThemes, setCustomThemes] = useState([]);
  const [presetThemes, setPresetThemes] = useState([]);
  const [showThemeBuilder, setShowThemeBuilder] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [themeLimit, setThemeLimit] = useState({ limit: 3, count: 0, can_create_more: true });
  const [savingTheme, setSavingTheme] = useState(false);
  const [newTheme, setNewTheme] = useState({
    name: '',
    colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9'],
    background: '#ffffff',
    textColor: '#333333'
  });
  
  // Annotations state
  const [annotations, setAnnotations] = useState(initialChart?.config?.annotations || []);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({
    type: 'line',
    label: '',
    axis: 'y',
    value: '',
    color: '#f59e0b',
    lineStyle: 'dashed',
    xValue: '',
    yValue: '',
    startX: '',
    endX: ''
  });

  const currentDataset = datasets.find(d => d.id === selectedDataset);

  // Fetch themes on mount
  useEffect(() => {
    fetchThemes();
  }, []);

  // Auto-trigger AI suggestions when dataset is selected
  useEffect(() => {
    if (selectedDataset) {
      getAISuggestions();
    }
  }, [selectedDataset]);

  // Fetch preview data when dataset/fields change
  useEffect(() => {
    if (selectedDataset && xField) {
      fetchPreviewData();
    }
  }, [selectedDataset, xField, yField, aggregation]);

  // Fetch preset and custom themes
  const fetchThemes = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch preset themes
      const presetsRes = await axios.get(`${API_URL}/api/themes/presets`);
      setPresetThemes(presetsRes.data.themes || []);
      
      // Fetch custom themes
      const customRes = await axios.get(`${API_URL}/api/themes/custom`, { headers });
      setCustomThemes(customRes.data.themes || []);
      setThemeLimit({
        limit: customRes.data.limit,
        count: customRes.data.count,
        can_create_more: customRes.data.can_create_more
      });
    } catch (error) {
      console.error('Error fetching themes:', error);
    }
  };

  // Save custom theme
  const saveCustomTheme = async () => {
    if (!newTheme.name.trim()) {
      toast.error('Please enter a theme name');
      return;
    }
    
    setSavingTheme(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      if (editingTheme) {
        // Update existing theme
        await axios.put(
          `${API_URL}/api/themes/custom/${editingTheme.id}`,
          newTheme,
          { headers }
        );
        toast.success('Theme updated successfully!');
      } else {
        // Create new theme
        await axios.post(
          `${API_URL}/api/themes/custom`,
          newTheme,
          { headers }
        );
        toast.success('Theme created successfully!');
      }
      
      // Refresh themes
      await fetchThemes();
      setShowThemeBuilder(false);
      setEditingTheme(null);
      setNewTheme({
        name: '',
        colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9'],
        background: '#ffffff',
        textColor: '#333333'
      });
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(error.response.data.detail || 'Theme limit reached. Upgrade for more themes.');
      } else {
        toast.error('Failed to save theme');
      }
    } finally {
      setSavingTheme(false);
    }
  };

  // Delete custom theme
  const deleteCustomTheme = async (themeId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/themes/custom/${themeId}`, { headers });
      toast.success('Theme deleted');
      await fetchThemes();
    } catch (error) {
      toast.error('Failed to delete theme');
    }
  };

  // Apply custom theme to chart
  const applyCustomTheme = (theme) => {
    // Add custom theme to COLOR_THEMES dynamically
    const customThemeId = `custom_${theme.id}`;
    COLOR_THEMES[customThemeId] = theme.colors;
    setColorTheme(customThemeId);
    toast.success(`Applied "${theme.name}" theme`);
  };

  // Open theme builder for editing
  const editTheme = (theme) => {
    setEditingTheme(theme);
    setNewTheme({
      name: theme.name,
      colors: theme.colors,
      background: theme.background || '#ffffff',
      textColor: theme.textColor || '#333333'
    });
    setShowThemeBuilder(true);
  };

  // Customize a preset theme (start from preset)
  const customizePresetTheme = (presetTheme) => {
    setEditingTheme(null); // Not editing, creating new
    setNewTheme({
      name: `Custom ${presetTheme.name}`,
      colors: [...presetTheme.colors],
      background: presetTheme.background || '#ffffff',
      textColor: presetTheme.textColor || '#333333'
    });
    setShowThemeBuilder(true);
    toast.info(`Starting from "${presetTheme.name}" - customize and save as your own!`);
  };

  // Update a specific color in the theme
  const updateThemeColor = (index, color) => {
    const newColors = [...newTheme.colors];
    newColors[index] = color;
    setNewTheme({ ...newTheme, colors: newColors });
  };

  // Add a new color slot
  const addColorSlot = () => {
    if (newTheme.colors.length < 8) {
      setNewTheme({
        ...newTheme,
        colors: [...newTheme.colors, '#6b7280']
      });
    }
  };

  // Remove a color slot
  const removeColorSlot = (index) => {
    if (newTheme.colors.length > 3) {
      const newColors = newTheme.colors.filter((_, i) => i !== index);
      setNewTheme({ ...newTheme, colors: newColors });
    }
  };

  const fetchPreviewData = async () => {
    if (!selectedDataset || !xField) return;
    
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `${API_URL}/api/datasets/${selectedDataset}/data?limit=1000`,
        { headers }
      );
      
      const data = response.data.data || [];
      
      // Group and aggregate data
      const grouped = {};
      data.forEach(row => {
        const key = String(row[xField] || 'Unknown');
        if (!grouped[key]) {
          grouped[key] = { values: [], count: 0 };
        }
        grouped[key].count++;
        if (yField && row[yField] !== undefined) {
          grouped[key].values.push(Number(row[yField]) || 0);
        }
      });
      
      // Calculate aggregated values
      const chartData = Object.entries(grouped).map(([name, group]) => {
        let value;
        if (aggregation === 'count' || !yField) {
          value = group.count;
        } else if (aggregation === 'sum') {
          value = group.values.reduce((a, b) => a + b, 0);
        } else if (aggregation === 'mean') {
          value = group.values.length > 0 
            ? group.values.reduce((a, b) => a + b, 0) / group.values.length 
            : 0;
        } else if (aggregation === 'max') {
          value = Math.max(...group.values);
        } else if (aggregation === 'min') {
          value = Math.min(...group.values);
        } else {
          value = group.count;
        }
        return { name, value: Math.round(value * 100) / 100 };
      });
      
      // Sort and limit
      chartData.sort((a, b) => b.value - a.value);
      setPreviewData(chartData.slice(0, 20));
    } catch (error) {
      console.error('Error fetching preview data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get AI suggestions with tier check
  const getAISuggestions = async () => {
    if (!selectedDataset) return;
    
    setAiSuggesting(true);
    setTierRestricted(false);
    setTierMessage('');
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(
        `${API_URL}/api/ai/suggest-charts?dataset_id=${selectedDataset}`,
        {},
        { headers }
      );
      
      // Check for tier restriction
      if (response.data.tier_restricted) {
        setTierRestricted(true);
        setTierMessage(response.data.message || 'AI features require Pro or Enterprise plan');
        setSuggestions([]);
      } else {
        setSuggestions(response.data.suggestions || []);
        if (response.data.suggestions?.length > 0) {
          toast.success(`Found ${response.data.suggestions.length} chart recommendations!`);
        }
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
      // Don't show error toast for tier restrictions
      if (error.response?.status !== 403) {
        toast.error('Could not get AI suggestions');
      }
    } finally {
      setAiSuggesting(false);
    }
  };

  const applySuggestion = (suggestion) => {
    setChartName(suggestion.title);
    setChartType(suggestion.type);
    setXField(suggestion.x_field);
    setYField(suggestion.y_field || '');
    if (suggestion.aggregation) {
      setAggregation(suggestion.aggregation);
    }
    toast.success('Applied AI suggestion');
  };

  const handleSave = () => {
    if (!chartName.trim()) {
      toast.error('Please enter a chart name');
      return;
    }
    if (!selectedDataset) {
      toast.error('Please select a dataset');
      return;
    }
    if (!xField) {
      toast.error('Please select an X-axis field');
      return;
    }

    onSave({
      name: chartName,
      type: chartType,
      dataset_id: selectedDataset,
      config: {
        x_field: xField,
        y_field: yField,
        aggregation,
        theme: colorTheme,
        showLegend,
        showLabels,
        donut: isDonut,
        smooth: isSmooth,
        showArea,
        annotations,
      }
    });
  };
  
  // Add new annotation
  const handleAddAnnotation = () => {
    if (!newAnnotation.label) {
      toast.error('Please enter a label for the annotation');
      return;
    }
    
    const annotation = { ...newAnnotation, id: Date.now().toString() };
    setAnnotations([...annotations, annotation]);
    setShowAnnotationDialog(false);
    setNewAnnotation({
      type: 'line',
      label: '',
      axis: 'y',
      value: '',
      color: '#f59e0b',
      lineStyle: 'dashed',
      xValue: '',
      yValue: '',
      startX: '',
      endX: ''
    });
    toast.success('Annotation added');
  };
  
  // Delete annotation
  const handleDeleteAnnotation = (id) => {
    setAnnotations(annotations.filter(a => a.id !== id));
    toast.success('Annotation removed');
  };

  const config = {
    showLegend,
    showLabels,
    donut: isDonut,
    smooth: isSmooth,
    showArea,
    annotations,
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6" data-testid="chart-studio">
      {/* Left Panel - Configuration */}
      <div className="w-full lg:w-[380px] flex-shrink-0">
        <Card className="h-full">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Chart Configuration</CardTitle>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-140px)]">
            <div className="p-4 space-y-6">
              {/* Chart Name */}
              <div className="space-y-2">
                <Label>Chart Name *</Label>
                <Input
                  value={chartName}
                  onChange={(e) => setChartName(e.target.value)}
                  placeholder="Enter chart name..."
                  data-testid="chart-name-input"
                />
              </div>

              {/* Dataset Selection */}
              <div className="space-y-2">
                <Label>Dataset *</Label>
                <Select value={selectedDataset} onValueChange={(v) => {
                  setSelectedDataset(v);
                  setXField('');
                  setYField('');
                  setSuggestions([]);
                  setTierRestricted(false);
                }}>
                  <SelectTrigger data-testid="dataset-select">
                    <SelectValue placeholder="Select a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id}>
                        {dataset.name} ({dataset.row_count} rows)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* AI Suggestions Loading */}
              {selectedDataset && aiSuggesting && (
                <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
                  <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                  <span className="text-sm text-violet-700 dark:text-violet-300">Analyzing your data for optimal visualizations...</span>
                </div>
              )}
              
              {/* Tier Restriction Notice */}
              {tierRestricted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                      <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-800 dark:text-amber-200">AI Chart Recommendations</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{tierMessage}</p>
                      <Button 
                        size="sm" 
                        className="mt-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                        onClick={() => window.location.href = '/pricing'}
                      >
                        Upgrade to Pro
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* AI Suggestions */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      AI Recommendations
                      <Badge variant="secondary" className="ml-auto text-xs">{suggestions.length} found</Badge>
                    </Label>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {suggestions.slice(0, 5).map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => applySuggestion(suggestion)}
                          className="w-full text-left p-3 rounded-lg border border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors group"
                          data-testid={`ai-suggestion-${idx}`}
                        >
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-sm text-foreground">{suggestion.title}</p>
                            {suggestion.confidence && (
                              <Badge variant="outline" className="text-xs ml-2">
                                {Math.round(suggestion.confidence * 100)}% match
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{suggestion.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{suggestion.type}</Badge>
                            {suggestion.aggregation && (
                              <Badge variant="outline" className="text-xs">{suggestion.aggregation}</Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chart Type */}
              <div className="space-y-2">
                <Label>Chart Type</Label>
                <div className="grid grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
                  {CHART_TYPES.map((type) => (
                    <ChartTypeButton
                      key={type.value}
                      type={type.value}
                      label={type.label}
                      isSelected={chartType === type.value}
                      onClick={() => setChartType(type.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Field Selection */}
              {currentDataset && (
                <>
                  <div className="space-y-2">
                    <Label>X-Axis Field (Category) *</Label>
                    <Select value={xField} onValueChange={setXField}>
                      <SelectTrigger data-testid="x-field-select">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentDataset.columns?.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name} <span className="text-muted-foreground">({col.type})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Y-Axis Field (Value)</Label>
                    <Select 
                      value={yField || '__count__'} 
                      onValueChange={(v) => setYField(v === '__count__' ? '' : v)}
                    >
                      <SelectTrigger data-testid="y-field-select">
                        <SelectValue placeholder="Count (default)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__count__">Count (default)</SelectItem>
                        {currentDataset.columns
                          ?.filter(c => c.type.includes('int') || c.type.includes('float') || c.type === 'number')
                          .map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {yField && (
                    <div className="space-y-2">
                      <Label>Aggregation</Label>
                      <Select value={aggregation} onValueChange={setAggregation}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sum">Sum</SelectItem>
                          <SelectItem value="mean">Average</SelectItem>
                          <SelectItem value="max">Maximum</SelectItem>
                          <SelectItem value="min">Minimum</SelectItem>
                          <SelectItem value="count">Count</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {/* Style Options */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Style Options
                </Label>
                
                {/* Color Theme Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Color Theme</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTheme(null);
                        setNewTheme({
                          name: '',
                          colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9'],
                          background: '#ffffff',
                          textColor: '#333333'
                        });
                        setShowThemeBuilder(true);
                      }}
                      className="h-7 text-xs"
                      data-testid="create-theme-btn"
                    >
                      <Paintbrush className="w-3 h-3 mr-1" />
                      Create Theme
                    </Button>
                  </div>
                  
                  {/* Built-in Themes */}
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Built-in</span>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(COLOR_THEMES).filter(([name]) => !name.startsWith('custom_')).map(([name, colors]) => (
                        <button
                          key={name}
                          onClick={() => setColorTheme(name)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            colorTheme === name ? 'border-foreground scale-110 ring-2 ring-violet-500/30' : 'border-transparent hover:scale-105'
                          }`}
                          style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                          title={name.charAt(0).toUpperCase() + name.slice(1)}
                          data-testid={`theme-${name}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preset Themes from API */}
                  {presetThemes.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Professional</span>
                      <div className="flex gap-2 flex-wrap">
                        {presetThemes.slice(0, 6).map((theme) => (
                          <div key={theme.id} className="relative group">
                            <button
                              onClick={() => {
                                COLOR_THEMES[`preset_${theme.id}`] = theme.colors;
                                setColorTheme(`preset_${theme.id}`);
                              }}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                colorTheme === `preset_${theme.id}` ? 'border-foreground scale-110 ring-2 ring-violet-500/30' : 'border-transparent hover:scale-105'
                              }`}
                              style={{ background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})` }}
                              title={theme.name}
                              data-testid={`preset-theme-${theme.id}`}
                            />
                            {/* Customize button on hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                customizePresetTheme(theme);
                              }}
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title={`Customize ${theme.name}`}
                              data-testid={`customize-preset-${theme.id}`}
                            >
                              <Paintbrush className="w-2.5 h-2.5 text-white" />
                            </button>
                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {theme.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Themes */}
                  {customThemes.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-500" />
                        My Themes ({customThemes.length}/{themeLimit.limit === -1 ? '∞' : themeLimit.limit})
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        {customThemes.map((theme) => (
                          <div key={theme.id} className="relative group">
                            <button
                              onClick={() => applyCustomTheme(theme)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                colorTheme === `custom_${theme.id}` ? 'border-foreground scale-110 ring-2 ring-amber-500/30' : 'border-transparent hover:scale-105'
                              }`}
                              style={{ background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})` }}
                              title={theme.name}
                              data-testid={`custom-theme-${theme.id}`}
                            />
                            {/* Edit/Delete buttons on hover */}
                            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); editTheme(theme); }}
                                className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"
                                title="Edit"
                              >
                                <Paintbrush className="w-2.5 h-2.5 text-white" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteCustomTheme(theme.id); }}
                                className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
                                title="Delete"
                              >
                                <X className="w-2.5 h-2.5 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Theme limit notice */}
                  {!themeLimit.can_create_more && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Theme limit reached ({themeLimit.count}/{themeLimit.limit}).
                        <a href="/pricing" className="underline font-medium">Upgrade</a>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show Legend</Label>
                  <Switch checked={showLegend} onCheckedChange={setShowLegend} />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show Labels</Label>
                  <Switch checked={showLabels} onCheckedChange={setShowLabels} />
                </div>

                {chartType === 'pie' && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Donut Style</Label>
                    <Switch checked={isDonut} onCheckedChange={setIsDonut} />
                  </div>
                )}

                {(chartType === 'line' || chartType === 'area') && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Smooth Curves</Label>
                    <Switch checked={isSmooth} onCheckedChange={setIsSmooth} />
                  </div>
                )}

                {chartType === 'line' && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Show Area Fill</Label>
                    <Switch checked={showArea} onCheckedChange={setShowArea} />
                  </div>
                )}
                
                {/* Annotations Section */}
                {(chartType === 'bar' || chartType === 'line' || chartType === 'area') && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-500" />
                        Annotations
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAnnotationDialog(true)}
                        disabled={previewData.length === 0}
                        title={previewData.length === 0 ? "Configure dataset and X-axis first" : "Add annotation"}
                        data-testid="add-annotation-btn"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    {annotations.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        {previewData.length === 0 
                          ? "Select a dataset and X-axis field to enable annotations"
                          : "No annotations yet. Add reference lines, labels, or highlight regions."
                        }
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[150px] overflow-y-auto">
                        {annotations.map((ann) => (
                          <div
                            key={ann.id}
                            className="flex items-center justify-between p-2 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: ann.color }}
                              />
                              <div>
                                <p className="text-xs font-medium">{ann.label}</p>
                                <p className="text-[10px] text-muted-foreground capitalize">
                                  {ann.type} {ann.type === 'line' && `(${ann.axis === 'y' ? 'horizontal' : 'vertical'})`}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDeleteAnnotation(ann.id)}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Annotation Dialog */}
          <Dialog open={showAnnotationDialog} onOpenChange={setShowAnnotationDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-500" />
                  Add Annotation
                </DialogTitle>
                <DialogDescription>
                  Add reference lines, text labels, or highlight regions to your chart
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Annotation Type */}
                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ANNOTATION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setNewAnnotation({ ...newAnnotation, type: type.value })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                          newAnnotation.type === type.value
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-border hover:border-amber-300'
                        }`}
                      >
                        <type.icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Label */}
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={newAnnotation.label}
                    onChange={(e) => setNewAnnotation({ ...newAnnotation, label: e.target.value })}
                    placeholder="e.g., Target, Peak Sales, Promotion Period"
                    data-testid="annotation-label-input"
                  />
                </div>
                
                {/* Reference Line Options */}
                {newAnnotation.type === 'line' && (
                  <>
                    <div className="space-y-2">
                      <Label>Orientation</Label>
                      <Select
                        value={newAnnotation.axis}
                        onValueChange={(v) => setNewAnnotation({ ...newAnnotation, axis: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="y">Horizontal (at Y value)</SelectItem>
                          <SelectItem value="x">Vertical (at X category)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{newAnnotation.axis === 'y' ? 'Y Value' : 'X Category'}</Label>
                      <Input
                        value={newAnnotation.value}
                        onChange={(e) => setNewAnnotation({ ...newAnnotation, value: newAnnotation.axis === 'y' ? Number(e.target.value) : e.target.value })}
                        placeholder={newAnnotation.axis === 'y' ? 'e.g., 1000' : 'e.g., Category Name'}
                        type={newAnnotation.axis === 'y' ? 'number' : 'text'}
                        data-testid="annotation-value-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Line Style</Label>
                      <Select
                        value={newAnnotation.lineStyle}
                        onValueChange={(v) => setNewAnnotation({ ...newAnnotation, lineStyle: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="dashed">Dashed</SelectItem>
                          <SelectItem value="dotted">Dotted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                
                {/* Text Label Options */}
                {newAnnotation.type === 'text' && (
                  <>
                    <div className="space-y-2">
                      <Label>X Category</Label>
                      {previewData.length === 0 ? (
                        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Configure the chart data first (select dataset and X-axis field)
                          </p>
                        </div>
                      ) : (
                        <Select
                          value={newAnnotation.xValue}
                          onValueChange={(v) => setNewAnnotation({ ...newAnnotation, xValue: v })}
                        >
                          <SelectTrigger data-testid="annotation-x-category-select">
                            <SelectValue placeholder="Select data point" />
                          </SelectTrigger>
                          <SelectContent>
                            {previewData.map((d) => (
                              <SelectItem key={d.name} value={d.name}>
                                {d.name} ({d.value})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </>
                )}
                
                {/* Region Options */}
                {newAnnotation.type === 'region' && (
                  <>
                    {previewData.length === 0 ? (
                      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                        <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Configure the chart data first (select dataset and X-axis field)
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Start X</Label>
                          <Select
                            value={newAnnotation.startX}
                            onValueChange={(v) => setNewAnnotation({ ...newAnnotation, startX: v })}
                          >
                            <SelectTrigger data-testid="annotation-start-x-select">
                              <SelectValue placeholder="Start" />
                            </SelectTrigger>
                            <SelectContent>
                              {previewData.map((d) => (
                                <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>End X</Label>
                          <Select
                            value={newAnnotation.endX}
                            onValueChange={(v) => setNewAnnotation({ ...newAnnotation, endX: v })}
                          >
                            <SelectTrigger data-testid="annotation-end-x-select">
                              <SelectValue placeholder="End" />
                            </SelectTrigger>
                            <SelectContent>
                              {previewData.map((d) => (
                                <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Color Picker */}
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newAnnotation.color}
                      onChange={(e) => setNewAnnotation({ ...newAnnotation, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={newAnnotation.color}
                      onChange={(e) => setNewAnnotation({ ...newAnnotation, color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAnnotationDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAnnotation}
                  className="bg-amber-500 hover:bg-amber-600"
                  data-testid="save-annotation-btn"
                >
                  Add Annotation
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Theme Builder Dialog */}
          <Dialog open={showThemeBuilder} onOpenChange={setShowThemeBuilder}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Paintbrush className="w-5 h-5 text-violet-500" />
                  {editingTheme ? 'Edit Theme' : 'Create Custom Theme'}
                </DialogTitle>
                <DialogDescription>
                  Design your own color palette for charts
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Theme Name */}
                <div className="space-y-2">
                  <Label>Theme Name</Label>
                  <Input
                    value={newTheme.name}
                    onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                    placeholder="My Custom Theme"
                    data-testid="theme-name-input"
                  />
                </div>

                {/* Color Palette */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Color Palette ({newTheme.colors.length}/8)</Label>
                    {newTheme.colors.length < 8 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addColorSlot}
                        className="h-7"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Color
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {newTheme.colors.map((color, index) => (
                      <div key={index} className="relative group">
                        <div className="flex flex-col items-center gap-1">
                          <div className="relative">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => updateThemeColor(index, e.target.value)}
                              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-700 hover:border-violet-500 transition-colors"
                              data-testid={`theme-color-${index}`}
                            />
                            {newTheme.colors.length > 3 && (
                              <button
                                onClick={() => removeColorSlot(index)}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove color"
                              >
                                <X className="w-2.5 h-2.5 text-white" />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{color}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <div className="flex items-center gap-2 mb-3">
                      {newTheme.colors.map((color, i) => (
                        <div
                          key={i}
                          className="flex-1 h-8 rounded-md shadow-sm first:rounded-l-lg last:rounded-r-lg"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {newTheme.colors.slice(0, 5).map((color, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-md overflow-hidden"
                        >
                          <div
                            className="h-16"
                            style={{ 
                              backgroundColor: color,
                              opacity: 1 - (i * 0.1)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Theme Limit Info */}
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    {themeLimit.limit === -1 
                      ? 'Unlimited themes (Enterprise)' 
                      : `${themeLimit.count}/${themeLimit.limit} themes used`}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowThemeBuilder(false);
                  setEditingTheme(null);
                }}>
                  Cancel
                </Button>
                <Button
                  onClick={saveCustomTheme}
                  disabled={savingTheme || !newTheme.name.trim()}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  data-testid="save-theme-btn"
                >
                  {savingTheme ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingTheme ? 'Update Theme' : 'Save Theme'}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Save Button */}
          <div className="p-4 border-t">
            <Button
              onClick={handleSave}
              className="w-full bg-violet-600 hover:bg-violet-700"
              disabled={!chartName || !selectedDataset || !xField}
              data-testid="save-chart-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Chart
            </Button>
          </div>
        </Card>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 min-h-[400px] lg:min-h-0">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-600" />
                Live Preview
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFullscreen(true)}
                  disabled={previewData.length === 0}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 min-h-[300px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
              </div>
            ) : previewData.length > 0 ? (
              <ChartPreview
                chartType={chartType}
                data={previewData}
                config={config}
                theme={colorTheme}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-2">No Preview Available</h3>
                <p className="text-sm text-muted-foreground max-w-[300px]">
                  Select a dataset and configure the X-axis field to see a live preview of your chart
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen Preview */}
      {fullscreen && (
        <ChartPreview
          chartType={chartType}
          data={previewData}
          config={config}
          theme={colorTheme}
          fullscreen={true}
          onClose={() => setFullscreen(false)}
        />
      )}
    </div>
  );
};

// Main Charts Page Component
export function ChartsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentOrg } = useOrgStore();
  const { token } = useAuthStore();
  const [charts, setCharts] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [viewChart, setViewChart] = useState(null);
  const [chartViewData, setChartViewData] = useState([]);
  const [drillDownData, setDrillDownData] = useState(null);
  const [drillBreadcrumb, setDrillBreadcrumb] = useState([]);
  const [drillOptions, setDrillOptions] = useState([]);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Check if we're in studio mode (creating new chart)
  const isStudioMode = location.pathname === '/charts/new';

  useEffect(() => {
    fetchData();
  }, [currentOrg]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const orgParam = currentOrg?.id ? `?org_id=${currentOrg.id}` : '';
      
      const [chartsRes, datasetsRes] = await Promise.all([
        axios.get(`${API_URL}/api/charts${orgParam}`, { headers }),
        axios.get(`${API_URL}/api/datasets${orgParam}`, { headers })
      ]);
      
      setCharts(chartsRes.data.charts || []);
      setDatasets(datasetsRes.data.datasets || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (chartData) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/api/charts`, {
        ...chartData,
        org_id: currentOrg?.id
      }, { headers });
      
      toast.success('Chart created successfully');
      navigate('/charts');
      fetchData();
    } catch (error) {
      toast.error('Failed to create chart');
    }
  };

  const handleDelete = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/charts/${id}`, { headers });
      toast.success('Chart deleted');
      setDeleteDialog(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete chart');
    }
  };

  const handleViewChart = async (chart) => {
    setViewChart(chart);
    setDrillDownData(null);
    setDrillBreadcrumb([]);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [dataRes, optionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/charts/${chart.id}/data`, { headers }),
        axios.get(`${API_URL}/api/charts/${chart.id}/drill-options`, { headers })
      ]);
      setChartViewData(dataRes.data.data || []);
      setDrillOptions(optionsRes.data.drill_options || []);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartViewData([]);
      setDrillOptions([]);
    }
  };

  const handleDrillDown = async (filterField, filterValue) => {
    if (!viewChart) return;
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API_URL}/api/charts/${viewChart.id}/drill-down`, {
        chart_id: viewChart.id,
        filter_field: filterField,
        filter_value: filterValue
      }, { headers });
      
      setDrillDownData(response.data);
      setChartViewData(response.data.data || []);
      setDrillBreadcrumb(prev => [...prev, { field: filterField, value: filterValue }]);
      setDrillOptions(response.data.drill_options || []);
      toast.success(`Filtered by ${filterField}: ${filterValue}`);
    } catch (error) {
      toast.error('Failed to drill down');
    }
  };

  const resetDrillDown = () => {
    setDrillDownData(null);
    setDrillBreadcrumb([]);
    if (viewChart) {
      handleViewChart(viewChart);
    }
  };

  const handleExportPdf = async (chartIds = null) => {
    setExportingPdf(true);
    toast.info('Generating PDF report...');
    
    try {
      const chartsToExport = chartIds 
        ? charts.filter(c => chartIds.includes(c.id))
        : charts;
      
      if (chartsToExport.length === 0) {
        toast.error('No charts to export');
        setExportingPdf(false);
        return;
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Clean DV Logo SVG
      const logoSvg = `
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#8b5cf6"/>
          <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">DV</text>
        </svg>
      `;

      // Render HTML to canvas
      const renderTemplate = async (htmlContent, width = 794, height = 1123) => {
        const container = document.createElement('div');
        container.innerHTML = htmlContent;
        container.style.cssText = `position: absolute; left: -9999px; width: ${width}px; height: ${height}px;`;
        document.body.appendChild(container);
        await new Promise(r => setTimeout(r, 200));
        const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        document.body.removeChild(container);
        return canvas;
      };

      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

      // Pre-render all chart images with data
      const chartImages = [];
      for (const chart of chartsToExport) {
        try {
          const headers = { Authorization: `Bearer ${token}` };
          const dataRes = await axios.get(`${API_URL}/api/charts/${chart.id}/data`, { headers });
          const chartData = dataRes.data.data || [];

          if (chartData.length > 0) {
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = 'position: absolute; left: -9999px; width: 320px; height: 200px; background: #ffffff;';
            document.body.appendChild(tempContainer);

            const options = generateChartOptions(chart.type, chartData, chart.config || {}, chart.config?.theme || 'violet');
            options.backgroundColor = '#ffffff';

            const echarts = await import('echarts');
            const chartInstance = echarts.init(tempContainer);
            chartInstance.setOption(options);
            await new Promise(r => setTimeout(r, 400));

            const imgData = chartInstance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' });
            chartImages.push({ name: chart.name, type: chart.type, image: imgData, data: chartData });

            chartInstance.dispose();
            document.body.removeChild(tempContainer);
          } else {
            chartImages.push({ name: chart.name, type: chart.type, image: null, data: [] });
          }
        } catch (e) {
          chartImages.push({ name: chart.name, type: chart.type, image: null, data: [] });
        }
      }

      // Calculate pages
      const chartsPerPage = 6;
      const chartPages = Math.ceil(chartImages.length / chartsPerPage);
      const totalPages = 1 + chartPages + 1; // Cover + chart pages + data summary

      // Common styles
      const baseStyles = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        </style>
      `;

      // Footer HTML
      const footerHtml = (pageNum) => `
        <div style="position: absolute; bottom: 30px; left: 50px; right: 50px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 24px; height: 24px; background: #8b5cf6; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 10px; font-weight: 700;">DV</span>
            </div>
            <span style="font-size: 12px; color: #64748b; font-weight: 500;">DataViz Studio</span>
          </div>
          <span style="font-size: 11px; color: #94a3b8;">Page ${pageNum} of ${totalPages}</span>
        </div>
      `;

      // Chart card generator
      const chartCard = (chart, size = 'normal') => {
        const height = size === 'large' ? '180px' : '140px';
        return `
          <div style="width: calc(50% - 10px); background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="padding: 10px 14px; background: #fafafa; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 600; color: #1e293b;">${chart.name}</span>
              <span style="font-size: 9px; color: #8b5cf6; background: #f3f0ff; padding: 3px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase;">${chart.type}</span>
            </div>
            <div style="height: ${height}; display: flex; align-items: center; justify-content: center; padding: 8px; background: #fff;">
              ${chart.image ? `<img src="${chart.image}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` : `<span style="color: #94a3b8; font-size: 11px;">No data</span>`}
            </div>
          </div>
        `;
      };

      // ===== PAGE 1: COVER =====
      const coverHtml = `
        <div style="width: 794px; height: 1123px; background: #fff; position: relative;">
          ${baseStyles}
          
          <!-- Header -->
          <div style="margin: 40px 50px 0; padding: 20px 24px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 10px; border-left: 4px solid #8b5cf6;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <div style="width: 28px; height: 28px; background: #8b5cf6; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 11px; font-weight: 700;">DV</span>
              </div>
              <span style="font-size: 22px; font-weight: 700; color: #0f172a;">DataViz Studio</span>
              <span style="font-size: 16px; font-weight: 500; color: #475569; margin-left: 4px;">Chart Report</span>
            </div>
            <div style="display: flex; gap: 24px; font-size: 12px; color: #64748b; margin-top: 8px;">
              <span>Charts: <strong style="color: #8b5cf6;">${chartsToExport.length}</strong></span>
              <span>${dateStr}</span>
            </div>
          </div>
          
          <!-- Chart List -->
          <div style="margin: 20px 50px; padding: 16px 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 10px;">Charts in this report:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${chartsToExport.map(c => `
                <span style="font-size: 11px; color: #475569; background: #f1f5f9; padding: 4px 10px; border-radius: 4px;">${c.name} <span style="color: #94a3b8;">(${c.type})</span></span>
              `).join('')}
            </div>
          </div>
          
          <!-- Charts Grid -->
          <div style="margin: 0 50px; display: flex; flex-wrap: wrap; gap: 16px;">
            ${chartImages.slice(0, 6).map(chart => chartCard(chart)).join('')}
          </div>
          
          ${footerHtml(1)}
        </div>
      `;

      const coverCanvas = await renderTemplate(coverHtml);
      pdf.addImage(coverCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);

      // ===== CHART PAGES =====
      const remainingCharts = chartImages.slice(6);
      for (let pageIdx = 0; pageIdx < Math.ceil(remainingCharts.length / chartsPerPage); pageIdx++) {
        pdf.addPage();
        const pageCharts = remainingCharts.slice(pageIdx * chartsPerPage, (pageIdx + 1) * chartsPerPage);
        const currentPage = pageIdx + 2;

        const pageHtml = `
          <div style="width: 794px; height: 1123px; background: #fff; position: relative;">
            ${baseStyles}
            
            <!-- Header -->
            <div style="margin: 35px 50px 20px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #8b5cf6;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 24px; height: 24px; background: #8b5cf6; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 10px; font-weight: 700;">DV</span>
                </div>
                <span style="font-size: 16px; font-weight: 600; color: #334155;">Charts (continued)</span>
              </div>
              <span style="font-size: 11px; color: #94a3b8;">${dateStr}</span>
            </div>
            
            <!-- Charts Grid -->
            <div style="margin: 0 50px; display: flex; flex-wrap: wrap; gap: 16px;">
              ${pageCharts.map(chart => chartCard(chart, 'large')).join('')}
            </div>
            
            ${footerHtml(currentPage)}
          </div>
        `;

        const pageCanvas = await renderTemplate(pageHtml);
        pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);
      }

      // ===== DATA SUMMARY PAGE =====
      pdf.addPage();
      
      // Build data rows for summary table
      const dataRows = chartImages.filter(c => c.data.length > 0).map(chart => {
        const total = chart.data.reduce((sum, d) => sum + (d.value || 0), 0);
        const max = Math.max(...chart.data.map(d => d.value || 0));
        const min = Math.min(...chart.data.map(d => d.value || 0));
        const avg = (total / chart.data.length).toFixed(0);
        return { name: chart.name, type: chart.type, items: chart.data.length, total, max, min, avg };
      });

      const summaryHtml = `
        <div style="width: 794px; height: 1123px; background: #fff; position: relative;">
          ${baseStyles}
          
          <!-- Header -->
          <div style="margin: 35px 50px 25px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #8b5cf6;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 24px; height: 24px; background: #8b5cf6; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 10px; font-weight: 700;">DV</span>
              </div>
              <span style="font-size: 16px; font-weight: 600; color: #334155;">Data Summary</span>
            </div>
            <span style="font-size: 11px; color: #94a3b8;">${dateStr}</span>
          </div>
          
          <!-- Summary Table -->
          <div style="margin: 0 50px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background: #8b5cf6; color: white;">
                  <th style="padding: 12px 14px; text-align: left; font-weight: 600;">Chart Name</th>
                  <th style="padding: 12px 14px; text-align: left; font-weight: 600;">Type</th>
                  <th style="padding: 12px 14px; text-align: right; font-weight: 600;">Items</th>
                  <th style="padding: 12px 14px; text-align: right; font-weight: 600;">Total</th>
                  <th style="padding: 12px 14px; text-align: right; font-weight: 600;">Max</th>
                  <th style="padding: 12px 14px; text-align: right; font-weight: 600;">Min</th>
                  <th style="padding: 12px 14px; text-align: right; font-weight: 600;">Avg</th>
                </tr>
              </thead>
              <tbody>
                ${dataRows.map((row, idx) => `
                  <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 14px; font-weight: 500; color: #1e293b;">${row.name}</td>
                    <td style="padding: 10px 14px; color: #64748b;">
                      <span style="background: #f3f0ff; color: #8b5cf6; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase;">${row.type}</span>
                    </td>
                    <td style="padding: 10px 14px; text-align: right; color: #475569;">${row.items}</td>
                    <td style="padding: 10px 14px; text-align: right; color: #1e293b; font-weight: 600;">${row.total.toLocaleString()}</td>
                    <td style="padding: 10px 14px; text-align: right; color: #10b981;">${row.max.toLocaleString()}</td>
                    <td style="padding: 10px 14px; text-align: right; color: #f59e0b;">${row.min.toLocaleString()}</td>
                    <td style="padding: 10px 14px; text-align: right; color: #6366f1;">${Number(row.avg).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <!-- Overall Stats -->
            <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 10px; border: 1px solid #e2e8f0;">
              <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 16px;">Overall Statistics</div>
              <div style="display: flex; gap: 30px;">
                <div>
                  <div style="font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Total Charts</div>
                  <div style="font-size: 24px; font-weight: 700; color: #8b5cf6;">${chartImages.length}</div>
                </div>
                <div>
                  <div style="font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Total Data Points</div>
                  <div style="font-size: 24px; font-weight: 700; color: #0f172a;">${dataRows.reduce((sum, r) => sum + r.items, 0)}</div>
                </div>
                <div>
                  <div style="font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Grand Total</div>
                  <div style="font-size: 24px; font-weight: 700; color: #10b981;">${dataRows.reduce((sum, r) => sum + r.total, 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
          
          ${footerHtml(totalPages)}
        </div>
      `;

      const summaryCanvas = await renderTemplate(summaryHtml);
      pdf.addImage(summaryCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);

      // Download
      pdf.save(`DataViz_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF report exported!');

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const getChartIcon = (type) => {
    const chartType = CHART_TYPES.find(t => t.value === type);
    return chartType?.icon || BarChart3;
  };

  const filteredCharts = charts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Studio Mode
  if (isStudioMode) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-140px)]">
          <ChartStudio
            datasets={datasets}
            chartData={null}
            onSave={handleCreate}
            onCancel={() => navigate('/charts')}
            token={token}
            orgId={currentOrg?.id}
          />
        </div>
      </DashboardLayout>
    );
  }

  // List Mode
  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="charts-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chart Studio</h1>
            <p className="text-muted-foreground mt-1">
              Create powerful visualizations with AI-powered suggestions
            </p>
          </div>
          <div className="flex gap-2">
            {charts.length > 0 && (
              <Button
                variant="outline"
                onClick={() => handleExportPdf()}
                disabled={exportingPdf}
                data-testid="export-all-pdf-btn"
              >
                {exportingPdf ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                Export All to PDF
              </Button>
            )}
            <Button
              onClick={() => navigate('/charts/new')}
              className="bg-violet-600 hover:bg-violet-700"
              disabled={datasets.length === 0}
              data-testid="create-chart-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Chart
            </Button>
          </div>
        </div>

        {datasets.length === 0 && !loading && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">No datasets available</p>
                <p className="text-sm text-muted-foreground">
                  <button onClick={() => navigate('/upload')} className="text-violet-600 hover:underline">
                    Upload data
                  </button> first to create charts
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        {charts.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search charts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-charts-input"
            />
          </div>
        )}

        {/* Charts Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <CardContent className="p-4">
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCharts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharts.map((chart, index) => {
              const Icon = getChartIcon(chart.type);
              return (
                <motion.div
                  key={chart.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="overflow-hidden hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all group cursor-pointer"
                    onClick={() => handleViewChart(chart)}
                    data-testid={`chart-card-${chart.id}`}
                  >
                    {/* Chart Preview */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 relative">
                      <Icon className="w-16 h-16 text-violet-400/30" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <Badge 
                        className="absolute top-3 right-3 bg-violet-600/90"
                      >
                        {chart.type}
                      </Badge>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{chart.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {chart.config?.x_field && `${chart.config.x_field}`}
                            {chart.config?.y_field && ` vs ${chart.config.y_field}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog(chart);
                          }}
                          data-testid={`delete-chart-${chart.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No charts yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first chart to visualize your data with our AI-powered Chart Studio
              </p>
              <Button
                onClick={() => navigate('/charts/new')}
                className="bg-violet-600 hover:bg-violet-700"
                disabled={datasets.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Chart
              </Button>
            </CardContent>
          </Card>
        )}

        {/* View Chart Dialog with Drill-Down */}
        <Dialog open={!!viewChart} onOpenChange={() => {
          setViewChart(null);
          setDrillDownData(null);
          setDrillBreadcrumb([]);
        }}>
          <DialogContent className="max-w-5xl h-[85vh] bg-[#11111b] border-violet-500/20">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-white">
                    {viewChart && React.createElement(getChartIcon(viewChart.type), { className: 'w-5 h-5 text-violet-400' })}
                    {viewChart?.name}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {viewChart?.config?.x_field && `X: ${viewChart.config.x_field}`}
                    {viewChart?.config?.y_field && ` | Y: ${viewChart.config.y_field}`}
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPdf([viewChart?.id])}
                    disabled={exportingPdf}
                    className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200"
                  >
                    {exportingPdf ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span className="ml-2">Export PDF</span>
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            {/* Drill-down breadcrumb */}
            {drillBreadcrumb.length > 0 && (
              <div className="flex items-center gap-2 py-2 px-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <button 
                  onClick={resetDrillDown}
                  className="text-sm text-violet-400 hover:text-violet-300 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Reset
                </button>
                <ChevronRight className="w-4 h-4 text-gray-500" />
                {drillBreadcrumb.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                      {crumb.field}: {crumb.value}
                    </Badge>
                    {idx < drillBreadcrumb.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </React.Fragment>
                ))}
                {drillDownData?.total_rows && (
                  <span className="text-xs text-gray-400 ml-auto">
                    {drillDownData.total_rows} rows
                  </span>
                )}
              </div>
            )}

            <div className="flex-1 min-h-[350px] rounded-lg overflow-hidden">
              {viewChart && (
                <ChartPreview
                  chartType={viewChart.type}
                  data={chartViewData}
                  config={viewChart.config || {}}
                  theme={viewChart.config?.theme || 'violet'}
                />
              )}
            </div>

            {/* Drill-down options */}
            {drillOptions.length > 0 && (
              <div className="border-t border-gray-700/50 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <ZoomIn className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-gray-200">Click to Drill Down</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {drillOptions.map((option) => (
                    <div key={option.field} className="flex flex-col gap-1">
                      <span className="text-xs text-gray-400">{option.field}</span>
                      <div className="flex flex-wrap gap-1">
                        {option.values?.slice(0, 5).map((value) => (
                          <Button
                            key={value}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-gray-600 text-gray-300 hover:bg-violet-500/10 hover:text-violet-300 hover:border-violet-500/50"
                            onClick={() => handleDrillDown(option.field, value)}
                          >
                            <Filter className="w-3 h-3 mr-1" />
                            {String(value).substring(0, 15)}
                          </Button>
                        ))}
                        {option.values?.length > 5 && (
                          <Badge variant="secondary" className="h-7 bg-gray-700/50 text-gray-300">
                            +{option.values.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Chart</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteDialog?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteDialog?.id)}
                data-testid="confirm-delete-btn"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default ChartsPage;
