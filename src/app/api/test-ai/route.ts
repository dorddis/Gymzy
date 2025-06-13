import { NextRequest, NextResponse } from 'next/server';
import { generateCharacterStreamingResponse } from '@/services/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Test AI endpoint called with message:', message);

    // Test the streaming functionality
    let streamedContent = '';
    const chunks: string[] = [];

    const result = await generateCharacterStreamingResponse(
      message,
      (chunk: string) => {
        streamedContent += chunk;
        chunks.push(chunk);
        console.log('Received chunk:', chunk);
      }
    );

    console.log('Streaming completed. Total chunks:', chunks.length);
    console.log('Final result:', result);

    return NextResponse.json({
      success: true,
      message: 'Streaming test completed',
      result,
      streamedContent,
      totalChunks: chunks.length,
      chunks: chunks.slice(0, 10) // First 10 chunks for debugging
    });

  } catch (error) {
    console.error('Error in test AI endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to test AI streaming', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
