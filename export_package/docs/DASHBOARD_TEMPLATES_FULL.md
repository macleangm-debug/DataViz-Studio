# Dashboard Template Library - Complete Solution
# Preset Templates + User-Created Templates

## Instructions for Other Emergent Tab

Copy and paste this ENTIRE message in your other Emergent tab:

---

**START COPY HERE** ⬇️

```
I need you to build a complete Dashboard Template Library with BOTH preset templates AND user-created templates. Here's the full specification:

## BACKEND

### 1. Create Template Model - Add to your models or create `models/template.py`:

```python
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    widgets: List[Dict[str, Any]] = []
    is_preset: bool = False
    category: Optional[str] = None  # e.g., "sales", "marketing", "custom"
    icon: Optional[str] = "LayoutDashboard"
    color: Optional[str] = "from-blue-500 to-blue-600"

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    widgets: Optional[List[Dict[str, Any]]] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
```

### 2. Create Template Routes - Add to your server.py or create `routes/template_routes.py`:

```python
from fastapi import APIRouter, HTTPException, Request
from bson import ObjectId
from datetime import datetime, timezone

# If using separate router file:
# router = APIRouter(prefix="/api/templates", tags=["templates"])
# Otherwise add these endpoints to your main api_router

# Preset templates (hardcoded)
PRESET_TEMPLATES = [
    {
        "id": "preset_sales",
        "name": "Sales Overview",
        "description": "Track sales performance, revenue, and key metrics",
        "icon": "DollarSign",
        "color": "from-emerald-500 to-emerald-600",
        "category": "sales",
        "is_preset": True,
        "widgets": [
            {"type": "stat", "title": "Total Revenue", "config": {"aggregation": "sum"}, "position": {"x": 0, "y": 0, "w": 3, "h": 2}},
            {"type": "stat", "title": "Orders", "config": {"aggregation": "count"}, "position": {"x": 3, "y": 0, "w": 3, "h": 2}},
            {"type": "stat", "title": "Avg Order Value", "config": {"aggregation": "mean"}, "position": {"x": 6, "y": 0, "w": 3, "h": 2}},
            {"type": "stat", "title": "Customers", "config": {"aggregation": "count"}, "position": {"x": 9, "y": 0, "w": 3, "h": 2}},
            {"type": "chart", "title": "Revenue Trend", "config": {"chart_type": "line"}, "position": {"x": 0, "y": 2, "w": 8, "h": 4}},
            {"type": "chart", "title": "Sales by Category", "config": {"chart_type": "pie"}, "position": {"x": 8, "y": 2, "w": 4, "h": 4}},
            {"type": "table", "title": "Top Products", "config": {"limit": 5}, "position": {"x": 0, "y": 6, "w": 6, "h": 4}},
            {"type": "chart", "title": "Monthly Comparison", "config": {"chart_type": "bar"}, "position": {"x": 6, "y": 6, "w": 6, "h": 4}},
        ]
    },
    {
        "id": "preset_marketing",
        "name": "Marketing Analytics",
        "description": "Monitor campaigns, engagement, and conversion rates",
        "icon": "Target",
        "color": "from-violet-500 to-violet-600",
        "category": "marketing",
        "is_preset": True,
        "widgets": [
            {"type": "stat", "title": "Visitors", "config": {"aggregation": "sum"}, "position": {"x": 0, "y": 0, "w": 3, "h": 2}},
            {"type": "stat", "title": "Conversion Rate", "config": {"aggregation": "mean"}, "position": {"x": 3, "y": 0, "w": 3, "h": 2}},
            {"type": "stat", "title": "Leads", "config": {"aggregation": "count"}, "position": {"x": 6, "y": 0, "w": 3, "h": 2}},
            {"type": "stat", "title": "Cost per Lead", "config": {"aggregation": "mean"}, "position": {"x": 9, "y": 0, "w": 3, "h": 2}},
            {"type": "chart", "title": "Traffic Sources", "config": {"chart_type": "pie"}, "position": {"x": 0, "y": 2, "w": 4, "h": 4}},
            {"type": "chart", "title": "Visitor Trend", "config": {"chart_type": "area"}, "position": {"x": 4, "y": 2, "w": 8, "h": 4}},
        ]
    },
    {
        "id": "preset_customers",
        "name": "Customer Insights",
        "description": "Understand customer behavior and demographics",
        "icon": "Users",
        "color": "from-blue-500 to-blue-600",
        "category": "customers",
        "is_preset": True,
        "widgets": [
            {"type": "stat", "title": "Total Customers", "config": {"aggregation": "count"}, "position": {"x": 0, "y": 0, "w": 4, "h": 2}},
            {"type": "stat", "title": "New Customers", "config": {"aggregation": "count"}, "position": {"x": 4, "y": 0, "w": 4, "h": 2}},
            {"type": "stat", "title": "Retention Rate", "config": {"aggregation": "mean"}, "position": {"x": 8, "y": 0, "w": 4, "h": 2}},
            {"type": "chart", "title": "Customer Segments", "config": {"chart_type": "pie"}, "position": {"x": 0, "y": 2, "w": 6, "h": 4}},
            {"type": "chart", "title": "Growth Over Time", "config": {"chart_type": "line"}, "position": {"x": 6, "y": 2, "w": 6, "h": 4}},
        ]
    },
    {
        "id": "preset_operations",
        "name": "Operations Monitor",
        "description": "Track inventory, orders, and operational KPIs",
        "icon": "Activity",
        "color": "from-amber-500 to-amber-600",
        "category": "operations",
        "is_preset": True,
        "widgets": [
            {"type": "stat", "title": "Pending Orders", "config": {"aggregation": "count"}, "position": {"x": 0, "y": 0, "w": 3, "h": 2}},
            {"type": "stat", "title": "In Stock Items", "config": {"aggregation": "count"}, "position": {"x": 3, "y": 0, "w": 3, "h": 2}},
            {"type": "stat", "title": "Low Stock Alerts", "config": {"aggregation": "count"}, "position": {"x": 6, "y": 0, "w": 3, "h": 2}},
            {"type": "stat", "title": "Fulfillment Rate", "config": {"aggregation": "mean"}, "position": {"x": 9, "y": 0, "w": 3, "h": 2}},
            {"type": "chart", "title": "Order Status", "config": {"chart_type": "pie"}, "position": {"x": 0, "y": 2, "w": 4, "h": 4}},
            {"type": "chart", "title": "Daily Orders", "config": {"chart_type": "bar"}, "position": {"x": 4, "y": 2, "w": 8, "h": 4}},
        ]
    },
    {
        "id": "preset_financial",
        "name": "Financial Summary",
        "description": "Monitor P&L, expenses, and financial health",
        "icon": "TrendingUp",
        "color": "from-rose-500 to-rose-600",
        "category": "finance",
        "is_preset": True,
        "widgets": [
            {"type": "stat", "title": "Total Revenue", "config": {"aggregation": "sum"}, "position": {"x": 0, "y": 0, "w": 4, "h": 2}},
            {"type": "stat", "title": "Total Expenses", "config": {"aggregation": "sum"}, "position": {"x": 4, "y": 0, "w": 4, "h": 2}},
            {"type": "stat", "title": "Net Profit", "config": {"aggregation": "sum"}, "position": {"x": 8, "y": 0, "w": 4, "h": 2}},
            {"type": "chart", "title": "Revenue vs Expenses", "config": {"chart_type": "line"}, "position": {"x": 0, "y": 2, "w": 8, "h": 4}},
            {"type": "chart", "title": "Expense Breakdown", "config": {"chart_type": "pie"}, "position": {"x": 8, "y": 2, "w": 4, "h": 4}},
        ]
    },
    {
        "id": "preset_blank",
        "name": "Blank Canvas",
        "description": "Start from scratch with an empty dashboard",
        "icon": "Layers",
        "color": "from-gray-500 to-gray-600",
        "category": "blank",
        "is_preset": True,
        "widgets": []
    }
]

