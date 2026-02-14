import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Download, Settings, Eye, Palette, GripVertical, Plus, Trash2, Type, BarChart3, Table, ChevronDown, Check, Maximize2, Minimize2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

const THEMES = [
  { id: 'blue_coral', name: 'Blue & Coral', primary: '#3B82F6', accent: '#EF4444' },
  { id: 'purple_teal', name: 'Purple & Teal', primary: '#8B5CF6', accent: '#14B8A6' },
  { id: 'green_orange', name: 'Green & Orange', primary: '#10B981', accent: '#F59E0B' },
  { id: 'slate_amber', name: 'Slate & Amber', primary: '#475569', accent: '#F59E0B' },
  { id: 'indigo_rose', name: 'Indigo & Rose', primary: '#6366F1', accent: '#F43F5E' },
  { id: 'cyan_pink', name: 'Cyan & Pink', primary: '#06B6D4', accent: '#EC4899' },
];

const SECTION_TYPES = [
  { id: 'intro', name: 'Introduction', icon: Type },
  { id: 'chart', name: 'Chart', icon: BarChart3 },
  { id: 'table', name: 'Data Table', icon: Table },
  { id: 'conclusion', name: 'Conclusion', icon: FileText },
];

// Draggable & Resizable Section Component
const DraggableSection = ({ section, index, onUpdate, onDelete, onResize, onDragStart, onDragOver, onDrop, isPreview, theme }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ w: 0, h: 0 });
  const sectionRef = useRef(null);

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ w: section.width || 100, h: section.height || 150 });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      const newWidth = Math.max(50, Math.min(100, startSize.w + (deltaX / 5)));
      const newHeight = Math.max(100, startSize.h + deltaY);
      
      onResize(index, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startPos, startSize, index, onResize]);

  const getSectionIcon = () => {
    const type = SECTION_TYPES.find(t => t.id === section.type);
    return type ? type.icon : FileText;
  };

  const Icon = getSectionIcon();
  const primaryColor = theme?.primary || '#3B82F6';
  const accentColor = theme?.accent || '#EF4444';

  return (
    <div
      ref={sectionRef}
      draggable={!isResizing}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      className="relative group bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all cursor-move"
      style={{
        width: `${section.width || 100}%`,
        minHeight: `${section.height || 150}px`,
      }}
      data-testid={`section-${section.id}`}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical size={16} className="text-gray-400" />
      </div>

      {/* Section Header */}
      <div 
        className="px-4 py-2 rounded-t-lg flex items-center justify-between"
        style={{ backgroundColor: section.type === 'chart' ? primaryColor : accentColor }}
      >
        <div className="flex items-center gap-2 text-white">
          <Icon size={16} />
          <span className="font-medium text-sm">{section.title || section.type}</span>
        </div>
        {!isPreview && (
          <button
            onClick={() => onDelete(index)}
            className="text-white/70 hover:text-white transition-colors"
            data-testid={`delete-section-${index}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Section Content */}
      <div className="p-4">
        {section.type === 'intro' || section.type === 'conclusion' ? (
          <textarea
            value={section.content || ''}
            onChange={(e) => onUpdate(index, { ...section, content: e.target.value })}
            placeholder={section.type === 'intro' ? 'Enter introduction text...' : 'Enter conclusion text...'}
            className="w-full h-20 p-2 border rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isPreview}
            data-testid={`section-content-${index}`}
          />
        ) : section.type === 'chart' ? (
          <div className="flex flex-col gap-2">
            <select
              value={section.chartId || ''}
              onChange={(e) => onUpdate(index, { ...section, chartId: e.target.value })}
              className="w-full p-2 border rounded-md text-sm"
              disabled={isPreview}
              data-testid={`chart-select-${index}`}
            >
              <option value="">Select a chart...</option>
              <option value="chart_1">Sales by Region</option>
              <option value="chart_2">Sales by Quarter</option>
            </select>
            {/* Chart Preview */}
            <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center border-2 border-dashed border-gray-200">
              <div className="flex gap-1 items-end">
                {[60, 80, 45, 70, 55].map((h, i) => (
                  <div
                    key={i}
                    className="w-6 rounded-t"
                    style={{ 
                      height: `${h}px`, 
                      backgroundColor: i % 2 === 0 ? primaryColor : accentColor 
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : section.type === 'table' ? (
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}>
              <div className="p-2">Category</div>
              <div className="p-2 text-right">Value</div>
              <div className="p-2 text-right">Share</div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`grid grid-cols-3 text-xs ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="p-2 text-gray-700">Category {i}</div>
                <div className="p-2 text-right text-gray-600">{(100 - i * 15).toLocaleString()}</div>
                <div className="p-2 text-right" style={{ color: accentColor }}>{35 - i * 5}%</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Resize Handle */}
      {!isPreview && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid={`resize-handle-${index}`}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
            <path d="M14 14H10L14 10V14ZM14 6V2H10L14 6ZM6 14H2V10L6 14Z" />
          </svg>
        </div>
      )}

      {/* Size indicator while resizing */}
      {isResizing && (
        <div className="absolute bottom-8 right-2 bg-black text-white text-xs px-2 py-1 rounded">
          {Math.round(section.width || 100)}% × {Math.round(section.height || 150)}px
        </div>
      )}
    </div>
  );
};

