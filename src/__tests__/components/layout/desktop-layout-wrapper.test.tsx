import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DesktopLayoutWrapper } from '@/components/layout/desktop-layout-wrapper';
import { useResponsiveLayout, useSplitScreenDimensions } from '@/hooks/use-responsive-layout';
import { loadSplitRatio, saveSplitRatio } from '@/lib/layout-utils';

// Mock the hooks
jest.mock('@/hooks/use-responsive-layout');
jest.mock('@/lib/layout-utils');

const mockUseResponsiveLayout = useResponsiveLayout as jest.MockedFunction<typeof useResponsiveLayout>;
const mockUseSplitScreenDimensions = useSplitScreenDimensions as jest.MockedFunction<typeof useSplitScreenDimensions>;
const mockLoadSplitRatio = loadSplitRatio as jest.MockedFunction<typeof loadSplitRatio>;
const mockSaveSplitRatio = saveSplitRatio as jest.MockedFunction<typeof saveSplitRatio>;

// Mock components
const MockAppContent = () => <div data-testid="app-content">App Content</div>;
const MockChatContent = () => <div data-testid="chat-content">Chat Content</div>;

describe('DesktopLayoutWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadSplitRatio.mockReturnValue(0.65);
    mockSaveSplitRatio.mockImplementation(() => {});
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
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

      mockUseSplitScreenDimensions.mockReturnValue({
        appPanelWidth: 0,
        chatPanelWidth: 0,
        splitRatio: 0.65,
        updateSplitRatio: jest.fn(),
        canResize: false,
        minAppPanelWidth: 400,
        minChatPanelWidth: 300,
      });
    });

    it('should render mobile layout', () => {
      render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      expect(screen.getByTestId('app-content')).toBeInTheDocument();
      expect(screen.queryByTestId('chat-content')).not.toBeInTheDocument();
    });

    it('should apply mobile layout classes', () => {
      const { container } = render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('min-h-screen', 'bg-background');
    });
  });

  describe('Tablet Layout', () => {
    beforeEach(() => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'tablet',
        width: 768,
        height: 1024,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: true,
      });

      mockUseSplitScreenDimensions.mockReturnValue({
        appPanelWidth: 0,
        chatPanelWidth: 0,
        splitRatio: 0.65,
        updateSplitRatio: jest.fn(),
        canResize: false,
        minAppPanelWidth: 400,
        minChatPanelWidth: 300,
      });
    });

    it('should render tablet toggle layout', () => {
      render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      expect(screen.getByText('App')).toBeInTheDocument();
      expect(screen.getByText('AI Chat')).toBeInTheDocument();
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    });

    it('should toggle between app and chat views', async () => {
      render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      const chatButton = screen.getByText('AI Chat');
      fireEvent.click(chatButton);

      await waitFor(() => {
        expect(screen.getByTestId('chat-content')).toBeInTheDocument();
      });

      const appButton = screen.getByText('App');
      fireEvent.click(appButton);

      await waitFor(() => {
        expect(screen.getByTestId('app-content')).toBeInTheDocument();
      });
    });

    it('should apply correct active state to toggle buttons', () => {
      render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      const appButton = screen.getByText('App');
      const chatButton = screen.getByText('AI Chat');

      expect(appButton).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm');
      expect(chatButton).toHaveClass('text-gray-600');
    });
  });

  describe('Desktop Layout', () => {
    const mockUpdateSplitRatio = jest.fn();

    beforeEach(() => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1440,
        height: 900,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      mockUseSplitScreenDimensions.mockReturnValue({
        appPanelWidth: 936,
        chatPanelWidth: 500,
        splitRatio: 0.65,
        updateSplitRatio: mockUpdateSplitRatio,
        canResize: true,
        minAppPanelWidth: 400,
        minChatPanelWidth: 300,
      });
    });

    it('should render desktop split-screen layout', () => {
      render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      expect(screen.getByTestId('app-content')).toBeInTheDocument();
      expect(screen.getByTestId('chat-content')).toBeInTheDocument();
    });

    it('should render resize handle when resizing is enabled', () => {
      const { container } = render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      const resizeHandle = container.querySelector('.cursor-col-resize');
      expect(resizeHandle).toBeInTheDocument();
    });

    it('should not render resize handle when resizing is disabled', () => {
      mockUseSplitScreenDimensions.mockReturnValue({
        appPanelWidth: 936,
        chatPanelWidth: 500,
        splitRatio: 0.65,
        updateSplitRatio: mockUpdateSplitRatio,
        canResize: false,
        minAppPanelWidth: 400,
        minChatPanelWidth: 300,
      });

      const { container } = render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      const resizeHandle = container.querySelector('.cursor-col-resize');
      expect(resizeHandle).not.toBeInTheDocument();
    });

    it('should handle resize start', () => {
      const { container } = render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      const resizeHandle = container.querySelector('.cursor-col-resize');
      expect(resizeHandle).toBeInTheDocument();

      fireEvent.mouseDown(resizeHandle!, { clientX: 500 });

      // Should add resize overlay
      expect(container.querySelector('.fixed.inset-0.z-50')).toBeInTheDocument();
    });

    it('should call onLayoutChange callback', () => {
      const onLayoutChange = jest.fn();

      render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
          onLayoutChange={onLayoutChange}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      expect(onLayoutChange).toHaveBeenCalledWith('desktop', expect.objectContaining({
        breakpoint: 'desktop',
        isDesktop: true,
        splitScreen: expect.objectContaining({
          appPanelWidth: 936,
          chatPanelWidth: 500,
          splitRatio: 0.65,
        }),
      }));
    });

    it('should load and save split ratio', async () => {
      mockLoadSplitRatio.mockReturnValue(0.7);

      render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      expect(mockLoadSplitRatio).toHaveBeenCalled();
    });
  });

  describe('CSS Properties', () => {
    beforeEach(() => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1440,
        height: 900,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      mockUseSplitScreenDimensions.mockReturnValue({
        appPanelWidth: 936,
        chatPanelWidth: 500,
        splitRatio: 0.65,
        updateSplitRatio: jest.fn(),
        canResize: true,
        minAppPanelWidth: 400,
        minChatPanelWidth: 300,
      });
    });

    it('should apply CSS custom properties for split-screen layout', () => {
      const { container } = render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      const wrapper = container.firstChild as HTMLElement;
      const style = wrapper.style;

      expect(style.getPropertyValue('--app-panel-width')).toBe('936px');
      expect(style.getPropertyValue('--chat-panel-width')).toBe('500px');
      expect(style.getPropertyValue('--split-ratio')).toBe('0.65');
    });
  });

  describe('Custom className', () => {
    beforeEach(() => {
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

      mockUseSplitScreenDimensions.mockReturnValue({
        appPanelWidth: 0,
        chatPanelWidth: 0,
        splitRatio: 0.65,
        updateSplitRatio: jest.fn(),
        canResize: false,
        minAppPanelWidth: 400,
        minChatPanelWidth: 300,
      });
    });

    it('should apply custom className', () => {
      const { container } = render(
        <DesktopLayoutWrapper
          chatComponent={<MockChatContent />}
          className="custom-class"
        >
          <MockAppContent />
        </DesktopLayoutWrapper>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });
});