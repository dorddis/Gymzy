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
      description: 'Get detailed information about a specific exercise including form, muscles worked, and variations',
      parameters: {
        type: 'OBJECT',
        properties: {
          exerciseName: {
            type: 'STRING',
            description: 'Name of the exercise to get information about'
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
  async generateWorkout(args: any, userId?: string): Promise<any> {
    console.log('🏋️ Generating workout with params:', args);

    const { targetMuscles = [], workoutType = 'strength', experience = 'intermediate', duration = 45, equipment = [] } = args;

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
  private model: any;
  private workoutFunctions: WorkoutFunctions;
  private conversations: Map<string, ConversationState>;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_GOOGLE_AI_API_KEY is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    // Initialize Gemini 2.5 Flash with function calling
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [workoutTools],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
      systemInstruction: `You are Gymzy AI, a highly efficient fitness assistant that prioritizes IMMEDIATE ACTION over conversation.

<role>
You are a function-calling agent specialized in workout generation. Your PRIMARY job is to call functions immediately when you have sufficient information, not to have lengthy conversations.
</role>

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
2. User mentions specific exercise name → CALL getExerciseInfo() IMMEDIATELY
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
</examples>

<response_style>
- Be direct and action-oriented
- Minimize conversational filler
- Present workout results clearly
- Only elaborate if user asks for details
</response_style>`
    });

    this.workoutFunctions = new WorkoutFunctions();
    this.conversations = new Map();

    console.log('✅ GeminiChatService initialized with function calling');
  }

  /**
   * Get or create conversation state
   */
  private getConversation(sessionId: string, userId: string): ConversationState {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, {
        sessionId,
        userId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return this.conversations.get(sessionId)!;
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
  private async executeFunction(name: string, args: Record<string, any>, userId: string): Promise<any> {
    console.log(`🔧 Executing function: ${name}`);

    switch (name) {
      case 'generateWorkout':
        return await this.workoutFunctions.generateWorkout(args, userId);

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
    userMessage: string
  ): Promise<ChatResponse> {
    try {
      const conversation = this.getConversation(sessionId, userId);

      // Add user message to history
      conversation.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Convert history to Gemini format
      const history = this.toGeminiContent(conversation.messages);

      // Start chat with history
      const chat = this.model.startChat({
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
          const functionResult = await this.executeFunction(call.name, call.args, userId);

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
    onChunk: (chunk: string) => void
  ): Promise<ChatResponse> {
    try {
      const conversation = this.getConversation(sessionId, userId);

      // Add user message
      conversation.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Convert history
      const history = this.toGeminiContent(conversation.messages);

      // Start chat
      const chat = this.model.startChat({
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

      // Get the aggregated response
      let response = (await result.response).response;

      // Handle function calls in a loop (like non-streaming version)
      let calls = response.functionCalls?.();
      while (calls && calls.length > 0) {
        console.log('📞 Model requested function calls (streaming)');

        // Execute all function calls
        for (const call of calls) {
          console.log(`   → ${call.name}(${JSON.stringify(call.args)})`);

          // Execute function
          const functionResult = await this.executeFunction(call.name, call.args, userId);

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

          response = (await result.response).response;
        }

        // Check for more function calls
        calls = response.functionCalls?.();
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
