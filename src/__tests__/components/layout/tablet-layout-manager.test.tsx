import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import {
  TabletLayoutManager,
  TabletProvider,
  useTabletContext,
  useTabletFeatures,
} from '@/components/layout/tablet-layout-manager';
import { TabletToggleHeader, useTabletToggle } from '@/components/layout/tablet-toggle-header';

// Mock components
const MockAppContent = () => <div data-testid="app-content">App Content</div>;
const MockChatContent = () => <div data-testid="chat-content">Chat Content</div>;

// Test component for hooks
function TestTabletContextComponent() {
  const { activeView, switchView, toggleView, isTransitioning, isTabletMode, orientation } = useTabletContext();
  
  return (
    <div>
      <div data-testid="active-view">{activeView}</div>
      <div data-testid="is-transitioning">{isTransitioning.toString()}</div>
      <div data-testid="is-tablet-mode">{isTabletMode.toString()}</div>
      <div data-testid="orientation">{orientation}</div>
      <button onClick={() => switchView('chat')} data-testid="switch-to-chat">
        Switch to Chat
      </button>
      <button onClick={toggleView} data-testid="toggle-view">
        Toggle View
      </button>
    </div>
  );
}

function TestTabletFeaturesComponent() {
  const { isTabletMode, orientation, isPortrait, isLandscape } = useTabletFeatures();
  
  return (
    <div>
      <div data-testid="tablet-mode">{isTabletMode.toString()}</div>
      <div data-testid="orientation">{orientation}</div>
      <div data-testid="is-portrait">{isPortrait.toString()}</div>
      <div data-testid="is-landscape">{isLandscape.toString()}</div>
    </div>
  );
}

function TestTabletToggleComponent() {
  const { activeView, isTransitioning, switchView, toggleView } = useTabletToggle();
  
  return (
    <div>
      <div data-testid="active-view">{activeView}</div>
      <div data-testid="is-transitioning">{isTransitioning.toString()}</div>
      <button onClick={() => switchView('chat')} data-testid="switch-to-chat">
        Switch to Chat
      </button>
      <button onClick={toggleView} data-testid="toggle-view">
        Toggle View
      </button>
    </div>
  );
}

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

