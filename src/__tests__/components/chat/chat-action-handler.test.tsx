import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChatActionHandler, useChatActions } from '@/components/chat/chat-action-handler';
import { useAppChatBridge } from '@/contexts/AppChatBridgeContext';
import { useRouter } from 'next/navigation';
import { useWorkout } from '@/contexts/WorkoutContext';
import { visualFeedbackUtils } from '@/components/ui/visual-feedback';
import { notificationUtils } from '@/components/ui/notification-system';

// Mock dependencies
jest.mock('@/contexts/AppChatBridgeContext');
jest.mock('next/navigation');
jest.mock('@/contexts/WorkoutContext');
jest.mock('@/components/ui/visual-feedback');
jest.mock('@/components/ui/notification-system');

const mockUseAppChatBridge = useAppChatBridge as jest.MockedFunction<typeof useAppChatBridge>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseWorkout = useWorkout as jest.MockedFunction<typeof useWorkout>;

// Test component for useChatActions hook
function TestChatActionsComponent() {
  const {
    createWorkout,
    startWorkout,
    logSet,
    finishWorkout,
    showStats,
    navigateTo,
    highlightElement,
  } = useChatActions();

  return (
    <div>
      <button onClick={() => createWorkout([{ name: 'Push-ups' }])} data-testid="create-workout">
        Create Workout
      </button>
      <button onClick={() => startWorkout([{ name: 'Squats' }])} data-testid="start-workout">
        Start Workout
      </button>
      <button onClick={() => logSet('exercise-1', { reps: 10 })} data-testid="log-set">
        Log Set
      </button>
      <button onClick={() => finishWorkout()} data-testid="finish-workout">
        Finish Workout
      </button>
      <button onClick={() => showStats()} data-testid="show-stats">
        Show Stats
      </button>
      <button onClick={() => navigateTo('/settings')} data-testid="navigate">
        Navigate
      </button>
      <button onClick={() => highlightElement('.test', 'Test message')} data-testid="highlight">
        Highlight
      </button>
    </div>
  );
}

