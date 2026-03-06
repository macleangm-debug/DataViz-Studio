import React from 'react';
import { ChevronRight, Home, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

export function DrillBreadcrumb({ path, hierarchy, onNavigate, onReset }) {
  if (!path || Object.keys(path).length === 0) return null;

  const pathEntries = Object.entries(path);
  
  return (
    <div 
      className="flex items-center gap-1 text-xs bg-slate-800/50 rounded-md px-2 py-1 border border-slate-700/50"
      data-testid="drill-breadcrumb"
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-5 px-1 text-muted-foreground hover:text-foreground"
        onClick={onReset}
        title="Reset to top level"
      >
        <Home className="w-3 h-3" />
      </Button>
      
      {pathEntries.map(([field, value], index) => (
        <React.Fragment key={field}>
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
          <button
            className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
              index === pathEntries.length - 1
                ? 'bg-violet-500/20 text-violet-300 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-700/50'
            }`}
            onClick={() => onNavigate(index)}
            data-testid={`breadcrumb-${field}`}
          >
            <span className="capitalize opacity-60">{field}:</span>{' '}
            <span>{value}</span>
          </button>
        </React.Fragment>
      ))}
      
      {pathEntries.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 ml-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={onReset}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
}

export default DrillBreadcrumb;
