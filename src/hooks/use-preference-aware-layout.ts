"use client";

import { useEffect, useMemo } from 'react';
import { useDesktopPreferences } from '@/lib/user-preferences';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppLayout } from '@/components/layout/app-layout-provider';

// Hook that combines responsive layout with user preferences
export function usePreferenceAwareLayout() {
  const { desktopPreferences } = useDesktopPreferences();
  const responsiveLayout = useResponsiveLayout();
  const appLayout = useAppLayout();

  // Determine if desktop mode should be active based on preferences and screen size
  const shouldUseDesktopMode = useMemo(() => {
    return desktopPreferences.enabled && responsiveLayout.isDesktop;
  }, [desktopPreferences.enabled, responsiveLayout.isDesktop]);

  // Apply theme preferences
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      if (desktopPreferences.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', desktopPreferences.theme === 'dark');
      }
    };

    applyTheme();

    // Listen for system theme changes if using system theme
    if (desktopPreferences.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [desktopPreferences.theme]);

  // Apply font size preferences
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing font size classes
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    
    // Add current font size class
    root.classList.add(`font-size-${desktopPreferences.fontSize}`);
  }, [desktopPreferences.fontSize]);

  // Apply reduced motion preferences
  useEffect(() => {
    const root = document.documentElement;
    
    if (desktopPreferences.reducedMotion) {
      root.style.setProperty('--animation-duration-fast', '0ms');
      root.style.setProperty('--animation-duration-normal', '0ms');
      root.style.setProperty('--animation-duration-slow', '0ms');
    } else {
      root.style.removeProperty('--animation-duration-fast');
      root.style.removeProperty('--animation-duration-normal');
      root.style.removeProperty('--animation-duration-slow');
    }
  }, [desktopPreferences.reducedMotion]);

  // Apply compact mode styles
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('compact-mode', desktopPreferences.compactMode);
  }, [desktopPreferences.compactMode]);

  // Calculate effective layout configuration
  const effectiveLayout = useMemo(() => {
    return {
      ...responsiveLayout,
      isDesktopMode: shouldUseDesktopMode,
      chatPanelPosition: desktopPreferences.chatPanelPosition,
      defaultSplitRatio: desktopPreferences.defaultSplitRatio,
      autoHideChat: desktopPreferences.autoHideChat,
      compactMode: desktopPreferences.compactMode,
      animationsEnabled: desktopPreferences.animationsEnabled && !desktopPreferences.reducedMotion,
      keyboardShortcutsEnabled: desktopPreferences.keyboardShortcutsEnabled,
    };
  }, [
    responsiveLayout,
    shouldUseDesktopMode,
    desktopPreferences.chatPanelPosition,
    desktopPreferences.defaultSplitRatio,
    desktopPreferences.autoHideChat,
    desktopPreferences.compactMode,
    desktopPreferences.animationsEnabled,
    desktopPreferences.reducedMotion,
    desktopPreferences.keyboardShortcutsEnabled,
  ]);

  return effectiveLayout;
}

// Hook for getting CSS custom properties based on preferences
export function usePreferenceStyles() {
  const { desktopPreferences } = useDesktopPreferences();

  return useMemo(() => {
    const styles: Record<string, string> = {};

    // Split ratio
    const appRatio = desktopPreferences.defaultSplitRatio;
    const chatRatio = 1 - appRatio;
    
    styles['--app-panel-width'] = `${appRatio * 100}%`;
    styles['--chat-panel-width'] = `${chatRatio * 100}%`;

    // Chat panel position
    if (desktopPreferences.chatPanelPosition === 'left') {
      styles['--chat-panel-order'] = '1';
      styles['--app-panel-order'] = '2';
    } else {
      styles['--chat-panel-order'] = '2';
      styles['--app-panel-order'] = '1';
    }

    // Font size scaling
    const fontSizeScale = {
      small: 0.9,
      medium: 1.0,
      large: 1.1,
    };
    styles['--font-size-scale'] = fontSizeScale[desktopPreferences.fontSize].toString();

    // Compact mode spacing
    if (desktopPreferences.compactMode) {
      styles['--panel-padding'] = '0.75rem';
      styles['--desktop-padding'] = '1rem';
    }

    // Animation duration based on preferences
    if (!desktopPreferences.animationsEnabled || desktopPreferences.reducedMotion) {
      styles['--layout-transition-duration'] = '0ms';
    }

    return styles;
  }, [
    desktopPreferences.defaultSplitRatio,
    desktopPreferences.chatPanelPosition,
    desktopPreferences.fontSize,
    desktopPreferences.compactMode,
    desktopPreferences.animationsEnabled,
    desktopPreferences.reducedMotion,
  ]);
}

