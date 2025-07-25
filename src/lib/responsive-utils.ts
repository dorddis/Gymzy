import { BREAKPOINTS, LAYOUT, getBreakpoint, createSplitScreenStyles } from './design-tokens';

// Responsive breakpoint detection
export function getBreakpointFromWidth(width: number): keyof typeof BREAKPOINTS {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  if (width >= BREAKPOINTS.xs) return 'xs';
  return 'xs';
}

// Layout type detection
export function getLayoutType(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width >= getBreakpoint('desktop')) return 'desktop';
  if (width >= getBreakpoint('md')) return 'tablet';
  return 'mobile';
}

// Split screen capability detection
export function canUseSplitScreen(width: number): boolean {
  return width >= getBreakpoint('split-screen');
}

// Container width calculations for reduced-width scenarios
export function calculateContainerWidth(
  totalWidth: number,
  splitRatio: number = LAYOUT['split-screen']['default-app-ratio']
): {
  appWidth: number;
  chatWidth: number;
  dividerWidth: number;
  canResize: boolean;
} {
  const dividerWidth = LAYOUT['split-screen']['divider-width'];
  const minAppWidth = LAYOUT['split-screen']['min-app-width'];
  const minChatWidth = LAYOUT['split-screen']['min-chat-width'];
  
  const availableWidth = totalWidth - dividerWidth;
  const appWidth = Math.floor(availableWidth * splitRatio);
  const chatWidth = availableWidth - appWidth;
  
  const canResize = appWidth >= minAppWidth && chatWidth >= minChatWidth;
  
  return {
    appWidth: Math.max(appWidth, minAppWidth),
    chatWidth: Math.max(chatWidth, minChatWidth),
    dividerWidth,
    canResize,
  };
}

// Responsive grid column calculations
export function calculateGridColumns(
  containerWidth: number,
  itemMinWidth: number = 200,
  maxColumns: number = 4
): number {
  const possibleColumns = Math.floor(containerWidth / itemMinWidth);
  return Math.min(possibleColumns, maxColumns);
}

