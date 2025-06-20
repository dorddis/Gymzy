/**
 * Intelligent AI Router
 * Routes AI requests to the most appropriate service based on complexity and requirements
 */

import { generateAIResponse, generateCharacterStreamingResponse } from './groq-service';
import { generateAIResponseServer } from './groq-service';

export interface AIRequest {
  prompt: string;
  context?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userId?: string;
  requiresReasoning?: boolean;
}

export interface AIResponse {
  content: string;
  success: boolean;
  confidence?: number;
  apiUsed?: 'groq' | 'gemini';
  error?: string;
}

class IntelligentAIRouter {
  /**
   * Route request to the most appropriate AI service
   */
  async routeRequest(request: AIRequest, onStreamChunk?: (chunk: string) => void): Promise<AIResponse> {
    try {
      console.log('🧠 AIRouter: Routing request...');

      // Analyze complexity and determine best API
      const complexity = this.analyzeComplexity(request.prompt);
      const selectedAPI = this.selectAPI(complexity, request.requiresReasoning || false);

      console.log(`🧠 AIRouter: Complexity: ${complexity}, Selected API: ${selectedAPI}`);

      let content: string;

      if (selectedAPI === 'groq') {
        // Use Groq for complex reasoning (server-side only)
        if (typeof window === 'undefined') {
          content = await generateAIResponseServer(request.prompt);
        } else {
          // Fallback to Gemini on client-side
          content = await this.useGeminiAPI(request, onStreamChunk);
        }
      } else {
        // Use Gemini for simple tasks
        content = await this.useGeminiAPI(request, onStreamChunk);
      }

      return {
        content,
        success: true,
        confidence: 0.8,
        apiUsed: selectedAPI
      };

    } catch (error) {
      console.error('❌ AIRouter: Error routing request:', error);
      return {
        content: "I'm having trouble processing your request right now. Please try again.",
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Use Gemini API for processing
   */
  private async useGeminiAPI(request: AIRequest, onStreamChunk?: (chunk: string) => void): Promise<string> {
    const prompt = this.buildPrompt(request);

    if (onStreamChunk) {
      // Use streaming response
      return await generateCharacterStreamingResponse(
        prompt,
        onStreamChunk,
        () => {}, // onComplete
        (error) => console.error('Streaming error:', error) // onError
      );
    } else {
      // Use standard response
      return await generateAIResponse(prompt);
    }
  }

  /**
   * Build a comprehensive prompt from the request
   */
  private buildPrompt(request: AIRequest): string {
    let prompt = request.prompt;

    // Add context if available
    if (request.context) {
      prompt = `Context: ${request.context}\n\nUser Request: ${prompt}`;
    }

    // Add conversation history if available
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      const history = request.conversationHistory
        .slice(-5) // Only use last 5 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      prompt = `Previous conversation:\n${history}\n\nCurrent request: ${prompt}`;
    }

    return prompt;
  }

  /**
   * Analyze request complexity
   */
  private analyzeComplexity(prompt: string): 'simple' | 'moderate' | 'complex' {
    const complexKeywords = ['workout', 'exercise', 'create', 'generate', 'modify', 'double'];
    const moderateKeywords = ['help', 'advice', 'recommend', 'suggest'];
    
    const lowerPrompt = prompt.toLowerCase();
    
    if (complexKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      return 'complex';
    } else if (moderateKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      return 'moderate';
    } else {
      return 'simple';
    }
  }

  /**
   * Determine best API for request
   */
  private selectAPI(complexity: string, requiresReasoning: boolean): 'groq' | 'gemini' {
    // Use Groq for complex reasoning, Gemini for simple tasks
    if (complexity === 'complex' || requiresReasoning) {
      return 'groq';
    } else {
      return 'gemini';
    }
  }
}

// Export singleton instance
export const aiRouter = new IntelligentAIRouter();
