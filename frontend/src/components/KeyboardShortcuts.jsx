/**
 * Keyboard Shortcuts Component
 * Features:
 * - Global keyboard shortcuts
 * - Shortcut help dialog
 * - Customizable shortcuts
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Keyboard, Command, Search, Plus, Settings, Home, BarChart3, LayoutDashboard, Database, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './ui/command';

// Default keyboard shortcuts
const shortcuts = [
  { 
    category: 'Navigation',
    items: [
      { keys: ['⌘', 'K'], description: 'Open command palette', action: 'commandPalette' },
      { keys: ['⌘', 'H'], description: 'Go to Home', action: 'navigate', path: '/' },
      { keys: ['⌘', 'D'], description: 'Go to Dashboards', action: 'navigate', path: '/dashboards' },
      { keys: ['⌘', 'C'], description: 'Go to Charts', action: 'navigate', path: '/charts' },
      { keys: ['⌘', 'U'], description: 'Go to Datasets', action: 'navigate', path: '/datasets' },
    ]
  },
  {
    category: 'Actions',
    items: [
      { keys: ['⌘', 'N'], description: 'Create new dashboard', action: 'create', type: 'dashboard' },
      { keys: ['⌘', 'Shift', 'N'], description: 'Create new chart', action: 'create', type: 'chart' },
      { keys: ['⌘', 'S'], description: 'Save current', action: 'save' },
      { keys: ['⌘', 'E'], description: 'Export', action: 'export' },
    ]
  },
  {
    category: 'General',
    items: [
      { keys: ['⌘', ','], description: 'Open settings', action: 'navigate', path: '/settings' },
      { keys: ['⌘', '/'], description: 'Show shortcuts', action: 'showShortcuts' },
      { keys: ['Esc'], description: 'Close dialog/modal', action: 'escape' },
    ]
  }
];

// Command palette items
const commandItems = [
  { icon: Home, label: 'Go to Home', shortcut: '⌘H', action: () => {}, path: '/' },
  { icon: LayoutDashboard, label: 'Go to Dashboards', shortcut: '⌘D', action: () => {}, path: '/dashboards' },
  { icon: BarChart3, label: 'Go to Charts', shortcut: '⌘C', action: () => {}, path: '/charts' },
  { icon: Database, label: 'Go to Datasets', shortcut: '⌘U', action: () => {}, path: '/datasets' },
  { icon: Settings, label: 'Open Settings', shortcut: '⌘,', action: () => {}, path: '/settings' },
  { icon: Plus, label: 'New Dashboard', shortcut: '⌘N', action: () => {}, path: '/dashboards/new' },
  { icon: HelpCircle, label: 'Help Center', shortcut: '', action: () => {}, path: '/help' },
];

export function KeyboardShortcuts({ onAction }) {
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    // Command palette: Cmd/Ctrl + K
    if (cmdKey && e.key === 'k') {
      e.preventDefault();
      setShowCommandPalette(true);
      return;
    }

    // Show shortcuts: Cmd/Ctrl + /
    if (cmdKey && e.key === '/') {
      e.preventDefault();
      setShowShortcuts(true);
      return;
    }

    // Navigation shortcuts
    if (cmdKey && !e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'h':
          e.preventDefault();
          navigate('/');
          break;
        case 'd':
          e.preventDefault();
          navigate('/dashboards');
          break;
        case 'c':
          e.preventDefault();
          navigate('/charts');
          break;
        case 'u':
          e.preventDefault();
          navigate('/datasets');
          break;
        case ',':
          e.preventDefault();
          navigate('/settings');
          break;
        case 'n':
          e.preventDefault();
          navigate('/dashboards/new');
          break;
        case 's':
          e.preventDefault();
          onAction?.('save');
          break;
        case 'e':
          e.preventDefault();
          onAction?.('export');
          break;
        default:
          break;
      }
    }

    // Cmd/Ctrl + Shift + N for new chart
    if (cmdKey && e.shiftKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      navigate('/charts/new');
    }
  }, [navigate, onAction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCommandSelect = (item) => {
    setShowCommandPalette(false);
    if (item.path) {
      navigate(item.path);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <>
      {/* Shortcuts Help Dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these shortcuts to navigate and work faster
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h4 className="font-medium text-sm text-muted-foreground mb-3">
                  {category.category}
                </h4>
                <div className="space-y-2">
                  {category.items.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, i) => (
                          <kbd
                            key={i}
                            className="px-2 py-1 text-xs font-medium bg-muted rounded border border-border"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            <p>Press <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">K</kbd> to open the command palette</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Palette */}
      <CommandDialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {commandItems.slice(0, 5).map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() => handleCommandSelect(item)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            {commandItems.slice(5).map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() => handleCommandSelect(item)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Shortcut trigger button
export function ShortcutsTrigger() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Keyboard shortcuts (⌘/)">
          <Keyboard className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and work faster
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">
                {category.category}
              </h4>
              <div className="space-y-2">
                {category.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 text-xs font-medium bg-muted rounded border border-border"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default KeyboardShortcuts;
