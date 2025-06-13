/**
 * Production Agentic AI Service - Main Integration Point
 * Replaces the current agentic-ai-service.ts with production-grade capabilities
 */

import { AgenticStateManager } from './agentic-state-manager';
import { FirebaseStateAdapter, MemoryStateAdapter } from './firebase-state-adapter';
import { RobustToolExecutor } from './robust-tool-executor';
import { EnhancedWorkoutTools } from './enhanced-workout-tools';
import { generateAIResponse, generateCharacterStreamingResponse } from './ai-service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  userId: string;
}

export interface AgenticAIResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    parameters: any;
    result: any;
  }>;
  workoutData?: {
    exercises: any[];
    workoutId: string;
  };
  isStreaming?: boolean;
  confidence?: number;
  reasoning?: string;
  metadata?: {
    sessionId: string;
    taskId?: string;
    executionTime: number;
    toolsUsed: string[];
    fallbacksUsed: string[];
  };
}

export class ProductionAgenticService {
  private stateManager: AgenticStateManager;
  private toolExecutor: RobustToolExecutor;
  private workoutTools: EnhancedWorkoutTools;
  private initialized: boolean = false;

  constructor() {
    // Use memory adapter for development, Firebase for production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const stateAdapter = isDevelopment ? new MemoryStateAdapter() : new FirebaseStateAdapter();
    
    this.stateManager = new AgenticStateManager(stateAdapter);
    this.toolExecutor = new RobustToolExecutor();
    this.workoutTools = new EnhancedWorkoutTools();
  }

