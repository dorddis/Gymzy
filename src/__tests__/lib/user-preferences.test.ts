import { renderHook, act } from '@testing-library/react';
import {
  UserPreferencesManager,
  useUserPreferences,
  useDesktopPreferences,
  DEFAULT_PREFERENCES,
  isDesktopModeEnabled,
  getChatPanelPosition,
  getDefaultSplitRatio,
} from '@/lib/user-preferences';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock React
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useCallback: jest.fn((fn) => fn),
}));

const mockUseState = require('react').useState as jest.MockedFunction<typeof React.useState>;
const mockUseEffect = require('react').useEffect as jest.MockedFunction<typeof React.useEffect>;

describe('UserPreferencesManager', () => {
  let manager: UserPreferencesManager;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset singleton instance
    (UserPreferencesManager as any).instance = undefined;
    manager = UserPreferencesManager.getInstance();
  });

  afterEach(() => {
    manager.clearAllPreferences();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = UserPreferencesManager.getInstance();
      const instance2 = UserPreferencesManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getPreferences', () => {
    it('should return default preferences when no stored preferences', () => {
      const prefs = manager.getPreferences();
      
      expect(prefs.desktop.enabled).toBe(DEFAULT_PREFERENCES.desktop.enabled);
      expect(prefs.desktop.chatPanelPosition).toBe(DEFAULT_PREFERENCES.desktop.chatPanelPosition);
      expect(prefs.desktop.defaultSplitRatio).toBe(DEFAULT_PREFERENCES.desktop.defaultSplitRatio);
    });

    it('should load preferences from localStorage', () => {
      const storedPrefs = {
        ...DEFAULT_PREFERENCES,
        desktop: {
          ...DEFAULT_PREFERENCES.desktop,
          enabled: false,
          chatPanelPosition: 'left' as const,
        },
        lastUpdated: new Date().toISOString(),
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPrefs));
      
      // Create new instance to trigger loading
      (UserPreferencesManager as any).instance = undefined;
      const newManager = UserPreferencesManager.getInstance();
      const prefs = newManager.getPreferences();
      
      expect(prefs.desktop.enabled).toBe(false);
      expect(prefs.desktop.chatPanelPosition).toBe('left');
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences and save to localStorage', () => {
      const updates = {
        desktop: {
          ...DEFAULT_PREFERENCES.desktop,
          enabled: false,
          chatPanelPosition: 'left' as const,
        },
      };

      manager.updatePreferences(updates);

      const prefs = manager.getPreferences();
      expect(prefs.desktop.enabled).toBe(false);
      expect(prefs.desktop.chatPanelPosition).toBe('left');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should throw error for invalid preferences', () => {
      const invalidUpdates = {
        desktop: {
          ...DEFAULT_PREFERENCES.desktop,
          defaultSplitRatio: 1.5, // Invalid ratio > 1
        },
      };

      expect(() => {
        manager.updatePreferences(invalidUpdates);
      }).toThrow('Invalid preference values');
    });

    it('should notify listeners of changes', () => {
      const listener = jest.fn();
      manager.subscribe(listener);

      manager.updateDesktopPreferences({ enabled: false });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          desktop: expect.objectContaining({ enabled: false }),
        })
      );
    });
  });

  describe('updateDesktopPreferences', () => {
    it('should update only desktop preferences', () => {
      manager.updateDesktopPreferences({
        chatPanelPosition: 'left',
        compactMode: true,
      });

      const prefs = manager.getPreferences();
      expect(prefs.desktop.chatPanelPosition).toBe('left');
      expect(prefs.desktop.compactMode).toBe(true);
      expect(prefs.desktop.enabled).toBe(DEFAULT_PREFERENCES.desktop.enabled); // Unchanged
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all preferences to defaults', () => {
      // First modify preferences
      manager.updateDesktopPreferences({ enabled: false, compactMode: true });
      
      // Then reset
      manager.resetToDefaults();
      
      const prefs = manager.getPreferences();
      expect(prefs.desktop.enabled).toBe(DEFAULT_PREFERENCES.desktop.enabled);
      expect(prefs.desktop.compactMode).toBe(DEFAULT_PREFERENCES.desktop.compactMode);
    });
  });

  describe('exportPreferences', () => {
    it('should export preferences as JSON string', () => {
      manager.updateDesktopPreferences({ enabled: false });
      
      const exported = manager.exportPreferences();
      const parsed = JSON.parse(exported);
      
      expect(parsed.desktop.enabled).toBe(false);
      expect(typeof parsed.lastUpdated).toBe('string');
    });
  });

  describe('importPreferences', () => {
    it('should import valid preferences', () => {
      const importData = {
        ...DEFAULT_PREFERENCES,
        desktop: {
          ...DEFAULT_PREFERENCES.desktop,
          enabled: false,
          chatPanelPosition: 'left' as const,
        },
        lastUpdated: new Date().toISOString(),
      };

      manager.importPreferences(JSON.stringify(importData));

      const prefs = manager.getPreferences();
      expect(prefs.desktop.enabled).toBe(false);
      expect(prefs.desktop.chatPanelPosition).toBe('left');
    });

    it('should throw error for invalid import data', () => {
      const invalidData = '{"invalid": "data"}';

      expect(() => {
        manager.importPreferences(invalidData);
      }).toThrow('Failed to import preferences');
    });
  });

  describe('subscribe', () => {
    it('should subscribe and unsubscribe listeners', () => {
      const listener = jest.fn();
      const unsubscribe = manager.subscribe(listener);

      manager.updateDesktopPreferences({ enabled: false });
      expect(listener).toHaveBeenCalled();

      listener.mockClear();
      unsubscribe();

      manager.updateDesktopPreferences({ enabled: true });
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      manager.subscribe(errorListener);
      manager.updateDesktopPreferences({ enabled: false });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in preference listener:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('backup and restore', () => {
    it('should create backup when saving preferences', () => {
      const existingPrefs = JSON.stringify(DEFAULT_PREFERENCES);
      localStorageMock.getItem.mockReturnValue(existingPrefs);

      manager.updateDesktopPreferences({ enabled: false });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gymzy_user_preferences_backup',
        existingPrefs
      );
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (UserPreferencesManager as any).instance = undefined;
  });

  describe('isDesktopModeEnabled', () => {
    it('should return desktop mode status', () => {
      expect(isDesktopModeEnabled()).toBe(DEFAULT_PREFERENCES.desktop.enabled);
    });
  });

  describe('getChatPanelPosition', () => {
    it('should return chat panel position', () => {
      expect(getChatPanelPosition()).toBe(DEFAULT_PREFERENCES.desktop.chatPanelPosition);
    });
  });

  describe('getDefaultSplitRatio', () => {
    it('should return default split ratio', () => {
      expect(getDefaultSplitRatio()).toBe(DEFAULT_PREFERENCES.desktop.defaultSplitRatio);
    });
  });
});

describe('React Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useState to return state and setter
    mockUseState.mockImplementation((initial) => {
      const state = typeof initial === 'function' ? initial() : initial;
      const setState = jest.fn();
      return [state, setState];
    });

    // Mock useEffect to call the effect immediately
    mockUseEffect.mockImplementation((effect) => {
      const cleanup = effect();
      return cleanup;
    });
  });

  describe('useUserPreferences', () => {
    it('should return preferences and update functions', () => {
      const { result } = renderHook(() => useUserPreferences());

      expect(result.current.preferences).toBeDefined();
      expect(result.current.desktopPreferences).toBeDefined();
      expect(typeof result.current.updatePreferences).toBe('function');
      expect(typeof result.current.updateDesktopPreferences).toBe('function');
      expect(typeof result.current.resetToDefaults).toBe('function');
      expect(typeof result.current.exportPreferences).toBe('function');
      expect(typeof result.current.importPreferences).toBe('function');
    });
  });

  describe('useDesktopPreferences', () => {
    it('should return desktop preferences and update function', () => {
      const { result } = renderHook(() => useDesktopPreferences());

      expect(result.current.desktopPreferences).toBeDefined();
      expect(typeof result.current.updateDesktopPreferences).toBe('function');
    });
  });
});