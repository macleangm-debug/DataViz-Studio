#!/bin/bash

# ===========================================
# DataViz Module Auto-Installer
# Just paste this entire script in your terminal
# Run from your React project root folder
# ===========================================

echo "🚀 DataViz Module Installer Starting..."

# Check if we're in a React project
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from your React project root."
    exit 1
fi

# Create temp directory and download
echo "📦 Downloading DataViz module package..."
curl -L -o /tmp/dataviz_module.zip https://viz-debug.preview.emergentagent.com/dataviz_module_export.zip

# Check if download succeeded
if [ ! -f "/tmp/dataviz_module.zip" ]; then
    echo "❌ Error: Download failed. Please check your internet connection."
    exit 1
fi

# Create directories if they don't exist
echo "📁 Creating directory structure..."
mkdir -p src/components/report
mkdir -p src/components/ui
mkdir -p src/pages

# Extract the zip
echo "📂 Extracting files..."
cd /tmp && unzip -o dataviz_module.zip

# Copy files to project
echo "📋 Copying components..."
cp -r /tmp/export_package/frontend/components/report/* src/components/report/
cp -r /tmp/export_package/frontend/components/ui/* src/components/ui/
cp -r /tmp/export_package/frontend/pages/* src/pages/

# Go back to project root
cd - > /dev/null

# Install dependencies
echo "📥 Installing dependencies..."
yarn add echarts echarts-for-react framer-motion html2canvas jspdf lucide-react react-grid-layout sonner @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-slider @radix-ui/react-tabs class-variance-authority clsx tailwind-merge

# Cleanup
echo "🧹 Cleaning up..."
rm -rf /tmp/dataviz_module.zip /tmp/export_package

echo ""
echo "✅ DataViz Module installed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Add routes to your router (see below)"
echo "   2. Update layout imports in the page files"
echo "   3. Connect to your dataset APIs"
echo ""
echo "📌 Add these routes to your App.js or router:"
echo ""
cat << 'ROUTES'
import ReportBuilderPage from './pages/ReportBuilderPage';
import ChartsPage from './pages/ChartsPage';
import DashboardsPage from './pages/DashboardsPage';
import DashboardPage from './pages/DashboardPage';
import DashboardBuilderPage from './pages/DashboardBuilderPage';
import DataTransformPage from './pages/DataTransformPage';

// Add inside your <Routes>:
<Route path="/report-builder" element={<ReportBuilderPage />} />
<Route path="/charts" element={<ChartsPage />} />
<Route path="/dashboards" element={<DashboardsPage />} />
<Route path="/dashboards/:id" element={<DashboardPage />} />
<Route path="/dashboard-builder/:id" element={<DashboardBuilderPage />} />
<Route path="/datasets/:datasetId/transform" element={<DataTransformPage />} />
ROUTES
echo ""
echo "🎉 Done! Happy coding!"
