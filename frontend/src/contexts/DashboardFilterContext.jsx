import React, { createContext, useContext, useState, useCallback } from 'react';

const DashboardFilterContext = createContext(null);

export function DashboardFilterProvider({ children }) {
  // Active filters: { fieldName: value, ... }
  const [filters, setFilters] = useState({});
  
  // Track which widget is the source of each filter
  const [filterSources, setFilterSources] = useState({});
  
  // Loading state for widgets being refreshed
  const [loadingWidgets, setLoadingWidgets] = useState(new Set());
  
  // Drill state per widget: { widgetId: { level: 0, path: {}, hierarchy: [] } }
  const [drillStates, setDrillStates] = useState({});

  // Set a filter from a chart click
  const setFilter = useCallback((field, value, sourceWidgetId = null) => {
    setFilters(prev => {
      // If clicking the same value, toggle it off
      if (prev[field] === value) {
        const { [field]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: value };
    });
    
    if (sourceWidgetId) {
      setFilterSources(prev => {
        if (filters[field] === value) {
          const { [field]: removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [field]: sourceWidgetId };
      });
    }
  }, [filters]);

  // Remove a single filter
  const removeFilter = useCallback((field) => {
    setFilters(prev => {
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
    setFilterSources(prev => {
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({});
    setFilterSources({});
  }, []);

  // Check if any filters are active
  const hasFilters = Object.keys(filters).length > 0;

  // Set loading state for a widget
  const setWidgetLoading = useCallback((widgetId, isLoading) => {
    setLoadingWidgets(prev => {
      const next = new Set(prev);
      if (isLoading) {
        next.add(widgetId);
      } else {
        next.delete(widgetId);
      }
      return next;
    });
  }, []);

  // Check if a widget is loading
  const isWidgetLoading = useCallback((widgetId) => {
    return loadingWidgets.has(widgetId);
  }, [loadingWidgets]);

  // Check if a widget is the source of a filter (should not be filtered)
  const isFilterSource = useCallback((widgetId) => {
    return Object.values(filterSources).includes(widgetId);
  }, [filterSources]);

  // ==================== DRILL DOWN FUNCTIONS ====================
  
  // Initialize drill state for a widget
  const initDrillState = useCallback((widgetId, hierarchy = []) => {
    setDrillStates(prev => ({
      ...prev,
      [widgetId]: { level: 0, path: {}, hierarchy }
    }));
  }, []);

  // Get drill state for a widget
  const getDrillState = useCallback((widgetId) => {
    return drillStates[widgetId] || { level: 0, path: {}, hierarchy: [] };
  }, [drillStates]);

  // Drill down into a value
  const drillDown = useCallback((widgetId, field, value) => {
    setDrillStates(prev => {
      const current = prev[widgetId] || { level: 0, path: {}, hierarchy: [] };
      return {
        ...prev,
        [widgetId]: {
          ...current,
          level: current.level + 1,
          path: { ...current.path, [field]: value }
        }
      };
    });
  }, []);

  // Navigate back to a specific level in the breadcrumb
  const drillNavigate = useCallback((widgetId, targetIndex) => {
    setDrillStates(prev => {
      const current = prev[widgetId];
      if (!current) return prev;
      
      const pathEntries = Object.entries(current.path);
      const newPath = {};
      pathEntries.slice(0, targetIndex + 1).forEach(([k, v]) => {
        newPath[k] = v;
      });
      
      return {
        ...prev,
        [widgetId]: {
          ...current,
          level: targetIndex + 1,
          path: newPath
        }
      };
    });
  }, []);

  // Reset drill state for a widget
  const drillReset = useCallback((widgetId) => {
    setDrillStates(prev => {
      const current = prev[widgetId];
      if (!current) return prev;
      
      return {
        ...prev,
        [widgetId]: {
          ...current,
          level: 0,
          path: {}
        }
      };
    });
  }, []);

  // Check if widget has drill capability
  const hasDrillDown = useCallback((widgetId) => {
    const state = drillStates[widgetId];
    return state && state.hierarchy && state.hierarchy.length > 1;
  }, [drillStates]);

  // Check if widget is currently drilled down
  const isDrilledDown = useCallback((widgetId) => {
    const state = drillStates[widgetId];
    return state && state.level > 0;
  }, [drillStates]);

  // Get current drill level field
  const getCurrentDrillField = useCallback((widgetId) => {
    const state = drillStates[widgetId];
    if (!state || !state.hierarchy || state.hierarchy.length === 0) return null;
    return state.hierarchy[Math.min(state.level, state.hierarchy.length - 1)];
  }, [drillStates]);

  // Check if can drill further
  const canDrillFurther = useCallback((widgetId) => {
    const state = drillStates[widgetId];
    if (!state || !state.hierarchy) return false;
    return state.level < state.hierarchy.length - 1;
  }, [drillStates]);

  const value = {
    // Filter state
    filters,
    filterSources,
    setFilter,
    removeFilter,
    clearAllFilters,
    hasFilters,
    setWidgetLoading,
    isWidgetLoading,
    isFilterSource,
    // Drill state
    drillStates,
    initDrillState,
    getDrillState,
    drillDown,
    drillNavigate,
    drillReset,
    hasDrillDown,
    isDrilledDown,
    getCurrentDrillField,
    canDrillFurther
  };

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  }
  return context;
}

export default DashboardFilterContext;

