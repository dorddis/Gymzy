"use client";

import React, { ReactNode, useEffect, useState, Suspense, memo } from 'react';
import { useResponsiveLayout, useSplitScreenDimensions } from '@/hooks/use-responsive-layout';
import { 
  getSplitScreenCSSProperties, 
  loadSplitRatio, 
  saveSplitRatio,
  LAYOUT_CONFIG 
} from '@/lib/layout-utils';
import { ResizableDivider } from '@/components/layout/resizable-divider';
import { TabletLayoutManager } from '@/components/layout/tablet-layout-manager';
import { LayoutErrorBoundary, ChatErrorBoundary, WorkoutErrorBoundary } from '@/components/layout/error-boundary';
import { 
  OptimizedChatPanel, 
  LoadingSpinner, 
  usePerformanceMonitor,
  LazyLoadWrapper 
} from '@/components/layout/performance-optimizations';
import { useDesktopChatIntegration, useChatPanelVisibility } from '@/hooks/use-desktop-chat-integration';
import { useDesktopPreferences } from '@/lib/user-preferences';
import { usePreferenceStyles } from '@/hooks/use-preference-aware-layout';
import { cn } from '@/lib/utils';

interface DesktopLayoutWrapperProps {
  children: ReactNode;
  chatComponent: ReactNode;
  className?: string;
  onLayoutChange?: (breakpoint: string, dimensions?: any) => void;
}

export function DesktopLayoutWrapper({
  children,
  chatComponent,
  className,
  onLayoutChange,
}: DesktopLayoutWrapperProps) {
  const layout = useResponsiveLayout();
  const { desktopPreferences } = useDesktopPreferences();
  const preferenceStyles = usePreferenceStyles();
  const [savedRatio, setSavedRatio] = useState<number>(desktopPreferences.defaultSplitRatio);
  
  // Load saved split ratio on mount, but prefer user preferences
  useEffect(() => {
    const ratio = loadSplitRatio();
    // Use preference default if no saved ratio, otherwise use saved ratio
    setSavedRatio(ratio !== LAYOUT_CONFIG.DEFAULT_APP_PANEL_RATIO ? ratio : desktopPreferences.defaultSplitRatio);
  }, [desktopPreferences.defaultSplitRatio]);

  const splitScreen = useSplitScreenDimensions(
    savedRatio,
    LAYOUT_CONFIG.MIN_APP_PANEL_WIDTH,
    LAYOUT_CONFIG.MIN_CHAT_PANEL_WIDTH
  );

  // Save ratio changes to localStorage
  useEffect(() => {
    if (splitScreen.splitRatio !== savedRatio) {
      saveSplitRatio(splitScreen.splitRatio);
      setSavedRatio(splitScreen.splitRatio);
    }
  }, [splitScreen.splitRatio, savedRatio]);

  // Notify parent of layout changes
  useEffect(() => {
    onLayoutChange?.(layout.breakpoint, {
      ...layout,
      splitScreen: layout.shouldUseSplitScreen ? splitScreen : null,
    });
  }, [layout, splitScreen, onLayoutChange]);

  // Mobile layout - existing mobile-first design
  if (layout.isMobile) {
    return (
      <div className={cn("min-h-screen bg-background", className)}>
        {children}
      </div>
    );
  }

  // Tablet layout - toggle between app and chat
  if (layout.isTablet) {
    return (
      <TabletToggleLayout
        appContent={children}
        chatContent={chatComponent}
        className={className}
      />
    );
  }

  // Desktop layout - split screen
  if (layout.isDesktop) {
    return (
      <DesktopSplitScreenLayout
        appContent={children}
        chatContent={chatComponent}
        dimensions={splitScreen}
        className={className}
      />
    );
  }

  // Fallback to mobile layout
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {children}
    </div>
  );
}

interface TabletToggleLayoutProps {
  appContent: ReactNode;
  chatContent: ReactNode;
  className?: string;
}

function TabletToggleLayout({ appContent, chatContent, className }: TabletToggleLayoutProps) {
  return (
    <TabletLayoutManager
      appContent={appContent}
      chatContent={chatContent}
      className={className}
      enableSwipeGestures={true}
      enableKeyboardShortcuts={true}
    />
  );
}

interface DesktopSplitScreenLayoutProps {
  appContent: ReactNode;
  chatContent: ReactNode;
  dimensions: ReturnType<typeof useSplitScreenDimensions>;
  className?: string;
}

const DesktopSplitScreenLayout = memo(function DesktopSplitScreenLayout({
  appContent,
  chatContent,
  dimensions,
  className,
}: DesktopSplitScreenLayoutProps) {
  const cssProperties = getSplitScreenCSSProperties(dimensions);
  const chatIntegration = useDesktopChatIntegration();
  const chatVisibility = useChatPanelVisibility();
  
  // Performance monitoring in development
  usePerformanceMonitor('DesktopSplitScreenLayout');

  return (
    <LayoutErrorBoundary>
      <div 
        className={cn("min-h-screen bg-background relative", className)}
        style={cssProperties}
      >
        {/* App Panel */}
        <WorkoutErrorBoundary>
          <div 
            className="absolute top-0 left-0 bottom-0 bg-background overflow-hidden"
            style={{ width: `var(--app-panel-width)` }}
          >
            <div className="h-full overflow-y-auto">
              <LazyLoadWrapper fallback={<LoadingSpinner text="Loading app..." />}>
                {appContent}
              </LazyLoadWrapper>
            </div>
          </div>
        </WorkoutErrorBoundary>

        {/* Resizable Divider */}
        {dimensions.canResize && (
          <ResizableDivider
            splitRatio={dimensions.splitRatio}
            onSplitRatioChange={dimensions.updateSplitRatio}
            containerWidth={dimensions.containerWidth}
            minAppPanelWidth={dimensions.minAppPanelWidth}
            minChatPanelWidth={dimensions.minChatPanelWidth}
            className="absolute top-0 bottom-0 z-10"
            aria-label="Resize app and chat panels"
          />
        )}

        {/* Chat Panel */}
        <ChatErrorBoundary>
          <div 
            className="absolute top-0 right-0 bottom-0 bg-white border-l border-gray-200 overflow-hidden"
            style={{ width: `var(--chat-panel-width)` }}
          >
            <div className="h-full overflow-y-auto">
              <Suspense fallback={<LoadingSpinner text="Loading chat..." />}>
                <OptimizedChatPanel 
                  isVisible={chatVisibility.isVisible}
                  isEmbedded={true}
                  compact={false}
                />
              </Suspense>
            </div>
          </div>
        </ChatErrorBoundary>
      </div>
    </LayoutErrorBoundary>
  );
});