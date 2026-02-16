import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  FileText, Trash2, ArrowUp, ArrowDown, 
  Type, BarChart3, Table, PieChart, TrendingUp, LayoutGrid,
  Maximize2, Minimize2, GripVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard, { STAT_ICONS } from './StatCard';
import { BarChartPreview, PieChartPreview, LineChartPreview, DataTablePreview } from './ChartPreviews';

// Section types for the report
export const SECTION_TYPES = [
  { id: 'stat_cards', name: 'Stat Cards', icon: LayoutGrid, description: 'Key metrics with icons' },
  { id: 'intro', name: 'Introduction', icon: Type, description: 'Text section' },
  { id: 'bar_chart', name: 'Bar Chart', icon: BarChart3, description: 'Vertical bars' },
  { id: 'pie_chart', name: 'Pie Chart', icon: PieChart, description: 'Circular chart' },
  { id: 'line_chart', name: 'Line Chart', icon: TrendingUp, description: 'Trend lines' },
  { id: 'data_table', name: 'Data Table', icon: Table, description: 'Tabular data' },
  { id: 'text_block', name: 'Text/Notes', icon: FileText, description: 'Add custom notes anywhere' },
  { id: 'conclusion', name: 'Conclusion', icon: FileText, description: 'Summary text' },
];

// Width options for resizing
export const WIDTH_OPTIONS = [
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
];

// Snap threshold for width values (pixels tolerance)
const SNAP_THRESHOLD = 30;

// Helper to snap width to nearest option
const snapToWidth = (percentWidth) => {
  const options = [25, 50, 75, 100];
  let closest = options[0];
  let minDiff = Math.abs(percentWidth - options[0]);
  
  for (const opt of options) {
    const diff = Math.abs(percentWidth - opt);
    if (diff < minDiff) {
      minDiff = diff;
      closest = opt;
    }
  }
  
  return closest;
};

// Drag Handle Component
const DragHandle = ({ onDrag, isActive }) => {
  return (
    <div
      className={`absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center
        transition-all duration-150 group hover:w-4 
        ${isActive ? 'bg-blue-500/20 w-4' : 'bg-transparent hover:bg-blue-100/50'}`}
      style={{ transform: 'translateX(50%)' }}
      data-testid="drag-handle"
    >
      <div className={`h-12 w-1 rounded-full transition-colors ${isActive ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-blue-400'}`} />
    </div>
  );
};

