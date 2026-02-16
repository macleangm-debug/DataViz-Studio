/**
 * =============================================================================
 * REUSABLE WIDGET RESIZING - USAGE EXAMPLES
 * =============================================================================
 * 
 * This file demonstrates multiple ways to use the resizable functionality:
 * 1. Using the useResizable hook directly (most flexible)
 * 2. Using the ResizableContainer component (quickest setup)
 * 3. Custom implementation patterns
 */

import React, { useState } from 'react';
import { useResizable } from '../hooks/useResizable';
import ResizableContainer, { DEFAULT_WIDTH_OPTIONS } from '../components/ui/ResizableContainer';

// =============================================================================
// EXAMPLE 1: Using the Hook Directly (Most Flexible)
// =============================================================================

export const HookExample = () => {
  const {
    width,
    setWidth,
    isDragging,
    displayWidth,
    dragHandleProps,
    elementRef,
  } = useResizable({
    initialWidth: 50,
    minWidth: 25,
    maxWidth: 100,
    snapPoints: [25, 50, 75, 100],
    onResize: (newWidth) => console.log('Widget resized to:', newWidth),
  });

  // Calculate CSS width
  const getWidthStyle = () => {
    if (displayWidth === 100) return '100%';
    return `calc(${displayWidth}% - 8px)`;
  };

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {/* Resizable Widget */}
      <div
        ref={elementRef}
        className={`
          relative bg-white rounded-lg border-2 p-4
          ${isDragging ? 'border-blue-400 shadow-lg' : 'border-gray-200'}
        `}
        style={{
          width: getWidthStyle(),
          transition: isDragging ? 'none' : 'width 0.2s ease',
        }}
      >
        {/* Widget Header with Controls */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">My Widget</h3>
          <div className="flex items-center gap-2">
            {/* Width Badge */}
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
              {displayWidth}%
            </span>
            {/* Width Dropdown */}
            <select
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="text-xs border rounded px-2 py-1"
            >
              {DEFAULT_WIDTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Widget Content */}
        <div className="h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded flex items-center justify-center">
          <p className="text-gray-600">Widget Content</p>
        </div>

        {/* Drag Handle (only show when not full width) */}
        {width !== 100 && (
          <div
            {...dragHandleProps}
            className={`
              absolute right-0 top-0 bottom-0 w-3
              flex items-center justify-center
              hover:bg-blue-50 cursor-ew-resize
              ${isDragging ? 'bg-blue-100' : ''}
            `}
            style={{ transform: 'translateX(50%)' }}
          >
            <div className={`w-1 h-10 rounded-full ${isDragging ? 'bg-blue-500' : 'bg-gray-300'}`} />
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// EXAMPLE 2: Using ResizableContainer Component (Quickest)
// =============================================================================

export const ComponentExample = () => {
  const [sections, setSections] = useState([
    { id: 1, title: 'Sales Chart', width: 50 },
    { id: 2, title: 'Revenue Table', width: 50 },
    { id: 3, title: 'KPI Summary', width: 100 },
  ]);

  const handleResize = (id, newWidth) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, width: newWidth } : s
    ));
  };

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {sections.map(section => (
        <ResizableContainer
          key={section.id}
          initialWidth={section.width}
          onResize={(width) => handleResize(section.id, width)}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{section.title}</h3>
              <ResizableContainer.WidthBadge width={section.width} />
            </div>
            <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
              Content for {section.title}
            </div>
          </div>
        </ResizableContainer>
      ))}
    </div>
  );
};

// =============================================================================
// EXAMPLE 3: Dashboard Grid with Resizable Widgets
// =============================================================================

