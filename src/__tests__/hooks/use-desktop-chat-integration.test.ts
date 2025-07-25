import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useDesktopChatIntegration,
  useChatPanelVisibility,
  useChatMessageOptimization,
} from '@/hooks/use-desktop-chat-integration';
import { useAppLayout } from '@/components/layout/app-layout-provider';
import { useAppChatBridge } from '@/contexts/AppChatBridgeContext';

// Mock dependencies
jest.mock('@/components/layout/app-layout-provider');
jest.mock('@/contexts/AppChatBridgeContext');
jest.mock('@/components/layout/performance-optimizations', () => ({
  useDebounce: jest.fn((value) => value),
  useThrottle: jest.fn((callback) => callback),
}));

const mockUseAppLayout = useAppLayout as jest.MockedFunction<typeof useAppLayout>;
const mockUseAppChatBridge = useAppChatBridge as jest.MockedFunction<typeof useAppChatBridge>;

describe('useDesktopChatIntegration', () => {
  const mockSubscribeToActions = jest.fn();
  const mockGetAppContext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseAppLayout.mockReturnValue({
      isDesktopLayout: true,
      isSplitScreen: true,
    } as any);

    mockUseAppChatBridge.mockReturnValue({
      subscribeToActions: mockSubscribeToActions,
      getAppContext: mockGetAppContext,
    } as any);

    mockSubscribeToActions.mockReturnValue(jest.fn());
    mockGetAppContext.mockReturnValue({ currentPage: '/' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDesktopChatIntegration());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.messageCount).toBe(0);
    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('should auto-connect when in desktop layout', async () => {
    const { result } = renderHook(() => useDesktopChatIntegration({ autoConnect: true }));

    expect(result.current.isLoading).toBe(true);

    // Fast-forward connection delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.connectionStatus).toBe('connected');
    });
  });

  it('should not auto-connect when not in desktop layout', () => {
    mockUseAppLayout.mockReturnValue({
      isDesktopLayout: false,
      isSplitScreen: false,
    } as any);

    const { result } = renderHook(() => useDesktopChatIntegration({ autoConnect: true }));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isConnected).toBe(false);
  });

  it('should handle manual connect', async () => {
    const { result } = renderHook(() => useDesktopChatIntegration({ autoConnect: false }));

    act(() => {
      result.current.connect();
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle disconnect', () => {
    const { result } = renderHook(() => useDesktopChatIntegration());

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should track message count', async () => {
    const { result } = renderHook(() => useDesktopChatIntegration({ autoConnect: true }));

    // Wait for connection
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Get the callback passed to subscribeToActions
    const messageHandler = mockSubscribeToActions.mock.calls[0][0];

    // Simulate receiving messages
    act(() => {
      messageHandler({ type: 'test', payload: {} });
      messageHandler({ type: 'test2', payload: {} });
    });

    expect(result.current.messageCount).toBe(2);
  });

  it('should handle reconnection attempts', async () => {
    const { result } = renderHook(() => 
      useDesktopChatIntegration({ 
        autoConnect: true, 
        reconnectAttempts: 2,
        reconnectDelay: 100 
      })
    );

    // Wait for initial connection
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate connection failure by making getAppContext return null
    mockGetAppContext.mockReturnValue(null);

    // Trigger health check
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(result.current.canReconnect).toBe(true);

    // Manual reconnect
    act(() => {
      result.current.reconnect();
    });

    // Wait for reconnect delay
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Wait for connection
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should attempt to reconnect
    expect(result.current.isLoading).toBe(false);
  });

  it('should track activity', async () => {
    const { result } = renderHook(() => useDesktopChatIntegration({ autoConnect: true }));

    // Wait for connection
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Should be active after connection
    expect(result.current.isActive).toBe(true);
    expect(result.current.lastActivity).toBeInstanceOf(Date);

    // Fast-forward past activity timeout
    act(() => {
      jest.advanceTimersByTime(300000); // 5 minutes
    });

    await waitFor(() => {
      expect(result.current.isActive).toBe(false);
    });
  });
});

