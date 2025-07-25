import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  SkipToContent,
  FocusTrap,
  ScreenReaderAnnouncement,
  useScreenReaderAnnouncement,
  AriaRegion,
  FocusableElement,
} from '@/components/layout/accessibility-helpers';

// Test component for useScreenReaderAnnouncement hook
function TestScreenReaderComponent() {
  const { announce, announcement, assertive } = useScreenReaderAnnouncement();

  return (
    <div>
      <button onClick={() => announce('Test message')} data-testid="announce-button">
        Announce
      </button>
      <button onClick={() => announce('Urgent message', true)} data-testid="announce-assertive">
        Announce Assertive
      </button>
      <ScreenReaderAnnouncement message={announcement} assertive={assertive} />
    </div>
  );
}

// Test component for FocusTrap
function TestFocusTrapComponent({ active = true }: { active?: boolean }) {
  return (
    <FocusTrap active={active}>
      <div>
        <button data-testid="first-button">First Button</button>
        <input data-testid="input" placeholder="Test input" />
        <button data-testid="last-button">Last Button</button>
      </div>
    </FocusTrap>
  );
}

describe('SkipToContent', () => {
  it('should render skip to content link', () => {
    render(<SkipToContent />);
    
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('should have proper accessibility classes', () => {
    render(<SkipToContent />);
    
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toHaveClass('sr-only');
    expect(skipLink).toHaveClass('focus:not-sr-only');
  });
});

describe('FocusTrap', () => {
  beforeEach(() => {
    // Mock focus method
    HTMLElement.prototype.focus = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children', () => {
    render(<TestFocusTrapComponent />);
    
    expect(screen.getByTestId('first-button')).toBeInTheDocument();
    expect(screen.getByTestId('input')).toBeInTheDocument();
    expect(screen.getByTestId('last-button')).toBeInTheDocument();
  });

  it('should focus first element when active', () => {
    render(<TestFocusTrapComponent active={true} />);
    
    const firstButton = screen.getByTestId('first-button');
    expect(firstButton.focus).toHaveBeenCalled();
  });

  it('should not focus when inactive', () => {
    render(<TestFocusTrapComponent active={false} />);
    
    const firstButton = screen.getByTestId('first-button');
    expect(firstButton.focus).not.toHaveBeenCalled();
  });

  it('should trap focus within container', () => {
    render(<TestFocusTrapComponent />);
    
    const firstButton = screen.getByTestId('first-button');
    const lastButton = screen.getByTestId('last-button');
    
    // Focus last button
    lastButton.focus();
    
    // Tab from last button should wrap to first
    fireEvent.keyDown(lastButton, { key: 'Tab' });
    expect(firstButton.focus).toHaveBeenCalled();
  });

  it('should handle shift+tab to wrap from first to last', () => {
    render(<TestFocusTrapComponent />);
    
    const firstButton = screen.getByTestId('first-button');
    const lastButton = screen.getByTestId('last-button');
    
    // Focus first button
    firstButton.focus();
    
    // Shift+Tab from first button should wrap to last
    fireEvent.keyDown(firstButton, { key: 'Tab', shiftKey: true });
    expect(lastButton.focus).toHaveBeenCalled();
  });

  it('should ignore non-Tab keys', () => {
    render(<TestFocusTrapComponent />);
    
    const firstButton = screen.getByTestId('first-button');
    const lastButton = screen.getByTestId('last-button');
    
    // Press Enter key
    fireEvent.keyDown(firstButton, { key: 'Enter' });
    
    // Should not affect focus
    expect(lastButton.focus).not.toHaveBeenCalled();
  });
});

describe('ScreenReaderAnnouncement', () => {
  it('should render announcement with polite aria-live', () => {
    render(<ScreenReaderAnnouncement message="Test message" />);
    
    const announcement = screen.getByText('Test message');
    expect(announcement).toHaveAttribute('aria-live', 'polite');
    expect(announcement).toHaveAttribute('aria-atomic', 'true');
    expect(announcement).toHaveClass('sr-only');
  });

  it('should render announcement with assertive aria-live', () => {
    render(<ScreenReaderAnnouncement message="Urgent message" assertive={true} />);
    
    const announcement = screen.getByText('Urgent message');
    expect(announcement).toHaveAttribute('aria-live', 'assertive');
  });
});

describe('useScreenReaderAnnouncement hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should announce messages', async () => {
    render(<TestScreenReaderComponent />);
    
    const announceButton = screen.getByTestId('announce-button');
    fireEvent.click(announceButton);
    
    // Fast-forward timers
    jest.advanceTimersByTime(100);
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('should handle assertive announcements', async () => {
    render(<TestScreenReaderComponent />);
    
    const announceButton = screen.getByTestId('announce-assertive');
    fireEvent.click(announceButton);
    
    // Fast-forward timers
    jest.advanceTimersByTime(100);
    
    await waitFor(() => {
      const announcement = screen.getByText('Urgent message');
      expect(announcement).toHaveAttribute('aria-live', 'assertive');
    });
  });

  it('should clear previous announcements', async () => {
    render(<TestScreenReaderComponent />);
    
    const announceButton = screen.getByTestId('announce-button');
    
    // First announcement
    fireEvent.click(announceButton);
    jest.advanceTimersByTime(100);
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
    
    // Second announcement should replace first
    fireEvent.click(announceButton);
    jest.advanceTimersByTime(100);
    
    // Should still only have one announcement element
    const announcements = screen.getAllByText('Test message');
    expect(announcements).toHaveLength(1);
  });
});

describe('AriaRegion', () => {
  it('should render with proper ARIA attributes', () => {
    render(
      <AriaRegion
        label="Test region"
        role="region"
        description="Test description"
        className="test-class"
      >
        <div>Content</div>
      </AriaRegion>
    );
    
    const region = screen.getByLabelText('Test region');
    expect(region).toHaveAttribute('role', 'region');
    expect(region).toHaveAttribute('aria-description', 'Test description');
    expect(region).toHaveClass('test-class');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render without optional attributes', () => {
    render(
      <AriaRegion label="Simple region">
        <div>Content</div>
      </AriaRegion>
    );
    
    const region = screen.getByLabelText('Simple region');
    expect(region).not.toHaveAttribute('role');
    expect(region).not.toHaveAttribute('aria-description');
  });
});

describe('FocusableElement', () => {
  beforeEach(() => {
    HTMLElement.prototype.focus = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render with focus styles and tabindex', () => {
    render(
      <FocusableElement className="custom-class" data-testid="focusable">
        <div>Focusable content</div>
      </FocusableElement>
    );
    
    const element = screen.getByTestId('focusable');
    expect(element).toHaveAttribute('tabIndex', '0');
    expect(element).toHaveClass('focus:outline-none');
    expect(element).toHaveClass('focus:ring-2');
    expect(element).toHaveClass('focus:ring-blue-500');
    expect(element).toHaveClass('custom-class');
    expect(screen.getByText('Focusable content')).toBeInTheDocument();
  });

  it('should be focusable', () => {
    render(
      <FocusableElement data-testid="focusable">
        <div>Content</div>
      </FocusableElement>
    );
    
    const element = screen.getByTestId('focusable');
    element.focus();
    
    expect(element.focus).toHaveBeenCalled();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    
    render(
      <FocusableElement onClick={handleClick} data-testid="focusable">
        <div>Content</div>
      </FocusableElement>
    );
    
    const element = screen.getByTestId('focusable');
    fireEvent.click(element);
    
    expect(handleClick).toHaveBeenCalled();
  });
});