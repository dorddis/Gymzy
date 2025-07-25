'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

// Screen Reader Only utility component
export function ScreenReaderOnly({ children, as: Component = 'span' }: { 
  children: React.ReactNode; 
  as?: keyof JSX.IntrinsicElements;
}) {
  return React.createElement(Component, { className: 'sr-only' }, children);
}

// Skip to content link added a commed here
export function SkipToContent() {
  const { focusElement } = useAccessibility();

  const handleSkipToMain = (e: React.KeyboardEvent) => {
    e.preventDefault();
    focusElement('#main-content');
  };

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      onKeyDown={(e) => e.key === 'Enter' && handleSkipToMain(e)}
    >
      Skip to main content
    </a>
  );
}

// Screen reader announcement component
interface ScreenReaderAnnouncementProps {
  message: string;
  assertive?: boolean;
  className?: string;
}

export function ScreenReaderAnnouncement({ 
  message, 
  assertive = false, 
  className = '' 
}: ScreenReaderAnnouncementProps) {
  return (
    <div
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
}

// Hook for managing screen reader announcements
export function useScreenReaderAnnouncement() {
  const [announcement, setAnnouncement] = useState('');
  const [isAssertive, setIsAssertive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = (message: string, assertive = false) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsAssertive(assertive);
    setAnnouncement(message);

    // Clear announcement after it's been read
    timeoutRef.current = setTimeout(() => {
      setAnnouncement('');
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    announcement,
    isAssertive,
    announce,
    AnnouncementComponent: () => announcement ? (
      <ScreenReaderAnnouncement message={announcement} assertive={isAssertive} />
    ) : null,
  };
}

// ARIA region wrapper
interface AriaRegionProps {
  children: React.ReactNode;
  label: string;
  role?: string;
  description?: string;
  className?: string;
}

export function AriaRegion({ 
  children, 
  label, 
  role, 
  description, 
  className = '' 
}: AriaRegionProps) {
  return (
    <div
      role={role}
      aria-label={label}
      aria-description={description}
      className={className}
    >
      {children}
    </div>
  );
}

// Focusable element wrapper with proper focus styles
interface FocusableElementProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  [key: string]: any;
}

export function FocusableElement({ 
  children, 
  as: Component = 'div', 
  className = '', 
  onClick,
  onKeyDown,
  ...props 
}: FocusableElementProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
    onKeyDown?.(e);
  };

  return React.createElement(
    Component,
    {
      tabIndex: 0,
      className: `focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${className}`,
      onClick,
      onKeyDown: handleKeyDown,
      ...props,
    },
    children
  );
}

// Loading state with accessibility
interface AccessibleLoadingProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleLoading({ 
  isLoading, 
  loadingText = 'Loading...', 
  children, 
  className = '' 
}: AccessibleLoadingProps) {
  return (
    <div className={className}>
      {isLoading ? (
        <div role="status" aria-live="polite">
          <ScreenReaderOnly>{loadingText}</ScreenReaderOnly>
          <div aria-hidden="true">
            {/* Visual loading indicator */}
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// Error boundary with accessibility
interface AccessibleErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AccessibleErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  AccessibleErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AccessibleErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AccessibleErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <div role="alert" className="p-4 border border-red-300 rounded-md bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-700">
            An error occurred while loading this section. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Accessible form field wrapper
interface AccessibleFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export function AccessibleFormField({
  label,
  required = false,
  error,
  helpText,
  children,
  id,
  className = '',
}: AccessibleFormFieldProps) {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  // Clone children to add accessibility props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const describedBy = [
        error ? errorId : null,
        helpText ? helpId : null,
      ].filter(Boolean).join(' ');

      return React.cloneElement(child, {
        id: fieldId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? 'true' : undefined,
        'aria-required': required ? 'true' : undefined,
      });
    }
    return child;
  });

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {enhancedChildren}
      
      {helpText && (
        <p id={helpId} className="text-sm text-gray-600">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible modal/dialog
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '' 
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { trapFocus } = useAccessibility();

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cleanup = trapFocus(modalRef.current);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        cleanup();
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, trapFocus]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div
        ref={modalRef}
        className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}
      >
        <div className="p-6">
          <h2 id="modal-title" className="text-lg font-semibold mb-4">
            {title}
          </h2>
          
          {children}
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
            aria-label="Close modal"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>
    </div>
  );
}