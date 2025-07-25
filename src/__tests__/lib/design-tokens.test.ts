import {
  BREAKPOINTS,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  ANIMATIONS,
  INTERACTIVE,
  getBreakpoint,
  getColor,
  getSpacing,
  getAccessibleColor,
  calculateContrastRatio,
  getFontSizeForPreference,
  getAnimationDuration,
  getTouchTargetSize,
  getFocusRingStyles,
  generateCSSCustomProperties,
  generateThemeCSS,
  createMediaQuery,
  createMaxWidthMediaQuery,
  createResponsiveValue,
  createSplitScreenStyles,
} from '@/lib/design-tokens';

// Mock window.matchMedia for testing
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('Design Tokens', () => {
  beforeEach(() => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
  });

  describe('BREAKPOINTS', () => {
    it('should have all required breakpoints', () => {
      expect(BREAKPOINTS.xs).toBe(475);
      expect(BREAKPOINTS.sm).toBe(640);
      expect(BREAKPOINTS.md).toBe(768);
      expect(BREAKPOINTS.lg).toBe(1024);
      expect(BREAKPOINTS.xl).toBe(1280);
      expect(BREAKPOINTS['2xl']).toBe(1536);
      expect(BREAKPOINTS.desktop).toBe(1024);
      expect(BREAKPOINTS['split-screen']).toBe(1200);
    });
  });

  describe('SPACING', () => {
    it('should follow 8px grid system', () => {
      expect(SPACING[0]).toBe('0');
      expect(SPACING[1]).toBe('0.25rem'); // 4px
      expect(SPACING[2]).toBe('0.5rem');  // 8px
      expect(SPACING[4]).toBe('1rem');    // 16px
      expect(SPACING[8]).toBe('2rem');    // 32px
    });

    it('should have accessibility-focused spacing', () => {
      expect(SPACING['touch-target-min']).toBe('44px');
      expect(SPACING['focus-ring-offset']).toBe('2px');
      expect(SPACING['focus-ring-width']).toBe('3px');
      expect(SPACING['content-max-width']).toBe('65ch');
    });
  });

  describe('COLORS', () => {
    it('should have primary color scale', () => {
      expect(COLORS.primary[50]).toBe('#F8F4F9');
      expect(COLORS.primary[500]).toBe('#B48CBE');
      expect(COLORS.primary[950]).toBe('#34113F');
    });

    it('should have semantic colors', () => {
      expect(COLORS.semantic.success[500]).toBe('#10B981');
      expect(COLORS.semantic.error[500]).toBe('#EF4444');
      expect(COLORS.semantic.warning[700]).toBe('#B45309');
      expect(COLORS.semantic.info[500]).toBe('#3B82F6');
    });

    it('should have high contrast colors', () => {
      expect(COLORS.highContrast.background).toBe('#FFFFFF');
      expect(COLORS.highContrast.foreground).toBe('#000000');
      expect(COLORS.highContrast.primary).toBe('#0000FF');
    });

    it('should have focus ring colors', () => {
      expect(COLORS.focus.ring).toBe('#3B82F6');
      expect(COLORS.focus['ring-offset']).toBe('#FFFFFF');
    });
  });

  describe('TYPOGRAPHY', () => {
    it('should have font families with fallbacks', () => {
      expect(TYPOGRAPHY.fontFamily.primary).toContain('Inter');
      expect(TYPOGRAPHY.fontFamily.primary).toContain('-apple-system');
      expect(TYPOGRAPHY.fontFamily.primary).toContain('sans-serif');
    });

    it('should have responsive font sizes', () => {
      expect(TYPOGRAPHY.fontSize.xs[0]).toBe('0.75rem');
      expect(TYPOGRAPHY.fontSize.base[0]).toBe('1rem');
      expect(TYPOGRAPHY.fontSize.xl[0]).toBe('1.25rem');
    });

    it('should have user preference font sizes', () => {
      expect(TYPOGRAPHY.fontSize['user-small'][0]).toBe('0.875rem');
      expect(TYPOGRAPHY.fontSize['user-medium'][0]).toBe('1rem');
      expect(TYPOGRAPHY.fontSize['user-large'][0]).toBe('1.125rem');
      expect(TYPOGRAPHY.fontSize['user-extra-large'][0]).toBe('1.25rem');
    });

    it('should have semantic font weights', () => {
      expect(TYPOGRAPHY.fontWeight.body).toBe('400');
      expect(TYPOGRAPHY.fontWeight.heading).toBe('600');
      expect(TYPOGRAPHY.fontWeight.strong).toBe('700');
    });

    it('should have content-specific line heights', () => {
      expect(TYPOGRAPHY.lineHeight.heading).toBe('1.2');
      expect(TYPOGRAPHY.lineHeight.body).toBe('1.6');
      expect(TYPOGRAPHY.lineHeight.ui).toBe('1.5');
    });
  });

  describe('ANIMATIONS', () => {
    it('should have duration scale', () => {
      expect(ANIMATIONS.duration.instant).toBe('0ms');
      expect(ANIMATIONS.duration.fast).toBe('150ms');
      expect(ANIMATIONS.duration.normal).toBe('300ms');
      expect(ANIMATIONS.duration.slow).toBe('500ms');
    });

    it('should have reduced motion alternatives', () => {
      expect(ANIMATIONS.reducedMotion.duration).toBe('0ms');
      expect(ANIMATIONS.reducedMotion.easing).toBe('linear');
    });

    it('should have animation presets', () => {
      expect(ANIMATIONS.presets['fade-in'].duration).toBe('300ms');
      expect(ANIMATIONS.presets['focus-ring'].duration).toBe('150ms');
    });
  });

  describe('INTERACTIVE', () => {
    it('should have WCAG compliant touch targets', () => {
      expect(INTERACTIVE.touchTarget.minimum).toBe('44px');
      expect(INTERACTIVE.touchTarget.comfortable).toBe('48px');
      expect(INTERACTIVE.touchTarget.large).toBe('56px');
    });

    it('should have focus ring specifications', () => {
      expect(INTERACTIVE.focusRing.width).toBe('3px');
      expect(INTERACTIVE.focusRing.offset).toBe('2px');
      expect(INTERACTIVE.focusRing.color).toBe('#3B82F6');
    });

    it('should have button specifications', () => {
      expect(INTERACTIVE.button.minHeight).toBe('44px');
      expect(INTERACTIVE.button.minWidth).toBe('44px');
    });

    it('should have form specifications', () => {
      expect(INTERACTIVE.form.input.minHeight).toBe('44px');
      expect(INTERACTIVE.form.input.padding).toBe('0.75rem');
    });
  });
});

