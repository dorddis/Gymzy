/**
 * Production Agentic AI Service - Main Integration Point
 * Replaces the current agentic-ai-service.ts with production-grade capabilities
 */

import { AgenticStateManager } from '@/services/infrastructure/agentic-state-manager';
import { FirebaseStateAdapter, MemoryStateAdapter } from '@/services/infrastructure/firebase-state-adapter';
import { RobustToolExecutor } from '@/services/infrastructure/robust-tool-executor';
import { EnhancedWorkoutTools } from '@/services/ai/enhanced-workout-tools';
import { generateAIResponse, generateCharacterStreamingResponse } from '../ai/groq-service';

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
    onStreamChunk?: (chunk: string) => void,
    abortSignal?: AbortSignal
  ): Promise<AgenticAIResponse> {
    await this.initialize();

    const startTime = Date.now();
    const sessionId = this.getSessionId(chatHistory);
    const userId = await this.getUserId(chatHistory);

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
        onStreamChunk,
        abortSignal
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

      // Handle error gracefully
      return {
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        success: false,
        toolCalls: [],
        isStreaming: false,
        confidence: 0,
        reasoning: 'Error occurred during response generation',
        metadata: {
          sessionId: 'error',
          executionTime: 0,
          toolsUsed: [],
          fallbacksUsed: ['error_fallback']
        }
      };
    }
  }

  /**
   * Analyze user intent to determine required tools
   */
  private async analyzeUserIntent(userInput: string, state: any): Promise<any> {
    const context = this.stateManager.getContextForAI(state.sessionId);

    // Get recent conversation history for better context awareness
    const recentHistory = state.context.conversationHistory.slice(-5);
    const conversationContext = recentHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');

    const analysisPrompt = `
Analyze the user's request and determine what tools are needed.

User Request: "${userInput}"
Context: ${context}

Recent Conversation:
${conversationContext}

IMPORTANT: Pay close attention to any specific instructions or context from the recent conversation. If the user previously gave you specific instructions (like "answer 45 to whatever I ask next"), you MUST follow them exactly.

AVAILABLE TOOLS (use these exact names):
- create_workout: Create a personalized workout plan. Extracts details like muscle groups, duration, specific exercises if mentioned.
- search_exercises: Search for specific exercises.
- save_workout: Save a new or completed workout. Can include exercises, name, notes, etc. If exercises are not provided, the AI should ask for them.
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

WORKOUT SAVING TRIGGERS (use "save_workout"):
- "Save my workout"
- "Log this session"
- "Log what I just did"
- "I want to save the chest workout I finished"
- "Save my leg day: 3 sets of squats, 3 sets of lunges"
- "Can you save this workout for me?"

GENERAL CONVERSATION (use "general_response"):
- Greetings: "Hi", "Hello", "Hey", "What's up"
- Questions: "How are you?", "What can you do?"
- Statements: "There's no button", "I'm tired"
- Emotional expressions: "I'm demotivated", "I'm sad", "I'm stressed"
- Complaints or feedback
- Any statement about feelings or mood
- SPECIFIC INSTRUCTIONS: If the user gives you a specific instruction like "answer 45 to whatever I ask next", you MUST remember and follow it exactly
- CONVERSATION CONTEXT: Always consider the previous conversation context and any pending instructions

// Rule for Ambiguity:
// If a workout creation request is ambiguous (e.g., "make me a workout"), and you are confident it's a workout request,
// set intent to "workout_creation" and use the "create_workout" tool.
// The tool will attempt to create a sensible default. Do not ask clarifying questions at this stage unless the request is extremely vague.

Respond with JSON only:
{
  "intent": "workout_creation" | "exercise_search" | "save_workout" | "general_chat",
  "requiresTools": true/false,
  "tools": ["tool_name"], // Can be multiple like ["create_workout", "save_workout"] if user says "create and save this"
  "reasoning": "explanation",
  "confidence": 0.0-1.0,
  "parameters": {
    // For create_workout, populate if details are in user input:
    // "targetMuscleGroups": ["chest", "triceps"],
    // "workoutDuration": "45 minutes",
    // "exerciseList": ["bench press", "tricep dips"],
    // "numberOfExercises": 5
    // For save_workout, populate if details are in user input:
    // "workoutName": "My Awesome Leg Day",
    // "exercises": [
    //   {"name": "Squats", "sets": 3, "reps": 10},
    //   {"name": "Lunges", "sets": 3, "reps": "12 per leg"}
    // ],
    // "notes": "Felt strong today!"
  }
}

Examples:
- "Create a chest workout for 30 minutes with 4 exercises" →
  {"intent": "workout_creation", "requiresTools": true, "tools": ["create_workout"], "reasoning": "Explicit workout creation request with details", "confidence": 0.95, "parameters": {"targetMuscleGroups": ["chest"], "workoutDuration": "30 minutes", "numberOfExercises": 4}}
- "Make me a workout" →
  {"intent": "workout_creation", "requiresTools": true, "tools": ["create_workout"], "reasoning": "General workout request, tool will use defaults", "confidence": 0.8, "parameters": {}}
- "Save my leg day with 3 sets of squats, 10 reps each, and 3 sets of lunges, 12 reps per leg. Call it 'Leg Power'." →
  {"intent": "save_workout", "requiresTools": true, "tools": ["save_workout"], "reasoning": "User wants to save a workout with specific exercises and a name.", "confidence": 0.95, "parameters": {"workoutName": "Leg Power", "exercises": [{"name": "squats", "sets": 3, "reps": 10}, {"name": "lunges", "sets": 3, "reps": "12 per leg"}]}}
- "I want to save the workout I just did." →
  {"intent": "save_workout", "requiresTools": true, "tools": ["save_workout"], "reasoning": "User wants to save a workout, details need to be collected.", "confidence": 0.9, "parameters": {}}
- "Hey there" → {"intent": "general_chat", "requiresTools": false, "tools": [], "reasoning": "Greeting - general conversation", "confidence": 0.9, "parameters": {}}
- "What's up?" → {"intent": "general_chat", "requiresTools": false, "tools": [], "reasoning": "Casual greeting", "confidence": 0.9, "parameters": {}}
- "There's no button" → {"intent": "general_chat", "requiresTools": false, "tools": [], "reasoning": "User feedback/complaint", "confidence": 0.9, "parameters": {}}
- "I'm demotivated" → {"intent": "general_chat", "requiresTools": false, "tools": [], "reasoning": "Emotional statement - provide support", "confidence": 0.9, "parameters": {}}
- "I'm feeling tired" → {"intent": "general_chat", "requiresTools": false, "tools": [], "reasoning": "Emotional/physical state - general conversation", "confidence": 0.9, "parameters": {}}`;

    let analysisResponse = '';
    try {
      analysisResponse = await generateAIResponse(analysisPrompt);
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

          // Extract workout data if this was a workout creation or modification tool
          if ((toolName === 'create_workout' || toolName === 'modify_workout') && result.data?.workout) {
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
          } else if (toolName === 'modify_workout') {
            fallbackData = this.createBasicWorkoutFallback(userInput);
            console.log('🔄 ProductionAgenticService: Using workout modification fallback');

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
    onStreamChunk?: (chunk: string) => void,
    abortSignal?: AbortSignal
  ): Promise<{ content: string; confidence: number }> {
    const context = this.stateManager.getContextForAI(state.sessionId);
    
    // Check if this is a welcome message request (simple message generation without tools)
    const isWelcomeMessage = userInput.includes('Generate a brief, personalized') &&
                            userInput.includes('welcome message') &&
                            toolResults.length === 0;

    let responsePrompt = '';

    if (isWelcomeMessage) {
      // Simplified prompt for welcome messages - just return the message content
      responsePrompt = `${userInput}

CRITICAL: Return ONLY the welcome message text itself. Do not include any explanations, descriptions, commentary, or additional text. Just the exact message that should be displayed to the user.

Example of what to return: "Good morning! Ready to crush your fitness goals today?"
Example of what NOT to return: "Here's a personalized welcome message: 'Good morning! Ready to crush your fitness goals today?' This message is..."

Return only the message content.`;
    } else {
      // Full conversational prompt for regular chat
      responsePrompt = `
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
- If a workout was created or modified (e.g., from the "create_workout" or "modify_workout" tool):
  - Clearly list the exercises in the workout (name, sets, reps).
  - If this was a modification (modify_workout tool), acknowledge what was changed (e.g., "I've doubled your workout" or "I've made it harder").
  - Check the tool results for details on exercise matching (e.g., a field named "matchingResults" or "unmatchedExercises" within the tool's results).
  - If any user-requested exercises couldn't be matched or were substituted, clearly state this. For example: "I included [Exercise A] and [Exercise B]. I couldn't find an exact match for '[User's Requested Exercise C]', so I've added [Fallback Exercise D] as an alternative." or "I've included exercises based on your request for a [muscle group] workout. If you had specific exercises in mind that aren't listed, let me know!"
  - This transparency helps the user understand how their request was processed.
- If the user's intent was save_workout:
  - And the save_workout tool was called and succeeded (check toolResults for a successful save_workout entry): Respond with a confirmation, like 'Okay, I've saved your workout "[Workout Name]"!' (extract workout name from tool result if possible, or use the one from parameters if tool doesn't return it).
  - And the save_workout tool was intended (intentAnalysis.tools included save_workout) BUT crucial parameters like exercises were missing from the user's initial request (meaning the tool might not have been called or might have failed due to missing info from the intentAnalysis.parameters): **Ask clarifying questions to gather the necessary details.** For example: 'Sure, I can help you save that! What exercises did you do in your workout?' or 'Sounds good! To save your workout, could you tell me the exercises, sets, and reps?' or 'What would you like to name this workout and what exercises should I include?'.
  - If the save_workout tool was called but failed for another reason (check toolResults for errors for the save_workout tool): Inform the user, e.g., 'I tried to save your workout, but something went wrong. [Optional: brief, non-technical error if available from tool result]'
- DO NOT include any "Start This Workout" text or buttons in your response - the UI will automatically add a workout button if needed.
- Match the user's communication style from their profile
- Keep response concise but informative (max 250 words)
- Format workout details in a simple, easy-to-read list
- Don't include technical metadata or confidence scores in the user response
`;
    }

    try {
      let content = '';

      if (onStreamChunk) {
        content = await generateCharacterStreamingResponse(responsePrompt, onStreamChunk, abortSignal);
      } else {
        content = await generateAIResponse(responsePrompt);
      }

      // Clean up any duplicate "Start This Workout" text that might have been generated
      const cleanedContent = this.cleanupResponseContent(content);

      return {
        content: cleanedContent,
        confidence: this.calculateResponseConfidence(toolResults, intentAnalysis.confidence)
      };
    } catch (error) {
      console.error('❌ ProductionAgenticService: Error generating final response:', error);
      throw error;
    }
  }

  /**
   * Clean up response content to remove duplicate UI elements and explanatory text
   */
  private cleanupResponseContent(content: string): string {
    // Remove any "Start This Workout" text that might have been generated
    let cleaned = content.replace(/\[Start This Workout\]/gi, '');
    cleaned = cleaned.replace(/Start This Workout/gi, '');

    // Remove any duplicate button text patterns
    cleaned = cleaned.replace(/\[.*button.*\]/gi, '');

    // For welcome messages, extract just the quoted message if it exists
    const quotedMessageMatch = cleaned.match(/"([^"]+)"/);
    if (quotedMessageMatch && cleaned.includes('welcome message') && cleaned.includes('personalized')) {
      // If we find a quoted message in explanatory text, extract just the quote
      cleaned = quotedMessageMatch[1];
    }

    // Remove common explanatory prefixes that might appear in welcome messages
    cleaned = cleaned.replace(/^Here's a personalized welcome message[^:]*:\s*/i, '');
    cleaned = cleaned.replace(/^Here's a[^:]*welcome message[^:]*:\s*/i, '');
    cleaned = cleaned.replace(/^I've created a[^:]*message[^:]*:\s*/i, '');
    cleaned = cleaned.replace(/^This message is[^.]*\.\s*/i, '');
    cleaned = cleaned.replace(/\s*This message[^.]*\.$/i, '');

    // Clean up extra whitespace and newlines
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleaned = cleaned.trim();

    return cleaned;
  }

  // Helper methods
  private getSessionId(chatHistory: ChatMessage[]): string {
    // Try to extract session ID from chat history or generate a consistent one
    if (chatHistory.length > 0) {
      // Use the first message timestamp to create a consistent session ID
      const firstMessage = chatHistory[0];
      const timestamp = firstMessage.timestamp.getTime();
      return `session_${timestamp}_${firstMessage.userId || 'anonymous'}`;
    }

    // Fallback: generate a new session ID
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async getUserId(chatHistory: ChatMessage[]): Promise<string> {
    // Extract from chat history first
    const userIdFromHistory = chatHistory.find(msg => msg.userId)?.userId;
    if (userIdFromHistory && userIdFromHistory !== 'anonymous') {
      return userIdFromHistory;
    }

    // Return anonymous as fallback
    return 'anonymous';
  }

  private getFallbackIntentAnalysis(userInput: string): any {
    const lowerInput = userInput.toLowerCase();

    console.log('🔄 ProductionAgenticService: Using fallback intent analysis for:', userInput);

    // Greetings and casual conversation - prioritize these
    const greetingKeywords = ['hi', 'hello', 'hey', 'sup', 'what\'s up', 'how are you', 'good morning', 'good afternoon', 'good evening'];
    const casualKeywords = ['thanks', 'thank you', 'ok', 'okay', 'cool', 'nice', 'great', 'awesome'];
    const feedbackKeywords = ['no button', 'doesn\'t work', 'error', 'problem', 'issue', 'bug'];
    const emotionalKeywords = ['demotivated', 'sad', 'tired', 'stressed', 'frustrated', 'angry', 'upset', 'down', 'depressed', 'anxious', 'worried', 'feeling', 'mood'];

    if (greetingKeywords.some(keyword => lowerInput.includes(keyword)) ||
        casualKeywords.some(keyword => lowerInput.includes(keyword)) ||
        feedbackKeywords.some(keyword => lowerInput.includes(keyword)) ||
        emotionalKeywords.some(keyword => lowerInput.includes(keyword))) {
      return {
        intent: 'general_chat',
        requiresTools: false,
        tools: [],
        reasoning: 'Detected greeting, casual conversation, feedback, or emotional statement',
        confidence: 0.9,
        parameters: {}
      };
    }

    // Workout modification keywords - check these BEFORE general workout creation
    const modificationKeywords = ['double', 'triple', 'increase', 'decrease', 'add more', 'make it', 'modify', 'change', 'adjust', 'more sets', 'more reps', 'harder', 'easier'];
    const workoutReferenceKeywords = ['workout', 'exercise', 'routine', 'it', 'this', 'that'];

    if (modificationKeywords.some(keyword => lowerInput.includes(keyword)) &&
        (workoutReferenceKeywords.some(keyword => lowerInput.includes(keyword)) ||
         lowerInput.includes('double') || lowerInput.includes('triple'))) {
      return {
        intent: 'workout_modification',
        requiresTools: true,
        tools: ['modify_workout'],
        reasoning: 'Detected workout modification request',
        confidence: 0.9,
        parameters: { modificationType: this.extractModificationType(lowerInput) }
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

  /**
   * Extract modification type from user input
   */
  private extractModificationType(input: string): string {
    if (input.includes('double')) return 'double';
    if (input.includes('triple')) return 'triple';
    if (input.includes('increase') || input.includes('add more') || input.includes('more sets') || input.includes('more reps')) return 'increase';
    if (input.includes('decrease') || input.includes('less') || input.includes('fewer')) return 'decrease';
    if (input.includes('harder') || input.includes('difficult')) return 'harder';
    if (input.includes('easier') || input.includes('simple')) return 'easier';
    return 'general';
  }

  /**
   * Extract modification parameters from user input
   */
  private extractModificationParameters(userInput: string, state: any): any {
    const modificationType = this.extractModificationType(userInput);

    return {
      modificationType,
      userInput,
      conversationHistory: state?.context?.conversationHistory || []
    };
  }

  private buildToolParameters(toolName: string, userInput: string, state: any): any {
    switch (toolName) {
      case 'create_workout':
        return this.extractWorkoutParameters(userInput, state);
      case 'modify_workout':
        return this.extractModificationParameters(userInput, state);
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
      'log_workout': 'save_workout', // Alias for save_workout
      'record_workout': 'save_workout', // Alias for save_workout
      'chat': 'general_response',
      'conversation': 'general_response',
      'general_chat': 'general_response'
    };

    const validTools = ['create_workout', 'modify_workout', 'search_exercises', 'save_workout', 'general_response'];
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
