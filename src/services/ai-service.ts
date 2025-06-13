// Google AI Studio Configuration
const GOOGLE_AI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
const GOOGLE_AI_STREAMING_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:streamGenerateContent';

// Get Google AI API Key from environment
const getAPIKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key not found. Please add NEXT_PUBLIC_GOOGLE_AI_API_KEY to your environment variables.');
  }
  return apiKey;
};

// Standard AI response (non-streaming)
export const generateAIResponse = async (prompt: string): Promise<string> => {
  try {
    const apiKey = getAPIKey();

    const response = await fetch(`${GOOGLE_AI_ENDPOINT}?key=${apiKey}`, {
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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
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
      const errorData = await response.json();
      throw new Error(`Google AI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiMessage) {
      throw new Error('No response from Google AI');
    }

    return aiMessage.trim();

  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};

// Streaming AI response (Google AI doesn't support true streaming, so we simulate it)
export const generateStreamingAIResponse = async (
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  try {
    console.log('Starting streaming AI response...');

    // Get the full response first
    const fullResponse = await generateAIResponse(prompt);
    console.log('Full response received, starting streaming simulation...');

    // Simulate streaming by sending chunks
    return simulateStreamingResponse(fullResponse, onChunk);

  } catch (error) {
    console.error('Error in streaming AI response:', error);
    throw error;
  }
};

// Simulate streaming by breaking response into words
const simulateStreamingResponse = async (
  fullResponse: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  try {
    const words = fullResponse.split(' ');
    let currentResponse = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      currentResponse += word;
      onChunk(word);

      // Add a small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    return currentResponse;
  } catch (error) {
    console.error('Error in simulated streaming:', error);
    throw error;
  }
};

// Character-by-character streaming for even smoother effect
export const generateCharacterStreamingResponse = async (
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  try {
    console.log('Starting character streaming for prompt:', prompt.substring(0, 100) + '...');
    const fullResponse = await generateAIResponse(prompt);
    console.log('Full response received, length:', fullResponse.length);

    let currentResponse = '';

    for (let i = 0; i < fullResponse.length; i++) {
      const char = fullResponse[i];
      currentResponse += char;
      onChunk(char);

      // Add a small delay between characters
      await new Promise(resolve => setTimeout(resolve, 15));
    }

    console.log('Character streaming completed');
    return currentResponse;
  } catch (error) {
    console.error('Error in character streaming:', error);
    throw error;
  }
};

export default {
  generateAIResponse,
  generateStreamingAIResponse,
  generateCharacterStreamingResponse
};
