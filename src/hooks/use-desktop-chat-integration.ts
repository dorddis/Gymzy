"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppLayout } from '@/components/layout/app-layout-provider';
import { useAppChatBridge } from '@/contexts/AppChatBridgeContext';
import { useDebounce, useThrottle } from '@/components/layout/performance-optimizations';

interface ChatIntegrationState {
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  messageCount: number;
  lastActivity: Date | null;
}

interface ChatIntegrationOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  activityTimeout?: number;
}

export function useDesktopChatIntegration(options: ChatIntegrationOptions = {}) {
  const {
    autoConnect = true,
    reconnectAttempts = 3,
    reconnectDelay = 1000,
    activityTimeout = 300000, // 5 minutes
  } = options;

  const { isDesktopLayout, isSplitScreen } = useAppLayout();
  const bridge = useAppChatBridge();
  
  const [state, setState] = useState<ChatIntegrationState>({
    isLoading: false,
    isConnected: false,
    error: null,
    messageCount: 0,
    lastActivity: null,
  });

  const reconnectAttemptsRef = useRef(0);
  const activityTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionCheckRef = useRef<NodeJS.Timeout>();

  // Debounce state updates to prevent excessive re-renders
  const debouncedState = useDebounce(state, 100);

  // Throttled activity tracker
  const trackActivity = useThrottle(() => {
    setState(prev => ({
      ...prev,
      lastActivity: new Date(),
    }));

    // Reset activity timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        lastActivity: null,
      }));
    }, activityTimeout);
  }, 1000);

  // Connection management
  const connect = useCallback(async () => {
    if (!isDesktopLayout || !isSplitScreen) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: true,
        error: null,
      }));

      reconnectAttemptsRef.current = 0;
      trackActivity();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
    }
  }, [isDesktopLayout, isSplitScreen, trackActivity]);

  const disconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      isLoading: false,
    }));

    // Clear timeouts
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    if (connectionCheckRef.current) {
      clearTimeout(connectionCheckRef.current);
    }
  }, []);

  const reconnect = useCallback(async () => {
    if (reconnectAttemptsRef.current >= reconnectAttempts) {
      setState(prev => ({
        ...prev,
        error: 'Maximum reconnection attempts reached',
      }));
      return;
    }

    reconnectAttemptsRef.current++;
    
    // Wait before reconnecting
    await new Promise(resolve => 
      setTimeout(resolve, reconnectDelay * reconnectAttemptsRef.current)
    );

    await connect();
  }, [connect, reconnectAttempts, reconnectDelay]);

  // Message handling with performance optimization
  const handleMessage = useCallback((message: any) => {
    setState(prev => ({
      ...prev,
      messageCount: prev.messageCount + 1,
    }));
    
    trackActivity();
  }, [trackActivity]);

  // Subscribe to bridge actions with cleanup
  useEffect(() => {
    if (!state.isConnected) return;

    const unsubscribe = bridge.subscribeToActions(handleMessage);
    return unsubscribe;
  }, [bridge, state.isConnected, handleMessage]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && isDesktopLayout && isSplitScreen) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isDesktopLayout, isSplitScreen, connect, disconnect]);

  // Connection health check
  useEffect(() => {
    if (!state.isConnected) return;

    const checkConnection = () => {
      // Simple health check - in a real app, this might ping the server
      const isHealthy = bridge.getAppContext() !== null;
      
      if (!isHealthy && reconnectAttemptsRef.current < reconnectAttempts) {
        reconnect();
      }
    };

    connectionCheckRef.current = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => {
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
    };
  }, [state.isConnected, bridge, reconnect, reconnectAttempts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (connectionCheckRef.current) {
        clearTimeout(connectionCheckRef.current);
      }
    };
  }, []);

  // Memoized return value to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    // State
    isLoading: debouncedState.isLoading,
    isConnected: debouncedState.isConnected,
    error: debouncedState.error,
    messageCount: debouncedState.messageCount,
    lastActivity: debouncedState.lastActivity,
    
    // Actions
    connect,
    disconnect,
    reconnect,
    
    // Computed values
    isActive: debouncedState.lastActivity !== null,
    canReconnect: reconnectAttemptsRef.current < reconnectAttempts,
    connectionStatus: debouncedState.isConnected 
      ? 'connected' 
      : debouncedState.isLoading 
        ? 'connecting' 
        : debouncedState.error 
          ? 'error' 
          : 'disconnected',
  }), [
    debouncedState,
    connect,
    disconnect,
    reconnect,
    reconnectAttempts,
  ]);

  return returnValue;
}

// Hook for managing chat panel visibility with performance considerations
export function useChatPanelVisibility() {
  const { isDesktopLayout, isSplitScreen } = useAppLayout();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Debounce visibility changes to prevent rapid toggling
  const debouncedIsVisible = useDebounce(isVisible, 150);

  useEffect(() => {
    const newVisibility = isDesktopLayout && isSplitScreen;
    setIsVisible(newVisibility);

    // Delay rendering to allow for smooth transitions
    if (newVisibility) {
      setShouldRender(true);
    } else {
      const timeout = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isDesktopLayout, isSplitScreen]);

  return {
    isVisible: debouncedIsVisible,
    shouldRender,
    isDesktopMode: isDesktopLayout,
    isSplitScreenMode: isSplitScreen,
  };
}

// Hook for optimizing chat message rendering
export function useChatMessageOptimization(messages: any[], maxVisible: number = 50) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: maxVisible });
  const containerRef = useRef<HTMLDivElement>(null);

  // Throttled scroll handler
  const handleScroll = useThrottle(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);

    // Calculate visible range based on scroll position
    const totalMessages = messages.length;
    const start = Math.max(0, Math.floor(scrollPercentage * totalMessages) - 10);
    const end = Math.min(totalMessages, start + maxVisible);

    setVisibleRange({ start, end });
  }, 100);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const visibleMessages = useMemo(() => {
    return messages.slice(visibleRange.start, visibleRange.end);
  }, [messages, visibleRange]);

  return {
    containerRef,
    visibleMessages,
    visibleRange,
    totalMessages: messages.length,
  };
}