describe('Design Token Utilities', () => {
  describe('getBreakpoint', () => {
    it('should return correct breakpoint values', () => {
      expect(getBreakpoint('sm')).toBe(640);
      expect(getBreakpoint('lg')).toBe(1024);
      expect(getBreakpoint('desktop')).toBe(1024);
    });
  });

  describe('getColor', () => {
    it('should return color values for simple paths', () => {
      expect(getColor('primary.500')).toBe('#B48CBE');
      expect(getColor('semantic.success.500')).toBe('#10B981');
    });

    it('should throw error for invalid paths', () => {
      expect(() => getColor('invalid.path')).toThrow('Color token not found: invalid.path');
    });
  });

  describe('getSpacing', () => {
    it('should return spacing values', () => {
      expect(getSpacing('4')).toBe('1rem');
      expect(getSpacing('touch-target-min')).toBe('44px');
    });
  });

  describe('calculateContrastRatio', () => {
    it('should calculate contrast ratios', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 0); // White on black has ~21:1 ratio
    });

    it('should handle same colors', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#FFFFFF');
      expect(ratio).toBe(1); // Same colors have 1:1 ratio
    });
  });

  describe('getAccessibleColor', () => {
    it('should validate WCAG AA compliance', () => {
      const result = getAccessibleColor('#000000', '#FFFFFF', 'AA');
      expect(result.passes).toBe(true);
      expect(result.contrastRatio).toBeGreaterThan(4.5);
    });

    it('should validate WCAG AAA compliance', () => {
      const result = getAccessibleColor('#000000', '#FFFFFF', 'AAA');
      expect(result.passes).toBe(true);
      expect(result.contrastRatio).toBeGreaterThan(7);
    });
  });

  describe('getFontSizeForPreference', () => {
    it('should return correct font sizes for preferences', () => {
      expect(getFontSizeForPreference('small')).toBe('0.875rem');
      expect(getFontSizeForPreference('medium')).toBe('1rem');
      expect(getFontSizeForPreference('large')).toBe('1.125rem');
      expect(getFontSizeForPreference('extra-large')).toBe('1.25rem');
    });
  });

  describe('getAnimationDuration', () => {
    it('should return normal duration when reduced motion is not preferred', () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      expect(getAnimationDuration('fast')).toBe('150ms');
      expect(getAnimationDuration('normal')).toBe('300ms');
    });

    it('should return zero duration when reduced motion is preferred', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      expect(getAnimationDuration('fast')).toBe('0ms');
      expect(getAnimationDuration('normal')).toBe('0ms');
    });

    it('should respect respectReducedMotion parameter', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      expect(getAnimationDuration('fast', false)).toBe('150ms');
    });
  });

  describe('getTouchTargetSize', () => {
    it('should return correct touch target sizes', () => {
      expect(getTouchTargetSize('minimum')).toBe('44px');
      expect(getTouchTargetSize('comfortable')).toBe('48px');
      expect(getTouchTargetSize('large')).toBe('56px');
    });

    it('should default to minimum size', () => {
      expect(getTouchTargetSize()).toBe('44px');
    });
  });

  describe('getFocusRingStyles', () => {
    it('should return focus ring styles object', () => {
      const styles = getFocusRingStyles();
      expect(styles.outline).toBe('3px solid #3B82F6');
      expect(styles.outlineOffset).toBe('2px');
      expect(styles.borderRadius).toBe('4px');
    });
  });
});

