import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResizableDivider, useResizableDivider } from '@/components/layout/resizable-divider';
import { validateSplitRatio } from '@/lib/layout-utils';

// Mock the layout utils
jest.mock('@/lib/layout-utils');

const mockValidateSplitRatio = validateSplitRatio as jest.MockedFunction<typeof validateSplitRatio>;

// Test component for the hook
function TestHookComponent({
  initialRatio,
  containerWidth,
  minAppPanelWidth,
  minChatPanelWidth,
  onRatioChange,
}: {
  initialRatio: number;
  containerWidth: number;
  minAppPanelWidth: number;
  minChatPanelWidth: number;
  onRatioChange?: (ratio: number) => void;
}) {
  const { splitRatio, setSplitRatio, appPanelWidth, chatPanelWidth } = useResizableDivider(
    initialRatio,
    containerWidth,
    minAppPanelWidth,
    minChatPanelWidth,
    onRatioChange
  );

  return (
    <div>
      <div data-testid="split-ratio">{splitRatio}</div>
      <div data-testid="app-panel-width">{appPanelWidth}</div>
      <div data-testid="chat-panel-width">{chatPanelWidth}</div>
      <button onClick={() => setSplitRatio(0.7)} data-testid="set-ratio">
        Set Ratio
      </button>
    </div>
  );
}

describe('ResizableDivider', () => {
  const defaultProps = {
    splitRatio: 0.65,
    onSplitRatioChange: jest.fn(),
    containerWidth: 1000,
    minAppPanelWidth: 400,
    minChatPanelWidth: 300,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateSplitRatio.mockReturnValue({ isValid: true });
  });

  it('should render with correct initial position', () => {
    const { container } = render(<ResizableDivider {...defaultProps} />);
    
    const divider = container.querySelector('[role="separator"]');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveStyle({ left: '648px' }); // 650 - 2 (center adjustment)
  });

  it('should have correct accessibility attributes', () => {
    render(<ResizableDivider {...defaultProps} aria-label="Custom resize label" />);
    
    const divider = screen.getByRole('separator');
    expect(divider).toHaveAttribute('aria-label', 'Custom resize label');
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    expect(divider).toHaveAttribute('aria-valuenow', '65');
    expect(divider).toHaveAttribute('aria-valuemin', '50');
    expect(divider).toHaveAttribute('aria-valuemax', '80');
    expect(divider).toHaveAttribute('aria-valuetext', '65% app panel width');
  });

  it('should be focusable and handle keyboard navigation', () => {
    const onSplitRatioChange = jest.fn();
    mockValidateSplitRatio.mockReturnValue({ isValid: true });
    
    render(
      <ResizableDivider 
        {...defaultProps} 
        onSplitRatioChange={onSplitRatioChange}
      />
    );
    
    const divider = screen.getByRole('separator');
    divider.focus();
    
    // Test arrow key navigation
    fireEvent.keyDown(divider, { key: 'ArrowRight' });
    expect(onSplitRatioChange).toHaveBeenCalledWith(0.7);
    
    fireEvent.keyDown(divider, { key: 'ArrowLeft' });
    expect(onSplitRatioChange).toHaveBeenCalledWith(0.6);
    
    fireEvent.keyDown(divider, { key: 'Home' });
    expect(onSplitRatioChange).toHaveBeenCalledWith(0.5);
    
    fireEvent.keyDown(divider, { key: 'End' });
    expect(onSplitRatioChange).toHaveBeenCalledWith(0.8);
  });

  it('should handle pointer events for resizing', () => {
    const onSplitRatioChange = jest.fn();
    mockValidateSplitRatio.mockReturnValue({ isValid: true });
    
    render(
      <ResizableDivider 
        {...defaultProps} 
        onSplitRatioChange={onSplitRatioChange}
      />
    );
    
    const divider = screen.getByRole('separator');
    
    // Start resize
    fireEvent.pointerDown(divider, { clientX: 650, pointerId: 1 });
    
    // Move pointer
    fireEvent.pointerMove(document, { clientX: 700, pointerId: 1 });
    
    // End resize
    fireEvent.pointerUp(document, { pointerId: 1 });
    
    expect(onSplitRatioChange).toHaveBeenCalled();
  });

  it('should show preview overlay during resize', () => {
    mockValidateSplitRatio.mockReturnValue({ isValid: true });
    
    const { container } = render(<ResizableDivider {...defaultProps} />);
    
    const divider = screen.getByRole('separator');
    
    // Start resize
    fireEvent.pointerDown(divider, { clientX: 650, pointerId: 1 });
    
    // Move pointer to trigger preview
    fireEvent.pointerMove(document, { clientX: 700, pointerId: 1 });
    
    // Check for preview overlay
    const previewOverlay = container.querySelector('.absolute.inset-0.pointer-events-none');
    expect(previewOverlay).toBeInTheDocument();
  });

  it('should handle validation errors gracefully', () => {
    const onSplitRatioChange = jest.fn();
    mockValidateSplitRatio.mockReturnValue({ 
      isValid: false, 
      adjustedRatio: 0.6,
      reason: 'Chat panel too narrow'
    });
    
    render(
      <ResizableDivider 
        {...defaultProps} 
        onSplitRatioChange={onSplitRatioChange}
      />
    );
    
    const divider = screen.getByRole('separator');
    
    // Start resize
    fireEvent.pointerDown(divider, { clientX: 650, pointerId: 1 });
    
    // Move to invalid position
    fireEvent.pointerMove(document, { clientX: 900, pointerId: 1 });
    
    // End resize
    fireEvent.pointerUp(document, { pointerId: 1 });
    
    // Should call with adjusted ratio
    expect(onSplitRatioChange).toHaveBeenCalledWith(0.6);
  });

  it('should be disabled when disabled prop is true', () => {
    const onSplitRatioChange = jest.fn();
    
    render(
      <ResizableDivider 
        {...defaultProps} 
        onSplitRatioChange={onSplitRatioChange}
        disabled={true}
      />
    );
    
    const divider = screen.getByRole('separator');
    expect(divider).toHaveClass('cursor-not-allowed', 'opacity-50');
    expect(divider).toHaveAttribute('tabIndex', '-1');
    
    // Should not respond to pointer events
    fireEvent.pointerDown(divider, { clientX: 650, pointerId: 1 });
    fireEvent.pointerMove(document, { clientX: 700, pointerId: 1 });
    fireEvent.pointerUp(document, { pointerId: 1 });
    
    expect(onSplitRatioChange).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ResizableDivider {...defaultProps} className="custom-class" />
    );
    
    const divider = container.querySelector('[role="separator"]');
    expect(divider).toHaveClass('custom-class');
  });

  it('should prevent default on pointer down', () => {
    render(<ResizableDivider {...defaultProps} />);
    
    const divider = screen.getByRole('separator');
    const event = new PointerEvent('pointerdown', { 
      clientX: 650, 
      pointerId: 1,
      bubbles: true,
      cancelable: true
    });
    
    const preventDefault = jest.spyOn(event, 'preventDefault');
    fireEvent(divider, event);
    
    expect(preventDefault).toHaveBeenCalled();
  });

  it('should set body styles during resize', () => {
    render(<ResizableDivider {...defaultProps} />);
    
    const divider = screen.getByRole('separator');
    
    // Start resize
    fireEvent.pointerDown(divider, { clientX: 650, pointerId: 1 });
    
    expect(document.body.style.userSelect).toBe('none');
    expect(document.body.style.cursor).toBe('col-resize');
    expect(document.body.classList.contains('resizing-cursor')).toBe(true);
    
    // End resize
    fireEvent.pointerUp(document, { pointerId: 1 });
    
    expect(document.body.style.userSelect).toBe('');
    expect(document.body.style.cursor).toBe('');
    expect(document.body.classList.contains('resizing-cursor')).toBe(false);
  });
});

