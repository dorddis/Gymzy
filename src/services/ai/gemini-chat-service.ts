/**
 * Modern Gemini 2.5 Flash Chat Service
 *
 * Clean implementation following 2025 best practices:
 * - Native Gemini function calling (no routing layers)
 * - Proper conversation state management
 * - Streaming support
 * - Simple, maintainable architecture
 */

import { GoogleGenerativeAI, Content, FunctionDeclaration, Tool } from '@google/generative-ai';
import exercisesData from '@/lib/exercises.json';
import { getWorkouts } from '@/services/core/workout-service';
import { OnboardingContext } from '@/services/data/onboarding-context-service';
import { COMMUNICATION_STYLE_PROMPTS, COACHING_STYLE_PROMPTS } from '@/lib/ai-style-constants';

// ============================================================================
// Types
// ============================================================================

interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

const exercises = exercisesData as Exercise[];

export interface ChatMessage {
  role: 'user' | 'model' | 'function';
  content: string;
  functionCall?: {
    name: string;
    args: Record<string, any>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, any>;
  };
  timestamp: Date;
}

export interface ConversationState {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
  userContext?: OnboardingContext | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatResponse {
  message: string;
  functionCalls?: Array<{
    name: string;
    args: Record<string, any>;
    result?: any;
  }>;
  success: boolean;
  error?: string;
}

// ============================================================================
// Workout Tool Definitions (Gemini Function Calling Format)
// ============================================================================

const workoutTools: Tool = {
  functionDeclarations: [
    {
      name: 'generateWorkout',
      description: 'IMMEDIATELY generate a personalized workout plan when user requests a workout. CALL THIS FUNCTION as soon as you know the target muscles. Use intelligent defaults for any unspecified parameters.',
      parameters: {
        type: 'OBJECT',
        properties: {
          targetMuscles: {
            type: 'ARRAY',
            description: 'Target muscle groups. INFER from keywords: "leg/legs"=["quadriceps","hamstrings","glutes","calves"], "chest"=["chest","triceps"], "back"=["back","biceps"], "arms"=["biceps","triceps"], "shoulders"=["shoulders","traps"], "full body"=["legs","chest","back","shoulders","arms"]',
            items: { type: 'STRING' }
          },
          workoutType: {
            type: 'STRING',
            description: 'Type of workout. DEFAULT: "strength" if not specified',
            enum: ['strength', 'hypertrophy', 'endurance', 'powerlifting', 'bodyweight']
          },
          experience: {
            type: 'STRING',
            description: 'User fitness experience level. DEFAULT: "intermediate" if not specified',
            enum: ['beginner', 'intermediate', 'advanced']
          },
          duration: {
            type: 'NUMBER',
            description: 'Desired workout duration in minutes. DEFAULT: 45 if not specified'
          },
          equipment: {
            type: 'ARRAY',
            description: 'Available equipment. DEFAULT: ["gym equipment"] if not specified',
            items: { type: 'STRING' }
          }
        },
        required: ['targetMuscles']
      }
    } as FunctionDeclaration,
    {
      name: 'getExerciseInfo',
      description: 'IMMEDIATELY call this when user asks about a specific exercise (e.g. "tell me about bench press", "how to do squats", "what muscles does deadlift work"). Get detailed information about form, muscles worked, and variations.',
      parameters: {
        type: 'OBJECT',
        properties: {
          exerciseName: {
            type: 'STRING',
            description: 'Name of the exercise (e.g. "Bench Press", "Squat", "Deadlift"). INFER from user keywords: "bench"→"Bench Press", "squat"→"Squat", "deadlift"→"Deadlift"'
          }
        },
        required: ['exerciseName']
      }
    } as FunctionDeclaration,
    {
      name: 'getWorkoutHistory',
      description: 'Retrieve user workout history to provide personalized recommendations',
      parameters: {
        type: 'OBJECT',
        properties: {
          limit: {
            type: 'NUMBER',
            description: 'Number of recent workouts to retrieve (default: 5)'
          },
          muscleGroup: {
            type: 'STRING',
            description: 'Filter by specific muscle group (optional)'
          }
        }
      }
    } as FunctionDeclaration
  ]
};

// ============================================================================
// Function Implementations
// ============================================================================

class WorkoutFunctions {
  /**
   * Generate a complete workout plan with real exercises from database
   */
  async generateWorkout(args: any, userId?: string, userContext?: OnboardingContext | null): Promise<any> {
    console.log('🏋️ Generating workout with params:', args);
    console.log('📋 User context available:', !!userContext);

    // Extract context-aware defaults
    const contextDefaults = userContext ? {
      experience: userContext.experienceLevel.overall,
      workoutType: this.deriveWorkoutType(userContext.fitnessGoals.primary),
      duration: this.deriveDuration(userContext.schedule.sessionDuration),
      equipment: userContext.equipment.available
    } : {
      experience: 'intermediate',
      workoutType: 'strength',
      duration: 45,
      equipment: ['gym equipment']
    };

    // Use provided values or context defaults
    const { 
      targetMuscles = [], 
      workoutType = contextDefaults.workoutType, 
      experience = contextDefaults.experience, 
      duration = contextDefaults.duration, 
      equipment = contextDefaults.equipment 
    } = args;

    console.log(`✅ Using experience=${experience}, type=${workoutType}, duration=${duration}min`);

    // Check for injuries/limitations
    if (userContext?.experienceLevel.previousInjuries && userContext.experienceLevel.previousInjuries.length > 0) {
      console.log(`⚠️ User has injuries: ${userContext.experienceLevel.previousInjuries.join(', ')}`);
    }

    // Normalize muscle names for matching
    const normalizeMuscle = (muscle: string) => muscle.toLowerCase().trim();
    const targetMusclesNorm = targetMuscles.map(normalizeMuscle);

    // Filter exercises by target muscles
    const matchingExercises = exercises.filter(ex => {
      const allMuscles = [...ex.primaryMuscles, ...ex.secondaryMuscles].map(normalizeMuscle);
      return targetMusclesNorm.some(target =>
        allMuscles.some(muscle => muscle.includes(target) || target.includes(muscle))
      );
    });

    if (matchingExercises.length === 0) {
      return {
        success: false,
        error: `No exercises found for: ${targetMuscles.join(', ')}. Try: chest, back, legs, shoulders, arms`
      };
    }

    // Get workout configuration
    const config = this.getWorkoutConfig(workoutType, experience);

    // Select exercises (2-3 per muscle group, max 8 total)
    const exercisesPerGroup = Math.max(2, Math.floor(duration / 15));
    const selectedExercises: Exercise[] = [];

    targetMusclesNorm.forEach(target => {
      const muscleExercises = matchingExercises
        .filter(ex => {
          const allMuscles = [...ex.primaryMuscles, ...ex.secondaryMuscles].map(normalizeMuscle);
          return allMuscles.some(m => m.includes(target) || target.includes(m));
        })
        .slice(0, exercisesPerGroup);
      selectedExercises.push(...muscleExercises);
    });

    // Remove duplicates and limit
    const uniqueExercises = Array.from(new Set(selectedExercises.map(e => e.id)))
      .map(id => selectedExercises.find(e => e.id === id)!)
      .slice(0, 8);

    // Build workout
    const workoutExercises = uniqueExercises.map((ex, index) => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: config.sets,
      reps: config.reps,
      restSeconds: config.restSeconds,
      targetMuscles: ex.primaryMuscles,
      order: index + 1
    }));

