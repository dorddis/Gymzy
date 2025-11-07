"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfilePictureUpload } from '@/components/profile/profile-picture-upload';
import { ProfilePictureService } from '@/services/media/profile-picture-service';
import { OnboardingContextService, OnboardingContext } from '@/services/data/onboarding-context-service';
import { FitnessGoalsEditor } from '@/components/settings/fitness-goals-editor';
import { EquipmentManager } from '@/components/settings/equipment-manager';
import { ScheduleBuilder } from '@/components/settings/schedule-builder';
import { HealthInfoManager } from '@/components/settings/health-info-manager';
import { PhysicalStatsManager } from '@/components/settings/physical-stats-manager';
import { AICoachSettings } from '@/components/settings/ai-coach-settings';
import { PrivacySecurityDashboard } from '@/components/settings/privacy-security-dashboard';
import {
  User,
  Target,
  Dumbbell,
  Calendar,
  Heart,
  Settings as SettingsIcon,
  Shield,
  Bell,
  Palette,
  Loader2,
  Smartphone
} from 'lucide-react';
import { BackButton } from '@/components/layout/back-button';
import { AppPreferences } from '@/components/settings/app-preferences';

export default function SettingsPage() {
  const { user, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingContext, setOnboardingContext] = useState<OnboardingContext | null>(null);
  const [activeTab, setActiveTab] = useState('account');
  const [fitnessSubTab, setFitnessSubTab] = useState('physical');

  useEffect(() => {
    if (user?.uid) {
      loadOnboardingContext();
    }
  }, [user]);

  const loadOnboardingContext = async () => {
    if (!user?.uid) return;
    
    try {
      const context = await OnboardingContextService.getOnboardingContext(user.uid);
      setOnboardingContext(context);
    } catch (error) {
      console.error('Error loading onboarding context:', error);
    }
  };

  const handleProfilePictureUpload = async (
    originalFile: File,
    croppedBlob: Blob,
    onProgress?: (progress: number) => void
  ) => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const profilePicture = await ProfilePictureService.uploadProfilePicture(
        user.uid,
        originalFile,
        croppedBlob,
        onProgress
      );

      await ProfilePictureService.setActiveProfilePicture(user.uid, profilePicture.id);

      // Refresh user profile to show new picture
      console.log('Profile picture updated successfully, refreshing user profile...');
      await refreshUserProfile();
      console.log('User profile refreshed');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureRemove = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const activeProfile = await ProfilePictureService.getActiveProfilePicture(user.uid);
      if (activeProfile) {
        await ProfilePictureService.deleteProfilePicture(activeProfile.id);
        // Refresh user profile to clear removed picture
        await refreshUserProfile();
        console.log('Profile picture removed and user profile refreshed');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-20 max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <BackButton />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-3 lg:grid-cols-5 gap-1">
              <TabsTrigger value="account" className="flex items-center gap-2 flex-shrink-0 px-4">
                <User className="h-4 w-4" />
                <span>Account</span>
              </TabsTrigger>
              <TabsTrigger value="fitness" className="flex items-center gap-2 flex-shrink-0 px-4">
                <Target className="h-4 w-4" />
                <span>Fitness</span>
              </TabsTrigger>
              <TabsTrigger value="app" className="flex items-center gap-2 flex-shrink-0 px-4">
                <Smartphone className="h-4 w-4" />
                <span>App</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2 flex-shrink-0 px-4">
                <SettingsIcon className="h-4 w-4" />
                <span>AI</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2 flex-shrink-0 px-4">
                <Shield className="h-4 w-4" />
                <span>Privacy</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Account Tab - Basic Profile Info */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Update your profile photo</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfilePictureUpload
                  currentPicture={user.profile?.profilePicture}
                  onUpload={handleProfilePictureUpload}
                  onRemove={handleProfilePictureRemove}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user.profile?.displayName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your display name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    defaultValue={user.profile?.bio || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={user.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                <Button className="w-full">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fitness Profile Tab - Nested Tabs for Clean Navigation */}
          <TabsContent value="fitness" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Fitness Profile</CardTitle>
                <CardDescription>
                  These settings help Gymzy personalize your experience and provide better AI recommendations
                </CardDescription>
              </CardHeader>
            </Card>

            <Tabs value={fitnessSubTab} onValueChange={setFitnessSubTab} className="w-full">
              <div className="w-full overflow-x-auto scrollbar-hide">
                <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1">
                  <TabsTrigger value="physical" className="flex items-center gap-2 flex-shrink-0 px-3">
                    <SettingsIcon className="h-4 w-4" />
                    <span>Physical</span>
                  </TabsTrigger>
                  <TabsTrigger value="goals" className="flex items-center gap-2 flex-shrink-0 px-3">
                    <Target className="h-4 w-4" />
                    <span>Goals</span>
                  </TabsTrigger>
                  <TabsTrigger value="equipment" className="flex items-center gap-2 flex-shrink-0 px-3">
                    <Dumbbell className="h-4 w-4" />
                    <span>Equipment</span>
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="flex items-center gap-2 flex-shrink-0 px-3">
                    <Calendar className="h-4 w-4" />
                    <span>Schedule</span>
                  </TabsTrigger>
                  <TabsTrigger value="health" className="flex items-center gap-2 flex-shrink-0 px-3">
                    <Heart className="h-4 w-4" />
                    <span>Health</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="physical" className="space-y-4">
                <PhysicalStatsManager
                  context={onboardingContext}
                  onUpdate={setOnboardingContext}
                />
              </TabsContent>

              <TabsContent value="goals" className="space-y-4">
                <FitnessGoalsEditor
                  context={onboardingContext}
                  onUpdate={setOnboardingContext}
                />
              </TabsContent>

              <TabsContent value="equipment" className="space-y-4">
                <EquipmentManager
                  context={onboardingContext}
                  onUpdate={setOnboardingContext}
                />
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <ScheduleBuilder
                  context={onboardingContext}
                  onUpdate={setOnboardingContext}
                />
              </TabsContent>

              <TabsContent value="health" className="space-y-4">
                <HealthInfoManager
                  context={onboardingContext}
                  onUpdate={setOnboardingContext}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <AICoachSettings
              context={onboardingContext}
              onUpdate={setOnboardingContext}
            />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <PrivacySecurityDashboard />
          </TabsContent>

          <TabsContent value="app" className="space-y-6">
            <AppPreferences />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
