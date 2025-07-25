"use client";

import { LAYOUT } from './design-tokens';

// User preference types
export interface DesktopLayoutPreferences {
  enabled: boolean;
  chatPanelPosition: 'left' | 'right';
  defaultSplitRatio: number;
  autoHideChat: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
}

export interface UserPreferences {
  desktop: DesktopLayoutPreferences;
  general: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
  workout: {
    defaultRestTime: number;
    autoStartTimer: boolean;
    soundEnabled: boolean;
  };
  version: string;
  lastUpdated: Date;
}

// Default preferences
export const DEFAULT_PREFERENCES: UserPreferences = {
  desktop: {
    enabled: true,
    chatPanelPosition: 'right',
    defaultSplitRatio: LAYOUT['split-screen']['default-app-ratio'],
    autoHideChat: false,
    compactMode: false,
    animationsEnabled: true,
    keyboardShortcutsEnabled: true,
    theme: 'system',
    fontSize: 'medium',
    reducedMotion: false,
  },
  general: {
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: true,
  },
  workout: {
    defaultRestTime: 60,
    autoStartTimer: true,
    soundEnabled: true,
  },
  version: '1.0.0',
  lastUpdated: new Date(),
};

// Storage keys
const STORAGE_KEY = 'gymzy_user_preferences';
const BACKUP_STORAGE_KEY = 'gymzy_user_preferences_backup';

// Preference validation
function validatePreferences(prefs: any): prefs is UserPreferences {
  if (!prefs || typeof prefs !== 'object') return false;
  
  // Check required structure
  if (!prefs.desktop || !prefs.general || !prefs.workout) return false;
  
  // Validate desktop preferences
  const desktop = prefs.desktop;
  if (
    typeof desktop.enabled !== 'boolean' ||
    !['left', 'right'].includes(desktop.chatPanelPosition) ||
    typeof desktop.defaultSplitRatio !== 'number' ||
    desktop.defaultSplitRatio < 0.2 ||
    desktop.defaultSplitRatio > 0.8
  ) {
    return false;
  }
  
  return true;
}

// Preference serialization
function serializePreferences(prefs: UserPreferences): string {
  const serializable = {
    ...prefs,
    lastUpdated: prefs.lastUpdated.toISOString(),
  };
  return JSON.stringify(serializable);
}

function deserializePreferences(data: string): UserPreferences {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    lastUpdated: new Date(parsed.lastUpdated),
  };
}

// Storage operations
export class UserPreferencesManager {
  private static instance: UserPreferencesManager;
  private preferences: UserPreferences;
  private listeners: Set<(prefs: UserPreferences) => void> = new Set();

  private constructor() {
    this.preferences = this.loadPreferences();
  }

  static getInstance(): UserPreferencesManager {
    if (!UserPreferencesManager.instance) {
      UserPreferencesManager.instance = new UserPreferencesManager();
    }
    return UserPreferencesManager.instance;
  }

  // Load preferences from localStorage
  private loadPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = deserializePreferences(stored);
        if (validatePreferences(parsed)) {
          // Merge with defaults to handle new preference additions
          return this.mergeWithDefaults(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
      this.tryRestoreFromBackup();
    }
    
    return { ...DEFAULT_PREFERENCES };
  }

  // Merge loaded preferences with defaults
  private mergeWithDefaults(loaded: UserPreferences): UserPreferences {
    return {
      desktop: { ...DEFAULT_PREFERENCES.desktop, ...loaded.desktop },
      general: { ...DEFAULT_PREFERENCES.general, ...loaded.general },
      workout: { ...DEFAULT_PREFERENCES.workout, ...loaded.workout },
      version: DEFAULT_PREFERENCES.version,
      lastUpdated: new Date(),
    };
  }

