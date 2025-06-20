/**
 * Intelligent Workout Generator
 * Generates workouts based on muscle volume data, recent workout history, and user preferences
 */

import { EXERCISES, Exercise, Muscle } from '../../home/user/studio/src/lib/constants';

export interface MuscleVolumes {
  [key: string]: number;
}

export interface WorkoutGenerationContext {
  userId: string;
  recentWorkouts: any[];
  muscleVolumes?: MuscleVolumes;
  userPreferences?: {
    fitnessLevel?: string;
    availableEquipment?: string[];
    timePerWorkout?: string;
    goals?: string[];
  };
  requestContext?: {
    intent: string;
    specificMuscles?: string[];
    workoutType?: string;
    difficulty?: string;
  };
}

export interface GeneratedWorkout {
  name: string;
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    restTime?: number;
    instructions?: string;
  }>;
  estimatedDuration: number;
  targetMuscles: string[];
  difficulty: string;
  reasoning: string;
}

export class IntelligentWorkoutGenerator {
  
  /**
   * Generate an intelligent workout based on context
   */
  static async generateWorkout(context: WorkoutGenerationContext): Promise<GeneratedWorkout> {
    console.log('🧠 IntelligentWorkoutGenerator: Generating workout with context:', context);

    try {
      // Analyze muscle recovery status
      const muscleAnalysis = this.analyzeMuscleRecovery(context.muscleVolumes || {}, context.recentWorkouts);
      
      // Determine target muscles based on recovery and user intent
      const targetMuscles = this.selectTargetMuscles(muscleAnalysis, context.requestContext);
      
      // Select appropriate exercises
      const selectedExercises = this.selectExercises(targetMuscles, context.userPreferences);
      
      // Generate workout structure
      const workout = this.buildWorkout(selectedExercises, context);
      
      console.log('✅ IntelligentWorkoutGenerator: Generated intelligent workout:', workout.name);
      return workout;
      
    } catch (error) {
      console.error('❌ IntelligentWorkoutGenerator: Error generating workout:', error);
      return this.generateFallbackWorkout(context);
    }
  }

  /**
   * Analyze muscle recovery status based on recent volume
   */
  private static analyzeMuscleRecovery(muscleVolumes: MuscleVolumes, recentWorkouts: any[]): {
    overworked: string[];
    recovered: string[];
    undertrained: string[];
  } {
    const analysis = {
      overworked: [] as string[],
      recovered: [] as string[],
      undertrained: [] as string[]
    };

    // Define volume thresholds (these could be made configurable)
    const HIGH_VOLUME_THRESHOLD = 1000;
    const LOW_VOLUME_THRESHOLD = 200;

    Object.entries(muscleVolumes).forEach(([muscle, volume]) => {
      if (volume > HIGH_VOLUME_THRESHOLD) {
        analysis.overworked.push(muscle);
      } else if (volume < LOW_VOLUME_THRESHOLD) {
        analysis.undertrained.push(muscle);
      } else {
        analysis.recovered.push(muscle);
      }
    });

    console.log('🔍 Muscle analysis:', analysis);
    return analysis;
  }

  /**
   * Select target muscles based on recovery analysis and user intent
   */
  private static selectTargetMuscles(
    muscleAnalysis: { overworked: string[]; recovered: string[]; undertrained: string[] },
    requestContext?: { specificMuscles?: string[]; workoutType?: string }
  ): string[] {
    // If user specified muscles, respect that but avoid overworked muscles
    if (requestContext?.specificMuscles && requestContext.specificMuscles.length > 0) {
      return requestContext.specificMuscles.filter(muscle => 
        !muscleAnalysis.overworked.includes(muscle)
      );
    }

    // Prioritize undertrained muscles, then recovered muscles
    const targetMuscles = [
      ...muscleAnalysis.undertrained.slice(0, 2),
      ...muscleAnalysis.recovered.slice(0, 2)
    ];

    // If no specific targets, use a balanced approach
    if (targetMuscles.length === 0) {
      return ['chest', 'legs', 'back']; // Default balanced workout
    }

    return targetMuscles.slice(0, 3); // Limit to 3 muscle groups
  }

