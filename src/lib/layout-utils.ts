import { type Breakpoint } from '@/hooks/use-responsive-layout';

/**
 * Layout configuration constants
 */
export const LAYOUT_CONFIG = {
  // Split-screen ratios
  DEFAULT_APP_PANEL_RATIO: 0.65,
  MIN_APP_PANEL_RATIO: 0.5,
  MAX_APP_PANEL_RATIO: 0.8,
  
  // Minimum panel widths (in pixels)
  MIN_APP_PANEL_WIDTH: 400,
  MIN_CHAT_PANEL_WIDTH: 300,
  
  // Resize handle width
  RESIZE_HANDLE_WIDTH: 4,
  
  // Animation durations
  LAYOUT_TRANSITION_DURATION: 300,
  PANEL_RESIZE_DURATION: 150,
} as const;

/**
 * Interface for split-screen dimensions
 */
export interface SplitScreenDimensions {
  appPanelWidth: number;
  chatPanelWidth: number;
  splitRatio: number;
  containerWidth: number;
  resizeHandlePosition: number;
}

/**
 * Calculate split-screen panel dimensions
 */
export function calculatePanelDimensions(
  containerWidth: number,
  splitRatio: number = LAYOUT_CONFIG.DEFAULT_APP_PANEL_RATIO
): SplitScreenDimensions {
  const appPanelWidth = Math.floor(containerWidth * splitRatio);
  const chatPanelWidth = containerWidth - appPanelWidth - LAYOUT_CONFIG.RESIZE_HANDLE_WIDTH;
  const resizeHandlePosition = appPanelWidth;

  return {
    appPanelWidth,
    chatPanelWidth,
    splitRatio,
    containerWidth,
    resizeHandlePosition,
  };
}

/**
 * Validate if a split ratio is within acceptable bounds
 */
export function validateSplitRatio(
  ratio: number,
  containerWidth: number
): { isValid: boolean; adjustedRatio?: number; reason?: string } {
  const dimensions = calculatePanelDimensions(containerWidth, ratio);
  
  // Check minimum app panel width
  if (dimensions.appPanelWidth < LAYOUT_CONFIG.MIN_APP_PANEL_WIDTH) {
    const minRatio = LAYOUT_CONFIG.MIN_APP_PANEL_WIDTH / containerWidth;
    return {
      isValid: false,
      adjustedRatio: Math.max(minRatio, LAYOUT_CONFIG.MIN_APP_PANEL_RATIO),
      reason: 'App panel too narrow',
    };
  }
  
  // Check minimum chat panel width
  if (dimensions.chatPanelWidth < LAYOUT_CONFIG.MIN_CHAT_PANEL_WIDTH) {
    const maxAppWidth = containerWidth - LAYOUT_CONFIG.MIN_CHAT_PANEL_WIDTH - LAYOUT_CONFIG.RESIZE_HANDLE_WIDTH;
    const maxRatio = maxAppWidth / containerWidth;
    return {
      isValid: false,
      adjustedRatio: Math.min(maxRatio, LAYOUT_CONFIG.MAX_APP_PANEL_RATIO),
      reason: 'Chat panel too narrow',
    };
  }
  
  // Check ratio bounds
  if (ratio < LAYOUT_CONFIG.MIN_APP_PANEL_RATIO || ratio > LAYOUT_CONFIG.MAX_APP_PANEL_RATIO) {
    return {
      isValid: false,
      adjustedRatio: Math.max(
        LAYOUT_CONFIG.MIN_APP_PANEL_RATIO,
        Math.min(ratio, LAYOUT_CONFIG.MAX_APP_PANEL_RATIO)
      ),
      reason: 'Ratio out of bounds',
    };
  }
  
  return { isValid: true };
}

/**
 * Convert mouse/touch position to split ratio
 */
export function positionToSplitRatio(
  clientX: number,
  containerRect: DOMRect
): number {
  const relativeX = clientX - containerRect.left;
  const ratio = relativeX / containerRect.width;
  
  return Math.max(
    LAYOUT_CONFIG.MIN_APP_PANEL_RATIO,
    Math.min(ratio, LAYOUT_CONFIG.MAX_APP_PANEL_RATIO)
  );
}

/**
 * Get CSS custom properties for split-screen layout
 */
