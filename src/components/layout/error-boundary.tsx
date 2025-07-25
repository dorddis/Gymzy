"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevResetKeys[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error boundary when any props change (if enabled)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="p-6 m-4 border-red-200 bg-red-50">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Something went wrong
              </h2>
              <p className="text-red-700 mb-4">
                We encountered an unexpected error. This might be a temporary issue.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-900">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundaries for different parts of the app
export function LayoutErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Layout Error:', error, errorInfo);
      }}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="p-6 max-w-md">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Layout Error
              </h2>
              <p className="text-gray-600 mb-4">
                There was a problem loading the page layout. Please refresh the page.
              </p>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function ChatErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Chat Error:', error, errorInfo);
      }}
      fallback={
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Chat Unavailable</span>
          </div>
          <p className="text-red-600 text-sm mt-1">
            The chat feature is temporarily unavailable. Please try refreshing the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function WorkoutErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Workout Error:', error, errorInfo);
      }}
      fallback={
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Workout Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">
            There was a problem loading your workout. Your data is safe.
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}