describe('TabletLayoutManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockWindowDimensions(768, 1024); // Default tablet dimensions
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('TabletLayoutManager component', () => {
    it('should render with app view active by default', () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
        />
      );

      expect(screen.getByTestId('app-content')).toBeInTheDocument();
      expect(screen.getByText('App')).toHaveClass('text-gray-900'); // Active state
      expect(screen.getByText('AI Chat')).toHaveClass('text-gray-600'); // Inactive state
    });

    it('should switch to chat view when chat button is clicked', async () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
        />
      );

      const chatButton = screen.getByText('AI Chat');
      fireEvent.click(chatButton);

      await waitFor(() => {
        expect(screen.getByTestId('chat-content')).toBeInTheDocument();
      });

      expect(screen.getByText('AI Chat')).toHaveClass('text-gray-900'); // Now active
    });

    it('should show unread chat count badge', () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
          unreadChatCount={5}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should show notification badge', () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
          showNotificationBadge={true}
        />
      );

      // Should show notification dot when not on app view
      const chatButton = screen.getByText('AI Chat');
      fireEvent.click(chatButton);

      // Now app button should show notification dot
      const appSection = screen.getByText('App').parentElement;
      expect(appSection?.querySelector('.bg-red-500')).toBeInTheDocument();
    });

    it('should call onViewChange callback', () => {
      const onViewChange = jest.fn();
      
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
          onViewChange={onViewChange}
        />
      );

      expect(onViewChange).toHaveBeenCalledWith('app');

      const chatButton = screen.getByText('AI Chat');
      fireEvent.click(chatButton);

      expect(onViewChange).toHaveBeenCalledWith('chat');
    });

    it('should show loading overlay during transitions', async () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
        />
      );

      const chatButton = screen.getByText('AI Chat');
      fireEvent.click(chatButton);

      // Should show loading overlay
      expect(screen.getByText('Switching...')).toBeInTheDocument();

      // Fast-forward past transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.queryByText('Switching...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Touch gestures', () => {
    it('should handle swipe left to switch to chat', async () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
          enableSwipeGestures={true}
        />
      );

      const contentArea = screen.getByTestId('app-content').closest('.relative');
      
      // Simulate swipe left
      fireEvent.touchStart(contentArea!, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchEnd(contentArea!, {
        changedTouches: [{ clientX: 100, clientY: 100 }], // Moved left 100px
      });

      await waitFor(() => {
        expect(screen.getByTestId('chat-content')).toBeInTheDocument();
      });
    });

    it('should handle swipe right to switch to app', async () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
          enableSwipeGestures={true}
        />
      );

      // First switch to chat
      const chatButton = screen.getByText('AI Chat');
      fireEvent.click(chatButton);

      await waitFor(() => {
        expect(screen.getByTestId('chat-content')).toBeInTheDocument();
      });

      const contentArea = screen.getByTestId('chat-content').closest('.relative');
      
      // Simulate swipe right
      fireEvent.touchStart(contentArea!, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(contentArea!, {
        changedTouches: [{ clientX: 200, clientY: 100 }], // Moved right 100px
      });

      await waitFor(() => {
        expect(screen.getByTestId('app-content')).toBeInTheDocument();
      });
    });

    it('should ignore vertical swipes', () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
          enableSwipeGestures={true}
        />
      );

      const contentArea = screen.getByTestId('app-content').closest('.relative');
      
      // Simulate vertical swipe
      fireEvent.touchStart(contentArea!, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(contentArea!, {
        changedTouches: [{ clientX: 100, clientY: 200 }], // Moved down 100px
      });

      // Should still be on app view
      expect(screen.getByText('App')).toHaveClass('text-gray-900');
    });

    it('should ignore slow swipes', () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
          enableSwipeGestures={true}
        />
      );

      const contentArea = screen.getByTestId('app-content').closest('.relative');
      
      // Simulate slow swipe (advance time before touchEnd)
      fireEvent.touchStart(contentArea!, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      act(() => {
        jest.advanceTimersByTime(400); // Longer than 300ms threshold
      });

      fireEvent.touchEnd(contentArea!, {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Should still be on app view
      expect(screen.getByText('App')).toHaveClass('text-gray-900');
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should toggle view with Alt+Tab', async () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
          enableKeyboardShortcuts={true}
        />
      );

      // Press Alt+Tab
      fireEvent.keyDown(document, { key: 'Tab', altKey: true });

      await waitFor(() => {
        expect(screen.getByTestId('chat-content')).toBeInTheDocument();
      });
    });

    it('should switch to app view with Alt+1', async () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
          enableKeyboardShortcuts={true}
        />
      );

      // First switch to chat
      const chatButton = screen.getByText('AI Chat');
      fireEvent.click(chatButton);

      await waitFor(() => {
        expect(screen.getByTestId('chat-content')).toBeInTheDocument();
      });

      // Press Alt+1
      fireEvent.keyDown(document, { key: '1', altKey: true });

      await waitFor(() => {
        expect(screen.getByTestId('app-content')).toBeInTheDocument();
      });
    });

    it('should switch to chat view with Alt+2', async () => {
      render(
        <TabletLayoutManager
          appContent={<MockAppContent />}
          chatContent={<MockChatContent />}
          enableKeyboardShortcuts={true}
        />
      );

      // Press Alt+2
      fireEvent.keyDown(document, { key: '2', altKey: true });

      await waitFor(() => {
        expect(screen.getByTestId('chat-content')).toBeInTheDocument();
      });
    });
  });

  describe('useTabletToggle hook', () => {
    it('should initialize with app view', () => {
      render(<TestTabletToggleComponent />);

      expect(screen.getByTestId('active-view')).toHaveTextContent('app');
      expect(screen.getByTestId('is-transitioning')).toHaveTextContent('false');
    });

    it('should switch views', async () => {
      render(<TestTabletToggleComponent />);

      const switchButton = screen.getByTestId('switch-to-chat');
      fireEvent.click(switchButton);

      expect(screen.getByTestId('active-view')).toHaveTextContent('chat');
      expect(screen.getByTestId('is-transitioning')).toHaveTextContent('true');

      // Wait for transition to complete
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-transitioning')).toHaveTextContent('false');
      });
    });

    it('should toggle views', async () => {
      render(<TestTabletToggleComponent />);

      const toggleButton = screen.getByTestId('toggle-view');
      
      // Toggle to chat
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('active-view')).toHaveTextContent('chat');

      // Wait for transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Toggle back to app
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('active-view')).toHaveTextContent('app');
    });
  });

  describe('useTabletFeatures hook', () => {
    it('should detect tablet mode', () => {
      mockWindowDimensions(800, 600); // Tablet dimensions
      
      render(<TestTabletFeaturesComponent />);

      expect(screen.getByTestId('tablet-mode')).toHaveTextContent('true');
      expect(screen.getByTestId('orientation')).toHaveTextContent('landscape');
      expect(screen.getByTestId('is-landscape')).toHaveTextContent('true');
    });

    it('should detect non-tablet mode', () => {
      mockWindowDimensions(1200, 800); // Desktop dimensions
      
      render(<TestTabletFeaturesComponent />);

      expect(screen.getByTestId('tablet-mode')).toHaveTextContent('false');
    });

    it('should detect portrait orientation', () => {
      mockWindowDimensions(768, 1024); // Portrait tablet
      
      render(<TestTabletFeaturesComponent />);

      expect(screen.getByTestId('orientation')).toHaveTextContent('portrait');
      expect(screen.getByTestId('is-portrait')).toHaveTextContent('true');
      expect(screen.getByTestId('is-landscape')).toHaveTextContent('false');
    });
  });

  describe('TabletProvider and useTabletContext', () => {
    it('should provide tablet context', () => {
      render(
        <TabletProvider>
          <TestTabletContextComponent />
        </TabletProvider>
      );

      expect(screen.getByTestId('active-view')).toHaveTextContent('app');
      expect(screen.getByTestId('is-transitioning')).toHaveTextContent('false');
    });

    it('should allow switching views through context', async () => {
      render(
        <TabletProvider>
          <TestTabletContextComponent />
        </TabletProvider>
      );

      const switchButton = screen.getByTestId('switch-to-chat');
      fireEvent.click(switchButton);

      expect(screen.getByTestId('active-view')).toHaveTextContent('chat');
    });

    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        render(<TestTabletContextComponent />);
      }).toThrow('useTabletContext must be used within a TabletProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('TabletToggleHeader', () => {
    it('should render toggle buttons', () => {
      const onViewChange = jest.fn();
      
      render(
        <TabletToggleHeader
          activeView="app"
          onViewChange={onViewChange}
        />
      );

      expect(screen.getByText('App')).toBeInTheDocument();
      expect(screen.getByText('AI Chat')).toBeInTheDocument();
    });

    it('should show unread count badge', () => {
      const onViewChange = jest.fn();
      
      render(
        <TabletToggleHeader
          activeView="app"
          onViewChange={onViewChange}
          unreadChatCount={3}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show 9+ for high unread counts', () => {
      const onViewChange = jest.fn();
      
      render(
        <TabletToggleHeader
          activeView="app"
          onViewChange={onViewChange}
          unreadChatCount={15}
        />
      );

      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });
});