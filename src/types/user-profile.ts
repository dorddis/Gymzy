/**
 * Unified User Profile Types
 * Consolidates all user profile interfaces into a single, comprehensive system
 */

import { Timestamp } from 'firebase/firestore';

// Core user profile interface - combines social and fitness data
export interface UserProfile {
  // Basic user information
  uid: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  bio?: string;
  
  // Social features
  isPublic: boolean;
  followersCount: number;
  followingCount: number;
  workoutsCount: number;
  
  // Fitness profile
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  fitnessGoals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'; // Alias for fitnessLevel for backward compatibility
  preferredWorkoutTypes: string[];
  availableEquipment: string[];
  workoutFrequency: string;
  timePerWorkout: string;
  injuries: string[];
  
  // AI and personalization preferences
  preferences: {
    communicationStyle: 'casual' | 'professional' | 'motivational';
    detailLevel: 'brief' | 'detailed' | 'comprehensive';
    workoutComplexity: 'beginner' | 'intermediate' | 'advanced';
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Legacy and compatibility fields
  hasChatted?: boolean;
  hasCompletedOnboarding: boolean;
}

// Public profile interface (for user discovery and social features)
export interface PublicUserProfile {
  uid: string;
  displayName: string;
  profilePicture?: string;
  bio?: string;
  fitnessGoals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  isPublic: boolean;
  followersCount: number;
  followingCount: number;
  workoutsCount: number;
  createdAt: Timestamp;
}

// Fitness-focused profile for AI context (simplified for agentic AI)
export interface FitnessProfile {
  fitnessLevel: string;
  goals: string[];
  preferredWorkoutTypes: string[];
  availableEquipment: string[];
  workoutFrequency: string;
  timePerWorkout: string;
  injuries: string[];
  preferences: {
    communicationStyle: 'casual' | 'professional' | 'motivational';
    detailLevel: 'brief' | 'detailed' | 'comprehensive';
    workoutComplexity: 'beginner' | 'intermediate' | 'advanced';
  };
}

// AI Personality Profile (extended profile for advanced AI features)
export interface AIPersonalityProfile {
  userId: string;
  // Fitness Profile (detailed)
  experienceLevel: number; // 1-10 scale
  fitnessGoals: {
    primary: string;
    secondary: string[];
    timeline: string;
  };
  workoutPreferences: {
    types: string[];
    duration: number;
    frequency: number;
    intensity: number;
  };
  // Personality Traits
  communicationStyle: 'motivational' | 'analytical' | 'supportive' | 'challenging';
  feedbackPreference: 'detailed' | 'concise' | 'visual';
  motivationFactors: string[];
  // Lifestyle Context
  schedule: {
    availableDays: string[];
    preferredTimes: string[];
    timeConstraints: string[];
  };
  // AI Learning Data
  learningData: {
    preferredExercises: string[];
    avoidedExercises: string[];
    successfulWorkouts: string[];
    challengingAreas: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Workout context for current session
export interface WorkoutContext {
  currentWorkout?: {
    id: string;
    name: string;
    exercises: any[];
    status: 'planning' | 'active' | 'completed';
  };
  recentWorkouts: any[];
  workoutHistory: any[];
  preferences: {
    preferredExercises: string[];
    avoidedExercises: string[];
    targetMuscleGroups: string[];
  };
}

// User context for comprehensive data
export interface UserContext {
  userId: string;
  workoutPatterns: any; // From contextual-data-service
  performanceMetrics: any;
  behavioralPatterns: any;
  lifestyleContext: any;
  aiInsights: {
    personalityType: string;
    motivationTriggers: string[];
    optimalWorkoutTimes: string[];
    recommendedRestDays: number;
    injuryRiskLevel: 'low' | 'medium' | 'high';
    progressPrediction: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Profile update interface
export interface UserProfileUpdate {
  displayName?: string;
  bio?: string;
  profilePicture?: string;
  fitnessGoals?: string[];
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredWorkoutTypes?: string[];
  availableEquipment?: string[];
  workoutFrequency?: string;
  timePerWorkout?: string;
  injuries?: string[];
  isPublic?: boolean;
  preferences?: {
    communicationStyle?: 'casual' | 'professional' | 'motivational';
    detailLevel?: 'brief' | 'detailed' | 'comprehensive';
    workoutComplexity?: 'beginner' | 'intermediate' | 'advanced';
  };
  hasCompletedOnboarding?: boolean;
}

// Utility functions for profile conversion
export class ProfileConverter {
  /**
   * Convert full UserProfile to FitnessProfile for AI context
   */
  static toFitnessProfile(userProfile: UserProfile): FitnessProfile {
    return {
      fitnessLevel: userProfile.fitnessLevel || 'beginner',
      goals: Array.isArray(userProfile.fitnessGoals) ? userProfile.fitnessGoals : ['general_fitness'],
      preferredWorkoutTypes: Array.isArray(userProfile.preferredWorkoutTypes) ? userProfile.preferredWorkoutTypes : ['bodyweight'],
      availableEquipment: Array.isArray(userProfile.availableEquipment) ? userProfile.availableEquipment : ['bodyweight'],
      workoutFrequency: userProfile.workoutFrequency || '2-3 times per week',
      timePerWorkout: userProfile.timePerWorkout || '30-45 minutes',
      injuries: Array.isArray(userProfile.injuries) ? userProfile.injuries : [],
      preferences: userProfile.preferences || {
        communicationStyle: 'motivational',
        detailLevel: 'detailed',
        workoutComplexity: 'beginner'
      }
    };
  }

  /**
   * Convert full UserProfile to PublicUserProfile for social features
   */
  static toPublicProfile(userProfile: UserProfile): PublicUserProfile {
    return {
      uid: userProfile.uid,
      displayName: userProfile.displayName,
      profilePicture: userProfile.profilePicture,
      bio: userProfile.bio,
      fitnessGoals: userProfile.fitnessGoals,
      experienceLevel: userProfile.experienceLevel,
      isPublic: userProfile.isPublic,
      followersCount: userProfile.followersCount,
      followingCount: userProfile.followingCount,
      workoutsCount: userProfile.workoutsCount,
      createdAt: userProfile.createdAt
    };
  }

  /**
   * Merge profile updates with existing profile
   */
  static mergeProfileUpdate(
    existingProfile: UserProfile, 
    updates: UserProfileUpdate
  ): UserProfile {
    return {
      ...existingProfile,
      ...updates,
      preferences: {
        ...existingProfile.preferences,
        ...updates.preferences
      },
      updatedAt: Timestamp.now()
    };
  }

  /**
   * Create default profile from basic user data
   */
  static createDefaultProfile(
    uid: string, 
    email: string, 
    displayName: string,
    additionalData?: Partial<UserProfile>
  ): UserProfile {
    return {
      uid,
      email,
      displayName,
      bio: '',
      fitnessGoals: [],
      fitnessLevel: 'beginner',
      experienceLevel: 'beginner',
      preferredWorkoutTypes: [],
      availableEquipment: ['bodyweight'],
      workoutFrequency: '2-3 times per week',
      timePerWorkout: '30-45 minutes',
      injuries: [],
      isPublic: true,
      followersCount: 0,
      followingCount: 0,
      workoutsCount: 0,
      preferences: {
        communicationStyle: 'motivational',
        detailLevel: 'detailed',
        workoutComplexity: 'beginner'
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      hasChatted: false,
      hasCompletedOnboarding: false,
      ...additionalData
    };
  }

  /**
   * Validate profile data
   */
  static validateProfile(profile: Partial<UserProfile>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!profile.uid) errors.push('UID is required');
    if (!profile.email) errors.push('Email is required');
    if (!profile.displayName) errors.push('Display name is required');
    
    if (profile.fitnessLevel && !['beginner', 'intermediate', 'advanced'].includes(profile.fitnessLevel)) {
      errors.push('Invalid fitness level');
    }

    if (profile.preferences?.communicationStyle && 
        !['casual', 'professional', 'motivational'].includes(profile.preferences.communicationStyle)) {
      errors.push('Invalid communication style');
    }

    return { valid: errors.length === 0, errors };
  }
}

// Constants for profile validation
export const PROFILE_CONSTANTS = {
  FITNESS_LEVELS: ['beginner', 'intermediate', 'advanced'] as const,
  COMMUNICATION_STYLES: ['casual', 'professional', 'motivational'] as const,
  DETAIL_LEVELS: ['brief', 'detailed', 'comprehensive'] as const,
  WORKOUT_COMPLEXITIES: ['beginner', 'intermediate', 'advanced'] as const,
  
  // Default values
  DEFAULT_EQUIPMENT: ['bodyweight'],
  DEFAULT_FREQUENCY: '2-3 times per week',
  DEFAULT_DURATION: '30-45 minutes',
  
  // Validation limits
  MAX_BIO_LENGTH: 500,
  MAX_DISPLAY_NAME_LENGTH: 50,
  MAX_GOALS_COUNT: 10,
  MAX_EQUIPMENT_COUNT: 20
} as const;
