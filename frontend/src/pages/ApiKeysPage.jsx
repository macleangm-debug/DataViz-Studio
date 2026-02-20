/**
 * API Keys Management Page
 */
import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Shield,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { toast } from 'sonner';

// Generate a random API key
const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'dvs_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

// Sample API keys
const INITIAL_KEYS = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'dvs_prod_' + 'x'.repeat(28),
    created: '2024-01-15',
    lastUsed: '2024-02-16',
    status: 'active',
    permissions: ['read', 'write'],
    rateLimit: 10000,
    usageThisMonth: 4523
  },
  {
    id: '2',
    name: 'Development Key',
    key: 'dvs_dev_' + 'y'.repeat(29),
    created: '2024-02-01',
    lastUsed: '2024-02-15',
    status: 'active',
    permissions: ['read'],
    rateLimit: 1000,
    usageThisMonth: 234
  }
];

const PERMISSIONS = [
  { id: 'read', label: 'Read', description: 'Access dashboards and data' },
  { id: 'write', label: 'Write', description: 'Create and modify resources' },
  { id: 'delete', label: 'Delete', description: 'Remove resources' },
  { id: 'admin', label: 'Admin', description: 'Full administrative access' },
];

export function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState(INITIAL_KEYS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState(['read']);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [generatedKey, setGeneratedKey] = useState(null);

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    const newKey = generateApiKey();
    const keyData = {
      id: Date.now().toString(),
      name: newKeyName,
      key: newKey,
      created: new Date().toISOString().split('T')[0],
      lastUsed: null,
      status: 'active',
      permissions: newKeyPermissions,
      rateLimit: newKeyRateLimit,
      usageThisMonth: 0
    };

    setApiKeys([...apiKeys, keyData]);
    setGeneratedKey(newKey);
    setNewKeyName('');
    setNewKeyPermissions(['read']);
    toast.success('API key created successfully');
  };

  const handleDeleteKey = (id) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
    toast.success('API key deleted');
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const handleToggleStatus = (id) => {
    setApiKeys(apiKeys.map(k => 
      k.id === id ? { ...k, status: k.status === 'active' ? 'inactive' : 'active' } : k
    ));
  };

  const toggleKeyVisibility = (id) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key) => {
    return key.substring(0, 8) + '•'.repeat(24) + key.substring(key.length - 4);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6" data-testid="api-keys-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
            <p className="text-muted-foreground mt-1">
              Manage your API keys for programmatic access
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-violet-600 hover:bg-violet-700"
            data-testid="create-api-key-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <Key className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{apiKeys.length}</p>
                  <p className="text-sm text-muted-foreground">Total Keys</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {apiKeys.filter(k => k.status === 'active').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Keys</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {apiKeys.reduce((sum, k) => sum + k.usageThisMonth, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">API Calls (Month)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              Use these keys to authenticate API requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No API keys yet</p>
                <p className="text-sm text-muted-foreground">Create one to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div 
                    key={apiKey.id}
                    className="p-4 rounded-lg bg-muted/30 border border-border"
                    data-testid={`api-key-${apiKey.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{apiKey.name}</h4>
                          <Badge 
                            variant={apiKey.status === 'active' ? 'default' : 'secondary'}
                            className={apiKey.status === 'active' 
                              ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                              : 'bg-gray-500/10 text-gray-500'
                            }
                          >
                            {apiKey.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created {apiKey.created} • Last used {apiKey.lastUsed || 'Never'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={apiKey.status === 'active'}
                          onCheckedChange={() => handleToggleStatus(apiKey.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteKey(apiKey.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          data-testid={`delete-key-${apiKey.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Key Display */}
                    <div className="flex items-center gap-2 p-2 bg-background rounded border border-border">
                      <code className="flex-1 text-sm font-mono text-muted-foreground">
                        {visibleKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        data-testid={`toggle-visibility-${apiKey.id}`}
                      >
                        {visibleKeys[apiKey.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyKey(apiKey.key)}
                        data-testid={`copy-key-${apiKey.id}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Permissions & Usage */}
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Permissions:</span>
                        {apiKey.permissions.map(perm => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-muted-foreground">
                        {apiKey.usageThisMonth.toLocaleString()} / {apiKey.rateLimit.toLocaleString()} calls
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Documentation Quick Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Reference</CardTitle>
            <CardDescription>
              How to use your API key
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Authentication Header</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <code className="text-sm font-mono">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Example Request</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto">
                  <code className="text-sm font-mono whitespace-pre">{`curl -X GET "https://api.dataviz.studio/v1/dashboards" \\
  -H "Authorization: Bearer dvs_your_api_key" \\
  -H "Content-Type: application/json"`}</code>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Keep your API keys secure. Never share them publicly.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Key Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create API Key</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setShowCreateModal(false);
                      setGeneratedKey(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Create a new API key for programmatic access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedKey ? (
                  <>
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-green-500">API Key Created</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Copy your key now. You won't be able to see it again.
                      </p>
                      <div className="flex items-center gap-2 p-2 bg-background rounded border">
                        <code className="flex-1 text-sm font-mono break-all">{generatedKey}</code>
                        <Button size="sm" onClick={() => handleCopyKey(generatedKey)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setShowCreateModal(false);
                        setGeneratedKey(null);
                      }}
                    >
                      Done
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Key Name</Label>
                      <Input
                        placeholder="e.g., Production API Key"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        data-testid="new-key-name-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Permissions</Label>
                      <div className="space-y-2">
                        {PERMISSIONS.map((perm) => (
                          <label 
                            key={perm.id}
                            className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={newKeyPermissions.includes(perm.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewKeyPermissions([...newKeyPermissions, perm.id]);
                                } else {
                                  setNewKeyPermissions(newKeyPermissions.filter(p => p !== perm.id));
                                }
                              }}
                              className="mt-1"
                            />
                            <div>
                              <span className="font-medium text-foreground">{perm.label}</span>
                              <p className="text-sm text-muted-foreground">{perm.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rate Limit (calls/month)</Label>
                      <select
                        value={newKeyRateLimit}
                        onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
                      >
                        <option value={1000}>1,000 calls/month</option>
                        <option value={10000}>10,000 calls/month</option>
                        <option value={100000}>100,000 calls/month</option>
                        <option value={-1}>Unlimited</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setShowCreateModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1 bg-violet-600 hover:bg-violet-700"
                        onClick={handleCreateKey}
                        data-testid="create-key-submit-btn"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Generate Key
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ApiKeysPage;
