import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, Download, Settings, Eye, Palette, GripVertical, Plus, Trash2, 
  Type, BarChart3, Table, ChevronDown, Check, Maximize2, Minimize2, 
  PieChart, TrendingUp, LineChart, LayoutGrid, Move, ArrowUp, ArrowDown,
  RefreshCw, Percent, Hash, Users, DollarSign, ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../layouts/DashboardLayout';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Color themes matching the infographic style
const THEMES = [
  { id: 'blue_coral', name: 'Blue & Coral', primary: '#3B82F6', accent: '#EF4444', secondary: '#60A5FA', light: '#DBEAFE' },
  { id: 'purple_teal', name: 'Purple & Teal', primary: '#8B5CF6', accent: '#14B8A6', secondary: '#A78BFA', light: '#EDE9FE' },
  { id: 'green_orange', name: 'Green & Orange', primary: '#10B981', accent: '#F59E0B', secondary: '#34D399', light: '#D1FAE5' },
  { id: 'slate_amber', name: 'Slate & Amber', primary: '#475569', accent: '#F59E0B', secondary: '#64748B', light: '#F1F5F9' },
  { id: 'indigo_rose', name: 'Indigo & Rose', primary: '#6366F1', accent: '#F43F5E', secondary: '#818CF8', light: '#E0E7FF' },
  { id: 'cyan_pink', name: 'Cyan & Pink', primary: '#06B6D4', accent: '#EC4899', secondary: '#22D3EE', light: '#CFFAFE' },
];

// Section types for the report
const SECTION_TYPES = [
  { id: 'stat_cards', name: 'Stat Cards', icon: LayoutGrid, description: 'Key metrics with icons' },
  { id: 'intro', name: 'Introduction', icon: Type, description: 'Text section' },
  { id: 'bar_chart', name: 'Bar Chart', icon: BarChart3, description: 'Vertical bars' },
  { id: 'pie_chart', name: 'Pie Chart', icon: PieChart, description: 'Circular chart' },
  { id: 'line_chart', name: 'Line Chart', icon: TrendingUp, description: 'Trend lines' },
  { id: 'data_table', name: 'Data Table', icon: Table, description: 'Tabular data' },
  { id: 'conclusion', name: 'Conclusion', icon: FileText, description: 'Summary text' },
];

// Stat icons for infographic cards
const STAT_ICONS = [
  { id: 'percent', icon: Percent, name: 'Percentage' },
  { id: 'users', icon: Users, name: 'Users' },
  { id: 'dollar', icon: DollarSign, name: 'Revenue' },
  { id: 'cart', icon: ShoppingCart, name: 'Sales' },
  { id: 'trending', icon: TrendingUp, name: 'Growth' },
  { id: 'hash', icon: Hash, name: 'Count' },
];

// Sample data for charts preview
const SAMPLE_BAR_DATA = [
  { name: 'Q1', value: 65 },
  { name: 'Q2', value: 85 },
  { name: 'Q3', value: 45 },
  { name: 'Q4', value: 75 },
  { name: 'Q5', value: 55 },
];

// ========================================
// COMPONENTS
// ========================================