    return {
      success: true,
      workout: {
        title: `${experience} ${targetMuscles.join(' & ')} Workout`,
        workoutType,
        experience,
        exercises: workoutExercises,
        totalExercises: workoutExercises.length,
        notes: `${config.sets} sets × ${config.reps} reps, ${config.restSeconds}s rest`
      }
    };
  }

  /**
   * Derive workout type from fitness goal
   */
  private deriveWorkoutType(goal: string): string {
    const goalMap: Record<string, string> = {
      'weight_loss': 'endurance',
      'muscle_gain': 'hypertrophy',
      'endurance': 'endurance',
      'strength': 'strength',
      'general_fitness': 'strength',
      'sport_specific': 'strength'
    };
    return goalMap[goal] || 'strength';
  }

  /**
   * Derive duration from schedule preference
   */
  private deriveDuration(sessionDuration: string): number {
    const durationMap: Record<string, number> = {
      '15_30': 25,
      '30_45': 40,
      '45_60': 50,
      '60_90': 75,
      '90_plus': 90
    };
    return durationMap[sessionDuration] || 45;
  }

  /**
   * Get exercise info from database
   */
  async getExerciseInfo(args: any, userId?: string): Promise<any> {
    console.log('📖 Getting exercise info for:', args.exerciseName);

    const searchTerm = args.exerciseName.toLowerCase().trim();
    const exercise = exercises.find(ex =>
      ex.name.toLowerCase() === searchTerm ||
      ex.id === searchTerm ||
      ex.name.toLowerCase().includes(searchTerm)
    );

    if (!exercise) {
      return {
        success: false,
        error: `Exercise "${args.exerciseName}" not found. Try: Bench Press, Squat, Deadlift`
      };
    }

    return {
      success: true,
      exercise: {
        name: exercise.name,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        description: `Primarily targets ${exercise.primaryMuscles.join(', ')}${exercise.secondaryMuscles.length > 0 ? `, also works ${exercise.secondaryMuscles.join(', ')}` : ''}`
      }
    };
  }

  /**
   * Get workout history from Firestore
   */
  async getWorkoutHistory(args: any, userId: string): Promise<any> {
    console.log('📊 Getting workout history for:', userId);

    try {
      const limit = args.limit || 5;
      const workouts = await getWorkouts(userId, limit);

      const history = workouts.map(w => ({
        title: w.title,
        date: w.date.toDate().toISOString().split('T')[0],
        exercises: w.exercises.map(e => e.name),
        volume: w.totalVolume,
        rpe: w.rpe
      }));

      return {
        success: true,
        workouts: history,
        message: history.length > 0 ? `Found ${history.length} workouts` : 'No history yet'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch history',
        workouts: []
      };
    }
  }

  private getWorkoutConfig(workoutType: string, experience: string) {
    const configs: Record<string, Record<string, any>> = {
      strength: {
        beginner: { sets: 3, reps: 8, restSeconds: 120 },
        intermediate: { sets: 4, reps: 6, restSeconds: 150 },
        advanced: { sets: 5, reps: 5, restSeconds: 180 }
      },
      hypertrophy: {
        beginner: { sets: 3, reps: 12, restSeconds: 60 },
        intermediate: { sets: 4, reps: 10, restSeconds: 75 },
        advanced: { sets: 5, reps: 8, restSeconds: 90 }
      },
      endurance: {
        beginner: { sets: 2, reps: 15, restSeconds: 45 },
        intermediate: { sets: 3, reps: 20, restSeconds: 45 },
        advanced: { sets: 4, reps: 25, restSeconds: 30 }
      },
      powerlifting: {
        beginner: { sets: 3, reps: 5, restSeconds: 180 },
        intermediate: { sets: 5, reps: 3, restSeconds: 240 },
        advanced: { sets: 6, reps: 2, restSeconds: 300 }
      },
      bodyweight: {
        beginner: { sets: 3, reps: 10, restSeconds: 60 },
        intermediate: { sets: 4, reps: 15, restSeconds: 60 },
        advanced: { sets: 5, reps: 20, restSeconds: 45 }
      }
    };

    return configs[workoutType]?.[experience] || configs.strength.intermediate;
  }
}

