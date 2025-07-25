'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { generateCSSCustomProperties, generateThemeCSS } from '@/lib/design-tokens';

export type ThemeMode = 'light' | 'dark' | 'high-contrast';
export type FontSizePreference = 'small' | 'medium' | 'large' | 'extra-large';

export interface ThemePreferences {
  mode: ThemeMode;
  fontSize: FontSizePreference;
  reducedMotion: boolean;
  highContrast: boolean;
  systemPreferences: {
    respectSystemTheme: boolean;
    respectSystemMotion: boolean;
    respectSystemContrast: boolean;
  };
}

export interface ThemeContextType {
  // Current theme state
  preferences: ThemePreferences;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  currentFontSize: FontSizePreference;
  
  // Theme controls
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: FontSizePreference) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  
  // System preference controls
  setRespectSystemTheme: (respect: boolean) => void;
  setRespectSystemMotion: (respect: boolean) => void;
  setRespectSystemContrast: (respect: boolean) => void;
  
  // Utility functions
  applyTheme: () => void;
  resetToDefaults: () => void;
  getThemeCSS: () => string;
}

const DEFAULT_PREFERENCES: ThemePreferences = {
  mode: 'light',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
  systemPreferences: {
    respectSystemTheme: true,
    respectSystemMotion: true,
    respectSystemContrast: true,
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preferences, setPreferences] = useState<ThemePreferences>(DEFAULT_PREFERENCES);
  const [systemPreferences, setSystemPreferences] = useState({
    prefersDark: false,
    prefersReducedMotion: false,
    prefersHighContrast: false,
  });

  // Detect system preferences
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    const updateSystemPreferences = () => {
      setSystemPreferences({
        prefersDark: darkModeQuery.matches,
        prefersReducedMotion: reducedMotionQuery.matches,
        prefersHighContrast: highContrastQuery.matches,
      });
    };

    // Initial detection
    updateSystemPreferences();

    // Listen for changes
    darkModeQuery.addEventListener('change', updateSystemPreferences);
    reducedMotionQuery.addEventListener('change', updateSystemPreferences);
    highContrastQuery.addEventListener('change', updateSystemPreferences);

    return () => {
      darkModeQuery.removeEventListener('change', updateSystemPreferences);
      reducedMotionQuery.removeEventListener('change', updateSystemPreferences);
      highContrastQuery.removeEventListener('change', updateSystemPreferences);
    };
  }, []);

  // Load saved preferences
  useEffect(() => {
    const savedPreferences = localStorage.getItem('theme-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch (error) {
        console.warn('Failed to parse saved theme preferences:', error);
      }
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('theme-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Apply system preferences when they change
  useEffect(() => {
    setPreferences(prev => {
      const newPreferences = { ...prev };
      
      // Apply system theme preference
      if (prev.systemPreferences.respectSystemTheme) {
        newPreferences.mode = systemPreferences.prefersDark ? 'dark' : 'light';
      }
      
      // Apply system motion preference
      if (prev.systemPreferences.respectSystemMotion) {
        newPreferences.reducedMotion = systemPreferences.prefersReducedMotion;
      }
      
      // Apply system contrast preference
      if (prev.systemPreferences.respectSystemContrast) {
        newPreferences.highContrast = systemPreferences.prefersHighContrast;
        if (systemPreferences.prefersHighContrast) {
          newPreferences.mode = 'high-contrast';
        }
      }
      
      return newPreferences;
    });
  }, [systemPreferences]);

  // Apply theme to document
  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    
    // Generate CSS custom properties
    const customProperties = generateCSSCustomProperties({
      highContrast: preferences.highContrast || preferences.mode === 'high-contrast',
      reducedMotion: preferences.reducedMotion,
      fontSize: preferences.fontSize,
    });

    // Apply custom properties to root element
    Object.entries(customProperties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply theme class to body
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .replace(/font-size-\w+/g, '')
      .trim();
    
    document.body.classList.add(`theme-${preferences.mode}`);
    document.body.classList.add(`font-size-${preferences.fontSize}`);
    
    if (preferences.highContrast || preferences.mode === 'high-contrast') {
      document.body.classList.add('high-contrast');
    }
    
    if (preferences.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }

    // Update meta theme-color for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      const backgroundColor = preferences.highContrast || preferences.mode === 'high-contrast' 
        ? '#FFFFFF' 
        : preferences.mode === 'dark' 
          ? '#111827' 
          : '#FDFFFC';
      themeColorMeta.setAttribute('content', backgroundColor);
    }
  }, [preferences]);

  // Apply theme when preferences change
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Theme control functions
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setPreferences(prev => ({
      ...prev,
      mode,
      highContrast: mode === 'high-contrast',
      systemPreferences: {
        ...prev.systemPreferences,
        respectSystemTheme: false, // Disable system theme when manually set
        respectSystemContrast: mode !== 'high-contrast', // Keep contrast respect unless manually set to high-contrast
      },
    }));
  }, []);

  const setFontSize = useCallback((fontSize: FontSizePreference) => {
    setPreferences(prev => ({ ...prev, fontSize }));
  }, []);

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setPreferences(prev => ({
      ...prev,
      reducedMotion,
      systemPreferences: {
        ...prev.systemPreferences,
        respectSystemMotion: false, // Disable system motion when manually set
      },
    }));
  }, []);

  const setHighContrast = useCallback((highContrast: boolean) => {
    setPreferences(prev => ({
      ...prev,
      highContrast,
      mode: highContrast ? 'high-contrast' : prev.mode === 'high-contrast' ? 'light' : prev.mode,
      systemPreferences: {
        ...prev.systemPreferences,
        respectSystemContrast: false, // Disable system contrast when manually set
      },
    }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast(!preferences.highContrast);
  }, [preferences.highContrast, setHighContrast]);

  // System preference control functions
  const setRespectSystemTheme = useCallback((respect: boolean) => {
    setPreferences(prev => ({
      ...prev,
      systemPreferences: { ...prev.systemPreferences, respectSystemTheme: respect },
    }));
  }, []);

  const setRespectSystemMotion = useCallback((respect: boolean) => {
    setPreferences(prev => ({
      ...prev,
      systemPreferences: { ...prev.systemPreferences, respectSystemMotion: respect },
    }));
  }, []);

  const setRespectSystemContrast = useCallback((respect: boolean) => {
    setPreferences(prev => ({
      ...prev,
      systemPreferences: { ...prev.systemPreferences, respectSystemContrast: respect },
    }));
  }, []);

  // Utility functions
  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const getThemeCSS = useCallback(() => {
    return generateThemeCSS({
      highContrast: preferences.highContrast || preferences.mode === 'high-contrast',
      reducedMotion: preferences.reducedMotion,
      fontSize: preferences.fontSize,
    });
  }, [preferences]);

  // Computed values
  const isHighContrast = preferences.highContrast || preferences.mode === 'high-contrast';
  const isReducedMotion = preferences.reducedMotion;
  const currentFontSize = preferences.fontSize;

  const contextValue: ThemeContextType = {
    preferences,
    isHighContrast,
    isReducedMotion,
    currentFontSize,
    setThemeMode,
    setFontSize,
    setReducedMotion,
    setHighContrast,
    toggleHighContrast,
    setRespectSystemTheme,
    setRespectSystemMotion,
    setRespectSystemContrast,
    applyTheme,
    resetToDefaults,
    getThemeCSS,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility hooks for specific theme aspects
export function useHighContrast() {
  const { isHighContrast, setHighContrast, toggleHighContrast } = useTheme();
  return { isHighContrast, setHighContrast, toggleHighContrast };
}

export function useReducedMotion() {
  const { isReducedMotion, setReducedMotion } = useTheme();
  return { isReducedMotion, setReducedMotion };
}

export function useFontSize() {
  const { currentFontSize, setFontSize } = useTheme();
  return { currentFontSize, setFontSize };
}

// Component for injecting theme CSS
export function ThemeCSS() {
  const { getThemeCSS } = useTheme();
  
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: getThemeCSS(),
      }}
    />
  );
}

// Component for theme-aware styling
interface ThemeAwareProps {
  children: (theme: {
    isHighContrast: boolean;
    isReducedMotion: boolean;
    currentFontSize: FontSizePreference;
    mode: ThemeMode;
  }) => React.ReactNode;
}

export function ThemeAware({ children }: ThemeAwareProps) {
  const { isHighContrast, isReducedMotion, currentFontSize, preferences } = useTheme();
  
  return (
    <>
      {children({
        isHighContrast,
        isReducedMotion,
        currentFontSize,
        mode: preferences.mode,
      })}
    </>
  );
}