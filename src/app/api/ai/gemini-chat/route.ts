/**
 * Gemini Chat API Route
 * Clean, modern implementation using Gemini 2.5 Flash
 */

import { NextRequest, NextResponse } from 'next/server';
import { geminiChatService } from '@/services/ai/gemini-chat-service';
import { OnboardingContextService } from '@/services/data/onboarding-context-service';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, message, streaming = false } = await request.json();

    // Validation
    if (!sessionId || !userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userId, message' },
        { status: 400 }
      );
    }

    // Fetch user's onboarding context for personalization
    const userContext = await OnboardingContextService.getOnboardingContext(userId);
    console.log('📋 User context fetched:', userContext ? 'Found' : 'Not found');

    // Streaming response
    if (streaming) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await geminiChatService.sendMessageStreaming(
              sessionId,
              userId,
              message,
              (chunk) => {
                // Send each chunk as Server-Sent Event
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
                );
              },
              userContext
            );

            // Send completion event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
            );
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const response = await geminiChatService.sendMessage(sessionId, userId, message, userContext);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to generate response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: response.message,
      functionCalls: response.functionCalls,
      sessionId
    });

  } catch (error) {
    console.error('❌ Gemini Chat API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve conversation history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    const history = geminiChatService.getHistory(sessionId);

    return NextResponse.json({
      success: true,
      history,
      sessionId
    });

  } catch (error) {
    console.error('❌ Get History Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear conversation
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    geminiChatService.clearHistory(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Conversation cleared',
      sessionId
    });

  } catch (error) {
    console.error('❌ Clear History Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
