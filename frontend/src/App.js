import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore, useUIStore } from './store';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { UploadPage } from './pages/UploadPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { DashboardsPage } from './pages/DashboardsPage';
import { DashboardBuilderPage } from './pages/DashboardBuilderPage';
import { DatabaseConnectionsPage } from './pages/DatabaseConnectionsPage';
import { ChartsPage } from './pages/ChartsPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TeamPage } from './pages/TeamPage';
import { SecurityPage } from './pages/SecurityPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ReportBuilderPage from './pages/ReportBuilderPage.jsx';
import LandingPage from './pages/LandingPage';
import InteractiveDemoPage from './pages/InteractiveDemoPage';
import PricingPage from './pages/PricingPage';
import ApiKeysPage from './pages/ApiKeysPage';
import { DataTransformPage } from './pages/DataTransformPage';
import { StatisticsPage } from './pages/StatisticsPage';
import '@/App.css';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route wrapper (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { theme } = useUIStore();

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          {/* Data Routes */}
          <Route path="/data-sources" element={
            <ProtectedRoute>
              <DataSourcesPage />
            </ProtectedRoute>
          } />
          <Route path="/data-sources/new" element={
            <ProtectedRoute>
              <DataSourcesPage />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          } />
          <Route path="/datasets" element={
            <ProtectedRoute>
              <DatasetsPage />
            </ProtectedRoute>
          } />
          <Route path="/datasets/:datasetId" element={
            <ProtectedRoute>
              <DatasetsPage />
            </ProtectedRoute>
          } />
          <Route path="/datasets/:datasetId/transform" element={
            <ProtectedRoute>
              <DataTransformPage />
            </ProtectedRoute>
          } />
          
          {/* Visualization Routes */}
          <Route path="/dashboards" element={
            <ProtectedRoute>
              <DashboardsPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboards/new" element={
            <ProtectedRoute>
              <DashboardsPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboards/:dashboardId" element={
            <ProtectedRoute>
              <DashboardBuilderPage />
            </ProtectedRoute>
          } />
          <Route path="/database-connections" element={
            <ProtectedRoute>
              <DatabaseConnectionsPage />
            </ProtectedRoute>
          } />
          <Route path="/charts" element={
            <ProtectedRoute>
              <ChartsPage />
            </ProtectedRoute>
          } />
          <Route path="/charts/new" element={
            <ProtectedRoute>
              <ChartsPage />
            </ProtectedRoute>
          } />
          
          {/* Analysis Routes */}
          <Route path="/ai-insights" element={
            <ProtectedRoute>
              <AIInsightsPage />
            </ProtectedRoute>
          } />
          <Route path="/statistics" element={
            <ProtectedRoute>
              <StatisticsPage />
            </ProtectedRoute>
          } />
          
          {/* Export Routes */}
          <Route path="/reports" element={
            <ProtectedRoute>
              <DashboardsPage />
            </ProtectedRoute>
          } />
          <Route path="/report-builder" element={
            <ProtectedRoute>
              <ReportBuilderPage />
            </ProtectedRoute>
          } />
          <Route path="/share" element={
            <ProtectedRoute>
              <DashboardsPage />
            </ProtectedRoute>
          } />
          <Route path="/export" element={
            <ProtectedRoute>
              <DatasetsPage />
            </ProtectedRoute>
          } />
          
          {/* Settings Routes */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <TeamPage />
            </ProtectedRoute>
          } />
          <Route path="/security" element={
            <ProtectedRoute>
              <SecurityPage />
            </ProtectedRoute>
          } />
          <Route path="/keys" element={
            <ProtectedRoute>
              <ApiKeysPage />
            </ProtectedRoute>
          } />
          
          {/* Help Center */}
          <Route path="/help" element={
            <ProtectedRoute>
              <HelpCenterPage />
            </ProtectedRoute>
          } />
          <Route path="/help/:articleId" element={
            <ProtectedRoute>
              <HelpCenterPage />
            </ProtectedRoute>
          } />

          {/* Landing Page - Public */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Pricing Page - Public */}
          <Route path="/pricing" element={<PricingPage />} />
          
          {/* Interactive Demo - Public */}
          <Route path="/demo" element={<InteractiveDemoPage />} />
          
          {/* Default redirect for authenticated users */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      
      <Toaster 
        position="top-right" 
        richColors 
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))'
          }
        }}
      />
    </div>
  );
}

export default App;
