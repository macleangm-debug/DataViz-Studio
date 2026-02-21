import React from 'react';
import { Percent, Users, DollarSign, ShoppingCart, TrendingUp, Hash, Target, Zap, Award, BarChart3 } from 'lucide-react';

// Stat icons for infographic cards - expanded set
export const STAT_ICONS = [
  { id: 'percent', icon: Percent, name: 'Percentage' },
  { id: 'users', icon: Users, name: 'Users' },
  { id: 'dollar', icon: DollarSign, name: 'Revenue' },
  { id: 'cart', icon: ShoppingCart, name: 'Sales' },
  { id: 'trending', icon: TrendingUp, name: 'Growth' },
  { id: 'hash', icon: Hash, name: 'Count' },
  { id: 'target', icon: Target, name: 'Target' },
  { id: 'zap', icon: Zap, name: 'Performance' },
  { id: 'award', icon: Award, name: 'Achievement' },
  { id: 'chart', icon: BarChart3, name: 'Analytics' },
];

const StatCard = ({ stat, theme, isPreview, onUpdate, index }) => {
  const IconComponent = STAT_ICONS.find(s => s.id === stat.iconType)?.icon || Percent;
  const isAccent = index % 2 === 1;
  const bgColor = isAccent ? theme.accent : theme.primary;
  
  // Create gradient based on index for variety
  const gradients = [
    `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}dd 100%)`,
    `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}dd 100%)`,
    `linear-gradient(135deg, ${theme.secondary || theme.primary} 0%, ${theme.primary}cc 100%)`,
    `linear-gradient(135deg, ${theme.accent}ee 0%, ${theme.primary}dd 100%)`,
  ];
  
  return (
    <div 
      style={{
        borderRadius: '16px',
        padding: '16px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        background: gradients[index % 4],
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
      data-testid={`stat-card-${index}`}
    >
      {/* Background Pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
        <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id={`statPattern-${index}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="white"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill={`url(#statPattern-${index})`} />
        </svg>
      </div>
      
      {/* Decorative Circle */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '-32px', 
          right: '-32px', 
          width: '96px', 
          height: '96px', 
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)' 
        }}
      />
      <div 
        style={{ 
          position: 'absolute', 
          bottom: '-48px', 
          left: '-24px', 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)' 
        }}
      />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Icon */}
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '12px', 
          background: 'rgba(255,255,255,0.2)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: '12px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
        }}>
          <IconComponent size={20} style={{ color: 'white' }} />
        </div>
        
        {/* Value */}
        {!isPreview ? (
          <input
            type="text"
            value={stat.value}
            onChange={(e) => onUpdate(index, { ...stat, value: e.target.value })}
            style={{
              fontSize: '28px',
              fontWeight: '700',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
              color: 'white',
              letterSpacing: '-0.025em'
            }}
            placeholder="44%"
            data-testid={`stat-value-${index}`}
          />
        ) : (
          <div style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.025em' }}>{stat.value || '44%'}</div>
        )}
        
        {/* Label */}
        {!isPreview ? (
          <input
            type="text"
            value={stat.label}
            onChange={(e) => onUpdate(index, { ...stat, label: e.target.value })}
            style={{
              fontSize: '13px',
              opacity: 0.9,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
              color: 'white',
              marginTop: '4px',
              lineHeight: '1.4',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
            placeholder="Description text"
            data-testid={`stat-label-${index}`}
          />
        ) : (
          <div style={{ 
            fontSize: '13px', 
            opacity: 0.9, 
            marginTop: '4px', 
            lineHeight: '1.4',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>{stat.label || 'Description text'}</div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