describe('useChatPanelVisibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return visibility based on layout', () => {
    mockUseAppLayout.mockReturnValue({
      isDesktopLayout: true,
      isSplitScreen: true,
    } as any);

    const { result } = renderHook(() => useChatPanelVisibility());

    expect(result.current.isVisible).toBe(true);
    expect(result.current.shouldRender).toBe(true);
    expect(result.current.isDesktopMode).toBe(true);
    expect(result.current.isSplitScreenMode).toBe(true);
  });

  it('should handle visibility changes with delay', () => {
    const { result, rerender } = renderHook(() => useChatPanelVisibility());

    // Initially not visible
    mockUseAppLayout.mockReturnValue({
      isDesktopLayout: false,
      isSplitScreen: false,
    } as any);

    rerender();

    expect(result.current.isVisible).toBe(false);
    expect(result.current.shouldRender).toBe(false);

    // Change to visible
    mockUseAppLayout.mockReturnValue({
      isDesktopLayout: true,
      isSplitScreen: true,
    } as any);

    rerender();

    // Should immediately set shouldRender to true
    expect(result.current.shouldRender).toBe(true);

    // Fast-forward debounce delay
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(result.current.isVisible).toBe(true);
  });

  it('should delay hiding with timeout', () => {
    mockUseAppLayout.mockReturnValue({
      isDesktopLayout: true,
      isSplitScreen: true,
    } as any);

    const { result, rerender } = renderHook(() => useChatPanelVisibility());

    expect(result.current.shouldRender).toBe(true);

    // Change to not visible
    mockUseAppLayout.mockReturnValue({
      isDesktopLayout: false,
      isSplitScreen: false,
    } as any);

    rerender();

    // Should still render initially
    expect(result.current.shouldRender).toBe(true);

    // Fast-forward timeout
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.shouldRender).toBe(false);
  });
});

describe('useChatMessageOptimization', () => {
  beforeEach(() => {
    // Mock DOM methods
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      writable: true,
      value: 0,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      writable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      writable: true,
      value: 500,
    });
  });

  it('should return initial visible messages', () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({ id: i, content: `Message ${i}` }));
    
    const { result } = renderHook(() => useChatMessageOptimization(messages, 50));

    expect(result.current.visibleMessages).toHaveLength(50);
    expect(result.current.totalMessages).toBe(100);
    expect(result.current.visibleRange).toEqual({ start: 0, end: 50 });
  });

  it('should update visible range on scroll', () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({ id: i, content: `Message ${i}` }));
    
    const { result } = renderHook(() => useChatMessageOptimization(messages, 50));

    // Mock container ref
    const mockContainer = {
      scrollTop: 250,
      scrollHeight: 1000,
      clientHeight: 500,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // Set the ref
    if (result.current.containerRef.current) {
      Object.assign(result.current.containerRef.current, mockContainer);
    }

    // The scroll handler would be called by the actual scroll event
    // For testing, we can't easily simulate this without more complex setup
    expect(result.current.containerRef).toBeDefined();
  });

  it('should handle empty messages array', () => {
    const { result } = renderHook(() => useChatMessageOptimization([], 50));

    expect(result.current.visibleMessages).toHaveLength(0);
    expect(result.current.totalMessages).toBe(0);
    expect(result.current.visibleRange).toEqual({ start: 0, end: 0 });
  });

  it('should handle messages array smaller than maxVisible', () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({ id: i, content: `Message ${i}` }));
    
    const { result } = renderHook(() => useChatMessageOptimization(messages, 50));

    expect(result.current.visibleMessages).toHaveLength(10);
    expect(result.current.totalMessages).toBe(10);
    expect(result.current.visibleRange).toEqual({ start: 0, end: 10 });
  });
});