/**
 * Secure AI Client
 * Client-side service that calls secure server-side API routes
 * Replaces direct API calls to external services
 */

import { env } from './env-config';

export interface AIRequest {
  prompt: string;
  model?: 'gemini' | 'groq';
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIResponse {
  success: boolean;
  content: string;
  model: string;
  timestamp: string;
  error?: string;
}

export interface StreamingResponse {
  content: string;
}

/**
 * Generate AI response using secure server-side API
 */
export async function generateSecureAIResponse(request: AIRequest): Promise<AIResponse> {
  try {
    const response = await fetch('/api/internal/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        model: request.model || 'gemini',
        maxTokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('❌ Secure AI Client Error:', error);
    
    return {
      success: false,
      content: '',
      model: request.model || 'gemini',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate streaming AI response using secure server-side API
 */
export async function generateSecureStreamingResponse(
  request: AIRequest,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch('/api/internal/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        model: request.model || 'gemini',
        maxTokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete?.();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix
              const data: StreamingResponse = JSON.parse(jsonStr);
              
              if (data.content) {
                onChunk(data.content);
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    console.error('❌ Secure Streaming AI Client Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error occurred';
    onError?.(errorMessage);
  }
}

/**
 * Check AI service health
 */
export async function checkAIServiceHealth(): Promise<{
  status: string;
  services: { gemini: boolean; groq: boolean };
  timestamp: string;
}> {
  try {
    const response = await fetch('/api/internal/ai', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('❌ AI Service Health Check Error:', error);
    
    return {
      status: 'unhealthy',
      services: { gemini: false, groq: false },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Legacy compatibility wrapper for existing code
 * @deprecated Use generateSecureAIResponse instead
 */
export async function generateAIResponse(prompt: string): Promise<string> {
  console.warn('⚠️ generateAIResponse is deprecated. Use generateSecureAIResponse instead.');
  
  const response = await generateSecureAIResponse({ prompt });
  
  if (!response.success) {
    throw new Error(response.error || 'AI generation failed');
  }
  
  return response.content;
}

/**
 * Legacy compatibility wrapper for streaming
 * @deprecated Use generateSecureStreamingResponse instead
 */
export async function generateCharacterStreamingResponse(
  prompt: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void
): Promise<void> {
  console.warn('⚠️ generateCharacterStreamingResponse is deprecated. Use generateSecureStreamingResponse instead.');
  
  return generateSecureStreamingResponse(
    { prompt },
    onChunk,
    onComplete,
    (error) => {
      console.error('Streaming error:', error);
      onComplete?.();
    }
  );
}

/**
 * Intelligent AI routing based on request complexity
 */
export function determineOptimalModel(prompt: string): 'gemini' | 'groq' {
  // Simple heuristics for model selection
  const complexityIndicators = [
    'workout', 'exercise', 'create', 'generate', 'plan', 'analyze',
    'calculate', 'modify', 'double', 'increase', 'decrease',
    'tricep', 'bicep', 'chest', 'back', 'legs', 'shoulders'
  ];
  
  const promptLower = prompt.toLowerCase();
  const hasComplexity = complexityIndicators.some(indicator => 
    promptLower.includes(indicator)
  );
  
  // Use Groq for complex fitness-related requests, Gemini for simple ones
  return hasComplexity ? 'groq' : 'gemini';
}

/**
 * Smart AI request with automatic model selection
 */
export async function generateSmartAIResponse(request: Omit<AIRequest, 'model'>): Promise<AIResponse> {
  const optimalModel = determineOptimalModel(request.prompt);
  
  return generateSecureAIResponse({
    ...request,
    model: optimalModel,
  });
}

/**
 * Smart streaming AI request with automatic model selection
 */
export async function generateSmartStreamingResponse(
  request: Omit<AIRequest, 'model'>,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  const optimalModel = determineOptimalModel(request.prompt);
  
  return generateSecureStreamingResponse(
    { ...request, model: optimalModel },
    onChunk,
    onComplete,
    onError
  );
}
