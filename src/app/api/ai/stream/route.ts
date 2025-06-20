import { NextRequest } from 'next/server';
import { generateTokenStreamingResponseServer } from '@/services/groq-service';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response('Invalid prompt provided', { status: 400 });
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          await generateTokenStreamingResponseServer(
            prompt,
            (chunk: string) => {
              // Send each chunk as Server-Sent Event
              const data = `data: ${JSON.stringify({ chunk })}\n\n`;
              controller.enqueue(encoder.encode(data));
            },
            () => {
              // Send completion signal
              const data = `data: ${JSON.stringify({ done: true })}\n\n`;
              controller.enqueue(encoder.encode(data));
              controller.close();
            },
            (error: string) => {
              // Send error signal
              const data = `data: ${JSON.stringify({ error })}\n\n`;
              controller.enqueue(encoder.encode(data));
              controller.close();
            }
          );
        } catch (error) {
          console.error('❌ Streaming Error:', error);
          const data = `data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
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
  } catch (error) {
    console.error('❌ AI Stream API Error:', error);
    return new Response('Failed to create stream', { status: 500 });
  }
}
