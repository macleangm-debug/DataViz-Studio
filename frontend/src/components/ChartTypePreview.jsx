import React from 'react';

// Mini SVG Chart Previews - These show actual chart shapes instead of icons
export const ChartPreviews = {
  bar: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <rect x="2" y="18" width="6" height="10" fill="currentColor" opacity="0.7" rx="1" />
      <rect x="10" y="10" width="6" height="18" fill="currentColor" opacity="0.85" rx="1" />
      <rect x="18" y="6" width="6" height="22" fill="currentColor" rx="1" />
      <rect x="26" y="14" width="6" height="14" fill="currentColor" opacity="0.8" rx="1" />
      <rect x="34" y="20" width="4" height="8" fill="currentColor" opacity="0.6" rx="1" />
    </svg>
  ),
  
  line: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <polyline 
        points="2,22 10,14 18,18 26,8 38,12" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="2" cy="22" r="2" fill="currentColor" />
      <circle cx="10" cy="14" r="2" fill="currentColor" />
      <circle cx="18" cy="18" r="2" fill="currentColor" />
      <circle cx="26" cy="8" r="2" fill="currentColor" />
      <circle cx="38" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  
  pie: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <circle cx="20" cy="15" r="12" fill="currentColor" opacity="0.3" />
      <path d="M20,15 L20,3 A12,12 0 0,1 30.4,21 Z" fill="currentColor" opacity="0.9" />
      <path d="M20,15 L30.4,21 A12,12 0 0,1 9.6,21 Z" fill="currentColor" opacity="0.6" />
      <path d="M20,15 L9.6,21 A12,12 0 0,1 20,3 Z" fill="currentColor" opacity="0.4" />
    </svg>
  ),
  
  area: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <defs>
        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path 
        d="M2,26 L2,20 Q8,12 14,16 T26,10 T38,14 L38,26 Z" 
        fill="url(#areaGrad)" 
      />
      <path 
        d="M2,20 Q8,12 14,16 T26,10 T38,14" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  
  scatter: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <circle cx="6" cy="20" r="3" fill="currentColor" opacity="0.7" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.8" />
      <circle cx="18" cy="22" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="22" cy="8" r="3.5" fill="currentColor" opacity="0.9" />
      <circle cx="28" cy="16" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="34" cy="10" r="2.5" fill="currentColor" opacity="0.8" />
      <circle cx="32" cy="24" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  
  radar: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <polygon 
        points="20,4 34,12 32,26 8,26 6,12" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1" 
        opacity="0.3" 
      />
      <polygon 
        points="20,8 28,13 26,22 14,22 12,13" 
        fill="currentColor" 
        opacity="0.3" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      <circle cx="20" cy="8" r="1.5" fill="currentColor" />
      <circle cx="28" cy="13" r="1.5" fill="currentColor" />
      <circle cx="26" cy="22" r="1.5" fill="currentColor" />
      <circle cx="14" cy="22" r="1.5" fill="currentColor" />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" />
    </svg>
  ),
  
  funnel: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <path d="M4,4 L36,4 L30,11 L10,11 Z" fill="currentColor" opacity="0.9" />
      <path d="M10,12 L30,12 L26,19 L14,19 Z" fill="currentColor" opacity="0.7" />
      <path d="M14,20 L26,20 L22,27 L18,27 Z" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  
  gauge: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <path 
        d="M6,24 A14,14 0 0,1 34,24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4" 
        opacity="0.2"
        strokeLinecap="round"
      />
      <path 
        d="M6,24 A14,14 0 0,1 26,8" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="20" cy="24" r="3" fill="currentColor" />
      <line x1="20" y1="24" x2="24" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  
  heatmap: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <rect x="2" y="2" width="8" height="8" fill="currentColor" opacity="0.9" rx="1" />
      <rect x="12" y="2" width="8" height="8" fill="currentColor" opacity="0.5" rx="1" />
      <rect x="22" y="2" width="8" height="8" fill="currentColor" opacity="0.7" rx="1" />
      <rect x="32" y="2" width="6" height="8" fill="currentColor" opacity="0.3" rx="1" />
      <rect x="2" y="12" width="8" height="8" fill="currentColor" opacity="0.6" rx="1" />
      <rect x="12" y="12" width="8" height="8" fill="currentColor" opacity="0.8" rx="1" />
      <rect x="22" y="12" width="8" height="8" fill="currentColor" opacity="0.4" rx="1" />
      <rect x="32" y="12" width="6" height="8" fill="currentColor" opacity="0.7" rx="1" />
      <rect x="2" y="22" width="8" height="6" fill="currentColor" opacity="0.4" rx="1" />
      <rect x="12" y="22" width="8" height="6" fill="currentColor" opacity="0.6" rx="1" />
      <rect x="22" y="22" width="8" height="6" fill="currentColor" opacity="0.9" rx="1" />
      <rect x="32" y="22" width="6" height="6" fill="currentColor" opacity="0.5" rx="1" />
    </svg>
  ),
  
  // NEW CHART TYPES
  treemap: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <rect x="2" y="2" width="18" height="16" fill="currentColor" opacity="0.9" rx="1" />
      <rect x="22" y="2" width="16" height="10" fill="currentColor" opacity="0.6" rx="1" />
      <rect x="22" y="14" width="8" height="14" fill="currentColor" opacity="0.7" rx="1" />
      <rect x="32" y="14" width="6" height="14" fill="currentColor" opacity="0.4" rx="1" />
      <rect x="2" y="20" width="10" height="8" fill="currentColor" opacity="0.5" rx="1" />
      <rect x="14" y="20" width="6" height="8" fill="currentColor" opacity="0.3" rx="1" />
    </svg>
  ),
  
  waterfall: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <rect x="2" y="8" width="5" height="18" fill="currentColor" opacity="0.8" rx="1" />
      <rect x="9" y="8" width="5" height="6" fill="currentColor" opacity="0.5" rx="1" />
      <rect x="16" y="6" width="5" height="8" fill="currentColor" opacity="0.6" rx="1" />
      <rect x="23" y="10" width="5" height="6" fill="currentColor" opacity="0.4" rx="1" />
      <rect x="30" y="4" width="5" height="22" fill="currentColor" opacity="0.9" rx="1" />
      <line x1="7" y1="8" x2="9" y2="8" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1" />
      <line x1="14" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1" />
      <line x1="21" y1="6" x2="23" y2="6" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1" />
    </svg>
  ),
  
  boxplot: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      {/* Box plot 1 */}
      <line x1="8" y1="4" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="8" width="8" height="12" fill="currentColor" opacity="0.6" rx="1" />
      <line x1="4" y1="14" x2="12" y2="14" stroke="currentColor" strokeWidth="2" />
      <line x1="8" y1="20" x2="8" y2="26" stroke="currentColor" strokeWidth="1.5" />
      {/* Box plot 2 */}
      <line x1="22" y1="6" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <rect x="18" y="10" width="8" height="10" fill="currentColor" opacity="0.8" rx="1" />
      <line x1="18" y1="15" x2="26" y2="15" stroke="currentColor" strokeWidth="2" />
      <line x1="22" y1="20" x2="22" y2="24" stroke="currentColor" strokeWidth="1.5" />
      {/* Box plot 3 */}
      <line x1="34" y1="8" x2="34" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <rect x="30" y="12" width="8" height="8" fill="currentColor" opacity="0.5" rx="1" />
      <line x1="30" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="2" />
      <line x1="34" y1="20" x2="34" y2="26" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  
  sankey: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      <path d="M2,4 C12,4 12,8 22,8 L22,14 C12,14 12,10 2,10 Z" fill="currentColor" opacity="0.7" />
      <path d="M2,14 C12,14 12,20 22,20 L22,26 C12,26 12,20 2,20 Z" fill="currentColor" opacity="0.5" />
      <path d="M22,6 C28,6 28,4 38,4 L38,12 C28,12 28,14 22,14 Z" fill="currentColor" opacity="0.6" />
      <path d="M22,18 C28,18 28,20 38,20 L38,26 C28,26 28,24 22,24 Z" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  
  candlestick: () => (
    <svg viewBox="0 0 40 30" className="w-full h-full">
      {/* Candlestick 1 - bullish (green would be shown) */}
      <line x1="6" y1="4" x2="6" y2="26" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <rect x="3" y="10" width="6" height="10" fill="currentColor" opacity="0.4" rx="0.5" />
      {/* Candlestick 2 - bearish */}
      <line x1="14" y1="6" x2="14" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <rect x="11" y="8" width="6" height="12" fill="currentColor" opacity="0.9" rx="0.5" />
      {/* Candlestick 3 */}
      <line x1="22" y1="8" x2="22" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <rect x="19" y="12" width="6" height="6" fill="currentColor" opacity="0.5" rx="0.5" />
      {/* Candlestick 4 */}
      <line x1="30" y1="4" x2="30" y2="26" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <rect x="27" y="6" width="6" height="14" fill="currentColor" opacity="0.7" rx="0.5" />
      {/* Candlestick 5 */}
      <line x1="38" y1="10" x2="38" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <rect x="35" y="14" width="6" height="6" fill="currentColor" opacity="0.6" rx="0.5" />
    </svg>
  ),
};

// Chart type selector component with mini previews
export const ChartTypeButton = ({ type, isSelected, onClick, label }) => {
  const Preview = ChartPreviews[type];
  
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200
        ${isSelected
          ? 'border-violet-500 bg-violet-500/20 text-violet-400 shadow-lg shadow-violet-500/20'
          : 'border-border/50 hover:border-violet-400/50 text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }
      `}
      data-testid={`chart-type-${type}`}
    >
      <div className={`w-10 h-8 ${isSelected ? 'text-violet-400' : ''}`}>
        {Preview && <Preview />}
      </div>
      <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
    </button>
  );
};

export default ChartPreviews;
