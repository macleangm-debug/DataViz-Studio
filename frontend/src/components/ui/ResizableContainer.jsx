/**
 * ResizableContainer - Reusable resizable container component
 * 
 * A wrapper component that provides drag-to-resize functionality.
 * Can be used for widgets, panels, cards, or any resizable UI element.
 * 
 * Usage:
 *   <ResizableContainer
 *     initialWidth={50}
 *     onResize={(width) => console.log('New width:', width)}
 *     showBadge={true}
 *     showDropdown={true}
 *   >
 *     <YourContent />
 *   </ResizableContainer>
 */

import React from 'react';
import { useResizable } from '../hooks/useResizable';

// Default width options
export const DEFAULT_WIDTH_OPTIONS = [
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
];

// Drag Handle Component
const DragHandle = ({ isDragging, dragHandleProps }) => (
  <div
    {...dragHandleProps}
    className={`
      absolute right-0 top-0 bottom-0 w-4 
      flex items-center justify-center z-10
      transition-all duration-150 group
      ${isDragging ? 'bg-blue-500/10' : 'hover:bg-blue-50'}
    `}
    style={{ 
      ...dragHandleProps.style,
      transform: 'translateX(50%)'
    }}
  >
    <div className={`
      flex flex-col items-center gap-0.5 
      transition-opacity
      ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
    `}>
      <div className={`w-1 h-8 rounded-full ${isDragging ? 'bg-blue-500' : 'bg-gray-400'}`} />
    </div>
  </div>
);

// Width Badge Component
const WidthBadge = ({ width, className = '' }) => (
  <span 
    className={`text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium ${className}`}
    data-testid="width-badge"
  >
    {width}%
  </span>
);

// Width Dropdown Component
const WidthDropdown = ({ value, onChange, options = DEFAULT_WIDTH_OPTIONS, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange(parseInt(e.target.value, 10))}
    className={`
      px-2 py-1 text-xs border border-gray-200 rounded 
      bg-white hover:bg-gray-50 cursor-pointer 
      focus:outline-none focus:ring-1 focus:ring-blue-500
      ${className}
    `}
    data-testid="width-dropdown"
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

// Preview Indicator Component
const PreviewIndicator = ({ width }) => (
  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg z-50">
    {width}%
  </div>
);

// Main ResizableContainer Component
export const ResizableContainer = ({
  children,
  initialWidth = 100,
  minWidth = 25,
  maxWidth = 100,
  snapPoints = [25, 50, 75, 100],
  widthOptions = DEFAULT_WIDTH_OPTIONS,
  onResize,
  showDragHandle = true,
  showBadge = true,
  showDropdown = true,
  showPreviewIndicator = true,
  disabled = false,
  className = '',
  style = {},
  'data-testid': testId = 'resizable-container',
}) => {
  const {
    width,
    setWidth,
    isDragging,
    previewWidth,
    displayWidth,
    dragHandleProps,
    elementRef,
  } = useResizable({
    initialWidth,
    minWidth,
    maxWidth,
    snapPoints,
    onResize,
  });

  // Calculate width style
  const getWidthStyle = () => {
    const w = displayWidth;
    if (w === 100) return '100%';
    if (w === 75) return 'calc(75% - 8px)';
    if (w === 50) return 'calc(50% - 8px)';
    if (w === 25) return 'calc(25% - 12px)';
    return `${w}%`;
  };

  const showHandle = showDragHandle && !disabled && width !== 100;

  return (
    <div
      ref={elementRef}
      className={`
        relative overflow-visible transition-all
        ${isDragging ? 'ring-2 ring-blue-200 shadow-lg' : ''}
        ${className}
      `}
      style={{
        width: getWidthStyle(),
        zIndex: isDragging ? 50 : 1,
        userSelect: isDragging ? 'none' : 'auto',
        ...style,
      }}
      data-testid={testId}
    >
      {/* Drag Handle */}
      {showHandle && (
        <DragHandle isDragging={isDragging} dragHandleProps={dragHandleProps} />
      )}

      {/* Preview Indicator */}
      {showPreviewIndicator && isDragging && previewWidth !== null && (
        <PreviewIndicator width={previewWidth} />
      )}

      {/* Content with controls */}
      {children}

      {/* Render badge and dropdown if slots provided */}
    </div>
  );
};

// Export sub-components for flexible composition
ResizableContainer.DragHandle = DragHandle;
ResizableContainer.WidthBadge = WidthBadge;
ResizableContainer.WidthDropdown = WidthDropdown;
ResizableContainer.PreviewIndicator = PreviewIndicator;

export default ResizableContainer;