  // Try to restore from backup
  private tryRestoreFromBackup(): void {
    try {
      const backup = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (backup) {
        const parsed = deserializePreferences(backup);
        if (validatePreferences(parsed)) {
          this.preferences = this.mergeWithDefaults(parsed);
          this.savePreferences(); // Restore to main storage
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to restore from backup:', error);
    }
  }

  // Save preferences to localStorage
  private savePreferences(): void {
    try {
      // Create backup of current preferences
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) {
        localStorage.setItem(BACKUP_STORAGE_KEY, current);
      }

      // Save new preferences
      const serialized = serializePreferences(this.preferences);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw new Error('Unable to save preferences. Storage may be full.');
    }
  }

  // Get current preferences
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  // Get specific preference section
  getDesktopPreferences(): DesktopLayoutPreferences {
    return { ...this.preferences.desktop };
  }

  // Update preferences
  updatePreferences(updates: Partial<UserPreferences>): void {
    const newPreferences = {
      ...this.preferences,
      ...updates,
      lastUpdated: new Date(),
    };

    if (!validatePreferences(newPreferences)) {
      throw new Error('Invalid preference values');
    }

    this.preferences = newPreferences;
    this.savePreferences();
    this.notifyListeners();
  }

  // Update desktop preferences specifically
  updateDesktopPreferences(updates: Partial<DesktopLayoutPreferences>): void {
    this.updatePreferences({
      desktop: { ...this.preferences.desktop, ...updates },
    });
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
    this.notifyListeners();
  }

  // Reset specific section
  resetDesktopPreferences(): void {
    this.updatePreferences({
      desktop: { ...DEFAULT_PREFERENCES.desktop },
    });
  }

  // Export preferences
  exportPreferences(): string {
    return serializePreferences(this.preferences);
  }

  // Import preferences
  importPreferences(data: string): void {
    try {
      const imported = deserializePreferences(data);
      if (!validatePreferences(imported)) {
        throw new Error('Invalid preference data');
      }
      
      this.preferences = this.mergeWithDefaults(imported);
      this.savePreferences();
      this.notifyListeners();
    } catch (error) {
      throw new Error('Failed to import preferences: ' + (error as Error).message);
    }
  }

  // Subscribe to preference changes
  subscribe(listener: (prefs: UserPreferences) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners of changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getPreferences());
      } catch (error) {
        console.error('Error in preference listener:', error);
      }
    });
  }

  // Get preference migration info
  getMigrationInfo(): { needsMigration: boolean; fromVersion: string; toVersion: string } {
    const currentVersion = this.preferences.version;
    const latestVersion = DEFAULT_PREFERENCES.version;
    
    return {
      needsMigration: currentVersion !== latestVersion,
      fromVersion: currentVersion,
      toVersion: latestVersion,
    };
  }

  // Clear all preferences (for testing or reset)
  clearAllPreferences(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_STORAGE_KEY);
      this.preferences = { ...DEFAULT_PREFERENCES };
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to clear preferences:', error);
    }
  }
}

// React hook for using preferences
export function useUserPreferences() {
  const [preferences, setPreferences] = React.useState<UserPreferences>(() => 
    UserPreferencesManager.getInstance().getPreferences()
  );

  React.useEffect(() => {
    const manager = UserPreferencesManager.getInstance();
    const unsubscribe = manager.subscribe(setPreferences);
    return unsubscribe;
  }, []);

  const updatePreferences = React.useCallback((updates: Partial<UserPreferences>) => {
    UserPreferencesManager.getInstance().updatePreferences(updates);
  }, []);

  const updateDesktopPreferences = React.useCallback((updates: Partial<DesktopLayoutPreferences>) => {
    UserPreferencesManager.getInstance().updateDesktopPreferences(updates);
  }, []);

  const resetToDefaults = React.useCallback(() => {
    UserPreferencesManager.getInstance().resetToDefaults();
  }, []);

  const exportPreferences = React.useCallback(() => {
    return UserPreferencesManager.getInstance().exportPreferences();
  }, []);

  const importPreferences = React.useCallback((data: string) => {
    UserPreferencesManager.getInstance().importPreferences(data);
  }, []);

  return {
    preferences,
    desktopPreferences: preferences.desktop,
    updatePreferences,
    updateDesktopPreferences,
    resetToDefaults,
    exportPreferences,
    importPreferences,
  };
}

// Hook specifically for desktop preferences
export function useDesktopPreferences() {
  const { desktopPreferences, updateDesktopPreferences } = useUserPreferences();
  return { desktopPreferences, updateDesktopPreferences };
}

// Utility functions
export function isDesktopModeEnabled(): boolean {
  return UserPreferencesManager.getInstance().getDesktopPreferences().enabled;
}

export function getChatPanelPosition(): 'left' | 'right' {
  return UserPreferencesManager.getInstance().getDesktopPreferences().chatPanelPosition;
}

export function getDefaultSplitRatio(): number {
  return UserPreferencesManager.getInstance().getDesktopPreferences().defaultSplitRatio;
}

// Import React for the hooks
import React from 'react';