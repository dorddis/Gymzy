'use client';

import React, { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { TYPOGRAPHY } from '@/lib/design-tokens';

// Responsive typography CSS styles
const RESPONSIVE_TYPOGRAPHY_STYLES = `
/* Responsive Typography System */

/* Base font size scaling */
.font-size-small {
  --font-size-base: ${TYPOGRAPHY.fontSize['user-small'][0]};
  --line-height-base: ${TYPOGRAPHY.fontSize['user-small'][1].lineHeight};
}

.font-size-medium {
  --font-size-base: ${TYPOGRAPHY.fontSize['user-medium'][0]};
  --line-height-base: ${TYPOGRAPHY.fontSize['user-medium'][1].lineHeight};
}

.font-size-large {
  --font-size-base: ${TYPOGRAPHY.fontSize['user-large'][0]};
  --line-height-base: ${TYPOGRAPHY.fontSize['user-large'][1].lineHeight};
}

.font-size-extra-large {
  --font-size-base: ${TYPOGRAPHY.fontSize['user-extra-large'][0]};
  --line-height-base: ${TYPOGRAPHY.fontSize['user-extra-large'][1].lineHeight};
}

/* Responsive heading scale */
.responsive-typography h1,
.responsive-typography .text-h1 {
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  line-height: ${TYPOGRAPHY.lineHeight.heading};
  font-weight: ${TYPOGRAPHY.fontWeight.heading};
  margin-bottom: 1rem;
}

.responsive-typography h2,
.responsive-typography .text-h2 {
  font-size: clamp(1.5rem, 3.5vw, 1.875rem);
  line-height: ${TYPOGRAPHY.lineHeight.heading};
  font-weight: ${TYPOGRAPHY.fontWeight.heading};
  margin-bottom: 0.875rem;
}

.responsive-typography h3,
.responsive-typography .text-h3 {
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  line-height: ${TYPOGRAPHY.lineHeight.heading};
  font-weight: ${TYPOGRAPHY.fontWeight.heading};
  margin-bottom: 0.75rem;
}

.responsive-typography h4,
.responsive-typography .text-h4 {
  font-size: clamp(1.125rem, 2.5vw, 1.25rem);
  line-height: ${TYPOGRAPHY.lineHeight.heading};
  font-weight: ${TYPOGRAPHY.fontWeight.heading};
  margin-bottom: 0.625rem;
}

.responsive-typography h5,
.responsive-typography .text-h5 {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: ${TYPOGRAPHY.lineHeight.heading};
  font-weight: ${TYPOGRAPHY.fontWeight.heading};
  margin-bottom: 0.5rem;
}

.responsive-typography h6,
.responsive-typography .text-h6 {
  font-size: var(--font-size-base);
  line-height: ${TYPOGRAPHY.lineHeight.heading};
  font-weight: ${TYPOGRAPHY.fontWeight.heading};
  margin-bottom: 0.5rem;
}

/* Body text scaling */
.responsive-typography p,
.responsive-typography .text-body {
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  font-weight: ${TYPOGRAPHY.fontWeight.body};
  margin-bottom: 1rem;
}

.responsive-typography .text-body-large {
  font-size: calc(var(--font-size-base) * 1.125);
  line-height: ${TYPOGRAPHY.lineHeight.relaxed};
  font-weight: ${TYPOGRAPHY.fontWeight.body};
}

.responsive-typography .text-body-small {
  font-size: calc(var(--font-size-base) * 0.875);
  line-height: ${TYPOGRAPHY.lineHeight.normal};
  font-weight: ${TYPOGRAPHY.fontWeight.body};
}

/* UI text scaling */
.responsive-typography .text-ui-large {
  font-size: calc(var(--font-size-base) * 1);
  line-height: ${TYPOGRAPHY.lineHeight.ui};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
}

.responsive-typography .text-ui-base {
  font-size: calc(var(--font-size-base) * 0.875);
  line-height: ${TYPOGRAPHY.lineHeight.ui};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
}

.responsive-typography .text-ui-small {
  font-size: calc(var(--font-size-base) * 0.75);
  line-height: ${TYPOGRAPHY.lineHeight.ui};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
}

/* Label and caption scaling */
.responsive-typography label,
.responsive-typography .text-label {
  font-size: calc(var(--font-size-base) * 0.875);
  line-height: ${TYPOGRAPHY.lineHeight.normal};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  display: block;
  margin-bottom: 0.5rem;
}

.responsive-typography .text-caption {
  font-size: calc(var(--font-size-base) * 0.75);
  line-height: ${TYPOGRAPHY.lineHeight.caption};
  font-weight: ${TYPOGRAPHY.fontWeight.body};
  color: var(--color-muted, #6B7280);
}

.responsive-typography .text-overline {
  font-size: calc(var(--font-size-base) * 0.75);
  line-height: ${TYPOGRAPHY.lineHeight.normal};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  letter-spacing: ${TYPOGRAPHY.letterSpacing.wide};
  text-transform: uppercase;
}

/* Button text scaling */
.responsive-typography button,
.responsive-typography .btn {
  font-size: var(--font-size-base);
  line-height: ${TYPOGRAPHY.lineHeight.ui};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
}

.responsive-typography .btn-small {
  font-size: calc(var(--font-size-base) * 0.875);
}

.responsive-typography .btn-large {
  font-size: calc(var(--font-size-base) * 1.125);
}

/* Input text scaling */
.responsive-typography input,
.responsive-typography select,
.responsive-typography textarea {
  font-size: var(--font-size-base);
  line-height: ${TYPOGRAPHY.lineHeight.normal};
  font-family: inherit;
}

/* Link text scaling */
.responsive-typography a {
  font-size: inherit;
  line-height: inherit;
  font-weight: inherit;
}

/* List text scaling */
.responsive-typography ul,
.responsive-typography ol {
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  margin-bottom: 1rem;
}

.responsive-typography li {
  margin-bottom: 0.25rem;
}

/* Table text scaling */
.responsive-typography table {
  font-size: var(--font-size-base);
  line-height: ${TYPOGRAPHY.lineHeight.normal};
}

.responsive-typography th {
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
}

.responsive-typography td {
  font-weight: ${TYPOGRAPHY.fontWeight.body};
}

/* Code text scaling */
.responsive-typography code,
.responsive-typography pre {
  font-family: ${TYPOGRAPHY.fontFamily.mono.join(', ')};
  font-size: calc(var(--font-size-base) * 0.875);
  line-height: ${TYPOGRAPHY.lineHeight.normal};
}

/* Responsive breakpoint adjustments */
@media (max-width: 640px) {
  .responsive-typography {
    /* Slightly smaller text on mobile for better fit */
    --font-size-base: calc(var(--font-size-base) * 0.95);
  }
  
  .responsive-typography h1,
  .responsive-typography .text-h1 {
    font-size: clamp(1.5rem, 6vw, 2rem);
  }
  
  .responsive-typography h2,
  .responsive-typography .text-h2 {
    font-size: clamp(1.375rem, 5vw, 1.75rem);
  }
}

@media (min-width: 1024px) {
  .responsive-typography {
    /* Slightly larger text on desktop for better readability */
    --font-size-base: calc(var(--font-size-base) * 1.05);
  }
}

/* Content width constraints for optimal readability */
.responsive-typography .content-width {
  max-width: ${TYPOGRAPHY.contentWidth || '65ch'};
  margin-left: auto;
  margin-right: auto;
}

.responsive-typography .content-width-narrow {
  max-width: 45ch;
  margin-left: auto;
  margin-right: auto;
}

.responsive-typography .content-width-wide {
  max-width: 85ch;
  margin-left: auto;
  margin-right: auto;
}

/* Accessibility enhancements */
.responsive-typography {
  /* Improve text rendering */
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* Better word breaking */
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

/* Focus states for text elements */
.responsive-typography *:focus {
  outline: 2px solid var(--focus-ring-color, #3B82F6);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Selection styles */
.responsive-typography ::selection {
  background-color: var(--color-primary-200, #E1D1E5);
  color: var(--color-primary-900, #432C49);
}

/* Print styles */
@media print {
  .responsive-typography {
    font-size: 12pt;
    line-height: 1.4;
    color: black;
    background: white;
  }
  
  .responsive-typography h1 { font-size: 18pt; }
  .responsive-typography h2 { font-size: 16pt; }
  .responsive-typography h3 { font-size: 14pt; }
  .responsive-typography h4,
  .responsive-typography h5,
  .responsive-typography h6 { font-size: 12pt; }
}
`;

interface ResponsiveTypographyProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTypography({ children, className = '' }: ResponsiveTypographyProps) {
  const { currentFontSize } = useTheme();

  useEffect(() => {
    // Inject responsive typography styles
    const styleId = 'responsive-typography-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = RESPONSIVE_TYPOGRAPHY_STYLES;
      document.head.appendChild(styleElement);
    }

    return () => {
      // Cleanup on unmount (only if this is the last instance)
      const styleElement = document.getElementById('responsive-typography-styles');
      if (styleElement && !document.querySelector('.responsive-typography')) {
        styleElement.remove();
      }
    };
  }, []);

  return (
    <div className={`responsive-typography font-size-${currentFontSize} ${className}`}>
      {children}
    </div>
  );
}

