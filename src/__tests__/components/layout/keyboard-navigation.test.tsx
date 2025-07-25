import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  KeyboardNavigation,
  useKeyboardShortcut,
  KeyboardShortcutHint,
  KeyboardShortcutsHelp,
} from '@/components/layout/keyboard-navigation';
import { useAppLayout } from '@/components/layout/app-layout-provider';
import { useTabletContext } from '@/components/layout/tablet-layout-manager';
import { visualFeedbackUtils } from '@/components/ui/visual-feedback';

// Mock dependencies
jest.mock('@/components/layout/app-layout-provider');
jest.mock('@/components/layout/tablet-layout-manager');
jest.mock('@/components/ui/visual-feedback');
jest.mock('@/components/ui/notification-system');

const mockUseAppLayout = useAppLayout as jest.MockedFunction<typeof useAppLayout>;
const mockUseTabletContext = useTabletContext as jest.MockedFunction<typeof useTabletContext>;

// Test component for useKeyboardShortcut hook
function TestKeyboardShortcutComponent() {
  const [triggered, setTriggered] = React.useState(false);
  
  useKeyboardShortcut('k', () => setTriggered(true), { modifier: 'alt' });
  
  return <div data-testid="shortcut-test">{triggered ? 'Triggered' : 'Not triggered'}</div>;
}

describe('KeyboardNavigation', () => {
  const mockToggleView = jest.fn();
  const mockSwitchView = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAppLayout.mockReturnValue({
      isDesktopLayout: true,
      isSplitScreen: true,
      isTabletToggle: false,
    } as any);

    mockUseTabletContext.mockReturnValue({
      toggleView: mockToggleView,
      switchView: mockSwitchView,
    } as any);

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };

    // Mock document.querySelector
    const mockChatInput = {
      focus: jest.fn(),
    };
    jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === '.chat-input') {
        return mockChatInput as any;
      }
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children', () => {
    render(
      <KeyboardNavigation>
        <div data-testid="child">Test Child</div>
      </KeyboardNavigation>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should handle Alt+c to focus chat input', () => {
    const mockChatInput = { focus: jest.fn() };
    jest.spyOn(document, 'querySelector').mockReturnValue(mockChatInput as any);

    render(
      <KeyboardNavigation>
        <div>Test</div>
      </KeyboardNavigation>
    );

    // Trigger Alt+c
    fireEvent.keyDown(window, { key: 'c', altKey: true });

    expect(mockChatInput.focus).toHaveBeenCalled();
    expect(visualFeedbackUtils.highlightInfo).toHaveBeenCalledWith(
      '.chat-input',
      'Chat input focused'
    );
  });

  it('should handle Alt+h to navigate home', () => {
    render(
      <KeyboardNavigation>
        <div>Test</div>
      </KeyboardNavigation>
    );

    // Trigger Alt+h
    fireEvent.keyDown(window, { key: 'h', altKey: true });

    expect(window.location.href).toBe('/');
  });

  it('should handle Alt+w to navigate to workout', () => {
    render(
      <KeyboardNavigation>
        <div>Test</div>
      </KeyboardNavigation>
    );

    // Trigger Alt+w
    fireEvent.keyDown(window, { key: 'w', altKey: true });

    expect(window.location.href).toBe('/workout');
  });

  it('should handle Alt+s to navigate to stats', () => {
    render(
      <KeyboardNavigation>
        <div>Test</div>
      </KeyboardNavigation>
    );

    // Trigger Alt+s
    fireEvent.keyDown(window, { key: 's', altKey: true });

    expect(window.location.href).toBe('/stats');
  });

  it('should handle Alt+p to navigate to profile', () => {
    render(
      <KeyboardNavigation>
        <div>Test</div>
      </KeyboardNavigation>
    );

    // Trigger Alt+p
    fireEvent.keyDown(window, { key: 'p', altKey: true });

    expect(window.location.href).toBe('/profile');
  });

  it('should handle Alt+/ to show help dialog', () => {
    render(
      <KeyboardNavigation>
        <div>Test</div>
      </KeyboardNavigation>
    );

    // Trigger Alt+/
    fireEvent.keyDown(window, { key: '/', altKey: true });

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Focus chat input')).toBeInTheDocument();
  });

  it('should close help dialog when close button is clicked', () => {
    render(
      <KeyboardNavigation>
        <div>Test</div>
      </KeyboardNavigation>
    );

    // Show help dialog
    fireEvent.keyDown(window, { key: '/', altKey: true });
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

    // Close dialog
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('should handle tablet toggle shortcuts when in tablet mode', () => {
    mockUseAppLayout.mockReturnValue({
      isDesktopLayout: false,
      isSplitScreen: false,
      isTabletToggle: true,
    } as any);

    render(
      <KeyboardNavigation>
        <div>Test</div>
      </KeyboardNavigation>
    );

    // Trigger Alt+Tab to toggle view
    fireEvent.keyDown(window, { key: 'Tab', altKey: true });
    expect(mockToggleView).toHaveBeenCalled();

    // Trigger Alt+1 to switch to app view
    fireEvent.keyDown(window, { key: '1', altKey: true });
    expect(mockSwitchView).toHaveBeenCalledWith('app');

    // Trigger Alt+2 to switch to chat view
    fireEvent.keyDown(window, { key: '2', altKey: true });
    expect(mockSwitchView).toHaveBeenCalledWith('chat');
  });

  it('should ignore non-Alt key combinations', () => {
    render(
      <KeyboardNavigation>
        <div>Test</div>
      </KeyboardNavigation>
    );

    // Trigger regular 'h' without Alt
    fireEvent.keyDown(window, { key: 'h' });

    expect(window.location.href).toBe('');
  });

  it('should ignore unknown shortcuts', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(
      <KeyboardNavigation>
        <div>Test</div>
      </KeyboardNavigation>
    );

    // Trigger Alt+x (unknown shortcut)
    fireEvent.keyDown(window, { key: 'x', altKey: true });

    // Should not cause any errors or actions
    expect(window.location.href).toBe('');
    
    consoleSpy.mockRestore();
  });
});

