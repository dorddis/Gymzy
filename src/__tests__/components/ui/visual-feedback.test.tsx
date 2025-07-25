import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import {
  VisualFeedbackProvider,
  useVisualFeedback,
  visualFeedbackUtils,
  feedbackManager,
} from '@/components/ui/visual-feedback';

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

// Mock DOM methods
const mockGetBoundingClientRect = jest.fn();
const mockQuerySelector = jest.fn();

Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
});

// Test component
function TestComponent() {
  const { feedbacks, addFeedback, removeFeedback, clearAll } = useVisualFeedback();

  return (
    <div>
      <div data-testid="feedback-count">{feedbacks.length}</div>
      <button
        onClick={() =>
          addFeedback({
            type: 'highlight',
            target: '.test-element',
            duration: 1000,
          })
        }
      >
        Add Feedback
      </button>
      <button onClick={() => removeFeedback(feedbacks[0]?.id)}>
        Remove First
      </button>
      <button onClick={clearAll}>Clear All</button>
      {feedbacks.map((feedback) => (
        <div key={feedback.id} data-testid={`feedback-${feedback.id}`}>
          {feedback.options.type}
        </div>
      ))}
    </div>
  );
}

describe('VisualFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockGetBoundingClientRect.mockReturnValue({
      top: 100,
      left: 100,
      width: 200,
      height: 50,
      bottom: 150,
      right: 300,
    });

    mockQuerySelector.mockReturnValue({
      getBoundingClientRect: mockGetBoundingClientRect,
    });

    // Clear any existing feedbacks
    feedbackManager.clearAllFeedbacks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useVisualFeedback hook', () => {
    it('should initialize with empty feedbacks', () => {
      render(
        <VisualFeedbackProvider>
          <TestComponent />
        </VisualFeedbackProvider>
      );

      expect(screen.getByTestId('feedback-count')).toHaveTextContent('0');
    });

    it('should add feedback', async () => {
      render(
        <VisualFeedbackProvider>
          <TestComponent />
        </VisualFeedbackProvider>
      );

      const addButton = screen.getByText('Add Feedback');
      act(() => {
        addButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('feedback-count')).toHaveTextContent('1');
      });
    });

    it('should remove feedback', async () => {
      render(
        <VisualFeedbackProvider>
          <TestComponent />
        </VisualFeedbackProvider>
      );

      // Add feedback first
      act(() => {
        screen.getByText('Add Feedback').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('feedback-count')).toHaveTextContent('1');
      });

      // Remove feedback
      act(() => {
        screen.getByText('Remove First').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('feedback-count')).toHaveTextContent('0');
      });
    });

    it('should clear all feedbacks', async () => {
      render(
        <VisualFeedbackProvider>
          <TestComponent />
        </VisualFeedbackProvider>
      );

      // Add multiple feedbacks
      act(() => {
        screen.getByText('Add Feedback').click();
        screen.getByText('Add Feedback').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('feedback-count')).toHaveTextContent('2');
      });

      // Clear all
      act(() => {
        screen.getByText('Clear All').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('feedback-count')).toHaveTextContent('0');
      });
    });

    it('should auto-remove feedback after duration', async () => {
      render(
        <VisualFeedbackProvider>
          <TestComponent />
        </VisualFeedbackProvider>
      );

      act(() => {
        screen.getByText('Add Feedback').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('feedback-count')).toHaveTextContent('1');
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('feedback-count')).toHaveTextContent('0');
      });
    });
  });

  describe('VisualFeedbackProvider', () => {
    it('should render feedback overlays', async () => {
      render(
        <VisualFeedbackProvider>
          <TestComponent />
        </VisualFeedbackProvider>
      );

      act(() => {
        screen.getByText('Add Feedback').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('feedback-count')).toHaveTextContent('1');
      });

      // Should render the feedback overlay
      expect(screen.getByText('highlight')).toBeInTheDocument();
    });

    it('should handle element not found gracefully', () => {
      mockQuerySelector.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <VisualFeedbackProvider>
          <TestComponent />
        </VisualFeedbackProvider>
      );

      act(() => {
        screen.getByText('Add Feedback').click();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Visual feedback target not found: .test-element'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('visualFeedbackUtils', () => {
    beforeEach(() => {
      // Reset the manager
      feedbackManager.clearAllFeedbacks();
    });

    it('should create success highlight', () => {
      const id = visualFeedbackUtils.highlightSuccess('.test', 'Success message');
      
      expect(id).toBeDefined();
      expect(feedbackManager.getFeedbacks()).toHaveLength(1);
      
      const feedback = feedbackManager.getFeedbacks()[0];
      expect(feedback.options.color).toBe('#10B981');
      expect(feedback.options.message).toBe('Success message');
    });

    it('should create error highlight', () => {
      const id = visualFeedbackUtils.highlightError('.test', 'Error message');
      
      expect(id).toBeDefined();
      expect(feedbackManager.getFeedbacks()).toHaveLength(1);
      
      const feedback = feedbackManager.getFeedbacks()[0];
      expect(feedback.options.color).toBe('#EF4444');
      expect(feedback.options.duration).toBe(3000);
    });

    it('should create info highlight', () => {
      const id = visualFeedbackUtils.highlightInfo('.test', 'Info message');
      
      expect(id).toBeDefined();
      expect(feedbackManager.getFeedbacks()).toHaveLength(1);
      
      const feedback = feedbackManager.getFeedbacks()[0];
      expect(feedback.options.color).toBe('#3B82F6');
    });

    it('should create pulse effect', () => {
      const id = visualFeedbackUtils.pulse('.test');
      
      expect(id).toBeDefined();
      expect(feedbackManager.getFeedbacks()).toHaveLength(1);
      
      const feedback = feedbackManager.getFeedbacks()[0];
      expect(feedback.options.type).toBe('pulse');
    });

    it('should create glow effect', () => {
      const id = visualFeedbackUtils.glow('.test');
      
      expect(id).toBeDefined();
      expect(feedbackManager.getFeedbacks()).toHaveLength(1);
      
      const feedback = feedbackManager.getFeedbacks()[0];
      expect(feedback.options.type).toBe('glow');
      expect(feedback.options.intensity).toBe('high');
    });

    it('should create ripple effect', () => {
      const id = visualFeedbackUtils.ripple('.test');
      
      expect(id).toBeDefined();
      expect(feedbackManager.getFeedbacks()).toHaveLength(1);
      
      const feedback = feedbackManager.getFeedbacks()[0];
      expect(feedback.options.type).toBe('ripple');
    });

    it('should create shake effect', () => {
      const id = visualFeedbackUtils.shake('.test');
      
      expect(id).toBeDefined();
      expect(feedbackManager.getFeedbacks()).toHaveLength(1);
      
      const feedback = feedbackManager.getFeedbacks()[0];
      expect(feedback.options.type).toBe('shake');
      expect(feedback.options.duration).toBe(1000);
    });

    it('should clear all feedbacks', () => {
      visualFeedbackUtils.highlightSuccess('.test1');
      visualFeedbackUtils.highlightError('.test2');
      
      expect(feedbackManager.getFeedbacks()).toHaveLength(2);
      
      visualFeedbackUtils.clearAll();
      
      expect(feedbackManager.getFeedbacks()).toHaveLength(0);
    });
  });

  describe('FeedbackOverlay component', () => {
    it('should update position on scroll', async () => {
      render(
        <VisualFeedbackProvider>
          <TestComponent />
        </VisualFeedbackProvider>
      );

      act(() => {
        screen.getByText('Add Feedback').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('feedback-count')).toHaveTextContent('1');
      });

      // Simulate scroll
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      expect(mockGetBoundingClientRect).toHaveBeenCalled();
    });

    it('should update position on resize', async () => {
      render(
        <VisualFeedbackProvider>
          <TestComponent />
        </VisualFeedbackProvider>
      );

      act(() => {
        screen.getByText('Add Feedback').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('feedback-count')).toHaveTextContent('1');
      });

      // Simulate resize
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(mockGetBoundingClientRect).toHaveBeenCalled();
    });
  });

  describe('feedback manager', () => {
    it('should generate unique IDs', () => {
      const id1 = feedbackManager.addFeedback({
        type: 'highlight',
        target: '.test1',
      });
      
      const id2 = feedbackManager.addFeedback({
        type: 'highlight',
        target: '.test2',
      });

      expect(id1).not.toBe(id2);
    });

    it('should handle onComplete callback', () => {
      const onComplete = jest.fn();
      
      const id = feedbackManager.addFeedback({
        type: 'highlight',
        target: '.test',
        duration: 100,
        onComplete,
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle persistent feedback', () => {
      const id = feedbackManager.addFeedback({
        type: 'highlight',
        target: '.test',
        duration: 0, // Persistent
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(feedbackManager.getFeedbacks()).toHaveLength(1);
      
      // Manual removal
      feedbackManager.removeFeedback(id);
      expect(feedbackManager.getFeedbacks()).toHaveLength(0);
    });
  });
});