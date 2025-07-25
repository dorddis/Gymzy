"use client";

import React, { useEffect, useRef } from 'react';
import { useAppChatBridge } from '@/contexts/AppChatBridgeContext';
import { visualFeedbackUtils } from '@/components/ui/visual-feedback';
import { notificationUtils } from '@/components/ui/notification-system';
import { useRouter } from 'next/navigation';
import { useWorkout } from '@/contexts/WorkoutContext';

interface ChatActionHandlerProps {
  children: React.ReactNode;
}

// Action types that can be triggered by the AI chat
type ChatActionType = 
  | 'create-workout'
  | 'start-workout'
  | 'log-set'
  | 'finish-workout'
  | 'show-stats'
  | 'show-progress'
  | 'navigate'
  | 'highlight'
  | 'explain'
  | 'create-template'
  | 'show-recommendations';

// Handler functions for different action types
const actionHandlers: Record<ChatActionType, (data: any, utils: ActionUtils) => void> = {
  'create-workout': (data, { router, setCurrentWorkoutExercises, showSuccess }) => {
    if (data?.exercises && Array.isArray(data.exercises)) {
      setCurrentWorkoutExercises(data.exercises);
      showSuccess('Workout created successfully!');
      router.push('/workout');
    }
  },
  
  'start-workout': (data, { router, setCurrentWorkoutExercises, showSuccess, highlight }) => {
    if (data?.exercises && Array.isArray(data.exercises)) {
      setCurrentWorkoutExercises(data.exercises);
      showSuccess('Starting your workout!');
      router.push('/workout');
      
      // Highlight the first exercise after navigation
      setTimeout(() => {
        highlight('.exercise-item:first-child', 'This is your first exercise');
      }, 1000);
    }
  },
  
  'log-set': (data, { showSuccess, highlight }) => {
    if (data?.exerciseId) {
      showSuccess('Set logged successfully!');
      highlight(`[data-exercise-id="${data.exerciseId}"]`, 'Set logged');
    }
  },
  
  'finish-workout': (data, { router, showSuccess }) => {
    showSuccess('Workout completed! Great job!');
    setTimeout(() => router.push('/'), 1500);
  },
  
  'show-stats': (data, { router, highlight }) => {
    router.push('/stats');
    setTimeout(() => {
      highlight('.stats-card', 'Here are your stats');
    }, 500);
  },
  
  'show-progress': (data, { router, highlight }) => {
    router.push('/stats');
    setTimeout(() => {
      highlight('.progress-chart', 'Here\'s your progress');
    }, 500);
  },
  
  'navigate': (data, { router }) => {
    if (data?.path && typeof data.path === 'string') {
      router.push(data.path);
    }
  },
  
  'highlight': (data, { highlight }) => {
    if (data?.selector && typeof data.selector === 'string') {
      highlight(data.selector, data.message || 'Take a look at this');
    }
  },
  
  'explain': (data, { showInfo }) => {
    if (data?.message && typeof data.message === 'string') {
      showInfo('Explanation', data.message);
    }
  },
  
  'create-template': (data, { router, showSuccess }) => {
    router.push('/templates');
    showSuccess('Ready to create a new template!');
  },
  
  'show-recommendations': (data, { router, highlight }) => {
    router.push('/recommendations');
    setTimeout(() => {
      highlight('.recommendation-card', 'Check out these recommendations');
    }, 500);
  },
};

// Utility functions for action handlers
interface ActionUtils {
  router: ReturnType<typeof useRouter>;
  setCurrentWorkoutExercises: (exercises: any[]) => void;
  highlight: (selector: string, message?: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (title: string, message: string) => void;
  showWarning: (message: string) => void;
}

export function ChatActionHandler({ children }: ChatActionHandlerProps) {
  const bridge = useAppChatBridge();
  const router = useRouter();
  const { setCurrentWorkoutExercises } = useWorkout();
  const actionsProcessedRef = useRef<Set<string>>(new Set());
  
  // Create utility functions for action handlers
  const actionUtils: ActionUtils = {
    router,
    setCurrentWorkoutExercises,
    highlight: (selector: string, message?: string) => {
      visualFeedbackUtils.highlightInfo(selector, message);
    },
    showSuccess: (message: string) => {
      notificationUtils.success('Success', message);
    },
    showError: (message: string) => {
      notificationUtils.error('Error', message);
    },
    showInfo: (title: string, message: string) => {
      notificationUtils.info(title, message);
    },
    showWarning: (message: string) => {
      notificationUtils.warning('Warning', message);
    },
  };

  // Subscribe to actions from the chat
  useEffect(() => {
    const unsubscribe = bridge.subscribeToActions((action) => {
      // Skip already processed actions
      if (actionsProcessedRef.current.has(action.id)) {
        return;
      }
      
      // Mark action as processed
      actionsProcessedRef.current.add(action.id);
      
      // Handle trigger-action type
      if (action.type === 'trigger-action') {
        const { actionType, data } = action.payload;
        
        // Check if we have a handler for this action type
        if (actionType in actionHandlers) {
          const handler = actionHandlers[actionType as ChatActionType];
          handler(data, actionUtils);
        } else {
          console.warn(`No handler for action type: ${actionType}`);
        }
      }
    });
    
    return unsubscribe;
  }, [bridge, router, setCurrentWorkoutExercises]);

  return <>{children}</>;
}

// Hook for triggering chat actions programmatically
export function useChatActions() {
  const bridge = useAppChatBridge();
  
  const triggerAction = (actionType: ChatActionType, data?: any) => {
    bridge.triggerAction(actionType, data);
  };
  
  return {
    triggerAction,
    createWorkout: (exercises: any[]) => triggerAction('create-workout', { exercises }),
    startWorkout: (exercises: any[]) => triggerAction('start-workout', { exercises }),
    logSet: (exerciseId: string, setData: any) => triggerAction('log-set', { exerciseId, setData }),
    finishWorkout: () => triggerAction('finish-workout'),
    showStats: () => triggerAction('show-stats'),
    showProgress: () => triggerAction('show-progress'),
    navigateTo: (path: string) => triggerAction('navigate', { path }),
    highlightElement: (selector: string, message?: string) => 
      triggerAction('highlight', { selector, message }),
    explainFeature: (message: string) => triggerAction('explain', { message }),
    createTemplate: () => triggerAction('create-template'),
    showRecommendations: () => triggerAction('show-recommendations'),
  };
}