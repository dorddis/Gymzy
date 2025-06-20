/**
 * Intelligent AI Router - Routes requests to appropriate AI service based on complexity
 * Uses Groq for complex reasoning tasks and Gemini for simple/fast tasks
 */

import { generateAIResponse as generateGeminiResponse, generateCharacterStreamingResponse as generateGeminiStreaming } from './ai-service';
import { generateAIResponse as generateGroqResponse, generateCharacterStreamingResponse as generateGroqStreaming } from './groq-service';

export interface AIRequest {
  prompt: string;
  context?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userId?: string;
  requiresReasoning?: boolean;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  confidence: number;
  reasoning: string;
  apiUsed: 'groq' | 'gemini';
  complexity: 'simple' | 'moderate' | 'complex';
  executionTime: number;
  success: boolean;
  error?: string;
}

export interface ComplexityAnalysis {
  complexity: 'simple' | 'moderate' | 'complex';
  confidence: number;
  reasoning: string;
  recommendedAPI: 'groq' | 'gemini';
  factors: {
    workoutCreation: boolean;
    multiStepReasoning: boolean;
    contextualAnalysis: boolean;
    mathematicalCalculation: boolean;
    conversationalResponse: boolean;
  };
}

export class IntelligentAIRouter {
  private static instance: IntelligentAIRouter;
  private groqAvailable: boolean = false;
  private geminiAvailable: boolean = true;

  private constructor() {
    this.checkAPIAvailability();
  }

  public static getInstance(): IntelligentAIRouter {
    if (!IntelligentAIRouter.instance) {
      IntelligentAIRouter.instance = new IntelligentAIRouter();
    }
    return IntelligentAIRouter.instance;
  }

  /**
   * Check if APIs are available
   */
  private async checkAPIAvailability(): Promise<void> {
    // Check Groq availability - need to check if the key is actually set (not empty)
    const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    this.groqAvailable = !!(groqKey && groqKey.trim() !== '');

    // Check Gemini availability
    const geminiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    this.geminiAvailable = !!(geminiKey && geminiKey.trim() !== '');

    console.log('🔍 AI Router: API Availability Check');
    console.log('- Groq Available:', this.groqAvailable);
    console.log('- Gemini Available:', this.geminiAvailable);
    console.log('- Groq Key Length:', groqKey ? groqKey.length : 0);
    console.log('- Gemini Key Length:', geminiKey ? geminiKey.length : 0);
  }

  /**
   * Analyze request complexity to determine appropriate AI service
   */
  public analyzeComplexity(request: AIRequest): ComplexityAnalysis {
    const prompt = request.prompt.toLowerCase();
    const context = request.context?.toLowerCase() || '';
    
    const factors = {
      workoutCreation: this.detectWorkoutCreation(prompt),
      multiStepReasoning: this.detectMultiStepReasoning(prompt),
      contextualAnalysis: this.detectContextualAnalysis(prompt, request.conversationHistory),
      mathematicalCalculation: this.detectMathematicalCalculation(prompt),
      conversationalResponse: this.detectConversationalResponse(prompt)
    };

    // Calculate complexity score
    let complexityScore = 0;
    
    if (factors.workoutCreation) complexityScore += 3;
    if (factors.multiStepReasoning) complexityScore += 4;
    if (factors.contextualAnalysis) complexityScore += 2;
    if (factors.mathematicalCalculation) complexityScore += 2;
    if (factors.conversationalResponse) complexityScore -= 1; // Simple responses

    // Determine complexity level
    let complexity: 'simple' | 'moderate' | 'complex';
    let recommendedAPI: 'groq' | 'gemini';
    let reasoning: string;

    if (complexityScore >= 5) {
      complexity = 'complex';
      recommendedAPI = 'groq';
      reasoning = 'Complex task requiring multi-step reasoning and workout generation';
    } else if (complexityScore >= 2) {
      complexity = 'moderate';
      recommendedAPI = this.groqAvailable ? 'groq' : 'gemini';
      reasoning = 'Moderate complexity task that benefits from reasoning capabilities';
    } else {
      complexity = 'simple';
      recommendedAPI = 'gemini';
      reasoning = 'Simple conversational response, optimized for speed';
    }

    // Override if APIs not available
    if (recommendedAPI === 'groq' && !this.groqAvailable) {
      recommendedAPI = 'gemini';
      reasoning += ' (Fallback to Gemini - Groq not available)';
      console.log('⚠️ AI Router: Groq not available, falling back to Gemini');
    }
    if (recommendedAPI === 'gemini' && !this.geminiAvailable) {
      recommendedAPI = 'groq';
      reasoning += ' (Fallback to Groq - Gemini not available)';
      console.log('⚠️ AI Router: Gemini not available, falling back to Groq');
    }

    return {
      complexity,
      confidence: Math.min(0.9, 0.6 + (complexityScore * 0.1)),
      reasoning,
      recommendedAPI,
      factors
    };
  }

