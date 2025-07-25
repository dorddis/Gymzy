"use client";

import React, { useEffect, useCallback } from 'react';
import { useAppChatBridge } from '@/contexts/AppChatBridgeContext';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useWorkout } from '@/contexts/WorkoutContext';

interface ChatContextProviderProps {
    children: React.ReactNode;
}

export function ChatContextProvider({ children }: ChatContextProviderProps) {
    const bridge = useAppChatBridge();
    const router = useRouter();
    const pathname = usePathname();
    const { currentWorkout, workoutHistory } = useWorkout();

    // Update app context when route changes
    useEffect(() => {
        bridge.sendContextUpdate({
            currentPage: pathname,
            visibleElements: getVisibleElements(),
        });
    }, [pathname, bridge]);

    // Update app context when workout data changes
    useEffect(() => {
        bridge.sendContextUpdate({
            activeWorkout: currentWorkout,
        });
    }, [currentWorkout, bridge]);

    // Function to get currently visible elements for AI context
    const getVisibleElements = useCallback(() => {
        const elements: string[] = [];

        // Check for common UI elements that are currently visible
        const selectors = [
            '.workout-card',
            '.exercise-item',
            '.stats-card',
            '.progress-chart',
            '.navigation-menu',
            '.workout-form',
            '.exercise-form',
            '.set-logger',
            '.timer-display',
            '.recommendation-card',
            '.template-card',
            '.profile-section',
        ];

        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element && isElementVisible(element)) {
                elements.push(selector);
            }
        });

        return elements;
    }, []);

    // Helper function to check if element is visible
    const isElementVisible = (element: Element): boolean => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    };

    // Update visible elements when page content changes
    useEffect(() => {
        const updateVisibleElements = () => {
            bridge.sendContextUpdate({
                visibleElements: getVisibleElements(),
            });
        };

        // Update on scroll and resize
        window.addEventListener('scroll', updateVisibleElements);
        window.addEventListener('resize', updateVisibleElements);

        // Update periodically to catch dynamic content changes
        const interval = setInterval(updateVisibleElements, 2000);

        return () => {
            window.removeEventListener('scroll', updateVisibleElements);
            window.removeEventListener('resize', updateVisibleElements);
            clearInterval(interval);
        };
    }, [bridge, getVisibleElements]);

    // Provide workout context to chat
    const provideWorkoutContext = useCallback(() => {
        const context = {
            currentWorkout,
            workoutHistory: workoutHistory?.slice(0, 5), // Last 5 workouts
            currentPage: pathname,
            availableActions: getAvailableActions(),
        };

        bridge.sendContextUpdate(context);
    }, [currentWorkout, workoutHistory, pathname, bridge]);

    // Get available actions based on current page
    const getAvailableActions = useCallback(() => {
        const actions: string[] = [];

        switch (pathname) {
            case '/':
                actions.push('create-workout', 'show-stats', 'show-recommendations');
                break;
            case '/workout':
                actions.push('log-set', 'finish-workout', 'start-workout');
                break;
            case '/stats':
                actions.push('show-progress', 'create-workout');
                break;
            case '/profile':
                actions.push('navigate', 'show-stats');
                break;
            default:
                actions.push('navigate', 'highlight');
        }

        return actions;
    }, [pathname]);

    // Provide context on mount and when dependencies change
    useEffect(() => {
        provideWorkoutContext();
    }, [provideWorkoutContext]);

    return <>{children}</>;
}

// Hook for getting current app context for chat
export function useChatContext() {
    const bridge = useAppChatBridge();
    const pathname = usePathname();
    const { currentWorkout } = useWorkout();

    const getCurrentContext = useCallback(() => {
        return {
            currentPage: pathname,
            activeWorkout: currentWorkout,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenSize: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
        };
    }, [pathname, currentWorkout]);

    const sendContextToChat = useCallback((additionalContext?: any) => {
        const context = {
            ...getCurrentContext(),
            ...additionalContext,
        };

        bridge.sendContextUpdate(context);
    }, [getCurrentContext, bridge]);

    return {
        getCurrentContext,
        sendContextToChat,
        bridge,
    };
}