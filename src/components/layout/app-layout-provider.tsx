"use client";

import React, { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DesktopLayoutWrapper } from '@/components/layout/desktop-layout-wrapper';
import { DesktopChatPanel } from '@/components/chat/desktop-chat-panel';
import { AppChatBridgeProvider } from '@/contexts/AppChatBridgeContext';
import { TabletProvider } from '@/components/layout/tablet-layout-manager';
import { VisualFeedbackProvider } from '@/components/ui/visual-feedback';
import { NotificationContainer } from '@/components/ui/notification-system';
import { useDesktopChatIntegration } from '@/hooks/use-desktop-chat-integration';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

interface AppLayoutProviderProps {
  children: ReactNode;
}

// Routes that should not use the desktop layout (e.g., auth, onboarding)
const EXCLUDED_ROUTES = [
  '/auth',
  '/onboarding',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

// Routes that should always use mobile layout regardless of screen size
const FORCE_MOBILE_ROUTES = [
  '/workout', // Workout page might be better in full-screen mobile mode
];

function AppLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const layout = useResponsiveLayout();
  const {
    onAppAction,
    highlightTarget,
    welcomeMessage,
    contextualInfo,
  } = useDesktopChatIntegration();

  // Determine if we should use desktop layout
  const shouldUseDesktopLayout = 
    !EXCLUDED_ROUTES.some(route => pathname.startsWith(route)) &&
    !FORCE_MOBILE_ROUTES.some(route => pathname.startsWith(route)) &&
    (layout.shouldUseSplitScreen || layout.shouldUseToggleMode);

  // Generate contextual welcome message based on current page
  const getChatWelcomeMessage = () => {
    if (pathname.startsWith('/workout')) {
      return "I can see you're working out! I can help you add exercises, track sets, adjust weights, or provide form tips. What do you need?";
    }
    if (pathname.startsWith('/stats')) {
      return "Looking at your progress! I can help analyze your stats, set new goals, or explain your fitness metrics. What would you like to know?";
    }
    if (pathname.startsWith('/settings')) {
      return "I can help you configure your preferences, update your profile, or manage your equipment settings. What would you like to change?";
    }
    if (pathname.startsWith('/feed')) {
      return "Checking out the community! I can help you find workout inspiration, connect with others, or share your progress. How can I assist?";
    }
    return welcomeMessage;
  };

  if (!shouldUseDesktopLayout) {
    // Use standard mobile layout
    return (
      <>
        {children}
        <NotificationContainer />
      </>
    );
  }

  // Use desktop responsive layout
  return (
    <DesktopLayoutWrapper
      chatComponent={
        <DesktopChatPanel
          isEmbedded={true}
          onAppAction={onAppAction}
          highlightTarget={highlightTarget}
          initialMessage={getChatWelcomeMessage()}
          compact={layout.shouldUseSplitScreen}
        />
      }
      onLayoutChange={(breakpoint, dimensions) => {
        // Handle layout changes if needed
        console.log('Layout changed:', { breakpoint, dimensions });
      }}
    >
      {children}
    </DesktopLayoutWrapper>
  );
}

export function AppLayoutProvider({ children }: AppLayoutProviderProps) {
  return (
    <AppChatBridgeProvider>
      <TabletProvider>
        <VisualFeedbackProvider>
          <AppLayoutContent>
            {children}
          </AppLayoutContent>
          <NotificationContainer />
        </VisualFeedbackProvider>
      </TabletProvider>
    </AppChatBridgeProvider>
  );
}

// Hook for accessing layout state in components
export function useAppLayout() {
  const pathname = usePathname();
  const layout = useResponsiveLayout();
  
  const isDesktopLayout = 
    !EXCLUDED_ROUTES.some(route => pathname.startsWith(route)) &&
    !FORCE_MOBILE_ROUTES.some(route => pathname.startsWith(route)) &&
    (layout.shouldUseSplitScreen || layout.shouldUseToggleMode);

  const isExcludedRoute = EXCLUDED_ROUTES.some(route => pathname.startsWith(route));
  const isForceMobileRoute = FORCE_MOBILE_ROUTES.some(route => pathname.startsWith(route));

  return {
    isDesktopLayout,
    isExcludedRoute,
    isForceMobileRoute,
    isSplitScreen: layout.shouldUseSplitScreen,
    isTabletToggle: layout.shouldUseToggleMode,
    isMobile: layout.isMobile,
    breakpoint: layout.breakpoint,
    currentPath: pathname,
  };
}

// Component for conditionally rendering content based on layout
interface ConditionalLayoutProps {
  children: ReactNode;
  showOnDesktop?: boolean;
  showOnTablet?: boolean;
  showOnMobile?: boolean;
  showOnSplitScreen?: boolean;
  hideOnRoutes?: string[];
  showOnRoutes?: string[];
}

export function ConditionalLayout({
  children,
  showOnDesktop = true,
  showOnTablet = true,
  showOnMobile = true,
  showOnSplitScreen = true,
  hideOnRoutes = [],
  showOnRoutes = [],
}: ConditionalLayoutProps) {
  const {
    isDesktopLayout,
    isSplitScreen,
    isTabletToggle,
    isMobile,
    currentPath,
  } = useAppLayout();

  // Check route conditions
  if (hideOnRoutes.length > 0 && hideOnRoutes.some(route => currentPath.startsWith(route))) {
    return null;
  }

  if (showOnRoutes.length > 0 && !showOnRoutes.some(route => currentPath.startsWith(route))) {
    return null;
  }

  // Check layout conditions
  if (isSplitScreen && !showOnSplitScreen) return null;
  if (isTabletToggle && !showOnTablet) return null;
  if (isMobile && !showOnMobile) return null;
  if (isDesktopLayout && !showOnDesktop) return null;

  return <>{children}</>;
}