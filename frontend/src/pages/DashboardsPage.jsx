import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Edit,
  Eye,
  Search,
  Grid,
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Target,
  Layers,
  Sparkles,
  Briefcase,
  FolderKanban,
  Headphones,
  X,
  Edit2,
  Save
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useOrgStore, useAuthStore } from '../store';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Icon mapping for templates
const ICONS = {
  DollarSign,
  Target,
  Users,
  Activity,
  TrendingUp,
  Layers,
  LayoutDashboard,
  BarChart3,
  Briefcase,
  FolderKanban,
  Headphones
};

// Template categories for filtering
const CATEGORIES = [
  { id: 'all', name: 'All Templates' },
  { id: 'sales', name: 'Sales' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'customers', name: 'Customers' },
  { id: 'operations', name: 'Operations' },
  { id: 'finance', name: 'Finance' },
  { id: 'analytics', name: 'Analytics' },
  { id: 'executive', name: 'Executive' },
  { id: 'project', name: 'Projects' },
  { id: 'support', name: 'Support' },
];

export function DashboardsPage() {
  const navigate = useNavigate();
  const { currentOrg } = useOrgStore();
  const { token } = useAuthStore();
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newDashboard, setNewDashboard] = useState({
    name: '',
    description: ''
  });
  
  // Template state
  const [templateTab, setTemplateTab] = useState('preset');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [presetTemplates, setPresetTemplates] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editTemplateName, setEditTemplateName] = useState('');

  useEffect(() => {
    fetchDashboards();
  }, [currentOrg]);

  const fetchDashboards = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const orgParam = currentOrg?.id ? `?org_id=${currentOrg.id}` : '';
      const response = await axios.get(`${API_URL}/api/dashboards${orgParam}`, { headers });
      setDashboards(response.data.dashboards || []);
    } catch (error) {
      console.error('Error fetching dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/api/templates`, { headers });
      setPresetTemplates(response.data.preset || []);
      setCustomTemplates(response.data.custom || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    if (showTemplatesDialog) {
      fetchTemplates();
    }
  }, [showTemplatesDialog]);

  const handleCreate = async (template = null) => {
    const dashboardName = template ? `${template.name} Dashboard` : newDashboard.name;
    const dashboardDesc = template ? template.description : newDashboard.description;
    const dashboardWidgets = template ? template.widgets : [];
    
    if (!dashboardName) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API_URL}/api/dashboards`, {
        name: dashboardName,
        description: dashboardDesc,
        org_id: currentOrg?.id,
        widgets: dashboardWidgets
      }, { headers });
      
      toast.success(template ? `Created dashboard from "${template.name}" template` : 'Dashboard created');
      setShowCreateDialog(false);
      setShowTemplatesDialog(false);
      setNewDashboard({ name: '', description: '' });
      navigate(`/dashboards/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to create dashboard');
    }
  };

  const handleCreateFromTemplate = (template) => {
    if (template.id === 'preset_blank') {
      setShowTemplatesDialog(false);
      setShowCreateDialog(true);
    } else {
      handleCreate(template);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/templates/${templateId}`, { headers });
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleUpdateTemplate = async (templateId) => {
    if (!editTemplateName.trim()) {
      toast.error('Please enter a name');
      return;
    }
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_URL}/api/templates/${templateId}`, 
        { name: editTemplateName },
        { headers }
      );
      toast.success('Template updated');
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const handleDelete = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/dashboards/${id}`, { headers });
      toast.success('Dashboard deleted');
      setDeleteDialog(null);
      fetchDashboards();
    } catch (error) {
      toast.error('Failed to delete dashboard');
    }
  };

  const filteredDashboards = dashboards.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter templates based on category
  let displayTemplates = templateTab === 'preset' ? presetTemplates : customTemplates;
  if (templateTab === 'preset' && templateCategory !== 'all') {
    displayTemplates = displayTemplates.filter(t => t.category === templateCategory);
  }

  const getIcon = (iconName) => {
    return ICONS[iconName] || LayoutDashboard;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="dashboards-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboards</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage interactive dashboards
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplatesDialog(true)}
              className="border-violet-200 hover:bg-violet-50"
              data-testid="templates-btn"
            >
              <Sparkles className="w-4 h-4 mr-2 text-violet-500" />
              Templates
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-violet-600 hover:bg-violet-700"
              data-testid="create-dashboard-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Dashboard
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search dashboards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Dashboards Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-4">
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDashboards.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDashboards.map((dashboard, index) => (
              <motion.div
                key={dashboard.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all group"
                  data-testid={`dashboard-card-${dashboard.id}`}
                >
                  {/* Dashboard Preview */}
                  <div
                    className="aspect-video bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 flex items-center justify-center relative"
                    onClick={() => navigate(`/dashboards/${dashboard.id}`)}
                  >
                    <Grid className="w-16 h-16 text-violet-300 dark:text-violet-700" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button size="sm" variant="secondary">
                        <Eye className="w-4 h-4 mr-2" />
                        Open
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div onClick={() => navigate(`/dashboards/${dashboard.id}`)}>
                        <h3 className="font-semibold text-foreground">{dashboard.name}</h3>
                        {dashboard.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {dashboard.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {dashboard.widgets?.length || 0} widgets
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboards/${dashboard.id}`);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog(dashboard);
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
              <LayoutDashboard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No dashboards yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first dashboard to visualize your data
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Dashboard</DialogTitle>
              <DialogDescription>
                Create a new dashboard to visualize your data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newDashboard.name}
                  onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
                  placeholder="Sales Dashboard"
                  data-testid="dashboard-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={newDashboard.description}
                  onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
                  placeholder="Overview of sales metrics and trends"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleCreate(null)} className="bg-violet-600 hover:bg-violet-700" data-testid="create-dashboard-submit">
                  Create Dashboard
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Dashboard</DialogTitle>
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

        {/* Enhanced Templates Dialog */}
        <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden p-0">
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <DialogTitle className="text-xl">Dashboard Templates</DialogTitle>
                <span className="text-sm text-muted-foreground ml-2">
                  {presetTemplates.length} presets + {customTemplates.length} custom
                </span>
              </div>
            </div>

            {/* Tabs and Category Filter */}
            <div className="px-6 pt-4 flex gap-4 border-b items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setTemplateTab('preset')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    templateTab === 'preset'
                      ? 'text-violet-700 border-b-2 border-violet-500 bg-violet-50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="preset-tab"
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Preset ({presetTemplates.length})
                </button>
                <button
                  onClick={() => setTemplateTab('custom')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    templateTab === 'custom'
                      ? 'text-violet-700 border-b-2 border-violet-500 bg-violet-50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="custom-tab"
                >
                  <LayoutDashboard className="w-4 h-4 inline mr-2" />
                  My Templates ({customTemplates.length})
                </button>
              </div>
              
              {templateTab === 'preset' && (
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="ml-auto text-sm border rounded-lg px-3 py-1.5 bg-background"
                  data-testid="category-filter"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Templates Grid */}
            <div className="p-6 overflow-y-auto max-h-[55vh]">
              {templatesLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="animate-pulse bg-muted rounded-lg h-48" />
                  ))}
                </div>
              ) : displayTemplates.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayTemplates.map((template) => {
                    const Icon = getIcon(template.icon);
                    const isEditing = editingTemplate === template.id;
                    
                    return (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative"
                      >
                        <Card
                          className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-violet-300 transition-all group"
                          onClick={() => !isEditing && handleCreateFromTemplate(template)}
                          data-testid={`template-${template.id}`}
                        >
                          <div className={`h-20 bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <CardContent className="p-3">
                            {isEditing ? (
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <Input
                                  type="text"
                                  value={editTemplateName}
                                  onChange={(e) => setEditTemplateName(e.target.value)}
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => handleUpdateTemplate(template.id)}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <h3 className="font-semibold text-sm">{template.name}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {template.description}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {template.widgets?.length || 0} widgets
                                  </span>
                                  {template.category && (
                                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                      {template.category}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                        
                        {/* Actions for custom templates */}
                        {templateTab === 'custom' && !isEditing && (
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTemplate(template.id);
                                setEditTemplateName(template.name);
                              }}
                              className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                              className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <LayoutDashboard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">
                    {templateTab === 'custom' ? 'No custom templates yet' : 'No templates found'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {templateTab === 'custom' 
                      ? 'Save a dashboard as a template to see it here'
                      : 'Try changing the category filter'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/30 flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Widget types: stat, chart, table, gauge, progress, map, funnel, heatmap, scorecard, list, timeline, sparkline
              </p>
              <Button variant="outline" onClick={() => setShowTemplatesDialog(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default DashboardsPage;
