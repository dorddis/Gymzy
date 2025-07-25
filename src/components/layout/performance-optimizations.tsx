"use client";

import React, { Suspense, lazy, memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Loading skeleton components
export const ChatSkeleton = memo(() => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="flex space-x-4">
      <div className="rounded-full bg-gray-200 h-8 w-8"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="flex space-x-4">
      <div className="rounded-full bg-gray-200 h-8 w-8"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  </div>
));

ChatSkeleton.displayName = 'ChatSkeleton';

export const WorkoutSkeleton = memo(() => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

WorkoutSkeleton.displayName = 'WorkoutSkeleton';

export const StatsSkeleton = memo(() => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
    <div className="h-64 bg-gray-200 rounded-lg"></div>
  </div>
));

StatsSkeleton.displayName = 'StatsSkeleton';

// Generic loading component
export const LoadingSpinner = memo(({ 
  size = 'default', 
  text = 'Loading...' 
}: { 
  size?: 'sm' | 'default' | 'lg'; 
  text?: string; 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center space-x-2 p-4">
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      <span className="text-gray-600">{text}</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

// Lazy loaded components
export const LazyDesktopChatPanel = lazy(() => 
  import('@/components/chat/desktop-chat-panel').then(module => ({
    default: module.DesktopChatPanel
  }))
);

export const LazyChatIntegrationDemo = lazy(() => 
  import('@/components/chat/chat-integration-demo').then(module => ({
    default: module.ChatIntegrationDemo
  }))
);

export const LazyAppContextDisplay = lazy(() => 
  import('@/components/chat/app-context-display').then(module => ({
    default: module.AppContextDisplay
  }))
);

// Performance-optimized wrapper components
export const OptimizedChatPanel = memo(({ 
  isVisible, 
  ...props 
}: { 
  isVisible: boolean;
  [key: string]: any;
}) => {
  // Only render when visible to save resources
  if (!isVisible) {
    return <ChatSkeleton />;
  }

  return (
    <Suspense fallback={<ChatSkeleton />}>
      <LazyDesktopChatPanel {...props} />
    </Suspense>
  );
});

OptimizedChatPanel.displayName = 'OptimizedChatPanel';

// Hook for debounced values to reduce re-renders
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttled callbacks
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [lastCall, setLastCall] = useState(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        setLastCall(now);
        return callback(...args);
      }
    }) as T,
    [callback, delay, lastCall]
  );
}

// Memoized component for expensive calculations
export const MemoizedComponent = memo<{
  data: any[];
  onUpdate: (data: any) => void;
  computeExpensiveValue: (data: any[]) => any;
}>(({ data, onUpdate, computeExpensiveValue }) => {
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
  }, [data, computeExpensiveValue]);

  const handleUpdate = useCallback((newData: any) => {
    onUpdate(newData);
  }, [onUpdate]);

  return (
    <div>
      <div>Computed Value: {expensiveValue}</div>
      <button onClick={() => handleUpdate(data)}>
        Update
      </button>
    </div>
  );
});

MemoizedComponent.displayName = 'MemoizedComponent';

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
}

// Lazy loading wrapper component
export const LazyLoadWrapper = memo<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}>(({ children, fallback = <LoadingSpinner />, rootMargin = '50px' }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { rootMargin });

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
});

LazyLoadWrapper.displayName = 'LazyLoadWrapper';

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }

      // In production, you might want to send this to analytics
      if (process.env.NODE_ENV === 'production' && renderTime > 100) {
        // Example: Send slow render times to analytics
        // analytics.track('slow_render', { component: componentName, time: renderTime });
      }
    };
  });
}

// Memory usage monitoring hook
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// Component for displaying performance metrics in development
export const PerformanceMonitor = memo(() => {
  const memoryInfo = useMemoryMonitor();

  if (process.env.NODE_ENV !== 'development' || !memoryInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded font-mono">
      <div>Used: {Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)}MB</div>
      <div>Total: {Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024)}MB</div>
      <div>Limit: {Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024)}MB</div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';