# GET /api/templates - List all templates (preset + user's custom)
@api_router.get("/templates")
async def list_templates(request: Request):
    try:
        user = await get_current_user(request)
        user_id = user.get("id") or user.get("user_id")
        
        # Get user's custom templates from database
        cursor = db.templates.find({"user_id": user_id}, {"_id": 0})
        user_templates = await cursor.to_list(length=100)
        
        # Combine preset + user templates
        all_templates = {
            "preset": PRESET_TEMPLATES,
            "custom": user_templates
        }
        
        return all_templates
    except Exception as e:
        # If not authenticated, return only presets
        return {
            "preset": PRESET_TEMPLATES,
            "custom": []
        }

# POST /api/templates - Save dashboard as template
@api_router.post("/templates")
async def create_template(template: TemplateCreate, request: Request):
    user = await get_current_user(request)
    user_id = user.get("id") or user.get("user_id")
    
    template_id = str(ObjectId())
    template_doc = {
        "id": template_id,
        "user_id": user_id,
        "name": template.name,
        "description": template.description,
        "widgets": template.widgets,
        "icon": template.icon or "LayoutDashboard",
        "color": template.color or "from-blue-500 to-blue-600",
        "category": template.category or "custom",
        "is_preset": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.templates.insert_one(template_doc)
    
    return {"id": template_id, "message": "Template created successfully"}

# POST /api/templates/from-dashboard/:dashboard_id - Save existing dashboard as template
@api_router.post("/templates/from-dashboard/{dashboard_id}")
async def save_dashboard_as_template(dashboard_id: str, request: Request, name: str = None, description: str = None):
    user = await get_current_user(request)
    user_id = user.get("id") or user.get("user_id")
    
    # Get the dashboard
    dashboard = await db.dashboards.find_one({"id": dashboard_id})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    # Get widgets for this dashboard
    cursor = db.widgets.find({"dashboard_id": dashboard_id}, {"_id": 0})
    widgets = await cursor.to_list(length=100)
    
    # Convert widgets to template format (remove dashboard-specific IDs)
    template_widgets = []
    for w in widgets:
        template_widgets.append({
            "type": w.get("type"),
            "title": w.get("title"),
            "config": w.get("config", {}),
            "position": w.get("position", {"x": 0, "y": 0, "w": 4, "h": 3})
        })
    
    template_id = str(ObjectId())
    template_doc = {
        "id": template_id,
        "user_id": user_id,
        "name": name or f"{dashboard.get('name')} Template",
        "description": description or dashboard.get("description", ""),
        "widgets": template_widgets,
        "icon": "LayoutDashboard",
        "color": "from-indigo-500 to-indigo-600",
        "category": "custom",
        "is_preset": False,
        "source_dashboard_id": dashboard_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.templates.insert_one(template_doc)
    
    return {"id": template_id, "message": "Dashboard saved as template"}

# PUT /api/templates/:template_id - Update template
@api_router.put("/templates/{template_id}")
async def update_template(template_id: str, template: TemplateUpdate, request: Request):
    user = await get_current_user(request)
    user_id = user.get("id") or user.get("user_id")
    
    # Check ownership
    existing = await db.templates.find_one({"id": template_id, "user_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found or access denied")
    
    update_data = {k: v for k, v in template.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.templates.update_one(
        {"id": template_id},
        {"$set": update_data}
    )
    
    return {"message": "Template updated"}

# DELETE /api/templates/:template_id - Delete template
@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("id") or user.get("user_id")
    
    result = await db.templates.delete_one({"id": template_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found or access denied")
    
    return {"message": "Template deleted"}
```

---

## FRONTEND

### 3. Install dependencies:
```bash
yarn add framer-motion lucide-react sonner axios
```

### 4. Create `src/components/DashboardTemplatesDialog.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, DollarSign, Target, Users, Activity, TrendingUp, 
  Layers, LayoutDashboard, Trash2, Edit2, X, Save, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Icon mapping
const ICONS = {
  DollarSign, Target, Users, Activity, TrendingUp, Layers, LayoutDashboard
};

const DashboardTemplatesDialog = ({ 
  isOpen, 
  onClose, 
  onSelectTemplate,
  token // Auth token for API calls
}) => {
  const [activeTab, setActiveTab] = useState('preset');
  const [presetTemplates, setPresetTemplates] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/api/templates`, { headers });
      setPresetTemplates(response.data.preset || []);
      setCustomTemplates(response.data.custom || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
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
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_URL}/api/templates/${templateId}`, 
        { name: editName },
        { headers }
      );
      toast.success('Template updated');
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const getIcon = (iconName) => {
    const IconComponent = ICONS[iconName] || LayoutDashboard;
    return IconComponent;
  };

  if (!isOpen) return null;

  const templates = activeTab === 'preset' ? presetTemplates : customTemplates;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h2 className="text-xl font-bold">Dashboard Templates</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('preset')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'preset'
                ? 'bg-violet-100 text-violet-700 border-b-2 border-violet-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Preset Templates ({presetTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'custom'
                ? 'bg-violet-100 text-violet-700 border-b-2 border-violet-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 inline mr-2" />
            My Templates ({customTemplates.length})
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[55vh]">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-48" />
              ))}
            </div>
          ) : templates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => {
                const Icon = getIcon(template.icon);
                const isEditing = editingTemplate === template.id;
                
                return (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg hover:border-violet-300 transition-all group"
                  >
                    {/* Template Card */}
                    <div
                      onClick={() => !isEditing && onSelectTemplate(template)}
                      className="cursor-pointer"
                    >
                      <div className={`h-24 bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="p-4">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 px-2 py-1 border rounded text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateTemplate(template.id);
                              }}
                              className="p-1 bg-green-500 text-white rounded"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {template.name}
                          </h3>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {template.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {template.widgets?.length === 0 ? 'Empty canvas' : `${template.widgets?.length} widgets`}
                        </p>
                      </div>
                    </div>

                    {/* Actions for custom templates */}
                    {activeTab === 'custom' && !isEditing && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(template.id);
                            setEditName(template.name);
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
              <LayoutDashboard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-600 mb-2">No templates yet</h3>
              <p className="text-sm text-gray-400">
                {activeTab === 'custom' 
                  ? 'Save a dashboard as a template to see it here'
                  : 'No preset templates available'
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="text-xs text-gray-400">
            Click a template to create a new dashboard
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardTemplatesDialog;
```

### 5. Create "Save as Template" Button Component - `src/components/SaveAsTemplateButton.jsx`:

```jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SaveAsTemplateButton = ({ dashboardId, dashboardName, token }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      setSaving(true);
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/api/templates/from-dashboard/${dashboardId}`,
        null,
        { 
          headers,
          params: { name: templateName, description }
        }
      );
      toast.success('Dashboard saved as template!');
      setShowDialog(false);
      setTemplateName('');
      setDescription('');
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setTemplateName(`${dashboardName} Template`);
          setShowDialog(true);
        }}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Save className="w-4 h-4" />
        Save as Template
      </button>

      <AnimatePresence>
        {showDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Save as Template</h3>
                <button onClick={() => setShowDialog(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="My Dashboard Template"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this template..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setShowDialog(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SaveAsTemplateButton;
```

### 6. Usage Example - In your Dashboard page:

```jsx
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import DashboardTemplatesDialog from '../components/DashboardTemplatesDialog';
import SaveAsTemplateButton from '../components/SaveAsTemplateButton';
import { useAuthStore } from '../store'; // Your auth store

function DashboardsPage() {
  const { token } = useAuthStore();
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSelectTemplate = async (template) => {
    // Create dashboard from template
    const response = await axios.post(`${API_URL}/api/dashboards`, {
      name: `${template.name} Dashboard`,
      description: template.description,
      widgets: template.widgets
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Navigate to new dashboard
    navigate(`/dashboards/${response.data.id}`);
    setShowTemplates(false);
  };

  return (
    <div>
      {/* Header with Templates Button */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-2 px-4 py-2 border border-violet-200 rounded-lg hover:bg-violet-50"
        >
          <Sparkles className="w-4 h-4 text-violet-500" />
          Templates
        </button>
      </div>

      {/* Templates Dialog */}
      <DashboardTemplatesDialog
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
        token={token}
      />

      {/* On individual dashboard pages, add Save as Template button */}
      {/* <SaveAsTemplateButton 
        dashboardId={currentDashboard.id}
        dashboardName={currentDashboard.name}
        token={token}
      /> */}
    </div>
  );
}
```

---

## SUMMARY

This gives you:
1. ✅ 6 preset templates (Sales, Marketing, Customer, Operations, Finance, Blank)
2. ✅ User can save any dashboard as a template
3. ✅ "My Templates" tab shows user's custom templates
4. ✅ Edit/Delete custom templates
5. ✅ Create new dashboards from any template

The templates are stored in MongoDB `templates` collection with user ownership for custom ones.
```

**END COPY HERE** ⬆️
