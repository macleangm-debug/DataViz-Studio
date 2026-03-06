import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Table2,
  Hash,
  Type,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  ScatterChart,
  TrendingUp,
  Plus,
  X,
  GripVertical,
  ChevronRight,
  ChevronDown,
  Play,
  Save,
  RefreshCw,
  Sparkles,
  Filter,
  Layers,
  Eye,
  Settings,
  Download,
  ArrowLeftRight,
  MoveVertical,
  Sigma,
  Calculator,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuthStore } from '../store';
import { toast } from 'sonner';
import axios from 'axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
  ScatterChart as ReScatterChart,
  Scatter
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Item types for drag and drop
const ItemTypes = {
  FIELD: 'field',
  DROPPED_FIELD: 'dropped_field'
};

// Field type icons
const FIELD_TYPE_ICONS = {
  string: Type,
  text: Type,
  number: Hash,
  integer: Hash,
  float: Hash,
  date: Calendar,
  datetime: Calendar,
  boolean: Filter
};

// Color schemes for charts
const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

// Draggable Field Component
function DraggableField({ field, datasetName }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FIELD,
    item: { ...field, datasetName },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [field, datasetName]);

  const IconComponent = FIELD_TYPE_ICONS[field.type] || Type;
  const isNumeric = ['number', 'integer', 'float'].includes(field.type);

  return (
    <div
      ref={drag}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
        isDragging 
          ? 'opacity-50 bg-violet-500/30 border border-violet-500' 
          : 'bg-slate-800/50 hover:bg-slate-700/50 border border-transparent hover:border-slate-600'
      }`}
    >
      <IconComponent className={`w-3.5 h-3.5 ${isNumeric ? 'text-emerald-400' : 'text-blue-400'}`} />
      <span className="text-sm text-slate-200 truncate flex-1">{field.name}</span>
      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${isNumeric ? 'border-emerald-500/30 text-emerald-400' : 'border-blue-500/30 text-blue-400'}`}>
        {isNumeric ? 'Measure' : 'Dimension'}
      </Badge>
    </div>
  );
}

