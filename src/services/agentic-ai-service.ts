import { generateAIResponse, generateCharacterStreamingResponse } from './ai-service';
import { AI_WORKOUT_TOOLS, executeAITool, WorkoutExercise } from './ai-workout-tools';

export interface AgenticAIResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    parameters: any;
    result: any;
  }>;
  workoutData?: {
    exercises: WorkoutExercise[];
    workoutId: string;
  };
  isStreaming?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    name: string;
    parameters: any;
    result: any;
  }>;
  workoutData?: {
    exercises: WorkoutExercise[];
    workoutId: string;
  };
}

export class AgenticAIService {
  private availableTools = [
    {
      name: 'create_workout',
      description: 'Create a custom workout with exercises, sets, and reps based on user requirements',
      parameters: {
        type: 'object',
        properties: {
          workoutName: { type: 'string', description: 'Name of the workout' },
          exercises: { 
            type: 'array', 
            description: 'List of exercises with sets and reps',
            items: {
              type: 'object',
              properties: {
                exerciseId: { type: 'string' },
                name: { type: 'string' },
                sets: { type: 'number' },
                reps: { type: 'number' }
              }
            }
          },
          targetMuscles: { type: 'array', items: { type: 'string' } }
        },
        required: ['workoutName', 'exercises']
      }
    },
    {
      name: 'search_exercises',
      description: 'Search for exercises by muscle group, equipment, or exercise name',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query for exercises' },
          limit: { type: 'number', description: 'Maximum number of results', default: 5 }
        },
        required: ['query']
      }
    },
    {
      name: 'suggest_workout_plan',
      description: 'Suggest a workout plan based on user goals and experience level',
      parameters: {
        type: 'object',
        properties: {
          goal: { type: 'string', enum: ['strength', 'muscle_gain', 'weight_loss', 'endurance', 'general_fitness'] },
          experience: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
          duration: { type: 'number', description: 'Workout duration in minutes' }
        },
        required: ['goal', 'experience']
      }
    }
  ];

  async generateAgenticResponse(
    userInput: string,
    chatHistory: ChatMessage[],
    onStreamChunk?: (chunk: string) => void
  ): Promise<AgenticAIResponse> {
    try {
      console.log('🤖 AgenticAI: ===== STARTING RESPONSE GENERATION =====');
      console.log('🤖 AgenticAI: User input:', userInput);
      console.log('🤖 AgenticAI: Chat history length:', chatHistory.length);
      console.log('🤖 AgenticAI: Streaming enabled:', !!onStreamChunk);

      // Create a comprehensive prompt for the AI agent
      console.log('📝 AgenticAI: Building system prompt...');
      const systemPrompt = this.buildSystemPrompt();
      const contextualPrompt = this.buildContextualPrompt(userInput, chatHistory);
      console.log('📝 AgenticAI: System prompt length:', systemPrompt.length);
      console.log('📝 AgenticAI: Contextual prompt length:', contextualPrompt.length);

      // First, let the AI decide which tools to use
      console.log('🔍 AgenticAI: Getting tool decision...');
      const toolDecisionPrompt = `${systemPrompt}\n\n${contextualPrompt}\n\nAnalyze the user's request and determine which tools (if any) should be used. Respond with a JSON object containing your analysis and tool calls.`;

      const toolDecision = await this.getToolDecision(toolDecisionPrompt);
      console.log('🔍 AgenticAI: Tool decision received:', JSON.stringify(toolDecision, null, 2));

      let toolCalls: any[] = [];
      let workoutData: any = null;
      let responseContent = '';

      // Execute tools if needed
      if (toolDecision.toolCalls && toolDecision.toolCalls.length > 0) {
        console.log('🛠️ AgenticAI: Executing tools...');
        console.log('🛠️ AgenticAI: Number of tools to execute:', toolDecision.toolCalls.length);

        for (const toolCall of toolDecision.toolCalls) {
          console.log(`🛠️ AgenticAI: Executing tool: ${toolCall.name}`);
          console.log(`🛠️ AgenticAI: Tool parameters:`, JSON.stringify(toolCall.parameters, null, 2));

          try {
            const result = await executeAITool(toolCall.name, toolCall.parameters);
            console.log(`✅ AgenticAI: Tool ${toolCall.name} executed successfully`);
            console.log(`✅ AgenticAI: Tool result:`, JSON.stringify(result, null, 2));

            toolCalls.push({
              name: toolCall.name,
              parameters: toolCall.parameters,
              result
            });

            // Handle workout creation specifically
            if (toolCall.name === 'create_workout' && result.exercises) {
              workoutData = {
                exercises: result.exercises,
                workoutId: result.workoutId
              };
              console.log('💪 AgenticAI: Workout data extracted:', JSON.stringify(workoutData, null, 2));
            }
          } catch (error) {
            console.error(`❌ AgenticAI: Error executing tool ${toolCall.name}:`, error);
            console.error(`❌ AgenticAI: Error stack:`, error instanceof Error ? error.stack : 'No stack trace');

            toolCalls.push({
              name: toolCall.name,
              parameters: toolCall.parameters,
              result: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
          }
        }

        console.log('🛠️ AgenticAI: All tools executed. Total successful tool calls:', toolCalls.length);
      } else {
        console.log('🛠️ AgenticAI: No tools needed for this request');
      }
      
      // Generate the final response with tool results
      console.log('📝 AgenticAI: Building final response prompt...');
      const finalPrompt = this.buildFinalResponsePrompt(userInput, toolCalls, toolDecision.reasoning);
      console.log('📝 AgenticAI: Final prompt length:', finalPrompt.length);
      console.log('📝 AgenticAI: Final prompt preview:', finalPrompt.substring(0, 200) + '...');

      if (onStreamChunk) {
        console.log('🌊 AgenticAI: Using streaming response for final prompt');
        responseContent = await this.generateStreamingResponse(finalPrompt, onStreamChunk);
      } else {
        console.log('📄 AgenticAI: Using non-streaming response for final prompt');
        responseContent = await generateAIResponse(finalPrompt);
      }

      console.log('✅ AgenticAI: Final response generated, length:', responseContent.length);
      console.log('✅ AgenticAI: Response preview:', responseContent.substring(0, 100) + '...');

      const finalResult = {
        content: responseContent,
        toolCalls,
        workoutData,
        isStreaming: !!onStreamChunk
      };

      console.log('🎯 AgenticAI: Final result summary:');
      console.log('🎯 AgenticAI: - Content length:', finalResult.content.length);
      console.log('🎯 AgenticAI: - Tool calls count:', finalResult.toolCalls.length);
      console.log('🎯 AgenticAI: - Has workout data:', !!finalResult.workoutData);
      console.log('🎯 AgenticAI: - Is streaming:', finalResult.isStreaming);
      console.log('🤖 AgenticAI: ===== RESPONSE GENERATION COMPLETE =====');

      return finalResult;
      
    } catch (error) {
      console.error('❌ AgenticAI: CRITICAL ERROR in response generation:', error);
      console.error('❌ AgenticAI: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❌ AgenticAI: User input that caused error:', userInput);

      const errorResult = {
        content: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
        toolCalls: [],
        workoutData: undefined,
        isStreaming: !!onStreamChunk
      };

      console.log('❌ AgenticAI: Returning error result:', JSON.stringify(errorResult, null, 2));
      return errorResult;
    }
  }

  private buildSystemPrompt(): string {
    return `You are Gymzy, an advanced AI fitness coach and personal trainer. You are an agentic AI system with access to powerful tools for creating workouts, searching exercises, and providing personalized fitness guidance.

Your capabilities include:
- Creating custom workouts with specific exercises, sets, and reps
- Searching through a comprehensive exercise database
- Suggesting workout plans based on goals and experience
- Providing form tips, nutrition advice, and motivation
- Analyzing workout data and providing insights

You should:
- Be encouraging, motivational, and supportive
- Provide detailed, actionable advice
- Use tools when appropriate to enhance your responses
- Format responses clearly with markdown for better readability
- Always prioritize user safety and proper form
- Adapt recommendations based on user's experience level and goals

Available tools: ${this.availableTools.map(tool => `${tool.name}: ${tool.description}`).join(', ')}`;
  }

  private buildContextualPrompt(userInput: string, chatHistory: ChatMessage[]): string {
    const recentHistory = chatHistory.slice(-5).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');
    
    return `Recent conversation:
${recentHistory}

Current user request: ${userInput}

Please analyze this request and provide a helpful response. Use tools when appropriate to enhance your answer.`;
  }

  private async getToolDecision(prompt: string): Promise<{
    reasoning: string;
    toolCalls: Array<{ name: string; parameters: any }>;
  }> {
    try {
      console.log('🔍 AgenticAI: Requesting tool decision from AI...');
      const fullPrompt = `${prompt}\n\nRespond with a JSON object in this format:
{
  "reasoning": "Brief explanation of your analysis",
  "toolCalls": [
    {
      "name": "tool_name",
      "parameters": { "param1": "value1" }
    }
  ]
}

If no tools are needed, return an empty toolCalls array.`;

      console.log('🔍 AgenticAI: Tool decision prompt length:', fullPrompt.length);

      const decision = await generateAIResponse(fullPrompt);
      console.log('🔍 AgenticAI: Raw tool decision response:', decision);

      // Try to parse the JSON response
      const jsonMatch = decision.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('🔍 AgenticAI: Found JSON in response:', jsonMatch[0]);
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('🔍 AgenticAI: Parsed tool decision:', JSON.stringify(parsed, null, 2));
        return parsed;
      }

      console.log('🔍 AgenticAI: No JSON found in response, returning default');
      return { reasoning: "No tools needed", toolCalls: [] };
    } catch (error) {
      console.error('❌ AgenticAI: Error in tool decision:', error);
      console.error('❌ AgenticAI: Tool decision error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return { reasoning: "Error in analysis", toolCalls: [] };
    }
  }

  private buildFinalResponsePrompt(
    userInput: string, 
    toolResults: any[], 
    reasoning: string
  ): string {
    let prompt = `Based on the user's request: "${userInput}"\n\n`;
    
    if (toolResults.length > 0) {
      prompt += `I've executed the following tools:\n`;
      toolResults.forEach(tool => {
        prompt += `- ${tool.name}: ${JSON.stringify(tool.result, null, 2)}\n`;
      });
      prompt += `\n`;
    }
    
    prompt += `Reasoning: ${reasoning}\n\n`;
    prompt += `Please provide a comprehensive, well-formatted response using markdown. Be encouraging and helpful. If you created a workout, explain the exercises and offer to start the workout.`;
    
    return prompt;
  }

  private async generateStreamingResponse(
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      console.log('🌊 AgenticAI: Starting character streaming...');
      console.log('🌊 AgenticAI: Prompt length for streaming:', prompt.length);

      const result = await generateCharacterStreamingResponse(prompt, onChunk);

      console.log('🌊 AgenticAI: Streaming completed successfully');
      console.log('🌊 AgenticAI: Final streamed content length:', result.length);

      return result;
    } catch (error) {
      console.error('❌ AgenticAI: Error in streaming response:', error);
      console.error('❌ AgenticAI: Streaming error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.log('🔄 AgenticAI: Falling back to regular response...');

      // Fallback to regular response
      const fallbackResult = await generateAIResponse(prompt);
      console.log('🔄 AgenticAI: Fallback response length:', fallbackResult.length);

      return fallbackResult;
    }
  }
}

export const agenticAI = new AgenticAIService();
