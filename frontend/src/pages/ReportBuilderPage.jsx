import React, { useState, useRef, useCallback } from 'react';
import { 
  FileText, Download, Settings, Eye, Plus, PieChart, RefreshCw, X, Maximize2,
  Upload, Image, FileSpreadsheet, FileImage, ChevronDown, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../layouts/DashboardLayout';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';

// Import refactored components
import { 
  ThemeSelector, 
  THEMES, 
  ReportSection, 
  SECTION_TYPES,
  AddSectionPanel 
} from '../components/report';

// ========================================
// MAIN COMPONENT
// ========================================

const ReportBuilderPage = () => {
  // Report configuration state
  const [reportConfig, setReportConfig] = useState({
    title: 'Survey Results Infographics',
    subtitle: 'Comprehensive Analysis Report',
    companyName: '',
    theme: 'blue_coral',
    reportDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    // Cover Page settings
    showCoverPage: false,
    coverPageLogo: null, // base64 image data
    coverPageLogoName: '',
    authorName: '',
    confidentialityLevel: 'Internal',
  });
  
  // Sections state
  const [sections, setSections] = useState([
    { 
      id: 'sec_1', 
      type: 'stat_cards', 
      title: 'Key Metrics',
      width: 100,
      stats: [
        { value: '44%', label: 'Mercury is the closest planet to the Sun', iconType: 'percent' },
        { value: '32%', label: 'Despite being red, Mars is a cold place', iconType: 'trending' },
        { value: '21%', label: 'Neptune is the farthest planet from the Sun', iconType: 'users' },
        { value: '72%', label: 'Jupiter is the biggest planet of them all', iconType: 'cart' },
      ]
    },
    { id: 'sec_2', type: 'bar_chart', title: 'Revenue by Quarter', width: 50 },
    { id: 'sec_3', type: 'data_table', title: 'Regional Breakdown', width: 50 },
    { id: 'sec_4', type: 'intro', title: 'Introduction', content: '', width: 100 },
    { id: 'sec_5', type: 'pie_chart', title: 'Market Share', width: 50 },
    { id: 'sec_6', type: 'line_chart', title: 'Growth Trend', width: 50 },
    { id: 'sec_7', type: 'conclusion', title: 'Conclusions', content: '', width: 100 },
  ]);
  
  // UI state
  const [isPreview, setIsPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [customColors, setCustomColors] = useState({ primary: '#3B82F6', accent: '#EF4444' });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const logoInputRef = useRef(null);
  
  // Handle logo upload
  const handleLogoUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setReportConfig(prev => ({
        ...prev,
        coverPageLogo: e.target.result,
        coverPageLogoName: file.name
      }));
      toast.success('Logo uploaded successfully');
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  }, []);
  
  // Remove logo
  const handleRemoveLogo = useCallback(() => {
    setReportConfig(prev => ({
      ...prev,
      coverPageLogo: null,
      coverPageLogoName: ''
    }));
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  }, []);
  
  // Helper to generate lighter shade
  const getLighterHex = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lighter = (c) => Math.round(c + (255 - c) * (1 - opacity));
    return `#${lighter(r).toString(16).padStart(2, '0')}${lighter(g).toString(16).padStart(2, '0')}${lighter(b).toString(16).padStart(2, '0')}`;
  };
  
  // Get current theme (supports custom colors)
  const theme = reportConfig.theme === 'custom' 
    ? { 
        id: 'custom', 
        name: 'Custom', 
        primary: customColors.primary, 
        accent: customColors.accent,
        secondary: getLighterHex(customColors.primary, 0.7),
        light: getLighterHex(customColors.primary, 0.15)
      }
    : (THEMES.find(t => t.id === reportConfig.theme) || THEMES[0]);
  
  // Section management functions
  const handleUpdateSection = (index, updatedSection) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
  };
  
  const handleDeleteSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };
  
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    setSections(newSections);
  };
  
  const handleMoveDown = (index) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setSections(newSections);
  };
  
  // Resize section width handler
  const handleResizeWidth = (index, newWidth) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      width: newWidth
    };
    setSections(newSections);
  };
  
  const handleAddSection = (type) => {
    const sectionInfo = SECTION_TYPES.find(t => t.id === type);
    const newSection = {
      id: `sec_${Date.now()}`,
      type,
      title: sectionInfo?.name || 'New Section',
      width: ['bar_chart', 'pie_chart', 'line_chart', 'data_table'].includes(type) ? 50 : 100,
      content: '',
      stats: type === 'stat_cards' ? [
        { value: '25%', label: 'Enter description', iconType: 'percent' },
        { value: '50%', label: 'Enter description', iconType: 'trending' },
        { value: '75%', label: 'Enter description', iconType: 'users' },
        { value: '100%', label: 'Enter description', iconType: 'cart' },
      ] : undefined,
    };
    setSections([...sections, newSection]);
  };
  
  // Reference for the report canvas
  const reportCanvasRef = useRef(null);
  
  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 }; // Default blue
  };

  // Export PDF using client-side generation with proper multi-page support
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const reportElement = reportCanvasRef.current;
      if (!reportElement) {
        toast.error('Report canvas not found');
        setIsExporting(false);
        return;
      }
      
      // Switch to preview mode for clean export
      const wasInEditMode = !isPreview;
      if (wasInEditMode) {
        setIsPreview(true);
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pdfWidth - (margin * 2);
      const usableHeight = pdfHeight - (margin * 2);
      const footerHeight = 15;
      const contentHeight = usableHeight - footerHeight;
      
      // Get theme colors as RGB
      const primaryRgb = hexToRgb(theme.primary);
      
      // Capture the full report as canvas with optimized settings for PDF
      const canvas = await html2canvas(reportElement, {
        scale: 2.5, // Good balance between quality and performance
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 850, // Slightly narrower to ensure all content fits
        imageTimeout: 0,
        removeContainer: true,
        allowTaint: true,
        // Ensure proper rendering in cloned document
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-testid="report-preview-content"]');
          if (clonedElement) {
            clonedElement.style.width = '850px';
            clonedElement.style.maxWidth = '850px';
            clonedElement.style.overflow = 'visible';
            
            // Force stat cards to 2-column layout for PDF
            const statGrids = clonedElement.querySelectorAll('.stat-cards-grid');
            statGrids.forEach(grid => {
              grid.style.display = 'grid';
              grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
              grid.style.gap = '16px';
            });
            
            // Add print-specific styles
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important;
                box-sizing: border-box !important;
              }
              .rounded-xl, .rounded-2xl, .rounded-lg { border-radius: 12px !important; }
              svg { shape-rendering: geometricPrecision; }
              .stat-cards-grid { 
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 16px !important;
              }
              [data-testid^="stat-card-"] {
                min-width: 0 !important;
                overflow: hidden !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0); // Use PNG for better quality
      
      // Calculate how the image maps to PDF pages
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;
      
      // Check if we need multiple pages
      const totalPages = Math.max(1, Math.ceil(imgHeight / contentHeight));
      
      if (imgHeight <= contentHeight) {
        // Single page - simple case
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        addFooter(pdf, pdfWidth, pdfHeight, margin, 1, totalPages, primaryRgb);
      } else {
        // Multi-page handling
        const pixelsPerPage = (contentHeight / imgHeight) * canvas.height;
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
          }
          
          const sourceY = page * pixelsPerPage;
          const sourceHeight = Math.min(pixelsPerPage, canvas.height - sourceY);
          const destHeight = (sourceHeight / canvas.height) * imgHeight;
          
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const ctx = pageCanvas.getContext('2d');
          
          // Fill with white background first
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          
          let yOffset = margin;
          if (page > 0) {
            // Add continuation header with proper styling
            pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            pdf.rect(margin, margin, usableWidth, 10, 'F');
            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            pdf.text(`${reportConfig.title} (continued)`, margin + 4, margin + 7);
            yOffset = margin + 12;
          }
          
          pdf.addImage(pageImgData, 'PNG', margin, yOffset, imgWidth, destHeight);
          addFooter(pdf, pdfWidth, pdfHeight, margin, page + 1, totalPages, primaryRgb);
        }
      }
      
      function addFooter(pdfDoc, width, height, m, currentPage, totalPgs, rgb) {
        const footerY = height - m;
        
        // Footer background bar
        pdfDoc.setFillColor(rgb.r, rgb.g, rgb.b);
        pdfDoc.rect(m, footerY - 10, usableWidth, 10, 'F');
        
        // DataViz Studio logo (text-based for reliability)
        pdfDoc.setFontSize(10);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.text('DataViz Studio', m + 4, footerY - 3.5);
        
        // Page number - prominent styling
        pdfDoc.setFontSize(9);
        pdfDoc.setFont('helvetica', 'normal');
        const pageText = `Page ${currentPage} of ${totalPgs}`;
        const pageTextWidth = pdfDoc.getTextWidth(pageText);
        pdfDoc.text(pageText, width - m - pageTextWidth - 4, footerY - 3.5);
        
        // Date in center
        pdfDoc.setFontSize(8);
        const dateText = reportConfig.reportDate;
        const dateTextWidth = pdfDoc.getTextWidth(dateText);
        pdfDoc.text(dateText, (width - dateTextWidth) / 2, footerY - 3.5);
      }
      
      const fileName = `${reportConfig.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      if (wasInEditMode) {
        setIsPreview(false);
      }
      
      toast.success(`Report exported successfully! (${totalPages} page${totalPages > 1 ? 's' : ''})`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Export as PNG image
  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const reportElement = reportCanvasRef.current;
      if (!reportElement) {
        toast.error('Report canvas not found');
        setIsExporting(false);
        return;
      }
      
      // Switch to preview mode for clean export
      const wasInEditMode = !isPreview;
      if (wasInEditMode) {
        setIsPreview(true);
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      // Capture the full report as canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
      });
      
      // Convert to PNG and download
      const link = document.createElement('a');
      link.download = `${reportConfig.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      if (wasInEditMode) {
        setIsPreview(false);
      }
      
      toast.success('Report exported as PNG successfully!');
    } catch (error) {
      console.error('PNG export failed:', error);
      toast.error('Failed to export PNG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Export as Excel with report data
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Report Info sheet
      const reportInfo = [
        ['Report Title', reportConfig.title],
        ['Subtitle', reportConfig.subtitle],
        ['Company', reportConfig.companyName || 'N/A'],
        ['Generated Date', reportConfig.reportDate],
        ['Total Sections', sections.length],
        [''],
        ['Generated by', 'DataViz Studio'],
      ];
      const infoSheet = XLSX.utils.aoa_to_sheet(reportInfo);
      XLSX.utils.book_append_sheet(workbook, infoSheet, 'Report Info');
      
      // Process each section
      sections.forEach((section, idx) => {
        let sheetData = [];
        const sheetName = `${idx + 1}-${section.title.substring(0, 25).replace(/[^a-z0-9 ]/gi, '')}`;
        
        switch (section.type) {
          case 'stat_cards':
            sheetData = [
              ['Key Metrics'],
              [''],
              ['Metric', 'Value', 'Description'],
              ...(section.stats || []).map(stat => ['', stat.value, stat.label])
            ];
            break;
          case 'data_table':
            sheetData = [
              [section.title],
              [''],
              ['Category', 'Value', 'Share'],
              ['North Region', '245,000', '32%'],
              ['South Region', '189,000', '24%'],
              ['East Region', '156,000', '21%'],
              ['West Region', '178,000', '23%'],
            ];
            break;
          case 'bar_chart':
            sheetData = [
              [section.title],
              [''],
              ['Quarter', 'Revenue'],
              ['Q1', '120,000'],
              ['Q2', '180,000'],
              ['Q3', '95,000'],
              ['Q4', '165,000'],
              ['Q5', '145,000'],
            ];
            break;
          case 'pie_chart':
            sheetData = [
              [section.title],
              [''],
              ['Category', 'Percentage'],
              ['Primary', '60%'],
              ['Secondary', '25%'],
              ['Other', '15%'],
            ];
            break;
          case 'line_chart':
            sheetData = [
              [section.title],
              [''],
              ['Period', 'Value'],
              ['Jan', '100'],
              ['Feb', '120'],
              ['Mar', '95'],
              ['Apr', '140'],
              ['May', '160'],
              ['Jun', '155'],
            ];
            break;
          case 'intro':
          case 'conclusion':
          case 'text_block':
            sheetData = [
              [section.title],
              [''],
              [section.content || 'No content provided'],
            ];
            break;
          default:
            sheetData = [[section.title], [''], ['Content not available for this section type']];
        }
        
        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        // Set column widths
        sheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName.trim());
      });
      
      // Generate and download
      const fileName = `${reportConfig.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success('Report exported as Excel successfully!');
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error('Failed to export Excel. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50" data-testid="report-builder-page">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>
              <p className="text-gray-500 text-sm">Design professional infographic-style reports</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSelector
                selectedTheme={reportConfig.theme}
                onSelect={(t) => setReportConfig({ ...reportConfig, theme: t })}
                customColors={customColors}
                onCustomColorsChange={setCustomColors}
              />
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-100 text-blue-600' : 'bg-white border hover:bg-gray-50'}`}
                data-testid="settings-btn"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isPreview ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50 text-gray-700'
                }`}
                data-testid="preview-btn"
              >
                <Eye size={18} />
                <span className="font-medium">{isPreview ? 'Edit Mode' : 'Preview'}</span>
              </button>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                data-testid="fullscreen-preview-btn"
              >
                <Maximize2 size={18} />
                <span className="font-medium">Full Preview</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-md"
                data-testid="export-btn"
              >
                {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                <span className="font-medium">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl border shadow-sm mb-6 overflow-hidden"
                data-testid="settings-panel"
              >
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Report Header Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                      <input
                        type="text"
                        value={reportConfig.title}
                        onChange={(e) => setReportConfig({ ...reportConfig, title: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter report title"
                        data-testid="report-title-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={reportConfig.subtitle}
                        onChange={(e) => setReportConfig({ ...reportConfig, subtitle: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter subtitle"
                        data-testid="report-subtitle-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (Optional)</label>
                      <input
                        type="text"
                        value={reportConfig.companyName}
                        onChange={(e) => setReportConfig({ ...reportConfig, companyName: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your company name"
                        data-testid="company-name-input"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Report Preview Canvas */}
          <div 
            ref={reportCanvasRef}
            className="bg-white overflow-hidden"
            style={{ 
              borderColor: theme.primary + '30',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
            }}
            data-testid="report-canvas"
          >
            {/* Inner container for PDF capture */}
            <div data-testid="report-preview-content" style={{ backgroundColor: '#ffffff' }}>
            {/* Report Header */}
            <div 
              className="p-8 text-white relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}ee 40%, ${theme.accent}cc 100%)` 
              }}
            >
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div 
                  className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
                  style={{ background: `radial-gradient(circle, white 0%, transparent 70%)` }}
                />
                <div 
                  className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full opacity-10"
                  style={{ background: `radial-gradient(circle, white 0%, transparent 70%)` }}
                />
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <pattern id="headerGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                        <circle cx="4" cy="4" r="0.5" fill="white"/>
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#headerGrid)" />
                  </svg>
                </div>
              </div>
              
              <div className="relative z-10">
                {/* Company Logo/Name (if provided) */}
                {reportConfig.companyName && (
                  <div className="mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                      <span className="font-bold text-lg">{reportConfig.companyName.charAt(0)}</span>
                    </div>
                    <span className="text-white/80 text-sm font-medium tracking-wide">{reportConfig.companyName}</span>
                  </div>
                )}
                
                {/* Main Title */}
                <h2 className="text-4xl font-bold mb-3 tracking-tight">
                  {reportConfig.title || 'Report Title'}
                </h2>
                <p className="text-xl opacity-90 font-light">
                  {reportConfig.subtitle || 'Report Subtitle'}
                </p>
                
                {/* Report Meta */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <span className="text-sm text-white/80">{reportConfig.reportDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <span className="text-sm text-white/80">{sections.length} Sections</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Report Body */}
            <div className="p-6" style={{ overflow: 'visible' }}>
              <div className="flex flex-wrap gap-4" style={{ overflow: 'visible' }}>
                <AnimatePresence>
                  {sections.map((section, index) => (
                    <ReportSection
                      key={section.id}
                      section={section}
                      index={index}
                      theme={theme}
                      isPreview={isPreview}
                      onUpdate={handleUpdateSection}
                      onDelete={handleDeleteSection}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onResizeWidth={handleResizeWidth}
                      totalSections={sections.length}
                    />
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Add Section Panel (only in edit mode) */}
              {!isPreview && (
                <div className="mt-6">
                  <AddSectionPanel onAdd={handleAddSection} theme={theme} />
                </div>
              )}
              
              {sections.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Plus size={48} className="mb-3" />
                  <p className="text-lg">Add sections to build your report</p>
                  <p className="text-sm">Click on a section type above to get started</p>
                </div>
              )}
            </div>
            
            {/* Report Footer */}
            <div 
              className="px-8 py-6 flex items-center justify-between relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}dd 50%, ${theme.accent}99 100%)` 
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                  <rect width="100" height="100" fill="url(#grid)" />
                </svg>
              </div>
              
              {/* DataViz Logo */}
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                </div>
                <div>
                  <span className="font-bold text-xl text-white tracking-tight">DataViz</span>
                  <span className="font-bold text-xl text-white/80 tracking-tight ml-1">Studio</span>
                </div>
              </div>
              
              {/* Report Date */}
              <div className="flex flex-col items-end relative z-10">
                <span className="text-white/70 text-xs uppercase tracking-wider">Generated</span>
                <span className="text-white font-medium">{reportConfig.reportDate}</span>
              </div>
            </div>
            </div>{/* End inner container for PDF capture */}
          </div>
          
          {/* Help Text */}
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>
              <strong>Tips:</strong> Drag the edge handle to resize sections • 
              Use the width dropdown for precise control (25%, 50%, 75%, 100%) • 
              Use arrow buttons to reorder • 
              Click Preview to see final result
            </p>
          </div>
        </div>
      </div>
      
      {/* Full Screen Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden p-0 bg-gray-100">
          <DialogHeader className="p-4 bg-white border-b sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-gray-900">
                Report Preview - {reportConfig.title}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleExportPDF();
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  data-testid="modal-export-btn"
                >
                  <Download size={16} />
                  Export PDF
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Preview Header */}
              <div 
                className="p-8 text-white relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}ee 40%, ${theme.accent}cc 100%)` 
                }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <div 
                    className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
                    style={{ background: `radial-gradient(circle, white 0%, transparent 70%)` }}
                  />
                  <div 
                    className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full opacity-10"
                    style={{ background: `radial-gradient(circle, white 0%, transparent 70%)` }}
                  />
                </div>
                
                <div className="relative z-10">
                  {reportConfig.companyName && (
                    <div className="mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                        <span className="font-bold text-lg">{reportConfig.companyName.charAt(0)}</span>
                      </div>
                      <span className="text-white/80 text-sm font-medium">{reportConfig.companyName}</span>
                    </div>
                  )}
                  <h2 className="text-4xl font-bold mb-3 tracking-tight">{reportConfig.title}</h2>
                  <p className="text-xl opacity-90 font-light">{reportConfig.subtitle}</p>
                  <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/20">
                    <span className="text-sm text-white/80">{reportConfig.reportDate}</span>
                    <span className="text-sm text-white/80">•</span>
                    <span className="text-sm text-white/80">{sections.length} Sections</span>
                  </div>
                </div>
              </div>
              
              {/* Preview Body */}
              <div className="p-6">
                <div className="flex flex-wrap gap-4">
                  {sections.map((section, index) => (
                    <ReportSection
                      key={section.id}
                      section={section}
                      index={index}
                      theme={theme}
                      isPreview={true}
                      onUpdate={() => {}}
                      onDelete={() => {}}
                      onMoveUp={() => {}}
                      onMoveDown={() => {}}
                      onResizeWidth={() => {}}
                      totalSections={sections.length}
                    />
                  ))}
                </div>
              </div>
              
              {/* Preview Footer */}
              <div 
                className="px-8 py-6 flex items-center justify-between relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}dd 50%, ${theme.accent}99 100%)` 
                }}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="9" rx="1" />
                      <rect x="14" y="3" width="7" height="5" rx="1" />
                      <rect x="14" y="12" width="7" height="9" rx="1" />
                      <rect x="3" y="16" width="7" height="5" rx="1" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-xl text-white tracking-tight">DataViz</span>
                    <span className="font-bold text-xl text-white/80 tracking-tight ml-1">Studio</span>
                  </div>
                </div>
                <div className="flex flex-col items-end relative z-10">
                  <span className="text-white/70 text-xs uppercase tracking-wider">Generated</span>
                  <span className="text-white font-medium">{reportConfig.reportDate}</span>
                </div>
              </div>
            </div>
            
            {/* Print Notice */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>This is how your report will appear when exported to PDF.</p>
              <p className="mt-1 text-xs text-gray-400">Click "Export PDF" to download the final document.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ReportBuilderPage;
