import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SaveAsTemplateButton = ({ dashboardId, dashboardName, token, variant = 'outline' }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/api/templates/from-dashboard/${dashboardId}`,
        null,
        { 
          headers,
          params: { name, description }
        }
      );
      toast.success('Dashboard saved as template!');
      setOpen(false);
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Save template error:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={() => {
          setName(`${dashboardName} Template`);
          setDescription('');
          setOpen(true);
        }}
        className="gap-2"
        data-testid="save-as-template-btn"
      >
        <Save className="w-4 h-4" />
        Save as Template
      </Button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Save as Template</h3>
                <button 
                  onClick={() => setOpen(false)} 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Save this dashboard as a reusable template. You can use it to quickly create new dashboards with the same widgets.
              </p>

              <div className="space-y-4">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Dashboard Template"
                    className="mt-1"
                    data-testid="template-name-input"
                  />
                </div>

                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this template is for..."
                    rows={3}
                    className="mt-1 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-violet-600 hover:bg-violet-700"
                    data-testid="save-template-submit"
                  >
                    {saving ? 'Saving...' : 'Save Template'}
                  </Button>
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
