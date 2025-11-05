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

// ============================================================================
// Types
// ============================================================================

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
      description: 'Generate a personalized workout plan based on user preferences and fitness goals',
      parameters: {
        type: 'OBJECT',
        properties: {
          targetMuscles: {
            type: 'ARRAY',
            description: 'Target muscle groups (e.g., chest, back, legs, shoulders, arms, core)',
            items: { type: 'STRING' }
          },
          workoutType: {
            type: 'STRING',
            description: 'Type of workout (strength, hypertrophy, endurance, powerlifting, bodyweight)',
            enum: ['strength', 'hypertrophy', 'endurance', 'powerlifting', 'bodyweight']
          },
          experience: {
            type: 'STRING',
            description: 'User fitness experience level',
            enum: ['beginner', 'intermediate', 'advanced']
          },
          duration: {
            type: 'NUMBER',
            description: 'Desired workout duration in minutes'
          },
          equipment: {
            type: 'ARRAY',
            description: 'Available equipment',
            items: { type: 'STRING' }
          }
        },
        required: ['targetMuscles', 'workoutType', 'experience']
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
  async generateWorkout(args: any): Promise<any> {
    console.log('🏋️ Generating workout with params:', args);

    // This would integrate with your existing workout generation logic
    // For now, returning a structured response
    return {
      success: true,
      workout: {
        exercises: [
          {
            name: args.targetMuscles.includes('chest') ? 'Bench Press' : 'Squat',
            sets: args.workoutType === 'strength' ? 5 : 3,
            reps: args.workoutType === 'strength' ? 5 : 10,
            restSeconds: 90
          }
        ],
        totalDuration: args.duration || 45,
        notes: `${args.experience} level ${args.workoutType} workout`
      }
    };
  }

  async getExerciseInfo(args: any): Promise<any> {
    console.log('📖 Getting exercise info for:', args.exerciseName);

    // This would query your exercise database
    return {
      success: true,
      exercise: {
        name: args.exerciseName,
        primaryMuscles: ['chest', 'triceps'],
        secondaryMuscles: ['shoulders'],
        equipment: ['barbell', 'bench'],
        difficulty: 'intermediate',
        instructions: [
          'Lie flat on bench',
          'Grip bar slightly wider than shoulders',
          'Lower bar to chest',
          'Press up to starting position'
        ]
      }
    };
  }

  async getWorkoutHistory(args: any): Promise<any> {
    console.log('📊 Getting workout history, limit:', args.limit);

    // This would query Firestore for user's workout history
    return {
      success: true,
      workouts: [],
      message: 'No workout history yet'
    };
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
      systemInstruction: `You are Gymzy AI, a friendly and knowledgeable fitness assistant specialized in creating personalized workout plans.

CRITICAL: When users request a workout, you MUST call the generateWorkout function immediately if you have enough information. Don't just talk about creating workouts - actually create them using the function.

Function Calling Rules:
1. If user asks for a workout and provides target muscles, experience level, and workout type -> CALL generateWorkout() immediately
2. If user asks about a specific exercise -> CALL getExerciseInfo() immediately
3. Only ask follow-up questions if critical information is missing

Your role:
- Create personalized workout plans using generateWorkout function
- Answer fitness and nutrition questions
- Provide exercise form guidance using getExerciseInfo function
- Motivate and encourage users

Guidelines:
- ALWAYS use functions when appropriate - don't just describe what you would do
- Be action-oriented: if you can generate a workout, do it immediately
- Keep responses concise but helpful
- Prioritize safety and proper form
- Adapt advice to user's experience level`
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
  private async executeFunction(name: string, args: Record<string, any>): Promise<any> {
    console.log(`🔧 Executing function: ${name}`);

    switch (name) {
      case 'generateWorkout':
        return await this.workoutFunctions.generateWorkout(args);

      case 'getExerciseInfo':
        return await this.workoutFunctions.getExerciseInfo(args);

      case 'getWorkoutHistory':
        return await this.workoutFunctions.getWorkoutHistory(args);

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
          const functionResult = await this.executeFunction(call.name, call.args);

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
      const result = await chat.sendMessageStream(userMessage);

      let fullText = '';
      const functionCalls: ChatResponse['functionCalls'] = [];

      // Handle stream chunks
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          onChunk(chunkText);
        }

        // Check for function calls
        const calls = chunk.functionCalls?.();
        if (calls && calls.length > 0) {
          // Note: In streaming mode, function calls come in chunks
          // You may want to handle this differently based on your needs
          for (const call of calls) {
            const result = await this.executeFunction(call.name, call.args);
            functionCalls.push({
              name: call.name,
              args: call.args,
              result
            });
          }
        }
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