// Component sizing utilities
export function getComponentSize(
  breakpoint: keyof typeof BREAKPOINTS,
  sizes: {
    xs?: string | number;
    sm?: string | number;
    md?: string | number;
    lg?: string | number;
    xl?: string | number;
    '2xl'?: string | number;
  }
): string | number {
  // Return the appropriate size based on breakpoint hierarchy
  const breakpointOrder: (keyof typeof BREAKPOINTS)[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  // Find the largest applicable size
  for (let i = currentIndex; i >= 0; i--) {
    const key = breakpointOrder[i];
    if (sizes[key] !== undefined) {
      return sizes[key]!;
    }
  }
  
  // Fallback to xs if nothing found
  return sizes.xs || sizes.sm || sizes.md || sizes.lg || sizes.xl || sizes['2xl'] || 'auto';
}

// CSS class generation utilities
export function generateResponsiveClasses(
  baseClass: string,
  breakpointValues: Partial<Record<keyof typeof BREAKPOINTS, string>>
): string {
  const classes = [baseClass];
  
  Object.entries(breakpointValues).forEach(([breakpoint, value]) => {
    if (value) {
      const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
      classes.push(`${prefix}${value}`);
    }
  });
  
  return classes.join(' ');
}

// Split screen ratio validation and adjustment
export function validateSplitRatio(
  ratio: number,
  containerWidth: number
): { ratio: number; isValid: boolean; adjustedRatio?: number } {
  const minAppWidth = LAYOUT['split-screen']['min-app-width'];
  const minChatWidth = LAYOUT['split-screen']['min-chat-width'];
  const dividerWidth = LAYOUT['split-screen']['divider-width'];
  
  const availableWidth = containerWidth - dividerWidth;
  const appWidth = availableWidth * ratio;
  const chatWidth = availableWidth * (1 - ratio);
  
  const isValid = appWidth >= minAppWidth && chatWidth >= minChatWidth;
  
  if (!isValid) {
    // Calculate adjusted ratio
    const maxAppRatio = (availableWidth - minChatWidth) / availableWidth;
    const minAppRatio = minAppWidth / availableWidth;
    
    const adjustedRatio = Math.max(minAppRatio, Math.min(maxAppRatio, ratio));
    
    return { ratio, isValid: false, adjustedRatio };
  }
  
  return { ratio, isValid: true };
}

// Responsive font size calculation
export function getResponsiveFontSize(
  breakpoint: keyof typeof BREAKPOINTS,
  scale: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' = 'base'
): string {
  const baseSizes = {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  };
  
  // Adjust size based on breakpoint
  const breakpointMultipliers = {
    xs: 0.9,
    sm: 0.95,
    md: 1,
    lg: 1.05,
    xl: 1.1,
    '2xl': 1.15,
    desktop: 1.05,
    'desktop-lg': 1.1,
    'desktop-xl': 1.15,
    'split-screen': 1,
  };
  
  const baseSize = parseFloat(baseSizes[scale]);
  const multiplier = breakpointMultipliers[breakpoint] || 1;
  
  return `${baseSize * multiplier}rem`;
}

// Spacing calculation utilities
export function getResponsiveSpacing(
  breakpoint: keyof typeof BREAKPOINTS,
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'
): string {
  const baseSizes = {
    xs: 0.5,
    sm: 1,
    md: 1.5,
    lg: 2,
    xl: 3,
  };
  
  const breakpointMultipliers = {
    xs: 0.8,
    sm: 0.9,
    md: 1,
    lg: 1.1,
    xl: 1.2,
    '2xl': 1.3,
    desktop: 1.1,
    'desktop-lg': 1.2,
    'desktop-xl': 1.3,
    'split-screen': 1,
  };
  
  const baseSize = baseSizes[size];
  const multiplier = breakpointMultipliers[breakpoint] || 1;
  
  return `${baseSize * multiplier}rem`;
}

// Animation duration based on reduced motion preference
export function getAnimationDuration(
  duration: 'fast' | 'normal' | 'slow' = 'normal',
  respectReducedMotion: boolean = true
): string {
  if (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return '0ms';
  }
  
  const durations = {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  };
  
  return durations[duration];
}

// Container query utilities (for future CSS Container Queries support)
export function createContainerStyles(
  containerWidth: number,
  breakpoints: { sm?: number; md?: number; lg?: number } = {}
): Record<string, boolean> {
  const defaultBreakpoints = {
    sm: 400,
    md: 600,
    lg: 800,
    ...breakpoints,
  };
  
  return {
    'container-sm': containerWidth >= defaultBreakpoints.sm,
    'container-md': containerWidth >= defaultBreakpoints.md,
    'container-lg': containerWidth >= defaultBreakpoints.lg,
  };
}

// Utility for creating responsive aspect ratios
export function createAspectRatioStyles(
  ratio: string = '16/9',
  breakpointRatios?: Partial<Record<keyof typeof BREAKPOINTS, string>>
): Record<string, string> {
  const styles: Record<string, string> = {
    aspectRatio: ratio,
  };
  
  if (breakpointRatios) {
    Object.entries(breakpointRatios).forEach(([breakpoint, breakpointRatio]) => {
      const mediaQuery = `@media (min-width: ${BREAKPOINTS[breakpoint as keyof typeof BREAKPOINTS]}px)`;
      styles[mediaQuery] = `aspect-ratio: ${breakpointRatio}`;
    });
  }
  
  return styles;
}

// Utility for creating responsive padding/margin
export function createResponsiveSpacing(
  property: 'padding' | 'margin',
  values: Partial<Record<keyof typeof BREAKPOINTS, string | number>>
): Record<string, string> {
  const styles: Record<string, string> = {};
  
  Object.entries(values).forEach(([breakpoint, value]) => {
    const bp = breakpoint as keyof typeof BREAKPOINTS;
    const mediaQuery = bp === 'xs' 
      ? 'default' 
      : `@media (min-width: ${BREAKPOINTS[bp]}px)`;
    
    const key = mediaQuery === 'default' ? property : mediaQuery;
    const cssValue = typeof value === 'number' ? `${value}rem` : value;
    
    if (mediaQuery === 'default') {
      styles[property] = cssValue as string;
    } else {
      styles[key] = `${property}: ${cssValue}`;
    }
  });
  
  return styles;
}

// Export utility functions as a collection
export const ResponsiveUtils = {
  getBreakpointFromWidth,
  getLayoutType,
  canUseSplitScreen,
  calculateContainerWidth,
  calculateGridColumns,
  getComponentSize,
  generateResponsiveClasses,
  validateSplitRatio,
  getResponsiveFontSize,
  getResponsiveSpacing,
  getAnimationDuration,
  createContainerStyles,
  createAspectRatioStyles,
  createResponsiveSpacing,
};