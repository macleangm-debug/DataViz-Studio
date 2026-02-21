import React from 'react';

// Sample data for charts preview
export const SAMPLE_BAR_DATA = [
  { name: 'Q1', value: 65 },
  { name: 'Q2', value: 85 },
  { name: 'Q3', value: 45 },
  { name: 'Q4', value: 75 },
  { name: 'Q5', value: 55 },
];

// Bar Chart Component (SVG preview) - optimized for PDF export
export const BarChartPreview = ({ theme, data = SAMPLE_BAR_DATA }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '12px', padding: '16px' }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div 
            style={{ 
              width: '40px',
              height: `${(item.value / maxValue) * 100}px`,
              backgroundColor: i % 2 === 0 ? theme.primary : theme.accent,
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              transition: 'all 0.3s ease'
            }}
          />
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.name}</span>
        </div>
      ))}
    </div>
  );
};

// Pie Chart Component (SVG preview)
export const PieChartPreview = ({ theme }) => {
  return (
    <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 100 100" style={{ width: '128px', height: '128px' }}>
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
export const LineChartPreview = ({ theme }) => {
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
    <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '128px' }}>
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

// Data Table Preview - optimized for PDF export
export const DataTablePreview = ({ theme }) => {
  const tableData = [
    { category: 'North Region', value: '245,000', share: '32%' },
    { category: 'South Region', value: '189,000', share: '24%' },
    { category: 'East Region', value: '156,000', share: '21%' },
    { category: 'West Region', value: '178,000', share: '23%' },
  ];
  
  return (
    <div style={{ overflow: 'hidden', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          fontSize: '12px', 
          fontWeight: '600', 
          color: 'white',
          backgroundColor: theme.primary
        }}
      >
        <div style={{ padding: '8px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Category</div>
        <div style={{ padding: '8px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'right' }}>Value</div>
        <div style={{ padding: '8px', textAlign: 'right' }}>Share</div>
      </div>
      {tableData.map((row, i) => (
        <div 
          key={i} 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            fontSize: '12px',
            backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb'
          }}
        >
          <div style={{ padding: '8px', borderRight: '1px solid #f3f4f6', color: '#374151' }}>{row.category}</div>
          <div style={{ padding: '8px', borderRight: '1px solid #f3f4f6', textAlign: 'right', color: '#4b5563' }}>{row.value}</div>
          <div style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: theme.accent }}>{row.share}</div>
        </div>
      ))}
    </div>
  );
};
