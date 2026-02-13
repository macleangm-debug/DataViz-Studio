import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  File,
  CheckCircle,
  AlertCircle,
  X,
  ArrowRight,
  Database
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useOrgStore, useAuthStore } from '../store';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function UploadPage() {
  const navigate = useNavigate();
  const { currentOrg } = useOrgStore();
  const { token } = useAuthStore();
  const [file, setFile] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile) => {
    const validTypes = ['.csv', '.xlsx', '.xls', '.json'];
    const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      toast.error('Please upload a CSV, Excel, or JSON file');
      return;
    }
    
    setFile(selectedFile);
    if (!datasetName) {
      setDatasetName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', datasetName || file.name);
    if (currentOrg?.id) {
      formData.append('org_id', currentOrg.id);
    }

    try {
      const response = await axios.post(`${API_URL}/api/data-sources/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setUploadResult({
        success: true,
        data: response.data
      });
      toast.success('Data uploaded successfully!');
    } catch (error) {
      setUploadResult({
        success: false,
        error: error.response?.data?.detail || 'Upload failed'
      });
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setDatasetName('');
    setUploadProgress(0);
    setUploadResult(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8" data-testid="upload-page">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Data</h1>
          <p className="text-muted-foreground mt-1">
            Import your data from CSV, Excel, or JSON files
          </p>
        </div>

        {uploadResult?.success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Upload Successful!</h2>
                <p className="text-muted-foreground mb-6">
                  Your dataset "{uploadResult.data.name}" has been created with {uploadResult.data.rows} rows and {uploadResult.data.columns.length} columns.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" onClick={resetUpload}>
                    Upload Another
                  </Button>
                  <Button
                    onClick={() => navigate(`/datasets/${uploadResult.data.dataset_id}`)}
                    className="bg-violet-600 hover:bg-violet-700"
                    data-testid="view-dataset-btn"
                  >
                    View Dataset
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Drop Zone */}
            <Card>
              <CardContent className="p-8">
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    dragActive
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : file
                      ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-muted-foreground/25 hover:border-violet-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  data-testid="upload-dropzone"
                >
                  {file ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetUpload}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-violet-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Drop your file here
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        or click to browse from your computer
                      </p>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls,.json"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                        id="file-input"
                        data-testid="file-input"
                      />
                      <label htmlFor="file-input">
                        <Button variant="outline" asChild className="cursor-pointer">
                          <span>Browse Files</span>
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground mt-4">
                        Supported formats: CSV, Excel (.xlsx, .xls), JSON
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dataset Name */}
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Dataset Details</CardTitle>
                    <CardDescription>Give your dataset a name</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataset-name">Dataset Name</Label>
                      <Input
                        id="dataset-name"
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                        placeholder="My Dataset"
                        data-testid="dataset-name-input"
                      />
                    </div>

                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Uploading...</span>
                          <span className="text-foreground font-medium">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    {uploadResult?.error && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {uploadResult.error}
                      </div>
                    )}

                    <Button
                      onClick={handleUpload}
                      disabled={uploading || !file}
                      className="w-full bg-violet-600 hover:bg-violet-700"
                      data-testid="upload-btn"
                    >
                      {uploading ? 'Uploading...' : 'Upload Data'}
                      <Upload className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}

        {/* Supported Formats Info */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Supported File Formats</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: 'CSV', ext: '.csv', desc: 'Comma-separated values' },
                { name: 'Excel', ext: '.xlsx, .xls', desc: 'Microsoft Excel files' },
                { name: 'JSON', ext: '.json', desc: 'JavaScript Object Notation' }
              ].map((format) => (
                <div key={format.name} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                    <File className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{format.name}</p>
                    <p className="text-xs text-muted-foreground">{format.ext}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default UploadPage;
