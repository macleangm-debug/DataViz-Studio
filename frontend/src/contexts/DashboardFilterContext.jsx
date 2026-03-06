import React, { createContext, useContext, useState, useCallback } from 'react';

const DashboardFilterContext = createContext(null);

export function DashboardFilterProvider({ children }) {
  // Active filters: { fieldName: value, ... }
  const [filters, setFilters] = useState({});
  
  // Track which widget is the source of each filter
  const [filterSources, setFilterSources] = useState({});
  
  // Loading state for widgets being refreshed
  const [loadingWidgets, setLoadingWidgets] = useState(new Set());

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

  const value = {
    filters,
    filterSources,
    setFilter,
    removeFilter,
    clearAllFilters,
    hasFilters,
    setWidgetLoading,
    isWidgetLoading,
    isFilterSource
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
