import React from 'react';
import { X, Filter, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useDashboardFilters } from '../contexts/DashboardFilterContext';

export function ActiveFiltersBar() {
  const { filters, removeFilter, clearAllFilters, hasFilters } = useDashboardFilters();

  if (!hasFilters) return null;

  const filterEntries = Object.entries(filters);

  return (
    <div 
      className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg mb-4 animate-in slide-in-from-top-2 duration-200"
      data-testid="active-filters-bar"
    >
      <div className="flex items-center gap-2 text-sm text-violet-400">
        <Filter className="w-4 h-4" />
        <span className="font-medium">Active Filters:</span>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {filterEntries.map(([field, value]) => (
          <Badge
            key={field}
            variant="secondary"
            className="bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 cursor-pointer group pl-2 pr-1 py-1 gap-1"
            onClick={() => removeFilter(field)}
            data-testid={`filter-chip-${field}`}
          >
            <span className="font-medium capitalize">{field}:</span>
            <span className="text-violet-200">{String(value)}</span>
            <X className="w-3 h-3 ml-1 opacity-60 group-hover:opacity-100 transition-opacity" />
          </Badge>
        ))}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={clearAllFilters}
        className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/20 h-7 text-xs"
        data-testid="clear-all-filters-btn"
      >
        <RefreshCw className="w-3 h-3 mr-1" />
        Clear all
      </Button>
    </div>
  );
}

export default ActiveFiltersBar;
