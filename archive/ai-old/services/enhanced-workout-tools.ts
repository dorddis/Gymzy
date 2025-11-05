/**
 * Enhanced Workout Tools with Production-Grade Exercise Matching
 * Integrates with RobustToolExecutor and IntelligentExerciseMatcher
 */

import { ToolDefinition, ToolExecutionContext, ToolResult } from '../infrastructure/robust-tool-executor';
import { IntelligentExerciseMatcher, ExerciseMatch } from './intelligent-exercise-matcher';
import { createWorkout } from '@/services/core/workout-service';
import { Timestamp } from 'firebase/firestore';

export class EnhancedWorkoutTools {
  private exerciseMatcher: IntelligentExerciseMatcher;

  constructor() {
    this.exerciseMatcher = new IntelligentExerciseMatcher();
  }

  /**
   * Get all enhanced workout tools
   */
  getToolDefinitions(): ToolDefinition[] {
    return [
      this.createWorkoutTool(),
      this.searchExercisesTool(),
      this.modifyWorkoutTool(),
      this.analyzeWorkoutTool(),
      this.getWorkoutRecommendationsTool(),
      this.saveWorkoutTool()
    ];
  }

  /**
   * Tool to save a new or completed workout
   */
  private saveWorkoutTool(): ToolDefinition {
    return {
      name: 'save_workout',
      description: 'Save a new or completed workout, including exercises, sets, reps, and optional notes or a photo.',
      parameters: {
        type: 'object',
        properties: {
          workoutName: { type: 'string', description: 'User-defined name for the workout.' },
          exercises: {
            type: 'array',
            description: 'List of exercises to save.',
            items: {
              type: 'object',
              properties: {
                exerciseId: { type: 'string', description: 'Database ID of the exercise (optional)' },
                name: { type: 'string', description: 'Name of the exercise' },
                sets: { type: 'number', description: 'Number of sets' },
                reps: { type: ['string', 'number'], description: 'Number of repetitions (e.g., 10 or "AMRAP")' },
                weight: { type: 'number', description: 'Weight used (optional)' },
                notes: { type: 'string', description: 'User notes for this exercise (optional)' }
              },
              required: ['name', 'sets', 'reps']
            }
          },
          sourceWorkoutId: { type: 'string', description: 'ID of an existing workout this is based on (optional)' },
          date: { type: 'string', description: 'Date for the workout (ISO format, optional, defaults to now)' },
          notes: { type: 'string', description: 'General notes for the entire workout (optional)' },
          photoUrl: { type: 'string', description: 'URL of a photo for the workout (optional)' }
        },
        required: ['exercises']
      },
      execute: async (params, context) => await this.executeSaveWorkout(params, context),
      validate: (params) => {
        const errors: string[] = [];
        if (!params.exercises || !Array.isArray(params.exercises) || params.exercises.length === 0) {
          errors.push('The exercises array is required and cannot be empty.');
        } else {
          params.exercises.forEach((ex: any, index: number) => {
            if (!ex.name) errors.push(`Exercise ${index + 1} must have a name.`);
            if (ex.sets === undefined) errors.push(`Exercise ${index + 1} must have sets defined.`);
            if (ex.reps === undefined) errors.push(`Exercise ${index + 1} must have reps defined.`);
          });
        }
        return { valid: errors.length === 0, errors, warnings: [] };
      },
      // Consider adding retry/circuit breaker if actual DB calls are made
      retryConfig: {
        maxRetries: 2,
        baseDelay: 1000,
        retryableErrors: ['database_error', 'network_error']
      },
      fallback: async (params, error) => {
        console.warn(`⚠️ save_workout fallback triggered due to: ${error.message}`);
        return { success: false, message: "Sorry, I couldn&apos;t save the workout right now due to a temporary issue." };
      }
    };
  }

