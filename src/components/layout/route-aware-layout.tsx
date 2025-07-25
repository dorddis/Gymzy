"use client";

import React, { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppChatBridge } from '@/contexts/AppChatBridgeContext';
import { useAppLayout } from '@/components/layout/app-layout-provider';
import { StatusBar } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ConditionalLayout } from '@/components/layout/app-layout-provider';

interface RouteAwareLayoutProps {
  children: ReactNode;
}

// Route configurations
const ROUTE_CONFIG = {
  '/': {
    showHeader: true,
    showBottomNav: true,
    pageTitle: 'Dashboard',
    chatContext: 'dashboard',
  },
  '/workout': {
    showHeader: true,
    showBottomNav: false, // Hide during workout for focus
    pageTitle: 'Workout',
    chatContext: 'workout',
  },
  '/stats': {
    showHeader: true,
    showBottomNav: true,
    pageTitle: 'Statistics',
    chatContext: 'stats',
  },
  '/chat': {
    showHeader: false, // Chat has its own header
    showBottomNav: false,
    pageTitle: 'AI Chat',
    chatContext: 'chat',
  },
  '/settings': {
    showHeader: true,
    showBottomNav: true,
    pageTitle: 'Settings',
    chatContext: 'settings',
  },
  '/feed': {
    showHeader: true,
    showBottomNav: true,
    pageTitle: 'Community',
    chatContext: 'community',
  },
  '/profile': {
    showHeader: true,
    showBottomNav: true,
    pageTitle: 'Profile',
    chatContext: 'profile',
  },
  '/templates': {
    showHeader: true,
    showBottomNav: true,
    pageTitle: 'Workout Templates',
    chatContext: 'templates',
  },
  '/recommendations': {
    showHeader: true,
    showBottomNav: true,
    pageTitle: 'Recommendations',
    chatContext: 'recommendations',
  },
};

function getRouteConfig(pathname: string) {
  // Find exact match first
  if (ROUTE_CONFIG[pathname as keyof typeof ROUTE_CONFIG]) {
    return ROUTE_CONFIG[pathname as keyof typeof ROUTE_CONFIG];
  }

  // Find partial match for dynamic routes
  for (const [route, config] of Object.entries(ROUTE_CONFIG)) {
    if (pathname.startsWith(route) && route !== '/') {
      return config;
    }
  }

  // Default config
  return {
    showHeader: true,
    showBottomNav: true,
    pageTitle: 'Gymzy',
    chatContext: 'general',
  };
}

export function RouteAwareLayout({ children }: RouteAwareLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const bridge = useAppChatBridge();
  const { isDesktopLayout, isSplitScreen, currentPath } = useAppLayout();

  const routeConfig = getRouteConfig(pathname);

  // Update app context when route changes
  useEffect(() => {
    bridge.sendContextUpdate({
      currentPage: pathname,
      visibleElements: [], // Will be updated by components
    });
  }, [pathname, bridge]);

  // Update document title
  useEffect(() => {
    document.title = `${routeConfig.pageTitle} - Gymzy`;
  }, [routeConfig.pageTitle]);

  // Handle navigation from chat
  useEffect(() => {
    const unsubscribe = bridge.subscribeToActions((action) => {
      if (action.type === 'navigate') {
        const route = action.payload.route;
        if (route && route !== pathname) {
          router.push(route);
        }
      }
    });

    return unsubscribe;
  }, [bridge, router, pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - conditionally shown based on route and layout */}
      <ConditionalLayout
        showOnDesktop={routeConfig.showHeader && !isSplitScreen} // Hide header in split-screen to save space
        showOnTablet={routeConfig.showHeader}
        showOnMobile={routeConfig.showHeader}
      >
        <StatusBar />
      </ConditionalLayout>

      {/* Main Content */}
      <main id="main-content" className="flex-1 overflow-hidden" tabIndex={-1}>
        {children}
      </main>

      {/* Bottom Navigation - conditionally shown */}
      <ConditionalLayout
        showOnDesktop={false} // Never show bottom nav on desktop
        showOnTablet={false} // Never show bottom nav on tablet (has toggle instead)
        showOnMobile={routeConfig.showBottomNav}
      >
        <BottomNav />
      </ConditionalLayout>
    </div>
  );
}

// Hook for getting current route information
export function useRouteInfo() {
  const pathname = usePathname();
  const routeConfig = getRouteConfig(pathname);
  const { isDesktopLayout, isSplitScreen, breakpoint } = useAppLayout();

  return {
    pathname,
    routeConfig,
    isDesktopLayout,
    isSplitScreen,
    breakpoint,
    pageTitle: routeConfig.pageTitle,
    chatContext: routeConfig.chatContext,
    shouldShowHeader: routeConfig.showHeader,
    shouldShowBottomNav: routeConfig.showBottomNav,
  };
}

// Component for page-specific layout adjustments
interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  chatContext?: string;
  className?: string;
}

export function PageLayout({
  children,
  title,
  showHeader,
  showBottomNav,
  chatContext,
  className,
}: PageLayoutProps) {
  const bridge = useAppChatBridge();
  const { isDesktopLayout } = useAppLayout();

  // Update context when component mounts
  useEffect(() => {
    if (chatContext) {
      bridge.sendContextUpdate({
        currentPage: chatContext,
      });
    }
  }, [chatContext, bridge]);

  // Update document title if provided
  useEffect(() => {
    if (title) {
      document.title = `${title} - Gymzy`;
    }
  }, [title]);

  return (
    <div className={className}>
      {/* Page Header - only show if not in desktop layout or explicitly requested */}
      {showHeader && !isDesktopLayout && (
        <ConditionalLayout showOnMobile={true} showOnTablet={true} showOnDesktop={false}>
          <StatusBar />
        </ConditionalLayout>
      )}

      {/* Page Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Page Bottom Nav - only show if not in desktop layout or explicitly requested */}
      {showBottomNav && !isDesktopLayout && (
        <ConditionalLayout showOnMobile={true} showOnTablet={false} showOnDesktop={false}>
          <BottomNav />
        </ConditionalLayout>
      )}
    </div>
  );
}