const ReportSection = ({ 
  section, 
  index, 
  theme, 
  isPreview, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  onResizeWidth,
  totalSections,
  containerWidth 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const [previewWidth, setPreviewWidth] = useState(null);
  const sectionRef = useRef(null);
  
  // Handle drag start
  const handleDragStart = useCallback((e) => {
    if (isPreview) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX || e.touches?.[0]?.clientX || 0);
    setDragStartWidth(section.width || 100);
    setPreviewWidth(section.width || 100);
    
    // Add global listeners - these will be set up in the useEffect below
  }, [isPreview, section.width]);
  
  // Handle drag movement
  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const parentWidth = sectionRef.current?.parentElement?.offsetWidth || 800;
    const deltaX = clientX - dragStartX;
    const deltaPercent = (deltaX / parentWidth) * 100;
    
    let newWidth = Math.round(dragStartWidth + deltaPercent);
    newWidth = Math.max(25, Math.min(100, newWidth));
    
    // Show preview width
    setPreviewWidth(snapToWidth(newWidth));
  }, [isDragging, dragStartX, dragStartWidth]);
  
  // Handle drag end
  const handleDragEnd = useCallback((onResizeWidthFn, idx, currentWidth, pWidth, dragMoveFn) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Snap to final width
    if (pWidth !== null && pWidth !== currentWidth) {
      onResizeWidthFn(idx, pWidth);
    }
    
    setPreviewWidth(null);
  }, [isDragging]);
  
  // Effect to handle drag state
  useEffect(() => {
    if (!isDragging) return;
    
    const moveHandler = (e) => handleDragMove(e);
    const endHandler = () => {
      handleDragEnd(onResizeWidth, index, section.width, previewWidth, handleDragMove);
      // Remove listeners
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('touchend', endHandler);
    
    return () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
    };
  }, [isDragging, handleDragMove, handleDragEnd, onResizeWidth, index, section.width, previewWidth]);
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);
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
      case 'text_block':
        return (
          <div className="p-4">
            {!isPreview ? (
              <>
                {section.type === 'text_block' && (
                  <input
                    type="text"
                    value={section.title || 'Notes'}
                    onChange={(e) => onUpdate(index, { ...section, title: e.target.value })}
                    className="w-full mb-2 p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Section title..."
                    data-testid={`section-title-input-${index}`}
                  />
                )}
                <textarea
                  value={section.content || ''}
                  onChange={(e) => onUpdate(index, { ...section, content: e.target.value })}
                  placeholder={
                    section.type === 'intro' 
                      ? 'Enter your introduction text here. Describe the purpose and scope of this report...'
                      : section.type === 'conclusion'
                      ? 'Enter your conclusion text here. Summarize the key findings and recommendations...'
                      : 'Add your notes, observations, or comments here...'
                  }
                  className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid={`section-content-${index}`}
                />
              </>
            ) : (
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {section.content || (
                  section.type === 'intro' 
                    ? 'This report provides a comprehensive analysis of the data collected...'
                    : section.type === 'conclusion'
                    ? 'In conclusion, the analysis reveals significant insights that can guide strategic decisions...'
                    : 'Notes and observations...'
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
  
  // Calculate actual width style - use preview width when dragging
  const getWidthStyle = () => {
    const width = isDragging && previewWidth !== null ? previewWidth : (section.width || 100);
    if (width === 100) return '100%';
    if (width === 75) return 'calc(75% - 8px)';
    if (width === 50) return 'calc(50% - 8px)';
    if (width === 25) return 'calc(25% - 12px)';
    return '100%';
  };
  
  // Get display width for indicator
  const displayWidth = isDragging && previewWidth !== null ? previewWidth : (section.width || 100);
  
  return (
    <motion.div
      ref={sectionRef}
      layout={!isDragging}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-xl border-2 relative ${
        isPreview 
          ? 'border-gray-100' 
          : isDragging 
            ? 'border-blue-400 shadow-lg ring-2 ring-blue-200' 
            : 'border-gray-200 hover:border-blue-300'
      } overflow-visible transition-colors`}
      style={{ 
        width: getWidthStyle(),
        zIndex: isDragging ? 50 : 1,
        userSelect: isDragging ? 'none' : 'auto'
      }}
      data-testid={`report-section-${index}`}
    >
      {/* Drag Handle - Right Edge (only in edit mode) */}
      {!isPreview && section.width !== 100 && (
        <div
          className={`absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center z-10
            transition-all duration-150 group
            ${isDragging ? 'bg-blue-500/10' : 'hover:bg-blue-50'}`}
          style={{ transform: 'translateX(50%)' }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          data-testid={`drag-handle-${index}`}
        >
          <div className={`flex flex-col items-center gap-0.5 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <div className={`w-1 h-8 rounded-full ${isDragging ? 'bg-blue-500' : 'bg-gray-400'}`} />
          </div>
        </div>
      )}
      
      {/* Width Preview Indicator */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg z-50">
          {previewWidth}%
        </div>
      )}
      
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
          
          {/* Width badge in edit mode */}
          {!isPreview && (
            <span 
              className="text-xs px-1.5 py-0.5 rounded bg-white/60 text-gray-500 font-medium"
              data-testid={`width-badge-${index}`}
            >
              {displayWidth}%
            </span>
          )}
        </div>
        
        {!isPreview && (
          <div className="flex items-center gap-1">
            {/* Width selector dropdown */}
            <select
              value={section.width || 100}
              onChange={(e) => onResizeWidth(index, parseInt(e.target.value))}
              className="px-2 py-1 text-xs border border-gray-200 rounded bg-white hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
              data-testid={`resize-width-${index}`}
            >
              {WIDTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
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

export default ReportSection;