// Drop Zone Component
function DropZone({ label, icon: Icon, fields, onDrop, onRemove, accepts, placeholder }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.FIELD,
    drop: (item) => onDrop(item),
    canDrop: (item) => {
      if (!accepts) return true;
      const isNumeric = ['number', 'integer', 'float'].includes(item.type);
      if (accepts === 'dimension') return !isNumeric;
      if (accepts === 'measure') return isNumeric;
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [accepts, onDrop]);

  const getDropBorderColor = () => {
    if (isOver && canDrop) return 'border-violet-500 bg-violet-500/10';
    if (isOver && !canDrop) return 'border-red-500 bg-red-500/10';
    return 'border-dashed border-slate-600 hover:border-slate-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Icon className="w-4 h-4" />
        <span className="font-medium">{label}</span>
        {fields.length > 0 && (
          <Badge variant="secondary" className="text-[10px] h-4">{fields.length}</Badge>
        )}
      </div>
      <div
        ref={drop}
        className={`min-h-[80px] rounded-xl border-2 p-3 transition-all ${getDropBorderColor()}`}
      >
        {fields.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            {placeholder || `Drag ${label.toLowerCase()} here`}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {fields.map((field, index) => (
              <motion.div
                key={`${field.name}-${index}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/80 border border-slate-600"
              >
                <span className="text-sm text-slate-200">{field.name}</span>
                <button
                  onClick={() => onRemove(index)}
                  className="p-0.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Chart Preview Component
function ChartPreview({ chartType, data, xField, yFields, title }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <BarChart3 className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-sm">Add fields to generate chart</p>
      </div>
    );
  }

  const tooltipStyle = {
    contentStyle: { 
      backgroundColor: 'rgba(17, 17, 27, 0.95)', 
      border: '1px solid rgba(139, 92, 246, 0.3)',
      borderRadius: '8px',
      padding: '8px 12px'
    },
    labelStyle: { color: '#fff', fontWeight: 600 }
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <RechartsTooltip {...tooltipStyle} />
            <Legend />
            {yFields.map((field, i) => (
              <Bar key={field.name} dataKey={field.name} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      
      case 'line':
        return (
          <ReLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <RechartsTooltip {...tooltipStyle} />
            <Legend />
            {yFields.map((field, i) => (
              <Line key={field.name} type="monotone" dataKey={field.name} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.5} dot={{ r: 4 }} />
            ))}
          </ReLineChart>
        );
      
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <defs>
              {yFields.map((field, i) => (
                <linearGradient key={field.name} id={`gradient-${field.name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.05}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <RechartsTooltip {...tooltipStyle} />
            <Legend />
            {yFields.map((field, i) => (
              <Area key={field.name} type="monotone" dataKey={field.name} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={`url(#gradient-${field.name})`} />
            ))}
          </AreaChart>
        );
      
      case 'pie':
        const pieData = data.slice(0, 8).map((d, i) => ({
          name: d.name,
          value: yFields[0] ? d[yFields[0].name] : 0
        }));
        return (
          <RePieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip {...tooltipStyle} />
            <Legend />
          </RePieChart>
        );
      
      case 'scatter':
        return (
          <ReScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" dataKey="x" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} name={xField?.name || 'X'} />
            <YAxis type="number" dataKey="y" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} name={yFields[0]?.name || 'Y'} />
            <RechartsTooltip {...tooltipStyle} />
            <Scatter data={data.map((d, i) => ({ x: i, y: yFields[0] ? d[yFields[0].name] : 0 }))} fill={CHART_COLORS[0]} />
          </ReScatterChart>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

// Main Data Explorer Component
function DataExplorerContent() {
  const { token } = useAuthStore();
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [datasetFields, setDatasetFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedDatasets, setExpandedDatasets] = useState({});
  
  // Drag & Drop state
  const [rowsFields, setRowsFields] = useState([]);
  const [columnsFields, setColumnsFields] = useState([]);
  const [valuesFields, setValuesFields] = useState([]);
  const [filtersFields, setFiltersFields] = useState([]);
  
  // Chart state
  const [chartType, setChartType] = useState('bar');
  const [chartData, setChartData] = useState([]);
  const [chartTitle, setChartTitle] = useState('Untitled Chart');
  
  // Aggregation
  const [aggregation, setAggregation] = useState('sum');

  // Fetch datasets on mount
  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/datasets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const datasetsData = response.data?.datasets || response.data || [];
      setDatasets(datasetsData);
      
      // Auto-select first dataset if available
      if (datasetsData.length > 0) {
        await selectDataset(datasetsData[0]);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const selectDataset = async (dataset) => {
    setSelectedDataset(dataset);
    setExpandedDatasets(prev => ({ ...prev, [dataset.id]: true }));
    
    // Generate fields from columns (API uses 'columns' not 'schema')
    const columns = dataset.columns || dataset.schema || [];
    if (columns.length > 0) {
      const fields = columns.map(col => ({
        name: col.name,
        type: col.type || 'string',
        datasetId: dataset.id
      }));
      setDatasetFields(fields);
    }
  };

  const toggleDatasetExpanded = (datasetId) => {
    setExpandedDatasets(prev => ({ ...prev, [datasetId]: !prev[datasetId] }));
  };

  // Handle field drops
  const handleRowsDrop = (field) => {
    if (!rowsFields.find(f => f.name === field.name)) {
      setRowsFields(prev => [...prev, field]);
    }
  };

  const handleColumnsDrop = (field) => {
    if (!columnsFields.find(f => f.name === field.name)) {
      setColumnsFields(prev => [...prev, field]);
    }
  };

  const handleValuesDrop = (field) => {
    if (!valuesFields.find(f => f.name === field.name)) {
      setValuesFields(prev => [...prev, field]);
    }
  };

  const handleFiltersDrop = (field) => {
    if (!filtersFields.find(f => f.name === field.name)) {
      setFiltersFields(prev => [...prev, field]);
    }
  };

  // Generate chart data
  const generateChart = async () => {
    if (!selectedDataset || rowsFields.length === 0) {
      toast.error('Please select a dataset and add at least one row field');
      return;
    }

    setGenerating(true);
    try {
      // Fetch dataset data
      const response = await axios.get(`${API_URL}/api/datasets/${selectedDataset.id}/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const rawData = response.data?.data || [];
      
      if (rawData.length === 0) {
        toast.error('Dataset has no data');
        setGenerating(false);
        return;
      }

      // Process data for chart
      const xFieldName = rowsFields[0]?.name;
      const yFieldNames = valuesFields.map(f => f.name);
      
      if (yFieldNames.length === 0) {
        // If no values, count occurrences
        const grouped = {};
        rawData.forEach(row => {
          const key = row[xFieldName] || 'Unknown';
          grouped[key] = (grouped[key] || 0) + 1;
        });
        
        const processedData = Object.entries(grouped).map(([name, count]) => ({
          name,
          count
        }));
        
        setChartData(processedData);
        setValuesFields([{ name: 'count', type: 'number' }]);
      } else {
        // Aggregate by x field
        const grouped = {};
        rawData.forEach(row => {
          const key = row[xFieldName] || 'Unknown';
          if (!grouped[key]) {
            grouped[key] = { name: key };
            yFieldNames.forEach(y => grouped[key][y] = []);
          }
          yFieldNames.forEach(y => {
            const val = parseFloat(row[y]) || 0;
            grouped[key][y].push(val);
          });
        });
        
        // Apply aggregation
        const processedData = Object.values(grouped).map(group => {
          const result = { name: group.name };
          yFieldNames.forEach(y => {
            const values = group[y];
            switch (aggregation) {
              case 'sum':
                result[y] = values.reduce((a, b) => a + b, 0);
                break;
              case 'avg':
                result[y] = values.reduce((a, b) => a + b, 0) / values.length;
                break;
              case 'count':
                result[y] = values.length;
                break;
              case 'min':
                result[y] = Math.min(...values);
                break;
              case 'max':
                result[y] = Math.max(...values);
                break;
              default:
                result[y] = values.reduce((a, b) => a + b, 0);
            }
          });
          return result;
        });
        
        setChartData(processedData);
      }
      
      toast.success('Chart generated!');
    } catch (error) {
      console.error('Error generating chart:', error);
      toast.error('Failed to generate chart');
    } finally {
      setGenerating(false);
    }
  };

  // Save chart to Charts page
  const saveChart = async () => {
    if (chartData.length === 0) {
      toast.error('Generate a chart first');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/charts`, {
        name: chartTitle,
        type: chartType,
        dataset_id: selectedDataset.id,
        config: {
          x_field: rowsFields[0]?.name,
          y_field: valuesFields[0]?.name,
          aggregation,
          chart_type: chartType
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Chart saved!');
    } catch (error) {
      console.error('Error saving chart:', error);
      toast.error('Failed to save chart');
    }
  };

  // Clear all fields
  const clearAll = () => {
    setRowsFields([]);
    setColumnsFields([]);
    setValuesFields([]);
    setFiltersFields([]);
    setChartData([]);
  };

  const CHART_TYPES = [
    { id: 'bar', label: 'Bar', icon: BarChart3 },
    { id: 'line', label: 'Line', icon: LineChart },
    { id: 'area', label: 'Area', icon: TrendingUp },
    { id: 'pie', label: 'Pie', icon: PieChart },
    { id: 'scatter', label: 'Scatter', icon: ScatterChart }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-[calc(100vh-120px)] gap-4">
        {/* Left Panel - Fields */}
        <div className="w-72 flex-shrink-0">
          <Card className="h-full bg-slate-900/50 border-slate-800">
            <CardHeader className="py-3 px-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="w-4 h-4 text-violet-400" />
                  Fields
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchDatasets}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="p-3 space-y-3">
                {datasets.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No datasets found</p>
                    <p className="text-xs mt-1">Upload data to get started</p>
                  </div>
                ) : (
                  datasets.map(dataset => (
                    <div key={dataset.id} className="space-y-2">
                      <button
                        onClick={() => {
                          toggleDatasetExpanded(dataset.id);
                          if (!expandedDatasets[dataset.id]) {
                            selectDataset(dataset);
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                          selectedDataset?.id === dataset.id 
                            ? 'bg-violet-500/20 border border-violet-500/30' 
                            : 'bg-slate-800/50 hover:bg-slate-700/50 border border-transparent'
                        }`}
                      >
                        {expandedDatasets[dataset.id] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <Table2 className="w-4 h-4 text-violet-400" />
                        <span className="text-sm text-slate-200 truncate flex-1 text-left">{dataset.name}</span>
                        <Badge variant="outline" className="text-[9px] h-4">
                          {(dataset.columns || dataset.schema || []).length}
                        </Badge>
                      </button>
                      
                      <AnimatePresence>
                        {expandedDatasets[dataset.id] && selectedDataset?.id === dataset.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pl-4 space-y-1.5 overflow-hidden"
                          >
                            {datasetFields.map((field, i) => (
                              <DraggableField key={`${field.name}-${i}`} field={field} datasetName={dataset.name} />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Drop Zones */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="py-3 px-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  Build Chart
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={generateChart} 
                    disabled={generating || rowsFields.length === 0}
                    className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
                  >
                    {generating ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 mr-1" />
                    )}
                    Generate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <DropZone
                  label="Rows (X-Axis)"
                  icon={ArrowLeftRight}
                  fields={rowsFields}
                  onDrop={handleRowsDrop}
                  onRemove={(i) => setRowsFields(prev => prev.filter((_, idx) => idx !== i))}
                  accepts="dimension"
                  placeholder="Drag dimension fields"
                />
                <DropZone
                  label="Values (Y-Axis)"
                  icon={Sigma}
                  fields={valuesFields}
                  onDrop={handleValuesDrop}
                  onRemove={(i) => setValuesFields(prev => prev.filter((_, idx) => idx !== i))}
                  accepts="measure"
                  placeholder="Drag measure fields"
                />
              </div>
              
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-400">Aggregation:</Label>
                  <Select value={aggregation} onValueChange={setAggregation}>
                    <SelectTrigger className="h-8 w-[100px] text-xs bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="min">Min</SelectItem>
                      <SelectItem value="max">Max</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-400">Chart Type:</Label>
                  <div className="flex gap-1">
                    {CHART_TYPES.map(type => (
                      <TooltipProvider key={type.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={chartType === type.id ? 'secondary' : 'ghost'}
                              size="icon"
                              className={`h-8 w-8 ${chartType === type.id ? 'bg-violet-500/20 text-violet-400' : ''}`}
                              onClick={() => setChartType(type.id)}
                            >
                              <type.icon className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="text-xs">{type.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart Preview */}
          <Card className="flex-1 bg-slate-900/50 border-slate-800 min-h-[400px]">
            <CardHeader className="py-3 px-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4 text-violet-400" />
                    Preview
                  </CardTitle>
                  <Input
                    value={chartTitle}
                    onChange={(e) => setChartTitle(e.target.value)}
                    className="h-7 w-48 text-sm bg-slate-800/50 border-slate-700"
                    placeholder="Chart title..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={saveChart}>
                    <Save className="w-3 h-3 mr-1" />
                    Save Chart
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 h-[calc(100%-60px)]">
              <ChartPreview
                chartType={chartType}
                data={chartData}
                xField={rowsFields[0]}
                yFields={valuesFields.length > 0 ? valuesFields : [{ name: 'count' }]}
                title={chartTitle}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DndProvider>
  );
}

// Export with layout
export function DataExplorerPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Data Explorer</h1>
          <p className="text-muted-foreground mt-1">Drag and drop fields to create visualizations</p>
        </div>
        <DataExplorerContent />
      </div>
    </DashboardLayout>
  );
}

export default DataExplorerPage;
