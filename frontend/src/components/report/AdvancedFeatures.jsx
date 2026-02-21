import React, { useState, useRef, useCallback } from 'react';
import { 
  FileText, Download, Settings, Eye, Plus, PieChart, RefreshCw, X, Maximize2,
  Upload, Image, Calendar, Mail, Clock, FileSpreadsheet, FileImage, Presentation,
  Lock, QrCode, TrendingUp, TrendingDown, Minus, Sparkles, List, Filter,
  ChevronUp, ChevronDown, AlertCircle, CheckCircle, MinusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../layouts/DashboardLayout';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

// ========================================
// COVER PAGE COMPONENT
// ========================================
const CoverPageEditor = ({ config, theme, onUpdate, logo, onLogoUpload }) => {
  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoUpload(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div 
      style={{
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}ee 40%, ${theme.accent}cc 100%)`,
        minHeight: '400px',
        borderRadius: '16px',
        padding: '48px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}
    >
      {/* Background Pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
        <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="coverGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="1" fill="white"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#coverGrid)" />
        </svg>
      </div>
      
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', bottom: '-150px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Logo Upload */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '20px',
            background: logo ? 'white' : 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            margin: '0 auto 32px',
            overflow: 'hidden',
            border: '2px dashed rgba(255,255,255,0.5)',
            transition: 'all 0.2s ease'
          }}
        >
          {logo ? (
            <img src={logo} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Upload size={32} style={{ opacity: 0.8, marginBottom: '4px' }} />
              <div style={{ fontSize: '10px', opacity: 0.8 }}>Upload Logo</div>
            </div>
          )}
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {/* Title */}
        <h1 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          {config.title || 'Report Title'}
        </h1>
        
        {/* Subtitle */}
        <p style={{ fontSize: '24px', opacity: 0.9, marginBottom: '48px', fontWeight: '300' }}>
          {config.subtitle || 'Report Subtitle'}
        </p>
        
        {/* Divider */}
        <div style={{ width: '100px', height: '2px', background: 'rgba(255,255,255,0.5)', margin: '0 auto 32px' }} />
        
        {/* Meta info */}
        {config.companyName && (
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '8px' }}>
            Prepared by: {config.companyName}
          </p>
        )}
        <p style={{ fontSize: '14px', opacity: 0.7 }}>
          {config.reportDate}
        </p>
      </div>
    </div>
  );
};

// ========================================
// TABLE OF CONTENTS COMPONENT
// ========================================
const TableOfContents = ({ sections, theme }) => {
  return (
    <div style={{ 
      padding: '24px', 
      background: '#f8fafc', 
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        marginBottom: '16px',
        color: theme.primary,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <List size={20} />
        Table of Contents
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sections.map((section, index) => (
          <div 
            key={section.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: '6px',
              background: index % 2 === 0 ? 'white' : 'transparent'
            }}
          >
            <span style={{ color: '#374151', fontSize: '14px' }}>
              {index + 1}. {section.title}
            </span>
            <span style={{ 
              color: '#9ca3af', 
              fontSize: '12px',
              borderBottom: '1px dotted #d1d5db',
              flex: 1,
              margin: '0 12px'
            }} />
            <span style={{ color: '#6b7280', fontSize: '12px' }}>
              {index + 2}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========================================
// SPARKLINE COMPONENT
// ========================================
const Sparkline = ({ data, color, type = 'line', width = 80, height = 24 }) => {
  const values = data || [30, 45, 25, 60, 35, 55, 40];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - ((v - min) / range) * height
  }));
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  if (type === 'bar') {
    const barWidth = (width / values.length) * 0.7;
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        {values.map((v, i) => {
          const barHeight = ((v - min) / range) * height;
          return (
            <rect
              key={i}
              x={(i / values.length) * width + barWidth * 0.2}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              fill={color}
              opacity={0.8}
              rx={1}
            />
          );
        })}
      </svg>
    );
  }
  
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ========================================
// TREND INDICATOR COMPONENT
// ========================================
const TrendIndicator = ({ value, showIcon = true }) => {
  const numValue = parseFloat(value) || 0;
  const isPositive = numValue > 0;
  const isNeutral = numValue === 0;
  
  const color = isNeutral ? '#6b7280' : isPositive ? '#10b981' : '#ef4444';
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color }}>
      {showIcon && <Icon size={14} />}
      <span style={{ fontWeight: '600', fontSize: '13px' }}>
        {isPositive ? '+' : ''}{value}%
      </span>
    </div>
  );
};

// ========================================
// STATUS INDICATOR COMPONENT
// ========================================
const StatusIndicator = ({ status }) => {
  const configs = {
    success: { color: '#10b981', Icon: CheckCircle, label: 'On Track' },
    warning: { color: '#f59e0b', Icon: AlertCircle, label: 'At Risk' },
    error: { color: '#ef4444', Icon: MinusCircle, label: 'Below Target' }
  };
  
  const config = configs[status] || configs.success;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <config.Icon size={16} style={{ color: config.color }} />
    </div>
  );
};

// ========================================
// ENHANCED DATA TABLE WITH SPARKLINES
// ========================================
const EnhancedDataTable = ({ theme, showSparklines = true, showTrends = true }) => {
  const tableData = [
    { region: 'North Region', value: 245000, trend: 12, sparkline: [30, 35, 32, 40, 38, 45], status: 'success' },
    { region: 'South Region', value: 189000, trend: -3, sparkline: [40, 38, 35, 33, 36, 34], status: 'warning' },
    { region: 'East Region', value: 156000, trend: 8, sparkline: [25, 28, 30, 32, 35, 38], status: 'success' },
    { region: 'West Region', value: 178000, trend: -15, sparkline: [45, 42, 38, 35, 30, 28], status: 'error' },
  ];
  
  return (
    <div style={{ overflow: 'hidden', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      {/* Header */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: showSparklines && showTrends ? '1.5fr 1fr 1fr 1fr 0.5fr' : '1.5fr 1fr 1fr',
          fontSize: '12px', 
          fontWeight: '600', 
          color: 'white',
          background: theme.primary
        }}
      >
        <div style={{ padding: '12px 16px' }}>Category</div>
        <div style={{ padding: '12px 16px', textAlign: 'right' }}>Value</div>
        {showSparklines && <div style={{ padding: '12px 16px', textAlign: 'center' }}>Trend (6mo)</div>}
        {showTrends && <div style={{ padding: '12px 16px', textAlign: 'right' }}>vs Target</div>}
        {showTrends && <div style={{ padding: '12px 16px', textAlign: 'center' }}>Status</div>}
      </div>
      
      {/* Rows */}
      {tableData.map((row, i) => (
        <div 
          key={i}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: showSparklines && showTrends ? '1.5fr 1fr 1fr 1fr 0.5fr' : '1.5fr 1fr 1fr',
            fontSize: '13px',
            background: i % 2 === 0 ? '#ffffff' : '#f9fafb',
            borderTop: '1px solid #f3f4f6'
          }}
        >
          <div style={{ padding: '12px 16px', color: '#374151', fontWeight: '500' }}>{row.region}</div>
          <div style={{ padding: '12px 16px', textAlign: 'right', color: '#4b5563' }}>
            ${row.value.toLocaleString()}
          </div>
          {showSparklines && (
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'center' }}>
              <Sparkline data={row.sparkline} color={row.trend >= 0 ? '#10b981' : '#ef4444'} />
            </div>
          )}
          {showTrends && (
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end' }}>
              <TrendIndicator value={row.trend} />
            </div>
          )}
          {showTrends && (
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'center' }}>
              <StatusIndicator status={row.status} />
            </div>
          )}
        </div>
      ))}
      
      {/* Total Row */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: showSparklines && showTrends ? '1.5fr 1fr 1fr 1fr 0.5fr' : '1.5fr 1fr 1fr',
          fontSize: '13px',
          fontWeight: '600',
          background: '#f1f5f9',
          borderTop: '2px solid #e2e8f0'
        }}
      >
        <div style={{ padding: '12px 16px', color: '#1e293b' }}>Total</div>
        <div style={{ padding: '12px 16px', textAlign: 'right', color: '#1e293b' }}>
          ${tableData.reduce((sum, r) => sum + r.value, 0).toLocaleString()}
        </div>
        {showSparklines && <div style={{ padding: '12px 16px' }} />}
        {showTrends && (
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end' }}>
            <TrendIndicator value={2} />
          </div>
        )}
        {showTrends && <div style={{ padding: '12px 16px' }} />}
      </div>
    </div>
  );
};

// ========================================
// AI EXECUTIVE SUMMARY COMPONENT
// ========================================
const ExecutiveSummary = ({ theme, onRegenerate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleRegenerate = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsGenerating(false);
    toast.success('Summary regenerated');
  };
  
  return (
    <div style={{
      padding: '24px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '16px',
      border: '2px solid transparent',
      backgroundClip: 'padding-box',
      position: 'relative'
    }}>
      {/* Gradient border effect */}
      <div style={{
        position: 'absolute',
        inset: '-2px',
        borderRadius: '18px',
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
        zIndex: -1
      }} />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} style={{ color: theme.primary }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
            AI-Generated Executive Summary
          </h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRegenerate}
          disabled={isGenerating}
        >
          <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
          {isGenerating ? 'Generating...' : 'Regenerate'}
        </Button>
      </div>
      
      <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
        <p style={{ marginBottom: '16px' }}>
          <strong style={{ color: theme.primary }}>Key Findings:</strong>
        </p>
        <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
          <li style={{ marginBottom: '8px' }}>Revenue increased 12% compared to last quarter, driven primarily by North region performance</li>
          <li style={{ marginBottom: '8px' }}>North region outperformed all others by 23%, suggesting successful regional strategy</li>
          <li style={{ marginBottom: '8px' }}>Q3 showed the strongest growth at 18% MoM, indicating seasonal opportunity</li>
        </ul>
        
        <p style={{ marginBottom: '16px' }}>
          <strong style={{ color: '#f59e0b' }}>Areas of Concern:</strong>
        </p>
        <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
          <li style={{ marginBottom: '8px' }}>West region declined 15% - requires immediate attention and root cause analysis</li>
          <li style={{ marginBottom: '8px' }}>Customer acquisition cost increased by $12, impacting overall margins</li>
        </ul>
        
        <p style={{ marginBottom: '16px' }}>
          <strong style={{ color: '#10b981' }}>Recommendations:</strong>
        </p>
        <ul style={{ marginLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Reallocate marketing budget to capitalize on North region momentum</li>
          <li style={{ marginBottom: '8px' }}>Conduct strategic review of West region operations</li>
          <li style={{ marginBottom: '8px' }}>Implement Q3-focused campaigns to maximize seasonal opportunity</li>
        </ul>
      </div>
    </div>
  );
};

// ========================================
// DATE RANGE FILTER COMPONENT
// ========================================
const DateRangeFilter = ({ onChange }) => {
  const [range, setRange] = useState('quarter');
  
  const ranges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'custom', label: 'Custom' }
  ];
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      <Calendar size={18} style={{ color: '#6b7280' }} />
      <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>Date Range:</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {ranges.map(r => (
          <button
            key={r.value}
            onClick={() => { setRange(r.value); onChange?.(r.value); }}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              background: range === r.value ? '#7c3aed' : 'white',
              color: range === r.value ? 'white' : '#6b7280',
              transition: 'all 0.15s ease'
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ========================================
// EXPORT OPTIONS MODAL
// ========================================
const ExportModal = ({ open, onClose, onExport, theme }) => {
  const [format, setFormat] = useState('pdf');
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [includeCover, setIncludeCover] = useState(true);
  const [includeTOC, setIncludeTOC] = useState(true);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  
  const formats = [
    { id: 'pdf', icon: FileText, label: 'PDF', desc: 'Best Quality' },
    { id: 'excel', icon: FileSpreadsheet, label: 'Excel', desc: 'Data + Charts' },
    { id: 'pptx', icon: Presentation, label: 'PowerPoint', desc: 'Slides Format' },
    { id: 'png', icon: FileImage, label: 'PNG', desc: 'Image Only' }
  ];
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: '500px' }}>
        <DialogHeader>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={20} />
            Export Report
          </DialogTitle>
        </DialogHeader>
        
        <div style={{ padding: '16px 0' }}>
          {/* Format Selection */}
          <Label style={{ marginBottom: '12px', display: 'block' }}>Choose Format:</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
            {formats.map(f => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                style={{
                  padding: '16px 8px',
                  borderRadius: '12px',
                  border: format === f.id ? `2px solid ${theme.primary}` : '2px solid #e5e7eb',
                  background: format === f.id ? `${theme.primary}10` : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <f.icon size={24} style={{ color: format === f.id ? theme.primary : '#6b7280' }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: format === f.id ? theme.primary : '#374151' }}>
                  {f.label}
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>{f.desc}</span>
              </button>
            ))}
          </div>
          
          {format === 'pdf' && (
            <>
              {/* PDF Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <Label style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Page Size</Label>
                  <Select value={pageSize} onValueChange={setPageSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Orientation</Label>
                  <Select value={orientation} onValueChange={setOrientation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={includeCover} 
                    onChange={(e) => setIncludeCover(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: theme.primary }}
                  />
                  <span style={{ fontSize: '13px', color: '#374151' }}>Include cover page</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={includeTOC} 
                    onChange={(e) => setIncludeTOC(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: theme.primary }}
                  />
                  <span style={{ fontSize: '13px', color: '#374151' }}>Include table of contents</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={usePassword} 
                    onChange={(e) => setUsePassword(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: theme.primary }}
                  />
                  <span style={{ fontSize: '13px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={14} /> Password protect
                  </span>
                </label>
              </div>
              
              {usePassword && (
                <Input 
                  type="password"
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ marginBottom: '16px' }}
                />
              )}
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => onExport({ format, pageSize, orientation, includeCover, includeTOC, password: usePassword ? password : null })}
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
          >
            <Download size={16} />
            Export Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ========================================
// SCHEDULE REPORT MODAL
// ========================================
const ScheduleModal = ({ open, onClose, onSchedule, theme }) => {
  const [recipients, setRecipients] = useState(['']);
  const [frequency, setFrequency] = useState('weekly');
  const [day, setDay] = useState('monday');
  const [time, setTime] = useState('09:00');
  const [subject, setSubject] = useState('Weekly Report - {{date}}');
  const [message, setMessage] = useState('Please find attached the latest report.');
  
  const addRecipient = () => setRecipients([...recipients, '']);
  const updateRecipient = (index, value) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };
  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: '500px' }}>
        <DialogHeader>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={20} />
            Schedule Report Delivery
          </DialogTitle>
        </DialogHeader>
        
        <div style={{ padding: '16px 0' }}>
          {/* Recipients */}
          <Label style={{ marginBottom: '8px', display: 'block' }}>Recipients:</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {recipients.map((email, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px' }}>
                <Input 
                  type="email"
                  placeholder="email@company.com"
                  value={email}
                  onChange={(e) => updateRecipient(index, e.target.value)}
                  style={{ flex: 1 }}
                />
                {recipients.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeRecipient(index)}>
                    <X size={16} />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRecipient} style={{ width: 'fit-content' }}>
              <Plus size={14} /> Add Recipient
            </Button>
          </div>
          
          {/* Frequency */}
          <Label style={{ marginBottom: '8px', display: 'block' }}>Frequency:</Label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {['daily', 'weekly', 'monthly', 'once'].map(f => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: frequency === f ? `2px solid ${theme.primary}` : '1px solid #e5e7eb',
                  background: frequency === f ? `${theme.primary}10` : 'white',
                  color: frequency === f ? theme.primary : '#6b7280',
                  fontWeight: '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {f}
              </button>
            ))}
          </div>
          
          {/* When */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {frequency === 'weekly' && (
              <div>
                <Label style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Day</Label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(d => (
                      <SelectItem key={d} value={d} style={{ textTransform: 'capitalize' }}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          
          {/* Subject */}
          <div style={{ marginBottom: '16px' }}>
            <Label style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Email Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          
          {/* Message */}
          <div>
            <Label style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Message</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => onSchedule({ recipients: recipients.filter(r => r), frequency, day, time, subject, message })}
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
          >
            <Clock size={16} />
            Schedule Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Export all components
export {
  CoverPageEditor,
  TableOfContents,
  Sparkline,
  TrendIndicator,
  StatusIndicator,
  EnhancedDataTable,
  ExecutiveSummary,
  DateRangeFilter,
  ExportModal,
  ScheduleModal
};
