"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Monitor, 
  User, 
  Dumbbell, 
  Bell, 
  Shield, 
  Info,
  ChevronRight
} from 'lucide-react';
import { DesktopPreferencesPanel } from './desktop-preferences-panel';
import { useAppLayout } from '@/components/layout/app-layout-provider';
import { useUserPreferences } from '@/lib/user-preferences';

export function SettingsPage() {
  const { isDesktopLayout } = useAppLayout();
  const { preferences } = useUserPreferences();
  const [activeTab, setActiveTab] = useState('desktop');

  const settingsSections = [
    {
      id: 'desktop',
      title: 'Desktop Layout',
      description: 'Customize your desktop experience',
      icon: Monitor,
      badge: isDesktopLayout ? 'Active' : 'Inactive',
      badgeVariant: isDesktopLayout ? 'default' : 'secondary',
    },
    {
      id: 'profile',
      title: 'Profile & Account',
      description: 'Manage your personal information',
      icon: User,
      badge: null,
      badgeVariant: null,
    },
    {
      id: 'workout',
      title: 'Workout Preferences',
      description: 'Default settings for workouts',
      icon: Dumbbell,
      badge: null,
      badgeVariant: null,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Control what notifications you receive',
      icon: Bell,
      badge: preferences.general.notifications ? 'On' : 'Off',
      badgeVariant: preferences.general.notifications ? 'default' : 'secondary',
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Manage your privacy settings',
      icon: Shield,
      badge: null,
      badgeVariant: null,
    },
    {
      id: 'about',
      title: 'About',
      description: 'App information and support',
      icon: Info,
      badge: null,
      badgeVariant: null,
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600">Customize your Gymzy experience</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="font-semibold mb-4">Settings</h2>
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      activeTab === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs text-gray-500 hidden sm:block">
                          {section.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {section.badge && (
                        <Badge variant={section.badgeVariant as any}>
                          {section.badge}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="desktop" className="mt-0">
              <DesktopPreferencesPanel />
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Profile & Account</h3>
                <p className="text-gray-600">Profile settings coming soon...</p>
              </Card>
            </TabsContent>

            <TabsContent value="workout" className="mt-0">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Workout Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Default Rest Time</label>
                      <p className="text-sm text-gray-600">Time between sets</p>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{preferences.workout.defaultRestTime}s</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Auto-start Timer</label>
                      <p className="text-sm text-gray-600">Automatically start rest timer</p>
                    </div>
                    <Badge variant={preferences.workout.autoStartTimer ? "default" : "secondary"}>
                      {preferences.workout.autoStartTimer ? "On" : "Off"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Sound Enabled</label>
                      <p className="text-sm text-gray-600">Play sounds for timers and notifications</p>
                    </div>
                    <Badge variant={preferences.workout.soundEnabled ? "default" : "secondary"}>
                      {preferences.workout.soundEnabled ? "On" : "Off"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">General Notifications</label>
                      <p className="text-sm text-gray-600">Receive app notifications</p>
                    </div>
                    <Badge variant={preferences.general.notifications ? "default" : "secondary"}>
                      {preferences.general.notifications ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="mt-0">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Privacy & Security</h3>
                <p className="text-gray-600">Privacy settings coming soon...</p>
              </Card>
            </TabsContent>

            <TabsContent value="about" className="mt-0">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">About Gymzy</h3>
                <div className="space-y-4">
                  <div>
                    <label className="font-medium">Version</label>
                    <p className="text-gray-600">{preferences.version}</p>
                  </div>
                  
                  <div>
                    <label className="font-medium">Last Updated</label>
                    <p className="text-gray-600">
                      {preferences.lastUpdated.toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="font-medium">Language</label>
                    <p className="text-gray-600">{preferences.general.language}</p>
                  </div>

                  <div>
                    <label className="font-medium">Timezone</label>
                    <p className="text-gray-600">{preferences.general.timezone}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}