// Hook for managing auto-hide chat functionality
export function useAutoHideChat() {
  const { desktopPreferences } = useDesktopPreferences();
  const { isDesktopLayout } = useAppLayout();

  useEffect(() => {
    if (!desktopPreferences.autoHideChat || !isDesktopLayout) {
      return;
    }

    let hideTimeout: NodeJS.Timeout;
    let isMouseOverChat = false;
    let isMouseOverApp = false;

    const handleMouseEnterChat = () => {
      isMouseOverChat = true;
      clearTimeout(hideTimeout);
    };

    const handleMouseLeaveChat = () => {
      isMouseOverChat = false;
      if (!isMouseOverApp) {
        hideTimeout = setTimeout(() => {
          // Hide chat panel logic would go here
          // This could dispatch an action to hide the chat
        }, 2000);
      }
    };

    const handleMouseEnterApp = () => {
      isMouseOverApp = true;
      if (!isMouseOverChat) {
        hideTimeout = setTimeout(() => {
          // Hide chat panel logic would go here
        }, 5000); // Longer delay when over app
      }
    };

    const handleMouseLeaveApp = () => {
      isMouseOverApp = false;
      clearTimeout(hideTimeout);
    };

    // Add event listeners to chat and app panels
    const chatPanel = document.querySelector('[data-chat-panel]');
    const appPanel = document.querySelector('[data-app-panel]');

    if (chatPanel) {
      chatPanel.addEventListener('mouseenter', handleMouseEnterChat);
      chatPanel.addEventListener('mouseleave', handleMouseLeaveChat);
    }

    if (appPanel) {
      appPanel.addEventListener('mouseenter', handleMouseEnterApp);
      appPanel.addEventListener('mouseleave', handleMouseLeaveApp);
    }

    return () => {
      clearTimeout(hideTimeout);
      if (chatPanel) {
        chatPanel.removeEventListener('mouseenter', handleMouseEnterChat);
        chatPanel.removeEventListener('mouseleave', handleMouseLeaveChat);
      }
      if (appPanel) {
        appPanel.removeEventListener('mouseenter', handleMouseEnterApp);
        appPanel.removeEventListener('mouseleave', handleMouseLeaveApp);
      }
    };
  }, [desktopPreferences.autoHideChat, isDesktopLayout]);
}

// Hook for preference-aware keyboard shortcuts
export function usePreferenceAwareKeyboardShortcuts() {
  const { desktopPreferences } = useDesktopPreferences();

  return {
    enabled: desktopPreferences.keyboardShortcutsEnabled,
    shouldRegisterShortcuts: desktopPreferences.keyboardShortcutsEnabled,
  };
}

// Hook for getting preference-aware animation settings
export function usePreferenceAwareAnimations() {
  const { desktopPreferences } = useDesktopPreferences();

  return {
    enabled: desktopPreferences.animationsEnabled && !desktopPreferences.reducedMotion,
    duration: desktopPreferences.reducedMotion ? 0 : 
              desktopPreferences.animationsEnabled ? 300 : 150,
    easing: 'ease-out',
  };
}