export const DashboardGridExample = () => {
  const [widgets, setWidgets] = useState([
    { id: 'chart1', type: 'bar', title: 'Monthly Sales', width: 50 },
    { id: 'chart2', type: 'pie', title: 'Category Split', width: 50 },
    { id: 'stat1', type: 'stat', title: 'Total Revenue', width: 25 },
    { id: 'stat2', type: 'stat', title: 'Orders', width: 25 },
    { id: 'stat3', type: 'stat', title: 'Customers', width: 25 },
    { id: 'stat4', type: 'stat', title: 'Avg Order', width: 25 },
    { id: 'table1', type: 'table', title: 'Recent Orders', width: 100 },
  ]);

  const updateWidgetWidth = (id, width) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, width } : w));
  };

  const renderWidgetContent = (widget) => {
    switch (widget.type) {
      case 'bar':
        return <div className="h-40 bg-gradient-to-t from-blue-200 to-blue-50 rounded" />;
      case 'pie':
        return <div className="h-40 bg-gradient-to-br from-purple-200 to-purple-50 rounded" />;
      case 'stat':
        return (
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-gray-800">$12,345</div>
            <div className="text-sm text-green-600">+12.5%</div>
          </div>
        );
      case 'table':
        return (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-gray-50 rounded" />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="flex flex-wrap gap-4">
        {widgets.map(widget => (
          <ResizableWidget
            key={widget.id}
            widget={widget}
            onResize={(width) => updateWidgetWidth(widget.id, width)}
          >
            {renderWidgetContent(widget)}
          </ResizableWidget>
        ))}
      </div>
    </div>
  );
};

// Reusable ResizableWidget for the dashboard
const ResizableWidget = ({ widget, onResize, children }) => {
  const {
    width,
    setWidth,
    isDragging,
    displayWidth,
    dragHandleProps,
    elementRef,
  } = useResizable({
    initialWidth: widget.width,
    onResize,
  });

  const getWidthStyle = () => {
    const w = displayWidth;
    if (w === 100) return '100%';
    if (w === 75) return 'calc(75% - 8px)';
    if (w === 50) return 'calc(50% - 8px)';
    if (w === 25) return 'calc(25% - 12px)';
    return `${w}%`;
  };

  return (
    <div
      ref={elementRef}
      className={`
        relative bg-white rounded-xl shadow-sm border
        transition-shadow
        ${isDragging ? 'border-blue-400 shadow-lg z-50' : 'border-gray-200'}
      `}
      style={{ width: getWidthStyle() }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium text-gray-800">{widget.title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
            {displayWidth}%
          </span>
          <select
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
            className="text-xs border border-gray-200 rounded px-1.5 py-0.5"
          >
            <option value={25}>25%</option>
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>

      {/* Drag Handle */}
      {width !== 100 && (
        <div
          {...dragHandleProps}
          className={`
            absolute right-0 top-0 bottom-0 w-3
            flex items-center justify-center group
            ${isDragging ? 'bg-blue-50' : 'hover:bg-gray-50'}
          `}
          style={{ transform: 'translateX(50%)' }}
        >
          <div className={`
            w-1 h-12 rounded-full transition-colors
            ${isDragging ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-blue-400'}
          `} />
        </div>
      )}

      {/* Drag Preview */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
          {displayWidth}%
        </div>
      )}
    </div>
  );
};

// =============================================================================
// EXAMPLE 4: Minimal Implementation (Copy-Paste Ready)
// =============================================================================

export const MinimalExample = () => {
  const [width, setWidth] = useState(50);
  
  return (
    <ResizableContainer
      initialWidth={width}
      onResize={setWidth}
      className="bg-white border rounded-lg p-4"
    >
      <p>Resizable content - Current width: {width}%</p>
    </ResizableContainer>
  );
};

// =============================================================================
// HOOK API REFERENCE
// =============================================================================

/**
 * useResizable Hook Options:
 * 
 * @param {number} initialWidth - Starting width percentage (default: 100)
 * @param {number} minWidth - Minimum width percentage (default: 25)
 * @param {number} maxWidth - Maximum width percentage (default: 100)
 * @param {number[]} snapPoints - Width values to snap to (default: [25, 50, 75, 100])
 * @param {function} onResize - Callback when resize completes
 * @param {React.RefObject} containerRef - Optional ref to parent for width calculations
 * 
 * @returns {Object}
 *   - width: Current width value
 *   - setWidth: Function to set width programmatically
 *   - isDragging: Boolean indicating active drag
 *   - previewWidth: Width being previewed during drag
 *   - displayWidth: Current visual width (preview or actual)
 *   - dragHandleProps: Props to spread on drag handle element
 *   - elementRef: Ref to attach to resizable element
 */

export default {
  HookExample,
  ComponentExample,
  DashboardGridExample,
  MinimalExample,
};
