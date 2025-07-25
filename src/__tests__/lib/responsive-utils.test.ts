import {
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
  createContainerStyles,
  ResponsiveUtils,
} from '@/lib/responsive-utils';
import { BREAKPOINTS } from '@/lib/design-tokens';

describe('Responsive Utils', () => {
  describe('getBreakpointFromWidth', () => {
    it('should return correct breakpoint for various widths', () => {
      expect(getBreakpointFromWidth(400)).toBe('xs');
      expect(getBreakpointFromWidth(600)).toBe('sm');
      expect(getBreakpointFromWidth(800)).toBe('md');
      expect(getBreakpointFromWidth(1100)).toBe('lg');
      expect(getBreakpointFromWidth(1300)).toBe('xl');
      expect(getBreakpointFromWidth(1600)).toBe('2xl');
    });

    it('should handle edge cases', () => {
      expect(getBreakpointFromWidth(0)).toBe('xs');
      expect(getBreakpointFromWidth(BREAKPOINTS.sm)).toBe('sm');
      expect(getBreakpointFromWidth(BREAKPOINTS.lg - 1)).toBe('md');
    });
  });

  describe('getLayoutType', () => {
    it('should return correct layout type', () => {
      expect(getLayoutType(500)).toBe('mobile');
      expect(getLayoutType(800)).toBe('tablet');
      expect(getLayoutType(1200)).toBe('desktop');
    });

    it('should handle boundary values', () => {
      expect(getLayoutType(BREAKPOINTS.md)).toBe('tablet');
      expect(getLayoutType(BREAKPOINTS.desktop)).toBe('desktop');
      expect(getLayoutType(BREAKPOINTS.md - 1)).toBe('mobile');
    });
  });

  describe('canUseSplitScreen', () => {
    it('should return true for widths >= split-screen breakpoint', () => {
      expect(canUseSplitScreen(1200)).toBe(true);
      expect(canUseSplitScreen(1500)).toBe(true);
    });

    it('should return false for widths < split-screen breakpoint', () => {
      expect(canUseSplitScreen(1000)).toBe(false);
      expect(canUseSplitScreen(800)).toBe(false);
    });
  });

  describe('calculateContainerWidth', () => {
    it('should calculate correct widths with default ratio', () => {
      const result = calculateContainerWidth(1200);
      
      expect(result.dividerWidth).toBe(4);
      expect(result.appWidth).toBeGreaterThan(400);
      expect(result.chatWidth).toBeGreaterThan(300);
      expect(result.canResize).toBe(true);
    });

    it('should handle custom split ratio', () => {
      const result = calculateContainerWidth(1200, 0.7);
      
      expect(result.appWidth).toBeGreaterThan(result.chatWidth);
    });

    it('should enforce minimum widths', () => {
      const result = calculateContainerWidth(600, 0.9);
      
      expect(result.appWidth).toBeGreaterThanOrEqual(400);
      expect(result.chatWidth).toBeGreaterThanOrEqual(300);
    });

    it('should set canResize to false when constraints not met', () => {
      const result = calculateContainerWidth(500);
      
      expect(result.canResize).toBe(false);
    });
  });

  describe('calculateGridColumns', () => {
    it('should calculate correct number of columns', () => {
      expect(calculateGridColumns(800, 200)).toBe(4);
      expect(calculateGridColumns(600, 200)).toBe(3);
      expect(calculateGridColumns(400, 200)).toBe(2);
    });

    it('should respect max columns limit', () => {
      expect(calculateGridColumns(1200, 100, 3)).toBe(3);
    });

    it('should handle edge cases', () => {
      expect(calculateGridColumns(100, 200)).toBe(0);
      expect(calculateGridColumns(0, 200)).toBe(0);
    });
  });

  describe('getComponentSize', () => {
    it('should return correct size for breakpoint', () => {
      const sizes = {
        xs: 'small',
        md: 'medium',
        lg: 'large',
      };

      expect(getComponentSize('xs', sizes)).toBe('small');
      expect(getComponentSize('md', sizes)).toBe('medium');
      expect(getComponentSize('lg', sizes)).toBe('large');
    });

    it('should fall back to smaller breakpoint if current not available', () => {
      const sizes = {
        xs: 'small',
        lg: 'large',
      };

      expect(getComponentSize('md', sizes)).toBe('small');
      expect(getComponentSize('sm', sizes)).toBe('small');
    });

    it('should handle empty sizes object', () => {
      expect(getComponentSize('md', {})).toBe('auto');
    });
  });

  describe('generateResponsiveClasses', () => {
    it('should generate correct responsive classes', () => {
      const result = generateResponsiveClasses('text-base', {
        md: 'text-lg',
        lg: 'text-xl',
      });

      expect(result).toBe('text-base md:text-lg lg:text-xl');
    });

    it('should handle xs breakpoint without prefix', () => {
      const result = generateResponsiveClasses('p-4', {
        xs: 'p-2',
        md: 'p-6',
      });

      expect(result).toBe('p-4 p-2 md:p-6');
    });

    it('should skip undefined values', () => {
      const result = generateResponsiveClasses('base', {
        md: 'medium',
        lg: undefined,
        xl: 'extra-large',
      });

      expect(result).toBe('base md:medium xl:extra-large');
    });
  });

  describe('validateSplitRatio', () => {
    it('should validate correct ratios', () => {
      const result = validateSplitRatio(0.6, 1200);
      
      expect(result.isValid).toBe(true);
      expect(result.ratio).toBe(0.6);
      expect(result.adjustedRatio).toBeUndefined();
    });

    it('should adjust invalid ratios', () => {
      const result = validateSplitRatio(0.9, 800);
      
      expect(result.isValid).toBe(false);
      expect(result.adjustedRatio).toBeDefined();
      expect(result.adjustedRatio).toBeLessThan(0.9);
    });

    it('should handle minimum ratio constraints', () => {
      const result = validateSplitRatio(0.1, 1200);
      
      expect(result.isValid).toBe(false);
      expect(result.adjustedRatio).toBeGreaterThan(0.1);
    });
  });

  describe('getResponsiveFontSize', () => {
    it('should return correct font sizes', () => {
      expect(getResponsiveFontSize('md', 'base')).toBe('1rem');
      expect(getResponsiveFontSize('lg', 'base')).toBe('1.05rem');
      expect(getResponsiveFontSize('md', 'lg')).toBe('1.125rem');
    });

    it('should handle different scales', () => {
      const xs = getResponsiveFontSize('md', 'xs');
      const xl = getResponsiveFontSize('md', 'xl');
      
      expect(parseFloat(xs)).toBeLessThan(parseFloat(xl));
    });
  });

  describe('getResponsiveSpacing', () => {
    it('should return correct spacing values', () => {
      expect(getResponsiveSpacing('md', 'md')).toBe('1.5rem');
      expect(getResponsiveSpacing('lg', 'md')).toBe('1.65rem');
    });

    it('should handle different sizes', () => {
      const sm = getResponsiveSpacing('md', 'sm');
      const lg = getResponsiveSpacing('md', 'lg');
      
      expect(parseFloat(sm)).toBeLessThan(parseFloat(lg));
    });
  });

  describe('createContainerStyles', () => {
    it('should create correct container styles', () => {
      const result = createContainerStyles(500);
      
      expect(result['container-sm']).toBe(true);
      expect(result['container-md']).toBe(false);
      expect(result['container-lg']).toBe(false);
    });

    it('should handle custom breakpoints', () => {
      const result = createContainerStyles(700, { sm: 600, md: 800 });
      
      expect(result['container-sm']).toBe(true);
      expect(result['container-md']).toBe(false);
    });
  });

  describe('ResponsiveUtils collection', () => {
    it('should export all utility functions', () => {
      expect(ResponsiveUtils.getBreakpointFromWidth).toBeDefined();
      expect(ResponsiveUtils.getLayoutType).toBeDefined();
      expect(ResponsiveUtils.canUseSplitScreen).toBeDefined();
      expect(ResponsiveUtils.calculateContainerWidth).toBeDefined();
      expect(ResponsiveUtils.calculateGridColumns).toBeDefined();
      expect(ResponsiveUtils.getComponentSize).toBeDefined();
      expect(ResponsiveUtils.generateResponsiveClasses).toBeDefined();
      expect(ResponsiveUtils.validateSplitRatio).toBeDefined();
      expect(ResponsiveUtils.getResponsiveFontSize).toBeDefined();
      expect(ResponsiveUtils.getResponsiveSpacing).toBeDefined();
      expect(ResponsiveUtils.createContainerStyles).toBeDefined();
    });
  });
});