import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Search,
  FileSpreadsheet,
  Cloud,
  HardDrive,
  Clock,
  Filter,
  GitMerge,
  BarChart3,
  History,
  Tag,
  Shield,
  Bell,
  Award,
  ExternalLink,
  Key,
  FolderOpen,
  ChevronRight,
  Settings,
  Zap,
  X,
  Eye,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useOrgStore, useAuthStore } from '../store';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================================================
// Connector Categories
// ============================================================================

const CONNECTOR_CATEGORIES = [
  {
    id: 'files',
    name: 'Files',
    icon: Upload,
    connectors: [
      { id: 'file_upload', name: 'File Upload', icon: Upload, desc: 'CSV, Excel, JSON files', color: 'violet' },
    ]
  },
  {
    id: 'cloud_storage',
    name: 'Cloud Storage',
    icon: Cloud,
    connectors: [
      { id: 'google_drive', name: 'Google Drive', icon: HardDrive, desc: 'Import from Google Drive', color: 'blue', oauth: true },
      { id: 'google_sheets', name: 'Google Sheets', icon: FileSpreadsheet, desc: 'Sync Google Sheets', color: 'green', oauth: true },
      { id: 'aws_s3', name: 'Amazon S3', icon: Cloud, desc: 'Connect S3 buckets', color: 'orange' },
      { id: 'dropbox', name: 'Dropbox', icon: FolderOpen, desc: 'Import from Dropbox', color: 'blue', oauth: true },
      { id: 'onedrive', name: 'OneDrive', icon: Cloud, desc: 'Connect Microsoft OneDrive', color: 'cyan', oauth: true },
    ]
  },
  {
    id: 'databases',
    name: 'Databases',
    icon: Database,
    connectors: [
      { id: 'postgresql', name: 'PostgreSQL', icon: Database, desc: 'Connect PostgreSQL database', color: 'blue' },
      { id: 'mysql', name: 'MySQL', icon: Database, desc: 'Connect MySQL database', color: 'orange' },
      { id: 'mongodb', name: 'MongoDB', icon: Database, desc: 'Connect MongoDB database', color: 'green' },
    ]
  },
  {
    id: 'saas',
    name: 'SaaS Apps',
    icon: Zap,
    connectors: [
      { id: 'salesforce', name: 'Salesforce', icon: Cloud, desc: 'Import Salesforce data', color: 'blue', oauth: true },
      { id: 'hubspot', name: 'HubSpot', icon: Globe, desc: 'Connect HubSpot CRM', color: 'orange', oauth: true },
      { id: 'stripe', name: 'Stripe', icon: Zap, desc: 'Import Stripe payments', color: 'purple' },
      { id: 'google_analytics', name: 'Google Analytics', icon: BarChart3, desc: 'Import GA4 data', color: 'amber', oauth: true },
      { id: 'shopify', name: 'Shopify', icon: Globe, desc: 'Connect Shopify store', color: 'green' },
    ]
  },
  {
    id: 'api',
    name: 'Custom API',
    icon: Globe,
    connectors: [
      { id: 'rest_api', name: 'REST API', icon: Globe, desc: 'Connect any REST API', color: 'slate' },
    ]
  }
];

// Flatten connectors for easy lookup
const ALL_CONNECTORS = CONNECTOR_CATEGORIES.flatMap(cat => cat.connectors);

// ============================================================================
// Data Management Features
// ============================================================================

const DATA_FEATURES = [
  { id: 'scheduled_refresh', name: 'Scheduled Refresh', icon: Clock, desc: 'Auto-refresh data on schedule', badge: 'Popular' },
  { id: 'transformations', name: 'Data Transformations', icon: Filter, desc: 'Clean, filter, calculate columns', badge: 'New' },
  { id: 'data_blending', name: 'Data Blending', icon: GitMerge, desc: 'Join multiple datasets', badge: null },
  { id: 'data_profiling', name: 'Data Profiling', icon: BarChart3, desc: 'Auto-detect types & statistics', badge: null },
  { id: 'version_history', name: 'Version History', icon: History, desc: 'Track dataset changes', badge: null },
  { id: 'data_catalog', name: 'Data Catalog', icon: Tag, desc: 'Search & tag datasets', badge: null },
];

