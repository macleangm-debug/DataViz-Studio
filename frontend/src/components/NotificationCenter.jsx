/**
 * Notification Center Component
 * Features:
 * - Real-time notifications display
 * - Read/unread status
 * - Notification categories
 * - Clear all functionality
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  X,
  Settings,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  FileText,
  Users,
  BarChart3
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';

// Notification type configurations
const notificationTypes = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  message: { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  report: { icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  team: { icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  chart: { icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
};

// Mock notifications for development
const mockNotifications = [
  {
    id: '1',
    type: 'success',
    title: 'Dashboard exported',
    message: 'Your sales dashboard has been exported to PDF successfully.',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    read: false,
    category: 'system'
  },
  {
    id: '2',
    type: 'team',
    title: 'New team member',
    message: 'Jane Smith has joined your organization.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    category: 'team'
  },
  {
    id: '3',
    type: 'report',
    title: 'Weekly report ready',
    message: 'Your scheduled weekly report is ready to view.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: true,
    category: 'reports'
  },
  {
    id: '4',
    type: 'warning',
    title: 'Storage limit approaching',
    message: 'You have used 80% of your storage quota.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    category: 'system'
  },
  {
    id: '5',
    type: 'chart',
    title: 'Chart shared with you',
    message: 'Bob Wilson shared "Q4 Revenue Analysis" chart with you.',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    read: true,
    category: 'team'
  }
];

function NotificationItem({ notification, onRead, onDelete }) {
  const config = notificationTypes[notification.type] || notificationTypes.info;
  const Icon = config.icon;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-3 rounded-lg transition-colors cursor-pointer group ${
        notification.read ? 'bg-transparent hover:bg-muted/50' : 'bg-primary/5 hover:bg-primary/10'
      }`}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <div className="flex gap-3">
        <div className={`p-2 rounded-full ${config.bg} shrink-0`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
              {notification.title}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
            >
              <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{formatTime(notification.timestamp)}</span>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return n.category === activeTab;
  });

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="notification-trigger">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b px-4 h-auto py-0 bg-transparent">
            <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2">
              System
            </TabsTrigger>
            <TabsTrigger value="team" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2">
              Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length > 0 ? (
                <div className="p-2 space-y-1">
                  <AnimatePresence>
                    {filteredNotifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={handleMarkAsRead}
                        onDelete={handleDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <BellOff className="w-12 h-12 mb-4 opacity-50" />
                  <p>No notifications</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleClearAll}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;
