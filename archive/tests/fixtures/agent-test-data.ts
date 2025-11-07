/**
 * Test Fixtures for AI Agent Tests
 *
 * Provides mock data for testing agent functions and behaviors
 */

import { Workout, Exercise, Set } from '@/types/workout';
import { UserProfile } from '@/types/user';

export const mockUserId = 'test-user-123';
export const mockWorkoutId = 'workout-abc-123';

export const mockUserProfile: UserProfile = {
  id: mockUserId,
  uid: mockUserId,
  email: 'test@example.com',
  displayName: 'Test User',
  username: 'testuser',
  bio: 'Fitness enthusiast',
  fitnessGoals: ['muscle_gain', 'strength'],
  workoutCount: 42,
  followers: [],
  following: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2025-01-06')
};

export const mockExercises: Exercise[] = [
  {
    id: 'ex-1',
    name: 'Bench Press',
    sets: [
      { setNumber: 1, reps: 10, weight: 135, completed: true, rpe: 7 },
      { setNumber: 2, reps: 10, weight: 135, completed: true, rpe: 8 },
      { setNumber: 3, reps: 8, weight: 135, completed: true, rpe: 9 }
    ],
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['shoulders'],
    notes: 'Good form'
  },
  {
    id: 'ex-2',
    name: 'Squat',
    sets: [
      { setNumber: 1, reps: 12, weight: 185, completed: true, rpe: 7 },
      { setNumber: 2, reps: 10, weight: 185, completed: true, rpe: 8 },
      { setNumber: 3, reps: 10, weight: 185, completed: true, rpe: 8 }
    ],
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    notes: ''
  }
];

export const mockWorkout: Workout = {
  id: mockWorkoutId,
  userId: mockUserId,
  name: 'Upper Body Strength',
  exercises: mockExercises,
  createdAt: new Date('2025-01-05T10:00:00Z'),
  duration: 60,
  notes: 'Great session',
  totalVolume: 9700, // Calculated from exercises
  rpe: 8 // Average RPE
};

export const mockWorkouts: Workout[] = [
  mockWorkout,
  {
    id: 'workout-abc-124',
    userId: mockUserId,
    name: 'Leg Day',
    exercises: [mockExercises[1]],
    createdAt: new Date('2025-01-03T10:00:00Z'),
    duration: 45,
    notes: '',
    totalVolume: 5920, // Calculated from squat
    rpe: 7
  },
  {
    id: 'workout-abc-125',
    userId: mockUserId,
    name: 'Pull Day',
    exercises: [],
    createdAt: new Date('2025-01-01T10:00:00Z'),
    duration: 50,
    notes: 'Back and biceps',
    totalVolume: 0, // No exercises
    rpe: 0
  }
];

export const mockOnboardingContext = {
  fitnessGoals: {
    primary: 'muscle_gain',
    secondary: ['strength']
  },
  experienceLevel: {
    overall: 'intermediate',
    previousInjuries: []
  },
  schedule: {
    sessionDuration: 60,
    frequency: 4
  },
  equipment: {
    available: ['barbell', 'dumbbells', 'gym equipment']
  }
};

export const mockAgentContext = {
  userId: mockUserId,
  conversationId: 'conv-123',
  currentDomain: 'workout' as const,
  navigationStack: ['/'],
  recentMessages: []
};

// Mock function call expectations for behavioral tests
export const expectedFunctionCalls = {
  generateWorkout: {
    name: 'generateWorkout',
    args: {
      targetMuscles: ['chest', 'triceps'],
      workoutType: 'hypertrophy',
      experience: 'intermediate',
      duration: 60
    }
  },
  viewWorkoutHistory: {
    name: 'viewWorkoutHistory',
    args: {
      limit: 10,
      sortBy: 'recent'
    }
  },
  deleteWorkout: {
    name: 'deleteWorkout',
    args: {
      workoutId: mockWorkoutId
    }
  }
};