// Infographic Stat Card
const StatCard = ({ stat, theme, isPreview, onUpdate, index }) => {
  const IconComponent = STAT_ICONS.find(s => s.id === stat.iconType)?.icon || Percent;
  const isAccent = index % 2 === 1;
  const bgColor = isAccent ? theme.accent : theme.primary;
  
  return (
    <div 
      className="rounded-xl p-4 text-white relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
      data-testid={`stat-card-${index}`}
    >
      {/* Background decoration */}
      <div 
        className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20"
        style={{ backgroundColor: 'white', transform: 'translate(30%, -30%)' }}
      />
      
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
        <IconComponent size={18} className="text-white" />
      </div>
      
      {/* Value */}
      {!isPreview ? (
        <input
          type="text"
          value={stat.value}
          onChange={(e) => onUpdate(index, { ...stat, value: e.target.value })}
          className="text-2xl font-bold bg-transparent border-none outline-none w-full text-white placeholder-white/50"
          placeholder="44%"
          data-testid={`stat-value-${index}`}
        />
      ) : (
        <div className="text-2xl font-bold">{stat.value || '44%'}</div>
      )}
      
      {/* Label */}
      {!isPreview ? (
        <input
          type="text"
          value={stat.label}
          onChange={(e) => onUpdate(index, { ...stat, label: e.target.value })}
          className="text-xs opacity-90 bg-transparent border-none outline-none w-full text-white placeholder-white/50"
          placeholder="Description text"
          data-testid={`stat-label-${index}`}
        />
      ) : (
        <div className="text-xs opacity-90">{stat.label || 'Description text'}</div>
      )}
    </div>
  );
};

// Bar Chart Component (SVG preview)
const BarChartPreview = ({ theme, data = SAMPLE_BAR_DATA }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="h-40 flex items-end justify-center gap-3 p-4">
      {data.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div 
            className="w-10 rounded-t transition-all duration-300"
            style={{ 
              height: `${(item.value / maxValue) * 100}px`,
              backgroundColor: i % 2 === 0 ? theme.primary : theme.accent 
            }}
          />
          <span className="text-xs text-gray-500">{item.name}</span>
        </div>
      ))}
    </div>
  );
};

// Pie Chart Component (SVG preview)
const PieChartPreview = ({ theme }) => {
  return (
    <div className="h-40 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        {/* Primary slice - 60% */}
        <circle
          cx="50" cy="50" r="40"
          fill="transparent"
          stroke={theme.primary}
          strokeWidth="20"
          strokeDasharray="150.8 251.33"
          transform="rotate(-90 50 50)"
        />
        {/* Accent slice - 25% */}
        <circle
          cx="50" cy="50" r="40"
          fill="transparent"
          stroke={theme.accent}
          strokeWidth="20"
          strokeDasharray="62.83 251.33"
          strokeDashoffset="-150.8"
          transform="rotate(-90 50 50)"
        />
        {/* Secondary slice - 15% */}
        <circle
          cx="50" cy="50" r="40"
          fill="transparent"
          stroke={theme.secondary}
          strokeWidth="20"
          strokeDasharray="37.7 251.33"
          strokeDashoffset="-213.63"
          transform="rotate(-90 50 50)"
        />
      </svg>
    </div>
  );
};

// Line Chart Component (SVG preview)
const LineChartPreview = ({ theme }) => {
  const points = [10, 40, 30, 60, 45, 70, 55];
  const width = 200;
  const height = 100;
  const padding = 10;
  
  const maxVal = Math.max(...points);
  const pointsStr = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - 2 * padding);
    const y = height - padding - (p / maxVal) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="h-40 flex items-center justify-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        <polyline
          fill="none"
          stroke={theme.primary}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsStr}
        />
        {points.map((p, i) => {
          const x = padding + (i / (points.length - 1)) * (width - 2 * padding);
          const y = height - padding - (p / maxVal) * (height - 2 * padding);
          return (
            <circle key={i} cx={x} cy={y} r="4" fill={theme.accent} />
          );
        })}
      </svg>
    </div>
  );
};