const ENTERPRISE_FEATURES = [
  { id: 'data_lineage', name: 'Data Lineage', icon: GitMerge, desc: 'Track data flow & origin' },
  { id: 'row_level_security', name: 'Row-Level Security', icon: Shield, desc: 'Restrict data by user/role' },
  { id: 'certified_datasets', name: 'Certified Datasets', icon: Award, desc: 'Mark as verified' },
  { id: 'data_alerts', name: 'Data Alerts', icon: Bell, desc: 'Notifications on changes' },
];

// ============================================================================
// Main Component
// ============================================================================

export function DataSourcesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentOrg } = useOrgStore();
  const { token } = useAuthStore();
  
  // State
  const [sources, setSources] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('connectors');
  
  // Dialog states
  const [showConnectorDialog, setShowConnectorDialog] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [connectorConfig, setConnectorConfig] = useState({});
  const [connecting, setConnecting] = useState(false);
  
  // Feature dialogs
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showTransformDialog, setShowTransformDialog] = useState(false);
  const [showBlendDialog, setShowBlendDialog] = useState(false);
  
  // S3 Browser state
  const [showS3Browser, setShowS3Browser] = useState(false);
  const [selectedS3Connection, setSelectedS3Connection] = useState(null);
  const [s3Buckets, setS3Buckets] = useState([]);
  const [s3Files, setS3Files] = useState([]);
  const [s3Folders, setS3Folders] = useState([]);
  const [s3CurrentBucket, setS3CurrentBucket] = useState(null);
  const [s3CurrentPrefix, setS3CurrentPrefix] = useState('');
  const [s3Loading, setS3Loading] = useState(false);
  const [s3Importing, setS3Importing] = useState(false);
  
  // Google Sheets state
  const [showGoogleBrowser, setShowGoogleBrowser] = useState(false);
  const [selectedGoogleConnection, setSelectedGoogleConnection] = useState(null);
  const [googleSpreadsheets, setGoogleSpreadsheets] = useState([]);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Check for OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSources();
    fetchConnections();
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

  const fetchConnections = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/api/connectors`, { headers });
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  // ============================================================================
  // OAuth Handlers
  // ============================================================================

  const initiateOAuth = async (connector, clientId, clientSecret) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const redirectUri = `${window.location.origin}/dashboard/data-sources`;
      
      const response = await axios.post(
        `${API_URL}/api/connectors/google/oauth/init`,
        {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          connector_type: connector.id
        },
        { headers }
      );
      
      if (response.data.auth_url) {
        // Store connector info and credentials for callback
        localStorage.setItem('oauth_connector', connector.id);
        localStorage.setItem('oauth_client_id', clientId);
        localStorage.setItem('oauth_client_secret', clientSecret);
        localStorage.setItem('oauth_redirect_uri', redirectUri);
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      console.error('OAuth init error:', error);
      toast.error(error.response?.data?.detail || `Failed to initiate OAuth for ${connector.name}`);
    }
  };

  const handleOAuthCallback = async (code, state) => {
    const connectorId = localStorage.getItem('oauth_connector');
    const clientId = localStorage.getItem('oauth_client_id');
    const clientSecret = localStorage.getItem('oauth_client_secret');
    const redirectUri = localStorage.getItem('oauth_redirect_uri');
    
    if (!connectorId || !clientId || !clientSecret) {
      toast.error('OAuth session expired. Please try connecting again.');
      return;
    }
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/api/connectors/google/oauth/callback`,
        { 
          code, 
          state,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
        },
        { headers }
      );
      
      toast.success('Successfully connected to Google!');
      
      // Clean up localStorage
      localStorage.removeItem('oauth_connector');
      localStorage.removeItem('oauth_client_id');
      localStorage.removeItem('oauth_client_secret');
      localStorage.removeItem('oauth_redirect_uri');
      
      fetchSources();
      fetchConnections();
      
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error(error.response?.data?.detail || 'OAuth connection failed');
    }
  };

  // ============================================================================
  // Connector Handlers
  // ============================================================================

  const openConnectorDialog = (connector) => {
    setSelectedConnector(connector);
    setConnectorConfig({});
    setShowConnectorDialog(true);
  };

  const handleConnect = async () => {
    if (!selectedConnector) return;
    
    // For Google OAuth connectors with user-provided credentials
    if (selectedConnector.oauth && (selectedConnector.id === 'google_sheets' || selectedConnector.id === 'google_drive')) {
      if (!connectorConfig.client_id || !connectorConfig.client_secret) {
        toast.error('Please enter your Google OAuth credentials');
        return;
      }
      initiateOAuth(selectedConnector, connectorConfig.client_id, connectorConfig.client_secret);
      setShowConnectorDialog(false);
      return;
    }
    
    // For other OAuth connectors (not implemented yet)
    if (selectedConnector.oauth) {
      toast.info(`${selectedConnector.name} integration coming soon!`);
      return;
    }
    
    setConnecting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const payload = {
        connector_type: selectedConnector.id,
        name: connectorConfig.name || selectedConnector.name,
        config: connectorConfig,
        org_id: currentOrg?.id
      };
      
      const response = await axios.post(
        `${API_URL}/api/connectors/connect`,
        payload,
        { headers }
      );
      
      toast.success(`Connected to ${selectedConnector.name}!`);
      setShowConnectorDialog(false);
      setSelectedConnector(null);
      setConnectorConfig({});
      fetchSources();
      fetchConnections();
      
      // If S3, show file browser
      if (selectedConnector.id === 'aws_s3' && response.data.connection_id) {
        setSelectedS3Connection(response.data.connection_id);
        setShowS3Browser(true);
        loadS3Buckets(response.data.connection_id);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  // S3 specific handlers
  const loadS3Buckets = async (connectionId) => {
    setS3Loading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `${API_URL}/api/connectors/s3/${connectionId}/buckets`,
        { headers }
      );
      setS3Buckets(response.data.buckets || []);
      setS3CurrentBucket(null);
      setS3CurrentPrefix('');
      setS3Files([]);
      setS3Folders([]);
    } catch (error) {
      console.error('Error loading S3 buckets:', error);
      toast.error('Failed to load S3 buckets');
    } finally {
      setS3Loading(false);
    }
  };

  const loadS3Files = async (connectionId, bucket, prefix = '') => {
    setS3Loading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `${API_URL}/api/connectors/s3/${connectionId}/files?bucket=${bucket}&prefix=${prefix}`,
        { headers }
      );
      setS3Files(response.data.files || []);
      setS3Folders(response.data.folders || []);
      setS3CurrentBucket(bucket);
      setS3CurrentPrefix(prefix);
    } catch (error) {
      console.error('Error loading S3 files:', error);
      toast.error('Failed to load files');
    } finally {
      setS3Loading(false);
    }
  };

  const importS3File = async (connectionId, bucket, key, fileName) => {
    setS3Importing(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/api/connectors/s3/${connectionId}/import`,
        { bucket, key, dataset_name: fileName, org_id: currentOrg?.id },
        { headers }
      );
      toast.success(`Imported "${fileName}" successfully!`);
      fetchSources();
      setShowS3Browser(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to import file');
    } finally {
      setS3Importing(false);
    }
  };

  const openS3Browser = (connection) => {
    setSelectedS3Connection(connection.id);
    setShowS3Browser(true);
    loadS3Buckets(connection.id);
  };
  
  // Google Sheets handlers
  const loadGoogleSpreadsheets = async (connectionId) => {
    setGoogleLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `${API_URL}/api/connectors/google/${connectionId}/spreadsheets`,
        { headers }
      );
      setGoogleSpreadsheets(response.data.spreadsheets || []);
    } catch (error) {
      console.error('Error loading spreadsheets:', error);
      toast.error('Failed to load Google Sheets');
    } finally {
      setGoogleLoading(false);
    }
  };

  const importGoogleSpreadsheet = async (connectionId, spreadsheetId, name) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/api/connectors/google/${connectionId}/import`,
        { 
          spreadsheet_id: spreadsheetId, 
          dataset_name: name,
          org_id: currentOrg?.id 
        },
        { headers }
      );
      toast.success(`Imported "${name}" successfully!`);
      fetchSources();
      setShowGoogleBrowser(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to import spreadsheet');
    }
  };

  const openGoogleBrowser = (connection) => {
    setSelectedGoogleConnection(connection.id);
    setShowGoogleBrowser(true);
    loadGoogleSpreadsheets(connection.id);
  };

  const handleDelete = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/data-sources/${id}`, { headers });
      toast.success('Data source deleted');
      fetchSources();
    } catch (error) {
      toast.error('Failed to delete data source');
    }
  };

  const handleRefresh = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/api/data-sources/${id}/refresh`, {}, { headers });
      toast.success('Refresh started');
      fetchSources();
    } catch (error) {
      toast.error('Failed to refresh data source');
    }
  };

  const filteredSources = sources.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConnectorInfo = (type) => {
    return ALL_CONNECTORS.find(c => c.id === type) || { name: type, icon: Database, color: 'gray' };
  };

  // ============================================================================
  // Render Connector Config Form
  // ============================================================================

  const renderConnectorConfigForm = () => {
    if (!selectedConnector) return null;
    
    switch (selectedConnector.id) {
      case 'aws_s3':
        return (
          <div className="space-y-4">
            <div>
              <Label>Connection Name</Label>
              <Input
                value={connectorConfig.name || ''}
                onChange={(e) => setConnectorConfig({ ...connectorConfig, name: e.target.value })}
                placeholder="My S3 Connection"
              />
            </div>
            <div>
              <Label>Access Key ID *</Label>
              <Input
                value={connectorConfig.access_key_id || ''}
                onChange={(e) => setConnectorConfig({ ...connectorConfig, access_key_id: e.target.value })}
                placeholder="AKIAIOSFODNN7EXAMPLE"
              />
            </div>
            <div>
              <Label>Secret Access Key *</Label>
              <Input
                type="password"
                value={connectorConfig.secret_access_key || ''}
                onChange={(e) => setConnectorConfig({ ...connectorConfig, secret_access_key: e.target.value })}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              />
            </div>
            <div>
              <Label>Region</Label>
              <Select
                value={connectorConfig.region || 'us-east-1'}
                onValueChange={(v) => setConnectorConfig({ ...connectorConfig, region: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                  <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <Key className="w-4 h-4 inline mr-1" />
                Your credentials are encrypted and stored securely. We recommend using IAM roles with minimal permissions.
              </p>
            </div>
          </div>
        );
        
      case 'postgresql':
      case 'mysql':
        return (
          <div className="space-y-4">
            <div>
              <Label>Connection Name</Label>
              <Input
                value={connectorConfig.name || ''}
                onChange={(e) => setConnectorConfig({ ...connectorConfig, name: e.target.value })}
                placeholder="My Database"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Host *</Label>
                <Input
                  value={connectorConfig.host || ''}
                  onChange={(e) => setConnectorConfig({ ...connectorConfig, host: e.target.value })}
                  placeholder="localhost"
                />
              </div>
              <div>
                <Label>Port *</Label>
                <Input
                  value={connectorConfig.port || (selectedConnector.id === 'postgresql' ? '5432' : '3306')}
                  onChange={(e) => setConnectorConfig({ ...connectorConfig, port: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Database Name *</Label>
              <Input
                value={connectorConfig.database || ''}
                onChange={(e) => setConnectorConfig({ ...connectorConfig, database: e.target.value })}
                placeholder="mydb"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Username *</Label>
                <Input
                  value={connectorConfig.username || ''}
                  onChange={(e) => setConnectorConfig({ ...connectorConfig, username: e.target.value })}
                  placeholder="user"
                />
              </div>
              <div>
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={connectorConfig.password || ''}
                  onChange={(e) => setConnectorConfig({ ...connectorConfig, password: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
        
      case 'stripe':
        return (
          <div className="space-y-4">
            <div>
              <Label>Connection Name</Label>
              <Input
                value={connectorConfig.name || ''}
                onChange={(e) => setConnectorConfig({ ...connectorConfig, name: e.target.value })}
                placeholder="My Stripe Account"
              />
            </div>
            <div>
              <Label>Secret API Key *</Label>
              <Input
                type="password"
                value={connectorConfig.api_key || ''}
                onChange={(e) => setConnectorConfig({ ...connectorConfig, api_key: e.target.value })}
                placeholder="sk_live_..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Find this in your Stripe Dashboard → Developers → API Keys
              </p>
            </div>
          </div>
        );
        
      case 'shopify':
        return (
          <div className="space-y-4">
            <div>
              <Label>Store Name *</Label>
              <div className="flex">
                <Input
                  value={connectorConfig.store || ''}
                  onChange={(e) => setConnectorConfig({ ...connectorConfig, store: e.target.value })}
                  placeholder="my-store"
                  className="rounded-r-none"
                />
                <span className="inline-flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                  .myshopify.com
                </span>
              </div>
            </div>
            <div>
              <Label>Admin API Access Token *</Label>
              <Input
                type="password"
                value={connectorConfig.access_token || ''}
                onChange={(e) => setConnectorConfig({ ...connectorConfig, access_token: e.target.value })}
                placeholder="shpat_..."
              />
            </div>
          </div>
        );
        
      case 'rest_api':
        return (
          <div className="space-y-4">
            <div>
              <Label>Connection Name</Label>
              <Input
                value={connectorConfig.name || ''}
                onChange={(e) => setConnectorConfig({ ...connectorConfig, name: e.target.value })}
                placeholder="My API"
              />
            </div>
            <div>
              <Label>API URL *</Label>
              <Input
                value={connectorConfig.url || ''}
                onChange={(e) => setConnectorConfig({ ...connectorConfig, url: e.target.value })}
                placeholder="https://api.example.com/data"
              />
            </div>
            <div>
              <Label>Authentication</Label>
              <Select
                value={connectorConfig.auth_type || 'none'}
                onValueChange={(v) => setConnectorConfig({ ...connectorConfig, auth_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Authentication</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {connectorConfig.auth_type === 'api_key' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Header Name</Label>
                  <Input
                    value={connectorConfig.api_key_header || ''}
                    onChange={(e) => setConnectorConfig({ ...connectorConfig, api_key_header: e.target.value })}
                    placeholder="X-API-Key"
                  />
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={connectorConfig.api_key || ''}
                    onChange={(e) => setConnectorConfig({ ...connectorConfig, api_key: e.target.value })}
                  />
                </div>
              </div>
            )}
            {connectorConfig.auth_type === 'bearer' && (
              <div>
                <Label>Bearer Token</Label>
                <Input
                  type="password"
                  value={connectorConfig.bearer_token || ''}
                  onChange={(e) => setConnectorConfig({ ...connectorConfig, bearer_token: e.target.value })}
                />
              </div>
            )}
          </div>
        );
        
      default:
        // OAuth connectors show credential form + info
        if (selectedConnector.oauth) {
          if (selectedConnector.id === 'google_sheets' || selectedConnector.id === 'google_drive') {
            return (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                    <ExternalLink className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Connect with {selectedConnector.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your Google Cloud OAuth credentials to authorize access.
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <ExternalLink className="w-4 h-4 inline mr-1" />
                    <a 
                      href="https://console.cloud.google.com/apis/credentials" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      Get credentials from Google Cloud Console
                    </a>
                  </p>
                </div>
                
                <div>
                  <Label>OAuth Client ID *</Label>
                  <Input
                    value={connectorConfig.client_id || ''}
                    onChange={(e) => setConnectorConfig({ ...connectorConfig, client_id: e.target.value })}
                    placeholder="your-client-id.apps.googleusercontent.com"
                    data-testid="google-client-id-input"
                  />
                </div>
                
                <div>
                  <Label>OAuth Client Secret *</Label>
                  <Input
                    type="password"
                    value={connectorConfig.client_secret || ''}
                    onChange={(e) => setConnectorConfig({ ...connectorConfig, client_secret: e.target.value })}
                    placeholder="GOCSPX-..."
                    data-testid="google-client-secret-input"
                  />
                </div>
                
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <Key className="w-4 h-4 inline mr-1" />
                    Make sure to add <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">{window.location.origin}/dashboard/data-sources</code> as an authorized redirect URI in your Google Cloud Console.
                  </p>
                </div>
              </div>
            );
          }
          
          return (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect with {selectedConnector.name}</h3>
              <p className="text-muted-foreground mb-4">
                You'll be redirected to {selectedConnector.name} to authorize access to your data.
              </p>
              <p className="text-sm text-muted-foreground">
                We only request read-only access to your files.
              </p>
            </div>
          );
        }
        return null;
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="data-sources-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Sources</h1>
            <p className="text-muted-foreground mt-1">
              Connect, manage, and transform your data
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sources..."
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="connectors" className="gap-2">
              <Plug className="w-4 h-4" />
              Connectors
            </TabsTrigger>
            <TabsTrigger value="connections" className="gap-2" data-testid="connections-tab">
              <Cloud className="w-4 h-4" />
              My Connections ({connections.length})
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-2">
              <Database className="w-4 h-4" />
              My Sources ({sources.length})
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Settings className="w-4 h-4" />
              Data Management
            </TabsTrigger>
          </TabsList>

          {/* Connectors Tab */}
          <TabsContent value="connectors" className="space-y-6">
            {CONNECTOR_CATEGORIES.map((category) => (
              <div key={category.id} className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <category.icon className="w-5 h-5 text-violet-500" />
                  {category.name}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {category.connectors.map((connector) => (
                    <Card
                      key={connector.id}
                      className="cursor-pointer hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
                      onClick={() => openConnectorDialog(connector)}
                      data-testid={`connector-${connector.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-${connector.color}-100 dark:bg-${connector.color}-900/30 flex items-center justify-center`}>
                            <connector.icon className={`w-5 h-5 text-${connector.color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-foreground">{connector.name}</h3>
                              {connector.oauth && (
                                <Badge variant="outline" className="text-xs">OAuth</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{connector.desc}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* My Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            {connections.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Cloud className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No active connections</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect to cloud storage or APIs to import your data
                  </p>
                  <Button onClick={() => setActiveTab('connectors')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Connection
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {connections.map((conn) => {
                  const connectorInfo = getConnectorInfo(conn.type);
                  const ConnectorIcon = connectorInfo.icon;
                  const isS3 = conn.type === 'aws_s3';
                  const isGoogle = conn.type === 'google_sheets' || conn.type === 'google_drive';
                  
                  return (
                    <Card key={conn.id} className="hover:shadow-md transition-shadow" data-testid={`connection-${conn.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-${connectorInfo.color}-100 dark:bg-${connectorInfo.color}-900/30 flex items-center justify-center`}>
                            <ConnectorIcon className={`w-6 h-6 text-${connectorInfo.color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{conn.name}</h3>
                              <Badge variant={conn.status === 'connected' ? 'default' : 'secondary'} className="text-xs">
                                {conn.status === 'connected' ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" /> Connected</>
                                ) : (
                                  <><AlertCircle className="w-3 h-3 mr-1" /> {conn.status}</>
                                )}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {conn.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              {conn.credentials?.region && ` • ${conn.credentials.region}`}
                            </p>
                            {conn.last_used && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Last used: {new Date(conn.last_used).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isS3 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openS3Browser(conn)}
                                data-testid={`browse-s3-${conn.id}`}
                              >
                                <FolderOpen className="w-4 h-4 mr-2" />
                                Browse Files
                              </Button>
                            )}
                            {isGoogle && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openGoogleBrowser(conn)}
                                data-testid={`browse-google-${conn.id}`}
                              >
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                View Sheets
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                try {
                                  const headers = { Authorization: `Bearer ${token}` };
                                  await axios.delete(`${API_URL}/api/connectors/${conn.id}`, { headers });
                                  toast.success('Connection removed');
                                  fetchConnections();
                                } catch (error) {
                                  toast.error('Failed to remove connection');
                                }
                              }}
                              className="text-red-500 hover:text-red-600"
                              title="Remove Connection"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : filteredSources.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Plug className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No data sources connected</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your first data source to start visualizing your data
                  </p>
                  <Button onClick={() => setActiveTab('connectors')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Browse Connectors
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredSources.map((source) => {
                  const connectorInfo = getConnectorInfo(source.type);
                  const ConnectorIcon = connectorInfo.icon;
                  return (
                    <Card key={source.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-${connectorInfo.color}-100 dark:bg-${connectorInfo.color}-900/30 flex items-center justify-center`}>
                            <ConnectorIcon className={`w-6 h-6 text-${connectorInfo.color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{source.name}</h3>
                              <Badge variant={source.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {source.status === 'active' ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                                ) : (
                                  <><AlertCircle className="w-3 h-3 mr-1" /> Inactive</>
                                )}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {connectorInfo.name} • {source.config?.rows || 0} rows
                            </p>
                            {source.last_refresh && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Last refreshed: {new Date(source.last_refresh).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRefresh(source.id)}
                              title="Refresh"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/dashboard/datasets`)}
                              title="View Data"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(source.id)}
                              className="text-red-500 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Data Management Features Tab */}
          <TabsContent value="features" className="space-y-6">
            {/* Data Management Features */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Data Management</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DATA_FEATURES.map((feature) => (
                  <Card
                    key={feature.id}
                    className="cursor-pointer hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all"
                    onClick={() => {
                      if (feature.id === 'scheduled_refresh') setShowScheduleDialog(true);
                      else if (feature.id === 'transformations') setShowTransformDialog(true);
                      else if (feature.id === 'data_blending') setShowBlendDialog(true);
                      else toast.info(`${feature.name} - Coming soon!`);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                          <feature.icon className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{feature.name}</h3>
                            {feature.badge && (
                              <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{feature.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Enterprise Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Enterprise Features</h2>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">Enterprise</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {ENTERPRISE_FEATURES.map((feature) => (
                  <Card
                    key={feature.id}
                    className="cursor-pointer hover:shadow-lg transition-all opacity-75 hover:opacity-100"
                    onClick={() => toast.info(`${feature.name} is available on Enterprise plan`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <feature.icon className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{feature.name}</h3>
                          <p className="text-sm text-muted-foreground">{feature.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Connector Dialog */}
        <Dialog open={showConnectorDialog} onOpenChange={setShowConnectorDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedConnector && (
                  <>
                    <selectedConnector.icon className="w-5 h-5" />
                    Connect {selectedConnector.name}
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedConnector?.oauth 
                  ? `Authorize DataViz Studio to access your ${selectedConnector.name} data`
                  : 'Enter your connection details below'
                }
              </DialogDescription>
            </DialogHeader>
            
            {renderConnectorConfigForm()}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowConnectorDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConnect} 
                disabled={connecting}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {connecting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                ) : selectedConnector?.oauth ? (
                  <><ExternalLink className="w-4 h-4 mr-2" /> Connect with {selectedConnector?.name}</>
                ) : (
                  <><Plug className="w-4 h-4 mr-2" /> Connect</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Scheduled Refresh Dialog */}
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-500" />
                Scheduled Data Refresh
              </DialogTitle>
              <DialogDescription>
                Set up automatic data refresh for your sources
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Select Data Source</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Refresh Frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Time (UTC)</Label>
                <Input type="time" defaultValue="09:00" />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
              <Button onClick={() => { toast.success('Schedule saved!'); setShowScheduleDialog(false); }}>
                Save Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Data Transformations Dialog */}
        <Dialog open={showTransformDialog} onOpenChange={setShowTransformDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-violet-500" />
                Data Transformations
              </DialogTitle>
              <DialogDescription>
                Clean, filter, and transform your data before visualization
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Select Dataset</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 cursor-pointer hover:border-violet-300" onClick={() => toast.info('Filter rows')}>
                  <h4 className="font-medium">Filter Rows</h4>
                  <p className="text-sm text-muted-foreground">Remove rows based on conditions</p>
                </Card>
                <Card className="p-4 cursor-pointer hover:border-violet-300" onClick={() => toast.info('Rename columns')}>
                  <h4 className="font-medium">Rename Columns</h4>
                  <p className="text-sm text-muted-foreground">Change column names</p>
                </Card>
                <Card className="p-4 cursor-pointer hover:border-violet-300" onClick={() => toast.info('Calculate column')}>
                  <h4 className="font-medium">Add Calculated Column</h4>
                  <p className="text-sm text-muted-foreground">Create new columns with formulas</p>
                </Card>
                <Card className="p-4 cursor-pointer hover:border-violet-300" onClick={() => toast.info('Change type')}>
                  <h4 className="font-medium">Change Data Type</h4>
                  <p className="text-sm text-muted-foreground">Convert column types</p>
                </Card>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowTransformDialog(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Data Blending Dialog */}
        <Dialog open={showBlendDialog} onOpenChange={setShowBlendDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-violet-500" />
                Data Blending
              </DialogTitle>
              <DialogDescription>
                Join and merge multiple datasets
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Left Dataset</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Right Dataset</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Join Type</Label>
                <Select defaultValue="inner">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inner">Inner Join</SelectItem>
                    <SelectItem value="left">Left Join</SelectItem>
                    <SelectItem value="right">Right Join</SelectItem>
                    <SelectItem value="outer">Full Outer Join</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Join Key</Label>
                <p className="text-sm text-muted-foreground mb-2">Select matching columns from both datasets</p>
                <div className="grid grid-cols-2 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Left column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">id</SelectItem>
                      <SelectItem value="email">email</SelectItem>
                      <SelectItem value="name">name</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Right column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user_id">user_id</SelectItem>
                      <SelectItem value="customer_email">customer_email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowBlendDialog(false)}>Cancel</Button>
              <Button onClick={() => { toast.success('Datasets merged!'); setShowBlendDialog(false); }}>
                <GitMerge className="w-4 h-4 mr-2" />
                Merge Datasets
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* S3 File Browser Dialog */}
        <Dialog open={showS3Browser} onOpenChange={setShowS3Browser}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-orange-500" />
                Browse S3 Files
              </DialogTitle>
              <DialogDescription>
                Select a file to import as a dataset
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Breadcrumb navigation */}
              <div className="flex items-center gap-2 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setS3CurrentBucket(null);
                    setS3CurrentPrefix('');
                    setS3Files([]);
                    setS3Folders([]);
                  }}
                  className={!s3CurrentBucket ? 'font-semibold' : ''}
                >
                  Buckets
                </Button>
                {s3CurrentBucket && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadS3Files(selectedS3Connection, s3CurrentBucket, '')}
                      className={!s3CurrentPrefix ? 'font-semibold' : ''}
                    >
                      {s3CurrentBucket}
                    </Button>
                  </>
                )}
                {s3CurrentPrefix && s3CurrentPrefix.split('/').filter(Boolean).map((part, idx, arr) => {
                  const prefixPath = arr.slice(0, idx + 1).join('/') + '/';
                  return (
                    <React.Fragment key={prefixPath}>
                      <ChevronRight className="w-4 h-4" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadS3Files(selectedS3Connection, s3CurrentBucket, prefixPath)}
                        className={prefixPath === s3CurrentPrefix ? 'font-semibold' : ''}
                      >
                        {part}
                      </Button>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* File list */}
              <div className="border rounded-lg overflow-hidden">
                {s3Loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : !s3CurrentBucket ? (
                  // Show buckets
                  <div className="divide-y">
                    {s3Buckets.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        No buckets found
                      </div>
                    ) : (
                      s3Buckets.map((bucket) => (
                        <div
                          key={bucket.name}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                          onClick={() => loadS3Files(selectedS3Connection, bucket.name, '')}
                        >
                          <FolderOpen className="w-5 h-5 text-orange-500" />
                          <div className="flex-1">
                            <p className="font-medium">{bucket.name}</p>
                            {bucket.created && (
                              <p className="text-xs text-muted-foreground">
                                Created: {new Date(bucket.created).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Show files and folders
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {s3Folders.length === 0 && s3Files.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        This folder is empty
                      </div>
                    ) : (
                      <>
                        {/* Folders */}
                        {s3Folders.map((folder) => (
                          <div
                            key={folder.key}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                            onClick={() => loadS3Files(selectedS3Connection, s3CurrentBucket, folder.key)}
                          >
                            <FolderOpen className="w-5 h-5 text-amber-500" />
                            <div className="flex-1">
                              <p className="font-medium">{folder.name}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ))}
                        {/* Files */}
                        {s3Files.map((file) => (
                          <div
                            key={file.key}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50"
                          >
                            {file.type === 'csv' && <FileSpreadsheet className="w-5 h-5 text-green-500" />}
                            {file.type === 'json' && <FileSpreadsheet className="w-5 h-5 text-blue-500" />}
                            {file.type === 'excel' && <FileSpreadsheet className="w-5 h-5 text-emerald-500" />}
                            {!['csv', 'json', 'excel', 'parquet'].includes(file.type) && (
                              <HardDrive className="w-5 h-5 text-gray-400" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.size_formatted} • {file.last_modified && new Date(file.last_modified).toLocaleString()}
                              </p>
                            </div>
                            {file.importable && (
                              <Button
                                size="sm"
                                onClick={() => importS3File(selectedS3Connection, s3CurrentBucket, file.key, file.name)}
                                disabled={s3Importing}
                                data-testid={`import-s3-file-${file.name}`}
                              >
                                {s3Importing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Download className="w-4 h-4 mr-1" />
                                    Import
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowS3Browser(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Google Sheets Browser Dialog */}
        <Dialog open={showGoogleBrowser} onOpenChange={setShowGoogleBrowser}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-500" />
                Your Google Sheets
              </DialogTitle>
              <DialogDescription>
                Select a spreadsheet to import
              </DialogDescription>
            </DialogHeader>
            
            <div className="border rounded-lg overflow-hidden">
              {googleLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                </div>
              ) : googleSpreadsheets.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No spreadsheets found
                </div>
              ) : (
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {googleSpreadsheets.map((sheet) => (
                    <div
                      key={sheet.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">{sheet.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sheet.owner && `By ${sheet.owner} • `}
                          {sheet.modified_time && `Modified ${new Date(sheet.modified_time).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => importGoogleSpreadsheet(selectedGoogleConnection, sheet.id, sheet.name)}
                        data-testid={`import-sheet-${sheet.id}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Import
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowGoogleBrowser(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default DataSourcesPage;
