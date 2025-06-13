import { getAIPersonalityProfile, generateAIContext } from './ai-personality-service';
import { AgenticAIService } from './agentic-ai-service';

// Google AI Studio Configuration
const GOOGLE_AI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

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

    // Initialize the agentic AI service
    const agenticAI = new AgenticAIService();

    // Convert conversation history to the format expected by agentic AI
    const chatHistory = conversationHistory.map((msg, index) => ({
      id: msg.id || `msg_${index}`,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.timestamp,
      userId: msg.userId
    }));

    console.log('🤖 ChatService: Calling agentic AI service...');

    // Call the agentic AI service (without streaming for now)
    const result = await agenticAI.generateAgenticResponse(
      message,
      chatHistory
    );

    console.log('✅ ChatService: Agentic AI response received');
    console.log('✅ ChatService: Response length:', result.content.length);
    console.log('✅ ChatService: Tool calls:', result.toolCalls?.length || 0);
    console.log('✅ ChatService: Has workout data:', !!result.workoutData);

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

// Generate daily motivation message
export const generateDailyMotivation = async (
  userId: string,
  context: {
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    lastWorkout?: Date;
    currentStreak: number;
    hasWorkoutToday: boolean;
  }
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
    
    if (context.hasWorkoutToday) {
      contextPrompt = `The user has already completed a workout today. Celebrate their achievement and provide encouragement for recovery or additional activities.`;
    } else if (daysSinceLastWorkout === null || daysSinceLastWorkout > 3) {
      contextPrompt = `The user hasn't worked out recently. Provide gentle motivation to get back on track without being pushy.`;
    } else if (context.currentStreak > 5) {
      contextPrompt = `The user is on a great workout streak (${context.currentStreak} days). Celebrate their consistency and motivate them to continue.`;
    } else {
      contextPrompt = `The user is building momentum. Encourage them to keep going with their fitness routine.`;
    }

    const systemPrompt = `You are Gymzy AI, this user's personal fitness coach. Generate a brief, personalized welcome/motivation message for the home page.

User Context:
${userContext}

Current Situation:
- Time of day: ${context.timeOfDay}
- Current streak: ${context.currentStreak} days
- ${contextPrompt}

Instructions:
- Keep the message to 1-2 sentences maximum
- Use their preferred communication style: ${personalityProfile.communicationStyle}
- Reference their personal goals or challenges when relevant
- Make it feel personal and encouraging
- Include a specific, actionable suggestion when appropriate
- Match the tone to the time of day`;

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
