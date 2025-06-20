/**
 * Hook to bridge React WorkoutContext with AI services
 */

import { useEffect } from 'react';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useAuth } from '@/contexts/AuthContext';
import { workoutContextBridge } from '@/services/workout-context-bridge';

export function useWorkoutContextBridge() {
  const { user } = useAuth();
  const { 
    recentWorkouts, 
    combinedMuscleVolumes, 
    currentWorkoutExercises, 
    totalVolume 
  } = useWorkout();

  useEffect(() => {
    if (!user?.uid) return;

    // Update the bridge with current workout context data
    const contextData = {
      recentWorkouts,
      muscleVolumes: combinedMuscleVolumes,
      currentWorkoutExercises,
      totalVolume
    };

    console.log('🔄 useWorkoutContextBridge: Updating bridge with context data');
    workoutContextBridge.updateContextData(contextData);

  }, [user?.uid, recentWorkouts, combinedMuscleVolumes, currentWorkoutExercises, totalVolume]);

  // Clear cache when user completes a workout
  const clearContextCache = () => {
    console.log('🗑️ useWorkoutContextBridge: Clearing context cache');
    workoutContextBridge.clearCache();
  };

  return {
    clearContextCache
  };
}
