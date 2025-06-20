import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { invokeIntelligentAgent } from "../langchain/intelligent-agent-graph";
import { generateCharacterStreamingResponse } from "./groq-service";

export interface IntelligentAgenticResponse {
  content: string;
  workoutData?: any;
  confidence: number;
  reasoning: string;
  success: boolean;
  isStreaming: boolean;
  metadata: {
    steps_completed: string[];
    execution_time: number;
    error_state?: string;
    intelligence_level: 'high' | 'medium' | 'low';
  };
}

export class IntelligentAgenticService {
  private conversationMemory: Map<string, BaseMessage[]> = new Map();

  /**
   * Main entry point for intelligent agentic responses
   */
  async generateIntelligentResponse(
    userInput: string,
    userId: string,
    sessionId: string,
    onStreamChunk?: (chunk: string) => void
  ): Promise<IntelligentAgenticResponse> {
    const startTime = Date.now();
    console.log(`🧠 IntelligentAgenticService: Processing request for user ${userId}`);

    try {
      // Get conversation history
      const conversationHistory = this.getConversationHistory(sessionId);

      // Check if this is a workout-related request
      if (this.isWorkoutRelated(userInput)) {
        console.log("🏋️ Detected workout-related request, using intelligent agent");
        return await this.handleWorkoutRequest(userInput, conversationHistory, userId, sessionId, onStreamChunk);
      } else {
        console.log("💬 Detected general conversation, using standard response");
        return await this.handleGeneralConversation(userInput, conversationHistory, userId, sessionId, onStreamChunk);
      }

    } catch (error) {
      console.error("❌ IntelligentAgenticService: Error:", error);
      return this.createErrorResponse(userInput, sessionId, error, startTime);
    }
  }

  /**
   * Handle workout-related requests with intelligent agent
   */
  private async handleWorkoutRequest(
    userInput: string,
    conversationHistory: BaseMessage[],
    userId: string,
    sessionId: string,
    onStreamChunk?: (chunk: string) => void
  ): Promise<IntelligentAgenticResponse> {
    
    // Use the intelligent agent for workout requests
    const agentResult = await invokeIntelligentAgent(userInput, conversationHistory, userId);

    // Update conversation memory
    this.updateConversationMemory(sessionId, userInput, agentResult.content);

    // Stream the response if callback provided
    if (onStreamChunk && agentResult.content) {
      await this.streamResponse(agentResult.content, onStreamChunk);
    }

    return {
      content: agentResult.content,
      workoutData: agentResult.workoutData,
      confidence: agentResult.confidence,
      reasoning: agentResult.reasoning,
      success: agentResult.success,
      isStreaming: !!onStreamChunk,
      metadata: {
        ...agentResult.metadata,
        intelligence_level: this.assessIntelligenceLevel(agentResult)
      }
    };
  }

  /**
   * Handle general conversation with context awareness
   */
  private async handleGeneralConversation(
    userInput: string,
    conversationHistory: BaseMessage[],
    userId: string,
    sessionId: string,
    onStreamChunk?: (chunk: string) => void
  ): Promise<IntelligentAgenticResponse> {

    // Build context-aware prompt for general conversation
    const contextPrompt = this.buildGeneralConversationPrompt(userInput, conversationHistory, userId);

    let responseContent = "";

    if (onStreamChunk) {
      // Use streaming for general conversation
      responseContent = await generateCharacterStreamingResponse(
        contextPrompt,
        onStreamChunk,
        () => {}, // onComplete
        (error) => console.error("Streaming error:", error)
      );
    } else {
      // Non-streaming response
      const { generateAIResponse } = await import("./groq-service");
      responseContent = await generateAIResponse(contextPrompt);
    }

    // Update conversation memory
    this.updateConversationMemory(sessionId, userInput, responseContent);

    return {
      content: responseContent,
      confidence: 0.8,
      reasoning: "Generated contextual response using conversation history",
      success: true,
      isStreaming: !!onStreamChunk,
      metadata: {
        steps_completed: ["general_conversation"],
        execution_time: 0,
        intelligence_level: 'medium'
      }
    };
  }

  /**
   * Check if user input is workout-related
   */
  private isWorkoutRelated(userInput: string): boolean {
    const workoutKeywords = [
      'workout', 'exercise', 'training', 'fitness', 'gym',
      'muscle', 'strength', 'cardio', 'reps', 'sets',
      'tricep', 'bicep', 'chest', 'back', 'legs', 'shoulders',
      'abs', 'core', 'calves', 'glutes', 'quads',
      'create', 'build', 'design', 'make', 'generate'
    ];

    const lowerInput = userInput.toLowerCase();
    return workoutKeywords.some(keyword => lowerInput.includes(keyword));
  }

  /**
   * Build context-aware prompt for general conversation
   */
  private buildGeneralConversationPrompt(
    userInput: string,
    conversationHistory: BaseMessage[],
    userId: string
  ): string {
    const recentHistory = conversationHistory.slice(-6); // Last 3 exchanges
    const historyText = recentHistory.map(msg => 
      `${msg instanceof HumanMessage ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    return `You are Gymzy, a friendly AI fitness coach. You're having a conversation with a user.

Recent conversation:
${historyText}

Current user message: "${userInput}"

Respond naturally and helpfully. Keep your response conversational and appropriate to the context. If the user is asking about fitness topics, provide helpful guidance. If they're just chatting, be friendly and engaging.

Keep your response concise (1-3 sentences) unless the user specifically asks for detailed information.`;
  }

  /**
   * Stream response content
   */
  private async streamResponse(content: string, onStreamChunk: (chunk: string) => void): Promise<void> {
    // Split content into words for more natural streaming
    const words = content.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const chunk = i === 0 ? words[i] : ' ' + words[i];
      onStreamChunk(chunk);
      
      // Small delay for natural streaming effect
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Get conversation history for a session
   */
  private getConversationHistory(sessionId: string): BaseMessage[] {
    return this.conversationMemory.get(sessionId) || [];
  }

  /**
   * Update conversation memory
   */
  private updateConversationMemory(sessionId: string, userInput: string, assistantResponse: string): void {
    const history = this.getConversationHistory(sessionId);
    
    // Add new messages
    history.push(new HumanMessage(userInput));
    history.push(new AIMessage(assistantResponse));
    
    // Keep only last 20 messages (10 exchanges)
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    
    this.conversationMemory.set(sessionId, history);
  }

  /**
   * Assess intelligence level of the response
   */
  private assessIntelligenceLevel(agentResult: any): 'high' | 'medium' | 'low' {
    const stepsCompleted = agentResult.metadata.steps_completed.length;
    const confidence = agentResult.confidence;
    
    if (stepsCompleted >= 4 && confidence > 0.8) return 'high';
    if (stepsCompleted >= 2 && confidence > 0.6) return 'medium';
    return 'low';
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    userInput: string,
    sessionId: string,
    error: any,
    startTime: number
  ): IntelligentAgenticResponse {
    return {
      content: "I'm having some technical difficulties right now, but I'm here to help with your fitness journey! Could you try rephrasing your request?",
      confidence: 0.3,
      reasoning: `Error occurred: ${error.message}`,
      success: false,
      isStreaming: false,
      metadata: {
        steps_completed: ["error"],
        execution_time: Date.now() - startTime,
        error_state: "service_error",
        intelligence_level: 'low'
      }
    };
  }

  /**
   * Clear conversation memory for a session
   */
  clearConversationMemory(sessionId: string): void {
    this.conversationMemory.delete(sessionId);
  }
}

// Create singleton instance
export const intelligentAgenticService = new IntelligentAgenticService();
