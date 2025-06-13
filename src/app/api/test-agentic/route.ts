import { NextRequest, NextResponse } from 'next/server';
import { AgenticAIService } from '@/services/agentic-ai-service';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Test Agentic AI endpoint called with message:', message);

    const agenticAI = new AgenticAIService();
    
    // Test the agentic AI service with streaming
    let streamedContent = '';
    const chunks: string[] = [];

    const result = await agenticAI.generateAgenticResponse(
      message,
      [], // Empty chat history for test
      (chunk: string) => {
        streamedContent += chunk;
        chunks.push(chunk);
        console.log('Agentic chunk received:', chunk);
      }
    );

    console.log('Agentic AI completed. Result:', {
      content: result.content,
      toolCalls: result.toolCalls,
      workoutData: result.workoutData,
      isStreaming: result.isStreaming
    });

    return NextResponse.json({
      success: true,
      message: 'Agentic AI test completed',
      result,
      streamedContent,
      totalChunks: chunks.length,
      chunks: chunks.slice(0, 10) // First 10 chunks for debugging
    });

  } catch (error) {
    console.error('Error in test agentic AI endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to test agentic AI', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
