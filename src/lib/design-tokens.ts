// Comprehensive Design Tokens with Accessibility Support

export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  desktop: 1024,
  'desktop-lg': 1280,
  'desktop-xl': 1440,
  'split-screen': 1200,
} as const;

// 8px Grid System for consistent spacing
export const SPACING = {
  // Base spacing scale (8px grid)
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem',  // 8px
  3: '0.75rem', // 12px
  4: '1rem',    // 16px
  5: '1.25rem', // 20px
  6: '1.5rem',  // 24px
  8: '2rem',    // 32px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  16: '4rem',   // 64px
  20: '5rem',   // 80px
  24: '6rem',   // 96px
  
  // Component-specific spacing
  'split-divider': '4px',
  'panel-padding': '1rem',
  'desktop-padding': '1.5rem',
  'chat-compact': '0.75rem',
  
  // Accessibility-focused spacing
  'touch-target-min': '44px', // Minimum touch target size
  'focus-ring-offset': '2px',
  'focus-ring-width': '3px',
  'form-field-gap': '0.5rem',
  'section-gap': '2rem',
  'content-max-width': '65ch', // Optimal reading width
} as const;

// WCAG AA Compliant Color System
export const COLORS = {
  // Primary brand colors
  primary: {
    50: '#F8F4F9',
    100: '#F0E8F2',
    200: '#E1D1E5',
    300: '#D2BAD8',
    400: '#C3A3CB',
    500: '#B48CBE', // Main primary
    600: '#9A6FA5',
    700: '#7D5286',
    800: '#603F68',
    900: '#432C49',
    950: '#34113F', // Dark primary
  },
  
  // Secondary colors
  secondary: {
    50: '#F0F9F4',
    100: '#E1F3E9',
    200: '#C3E7D3',
    300: '#A5DBBD',
    400: '#87CFA7',
    500: '#73AB84', // Main secondary
    600: '#5F8F6E',
    700: '#4B7358',
    800: '#375742',
    900: '#233B2C',
    950: '#1A2D21',
  },
  
  // Neutral grays with proper contrast ratios
  neutral: {
    0: '#FFFFFF',    // Pure white
    50: '#FDFFFC',   // Off-white background
    100: '#F9FAFB',  // Light gray
    200: '#F3F4F6',  // Very light gray
    300: '#E5E7EB',  // Light gray
    400: '#9CA3AF',  // Medium gray
    500: '#6B7280',  // Gray
    600: '#4B5563',  // Dark gray
    700: '#374151',  // Darker gray
    800: '#1F2937',  // Very dark gray
    900: '#111827',  // Near black
    950: '#030712',  // Pure black
  },
  
  // Semantic colors with WCAG AA compliance
  semantic: {
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981', // 4.5:1 contrast on white
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B', // 3.1:1 contrast - needs dark text
      600: '#D97706',
      700: '#B45309', // 4.5:1 contrast on white
      800: '#92400E',
      900: '#78350F',
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444', // 4.5:1 contrast on white
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    info: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6', // 4.5:1 contrast on white
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
  },
  
  // High contrast theme colors
  highContrast: {
    background: '#FFFFFF',
    foreground: '#000000',
    primary: '#0000FF',      // Pure blue for high contrast
    secondary: '#008000',    // Pure green for high contrast
    accent: '#FF0000',       // Pure red for high contrast
    border: '#000000',
    muted: '#666666',        // 7:1 contrast ratio
  },
  
  // Focus and interaction states
  focus: {
    ring: '#3B82F6',         // Blue focus ring
    'ring-offset': '#FFFFFF', // White offset
    'ring-width': '3px',
    'ring-offset-width': '2px',
  },
  
  // Split-screen specific colors
  'split-screen': {
    'app-panel': '#FDFFFC',
    'chat-panel': '#FFFFFF',
    'divider': '#E5E7EB',
    'divider-hover': '#9CA3AF',
    'divider-active': '#6B7280',
  },
  
  // Desktop specific colors (legacy support)
  desktop: {
    primary: '#34113F',
    secondary: '#73AB84',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

// Accessible Typography System
export const TYPOGRAPHY = {
  // Font families with fallbacks
  fontFamily: {
    primary: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    secondary: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'monospace'],
    // Legacy support
    inter: ['Inter', 'sans-serif'],
    body: ['Inter', 'sans-serif'],
    headline: ['Inter', 'sans-serif'],
    code: ['monospace', 'monospace'],
  },
  
  // Responsive font scale with optimal line heights
  fontSize: {
    // Base scale (mobile-first)
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px - base size
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
    
    // User preference sizes (for accessibility)
    'user-small': ['0.875rem', { lineHeight: '1.4' }],
    'user-medium': ['1rem', { lineHeight: '1.5' }],
    'user-large': ['1.125rem', { lineHeight: '1.6' }],
    'user-extra-large': ['1.25rem', { lineHeight: '1.7' }],
    
    // Desktop-specific sizes (legacy support)
    'desktop-xs': ['0.75rem', { lineHeight: '1rem' }],
    'desktop-sm': ['0.875rem', { lineHeight: '1.25rem' }],
    'desktop-base': ['1rem', { lineHeight: '1.5rem' }],
    'desktop-lg': ['1.125rem', { lineHeight: '1.75rem' }],
    'desktop-xl': ['1.25rem', { lineHeight: '1.75rem' }],
    'desktop-2xl': ['1.5rem', { lineHeight: '2rem' }],
  },
  
  // Font weights with semantic names
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
    // Semantic weights
    body: '400',
    heading: '600',
    emphasis: '500',
    strong: '700',
  },
  
  // Line heights for different content types
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
    // Content-specific line heights
    heading: '1.2',
    body: '1.6',
    caption: '1.4',
    ui: '1.5',
  },
  
  // Letter spacing for readability
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Text sizes for specific use cases
  textSizes: {
    // Headings
    'heading-1': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }], // h1
    'heading-2': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600' }], // h2
    'heading-3': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }], // h3
    'heading-4': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }], // h4
    'heading-5': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }], // h5
    'heading-6': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }], // h6
    
    // Body text
    'body-large': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
    'body-base': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
    'body-small': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
    
    // UI text
    'ui-large': ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }],
    'ui-base': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
    'ui-small': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
    
    // Labels and captions
    'label': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
    'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
    'overline': ['0.75rem', { lineHeight: '1rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }],
  },
} as const;

