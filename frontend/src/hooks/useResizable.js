/**
 * useResizable Hook - Reusable drag-to-resize functionality
 * 
 * Usage:
 *   const { width, isDragging, dragHandleProps, previewWidth } = useResizable({
 *     initialWidth: 50,
 *     minWidth: 25,
 *     maxWidth: 100,
 *     snapPoints: [25, 50, 75, 100],
 *     onResize: (newWidth) => console.log('Resized to:', newWidth)
 *   });
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// Snap to nearest value in array
const snapToNearest = (value, snapPoints) => {
  if (!snapPoints || snapPoints.length === 0) return value;
  
  return snapPoints.reduce((closest, point) => {
    return Math.abs(point - value) < Math.abs(closest - value) ? point : closest;
  }, snapPoints[0]);
};

export const useResizable = ({
  initialWidth = 100,
  minWidth = 25,
  maxWidth = 100,
  snapPoints = [25, 50, 75, 100],
  onResize,
  containerRef = null, // Optional ref to parent container
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, width: 0 });
  const elementRef = useRef(null);

  // Get container width for percentage calculations
  const getContainerWidth = useCallback(() => {
    if (containerRef?.current) {
      return containerRef.current.offsetWidth;
    }
    if (elementRef.current?.parentElement) {
      return elementRef.current.parentElement.offsetWidth;
    }
    return 800; // Fallback
  }, [containerRef]);

  // Start dragging
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    
    setIsDragging(true);
    setDragStart({ x: clientX, width });
    setPreviewWidth(width);
  }, [width]);

  // Handle drag movement
  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const containerWidth = getContainerWidth();
    const deltaX = clientX - dragStart.x;
    const deltaPercent = (deltaX / containerWidth) * 100;
    
    let newWidth = Math.round(dragStart.width + deltaPercent);
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    // Snap to nearest point for preview
    const snappedWidth = snapToNearest(newWidth, snapPoints);
    setPreviewWidth(snappedWidth);
  }, [isDragging, dragStart, getContainerWidth, minWidth, maxWidth, snapPoints]);

  // End dragging
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (previewWidth !== null && previewWidth !== width) {
      setWidth(previewWidth);
      onResize?.(previewWidth);
    }
    
    setPreviewWidth(null);
  }, [isDragging, previewWidth, width, onResize]);

  // Set up event listeners
  useEffect(() => {
    if (!isDragging) return;

    const moveHandler = (e) => handleDragMove(e);
    const endHandler = () => handleDragEnd();

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', endHandler);

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    return () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Update width externally
  const setWidthExternal = useCallback((newWidth) => {
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setWidth(clampedWidth);
    onResize?.(clampedWidth);
  }, [minWidth, maxWidth, onResize]);

  // Props to spread on the drag handle element
  const dragHandleProps = {
    onMouseDown: handleDragStart,
    onTouchStart: handleDragStart,
    style: { cursor: 'ew-resize' },
    'data-testid': 'resize-drag-handle',
    'aria-label': 'Drag to resize',
    role: 'slider',
    'aria-valuenow': width,
    'aria-valuemin': minWidth,
    'aria-valuemax': maxWidth,
  };

  return {
    width,
    setWidth: setWidthExternal,
    isDragging,
    previewWidth,
    displayWidth: isDragging && previewWidth !== null ? previewWidth : width,
    dragHandleProps,
    elementRef,
  };
};

export default useResizable;
