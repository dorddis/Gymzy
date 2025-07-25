import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  AppChatBridgeProvider,
  useAppChatBridge,
  useAppActions,
  useAppContext,
  AppAction,
} from '@/contexts/AppChatBridgeContext';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/hooks/use-toast');

const mockPush = jest.fn();
const mockToast = jest.fn();

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

// Test components
function TestBridgeComponent() {
  const bridge = useAppChatBridge();
  
  return (
    <div>
      <button onClick={() => bridge.highlightElement('.test-element')}>
        Highlight Element
      </button>
      <button onClick={() => bridge.navigateToPage('/test')}>
        Navigate
      </button>
      <button onClick={() => bridge.showNotification('Test message', 'success')}>
        Show Notification
      </button>
      <button onClick={() => bridge.updateWorkoutData({ name: 'Test Workout' })}>
        Update Workout
      </button>
      <button onClick={() => bridge.triggerAction('test-action', { data: 'test' })}>
        Trigger Action
      </button>
      <div data-testid="context">
        {JSON.stringify(bridge.getAppContext())}
      </div>
    </div>
  );
}

function TestActionsComponent() {
  const actions = useAppActions(['highlight', 'navigate']);
  
  return (
    <div>
      <div data-testid="actions-count">{actions.length}</div>
      {actions.map((action, index) => (
        <div key={index} data-testid={`action-${index}`}>
          {action.type}: {JSON.stringify(action.payload)}
        </div>
      ))}
    </div>
  );
}

function TestContextComponent() {
  const context = useAppContext();
  
  return (
    <div data-testid="app-context">
      {JSON.stringify(context)}
    </div>
  );
}