describe('ChatActionHandler', () => {
  const mockSubscribeToActions = jest.fn();
  const mockTriggerAction = jest.fn();
  const mockPush = jest.fn();
  const mockSetCurrentWorkoutExercises = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAppChatBridge.mockReturnValue({
      subscribeToActions: mockSubscribeToActions,
      triggerAction: mockTriggerAction,
      navigateToPage: jest.fn(),
      highlightElement: jest.fn(),
      updateWorkoutData: jest.fn(),
      showNotification: jest.fn(),
      sendContextUpdate: jest.fn(),
      triggerChatMessage: jest.fn(),
      updateChatState: jest.fn(),
      getAppContext: jest.fn(),
      subscribeToContext: jest.fn(),
    } as any);

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockUseWorkout.mockReturnValue({
      setCurrentWorkoutExercises: mockSetCurrentWorkoutExercises,
    } as any);

    // Setup subscription callback capture
    let subscriberCallback: (action: any) => void;
    mockSubscribeToActions.mockImplementation((callback) => {
      subscriberCallback = callback;
      return jest.fn(); // Unsubscribe function
    });

    // Make the subscriber callback accessible
    (global as any).triggerAction = (type: string, actionType: string, data: any) => {
      if (subscriberCallback) {
        subscriberCallback({
          type,
          payload: { actionType, data },
          timestamp: new Date(),
          id: `test-action-${Date.now()}`,
        });
      }
    };
  });

  afterEach(() => {
    delete (global as any).triggerAction;
  });

  it('should subscribe to actions on mount', () => {
    render(
      <ChatActionHandler>
        <div>Test</div>
      </ChatActionHandler>
    );

    expect(mockSubscribeToActions).toHaveBeenCalled();
  });

  it('should handle create-workout action', async () => {
    render(
      <ChatActionHandler>
        <div>Test</div>
      </ChatActionHandler>
    );

    const exercises = [{ name: 'Push-ups', sets: 3 }];
    
    // Trigger action
    (global as any).triggerAction('trigger-action', 'create-workout', { exercises });

    await waitFor(() => {
      expect(mockSetCurrentWorkoutExercises).toHaveBeenCalledWith(exercises);
      expect(notificationUtils.success).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/workout');
    });
  });

  it('should handle start-workout action', async () => {
    jest.useFakeTimers();
    
    render(
      <ChatActionHandler>
        <div>Test</div>
      </ChatActionHandler>
    );

    const exercises = [{ name: 'Squats', sets: 3 }];
    
    // Trigger action
    (global as any).triggerAction('trigger-action', 'start-workout', { exercises });

    await waitFor(() => {
      expect(mockSetCurrentWorkoutExercises).toHaveBeenCalledWith(exercises);
      expect(notificationUtils.success).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/workout');
    });

    // Fast-forward timer to trigger highlight
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(visualFeedbackUtils.highlightInfo).toHaveBeenCalledWith(
        '.exercise-item:first-child',
        'This is your first exercise'
      );
    });
    
    jest.useRealTimers();
  });

  it('should handle log-set action', async () => {
    render(
      <ChatActionHandler>
        <div>Test</div>
      </ChatActionHandler>
    );

    // Trigger action
    (global as any).triggerAction('trigger-action', 'log-set', { exerciseId: 'exercise-1' });

    await waitFor(() => {
      expect(notificationUtils.success).toHaveBeenCalled();
      expect(visualFeedbackUtils.highlightInfo).toHaveBeenCalledWith(
        '[data-exercise-id="exercise-1"]',
        'Set logged'
      );
    });
  });

  it('should handle finish-workout action', async () => {
    jest.useFakeTimers();
    
    render(
      <ChatActionHandler>
        <div>Test</div>
      </ChatActionHandler>
    );

    // Trigger action
    (global as any).triggerAction('trigger-action', 'finish-workout', {});

    await waitFor(() => {
      expect(notificationUtils.success).toHaveBeenCalledWith(
        'Success',
        'Workout completed! Great job!'
      );
    });

    // Fast-forward timer
    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
    
    jest.useRealTimers();
  });

  it('should handle show-stats action', async () => {
    jest.useFakeTimers();
    
    render(
      <ChatActionHandler>
        <div>Test</div>
      </ChatActionHandler>
    );

    // Trigger action
    (global as any).triggerAction('trigger-action', 'show-stats', {});

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/stats');
    });

    // Fast-forward timer
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(visualFeedbackUtils.highlightInfo).toHaveBeenCalledWith(
        '.stats-card',
        'Here are your stats'
      );
    });
    
    jest.useRealTimers();
  });

  it('should handle navigate action', async () => {
    render(
      <ChatActionHandler>
        <div>Test</div>
      </ChatActionHandler>
    );

    // Trigger action
    (global as any).triggerAction('trigger-action', 'navigate', { path: '/settings' });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/settings');
    });
  });

  it('should handle highlight action', async () => {
    render(
      <ChatActionHandler>
        <div>Test</div>
      </ChatActionHandler>
    );

    // Trigger action
    (global as any).triggerAction('trigger-action', 'highlight', { 
      selector: '.test-element', 
      message: 'Look here' 
    });

    await waitFor(() => {
      expect(visualFeedbackUtils.highlightInfo).toHaveBeenCalledWith(
        '.test-element',
        'Look here'
      );
    });
  });

  it('should handle explain action', async () => {
    render(
      <ChatActionHandler>
        <div>Test</div>
      </ChatActionHandler>
    );

    // Trigger action
    (global as any).triggerAction('trigger-action', 'explain', { 
      message: 'This is how it works' 
    });

    await waitFor(() => {
      expect(notificationUtils.info).toHaveBeenCalledWith(
        'Explanation',
        'This is how it works'
      );
    });
  });

  it('should skip already processed actions', async () => {
    render(
      <ChatActionHandler>
        <div>Test</div>
      </ChatActionHandler>
    );

    // Create action with fixed ID
    const actionId = 'test-action-123';
    const action = {
      type: 'trigger-action',
      payload: { actionType: 'navigate', data: { path: '/settings' } },
      timestamp: new Date(),
      id: actionId,
    };

    // Get the subscriber callback
    const subscriberCallback = mockSubscribeToActions.mock.calls[0][0];

    // Call it twice with the same action
    subscriberCallback(action);
    subscriberCallback(action);

    // Should only navigate once
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('should warn about unknown action types', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    render(
      <ChatActionHandler>
        <div>Test</div>
      </ChatActionHandler>
    );

    // Trigger unknown action
    (global as any).triggerAction('trigger-action', 'unknown-action', {});

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('No handler for action type: unknown-action');
    });
    
    consoleSpy.mockRestore();
  });
});

describe('useChatActions hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAppChatBridge.mockReturnValue({
      triggerAction: mockTriggerAction,
      subscribeToActions: jest.fn(),
      navigateToPage: jest.fn(),
      highlightElement: jest.fn(),
      updateWorkoutData: jest.fn(),
      showNotification: jest.fn(),
      sendContextUpdate: jest.fn(),
      triggerChatMessage: jest.fn(),
      updateChatState: jest.fn(),
      getAppContext: jest.fn(),
      subscribeToContext: jest.fn(),
    } as any);
  });

  it('should provide action methods', () => {
    render(<TestChatActionsComponent />);

    // Test createWorkout
    screen.getByTestId('create-workout').click();
    expect(mockTriggerAction).toHaveBeenCalledWith('create-workout', { 
      exercises: [{ name: 'Push-ups' }] 
    });

    // Test startWorkout
    screen.getByTestId('start-workout').click();
    expect(mockTriggerAction).toHaveBeenCalledWith('start-workout', { 
      exercises: [{ name: 'Squats' }] 
    });

    // Test logSet
    screen.getByTestId('log-set').click();
    expect(mockTriggerAction).toHaveBeenCalledWith('log-set', { 
      exerciseId: 'exercise-1', 
      setData: { reps: 10 } 
    });

    // Test finishWorkout
    screen.getByTestId('finish-workout').click();
    expect(mockTriggerAction).toHaveBeenCalledWith('finish-workout', undefined);

    // Test showStats
    screen.getByTestId('show-stats').click();
    expect(mockTriggerAction).toHaveBeenCalledWith('show-stats', undefined);

    // Test navigateTo
    screen.getByTestId('navigate').click();
    expect(mockTriggerAction).toHaveBeenCalledWith('navigate', { path: '/settings' });

    // Test highlightElement
    screen.getByTestId('highlight').click();
    expect(mockTriggerAction).toHaveBeenCalledWith('highlight', { 
      selector: '.test', 
      message: 'Test message' 
    });
  });
});