// Theme Selector Component
const ThemeSelector = ({ selectedTheme, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
        data-testid="theme-selector"
      >
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.primary }} />
          <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.accent }} />
        </div>
        <span className="text-sm font-medium">{theme.name}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border rounded-lg shadow-lg z-10">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onSelect(t.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
              data-testid={`theme-option-${t.id}`}
            >
              <div className="flex gap-1">
                <div className="w-5 h-5 rounded" style={{ backgroundColor: t.primary }} />
                <div className="w-5 h-5 rounded" style={{ backgroundColor: t.accent }} />
              </div>
              <span className="text-sm flex-1 text-left">{t.name}</span>
              {selectedTheme === t.id && <Check size={16} className="text-green-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ReportBuilderPage = () => {
  const [reportConfig, setReportConfig] = useState({
    title: 'Sales Performance Report',
    subtitle: 'Q1-Q2 2026 Regional Analysis',
    companyName: 'Acme Corporation',
    theme: 'blue_coral',
    includeDataTables: true,
    layoutStyle: 'two_column',
  });

  const [sections, setSections] = useState([
    { id: 'sec_1', type: 'intro', title: 'Introduction', content: 'This report analyzes sales performance across all regions.', width: 100, height: 120 },
    { id: 'sec_2', type: 'chart', title: 'Sales by Region', chartId: 'chart_1', width: 50, height: 200 },
    { id: 'sec_3', type: 'chart', title: 'Sales by Quarter', chartId: 'chart_2', width: 50, height: 200 },
    { id: 'sec_4', type: 'table', title: 'Data Summary', width: 100, height: 180 },
    { id: 'sec_5', type: 'conclusion', title: 'Conclusions', content: 'East region leads with 24% of total revenue.', width: 100, height: 120 },
  ]);

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const theme = THEMES.find(t => t.id === reportConfig.theme) || THEMES[0];

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newSections = [...sections];
    const [draggedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedItem);
    setSections(newSections);
    setDraggedIndex(null);
  };

  const handleUpdateSection = (index, updatedSection) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
  };

  const handleDeleteSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleResizeSection = (index, width, height) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], width, height };
    setSections(newSections);
  };

  const handleAddSection = (type) => {
    const newSection = {
      id: `sec_${Date.now()}`,
      type,
      title: SECTION_TYPES.find(t => t.id === type)?.name || 'New Section',
      content: '',
      width: type === 'chart' ? 50 : 100,
      height: type === 'chart' ? 200 : 150,
    };
    setSections([...sections, newSection]);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reports/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboard_id: '982f239e-9479-4394-b40b-2df615385eba',
          title: reportConfig.title,
          subtitle: reportConfig.subtitle,
          company_name: reportConfig.companyName,
          theme: reportConfig.theme,
          include_intro: sections.some(s => s.type === 'intro'),
          include_conclusions: sections.some(s => s.type === 'conclusion'),
          include_data_tables: reportConfig.includeDataTables,
          intro_text: sections.find(s => s.type === 'intro')?.content || '',
          conclusions_text: sections.find(s => s.type === 'conclusion')?.content || '',
          layout_style: reportConfig.layoutStyle,
        }),
      });

      const data = await response.json();
      if (data.pdf_base64) {
        // Download PDF
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${data.pdf_base64}`;
        link.download = data.filename || 'report.pdf';
        link.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen" data-testid="report-builder-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>
            <p className="text-gray-500 text-sm">Drag, drop, and resize sections to customize your report</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSelector
              selectedTheme={reportConfig.theme}
              onSelect={(theme) => setReportConfig({ ...reportConfig, theme })}
            />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              data-testid="settings-btn"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isPreview ? 'bg-blue-100 text-blue-700' : 'bg-white border hover:bg-gray-50'
              }`}
              data-testid="preview-btn"
            >
              <Eye size={18} />
              <span className="font-medium">{isPreview ? 'Edit Mode' : 'Preview'}</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              data-testid="export-btn"
            >
              <Download size={18} />
              <span className="font-medium">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-lg border p-4 mb-6" data-testid="settings-panel">
            <h3 className="font-semibold mb-4">Report Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                <input
                  type="text"
                  value={reportConfig.title}
                  onChange={(e) => setReportConfig({ ...reportConfig, title: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  data-testid="report-title-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={reportConfig.subtitle}
                  onChange={(e) => setReportConfig({ ...reportConfig, subtitle: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  data-testid="report-subtitle-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={reportConfig.companyName}
                  onChange={(e) => setReportConfig({ ...reportConfig, companyName: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  data-testid="company-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Layout Style</label>
                <select
                  value={reportConfig.layoutStyle}
                  onChange={(e) => setReportConfig({ ...reportConfig, layoutStyle: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  data-testid="layout-style-select"
                >
                  <option value="auto">Auto</option>
                  <option value="single_column">Single Column</option>
                  <option value="two_column">Two Column</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Add Section Toolbar */}
        {!isPreview && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-600">Add Section:</span>
            {SECTION_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleAddSection(type.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border rounded-md hover:bg-gray-50 transition-colors text-sm"
                data-testid={`add-${type.id}-btn`}
              >
                <type.icon size={14} />
                <span>{type.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Report Canvas */}
        <div 
          className="bg-white rounded-xl border-2 border-gray-200 p-6 min-h-[600px]"
          style={{ borderColor: theme.primary + '40' }}
          data-testid="report-canvas"
        >
          {/* Report Header Preview */}
          <div 
            className="rounded-t-lg p-4 mb-6 text-white"
            style={{ backgroundColor: theme.primary }}
          >
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <BarChart3 size={20} />
              <span className="font-medium">DataViz Studio</span>
            </div>
            <h2 className="text-2xl font-bold">{reportConfig.title}</h2>
            <p className="opacity-80">{reportConfig.subtitle}</p>
          </div>

          {/* Sections Grid */}
          <div className="flex flex-wrap gap-4">
            {sections.map((section, index) => (
              <DraggableSection
                key={section.id}
                section={section}
                index={index}
                onUpdate={handleUpdateSection}
                onDelete={handleDeleteSection}
                onResize={handleResizeSection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isPreview={isPreview}
                theme={theme}
              />
            ))}
          </div>

          {sections.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Plus size={48} className="mb-2" />
              <p>Add sections to build your report</p>
            </div>
          )}

          {/* Footer Preview */}
          <div 
            className="rounded-b-lg p-3 mt-6 flex items-center justify-between text-white text-sm"
            style={{ backgroundColor: theme.primary }}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={16} />
              <span className="font-medium">DataViz Studio</span>
            </div>
            <span>{reportConfig.companyName} | Page 1 | {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-sm text-gray-500">
          <p><strong>Tips:</strong> Drag sections to reorder • Drag corner to resize • Use 50% width for side-by-side charts</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportBuilderPage;
