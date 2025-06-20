# AI Chat Setup Guide

## Google AI Studio API Key Configuration

To enable the AI chat functionality in Gymzy, you need to add your Google AI Studio API key to the environment variables. Google AI Studio is **FREE** and provides excellent AI capabilities with Gemini models.

### Step 1: Get Google AI Studio API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click on "Get API key" in the left sidebar
4. Click "Create API key in new project" or select an existing project
5. Copy the API key (it starts with `AIza`)

### Step 2: Add API Key to Environment

1. Open your `.env.local` file in the root directory of the project
2. Add the following line:

```
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual Google AI Studio API key.

### Step 3: Restart Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## Features Enabled

Once the API key is configured, the following AI features will work:

### 1. Personalized Chat
- AI coach that knows your fitness goals, preferences, and personality
- Context-aware responses based on your onboarding profile
- Adaptive communication style matching your preferences

### 2. Daily Motivation Messages (Coming Soon)
- Personalized welcome messages on the home page
- Context-aware motivation based on your workout history
- Goal-oriented guidance and tips

### 3. Smart Recommendations (Coming Soon)
- Workout suggestions based on your progress
- Nutrition tips aligned with your goals
- Recovery and rest day guidance

## AI Personality Integration

The AI coach uses your onboarding data to provide personalized responses:

- **Communication Style**: Matches your preferred style (motivational, analytical, supportive, challenging)
- **Feedback Preference**: Provides detailed, concise, or visual feedback as preferred
- **Personal Context**: References your goals, challenges, and life situation
- **Learning Style**: Adapts explanations to your learning preference
- **Equipment & Schedule**: Considers your available equipment and time constraints

## Troubleshooting

### API Key Issues
- Make sure the API key starts with `AIza`
- Ensure there are no extra spaces in the environment variable
- Restart the development server after adding the key

### Chat Not Working
- Check browser console for error messages
- Verify the API key is correctly set in `.env.local`
- Ensure you haven't exceeded Google AI Studio's free tier limits

### Fallback Behavior
- If the AI service fails, the app will show fallback messages
- Chat functionality will still work but without personalized responses
- Check the console for specific error messages

## Cost Considerations

- **Google AI Studio is FREE** with generous usage limits
- The app uses Gemini 1.5 Flash model for optimal performance
- No cost per message within the free tier limits
- Monitor your Google AI Studio usage dashboard to track usage

## Privacy & Security

- API calls are made directly from the client to Google AI Studio
- User data is only sent to Google AI for generating responses
- No conversation data is stored on Google's servers beyond the API call
- All personal data remains in your Firebase database

## Next Steps

After setting up the API key:

1. Test the chat functionality by going to the Chat tab
2. Try asking fitness-related questions
3. Notice how the AI references your onboarding information
4. Explore different types of questions (workouts, nutrition, motivation)

The AI coach will become more helpful as you use the app and it learns your patterns and preferences!
