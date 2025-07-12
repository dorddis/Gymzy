import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { userId, messages } = await request.json();

  // Basic validation for request body
  if (!userId || !messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
  }

  // Mock User Profile and Recent Workouts (will be replaced with actual data from Firestore later)
  const mockUserProfile = {
    name: 'Alex',
    age: 30,
    goals: 'build muscle and improve stamina',
  };

  const mockRecentWorkouts = [
    { title: 'Upper Body Strength', date: '2 hours ago', volume: 12500, rpe: 8 },
    { title: 'Leg Day', date: 'Yesterday', volume: 18750, rpe: 9 },
  ];

  const workoutSummary = mockRecentWorkouts.map(w => 
    `${w.title} (${w.date}, Volume: ${w.volume} lbs, RPE: ${w.rpe})`
  ).join('; ');

  // Construct the system message with personalized context
  const systemMessage = `You are Gymzy&apos;s AI assistant for user ${mockUserProfile.name}. ` +
                        `Their profile: age ${mockUserProfile.age}, goals ${mockUserProfile.goals}. ` +
                        `Recent workouts: ${workoutSummary}. ` +
                        `Use this context to answer questions and execute tasks related to their fitness journey.`;

  // Combine system message with user messages
  const conversation = [
    { role: 'system', content: systemMessage },
    ...messages,
  ];

  const lastUserMessage = messages[messages.length - 1]?.content || '';
  let aiResponseContent = `AI received your message: "${lastUserMessage}". ` +
                          `I also received context about ${mockUserProfile.name} (age ${mockUserProfile.age}, goals ${mockUserProfile.goals}) ` +
                          `and their recent workouts. This is a placeholder for a real AI response.`;

  try {
    // --- Placeholder for actual LLM API call and error handling ---
    // Example of how you'd handle potential LLM errors/rate limits:
    // const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    // if (!OPENAI_API_KEY) {
    //   throw new Error('OpenAI API key not configured.');
    // }
    // const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${OPENAI_API_KEY}`,
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-3.5-turbo',
    //     messages: conversation,
    //   }),
    // });
    // if (!llmResponse.ok) {
    //   if (llmResponse.status === 429) { // Rate limit
    //     throw new Error('AI is experiencing high traffic. Please try again shortly.');
    //   } else {
    //     throw new Error(`LLM API error: ${llmResponse.statusText}`);
    //   }
    // }
    // const llmData = await llmResponse.json();
    // aiResponseContent = llmData.choices[0].message.content;

    // Simulate a delay for the placeholder response
    await new Promise(resolve => setTimeout(resolve, 500));

  } catch (error) {
    console.error('Error in AI chat route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    role: 'ai',
    content: aiResponseContent,
  });
} 