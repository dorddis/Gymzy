import {
  calculatePanelDimensions,
  validateSplitRatio,
  positionToSplitRatio,
  getSplitScreenCSSProperties,
  getResponsiveGridClasses,
  getResponsiveFontSizes,
  saveSplitRatio,
  loadSplitRatio,
  LAYOUT_CONFIG,
} from '@/lib/layout-utils';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('calculatePanelDimensions', () => {
  it('should calculate correct dimensions with default ratio', () => {
    const result = calculatePanelDimensions(1000);
    
    expect(result.appPanelWidth).toBe(650); // 65% of 1000
    expect(result.chatPanelWidth).toBe(346); // 1000 - 650 - 4 (resize handle)
    expect(result.splitRatio).toBe(0.65);
    expect(result.containerWidth).toBe(1000);
    expect(result.resizeHandlePosition).toBe(650);
  });

  it('should calculate correct dimensions with custom ratio', () => {
    const result = calculatePanelDimensions(1200, 0.7);
    
    expect(result.appPanelWidth).toBe(840); // 70% of 1200
    expect(result.chatPanelWidth).toBe(356); // 1200 - 840 - 4
    expect(result.splitRatio).toBe(0.7);
  });

  it('should account for resize handle width', () => {
    const result = calculatePanelDimensions(800, 0.5);
    
    expect(result.appPanelWidth).toBe(400);
    expect(result.chatPanelWidth).toBe(396); // 800 - 400 - 4
    expect(result.resizeHandlePosition).toBe(400);
  });
});

describe('validateSplitRatio', () => {
  it('should validate acceptable ratios', () => {
    const result = validateSplitRatio(0.65, 1200);
    expect(result.isValid).toBe(true);
    expect(result.adjustedRatio).toBeUndefined();
  });

  it('should reject ratio that makes app panel too narrow', () => {
    const result = validateSplitRatio(0.2, 1000); // Would make app panel 200px
    
    expect(result.isValid).toBe(false);
    expect(result.adjustedRatio).toBeGreaterThan(0.2);
    expect(result.reason).toBe('App panel too narrow');
  });

  it('should reject ratio that makes chat panel too narrow', () => {
    const result = validateSplitRatio(0.9, 1000); // Would make chat panel ~96px
    
    expect(result.isValid).toBe(false);
    expect(result.adjustedRatio).toBeLessThan(0.9);
    expect(result.reason).toBe('Chat panel too narrow');
  });

  it('should reject ratios outside bounds', () => {
    const tooLow = validateSplitRatio(0.3, 2000);
    expect(tooLow.isValid).toBe(false);
    expect(tooLow.adjustedRatio).toBe(LAYOUT_CONFIG.MIN_APP_PANEL_RATIO);
    
    const tooHigh = validateSplitRatio(0.9, 2000);
    expect(tooHigh.isValid).toBe(false);
    expect(tooHigh.adjustedRatio).toBe(LAYOUT_CONFIG.MAX_APP_PANEL_RATIO);
  });
});

describe('positionToSplitRatio', () => {
  it('should convert mouse position to split ratio', () => {
    const containerRect = {
      left: 100,
      width: 1000,
    } as DOMRect;
    
    // Mouse at 750px from left edge of screen = 650px from container left
    const ratio = positionToSplitRatio(750, containerRect);
    expect(ratio).toBe(0.65); // 650 / 1000
  });

  it('should clamp ratio to minimum bounds', () => {
    const containerRect = {
      left: 100,
      width: 1000,
    } as DOMRect;
    
    // Mouse very close to left edge
    const ratio = positionToSplitRatio(150, containerRect);
    expect(ratio).toBe(LAYOUT_CONFIG.MIN_APP_PANEL_RATIO);
  });

  it('should clamp ratio to maximum bounds', () => {
    const containerRect = {
      left: 100,
      width: 1000,
    } as DOMRect;
    
    // Mouse very close to right edge
    const ratio = positionToSplitRatio(1050, containerRect);
    expect(ratio).toBe(LAYOUT_CONFIG.MAX_APP_PANEL_RATIO);
  });
});

describe('getSplitScreenCSSProperties', () => {
  it('should generate correct CSS custom properties', () => {
    const dimensions = calculatePanelDimensions(1200, 0.7);
    const properties = getSplitScreenCSSProperties(dimensions);
    
    expect(properties).toEqual({
      '--app-panel-width': '840px',
      '--chat-panel-width': '356px',
      '--resize-handle-position': '840px',
      '--split-ratio': '0.7',
      '--resize-handle-width': '4px',
    });
  });
});

describe('getResponsiveGridClasses', () => {
  it('should return mobile grid classes', () => {
    expect(getResponsiveGridClasses('mobile')).toBe('grid gap-4 grid-cols-1');
    expect(getResponsiveGridClasses('mobile', 'workout-list')).toBe('grid gap-4 grid-cols-1');
  });

  it('should return tablet grid classes', () => {
    expect(getResponsiveGridClasses('tablet')).toBe('grid gap-4 grid-cols-2');
    expect(getResponsiveGridClasses('tablet', 'workout-list')).toBe('grid gap-4 grid-cols-2 sm:grid-cols-3');
    expect(getResponsiveGridClasses('tablet', 'form')).toBe('grid gap-4 grid-cols-1 sm:grid-cols-2');
  });

  it('should return desktop grid classes', () => {
    expect(getResponsiveGridClasses('desktop')).toBe('grid gap-4 grid-cols-2 lg:grid-cols-3');
    expect(getResponsiveGridClasses('desktop', 'chart')).toBe('grid gap-4 grid-cols-1');
  });
});

describe('getResponsiveFontSizes', () => {
  it('should return mobile font sizes', () => {
    const sizes = getResponsiveFontSizes('mobile');
    expect(sizes.heading1).toBe('text-2xl');
    expect(sizes.body).toBe('text-base');
  });

  it('should return tablet font sizes', () => {
    const sizes = getResponsiveFontSizes('tablet');
    expect(sizes.heading1).toBe('text-3xl');
    expect(sizes.body).toBe('text-base');
  });

  it('should return desktop font sizes', () => {
    const sizes = getResponsiveFontSizes('desktop');
    expect(sizes.heading1).toBe('text-2xl lg:text-3xl');
    expect(sizes.body).toBe('text-sm lg:text-base');
  });
});

describe('localStorage utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveSplitRatio', () => {
    it('should save ratio to localStorage', () => {
      saveSplitRatio(0.7);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('gymzy-split-ratio', '0.7');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      saveSplitRatio(0.7);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save split ratio to localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('loadSplitRatio', () => {
    it('should load valid ratio from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('0.7');
      const ratio = loadSplitRatio();
      expect(ratio).toBe(0.7);
    });

    it('should return default ratio when no saved value', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const ratio = loadSplitRatio();
      expect(ratio).toBe(LAYOUT_CONFIG.DEFAULT_APP_PANEL_RATIO);
    });

    it('should return default ratio for invalid saved values', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid');
      const ratio = loadSplitRatio();
      expect(ratio).toBe(LAYOUT_CONFIG.DEFAULT_APP_PANEL_RATIO);
    });

    it('should return default ratio for out-of-bounds values', () => {
      mockLocalStorage.getItem.mockReturnValue('0.9'); // Too high
      const ratio = loadSplitRatio();
      expect(ratio).toBe(LAYOUT_CONFIG.DEFAULT_APP_PANEL_RATIO);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const ratio = loadSplitRatio();
      
      expect(ratio).toBe(LAYOUT_CONFIG.DEFAULT_APP_PANEL_RATIO);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load split ratio from localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});