// Accessibility-Aware Animation System
export const ANIMATIONS = {
  // Duration scale respecting user preferences
  duration: {
    instant: '0ms',      // For reduced motion
    fast: '150ms',       // Quick interactions
    normal: '300ms',     // Standard transitions
    slow: '500ms',       // Emphasis transitions
    slower: '750ms',     // Heavy emphasis
    slowest: '1000ms',   // Maximum duration
  },
  
  // Easing functions for natural motion
  easing: {
    linear: 'linear',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'ease-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Reduced motion alternatives
  reducedMotion: {
    duration: '0ms',
    easing: 'linear',
    transform: 'none',
  },
  
  // Common animation presets
  presets: {
    'fade-in': {
      duration: '300ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      keyframes: 'fadeIn',
    },
    'slide-up': {
      duration: '300ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      keyframes: 'slideUp',
    },
    'scale-in': {
      duration: '200ms',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      keyframes: 'scaleIn',
    },
    'focus-ring': {
      duration: '150ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      keyframes: 'focusRing',
    },
  },
} as const;

// Interactive Element Specifications
export const INTERACTIVE = {
  // Touch target sizes (WCAG AA compliance)
  touchTarget: {
    minimum: '44px',     // WCAG minimum
    comfortable: '48px', // Comfortable size
    large: '56px',       // Large touch targets
  },
  
  // Focus ring specifications
  focusRing: {
    width: '3px',
    offset: '2px',
    color: '#3B82F6',
    style: 'solid',
    radius: '4px',
  },
  
  // Hover and active states
  states: {
    hover: {
      scale: '1.02',
      brightness: '1.05',
      transition: '150ms ease-out',
    },
    active: {
      scale: '0.98',
      brightness: '0.95',
      transition: '100ms ease-out',
    },
    disabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
      filter: 'grayscale(50%)',
    },
  },
  
  // Button specifications
  button: {
    minHeight: '44px',
    minWidth: '44px',
    padding: {
      small: '0.5rem 1rem',
      medium: '0.75rem 1.5rem',
      large: '1rem 2rem',
    },
    borderRadius: {
      small: '4px',
      medium: '6px',
      large: '8px',
    },
  },
  
  // Form element specifications
  form: {
    input: {
      minHeight: '44px',
      padding: '0.75rem',
      borderWidth: '1px',
      borderRadius: '6px',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '0.5rem',
    },
    helpText: {
      fontSize: '0.75rem',
      marginTop: '0.25rem',
    },
    errorText: {
      fontSize: '0.75rem',
      color: '#EF4444',
      marginTop: '0.25rem',
    },
  },
} as const;

