"use client";

import React, { useEffect, useRef, ReactNode } from 'react';
import { TabletToggleHeader, TabletViewIndicator, useTabletToggle, TabletView } from './tablet-toggle-header';
import { cn } from '@/lib/utils';

interface TabletLayoutManagerProps {
  appContent: ReactNode;
  chatContent: ReactNode;
  className?: string;
  enableSwipeGestures?: boolean;
  enableKeyboardShortcuts?: boolean;
  onViewChange?: (view: TabletView) => void;
  unreadChatCount?: number;
  showNotificationBadge?: boolean;
}

export function TabletLayoutManager({
  appContent,
  chatContent,
  className,
  enableSwipeGestures = true,
  enableKeyboardShortcuts = true,
  onViewChange,
  unreadChatCount,
  showNotificationBadge,
}: TabletLayoutManagerProps) {
  const { activeView, isTransitioning, switchView, toggleView } = useTabletToggle();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Notify parent of view changes
  useEffect(() => {
    onViewChange?.(activeView);
  }, [activeView, onViewChange]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + Tab to toggle views
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        toggleView();
      }
      
      // Alt + 1 for app view
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        switchView('app');
      }
      
      // Alt + 2 for chat view
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        switchView('chat');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, toggleView, switchView]);

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeGestures || isTransitioning) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enableSwipeGestures || !touchStartRef.current || isTransitioning) return;

    const touch = e.changedTouches[0];
    const touchStart = touchStartRef.current;
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    // Reset touch start
    touchStartRef.current = null;

    // Check if it's a valid swipe (horizontal, fast enough, long enough)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isQuickSwipe = deltaTime < 300;
    const isLongEnoughSwipe = Math.abs(deltaX) > 50;

    if (isHorizontalSwipe && isQuickSwipe && isLongEnoughSwipe) {
      if (deltaX > 0 && activeView === 'chat') {
        // Swipe right: chat -> app
        switchView('app');
      } else if (deltaX < 0 && activeView === 'app') {
        // Swipe left: app -> chat
        switchView('chat');
      }
    }
  };

  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      {/* Toggle Header */}
      <TabletToggleHeader
        activeView={activeView}
        onViewChange={switchView}
        unreadChatCount={unreadChatCount}
        showNotificationBadge={showNotificationBadge}
      />

      {/* Content Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* App View */}
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-300 ease-in-out",
            activeView === 'app' ? "translate-x-0" : "-translate-x-full",
            isTransitioning && "pointer-events-none"
          )}
        >
          <div className="h-full overflow-y-auto">
            {appContent}
          </div>
        </div>

        {/* Chat View */}
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-300 ease-in-out",
            activeView === 'chat' ? "translate-x-0" : "translate-x-full",
            isTransitioning && "pointer-events-none"
          )}
        >
          <div className="h-full overflow-y-auto">
            {chatContent}
          </div>
        </div>

        {/* Loading overlay during transitions */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600">Switching...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Indicator */}
      <TabletViewIndicator activeView={activeView} />

      {/* Keyboard Shortcuts Help */}
      {enableKeyboardShortcuts && (
        <div className="hidden">
          <div title="Alt + Tab: Toggle views, Alt + 1: App view, Alt + 2: Chat view" />
        </div>
      )}
    </div>
  );
}

// Hook for tablet-specific functionality
export function useTabletFeatures() {
  const [isTabletMode, setIsTabletMode] = React.useState(false);
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkTabletMode = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Consider it tablet mode if width is between 768px and 1023px
      setIsTabletMode(width >= 768 && width < 1024);
      
      // Determine orientation
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    checkTabletMode();
    window.addEventListener('resize', checkTabletMode);
    window.addEventListener('orientationchange', checkTabletMode);

    return () => {
      window.removeEventListener('resize', checkTabletMode);
      window.removeEventListener('orientationchange', checkTabletMode);
    };
  }, []);

  return {
    isTabletMode,
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
}

// Context for tablet state management
interface TabletContextValue {
  activeView: TabletView;
  switchView: (view: TabletView) => void;
  toggleView: () => void;
  isTransitioning: boolean;
  isTabletMode: boolean;
  orientation: 'portrait' | 'landscape';
}

const TabletContext = React.createContext<TabletContextValue | null>(null);

export function TabletProvider({ children }: { children: ReactNode }) {
  const { activeView, isTransitioning, switchView, toggleView } = useTabletToggle();
  const { isTabletMode, orientation } = useTabletFeatures();

  const value: TabletContextValue = {
    activeView,
    switchView,
    toggleView,
    isTransitioning,
    isTabletMode,
    orientation,
  };

  return (
    <TabletContext.Provider value={value}>
      {children}
    </TabletContext.Provider>
  );
}

export function useTabletContext(): TabletContextValue {
  const context = React.useContext(TabletContext);
  if (!context) {
    throw new Error('useTabletContext must be used within a TabletProvider');
  }
  return context;
}