# DataViz Studio - Reusable Components Library

> Reusable code patterns for Organization CRUD, Public Dashboard Sharing, and Scheduled Report Delivery

---

## Table of Contents
1. [Organization CRUD with Tier Limits](#1-organization-crud-with-tier-limits)
2. [Public Dashboard Sharing](#2-public-dashboard-sharing)
3. [Scheduled Report Delivery (Resend)](#3-scheduled-report-delivery-resend)

---

## 1. Organization CRUD with Tier Limits

### Backend API (FastAPI)

```python
# /backend/routes/organization_routes.py
"""Organization CRUD with Tier-Based Limits"""
from fastapi import APIRouter, HTTPException, status, Request, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/organizations", tags=["Organizations"])

# Tier limits configuration
TIER_LIMITS = {
    "free": 1,
    "starter": 3,
    "pro": 10,
    "enterprise": float('inf')  # Unlimited
}

class OrganizationCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    logo: Optional[str]
    is_active: bool
    created_at: str

def slugify(text: str) -> str:
    """Convert text to URL-safe slug"""
    import re
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text

async def get_user_tier(db, user_id: str) -> str:
    """Get user's subscription tier"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "subscription_tier": 1})
    return user.get("subscription_tier", "free") if user else "free"

async def get_user_org_count(db, user_id: str) -> int:
    """Count organizations owned by user"""
    return await db.organizations.count_documents({"owner_id": user_id})

@router.post("", response_model=OrganizationResponse)
async def create_organization(request: Request, data: OrganizationCreate, current_user: dict = Depends(get_current_user)):
    """Create a new organization with tier limit enforcement"""
    db = request.app.state.db
    user_id = current_user["user_id"]
    
    # Check tier limit
    user_tier = await get_user_tier(db, user_id)
    current_count = await get_user_org_count(db, user_id)
    limit = TIER_LIMITS.get(user_tier, 1)
    
    if current_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Organization limit reached ({int(limit)}). Upgrade your plan to create more."
        )
    
    # Generate slug
    slug = data.slug or slugify(data.name)
    
    # Check slug uniqueness
    existing = await db.organizations.find_one({"slug": slug})
    if existing:
        slug = f"{slug}-{str(uuid.uuid4())[:8]}"
    
    org_doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "slug": slug,
        "description": data.description,
        "logo": data.logo,
        "owner_id": user_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.organizations.insert_one(org_doc)
    del org_doc["_id"]
    
    return org_doc

@router.get("")
async def list_organizations(request: Request, current_user: dict = Depends(get_current_user)):
    """List user's organizations"""
    db = request.app.state.db
    user_id = current_user["user_id"]
    
    # Get organizations where user is owner or member
    owned_orgs = await db.organizations.find(
        {"owner_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    # Get organizations where user is a member
    memberships = await db.org_members.find(
        {"user_id": user_id},
        {"_id": 0, "org_id": 1}
    ).to_list(100)
    member_org_ids = [m["org_id"] for m in memberships]
    
    member_orgs = []
    if member_org_ids:
        member_orgs = await db.organizations.find(
            {"id": {"$in": member_org_ids}},
            {"_id": 0}
        ).to_list(100)
    
    # Combine and deduplicate
    all_orgs = {org["id"]: org for org in owned_orgs + member_orgs}
    return list(all_orgs.values())

@router.get("/{org_id}")
async def get_organization(request: Request, org_id: str, current_user: dict = Depends(get_current_user)):
    """Get organization details"""
    db = request.app.state.db
    
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    return org

@router.put("/{org_id}")
async def update_organization(request: Request, org_id: str, data: OrganizationUpdate, current_user: dict = Depends(get_current_user)):
    """Update organization"""
    db = request.app.state.db
    user_id = current_user["user_id"]
    
    # Verify ownership
    org = await db.organizations.find_one({"id": org_id, "owner_id": user_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found or access denied")
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.organizations.update_one({"id": org_id}, {"$set": update_data})
    
    return {"status": "updated", "id": org_id}

@router.delete("/{org_id}")
async def delete_organization(request: Request, org_id: str, current_user: dict = Depends(get_current_user)):
    """Delete organization"""
    db = request.app.state.db
    user_id = current_user["user_id"]
    
    # Verify ownership
    org = await db.organizations.find_one({"id": org_id, "owner_id": user_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found or access denied")
    
    # Delete organization and related data
    await db.organizations.delete_one({"id": org_id})
    await db.org_members.delete_many({"org_id": org_id})
    
    return {"status": "deleted", "id": org_id}

@router.get("/{org_id}/members")
async def list_members(request: Request, org_id: str, current_user: dict = Depends(get_current_user)):
    """List organization members"""
    db = request.app.state.db
    
    members = await db.org_members.find(
        {"org_id": org_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"members": members}
```

### Frontend Component (React)

```jsx
// /frontend/src/pages/OrganizationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Trash2, Edit2, MoreHorizontal, Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Tier limits - sync with backend
const TIER_LIMITS = {
  free: 1,
  starter: 3,
  pro: 10,
  enterprise: Infinity
};

const OrganizationCard = ({ org, onEdit, onDelete, onSelect, isSelected }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group">
    <Card className={`bg-card/50 border-border/50 hover:border-primary/50 transition-all cursor-pointer ${
      isSelected ? 'border-primary ring-2 ring-primary/20' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3" onClick={() => onSelect(org)}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-barlow text-white flex items-center gap-2">
                {org.name}
                {isSelected && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary">Active</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">{org.slug}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(org)}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(org)} className="text-red-500">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0" onClick={() => onSelect(org)}>
        {org.description && <p className="text-sm text-gray-400 mb-3 line-clamp-2">{org.description}</p>}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          Created {new Date(org.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export function OrganizationsPage() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userTier, setUserTier] = useState('free');

  const orgLimit = TIER_LIMITS[userTier] || 1;
  const canCreateMore = organizations.length < orgLimit;

  useEffect(() => {
    loadOrganizations();
  }, []);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/organizations`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data || []);
      }
    } catch (error) {
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    if (!canCreateMore && !isEditing) {
      toast.error(`You've reached your organization limit (${orgLimit}). Upgrade to create more.`);
      return;
    }

    setSaving(true);
    try {
      const url = isEditing 
        ? `${API_URL}/api/organizations/${selectedOrg.id}`
        : `${API_URL}/api/organizations`;
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        })
      });

      if (response.ok) {
        toast.success(isEditing ? 'Organization updated' : 'Organization created');
        setShowCreateDialog(false);
        setFormData({ name: '', description: '' });
        loadOrganizations();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save organization');
      }
    } catch (error) {
      toast.error('Failed to save organization');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;
    try {
      const response = await fetch(`${API_URL}/api/organizations/${selectedOrg.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Organization deleted');
        setShowDeleteDialog(false);
        loadOrganizations();
      }
    } catch (error) {
      toast.error('Failed to delete organization');
    }
  };

  return (
    <div className="space-y-6" data-testid="organizations-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Organizations</h1>
          <p className="text-gray-400">
            Manage your organizations ({organizations.length}/{orgLimit === Infinity ? '∞' : orgLimit})
          </p>
        </div>
        <Button onClick={() => { setIsEditing(false); setFormData({ name: '', description: '' }); setShowCreateDialog(true); }}
          disabled={!canCreateMore}>
          <Plus className="w-4 h-4 mr-2" /> Create Organization
        </Button>
      </div>

      {/* Limit Warning */}
      {!canCreateMore && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-amber-200 text-sm">
              You've reached your organization limit ({orgLimit}). Upgrade your plan to create more.
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>Upgrade</Button>
          </CardContent>
        </Card>
      )}

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map((org) => (
          <OrganizationCard
            key={org.id}
            org={org}
            onEdit={(org) => { setSelectedOrg(org); setFormData({ name: org.name, description: org.description || '' }); setIsEditing(true); setShowCreateDialog(true); }}
            onDelete={(org) => { setSelectedOrg(org); setShowDeleteDialog(true); }}
            onSelect={setCurrentOrg}
            isSelected={currentOrg?.id === org.id}
          />
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Organization' : 'Create Organization'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corporation" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedOrg?.name}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default OrganizationsPage;
```

---

## 2. Public Dashboard Sharing

### Backend API (FastAPI)

```python
# /backend/routes/sharing_routes.py
"""Public Dashboard Sharing with Password Protection"""
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import secrets
import hashlib

router = APIRouter(prefix="/api/dashboards", tags=["Dashboard Sharing"])

class ShareSettings(BaseModel):
    is_public: bool = False
    password_protected: bool = False
    password: Optional[str] = None
    expires_at: Optional[str] = None  # ISO datetime string

class PublicDashboardAccess(BaseModel):
    password: Optional[str] = None

def hash_password(password: str) -> str:
    """Hash password for storage"""
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/{dashboard_id}/share")
async def create_public_share(request: Request, dashboard_id: str, settings: ShareSettings):
    """Generate or update public share link for a dashboard"""
    db = request.app.state.db
    
    dashboard = await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    public_id = dashboard.get("public_id") or secrets.token_urlsafe(16)
    password_hash = hash_password(settings.password) if settings.password_protected and settings.password else None
    
    share_settings = {
        "public_id": public_id,
        "is_public": settings.is_public,
        "password_protected": settings.password_protected,
        "password_hash": password_hash,
        "share_expires_at": settings.expires_at,
        "share_created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.dashboards.update_one({"id": dashboard_id}, {"$set": share_settings})
    
    base_url = str(request.base_url).rstrip('/')
    return {
        "public_id": public_id,
        "public_url": f"{base_url}/public/dashboard/{public_id}",
        "password_protected": settings.password_protected,
        "expires_at": settings.expires_at,
        "is_public": settings.is_public
    }

@router.delete("/{dashboard_id}/share")
async def revoke_public_share(request: Request, dashboard_id: str):
    """Revoke public share link"""
    db = request.app.state.db
    
    result = await db.dashboards.update_one(
        {"id": dashboard_id},
        {"$set": {"is_public": False, "public_id": None, "password_hash": None, "share_expires_at": None}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    return {"status": "success", "message": "Public share revoked"}

@router.get("/{dashboard_id}/share")
async def get_share_settings(request: Request, dashboard_id: str):
    """Get current share settings"""
    db = request.app.state.db
    
    dashboard = await db.dashboards.find_one(
        {"id": dashboard_id},
        {"_id": 0, "public_id": 1, "is_public": 1, "password_protected": 1, "share_expires_at": 1}
    )
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    base_url = str(request.base_url).rstrip('/')
    public_url = f"{base_url}/public/dashboard/{dashboard['public_id']}" if dashboard.get("public_id") else None
    
    return {
        "is_public": dashboard.get("is_public", False),
        "public_id": dashboard.get("public_id"),
        "public_url": public_url,
        "password_protected": dashboard.get("password_protected", False),
        "expires_at": dashboard.get("share_expires_at")
    }

# Public access endpoints (no auth required)
@router.get("/public/{public_id}")
async def get_public_dashboard_info(request: Request, public_id: str):
    """Get basic info about a public dashboard (no auth)"""
    db = request.app.state.db
    
    dashboard = await db.dashboards.find_one(
        {"public_id": public_id, "is_public": True},
        {"_id": 0, "name": 1, "description": 1, "password_protected": 1, "share_expires_at": 1}
    )
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found or not public")
    
    expired = False
    if dashboard.get("share_expires_at"):
        expires_at = datetime.fromisoformat(dashboard["share_expires_at"].replace('Z', '+00:00'))
        expired = datetime.now(timezone.utc) > expires_at
    
    return {
        "name": dashboard.get("name", "Untitled Dashboard"),
        "description": dashboard.get("description"),
        "password_protected": dashboard.get("password_protected", False),
        "expired": expired
    }

@router.post("/public/{public_id}/access")
async def access_public_dashboard(request: Request, public_id: str, access: PublicDashboardAccess):
    """Access a public dashboard (validates password if required)"""
    db = request.app.state.db
    
    dashboard = await db.dashboards.find_one(
        {"public_id": public_id, "is_public": True},
        {"_id": 0}
    )
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found or not public")
    
    # Check expiry
    if dashboard.get("share_expires_at"):
        expires_at = datetime.fromisoformat(dashboard["share_expires_at"].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=410, detail="This share link has expired")
    
    # Check password
    if dashboard.get("password_protected"):
        if not access.password:
            raise HTTPException(status_code=401, detail="Password required")
        if hash_password(access.password) != dashboard.get("password_hash"):
            raise HTTPException(status_code=401, detail="Invalid password")
    
    return {
        "id": dashboard["id"],
        "name": dashboard.get("name"),
        "description": dashboard.get("description"),
        "layout": dashboard.get("layout", []),
        "widgets": dashboard.get("widgets", [])
    }
```

### Frontend Components (React)

```jsx
// /frontend/src/components/ShareDashboardDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Share2, Link as LinkIcon, Copy, Check, Lock, Globe, Calendar, Eye, EyeOff, Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from './ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function ShareDashboardDialog({ dashboardId, dashboardName, open, onOpenChange }) {
  const [shareSettings, setShareSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [isPublic, setIsPublic] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiresIn, setExpiresIn] = useState('never');

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  useEffect(() => {
    if (open && dashboardId) loadShareSettings();
  }, [open, dashboardId]);

  const loadShareSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/dashboards/${dashboardId}/share`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setShareSettings(data);
        setIsPublic(data.is_public || false);
        setPasswordProtected(data.password_protected || false);
      }
    } catch (error) {
      console.error('Failed to load share settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShare = async () => {
    setSaving(true);
    try {
      let expiresAt = null;
      if (expiresIn !== 'never') {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(expiresIn));
        expiresAt = date.toISOString();
      }

      const response = await fetch(`${API_URL}/api/dashboards/${dashboardId}/share`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_public: isPublic,
          password_protected: passwordProtected,
          password: passwordProtected ? password : null,
          expires_at: expiresAt
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShareSettings(data);
        toast.success(isPublic ? 'Public link created' : 'Share settings updated');
      }
    } catch (error) {
      toast.error('Failed to update share settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeShare = async () => {
    try {
      await fetch(`${API_URL}/api/dashboards/${dashboardId}/share`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setShareSettings(null);
      setIsPublic(false);
      toast.success('Public link revoked');
    } catch (error) {
      toast.error('Failed to revoke share');
    }
  };

  const handleCopyLink = () => {
    if (shareSettings?.public_url) {
      const publicUrl = shareSettings.public_url.replace('/api/dashboards/public/', '/public/dashboard/');
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied!');
    }
  };

  const getPublicUrl = () => shareSettings?.public_url?.replace('/api/dashboards/public/', '/public/dashboard/') || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" /> Share Dashboard
          </DialogTitle>
          <DialogDescription>Share "{dashboardName}" with others</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Public Access Toggle */}
          <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Public Access</p>
                <p className="text-xs text-gray-400">Anyone with the link can view</p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {isPublic && (
            <>
              {/* Password Protection */}
              <div className="space-y-3 p-4 bg-card/50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium">Password Protection</p>
                      <p className="text-xs text-gray-400">Require password to view</p>
                    </div>
                  </div>
                  <Switch checked={passwordProtected} onCheckedChange={setPasswordProtected} />
                </div>

                {passwordProtected && (
                  <div className="relative mt-3">
                    <Input type={showPassword ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Link Expiration</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never expires</SelectItem>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Save Button */}
              <Button onClick={handleSaveShare} disabled={saving || (passwordProtected && !password)} className="w-full">
                {saving ? 'Saving...' : shareSettings?.public_id ? 'Update Settings' : 'Create Public Link'}
              </Button>

              {/* Generated Link */}
              {shareSettings?.public_id && (
                <div className="space-y-3 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-500/20 text-green-400"><Check className="w-3 h-3 mr-1" /> Link Active</Badge>
                    <Button variant="ghost" size="sm" onClick={handleRevokeShare} className="text-red-400">
                      <Trash2 className="w-4 h-4 mr-1" /> Revoke
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input value={getPublicUrl()} readOnly className="text-xs font-mono" />
                    <Button variant="outline" size="icon" onClick={handleCopyLink}>
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

```jsx
// /frontend/src/pages/PublicDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function PublicDashboardPage() {
  const { publicId } = useParams();
  const [dashboardInfo, setDashboardInfo] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardInfo();
  }, [publicId]);

  const fetchDashboardInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/dashboards/public/${publicId}`);
      if (response.ok) {
        const info = await response.json();
        setDashboardInfo(info);
        
        if (info.expired) {
          setError('This share link has expired');
        } else if (info.password_protected) {
          setPasswordRequired(true);
        } else {
          await fetchDashboard();
        }
      } else {
        setError('Dashboard not found or no longer public');
      }
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async (pwd = null) => {
    setAuthenticating(true);
    try {
      const response = await fetch(`${API_URL}/api/dashboards/public/${publicId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });

      if (response.ok) {
        setDashboardData(await response.json());
        setPasswordRequired(false);
        setError(null);
      } else if (response.status === 401) {
        toast.error('Invalid password');
      } else if (response.status === 410) {
        setError('This share link has expired');
      }
    } catch (err) {
      toast.error('Failed to access dashboard');
    } finally {
      setAuthenticating(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Dashboard Unavailable</h1>
            <p className="text-gray-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Lock className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-xl font-bold">{dashboardInfo?.name || 'Protected Dashboard'}</h1>
              <p className="text-gray-400 text-sm">This dashboard is password protected</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); fetchDashboard(password); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={authenticating || !password.trim()}>
                {authenticating ? 'Verifying...' : 'View Dashboard'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render dashboard data
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <h1 className="font-bold">{dashboardData?.name || 'Dashboard'}</h1>
      </header>
      <main className="p-8">
        {/* Render widgets here */}
        <pre>{JSON.stringify(dashboardData, null, 2)}</pre>
      </main>
    </div>
  );
}
```

---

## 3. Scheduled Report Delivery (Resend)

### Backend API (FastAPI)

```python
# /backend/routes/report_routes.py
"""Scheduled Report Delivery with Resend Email Integration"""
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
import os
import asyncio
import uuid
import resend

router = APIRouter(prefix="/api/reports", tags=["Report Delivery"])

# Initialize Resend
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

class ScheduleConfig(BaseModel):
    frequency: str  # daily, weekly, monthly
    day_of_week: Optional[int] = None  # 0=Monday, 6=Sunday
    day_of_month: Optional[int] = None  # 1-28
    time: str = "09:00"  # HH:MM
    timezone: str = "UTC"

class ReportSchedule(BaseModel):
    dashboard_id: str
    name: str
    recipients: List[EmailStr]
    schedule: ScheduleConfig
    include_pdf: bool = True
    include_data: bool = False
    custom_message: Optional[str] = None

class SendReportRequest(BaseModel):
    dashboard_id: str
    recipients: List[EmailStr]
    subject: Optional[str] = None
    message: Optional[str] = None

def generate_report_email_html(dashboard_name: str, message: str, dashboard_url: str) -> str:
    """Generate HTML email template"""
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" style="background-color: #1e293b; border-radius: 16px;">
                        <tr>
                            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
                                <h1 style="margin: 0; color: white; font-size: 24px;">📊 Report Ready</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 32px;">
                                <h2 style="color: #f1f5f9; font-size: 20px;">{dashboard_name}</h2>
                                <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
                                    {message or "Your scheduled report is ready."}
                                </p>
                                <table width="100%">
                                    <tr>
                                        <td align="center" style="padding: 16px 0;">
                                            <a href="{dashboard_url}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                                                View Dashboard →
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #0f172a; padding: 24px; text-align: center; border-top: 1px solid #334155;">
                                <p style="color: #64748b; font-size: 12px;">
                                    Generated: {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

async def send_email_async(to: List[str], subject: str, html: str) -> dict:
    """Send email using Resend API"""
    if not resend.api_key:
        return {"success": False, "error": "RESEND_API_KEY not configured"}
    
    try:
        result = await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": to,
            "subject": subject,
            "html": html
        })
        return {"success": True, "email_id": result.get("id")}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/send")
async def send_report_now(request: Request, data: SendReportRequest):
    """Send a report immediately"""
    db = request.app.state.db
    
    dashboard = await db.dashboards.find_one({"id": data.dashboard_id}, {"_id": 0, "name": 1})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    if not resend.api_key:
        raise HTTPException(status_code=503, detail="Email service not configured")
    
    dashboard_name = dashboard.get("name", "Untitled Dashboard")
    base_url = str(request.base_url).rstrip('/')
    dashboard_url = f"{base_url}/dashboards/{data.dashboard_id}"
    
    subject = data.subject or f"📊 Report: {dashboard_name}"
    html = generate_report_email_html(dashboard_name, data.message, dashboard_url)
    
    result = await send_email_async(data.recipients, subject, html)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {result.get('error')}")
    
    # Log delivery
    await db.report_deliveries.insert_one({
        "dashboard_id": data.dashboard_id,
        "recipients": data.recipients,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "email_id": result.get("email_id"),
        "status": "sent"
    })
    
    return {"status": "success", "message": f"Report sent to {len(data.recipients)} recipient(s)"}

@router.post("/schedules")
async def create_report_schedule(request: Request, data: ReportSchedule):
    """Create a new scheduled report"""
    db = request.app.state.db
    
    dashboard = await db.dashboards.find_one({"id": data.dashboard_id}, {"_id": 0})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    schedule_doc = {
        "id": str(uuid.uuid4()),
        "dashboard_id": data.dashboard_id,
        "name": data.name,
        "recipients": data.recipients,
        "frequency": data.schedule.frequency,
        "day_of_week": data.schedule.day_of_week,
        "day_of_month": data.schedule.day_of_month,
        "time": data.schedule.time,
        "timezone": data.schedule.timezone,
        "include_pdf": data.include_pdf,
        "include_data": data.include_data,
        "custom_message": data.custom_message,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_sent_at": None
    }
    
    await db.report_schedules.insert_one(schedule_doc)
    return {"id": schedule_doc["id"], "status": "created"}

@router.get("/schedules")
async def list_report_schedules(request: Request, dashboard_id: Optional[str] = None):
    """List all report schedules"""
    db = request.app.state.db
    query = {"dashboard_id": dashboard_id} if dashboard_id else {}
    schedules = await db.report_schedules.find(query, {"_id": 0}).to_list(100)
    return {"schedules": schedules}

@router.get("/schedules/{schedule_id}")
async def get_report_schedule(request: Request, schedule_id: str):
    """Get a specific schedule"""
    db = request.app.state.db
    schedule = await db.report_schedules.find_one({"id": schedule_id}, {"_id": 0})
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule

@router.put("/schedules/{schedule_id}")
async def update_report_schedule(request: Request, schedule_id: str, data: ReportSchedule):
    """Update a report schedule"""
    db = request.app.state.db
    
    update_data = {
        "name": data.name,
        "recipients": data.recipients,
        "frequency": data.schedule.frequency,
        "day_of_week": data.schedule.day_of_week,
        "day_of_month": data.schedule.day_of_month,
        "time": data.schedule.time,
        "timezone": data.schedule.timezone,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.report_schedules.update_one({"id": schedule_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"status": "updated"}

@router.delete("/schedules/{schedule_id}")
async def delete_report_schedule(request: Request, schedule_id: str):
    """Delete a report schedule"""
    db = request.app.state.db
    result = await db.report_schedules.delete_one({"id": schedule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"status": "deleted"}

@router.post("/schedules/{schedule_id}/toggle")
async def toggle_report_schedule(request: Request, schedule_id: str):
    """Toggle a schedule on/off"""
    db = request.app.state.db
    schedule = await db.report_schedules.find_one({"id": schedule_id}, {"_id": 0})
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    new_status = not schedule.get("is_active", True)
    await db.report_schedules.update_one({"id": schedule_id}, {"$set": {"is_active": new_status}})
    return {"status": "success", "is_active": new_status}

@router.get("/deliveries")
async def list_report_deliveries(request: Request, dashboard_id: Optional[str] = None, limit: int = 50):
    """List recent report deliveries"""
    db = request.app.state.db
    query = {"dashboard_id": dashboard_id} if dashboard_id else {}
    deliveries = await db.report_deliveries.find(query, {"_id": 0}).sort("sent_at", -1).to_list(limit)
    return {"deliveries": deliveries}
```

### Environment Setup

```bash
# /backend/.env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx  # Get from https://resend.com/api-keys
SENDER_EMAIL=reports@yourdomain.com     # Must be verified in Resend
```

### Installation

```bash
pip install resend>=2.0.0
```

---

## Usage Examples

### Organization API

```bash
# Create organization
curl -X POST "$API_URL/api/organizations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Company", "description": "Main organization"}'

# List organizations
curl "$API_URL/api/organizations" -H "Authorization: Bearer $TOKEN"

# Update organization
curl -X PUT "$API_URL/api/organizations/{org_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Delete organization
curl -X DELETE "$API_URL/api/organizations/{org_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Dashboard Sharing API

```bash
# Create public share link
curl -X POST "$API_URL/api/dashboards/{dashboard_id}/share" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_public": true, "password_protected": true, "password": "secret123"}'

# Get share settings
curl "$API_URL/api/dashboards/{dashboard_id}/share" \
  -H "Authorization: Bearer $TOKEN"

# Access public dashboard (no auth)
curl "$API_URL/api/dashboards/public/{public_id}"

# Access password-protected dashboard
curl -X POST "$API_URL/api/dashboards/public/{public_id}/access" \
  -H "Content-Type: application/json" \
  -d '{"password": "secret123"}'

# Revoke share
curl -X DELETE "$API_URL/api/dashboards/{dashboard_id}/share" \
  -H "Authorization: Bearer $TOKEN"
```

### Report Delivery API

```bash
# Send report immediately
curl -X POST "$API_URL/api/reports/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard_id": "xxx",
    "recipients": ["user@example.com"],
    "subject": "Weekly Report",
    "message": "Here is your weekly dashboard report."
  }'

# Create schedule
curl -X POST "$API_URL/api/reports/schedules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard_id": "xxx",
    "name": "Weekly Sales Report",
    "recipients": ["team@example.com"],
    "schedule": {
      "frequency": "weekly",
      "day_of_week": 1,
      "time": "09:00",
      "timezone": "America/New_York"
    }
  }'

# List schedules
curl "$API_URL/api/reports/schedules" -H "Authorization: Bearer $TOKEN"

# Toggle schedule
curl -X POST "$API_URL/api/reports/schedules/{id}/toggle" \
  -H "Authorization: Bearer $TOKEN"

# List delivery history
curl "$API_URL/api/reports/deliveries?limit=20" -H "Authorization: Bearer $TOKEN"
```

---

## Database Schema

```javascript
// MongoDB Collections

// organizations
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string",
  "logo": "string",
  "owner_id": "user_uuid",
  "is_active": true,
  "created_at": "ISO datetime"
}

// dashboards (sharing fields)
{
  "public_id": "random_token",
  "is_public": true,
  "password_protected": true,
  "password_hash": "sha256_hash",
  "share_expires_at": "ISO datetime",
  "share_created_at": "ISO datetime"
}

// report_schedules
{
  "id": "uuid",
  "dashboard_id": "dashboard_uuid",
  "name": "string",
  "recipients": ["email@example.com"],
  "frequency": "daily|weekly|monthly",
  "day_of_week": 0-6,
  "day_of_month": 1-28,
  "time": "HH:MM",
  "timezone": "UTC",
  "is_active": true,
  "created_at": "ISO datetime"
}

// report_deliveries
{
  "dashboard_id": "dashboard_uuid",
  "recipients": ["email@example.com"],
  "sent_at": "ISO datetime",
  "email_id": "resend_email_id",
  "status": "sent|failed"
}
```

---

## Key Dependencies

```txt
# requirements.txt
fastapi>=0.100.0
pydantic>=2.0.0
motor>=3.0.0  # MongoDB async driver
resend>=2.0.0
python-jose>=3.3.0  # JWT
```

```json
// package.json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "framer-motion": "^10.0.0",
    "lucide-react": "^0.300.0",
    "sonner": "^1.0.0"
  }
}
```