// Font size control component
interface FontSizeControlProps {
  className?: string;
  showLabels?: boolean;
}

export function FontSizeControl({ className = '', showLabels = true }: FontSizeControlProps) {
  const { currentFontSize, setFontSize } = useTheme();

  const fontSizes = [
    { value: 'small' as const, label: 'Small', shortLabel: 'S' },
    { value: 'medium' as const, label: 'Medium', shortLabel: 'M' },
    { value: 'large' as const, label: 'Large', shortLabel: 'L' },
    { value: 'extra-large' as const, label: 'Extra Large', shortLabel: 'XL' },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabels && (
        <label className="text-sm font-medium text-gray-700">
          Font Size:
        </label>
      )}
      
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-md">
        {fontSizes.map((size) => (
          <button
            key={size.value}
            onClick={() => setFontSize(size.value)}
            className={`
              px-3 py-1 text-sm font-medium rounded transition-colors
              ${currentFontSize === size.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
            aria-pressed={currentFontSize === size.value}
            aria-label={`Set font size to ${size.label}`}
          >
            {showLabels ? size.label : size.shortLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

// Typography scale preview component
export function TypographyScalePreview() {
  const { currentFontSize } = useTheme();

  return (
    <ResponsiveTypography className="space-y-4 p-6 border border-gray-200 rounded-lg">
      <div className="text-caption text-gray-500 mb-4">
        Current font size: {currentFontSize}
      </div>
      
      <h1>Heading 1 - Main Page Title</h1>
      <h2>Heading 2 - Section Title</h2>
      <h3>Heading 3 - Subsection Title</h3>
      <h4>Heading 4 - Component Title</h4>
      <h5>Heading 5 - Small Title</h5>
      <h6>Heading 6 - Micro Title</h6>
      
      <p className="text-body-large">
        Large body text - Used for important content that needs emphasis.
      </p>
      
      <p>
        Regular body text - The standard text size for most content. This should be comfortable to read at all font size preferences.
      </p>
      
      <p className="text-body-small">
        Small body text - Used for secondary information or captions.
      </p>
      
      <div className="space-y-2">
        <div className="text-ui-large">UI Large - Navigation items</div>
        <div className="text-ui-base">UI Base - Button text</div>
        <div className="text-ui-small">UI Small - Form labels</div>
      </div>
      
      <div className="space-y-1">
        <label>Form Label</label>
        <div className="text-caption">Caption text for additional information</div>
        <div className="text-overline">Overline Text</div>
      </div>
      
      <code>Code text - monospace font for technical content</code>
    </ResponsiveTypography>
  );
}

// Hook for responsive typography utilities
export function useResponsiveTypography() {
  const { currentFontSize } = useTheme();

  const getScaledFontSize = (baseSize: string, scale: number = 1) => {
    const baseSizeMap = {
      'small': '0.875rem',
      'medium': '1rem',
      'large': '1.125rem',
      'extra-large': '1.25rem',
    };
    
    const base = baseSizeMap[currentFontSize];
    const baseValue = parseFloat(base);
    return `${baseValue * scale}rem`;
  };

  const getTypographyClasses = (variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'label') => {
    const baseClasses = 'responsive-typography';
    const variantClasses = {
      h1: 'text-h1',
      h2: 'text-h2',
      h3: 'text-h3',
      h4: 'text-h4',
      h5: 'text-h5',
      h6: 'text-h6',
      body: 'text-body',
      caption: 'text-caption',
      label: 'text-label',
    };
    
    return `${baseClasses} ${variantClasses[variant]}`;
  };

  const getOptimalLineHeight = (fontSize: string) => {
    const size = parseFloat(fontSize);
    if (size <= 0.875) return '1.4'; // Small text
    if (size <= 1) return '1.5'; // Base text
    if (size <= 1.25) return '1.6'; // Large text
    return '1.2'; // Headings
  };

  return {
    currentFontSize,
    getScaledFontSize,
    getTypographyClasses,
    getOptimalLineHeight,
  };
}

// Text component with responsive typography
interface ResponsiveTextProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'body-large' | 'body-small' | 'caption' | 'label' | 'overline';
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function ResponsiveText({ 
  as: Component = 'p', 
  variant = 'body', 
  children, 
  className = '', 
  ...props 
}: ResponsiveTextProps) {
  const { getTypographyClasses } = useResponsiveTypography();
  
  const variantClass = variant.startsWith('body') ? `text-${variant}` : 
                     variant === 'overline' ? 'text-overline' :
                     variant === 'caption' ? 'text-caption' :
                     variant === 'label' ? 'text-label' :
                     `text-${variant}`;

  return React.createElement(
    Component,
    {
      className: `responsive-typography ${variantClass} ${className}`,
      ...props,
    },
    children
  );
}

export default ResponsiveTypography;