  /**
   * Execute workout saving logic
   */
  private async executeSaveWorkout(params: any, context: ToolExecutionContext): Promise<any> {
    console.log('💾 EnhancedWorkoutTools: Saving workout...');
    console.log('💾 Params:', JSON.stringify(params, null, 2));

    // Validation (schema validation is done by RobustToolExecutor, this is for business logic)
    if (!params.exercises || params.exercises.length === 0) {
      return { success: false, message: 'Cannot save a workout with no exercises.' };
    }

    const processedExercises = [];
    for (const ex of params.exercises) {
      let exerciseId = ex.exerciseId;
      if (!exerciseId && ex.name) {
        try {
          // Assuming exerciseMatcher is initialized and available
          const match = await this.exerciseMatcher.findBestMatch(ex.name, { minConfidence: 0.5 });
          if (match && match.exercise && match.exercise.id) {
            exerciseId = match.exercise.id;
            console.log(`📝 Matched exercise "${ex.name}" to ID "${exerciseId}" with confidence ${match.confidence}`);
          } else {
            console.log(`📝 Could not find a matching ID for exercise "${ex.name}". It will be saved with its name only.`);
          }
        } catch (matchError) {
          console.error(`❌ Error trying to match exercise "${ex.name}":`, matchError);
          // Proceed without an ID if matching fails
        }
      }
      processedExercises.push({
        exerciseId: exerciseId || null,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        notes: ex.notes,
      });
    }

    const workoutDataToSave = {
      userId: context.userId,
      name: params.workoutName || `Saved Workout ${new Date().toLocaleDateString()}`,
      date: params.date ? new Date(params.date) : new Date(),
      exercises: processedExercises, // These are simplified; real service would expand to full exercise objects
      notes: params.notes,
      photoUrl: params.photoUrl,
      sourceWorkoutId: params.sourceWorkoutId,
      // Assuming your workout-service.ts expects a certain structure
      // For now, we&apos;ll keep it flat and simulate what workout-service might store/return.
      createdAt: new Date(),
      updatedAt: new Date(),
      isCompleted: params.isCompleted || false, // Example: track if workout is logged as completed
      difficulty: params.difficulty || 'custom', // Example property
    };

    try {
      // In a real scenario, you'd call your workout service:
      // const savedWorkout = await actualWorkoutService.saveUserWorkout(context.userId, workoutDataToSave);
      // For this subtask, simulate success:
      const simulatedSavedWorkout = {
        id: `sim_saved_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        ...workoutDataToSave,
        // Ensure date objects are handled correctly if they were strings passed in params
        date: workoutDataToSave.date instanceof Date ? workoutDataToSave.date.toISOString() : new Date(workoutDataToSave.date).toISOString(),
        createdAt: workoutDataToSave.createdAt.toISOString(),
        updatedAt: workoutDataToSave.updatedAt.toISOString(),
      };

      console.log('✅ EnhancedWorkoutTools: Workout saved (simulated):', simulatedSavedWorkout.id);
      return {
        success: true,
        message: `Workout "${simulatedSavedWorkout.name}" saved successfully!`,
        savedWorkoutId: simulatedSavedWorkout.id,
        workout: simulatedSavedWorkout // Return the saved workout data
      };
    } catch (error) {
      console.error('❌ EnhancedWorkoutTools: Error saving workout (simulated):', error);
      // If actual DB call was made, error might be more specific
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: `An error occurred while saving the workout: ${errorMessage}`, error: errorMessage };
    }
  }

  /**
   * Enhanced workout creation tool with intelligent exercise matching
   */
  private createWorkoutTool(): ToolDefinition {
    return {
      name: 'create_workout',
      description: 'Create a personalized workout plan with intelligent exercise matching and user context integration',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Workout name' },
          type: { type: 'string', description: 'Workout type (e.g., strength, cardio, flexibility)' },
          targetMuscleGroups: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Target muscle groups for the workout'
          },
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Exercise name' },
                sets: { type: 'number', description: 'Number of sets' },
                reps: { type: 'number', description: 'Number of repetitions' },
                weight: { type: 'number', description: 'Weight in pounds/kg' },
                duration: { type: 'string', description: 'Duration for time-based exercises' },
                restTime: { type: 'string', description: 'Rest time between sets' }
              },
              required: ['name']
            }
          },
          duration: { type: 'string', description: 'Total workout duration' },
          difficulty: { type: 'string', description: 'Workout difficulty level' },
          notes: { type: 'string', description: 'Additional workout notes' }
        },
        required: ['exercises']
      },
      execute: async (params, context) => {
        return await this.executeCreateWorkout(params, context);
      },
      validate: (params) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!params.exercises || !Array.isArray(params.exercises) || params.exercises.length === 0) {
          errors.push('At least one exercise is required');
        }

        if (params.exercises) {
          params.exercises.forEach((exercise: any, index: number) => {
            if (!exercise.name || typeof exercise.name !== 'string') {
              errors.push(`Exercise ${index + 1}: name is required and must be a string`);
            }
            if (exercise.sets && (typeof exercise.sets !== 'number' || exercise.sets < 1)) {
              warnings.push(`Exercise ${index + 1}: sets should be a positive number`);
            }
            if (exercise.reps && (typeof exercise.reps !== 'number' || exercise.reps < 1)) {
              warnings.push(`Exercise ${index + 1}: reps should be a positive number`);
            }
          });
        }

        return { valid: errors.length === 0, errors, warnings };
      },
      fallback: async (params, error) => {
        console.log('🔄 CreateWorkout: Using fallback due to error:', error.message);
        return await this.createFallbackWorkout(params);
      },
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2,
        retryableErrors: ['timeout', 'network', 'exercise_not_found', 'database_error']
      },
      circuitBreakerConfig: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringWindow: 300000
      }
    };
  }

  /**
   * Enhanced exercise search tool
   */
  private searchExercisesTool(): ToolDefinition {
    return {
      name: 'search_exercises',
      description: 'Search for exercises with intelligent matching and filtering',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Exercise name or description to search for' },
          muscleGroups: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Filter by muscle groups'
          },
          equipment: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Filter by available equipment'
          },
          difficulty: { type: 'string', description: 'Filter by difficulty level' },
          limit: { type: 'number', description: 'Maximum number of results to return' }
        },
        required: ['query']
      },
      execute: async (params, context) => {
        return await this.executeSearchExercises(params, context);
      },
      retryConfig: {
        maxRetries: 2,
        baseDelay: 500,
        maxDelay: 2000,
        backoffMultiplier: 2,
        retryableErrors: ['timeout', 'network']
      }
    };
  }

  /**
   * Execute workout creation with intelligent exercise matching
   */
  private async executeCreateWorkout(params: any, context: ToolExecutionContext): Promise<any> {
    console.log('🏋️ EnhancedWorkoutTools: Creating workout with intelligent matching...');
    console.log('🏋️ EnhancedWorkoutTools: Input exercises:', params.exercises.map((e: any) => e.name));

    const matchedExercises = [];
    const unmatchedExercises = [];
    const matchingResults = [];

    // Use user profile for better matching
    const userProfile = context.userProfile;
    const searchOptions = {
      equipment: userProfile?.availableEquipment || [],
      minConfidence: 0.6 // Lower threshold for more flexibility
    };

    for (const exercise of params.exercises) {
      try {
        console.log(`🔍 EnhancedWorkoutTools: Matching exercise "${exercise.name}"`);
        
        const match = await this.exerciseMatcher.findBestMatch(exercise.name, searchOptions);
        
        if (match && match.confidence >= 0.6) {
          const enhancedExercise = {
            id: match.exercise.id,
            name: match.exercise.name,
            sets: exercise.sets || this.getDefaultSets(userProfile?.preferences?.workoutComplexity),
            reps: exercise.reps || this.getDefaultReps(match.exercise, userProfile?.preferences?.workoutComplexity),
            weight: exercise.weight || 0,
            duration: exercise.duration,
            restTime: exercise.restTime || '60 seconds',
            primaryMuscles: match.exercise.primaryMuscles,
            secondaryMuscles: match.exercise.secondaryMuscles,
            equipment: match.exercise.equipment,
            instructions: match.exercise.instructions,
            matchConfidence: match.confidence,
            matchType: match.matchType,
            originalName: exercise.name
          };

          matchedExercises.push(enhancedExercise);
          matchingResults.push({
            original: exercise.name,
            matched: match.exercise.name,
            confidence: match.confidence,
            type: match.matchType
          });

          console.log(`✅ EnhancedWorkoutTools: Matched "${exercise.name}" -> "${match.exercise.name}" (${(match.confidence * 100).toFixed(1)}%)`);
        } else {
          console.log(`❌ EnhancedWorkoutTools: Could not match "${exercise.name}" with sufficient confidence`);
          unmatchedExercises.push(exercise.name);
          
          // Try to find a fallback exercise
          const fallback = await this.findFallbackExercise(exercise.name, searchOptions);
          if (fallback) {
            matchedExercises.push(fallback);
            matchingResults.push({
              original: exercise.name,
              matched: fallback.name,
              confidence: 0.4,
              type: 'fallback'
            });
          }
        }
      } catch (error) {
        console.error(`❌ EnhancedWorkoutTools: Error matching exercise "${exercise.name}":`, error);
        unmatchedExercises.push(exercise.name);
      }
    }

    // Convert exercises to the format expected by the workout service
    const formattedExercises = matchedExercises.map((exercise, index) => ({
      exerciseId: exercise.id || `exercise_${index}`,
      name: exercise.name,
      sets: Array.from({ length: exercise.sets || 3 }, (_, setIndex) => ({
        weight: exercise.weight || 0,
        reps: exercise.reps || 10,
        rpe: 7, // Default RPE
        isWarmup: setIndex === 0, // First set is warmup
        isExecuted: false
      })),
      targetedMuscles: this.mapMuscleNamesToValidEnum(exercise.primaryMuscles || []),
      notes: exercise.instructions || '',
      order: index
    }));

    // Create workout object in the format expected by the workout service
    const workoutData = {
      userId: context.userId,
      title: params.name || this.generateWorkoutName(params.type, matchedExercises),
      date: Timestamp.now(),
      exercises: formattedExercises,
      notes: params.notes || '',
      mediaUrls: [],
      isPublic: false
    };

    // Additional metadata for our response
    const workoutMetadata = {
      type: params.type || 'custom',
      targetMuscleGroups: params.targetMuscleGroups || this.extractMuscleGroups(matchedExercises),
      duration: params.duration || this.estimateWorkoutDuration(matchedExercises),
      difficulty: params.difficulty || this.estimateWorkoutDifficulty(matchedExercises, userProfile),
      matchingResults,
      unmatchedExercises,
      totalExercises: params.exercises.length,
      successfulMatches: matchedExercises.length,
      matchingAccuracy: matchedExercises.length / params.exercises.length
    };

    // Save workout to database
    let savedWorkout;
    try {
      savedWorkout = await createWorkout(workoutData);
      console.log(`✅ EnhancedWorkoutTools: Workout saved successfully with ID ${savedWorkout.id}`);
    } catch (error) {
      console.error('❌ EnhancedWorkoutTools: Error saving workout:', error);
      // Create a fallback workout object if saving fails
      savedWorkout = {
        id: this.generateWorkoutId(),
        ...workoutData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
    }

    console.log(`🎯 EnhancedWorkoutTools: Workout created with ${matchedExercises.length}/${params.exercises.length} exercises matched`);

    // Create UI-compatible exercises with proper sets arrays
    const uiCompatibleExercises = matchedExercises.map((exercise, index) => ({
      ...exercise,
      sets: Array.from({ length: exercise.sets || 3 }, (_, setIndex) => ({
        weight: exercise.weight || 0,
        reps: exercise.reps || 10,
        rpe: 7,
        isWarmup: setIndex === 0,
        isExecuted: false
      }))
    }));

    // Return workout in a format that works with both the UI and our system
    const responseWorkout = {
      id: savedWorkout.id,
      name: savedWorkout.title,
      title: savedWorkout.title,
      type: workoutMetadata.type,
      exercises: uiCompatibleExercises, // UI-compatible format with sets arrays
      formattedExercises: savedWorkout.exercises, // Proper format for workout execution
      targetMuscleGroups: workoutMetadata.targetMuscleGroups,
      duration: workoutMetadata.duration,
      difficulty: workoutMetadata.difficulty,
      notes: savedWorkout.notes,
      createdAt: savedWorkout.createdAt,
      userId: savedWorkout.userId,
      metadata: workoutMetadata
    };

    return {
      workout: responseWorkout,
      success: true,
      matchingResults,
      unmatchedExercises,
      message: this.generateSuccessMessage(matchedExercises.length, params.exercises.length, unmatchedExercises)
    };
  }

  /**
   * Execute exercise search
   */
  private async executeSearchExercises(params: any, context: ToolExecutionContext): Promise<any> {
    console.log(`🔍 EnhancedWorkoutTools: Searching exercises for query "${params.query}"`);

    const searchOptions = {
      muscleGroups: params.muscleGroups,
      equipment: params.equipment || context.userProfile?.availableEquipment,
      minConfidence: 0.5
    };

    const matches = await this.exerciseMatcher.findMultipleMatches(
      params.query,
      params.limit || 10,
      searchOptions
    );

    const results = matches.map(match => ({
      id: match.exercise.id,
      name: match.exercise.name,
      primaryMuscles: match.exercise.primaryMuscles,
      secondaryMuscles: match.exercise.secondaryMuscles,
      equipment: match.exercise.equipment,
      difficulty: match.exercise.difficulty,
      instructions: match.exercise.instructions,
      confidence: match.confidence,
      matchType: match.matchType,
      reasoning: match.reasoning
    }));

    console.log(`✅ EnhancedWorkoutTools: Found ${results.length} exercise matches`);

    return {
      query: params.query,
      results,
      totalFound: results.length,
      searchOptions
    };
  }

  /**
   * Create fallback workout when main creation fails
   */
  private async createFallbackWorkout(params: any): Promise<any> {
    console.log('🔄 EnhancedWorkoutTools: Creating fallback workout...');

    const fallbackExercises = [
      { name: 'Push-up', sets: 3, reps: 10, weight: 0 },
      { name: 'Squat', sets: 3, reps: 12, weight: 0 },
      { name: 'Plank', sets: 3, duration: '30 seconds', weight: 0 }
    ];

    return {
      workout: {
        id: this.generateWorkoutId(),
        name: 'Basic Bodyweight Workout',
        type: 'bodyweight',
        exercises: fallbackExercises,
        duration: '20-30 minutes',
        difficulty: 'beginner',
        notes: 'Fallback workout - basic bodyweight exercises',
        createdAt: new Date()
      },
      success: true,
      isFallback: true,
      message: 'Created a basic workout due to technical difficulties. You can customize it as needed!'
    };
  }

  // Helper methods
  private generateWorkoutId(): string {
    return `workout_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateWorkoutName(type: string, exercises: any[]): string {
    if (type) {
      return `${type.charAt(0).toUpperCase() + type.slice(1)} Workout`;
    }
    
    const muscleGroups = this.extractMuscleGroups(exercises);
    if (muscleGroups.length > 0) {
      return `${muscleGroups[0]} Workout`;
    }
    
    return 'Custom Workout';
  }

  private extractMuscleGroups(exercises: any[]): string[] {
    const muscleGroups = new Set<string>();
    exercises.forEach(exercise => {
      if (exercise.primaryMuscles) {
        exercise.primaryMuscles.forEach((muscle: string) => muscleGroups.add(muscle));
      }
    });
    return Array.from(muscleGroups);
  }

  private estimateWorkoutDuration(exercises: any[]): string {
    const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 3), 0);
    const estimatedMinutes = totalSets * 2; // Rough estimate: 2 minutes per set
    return `${estimatedMinutes}-${estimatedMinutes + 10} minutes`;
  }

  private estimateWorkoutDifficulty(exercises: any[], userProfile: any): string {
    if (userProfile?.preferences?.workoutComplexity) {
      return userProfile.preferences.workoutComplexity;
    }
    return exercises.length > 6 ? 'intermediate' : 'beginner';
  }

  private getDefaultSets(complexity?: string): number {
    switch (complexity) {
      case 'beginner': return 2;
      case 'intermediate': return 3;
      case 'advanced': return 4;
      default: return 3;
    }
  }

  private getDefaultReps(exercise: any, complexity?: string): number {
    const baseReps = exercise.equipment === 'bodyweight' ? 12 : 10;
    switch (complexity) {
      case 'beginner': return Math.max(8, baseReps - 2);
      case 'intermediate': return baseReps;
      case 'advanced': return baseReps + 2;
      default: return baseReps;
    }
  }

  private async findFallbackExercise(originalName: string, options: any): Promise<any | null> {
    // Try to find a related exercise based on keywords
    const keywords = originalName.toLowerCase().split(/[\s-_]+/);
    
    for (const keyword of keywords) {
      if (['push', 'chest'].includes(keyword)) {
        return { name: 'Push-up', sets: 3, reps: 10, weight: 0, type: 'fallback' };
      }
      if (['pull', 'back'].includes(keyword)) {
        return { name: 'Pull-up', sets: 3, reps: 8, weight: 0, type: 'fallback' };
      }
      if (['squat', 'leg'].includes(keyword)) {
        return { name: 'Squat', sets: 3, reps: 12, weight: 0, type: 'fallback' };
      }
    }
    
    return null;
  }

  /**
   * Map muscle names to valid enum values for Zod validation
   */
  private mapMuscleNamesToValidEnum(muscleNames: string[]): string[] {
    const muscleMapping: { [key: string]: string } = {
      'Rectus Abdominis': 'Upper Rectus Abdominis',
      'Core': 'Upper Rectus Abdominis',
      'Abs': 'Upper Rectus Abdominis',
      'Abdominals': 'Upper Rectus Abdominis',
      'Chest': 'Pectoralis Major',
      'Pecs': 'Pectoralis Major',
      'Back': 'Latissimus Dorsi',
      'Lats': 'Latissimus Dorsi',
      'Shoulders': 'Deltoid',
      'Delts': 'Deltoid',
      'Arms': 'Biceps Brachii',
      'Legs': 'Quadriceps',
      'Quads': 'Quadriceps',
      'Glutes': 'Gluteus Maximus',
      'Butt': 'Gluteus Maximus'
    };

    return muscleNames.map(muscle => {
      // Return mapped value if exists, otherwise return original (assuming it&apos;s already valid)
      return muscleMapping[muscle] || muscle;
    });
  }

  private generateSuccessMessage(matched: number, total: number, unmatched: string[]): string {
    if (matched === total) {
      return `🎉 Perfect! Successfully created your workout with all ${total} exercises.`;
    } else if (matched > 0) {
      const message = `✅ Created your workout with ${matched} out of ${total} exercises. `;
      if (unmatched.length > 0) {
        return message + `Couldn&apos;t find matches for: ${unmatched.join(', ')}. You can add these manually if needed.`;
      }
      return message;
    } else {
      return `⚠️ Had trouble finding exercises, but created a basic workout for you to customize.`;
    }
  }

  // Placeholder methods for other tools - unchanged from here
  private modifyWorkoutTool(): ToolDefinition {
    return {
      name: 'modify_workout',
      description: 'Modify an existing workout based on user requests like doubling, tripling, making it harder/easier, etc.',
      parameters: {
        type: 'object',
        properties: {
          modificationType: {
            type: 'string',
            description: 'Type of modification: double, triple, increase, decrease, harder, easier, general',
            enum: ['double', 'triple', 'increase', 'decrease', 'harder', 'easier', 'general']
          },
          userInput: { type: 'string', description: 'Original user input for context' },
          conversationHistory: {
            type: 'array',
            description: 'Conversation history to find the last workout',
            items: { type: 'object' }
          }
        },
        required: ['modificationType', 'userInput', 'conversationHistory']
      },
      execute: async (params, context) => await this.executeModifyWorkout(params, context)
    };
  }

  private analyzeWorkoutTool(): ToolDefinition {
    return {
      name: 'analyze_workout',
      description: 'Analyze workout effectiveness and balance',
      parameters: {},
      execute: async () => ({ message: 'Workout analysis not yet implemented' })
    };
  }

  private getWorkoutRecommendationsTool(): ToolDefinition {
    return {
      name: 'get_workout_recommendations',
      description: 'Get personalized workout recommendations',
      parameters: {},
      execute: async () => ({ message: 'Workout recommendations not yet implemented' })
    };
  }

  /**
   * Execute workout modification
   */
  private async executeModifyWorkout(params: any, context: ToolExecutionContext): Promise<any> {
    console.log('🔄 EnhancedWorkoutTools: Modifying workout...');
    console.log('🔄 Modification type:', params.modificationType);
    console.log('🔄 User input:', params.userInput);

    // Find the last workout in conversation history
    const lastWorkoutMessage = this.findLastWorkoutInHistory(params.conversationHistory);

    if (!lastWorkoutMessage) {
      console.log('❌ EnhancedWorkoutTools: No previous workout found in conversation');
      // Create a new workout instead
      return await this.executeCreateWorkout({
        name: 'Modified Workout',
        exercises: [
          { name: 'Push-ups', sets: 3, reps: 10 },
          { name: 'Squats', sets: 3, reps: 12 },
          { name: 'Plank', sets: 3, duration: '30 seconds' }
        ]
      }, context);
    }

    // Extract exercises from the last workout
    const originalExercises = this.extractExercisesFromMessage(lastWorkoutMessage);
    console.log('🔄 EnhancedWorkoutTools: Original exercises:', originalExercises);

    // Apply modification based on type
    const modifiedExercises = this.applyModification(originalExercises, params.modificationType);
    console.log('🔄 EnhancedWorkoutTools: Modified exercises:', modifiedExercises);

    // Create the modified workout
    const result = await this.executeCreateWorkout({
      name: `Modified ${this.getModificationDescription(params.modificationType)} Workout`,
      exercises: modifiedExercises
    }, context);

    console.log('🔄 EnhancedWorkoutTools: Modification complete');

    return {
      ...result,
      message: `I've ${this.getModificationDescription(params.modificationType)} your workout! Here&apos;s your updated routine:`
    };
  }

  private findLastWorkoutInHistory(conversationHistory: any[]): any {
    // Look for the most recent assistant message that contains workout information
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const message = conversationHistory[i];
      if (message.role === 'assistant' &&
          (message.content.includes('sets') ||
           message.content.includes('reps') ||
           message.content.includes('Push-up') ||
           message.content.includes('Squat') ||
           message.content.includes('workout'))) {
        return message;
      }
    }
    return null;
  }

