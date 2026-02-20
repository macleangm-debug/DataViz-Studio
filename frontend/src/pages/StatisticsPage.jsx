import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Database,
  Hash,
  Type,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  ArrowUpDown,
  Percent,
  Calculator,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Skeleton } from '../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuthStore } from '../store';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${useAuthStore.getState().token}`,
  'Content-Type': 'application/json'
});

// Stat card component for overview metrics
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden"
  >
    <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-barlow font-bold text-white">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

// Column statistics card
const ColumnStatCard = ({ column, stats, index }) => {
  const isNumeric = ['int64', 'float64', 'int', 'float'].some(t => stats.type?.includes(t));
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isNumeric ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {isNumeric ? <Hash className="w-5 h-5" /> : <Type className="w-5 h-5" />}
              </div>
              <div>
                <CardTitle className="text-lg font-barlow text-white">{column}</CardTitle>
                <CardDescription className="text-xs">
                  {isNumeric ? 'Numeric' : 'Categorical'} • {stats.type}
                </CardDescription>
              </div>
            </div>
            <Badge variant={stats.missing === 0 ? 'default' : 'destructive'} className="text-xs">
              {stats.missing === 0 ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Complete</>
              ) : (
                <><AlertCircle className="w-3 h-3 mr-1" /> {stats.missing} missing</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isNumeric ? (
            <div className="space-y-4">
              {/* Numeric stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xs text-gray-400 mb-1">Minimum</p>
                  <p className="text-lg font-semibold text-white">{stats.min?.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xs text-gray-400 mb-1">Maximum</p>
                  <p className="text-lg font-semibold text-white">{stats.max?.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xs text-gray-400 mb-1">Mean</p>
                  <p className="text-lg font-semibold text-white">{stats.mean?.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xs text-gray-400 mb-1">Std Dev</p>
                  <p className="text-lg font-semibold text-white">{stats.std?.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                </div>
              </div>
              {/* Range visualization */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Range Distribution</span>
                  <span>{stats.min?.toLocaleString()} - {stats.max?.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-background overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Categorical stats */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span className="text-sm text-gray-400">Unique Values</span>
                <span className="text-lg font-semibold text-white">{stats.unique}</span>
              </div>
              {/* Top values */}
              {stats.top_values && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-2">Top Values</p>
                  {Object.entries(stats.top_values).slice(0, 5).map(([value, count], idx) => {
                    const total = Object.values(stats.top_values).reduce((a, b) => a + b, 0);
                    const percentage = (count / total) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300 truncate max-w-[150px]">{value}</span>
                          <span className="text-gray-400">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Data quality indicator
const DataQualityMeter = ({ stats, rowCount }) => {
  const columns = Object.keys(stats);
  const totalMissing = Object.values(stats).reduce((sum, s) => sum + (s.missing || 0), 0);
  const totalCells = columns.length * rowCount;
  const completeness = totalCells > 0 ? ((totalCells - totalMissing) / totalCells) * 100 : 100;
  
  const getQualityColor = (score) => {
    if (score >= 95) return 'text-green-500';
    if (score >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-barlow text-white flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Data Quality Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80" cy="80" r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-background"
              />
              <circle
                cx="80" cy="80" r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={`${completeness * 4.4} 440`}
                strokeLinecap="round"
                className={getQualityColor(completeness)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getQualityColor(completeness)}`}>
                {completeness.toFixed(0)}%
              </span>
              <span className="text-xs text-gray-400">Complete</span>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Cells</span>
            <span className="text-white">{totalCells.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Missing Values</span>
            <span className={totalMissing > 0 ? 'text-red-400' : 'text-green-400'}>
              {totalMissing.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Columns</span>
            <span className="text-white">{columns.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Empty state component
const EmptyState = ({ onUpload }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4" data-testid="statistics-empty-state">
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-6">
      <BarChart3 className="w-10 h-10 text-blue-500" />
    </div>
    <h2 className="font-barlow text-2xl font-bold text-white mb-3">
      No Datasets Available
    </h2>
    <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
      Upload a dataset to see detailed statistics including column analysis, data quality metrics, and distribution insights.
    </p>
    <Button onClick={onUpload} className="gap-2" data-testid="upload-data-btn">
      <Database className="w-4 h-4" />
      Upload Dataset
    </Button>
  </div>
);

export function StatisticsPage() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [stats, setStats] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/datasets`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setDatasets(data.datasets || []);
      
      // Auto-select first dataset
      if (data.datasets?.length > 0) {
        setSelectedDataset(data.datasets[0].id);
        loadStats(data.datasets[0].id);
      }
    } catch (error) {
      console.error('Failed to load datasets:', error);
      toast.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (datasetId) => {
    setStatsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/datasets/${datasetId}/stats`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setStats(data.stats || {});
      setRowCount(data.row_count || 0);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDatasetChange = (datasetId) => {
    setSelectedDataset(datasetId);
    loadStats(datasetId);
  };

  const currentDataset = datasets.find(d => d.id === selectedDataset);
  const numericColumns = stats ? Object.entries(stats).filter(([_, s]) => 
    ['int64', 'float64', 'int', 'float'].some(t => s.type?.includes(t))
  ).length : 0;
  const categoricalColumns = stats ? Object.keys(stats).length - numericColumns : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (datasets.length === 0) {
    return (
      <DashboardLayout>
        <EmptyState onUpload={() => window.location.href = '/upload'} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="statistics-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-barlow text-3xl font-bold tracking-tight text-white">
              Statistics
            </h1>
            <p className="text-gray-400">Analyze your dataset with detailed statistics</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedDataset} onValueChange={handleDatasetChange}>
              <SelectTrigger className="w-[250px]" data-testid="dataset-selector">
                <SelectValue placeholder="Select dataset" />
              </SelectTrigger>
              <SelectContent>
                {datasets.map((dataset) => (
                  <SelectItem key={dataset.id} value={dataset.id}>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-gray-400" />
                      {dataset.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => loadStats(selectedDataset)}
              disabled={statsLoading}
              data-testid="refresh-stats-btn"
            >
              <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : stats && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Rows"
                value={rowCount.toLocaleString()}
                subtitle={currentDataset?.name}
                icon={Layers}
                color="bg-blue-500/20 text-blue-400"
              />
              <StatCard
                title="Columns"
                value={Object.keys(stats).length}
                subtitle={`${numericColumns} numeric, ${categoricalColumns} categorical`}
                icon={Database}
                color="bg-purple-500/20 text-purple-400"
              />
              <StatCard
                title="Numeric Fields"
                value={numericColumns}
                subtitle="With min/max/mean/std"
                icon={Calculator}
                color="bg-emerald-500/20 text-emerald-400"
              />
              <StatCard
                title="Categorical Fields"
                value={categoricalColumns}
                subtitle="With unique value counts"
                icon={Type}
                color="bg-amber-500/20 text-amber-400"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column Statistics */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-barlow font-semibold text-white">
                    Column Analysis
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    {Object.keys(stats).length} columns
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(stats).map(([column, colStats], index) => (
                    <ColumnStatCard
                      key={column}
                      column={column}
                      stats={colStats}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Data Quality */}
                <DataQualityMeter stats={stats} rowCount={rowCount} />

                {/* Quick Actions */}
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-barlow text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => window.location.href = `/datasets/${selectedDataset}/transform`}
                    >
                      <Filter className="w-4 h-4" />
                      Transform Data
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => window.location.href = '/charts'}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Create Chart
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => window.location.href = '/ai-insights'}
                    >
                      <TrendingUp className="w-4 h-4" />
                      AI Insights
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Dataset Info */}
                {currentDataset && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-barlow text-white">Dataset Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Name</span>
                        <span className="text-white truncate max-w-[150px]">{currentDataset.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Created</span>
                        <span className="text-white">
                          {new Date(currentDataset.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Rows</span>
                        <span className="text-white">{currentDataset.row_count?.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StatisticsPage;
