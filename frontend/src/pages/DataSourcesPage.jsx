import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plug,
  Database,
  Globe,
  Upload,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
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

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SOURCE_TYPES = [
  { value: 'file', label: 'File Upload', icon: Upload, desc: 'CSV, Excel, JSON files' },
  { value: 'database', label: 'Database', icon: Database, desc: 'MongoDB, PostgreSQL, MySQL' },
  { value: 'api', label: 'REST API', icon: Globe, desc: 'Connect to external APIs' },
];

export function DataSourcesPage() {
  const navigate = useNavigate();
  const { currentOrg } = useOrgStore();
  const { token } = useAuthStore();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newSource, setNewSource] = useState({
    name: '',
    type: 'file',
    config: {}
  });

  useEffect(() => {
    fetchSources();
  }, [currentOrg]);

  const fetchSources = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const orgParam = currentOrg?.id ? `?org_id=${currentOrg.id}` : '';
      const response = await axios.get(`${API_URL}/api/data-sources${orgParam}`, { headers });
      setSources(response.data.sources || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSource.name) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/api/data-sources`, {
        ...newSource,
        org_id: currentOrg?.id
      }, { headers });
      
      toast.success('Data source created');
      setShowCreateDialog(false);
      setNewSource({ name: '', type: 'file', config: {} });
      fetchSources();
    } catch (error) {
      toast.error('Failed to create data source');
    }
  };

  const handleDelete = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/data-sources/${id}`, { headers });
      toast.success('Data source deleted');
      setDeleteDialog(null);
      fetchSources();
    } catch (error) {
      toast.error('Failed to delete data source');
    }
  };

  const filteredSources = sources.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSourceIcon = (type) => {
    const sourceType = SOURCE_TYPES.find(t => t.value === type);
    return sourceType?.icon || Database;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="data-sources-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Sources</h1>
            <p className="text-muted-foreground mt-1">
              Connect and manage your data sources
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-violet-600 hover:bg-violet-700"
            data-testid="add-source-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Data Source
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          {SOURCE_TYPES.map((type) => (
            <Card
              key={type.value}
              className="cursor-pointer hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all"
              onClick={() => {
                if (type.value === 'file') {
                  navigate('/upload');
                } else {
                  setNewSource({ ...newSource, type: type.value });
                  setShowCreateDialog(true);
                }
              }}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <type.icon className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{type.label}</h3>
                  <p className="text-sm text-muted-foreground">{type.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search data sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sources List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-xl" />
                    <div className="flex-1">
                      <div className="h-5 bg-muted rounded w-1/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSources.length > 0 ? (
          <div className="space-y-4">
            {filteredSources.map((source, index) => {
              const Icon = getSourceIcon(source.type);
              return (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-violet-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{source.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{source.type}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {source.config?.filename || source.config?.database || 'Connected'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm">
                            {source.status === 'active' ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-600">Active</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                <span className="text-amber-600">Inactive</span>
                              </>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteDialog(source)}
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
              <Plug className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No data sources</h3>
              <p className="text-muted-foreground mb-4">
                Connect your first data source to start visualizing
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Data Source
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Data Source</DialogTitle>
              <DialogDescription>
                Connect a new data source to your workspace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="My Data Source"
                  data-testid="source-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newSource.type}
                  onValueChange={(v) => setNewSource({ ...newSource, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {newSource.type === 'database' && (
                <div className="space-y-2">
                  <Label>Connection String</Label>
                  <Input
                    value={newSource.config.connectionString || ''}
                    onChange={(e) => setNewSource({
                      ...newSource,
                      config: { ...newSource.config, connectionString: e.target.value }
                    })}
                    placeholder="mongodb://localhost:27017/mydb"
                  />
                </div>
              )}
              
              {newSource.type === 'api' && (
                <div className="space-y-2">
                  <Label>API Endpoint</Label>
                  <Input
                    value={newSource.config.endpoint || ''}
                    onChange={(e) => setNewSource({
                      ...newSource,
                      config: { ...newSource.config, endpoint: e.target.value }
                    })}
                    placeholder="https://api.example.com/data"
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-violet-600 hover:bg-violet-700">
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Data Source</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteDialog?.name}"? This will not delete any datasets created from this source.
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

export default DataSourcesPage;