  /**
   * Initialize the service and register tools
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 ProductionAgenticService: Initializing...');

    try {
      // Register enhanced workout tools
      const toolDefinitions = this.workoutTools.getToolDefinitions();
      toolDefinitions.forEach(tool => {
        this.toolExecutor.registerTool(tool);
        console.log(`🔧 ProductionAgenticService: Registered tool "${tool.name}"`);
      });

      // Register general conversation tool
      this.toolExecutor.registerTool({
        name: 'general_response',
        description: 'Generate general conversational responses',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'User message to respond to' },
            context: { type: 'string', description: 'Conversation context' }
          }
        },
        execute: async (params, context) => {
          return { response: 'General conversation response', type: 'chat' };
        }
      });

      this.initialized = true;
      console.log('✅ ProductionAgenticService: Initialization complete');
    } catch (error) {
      console.error('❌ ProductionAgenticService: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate agentic response with full production capabilities
   */
  async generateAgenticResponse(
    userInput: string,
    chatHistory: ChatMessage[] = [],
    onStreamChunk?: (chunk: string) => void
  ): Promise<AgenticAIResponse> {
    await this.initialize();

    const startTime = Date.now();
    const sessionId = this.getSessionId(chatHistory);
    const userId = this.getUserId(chatHistory);

    try {
      console.log('🤖 ProductionAgenticService: Starting response generation...');
      console.log('🤖 ProductionAgenticService: User input:', userInput);
      console.log('🤖 ProductionAgenticService: Session ID:', sessionId);

      // Initialize or restore conversation state
      const state = await this.stateManager.initializeState(sessionId, userId);

      // Add user message to conversation
      await this.stateManager.addMessage(sessionId, {
        role: 'user',
        content: userInput,
        timestamp: new Date(),
        metadata: { source: 'user_input' }
      });

      // Analyze user intent and determine required tools
      const intentAnalysis = await this.analyzeUserIntent(userInput, state);
      console.log('🔍 ProductionAgenticService: Intent analysis:', intentAnalysis);

      // Execute tools if needed
      let toolResults: any[] = [];
      let workoutData = null;

      if (intentAnalysis.requiresTools && intentAnalysis.tools.length > 0) {
        console.log('🔧 ProductionAgenticService: Executing tools:', intentAnalysis.tools);
        
        const toolExecutionResults = await this.executeTools(
          intentAnalysis.tools,
          userInput,
          state,
          sessionId
        );

        toolResults = toolExecutionResults.results;
        workoutData = toolExecutionResults.workoutData;
      }

      // Generate final response
      const response = await this.generateFinalResponse(
        userInput,
        intentAnalysis,
        toolResults,
        state,
        onStreamChunk
      );

      // Add AI response to conversation
      await this.stateManager.addMessage(sessionId, {
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          toolCalls: toolResults,
          confidence: response.confidence,
          source: 'ai_response'
        }
      });

      const finalResponse: AgenticAIResponse = {
        content: response.content,
        toolCalls: toolResults.map(result => ({
          name: result.toolName,
          parameters: result.parameters,
          result: result.data
        })),
        workoutData,
        isStreaming: !!onStreamChunk,
        confidence: response.confidence,
        reasoning: intentAnalysis.reasoning,
        metadata: {
          sessionId,
          executionTime: Date.now() - startTime,
          toolsUsed: toolResults.map(r => r.toolName),
          fallbacksUsed: []
        }
      };

      console.log('✅ ProductionAgenticService: Response generated successfully');
      return finalResponse;

    } catch (error) {
      console.error('❌ ProductionAgenticService: Error in response generation:', error);
      return this.generateFallbackResponse(userInput, sessionId, error, startTime);
    }
  }

  /**
   * Analyze user intent to determine required tools
   */
  private async analyzeUserIntent(userInput: string, state: any): Promise<any> {
    const context = this.stateManager.getContextForAI(state.sessionId);
    
    const analysisPrompt = `
Analyze the user's request and determine what tools are needed.

User Request: "${userInput}"
Context: ${context}

AVAILABLE TOOLS (use these exact names):
- create_workout: Create a personalized workout plan
- search_exercises: Search for specific exercises
- general_response: Handle general conversation

CRITICAL RULES:
1. ONLY create workouts when the user EXPLICITLY asks for one
2. Greetings, questions, and general conversation should use "general_response"
3. Be conservative - when in doubt, use "general_response"

WORKOUT CREATION TRIGGERS (use "create_workout"):
- "Create a workout"
- "Make me a workout"
- "Design a routine"
- "Build me a workout plan"
- "I want a [muscle group] workout"

GENERAL CONVERSATION (use "general_response"):
- Greetings: "Hi", "Hello", "Hey", "What's up"
- Questions: "How are you?", "What can you do?"
- Statements: "There's no button", "I'm tired"
- Complaints or feedback

Respond with JSON only:
{
  "intent": "workout_creation" | "exercise_search" | "general_chat",
  "requiresTools": true/false,
  "tools": ["tool_name"],
  "reasoning": "explanation",
  "confidence": 0.0-1.0,
  "parameters": {}
}

Examples:
- "Create a chest workout" → {"intent": "workout_creation", "requiresTools": true, "tools": ["create_workout"], "reasoning": "Explicit workout creation request", "confidence": 0.9, "parameters": {}}
- "Hey there" → {"intent": "general_chat", "requiresTools": false, "tools": [], "reasoning": "Greeting - general conversation", "confidence": 0.9, "parameters": {}}
- "What's up?" → {"intent": "general_chat", "requiresTools": false, "tools": [], "reasoning": "Casual greeting", "confidence": 0.9, "parameters": {}}
- "There's no button" → {"intent": "general_chat", "requiresTools": false, "tools": [], "reasoning": "User feedback/complaint", "confidence": 0.9, "parameters": {}}`;

    try {
      const analysisResponse = await generateAIResponse(analysisPrompt);
      console.log('🔍 ProductionAgenticService: Raw analysis response:', analysisResponse);

      const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('🔍 ProductionAgenticService: Parsed analysis:', analysis);

        // Validate and correct tool names
        const correctedTools = this.validateAndCorrectToolNames(analysis.tools || []);

        return {
          intent: analysis.intent,
          requiresTools: analysis.requiresTools,
          tools: correctedTools,
          reasoning: analysis.reasoning,
          confidence: analysis.confidence || 0.8,
          parameters: analysis.parameters || {}
        };
      } else {
        console.error('❌ ProductionAgenticService: No JSON found in analysis response');
      }
    } catch (error) {
      console.error('❌ ProductionAgenticService: Intent analysis failed:', error);
      console.error('❌ ProductionAgenticService: Analysis response was:', analysisResponse);
    }

    // Fallback analysis
    return this.getFallbackIntentAnalysis(userInput);
  }

  /**
   * Execute tools based on intent analysis
   */
  private async executeTools(
    tools: string[],
    userInput: string,
    state: any,
    sessionId: string
  ): Promise<{ results: any[]; workoutData: any }> {
    const results: any[] = [];
    let workoutData = null;

    const context = {
      sessionId,
      userId: state.userId,
      conversationContext: this.stateManager.getContextForAI(sessionId),
      userProfile: state.context.userProfile,
      previousResults: []
    };

    for (const toolName of tools) {
      try {
        console.log(`🔧 ProductionAgenticService: Executing tool "${toolName}"`);
        
        const parameters = this.buildToolParameters(toolName, userInput, state);
        const result = await this.toolExecutor.executeTool(toolName, parameters, context);
        
        if (result.success) {
          results.push({
            toolName,
            parameters,
            data: result.data,
            success: true
          });

          // Extract workout data if this was a workout creation tool
          if (toolName === 'create_workout' && result.data?.workout) {
            workoutData = {
              exercises: result.data.workout.exercises,
              workoutId: result.data.workout.id
            };
          }

          console.log(`✅ ProductionAgenticService: Tool "${toolName}" executed successfully`);
        } else {
          console.error(`❌ ProductionAgenticService: Tool "${toolName}" failed:`, result.error);

          // Try to provide a meaningful fallback based on the tool type
          let fallbackData = null;
          if (toolName === 'create_workout') {
            fallbackData = this.createBasicWorkoutFallback(userInput);
            console.log('🔄 ProductionAgenticService: Using workout creation fallback');

            // Extract workout data from fallback
            if (fallbackData?.workout) {
              workoutData = {
                exercises: fallbackData.workout.exercises,
                workoutId: fallbackData.workout.id
              };
            }
          }

          results.push({
            toolName,
            parameters,
            error: result.error,
            success: false,
            fallbackData
          });
        }
      } catch (error) {
        console.error(`❌ ProductionAgenticService: Error executing tool "${toolName}":`, error);
        results.push({
          toolName,
          parameters: {},
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    return { results, workoutData };
  }

  /**
   * Generate final response with streaming support
   */
  private async generateFinalResponse(
    userInput: string,
    intentAnalysis: any,
    toolResults: any[],
    state: any,
    onStreamChunk?: (chunk: string) => void
  ): Promise<{ content: string; confidence: number }> {
    const context = this.stateManager.getContextForAI(state.sessionId);
    
    let responsePrompt = `
Based on the user's request and any tool execution results, generate a helpful, conversational response.

User Request: "${userInput}"
Intent: ${intentAnalysis.intent}
Context: ${context}
`;

    if (toolResults.length > 0) {
      responsePrompt += `\nTool Results:\n${JSON.stringify(toolResults, null, 2)}`;
    }

    responsePrompt += `
Requirements:
- Be conversational and helpful
- Use the user's name if available
- Include specific details from tool results
- Use clean, readable formatting (avoid excessive markdown)
- If a workout was created, provide a clear summary with exercise names, sets, and reps
- Include a "Start This Workout" button/link at the end if workout was created
- Match the user's communication style from their profile
- Keep response concise but informative (max 250 words)
- Format workout details in a simple, easy-to-read list
- Don't include technical metadata or confidence scores in the user response
`;

    try {
      let content = '';
      
      if (onStreamChunk) {
        content = await generateCharacterStreamingResponse(responsePrompt, onStreamChunk);
      } else {
        content = await generateAIResponse(responsePrompt);
      }

      return {
        content,
        confidence: this.calculateResponseConfidence(toolResults, intentAnalysis.confidence)
      };
    } catch (error) {
      console.error('❌ ProductionAgenticService: Error generating final response:', error);
      throw error;
    }
  }

  // Helper methods
  private getSessionId(chatHistory: ChatMessage[]): string {
    // Try to get from existing session or generate new one
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getUserId(chatHistory: ChatMessage[]): string {
    // Extract from chat history or use default
    return chatHistory.length > 0 ? chatHistory[0].userId : 'anonymous';
  }

  private getFallbackIntentAnalysis(userInput: string): any {
    const lowerInput = userInput.toLowerCase();

    console.log('🔄 ProductionAgenticService: Using fallback intent analysis for:', userInput);

    // Greetings and casual conversation - prioritize these
    const greetingKeywords = ['hi', 'hello', 'hey', 'sup', 'what\'s up', 'how are you', 'good morning', 'good afternoon', 'good evening'];
    const casualKeywords = ['thanks', 'thank you', 'ok', 'okay', 'cool', 'nice', 'great', 'awesome'];
    const feedbackKeywords = ['no button', 'doesn\'t work', 'error', 'problem', 'issue', 'bug'];

    if (greetingKeywords.some(keyword => lowerInput.includes(keyword)) ||
        casualKeywords.some(keyword => lowerInput.includes(keyword)) ||
        feedbackKeywords.some(keyword => lowerInput.includes(keyword))) {
      return {
        intent: 'general_chat',
        requiresTools: false,
        tools: [],
        reasoning: 'Detected greeting, casual conversation, or feedback',
        confidence: 0.9,
        parameters: {}
      };
    }

    // Explicit workout creation - must be very specific
    const explicitWorkoutKeywords = ['create workout', 'make workout', 'build workout', 'design workout', 'workout plan', 'workout routine'];
    const muscleGroupRequests = ['chest workout', 'back workout', 'leg workout', 'arm workout', 'shoulder workout'];

    if (explicitWorkoutKeywords.some(keyword => lowerInput.includes(keyword)) ||
        muscleGroupRequests.some(keyword => lowerInput.includes(keyword))) {
      return {
        intent: 'workout_creation',
        requiresTools: true,
        tools: ['create_workout'],
        reasoning: 'Detected explicit workout creation request',
        confidence: 0.8,
        parameters: {}
      };
    }

    // Exercise search keywords
    const searchKeywords = ['find exercise', 'search exercise', 'show exercise', 'list exercise'];
    if (searchKeywords.some(keyword => lowerInput.includes(keyword))) {
      return {
        intent: 'exercise_search',
        requiresTools: true,
        tools: ['search_exercises'],
        reasoning: 'Detected exercise search request',
        confidence: 0.7,
        parameters: {}
      };
    }

    // Default to general conversation for everything else
    return {
      intent: 'general_chat',
      requiresTools: false,
      tools: [],
      reasoning: 'Default to general conversation - no specific workout request detected',
      confidence: 0.8,
      parameters: {}
    };
  }

  private buildToolParameters(toolName: string, userInput: string, state: any): any {
    switch (toolName) {
      case 'create_workout':
        return this.extractWorkoutParameters(userInput, state);
      case 'search_exercises':
        return { query: userInput };
      default:
        return { message: userInput };
    }
  }

  private extractWorkoutParameters(userInput: string, state: any): any {
    // Simple parameter extraction - in production, this would be more sophisticated
    const lowerInput = userInput.toLowerCase();
    
    const parameters: any = {
      exercises: []
    };

    // Extract workout type
    if (lowerInput.includes('chest')) {
      parameters.type = 'chest';
      parameters.exercises = [
        { name: 'Push-up', sets: 3, reps: 10 },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 8 }
      ];
    } else if (lowerInput.includes('back')) {
      parameters.type = 'back';
      parameters.exercises = [
        { name: 'Pull-up', sets: 3, reps: 8 },
        { name: 'Dumbbell Row', sets: 3, reps: 10 }
      ];
    } else if (lowerInput.includes('leg')) {
      parameters.type = 'legs';
      parameters.exercises = [
        { name: 'Squat', sets: 3, reps: 12 },
        { name: 'Lunge', sets: 3, reps: 10 }
      ];
    } else {
      // Default full body workout
      parameters.type = 'full_body';
      parameters.exercises = [
        { name: 'Push-up', sets: 3, reps: 10 },
        { name: 'Squat', sets: 3, reps: 12 },
        { name: 'Plank', sets: 3, duration: '30 seconds' }
      ];
    }

    return parameters;
  }

  private createBasicWorkoutFallback(userInput: string): any {
    const lowerInput = userInput.toLowerCase();

    let workoutType = 'full_body';
    let exercises = [];

    if (lowerInput.includes('chest')) {
      workoutType = 'chest';
      exercises = [
        { name: 'Push-up', sets: 3, reps: 10, weight: 0 },
        { name: 'Incline Push-up', sets: 3, reps: 8, weight: 0 }
      ];
    } else if (lowerInput.includes('back')) {
      workoutType = 'back';
      exercises = [
        { name: 'Pull-up', sets: 3, reps: 8, weight: 0 },
        { name: 'Superman', sets: 3, reps: 12, weight: 0 }
      ];
    } else if (lowerInput.includes('leg')) {
      workoutType = 'legs';
      exercises = [
        { name: 'Squat', sets: 3, reps: 12, weight: 0 },
        { name: 'Lunge', sets: 3, reps: 10, weight: 0 }
      ];
    } else {
      exercises = [
        { name: 'Push-up', sets: 3, reps: 10, weight: 0 },
        { name: 'Squat', sets: 3, reps: 12, weight: 0 },
        { name: 'Plank', sets: 3, duration: '30 seconds', weight: 0 }
      ];
    }

    // Format exercises with proper sets structure
    const formattedExercises = exercises.map((exercise, index) => ({
      ...exercise,
      id: `fallback_exercise_${index}`,
      sets: exercise.sets || 3,
      reps: exercise.reps || 10,
      weight: exercise.weight || 0,
      primaryMuscles: this.getExerciseMuscles(exercise.name),
      secondaryMuscles: [],
      equipment: 'bodyweight',
      instructions: `Perform ${exercise.name} with proper form`
    }));

    return {
      workout: {
        id: `fallback_workout_${Date.now()}`,
        name: `Basic ${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout`,
        title: `Basic ${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout`,
        type: workoutType,
        exercises: formattedExercises,
        duration: '20-30 minutes',
        difficulty: 'beginner',
        notes: 'Basic workout created as fallback',
        createdAt: new Date(),
        isFallback: true
      },
      success: true,
      message: 'Created a basic workout for you! You can customize it as needed.'
    };
  }

  private getExerciseMuscles(exerciseName: string): string[] {
    const lowerName = exerciseName.toLowerCase();
    if (lowerName.includes('push')) return ['chest', 'triceps', 'shoulders'];
    if (lowerName.includes('pull')) return ['back', 'biceps'];
    if (lowerName.includes('squat')) return ['quadriceps', 'glutes'];
    if (lowerName.includes('lunge')) return ['quadriceps', 'glutes'];
    if (lowerName.includes('plank')) return ['core'];
    return ['full_body'];
  }

  private calculateResponseConfidence(toolResults: any[], intentConfidence: number): number {
    if (toolResults.length === 0) return intentConfidence;

    const successfulTools = toolResults.filter(r => r.success).length;
    const toolSuccessRate = successfulTools / toolResults.length;

    return (intentConfidence + toolSuccessRate) / 2;
  }

  /**
   * Validate and correct tool names to match registered tools
   */
  private validateAndCorrectToolNames(tools: string[]): string[] {
    const toolNameMappings: { [key: string]: string } = {
      'workout_generator': 'create_workout',
      'generate_workout': 'create_workout',
      'workout_creator': 'create_workout',
      'make_workout': 'create_workout',
      'exercise_finder': 'search_exercises',
      'find_exercises': 'search_exercises',
      'exercise_lookup': 'search_exercises',
      'chat': 'general_response',
      'conversation': 'general_response',
      'general_chat': 'general_response'
    };

    const validTools = ['create_workout', 'search_exercises', 'general_response'];
    const correctedTools: string[] = [];

    for (const tool of tools) {
      if (validTools.includes(tool)) {
        correctedTools.push(tool);
      } else if (toolNameMappings[tool]) {
        console.log(`🔧 ProductionAgenticService: Correcting tool name "${tool}" → "${toolNameMappings[tool]}"`);
        correctedTools.push(toolNameMappings[tool]);
      } else {
        console.warn(`⚠️ ProductionAgenticService: Unknown tool "${tool}", skipping`);
      }
    }

    return correctedTools;
  }

  private generateFallbackResponse(userInput: string, sessionId: string, error: any, startTime: number): AgenticAIResponse {
    return {
      content: "I'm having some technical difficulties right now, but I'm here to help with your fitness journey! Could you try rephrasing your request?",
      isStreaming: false,
      confidence: 0.3,
      reasoning: 'Fallback response due to system error',
      metadata: {
        sessionId,
        executionTime: Date.now() - startTime,
        toolsUsed: [],
        fallbacksUsed: ['general_fallback']
      }
    };
  }
}

// Create singleton instance
export const productionAgenticService = new ProductionAgenticService();