describe('CSS Generation', () => {
  describe('generateCSSCustomProperties', () => {
    it('should generate basic CSS custom properties', () => {
      const properties = generateCSSCustomProperties();
      
      expect(properties['--breakpoint-sm']).toBe('640px');
      expect(properties['--color-primary-500']).toBe('#B48CBE');
      expect(properties['--spacing-4']).toBe('1rem');
      expect(properties['--font-size-base']).toBe('1rem');
      expect(properties['--animation-duration-fast']).toBe('150ms');
    });

    it('should apply high contrast colors when enabled', () => {
      const properties = generateCSSCustomProperties({ highContrast: true });
      
      expect(properties['--color-primary-500']).toBe('#0000FF');
      expect(properties['--color-background']).toBe('#FFFFFF');
      expect(properties['--color-foreground']).toBe('#000000');
    });

    it('should apply reduced motion when enabled', () => {
      const properties = generateCSSCustomProperties({ reducedMotion: true });
      
      expect(properties['--animation-duration-fast']).toBe('0ms');
      expect(properties['--animation-duration-normal']).toBe('0ms');
      expect(properties['--animation-easing-out']).toBe('linear');
    });

    it('should apply font size preferences', () => {
      const smallProperties = generateCSSCustomProperties({ fontSize: 'small' });
      const largeProperties = generateCSSCustomProperties({ fontSize: 'large' });
      
      expect(smallProperties['--font-size-base']).toBe('0.875rem');
      expect(largeProperties['--font-size-base']).toBe('1.125rem');
    });
  });

  describe('generateThemeCSS', () => {
    it('should generate complete CSS theme', () => {
      const css = generateThemeCSS();
      
      expect(css).toContain(':root {');
      expect(css).toContain('--color-primary-500:');
      expect(css).toContain('@media (prefers-contrast: high)');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
      expect(css).toContain('.focus-visible-ring');
      expect(css).toContain('.sr-only');
    });

    it('should include accessibility utilities', () => {
      const css = generateThemeCSS();
      
      expect(css).toContain('.touch-target');
      expect(css).toContain('.touch-target-comfortable');
      expect(css).toContain('min-height: var(--touch-target-minimum)');
    });
  });
});

describe('Media Query Helpers', () => {
  describe('createMediaQuery', () => {
    it('should create min-width media queries', () => {
      expect(createMediaQuery('sm')).toBe('@media (min-width: 640px)');
      expect(createMediaQuery('lg')).toBe('@media (min-width: 1024px)');
    });
  });

  describe('createMaxWidthMediaQuery', () => {
    it('should create max-width media queries', () => {
      expect(createMaxWidthMediaQuery('sm')).toBe('@media (max-width: 639px)');
      expect(createMaxWidthMediaQuery('lg')).toBe('@media (max-width: 1023px)');
    });
  });
});

describe('Responsive Utilities', () => {
  describe('createResponsiveValue', () => {
    it('should create responsive value arrays', () => {
      const values = createResponsiveValue({
        default: '1rem',
        sm: '1.25rem',
        lg: '1.5rem',
      });
      
      expect(values).toEqual(['1rem', '1.25rem', undefined, '1.5rem', undefined, undefined]);
    });

    it('should filter out undefined values', () => {
      const values = createResponsiveValue({
        default: '1rem',
        md: '1.25rem',
      });
      
      expect(values).toHaveLength(2);
      expect(values).toContain('1rem');
      expect(values).toContain('1.25rem');
    });
  });

  describe('createSplitScreenStyles', () => {
    it('should create split screen CSS variables', () => {
      const styles = createSplitScreenStyles(0.7);
      
      expect(styles['--app-panel-width']).toBe('calc(70% - 2px)');
      expect(styles['--chat-panel-width']).toBe('calc(30% - 2px)');
      expect(styles['--split-divider-width']).toBe('4px');
    });

    it('should use default ratio when not provided', () => {
      const styles = createSplitScreenStyles();
      
      expect(styles['--app-panel-width']).toBe('calc(65% - 2px)');
      expect(styles['--chat-panel-width']).toBe('calc(35% - 2px)');
    });
  });
});