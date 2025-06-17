import { getAIPersonalityProfile, generateAIContext } from './ai-personality-service';
import { ComprehensiveFixesService } from './comprehensive-fixes-service';
import { ContextualDataService } from './contextual-data-service';
// LangChain service will be dynamically imported when needed

// Google AI Studio Configuration
const GOOGLE_AI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// Feature flag for LangChain integration
const USE_LANGCHAIN = process.env.NEXT_PUBLIC_USE_LANGCHAIN === 'true';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  userId?: string;
}

export interface ChatResponse {
  message: string;
  success: boolean;
  error?: string;
  toolCalls?: any[];
  workoutData?: {
    exercises: any[];
    workoutId: string;
  };
  isStreaming?: boolean;
}

export interface StreamingChatResponse {
  success: boolean;
  error?: string;
  toolCalls?: any[];
  workoutData?: {
    exercises: any[];
    workoutId: string;
  };
}

// Get Google AI API Key from environment
const getAPIKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key not found. Please add NEXT_PUBLIC_GOOGLE_AI_API_KEY to your environment variables.');
  }
  return apiKey;
};

// Generate system prompt with user context
const generateSystemPrompt = async (userId: string): Promise<string> => {
  try {
    const personalityProfile = await getAIPersonalityProfile(userId);
    
    if (!personalityProfile) {
      return `You are Gymzy AI, a friendly and knowledgeable fitness coach. Help users with their fitness journey, provide workout advice, motivation, and answer fitness-related questions. Be encouraging, supportive, and personalized in your responses.`;
    }

    const userContext = generateAIContext(personalityProfile);
    
    return `You are Gymzy AI, a personalized fitness coach and companion. You have deep knowledge about this specific user based on their onboarding profile. Here's what you know about them:

${userContext}

Your Role:
- Act as their personal fitness coach and motivational companion
- Provide personalized workout recommendations and fitness advice
- Offer motivation and encouragement aligned with their communication style
- Help them overcome their specific challenges
- Reference their personal goals and values when appropriate
- Adapt your communication to their preferred style and feedback preferences
- Be knowledgeable about fitness, nutrition, and wellness
- Remember previous conversations and build on them

Communication Guidelines:
- Use their preferred communication style: ${personalityProfile.communicationStyle}
- Provide ${personalityProfile.feedbackPreference} feedback
- Consider their ${personalityProfile.learningStyle} learning style
- Address their current challenges with empathy
- Reference their personal motivation and life context when relevant
- Be encouraging about their fitness goals while respecting their experience level
- Suggest modifications based on their equipment access and schedule

Remember: You're not just a fitness bot - you're their personal coach who understands their unique situation, challenges, and aspirations.`;

  } catch (error) {
    console.error('Error generating system prompt:', error);
    return `You are Gymzy AI, a friendly and knowledgeable fitness coach. Help users with their fitness journey, provide workout advice, motivation, and answer fitness-related questions. Be encouraging, supportive, and personalized in your responses.`;
  }
};

