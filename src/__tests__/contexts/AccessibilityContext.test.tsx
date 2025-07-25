import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { 
  AccessibilityProvider, 
  useAccessibility, 
  useAnnounce,
  useFocusManagement,
  useKeyboardShortcuts,
  type AccessibilityPreferences 
} from '@/contexts/AccessibilityContext';

// Test component to access context
function TestComponent() {
  const {
    preferences,
    updatePreferences,
    announce,
    focusElement,
    trapFocus,
    registerShortcut,
    unregisterShortcut,
    isReducedMotion,
    isHighContrast,
    currentFontSize,
  } = useAccessibility();

  return (
    <div>
      <div data-testid="font-size">{currentFontSize}</div>
      <div data-testid="high-contrast">{isHighContrast.toString()}</div>
      <div data-testid="reduced-motion">{isReducedMotion.toString()}</div>
      <div data-testid="announcements-enabled">{preferences.announcements.enabled.toString()}</div>
      
      <button
        data-testid="update-font-size"
        onClick={() => updatePreferences({ fontSize: 'large' })}
      >
        Update Font Size
      </button>
      
      <button
        data-testid="announce-message"
        onClick={() => announce('Test announcement', 'polite')}
      >
        Announce Message
      </button>
      
      <button
        data-testid="focus-element"
        onClick={() => focusElement('[data-testid="focus-target"]')}
      >
        Focus Element
      </button>
      
      <button
        data-testid="register-shortcut"
        onClick={() => registerShortcut('ctrl+k', () => announce('Shortcut pressed'), 'Test shortcut')}
      >
        Register Shortcut
      </button>
      
      <div data-testid="focus-target" tabIndex={0}>Focus Target</div>
    </div>
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

describe('AccessibilityContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
  });

  afterEach(() => {
    // Clean up any live regions created during tests
    const liveRegion = document.getElementById('accessibility-announcements');
    if (liveRegion) {
      liveRegion.remove();
    }
  });

  it('should provide default accessibility preferences', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId('font-size')).toHaveTextContent('medium');
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
    expect(screen.getByTestId('announcements-enabled')).toHaveTextContent('true');
  });

  it('should load preferences from localStorage', () => {
    const savedPreferences: Partial<AccessibilityPreferences> = {
      fontSize: 'large',
      highContrast: true,
      announcements: { enabled: false, verbosity: 'minimal' },
    };
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedPreferences));

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId('font-size')).toHaveTextContent('large');
    expect(screen.getByTestId('announcements-enabled')).toHaveTextContent('false');
  });

  it('should update preferences and save to localStorage', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByTestId('update-font-size'));

    await waitFor(() => {
      expect(screen.getByTestId('font-size')).toHaveTextContent('large');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'accessibility-preferences',
      expect.stringContaining('"fontSize":"large"')
    );
  });

  it('should detect system reduced motion preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
  });

  it('should create live region for announcements', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByTestId('announce-message'));

    await waitFor(() => {
      const liveRegion = document.getElementById('accessibility-announcements');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  it('should focus element when focusElement is called', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const focusTarget = screen.getByTestId('focus-target');
    fireEvent.click(screen.getByTestId('focus-element'));

    expect(focusTarget).toHaveFocus();
  });

  it('should register and handle keyboard shortcuts', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    // Register shortcut
    fireEvent.click(screen.getByTestId('register-shortcut'));

    // Simulate keyboard shortcut
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    // Check if live region was created (indicating announcement was made)
    waitFor(() => {
      const liveRegion = document.getElementById('accessibility-announcements');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  it('should handle invalid localStorage data gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid json');
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse saved accessibility preferences:',
      expect.any(Error)
    );
    
    // Should still use default preferences
    expect(screen.getByTestId('font-size')).toHaveTextContent('medium');

    consoleSpy.mockRestore();
  });

  it('should throw error when useAccessibility is used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAccessibility must be used within an AccessibilityProvider');

    consoleSpy.mockRestore();
  });
});

describe('useAnnounce hook', () => {
  function AnnouncementTestComponent() {
    const announce = useAnnounce();
    
    return (
      <button onClick={() => announce('Test message', 'assertive')}>
        Announce
      </button>
    );
  }

  it('should provide announce function', async () => {
    render(
      <AccessibilityProvider>
        <AnnouncementTestComponent />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByText('Announce'));

    await waitFor(() => {
      const liveRegion = document.getElementById('accessibility-announcements');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });
  });
});

describe('useFocusManagement hook', () => {
  function FocusTestComponent() {
    const { focusElement, trapFocus } = useFocusManagement();
    
    return (
      <div>
        <button onClick={() => focusElement('[data-testid="target"]')}>
          Focus Target
        </button>
        <div data-testid="target" tabIndex={0}>Target</div>
      </div>
    );
  }

  it('should provide focus management functions', () => {
    render(
      <AccessibilityProvider>
        <FocusTestComponent />
      </AccessibilityProvider>
    );

    const target = screen.getByTestId('target');
    fireEvent.click(screen.getByText('Focus Target'));

    expect(target).toHaveFocus();
  });
});

describe('useKeyboardShortcuts hook', () => {
  function ShortcutTestComponent() {
    const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
    const [message, setMessage] = React.useState('');
    
    React.useEffect(() => {
      registerShortcut('ctrl+t', () => setMessage('Shortcut triggered'), 'Test');
      return () => unregisterShortcut('ctrl+t');
    }, [registerShortcut, unregisterShortcut]);
    
    return <div data-testid="message">{message}</div>;
  }

  it('should provide keyboard shortcut functions', () => {
    render(
      <AccessibilityProvider>
        <ShortcutTestComponent />
      </AccessibilityProvider>
    );

    fireEvent.keyDown(document, { key: 't', ctrlKey: true });

    expect(screen.getByTestId('message')).toHaveTextContent('Shortcut triggered');
  });
});