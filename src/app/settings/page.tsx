"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfilePictureUpload } from '@/components/profile/profile-picture-upload';
import { ProfilePictureService } from '@/services/profile-picture-service';
import { OnboardingContextService, OnboardingContext } from '@/services/onboarding-context-service';
import { FitnessGoalsEditor } from '@/components/settings/fitness-goals-editor';
import { EquipmentManager } from '@/components/settings/equipment-manager';
import { ScheduleBuilder } from '@/components/settings/schedule-builder';
import { HealthInfoManager } from '@/components/settings/health-info-manager';
import { PhysicalStatsManager } from '@/components/settings/physical-stats-manager';
import { AICoachSettings } from '@/components/settings/ai-coach-settings';
import { PrivacySecurityDashboard } from '@/components/settings/privacy-security-dashboard';
import { 
  ArrowLeft, 
  User, 
  Target, 
  Dumbbell, 
  Calendar, 
  Heart, 
  Settings as SettingsIcon,
  Shield,
  Bell,
  Palette,
  Loader2
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingContext, setOnboardingContext] = useState<OnboardingContext | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

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

      // Refresh user data or show success message
      console.log('Profile picture updated successfully');
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
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
        {/* Header with Back Button */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="physical" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Physical</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              <span className="hidden sm:inline">Equipment</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">AI Coach</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
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

          <TabsContent value="goals" className="space-y-6">
            <FitnessGoalsEditor
              context={onboardingContext}
              onUpdate={setOnboardingContext}
            />
          </TabsContent>

          <TabsContent value="equipment" className="space-y-6">
            <EquipmentManager
              context={onboardingContext}
              onUpdate={setOnboardingContext}
            />
          </TabsContent>

          <TabsContent value="physical" className="space-y-6">
            <PhysicalStatsManager />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <ScheduleBuilder
              context={onboardingContext}
              onUpdate={setOnboardingContext}
            />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <HealthInfoManager
              context={onboardingContext}
              onUpdate={setOnboardingContext}
            />
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
            <Card>
              <CardHeader>
                <CardTitle>App Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <SettingsIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>App settings coming soon!</p>
                  <p className="text-sm">You'll be able to customize app preferences here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
