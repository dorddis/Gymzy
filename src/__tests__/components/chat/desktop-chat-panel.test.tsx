import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DesktopChatPanel } from '@/components/chat/desktop-chat-panel';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkout } from '@/contexts/WorkoutContext';
import { 
  createChatSession,
  getChatSessions,
  saveChatMessage,
  getChatMessages,
  deleteChatSession 
} from '@/services/data/chat-history-service';
import { sendStreamingChatMessage } from '@/services/core/ai-chat-service';

// Mock all the dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/contexts/WorkoutContext');
jest.mock('@/services/data/chat-history-service');
jest.mock('@/services/core/ai-chat-service');
jest.mock('@/components/chat/chat-bubble', () => ({
  ChatBubble: ({ role, content, onStartWorkout }: any) => (
    <div data-testid={`chat-bubble-${role}`}>
      {content}
      {onStartWorkout && (
        <button onClick={() => onStartWorkout({ exercises: [] })}>
          Start Workout
        </button>
      )}
    </div>
  ),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseWorkout = useWorkout as jest.MockedFunction<typeof useWorkout>;
const mockCreateChatSession = createChatSession as jest.MockedFunction<typeof createChatSession>;
const mockGetChatSessions = getChatSessions as jest.MockedFunction<typeof getChatSessions>;
const mockSaveChatMessage = saveChatMessage as jest.MockedFunction<typeof saveChatMessage>;
const mockGetChatMessages = getChatMessages as jest.MockedFunction<typeof getChatMessages>;
const mockDeleteChatSession = deleteChatSession as jest.MockedFunction<typeof deleteChatSession>;
const mockSendStreamingChatMessage = sendStreamingChatMessage as jest.MockedFunction<typeof sendStreamingChatMessage>;

const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  profile: {
    displayName: 'Test User',
    hasCompletedOnboarding: true,
  },
};

const mockChatSessions = [
  {
    id: 'session-1',
    title: 'Workout Planning',
    lastMessage: 'Help me create a workout',
    updatedAt: { toDate: () => new Date('2024-01-01') },
  },
  {
    id: 'session-2',
    title: 'Nutrition Questions',
    lastMessage: 'What should I eat?',
    updatedAt: { toDate: () => new Date('2024-01-02') },
  },
];

describe('DesktopChatPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      logout: jest.fn(),
    } as any);

    mockUseWorkout.mockReturnValue({
      setCurrentWorkoutExercises: jest.fn(),
    } as any);

    mockCreateChatSession.mockResolvedValue('new-session-id');
    mockGetChatSessions.mockResolvedValue(mockChatSessions as any);
    mockSaveChatMessage.mockResolvedValue(undefined);
    mockGetChatMessages.mockResolvedValue([]);
    mockDeleteChatSession.mockResolvedValue(undefined);
    mockSendStreamingChatMessage.mockResolvedValue({
      success: true,
      workoutData: null,
    });
  });

  it('should render loading state when user is not available', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      logout: jest.fn(),
    } as any);

    render(<DesktopChatPanel />);

    expect(screen.getByText('Loading chat...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loader2 has role="status"
  });

  it('should render embedded chat interface', async () => {
    render(<DesktopChatPanel isEmbedded={true} />);

    await waitFor(() => {
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Ask me to help with your workout...')).toBeInTheDocument();
  });

  it('should render non-embedded chat interface', async () => {
    render(<DesktopChatPanel isEmbedded={false} />);

    await waitFor(() => {
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Ask Gymzy anything about fitness...')).toBeInTheDocument();
  });

  it('should show chat history sidebar by default', async () => {
    render(<DesktopChatPanel />);

    await waitFor(() => {
      expect(screen.getByText('Chat History')).toBeInTheDocument();
    });

    expect(screen.getByText('Workout Planning')).toBeInTheDocument();
    expect(screen.getByText('Nutrition Questions')).toBeInTheDocument();
  });

  it('should hide sidebar in compact mode', () => {
    render(<DesktopChatPanel compact={true} />);

    expect(screen.queryByText('Chat History')).not.toBeInTheDocument();
  });

  it('should toggle sidebar visibility', async () => {
    render(<DesktopChatPanel />);

    await waitFor(() => {
      expect(screen.getByText('Chat History')).toBeInTheDocument();
    });

    // Hide sidebar
    const minimizeButton = screen.getByRole('button', { name: /minimize/i });
    fireEvent.click(minimizeButton);

    expect(screen.queryByText('Chat History')).not.toBeInTheDocument();

    // Show sidebar again
    const maximizeButton = screen.getByRole('button', { name: /maximize/i });
    fireEvent.click(maximizeButton);

    expect(screen.getByText('Chat History')).toBeInTheDocument();
  });

  it('should create new chat session', async () => {
    render(<DesktopChatPanel />);

    const newChatButton = screen.getByRole('button', { name: /new/i });
    fireEvent.click(newChatButton);

    await waitFor(() => {
      expect(mockCreateChatSession).toHaveBeenCalledWith('test-user-id');
    });
  });

  it('should send message and handle streaming response', async () => {
    const streamingCallback = jest.fn();
    mockSendStreamingChatMessage.mockImplementation(async (userId, message, history, onChunk) => {
      // Simulate streaming chunks
      onChunk('Hello ');
      onChunk('there!');
      return { success: true, workoutData: null };
    });

    render(<DesktopChatPanel />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockSendStreamingChatMessage).toHaveBeenCalled();
    });

    expect(mockSaveChatMessage).toHaveBeenCalledWith(
      expect.any(String),
      'user',
      'Hello AI'
    );
  });

  it('should handle keyboard shortcuts', async () => {
    render(<DesktopChatPanel />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test message' } });

    // Test Enter key
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(mockSendStreamingChatMessage).toHaveBeenCalled();
    });
  });

  it('should not send message on Shift+Enter', async () => {
    render(<DesktopChatPanel />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test message' } });

    // Test Shift+Enter (should not send)
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(mockSendStreamingChatMessage).not.toHaveBeenCalled();
  });

  it('should load chat session when clicked', async () => {
    const mockMessages = [
      {
        role: 'user',
        content: 'Hello',
        timestamp: { toDate: () => new Date() },
      },
      {
        role: 'assistant',
        content: 'Hi there!',
        timestamp: { toDate: () => new Date() },
      },
    ];

    mockGetChatMessages.mockResolvedValue(mockMessages as any);

    render(<DesktopChatPanel />);

    await waitFor(() => {
      expect(screen.getByText('Workout Planning')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Workout Planning'));

    await waitFor(() => {
      expect(mockGetChatMessages).toHaveBeenCalledWith('session-1');
    });
  });

  it('should delete chat session', async () => {
    render(<DesktopChatPanel />);

    await waitFor(() => {
      expect(screen.getByText('Workout Planning')).toBeInTheDocument();
    });

    // Find and click delete button (trash icon)
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('class')?.includes('opacity-0')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteChatSession).toHaveBeenCalledWith('session-1');
      });
    }
  });

  it('should handle app actions when embedded', async () => {
    const onAppAction = jest.fn();
    
    mockSendStreamingChatMessage.mockResolvedValue({
      success: true,
      workoutData: { exercises: [{ name: 'Push-ups' }] },
    });

    render(<DesktopChatPanel isEmbedded={true} onAppAction={onAppAction} />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Create a workout' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(onAppAction).toHaveBeenCalledWith('workout-created', {
        exercises: [{ name: 'Push-ups' }],
      });
    });
  });

  it('should handle workout start action', async () => {
    const onAppAction = jest.fn();
    const highlightTarget = jest.fn();
    const mockSetCurrentWorkoutExercises = jest.fn();

    mockUseWorkout.mockReturnValue({
      setCurrentWorkoutExercises: mockSetCurrentWorkoutExercises,
    } as any);

    render(
      <DesktopChatPanel 
        isEmbedded={true} 
        onAppAction={onAppAction}
        highlightTarget={highlightTarget}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('chat-bubble-assistant')).toBeInTheDocument();
    });

    // Simulate clicking start workout button in chat bubble
    const startWorkoutButton = screen.getByText('Start Workout');
    fireEvent.click(startWorkoutButton);

    expect(mockSetCurrentWorkoutExercises).toHaveBeenCalledWith([]);
    expect(onAppAction).toHaveBeenCalledWith('navigate', '/workout');
    expect(highlightTarget).toHaveBeenCalledWith('.workout-section', 2000);
  });

  it('should handle streaming stop', async () => {
    mockSendStreamingChatMessage.mockImplementation(async (userId, message, history, onChunk, signal) => {
      // Simulate long streaming that can be aborted
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (signal?.aborted) {
            clearInterval(interval);
            resolve({ success: false, error: 'Aborted' });
          } else {
            onChunk('chunk ');
          }
        }, 100);
      });
    });

    render(<DesktopChatPanel />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Long message' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Wait for streaming to start, then stop it
    await waitFor(() => {
      const stopButton = screen.getByRole('button', { name: /stop/i });
      expect(stopButton).toBeInTheDocument();
      fireEvent.click(stopButton);
    });
  });

  it('should apply compact styling', () => {
    render(<DesktopChatPanel compact={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('text-sm');
  });

  it('should initialize with initial message', async () => {
    render(<DesktopChatPanel initialMessage="Welcome to fitness tracking!" />);

    await waitFor(() => {
      expect(mockCreateChatSession).toHaveBeenCalledWith(
        'test-user-id',
        'Welcome to fitness tracking!'
      );
    });
  });
});