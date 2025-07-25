import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import {
  AppLayoutProvider,
  useAppLayout,
  ConditionalLayout,
} from '@/components/layout/app-layout-provider';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useDesktopChatIntegration } from '@/hooks/use-desktop-chat-integration';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/hooks/use-responsive-layout');
jest.mock('@/hooks/use-desktop-chat-integration');
jest.mock('@/components/layout/desktop-layout-wrapper', () => ({
  DesktopLayoutWrapper: ({ children, chatComponent }: any) => (
    <div data-testid="desktop-layout">
      <div data-testid="app-content">{children}</div>
      <div data-testid="chat-content">{chatComponent}</div>
    </div>
  ),
}));
jest.mock('@/components/chat/desktop-chat-panel', () => ({
  DesktopChatPanel: ({ initialMessage }: any) => (
    <div data-testid="desktop-chat-panel">{initialMessage}</div>
  ),
}));
jest.mock('@/components/ui/visual-feedback', () => ({
  VisualFeedbackProvider: ({ children }: any) => <div data-testid="visual-feedback-provider">{children}</div>,
}));
jest.mock('@/components/ui/notification-system', () => ({
  NotificationContainer: () => <div data-testid="notification-container" />,
}));
jest.mock('@/contexts/AppChatBridgeContext', () => ({
  AppChatBridgeProvider: ({ children }: any) => <div data-testid="chat-bridge-provider">{children}</div>,
}));
jest.mock('@/components/layout/tablet-layout-manager', () => ({
  TabletProvider: ({ children }: any) => <div data-testid="tablet-provider">{children}</div>,
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseResponsiveLayout = useResponsiveLayout as jest.MockedFunction<typeof useResponsiveLayout>;
const mockUseDesktopChatIntegration = useDesktopChatIntegration as jest.MockedFunction<typeof useDesktopChatIntegration>;

// Test components
function TestAppLayoutComponent() {
  const {
    isDesktopLayout,
    isExcludedRoute,
    isForceMobileRoute,
    isSplitScreen,
    isTabletToggle,
    isMobile,
    breakpoint,
    currentPath,
  } = useAppLayout();

  return (
    <div>
      <div data-testid="is-desktop-layout">{isDesktopLayout.toString()}</div>
      <div data-testid="is-excluded-route">{isExcludedRoute.toString()}</div>
      <div data-testid="is-force-mobile-route">{isForceMobileRoute.toString()}</div>
      <div data-testid="is-split-screen">{isSplitScreen.toString()}</div>
      <div data-testid="is-tablet-toggle">{isTabletToggle.toString()}</div>
      <div data-testid="is-mobile">{isMobile.toString()}</div>
      <div data-testid="breakpoint">{breakpoint}</div>
      <div data-testid="current-path">{currentPath}</div>
    </div>
  );
}

function TestConditionalLayoutComponent() {
  return (
    <div>
      <ConditionalLayout showOnDesktop={true} showOnMobile={false}>
        <div data-testid="desktop-only">Desktop Only</div>
      </ConditionalLayout>
      <ConditionalLayout showOnMobile={true} showOnDesktop={false}>
        <div data-testid="mobile-only">Mobile Only</div>
      </ConditionalLayout>
      <ConditionalLayout showOnSplitScreen={false}>
        <div data-testid="no-split-screen">No Split Screen</div>
      </ConditionalLayout>
      <ConditionalLayout hideOnRoutes={['/auth']}>
        <div data-testid="hide-on-auth">Hide on Auth</div>
      </ConditionalLayout>
      <ConditionalLayout showOnRoutes={['/dashboard']}>
        <div data-testid="show-on-dashboard">Show on Dashboard</div>
      </ConditionalLayout>
    </div>
  );
}

describe('AppLayoutProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseDesktopChatIntegration.mockReturnValue({
      onAppAction: jest.fn(),
      highlightTarget: jest.fn(),
      welcomeMessage: 'Welcome to Gymzy!',
      contextualInfo: {},
      sendMessageToChat: jest.fn(),
      updateChatState: jest.fn(),
      registerChatCallbacks: jest.fn(),
      getVisibleElements: jest.fn(),
      isElementVisible: jest.fn(),
      appContext: { currentPage: '/', recentActions: [], visibleElements: [] },
    });
  });

  describe('Desktop Layout Integration', () => {
    it('should use desktop layout for split-screen mode', () => {
      mockUsePathname.mockReturnValue('/');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <div data-testid="test-content">Test Content</div>
        </AppLayoutProvider>
      );

      expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
      expect(screen.getByTestId('chat-content')).toBeInTheDocument();
      expect(screen.getByTestId('desktop-chat-panel')).toBeInTheDocument();
    });

    it('should use desktop layout for tablet toggle mode', () => {
      mockUsePathname.mockReturnValue('/');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'tablet',
        width: 800,
        height: 600,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: true,
      });

      render(
        <AppLayoutProvider>
          <div data-testid="test-content">Test Content</div>
        </AppLayoutProvider>
      );

      expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
    });

    it('should use mobile layout for excluded routes', () => {
      mockUsePathname.mockReturnValue('/auth');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <div data-testid="test-content">Test Content</div>
        </AppLayoutProvider>
      );

      expect(screen.queryByTestId('desktop-layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('should use mobile layout for force mobile routes', () => {
      mockUsePathname.mockReturnValue('/workout');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <div data-testid="test-content">Test Content</div>
        </AppLayoutProvider>
      );

      expect(screen.queryByTestId('desktop-layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('should use mobile layout for mobile breakpoint', () => {
      mockUsePathname.mockReturnValue('/');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <div data-testid="test-content">Test Content</div>
        </AppLayoutProvider>
      );

      expect(screen.queryByTestId('desktop-layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('Contextual Chat Messages', () => {
    it('should provide workout-specific chat message', () => {
      mockUsePathname.mockReturnValue('/workout');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <div data-testid="test-content">Test Content</div>
        </AppLayoutProvider>
      );

      // Should not use desktop layout for workout route (force mobile)
      expect(screen.queryByTestId('desktop-layout')).not.toBeInTheDocument();
    });

    it('should provide stats-specific chat message', () => {
      mockUsePathname.mockReturnValue('/stats');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <div data-testid="test-content">Test Content</div>
        </AppLayoutProvider>
      );

      expect(screen.getByTestId('desktop-chat-panel')).toHaveTextContent(
        'Looking at your progress!'
      );
    });

    it('should provide settings-specific chat message', () => {
      mockUsePathname.mockReturnValue('/settings');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <div data-testid="test-content">Test Content</div>
        </AppLayoutProvider>
      );

      expect(screen.getByTestId('desktop-chat-panel')).toHaveTextContent(
        'I can help you configure'
      );
    });
  });

  describe('Provider Integration', () => {
    it('should include all necessary providers', () => {
      mockUsePathname.mockReturnValue('/');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <div data-testid="test-content">Test Content</div>
        </AppLayoutProvider>
      );

      expect(screen.getByTestId('chat-bridge-provider')).toBeInTheDocument();
      expect(screen.getByTestId('tablet-provider')).toBeInTheDocument();
      expect(screen.getByTestId('visual-feedback-provider')).toBeInTheDocument();
      expect(screen.getByTestId('notification-container')).toBeInTheDocument();
    });
  });

  describe('useAppLayout hook', () => {
    it('should return correct layout state for desktop', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <TestAppLayoutComponent />
        </AppLayoutProvider>
      );

      expect(screen.getByTestId('is-desktop-layout')).toHaveTextContent('true');
      expect(screen.getByTestId('is-excluded-route')).toHaveTextContent('false');
      expect(screen.getByTestId('is-force-mobile-route')).toHaveTextContent('false');
      expect(screen.getByTestId('is-split-screen')).toHaveTextContent('true');
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('desktop');
    });

    it('should return correct layout state for excluded route', () => {
      mockUsePathname.mockReturnValue('/auth');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <TestAppLayoutComponent />
        </AppLayoutProvider>
      );

      expect(screen.getByTestId('is-desktop-layout')).toHaveTextContent('false');
      expect(screen.getByTestId('is-excluded-route')).toHaveTextContent('true');
    });

    it('should return correct layout state for force mobile route', () => {
      mockUsePathname.mockReturnValue('/workout');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <TestAppLayoutComponent />
        </AppLayoutProvider>
      );

      expect(screen.getByTestId('is-desktop-layout')).toHaveTextContent('false');
      expect(screen.getByTestId('is-force-mobile-route')).toHaveTextContent('true');
    });
  });

  describe('ConditionalLayout component', () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue('/dashboard');
    });

    it('should show desktop-only content on desktop', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <TestConditionalLayoutComponent />
        </AppLayoutProvider>
      );

      expect(screen.getByTestId('desktop-only')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-only')).not.toBeInTheDocument();
    });

    it('should show mobile-only content on mobile', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <TestConditionalLayoutComponent />
        </AppLayoutProvider>
      );

      expect(screen.queryByTestId('desktop-only')).not.toBeInTheDocument();
      expect(screen.getByTestId('mobile-only')).toBeInTheDocument();
    });

    it('should hide content when showOnSplitScreen is false', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <TestConditionalLayoutComponent />
        </AppLayoutProvider>
      );

      expect(screen.queryByTestId('no-split-screen')).not.toBeInTheDocument();
    });

    it('should hide content on specified routes', () => {
      mockUsePathname.mockReturnValue('/auth');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <TestConditionalLayoutComponent />
        </AppLayoutProvider>
      );

      expect(screen.queryByTestId('hide-on-auth')).not.toBeInTheDocument();
    });

    it('should show content only on specified routes', () => {
      mockUsePathname.mockReturnValue('/other');
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(
        <AppLayoutProvider>
          <TestConditionalLayoutComponent />
        </AppLayoutProvider>
      );

      expect(screen.queryByTestId('show-on-dashboard')).not.toBeInTheDocument();
    });
  });
});