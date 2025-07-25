import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Providers } from '@/app/providers';
import { UserPreferencesManager } from '@/lib/user-preferences';

// Mock window dimensions for consistent testing
export const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

// Mock responsive layout hook
export const mockResponsiveLayout = (overrides: any = {}) => {
  const defaultLayout = {
    isDesktop: true,
    isTablet: false,
    isMobile: false,
    breakpoint: 'desktop',
    shouldUseSplitScreen: true,
    containerWidth: 1400,
    ...overrides,
  };
  
  const mockUseResponsiveLayout = require('@/hooks/use-responsive-layout').useResponsiveLayout;
  mockUseResponsiveLayout.mockReturnValue(defaultLayout);
  
  return defaultLayout;
};

// Mock authentication context
export const mockAuthContext = (user: any = null) => {
  const mockUseAuth = require('@/contexts/AuthContext').useAuth;
  mockUseAuth.mockReturnValue({
    user: user || { uid: 'test-user', email: 'test@example.com' },
    loading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
  });
};

// Mock workout context
export const mockWorkoutContext = (overrides: any = {}) => {
  const mockUseWorkout = require('@/contexts/WorkoutContext').useWorkout;
  mockUseWorkout.mockReturnValue({
    currentWorkout: null,
    setCurrentWorkoutExercises: jest.fn(),
    workoutHistory: [],
    ...overrides,
  });
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withAuth?: boolean;
  withWorkout?: boolean;
  initialPreferences?: any;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    withAuth = true,
    withWorkout = true,
    initialPreferences,
    ...renderOptions
  } = options;

  // Setup mocks
  if (withAuth) mockAuthContext();
  if (withWorkout) mockWorkoutContext();
  
  // Setup preferences
  if (initialPreferences) {
    UserPreferencesManager.getInstance().updatePreferences(initialPreferences);
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Providers>{children}</Providers>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Desktop-specific render function
export const renderDesktopLayout = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  // Setup desktop environment
  mockWindowDimensions(1400, 900);
  mockResponsiveLayout({
    isDesktop: true,
    shouldUseSplitScreen: true,
    breakpoint: 'desktop',
  });

  return renderWithProviders(ui, options);
};

// Tablet-specific render function
export const renderTabletLayout = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  // Setup tablet environment
  mockWindowDimensions(800, 600);
  mockResponsiveLayout({
    isDesktop: false,
    isTablet: true,
    isMobile: false,
    shouldUseSplitScreen: false,
    breakpoint: 'md',
  });

  return renderWithProviders(ui, options);
};

// Mobile-specific render function
export const renderMobileLayout = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  // Setup mobile environment
  mockWindowDimensions(375, 667);
  mockResponsiveLayout({
    isDesktop: false,
    isTablet: false,
    isMobile: true,
    shouldUseSplitScreen: false,
    breakpoint: 'sm',
  });

  return renderWithProviders(ui, options);
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Accessibility testing utilities
export const checkAccessibility = async (container: HTMLElement) => {
  const { axe } = await import('@axe-core/react');
  const results = await axe(container);
  return results;
};

// Keyboard testing utilities
export const simulateKeyboardShortcut = (key: string, modifiers: string[] = []) => {
  const event = new KeyboardEvent('keydown', {
    key,
    altKey: modifiers.includes('alt'),
    ctrlKey: modifiers.includes('ctrl'),
    shiftKey: modifiers.includes('shift'),
    metaKey: modifiers.includes('meta'),
  });
  
  window.dispatchEvent(event);
};

// Visual regression testing utilities
export const takeScreenshot = async (element: HTMLElement, name: string) => {
  // This would integrate with a visual regression testing tool
  // For now, we'll just return a placeholder
  return `screenshot-${name}-${Date.now()}`;
};

// Cleanup utilities
export const cleanupTests = () => {
  // Clear preferences
  UserPreferencesManager.getInstance().clearAllPreferences();
  
  // Clear localStorage
  localStorage.clear();
  
  // Reset window dimensions
  mockWindowDimensions(1024, 768);
  
  // Clear all mocks
  jest.clearAllMocks();
};

// Test data factories
export const createMockWorkout = (overrides: any = {}) => ({
  id: 'workout-1',
  name: 'Test Workout',
  exercises: [
    {
      id: 'exercise-1',
      name: 'Push-ups',
      sets: [
        { weight: 0, reps: 10, isWarmup: false, isExecuted: false },
        { weight: 0, reps: 12, isWarmup: false, isExecuted: false },
      ],
      muscleGroups: ['Chest', 'Triceps'],
      equipment: 'Bodyweight',
    },
  ],
  createdAt: new Date(),
  ...overrides,
});

export const createMockUser = (overrides: any = {}) => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  ...overrides,
});

export const createMockChatMessage = (overrides: any = {}) => ({
  id: 'message-1',
  role: 'user' as const,
  content: 'Test message',
  timestamp: new Date(),
  ...overrides,
});

// Custom matchers for testing
export const customMatchers = {
  toBeWithinPerformanceBudget: (received: number, budget: number) => {
    const pass = received <= budget;
    return {
      message: () =>
        `expected ${received}ms to be within performance budget of ${budget}ms`,
      pass,
    };
  },
  
  toHaveAccessibilityViolations: (received: any[], expected: number = 0) => {
    const pass = received.length === expected;
    return {
      message: () =>
        `expected ${received.length} accessibility violations, got ${expected}`,
      pass,
    };
  },
};

// Export all utilities
export * from '@testing-library/react';
export { renderWithProviders as render };

// Re-export commonly used testing utilities
export {
  renderDesktopLayout,
  renderTabletLayout,
  renderMobileLayout,
  mockWindowDimensions,
  mockResponsiveLayout,
  mockAuthContext,
  mockWorkoutContext,
  measureRenderTime,
  checkAccessibility,
  simulateKeyboardShortcut,
  takeScreenshot,
  cleanupTests,
  createMockWorkout,
  createMockUser,
  createMockChatMessage,
  customMatchers,
};