import { EXERCISES } from '@/lib/constants';
import { Exercise } from '@/types/exercise';

// AI Tool definitions for workout creation and management
export interface AITool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: Array<{
    weight: number;
    reps: number;
    rpe: number;
    isWarmup: boolean;
    isExecuted: boolean;
  }>;
  muscleGroups: string[];
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

// AI Tools for workout management
export const AI_WORKOUT_TOOLS: AITool[] = [
  {
    name: "create_workout",
    description: "Create a new workout with specified exercises, sets, and reps",
    parameters: {
      type: "object",
      properties: {
        workoutName: {
          type: "string",
          description: "Name of the workout (e.g., 'Push Day', 'Leg Day')"
        },
        exercises: {
          type: "array",
          items: {
            type: "object",
            properties: {
              exerciseId: {
                type: "string",
                description: "ID of the exercise from the exercise database"
              },
              sets: {
                type: "number",
                description: "Number of sets to perform"
              },
              reps: {
                type: "number",
                description: "Number of reps per set"
              },
              weight: {
                type: "number",
                description: "Weight to use (in kg or lbs)"
              }
            },
            required: ["exerciseId", "sets", "reps"]
          },
          description: "Array of exercises with their sets and reps"
        },
        targetMuscles: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Primary muscle groups targeted in this workout"
        }
      },
      required: ["workoutName", "exercises"]
    }
  },
  {
    name: "search_exercises",
    description: "Search for exercises by name, muscle group, or equipment",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (exercise name, muscle group, or equipment)"
        },
        muscleGroup: {
          type: "string",
          description: "Filter by specific muscle group"
        },
        equipment: {
          type: "string",
          description: "Filter by equipment type"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
          default: 10
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_exercise_info",
    description: "Get detailed information about a specific exercise",
    parameters: {
      type: "object",
      properties: {
        exerciseId: {
          type: "string",
          description: "ID of the exercise to get information about"
        }
      },
      required: ["exerciseId"]
    }
  },
  {
    name: "suggest_workout_plan",
    description: "Suggest a workout plan based on user goals and preferences",
    parameters: {
      type: "object",
      properties: {
        goal: {
          type: "string",
          enum: ["strength", "muscle_gain", "weight_loss", "endurance", "general_fitness"],
          description: "Primary fitness goal"
        },
        experience: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
          description: "User's experience level"
        },
        duration: {
          type: "number",
          description: "Desired workout duration in minutes"
        },
        equipment: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Available equipment"
        },
        targetMuscles: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Specific muscle groups to target (optional)"
        }
      },
      required: ["goal", "experience", "duration"]
    }
  },
  {
    name: "start_workout",
    description: "Start a workout session with the created exercises",
    parameters: {
      type: "object",
      properties: {
        workoutId: {
          type: "string",
          description: "ID of the workout to start"
        },
        exercises: {
          type: "array",
          items: {
            type: "object",
            properties: {
              exerciseId: {
                type: "string"
              },
              sets: {
                type: "number"
              },
              reps: {
                type: "number"
              },
              weight: {
                type: "number"
              }
            }
          },
          description: "Exercises to include in the workout session"
        }
      },
      required: ["exercises"]
    }
  }
];

// Tool execution functions
export class AIWorkoutToolExecutor {
  static async executeCreateWorkout(params: any): Promise<{ success: boolean; workoutId: string; exercises: WorkoutExercise[] }> {
    const { workoutName, exercises, targetMuscles } = params;
    
    const workoutExercises: WorkoutExercise[] = exercises.map((ex: any, index: number) => {
      const exerciseData = EXERCISES.find(e => e.id === ex.exerciseId);
      
      if (!exerciseData) {
        throw new Error(`Exercise with ID ${ex.exerciseId} not found`);
      }

      return {
        id: `ai_workout_${Date.now()}_${index}`,
        name: exerciseData.name,
        sets: Array.from({ length: ex.sets }, () => ({
          weight: ex.weight || 0,
          reps: ex.reps || 8,
          rpe: 8,
          isWarmup: false,
          isExecuted: false
        })),
        muscleGroups: exerciseData.primaryMuscles,
        equipment: 'Mixed',
        primaryMuscles: exerciseData.primaryMuscles,
        secondaryMuscles: exerciseData.secondaryMuscles || []
      };
    });

    const workoutId = `ai_workout_${Date.now()}`;
    
    return {
      success: true,
      workoutId,
      exercises: workoutExercises
    };
  }

