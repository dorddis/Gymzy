import { DynamicTool } from 'langchain/tools';
// Attempting to use Zod for schema definition as is common in LangChain.js
// If 'zod' is not available, these schemas will guide the DynamicTool's description.
import { z } from 'zod';
import { EnhancedWorkoutTools, ToolExecutionContext } from '../services/enhanced-workout-tools'; // Assuming ToolExecutionContext is exported

// Instantiate EnhancedWorkoutTools
const enhancedWorkoutTools = new EnhancedWorkoutTools();

// Mock context for tool execution - this will need proper handling during agent integration
const mockContext: ToolExecutionContext = {
  userId: "langchain-user-simulated",
  // userProfile might be needed by some tools, initialize if necessary based on EnhancedWorkoutTools
  // For now, assuming it's optional or handled gracefully by the tools if not present
  userProfile: {
    // Example properties - actual properties depend on UserProfile definition
    // preferences: { workoutComplexity: 'intermediate' },
    // availableEquipment: ['dumbbells', 'bench']
  },
  // conversationContext and previousResults might also be part of ToolExecutionContext
  // For now, keeping it minimal
  conversationContext: "User is interacting via LangChain agent.",
  previousResults: []
};

// --- 1. Create Workout Tool ---

const CreateWorkoutArgsSchema = z.object({
  workoutName: z.string().optional().describe("A custom name for the workout (e.g., 'Morning Blast', 'Leg Day Power')."),
  workoutType: z.string().optional().describe("Type of workout, e.g., 'strength', 'cardio', 'HIIT', 'flexibility', 'custom'."),
  targetMuscleGroups: z.array(z.string()).optional().describe("Specific muscle groups to target, e.g., ['chest', 'triceps', 'core']."),
  exercises: z.array(
    z.object({
      name: z.string().describe("Name of the exercise."),
      sets: z.number().optional().describe("Number of sets."),
      reps: z.union([z.string(), z.number()]).optional().describe("Number of repetitions (e.g., 10 or 'AMRAP')."),
      weight: z.number().optional().describe("Weight to be used, in preferred units (e.g., kg or lbs)."),
      duration: z.string().optional().describe("Duration for timed exercises (e.g., '30 seconds', '5 minutes').")
    })
  ).optional().describe("A list of specific exercises to include. If provided, the tool will try to match them. If omitted, exercises will be generated based on other parameters."),
  durationMinutes: z.number().optional().describe("Desired total duration of the workout in minutes."),
  difficulty: z.string().optional().describe("Preferred difficulty level, e.g., 'beginner', 'intermediate', 'advanced'."),
  notes: z.string().optional().describe("Any additional notes or specific requests for the workout plan.")
});

export const createWorkoutLangchainTool = new DynamicTool({
  name: "create_workout_plan",
  description: `Creates a personalized workout plan.
Use this when a user explicitly asks to generate, build, or design a workout or routine.
You can specify parameters like workout name, type (e.g., strength, cardio), target muscle groups, a list of specific exercises (which will be intelligently matched or substituted if necessary), total duration, and difficulty.
If specific exercises are NOT provided, the tool will generate suitable exercises based on the workout type, muscle groups, duration, and difficulty.
The tool returns a summary of the created workout, including its name, the exercises included, and details about any exercises that couldn't be matched or were substituted.`,
  func: async (args) => {
    // Type assertion for args if not using Zod directly in DynamicTool's args typing
    const validatedArgs = CreateWorkoutArgsSchema.parse(args);
    const originalTool = enhancedWorkoutTools.getToolDefinitions().find(t => t.name === 'create_workout');
    if (!originalTool || !originalTool.execute) {
      return "Error: The underlying 'create_workout' tool is not available.";
    }

    // Map LangChain args to EnhancedWorkoutTools params
    const toolParams = {
      name: validatedArgs.workoutName,
      type: validatedArgs.workoutType,
      targetMuscleGroups: validatedArgs.targetMuscleGroups,
      exercises: validatedArgs.exercises, // This structure should be compatible
      duration: validatedArgs.durationMinutes ? `${validatedArgs.durationMinutes} minutes` : undefined,
      difficulty: validatedArgs.difficulty,
      notes: validatedArgs.notes,
    };

    try {
      const result = await originalTool.execute(toolParams, mockContext);
      if (result.success && result.workout) {
        const workout = result.workout;
        let summary = `Workout "${workout.name || workout.title}" created successfully with ${workout.exercises?.length || 0} exercises.`;
        if (workout.metadata?.unmatchedExercises && workout.metadata.unmatchedExercises.length > 0) {
          summary += ` Could not find matches for: ${workout.metadata.unmatchedExercises.join(', ')}.`;
        }
        if (workout.metadata?.matchingResults) {
            const substitutions = workout.metadata.matchingResults.filter((r: any) => r.type === 'fallback' || r.original?.toLowerCase() !== r.matched?.toLowerCase());
            if (substitutions.length > 0) {
                summary += ` Some exercises were substituted: ${substitutions.map((s:any) => `${s.original} became ${s.matched}`).join('; ')}.`;
            }
        }
        if (result.isFallback) {
            summary += " A fallback workout was generated due to issues with the original request.";
        }
        return summary;
      } else if (result.message) {
        return `Could not create workout: ${result.message}`;
      }
      return "Failed to create workout for an unknown reason.";
    } catch (error: any) {
      console.error("Error executing create_workout_plan:", error);
      return `Error: ${error.message || "An unexpected error occurred while creating the workout."}`;
    }
  },
  // argsSchema: CreateWorkoutArgsSchema, // For Tool, not DynamicTool typically
});