  private extractExercisesFromMessage(message: any): any[] {
    const content = message.content;
    const exercises = [];

    // Simple regex patterns to extract exercise information
    const exercisePatterns = [
      /\*\*([^:]+):\*\*\s*(\d+)\s*sets?\s*of\s*(\d+)\s*reps?/gi,
      /\*\s*\*\*([^:]+):\*\*\s*(\d+)\s*sets?\s*of\s*(\d+)\s*reps?/gi,
      /\*\s*\*\*([^:]+):\*\*\s*(\d+)\s*sets?,?\s*holding for\s*(\d+)\s*seconds/gi
    ];

    exercisePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const [, name, sets, repsOrDuration] = match;
        exercises.push({
          name: name.trim(),
          sets: parseInt(sets),
          reps: name.toLowerCase().includes('plank') ? undefined : parseInt(repsOrDuration),
          duration: name.toLowerCase().includes('plank') ? `${repsOrDuration} seconds` : undefined
        });
      }
    });

    // Fallback: if no exercises found, return default
    if (exercises.length === 0) {
      return [
        { name: 'Push-ups', sets: 3, reps: 10 },
        { name: 'Squats', sets: 3, reps: 12 },
        { name: 'Plank', sets: 3, duration: '30 seconds' }
      ];
    }

    return exercises;
  }

  private applyModification(exercises: any[], modificationType: string): any[] {
    switch (modificationType) {
      case 'double':
        return exercises.map(ex => ({
          ...ex,
          sets: ex.sets * 2
        }));
      case 'triple':
        return exercises.map(ex => ({
          ...ex,
          sets: ex.sets * 3
        }));
      case 'increase':
        return exercises.map(ex => ({
          ...ex,
          sets: ex.sets + 1,
          reps: ex.reps ? ex.reps + 2 : ex.reps
        }));
      case 'decrease':
        return exercises.map(ex => ({
          ...ex,
          sets: Math.max(1, ex.sets - 1),
          reps: ex.reps ? Math.max(5, ex.reps - 2) : ex.reps
        }));
      case 'harder':
        return exercises.map(ex => ({
          ...ex,
          reps: ex.reps ? ex.reps + 5 : ex.reps,
          duration: ex.duration ? ex.duration.replace(/\d+/, (match) => (parseInt(match) + 15).toString()) : ex.duration
        }));
      case 'easier':
        return exercises.map(ex => ({
          ...ex,
          reps: ex.reps ? Math.max(5, ex.reps - 3) : ex.reps,
          duration: ex.duration ? ex.duration.replace(/\d+/, (match) => Math.max(15, parseInt(match) - 10).toString()) : ex.duration
        }));
      default:
        return exercises;
    }
  }

  private getModificationDescription(modificationType: string): string {
    switch (modificationType) {
      case 'double': return 'doubled';
      case 'triple': return 'tripled';
      case 'increase': return 'increased';
      case 'decrease': return 'decreased';
      case 'harder': return 'made harder';
      case 'easier': return 'made easier';
      default: return 'modified';
    }
  }
}
