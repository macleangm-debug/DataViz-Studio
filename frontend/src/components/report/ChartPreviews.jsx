import React from 'react';

// Sample data for charts preview
export const SAMPLE_BAR_DATA = [
  { name: 'Q1', value: 65 },
  { name: 'Q2', value: 85 },
  { name: 'Q3', value: 45 },
  { name: 'Q4', value: 75 },
  { name: 'Q5', value: 55 },
];

// Sparkline Component - mini inline chart for tables
export const Sparkline = ({ data = [], color = '#3B82F6', width = 60, height = 20 }) => {
  if (!data || data.length === 0) return null;
  
  const numericData = data.map(d => typeof d === 'number' ? d : parseFloat(d) || 0);
  const max = Math.max(...numericData);
  const min = Math.min(...numericData);
  const range = max - min || 1;
  
  const points = numericData.map((val, i) => {
    const x = (i / (numericData.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  
  // Determine trend color
  const trendUp = numericData[numericData.length - 1] > numericData[0];
  const trendColor = trendUp ? '#10B981' : '#EF4444';
  
  return (
    <svg width={width} height={height} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline
        fill="none"
        stroke={color === 'trend' ? trendColor : color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

// Bar Chart Component (SVG preview) - optimized for PDF export
export const BarChartPreview = ({ theme, data = SAMPLE_BAR_DATA }) => {
  const chartData = data && data.length > 0 ? data : SAMPLE_BAR_DATA;
  const maxValue = Math.max(...chartData.map(d => d.value || 0));
  
  return (
    <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '12px', padding: '16px' }}>
      {chartData.slice(0, 8).map((item, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div 
            style={{ 
              width: '40px',
              height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}px`,
              backgroundColor: i % 2 === 0 ? theme.primary : theme.accent,
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              transition: 'all 0.3s ease',
              minHeight: '4px'
            }}
          />
          <span style={{ fontSize: '11px', color: '#6b7280', maxWidth: '50px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
};

// Pie Chart Component (SVG preview)
export const PieChartPreview = ({ theme, data }) => {
  // Use provided data or default
  const defaultData = [
    { name: 'Primary', value: 60 },
    { name: 'Secondary', value: 25 },
    { name: 'Other', value: 15 },
  ];
  
  const chartData = data && data.length > 0 ? data.slice(0, 5) : defaultData;
  const total = chartData.reduce((sum, d) => sum + (d.value || 0), 0) || 1;
  
  // Calculate angles for each slice
  let startAngle = 0;
  const colors = [theme.primary, theme.accent, theme.secondary, '#94a3b8', '#64748b'];
  
  return (
    <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 100 100" style={{ width: '128px', height: '128px' }}>
        {chartData.map((item, i) => {
          const percentage = (item.value || 0) / total;
          const dashArray = percentage * 251.33;
          const dashOffset = -startAngle * 251.33;
          startAngle += percentage;
          
          return (
            <circle
              key={i}
              cx="50" cy="50" r="40"
              fill="transparent"
              stroke={colors[i % colors.length]}
              strokeWidth="20"
              strokeDasharray={`${dashArray} 251.33`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
            />
          );
        })}
      </svg>
    </div>
  );
};

// Line Chart Component (SVG preview)
export const LineChartPreview = ({ theme, data }) => {
  const defaultPoints = [10, 40, 30, 60, 45, 70, 55];
  const chartData = data && data.length > 0 
    ? data.map(d => d.value || 0) 
    : defaultPoints;
  
  const width = 200;
  const height = 100;
  const padding = 10;
  
  const maxVal = Math.max(...chartData) || 1;
  const pointsStr = chartData.map((p, i) => {
    const x = padding + (i / (chartData.length - 1 || 1)) * (width - 2 * padding);
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
        {chartData.map((p, i) => {
          const x = padding + (i / (chartData.length - 1 || 1)) * (width - 2 * padding);
          const y = height - padding - (p / maxVal) * (height - 2 * padding);
          return (
            <circle key={i} cx={x} cy={y} r="4" fill={theme.accent} />
          );
        })}
      </svg>
    </div>
  );
};

// Data Table Preview with Sparklines - optimized for PDF export
export const DataTablePreview = ({ theme, data, showSparklines = false, sparklineData }) => {
  const defaultTableData = [
    { category: 'North Region', value: '245,000', share: '32%' },
    { category: 'South Region', value: '189,000', share: '24%' },
    { category: 'East Region', value: '156,000', share: '21%' },
    { category: 'West Region', value: '178,000', share: '23%' },
  ];
  
  // Sample sparkline data for each row
  const defaultSparklineData = [
    [10, 15, 12, 18, 22, 20, 25],
    [20, 18, 22, 19, 15, 17, 14],
    [8, 12, 10, 14, 16, 15, 18],
    [15, 14, 16, 18, 17, 20, 22],
  ];
  
  const tableData = data && data.length > 0 ? data : defaultTableData;
  const sparklines = sparklineData || defaultSparklineData;
  
  // Determine columns based on data
  const columns = tableData.length > 0 
    ? Object.keys(tableData[0]).filter(k => k !== 'sparkline' && k !== '_id')
    : ['category', 'value', 'share'];
  
  return (
    <div style={{ overflow: 'hidden', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      {/* Header */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: showSparklines ? `repeat(${columns.length}, 1fr) 80px` : `repeat(${columns.length}, 1fr)`, 
          fontSize: '12px', 
          fontWeight: '600', 
          color: 'white',
          backgroundColor: theme.primary
        }}
      >
        {columns.map((col, i) => (
          <div 
            key={col} 
            style={{ 
              padding: '8px', 
              borderRight: i < columns.length - 1 || showSparklines ? '1px solid rgba(255,255,255,0.2)' : 'none',
              textTransform: 'capitalize'
            }}
          >
            {col.replace(/_/g, ' ')}
          </div>
        ))}
        {showSparklines && (
          <div style={{ padding: '8px', textAlign: 'center' }}>Trend</div>
        )}
      </div>
      
      {/* Body */}
      {tableData.slice(0, 6).map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: showSparklines ? `repeat(${columns.length}, 1fr) 80px` : `repeat(${columns.length}, 1fr)`, 
            fontSize: '12px',
            backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb'
          }}
        >
          {columns.map((col, colIndex) => (
            <div 
              key={col} 
              style={{ 
                padding: '8px', 
                borderRight: colIndex < columns.length - 1 || showSparklines ? '1px solid #f3f4f6' : 'none',
                color: colIndex === columns.length - 1 ? theme.accent : '#374151',
                fontWeight: colIndex === columns.length - 1 ? '600' : '400',
                textAlign: colIndex > 0 ? 'right' : 'left'
              }}
            >
              {row[col] !== undefined ? String(row[col]) : '-'}
            </div>
          ))}
          {showSparklines && (
            <div style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkline 
                data={sparklines[rowIndex] || sparklines[0] || []} 
                color="trend"
                width={60}
                height={20}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
