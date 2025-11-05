import { NextRequest, NextResponse } from 'next/server';
import { geminiChatService } from '@/services/ai/gemini-chat-service';

/**
 * AI Generate API - Using Gemini 2.5 Flash
 * Simple wrapper for backward compatibility
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt provided' },
        { status: 400 }
      );
    }

    // Use a temporary session for one-off generations
    const sessionId = `temp-${Date.now()}`;
    const userId = 'system'; // Or extract from auth if available

    const response = await geminiChatService.sendMessage(sessionId, userId, prompt);

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate response');
    }

    return NextResponse.json({ content: response.message });
  } catch (error) {
    console.error('❌ AI Generate API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
