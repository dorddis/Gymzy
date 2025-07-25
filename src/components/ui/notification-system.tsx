"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationOptions {
  id?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

interface NotificationState extends Required<Omit<NotificationOptions, 'id'>> {
  id: string;
  timestamp: number;
  isVisible: boolean;
  isRemoving: boolean;
}

// Global notification manager
class NotificationManager {
  private notifications = new Map<string, NotificationState>();
  private observers = new Set<(notifications: NotificationState[]) => void>();
  private nextId = 1;

  addNotification(options: NotificationOptions): string {
    const id = options.id || `notification_${this.nextId++}`;
    
    const notification: NotificationState = {
      id,
      type: options.type,
      title: options.title,
      message: options.message || '',
      duration: options.duration ?? (options.type === 'error' ? 5000 : 3000),
      persistent: options.persistent ?? false,
      action: options.action,
      onClose: options.onClose || (() => {}),
      timestamp: Date.now(),
      isVisible: false,
      isRemoving: false,
    };

    this.notifications.set(id, notification);
    
    // Trigger entrance animation
    setTimeout(() => {
      const current = this.notifications.get(id);
      if (current) {
        current.isVisible = true;
        this.notifyObservers();
      }
    }, 50);

    // Auto-remove after duration (unless persistent)
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, notification.duration);
    }

    this.notifyObservers();
    return id;
  }

  removeNotification(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification) return;

    // Start exit animation
    notification.isRemoving = true;
    this.notifyObservers();

    // Remove after animation
    setTimeout(() => {
      notification.onClose();
      this.notifications.delete(id);
      this.notifyObservers();
    }, 300);
  }

  clearAll(): void {
    this.notifications.forEach((notification) => {
      this.removeNotification(notification.id);
    });
  }

  getNotifications(): NotificationState[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  subscribe(observer: (notifications: NotificationState[]) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  private notifyObservers(): void {
    const notifications = this.getNotifications();
    this.observers.forEach(observer => observer(notifications));
  }
}

const notificationManager = new NotificationManager();

// Hook for using notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const addNotification = useCallback((options: NotificationOptions): string => {
    return notificationManager.addNotification(options);
  }, []);

  const removeNotification = useCallback((id: string): void => {
    notificationManager.removeNotification(id);
  }, []);

  const clearAll = useCallback((): void => {
    notificationManager.clearAll();
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
}

// Individual notification component
interface NotificationItemProps {
  notification: NotificationState;
  onRemove: (id: string) => void;
}

function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div
      className={cn(
        'max-w-sm w-full bg-white shadow-lg rounded-lg border pointer-events-auto',
        'transform transition-all duration-300 ease-in-out',
        notification.isVisible && !notification.isRemoving
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95',
        getColorClasses()
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            {notification.message && (
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
            )}
            {notification.action && (
              <div className="mt-3">
                <button
                  onClick={notification.action.onClick}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {notification.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onRemove(notification.id)}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main notification container
export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

// Utility functions for common notification patterns
export const notificationUtils = {
  success: (title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return notificationManager.addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  },

  error: (title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return notificationManager.addNotification({
      type: 'error',
      title,
      message,
      duration: 5000,
      ...options,
    });
  },

  info: (title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return notificationManager.addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  },

  warning: (title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return notificationManager.addNotification({
      type: 'warning',
      title,
      message,
      duration: 4000,
      ...options,
    });
  },

  // Notification with action button
  withAction: (
    type: NotificationOptions['type'],
    title: string,
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    options?: Partial<NotificationOptions>
  ) => {
    return notificationManager.addNotification({
      type,
      title,
      message,
      action: {
        label: actionLabel,
        onClick: actionCallback,
      },
      ...options,
    });
  },

  // Persistent notification that doesn't auto-dismiss
  persistent: (
    type: NotificationOptions['type'],
    title: string,
    message?: string,
    options?: Partial<NotificationOptions>
  ) => {
    return notificationManager.addNotification({
      type,
      title,
      message,
      persistent: true,
      ...options,
    });
  },

  // Clear all notifications
  clearAll: () => {
    notificationManager.clearAll();
  },
};

// Export the manager for direct access
export { notificationManager };