  static async executeSearchExercises(params: any): Promise<{ exercises: any[] }> {
    const { query, muscleGroup, equipment, limit = 10 } = params;
    
    let filteredExercises = EXERCISES;

    // Filter by query (name contains)
    if (query) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.name.toLowerCase().includes(query.toLowerCase()) ||
        ex.primaryMuscles.some(muscle => muscle.toLowerCase().includes(query.toLowerCase())) ||
        ex.secondaryMuscles?.some(muscle => muscle.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Filter by muscle group
    if (muscleGroup) {
      filteredExercises = filteredExercises.filter(ex =>
        ex.primaryMuscles.some(muscle => muscle.toLowerCase().includes(muscleGroup.toLowerCase())) ||
        ex.secondaryMuscles?.some(muscle => muscle.toLowerCase().includes(muscleGroup.toLowerCase()))
      );
    }

    return {
      exercises: filteredExercises.slice(0, limit).map(ex => ({
        id: ex.id,
        name: ex.name,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles
      }))
    };
  }

  static async executeGetExerciseInfo(params: any): Promise<{ exercise: any | null }> {
    const { exerciseId } = params;
    
    const exercise = EXERCISES.find(ex => ex.id === exerciseId);
    
    return {
      exercise: exercise ? {
        id: exercise.id,
        name: exercise.name,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        description: `${exercise.name} primarily targets ${exercise.primaryMuscles.join(', ')}${
          exercise.secondaryMuscles?.length ? ` and secondarily works ${exercise.secondaryMuscles.join(', ')}` : ''
        }.`
      } : null
    };
  }

  static async executeSuggestWorkoutPlan(params: any): Promise<{ workoutPlan: any }> {
    const { goal, experience, duration, equipment = [], targetMuscles = [] } = params;
    
    // Simple workout plan generation based on parameters
    let suggestedExercises: string[] = [];
    
    if (goal === 'strength') {
      suggestedExercises = ['deadlift', 'squat', 'bench-press', 'overhead-press'];
    } else if (goal === 'muscle_gain') {
      suggestedExercises = ['bench-press', 'squat', 'deadlift', 'dumbbell-row', 'overhead-press'];
    } else if (goal === 'weight_loss' || goal === 'endurance') {
      suggestedExercises = ['burpees', 'mountain-climbers', 'jump-squats', 'high-knees'];
    } else {
      suggestedExercises = ['push-ups', 'squat', 'plank', 'dumbbell-row'];
    }

    const exercises = suggestedExercises.map(id => {
      const exercise = EXERCISES.find(ex => ex.id === id);
      return exercise ? {
        exerciseId: id,
        name: exercise.name,
        sets: experience === 'beginner' ? 2 : experience === 'intermediate' ? 3 : 4,
        reps: goal === 'strength' ? 6 : goal === 'endurance' ? 15 : 10,
        weight: 0 // Will be filled based on user's previous data
      } : null;
    }).filter(Boolean);

    return {
      workoutPlan: {
        name: `${goal.replace('_', ' ')} Workout`,
        duration,
        difficulty: experience,
        exercises,
        description: `A ${duration}-minute ${goal.replace('_', ' ')} workout designed for ${experience} level.`
      }
    };
  }

  static async executeStartWorkout(params: any): Promise<{ success: boolean; message: string; exercises: WorkoutExercise[] }> {
    const { exercises } = params;
    
    const workoutExercises = await this.executeCreateWorkout({
      workoutName: 'AI Generated Workout',
      exercises,
      targetMuscles: []
    });

    return {
      success: true,
      message: 'Workout started! Navigate to the workout page to begin.',
      exercises: workoutExercises.exercises
    };
  }
}

// Function to execute AI tools
export async function executeAITool(toolName: string, parameters: any): Promise<any> {
  switch (toolName) {
    case 'create_workout':
      return AIWorkoutToolExecutor.executeCreateWorkout(parameters);
    case 'search_exercises':
      return AIWorkoutToolExecutor.executeSearchExercises(parameters);
    case 'get_exercise_info':
      return AIWorkoutToolExecutor.executeGetExerciseInfo(parameters);
    case 'suggest_workout_plan':
      return AIWorkoutToolExecutor.executeSuggestWorkoutPlan(parameters);
    case 'start_workout':
      return AIWorkoutToolExecutor.executeStartWorkout(parameters);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
