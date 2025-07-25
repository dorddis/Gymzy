import { renderHook, act } from '@testing-library/react';
import { 
  useResponsiveLayout, 
  useSplitScreenDimensions,
  getBreakpoint,
  calculateSplitScreenDimensions,
  BREAKPOINTS 
} from '@/hooks/use-responsive-layout';

// Mock window.matchMedia
const mockMatchMedia = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('getBreakpoint', () => {
  it('should return mobile for widths less than 768px', () => {
    expect(getBreakpoint(500)).toBe('mobile');
    expect(getBreakpoint(767)).toBe('mobile');
  });

  it('should return tablet for widths between 768px and 1023px', () => {
    expect(getBreakpoint(768)).toBe('tablet');
    expect(getBreakpoint(900)).toBe('tablet');
    expect(getBreakpoint(1023)).toBe('tablet');
  });

  it('should return desktop for widths 1024px and above', () => {
    expect(getBreakpoint(1024)).toBe('desktop');
    expect(getBreakpoint(1440)).toBe('desktop');
    expect(getBreakpoint(1920)).toBe('desktop');
  });
});

describe('calculateSplitScreenDimensions', () => {
  it('should calculate correct dimensions with default ratio', () => {
    const result = calculateSplitScreenDimensions(1000);
    expect(result.appPanelWidth).toBe(650); // 65% of 1000
    expect(result.chatPanelWidth).toBe(350); // 35% of 1000
    expect(result.splitRatio).toBe(0.65);
  });

  it('should calculate correct dimensions with custom ratio', () => {
    const result = calculateSplitScreenDimensions(1200, 0.7);
    expect(result.appPanelWidth).toBe(840); // 70% of 1200
    expect(result.chatPanelWidth).toBe(360); // 30% of 1200
    expect(result.splitRatio).toBe(0.7);
  });

  it('should handle edge cases', () => {
    const result = calculateSplitScreenDimensions(100, 0.5);
    expect(result.appPanelWidth).toBe(50);
    expect(result.chatPanelWidth).toBe(50);
  });
});

describe('useResponsiveLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct mobile state', () => {
    mockMatchMedia(500);
    
    const { result } = renderHook(() => useResponsiveLayout());
    
    expect(result.current.breakpoint).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.shouldUseSplitScreen).toBe(false);
    expect(result.current.shouldUseToggleMode).toBe(false);
  });

  it('should initialize with correct tablet state', () => {
    mockMatchMedia(800);
    
    const { result } = renderHook(() => useResponsiveLayout());
    
    expect(result.current.breakpoint).toBe('tablet');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.shouldUseSplitScreen).toBe(false);
    expect(result.current.shouldUseToggleMode).toBe(true);
  });

  it('should initialize with correct desktop state', () => {
    mockMatchMedia(1200);
    
    const { result } = renderHook(() => useResponsiveLayout());
    
    expect(result.current.breakpoint).toBe('desktop');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.shouldUseSplitScreen).toBe(true);
    expect(result.current.shouldUseToggleMode).toBe(false);
  });

  it('should include width and height in state', () => {
    mockMatchMedia(1200);
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
    
    const { result } = renderHook(() => useResponsiveLayout());
    
    expect(result.current.width).toBe(1200);
    expect(result.current.height).toBe(800);
  });
});

describe('useSplitScreenDimensions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate dimensions for desktop breakpoint', () => {
    mockMatchMedia(1200);
    
    const { result } = renderHook(() => useSplitScreenDimensions());
    
    expect(result.current.appPanelWidth).toBe(780); // 65% of 1200
    expect(result.current.chatPanelWidth).toBe(420); // 35% of 1200
    expect(result.current.canResize).toBe(true);
  });

  it('should respect minimum panel widths', () => {
    mockMatchMedia(1200);
    
    const { result } = renderHook(() => 
      useSplitScreenDimensions(0.9, 400, 300) // 90% ratio
    );
    
    act(() => {
      result.current.updateSplitRatio(0.95); // This should be rejected
    });
    
    // Should not update to 0.95 because chat panel would be too narrow
    expect(result.current.splitRatio).toBe(0.9);
  });

  it('should allow valid ratio updates', () => {
    mockMatchMedia(1200);
    
    const { result } = renderHook(() => useSplitScreenDimensions());
    
    act(() => {
      result.current.updateSplitRatio(0.7);
    });
    
    expect(result.current.splitRatio).toBe(0.7);
    expect(result.current.appPanelWidth).toBe(840); // 70% of 1200
  });

  it('should disable resizing for non-desktop breakpoints', () => {
    mockMatchMedia(800); // Tablet
    
    const { result } = renderHook(() => useSplitScreenDimensions());
    
    expect(result.current.canResize).toBe(false);
  });

  it('should reset ratio when leaving split-screen mode', () => {
    mockMatchMedia(1200);
    
    const { result, rerender } = renderHook(() => useSplitScreenDimensions());
    
    act(() => {
      result.current.updateSplitRatio(0.8);
    });
    
    expect(result.current.splitRatio).toBe(0.8);
    
    // Simulate breakpoint change to tablet
    mockMatchMedia(800);
    rerender();
    
    expect(result.current.splitRatio).toBe(0.65); // Reset to initial ratio
  });
});