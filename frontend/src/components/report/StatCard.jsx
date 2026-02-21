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
      className="rounded-2xl p-5 text-white relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
      style={{ background: gradients[index % 4] }}
      data-testid={`stat-card-${index}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
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
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full"
        style={{ background: 'rgba(255,255,255,0.1)' }}
      />
      <div 
        className="absolute -bottom-12 -left-6 w-20 h-20 rounded-full"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 shadow-inner">
          <IconComponent size={20} className="text-white" />
        </div>
        
        {/* Value */}
        {!isPreview ? (
          <input
            type="text"
            value={stat.value}
            onChange={(e) => onUpdate(index, { ...stat, value: e.target.value })}
            className="text-3xl font-bold bg-transparent border-none outline-none w-full text-white placeholder-white/50 tracking-tight"
            placeholder="44%"
            data-testid={`stat-value-${index}`}
          />
        ) : (
          <div className="text-3xl font-bold tracking-tight">{stat.value || '44%'}</div>
        )}
        
        {/* Label */}
        {!isPreview ? (
          <input
            type="text"
            value={stat.label}
            onChange={(e) => onUpdate(index, { ...stat, label: e.target.value })}
            className="text-sm opacity-90 bg-transparent border-none outline-none w-full text-white placeholder-white/50 mt-1 leading-relaxed"
            placeholder="Description text"
            data-testid={`stat-label-${index}`}
          />
        ) : (
          <div className="text-sm opacity-90 mt-1 leading-relaxed">{stat.label || 'Description text'}</div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
