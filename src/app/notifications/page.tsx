"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  ArrowLeft, 
  Dumbbell, 
  Users, 
  Brain, 
  Heart, 
  Trophy,
  Zap,
  Settings,
  RefreshCw,
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBar } from '@/components/layout/status-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SmartNotificationsPanel } from '@/components/notifications/smart-notifications-panel';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    isLoading,
    generateNotifications,
    getNotificationsByType,
    getUnreadCount,
    getTodaysNotifications
  } = useSmartNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateNew = async () => {
    setIsGenerating(true);
    await generateNotifications();
    setIsGenerating(false);
  };

  const getTabCount = (type: string) => {
    switch (type) {
      case 'all':
        return notifications.filter(n => n.status !== 'dismissed').length;
      case 'today':
        return getTodaysNotifications().length;
      case 'workout':
        return getNotificationsByType('workout_reminder').length;
      case 'social':
        return getNotificationsByType('social').length;
      case 'ai':
        return getNotificationsByType('ai_insight').length;
      case 'habit':
        return getNotificationsByType('habit_support').length;
      default:
        return 0;
    }
  };

  const getFilteredNotifications = () => {
    const activeNotifications = notifications.filter(n => n.status !== 'dismissed');
    
    switch (activeTab) {
      case 'today':
        return getTodaysNotifications();
      case 'workout':
        return getNotificationsByType('workout_reminder');
      case 'social':
        return getNotificationsByType('social');
      case 'ai':
        return getNotificationsByType('ai_insight');
      case 'habit':
        return getNotificationsByType('habit_support');
      default:
        return activeNotifications;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StatusBar />
      
      <div className="pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-full bg-blue-500">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Smart Notifications</h1>
                <p className="text-sm text-gray-600">Stay engaged with personalized updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateNew}
                disabled={isLoading || isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unread</p>
                    <p className="text-lg font-semibold">{getUnreadCount()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Today</p>
                    <p className="text-lg font-semibold">{getTodaysNotifications().length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="all" className="text-xs">
                All ({getTabCount('all')})
              </TabsTrigger>
              <TabsTrigger value="today" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Today ({getTabCount('today')})
              </TabsTrigger>
              <TabsTrigger value="workout" className="text-xs">
                <Dumbbell className="h-3 w-3 mr-1" />
                Workout ({getTabCount('workout')})
              </TabsTrigger>
              <TabsTrigger value="social" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Social ({getTabCount('social')})
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                AI Insights ({getTabCount('ai')})
              </TabsTrigger>
              <TabsTrigger value="habit" className="text-xs">
                <Heart className="h-3 w-3 mr-1" />
                Habits ({getTabCount('habit')})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <SmartNotificationsPanel maxNotifications={50} showHeader={false} />
            </TabsContent>

            <TabsContent value="today" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-green-600" />
                    Today&apos;s Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getTodaysNotifications().length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No notifications today</p>
                      <p className="text-xs text-gray-500 mt-1">You&apos;re all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getTodaysNotifications().map((notif) => (
                        <div key={notif.id} className="p-3 border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-sm text-gray-900 mb-1">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {notif.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {notif.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workout" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Dumbbell className="h-4 w-4 text-blue-600" />
                    Workout Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getNotificationsByType('workout_reminder').length === 0 ? (
                    <div className="text-center py-8">
                      <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No workout notifications</p>
                      <p className="text-xs text-gray-500 mt-1">You&apos;re staying consistent!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getNotificationsByType('workout_reminder').map((notif) => (
                        <div key={notif.id} className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <h4 className="font-medium text-sm text-blue-900 mb-1">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-blue-700">
                            {notif.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-purple-600" />
                    Social Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getNotificationsByType('social').length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No social notifications</p>
                      <p className="text-xs text-gray-500 mt-1">Connect with the community!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getNotificationsByType('social').map((notif) => (
                        <div key={notif.id} className="p-3 border border-purple-200 rounded-lg bg-purple-50">
                          <h4 className="font-medium text-sm text-purple-900 mb-1">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-purple-700">
                            {notif.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="h-4 w-4 text-green-600" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getNotificationsByType('ai_insight').length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No AI insights</p>
                      <p className="text-xs text-gray-500 mt-1">Check back for personalized tips!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getNotificationsByType('ai_insight').map((notif) => (
                        <div key={notif.id} className="p-3 border border-green-200 rounded-lg bg-green-50">
                          <h4 className="font-medium text-sm text-green-900 mb-1">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-green-700">
                            {notif.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="habit" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4 text-pink-600" />
                    Habit Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getNotificationsByType('habit_support').length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No habit notifications</p>
                      <p className="text-xs text-gray-500 mt-1">You&apos;re building great habits!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getNotificationsByType('habit_support').map((notif) => (
                        <div key={notif.id} className="p-3 border border-pink-200 rounded-lg bg-pink-50">
                          <h4 className="font-medium text-sm text-pink-900 mb-1">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-pink-700">
                            {notif.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
