"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Smartphone, 
  Settings, 
  Download, 
  Upload, 
  RotateCcw,
  Eye,
  Keyboard,
  Palette,
  Layout,
  MessageSquare,
  Zap
} from 'lucide-react';
import { useDesktopPreferences, useUserPreferences } from '@/lib/user-preferences';
import { useAppLayout } from '@/components/layout/app-layout-provider';
import { cn } from '@/lib/utils';

interface DesktopPreferencesPanelProps {
  className?: string;
  onClose?: () => void;
}

export function DesktopPreferencesPanel({ className, onClose }: DesktopPreferencesPanelProps) {
  const { desktopPreferences, updateDesktopPreferences } = useDesktopPreferences();
  const { exportPreferences, importPreferences, resetToDefaults } = useUserPreferences();
  const { isDesktopLayout, breakpoint } = useAppLayout();
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleSplitRatioChange = (value: number[]) => {
    updateDesktopPreferences({ defaultSplitRatio: value[0] / 100 });
  };

  const handleExport = () => {
    const data = exportPreferences();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymzy-preferences-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      importPreferences(importData);
      setImportData('');
      setShowImportDialog(false);
    } catch (error) {
      alert('Failed to import preferences: ' + (error as Error).message);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
        setShowImportDialog(true);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Monitor className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Desktop Layout Preferences</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isDesktopLayout ? "default" : "secondary"}>
            {isDesktopLayout ? "Desktop Mode" : "Mobile Mode"}
          </Badge>
          <Badge variant="outline">{breakpoint}</Badge>
        </div>
      </div>

      {/* Current Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isDesktopLayout ? (
              <Monitor className="h-8 w-8 text-green-600" />
            ) : (
              <Smartphone className="h-8 w-8 text-blue-600" />
            )}
            <div>
              <h3 className="font-medium">
                {isDesktopLayout ? "Desktop Layout Active" : "Mobile Layout Active"}
              </h3>
              <p className="text-sm text-gray-600">
                Current breakpoint: {breakpoint} • Screen width: {window.innerWidth}px
              </p>
            </div>
          </div>
          <Switch
            checked={desktopPreferences.enabled}
            onCheckedChange={(enabled) => updateDesktopPreferences({ enabled })}
          />
        </div>
      </Card>

      {/* Layout Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Layout className="h-5 w-5" />
          <h3 className="text-lg font-medium">Layout Configuration</h3>
        </div>

        <div className="space-y-6">
          {/* Chat Panel Position */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Chat Panel Position</span>
            </Label>
            <Select
              value={desktopPreferences.chatPanelPosition}
              onValueChange={(value: 'left' | 'right') => 
                updateDesktopPreferences({ chatPanelPosition: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left Side</SelectItem>
                <SelectItem value="right">Right Side</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Split Ratio */}
          <div className="space-y-3">
            <Label>Default Split Ratio</Label>
            <div className="px-3">
              <Slider
                value={[desktopPreferences.defaultSplitRatio * 100]}
                onValueChange={handleSplitRatioChange}
                min={30}
                max={80}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>30% App</span>
                <span className="font-medium">
                  {Math.round(desktopPreferences.defaultSplitRatio * 100)}% App / {Math.round((1 - desktopPreferences.defaultSplitRatio) * 100)}% Chat
                </span>
                <span>80% App</span>
              </div>
            </div>
          </div>

          {/* Auto Hide Chat */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Auto-hide Chat Panel</span>
            </Label>
            <Switch
              checked={desktopPreferences.autoHideChat}
              onCheckedChange={(autoHideChat) => updateDesktopPreferences({ autoHideChat })}
            />
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Compact Mode</span>
            </Label>
            <Switch
              checked={desktopPreferences.compactMode}
              onCheckedChange={(compactMode) => updateDesktopPreferences({ compactMode })}
            />
          </div>
        </div>
      </Card>

      {/* Appearance Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Palette className="h-5 w-5" />
          <h3 className="text-lg font-medium">Appearance</h3>
        </div>

        <div className="space-y-6">
          {/* Theme */}
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={desktopPreferences.theme}
              onValueChange={(value: 'light' | 'dark' | 'system') => 
                updateDesktopPreferences({ theme: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label>Font Size</Label>
            <Select
              value={desktopPreferences.fontSize}
              onValueChange={(value: 'small' | 'medium' | 'large') => 
                updateDesktopPreferences({ fontSize: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Enable Animations</span>
            </Label>
            <Switch
              checked={desktopPreferences.animationsEnabled}
              onCheckedChange={(animationsEnabled) => updateDesktopPreferences({ animationsEnabled })}
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <Label>Reduce Motion</Label>
            <Switch
              checked={desktopPreferences.reducedMotion}
              onCheckedChange={(reducedMotion) => updateDesktopPreferences({ reducedMotion })}
            />
          </div>
        </div>
      </Card>

      {/* Interaction Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Keyboard className="h-5 w-5" />
          <h3 className="text-lg font-medium">Interaction</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Keyboard Shortcuts</Label>
            <Switch
              checked={desktopPreferences.keyboardShortcutsEnabled}
              onCheckedChange={(keyboardShortcutsEnabled) => 
                updateDesktopPreferences({ keyboardShortcutsEnabled })
              }
            />
          </div>
        </div>
      </Card>

      <Separator />

      {/* Import/Export and Reset */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Backup & Reset</h3>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={handleExport} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>
            
            <div className="flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                id="import-file"
              />
              <Button 
                onClick={() => document.getElementById('import-file')?.click()}
                variant="outline" 
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Settings
              </Button>
            </div>
          </div>

          <Button 
            onClick={resetToDefaults} 
            variant="destructive" 
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </Card>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Import Preferences</h3>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste your preferences JSON here..."
              className="w-full h-32 p-3 border rounded-md text-sm font-mono"
            />
            <div className="flex space-x-2 mt-4">
              <Button onClick={handleImport} className="flex-1">
                Import
              </Button>
              <Button 
                onClick={() => setShowImportDialog(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}