describe('useKeyboardShortcut hook', () => {
  it('should trigger callback when correct key combination is pressed', () => {
    render(<TestKeyboardShortcutComponent />);

    expect(screen.getByTestId('shortcut-test')).toHaveTextContent('Not triggered');

    // Trigger Alt+k
    fireEvent.keyDown(window, { key: 'k', altKey: true });

    expect(screen.getByTestId('shortcut-test')).toHaveTextContent('Triggered');
  });

  it('should not trigger callback when wrong key is pressed', () => {
    render(<TestKeyboardShortcutComponent />);

    // Trigger Alt+j (wrong key)
    fireEvent.keyDown(window, { key: 'j', altKey: true });

    expect(screen.getByTestId('shortcut-test')).toHaveTextContent('Not triggered');
  });

  it('should not trigger callback when wrong modifier is pressed', () => {
    render(<TestKeyboardShortcutComponent />);

    // Trigger Ctrl+k (wrong modifier)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(screen.getByTestId('shortcut-test')).toHaveTextContent('Not triggered');
  });
});

describe('KeyboardShortcutHint', () => {
  it('should display shortcut hint correctly', () => {
    render(
      <KeyboardShortcutHint
        shortcutKey="k"
        modifier="alt"
        description="Test shortcut"
      />
    );

    expect(screen.getByText('Test shortcut')).toBeInTheDocument();
    expect(screen.getByText('alt+k')).toBeInTheDocument();
  });

  it('should display shortcut without modifier', () => {
    render(
      <KeyboardShortcutHint
        shortcutKey="Enter"
        description="Submit"
      />
    );

    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Enter')).toBeInTheDocument();
  });
});

describe('KeyboardShortcutsHelp', () => {
  it('should show help dialog when button is clicked', () => {
    render(<KeyboardShortcutsHelp />);

    const button = screen.getByLabelText('Keyboard shortcuts');
    fireEvent.click(button);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('should show help dialog when Alt+/ is pressed', () => {
    render(<KeyboardShortcutsHelp />);

    fireEvent.keyDown(window, { key: '/', altKey: true });

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('should close help dialog when close button is clicked', () => {
    render(<KeyboardShortcutsHelp />);

    // Open dialog
    const button = screen.getByLabelText('Keyboard shortcuts');
    fireEvent.click(button);

    // Close dialog
    fireEvent.click(screen.getByText('Close'));

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });
});