// ============================================================================
// Main Gemini Chat Service
// ============================================================================

export class GeminiChatService {
  private genAI: GoogleGenerativeAI;
  private workoutFunctions: WorkoutFunctions;
  private conversations: Map<string, ConversationState>;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_GOOGLE_AI_API_KEY is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.workoutFunctions = new WorkoutFunctions();
    this.conversations = new Map();

    console.log('✅ GeminiChatService initialized with function calling');
  }

  /**
   * Build system instruction based on user preferences
   */
  private buildSystemInstruction(userContext?: OnboardingContext | null): string {
    let communicationStyle = '';
    let coachingStyle = '';

    // Apply user preferences if available
    if (userContext?.preferences) {
      communicationStyle = COMMUNICATION_STYLE_PROMPTS[userContext.preferences.motivationStyle] || COMMUNICATION_STYLE_PROMPTS['encouraging'];
      coachingStyle = COACHING_STYLE_PROMPTS[userContext.preferences.coachingStyle] || COACHING_STYLE_PROMPTS['conversational'];
    } else {
      // Default styles
      communicationStyle = COMMUNICATION_STYLE_PROMPTS['encouraging'];
      coachingStyle = COACHING_STYLE_PROMPTS['conversational'];
    }

    return `You are Gymzy AI, a highly efficient fitness assistant that prioritizes IMMEDIATE ACTION over conversation.

<personality>
${communicationStyle}
${coachingStyle}
</personality>

<role>
You are a function-calling agent specialized in workout generation. Your PRIMARY job is to call functions immediately when you have sufficient information, not to have lengthy conversations.
</role>

<user_context_handling>
IMPORTANT: At the start of each conversation, you receive a [USER CONTEXT] block containing the user's:
- Fitness goals and timeline
- Experience level and training history
- Previous injuries and limitations
- Available equipment and location
- Workout schedule and preferred times
- Personality preferences (communication and coaching style)
- Health information (sleep, stress, medical conditions)

When the user asks "what do you know about me?", "tell me my profile", "share my data", or similar:
→ READ the [USER CONTEXT] block you received at the start of the conversation
→ SUMMARIZE it back to them in a friendly, organized way
→ Group information by category: Goals, Experience, Equipment, Schedule, Preferences, Health
→ DO NOT say "I don't have access" - you DO have access via the context block
→ Be specific - mention their actual goals, equipment, schedule days, etc.

Use this context naturally in ALL responses to personalize recommendations.
</user_context_handling>

<critical_behavior>
ALWAYS follow this decision flow BEFORE responding:

1. ANALYZE what the user wants
2. CHECK if you have enough info to call a function
3. If YES → CALL THE FUNCTION IMMEDIATELY (don't ask permission, don't confirm, just do it)
4. If NO → Ask ONE specific question for the missing critical info
</critical_behavior>

<inference_rules>
When users mention workout requests, INFER the following automatically:

Common phrases → Target muscles:
- "leg workout" / "legs" → ["quadriceps", "hamstrings", "glutes", "calves"]
- "upper body" → ["chest", "back", "shoulders", "arms"]
- "chest workout" / "chest" → ["chest", "triceps"]
- "back workout" / "back" → ["back", "biceps"]
- "arm workout" / "arms" → ["biceps", "triceps", "forearms"]
- "shoulder workout" / "shoulders" → ["shoulders", "traps"]
- "core" / "abs" → ["abs", "obliques", "lower back"]
- "full body" → ["legs", "chest", "back", "shoulders", "arms"]

Default values if not specified:
- experience: "intermediate"
- workoutType: "strength"
- duration: 45
- equipment: ["gym equipment"]
</inference_rules>

<function_calling_rules>
1. User asks for workout + you can infer muscles → CALL generateWorkout() IMMEDIATELY
2. User asks about specific exercise → CALL getExerciseInfo() IMMEDIATELY
   Examples: "tell me about bench press", "how do I squat", "what muscles does deadlift work"
3. User asks about past workouts → CALL getWorkoutHistory() IMMEDIATELY
4. ONLY ask questions if you genuinely cannot proceed (missing CRITICAL info that can't be inferred)
</function_calling_rules>

<examples>
<good_example>
User: "I need a leg workout"
Assistant: [IMMEDIATELY calls generateWorkout with targetMuscles=["quadriceps","hamstrings","glutes","calves"], experience="intermediate", workoutType="strength"]
</good_example>

<good_example>
User: "chest workout, advanced"
Assistant: [IMMEDIATELY calls generateWorkout with targetMuscles=["chest","triceps"], experience="advanced", workoutType="strength"]
</good_example>

<good_example>
User: "tell me about bench press"
Assistant: [IMMEDIATELY calls getExerciseInfo with exerciseName="Bench Press"]
</good_example>

<good_example>
User: "how to do squats properly"
Assistant: [IMMEDIATELY calls getExerciseInfo with exerciseName="Squat"]
</good_example>

<bad_example>
User: "I need a leg workout"
Assistant: "What type of workout are you looking for?"
[WRONG - should have immediately generated a strength leg workout with intermediate defaults]
</bad_example>

<bad_example>
User: "strength, advanced"
[After user already said "leg workout"]
Assistant: "What target muscle groups would you like to focus on?"
[WRONG - user already specified legs, should immediately generate]
</bad_example>

<bad_example>
User: "tell me about deadlifts"
Assistant: "Deadlifts are a compound exercise..."
[WRONG - should have called getExerciseInfo to get detailed information from the database]
</bad_example>
</examples>

<response_style>
- Be direct and action-oriented
- Minimize conversational filler
- Present workout results clearly
- Only elaborate if user asks for details
</response_style>`;
  }

  /**
   * Get or create model with user-specific system instruction
   */
  private getModel(userContext?: OnboardingContext | null) {
    const systemInstruction = this.buildSystemInstruction(userContext);

    if (userContext?.preferences) {
      console.log(`🎭 Using personalized AI: ${userContext.preferences.motivationStyle} communication + ${userContext.preferences.coachingStyle} coaching`);
    } else {
      console.log('🤖 Using default AI personality');
    }

    return this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [workoutTools],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
      systemInstruction
    });
  }

  /**
   * Get or create conversation state
   */
  private getConversation(sessionId: string, userId: string, userContext?: OnboardingContext | null): ConversationState {
    if (!this.conversations.has(sessionId)) {
      // Create new conversation
      const conversation: ConversationState = {
        sessionId,
        userId,
        messages: [],
        userContext,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // If we have user context, inject it as a system message at the start
      if (userContext) {
        const contextSummary = this.buildContextSummary(userContext);
        conversation.messages.push({
          role: 'user',
          content: contextSummary,
          timestamp: new Date()
        });
        console.log('✅ Injected user context into new conversation');
      }

      this.conversations.set(sessionId, conversation);
    }
    
    // Update context if provided and different
    const conversation = this.conversations.get(sessionId)!;
    if (userContext && !conversation.userContext) {
      conversation.userContext = userContext;
      
      // If messages are empty or only have one message, inject context
      if (conversation.messages.length <= 1) {
        const contextSummary = this.buildContextSummary(userContext);
        conversation.messages.unshift({
          role: 'user',
          content: contextSummary,
          timestamp: new Date()
        });
        console.log('✅ Injected user context into existing conversation');
      }
    }
    
    return conversation;
  }

  /**
   * Build a concise context summary from user onboarding data
   */
  private buildContextSummary(context: OnboardingContext): string {
    console.log('🔍 Building context summary from:', JSON.stringify(context, null, 2));

    const parts: string[] = [
      `[USER CONTEXT - This information should guide all workout recommendations]`
    ];

    // Fitness Goals
    if (context.fitnessGoals) {
      parts.push(`\nGoals: Primary=${context.fitnessGoals.primary}, Timeline=${context.fitnessGoals.targetTimeline}`);
      if (context.fitnessGoals.secondary && context.fitnessGoals.secondary.length > 0) {
        parts.push(`Secondary goals: ${context.fitnessGoals.secondary.join(', ')}`);
      }
    }

    // Experience Level
    if (context.experienceLevel) {
      parts.push(`\nExperience: ${context.experienceLevel.overall} (${context.experienceLevel.yearsTraining} years training)`);
      const exp = context.experienceLevel.specificExperience;
      parts.push(`Specific: Weightlifting=${exp.weightlifting}, Cardio=${exp.cardio}, Flexibility=${exp.flexibility}`);
      
      if (context.experienceLevel.previousInjuries && context.experienceLevel.previousInjuries.length > 0) {
        parts.push(`⚠️ Previous Injuries: ${context.experienceLevel.previousInjuries.join(', ')}`);
      }
      if (context.experienceLevel.limitations && context.experienceLevel.limitations.length > 0) {
        parts.push(`⚠️ Limitations: ${context.experienceLevel.limitations.join(', ')}`);
      }
    }

    // Equipment & Environment
    if (context.equipment) {
      parts.push(`\nEquipment: ${context.equipment.location} - ${context.equipment.available.join(', ') || 'None specified'}`);
      parts.push(`Space: ${context.equipment.spaceConstraints}`);
    }

    // Schedule
    if (context.schedule) {
      parts.push(`\nSchedule: ${context.schedule.workoutDays.join(', ')}`);
      parts.push(`Preferred times: ${context.schedule.preferredTimes.join(', ')}`);
      parts.push(`Session duration: ${context.schedule.sessionDuration}`);
    }

    // Preferences (AI personality is already applied via system instruction)
    if (context.preferences) {
      parts.push(`\nPreferences: Intensity=${context.preferences.workoutIntensity}, Social=${context.preferences.socialPreference}`);
      parts.push(`Feedback frequency=${context.preferences.feedbackFrequency}`);
      parts.push(`Note: Communication style (${context.preferences.motivationStyle}) and coaching style (${context.preferences.coachingStyle}) are already active in my personality.`);
    }

    // Health Info
    if (context.healthInfo) {
      if (context.healthInfo.medicalConditions && context.healthInfo.medicalConditions.length > 0) {
        parts.push(`\n⚠️ Medical conditions: ${context.healthInfo.medicalConditions.join(', ')}`);
      }
      parts.push(`\nSleep: ${context.healthInfo.sleepPattern.averageHours}h (${context.healthInfo.sleepPattern.quality})`);
      parts.push(`Stress: ${context.healthInfo.stressLevel}, Energy: ${context.healthInfo.energyLevels}`);
    }

    parts.push(`\n[END USER CONTEXT - Use this to personalize all recommendations]`);

    return parts.join('\n');
  }

  /**
   * Convert ChatMessage to Gemini Content format
   */
  private toGeminiContent(messages: ChatMessage[]): Content[] {
    return messages.map(msg => {
      if (msg.role === 'function' && msg.functionResponse) {
        // Function response format
        return {
          role: 'function',
          parts: [{
            functionResponse: msg.functionResponse
          }]
        };
      }

      if (msg.functionCall) {
        // Function call from model
        return {
          role: 'model',
          parts: [{
            functionCall: msg.functionCall
          }]
        };
      }

      // Regular text message
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      };
    });
  }

  /**
   * Execute function call
   */
  private async executeFunction(name: string, args: Record<string, any>, userId: string, userContext?: OnboardingContext | null): Promise<any> {
    console.log(`🔧 Executing function: ${name}`);

    switch (name) {
      case 'generateWorkout':
        return await this.workoutFunctions.generateWorkout(args, userId, userContext);

      case 'getExerciseInfo':
        return await this.workoutFunctions.getExerciseInfo(args, userId);

      case 'getWorkoutHistory':
        return await this.workoutFunctions.getWorkoutHistory(args, userId);

      default:
        return { error: `Unknown function: ${name}` };
    }
  }

  /**
   * Send message with automatic function calling
   */
  async sendMessage(
    sessionId: string,
    userId: string,
    userMessage: string,
    userContext?: OnboardingContext | null
  ): Promise<ChatResponse> {
    try {
      const conversation = this.getConversation(sessionId, userId, userContext);

      // Add user message to history
      conversation.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Convert history to Gemini format
      const history = this.toGeminiContent(conversation.messages);

      // Get personalized model based on user preferences
      const model = this.getModel(userContext);

      // Start chat with history
      const chat = model.startChat({
        history: history.slice(0, -1), // All messages except the last one
      });

      // Send message
      let result = await chat.sendMessage(userMessage);
      let response = result.response;

      // Handle function calls
      const functionCalls: ChatResponse['functionCalls'] = [];

      // Keep calling functions until we get a text response
      let calls = response.functionCalls?.();
      while (calls && calls.length > 0) {
        console.log('📞 Model requested function calls');

        // Execute all function calls
        for (const call of calls) {
          console.log(`   → ${call.name}(${JSON.stringify(call.args)})`);

          // Execute function
          const functionResult = await this.executeFunction(call.name, call.args, userId, conversation.userContext);

          // Store function call info
          functionCalls.push({
            name: call.name,
            args: call.args,
            result: functionResult
          });

          // Add function call to history
          conversation.messages.push({
            role: 'model',
            content: '',
            functionCall: {
              name: call.name,
              args: call.args
            },
            timestamp: new Date()
          });

          // Add function response to history
          conversation.messages.push({
            role: 'function',
            content: '',
            functionResponse: {
              name: call.name,
              response: functionResult
            },
            timestamp: new Date()
          });

          // Send function result back to model
          result = await chat.sendMessage([{
            functionResponse: {
              name: call.name,
              response: functionResult
            }
          }]);

          response = result.response;
        }
        
        // Check for more function calls
        calls = response.functionCalls?.();
      }

      // Get final text response
      const finalMessage = response.text();

      // Add assistant response to history
      conversation.messages.push({
        role: 'model',
        content: finalMessage,
        timestamp: new Date()
      });

      conversation.updatedAt = new Date();

      return {
        message: finalMessage,
        functionCalls,
        success: true
      };

    } catch (error) {
      console.error('❌ GeminiChatService error:', error);
      return {
        message: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send message with streaming
   */
  async sendMessageStreaming(
    sessionId: string,
    userId: string,
    userMessage: string,
    onChunk: (chunk: string) => void,
    userContext?: OnboardingContext | null
  ): Promise<ChatResponse> {
    try {
      const conversation = this.getConversation(sessionId, userId, userContext);

      // Add user message
      conversation.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Convert history
      const history = this.toGeminiContent(conversation.messages);

      // Get personalized model based on user preferences
      const model = this.getModel(userContext);

      // Start chat
      const chat = model.startChat({
        history: history.slice(0, -1),
      });

      // Send with streaming
      let result = await chat.sendMessageStream(userMessage);

      let fullText = '';
      const functionCalls: ChatResponse['functionCalls'] = [];

      // First pass: collect initial response
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          onChunk(chunkText);
        }
      }

      // Get the aggregated response with null safety
      // Note: In streaming, result.response returns the response directly (not wrapped)
      let response = await result.response;

      if (!response) {
        console.warn('⚠️ No response after initial streaming');
        // Return what we have so far
        conversation.messages.push({
          role: 'model',
          content: fullText,
          timestamp: new Date()
        });
        conversation.updatedAt = new Date();
        return {
          message: fullText,
          functionCalls,
          success: true
        };
      }

      // Handle function calls in a loop (like non-streaming version)
      let calls = response?.functionCalls ? response.functionCalls() : undefined;
      while (calls && calls.length > 0) {
        console.log('📞 Model requested function calls (streaming)');

        // Execute all function calls
        for (const call of calls) {
          console.log(`   → ${call.name}(${JSON.stringify(call.args)})`);

          // Execute function
          const functionResult = await this.executeFunction(call.name, call.args, userId, conversation.userContext);

          // Store function call info
          functionCalls.push({
            name: call.name,
            args: call.args,
            result: functionResult
          });

          // Send function result back to continue conversation
          result = await chat.sendMessageStream([{
            functionResponse: {
              name: call.name,
              response: functionResult
            }
          }]);

          // Stream the model's response about the function result
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              fullText += chunkText;
              onChunk(chunkText);
            }
          }

          // Safely get response with null checks
          // Note: In streaming, result.response returns the response directly
          response = await result.response;
          if (!response) {
            console.warn('⚠️ No response after function call');
            break;
          }
        }

        // Check for more function calls with null safety
        calls = response?.functionCalls ? response.functionCalls() : undefined;
      }

      // Add to history
      conversation.messages.push({
        role: 'model',
        content: fullText,
        timestamp: new Date()
      });

      conversation.updatedAt = new Date();

      return {
        message: fullText,
        functionCalls,
        success: true
      };

    } catch (error) {
      console.error('❌ GeminiChatService streaming error:', error);
      return {
        message: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId: string): ChatMessage[] {
    return this.conversations.get(sessionId)?.messages || [];
  }

  /**
   * Clear conversation
   */
  clearHistory(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  /**
   * Get active conversations count
   */
  getActiveConversationsCount(): number {
    return this.conversations.size;
  }
}

// Export singleton instance
export const geminiChatService = new GeminiChatService();
