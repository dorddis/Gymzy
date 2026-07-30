"use client";

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { Toaster } from '@/components/ui/toaster';
import { QuickActionButton } from '@/components/quick-action-button';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WorkoutProvider>
        {children}
        <Toaster />
        <QuickActionButton />
      </WorkoutProvider>
    </AuthProvider>
  );
}