// Send message to AI and get response using Agentic AI
export const sendChatMessage = async (
  userId: string,
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> => {
  try {
    console.log('💬 ChatService: ===== SENDING CHAT MESSAGE =====');
    console.log('💬 ChatService: User ID:', userId);
    console.log('💬 ChatService: Message:', message);
    console.log('💬 ChatService: History length:', conversationHistory.length);

    // Import and use production agentic service
    const { productionAgenticService } = await import('./production-agentic-service');

    // Convert conversation history using comprehensive fixes
    const chatHistory = ComprehensiveFixesService.validateAndCleanChatHistory(conversationHistory);

    console.log('🤖 ChatService: Calling production agentic AI service...');

    // Call the production agentic AI service with streaming enabled
    let streamedContent = '';
    const result = await productionAgenticService.generateAgenticResponse(
      message,
      chatHistory,
      (chunk: string) => {
        streamedContent += chunk;
        console.log('🌊 ChatService: Received streaming chunk:', chunk);
      }
    );

    console.log('✅ ChatService: Production AI response received');
    console.log('✅ ChatService: Response length:', result.content.length);
    console.log('✅ ChatService: Tool calls:', result.toolCalls?.length || 0);
    console.log('✅ ChatService: Has workout data:', !!result.workoutData);
    console.log('✅ ChatService: Confidence:', result.confidence);
    console.log('✅ ChatService: Execution time:', result.metadata?.executionTime, 'ms');

    return {
      message: result.content,
      success: true,
      toolCalls: result.toolCalls,
      workoutData: result.workoutData,
      isStreaming: result.isStreaming
    };

  } catch (error) {
    console.error('❌ ChatService: Error sending chat message:', error);
    console.error('❌ ChatService: Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Return a fallback response
    return {
      message: "I'm having trouble connecting right now, but I'm here to help with your fitness journey! Try asking me about workouts, nutrition, or motivation.",
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Send message to AI with streaming support using hybrid system (LangChain or Production)
export const sendStreamingChatMessage = async (
  userId: string,
  message: string,
  conversationHistory: ChatMessage[] = [],
  onStreamChunk?: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<StreamingChatResponse> => {
  try {
    console.log(`💬 ChatService: ===== SENDING STREAMING CHAT MESSAGE (${USE_LANGCHAIN ? 'LANGCHAIN' : 'PRODUCTION'}) =====`);
    console.log('💬 ChatService: User ID:', userId);
    console.log('💬 ChatService: Message:', message);
    console.log('💬 ChatService: History length:', conversationHistory.length);
    console.log('💬 ChatService: Streaming enabled:', !!onStreamChunk);

    // Use production service (LangChain integration will be added after dependencies are installed)
    return await sendStreamingChatMessageProduction(userId, message, conversationHistory, onStreamChunk, abortSignal);
  } catch (error: any) {
    console.error('💬 ChatService: Error in service routing:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
};

// Production implementation (preserved with all improvements)
const sendStreamingChatMessageProduction = async (
  userId: string,
  message: string,
  conversationHistory: ChatMessage[] = [],
  onStreamChunk?: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<StreamingChatResponse> => {
  try {
    console.log('🏭 ChatService: Using Production implementation');

    // Import production agentic service
    const { productionAgenticService } = await import('./production-agentic-service');

    // Convert conversation history to the format expected by production AI
    const chatHistory = conversationHistory.map((msg, index) => ({
      id: msg.id || `msg_${index}`,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.timestamp,
      userId: msg.userId || userId // Use current userId as fallback
    }));

    console.log('🤖 ChatService: Calling production agentic AI service...');

    // Call the production agentic AI service with streaming enabled
    const result = await productionAgenticService.generateAgenticResponse(
      message,
      chatHistory,
      onStreamChunk,
      abortSignal
    );

    console.log('✅ ChatService: Production agentic response received:', {
      hasContent: !!result.content,
      hasToolCalls: !!result.toolCalls?.length,
      hasWorkoutData: !!result.workoutData,
      confidence: result.confidence
    });

    return {
      success: true, // Production service returns response on success, throws on error
      toolCalls: result.toolCalls,
      workoutData: result.workoutData
    };

  } catch (error: any) {
    console.error('🏭 ChatService: Production service error:', error);
    return { success: false, error: error.message || 'Production service error' };
  }
};

// Generate daily motivation message
export const generateDailyMotivation = async (
  userId: string,
  context: {
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    lastWorkout?: Date;
    currentStreak: number;
    hasWorkoutToday: boolean;
  },
  messageType: 'motivational' | 'tip' | 'joke' | 'general' = 'general' // Added messageType parameter with default
): Promise<ChatResponse> => {
  try {
    const personalityProfile = await getAIPersonalityProfile(userId);
    
    if (!personalityProfile) {
      return {
        message: "Welcome back! Ready to crush your fitness goals today?",
        success: true
      };
    }

    const userContext = generateAIContext(personalityProfile);
    const daysSinceLastWorkout = context.lastWorkout
      ? Math.floor((Date.now() - context.lastWorkout.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let contextPrompt = '';
    // Default context prompt, can be overridden by messageType logic
    if (context.hasWorkoutToday) {
      contextPrompt = `The user has already completed a workout today. Celebrate their achievement and provide encouragement for recovery or additional activities.`;
    } else if (daysSinceLastWorkout === null || daysSinceLastWorkout > 3) {
      contextPrompt = `The user hasn't worked out recently. Provide gentle motivation to get back on track without being pushy.`;
    } else if (context.currentStreak > 5) {
      contextPrompt = `The user is on a great workout streak (${context.currentStreak} days). Celebrate their consistency and motivate them to continue.`;
    } else {
      contextPrompt = `The user is building momentum. Encourage them to keep going with their fitness routine.`;
    }

    let systemPrompt = ''; // Initialize systemPrompt

    // Logic based on messageType
    switch (messageType) {
      case 'motivational':
        systemPrompt = `You are Gymzy AI, this user's personal fitness coach. Generate a brief, personalized motivational message for the home page.
User Context:
${userContext}
Current Situation:
- Time of day: ${context.timeOfDay}
- Current streak: ${context.currentStreak} days
- ${contextPrompt}
Instructions:
- Keep the message to 1-2 sentences maximum.
- Use their preferred communication style: ${personalityProfile.communicationStyle}.
- Focus on motivation, referencing their goals or challenges.
- Make it feel personal and encouraging.
- Match the tone to the time of day.`;
        break;
      case 'tip':
        const userContextData = await ContextualDataService.getUserContext(userId);
        const workoutPatternsTip = userContextData?.workoutPatterns;
        const performanceMetricsTip = userContextData?.performanceMetrics;

        systemPrompt = `You are Gymzy AI, this user's personal fitness coach. Generate a brief, actionable fitness tip based on their recent activity and performance.
User Context:
${userContext}
User Activity & Performance:
- Workout Patterns: ${JSON.stringify(workoutPatternsTip || {})}
- Performance Metrics: ${JSON.stringify(performanceMetricsTip || {})}
Current Situation:
- Time of day: ${context.timeOfDay}
- ${contextPrompt}
Instructions:
- Keep the tip to 1-2 sentences maximum.
- Ensure the tip is directly relevant to their workout patterns or performance.
- Use their preferred communication style: ${personalityProfile.communicationStyle}.
- Make it actionable and easy to understand.`;
        break;
      case 'joke':
        systemPrompt = `You are Gymzy AI, this user's personal fitness coach. Tell a lighthearted, fitness-related joke.
User Context:
${userContext}
Current Situation:
- Time of day: ${context.timeOfDay}
Instructions:
- Keep the joke short and SFW (safe for work).
- Use their preferred communication style: ${personalityProfile.communicationStyle}.
- Ensure the joke is related to fitness, exercise, or health.`;
        break;
      case 'general':
      default:
        systemPrompt = `You are Gymzy AI, this user's personal fitness coach. Generate a brief, personalized welcome/engagement message for the home page.
User Context:
${userContext}
Current Situation:
- Time of day: ${context.timeOfDay}
- Current streak: ${context.currentStreak} days
- ${contextPrompt}
Instructions:
- Keep the message to 1-2 sentences maximum.
- Use their preferred communication style: ${personalityProfile.communicationStyle}.
- Reference their personal goals or challenges when relevant.
- Make it feel personal and encouraging.
- Include a specific, actionable suggestion if appropriate.
- Match the tone to the time of day.`;
        break;
    }

    const response = await fetch(`${GOOGLE_AI_ENDPOINT}?key=${getAPIKey()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100,
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate motivation message');
    }

    const data = await response.json();
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return {
      message: message || "Welcome back! Ready to make today count?",
      success: true
    };

  } catch (error) {
    console.error('Error generating daily motivation:', error);
    
    // Fallback messages based on context
    let fallbackMessage = "Welcome back to Gymzy! ";
    
    if (context.hasWorkoutToday) {
      fallbackMessage += "Great job on today's workout! 💪";
    } else if (context.currentStreak > 5) {
      fallbackMessage += `Amazing ${context.currentStreak}-day streak! Keep it going! 🔥`;
    } else {
      fallbackMessage += "Ready to crush your fitness goals today? 🚀";
    }

    return {
      message: fallbackMessage,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export default {
  sendChatMessage,
  generateDailyMotivation
};