describe('useResizableDivider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateSplitRatio.mockReturnValue({ isValid: true });
  });

  it('should initialize with correct values', () => {
    render(
      <TestHookComponent
        initialRatio={0.65}
        containerWidth={1000}
        minAppPanelWidth={400}
        minChatPanelWidth={300}
      />
    );

    expect(screen.getByTestId('split-ratio')).toHaveTextContent('0.65');
    expect(screen.getByTestId('app-panel-width')).toHaveTextContent('650');
    expect(screen.getByTestId('chat-panel-width')).toHaveTextContent('346'); // 1000 - 650 - 4
  });

  it('should update ratio when setSplitRatio is called', () => {
    const onRatioChange = jest.fn();
    
    render(
      <TestHookComponent
        initialRatio={0.65}
        containerWidth={1000}
        minAppPanelWidth={400}
        minChatPanelWidth={300}
        onRatioChange={onRatioChange}
      />
    );

    fireEvent.click(screen.getByTestId('set-ratio'));

    expect(screen.getByTestId('split-ratio')).toHaveTextContent('0.7');
    expect(onRatioChange).toHaveBeenCalledWith(0.7);
  });

  it('should validate ratio when container width changes', () => {
    mockValidateSplitRatio
      .mockReturnValueOnce({ isValid: true })
      .mockReturnValueOnce({ isValid: false, adjustedRatio: 0.6 });

    const onRatioChange = jest.fn();
    
    const { rerender } = render(
      <TestHookComponent
        initialRatio={0.65}
        containerWidth={1000}
        minAppPanelWidth={400}
        minChatPanelWidth={300}
        onRatioChange={onRatioChange}
      />
    );

    // Change container width to trigger validation
    rerender(
      <TestHookComponent
        initialRatio={0.65}
        containerWidth={800}
        minAppPanelWidth={400}
        minChatPanelWidth={300}
        onRatioChange={onRatioChange}
      />
    );

    expect(mockValidateSplitRatio).toHaveBeenCalledWith(0.65, 800);
    expect(onRatioChange).toHaveBeenCalledWith(0.6);
  });

  it('should calculate panel widths correctly', () => {
    render(
      <TestHookComponent
        initialRatio={0.7}
        containerWidth={1200}
        minAppPanelWidth={400}
        minChatPanelWidth={300}
      />
    );

    expect(screen.getByTestId('app-panel-width')).toHaveTextContent('840'); // 1200 * 0.7
    expect(screen.getByTestId('chat-panel-width')).toHaveTextContent('356'); // 1200 - 840 - 4
  });
});