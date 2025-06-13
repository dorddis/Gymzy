import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SmartNotificationService, SmartNotification, NotificationPreferences } from '@/services/notification-service';

export function useSmartNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications for the current user
  const loadNotifications = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const userNotifications = await SmartNotificationService.getUserNotifications(user.uid);
      setNotifications(userNotifications);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userPreferences = await SmartNotificationService.getUserPreferences(user.uid);
      setPreferences(userPreferences);
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  }, [user?.uid]);

  // Generate new notifications
  const generateNotifications = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Generate different types of notifications
      const workoutReminders = await SmartNotificationService.generateWorkoutReminders(user.uid);
      const aiInsights = await SmartNotificationService.generateAIInsights(user.uid);
      const habitSupport = await SmartNotificationService.generateHabitSupport(user.uid);
      
      const allNotifications = [...workoutReminders, ...aiInsights, ...habitSupport];
      
      if (allNotifications.length > 0) {
        await SmartNotificationService.saveNotifications(allNotifications);
        setNotifications(prev => [...allNotifications, ...prev]);
      }
    } catch (err) {
      console.error('Error generating notifications:', err);
      setError('Failed to generate notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Initialize user preferences
  const initializePreferences = useCallback(async () => {
    if (!user?.uid) return;

    try {
      await SmartNotificationService.initializeUserPreferences(user.uid);
      await loadPreferences();
    } catch (err) {
      console.error('Error initializing preferences:', err);
    }
  }, [user?.uid, loadPreferences]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read' as const, readAt: new Date() as any }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'dismissed' as const }
            : notif
        )
      );
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: SmartNotification['type']) => {
    return notifications.filter(notif => notif.type === type && notif.status !== 'dismissed');
  }, [notifications]);

  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority: SmartNotification['priority']) => {
    return notifications.filter(notif => notif.priority === priority && notif.status !== 'dismissed');
  }, [notifications]);

  // Get unread notifications count
  const getUnreadCount = useCallback(() => {
    return notifications.filter(notif => 
      notif.status === 'pending' || notif.status === 'sent'
    ).length;
  }, [notifications]);

  // Get high priority notifications
  const getHighPriorityNotifications = useCallback(() => {
    return notifications.filter(notif => 
      (notif.priority === 'high' || notif.priority === 'urgent') && 
      notif.status !== 'dismissed'
    );
  }, [notifications]);

  // Get today's notifications
  const getTodaysNotifications = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return notifications.filter(notif => {
      const notifDate = notif.createdAt.toDate();
      notifDate.setHours(0, 0, 0, 0);
      return notifDate.getTime() === today.getTime() && notif.status !== 'dismissed';
    });
  }, [notifications]);

  // Check if notifications should be shown (respect quiet hours)
  const shouldShowNotifications = useCallback(() => {
    if (!preferences?.quietHours.enabled) return true;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHours.startTime.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHours.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return !(currentTime >= startTime || currentTime <= endTime);
    } else {
      return !(currentTime >= startTime && currentTime <= endTime);
    }
  }, [preferences]);

  // Auto-generate notifications periodically
  useEffect(() => {
    if (user?.uid) {
      // Generate notifications on mount
      generateNotifications();
      
      // Set up periodic generation (every 4 hours)
      const interval = setInterval(() => {
        generateNotifications();
      }, 4 * 60 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user?.uid, generateNotifications]);

  // Load data when user changes
  useEffect(() => {
    if (user?.uid) {
      initializePreferences();
      loadNotifications();
    }
  }, [user?.uid, initializePreferences, loadNotifications]);

  return {
    notifications,
    preferences,
    isLoading,
    error,
    loadNotifications,
    loadPreferences,
    generateNotifications,
    initializePreferences,
    markAsRead,
    dismissNotification,
    getNotificationsByType,
    getNotificationsByPriority,
    getUnreadCount,
    getHighPriorityNotifications,
    getTodaysNotifications,
    shouldShowNotifications
  };
}
