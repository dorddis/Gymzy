import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponseServer } from '@/services/groq-service';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt provided' },
        { status: 400 }
      );
    }

    const content = await generateAIResponseServer(prompt);

    return NextResponse.json({ content });
  } catch (error) {
    console.error('❌ AI Generate API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
