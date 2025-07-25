"use client";

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { AppLayoutProvider } from '@/components/layout/app-layout-provider';
import { AppChatBridgeProvider } from '@/contexts/AppChatBridgeContext';
import { ChatActionHandler } from '@/components/chat/chat-action-handler';
import { ChatContextProvider } from '@/components/chat/chat-context-provider';
import { KeyboardNavigation } from '@/components/layout/keyboard-navigation';
import { SkipToContent } from '@/components/layout/accessibility-helpers';
import { ErrorBoundary } from '@/components/layout/error-boundary';
import { PerformanceMonitor } from '@/components/layout/performance-optimizations';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Root Error:', error, errorInfo);
        // In production, send to error reporting service
      }}
    >
      <AuthProvider>
        <WorkoutProvider>
          <AppChatBridgeProvider>
            <AppLayoutProvider>
              <ChatActionHandler>
                <ChatContextProvider>
                  <KeyboardNavigation>
                    <SkipToContent />
                    {children}
                    <PerformanceMonitor />
                  </KeyboardNavigation>
                </ChatContextProvider>
              </ChatActionHandler>
            </AppLayoutProvider>
          </AppChatBridgeProvider>
        </WorkoutProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}