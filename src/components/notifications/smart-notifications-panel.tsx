"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Dumbbell, 
  Users, 
  Brain, 
  Heart, 
  Trophy,
  Clock,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Calendar,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { SmartNotification } from '@/services/notification-service';

interface SmartNotificationsPanelProps {
  maxNotifications?: number;
  showHeader?: boolean;
  compact?: boolean;
  showOnlyHighPriority?: boolean;
}

export function SmartNotificationsPanel({ 
  maxNotifications = 5, 
  showHeader = true,
  compact = false,
  showOnlyHighPriority = false
}: SmartNotificationsPanelProps) {
  const router = useRouter();
  const {
    notifications,
    isLoading,
    error,
    generateNotifications,
    markAsRead,
    dismissNotification,
    getUnreadCount,
    getHighPriorityNotifications,
    shouldShowNotifications
  } = useSmartNotifications();

  const [isGenerating, setIsGenerating] = useState(false);

  const displayedNotifications = showOnlyHighPriority 
    ? getHighPriorityNotifications().slice(0, maxNotifications)
    : notifications
        .filter(notif => notif.status !== 'dismissed')
        .slice(0, maxNotifications);

  const handleNotificationClick = async (notification: SmartNotification) => {
    await markAsRead(notification.id);
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleDismiss = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await dismissNotification(notificationId);
  };

  const handleGenerateNew = async () => {
    setIsGenerating(true);
    await generateNotifications();
    setIsGenerating(false);
  };

  const getNotificationIcon = (type: SmartNotification['type']) => {
    switch (type) {
      case 'workout_reminder':
        return <Dumbbell className="h-4 w-4" />;
      case 'social':
        return <Users className="h-4 w-4" />;
      case 'ai_insight':
        return <Brain className="h-4 w-4" />;
      case 'habit_support':
        return <Heart className="h-4 w-4" />;
      case 'achievement':
        return <Trophy className="h-4 w-4" />;
      case 'recovery':
        return <Zap className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: SmartNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-3 w-3 text-orange-500" />;
      case 'medium':
        return <Info className="h-3 w-3 text-blue-500" />;
      case 'low':
        return <Info className="h-3 w-3 text-gray-500" />;
      default:
        return <Info className="h-3 w-3 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: SmartNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: SmartNotification['type']) => {
    switch (type) {
      case 'workout_reminder':
        return 'text-blue-600';
      case 'social':
        return 'text-purple-600';
      case 'ai_insight':
        return 'text-green-600';
      case 'habit_support':
        return 'text-pink-600';
      case 'achievement':
        return 'text-yellow-600';
      case 'recovery':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    const now = new Date();
    const time = timestamp.toDate();
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (!shouldShowNotifications()) {
    return null; // Respect quiet hours
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-700">
            <X className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-blue-600" />
              Smart Notifications
              {getUnreadCount() > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {getUnreadCount()}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateNew}
              disabled={isLoading || isGenerating}
              className="h-8 w-8 p-0"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={showHeader ? "pt-0" : "p-4"}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Loading notifications...</span>
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-3">No notifications available</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateNew}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Check for Updates
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  notification.status === 'pending' || notification.status === 'sent' 
                    ? 'border-l-4 border-l-blue-500' 
                    : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-1.5 rounded-md ${getTypeColor(notification.type)} bg-opacity-10`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(notification.priority)}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(notification.createdAt)}
                          </div>
                        </div>
                        
                        {notification.actionText && (
                          <span className="text-xs text-blue-600 font-medium">
                            {notification.actionText} →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDismiss(notification.id, e)}
                    className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100 hover:bg-red-100"
                  >
                    <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {displayedNotifications.length > 0 && !compact && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/notifications')}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View All Notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
