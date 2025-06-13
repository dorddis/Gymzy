import { generateAIResponse } from './ai-service';
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
      // Create a comprehensive prompt for the AI agent
      const systemPrompt = this.buildSystemPrompt();
      const contextualPrompt = this.buildContextualPrompt(userInput, chatHistory);
      
      // First, let the AI decide which tools to use
      const toolDecisionPrompt = `${systemPrompt}\n\n${contextualPrompt}\n\nAnalyze the user's request and determine which tools (if any) should be used. Respond with a JSON object containing your analysis and tool calls.`;
      
      const toolDecision = await this.getToolDecision(toolDecisionPrompt);
      
      let toolCalls: any[] = [];
      let workoutData: any = null;
      let responseContent = '';
      
      // Execute tools if needed
      if (toolDecision.toolCalls && toolDecision.toolCalls.length > 0) {
        for (const toolCall of toolDecision.toolCalls) {
          try {
            const result = await executeAITool(toolCall.name, toolCall.parameters);
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
            }
          } catch (error) {
            console.error(`Error executing tool ${toolCall.name}:`, error);
          }
        }
      }
      
      // Generate the final response with tool results
      const finalPrompt = this.buildFinalResponsePrompt(userInput, toolCalls, toolDecision.reasoning);
      
      if (onStreamChunk) {
        responseContent = await this.generateStreamingResponse(finalPrompt, onStreamChunk);
      } else {
        responseContent = await generateAIResponse(finalPrompt);
      }
      
      return {
        content: responseContent,
        toolCalls,
        workoutData,
        isStreaming: !!onStreamChunk
      };
      
    } catch (error) {
      console.error('Error in agentic AI response:', error);
      return {
        content: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
        toolCalls: [],
        workoutData: null
      };
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
      const decision = await generateAIResponse(`${prompt}\n\nRespond with a JSON object in this format:
{
  "reasoning": "Brief explanation of your analysis",
  "toolCalls": [
    {
      "name": "tool_name",
      "parameters": { "param1": "value1" }
    }
  ]
}

If no tools are needed, return an empty toolCalls array.`);
      
      // Try to parse the JSON response
      const jsonMatch = decision.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { reasoning: "No tools needed", toolCalls: [] };
    } catch (error) {
      console.error('Error in tool decision:', error);
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
    // For now, simulate streaming by breaking the response into chunks
    const fullResponse = await generateAIResponse(prompt);
    const words = fullResponse.split(' ');
    let currentResponse = '';
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i] + ' ';
      currentResponse += word;
      onChunk(word);
      
      // Add a small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return currentResponse.trim();
  }
}

export const agenticAI = new AgenticAIService();
