/**
 * Secure Streaming AI API Route
 * Handles streaming AI responses server-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAPIConfig } from '@/lib/env-config';

// Request validation schema
const streamRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(10000, 'Prompt too long'),
  model: z.enum(['gemini', 'groq']).default('gemini'),
  maxTokens: z.number().min(1).max(4000).default(1000),
  temperature: z.number().min(0).max(2).default(0.7),
});

// Streaming response for Gemini
async function streamGeminiResponse(
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<ReadableStream> {
  const config = getAPIConfig();
  
  const response = await fetch(config.googleAI.streamingEndpoint + `?key=${config.googleAI.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: maxTokens,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini streaming API error: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body from Gemini API');
  }

  return new ReadableStream({
    start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      function pump(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                if (jsonStr.trim() === '[DONE]') {
                  controller.close();
                  return;
                }

                const data = JSON.parse(jsonStr);
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (text) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: text })}\n\n`));
                }
              } catch (error) {
                console.error('Error parsing streaming response:', error);
              }
            }
          }

          return pump();
        });
      }

      return pump();
    }
  });
}

// Streaming response for Groq
async function streamGroqResponse(
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<ReadableStream> {
  const config = getAPIConfig();
  
  if (!config.groq.apiKey) {
    throw new Error('Groq API key not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.groq.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.groq.modelName,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature,
      stream: true,
    })
  });

  if (!response.ok) {
    throw new Error(`Groq streaming API error: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body from Groq API');
  }

  return new ReadableStream({
    start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      function pump(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                if (jsonStr.trim() === '[DONE]') {
                  controller.close();
                  return;
                }

                const data = JSON.parse(jsonStr);
                const content = data.choices?.[0]?.delta?.content;
                
                if (content) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (error) {
                console.error('Error parsing Groq streaming response:', error);
              }
            }
          }

          return pump();
        });
      }

      return pump();
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = streamRequestSchema.parse(body);

    let stream: ReadableStream;

    // Create appropriate streaming response
    if (validatedData.model === 'groq') {
      stream = await streamGroqResponse(
        validatedData.prompt,
        validatedData.maxTokens,
        validatedData.temperature
      );
    } else {
      stream = await streamGeminiResponse(
        validatedData.prompt,
        validatedData.maxTokens,
        validatedData.temperature
      );
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ Streaming AI API Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