describe('AppChatBridgeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockUseToast.mockReturnValue({
      toast: mockToast,
      dismiss: jest.fn(),
      toasts: [],
    });

    // Mock DOM methods
    document.querySelectorAll = jest.fn().mockReturnValue([
      {
        style: {},
      } as HTMLElement,
    ]);
  });

  it('should provide bridge context', () => {
    render(
      <AppChatBridgeProvider>
        <TestBridgeComponent />
      </AppChatBridgeProvider>
    );

    expect(screen.getByText('Highlight Element')).toBeInTheDocument();
    expect(screen.getByTestId('context')).toBeInTheDocument();
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<TestBridgeComponent />);
    }).toThrow('useAppChatBridge must be used within an AppChatBridgeProvider');
    
    consoleSpy.mockRestore();
  });

  describe('highlightElement', () => {
    it('should highlight elements with default options', async () => {
      const mockElement = {
        style: {
          transition: '',
          boxShadow: '',
          border: '',
          animation: '',
        },
      } as HTMLElement;

      document.querySelectorAll = jest.fn().mockReturnValue([mockElement]);

      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
        </AppChatBridgeProvider>
      );

      fireEvent.click(screen.getByText('Highlight Element'));

      expect(document.querySelectorAll).toHaveBeenCalledWith('.test-element');
      expect(mockElement.style.transition).toBe('all 0.3s ease-in-out');
      expect(mockElement.style.boxShadow).toContain('#3B82F6');
    });

    it('should handle elements not found', () => {
      document.querySelectorAll = jest.fn().mockReturnValue([]);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
        </AppChatBridgeProvider>
      );

      fireEvent.click(screen.getByText('Highlight Element'));

      expect(consoleSpy).toHaveBeenCalledWith('No elements found for selector: .test-element');
      consoleSpy.mockRestore();
    });

    it('should clear existing highlights', async () => {
      const mockElement = {
        style: {
          transition: '',
          boxShadow: '',
          border: '',
          animation: '',
        },
      } as HTMLElement;

      document.querySelectorAll = jest.fn().mockReturnValue([mockElement]);

      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
        </AppChatBridgeProvider>
      );

      // First highlight
      fireEvent.click(screen.getByText('Highlight Element'));
      
      // Second highlight should clear the first
      fireEvent.click(screen.getByText('Highlight Element'));

      expect(mockElement.style.transition).toBe('all 0.3s ease-in-out');
    });
  });

  describe('navigateToPage', () => {
    it('should navigate to page and update context', () => {
      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
        </AppChatBridgeProvider>
      );

      fireEvent.click(screen.getByText('Navigate'));

      expect(mockPush).toHaveBeenCalledWith('/test');
    });

    it('should handle navigation errors', () => {
      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
        </AppChatBridgeProvider>
      );

      fireEvent.click(screen.getByText('Navigate'));

      expect(consoleSpy).toHaveBeenCalledWith('Error navigating to page:', expect.any(Error));
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to navigate to page',
        variant: 'destructive',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('showNotification', () => {
    it('should show success notification', () => {
      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
        </AppChatBridgeProvider>
      );

      fireEvent.click(screen.getByText('Show Notification'));

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Test message',
        variant: 'default',
      });
    });

    it('should show error notification', () => {
      render(
        <AppChatBridgeProvider>
          <div>
            <button onClick={() => {
              const bridge = useAppChatBridge();
              bridge.showNotification('Error message', 'error');
            }}>
              Show Error
            </button>
          </div>
        </AppChatBridgeProvider>
      );

      fireEvent.click(screen.getByText('Show Error'));

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Error message',
        variant: 'destructive',
      });
    });
  });

  describe('updateWorkoutData', () => {
    it('should update workout data and context', async () => {
      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
          <TestContextComponent />
        </AppChatBridgeProvider>
      );

      fireEvent.click(screen.getByText('Update Workout'));

      await waitFor(() => {
        const contextElement = screen.getByTestId('app-context');
        const context = JSON.parse(contextElement.textContent || '{}');
        expect(context.activeWorkout).toEqual({ name: 'Test Workout' });
      });
    });
  });

  describe('triggerAction', () => {
    it('should trigger custom action', () => {
      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
        </AppChatBridgeProvider>
      );

      fireEvent.click(screen.getByText('Trigger Action'));

      // Action should be dispatched (tested via action subscription)
    });
  });

  describe('useAppActions hook', () => {
    it('should subscribe to specific action types', async () => {
      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
          <TestActionsComponent />
        </AppChatBridgeProvider>
      );

      // Trigger highlight action
      fireEvent.click(screen.getByText('Highlight Element'));

      await waitFor(() => {
        expect(screen.getByTestId('actions-count')).toHaveTextContent('1');
        expect(screen.getByTestId('action-0')).toHaveTextContent('highlight:');
      });

      // Trigger navigate action
      fireEvent.click(screen.getByText('Navigate'));

      await waitFor(() => {
        expect(screen.getByTestId('actions-count')).toHaveTextContent('2');
      });

      // Trigger non-subscribed action (should not appear)
      fireEvent.click(screen.getByText('Show Notification'));

      await waitFor(() => {
        // Should still be 2 because notification actions are not subscribed
        expect(screen.getByTestId('actions-count')).toHaveTextContent('2');
      });
    });
  });

  describe('useAppContext hook', () => {
    it('should provide current app context', async () => {
      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
          <TestContextComponent />
        </AppChatBridgeProvider>
      );

      const contextElement = screen.getByTestId('app-context');
      const initialContext = JSON.parse(contextElement.textContent || '{}');
      
      expect(initialContext.currentPage).toBe('/');
      expect(initialContext.recentActions).toEqual([]);

      // Update context by triggering an action
      fireEvent.click(screen.getByText('Navigate'));

      await waitFor(() => {
        const updatedContext = JSON.parse(contextElement.textContent || '{}');
        expect(updatedContext.currentPage).toBe('/test');
        expect(updatedContext.recentActions).toHaveLength(1);
      });
    });
  });

  describe('subscription management', () => {
    it('should properly unsubscribe from actions', () => {
      const TestUnsubscribeComponent = () => {
        const [subscribed, setSubscribed] = React.useState(true);
        const actions = subscribed ? useAppActions(['highlight']) : [];
        
        return (
          <div>
            <button onClick={() => setSubscribed(false)}>Unsubscribe</button>
            <div data-testid="actions-count">{actions.length}</div>
          </div>
        );
      };

      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
          <TestUnsubscribeComponent />
        </AppChatBridgeProvider>
      );

      // Subscribe and trigger action
      fireEvent.click(screen.getByText('Highlight Element'));
      
      // Unsubscribe
      fireEvent.click(screen.getByText('Unsubscribe'));

      // Actions should not update after unsubscribe
      expect(screen.getByTestId('actions-count')).toHaveTextContent('0');
    });
  });

  describe('error handling', () => {
    it('should handle errors in action subscribers', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const TestErrorComponent = () => {
        const bridge = useAppChatBridge();
        
        React.useEffect(() => {
          const unsubscribe = bridge.subscribeToActions(() => {
            throw new Error('Subscriber error');
          });
          
          return unsubscribe;
        }, [bridge]);
        
        return <div>Error Test</div>;
      };

      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
          <TestErrorComponent />
        </AppChatBridgeProvider>
      );

      fireEvent.click(screen.getByText('Highlight Element'));

      expect(consoleSpy).toHaveBeenCalledWith('Error in action subscriber:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle errors in context subscribers', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const TestErrorComponent = () => {
        const bridge = useAppChatBridge();
        
        React.useEffect(() => {
          const unsubscribe = bridge.subscribeToContext(() => {
            throw new Error('Context subscriber error');
          });
          
          return unsubscribe;
        }, [bridge]);
        
        return <div>Error Test</div>;
      };

      render(
        <AppChatBridgeProvider>
          <TestBridgeComponent />
          <TestErrorComponent />
        </AppChatBridgeProvider>
      );

      act(() => {
        const bridge = useAppChatBridge();
        bridge.sendContextUpdate({ currentPage: '/error-test' });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error in context subscriber:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});