// --- 2. Search Exercises Tool ---

const SearchExercisesArgsSchema = z.object({
  query: z.string().describe("The name, part of the name, or a description of the exercise to search for."),
  muscleGroups: z.array(z.string()).optional().describe("Filter by specific muscle groups, e.g., ['biceps', 'quadriceps']."),
  equipment: z.array(z.string()).optional().describe("Filter by available equipment, e.g., ['dumbbell', 'barbell', 'bodyweight only']."),
  difficulty: z.string().optional().describe("Filter by difficulty level, e.g., 'beginner', 'intermediate', 'advanced'."),
  limit: z.number().optional().describe("Maximum number of exercise results to return (e.g., 5 or 10).")
});

export const searchExercisesLangchainTool = new DynamicTool({
  name: "search_fitness_exercises",
  description: `Searches for specific fitness exercises based on a query.
You can filter by muscle groups, required equipment, and difficulty level.
It returns a list of matching exercises with their details. Use this when the user wants to find exercises, get information about an exercise, or explore exercise options.`,
  func: async (args) => {
    const validatedArgs = SearchExercisesArgsSchema.parse(args);
    const originalTool = enhancedWorkoutTools.getToolDefinitions().find(t => t.name === 'search_exercises');
    if (!originalTool || !originalTool.execute) {
      return "Error: The underlying 'search_exercises' tool is not available.";
    }

    try {
      const result = await originalTool.execute(validatedArgs, mockContext);
      if (result.success !== false && result.results) { // Check for success !== false because it might be undefined for this tool
        if (result.results.length === 0) {
          return `No exercises found matching your query: "${validatedArgs.query}".`;
        }
        const topResults = result.results.slice(0, validatedArgs.limit || 5).map((ex: any) => ex.name).join(', ');
        return `Found ${result.results.length} exercises matching "${validatedArgs.query}". Top results: ${topResults}. Details for each include name, muscles, equipment, and difficulty.`;
      }
      return `Could not perform exercise search for an unknown reason. Query: ${validatedArgs.query}`;
    } catch (error: any) {
      console.error("Error executing search_fitness_exercises:", error);
      return `Error: ${error.message || "An unexpected error occurred during exercise search."}`;
    }
  },
});

// --- 3. Save Workout Tool ---

const SaveWorkoutArgsSchema = z.object({
  workoutName: z.string().optional().describe("A name for the workout, e.g., 'Morning Run', 'Heavy Leg Day'. If not provided, a name might be generated or prompted."),
  exercises: z.array(
    z.object({
      exerciseId: z.string().optional().describe("The unique ID of the exercise, if known (e.g., from a previous search or creation)."),
      name: z.string().describe("The name of the exercise."),
      sets: z.number().describe("Number of sets performed or planned."),
      reps: z.union([z.string(), z.number()]).describe("Number of repetitions per set (e.g., 10, 'AMRAP', 'to failure')."),
      weight: z.number().optional().describe("Weight used for the exercise, if applicable."),
      notes: z.string().optional().describe("Any specific notes for this exercise performance (e.g., 'felt good', 'increase weight next time').")
    })
  ).describe("A list of exercises included in the workout. Each exercise must have at least a name, sets, and reps."),
  sourceWorkoutId: z.string().optional().describe("If this workout is based on or a completed version of an existing workout plan, provide its ID."),
  date: z.string().optional().describe("The date the workout was performed or is planned for, in ISO 8601 format (e.g., 'YYYY-MM-DD'). Defaults to today if not specified."),
  notes: z.string().optional().describe("Overall notes for the entire workout session (e.g., 'Felt strong today!', 'Focused on form')."),
  photoUrl: z.string().optional().describe("A URL to a photo associated with the workout (e.g., a post-workout selfie).")
});

export const saveWorkoutLangchainTool = new DynamicTool({
  name: "save_user_workout",
  description: `Saves a new or completed workout plan.
Use this when the user explicitly states they want to save, log, or record a workout they have defined, are currently doing, or have just completed.
Requires a list of exercises with at least name, sets, and reps for each. A workout name can also be provided.`,
  func: async (args) => {
    const validatedArgs = SaveWorkoutArgsSchema.parse(args);
    const originalTool = enhancedWorkoutTools.getToolDefinitions().find(t => t.name === 'save_workout');

    if (!originalTool || !originalTool.execute) {
      return "Error: The underlying 'save_workout' tool is not available.";
    }

    if (!validatedArgs.exercises || validatedArgs.exercises.length === 0) {
        return "To save a workout, please provide the exercises, including their names, sets, and reps.";
    }

    try {
      const result = await originalTool.execute(validatedArgs, mockContext);
      if (result.success && result.savedWorkoutId) {
        return `Workout "${result.workout?.name || validatedArgs.workoutName || 'Unnamed Workout'}" saved successfully with ID ${result.savedWorkoutId}.`;
      } else if (result.message) {
        return `Failed to save workout: ${result.message}`;
      }
      return "Failed to save workout for an unknown reason.";
    } catch (error: any) {
      console.error("Error executing save_user_workout:", error);
      return `Error: ${error.message || "An unexpected error occurred while saving the workout."}`;
    }
  },
});

// Export all tools
export const allLangchainTools = [
  createWorkoutLangchainTool,
  searchExercisesLangchainTool,
  saveWorkoutLangchainTool,
];

console.log('LangChain tools defined and ready.');
// Example of how to potentially check tool definitions (for dev purposes)
// allLangchainTools.forEach(tool => {
//   console.log(`Tool: ${tool.name}, Description: ${tool.description}`);
// });
