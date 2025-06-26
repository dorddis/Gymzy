"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  BellRing, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  Trophy, 
  Target,
  Calendar,
  Dumbbell,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'achievement' | 'reminder' | 'milestone' | 'workout_shared';
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    userId?: string;
    userName?: string;
    workoutId?: string;
    achievementId?: string;
  };
}

export function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  const loadNotifications = async () => {
    // Mock notifications for now - in real app, fetch from Firebase
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'achievement',
        title: 'New Achievement!',
        message: 'You completed your first week streak! 🔥',
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        isRead: false,
        actionUrl: '/stats',
        metadata: { achievementId: 'week_streak' }
      },
      {
        id: '2',
        type: 'like',
        title: 'Workout Liked',
        message: 'Sarah liked your Push Day workout',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        isRead: false,
        metadata: { userId: 'sarah123', userName: 'Sarah', workoutId: 'workout123' }
      },
      {
        id: '3',
        type: 'reminder',
        title: 'Workout Reminder',
        message: 'Time for your scheduled leg day workout!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        isRead: true,
        actionUrl: '/workout'
      },
      {
        id: '4',
        type: 'follow',
        title: 'New Follower',
        message: 'Mike started following you',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        isRead: true,
        metadata: { userId: 'mike456', userName: 'Mike' }
      },
      {
        id: '5',
        type: 'milestone',
        title: 'Milestone Reached!',
        message: 'You\'ve completed 50 workouts! Keep it up! 💪',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        isRead: true,
        actionUrl: '/stats'
      }
    ];

    setNotifications(mockNotifications);
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    // TODO: Update in Firebase
  };

  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    // TODO: Update in Firebase
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    // TODO: Delete from Firebase
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'milestone':
        return <Target className="h-4 w-4 text-purple-500" />;
      case 'reminder':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'workout_shared':
        return <Dumbbell className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 relative">
          {unreadCount > 0 ? (
            <BellRing className="h-3 w-3" />
          ) : (
            <Bell className="h-3 w-3" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-auto p-1"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs text-gray-400">We'll notify you when something happens!</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-0 focus:bg-gray-50"
                onSelect={(e) => e.preventDefault()}
              >
                <div 
                  className={`w-full p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100"
                          >
                            <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-center"
                onClick={() => {
                  window.location.href = '/notifications';
                  setIsOpen(false);
                }}
              >
                View All Notifications
              </Button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
