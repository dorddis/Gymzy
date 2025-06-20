import { NextRequest, NextResponse } from 'next/server';
import { generateConversationResponseServer } from '@/services/groq-service';

export async function POST(request: NextRequest) {
  try {
    const { messages, temperature } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages provided' },
        { status: 400 }
      );
    }

    const content = await generateConversationResponseServer(messages, temperature);

    return NextResponse.json({ content });
  } catch (error) {
    console.error('❌ AI Conversation API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI conversation response' },
      { status: 500 }
    );
  }
}
