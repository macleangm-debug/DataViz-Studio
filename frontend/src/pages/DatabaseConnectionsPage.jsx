import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Settings,
  Link2,
  Server,
  Calendar,
  Timer
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
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

const DB_TYPES = [
  { value: 'mongodb', label: 'MongoDB', port: 27017, icon: '🍃' },
  { value: 'postgresql', label: 'PostgreSQL', port: 5432, icon: '🐘' },
  { value: 'mysql', label: 'MySQL', port: 3306, icon: '🐬' },
];

export function DatabaseConnectionsPage() {
  const { currentOrg } = useOrgStore();
  const { token } = useAuthStore();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [newConnection, setNewConnection] = useState({
    name: '',
    db_type: 'mongodb',
    host: 'localhost',
    port: 27017,
    database: '',
    username: '',
    password: ''
  });
  const [scheduleDialog, setScheduleDialog] = useState(null);
  const [scheduleConfig, setScheduleConfig] = useState({
    interval_type: 'daily',
    interval_value: 1,
    custom_cron: '',
    enabled: true
  });

  useEffect(() => {
    fetchConnections();
  }, [currentOrg]);

  const fetchConnections = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const orgParam = currentOrg?.id ? `?org_id=${currentOrg.id}` : '';
      const response = await axios.get(`${API_URL}/api/database-connections${orgParam}`, { headers });
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newConnection.name || !newConnection.database) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/api/database-connections`, {
        ...newConnection,
        org_id: currentOrg?.id
      }, { headers });
      
      toast.success('Connection created');
      setShowCreateDialog(false);
      setNewConnection({
        name: '',
        db_type: 'mongodb',
        host: 'localhost',
        port: 27017,
        database: '',
        username: '',
        password: ''
      });
      fetchConnections();
    } catch (error) {
      toast.error('Failed to create connection');
    }
  };

  const handleTest = async (connId) => {
    setTestingId(connId);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API_URL}/api/database-connections/${connId}/test`, {}, { headers });
      
      if (response.data.status === 'connected') {
        toast.success('Connection successful!');
      } else {
        toast.error(`Connection failed: ${response.data.message}`);
      }
      fetchConnections();
    } catch (error) {
      toast.error('Failed to test connection');
    } finally {
      setTestingId(null);
    }
  };

  const handleSync = async (connId) => {
    setSyncingId(connId);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API_URL}/api/database-connections/${connId}/sync`, {}, { headers });
      
      if (response.data.status === 'success') {
        const count = response.data.datasets?.length || 0;
        toast.success(`Synced ${count} dataset(s) successfully!`);
      } else {
        toast.error(`Sync failed: ${response.data.message}`);
      }
      fetchConnections();
    } catch (error) {
      toast.error('Failed to sync data');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (connId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/database-connections/${connId}`, { headers });
      toast.success('Connection deleted');
      setDeleteDialog(null);
      fetchConnections();
    } catch (error) {
      toast.error('Failed to delete connection');
    }
  };

  const openScheduleDialog = (conn) => {
    setScheduleDialog(conn);
    if (conn.schedule) {
      setScheduleConfig({
        interval_type: conn.schedule.interval_type || 'daily',
        interval_value: conn.schedule.interval_value || 1,
        custom_cron: conn.schedule.custom_cron || '',
        enabled: conn.schedule.enabled !== false
      });
    } else {
      setScheduleConfig({
        interval_type: 'daily',
        interval_value: 1,
        custom_cron: '',
        enabled: true
      });
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleDialog) return;
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(
        `${API_URL}/api/database-connections/${scheduleDialog.id}/schedule`,
        { conn_id: scheduleDialog.id, ...scheduleConfig },
        { headers }
      );
      
      if (response.data.status === 'scheduled') {
        toast.success(`Schedule set: ${response.data.schedule}`);
      } else if (response.data.status === 'disabled') {
        toast.success('Schedule disabled');
      }
      
      setScheduleDialog(null);
      fetchConnections();
    } catch (error) {
      toast.error('Failed to set schedule');
    }
  };

  const handleRemoveSchedule = async (connId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/database-connections/${connId}/schedule`, { headers });
      toast.success('Schedule removed');
      fetchConnections();
    } catch (error) {
      toast.error('Failed to remove schedule');
    }
  };

  const handleDbTypeChange = (dbType) => {
    const dbInfo = DB_TYPES.find(d => d.value === dbType);
    setNewConnection({
      ...newConnection,
      db_type: dbType,
      port: dbInfo?.port || 27017
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'connected':
      case 'synced':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="database-connections-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Database Connections</h1>
            <p className="text-muted-foreground mt-1">
              Connect to external databases and sync data in real-time
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-violet-600 hover:bg-violet-700"
            data-testid="add-connection-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>

        {/* Database Type Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {DB_TYPES.map((db) => (
            <Card
              key={db.value}
              className="cursor-pointer hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all"
              onClick={() => {
                handleDbTypeChange(db.value);
                setShowCreateDialog(true);
              }}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-2xl">
                  {db.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{db.label}</h3>
                  <p className="text-sm text-muted-foreground">Default port: {db.port}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Connections List */}
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
        ) : connections.length > 0 ? (
          <div className="space-y-4">
            {connections.map((conn, index) => {
              const dbInfo = DB_TYPES.find(d => d.value === conn.db_type);
              return (
                <motion.div
                  key={conn.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-2xl">
                            {dbInfo?.icon || '🗄️'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{conn.name}</h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Server className="w-3 h-3" />
                              <span>{conn.host}:{conn.port}</span>
                              <span className="text-muted-foreground/50">•</span>
                              <Database className="w-3 h-3" />
                              <span>{conn.database}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(conn.status)}
                              {conn.schedule?.enabled && (
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  <Timer className="w-3 h-3 mr-1" />
                                  {conn.schedule.description}
                                </Badge>
                              )}
                              {conn.last_sync && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Last sync: {new Date(conn.last_sync).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTest(conn.id)}
                            disabled={testingId === conn.id}
                            data-testid={`test-connection-${conn.id}`}
                          >
                            {testingId === conn.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Link2 className="w-4 h-4" />
                            )}
                            <span className="ml-2">Test</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(conn.id)}
                            disabled={syncingId === conn.id}
                            data-testid={`sync-connection-${conn.id}`}
                          >
                            {syncingId === conn.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            <span className="ml-2">Sync</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openScheduleDialog(conn)}
                            data-testid={`schedule-connection-${conn.id}`}
                          >
                            <Calendar className="w-4 h-4" />
                            <span className="ml-2">Schedule</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteDialog(conn)}
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
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No database connections</h3>
              <p className="text-muted-foreground mb-4">
                Connect to external databases to sync and visualize data
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Connection
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Connection Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Database Connection</DialogTitle>
              <DialogDescription>
                Connect to an external database to sync data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Connection Name *</Label>
                <Input
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  placeholder="Production Database"
                  data-testid="connection-name-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Database Type *</Label>
                <Select value={newConnection.db_type} onValueChange={handleDbTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DB_TYPES.map((db) => (
                      <SelectItem key={db.value} value={db.value}>
                        <span className="mr-2">{db.icon}</span>
                        {db.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Host *</Label>
                  <Input
                    value={newConnection.host}
                    onChange={(e) => setNewConnection({ ...newConnection, host: e.target.value })}
                    placeholder="localhost"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port *</Label>
                  <Input
                    type="number"
                    value={newConnection.port}
                    onChange={(e) => setNewConnection({ ...newConnection, port: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Database Name *</Label>
                <Input
                  value={newConnection.database}
                  onChange={(e) => setNewConnection({ ...newConnection, database: e.target.value })}
                  placeholder="myapp_production"
                  data-testid="database-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={newConnection.username}
                    onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newConnection.password}
                    onChange={(e) => setNewConnection({ ...newConnection, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-violet-600 hover:bg-violet-700">
                  Create Connection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Connection</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteDialog?.name}"? This will not delete any datasets synced from this connection.
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

        {/* Schedule Dialog */}
        <Dialog open={!!scheduleDialog} onOpenChange={() => setScheduleDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                Schedule Auto-Refresh
              </DialogTitle>
              <DialogDescription>
                Configure automatic data sync for "{scheduleDialog?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="schedule-enabled">Enable Scheduled Refresh</Label>
                <Switch
                  id="schedule-enabled"
                  checked={scheduleConfig.enabled}
                  onCheckedChange={(checked) => setScheduleConfig({ ...scheduleConfig, enabled: checked })}
                />
              </div>
              
              {scheduleConfig.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Refresh Interval</Label>
                    <Select 
                      value={scheduleConfig.interval_type} 
                      onValueChange={(v) => setScheduleConfig({ ...scheduleConfig, interval_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="custom">Custom (Cron)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {scheduleConfig.interval_type !== 'custom' && (
                    <div className="space-y-2">
                      <Label>Every</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="24"
                          value={scheduleConfig.interval_value}
                          onChange={(e) => setScheduleConfig({ ...scheduleConfig, interval_value: parseInt(e.target.value) || 1 })}
                          className="w-20"
                        />
                        <span className="text-muted-foreground">
                          {scheduleConfig.interval_type === 'hourly' && 'hour(s)'}
                          {scheduleConfig.interval_type === 'daily' && 'day(s)'}
                          {scheduleConfig.interval_type === 'weekly' && 'week(s)'}
                        </span>
                      </div>
                    </div>
                  )}

                  {scheduleConfig.interval_type === 'custom' && (
                    <div className="space-y-2">
                      <Label>Cron Expression</Label>
                      <Input
                        value={scheduleConfig.custom_cron}
                        onChange={(e) => setScheduleConfig({ ...scheduleConfig, custom_cron: e.target.value })}
                        placeholder="0 */6 * * *"
                      />
                      <p className="text-xs text-muted-foreground">
                        Example: "0 */6 * * *" runs every 6 hours
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <p className="text-sm text-violet-700 dark:text-violet-300">
                      <Timer className="w-4 h-4 inline mr-1" />
                      {scheduleConfig.interval_type === 'custom' 
                        ? `Custom schedule: ${scheduleConfig.custom_cron || 'Not set'}`
                        : `Data will sync every ${scheduleConfig.interval_value} ${
                            scheduleConfig.interval_type === 'hourly' ? 'hour' :
                            scheduleConfig.interval_type === 'daily' ? 'day' :
                            scheduleConfig.interval_type === 'weekly' ? 'week' : 'interval'
                          }(s)`
                      }
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-4">
                {scheduleDialog?.schedule?.enabled && (
                  <Button 
                    variant="outline" 
                    className="text-destructive"
                    onClick={() => {
                      handleRemoveSchedule(scheduleDialog.id);
                      setScheduleDialog(null);
                    }}
                  >
                    Remove Schedule
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" onClick={() => setScheduleDialog(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSchedule} className="bg-violet-600 hover:bg-violet-700">
                    Save Schedule
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default DatabaseConnectionsPage;
