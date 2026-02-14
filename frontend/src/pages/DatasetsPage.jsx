import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Database,
  Table2,
  Trash2,
  Download,
  BarChart3,
  Eye,
  Search,
  Plus,
  FileSpreadsheet,
  Columns,
  Rows3,
  Wand2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
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

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function DatasetsPage() {
  const navigate = useNavigate();
  const { datasetId } = useParams();
  const { currentOrg } = useOrgStore();
  const { token } = useAuthStore();
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [datasetData, setDatasetData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState(null);

  useEffect(() => {
    fetchDatasets();
  }, [currentOrg]);

  useEffect(() => {
    if (datasetId) {
      fetchDatasetDetails(datasetId);
    } else {
      setSelectedDataset(null);
      setDatasetData([]);
      setStats(null);
    }
  }, [datasetId]);

  const fetchDatasets = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const orgParam = currentOrg?.id ? `?org_id=${currentOrg.id}` : '';
      const response = await axios.get(`${API_URL}/api/datasets${orgParam}`, { headers });
      setDatasets(response.data.datasets || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatasetDetails = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [datasetRes, dataRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/datasets/${id}`, { headers }),
        axios.get(`${API_URL}/api/datasets/${id}/data?page=${page}&limit=50`, { headers }),
        axios.get(`${API_URL}/api/datasets/${id}/stats`, { headers })
      ]);
      
      setSelectedDataset(datasetRes.data);
      setDatasetData(dataRes.data.data || []);
      setTotalPages(dataRes.data.pages || 1);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dataset details:', error);
      toast.error('Failed to load dataset');
    }
  };

  const handleDelete = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/datasets/${id}`, { headers });
      toast.success('Dataset deleted');
      setDeleteDialog(null);
      fetchDatasets();
      if (datasetId === id) {
        navigate('/datasets');
      }
    } catch (error) {
      toast.error('Failed to delete dataset');
    }
  };

  const handleExport = async (format) => {
    if (!selectedDataset) return;
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `${API_URL}/api/exports/${selectedDataset.id}/${format}`,
        { headers }
      );
      
      if (format === 'csv') {
        const blob = new Blob([response.data.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedDataset.name}.csv`;
        a.click();
        toast.success('Downloaded CSV');
      } else {
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedDataset.name}.json`;
        a.click();
        toast.success('Downloaded JSON');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const filteredDatasets = datasets.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedDataset) {
    return (
      <DashboardLayout>
        <div className="space-y-6" data-testid="dataset-detail-page">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate('/datasets')}
                className="mb-2 -ml-2"
              >
                ← Back to Datasets
              </Button>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-violet-600" />
                {selectedDataset.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Rows3 className="w-4 h-4" />
                  {selectedDataset.row_count || 0} rows
                </span>
                <span className="flex items-center gap-1">
                  <Columns className="w-4 h-4" />
                  {selectedDataset.columns?.length || 0} columns
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                data-testid="export-csv-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                data-testid="export-json-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button
                onClick={() => navigate('/charts/new')}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Create Chart
              </Button>
            </div>
          </div>

          {/* Column Stats */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Column Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(stats.stats || {}).map(([colName, colStats]) => (
                    <div
                      key={colName}
                      className="p-4 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{colName}</span>
                        <Badge variant="secondary">{colStats.type}</Badge>
                      </div>
                      {colStats.mean !== undefined ? (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Mean: {colStats.mean?.toFixed(2)}</p>
                          <p>Min: {colStats.min} / Max: {colStats.max}</p>
                          <p>Missing: {colStats.missing}</p>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Unique: {colStats.unique}</p>
                          <p>Missing: {colStats.missing}</p>
                          {colStats.top_values && (
                            <p>Top: {Object.keys(colStats.top_values).slice(0, 3).join(', ')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedDataset.columns?.map((col) => (
                        <TableHead key={col.name} className="whitespace-nowrap">
                          {col.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasetData.map((row, idx) => (
                      <TableRow key={idx}>
                        {selectedDataset.columns?.map((col) => (
                          <TableCell key={col.name} className="whitespace-nowrap">
                            {String(row[col.name] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="datasets-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Datasets</h1>
            <p className="text-muted-foreground mt-1">
              Manage your imported data
            </p>
          </div>
          <Button
            onClick={() => navigate('/upload')}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Data
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-datasets-input"
          />
        </div>

        {/* Datasets Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDatasets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDatasets.map((dataset, index) => (
              <motion.div
                key={dataset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all group"
                  data-testid={`dataset-card-${dataset.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => navigate(`/datasets/${dataset.id}`)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <FileSpreadsheet className="w-4 h-4 text-violet-600" />
                          </div>
                          <h3 className="font-semibold text-foreground truncate">{dataset.name}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{dataset.row_count || 0} rows</span>
                          <span>{dataset.columns?.length || 0} cols</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/datasets/${dataset.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog(dataset);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No datasets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'Upload your first dataset to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/upload')} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Data
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Dataset</DialogTitle>
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
                data-testid="confirm-delete-btn"
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

export default DatasetsPage;
