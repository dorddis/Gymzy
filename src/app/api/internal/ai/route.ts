/**
 * Secure Internal AI API Route
 * Handles all AI API calls server-side to protect API keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAPIConfig } from '@/lib/env-config';

// Request validation schema
const aiRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(10000, 'Prompt too long'),
  model: z.enum(['gemini', 'groq']).default('gemini'),
  maxTokens: z.number().min(1).max(4000).default(1000),
  temperature: z.number().min(0).max(2).default(0.7),
  stream: z.boolean().default(false),
});

// Rate limiting (simple in-memory store for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string, limit: number = 60): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  const clientData = rateLimitStore.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (clientData.count >= limit) {
    return false;
  }
  
  clientData.count++;
  return true;
}

// Gemini API call
async function callGeminiAPI(prompt: string, maxTokens: number, temperature: number): Promise<string> {
  const config = getAPIConfig();
  
  const response = await fetch(config.googleAI.endpoint + `?key=${config.googleAI.apiKey}`, {
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
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response format from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

// Groq API call
async function callGroqAPI(prompt: string, maxTokens: number, temperature: number): Promise<string> {
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
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid response format from Groq API');
  }

  return data.choices[0].message.content;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = aiRequestSchema.parse(body);

    let result: string;

    // Call appropriate AI service
    if (validatedData.model === 'groq') {
      result = await callGroqAPI(
        validatedData.prompt,
        validatedData.maxTokens,
        validatedData.temperature
      );
    } else {
      result = await callGeminiAPI(
        validatedData.prompt,
        validatedData.maxTokens,
        validatedData.temperature
      );
    }

    return NextResponse.json({
      success: true,
      content: result,
      model: validatedData.model,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ AI API Error:', error);

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

// Health check endpoint
export async function GET() {
  const config = getAPIConfig();
  
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      gemini: !!config.googleAI.apiKey,
      groq: !!config.groq.apiKey,
    }
  });
}
