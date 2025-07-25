'use client';

import React, { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { COLORS } from '@/lib/design-tokens';

// High contrast theme CSS styles
const HIGH_CONTRAST_STYLES = `
/* High Contrast Theme Styles */
.high-contrast {
  /* Override all colors with high contrast variants */
  --color-background: ${COLORS.highContrast.background};
  --color-foreground: ${COLORS.highContrast.foreground};
  --color-primary-500: ${COLORS.highContrast.primary};
  --color-secondary-500: ${COLORS.highContrast.secondary};
  --color-accent: ${COLORS.highContrast.accent};
  --color-border: ${COLORS.highContrast.border};
  --color-muted: ${COLORS.highContrast.muted};
  
  /* Semantic colors with high contrast */
  --color-success: #008000;
  --color-warning: #FF8C00;
  --color-error: #FF0000;
  --color-info: #0000FF;
  
  /* Interactive states */
  --color-hover: #000080;
  --color-active: #800080;
  --color-disabled: #808080;
  
  /* Focus ring with maximum contrast */
  --focus-ring-color: #FF0000;
  --focus-ring-width: 4px;
  --focus-ring-offset: 3px;
}

/* High contrast component styles */
.high-contrast * {
  /* Force high contrast on all elements */
  border-color: var(--color-border) !important;
}

.high-contrast button,
.high-contrast [role="button"] {
  background-color: var(--color-background) !important;
  color: var(--color-foreground) !important;
  border: 2px solid var(--color-border) !important;
  font-weight: 600 !important;
}

.high-contrast button:hover,
.high-contrast [role="button"]:hover {
  background-color: var(--color-foreground) !important;
  color: var(--color-background) !important;
  border-color: var(--color-foreground) !important;
}

.high-contrast button:focus,
.high-contrast [role="button"]:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color) !important;
  outline-offset: var(--focus-ring-offset) !important;
}

.high-contrast input,
.high-contrast select,
.high-contrast textarea {
  background-color: var(--color-background) !important;
  color: var(--color-foreground) !important;
  border: 2px solid var(--color-border) !important;
}

.high-contrast input:focus,
.high-contrast select:focus,
.high-contrast textarea:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color) !important;
  outline-offset: var(--focus-ring-offset) !important;
  border-color: var(--focus-ring-color) !important;
}

.high-contrast a,
.high-contrast [role="link"] {
  color: var(--color-primary-500) !important;
  text-decoration: underline !important;
  font-weight: 600 !important;
}

.high-contrast a:hover,
.high-contrast [role="link"]:hover {
  color: var(--color-accent) !important;
  text-decoration: none !important;
}

.high-contrast a:focus,
.high-contrast [role="link"]:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color) !important;
  outline-offset: var(--focus-ring-offset) !important;
}

/* High contrast cards and containers */
.high-contrast .card,
.high-contrast [role="region"],
.high-contrast [role="article"] {
  background-color: var(--color-background) !important;
  color: var(--color-foreground) !important;
  border: 2px solid var(--color-border) !important;
}

/* High contrast navigation */
.high-contrast nav,
.high-contrast [role="navigation"] {
  background-color: var(--color-background) !important;
  border: 2px solid var(--color-border) !important;
}

.high-contrast nav a,
.high-contrast [role="navigation"] a {
  color: var(--color-foreground) !important;
  border: 1px solid transparent !important;
  padding: 0.5rem !important;
}

.high-contrast nav a:hover,
.high-contrast [role="navigation"] a:hover {
  background-color: var(--color-foreground) !important;
  color: var(--color-background) !important;
  border-color: var(--color-foreground) !important;
}

/* High contrast status indicators */
.high-contrast .success,
.high-contrast [aria-label*="success"],
.high-contrast [data-status="success"] {
  color: var(--color-success) !important;
  font-weight: 700 !important;
}

.high-contrast .warning,
.high-contrast [aria-label*="warning"],
.high-contrast [data-status="warning"] {
  color: var(--color-warning) !important;
  font-weight: 700 !important;
}

.high-contrast .error,
.high-contrast [aria-label*="error"],
.high-contrast [data-status="error"] {
  color: var(--color-error) !important;
  font-weight: 700 !important;
}

.high-contrast .info,
.high-contrast [aria-label*="info"],
.high-contrast [data-status="info"] {
  color: var(--color-info) !important;
  font-weight: 700 !important;
}

/* High contrast disabled states */
.high-contrast button:disabled,
.high-contrast input:disabled,
.high-contrast select:disabled,
.high-contrast textarea:disabled,
.high-contrast [aria-disabled="true"] {
  background-color: var(--color-disabled) !important;
  color: var(--color-background) !important;
  border-color: var(--color-disabled) !important;
  opacity: 1 !important; /* Don't use opacity in high contrast */
}

/* High contrast tables */
.high-contrast table {
  border: 2px solid var(--color-border) !important;
}

.high-contrast th,
.high-contrast td {
  border: 1px solid var(--color-border) !important;
  background-color: var(--color-background) !important;
  color: var(--color-foreground) !important;
}

.high-contrast th {
  font-weight: 700 !important;
}

/* High contrast modals and overlays */
.high-contrast [role="dialog"],
.high-contrast [role="alertdialog"] {
  background-color: var(--color-background) !important;
  color: var(--color-foreground) !important;
  border: 3px solid var(--color-border) !important;
  box-shadow: 0 0 0 1px var(--color-border) !important;
}

/* High contrast progress indicators */
.high-contrast [role="progressbar"] {
  background-color: var(--color-background) !important;
  border: 2px solid var(--color-border) !important;
}

.high-contrast [role="progressbar"]::before {
  background-color: var(--color-primary-500) !important;
}

/* Remove all shadows and gradients in high contrast */
.high-contrast * {
  box-shadow: none !important;
  text-shadow: none !important;
  background-image: none !important;
  background-gradient: none !important;
}

/* Ensure sufficient spacing in high contrast */
.high-contrast button,
.high-contrast input,
.high-contrast select,
.high-contrast textarea {
  padding: 0.75rem 1rem !important;
  margin: 0.25rem !important;
}

/* High contrast icons - make them more visible */
.high-contrast svg,
.high-contrast img[alt] {
  filter: contrast(200%) !important;
}

.high-contrast .icon {
  stroke-width: 3px !important;
  fill: currentColor !important;
  stroke: currentColor !important;
}
`;

interface HighContrastThemeProps {
  children: React.ReactNode;
}

export function HighContrastTheme({ children }: HighContrastThemeProps) {
  const { isHighContrast } = useTheme();

  useEffect(() => {
    // Inject high contrast styles when needed
    if (isHighContrast) {
      const styleId = 'high-contrast-theme-styles';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = HIGH_CONTRAST_STYLES;
        document.head.appendChild(styleElement);
      }
    } else {
      // Remove high contrast styles when not needed
      const styleElement = document.getElementById('high-contrast-theme-styles');
      if (styleElement) {
        styleElement.remove();
      }
    }

    return () => {
      // Cleanup on unmount
      const styleElement = document.getElementById('high-contrast-theme-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [isHighContrast]);

  return <>{children}</>;
}

// High contrast toggle button component
interface HighContrastToggleProps {
  className?: string;
  children?: React.ReactNode;
}

export function HighContrastToggle({ className = '', children }: HighContrastToggleProps) {
  const { isHighContrast, toggleHighContrast } = useTheme();

  return (
    <button
      onClick={toggleHighContrast}
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        border border-gray-300 rounded-md
        bg-white text-gray-700
        hover:bg-gray-50 hover:border-gray-400
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-colors duration-200
        ${className}
      `}
      aria-pressed={isHighContrast}
      aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
    >
      <span className="sr-only">
        {isHighContrast ? 'Disable' : 'Enable'} high contrast mode
      </span>
      
      {/* High contrast icon */}
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20" />
        <path d="M2 12h20" />
      </svg>
      
      {children || (
        <span className="text-sm font-medium">
          {isHighContrast ? 'High Contrast On' : 'High Contrast Off'}
        </span>
      )}
    </button>
  );
}

// High contrast indicator component
export function HighContrastIndicator() {
  const { isHighContrast } = useTheme();

  if (!isHighContrast) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 px-3 py-2 bg-black text-white border-2 border-white text-sm font-bold"
      role="status"
      aria-live="polite"
    >
      High Contrast Mode Active
    </div>
  );
}

// Hook for high contrast aware styling
export function useHighContrastStyles() {
  const { isHighContrast } = useTheme();

  const getHighContrastStyles = (normalStyles: React.CSSProperties, highContrastStyles: React.CSSProperties) => {
    return isHighContrast ? { ...normalStyles, ...highContrastStyles } : normalStyles;
  };

  const getHighContrastClasses = (normalClasses: string, highContrastClasses: string) => {
    return isHighContrast ? `${normalClasses} ${highContrastClasses}` : normalClasses;
  };

  return {
    isHighContrast,
    getHighContrastStyles,
    getHighContrastClasses,
  };
}

// Component for conditionally rendering content based on high contrast mode
interface HighContrastConditionalProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  invert?: boolean; // If true, shows children when NOT in high contrast mode
}

export function HighContrastConditional({ 
  children, 
  fallback = null, 
  invert = false 
}: HighContrastConditionalProps) {
  const { isHighContrast } = useTheme();
  
  const shouldShow = invert ? !isHighContrast : isHighContrast;
  
  return <>{shouldShow ? children : fallback}</>;
}

// High contrast color utilities
export const highContrastColors = {
  background: COLORS.highContrast.background,
  foreground: COLORS.highContrast.foreground,
  primary: COLORS.highContrast.primary,
  secondary: COLORS.highContrast.secondary,
  accent: COLORS.highContrast.accent,
  border: COLORS.highContrast.border,
  muted: COLORS.highContrast.muted,
  
  // Semantic colors for high contrast
  success: '#008000',
  warning: '#FF8C00',
  error: '#FF0000',
  info: '#0000FF',
  
  // Interactive states
  hover: '#000080',
  active: '#800080',
  disabled: '#808080',
  
  // Focus
  focusRing: '#FF0000',
};

export default HighContrastTheme;