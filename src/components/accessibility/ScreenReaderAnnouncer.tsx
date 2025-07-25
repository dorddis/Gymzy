'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export interface AnnouncementMessage {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
  category?: 'navigation' | 'form' | 'status' | 'error' | 'success' | 'general';
}

interface ScreenReaderAnnouncerProps {
  className?: string;
}

export function ScreenReaderAnnouncer({ className = '' }: ScreenReaderAnnouncerProps) {
  const { preferences } = useAccessibility();
  const [currentAnnouncement, setCurrentAnnouncement] = useState<AnnouncementMessage | null>(null);
  const [queue, setQueue] = useState<AnnouncementMessage[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const processingRef = useRef(false);

  // Process announcement queue
  const processQueue = useCallback(() => {
    if (processingRef.current || queue.length === 0) return;

    processingRef.current = true;
    const nextAnnouncement = queue[0];
    
    setCurrentAnnouncement(nextAnnouncement);
    setQueue(prev => prev.slice(1));

    // Clear announcement after it's been read
    timeoutRef.current = setTimeout(() => {
      setCurrentAnnouncement(null);
      processingRef.current = false;
      
      // Process next announcement if any
      if (queue.length > 1) {
        setTimeout(processQueue, 100);
      }
    }, Math.max(1000, nextAnnouncement.message.length * 50)); // Adjust timing based on message length
  }, [queue]);

  // Process queue when it changes
  useEffect(() => {
    if (!processingRef.current && queue.length > 0) {
      processQueue();
    }
  }, [queue, processQueue]);

  // Global announcement listener
  useEffect(() => {
    const handleAnnouncement = (event: CustomEvent<AnnouncementMessage>) => {
      if (!preferences.announcements.enabled) return;

      const announcement = event.detail;
      
      // Filter based on verbosity setting
      if (preferences.announcements.verbosity === 'minimal' && 
          announcement.category === 'general') {
        return;
      }

      // Add to queue, but prioritize assertive messages
      setQueue(prev => {
        const newQueue = [...prev, announcement];
        
        // Sort by priority (assertive first) and timestamp
        return newQueue.sort((a, b) => {
          if (a.priority === 'assertive' && b.priority === 'polite') return -1;
          if (a.priority === 'polite' && b.priority === 'assertive') return 1;
          return a.timestamp - b.timestamp;
        });
      });
    };

    window.addEventListener('accessibility-announce', handleAnnouncement as EventListener);
    
    return () => {
      window.removeEventListener('accessibility-announce', handleAnnouncement as EventListener);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [preferences.announcements]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!currentAnnouncement) return null;

  return (
    <div
      aria-live={currentAnnouncement.priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
      role="status"
    >
      {currentAnnouncement.message}
    </div>
  );
}

// Hook for making announcements
export function useScreenReaderAnnouncement() {
  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite',
    category?: AnnouncementMessage['category']
  ) => {
    const announcement: AnnouncementMessage = {
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      priority,
      timestamp: Date.now(),
      category,
    };

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('accessibility-announce', { detail: announcement }));
  }, []);

  return { announce };
}

// Specialized announcement hooks
export function useFormAnnouncements() {
  const { announce } = useScreenReaderAnnouncement();

  return {
    announceFieldError: (fieldName: string, error: string) => {
      announce(`${fieldName} has an error: ${error}`, 'assertive', 'error');
    },
    
    announceFieldSuccess: (fieldName: string, message?: string) => {
      const successMessage = message || `${fieldName} is valid`;
      announce(successMessage, 'polite', 'success');
    },
    
    announceFormSubmission: (isSuccess: boolean, message?: string) => {
      if (isSuccess) {
        announce(message || 'Form submitted successfully', 'polite', 'success');
      } else {
        announce(message || 'Form submission failed', 'assertive', 'error');
      }
    },
    
    announceRequiredField: (fieldName: string) => {
      announce(`${fieldName} is required`, 'assertive', 'form');
    },
  };
}

export function useNavigationAnnouncements() {
  const { announce } = useScreenReaderAnnouncement();

  return {
    announcePageChange: (pageName: string) => {
      announce(`Navigated to ${pageName}`, 'polite', 'navigation');
    },
    
    announceRouteChange: (routeName: string) => {
      announce(`Loading ${routeName}`, 'polite', 'navigation');
    },
    
    announceFocusChange: (elementName: string) => {
      announce(`Focused on ${elementName}`, 'polite', 'navigation');
    },
    
    announceModalOpen: (modalTitle: string) => {
      announce(`${modalTitle} dialog opened`, 'polite', 'navigation');
    },
    
    announceModalClose: (modalTitle?: string) => {
      const message = modalTitle ? `${modalTitle} dialog closed` : 'Dialog closed';
      announce(message, 'polite', 'navigation');
    },
  };
}

export function useStatusAnnouncements() {
  const { announce } = useScreenReaderAnnouncement();

  return {
    announceLoading: (action: string) => {
      announce(`Loading ${action}`, 'polite', 'status');
    },
    
    announceLoadingComplete: (action: string) => {
      announce(`${action} loaded`, 'polite', 'status');
    },
    
    announceProgress: (current: number, total: number, action?: string) => {
      const actionText = action ? ` ${action}` : '';
      announce(`Progress${actionText}: ${current} of ${total}`, 'polite', 'status');
    },
    
    announceDataUpdate: (dataType: string, count?: number) => {
      const countText = count !== undefined ? ` ${count} items` : '';
      announce(`${dataType} updated${countText}`, 'polite', 'status');
    },
    
    announceError: (error: string, context?: string) => {
      const contextText = context ? ` in ${context}` : '';
      announce(`Error${contextText}: ${error}`, 'assertive', 'error');
    },
    
    announceSuccess: (message: string, context?: string) => {
      const contextText = context ? ` in ${context}` : '';
      announce(`Success${contextText}: ${message}`, 'polite', 'success');
    },
  };
}

// Component for dynamic content announcements
interface DynamicAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  category?: AnnouncementMessage['category'];
  trigger?: any; // When this changes, the announcement is made
  delay?: number; // Delay before announcement (ms)
}

export function DynamicAnnouncement({ 
  message, 
  priority = 'polite', 
  category,
  trigger,
  delay = 0 
}: DynamicAnnouncementProps) {
  const { announce } = useScreenReaderAnnouncement();
  const previousTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger !== previousTrigger.current && message) {
      const timeoutId = setTimeout(() => {
        announce(message, priority, category);
      }, delay);

      previousTrigger.current = trigger;

      return () => clearTimeout(timeoutId);
    }
  }, [trigger, message, priority, category, delay, announce]);

  return null; // This component doesn't render anything visible
}

// Live region component for specific content areas
interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

export function LiveRegion({ 
  children, 
  priority = 'polite', 
  atomic = true,
  relevant = 'all',
  className = '' 
}: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={className}
    >
      {children}
    </div>
  );
}