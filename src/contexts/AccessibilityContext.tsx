'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

// Types for accessibility preferences
export type FontSizePreference = 'small' | 'medium' | 'large' | 'extra-large';
export type AnnouncementPriority = 'polite' | 'assertive';

export interface AccessibilityPreferences {
  fontSize: FontSizePreference;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimizations: boolean;
  keyboardNavigationMode: boolean;
  announcements: {
    enabled: boolean;
    verbosity: 'minimal' | 'standard' | 'verbose';
  };
}

export interface AccessibilityContextType {
  // User Preferences
  preferences: AccessibilityPreferences;
  updatePreferences: (updates: Partial<AccessibilityPreferences>) => void;
  
  // Announcement System
  announce: (message: string, priority?: AnnouncementPriority) => void;
  
  // Focus Management
  focusElement: (selector: string) => void;
  trapFocus: (container: HTMLElement) => () => void;
  
  // Keyboard Navigation
  registerShortcut: (key: string, handler: () => void, description?: string) => void;
  unregisterShortcut: (key: string) => void;
  
  // Utility functions
  isReducedMotion: boolean;
  isHighContrast: boolean;
  currentFontSize: FontSizePreference;
}

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
  screenReaderOptimizations: false,
  keyboardNavigationMode: false,
  announcements: {
    enabled: true,
    verbosity: 'standard',
  },
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  // Refs for managing announcements and shortcuts
  const announcementQueue = useRef<Array<{ message: string; priority: AnnouncementPriority }>>([]);
  const shortcuts = useRef<Map<string, { handler: () => void; description?: string }>>(new Map());
  const announcementTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize preferences from localStorage and system preferences
  useEffect(() => {
    // Load saved preferences
    const savedPreferences = localStorage.getItem('accessibility-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch (error) {
        console.warn('Failed to parse saved accessibility preferences:', error);
      }
    }

    // Detect system preferences
    const mediaQueryReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mediaQueryHighContrast = window.matchMedia('(prefers-contrast: high)');
    
    setIsReducedMotion(mediaQueryReducedMotion.matches);
    setIsHighContrast(mediaQueryHighContrast.matches);

    // Listen for system preference changes
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
      if (e.matches) {
        setPreferences(prev => ({ ...prev, reducedMotion: true }));
      }
    };

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
      if (e.matches) {
        setPreferences(prev => ({ ...prev, highContrast: true }));
      }
    };

    mediaQueryReducedMotion.addEventListener('change', handleReducedMotionChange);
    mediaQueryHighContrast.addEventListener('change', handleHighContrastChange);

    return () => {
      mediaQueryReducedMotion.removeEventListener('change', handleReducedMotionChange);
      mediaQueryHighContrast.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Update preferences function
  const updatePreferences = useCallback((updates: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  // Announcement system
  const announce = useCallback((message: string, priority: AnnouncementPriority = 'polite') => {
    if (!preferences.announcements.enabled) return;

    // Add to queue
    announcementQueue.current.push({ message, priority });

    // Clear existing timeout
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }

    // Process queue after a short delay to batch announcements
    announcementTimeoutRef.current = setTimeout(() => {
      const announcements = announcementQueue.current.splice(0);
      if (announcements.length === 0) return;

      // Create or update live region
      let liveRegion = document.getElementById('accessibility-announcements');
      if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'accessibility-announcements';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
      }

      // Determine priority (use highest priority from queue)
      const hasAssertive = announcements.some(a => a.priority === 'assertive');
      liveRegion.setAttribute('aria-live', hasAssertive ? 'assertive' : 'polite');

      // Combine messages based on verbosity setting
      let combinedMessage = '';
      if (preferences.announcements.verbosity === 'minimal') {
        combinedMessage = announcements[announcements.length - 1].message;
      } else {
        combinedMessage = announcements.map(a => a.message).join('. ');
      }

      liveRegion.textContent = combinedMessage;

      // Clear after announcement
      setTimeout(() => {
        if (liveRegion) {
          liveRegion.textContent = '';
        }
      }, 1000);
    }, 100);
  }, [preferences.announcements]);

  // Focus management
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      // Announce focus change for screen readers
      if (preferences.screenReaderOptimizations) {
        const elementText = element.textContent || element.getAttribute('aria-label') || 'Element';
        announce(`Focused on ${elementText}`, 'polite');
      }
    }
  }, [announce, preferences.screenReaderOptimizations]);

  // Focus trap utility
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Keyboard shortcut management
  const registerShortcut = useCallback((key: string, handler: () => void, description?: string) => {
    shortcuts.current.set(key, { handler, description });
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    shortcuts.current.delete(key);
  }, []);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Create key combination string
      const modifiers = [];
      if (e.ctrlKey) modifiers.push('ctrl');
      if (e.altKey) modifiers.push('alt');
      if (e.shiftKey) modifiers.push('shift');
      if (e.metaKey) modifiers.push('meta');
      
      const keyCombo = [...modifiers, e.key.toLowerCase()].join('+');
      
      const shortcut = shortcuts.current.get(keyCombo);
      if (shortcut) {
        e.preventDefault();
        shortcut.handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const contextValue: AccessibilityContextType = {
    preferences,
    updatePreferences,
    announce,
    focusElement,
    trapFocus,
    registerShortcut,
    unregisterShortcut,
    isReducedMotion: isReducedMotion || preferences.reducedMotion,
    isHighContrast: isHighContrast || preferences.highContrast,
    currentFontSize: preferences.fontSize,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// Custom hook to use accessibility context
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Utility hook for screen reader announcements
export function useAnnounce() {
  const { announce } = useAccessibility();
  return announce;
}

// Utility hook for focus management
export function useFocusManagement() {
  const { focusElement, trapFocus } = useAccessibility();
  return { focusElement, trapFocus };
}

// Utility hook for keyboard shortcuts
export function useKeyboardShortcuts() {
  const { registerShortcut, unregisterShortcut } = useAccessibility();
  return { registerShortcut, unregisterShortcut };
}