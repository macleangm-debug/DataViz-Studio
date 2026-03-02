/**
 * User Management Page (Admin)
 * Features:
 * - User list with search/filter
 * - User suspension/deactivation
 * - Bulk user import (CSV)
 * - Role management
 * - Activity overview
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  MoreVertical,
  Mail,
  Shield,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  FileText,
  ArrowUpDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Checkbox } from '../components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuthStore } from '../store';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const roleOptions = [
  { value: 'admin', label: 'Admin', color: 'bg-red-500/10 text-red-500' },
  { value: 'manager', label: 'Manager', color: 'bg-blue-500/10 text-blue-500' },
  { value: 'analyst', label: 'Analyst', color: 'bg-purple-500/10 text-purple-500' },
  { value: 'viewer', label: 'Viewer', color: 'bg-gray-500/10 text-gray-500' }
];

const statusOptions = [
  { value: 'active', label: 'Active', color: 'bg-green-500/10 text-green-500' },
  { value: 'suspended', label: 'Suspended', color: 'bg-yellow-500/10 text-yellow-500' },
  { value: 'deactivated', label: 'Deactivated', color: 'bg-red-500/10 text-red-500' }
];

function UserManagementPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Dialogs
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Bulk import state
  const [csvFile, setCsvFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Invite form
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'viewer',
    message: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        // Mock data for development
        setUsers([
          { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active', lastActive: new Date().toISOString(), avatar: null },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'manager', status: 'active', lastActive: new Date(Date.now() - 86400000).toISOString(), avatar: null },
          { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'analyst', status: 'suspended', lastActive: new Date(Date.now() - 172800000).toISOString(), avatar: null },
          { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'viewer', status: 'active', lastActive: new Date(Date.now() - 3600000).toISOString(), avatar: null },
        ]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/admin/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(inviteData)
      });
      
      if (response.ok) {
        toast.success(`Invitation sent to ${inviteData.email}`);
        setInviteDialogOpen(false);
        setInviteData({ email: '', role: 'viewer', message: '' });
        loadUsers();
      } else {
        toast.error('Failed to send invitation');
      }
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  const handleBulkImport = async () => {
    if (!csvFile) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target.result;
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        
        const emailIndex = headers.findIndex(h => h.includes('email'));
        const nameIndex = headers.findIndex(h => h.includes('name'));
        const roleIndex = headers.findIndex(h => h.includes('role'));
        
        if (emailIndex === -1) {
          toast.error('CSV must have an "email" column');
          setIsImporting(false);
          return;
        }
        
        const results = { success: 0, failed: 0, errors: [] };
        const totalRows = lines.length - 1;
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const email = values[emailIndex];
          const name = nameIndex >= 0 ? values[nameIndex] : email.split('@')[0];
          const role = roleIndex >= 0 ? values[roleIndex] : 'viewer';
          
          if (!email || !email.includes('@')) {
            results.failed++;
            results.errors.push(`Row ${i}: Invalid email`);
            continue;
          }
          
          try {
            const response = await fetch(`${API_URL}/api/admin/users/invite`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ email, name, role })
            });
            
            if (response.ok) {
              results.success++;
            } else {
              results.failed++;
              results.errors.push(`Row ${i}: ${email} - Failed to invite`);
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`Row ${i}: ${email} - Error`);
          }
          
          setImportProgress(Math.round((i / totalRows) * 100));
        }
        
        setImportResults(results);
        setIsImporting(false);
        
        if (results.success > 0) {
          toast.success(`Successfully imported ${results.success} users`);
          loadUsers();
        }
      };
      
      reader.readAsText(csvFile);
    } catch (error) {
      toast.error('Failed to import users');
      setIsImporting(false);
    }
  };

  const handleSuspendUser = async (userId, action) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success(`User ${action === 'suspend' ? 'suspended' : action === 'activate' ? 'activated' : 'deactivated'}`);
        loadUsers();
      } else {
        toast.error(`Failed to ${action} user`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
    setSuspendDialogOpen(false);
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('User deleted');
        loadUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleExportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Last Active'].join(','),
      ...filteredUsers.map(u => [
        u.name,
        u.email,
        u.role,
        u.status,
        new Date(u.lastActive).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Users exported');
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

  const formatLastActive = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 3600000) return 'Just now';
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="user-management-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportUsers}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => setBulkImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <UserCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.status === 'suspended').length}</p>
                  <p className="text-sm text-muted-foreground">Suspended</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Shield className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roleOptions.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="w-4 h-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                          <div className="space-y-2">
                            <div className="w-24 h-4 bg-muted rounded animate-pulse" />
                            <div className="w-32 h-3 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="w-16 h-6 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-16 h-6 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-20 h-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleOptions.find(r => r.value === user.role)?.color}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusOptions.find(s => s.value === user.status)?.color}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatLastActive(user.lastActive)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setEditUserDialogOpen(true); }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Activity
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => { setSelectedUser(user); setSuspendDialogOpen(true); }}
                                className="text-yellow-500"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleSuspendUser(user.id, 'activate')}
                                className="text-green-500"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No users found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Invite User Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>Send an invitation to join your organization</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteData.role} onValueChange={(v) => setInviteData({ ...inviteData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Personal Message (Optional)</Label>
                <Textarea
                  placeholder="Add a personal note to the invitation..."
                  value={inviteData.message}
                  onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog open={bulkImportDialogOpen} onOpenChange={setBulkImportDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Bulk Import Users</DialogTitle>
              <DialogDescription>Upload a CSV file to import multiple users at once</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {csvFile ? (
                  <div className="space-y-2">
                    <FileText className="w-10 h-10 mx-auto text-primary" />
                    <p className="font-medium">{csvFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(csvFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setCsvFile(null)}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p>Drop your CSV file here or</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">CSV Format:</p>
                <code className="text-xs">email,name,role</code>
                <p className="text-muted-foreground mt-2">
                  Required column: <strong>email</strong><br />
                  Optional columns: name, role (admin/manager/analyst/viewer)
                </p>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {importResults && (
                <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{importResults.success} users imported successfully</span>
                  </div>
                  {importResults.failed > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="w-4 h-4" />
                      <span>{importResults.failed} failed</span>
                    </div>
                  )}
                  {importResults.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto text-xs text-muted-foreground">
                      {importResults.errors.map((err, i) => (
                        <p key={i}>{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setBulkImportDialogOpen(false); setCsvFile(null); setImportResults(null); }}>
                Cancel
              </Button>
              <Button onClick={handleBulkImport} disabled={!csvFile || isImporting}>
                {isImporting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Import Users
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend User Dialog */}
        <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to suspend {selectedUser?.name}? They will lose access to the platform until reactivated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleSuspendUser(selectedUser?.id, 'suspend')}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                <UserX className="w-4 h-4 mr-2" />
                Suspend User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

export default UserManagementPage;