  /**
   * Route AI request to appropriate service
   */
  public async routeRequest(request: AIRequest, onStreamChunk?: (chunk: string) => void): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Analyze complexity
      const analysis = this.analyzeComplexity(request);
      
      console.log(`🧠 AI Router: Routing to ${analysis.recommendedAPI.toUpperCase()}`);
      console.log(`📊 Complexity: ${analysis.complexity} (confidence: ${analysis.confidence})`);
      console.log(`💭 Reasoning: ${analysis.reasoning}`);

      let content: string;
      let apiUsed: 'groq' | 'gemini';

      // Route to appropriate API
      if (analysis.recommendedAPI === 'groq' && this.groqAvailable) {
        try {
          content = await this.callGroq(request, onStreamChunk);
          apiUsed = 'groq';
        } catch (error) {
          console.log('⚠️ AI Router: Groq failed, trying Gemini fallback');
          content = await this.callGemini(request, onStreamChunk);
          apiUsed = 'gemini';
        }
      } else if (analysis.recommendedAPI === 'gemini' && this.geminiAvailable) {
        try {
          content = await this.callGemini(request, onStreamChunk);
          apiUsed = 'gemini';
        } catch (error) {
          console.log('⚠️ AI Router: Gemini failed, trying Groq fallback');
          content = await this.callGroq(request, onStreamChunk);
          apiUsed = 'groq';
        }
      } else {
        throw new Error('No AI services available');
      }

      const executionTime = Date.now() - startTime;

      return {
        content,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        apiUsed,
        complexity: analysis.complexity,
        executionTime,
        success: true
      };

    } catch (error) {
      console.error('❌ AI Router: Error routing request:', error);
      
      return {
        content: "I'm having trouble processing your request right now. Please try again in a moment.",
        confidence: 0.1,
        reasoning: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        apiUsed: 'gemini', // Default fallback
        complexity: 'simple',
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Call Groq API
   */
  private async callGroq(request: AIRequest, onStreamChunk?: (chunk: string) => void): Promise<string> {
    if (onStreamChunk) {
      return await generateGroqStreaming(
        request.prompt,
        onStreamChunk,
        () => {}, // onComplete
        (error) => console.error('Groq streaming error:', error)
      );
    } else {
      return await generateGroqResponse(request.prompt);
    }
  }

  /**
   * Call Gemini API
   */
  private async callGemini(request: AIRequest, onStreamChunk?: (chunk: string) => void): Promise<string> {
    if (onStreamChunk) {
      return await generateGeminiStreaming(
        request.prompt,
        onStreamChunk,
        () => {}, // onComplete
        (error) => console.error('Gemini streaming error:', error)
      );
    } else {
      return await generateGeminiResponse(request.prompt);
    }
  }

  // Detection methods for complexity analysis
  private detectWorkoutCreation(prompt: string): boolean {
    const workoutKeywords = [
      'create workout', 'generate workout', 'build workout', 'design workout',
      'workout plan', 'exercise routine', 'training program',
      'tricep workout', 'chest workout', 'leg workout', 'back workout',
      'shoulder workout', 'arm workout', 'core workout'
    ];
    return workoutKeywords.some(keyword => prompt.includes(keyword));
  }

  private detectMultiStepReasoning(prompt: string): boolean {
    const reasoningKeywords = [
      'analyze', 'compare', 'evaluate', 'calculate', 'determine',
      'step by step', 'break down', 'explain why', 'reasoning',
      'modify workout', 'adjust', 'customize', 'optimize'
    ];
    return reasoningKeywords.some(keyword => prompt.includes(keyword));
  }

  private detectContextualAnalysis(prompt: string, history?: Array<{ role: string; content: string }>): boolean {
    const contextKeywords = ['previous', 'last time', 'before', 'earlier', 'remember'];
    const hasContextKeywords = contextKeywords.some(keyword => prompt.includes(keyword));
    const hasHistory = history && history.length > 2;
    
    return hasContextKeywords || !!hasHistory;
  }

  private detectMathematicalCalculation(prompt: string): boolean {
    const mathKeywords = [
      'calculate', 'count', 'total', 'sum', 'average',
      'double', 'triple', 'increase', 'decrease',
      'percentage', 'ratio', 'sets', 'reps'
    ];
    return mathKeywords.some(keyword => prompt.includes(keyword));
  }

  private detectConversationalResponse(prompt: string): boolean {
    const conversationalKeywords = [
      'hello', 'hi', 'hey', 'thanks', 'thank you',
      'how are you', 'good morning', 'good evening',
      'yes', 'no', 'okay', 'sure'
    ];
    return conversationalKeywords.some(keyword => prompt.includes(keyword)) && prompt.length < 50;
  }
}

// Export singleton instance
export const aiRouter = IntelligentAIRouter.getInstance();
