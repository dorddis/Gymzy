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
    console.log('🏋️ WorkoutTool: ===== EXECUTING CREATE_WORKOUT =====');
    console.log('🏋️ WorkoutTool: Raw parameters received:', JSON.stringify(params, null, 2));

    let { workoutName, exercises, targetMuscles } = params;
    console.log('🏋️ WorkoutTool: Extracted parameters:');
    console.log('🏋️ WorkoutTool: - workoutName:', workoutName);
    console.log('🏋️ WorkoutTool: - exercises:', exercises);
    console.log('🏋️ WorkoutTool: - targetMuscles:', targetMuscles);

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      console.warn('⚠️ WorkoutTool: Invalid or empty exercises parameter:', exercises);
      console.log('🔧 WorkoutTool: Creating default exercises based on workout type...');

      // Determine workout type from parameters
      const workoutType = params.workout_type || params.goal || 'general';
      console.log('🔧 WorkoutTool: Detected workout type:', workoutType);

      // Create appropriate default exercises based on workout type
      if (workoutType.toLowerCase().includes('push') || workoutType.toLowerCase().includes('chest')) {
        exercises = [
          { name: 'Push-up', sets: 3, reps: 10, weight: 0 },
          { name: 'Incline Dumbbell Press', sets: 3, reps: 8, weight: 0 },
          { name: 'Overhead Press', sets: 3, reps: 8, weight: 0 }
        ];
      } else if (workoutType.toLowerCase().includes('pull') || workoutType.toLowerCase().includes('back')) {
        exercises = [
          { name: 'Pull-up', sets: 3, reps: 8, weight: 0 },
          { name: 'Dumbbell Row', sets: 3, reps: 10, weight: 0 }
        ];
      } else if (workoutType.toLowerCase().includes('leg')) {
        exercises = [
          { name: 'Squat', sets: 3, reps: 10, weight: 0 },
          { name: 'Lunge', sets: 3, reps: 10, weight: 0 }
        ];
      } else {
        // Default single exercise for simple requests
        exercises = [
          { name: 'Push-up', sets: 3, reps: 10, weight: 0 }
        ];
      }

      console.log('🔧 WorkoutTool: Default exercises created:', JSON.stringify(exercises, null, 2));
    } else {
      console.log('✅ WorkoutTool: Valid exercises array provided with', exercises.length, 'exercises');
    }

    console.log('🔄 WorkoutTool: Processing exercises into workout format...');
    const workoutExercises: WorkoutExercise[] = exercises.map((ex: any, index: number) => {
      console.log(`🔄 WorkoutTool: Processing exercise ${index + 1}:`, JSON.stringify(ex, null, 2));

      // Try to find exercise by ID first, then by name
      let exerciseData = EXERCISES.find(e => e.id === ex.exerciseId);
      console.log(`🔍 WorkoutTool: Exercise lookup by ID '${ex.exerciseId}':`, exerciseData ? 'FOUND' : 'NOT FOUND');

      if (!exerciseData && ex.name) {
        // Try exact name match first
        exerciseData = EXERCISES.find(e =>
          e.name.toLowerCase() === ex.name.toLowerCase()
        );

        if (!exerciseData) {
          // Try partial name match
          exerciseData = EXERCISES.find(e =>
            e.name.toLowerCase().includes(ex.name.toLowerCase()) ||
            ex.name.toLowerCase().includes(e.name.toLowerCase())
          );
        }

        if (!exerciseData) {
          // Try to find by common exercise name mappings
          const exerciseNameMappings: { [key: string]: string } = {
            'push-ups': 'push-up',
            'pushups': 'push-up',
            'push ups': 'push-up',
            'squats': 'squat',
            'pull-ups': 'pull-up',
            'pullups': 'pull-up',
            'pull ups': 'pull-up',
            'dumbbell row': 'dumbbell-row',
            'dumbbell rows': 'dumbbell-row',
            'db row': 'dumbbell-row',
            'barbell row': 'barbell-row',
            'barbell rows': 'barbell-row',
            'overhead press': 'overhead-press',
            'incline dumbbell press': 'incline-dumbbell-press',
            'bench press': 'bench-press',
            'chest press': 'bench-press'
          };

          const mappedName = exerciseNameMappings[ex.name.toLowerCase()];
          if (mappedName) {
            exerciseData = EXERCISES.find(e => e.id === mappedName);
            console.log(`🔍 WorkoutTool: Found exercise via mapping '${ex.name}' -> '${mappedName}':`, exerciseData ? exerciseData.name : 'NOT FOUND');
          }
        }

        console.log(`🔍 WorkoutTool: Exercise lookup by name '${ex.name}':`, exerciseData ? `FOUND: ${exerciseData.name}` : 'NOT FOUND');
      }

      if (!exerciseData) {
        // If still not found, create a basic exercise structure
        console.warn(`⚠️ WorkoutTool: Exercise not found: ${ex.exerciseId || ex.name}, creating basic structure`);
        exerciseData = {
          id: ex.exerciseId || `custom_${index}`,
          name: ex.name || `Exercise ${index + 1}`,
          primaryMuscles: targetMuscles || ['chest'],
          secondaryMuscles: [],
          equipment: 'bodyweight',
          instructions: [],
          tips: []
        };
        console.log(`🔧 WorkoutTool: Created basic exercise data:`, JSON.stringify(exerciseData, null, 2));
      } else {
        console.log(`✅ WorkoutTool: Using found exercise data:`, exerciseData.name);
      }

      const workoutExercise = {
        id: `ai_workout_${Date.now()}_${index}`,
        name: exerciseData.name,
        sets: Array.from({ length: ex.sets || 3 }, () => ({
          weight: ex.weight || 0,
          reps: ex.reps || 8,
          rpe: 8,
          isWarmup: false,
          isExecuted: false
        })),
        muscleGroups: exerciseData.primaryMuscles,
        equipment: exerciseData.equipment || 'Mixed',
        primaryMuscles: exerciseData.primaryMuscles,
        secondaryMuscles: exerciseData.secondaryMuscles || []
      };

      console.log(`✅ WorkoutTool: Created workout exercise ${index + 1}:`, JSON.stringify(workoutExercise, null, 2));
      return workoutExercise;
    });

    console.log('🏋️ WorkoutTool: All exercises processed. Total:', workoutExercises.length);

    const workoutId = `ai_workout_${Date.now()}`;
    console.log('🆔 WorkoutTool: Generated workout ID:', workoutId);

    const result = {
      success: true,
      workoutId,
      exercises: workoutExercises
    };

    console.log('🎯 WorkoutTool: Final result:', JSON.stringify(result, null, 2));
    console.log('🏋️ WorkoutTool: ===== CREATE_WORKOUT COMPLETE =====');

    return result;
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
  console.log('🔧 AITool: ===== EXECUTING AI TOOL =====');
  console.log('🔧 AITool: Tool name:', toolName);
  console.log('🔧 AITool: Parameters:', JSON.stringify(parameters, null, 2));

  try {
    let result: any;

    switch (toolName) {
      case 'create_workout':
        console.log('🏋️ AITool: Executing create_workout...');
        result = await AIWorkoutToolExecutor.executeCreateWorkout(parameters);
        break;
      case 'search_exercises':
        console.log('🔍 AITool: Executing search_exercises...');
        result = await AIWorkoutToolExecutor.executeSearchExercises(parameters);
        break;
      case 'get_exercise_info':
        console.log('ℹ️ AITool: Executing get_exercise_info...');
        result = await AIWorkoutToolExecutor.executeGetExerciseInfo(parameters);
        break;
      case 'suggest_workout_plan':
        console.log('💡 AITool: Executing suggest_workout_plan...');
        result = await AIWorkoutToolExecutor.executeSuggestWorkoutPlan(parameters);
        break;
      case 'start_workout':
        console.log('▶️ AITool: Executing start_workout...');
        result = await AIWorkoutToolExecutor.executeStartWorkout(parameters);
        break;
      default:
        console.error('❌ AITool: Unknown tool:', toolName);
        throw new Error(`Unknown tool: ${toolName}`);
    }

    console.log('✅ AITool: Tool execution successful');
    console.log('✅ AITool: Result:', JSON.stringify(result, null, 2));
    console.log('🔧 AITool: ===== TOOL EXECUTION COMPLETE =====');

    return result;
  } catch (error) {
    console.error('❌ AITool: Tool execution failed:', error);
    console.error('❌ AITool: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('🔧 AITool: ===== TOOL EXECUTION FAILED =====');
    throw error;
  }
}
