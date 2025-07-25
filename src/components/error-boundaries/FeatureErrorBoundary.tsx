"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isMinimized: boolean;
}

/**
 * Feature-level Error Boundary
 * Catches errors in specific features without crashing the entire app
 */
export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isMinimized: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 Feature Error Boundary (${this.props.featureName}) caught an error:`, error);
    console.error('Error Info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Send error to monitoring service with feature context
    // this.logFeatureError(error, errorInfo, this.props.featureName);
  }

  private logFeatureError = (error: Error, errorInfo: ErrorInfo, featureName: string) => {
    // Implementation for error tracking service with feature context
    // Example: Sentry.captureException(error, { 
    //   tags: { feature: featureName },
    //   extra: errorInfo 
    // });
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isMinimized: false,
    });
  };

  private handleMinimize = () => {
    this.setState({ isMinimized: true });
  };

  private handleExpand = () => {
    this.setState({ isMinimized: false });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Minimized error state
      if (this.state.isMinimized) {
        return (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">
                  {this.props.featureName} temporarily unavailable
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={this.handleRetry}
                  className="h-6 px-2 text-red-700 hover:text-red-900"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={this.handleExpand}
                  className="h-6 px-2 text-red-700 hover:text-red-900"
                >
                  Details
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // Full error state
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <div className="flex-1">
            <AlertTitle className="flex items-center justify-between">
              <span>{this.props.featureName} Error</span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={this.handleRetry}
                  className="h-6 px-2 text-red-700 hover:text-red-900"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={this.handleMinimize}
                  className="h-6 px-2 text-red-700 hover:text-red-900"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">
                This feature encountered an error and couldn't load properly. 
                You can try again or continue using other parts of the app.
              </p>
              
              {/* Error details (only in development or if explicitly enabled) */}
              {(process.env.NODE_ENV === 'development' || this.props.showErrorDetails) && 
               this.state.error && (
                <details className="mt-3">
                  <summary className="cursor-pointer font-medium text-red-800 mb-2">
                    Technical Details
                  </summary>
                  <div className="bg-red-100 p-3 rounded text-sm">
                    <p className="font-medium mb-1">Error:</p>
                    <p className="font-mono text-xs break-all mb-2">
                      {this.state.error.message}
                    </p>
                    {this.state.errorInfo && (
                      <>
                        <p className="font-medium mb-1">Component Stack:</p>
                        <pre className="text-xs whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </AlertDescription>
          </div>
        </Alert>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping feature components with error boundary
 */
export function withFeatureErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  featureName: string,
  options?: {
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    showErrorDetails?: boolean;
  }
) {
  const WrappedComponent = (props: P) => (
    <FeatureErrorBoundary
      featureName={featureName}
      fallback={options?.fallback}
      onError={options?.onError}
      showErrorDetails={options?.showErrorDetails}
    >
      <Component {...props} />
    </FeatureErrorBoundary>
  );

  WrappedComponent.displayName = `withFeatureErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Async error boundary for handling promise rejections
 */
export function AsyncErrorBoundary({ 
  children, 
  featureName 
}: { 
  children: ReactNode; 
  featureName: string; 
}) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error(`🚨 Unhandled promise rejection in ${featureName}:`, event.reason);
      
      // TODO: Send to error tracking service
      // Sentry.captureException(event.reason, { 
      //   tags: { feature: featureName, type: 'unhandled_rejection' }
      // });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [featureName]);

  return (
    <FeatureErrorBoundary featureName={featureName}>
      {children}
    </FeatureErrorBoundary>
  );
}
