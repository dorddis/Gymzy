"use client";

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { ChatProvider } from '@/contexts/ChatContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WorkoutProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </WorkoutProvider>
    </AuthProvider>
  );
} 