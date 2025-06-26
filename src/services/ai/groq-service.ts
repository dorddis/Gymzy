// Groq AI Service - Now using server-side API routes for security
// This service now makes requests to our own API routes instead of directly to Groq

// Check if we're running on the server side
const isServerSide = typeof window === 'undefined';

// Server-side Groq client (only used in API routes)
let groqClient: any = null;

const getGroqClient = () => {
  if (!isServerSide) {
    throw new Error('Groq client should only be used server-side. Use API routes instead.');
  }

  if (!groqClient) {
    const Groq = require('groq-sdk');
    const apiKey = process.env.GROQ_API_KEY; // Note: No NEXT_PUBLIC_ prefix for security
    if (!apiKey) {
      throw new Error('Groq API key not found. Please add GROQ_API_KEY to your environment variables.');
    }

    groqClient = new Groq({
      apiKey: apiKey,
    });
  }

  return groqClient;
};

const getModelName = (): string => {
  // Use faster, smaller model to avoid rate limits
  return process.env.GROQ_MODEL_NAME || process.env.NEXT_PUBLIC_GROQ_MODEL_NAME || 'llama3-8b-8192';
};

// Determine appropriate max_tokens based on prompt content and intent
const determineMaxTokens = (prompt: string): number => {
  const lowerPrompt = prompt.toLowerCase();

  // Simple greetings and short responses
  if (lowerPrompt.match(/^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you)$/)) {
    return 100;
  }

  // Short questions or simple requests
  if (lowerPrompt.length < 50) {
    return 200;
  }

  // Workout-related requests (typically need more detail)
  if (lowerPrompt.includes('workout') || lowerPrompt.includes('exercise') || lowerPrompt.includes('training')) {
    return 600;
  }

  // Medium-length requests
  if (lowerPrompt.length < 200) {
    return 400;
  }

  // Complex or long requests
  return 800;
};

// Server-side function for API routes
export const generateAIResponseServer = async (prompt: string): Promise<string> => {
  if (!isServerSide) {
    throw new Error('This function should only be called server-side');
  }

  try {
    const groq = getGroqClient();
    const modelName = getModelName();

    // Determine max_tokens based on prompt content
    const maxTokens = determineMaxTokens(prompt);

    const response = await groq.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.95,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from Groq API');
    }

    return content;
  } catch (error: any) {
    console.error('❌ Groq API Error:', error);

    // Handle rate limit errors specifically
    if (error.status === 429 || (error.message && error.message.includes('rate_limit_exceeded'))) {
      throw new Error('AI service is temporarily busy. Please try again in a moment.');
    }

    throw error;
  }
};

// Client-side function that calls our API route
export const generateAIResponse = async (prompt: string): Promise<string> => {
  if (isServerSide) {
    // If we're on the server, use the direct function
    return generateAIResponseServer(prompt);
  }

  try {
    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Invalid prompt: prompt must be a non-empty string');
    }

    console.log('🔄 Groq Client: Sending request to /api/ai/generate with prompt length:', prompt.length);

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI API Error Response:', response.status, errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Groq Client: Received response with length:', data.content?.length || 0);
    return data.content;
  } catch (error) {
    console.error('❌ AI API Error:', error);

    // Fallback response
    return "I'm sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.";
  }
};

// Server-side streaming function for API routes (token-based, no character delays)
export const generateCharacterStreamingResponseServer = async (
  prompt: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: string) => void
): Promise<string> => {
  if (!isServerSide) {
    throw new Error('This function should only be called server-side');
  }

  try {
    const groq = getGroqClient();
    const modelName = getModelName();

    // Determine max_tokens based on prompt content
    const maxTokens = determineMaxTokens(prompt);

    const stream = await groq.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.95,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        // Send tokens as received (no character-by-character delays)
        onChunk(content);
      }
    }

    onComplete?.();
    return fullResponse;

  } catch (error: any) {
    console.error('❌ Groq Streaming Error:', error);

    // Handle rate limit errors specifically
    if (error.status === 429 || (error.message && error.message.includes('rate_limit_exceeded'))) {
      onError?.('AI service is temporarily busy. Please try again in a moment.');
      return '';
    }

    throw error;
  }
};

