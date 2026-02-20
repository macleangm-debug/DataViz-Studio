/**
 * DataViz Studio - Canva-inspired Layout
 * Rail + Expandable Panel navigation system
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House,
  Database,
  LayoutDashboard,
  BarChart3,
  PieChart,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronRight,
  Upload,
  Table2,
  FileSpreadsheet,
  Download,
  Users,
  Shield,
  Key,
  Plus,
  Sparkles,
  Brain,
  FileText,
  Share2,
  Plug,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import { useAuthStore, useOrgStore } from '../store';
import { cn } from '../lib/utils';

// Navigation structure for DataViz Studio
const NAVIGATION = [
  {
    id: 'home',
    label: 'Home',
    icon: House,
    path: '/dashboard',
    items: []
  },
  {
    id: 'data',
    label: 'Data',
    icon: Database,
    items: [
      { label: 'Data Sources', path: '/data-sources', icon: Plug },
      { label: 'Database Connections', path: '/database-connections', icon: Database },
      { label: 'Upload Data', path: '/upload', icon: Upload },
      { label: 'Datasets', path: '/datasets', icon: Table2 },
    ]
  },
  {
    id: 'visualize',
    label: 'Visualize',
    icon: BarChart3,
    items: [
      { label: 'Dashboards', path: '/dashboards', icon: LayoutDashboard },
      { label: 'Charts', path: '/charts', icon: PieChart },
    ]
  },
  {
    id: 'analyze',
    label: 'Analyze',
    icon: Sparkles,
    items: [
      { label: 'AI Insights', path: '/ai-insights', icon: Brain },
      { label: 'Statistics', path: '/statistics', icon: BarChart3 },
    ]
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    items: [
      { label: 'Reports', path: '/reports', icon: FileText },
      { label: 'Report Builder', path: '/report-builder', icon: FileText },
      { label: 'Share', path: '/share', icon: Share2 },
      { label: 'Export Data', path: '/export', icon: FileSpreadsheet },
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      { label: 'Team', path: '/team', icon: Users },
      { label: 'Security', path: '/security', icon: Shield },
      { label: 'API Keys', path: '/keys', icon: Key },
      { label: 'Settings', path: '/settings', icon: Settings },
      { label: 'Help Center', path: '/help', icon: HelpCircle },
    ]
  }
];

// Find active group based on current path
function findActiveGroup(pathname) {
  for (const group of NAVIGATION) {
    if (group.path === pathname) return group.id;
    for (const item of group.items || []) {
      if (pathname.startsWith(item.path)) return group.id;
    }
  }
  return 'home';
}

export function DashboardLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentOrg, organizations, setCurrentOrg } = useOrgStore();
  
  // Initialize active group based on current route
  const initialGroup = findActiveGroup(location.pathname);
  const [activeGroup, setActiveGroup] = useState(initialGroup);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current group data
  const currentGroup = NAVIGATION.find(g => g.id === activeGroup);
  const showPanel = currentGroup?.items?.length > 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRailClick = (group) => {
    if (activeGroup === group.id) {
      // Clicking same group - toggle panel
      if (group.items?.length > 0) {
        setPanelOpen(!panelOpen);
      }
    } else {
      // Clicking different group
      setActiveGroup(group.id);
      if (group.path) {
        navigate(group.path);
      } else if (group.items?.length > 0) {
        setPanelOpen(true);
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        {/* Rail - Thin icon sidebar with labels */}
        <aside className="hidden lg:flex flex-col items-center w-[80px] bg-card border-r border-border py-4">
          {/* Logo - DataViz Studio with Chart Pie icon */}
          <Link to="/dashboard" className="mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <PieChart className="w-6 h-6 text-white" />
            </div>
          </Link>

          {/* Quick Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-14 h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 mb-4 flex flex-col items-center justify-center gap-0.5 transition-colors">
                <Plus className="w-5 h-5" />
                <span className="text-[9px] font-medium">New</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/upload')}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboards/new')}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                New Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/charts/new')}>
                <PieChart className="w-4 h-4 mr-2" />
                New Chart
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/data-sources/new')}>
                <Plug className="w-4 h-4 mr-2" />
                Connect Data Source
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Navigation Rail Items with Labels */}
          <nav className="flex-1 flex flex-col items-center gap-1 overflow-y-auto">
            {NAVIGATION.map((group) => {
              const Icon = group.icon;
              const isActive = activeGroup === group.id;
              
              return (
                <Tooltip key={group.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleRailClick(group)}
                      className={cn(
                        "w-16 py-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors",
                        isActive 
                          ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium leading-tight text-center">
                        {group.label}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground border border-border">
                    {group.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* Bottom section - Profile */}
          <div className="mt-auto flex flex-col items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-muted">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-medium text-sm">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Expandable Panel */}
        {showPanel && (
          <motion.aside
            initial={false}
            animate={{ 
              width: panelOpen ? 260 : 0, 
              opacity: panelOpen ? 1 : 0 
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="hidden lg:block bg-card border-r border-border overflow-hidden"
          >
            <div className="w-[260px] h-full flex flex-col">
                {/* Panel Header */}
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">{currentGroup?.label}</h2>
                </div>

                {/* Panel Items */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                  {currentGroup?.items?.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || 
                                    location.pathname.startsWith(item.path + '/');
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                          isActive 
                            ? "bg-violet-100 text-violet-700 font-medium dark:bg-violet-900/30 dark:text-violet-400" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                        {isActive && (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Organization Selector */}
                {organizations?.length > 0 && (
                  <div className="p-3 border-t border-border">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-left">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-medium text-xs">
                            {currentOrg?.name?.charAt(0) || 'O'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {currentOrg?.name || 'Select Workspace'}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {organizations.map((org) => (
                          <DropdownMenuItem
                            key={org.id}
                            onClick={() => setCurrentOrg(org)}
                            className={cn(
                              currentOrg?.id === org.id && "bg-violet-50 dark:bg-violet-900/20"
                            )}
                          >
                            <div className="w-6 h-6 rounded bg-violet-100 flex items-center justify-center text-violet-700 text-xs mr-2">
                              {org.name?.charAt(0)}
                            </div>
                            {org.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-14 bg-card border-b border-border flex items-center px-4 lg:px-6 gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Panel Toggle (Desktop) */}
            {showPanel && (
              <button
                onClick={() => setPanelOpen(!panelOpen)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-muted text-muted-foreground"
              >
                {panelOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            )}

            {/* Logo for header */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground hidden sm:block">DataViz Studio</span>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md ml-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search datasets, dashboards..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-muted border-0 rounded-lg focus:bg-background focus:ring-2 focus:ring-violet-500 transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground relative">
                <Bell className="w-5 h-5" />
              </button>

              {/* Desktop Profile */}
              <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-border">
                <span className="text-sm text-muted-foreground">{user?.name}</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed left-0 top-0 bottom-0 w-[280px] bg-card z-50 lg:hidden overflow-y-auto"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-foreground">DataViz Studio</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="p-3">
                  {NAVIGATION.map((group) => {
                    const Icon = group.icon;
                    const isActive = activeGroup === group.id;
                    
                    return (
                      <div key={group.id} className="mb-4">
                        <button
                          onClick={() => {
                            if (group.path) {
                              navigate(group.path);
                              setMobileMenuOpen(false);
                            } else {
                              setActiveGroup(isActive ? '' : group.id);
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                            isActive ? "bg-violet-100 text-violet-700" : "text-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          {group.label}
                        </button>
                        
                        {isActive && group.items?.length > 0 && (
                          <div className="mt-1 ml-4 pl-4 border-l border-border space-y-1">
                            {group.items.map((item) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                  "block px-3 py-2 rounded-lg text-sm",
                                  location.pathname === item.path
                                    ? "bg-violet-100 text-violet-700"
                                    : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>

                {/* Mobile User */}
                <div className="p-4 border-t border-border mt-auto">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-violet-100 text-violet-700">
                        {user?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

export default DashboardLayout;