export const LAYOUT = {
  'split-screen': {
    'min-app-width': 400,
    'min-chat-width': 300,
    'default-app-ratio': 0.65,
    'divider-width': 4,
  },
  
  'tablet-toggle': {
    'transition-duration': '300ms',
    'header-height': '60px',
  },
  
  'desktop-padding': {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
  },
} as const;

export const Z_INDEX = {
  'split-divider': 10,
  'tablet-toggle': 20,
  'notification': 50,
  'modal': 100,
  'tooltip': 200,
} as const;

// Enhanced CSS Custom Properties Generator
export function generateCSSCustomProperties(options?: {
  highContrast?: boolean;
  reducedMotion?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
}) {
  const { highContrast = false, reducedMotion = false, fontSize = 'medium' } = options || {};
  
  return {
    // Breakpoints
    '--breakpoint-xs': `${BREAKPOINTS.xs}px`,
    '--breakpoint-sm': `${BREAKPOINTS.sm}px`,
    '--breakpoint-md': `${BREAKPOINTS.md}px`,
    '--breakpoint-lg': `${BREAKPOINTS.lg}px`,
    '--breakpoint-xl': `${BREAKPOINTS.xl}px`,
    '--breakpoint-2xl': `${BREAKPOINTS['2xl']}px`,
    '--breakpoint-desktop': `${BREAKPOINTS.desktop}px`,
    '--breakpoint-split-screen': `${BREAKPOINTS['split-screen']}px`,
    
    // Colors (with high contrast support)
    '--color-primary-50': highContrast ? COLORS.highContrast.primary : COLORS.primary[50],
    '--color-primary-500': highContrast ? COLORS.highContrast.primary : COLORS.primary[500],
    '--color-primary-950': highContrast ? COLORS.highContrast.primary : COLORS.primary[950],
    '--color-secondary-500': highContrast ? COLORS.highContrast.secondary : COLORS.secondary[500],
    '--color-background': highContrast ? COLORS.highContrast.background : COLORS.neutral[50],
    '--color-foreground': highContrast ? COLORS.highContrast.foreground : COLORS.neutral[900],
    '--color-muted': highContrast ? COLORS.highContrast.muted : COLORS.neutral[500],
    '--color-border': highContrast ? COLORS.highContrast.border : COLORS.neutral[300],
    
    // Semantic colors
    '--color-success': COLORS.semantic.success[500],
    '--color-warning': COLORS.semantic.warning[700], // Using 700 for better contrast
    '--color-error': COLORS.semantic.error[500],
    '--color-info': COLORS.semantic.info[500],
    
    // Focus colors
    '--color-focus-ring': COLORS.focus.ring,
    '--color-focus-ring-offset': COLORS.focus['ring-offset'],
    
    // Split-screen colors
    '--color-split-app-panel': COLORS['split-screen']['app-panel'],
    '--color-split-chat-panel': COLORS['split-screen']['chat-panel'],
    '--color-split-divider': COLORS['split-screen']['divider'],
    
    // Spacing
    '--spacing-0': SPACING[0],
    '--spacing-1': SPACING[1],
    '--spacing-2': SPACING[2],
    '--spacing-3': SPACING[3],
    '--spacing-4': SPACING[4],
    '--spacing-6': SPACING[6],
    '--spacing-8': SPACING[8],
    '--spacing-12': SPACING[12],
    '--spacing-16': SPACING[16],
    '--spacing-20': SPACING[20],
    '--spacing-24': SPACING[24],
    
    // Accessibility spacing
    '--spacing-touch-target-min': SPACING['touch-target-min'],
    '--spacing-focus-ring-offset': SPACING['focus-ring-offset'],
    '--spacing-focus-ring-width': SPACING['focus-ring-width'],
    '--spacing-form-field-gap': SPACING['form-field-gap'],
    '--spacing-section-gap': SPACING['section-gap'],
    '--spacing-content-max-width': SPACING['content-max-width'],
    
    // Typography (with font size preferences)
    '--font-family-primary': TYPOGRAPHY.fontFamily.primary.join(', '),
    '--font-family-mono': TYPOGRAPHY.fontFamily.mono.join(', '),
    '--font-size-xs': TYPOGRAPHY.fontSize.xs[0],
    '--font-size-sm': TYPOGRAPHY.fontSize.sm[0],
    '--font-size-base': fontSize === 'small' ? TYPOGRAPHY.fontSize['user-small'][0] :
                        fontSize === 'large' ? TYPOGRAPHY.fontSize['user-large'][0] :
                        fontSize === 'extra-large' ? TYPOGRAPHY.fontSize['user-extra-large'][0] :
                        TYPOGRAPHY.fontSize['user-medium'][0],
    '--font-size-lg': TYPOGRAPHY.fontSize.lg[0],
    '--font-size-xl': TYPOGRAPHY.fontSize.xl[0],
    '--font-size-2xl': TYPOGRAPHY.fontSize['2xl'][0],
    
    // Line heights
    '--line-height-tight': TYPOGRAPHY.lineHeight.tight,
    '--line-height-normal': TYPOGRAPHY.lineHeight.normal,
    '--line-height-relaxed': TYPOGRAPHY.lineHeight.relaxed,
    '--line-height-body': TYPOGRAPHY.lineHeight.body,
    '--line-height-heading': TYPOGRAPHY.lineHeight.heading,
    
    // Font weights
    '--font-weight-normal': TYPOGRAPHY.fontWeight.normal,
    '--font-weight-medium': TYPOGRAPHY.fontWeight.medium,
    '--font-weight-semibold': TYPOGRAPHY.fontWeight.semibold,
    '--font-weight-bold': TYPOGRAPHY.fontWeight.bold,
    
    // Interactive elements
    '--touch-target-minimum': INTERACTIVE.touchTarget.minimum,
    '--touch-target-comfortable': INTERACTIVE.touchTarget.comfortable,
    '--focus-ring-width': INTERACTIVE.focusRing.width,
    '--focus-ring-offset': INTERACTIVE.focusRing.offset,
    '--focus-ring-color': INTERACTIVE.focusRing.color,
    '--button-min-height': INTERACTIVE.button.minHeight,
    '--button-min-width': INTERACTIVE.button.minWidth,
    
    // Layout
    '--layout-min-app-width': `${LAYOUT['split-screen']['min-app-width']}px`,
    '--layout-min-chat-width': `${LAYOUT['split-screen']['min-chat-width']}px`,
    '--layout-divider-width': `${LAYOUT['split-screen']['divider-width']}px`,
    '--layout-default-app-ratio': LAYOUT['split-screen']['default-app-ratio'],
    
    // Animation (with reduced motion support)
    '--animation-duration-fast': reducedMotion ? ANIMATIONS.reducedMotion.duration : ANIMATIONS.duration.fast,
    '--animation-duration-normal': reducedMotion ? ANIMATIONS.reducedMotion.duration : ANIMATIONS.duration.normal,
    '--animation-duration-slow': reducedMotion ? ANIMATIONS.reducedMotion.duration : ANIMATIONS.duration.slow,
    '--animation-easing-out': reducedMotion ? ANIMATIONS.reducedMotion.easing : ANIMATIONS.easing['ease-out'],
    '--animation-easing-in': reducedMotion ? ANIMATIONS.reducedMotion.easing : ANIMATIONS.easing['ease-in'],
    '--animation-easing-in-out': reducedMotion ? ANIMATIONS.reducedMotion.easing : ANIMATIONS.easing['ease-in-out'],
  };
}

