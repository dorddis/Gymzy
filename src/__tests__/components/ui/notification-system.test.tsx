import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import {
  NotificationContainer,
  useNotifications,
  notificationUtils,
  notificationManager,
} from '@/components/ui/notification-system';

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

// Test component
function TestComponent() {
  const { notifications, addNotification, removeNotification, clearAll } = useNotifications();

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      <button
        onClick={() =>
          addNotification({
            type: 'success',
            title: 'Test Success',
            message: 'This is a test message',
            duration: 1000,
          })
        }
      >
        Add Success
      </button>
      <button
        onClick={() =>
          addNotification({
            type: 'error',
            title: 'Test Error',
            persistent: true,
          })
        }
      >
        Add Error
      </button>
      <button onClick={() => removeNotification(notifications[0]?.id)}>
        Remove First
      </button>
      <button onClick={clearAll}>Clear All</button>
      {notifications.map((notification) => (
        <div key={notification.id} data-testid={`notification-${notification.id}`}>
          {notification.title}
        </div>
      ))}
    </div>
  );
}

describe('NotificationSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Clear any existing notifications
    notificationManager.clearAll();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useNotifications hook', () => {
    it('should initialize with empty notifications', () => {
      render(<TestComponent />);

      expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
    });

    it('should add notification', async () => {
      render(<TestComponent />);

      const addButton = screen.getByText('Add Success');
      act(() => {
        addButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      });

      expect(screen.getByText('Test Success')).toBeInTheDocument();
    });

    it('should remove notification', async () => {
      render(<TestComponent />);

      // Add notification first
      act(() => {
        screen.getByText('Add Success').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      });

      // Remove notification
      act(() => {
        screen.getByText('Remove First').click();
      });

      // Wait for removal animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
      });
    });

    it('should clear all notifications', async () => {
      render(<TestComponent />);

      // Add multiple notifications
      act(() => {
        screen.getByText('Add Success').click();
        screen.getByText('Add Error').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('2');
      });

      // Clear all
      act(() => {
        screen.getByText('Clear All').click();
      });

      // Wait for removal animations
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
      });
    });

    it('should auto-remove notification after duration', async () => {
      render(<TestComponent />);

      act(() => {
        screen.getByText('Add Success').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      });

      // Fast-forward time past duration
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Wait for removal animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
      });
    });

    it('should not auto-remove persistent notifications', async () => {
      render(<TestComponent />);

      act(() => {
        screen.getByText('Add Error').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should still be there
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    });
  });

  describe('NotificationContainer', () => {
    it('should render notification items', async () => {
      render(
        <div>
          <TestComponent />
          <NotificationContainer />
        </div>
      );

      act(() => {
        screen.getByText('Add Success').click();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Test Success')).toHaveLength(2); // One in test component, one in container
      });
    });

    it('should handle close button clicks', async () => {
      render(
        <div>
          <TestComponent />
          <NotificationContainer />
        </div>
      );

      act(() => {
        screen.getByText('Add Success').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      });

      // Click close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      act(() => {
        closeButton.click();
      });

      // Wait for removal animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
      });
    });

    it('should handle action button clicks', async () => {
      const actionCallback = jest.fn();

      render(<NotificationContainer />);

      act(() => {
        notificationManager.addNotification({
          type: 'info',
          title: 'Test Action',
          message: 'Click the action',
          action: {
            label: 'Do Something',
            onClick: actionCallback,
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Do Something')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Do Something'));

      expect(actionCallback).toHaveBeenCalled();
    });
  });

  describe('notificationUtils', () => {
    beforeEach(() => {
      notificationManager.clearAll();
    });

    it('should create success notification', () => {
      const id = notificationUtils.success('Success Title', 'Success message');
      
      expect(id).toBeDefined();
      expect(notificationManager.getNotifications()).toHaveLength(1);
      
      const notification = notificationManager.getNotifications()[0];
      expect(notification.type).toBe('success');
      expect(notification.title).toBe('Success Title');
      expect(notification.message).toBe('Success message');
    });

    it('should create error notification with longer duration', () => {
      const id = notificationUtils.error('Error Title', 'Error message');
      
      expect(id).toBeDefined();
      expect(notificationManager.getNotifications()).toHaveLength(1);
      
      const notification = notificationManager.getNotifications()[0];
      expect(notification.type).toBe('error');
      expect(notification.duration).toBe(5000);
    });

    it('should create info notification', () => {
      const id = notificationUtils.info('Info Title', 'Info message');
      
      expect(id).toBeDefined();
      expect(notificationManager.getNotifications()).toHaveLength(1);
      
      const notification = notificationManager.getNotifications()[0];
      expect(notification.type).toBe('info');
    });

    it('should create warning notification', () => {
      const id = notificationUtils.warning('Warning Title', 'Warning message');
      
      expect(id).toBeDefined();
      expect(notificationManager.getNotifications()).toHaveLength(1);
      
      const notification = notificationManager.getNotifications()[0];
      expect(notification.type).toBe('warning');
      expect(notification.duration).toBe(4000);
    });

    it('should create notification with action', () => {
      const actionCallback = jest.fn();
      
      const id = notificationUtils.withAction(
        'info',
        'Action Title',
        'Action message',
        'Click Me',
        actionCallback
      );
      
      expect(id).toBeDefined();
      expect(notificationManager.getNotifications()).toHaveLength(1);
      
      const notification = notificationManager.getNotifications()[0];
      expect(notification.action?.label).toBe('Click Me');
      expect(notification.action?.onClick).toBe(actionCallback);
    });

    it('should create persistent notification', () => {
      const id = notificationUtils.persistent('warning', 'Persistent Title', 'Persistent message');
      
      expect(id).toBeDefined();
      expect(notificationManager.getNotifications()).toHaveLength(1);
      
      const notification = notificationManager.getNotifications()[0];
      expect(notification.persistent).toBe(true);
    });

    it('should clear all notifications', () => {
      notificationUtils.success('Test 1');
      notificationUtils.error('Test 2');
      
      expect(notificationManager.getNotifications()).toHaveLength(2);
      
      notificationUtils.clearAll();
      
      expect(notificationManager.getNotifications()).toHaveLength(0);
    });
  });

  describe('notification manager', () => {
    it('should generate unique IDs', () => {
      const id1 = notificationManager.addNotification({
        type: 'info',
        title: 'Test 1',
      });
      
      const id2 = notificationManager.addNotification({
        type: 'info',
        title: 'Test 2',
      });

      expect(id1).not.toBe(id2);
    });

    it('should sort notifications by timestamp', () => {
      const id1 = notificationManager.addNotification({
        type: 'info',
        title: 'First',
      });
      
      // Wait a bit
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      const id2 = notificationManager.addNotification({
        type: 'info',
        title: 'Second',
      });

      const notifications = notificationManager.getNotifications();
      expect(notifications[0].title).toBe('Second'); // Most recent first
      expect(notifications[1].title).toBe('First');
    });

    it('should handle onClose callback', () => {
      const onClose = jest.fn();
      
      const id = notificationManager.addNotification({
        type: 'info',
        title: 'Test',
        duration: 100,
        onClose,
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Wait for removal animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onClose).toHaveBeenCalled();
    });

    it('should handle custom IDs', () => {
      const customId = 'my-custom-id';
      
      const id = notificationManager.addNotification({
        id: customId,
        type: 'info',
        title: 'Custom ID Test',
      });

      expect(id).toBe(customId);
      
      const notifications = notificationManager.getNotifications();
      expect(notifications[0].id).toBe(customId);
    });
  });

  describe('notification visibility states', () => {
    it('should handle entrance animation', async () => {
      render(<NotificationContainer />);

      act(() => {
        notificationManager.addNotification({
          type: 'info',
          title: 'Test Animation',
        });
      });

      // Initially not visible
      const notifications = notificationManager.getNotifications();
      expect(notifications[0].isVisible).toBe(false);

      // Should become visible after timeout
      act(() => {
        jest.advanceTimersByTime(50);
      });

      const updatedNotifications = notificationManager.getNotifications();
      expect(updatedNotifications[0].isVisible).toBe(true);
    });

    it('should handle exit animation', async () => {
      render(<NotificationContainer />);

      const id = notificationManager.addNotification({
        type: 'info',
        title: 'Test Exit',
        duration: 100,
      });

      // Wait for entrance
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // Wait for auto-removal to start
      act(() => {
        jest.advanceTimersByTime(100);
      });

      const notifications = notificationManager.getNotifications();
      expect(notifications[0].isRemoving).toBe(true);

      // Wait for removal to complete
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(notificationManager.getNotifications()).toHaveLength(0);
    });
  });
});