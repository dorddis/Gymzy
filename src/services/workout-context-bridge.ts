/**
 * Workout Context Bridge Service
 * Bridges the gap between React WorkoutContext and AI services
 */

import { getRecentWorkouts } from './workout-service';

export interface MuscleVolumes {
  [muscle: string]: number;
}

export interface WorkoutContextData {
  recentWorkouts: any[];
  muscleVolumes: MuscleVolumes;
  currentWorkoutExercises: any[];
  totalVolume: number;
}

export class WorkoutContextBridge {
  private static instance: WorkoutContextBridge;
  private contextData: WorkoutContextData | null = null;
  private lastUpdated: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): WorkoutContextBridge {
    if (!WorkoutContextBridge.instance) {
      WorkoutContextBridge.instance = new WorkoutContextBridge();
    }
    return WorkoutContextBridge.instance;
  }

  /**
   * Update context data from React WorkoutContext
   */
  updateContextData(data: WorkoutContextData): void {
    console.log('🔄 WorkoutContextBridge: Updating context data');
    this.contextData = data;
    this.lastUpdated = new Date();
  }

  /**
   * Get current workout context data
   */
  async getWorkoutContext(userId: string): Promise<WorkoutContextData> {
    // Check if we have fresh cached data
    if (this.contextData && this.lastUpdated && 
        (Date.now() - this.lastUpdated.getTime()) < this.CACHE_DURATION) {
      console.log('📦 WorkoutContextBridge: Using cached context data');
      return this.contextData;
    }

    console.log('🔄 WorkoutContextBridge: Fetching fresh context data');
    
    try {
      // Fetch recent workouts
      const recentWorkouts = await getRecentWorkouts(userId, 10);
      
      // Calculate muscle volumes from recent workouts
      const muscleVolumes = this.calculateMuscleVolumesFromWorkouts(recentWorkouts);
      
      // Calculate total volume
      const totalVolume = Object.values(muscleVolumes).reduce((sum, volume) => sum + volume, 0);

      const contextData: WorkoutContextData = {
        recentWorkouts,
        muscleVolumes,
        currentWorkoutExercises: [], // This would need to be set from React context
        totalVolume
      };

      this.contextData = contextData;
      this.lastUpdated = new Date();
      
      return contextData;
    } catch (error) {
      console.error('❌ WorkoutContextBridge: Error fetching context data:', error);
      
      // Return empty context as fallback
      return {
        recentWorkouts: [],
        muscleVolumes: {},
        currentWorkoutExercises: [],
        totalVolume: 0
      };
    }
  }

  /**
   * Calculate muscle volumes from workout history
   */
  private calculateMuscleVolumesFromWorkouts(workouts: any[]): MuscleVolumes {
    const volumes: MuscleVolumes = {};
    
    // Import exercise constants
    const { EXERCISES } = require('../../home/user/studio/src/lib/constants');
    
    workouts.forEach(workout => {
      if (!workout.exercises) return;
      
      workout.exercises.forEach((exercise: any) => {
        // Find exercise details
        const exerciseDetails = EXERCISES.find((ex: any) => ex.id === exercise.id || ex.name === exercise.name);
        if (!exerciseDetails) return;
        
        // Calculate volume for this exercise
        let exerciseVolume = 0;
        if (exercise.sets && Array.isArray(exercise.sets)) {
          exerciseVolume = exercise.sets.reduce((sum: number, set: any) => {
            if (set.isExecuted && set.weight && set.reps) {
              return sum + (set.weight * set.reps);
            }
            return sum;
          }, 0);
        }
        
        if (exerciseVolume === 0) return;
        
        // Distribute volume to muscles
        if (exerciseDetails.primaryMuscles) {
          exerciseDetails.primaryMuscles.forEach((muscle: string) => {
            volumes[muscle] = (volumes[muscle] || 0) + (exerciseVolume * 0.7);
          });
        }
        
        if (exerciseDetails.secondaryMuscles) {
          exerciseDetails.secondaryMuscles.forEach((muscle: string) => {
            volumes[muscle] = (volumes[muscle] || 0) + (exerciseVolume * 0.3);
          });
        }
      });
    });
    
    return volumes;
  }

  /**
   * Get muscle volumes for AI context
   */
  async getMuscleVolumes(userId: string): Promise<MuscleVolumes> {
    const context = await this.getWorkoutContext(userId);
    return context.muscleVolumes;
  }

  /**
   * Get recent workouts for AI context
   */
  async getRecentWorkoutsForAI(userId: string): Promise<any[]> {
    const context = await this.getWorkoutContext(userId);
    return context.recentWorkouts;
  }

  /**
   * Clear cached data (useful when user completes a workout)
   */
  clearCache(): void {
    console.log('🗑️ WorkoutContextBridge: Clearing cache');
    this.contextData = null;
    this.lastUpdated = null;
  }

  /**
   * Get context summary for AI
   */
  async getContextSummary(userId: string): Promise<string> {
    const context = await this.getWorkoutContext(userId);
    
    let summary = '';
    
    // Recent workout summary
    if (context.recentWorkouts.length > 0) {
      const lastWorkout = context.recentWorkouts[0];
      const daysSinceLastWorkout = lastWorkout.date ? 
        Math.floor((Date.now() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24)) : 
        null;
      
      summary += `Last workout: ${lastWorkout.name || 'Unnamed'} (${daysSinceLastWorkout} days ago)\n`;
    }
    
    // Muscle volume summary
    const topMuscles = Object.entries(context.muscleVolumes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    if (topMuscles.length > 0) {
      summary += `Top muscle volumes: ${topMuscles.map(([muscle, volume]) => 
        `${muscle} (${Math.round(volume)})`).join(', ')}\n`;
    }
    
    // Total volume
    summary += `Total recent volume: ${Math.round(context.totalVolume)}\n`;
    
    return summary;
  }
}

// Export singleton instance
export const workoutContextBridge = WorkoutContextBridge.getInstance();
