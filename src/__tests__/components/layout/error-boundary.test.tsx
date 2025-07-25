import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ErrorBoundary,
  withErrorBoundary,
  LayoutErrorBoundary,
  ChatErrorBoundary,
  WorkoutErrorBoundary,
} from '@/components/layout/error-boundary';

// Component that throws an error
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Component for testing withErrorBoundary HOC
const ComponentWithErrorBoundary = withErrorBoundary(ThrowError, {
  onError: jest.fn(),
});

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Test Child</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom Error</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should reset error boundary when Try Again is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try Again'));

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should reload page when Reload Page is clicked', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Reload Page'));

    expect(mockReload).toHaveBeenCalled();
  });

  it('should reset when resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1']}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change resetKeys
    rerender(
      <ErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should reset when resetOnPropsChange is true and props change', () => {
    const { rerender } = render(
      <ErrorBoundary resetOnPropsChange={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change props
    rerender(
      <ErrorBoundary resetOnPropsChange={true} onError={jest.fn()}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('withErrorBoundary HOC', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should wrap component with error boundary', () => {
    render(<ComponentWithErrorBoundary shouldThrow={false} />);

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    render(<ComponentWithErrorBoundary shouldThrow={true} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

describe('LayoutErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error', () => {
    render(
      <LayoutErrorBoundary>
        <div data-testid="layout-child">Layout Content</div>
      </LayoutErrorBoundary>
    );

    expect(screen.getByTestId('layout-child')).toBeInTheDocument();
  });

  it('should render layout-specific error UI', () => {
    render(
      <LayoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LayoutErrorBoundary>
    );

    expect(screen.getByText('Layout Error')).toBeInTheDocument();
    expect(screen.getByText('There was a problem loading the page layout. Please refresh the page.')).toBeInTheDocument();
  });
});

describe('ChatErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error', () => {
    render(
      <ChatErrorBoundary>
        <div data-testid="chat-child">Chat Content</div>
      </ChatErrorBoundary>
    );

    expect(screen.getByTestId('chat-child')).toBeInTheDocument();
  });

  it('should render chat-specific error UI', () => {
    render(
      <ChatErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ChatErrorBoundary>
    );

    expect(screen.getByText('Chat Unavailable')).toBeInTheDocument();
    expect(screen.getByText('The chat feature is temporarily unavailable. Please try refreshing the page.')).toBeInTheDocument();
  });
});

describe('WorkoutErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error', () => {
    render(
      <WorkoutErrorBoundary>
        <div data-testid="workout-child">Workout Content</div>
      </WorkoutErrorBoundary>
    );

    expect(screen.getByTestId('workout-child')).toBeInTheDocument();
  });

  it('should render workout-specific error UI', () => {
    render(
      <WorkoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>
    );

    expect(screen.getByText('Workout Error')).toBeInTheDocument();
    expect(screen.getByText('There was a problem loading your workout. Your data is safe.')).toBeInTheDocument();
  });
});