"use client";

import React, { createContext, useContext, useCallback, useRef, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { feedbackManager, VisualFeedbackOptions } from '@/components/ui/visual-feedback';
import { notificationManager } from '@/components/ui/notification-system';

// Types for cross-panel communication
export interface AppAction {
  type: 'navigate' | 'highlight' | 'update-data' | 'show-notification' | 'trigger-action';
  payload: any;
  timestamp: Date;
  id: string;
}

export interface AppContext {
  currentPage: string;
  activeWorkout?: any;
  userPreferences?: any;
  recentActions: AppAction[];
  visibleElements: string[];
}

export interface VisualFeedback {
  type: 'highlight' | 'pulse' | 'border' | 'glow';
  target: string;
  duration: number;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export interface AppChatBridge {
  // Chat to App communication
  highlightElement: (selector: string, duration?: number, options?: Partial<VisualFeedback>) => void;
  navigateToPage: (route: string) => void;
  updateWorkoutData: (data: any) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  triggerAction: (actionType: string, data?: any) => void;
  
  // App to Chat communication
  sendContextUpdate: (context: Partial<AppContext>) => void;
  triggerChatMessage: (message: string) => void;
  updateChatState: (state: any) => void;
  
  // State management
  getAppContext: () => AppContext;
  subscribeToActions: (callback: (action: AppAction) => void) => () => void;
  subscribeToContext: (callback: (context: AppContext) => void) => () => void;
}

const AppChatBridgeContext = createContext<AppChatBridge | null>(null);

interface AppChatBridgeProviderProps {
  children: ReactNode;
}

export function AppChatBridgeProvider({ children }: AppChatBridgeProviderProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // State management
  const [appContext, setAppContext] = useState<AppContext>({
    currentPage: '/',
    recentActions: [],
    visibleElements: [],
  });
  
  // Subscribers
  const actionSubscribersRef = useRef<Set<(action: AppAction) => void>>(new Set());
  const contextSubscribersRef = useRef<Set<(context: AppContext) => void>>(new Set());
  
  // Active highlights tracking
  const activeHighlightsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Generate unique action ID
  const generateActionId = useCallback(() => {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Dispatch action to subscribers
  const dispatchAction = useCallback((action: AppAction) => {
    // Update context with new action
    setAppContext(prev => ({
      ...prev,
      recentActions: [action, ...prev.recentActions.slice(0, 9)], // Keep last 10 actions
    }));

    // Notify subscribers
    actionSubscribersRef.current.forEach(callback => {
      try {
        callback(action);
      } catch (error) {
        console.error('Error in action subscriber:', error);
      }
    });
  }, []);

  // Dispatch context update to subscribers
  const dispatchContextUpdate = useCallback((context: AppContext) => {
    contextSubscribersRef.current.forEach(callback => {
      try {
        callback(context);
      } catch (error) {
        console.error('Error in context subscriber:', error);
      }
    });
  }, []);

  // Chat to App communication methods
  const highlightElement = useCallback((
    selector: string, 
    duration: number = 2000, 
    options: Partial<VisualFeedback> = {}
  ) => {
    try {
      // Use the new visual feedback system
      const feedbackOptions: VisualFeedbackOptions = {
        type: options.type || 'highlight',
        target: selector,
        duration,
        color: options.color || '#3B82F6',
        intensity: options.intensity || 'medium',
        onComplete: () => {
          // Clean up any active highlights tracking
          activeHighlightsRef.current.delete(selector);
        },
      };

      // Add visual feedback
      const feedbackId = feedbackManager.addFeedback(feedbackOptions);

      // Track active feedback
      activeHighlightsRef.current.set(selector, feedbackId as any);

      // Dispatch action
      dispatchAction({
        type: 'highlight',
        payload: { selector, duration, options: feedbackOptions },
        timestamp: new Date(),
        id: generateActionId(),
      });

    } catch (error) {
      console.error('Error highlighting element:', error);
    }
  }, [dispatchAction, generateActionId]);

  const navigateToPage = useCallback((route: string) => {
    try {
      router.push(route);
      
      dispatchAction({
        type: 'navigate',
        payload: { route },
        timestamp: new Date(),
        id: generateActionId(),
      });

      // Update context
      setAppContext(prev => ({
        ...prev,
        currentPage: route,
      }));

    } catch (error) {
      console.error('Error navigating to page:', error);
      showNotification('Failed to navigate to page', 'error');
    }
  }, [router, dispatchAction, generateActionId]);

  const updateWorkoutData = useCallback((data: any) => {
    try {
      dispatchAction({
        type: 'update-data',
        payload: { type: 'workout', data },
        timestamp: new Date(),
        id: generateActionId(),
      });

      // Update context
      setAppContext(prev => ({
        ...prev,
        activeWorkout: data,
      }));

    } catch (error) {
      console.error('Error updating workout data:', error);
    }
  }, [dispatchAction, generateActionId]);

  const showNotification = useCallback((
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    try {
      // Use the new notification system
      const title = type === 'error' ? 'Error' : 
                   type === 'success' ? 'Success' : 
                   type === 'warning' ? 'Warning' : 'Info';
      
      notificationManager.addNotification({
        type,
        title,
        message,
        duration: type === 'error' ? 5000 : 3000,
      });

      // Also use toast as fallback
      toast({
        title,
        description: message,
        variant: type === 'error' ? 'destructive' : 'default',
      });

      dispatchAction({
        type: 'show-notification',
        payload: { message, type },
        timestamp: new Date(),
        id: generateActionId(),
      });

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [toast, dispatchAction, generateActionId]);

  const triggerAction = useCallback((actionType: string, data?: any) => {
    try {
      dispatchAction({
        type: 'trigger-action',
        payload: { actionType, data },
        timestamp: new Date(),
        id: generateActionId(),
      });

    } catch (error) {
      console.error('Error triggering action:', error);
    }
  }, [dispatchAction, generateActionId]);

  // App to Chat communication methods
  const sendContextUpdate = useCallback((context: Partial<AppContext>) => {
    setAppContext(prev => {
      const updated = { ...prev, ...context };
      dispatchContextUpdate(updated);
      return updated;
    });
  }, [dispatchContextUpdate]);

  const triggerChatMessage = useCallback((message: string) => {
    // This would be implemented by the chat component
    // For now, we just dispatch an action
    dispatchAction({
      type: 'trigger-action',
      payload: { actionType: 'send-message', message },
      timestamp: new Date(),
      id: generateActionId(),
    });
  }, [dispatchAction, generateActionId]);

  const updateChatState = useCallback((state: any) => {
    dispatchAction({
      type: 'update-data',
      payload: { type: 'chat-state', data: state },
      timestamp: new Date(),
      id: generateActionId(),
    });
  }, [dispatchAction, generateActionId]);

  // Subscription methods
  const subscribeToActions = useCallback((callback: (action: AppAction) => void) => {
    actionSubscribersRef.current.add(callback);
    
    return () => {
      actionSubscribersRef.current.delete(callback);
    };
  }, []);

  const subscribeToContext = useCallback((callback: (context: AppContext) => void) => {
    contextSubscribersRef.current.add(callback);
    
    return () => {
      contextSubscribersRef.current.delete(callback);
    };
  }, []);

  const getAppContext = useCallback(() => appContext, [appContext]);

  // Bridge object
  const bridge: AppChatBridge = {
    highlightElement,
    navigateToPage,
    updateWorkoutData,
    showNotification,
    triggerAction,
    sendContextUpdate,
    triggerChatMessage,
    updateChatState,
    getAppContext,
    subscribeToActions,
    subscribeToContext,
  };

  return (
    <AppChatBridgeContext.Provider value={bridge}>
      {children}
    </AppChatBridgeContext.Provider>
  );
}

export function useAppChatBridge(): AppChatBridge {
  const context = useContext(AppChatBridgeContext);
  if (!context) {
    throw new Error('useAppChatBridge must be used within an AppChatBridgeProvider');
  }
  return context;
}

// Hook for subscribing to specific action types
export function useAppActions(actionTypes?: string[]) {
  const bridge = useAppChatBridge();
  const [actions, setActions] = useState<AppAction[]>([]);

  React.useEffect(() => {
    const unsubscribe = bridge.subscribeToActions((action) => {
      if (!actionTypes || actionTypes.includes(action.type)) {
        setActions(prev => [action, ...prev.slice(0, 19)]); // Keep last 20 actions
      }
    });

    return unsubscribe;
  }, [bridge, actionTypes]);

  return actions;
}

// Hook for subscribing to context changes
export function useAppContext() {
  const bridge = useAppChatBridge();
  const [context, setContext] = useState<AppContext>(bridge.getAppContext());

  React.useEffect(() => {
    const unsubscribe = bridge.subscribeToContext(setContext);
    return unsubscribe;
  }, [bridge]);

  return context;
}