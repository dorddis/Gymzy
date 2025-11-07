"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserPreferences,
  updateTheme,
  updateUnits,
  updateNotificationPreferences
} from '@/services/data/user-settings-service';
import { syncPreferencesToOnboarding } from '@/services/data/settings-sync-service';
import { UserPreferences, AppTheme, UnitSystem } from '@/types/user';
import { Loader2, Sun, Moon, Monitor, Ruler, Bell, Palette } from 'lucide-react';

export function AppPreferences() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    if (user?.uid) {
      loadPreferences();
    }
  }, [user?.uid]);

  const loadPreferences = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const prefs = await getUserPreferences(user.uid);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (theme: AppTheme) => {
    if (!user?.uid || !preferences) return;

    try {
      setIsSaving(true);
      const success = await updateTheme(user.uid, theme);
      if (success) {
        setPreferences({ ...preferences, theme });

        // Sync to onboarding context for AI
        await syncPreferencesToOnboarding(user.uid, { theme });

        // Apply theme to document
        if (theme === AppTheme.DARK) {
          document.documentElement.classList.add('dark');
        } else if (theme === AppTheme.LIGHT) {
          document.documentElement.classList.remove('dark');
        } else {
          // AUTO: check system preference
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle('dark', isDark);
        }
      }
    } catch (error) {
      console.error('Error updating theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnitsChange = async (units: UnitSystem) => {
    if (!user?.uid || !preferences) return;

    try {
      setIsSaving(true);
      const success = await updateUnits(user.uid, units);
      if (success) {
        setPreferences({ ...preferences, units });

        // Sync to onboarding context for AI
        await syncPreferencesToOnboarding(user.uid, { units });
      }
    } catch (error) {
      console.error('Error updating units:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationToggle = async (key: keyof typeof preferences.notifications, value: boolean) => {
    if (!user?.uid || !preferences) return;

    try {
      setIsSaving(true);
      const updatedNotifications = {
        ...preferences.notifications,
        [key]: value
      };

      const success = await updateNotificationPreferences(user.uid, { [key]: value });
      if (success) {
        setPreferences({
          ...preferences,
          notifications: updatedNotifications
        });

        // Sync to onboarding context for AI
        await syncPreferencesToOnboarding(user.uid, {
          notifications: updatedNotifications
        });
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Unable to load preferences</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how Gymzy looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={preferences.theme}
              onValueChange={(value) => handleThemeChange(value as AppTheme)}
              disabled={isSaving}
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AppTheme.LIGHT}>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value={AppTheme.DARK}>
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value={AppTheme.AUTO}>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Auto (System)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Choose your preferred theme or match your device settings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Units Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Units
          </CardTitle>
          <CardDescription>
            Set your preferred measurement system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="units">Measurement System</Label>
            <Select
              value={preferences.units}
              onValueChange={(value) => handleUnitsChange(value as UnitSystem)}
              disabled={isSaving}
            >
              <SelectTrigger id="units">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UnitSystem.METRIC}>
                  Metric (kg, cm)
                </SelectItem>
                <SelectItem value={UnitSystem.IMPERIAL}>
                  Imperial (lbs, inches)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Used for weight, height, and distance measurements
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive updates via email
              </p>
            </div>
            <Switch
              checked={preferences.notifications.email}
              onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
              disabled={isSaving}
            />
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-gray-500">
                Get alerts on your device
              </p>
            </div>
            <Switch
              checked={preferences.notifications.push}
              onCheckedChange={(checked) => handleNotificationToggle('push', checked)}
              disabled={isSaving}
            />
          </div>

          {/* Workout Reminders */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Workout Reminders</Label>
              <p className="text-sm text-gray-500">
                Get reminded about your workout schedule
              </p>
            </div>
            <Switch
              checked={preferences.notifications.workoutReminders}
              onCheckedChange={(checked) => handleNotificationToggle('workoutReminders', checked)}
              disabled={isSaving}
            />
          </div>

          {/* Social Activity */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Social Activity</Label>
              <p className="text-sm text-gray-500">
                Notifications for likes, comments, and follows
              </p>
            </div>
            <Switch
              checked={preferences.notifications.socialActivity}
              onCheckedChange={(checked) => handleNotificationToggle('socialActivity', checked)}
              disabled={isSaving}
            />
          </div>

          {/* Achievements */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Achievements</Label>
              <p className="text-sm text-gray-500">
                Get notified when you unlock achievements
              </p>
            </div>
            <Switch
              checked={preferences.notifications.achievements}
              onCheckedChange={(checked) => handleNotificationToggle('achievements', checked)}
              disabled={isSaving}
            />
          </div>

          {/* Marketing Offers */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing & Offers</Label>
              <p className="text-sm text-gray-500">
                Receive promotional emails and special offers
              </p>
            </div>
            <Switch
              checked={preferences.notifications.marketingOffers}
              onCheckedChange={(checked) => handleNotificationToggle('marketingOffers', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
