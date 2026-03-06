import React, { useState, useEffect, useMemo } from 'react';
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
  Save,
  Star,
  Copy,
  Share2,
  Tag,
  Clock,
  ArrowUpDown,
  Grid3X3,
  List,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
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
  
  // New enhanced state
  const [sortBy, setSortBy] = useState('recent');
  const [showFavorites, setShowFavorites] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterTag, setFilterTag] = useState('all');
  const [duplicatingDashboard, setDuplicatingDashboard] = useState(null);
  
  // Template state
  const [templateTab, setTemplateTab] = useState('preset');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [presetTemplates, setPresetTemplates] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editTemplateName, setEditTemplateName] = useState('');

  // Get all unique tags from dashboards
  const allTags = useMemo(() => {
    const tags = new Set(['all']);
    dashboards.forEach(d => {
      (d.tags || []).forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [dashboards]);

  // Filter and sort dashboards
  const filteredDashboards = useMemo(() => {
    let result = dashboards.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Filter by tag
    if (filterTag !== 'all') {
      result = result.filter(d => (d.tags || []).includes(filterTag));
    }
    
    // Filter favorites
    if (showFavorites) {
      result = result.filter(d => d.is_favorite);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'favorites':
          return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
        case 'recent':
        default:
          return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
      }
    });
    
    return result;
  }, [dashboards, searchQuery, filterTag, showFavorites, sortBy]);

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

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

  // Toggle favorite status
  const handleToggleFavorite = async (dashboard) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const newFavorite = !dashboard.is_favorite;
      await axios.put(`${API_URL}/api/dashboards/${dashboard.id}`, {
        is_favorite: newFavorite
      }, { headers });
      
      setDashboards(dashboards.map(d => 
        d.id === dashboard.id ? { ...d, is_favorite: newFavorite } : d
      ));
      toast.success(newFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      // Optimistic update on error
      setDashboards(dashboards.map(d => 
        d.id === dashboard.id ? { ...d, is_favorite: !d.is_favorite } : d
      ));
      toast.error('Failed to update favorite');
    }
  };

  // Duplicate dashboard
  const handleDuplicate = async (dashboard) => {
    setDuplicatingDashboard(dashboard.id);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API_URL}/api/dashboards`, {
        name: `${dashboard.name} (Copy)`,
        description: dashboard.description,
        org_id: currentOrg?.id,
        tags: dashboard.tags || []
      }, { headers });
      
      toast.success('Dashboard duplicated');
      fetchDashboards();
    } catch (error) {
      toast.error('Failed to duplicate dashboard');
    } finally {
      setDuplicatingDashboard(null);
    }
  };

  // Track view
  const trackDashboardView = async (dashboardId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/api/dashboards/${dashboardId}/view`, {}, { headers });
    } catch (error) {
      // Silent fail for view tracking
    }
  };

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

        {/* Enhanced Filter Bar */}
        {dashboards.length > 0 && (
          <div className="space-y-4">
            {/* Search and Actions Row */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search dashboards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-dashboards-input"
                />
              </div>
              
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 px-3 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="recent">Recent</option>
                  <option value="name">Name</option>
                  <option value="views">Most Viewed</option>
                  <option value="favorites">Favorites First</option>
                </select>
                
                {/* Favorites Toggle */}
                <Button
                  variant={showFavorites ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFavorites(!showFavorites)}
                  className={showFavorites ? "bg-amber-500 hover:bg-amber-600" : ""}
                >
                  <Star className={`w-4 h-4 ${showFavorites ? "fill-current" : ""}`} />
                </Button>
                
                {/* View Mode Toggle */}
                <div className="flex border rounded-md overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none px-2"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none px-2"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Tags Filter */}
            {allTags.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    variant={filterTag === tag ? "default" : "outline"}
                    size="sm"
                    className={`h-7 text-xs capitalize ${filterTag === tag ? "bg-violet-600 hover:bg-violet-700" : ""}`}
                    onClick={() => setFilterTag(tag)}
                  >
                    {tag === 'all' ? 'All Dashboards' : `#${tag}`}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State - No Dashboards */}
        {!loading && dashboards.length === 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

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
          <div className={viewMode === 'grid' 
            ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-3"
          }>
            {filteredDashboards.map((dashboard, index) => {
              // Grid View Card
              if (viewMode === 'grid') {
                return (
                  <motion.div
                    key={dashboard.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.02 }}
                    className="group"
                  >
                    <Card
                      className="overflow-hidden hover:shadow-xl hover:border-violet-500/50 transition-all cursor-pointer relative"
                      data-testid={`dashboard-card-${dashboard.id}`}
                    >
                      {/* Dashboard Preview / Thumbnail */}
                      <div 
                        className="aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden"
                        onClick={() => { navigate(`/dashboards/${dashboard.id}`); trackDashboardView(dashboard.id); }}
                      >
                        {dashboard.preview_image ? (
                          <img 
                            src={dashboard.preview_image} 
                            alt={dashboard.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <>
                            <Grid className="w-20 h-20 text-violet-400/20" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />
                          </>
                        )}
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Widget Count Badge */}
                        <Badge className="absolute top-3 right-3 bg-violet-600/90 text-xs">
                          <LayoutDashboard className="w-3 h-3 mr-1" />
                          {dashboard.widgets?.length || 0} widgets
                        </Badge>
                        
                        {/* Favorite Star */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleFavorite(dashboard); }}
                          className={`absolute top-3 left-3 p-1.5 rounded-full transition-all ${
                            dashboard.is_favorite 
                              ? "bg-amber-500 text-white" 
                              : "bg-black/40 text-white/60 opacity-0 group-hover:opacity-100 hover:bg-black/60"
                          }`}
                        >
                          <Star className={`w-4 h-4 ${dashboard.is_favorite ? "fill-current" : ""}`} />
                        </button>
                        
                        {/* Hover Quick Actions */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1 h-8 bg-white/90 hover:bg-white text-slate-900 text-xs"
                            onClick={(e) => { e.stopPropagation(); navigate(`/dashboards/${dashboard.id}`); }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 bg-white/90 hover:bg-white text-slate-900"
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(dashboard); }}
                            disabled={duplicatingDashboard === dashboard.id}
                          >
                            {duplicatingDashboard === dashboard.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 bg-red-500/90 hover:bg-red-500 text-white"
                            onClick={(e) => { e.stopPropagation(); setDeleteDialog(dashboard); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Card Content */}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{dashboard.name}</h3>
                            {dashboard.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {dashboard.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {dashboard.tags && dashboard.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {dashboard.tags.slice(0, 3).map(tag => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-[10px] h-5 px-1.5 bg-violet-500/10 border-violet-500/30 text-violet-400"
                              >
                                #{tag}
                              </Badge>
                            ))}
                            {dashboard.tags.length > 3 && (
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                +{dashboard.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Footer Metadata */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(dashboard.updated_at || dashboard.created_at)}
                          </div>
                          <div className="flex items-center gap-3">
                            {(dashboard.views || 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {dashboard.views}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              }
              
              // List View Card
              return (
                <motion.div
                  key={dashboard.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className="hover:shadow-md hover:border-violet-500/30 transition-all group">
                    <div className="flex items-center p-4 gap-4">
                      {/* Preview Thumbnail */}
                      <div 
                        className="w-24 h-16 rounded-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center cursor-pointer flex-shrink-0 relative overflow-hidden"
                        onClick={() => { navigate(`/dashboards/${dashboard.id}`); trackDashboardView(dashboard.id); }}
                      >
                        {dashboard.preview_image ? (
                          <img src={dashboard.preview_image} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Grid className="w-8 h-8 text-violet-400/30" />
                        )}
                        <div className="absolute top-1 right-1">
                          {dashboard.is_favorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">{dashboard.name}</h3>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">
                            {dashboard.widgets?.length || 0} widgets
                          </Badge>
                        </div>
                        {dashboard.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{dashboard.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(dashboard.updated_at || dashboard.created_at)}
                          </span>
                          {(dashboard.views || 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {dashboard.views} views
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleFavorite(dashboard)}
                        >
                          <Star className={`w-4 h-4 ${dashboard.is_favorite ? "fill-amber-500 text-amber-500" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/dashboards/${dashboard.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDuplicate(dashboard)}
                          disabled={duplicatingDashboard === dashboard.id}
                        >
                          {duplicatingDashboard === dashboard.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteDialog(dashboard)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
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
