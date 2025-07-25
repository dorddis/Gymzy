import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import {
  ThemeProvider,
  useTheme,
  useHighContrast,
  useReducedMotion,
  useFontSize,
  ThemeCSS,
  ThemeAware,
  type ThemeMode,
  type FontSizePreference,
} from '@/contexts/ThemeContext';

// Test components
function TestThemeComponent() {
  const {
    preferences,
    isHighContrast,
    isReducedMotion,
    currentFontSize,
    setThemeMode,
    setFontSize,
    setReducedMotion,
    setHighContrast,
    toggleHighContrast,
    resetToDefaults,
  } = useTheme();

  return (
    <div>
      <div data-testid="theme-mode">{preferences.mode}</div>
      <div data-testid="font-size">{currentFontSize}</div>
      <div data-testid="high-contrast">{isHighContrast.toString()}</div>
      <div data-testid="reduced-motion">{isReducedMotion.toString()}</div>
      
      <button onClick={() => setThemeMode('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setThemeMode('high-contrast')} data-testid="set-high-contrast">
        Set High Contrast
      </button>
      <button onClick={() => setFontSize('large')} data-testid="set-large-font">
        Set Large Font
      </button>
      <button onClick={() => setReducedMotion(true)} data-testid="enable-reduced-motion">
        Enable Reduced Motion
      </button>
      <button onClick={() => setHighContrast(true)} data-testid="enable-high-contrast">
        Enable High Contrast
      </button>
      <button onClick={toggleHighContrast} data-testid="toggle-high-contrast">
        Toggle High Contrast
      </button>
      <button onClick={resetToDefaults} data-testid="reset-defaults">
        Reset to Defaults
      </button>
    </div>
  );
}

function TestHighContrastComponent() {
  const { isHighContrast, setHighContrast, toggleHighContrast } = useHighContrast();
  
  return (
    <div>
      <div data-testid="hc-status">{isHighContrast.toString()}</div>
      <button onClick={() => setHighContrast(true)} data-testid="hc-enable">
        Enable
      </button>
      <button onClick={toggleHighContrast} data-testid="hc-toggle">
        Toggle
      </button>
    </div>
  );
}

function TestReducedMotionComponent() {
  const { isReducedMotion, setReducedMotion } = useReducedMotion();
  
  return (
    <div>
      <div data-testid="rm-status">{isReducedMotion.toString()}</div>
      <button onClick={() => setReducedMotion(true)} data-testid="rm-enable">
        Enable
      </button>
    </div>
  );
}

function TestFontSizeComponent() {
  const { currentFontSize, setFontSize } = useFontSize();
  
  return (
    <div>
      <div data-testid="fs-current">{currentFontSize}</div>
      <button onClick={() => setFontSize('extra-large')} data-testid="fs-set-xl">
        Set Extra Large
      </button>
    </div>
  );
}

function TestThemeAwareComponent() {
  return (
    <ThemeAware>
      {({ isHighContrast, isReducedMotion, currentFontSize, mode }) => (
        <div>
          <div data-testid="ta-mode">{mode}</div>
          <div data-testid="ta-high-contrast">{isHighContrast.toString()}</div>
          <div data-testid="ta-reduced-motion">{isReducedMotion.toString()}</div>
          <div data-testid="ta-font-size">{currentFontSize}</div>
        </div>
      )}
    </ThemeAware>
  );
}

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

// Mock matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    
    // Reset document styles
    document.documentElement.style.cssText = '';
    document.body.className = '';
  });

  it('should provide default theme preferences', () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
    expect(screen.getByTestId('font-size')).toHaveTextContent('medium');
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
  });

  it('should load preferences from localStorage', () => {
    const savedPreferences = {
      mode: 'dark',
      fontSize: 'large',
      highContrast: true,
      reducedMotion: true,
    };
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedPreferences));

    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('font-size')).toHaveTextContent('large');
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
  });

  it('should save preferences to localStorage when changed', async () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-dark'));

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'theme-preferences',
        expect.stringContaining('"mode":"dark"')
      );
    });
  });

  it('should handle invalid localStorage data gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid json');
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse saved theme preferences:',
      expect.any(Error)
    );
    
    // Should still use default preferences
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');

    consoleSpy.mockRestore();
  });

  it('should detect system preferences', () => {
    mockMatchMedia.mockImplementation((query) => {
      if (query === '(prefers-color-scheme: dark)') {
        return { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
      }
      if (query === '(prefers-reduced-motion: reduce)') {
        return { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
      }
      if (query === '(prefers-contrast: high)') {
        return { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
      }
      return { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() };
    });

    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    // Should respect system preferences by default
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('high-contrast');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
  });

  it('should update theme mode', async () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-dark'));

    await waitFor(() => {
      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    });
  });

  it('should update font size', async () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-large-font'));

    await waitFor(() => {
      expect(screen.getByTestId('font-size')).toHaveTextContent('large');
    });
  });

  it('should toggle high contrast mode', async () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');

    fireEvent.click(screen.getByTestId('toggle-high-contrast'));

    await waitFor(() => {
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    });

    fireEvent.click(screen.getByTestId('toggle-high-contrast'));

    await waitFor(() => {
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    });
  });

  it('should enable reduced motion', async () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('enable-reduced-motion'));

    await waitFor(() => {
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
    });
  });

  it('should reset to defaults', async () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    // Change some settings
    fireEvent.click(screen.getByTestId('set-dark'));
    fireEvent.click(screen.getByTestId('set-large-font'));
    fireEvent.click(screen.getByTestId('enable-high-contrast'));

    await waitFor(() => {
      expect(screen.getByTestId('theme-mode')).toHaveTextContent('high-contrast');
      expect(screen.getByTestId('font-size')).toHaveTextContent('large');
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    });

    // Reset to defaults
    fireEvent.click(screen.getByTestId('reset-defaults'));

    await waitFor(() => {
      expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
      expect(screen.getByTestId('font-size')).toHaveTextContent('medium');
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
    });
  });

  it('should apply CSS custom properties to document', async () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-high-contrast'));

    await waitFor(() => {
      const rootStyle = document.documentElement.style;
      expect(rootStyle.getPropertyValue('--color-background')).toBeTruthy();
      expect(rootStyle.getPropertyValue('--color-foreground')).toBeTruthy();
    });
  });

  it('should apply theme classes to body', async () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-dark'));
    fireEvent.click(screen.getByTestId('set-large-font'));
    fireEvent.click(screen.getByTestId('enable-high-contrast'));

    await waitFor(() => {
      expect(document.body.classList.contains('theme-dark')).toBe(true);
      expect(document.body.classList.contains('font-size-large')).toBe(true);
      expect(document.body.classList.contains('high-contrast')).toBe(true);
    });
  });

  it('should throw error when useTheme is used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<TestThemeComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});

describe('Theme Utility Hooks', () => {
  describe('useHighContrast', () => {
    it('should provide high contrast controls', async () => {
      render(
        <ThemeProvider>
          <TestHighContrastComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('hc-status')).toHaveTextContent('false');

      fireEvent.click(screen.getByTestId('hc-enable'));

      await waitFor(() => {
        expect(screen.getByTestId('hc-status')).toHaveTextContent('true');
      });

      fireEvent.click(screen.getByTestId('hc-toggle'));

      await waitFor(() => {
        expect(screen.getByTestId('hc-status')).toHaveTextContent('false');
      });
    });
  });

  describe('useReducedMotion', () => {
    it('should provide reduced motion controls', async () => {
      render(
        <ThemeProvider>
          <TestReducedMotionComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('rm-status')).toHaveTextContent('false');

      fireEvent.click(screen.getByTestId('rm-enable'));

      await waitFor(() => {
        expect(screen.getByTestId('rm-status')).toHaveTextContent('true');
      });
    });
  });

  describe('useFontSize', () => {
    it('should provide font size controls', async () => {
      render(
        <ThemeProvider>
          <TestFontSizeComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('fs-current')).toHaveTextContent('medium');

      fireEvent.click(screen.getByTestId('fs-set-xl'));

      await waitFor(() => {
        expect(screen.getByTestId('fs-current')).toHaveTextContent('extra-large');
      });
    });
  });
});

describe('ThemeAware Component', () => {
  it('should provide theme state to children', async () => {
    render(
      <ThemeProvider>
        <TestThemeAwareComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('ta-mode')).toHaveTextContent('light');
    expect(screen.getByTestId('ta-high-contrast')).toHaveTextContent('false');
    expect(screen.getByTestId('ta-reduced-motion')).toHaveTextContent('false');
    expect(screen.getByTestId('ta-font-size')).toHaveTextContent('medium');
  });

  it('should update when theme changes', async () => {
    render(
      <ThemeProvider>
        <TestThemeAwareComponent />
        <TestThemeComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-high-contrast'));
    fireEvent.click(screen.getByTestId('enable-reduced-motion'));

    await waitFor(() => {
      expect(screen.getByTestId('ta-mode')).toHaveTextContent('high-contrast');
      expect(screen.getByTestId('ta-high-contrast')).toHaveTextContent('true');
      expect(screen.getByTestId('ta-reduced-motion')).toHaveTextContent('true');
    });
  });
});

describe('ThemeCSS Component', () => {
  it('should render theme CSS', () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeCSS />
      </ThemeProvider>
    );

    const styleElement = container.querySelector('style');
    expect(styleElement).toBeInTheDocument();
    expect(styleElement?.innerHTML).toContain(':root');
    expect(styleElement?.innerHTML).toContain('--color-');
  });
});