// Data Table Preview
const DataTablePreview = ({ theme }) => {
  const tableData = [
    { category: 'North Region', value: '245,000', share: '32%' },
    { category: 'South Region', value: '189,000', share: '24%' },
    { category: 'East Region', value: '156,000', share: '21%' },
    { category: 'West Region', value: '178,000', share: '23%' },
  ];
  
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div 
        className="grid grid-cols-3 text-xs font-semibold text-white"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="p-2 border-r border-white/20">Category</div>
        <div className="p-2 border-r border-white/20 text-right">Value</div>
        <div className="p-2 text-right">Share</div>
      </div>
      {tableData.map((row, i) => (
        <div 
          key={i} 
          className={`grid grid-cols-3 text-xs ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
        >
          <div className="p-2 border-r border-gray-100 text-gray-700">{row.category}</div>
          <div className="p-2 border-r border-gray-100 text-right text-gray-600">{row.value}</div>
          <div className="p-2 text-right font-semibold" style={{ color: theme.accent }}>{row.share}</div>
        </div>
      ))}
    </div>
  );
};

// Report Section Component
const ReportSection = ({ section, index, theme, isPreview, onUpdate, onDelete, onMoveUp, onMoveDown, totalSections }) => {
  const renderContent = () => {
    switch (section.type) {
      case 'stat_cards':
        return (
          <div className="grid grid-cols-4 gap-3">
            {(section.stats || [
              { value: '44%', label: 'Mercury is the closest planet to the Sun', iconType: 'percent' },
              { value: '32%', label: 'Despite being red, Mars is a cold place', iconType: 'trending' },
              { value: '21%', label: 'Neptune is the farthest planet from the Sun', iconType: 'users' },
              { value: '72%', label: 'Jupiter is the biggest planet of them all', iconType: 'cart' },
            ]).map((stat, i) => (
              <StatCard 
                key={i} 
                stat={stat} 
                theme={theme} 
                isPreview={isPreview}
                onUpdate={(idx, newStat) => {
                  const newStats = [...(section.stats || [])];
                  newStats[idx] = newStat;
                  onUpdate(index, { ...section, stats: newStats });
                }}
                index={i}
              />
            ))}
          </div>
        );
      
      case 'intro':
      case 'conclusion':
        return (
          <div className="p-4">
            {!isPreview ? (
              <textarea
                value={section.content || ''}
                onChange={(e) => onUpdate(index, { ...section, content: e.target.value })}
                placeholder={section.type === 'intro' 
                  ? 'Enter your introduction text here. Describe the purpose and scope of this report...'
                  : 'Enter your conclusion text here. Summarize the key findings and recommendations...'
                }
                className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid={`section-content-${index}`}
              />
            ) : (
              <p className="text-gray-700 text-sm leading-relaxed">
                {section.content || (section.type === 'intro' 
                  ? 'This report provides a comprehensive analysis of the data collected...'
                  : 'In conclusion, the analysis reveals significant insights that can guide strategic decisions...'
                )}
              </p>
            )}
          </div>
        );
      
      case 'bar_chart':
        return (
          <div className="p-4">
            <BarChartPreview theme={theme} />
            {!isPreview && (
              <input
                type="text"
                value={section.chartTitle || ''}
                onChange={(e) => onUpdate(index, { ...section, chartTitle: e.target.value })}
                placeholder="Chart title (optional)"
                className="w-full mt-2 p-2 border border-gray-200 rounded text-xs text-center"
                data-testid={`chart-title-${index}`}
              />
            )}
          </div>
        );
      
      case 'pie_chart':
        return (
          <div className="p-4">
            <PieChartPreview theme={theme} />
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.primary }} />
                <span>Primary (60%)</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.accent }} />
                <span>Secondary (25%)</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.secondary }} />
                <span>Other (15%)</span>
              </div>
            </div>
          </div>
        );
      
      case 'line_chart':
        return (
          <div className="p-4">
            <LineChartPreview theme={theme} />
          </div>
        );
      
      case 'data_table':
        return (
          <div className="p-4">
            <DataTablePreview theme={theme} />
          </div>
        );
      
      default:
        return <div className="p-4 text-gray-400 text-center">Unknown section type</div>;
    }
  };
  
  const sectionInfo = SECTION_TYPES.find(t => t.id === section.type) || {};
  const Icon = sectionInfo.icon || FileText;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-xl border-2 ${isPreview ? 'border-gray-100' : 'border-gray-200 hover:border-blue-300'} overflow-hidden transition-colors`}
      style={{ width: section.width === 50 ? '48%' : '100%' }}
      data-testid={`report-section-${index}`}
    >
      {/* Section Header */}
      <div 
        className="px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: theme.light }}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: theme.primary }} />
          {!isPreview ? (
            <input
              type="text"
              value={section.title || sectionInfo.name}
              onChange={(e) => onUpdate(index, { ...section, title: e.target.value })}
              className="font-medium text-sm bg-transparent border-none outline-none"
              style={{ color: theme.primary }}
              data-testid={`section-title-${index}`}
            />
          ) : (
            <span className="font-medium text-sm" style={{ color: theme.primary }}>
              {section.title || sectionInfo.name}
            </span>
          )}
        </div>
        
        {!isPreview && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="p-1 rounded hover:bg-white/50 disabled:opacity-30 disabled:cursor-not-allowed"
              data-testid={`move-up-${index}`}
            >
              <ArrowUp size={14} className="text-gray-500" />
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={index === totalSections - 1}
              className="p-1 rounded hover:bg-white/50 disabled:opacity-30 disabled:cursor-not-allowed"
              data-testid={`move-down-${index}`}
            >
              <ArrowDown size={14} className="text-gray-500" />
            </button>
            <button
              onClick={() => onDelete(index)}
              className="p-1 rounded hover:bg-red-100"
              data-testid={`delete-section-${index}`}
            >
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>
        )}
      </div>
      
      {/* Section Content */}
      {renderContent()}
    </motion.div>
  );
};

// Theme Selector Dropdown with Custom Color Picker
const ThemeSelector = ({ selectedTheme, onSelect, customColors, onCustomColorsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempColors, setTempColors] = useState(customColors || { primary: '#3B82F6', accent: '#EF4444' });
  
  const isCustom = selectedTheme === 'custom';
  const theme = isCustom 
    ? { id: 'custom', name: 'Custom', ...customColors, secondary: customColors?.primary + '99', light: customColors?.primary + '20' }
    : (THEMES.find(t => t.id === selectedTheme) || THEMES[0]);
  
  const handleApplyCustom = () => {
    onCustomColorsChange(tempColors);
    onSelect('custom');
    setShowCustomPicker(false);
    setIsOpen(false);
  };
  
  // Generate lighter shade for secondary/light colors
  const getLighterShade = (hex, opacity) => {
    return hex + Math.round(opacity * 255).toString(16).padStart(2, '0');
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        data-testid="theme-selector"
      >
        <Palette size={16} className="text-gray-500" />
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.primary }} />
          <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.accent }} />
        </div>
        <span className="text-sm font-medium">{theme.name}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-1 w-72 bg-white border rounded-lg shadow-xl z-20 overflow-hidden"
          >
            {/* Preset Themes */}
            <div className="p-2 border-b">
              <p className="text-xs font-medium text-gray-500 px-2 mb-1">Preset Themes</p>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelect(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                    selectedTheme === t.id ? 'bg-blue-50' : ''
                  }`}
                  data-testid={`theme-option-${t.id}`}
                >
                  <div className="flex gap-1">
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: t.primary }} />
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: t.accent }} />
                  </div>
                  <span className="text-sm flex-1 text-left">{t.name}</span>
                  {selectedTheme === t.id && <Check size={16} className="text-blue-500" />}
                </button>
              ))}
            </div>
            
            {/* Custom Theme Section */}
            <div className="p-3">
              <button
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                  isCustom ? 'bg-blue-50' : ''
                }`}
                data-testid="custom-theme-btn"
              >
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded border-2 border-dashed border-gray-300" style={{ backgroundColor: customColors?.primary || '#3B82F6' }} />
                  <div className="w-5 h-5 rounded border-2 border-dashed border-gray-300" style={{ backgroundColor: customColors?.accent || '#EF4444' }} />
                </div>
                <span className="text-sm flex-1 text-left">Custom Colors</span>
                {isCustom && <Check size={16} className="text-blue-500" />}
              </button>
              
              {/* Color Picker Panel */}
              <AnimatePresence>
                {showCustomPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="space-y-3">
                      {/* Primary Color */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Primary Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={tempColors.primary}
                            onChange={(e) => setTempColors({ ...tempColors, primary: e.target.value })}
                            className="w-10 h-10 rounded cursor-pointer border-0"
                            data-testid="primary-color-picker"
                          />
                          <input
                            type="text"
                            value={tempColors.primary}
                            onChange={(e) => setTempColors({ ...tempColors, primary: e.target.value })}
                            className="flex-1 px-2 py-1.5 text-sm border rounded font-mono"
                            placeholder="#3B82F6"
                            data-testid="primary-color-input"
                          />
                        </div>
                      </div>
                      
                      {/* Accent Color */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Accent Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={tempColors.accent}
                            onChange={(e) => setTempColors({ ...tempColors, accent: e.target.value })}
                            className="w-10 h-10 rounded cursor-pointer border-0"
                            data-testid="accent-color-picker"
                          />
                          <input
                            type="text"
                            value={tempColors.accent}
                            onChange={(e) => setTempColors({ ...tempColors, accent: e.target.value })}
                            className="flex-1 px-2 py-1.5 text-sm border rounded font-mono"
                            placeholder="#EF4444"
                            data-testid="accent-color-input"
                          />
                        </div>
                      </div>
                      
                      {/* Preview */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Preview</label>
                        <div className="flex gap-2">
                          <div 
                            className="flex-1 h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: tempColors.primary }}
                          >
                            Primary
                          </div>
                          <div 
                            className="flex-1 h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: tempColors.accent }}
                          >
                            Accent
                          </div>
                        </div>
                      </div>
                      
                      {/* Apply Button */}
                      <button
                        onClick={handleApplyCustom}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        data-testid="apply-custom-theme-btn"
                      >
                        Apply Custom Theme
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Add Section Panel
const AddSectionPanel = ({ onAdd, theme }) => {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-4">
      <p className="text-sm font-medium text-gray-500 mb-3 text-center">Add Section</p>
      <div className="grid grid-cols-4 gap-2">
        {SECTION_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => onAdd(type.id)}
              className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-blue-300 transition-all group"
              data-testid={`add-${type.id}-btn`}
            >
              <Icon size={20} className="text-gray-400 group-hover:text-blue-500" />
              <span className="text-xs text-gray-600 group-hover:text-blue-600">{type.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

const ReportBuilderPage = () => {
  // Report configuration state
  const [reportConfig, setReportConfig] = useState({
    title: 'Survey Results Infographics',
    subtitle: 'Comprehensive Analysis Report',
    companyName: '',
    theme: 'blue_coral',
    reportDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  });
  
  // Sections state
  const [sections, setSections] = useState([
    { 
      id: 'sec_1', 
      type: 'stat_cards', 
      title: 'Key Metrics',
      width: 100,
      stats: [
        { value: '44%', label: 'Mercury is the closest planet to the Sun', iconType: 'percent' },
        { value: '32%', label: 'Despite being red, Mars is a cold place', iconType: 'trending' },
        { value: '21%', label: 'Neptune is the farthest planet from the Sun', iconType: 'users' },
        { value: '72%', label: 'Jupiter is the biggest planet of them all', iconType: 'cart' },
      ]
    },
    { id: 'sec_2', type: 'bar_chart', title: 'Revenue by Quarter', width: 50 },
    { id: 'sec_3', type: 'data_table', title: 'Regional Breakdown', width: 50 },
    { id: 'sec_4', type: 'intro', title: 'Introduction', content: '', width: 100 },
    { id: 'sec_5', type: 'pie_chart', title: 'Market Share', width: 50 },
    { id: 'sec_6', type: 'line_chart', title: 'Growth Trend', width: 50 },
    { id: 'sec_7', type: 'conclusion', title: 'Conclusions', content: '', width: 100 },
  ]);
  
  // UI state
  const [isPreview, setIsPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [customColors, setCustomColors] = useState({ primary: '#3B82F6', accent: '#EF4444' });
  
  // Helper to generate lighter shade
  const getLighterHex = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lighter = (c) => Math.round(c + (255 - c) * (1 - opacity));
    return `#${lighter(r).toString(16).padStart(2, '0')}${lighter(g).toString(16).padStart(2, '0')}${lighter(b).toString(16).padStart(2, '0')}`;
  };
  
  // Get current theme (supports custom colors)
  const theme = reportConfig.theme === 'custom' 
    ? { 
        id: 'custom', 
        name: 'Custom', 
        primary: customColors.primary, 
        accent: customColors.accent,
        secondary: getLighterHex(customColors.primary, 0.7),
        light: getLighterHex(customColors.primary, 0.15)
      }
    : (THEMES.find(t => t.id === reportConfig.theme) || THEMES[0]);
  
  // Section management functions
  const handleUpdateSection = (index, updatedSection) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
  };
  
  const handleDeleteSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };
  
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    setSections(newSections);
  };
  
  const handleMoveDown = (index) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setSections(newSections);
  };
  
  const handleAddSection = (type) => {
    const sectionInfo = SECTION_TYPES.find(t => t.id === type);
    const newSection = {
      id: `sec_${Date.now()}`,
      type,
      title: sectionInfo?.name || 'New Section',
      width: ['bar_chart', 'pie_chart', 'line_chart', 'data_table'].includes(type) ? 50 : 100,
      content: '',
      stats: type === 'stat_cards' ? [
        { value: '25%', label: 'Enter description', iconType: 'percent' },
        { value: '50%', label: 'Enter description', iconType: 'trending' },
        { value: '75%', label: 'Enter description', iconType: 'users' },
        { value: '100%', label: 'Enter description', iconType: 'cart' },
      ] : undefined,
    };
    setSections([...sections, newSection]);
  };
  
  // Toggle section width
  const handleToggleWidth = (index) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      width: newSections[index].width === 100 ? 50 : 100
    };
    setSections(newSections);
  };
  
  // Reference for the report canvas
  const reportCanvasRef = useRef(null);
  
  // Export PDF using client-side generation
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Get the report canvas element
      const reportElement = reportCanvasRef.current;
      if (!reportElement) {
        toast.error('Report canvas not found');
        setIsExporting(false);
        return;
      }
      
      // Temporarily switch to preview mode for clean export
      const wasInEditMode = !isPreview;
      if (wasInEditMode) {
        setIsPreview(true);
        // Wait for state to update and re-render
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Use html2canvas to capture the report
      const canvas = await html2canvas(reportElement, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
      });
      
      // Create PDF with A4 dimensions
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit the canvas
      const canvasAspect = canvas.width / canvas.height;
      const pageAspect = pdfWidth / pdfHeight;
      
      let imgWidth, imgHeight;
      
      if (canvasAspect > pageAspect) {
        // Canvas is wider - fit to width
        imgWidth = pdfWidth - 20; // 10mm margins
        imgHeight = imgWidth / canvasAspect;
      } else {
        // Canvas is taller - may need multiple pages
        imgWidth = pdfWidth - 20;
        imgHeight = imgWidth / canvasAspect;
      }
      
      // If content is taller than one page, scale to fit
      if (imgHeight > pdfHeight - 20) {
        const scaleFactor = (pdfHeight - 20) / imgHeight;
        imgHeight = pdfHeight - 20;
        imgWidth = imgWidth * scaleFactor;
      }
      
      // Center horizontally
      const xOffset = (pdfWidth - imgWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, 10, imgWidth, imgHeight);
      
      // Generate filename
      const fileName = `${reportConfig.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Download the PDF
      pdf.save(fileName);
      
      // Restore edit mode if needed
      if (wasInEditMode) {
        setIsPreview(false);
      }
      
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50" data-testid="report-builder-page">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>
              <p className="text-gray-500 text-sm">Design professional infographic-style reports</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSelector
                selectedTheme={reportConfig.theme}
                onSelect={(t) => setReportConfig({ ...reportConfig, theme: t })}
                customColors={customColors}
                onCustomColorsChange={setCustomColors}
              />
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-100 text-blue-600' : 'bg-white border hover:bg-gray-50'}`}
                data-testid="settings-btn"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isPreview ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'
                }`}
                data-testid="preview-btn"
              >
                <Eye size={18} />
                <span className="font-medium">{isPreview ? 'Edit Mode' : 'Preview'}</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-md"
                data-testid="export-btn"
              >
                {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                <span className="font-medium">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl border shadow-sm mb-6 overflow-hidden"
                data-testid="settings-panel"
              >
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Report Header Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                      <input
                        type="text"
                        value={reportConfig.title}
                        onChange={(e) => setReportConfig({ ...reportConfig, title: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter report title"
                        data-testid="report-title-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={reportConfig.subtitle}
                        onChange={(e) => setReportConfig({ ...reportConfig, subtitle: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter subtitle"
                        data-testid="report-subtitle-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (Optional)</label>
                      <input
                        type="text"
                        value={reportConfig.companyName}
                        onChange={(e) => setReportConfig({ ...reportConfig, companyName: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your company name"
                        data-testid="company-name-input"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Report Preview Canvas */}
          <div 
            ref={reportCanvasRef}
            className="bg-white rounded-2xl border-2 shadow-lg overflow-hidden"
            style={{ borderColor: theme.primary + '30' }}
            data-testid="report-canvas"
          >
            {/* Report Header */}
            <div 
              className="p-6 text-white relative overflow-hidden"
              style={{ backgroundColor: theme.primary }}
            >
              {/* Decorative elements */}
              <div 
                className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
                style={{ backgroundColor: 'white', transform: 'translate(30%, -50%)' }}
              />
              <div 
                className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
                style={{ backgroundColor: 'white', transform: 'translate(-30%, 50%)' }}
              />
              
              <div className="relative z-10 text-center">
                <h2 className="text-3xl font-bold mb-2">{reportConfig.title || 'Report Title'}</h2>
                <p className="text-lg opacity-90">{reportConfig.subtitle || 'Report Subtitle'}</p>
                {reportConfig.companyName && (
                  <p className="text-sm opacity-75 mt-2">{reportConfig.companyName}</p>
                )}
              </div>
            </div>
            
            {/* Report Body */}
            <div className="p-6">
              <div className="flex flex-wrap gap-4">
                <AnimatePresence>
                  {sections.map((section, index) => (
                    <ReportSection
                      key={section.id}
                      section={section}
                      index={index}
                      theme={theme}
                      isPreview={isPreview}
                      onUpdate={handleUpdateSection}
                      onDelete={handleDeleteSection}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      totalSections={sections.length}
                    />
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Add Section Panel (only in edit mode) */}
              {!isPreview && (
                <div className="mt-6">
                  <AddSectionPanel onAdd={handleAddSection} theme={theme} />
                </div>
              )}
              
              {sections.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Plus size={48} className="mb-3" />
                  <p className="text-lg">Add sections to build your report</p>
                  <p className="text-sm">Click on a section type above to get started</p>
                </div>
              )}
            </div>
            
            {/* Report Footer */}
            <div 
              className="px-6 py-4 flex items-center justify-center gap-3 text-white"
              style={{ backgroundColor: theme.primary }}
            >
              {/* DataViz Studio Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <PieChart size={18} className="text-white" />
                </div>
                <span className="font-bold text-lg">DataViz Studio</span>
              </div>
            </div>
          </div>
          
          {/* Help Text */}
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>
              <strong>Tips:</strong> Use arrow buttons to reorder sections • 
              Charts default to 50% width for side-by-side layout • 
              Click Preview to see final result
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportBuilderPage;