export function getSplitScreenCSSProperties(dimensions: SplitScreenDimensions): Record<string, string> {
  return {
    '--app-panel-width': `${dimensions.appPanelWidth}px`,
    '--chat-panel-width': `${dimensions.chatPanelWidth}px`,
    '--resize-handle-position': `${dimensions.resizeHandlePosition}px`,
    '--split-ratio': dimensions.splitRatio.toString(),
    '--resize-handle-width': `${LAYOUT_CONFIG.RESIZE_HANDLE_WIDTH}px`,
  };
}

/**
 * Generate responsive grid classes based on breakpoint and content type
 */
export function getResponsiveGridClasses(
  breakpoint: Breakpoint,
  contentType: 'dashboard' | 'workout-list' | 'form' | 'chart' = 'dashboard'
): string {
  const baseClasses = 'grid gap-4';
  
  switch (breakpoint) {
    case 'mobile':
      return `${baseClasses} grid-cols-1`;
      
    case 'tablet':
      switch (contentType) {
        case 'dashboard':
          return `${baseClasses} grid-cols-2`;
        case 'workout-list':
          return `${baseClasses} grid-cols-2 sm:grid-cols-3`;
        case 'form':
          return `${baseClasses} grid-cols-1 sm:grid-cols-2`;
        case 'chart':
          return `${baseClasses} grid-cols-1`;
        default:
          return `${baseClasses} grid-cols-2`;
      }
      
    case 'desktop':
      // Desktop in split-screen mode needs more compact layouts
      switch (contentType) {
        case 'dashboard':
          return `${baseClasses} grid-cols-2 lg:grid-cols-3`;
        case 'workout-list':
          return `${baseClasses} grid-cols-2 lg:grid-cols-3`;
        case 'form':
          return `${baseClasses} grid-cols-1 lg:grid-cols-2`;
        case 'chart':
          return `${baseClasses} grid-cols-1`;
        default:
          return `${baseClasses} grid-cols-2 lg:grid-cols-3`;
      }
      
    default:
      return baseClasses;
  }
}

/**
 * Calculate optimal font sizes for different breakpoints
 */
export function getResponsiveFontSizes(breakpoint: Breakpoint) {
  switch (breakpoint) {
    case 'mobile':
      return {
        heading1: 'text-2xl',
        heading2: 'text-xl',
        heading3: 'text-lg',
        body: 'text-base',
        small: 'text-sm',
        tiny: 'text-xs',
      };
      
    case 'tablet':
      return {
        heading1: 'text-3xl',
        heading2: 'text-2xl',
        heading3: 'text-xl',
        body: 'text-base',
        small: 'text-sm',
        tiny: 'text-xs',
      };
      
    case 'desktop':
      // Slightly smaller for split-screen to fit more content
      return {
        heading1: 'text-2xl lg:text-3xl',
        heading2: 'text-xl lg:text-2xl',
        heading3: 'text-lg lg:text-xl',
        body: 'text-sm lg:text-base',
        small: 'text-xs lg:text-sm',
        tiny: 'text-xs',
      };
      
    default:
      return {
        heading1: 'text-2xl',
        heading2: 'text-xl',
        heading3: 'text-lg',
        body: 'text-base',
        small: 'text-sm',
        tiny: 'text-xs',
      };
  }
}

/**
 * Storage utilities for user preferences
 */
export const STORAGE_KEYS = {
  SPLIT_RATIO: 'gymzy-split-ratio',
  CHAT_PANEL_POSITION: 'gymzy-chat-position',
  DESKTOP_MODE_ENABLED: 'gymzy-desktop-mode',
} as const;

export function saveSplitRatio(ratio: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SPLIT_RATIO, ratio.toString());
  } catch (error) {
    console.warn('Failed to save split ratio to localStorage:', error);
  }
}

export function loadSplitRatio(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SPLIT_RATIO);
    if (saved) {
      const ratio = parseFloat(saved);
      if (!isNaN(ratio) && ratio >= LAYOUT_CONFIG.MIN_APP_PANEL_RATIO && ratio <= LAYOUT_CONFIG.MAX_APP_PANEL_RATIO) {
        return ratio;
      }
    }
  } catch (error) {
    console.warn('Failed to load split ratio from localStorage:', error);
  }
  
  return LAYOUT_CONFIG.DEFAULT_APP_PANEL_RATIO;
}