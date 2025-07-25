import { useState, useEffect, useCallback } from 'react';

// Breakpoint definitions matching the design spec
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveLayoutState {
  breakpoint: Breakpoint;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  shouldUseSplitScreen: boolean;
  shouldUseToggleMode: boolean;
}

/**
 * Determines the current breakpoint based on window width
 */
export function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

/**
 * Calculates optimal split-screen dimensions
 */
export function calculateSplitScreenDimensions(
  containerWidth: number,
  appPanelRatio: number = 0.65 // Default to 65% for app panel
) {
  const appPanelWidth = Math.floor(containerWidth * appPanelRatio);
  const chatPanelWidth = containerWidth - appPanelWidth;
  
  return {
    appPanelWidth,
    chatPanelWidth,
    splitRatio: appPanelRatio,
  };
}

/**
 * Hook for responsive layout detection and management
 */
export function useResponsiveLayout(): ResponsiveLayoutState {
  const [layoutState, setLayoutState] = useState<ResponsiveLayoutState>(() => {
    // Initialize with safe defaults for SSR
    if (typeof window === 'undefined') {
      return {
        breakpoint: 'mobile',
        width: 0,
        height: 0,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);

    return {
      breakpoint,
      width,
      height,
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
      shouldUseSplitScreen: breakpoint === 'desktop',
      shouldUseToggleMode: breakpoint === 'tablet',
    };
  });

  const updateLayoutState = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);

    setLayoutState({
      breakpoint,
      width,
      height,
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
      shouldUseSplitScreen: breakpoint === 'desktop',
      shouldUseToggleMode: breakpoint === 'tablet',
    });
  }, []);

  useEffect(() => {
    // Update state on mount
    updateLayoutState();

    // Create media query listeners for each breakpoint
    const mobileQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
    const tabletQuery = window.matchMedia(
      `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`
    );
    const desktopQuery = window.matchMedia(`(min-width: ${BREAKPOINTS.tablet}px)`);

    // Add listeners
    mobileQuery.addEventListener('change', updateLayoutState);
    tabletQuery.addEventListener('change', updateLayoutState);
    desktopQuery.addEventListener('change', updateLayoutState);

    // Cleanup
    return () => {
      mobileQuery.removeEventListener('change', updateLayoutState);
      tabletQuery.removeEventListener('change', updateLayoutState);
      desktopQuery.removeEventListener('change', updateLayoutState);
    };
  }, [updateLayoutState]);

  return layoutState;
}

/**
 * Hook for managing split-screen panel dimensions
 */
export function useSplitScreenDimensions(
  initialRatio: number = 0.65,
  minAppPanelWidth: number = 400,
  minChatPanelWidth: number = 300
) {
  const { width: containerWidth, shouldUseSplitScreen } = useResponsiveLayout();
  const [splitRatio, setSplitRatio] = useState(initialRatio);

  const dimensions = calculateSplitScreenDimensions(containerWidth, splitRatio);

  const updateSplitRatio = useCallback((newRatio: number) => {
    // Ensure minimum panel widths are maintained
    const testDimensions = calculateSplitScreenDimensions(containerWidth, newRatio);
    
    if (
      testDimensions.appPanelWidth >= minAppPanelWidth &&
      testDimensions.chatPanelWidth >= minChatPanelWidth
    ) {
      setSplitRatio(newRatio);
    }
  }, [containerWidth, minAppPanelWidth, minChatPanelWidth]);

  // Reset to default ratio when not in split-screen mode
  useEffect(() => {
    if (!shouldUseSplitScreen) {
      setSplitRatio(initialRatio);
    }
  }, [shouldUseSplitScreen, initialRatio]);

  return {
    ...dimensions,
    containerWidth,
    updateSplitRatio,
    canResize: shouldUseSplitScreen && containerWidth > minAppPanelWidth + minChatPanelWidth,
    minAppPanelWidth,
    minChatPanelWidth,
  };
}

/**
 * Utility function to get responsive CSS classes based on breakpoint
 */
export function getResponsiveClasses(breakpoint: Breakpoint): string {
  const baseClasses = 'transition-all duration-300 ease-in-out';
  
  switch (breakpoint) {
    case 'mobile':
      return `${baseClasses} mobile-layout`;
    case 'tablet':
      return `${baseClasses} tablet-layout`;
    case 'desktop':
      return `${baseClasses} desktop-layout split-screen`;
    default:
      return baseClasses;
  }
}