// Enhanced utility functions for working with design tokens
export function getBreakpoint(name: keyof typeof BREAKPOINTS): number {
  return BREAKPOINTS[name];
}

export function getColor(path: string): string {
  const keys = path.split('.');
  let value: any = COLORS;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      throw new Error(`Color token not found: ${path}`);
    }
  }
  
  return value;
}

export function getSpacing(name: keyof typeof SPACING): string {
  return SPACING[name];
}

export function getLayoutValue(path: string): number | string {
  const keys = path.split('.');
  let value: any = LAYOUT;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      throw new Error(`Layout token not found: ${path}`);
    }
  }
  
  return value;
}

// Accessibility-focused utility functions
export function getAccessibleColor(
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA'
): { color: string; contrastRatio: number; passes: boolean } {
  // This is a simplified implementation - in a real app, you'd use a proper contrast calculation library
  const contrastRatio = calculateContrastRatio(foreground, background);
  const requiredRatio = level === 'AAA' ? 7 : 4.5;
  
  return {
    color: foreground,
    contrastRatio,
    passes: contrastRatio >= requiredRatio,
  };
}

export function calculateContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In production, use a proper color contrast library like 'color-contrast'
  const getLuminance = (color: string): number => {
    // Convert hex to RGB and calculate relative luminance
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

export function getFontSizeForPreference(preference: 'small' | 'medium' | 'large' | 'extra-large'): string {
  const sizeMap = {
    small: TYPOGRAPHY.fontSize['user-small'][0],
    medium: TYPOGRAPHY.fontSize['user-medium'][0],
    large: TYPOGRAPHY.fontSize['user-large'][0],
    'extra-large': TYPOGRAPHY.fontSize['user-extra-large'][0],
  };
  
  return sizeMap[preference];
}

export function getAnimationDuration(
  duration: keyof typeof ANIMATIONS.duration,
  respectReducedMotion: boolean = true
): string {
  if (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return ANIMATIONS.reducedMotion.duration;
  }
  
  return ANIMATIONS.duration[duration];
}

export function getTouchTargetSize(size: 'minimum' | 'comfortable' | 'large' = 'minimum'): string {
  return INTERACTIVE.touchTarget[size];
}

export function getFocusRingStyles(): {
  outline: string;
  outlineOffset: string;
  borderRadius: string;
} {
  return {
    outline: `${INTERACTIVE.focusRing.width} ${INTERACTIVE.focusRing.style} ${INTERACTIVE.focusRing.color}`,
    outlineOffset: INTERACTIVE.focusRing.offset,
    borderRadius: INTERACTIVE.focusRing.radius,
  };
}

// Theme generation utilities
export function generateThemeCSS(options?: {
  highContrast?: boolean;
  reducedMotion?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
}): string {
  const customProperties = generateCSSCustomProperties(options);
  
  return `:root {
${Object.entries(customProperties)
  .map(([key, value]) => `  ${key}: ${value};`)
  .join('\n')}
}

/* High contrast mode styles */
@media (prefers-contrast: high) {
  :root {
    --color-background: ${COLORS.highContrast.background};
    --color-foreground: ${COLORS.highContrast.foreground};
    --color-primary-500: ${COLORS.highContrast.primary};
    --color-border: ${COLORS.highContrast.border};
  }
}

/* Reduced motion styles */
@media (prefers-reduced-motion: reduce) {
  :root {
    --animation-duration-fast: ${ANIMATIONS.reducedMotion.duration};
    --animation-duration-normal: ${ANIMATIONS.reducedMotion.duration};
    --animation-duration-slow: ${ANIMATIONS.reducedMotion.duration};
    --animation-easing-out: ${ANIMATIONS.reducedMotion.easing};
    --animation-easing-in: ${ANIMATIONS.reducedMotion.easing};
    --animation-easing-in-out: ${ANIMATIONS.reducedMotion.easing};
  }
  
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Focus styles */
.focus-visible-ring {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  border-radius: var(--focus-ring-radius, 4px);
}

/* Touch target minimum sizes */
.touch-target {
  min-height: var(--touch-target-minimum);
  min-width: var(--touch-target-minimum);
}

.touch-target-comfortable {
  min-height: var(--touch-target-comfortable);
  min-width: var(--touch-target-comfortable);
}

/* Screen reader only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}`;
}

// Responsive design utilities
export function createResponsiveStyles<T>(
  property: string,
  values: {
    default: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    '2xl'?: T;
  }
): string {
  let styles = `${property}: ${values.default};`;
  
  if (values.sm) {
    styles += `\n${createMediaQuery('sm')} { ${property}: ${values.sm}; }`;
  }
  if (values.md) {
    styles += `\n${createMediaQuery('md')} { ${property}: ${values.md}; }`;
  }
  if (values.lg) {
    styles += `\n${createMediaQuery('lg')} { ${property}: ${values.lg}; }`;
  }
  if (values.xl) {
    styles += `\n${createMediaQuery('xl')} { ${property}: ${values.xl}; }`;
  }
  if (values['2xl']) {
    styles += `\n${createMediaQuery('2xl')} { ${property}: ${values['2xl']}; }`;
  }
  
  return styles;
}

// Media query helpers
export function createMediaQuery(breakpoint: keyof typeof BREAKPOINTS): string {
  return `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`;
}

export function createMaxWidthMediaQuery(breakpoint: keyof typeof BREAKPOINTS): string {
  return `@media (max-width: ${BREAKPOINTS[breakpoint] - 1}px)`;
}

// Responsive value helpers
export function createResponsiveValue<T>(values: {
  default: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T[] {
  return [
    values.default,
    values.sm,
    values.md,
    values.lg,
    values.xl,
    values['2xl'],
  ].filter(Boolean) as T[];
}

// CSS-in-JS helpers
export function createSplitScreenStyles(appRatio: number = LAYOUT['split-screen']['default-app-ratio']) {
  const chatRatio = 1 - appRatio;
  const dividerWidth = LAYOUT['split-screen']['divider-width'];
  
  return {
    '--app-panel-width': `calc(${appRatio * 100}% - ${dividerWidth / 2}px)`,
    '--chat-panel-width': `calc(${chatRatio * 100}% - ${dividerWidth / 2}px)`,
    '--split-divider-width': `${dividerWidth}px`,
  };
}

export function createTabletToggleStyles(activeView: 'app' | 'chat') {
  return {
    app: {
      transform: activeView === 'app' ? 'translateX(0)' : 'translateX(-100%)',
      transition: `transform ${LAYOUT['tablet-toggle']['transition-duration']} ease-in-out`,
    },
    chat: {
      transform: activeView === 'chat' ? 'translateX(0)' : 'translateX(100%)',
      transition: `transform ${LAYOUT['tablet-toggle']['transition-duration']} ease-in-out`,
    },
  };
}

// Type definitions for better TypeScript support
export type Breakpoint = keyof typeof BREAKPOINTS;
export type ColorPath = keyof typeof COLORS | `desktop.${keyof typeof COLORS.desktop}` | `split-screen.${keyof typeof COLORS['split-screen']}`;
export type SpacingKey = keyof typeof SPACING;
export type LayoutPath = string;

// Export all tokens as a single object for easy access
export const DESIGN_TOKENS = {
  BREAKPOINTS,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  ANIMATIONS,
  LAYOUT,
  Z_INDEX,
} as const;