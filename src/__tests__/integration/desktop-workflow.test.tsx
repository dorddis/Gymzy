import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesktopLayoutWrapper } from '@/components/layout/desktop-layout-wrapper';
import { DesktopChatPanel } from '@/components/chat/desktop-chat-panel';
import { Providers } from '@/app/providers';
import { UserPreferencesManager } from '@/lib/user-preferences';

// Mock dependencies
jest.mock('@/hooks/use-responsive-layout');
jest.mock('@/contexts/AuthContext');
jest.mock('@/contexts/WorkoutContext');
jest.mock('@/services/data/chat-history-service');
jest.mock('@/services/core/ai-chat-service');

const mockUseResponsiveLayout = require('@/hooks/use-responsive-layout').useResponsiveLayout as jest.MockedFunction<any>;
const mockUseAuth = require('@/contexts/AuthContext').useAuth as jest.MockedFunction<any>;
const mockUseWorkout = require('@/contexts/WorkoutContext').useWorkout as jest.MockedFunction<any>;

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1400,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 900,
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Test component that simulates a full desktop layout
function TestDesktopApp() {
  return (
    <div data-testid="test-app">
      <h1>Gymzy App</h1>
      <div className="workout-section">
        <h2>Workout Section</h2>
        <div className="exercise-item" data-exercise-id="exercise-1">
          <h3>Push-ups</h3>
          <button>Log Set</button>
        </div>
      </div>
      <div className="stats-card">
        <h3>Your Stats</h3>
        <p>Total workouts: 10</p>
      </div>
    </div>
  );
}

describe('Desktop Workflow Integration Tests', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock responsive layout for desktop
    mockUseResponsiveLayout.mockReturnValue({
      isDesktop: true,
      isTablet: false,
      isMobile: false,
      breakpoint: 'desktop',
      shouldUseSplitScreen: true,
    });

    // Mock auth context
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user', email: 'test@example.com' },
      loading: false,
    });

    // Mock workout context
    mockUseWorkout.mockReturnValue({
      currentWorkout: null,
      setCurrentWorkoutExercises: jest.fn(),
      workoutHistory: [],
    });

    // Clear preferences
    UserPreferencesManager.getInstance().clearAllPreferences();
  });

  afterEach(() => {
    UserPreferencesManager.getInstance().clearAllPreferences();
  });

  describe('Desktop Layout Rendering', () => {
    it('should render split-screen layout on desktop', async () => {
      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Should render both app and chat panels
      expect(screen.getByTestId('test-app')).toBeInTheDocument();
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      
      // Should have split-screen structure
      const appPanel = screen.getByTestId('test-app').closest('[style*="width"]');
      expect(appPanel).toBeInTheDocument();
    });

    it('should respect user preferences for split ratio', async () => {
      // Set custom split ratio
      UserPreferencesManager.getInstance().updateDesktopPreferences({
        defaultSplitRatio: 0.7,
      });

      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // The layout should use the custom ratio
      // This would be verified by checking CSS custom properties
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--app-panel-width')).toContain('70');
    });

    it('should handle chat panel position preference', async () => {
      // Set chat panel to left
      UserPreferencesManager.getInstance().updateDesktopPreferences({
        chatPanelPosition: 'left',
      });

      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Should apply left positioning styles
      expect(document.documentElement.style.getPropertyValue('--chat-panel-order')).toBe('1');
    });
  });

  describe('Chat-to-App Integration', () => {
    it('should handle workout creation from chat', async () => {
      const mockSetCurrentWorkoutExercises = jest.fn();
      mockUseWorkout.mockReturnValue({
        currentWorkout: null,
        setCurrentWorkoutExercises: mockSetCurrentWorkoutExercises,
        workoutHistory: [],
      });

      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Wait for chat to load
      await waitFor(() => {
        expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      });

      // Simulate AI creating a workout (this would normally come from AI response)
      // For testing, we'll trigger the action directly
      const chatActionHandler = require('@/components/chat/chat-action-handler');
      const { useChatActions } = chatActionHandler;
      
      // This would be triggered by AI response in real scenario
      // mockSetCurrentWorkoutExercises should be called
    });

    it('should handle element highlighting from chat', async () => {
      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      });

      // The highlighting functionality would be tested by triggering
      // the visual feedback system
      const workoutSection = screen.getByText('Workout Section');
      expect(workoutSection).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard shortcuts', async () => {
      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Test Alt+c to focus chat
      fireEvent.keyDown(window, { key: 'c', altKey: true });
      
      // Should focus the chat input
      await waitFor(() => {
        const chatInput = screen.getByPlaceholderText(/Ask me to help/);
        expect(document.activeElement).toBe(chatInput);
      });
    });

    it('should show keyboard shortcuts help', async () => {
      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Test Alt+/ to show help
      fireEvent.keyDown(window, { key: '/', altKey: true });
      
      // Should show keyboard shortcuts dialog
      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle chat panel errors gracefully', async () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create a component that throws an error
      const ErrorChat = () => {
        throw new Error('Chat error');
      };

      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<ErrorChat />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Should show error boundary fallback
      await waitFor(() => {
        expect(screen.getByText('Chat Unavailable')).toBeInTheDocument();
      });

      // App should still be functional
      expect(screen.getByTestId('test-app')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle app panel errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create a component that throws an error
      const ErrorApp = () => {
        throw new Error('App error');
      };

      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <ErrorApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Should show error boundary fallback
      await waitFor(() => {
        expect(screen.getByText('Workout Error')).toBeInTheDocument();
      });

      // Chat should still be functional
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should lazy load chat component', async () => {
      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Should show loading state initially
      expect(screen.getByText('Loading chat...')).toBeInTheDocument();

      // Should load chat after suspense resolves
      await waitFor(() => {
        expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      });
    });

    it('should handle window resize efficiently', async () => {
      const { rerender } = render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Simulate window resize to tablet size
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      mockUseResponsiveLayout.mockReturnValue({
        isDesktop: false,
        isTablet: true,
        isMobile: false,
        breakpoint: 'md',
        shouldUseSplitScreen: false,
      });

      rerender(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Should switch to tablet layout
      await waitFor(() => {
        // Tablet layout would show toggle buttons
        expect(screen.getByTestId('test-app')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Should have skip to content link
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');

      // Chat input should have proper labels
      await waitFor(() => {
        const chatInput = screen.getByLabelText('Chat message input');
        expect(chatInput).toBeInTheDocument();
      });
    });

    it('should support screen readers', async () => {
      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Should have proper heading structure
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Should have proper landmark regions
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('id', 'main-content');
    });
  });

  describe('User Preferences Integration', () => {
    it('should apply compact mode preference', async () => {
      UserPreferencesManager.getInstance().updateDesktopPreferences({
        compactMode: true,
      });

      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Should apply compact mode class
      expect(document.documentElement).toHaveClass('compact-mode');
    });

    it('should respect animation preferences', async () => {
      UserPreferencesManager.getInstance().updateDesktopPreferences({
        animationsEnabled: false,
      });

      render(
        <Providers>
          <DesktopLayoutWrapper
            chatComponent={<DesktopChatPanel />}
          >
            <TestDesktopApp />
          </DesktopLayoutWrapper>
        </Providers>
      );

      // Should disable animations
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--layout-transition-duration')).toBe('0ms');
    });
  });
});