  /**
   * Select exercises based on target muscles and user preferences
   */
  private static selectExercises(targetMuscles: string[], userPreferences?: any): Exercise[] {
    const availableEquipment = userPreferences?.availableEquipment || ['bodyweight'];
    const fitnessLevel = userPreferences?.fitnessLevel || 'beginner';
    
    const selectedExercises: Exercise[] = [];
    
    targetMuscles.forEach(targetMuscle => {
      // Find exercises that target this muscle and match equipment
      const suitableExercises = EXERCISES.filter(exercise => {
        const targetsMuscle = exercise.primaryMuscles?.includes(targetMuscle as Muscle) ||
                             exercise.secondaryMuscles?.includes(targetMuscle as Muscle);
        
        const hasEquipment = exercise.equipment === 'bodyweight' || 
                           availableEquipment.includes(exercise.equipment);
        
        return targetsMuscle && hasEquipment;
      });

      // Select 1-2 exercises per muscle group
      const exercisesToAdd = suitableExercises.slice(0, 2);
      selectedExercises.push(...exercisesToAdd);
    });

    // Ensure we have at least 3 exercises
    if (selectedExercises.length < 3) {
      const fallbackExercises = EXERCISES.filter(ex => 
        ex.equipment === 'bodyweight' && !selectedExercises.includes(ex)
      ).slice(0, 3 - selectedExercises.length);
      
      selectedExercises.push(...fallbackExercises);
    }

    return selectedExercises.slice(0, 6); // Limit to 6 exercises max
  }

  /**
   * Build the final workout structure
   */
  private static buildWorkout(exercises: Exercise[], context: WorkoutGenerationContext): GeneratedWorkout {
    const fitnessLevel = context.userPreferences?.fitnessLevel || 'beginner';
    
    // Determine sets and reps based on fitness level
    const getSetReps = (level: string) => {
      switch (level) {
        case 'advanced':
          return { sets: 4, reps: 12 };
        case 'intermediate':
          return { sets: 3, reps: 10 };
        default:
          return { sets: 3, reps: 8 };
      }
    };

    const { sets, reps } = getSetReps(fitnessLevel);
    
    const workoutExercises = exercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      sets,
      reps,
      weight: 0, // Will be filled based on user's previous data
      restTime: 60,
      instructions: exercise.instructions
    }));

    const targetMuscles = [...new Set(exercises.flatMap(ex => 
      [...(ex.primaryMuscles || []), ...(ex.secondaryMuscles || [])]
    ))];

    const estimatedDuration = exercises.length * 5 + (exercises.length * sets * 2); // Rough estimate

    return {
      name: this.generateWorkoutName(targetMuscles, context.requestContext),
      exercises: workoutExercises,
      estimatedDuration,
      targetMuscles,
      difficulty: fitnessLevel,
      reasoning: this.generateReasoning(targetMuscles, context)
    };
  }

  /**
   * Generate a descriptive workout name
   */
  private static generateWorkoutName(targetMuscles: string[], requestContext?: any): string {
    if (requestContext?.workoutType) {
      return `${requestContext.workoutType} Workout`;
    }

    if (targetMuscles.length === 1) {
      return `${targetMuscles[0].charAt(0).toUpperCase() + targetMuscles[0].slice(1)} Focus`;
    }

    if (targetMuscles.length === 2) {
      return `${targetMuscles[0]} & ${targetMuscles[1]} Workout`;
    }

    return 'Full Body Workout';
  }

  /**
   * Generate reasoning for the workout selection
   */
  private static generateReasoning(targetMuscles: string[], context: WorkoutGenerationContext): string {
    const reasons = [];
    
    if (context.muscleVolumes) {
      const undertrainedMuscles = Object.entries(context.muscleVolumes)
        .filter(([_, volume]) => volume < 200)
        .map(([muscle, _]) => muscle);
      
      if (undertrainedMuscles.length > 0) {
        reasons.push(`Focusing on undertrained muscle groups: ${undertrainedMuscles.join(', ')}`);
      }
    }

    if (context.requestContext?.intent) {
      reasons.push(`Based on your request: ${context.requestContext.intent}`);
    }

    reasons.push(`Targeting: ${targetMuscles.join(', ')}`);

    return reasons.join('. ');
  }

  /**
   * Generate a fallback workout when intelligent generation fails
   */
  private static generateFallbackWorkout(context: WorkoutGenerationContext): GeneratedWorkout {
    console.log('⚠️ Using fallback workout generation');
    
    // Use a balanced bodyweight workout as fallback
    const fallbackExercises = [
      { id: 'pushup', name: 'Push-ups', sets: 3, reps: 10, weight: 0 },
      { id: 'squat', name: 'Squats', sets: 3, reps: 12, weight: 0 },
      { id: 'plank', name: 'Plank', sets: 3, reps: 30, weight: 0 }
    ];

    return {
      name: 'Quick Bodyweight Workout',
      exercises: fallbackExercises,
      estimatedDuration: 20,
      targetMuscles: ['chest', 'legs', 'core'],
      difficulty: 'beginner',
      reasoning: 'Balanced bodyweight workout suitable for all fitness levels'
    };
  }
}