// Client-side streaming function that uses Server-Sent Events (token-based, no character delays)
export const generateCharacterStreamingResponse = async (
  prompt: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: string) => void
): Promise<string> => {
  if (isServerSide) {
    // If we're on the server, use the direct function
    return generateCharacterStreamingResponseServer(prompt, onChunk, onComplete, onError);
  }

  try {
    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Invalid prompt: prompt must be a non-empty string');
    }

    console.log('🌊 Groq Streaming: Starting stream for prompt length:', prompt.length);

    // Use the streaming API for real token streaming
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Streaming API Error Response:', response.status, errorText);
      throw new Error(`Streaming API request failed: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              fullResponse += data.chunk;
              onChunk(data.chunk);
            } else if (data.done) {
              onComplete?.();
              return fullResponse;
            } else if (data.error) {
              onError?.(data.error);
              return fullResponse;
            }
          } catch (e) {
            // Ignore malformed JSON
          }
        }
      }
    }

    onComplete?.();
    return fullResponse;

  } catch (error) {
    console.error('❌ AI Streaming Error:', error);
    const errorMessage = "I'm sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.";

    onError?.(errorMessage);
    onChunk(errorMessage);
    onComplete?.();
    return errorMessage;
  }
};

// Server-side token streaming function for API routes
export const generateTokenStreamingResponseServer = async (
  prompt: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: string) => void
): Promise<string> => {
  if (!isServerSide) {
    throw new Error('This function should only be called server-side');
  }

  try {
    const groq = getGroqClient();
    const modelName = getModelName();

    // Determine max_tokens based on prompt content
    const maxTokens = determineMaxTokens(prompt);

    const stream = await groq.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.95,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        onChunk(content); // Send tokens as received (faster)
      }
    }

    onComplete?.();
    return fullResponse;

  } catch (error: any) {
    console.error('❌ Groq Streaming Error:', error);

    // Handle rate limit errors specifically
    if (error.status === 429 || (error.message && error.message.includes('rate_limit_exceeded'))) {
      onError?.('AI service is temporarily busy. Please try again in a moment.');
      return '';
    }

    throw error;
  }
};

// Client-side token streaming function
export const generateTokenStreamingResponse = async (
  prompt: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: string) => void
): Promise<string> => {
  if (isServerSide) {
    // If we're on the server, use the direct function
    return generateTokenStreamingResponseServer(prompt, onChunk, onComplete, onError);
  }

  // Use the same streaming implementation as character streaming (they're now the same)
  return generateCharacterStreamingResponse(prompt, onChunk, onComplete, onError);
};

// Server-side conversation function
export const generateConversationResponseServer = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  temperature: number = 0.7
): Promise<string> => {
  if (!isServerSide) {
    throw new Error('This function should only be called server-side');
  }

  try {
    const groq = getGroqClient();
    const modelName = getModelName();

    // Determine max_tokens based on the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const maxTokens = lastUserMessage ? determineMaxTokens(lastUserMessage.content) : 400;

    const response = await groq.chat.completions.create({
      model: modelName,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: 0.95,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from Groq API');
    }

    return content;
  } catch (error: any) {
    console.error('❌ Groq Conversation Error:', error);

    // Handle rate limit errors specifically
    if (error.status === 429 || (error.message && error.message.includes('rate_limit_exceeded'))) {
      throw new Error('AI service is temporarily busy. Please try again in a moment.');
    }

    throw error;
  }
};

// Client-side conversation function
export const generateConversationResponse = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  temperature: number = 0.7
): Promise<string> => {
  if (isServerSide) {
    // If we're on the server, use the direct function
    return generateConversationResponseServer(messages, temperature);
  }

  try {
    const response = await fetch('/api/ai/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, temperature }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('❌ AI Conversation Error:', error);
    return "I'm sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.";
  }
};

// Health check for Groq service
export const checkGroqHealth = async (): Promise<boolean> => {
  try {
    const response = await generateAIResponse("Hello");
    return response.length > 0;
  } catch (error) {
    console.error('❌ Groq Health Check Failed:', error);
    return false;
  }
};

// Get available models (for future use)
export const getAvailableModels = (): string[] => {
  return [
    'llama3-70b-8192',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
    'gemma-7b-it',
    'gemma2-9b-it'
  ];
};

// Export default functions for backward compatibility
export default {
  generateAIResponse,
  generateCharacterStreamingResponse,
  generateTokenStreamingResponse,
  generateConversationResponse,
  checkGroqHealth,
  getAvailableModels
};
