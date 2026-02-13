import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart,
  BarChart3,
  LineChart,
  Plus,
  Trash2,
  Eye,
  Search,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useOrgStore, useAuthStore } from '../store';
import { toast } from 'sonner';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart as ReLineChart,
  Line,
  Area,
  AreaChart as ReAreaChart
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'area', label: 'Area Chart', icon: TrendingUp },
];

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function ChartsPage() {
  const navigate = useNavigate();
  const { currentOrg } = useOrgStore();
  const { token } = useAuthStore();
  const [charts, setCharts] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [newChart, setNewChart] = useState({
    name: '',
    type: 'bar',
    dataset_id: '',
    config: {
      x_field: '',
      y_field: '',
      aggregation: 'count'
    }
  });

  useEffect(() => {
    fetchData();
  }, [currentOrg]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const orgParam = currentOrg?.id ? `?org_id=${currentOrg.id}` : '';
      
      const [chartsRes, datasetsRes] = await Promise.all([
        axios.get(`${API_URL}/api/charts${orgParam}`, { headers }),
        axios.get(`${API_URL}/api/datasets${orgParam}`, { headers })
      ]);
      
      setCharts(chartsRes.data.charts || []);
      setDatasets(datasetsRes.data.datasets || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetSelect = async (datasetId) => {
    setNewChart({ ...newChart, dataset_id: datasetId });
    const dataset = datasets.find(d => d.id === datasetId);
    setSelectedDataset(dataset);
    
    // Get AI suggestions
    if (datasetId) {
      setAiSuggesting(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.post(`${API_URL}/api/ai/suggest-charts?dataset_id=${datasetId}`, {}, { headers });
        setSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error('Error getting suggestions:', error);
      } finally {
        setAiSuggesting(false);
      }
    }
  };

  const handleCreate = async () => {
    if (!newChart.name || !newChart.dataset_id) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/api/charts`, {
        ...newChart,
        org_id: currentOrg?.id
      }, { headers });
      
      toast.success('Chart created');
      setShowCreateDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to create chart');
    }
  };

  const handleDelete = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/charts/${id}`, { headers });
      toast.success('Chart deleted');
      setDeleteDialog(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete chart');
    }
  };

  const resetForm = () => {
    setNewChart({
      name: '',
      type: 'bar',
      dataset_id: '',
      config: { x_field: '', y_field: '', aggregation: 'count' }
    });
    setSelectedDataset(null);
    setSuggestions([]);
  };

  const applySuggestion = (suggestion) => {
    setNewChart({
      ...newChart,
      name: suggestion.title,
      type: suggestion.type,
      config: {
        x_field: suggestion.x_field,
        y_field: suggestion.y_field,
        aggregation: 'count'
      }
    });
  };

  const getChartIcon = (type) => {
    const chartType = CHART_TYPES.find(t => t.value === type);
    return chartType?.icon || BarChart3;
  };

  const filteredCharts = charts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="charts-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Charts</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage data visualizations
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-violet-600 hover:bg-violet-700"
            disabled={datasets.length === 0}
            data-testid="create-chart-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chart
          </Button>
        </div>

        {datasets.length === 0 && !loading && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">No datasets available</p>
                <p className="text-sm text-muted-foreground">
                  <button onClick={() => navigate('/upload')} className="text-violet-600 hover:underline">
                    Upload data
                  </button> first to create charts
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search charts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Charts Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <CardContent className="p-4">
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCharts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharts.map((chart, index) => {
              const Icon = getChartIcon(chart.type);
              return (
                <motion.div
                  key={chart.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all group">
                    {/* Chart Preview */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 flex items-center justify-center p-4">
                      <Icon className="w-16 h-16 text-violet-300 dark:text-violet-700" />
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{chart.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{chart.type}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteDialog(chart)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No charts yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first chart to visualize your data
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-violet-600 hover:bg-violet-700"
                disabled={datasets.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Chart
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Chart</DialogTitle>
              <DialogDescription>
                Create a new visualization from your data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Dataset *</Label>
                <Select
                  value={newChart.dataset_id}
                  onValueChange={handleDatasetSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id}>
                        {dataset.name} ({dataset.row_count} rows)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* AI Suggestions */}
              {selectedDataset && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <Label>AI Suggestions</Label>
                  </div>
                  {aiSuggesting ? (
                    <div className="text-sm text-muted-foreground">Analyzing data...</div>
                  ) : suggestions.length > 0 ? (
                    <div className="space-y-2">
                      {suggestions.slice(0, 3).map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => applySuggestion(suggestion)}
                          className="w-full text-left p-3 rounded-lg border hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                        >
                          <p className="font-medium text-foreground text-sm">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                          <Badge variant="secondary" className="mt-2">{suggestion.type}</Badge>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No suggestions available</div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Chart Name *</Label>
                <Input
                  value={newChart.name}
                  onChange={(e) => setNewChart({ ...newChart, name: e.target.value })}
                  placeholder="Sales by Region"
                  data-testid="chart-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Chart Type</Label>
                <Select
                  value={newChart.type}
                  onValueChange={(v) => setNewChart({ ...newChart, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDataset && (
                <>
                  <div className="space-y-2">
                    <Label>X-Axis Field</Label>
                    <Select
                      value={newChart.config.x_field}
                      onValueChange={(v) => setNewChart({
                        ...newChart,
                        config: { ...newChart.config, x_field: v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedDataset.columns?.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Y-Axis Field (optional)</Label>
                    <Select
                      value={newChart.config.y_field}
                      onValueChange={(v) => setNewChart({
                        ...newChart,
                        config: { ...newChart.config, y_field: v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Count</SelectItem>
                        {selectedDataset.columns?.filter(c => c.type.includes('int') || c.type.includes('float')).map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-violet-600 hover:bg-violet-700">
                  Create Chart
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Chart</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteDialog?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteDialog?.id)}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default ChartsPage;
