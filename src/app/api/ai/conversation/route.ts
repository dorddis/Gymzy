import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Conversation API - Deprecated
 *
 * This endpoint is deprecated. Please use /api/ai/gemini-chat instead.
 *
 * The new Gemini chat API provides:
 * - Better conversation management
 * - Native function calling
 * - Streaming support
 * - Proper session handling
 */
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages provided' },
        { status: 400 }
      );
    }

    // Return deprecation notice
    return NextResponse.json({
      error: 'This endpoint is deprecated. Please use /api/ai/gemini-chat instead.',
      migration: {
        endpoint: '/api/ai/gemini-chat',
        method: 'POST',
        body: {
          sessionId: 'your-session-id',
          userId: 'your-user-id',
          message: 'your-message',
          streaming: false // or true for streaming
        }
      }
    }, { status: 410 }); // 410 Gone - indicates deprecated/removed resource

  } catch (error) {
    console.error('❌ AI Conversation API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation request' },
      { status: 500 }
    );
  }
}
