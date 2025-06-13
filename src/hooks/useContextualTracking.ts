import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ContextualDataService } from '@/services/contextual-data-service';

// Hook for tracking contextual data throughout the app
export function useContextualTracking() {
  const { user } = useAuth();

  // Initialize user context when user logs in
  useEffect(() => {
    if (user?.uid) {
      ContextualDataService.initializeUserContext(user.uid).catch(error => {
        console.error('Failed to initialize user context:', error);
      });
    }
  }, [user?.uid]);

  // Track workout completion
  const trackWorkoutCompletion = useCallback(async (workoutData: any) => {
    if (!user?.uid) return;

    try {
      // Update workout patterns
      await ContextualDataService.updateWorkoutPatterns(user.uid, workoutData);
      
      // Update performance metrics if exercises are present
      if (workoutData.exercises && workoutData.exercises.length > 0) {
        await ContextualDataService.updatePerformanceMetrics(user.uid, workoutData.exercises);
      }
      
      // Track feature usage
      await ContextualDataService.trackBehavioralPattern(user.uid, 'feature_usage', {
        feature: 'workout_completion'
      });
      
      console.log('Workout context tracked successfully');
    } catch (error) {
      console.error('Error tracking workout completion:', error);
    }
  }, [user?.uid]);

  // Track motivation level
  const trackMotivationLevel = useCallback(async (level: number) => {
    if (!user?.uid) return;

    try {
      await ContextualDataService.trackBehavioralPattern(user.uid, 'motivation_level', {
        level
      });
    } catch (error) {
      console.error('Error tracking motivation level:', error);
    }
  }, [user?.uid]);

  // Track social engagement
  const trackSocialEngagement = useCallback(async (action: 'likesGiven' | 'commentsPosted' | 'workoutsShared' | 'followersGained') => {
    if (!user?.uid) return;

    try {
      await ContextualDataService.trackBehavioralPattern(user.uid, 'social_engagement', {
        action
      });
    } catch (error) {
      console.error('Error tracking social engagement:', error);
    }
  }, [user?.uid]);

  // Track feature usage
  const trackFeatureUsage = useCallback(async (feature: string) => {
    if (!user?.uid) return;

    try {
      await ContextualDataService.trackBehavioralPattern(user.uid, 'feature_usage', {
        feature
      });
    } catch (error) {
      console.error('Error tracking feature usage:', error);
    }
  }, [user?.uid]);

  // Track lifestyle context
  const trackLifestyleContext = useCallback(async (
    contextType: 'sleep_quality' | 'stress_level' | 'energy_level',
    value: number
  ) => {
    if (!user?.uid) return;

    try {
      await ContextualDataService.updateLifestyleContext(user.uid, contextType, value);
    } catch (error) {
      console.error('Error tracking lifestyle context:', error);
    }
  }, [user?.uid]);

  // Track app session
  const trackAppSession = useCallback(async (sessionDuration: number) => {
    if (!user?.uid) return;

    try {
      await ContextualDataService.trackBehavioralPattern(user.uid, 'app_session', {
        duration: sessionDuration
      });
    } catch (error) {
      console.error('Error tracking app session:', error);
    }
  }, [user?.uid]);

  return {
    trackWorkoutCompletion,
    trackMotivationLevel,
    trackSocialEngagement,
    trackFeatureUsage,
    trackLifestyleContext,
    trackAppSession
  };
}

// Hook for getting user context data
export function useUserContext() {
  const { user } = useAuth();

  const getUserContext = useCallback(async () => {
    if (!user?.uid) return null;

    try {
      return await ContextualDataService.getUserContext(user.uid);
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }, [user?.uid]);

  return {
    getUserContext
  };
}
