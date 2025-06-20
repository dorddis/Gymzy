import { getAIPersonalityProfile, generateAIContext } from '@/services/ai/ai-personality-service';
import { ContextualDataService } from '@/services/data/contextual-data-service';
import { aiRouter, AIRequest } from '@/services/ai/intelligent-ai-router';
import { multiStepReasoning } from '@/services/ai/multi-step-reasoning';

// Feature flag for intelligent multi-step reasoning
const USE_INTELLIGENT_REASONING = true;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  userId?: string;
}

export interface ChatResponse {
  message: string;
  success: boolean;
  error?: string;
  toolCalls?: any[];
  workoutData?: {
    exercises: any[];
    workoutId: string;
  };
  isStreaming?: boolean;
}

export interface StreamingChatResponse {
  success: boolean;
  error?: string;
  toolCalls?: any[];
  workoutData?: {
    exercises: any[];
    workoutId: string;
  };
}

// Intelligent streaming chat message using multi-step reasoning
const sendStreamingChatMessageIntelligent = async (
  userId: string,
  message: string,
  conversationHistory: ChatMessage[] = [],
  onStreamChunk?: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<StreamingChatResponse> => {
  try {
    console.log('🧠 ChatService: Using intelligent multi-step reasoning');

    // Convert conversation history to simple format
    const simpleHistory = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Check if this is a workout-related request that needs multi-step reasoning
    if (isWorkoutRelated(message)) {
      console.log('🏋️ ChatService: Detected workout request');

      // Check if we can use multi-step reasoning (requires Groq for complex steps)
      const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
      const groqAvailable = !!(groqKey && groqKey.trim() !== '');

      if (groqAvailable) {
        console.log('🧠 ChatService: Using multi-step reasoning with Groq');
        try {
          const reasoningChain = await multiStepReasoning.executeWorkoutReasoning(
            message,
            simpleHistory,
            onStreamChunk
          );

          // Extract workout data if available
          let workoutData;
          try {
            const workoutStep = reasoningChain.steps.find(step => step.name === 'Workout Generation');
            if (workoutStep && workoutStep.output) {
              console.log('🔍 ChatService: Raw workout generation output:', workoutStep.output.substring(0, 500) + '...');
              const workoutJson = extractJSON(workoutStep.output);
              console.log('🔍 ChatService: Extracted workout JSON:', workoutJson);

              if (workoutJson && workoutJson.exercises) {
                // Convert the AI-generated workout format to the expected WorkoutExercise format
                const formattedExercises = workoutJson.exercises.map((exercise: any, index: number) => {
                  // Try to map AI exercise to existing exercise in database
                  const existingExercise = mapAIExerciseToExisting(exercise.name);

                  if (existingExercise) {
                    // Use existing exercise with exact muscle mappings
                    return {
                      id: existingExercise.id, // Use existing exercise ID for exact muscle mapping
                      name: existingExercise.name, // Use existing exercise name
                      sets: Array.from({ length: exercise.sets || 3 }, () => ({
                        weight: 0,
                        reps: exercise.reps || 8,
                        rpe: 8,
                        isWarmup: false,
                        isExecuted: false
                      })),
                      muscleGroups: [], // Will be handled by existing exercise lookup
                      equipment: exercise.equipment || 'Mixed',
                      primaryMuscles: existingExercise.primaryMuscles, // Use exact muscle mapping
                      secondaryMuscles: existingExercise.secondaryMuscles // Use exact muscle mapping
                    };
                  } else {
                    // Create new exercise with AI-generated data (fallback)
                    console.warn(`⚠️ Creating new exercise for unmapped AI exercise: ${exercise.name}`);
                    const exerciseMuscles = exercise.target_muscles || exercise.primaryMuscles || workoutJson.target_muscles || [];
                    const primaryMuscles = mapMuscleNamesToEnum(exerciseMuscles);
                    const secondaryMuscles = exercise.secondaryMuscles ? mapMuscleNamesToEnum(exercise.secondaryMuscles) : [];

                    return {
                      id: `ai_workout_${Date.now()}_${index}`,
                      name: exercise.name,
                      sets: Array.from({ length: exercise.sets || 3 }, () => ({
                        weight: 0,
                        reps: exercise.reps || 8,
                        rpe: 8,
                        isWarmup: false,
                        isExecuted: false
                      })),
                      muscleGroups: exerciseMuscles,
                      equipment: exercise.equipment || 'Mixed',
                      primaryMuscles,
                      secondaryMuscles
                    };
                  }
                });

                workoutData = {
                  exercises: formattedExercises,
                  workoutId: `workout_${Date.now()}`
                };

                console.log('✅ ChatService: Formatted workout data:', workoutData);
              } else {
                // Fallback: Try to extract workout data from text if JSON parsing failed
                console.log('⚠️ ChatService: JSON parsing failed, attempting text extraction fallback');
                workoutData = extractWorkoutFromText(workoutStep.output);
              }
            }
          } catch (error) {
            console.log('⚠️ ChatService: Could not extract workout data:', error);
            // Try text extraction as final fallback
            const workoutStep = reasoningChain.steps.find(step => step.name === 'Workout Generation');
            if (workoutStep && workoutStep.output) {
              workoutData = extractWorkoutFromText(workoutStep.output);
            }
          }

          return {
            success: reasoningChain.success,
            workoutData,
            error: reasoningChain.success ? undefined : 'Failed to process workout request'
          };

        } catch (error) {
          console.log('⚠️ ChatService: Multi-step reasoning failed, using simple routing fallback');

          // Fallback to simple intelligent routing
          const request: AIRequest = {
            prompt: message,
            conversationHistory: simpleHistory,
            userId
          };

          const response = await aiRouter.routeRequest(request, onStreamChunk);

          return {
            success: response.success,
            error: response.success ? undefined : response.error
          };
        }
      } else {
        console.log('💬 ChatService: Using simple intelligent routing for general conversation');

        // For non-workout requests, use intelligent routing
        const request: AIRequest = {
          prompt: message,
          conversationHistory: simpleHistory,
          userId
        };

        const response = await aiRouter.routeRequest(request, onStreamChunk);

        return {
          success: response.success,
          error: response.success ? undefined : response.error
        };
      }

    } else {
      console.log('💬 ChatService: Using simple intelligent routing for general conversation');

      // For non-workout requests, use intelligent routing
      const request: AIRequest = {
        prompt: message,
        conversationHistory: simpleHistory,
        userId
      };

      const response = await aiRouter.routeRequest(request, onStreamChunk);

      return {
        success: response.success,
        error: response.success ? undefined : response.error
      };
    }

  } catch (error: any) {
    console.error('❌ ChatService: Intelligent reasoning failed:', error);
    return {
      success: false,
      error: error.message || 'Intelligent reasoning failed'
    };
  }
};

// Helper function to detect workout-related requests
const isWorkoutRelated = (message: string): boolean => {
  const workoutKeywords = [
    'workout', 'exercise', 'training', 'fitness',
    'create', 'generate', 'build', 'design',
    'tricep', 'bicep', 'chest', 'back', 'legs', 'shoulders',
    'abs', 'core', 'calves', 'glutes', 'arms',
    'modify', 'change', 'adjust', 'double'
  ];

  const lowerMessage = message.toLowerCase();
  return workoutKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Helper function to extract JSON from text
const extractJSON = (text: string): any => {
  try {
    console.log('🔍 Attempting to extract JSON from text:', text.substring(0, 500) + '...');

    // Try to find JSON blocks with various patterns
    const patterns = [
      /```json\s*(\{[\s\S]*?\})\s*```/g,  // JSON in code blocks
      /```\s*(\{[\s\S]*?\})\s*```/g,      // JSON in generic code blocks
      /(\{[\s\S]*?\})/g                    // Any JSON-like structure
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          try {
            // Clean the match
            let jsonStr = match.replace(/```json|```/g, '').trim();

            // Try to fix common JSON issues
            jsonStr = fixCommonJSONIssues(jsonStr);

            console.log('🔧 Attempting to parse cleaned JSON:', jsonStr.substring(0, 200) + '...');
            const parsed = JSON.parse(jsonStr);
            console.log('✅ Successfully parsed JSON:', parsed);
            return parsed;
          } catch (parseError) {
            console.log('⚠️ Failed to parse this match:', parseError);

            // Try to fix truncated JSON by completing incomplete objects/arrays
            try {
              const fixedJson = fixTruncatedJSON(match.replace(/```json|```/g, '').trim());
              if (fixedJson) {
                console.log('🔧 Attempting to parse fixed truncated JSON:', fixedJson.substring(0, 200) + '...');
                const parsed = JSON.parse(fixedJson);
                console.log('✅ Successfully parsed fixed JSON:', parsed);
                return parsed;
              }
            } catch (fixError) {
              console.log('⚠️ Failed to fix truncated JSON:', fixError);
            }
            continue;
          }
        }
      }
    }

    // If no patterns worked, try to extract the first complete JSON object
    const firstBrace = text.indexOf('{');
    if (firstBrace !== -1) {
      let braceCount = 0;
      let endIndex = firstBrace;

      for (let i = firstBrace; i < text.length; i++) {
        if (text[i] === '{') braceCount++;
        if (text[i] === '}') braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }

      if (braceCount === 0) {
        const jsonStr = text.substring(firstBrace, endIndex + 1);
        const fixedJson = fixCommonJSONIssues(jsonStr);
        console.log('🔧 Attempting to parse extracted JSON:', fixedJson.substring(0, 200) + '...');
        return JSON.parse(fixedJson);
      } else {
        // Try to fix incomplete JSON
        const incompleteJson = text.substring(firstBrace);
        const fixedJson = fixTruncatedJSON(incompleteJson);
        if (fixedJson) {
          console.log('🔧 Attempting to parse fixed incomplete JSON:', fixedJson.substring(0, 200) + '...');
          return JSON.parse(fixedJson);
        }
      }
    }

  } catch (error) {
    console.log('❌ Could not parse JSON from text:', error);
    console.log('📝 Original text:', text.substring(0, 300) + '...');
  }
  return null;
};

// Helper function to fix common JSON formatting issues
const fixCommonJSONIssues = (jsonStr: string): string => {
  let fixed = jsonStr;

  // Remove trailing commas
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // Fix unquoted property names
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Fix single quotes to double quotes
  fixed = fixed.replace(/'/g, '"');

  // Remove comments
  fixed = fixed.replace(/\/\/.*$/gm, '');
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

  // Fix missing quotes around string values (basic attempt)
  fixed = fixed.replace(/:\s*([a-zA-Z][a-zA-Z0-9\s]*[a-zA-Z0-9])\s*([,}])/g, ': "$1"$2');

  return fixed;
};

// Helper function to fix truncated JSON by completing incomplete structures
const fixTruncatedJSON = (jsonStr: string): string | null => {
  try {
    let fixed = jsonStr.trim();

    console.log('🔧 Attempting to fix truncated JSON:', fixed.substring(0, 200) + '...');

    // Remove any trailing ellipsis or incomplete content
    fixed = fixed.replace(/\.\.\..*$/, '');

    // Remove any trailing incomplete strings or properties
    fixed = fixed.replace(/,?\s*"[^"]*$/, '');
    fixed = fixed.replace(/,?\s*[^,}\]]*$/, '');

    // Apply common fixes
    fixed = fixCommonJSONIssues(fixed);

    // Count braces and brackets to see what's missing
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let lastChar = '';

    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i];

      if (char === '"' && lastChar !== '\\') {
        inString = !inString;
      }

      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
      }

      lastChar = char;
    }

    // If we're in the middle of a string, close it
    if (inString) {
      fixed += '"';
    }

    // Remove trailing commas before closing
    fixed = fixed.replace(/,(\s*)$/, '$1');

    // Close any open arrays
    while (bracketCount > 0) {
      fixed += ']';
      bracketCount--;
    }

    // Close any open objects
    while (braceCount > 0) {
      fixed += '}';
      braceCount--;
    }

    console.log('🔧 Fixed JSON result:', fixed.substring(0, 200) + '...');

    // Try to parse the fixed JSON
    const parsed = JSON.parse(fixed);
    console.log('✅ Successfully parsed fixed JSON:', parsed);
    return fixed;

  } catch (error) {
    console.log('⚠️ Could not fix truncated JSON:', error);
    return null;
  }
};

// Fallback function to extract workout data from text when JSON parsing fails
const extractWorkoutFromText = (text: string): any => {
  try {
    console.log('🔧 ChatService: Attempting text-based workout extraction');
    console.log('📝 Text to extract from:', text.substring(0, 500) + '...');

    // Enhanced exercise patterns to catch more variations
    const exercisePatterns = [
      // Pattern: "**Exercise 1: Push-ups**"
      /\*\*Exercise\s*\d+:\s*(.+?)\*\*/gi,
      // Pattern: "**1. Push-ups**: 3 sets of 10 reps"
      /\*\*\d+\.\s*(.+?)\*\*:\s*(\d+)\s*sets?\s*of\s*(\d+)\s*reps?/gi,
      // Pattern: "1. **Push-ups**: 3 sets of 10 reps"
      /\d+\.\s*\*\*(.+?)\*\*:\s*(\d+)\s*sets?\s*of\s*(\d+)\s*reps?/gi,
      // Pattern: "Do 3 sets of 10 reps, resting for 60 seconds"
      /Do\s*(\d+)\s*sets?\s*of\s*(\d+)\s*reps?.*?resting\s*for\s*(\d+)\s*seconds/gi,
      // Pattern: "Complete 3 sets of 10 reps, resting for 60 seconds"
      /Complete\s*(\d+)\s*sets?\s*of\s*(\d+)\s*reps?.*?resting\s*for\s*(\d+)\s*seconds/gi,
      // Pattern: "Perform 3 sets of 10 reps, resting for 60 seconds"
      /Perform\s*(\d+)\s*sets?\s*of\s*(\d+)\s*reps?.*?resting\s*for\s*(\d+)\s*seconds/gi,
      // Pattern: "3 sets of 10 reps Push-ups"
      /(\d+)\s*sets?\s*of\s*(\d+)\s*reps?\s*(.+)/gi,
      // Pattern: "Push-ups: 3 sets x 10 reps"
      /(.+):\s*(\d+)\s*sets?\s*x\s*(\d+)\s*reps?/gi,
      // Pattern: "1. Push-ups - 3 sets x 10 reps"
      /(\d+)\.\s*(.+)\s*-\s*(\d+)\s*sets?\s*x\s*(\d+)\s*reps?/gi,
      // Pattern: "Push-ups (3x10)"
      /(.+)\s*\((\d+)x(\d+)\)/gi,
      // Pattern: "Push-ups 3x10"
      /(.+)\s+(\d+)x(\d+)/gi,
      // Pattern: "- Push-ups: 3 sets, 10 reps"
      /-\s*(.+):\s*(\d+)\s*sets?,\s*(\d+)\s*reps?/gi,
      // Pattern: "Exercise: Push-ups, Sets: 3, Reps: 10"
      /Exercise:\s*(.+),\s*Sets:\s*(\d+),\s*Reps:\s*(\d+)/gi
    ];

    const exercises = [];
    let exerciseCount = 0;

    for (const pattern of exercisePatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (exerciseCount >= 6) break; // Limit to 6 exercises

        let exerciseName, sets, reps;

        if (match.length === 4) {
          [, sets, reps, exerciseName] = match;
        } else if (match.length === 4) {
          [, exerciseName, sets, reps] = match;
        } else if (match.length === 5) {
          [, , exerciseName, sets, reps] = match;
        }

        if (exerciseName && sets && reps) {
          const cleanExerciseName = exerciseName.trim();
          const existingExercise = mapAIExerciseToExisting(cleanExerciseName);

          if (existingExercise) {
            // Use existing exercise with exact muscle mappings
            exercises.push({
              id: existingExercise.id,
              name: existingExercise.name,
              sets: Array.from({ length: parseInt(sets) || 3 }, () => ({
                weight: 0,
                reps: parseInt(reps) || 8,
                rpe: 8,
                isWarmup: false,
                isExecuted: false
              })),
              muscleGroups: [],
              equipment: 'Mixed',
              primaryMuscles: existingExercise.primaryMuscles,
              secondaryMuscles: existingExercise.secondaryMuscles
            });
          } else {
            // Fallback to creating new exercise
            const defaultMuscles = ['back']; // Default to back since that was the request
            const primaryMuscles = mapMuscleNamesToEnum(defaultMuscles);

            exercises.push({
              id: `ai_workout_${Date.now()}_${exerciseCount}`,
              name: cleanExerciseName,
              sets: Array.from({ length: parseInt(sets) || 3 }, () => ({
                weight: 0,
                reps: parseInt(reps) || 8,
                rpe: 8,
                isWarmup: false,
                isExecuted: false
              })),
              muscleGroups: defaultMuscles,
              equipment: 'Mixed',
              primaryMuscles,
              secondaryMuscles: []
            });
          }
          exerciseCount++;
        }
      }
      if (exercises.length > 0) break; // Stop if we found exercises
    }

    // If still no exercises found, try to extract exercise names from conversational format
    if (exercises.length === 0) {
      console.log('🔍 No structured exercises found, trying to extract exercise names from conversational text');

      // First try to extract from conversational format like "**Exercise 1: Dumbbell Chest Press**"
      const conversationalPatterns = [
        /\*\*Exercise\s*\d+:\s*(.+?)\*\*/gi,
        /\*\*\d+\.\s*(.+?)\*\*/gi,
        /Exercise\s*\d+:\s*(.+?)(?:\n|$)/gi,
        /\d+\.\s*\*\*(.+?)\*\*/gi
      ];

      for (const pattern of conversationalPatterns) {
        const matches = [...text.matchAll(pattern)];
        console.log(`🔍 Pattern ${pattern.source} found ${matches.length} matches`);

        for (const match of matches) {
          const exerciseName = match[1].trim();
          console.log(`🔍 Found exercise name: ${exerciseName}`);

          const existingExercise = mapAIExerciseToExisting(exerciseName);

          if (existingExercise && exerciseCount < 10) {
            exercises.push({
              id: existingExercise.id,
              name: existingExercise.name,
              sets: Array.from({ length: 3 }, () => ({
                weight: 0,
                reps: 10,
                rpe: 8,
                isWarmup: false,
                isExecuted: false
              })),
              muscleGroups: [],
              equipment: 'Mixed',
              primaryMuscles: existingExercise.primaryMuscles,
              secondaryMuscles: existingExercise.secondaryMuscles
            });
            exerciseCount++;
            console.log(`✅ Added exercise from conversational extraction: ${existingExercise.name}`);
          } else {
            console.log(`⚠️ No mapping found for conversational exercise: ${exerciseName}`);
          }
        }
      }
    }

    // If no structured exercises found, try to infer from text content
    if (exercises.length === 0) {
      console.log('⚠️ ChatService: No exercises found in text, attempting intelligent fallback');

      // Try to infer workout type from text content
      const textLower = text.toLowerCase();
      let basicExercises = ['Pull-ups', 'Bent-over Rows', 'Lat Pulldowns', 'Deadlifts']; // Default back workout

      if (textLower.includes('chest') || textLower.includes('push')) {
        basicExercises = ['Push-ups', 'Bench Press', 'Incline Dumbbell Press', 'Dips'];
      } else if (textLower.includes('leg') || textLower.includes('squat') || textLower.includes('lower body')) {
        basicExercises = ['Squats', 'Deadlifts', 'Leg Curls', 'Calf Raises'];
      } else if (textLower.includes('shoulder') || textLower.includes('delt')) {
        basicExercises = ['Overhead Press', 'Lateral Raises', 'Reverse Flyes', 'Dumbbell Shoulder Press'];
      } else if (textLower.includes('arm') || textLower.includes('bicep') || textLower.includes('tricep')) {
        basicExercises = ['Bicep Curls', 'Tricep Extensions', 'Hammer Curls', 'Tricep Pushdowns'];
      } else if (textLower.includes('full body') || textLower.includes('total body')) {
        basicExercises = ['Squats', 'Push-ups', 'Pull-ups', 'Deadlifts', 'Overhead Press'];
      }

      console.log(`🎯 ChatService: Inferred workout type, using exercises: ${basicExercises.join(', ')}`);

      basicExercises.forEach((name, index) => {
        const existingExercise = mapAIExerciseToExisting(name);

        if (existingExercise) {
          // Use existing exercise with exact muscle mappings
          exercises.push({
            id: existingExercise.id,
            name: existingExercise.name,
            sets: Array.from({ length: 3 }, () => ({
              weight: 0,
              reps: 8,
              rpe: 8,
              isWarmup: false,
              isExecuted: false
            })),
            muscleGroups: [],
            equipment: 'Mixed',
            primaryMuscles: existingExercise.primaryMuscles,
            secondaryMuscles: existingExercise.secondaryMuscles
          });
        } else {
          // Fallback to creating new exercise
          const defaultMuscles = ['back'];
          const primaryMuscles = mapMuscleNamesToEnum(defaultMuscles);

          exercises.push({
            id: `ai_workout_${Date.now()}_${index}`,
            name,
            sets: Array.from({ length: 3 }, () => ({
              weight: 0,
              reps: 8,
              rpe: 8,
              isWarmup: false,
              isExecuted: false
            })),
            muscleGroups: defaultMuscles,
            equipment: 'Mixed',
            primaryMuscles,
            secondaryMuscles: []
          });
        }
      });
    }

    if (exercises.length > 0) {
      console.log('✅ ChatService: Extracted exercises from text:', exercises.length);
      return {
        exercises,
        workoutId: `workout_${Date.now()}`
      };
    }

  } catch (error) {
    console.log('❌ ChatService: Text extraction failed:', error);
  }

  return null;
};

// Get Google AI API Key from environment
const getAPIKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key not found. Please add NEXT_PUBLIC_GOOGLE_AI_API_KEY to your environment variables.');
  }
  return apiKey;
};

// Generate system prompt with user context
const generateSystemPrompt = async (userId: string): Promise<string> => {
  try {
    const personalityProfile = await getAIPersonalityProfile(userId);
    
    if (!personalityProfile) {
      return `You are Gymzy AI, a friendly and knowledgeable fitness coach. Help users with their fitness journey, provide workout advice, motivation, and answer fitness-related questions. Be encouraging, supportive, and personalized in your responses.`;
    }

    const userContext = generateAIContext(personalityProfile);
    
    return `You are Gymzy AI, a personalized fitness coach and companion. You have deep knowledge about this specific user based on their onboarding profile. Here's what you know about them:

${userContext}

Your Role:
- Act as their personal fitness coach and motivational companion
- Provide personalized workout recommendations and fitness advice
- Offer motivation and encouragement aligned with their communication style
- Help them overcome their specific challenges
- Reference their personal goals and values when appropriate
- Adapt your communication to their preferred style and feedback preferences
- Be knowledgeable about fitness, nutrition, and wellness
- Remember previous conversations and build on them

Communication Guidelines:
- Use their preferred communication style: ${personalityProfile.communicationStyle}
- Provide ${personalityProfile.feedbackPreference} feedback
- Consider their ${personalityProfile.learningStyle} learning style
- Address their current challenges with empathy
- Reference their personal motivation and life context when relevant
- Be encouraging about their fitness goals while respecting their experience level
- Suggest modifications based on their equipment access and schedule

Remember: You're not just a fitness bot - you're their personal coach who understands their unique situation, challenges, and aspirations.`;

  } catch (error) {
    console.error('Error generating system prompt:', error);
    return `You are Gymzy AI, a friendly and knowledgeable fitness coach. Help users with their fitness journey, provide workout advice, motivation, and answer fitness-related questions. Be encouraging, supportive, and personalized in your responses.`;
  }
};

// Send message to AI and get response using Agentic AI
export const sendChatMessage = async (
  userId: string,
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> => {
  try {
    console.log('💬 ChatService: ===== SENDING CHAT MESSAGE =====');
    console.log('💬 ChatService: User ID:', userId);
    console.log('💬 ChatService: Message:', message);
    console.log('💬 ChatService: History length:', conversationHistory.length);

    // Import and use production agentic service
    const { productionAgenticService } = await import('./production-agentic-service');

    // Validate and clean conversation history, filter out system messages for compatibility
    const chatHistory = conversationHistory
      .filter(msg => msg && msg.role && msg.content && typeof msg.content === 'string')
      .filter(msg => msg.role !== 'system') // Remove system messages for compatibility
      .map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
        userId: msg.userId || 'anonymous'
      }));

    console.log('🤖 ChatService: Calling production agentic AI service...');

    // Call the production agentic AI service with streaming enabled
    let streamedContent = '';
    const result = await productionAgenticService.generateAgenticResponse(
      message,
      chatHistory,
      (chunk: string) => {
        streamedContent += chunk;
        console.log('🌊 ChatService: Received streaming chunk:', chunk);
      }
    );

    console.log('✅ ChatService: Production AI response received');
    console.log('✅ ChatService: Response length:', result.content.length);
    console.log('✅ ChatService: Tool calls:', result.toolCalls?.length || 0);
    console.log('✅ ChatService: Has workout data:', !!result.workoutData);
    console.log('✅ ChatService: Confidence:', result.confidence);
    console.log('✅ ChatService: Execution time:', result.metadata?.executionTime, 'ms');

    return {
      message: result.content,
      success: true,
      toolCalls: result.toolCalls,
      workoutData: result.workoutData,
      isStreaming: result.isStreaming
    };

  } catch (error) {
    console.error('❌ ChatService: Error sending chat message:', error);
    console.error('❌ ChatService: Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Return a fallback response
    return {
      message: "I'm having trouble connecting right now, but I'm here to help with your fitness journey! Try asking me about workouts, nutrition, or motivation.",
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Send message to AI with streaming support using hybrid system (LangChain or Production)
export const sendStreamingChatMessage = async (
  userId: string,
  message: string,
  conversationHistory: ChatMessage[] = [],
  onStreamChunk?: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<StreamingChatResponse> => {
  try {
    console.log(`💬 ChatService: ===== SENDING STREAMING CHAT MESSAGE (${USE_INTELLIGENT_REASONING ? 'INTELLIGENT_REASONING' : 'PRODUCTION'}) =====`);
    console.log('💬 ChatService: User ID:', userId);
    console.log('💬 ChatService: Message:', message);
    console.log('💬 ChatService: History length:', conversationHistory.length);
    console.log('💬 ChatService: Streaming enabled:', !!onStreamChunk);

    // Use intelligent reasoning system for better responses
    if (USE_INTELLIGENT_REASONING) {
      return await sendStreamingChatMessageIntelligent(userId, message, conversationHistory, onStreamChunk, abortSignal);
    } else {
      return await sendStreamingChatMessageProduction(userId, message, conversationHistory, onStreamChunk, abortSignal);
    }
  } catch (error: any) {
    console.error('💬 ChatService: Error in service routing:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
};

// Production implementation (preserved with all improvements)
const sendStreamingChatMessageProduction = async (
  userId: string,
  message: string,
  conversationHistory: ChatMessage[] = [],
  onStreamChunk?: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<StreamingChatResponse> => {
  try {
    console.log('🏭 ChatService: Using Production implementation');

    // Import production agentic service
    const { productionAgenticService } = await import('./production-agentic-service');

    // Convert conversation history to the format expected by production AI
    const chatHistory = conversationHistory.map((msg, index) => ({
      id: msg.id || `msg_${index}`,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.timestamp,
      userId: msg.userId || userId // Use current userId as fallback
    }));

    console.log('🤖 ChatService: Calling production agentic AI service...');

    // Call the production agentic AI service with streaming enabled
    const result = await productionAgenticService.generateAgenticResponse(
      message,
      chatHistory,
      onStreamChunk,
      abortSignal
    );

    console.log('✅ ChatService: Production agentic response received:', {
      hasContent: !!result.content,
      hasToolCalls: !!result.toolCalls?.length,
      hasWorkoutData: !!result.workoutData,
      confidence: result.confidence
    });

    return {
      success: true, // Production service returns response on success, throws on error
      toolCalls: result.toolCalls,
      workoutData: result.workoutData
    };

  } catch (error: any) {
    console.error('🏭 ChatService: Production service error:', error);
    return { success: false, error: error.message || 'Production service error' };
  }
};

// Helper function to map AI-generated exercise names to existing exercises in the database
const mapAIExerciseToExisting = (aiExerciseName: string): any => {
  const { EXERCISES } = require('@/lib/constants');

  // Normalize the AI exercise name for comparison
  const normalizedAIName = aiExerciseName.toLowerCase().trim();

  // Exercise name mapping - maps AI-generated names to existing exercise database names
  const exerciseNameMapping: { [key: string]: string } = {
    // Pull exercises
    'pull-ups': 'pull-up',
    'pullups': 'pull-up',
    'pull ups': 'pull-up',
    'lat pulldowns': 'lat-pulldown',
    'lat pulldown': 'lat-pulldown',
    'pulldowns': 'lat-pulldown',

    // Row exercises
    'bent-over rows': 'barbell-row',
    'bent over rows': 'barbell-row',
    'bent-over dumbbell rows': 'dumbbell-row',
    'bent over dumbbell rows': 'dumbbell-row',
    'dumbbell rows': 'dumbbell-row',
    'barbell rows': 'barbell-row',
    'rows': 'dumbbell-row',

    // Push exercises
    'push-ups': 'push-ups',
    'pushups': 'push-ups',
    'push ups': 'push-ups',
    'bench press': 'bench-press',
    'dumbbell press': 'incline-dumbbell-press',
    'dumbbell chest press': 'incline-dumbbell-press',
    'incline press': 'incline-dumbbell-press',

    // Shoulder exercises
    'overhead press': 'overhead-press',
    'shoulder press': 'seated-dumbbell-shoulder-press',
    'dumbbell shoulder press': 'seated-dumbbell-shoulder-press',
    'lateral raises': 'lateral-raises',
    'side raises': 'lateral-raises',
    'dumbbell lateral raises': 'dumbbell-lateral-raise',
    'reverse flyes': 'reverse-dumbbell-fly',
    'reverse flies': 'reverse-dumbbell-fly',
    'rear delt flyes': 'reverse-dumbbell-fly',

    // Leg exercises
    'squats': 'squat',
    'bodyweight squats': 'squat',
    'back squats': 'squat',
    'deadlifts': 'deadlift',
    'romanian deadlifts': 'romanian-deadlift',
    'rdl': 'romanian-deadlift',
    'leg curls': 'seated-leg-curl',
    'hamstring curls': 'seated-leg-curl',
    'leg extensions': 'leg-extension',
    'quad extensions': 'leg-extension',
    'hip thrusts': 'hip-thrust',
    'glute bridges': 'hip-thrust',

    // Arm exercises
    'bicep curls': 'dumbbell-curl',
    'biceps curls': 'dumbbell-curl',
    'dumbbell curls': 'dumbbell-curl',
    'barbell curls': 'barbell-curl',
    'hammer curls': 'hammer-curl',
    'tricep extensions': 'barbell-lying-triceps-extension',
    'triceps extensions': 'barbell-lying-triceps-extension',
    'tricep pushdowns': 'tricep-pushdown',
    'triceps pushdowns': 'tricep-pushdown',
    'close grip bench press': 'close-grip-bench-press',
    'close-grip bench': 'close-grip-bench-press',

    // Core exercises
    'planks': 'plank',
    'crunches': 'crunch',
    'sit-ups': 'crunch',
    'sit ups': 'crunch',
    'russian twists': 'russian-twists',
    'bicycle crunches': 'bicycle-crunches',
    'leg raises': 'hanging-leg-raise',
    'hanging leg raises': 'hanging-leg-raise',

    // Calf exercises
    'calf raises': 'calf-raises',
    'standing calf raises': 'standing-calf-raise',
    'seated calf raises': 'seated-calf-raise',

    // Cardio/Bodyweight
    'burpees': 'burpees',
    'mountain climbers': 'mountain-climbers',
    'jump squats': 'jump-squats',
    'jumping squats': 'jump-squats',
    'high knees': 'high-knees',
    'dips': 'dips',
    'chest dips': 'dips',
    'tricep dips': 'dips'
  };

  // First try exact mapping
  const mappedId = exerciseNameMapping[normalizedAIName];
  if (mappedId) {
    const existingExercise = EXERCISES.find((ex: any) => ex.id === mappedId);
    if (existingExercise) {
      console.log(`✅ Mapped AI exercise "${aiExerciseName}" to existing exercise "${existingExercise.name}" (${existingExercise.id})`);
      return existingExercise;
    }
  }

  // Try partial matching for more flexible mapping
  for (const [aiName, exerciseId] of Object.entries(exerciseNameMapping)) {
    if (normalizedAIName.includes(aiName) || aiName.includes(normalizedAIName)) {
      const existingExercise = EXERCISES.find((ex: any) => ex.id === exerciseId);
      if (existingExercise) {
        console.log(`✅ Partially mapped AI exercise "${aiExerciseName}" to existing exercise "${existingExercise.name}" (${existingExercise.id})`);
        return existingExercise;
      }
    }
  }

  // Try direct name matching with existing exercises
  const directMatch = EXERCISES.find((ex: any) =>
    ex.name.toLowerCase().trim() === normalizedAIName ||
    normalizedAIName.includes(ex.name.toLowerCase().trim()) ||
    ex.name.toLowerCase().trim().includes(normalizedAIName)
  );

  if (directMatch) {
    console.log(`✅ Direct matched AI exercise "${aiExerciseName}" to existing exercise "${directMatch.name}" (${directMatch.id})`);
    return directMatch;
  }

  console.warn(`⚠️ No mapping found for AI exercise "${aiExerciseName}"`);
  return null;
};

// Helper function to map muscle names to Muscle enum values (fallback for unmapped exercises)
const mapMuscleNamesToEnum = (muscleNames: string[]): string[] => {
  const { Muscle } = require('@/lib/constants');

  const muscleMapping: { [key: string]: string } = {
    // Generic mappings
    'back': Muscle.LatissimusDorsi,
    'lats': Muscle.LatissimusDorsi,
    'latissimus dorsi': Muscle.LatissimusDorsi,
    'rhomboids': Muscle.Rhomboids,
    'traps': Muscle.Trapezius,
    'trapezius': Muscle.Trapezius,
    'erector spinae': Muscle.ErectorSpinae,
    'lower back': Muscle.ErectorSpinae,

    // Chest
    'chest': Muscle.PectoralisMajor,
    'pecs': Muscle.PectoralisMajor,
    'pectorals': Muscle.PectoralisMajor,
    'pectoralis major': Muscle.PectoralisMajor,

    // Shoulders
    'shoulders': Muscle.Deltoid,
    'delts': Muscle.Deltoid,
    'deltoids': Muscle.Deltoid,
    'deltoid': Muscle.Deltoid,
    'anterior deltoid': Muscle.AnteriorDeltoid,
    'lateral deltoid': Muscle.LateralDeltoid,
    'posterior deltoid': Muscle.PosteriorDeltoid,

    // Arms
    'biceps': Muscle.BicepsBrachii,
    'biceps brachii': Muscle.BicepsBrachii,
    'triceps': Muscle.TricepsBrachii,
    'triceps brachii': Muscle.TricepsBrachii,
    'forearms': Muscle.Forearms,
    'brachialis': Muscle.Brachialis,
    'brachioradialis': Muscle.Brachioradialis,

    // Legs
    'quadriceps': Muscle.Quadriceps,
    'quads': Muscle.Quadriceps,
    'hamstrings': Muscle.Hamstrings,
    'hams': Muscle.Hamstrings,
    'glutes': Muscle.GluteusMaximus,
    'gluteus maximus': Muscle.GluteusMaximus,
    'gluteus medius': Muscle.GluteusMedius,
    'calves': Muscle.Calves,
    'gastrocnemius': Muscle.Calves,
    'soleus': Muscle.Soleus,

    // Core
    'abs': Muscle.UpperRectusAbdominis,
    'abdominals': Muscle.UpperRectusAbdominis,
    'core': Muscle.UpperRectusAbdominis,
    'rectus abdominis': Muscle.UpperRectusAbdominis,
    'upper abs': Muscle.UpperRectusAbdominis,
    'lower abs': Muscle.LowerRectusAbdominis,
    'obliques': Muscle.Obliques,
    'serratus anterior': Muscle.SerratusAnterior,
  };

  return muscleNames
    .map(name => {
      const normalizedName = name.toLowerCase().trim();
      return muscleMapping[normalizedName] || muscleMapping[name] || name;
    })
    .filter(muscle => muscle); // Remove any undefined/empty values
};

// Generate daily motivation message using agentic AI
export const generateDailyMotivation = async (
  userId: string,
  context: {
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    lastWorkout?: Date;
    currentStreak: number;
    hasWorkoutToday: boolean;
  },
  messageType: 'motivational' | 'tip' | 'joke' | 'general' = 'general' // Added messageType parameter with default
): Promise<ChatResponse> => {
  try {
    console.log('🎯 Generating agentic welcome message for user:', userId);

    // Use production agentic service for welcome messages
    const { productionAgenticService } = await import('./production-agentic-service');

    const personalityProfile = await getAIPersonalityProfile(userId);

    if (!personalityProfile) {
      return {
        message: "Welcome back! Ready to crush your fitness goals today?",
        success: true
      };
    }

    // Create a contextual prompt for the agentic AI
    const daysSinceLastWorkout = context.lastWorkout
      ? Math.floor((Date.now() - context.lastWorkout.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let motivationPrompt = '';
    switch (messageType) {
      case 'motivational':
        motivationPrompt = `Generate a brief, personalized motivational message for the home page. Focus on motivation and encouragement.`;
        break;
      case 'tip':
        motivationPrompt = `Generate a brief, actionable fitness tip based on the user's activity. Make it practical and relevant.`;
        break;
      case 'joke':
        motivationPrompt = `Tell a lighthearted, fitness-related joke. Keep it short and fun.`;
        break;
      case 'general':
      default:
        motivationPrompt = `Generate a brief, personalized welcome message for the home page. Make it engaging and encouraging.`;
        break;
    }

    const contextualMessage = `${motivationPrompt}

Context:
- Time of day: ${context.timeOfDay}
- Current workout streak: ${context.currentStreak} days
- Has worked out today: ${context.hasWorkoutToday}
- Days since last workout: ${daysSinceLastWorkout || 'unknown'}

Keep the message to 1-2 sentences maximum. Make it personal and encouraging.`;

    // Use agentic service for intelligent, contextual responses
    const agenticResponse = await productionAgenticService.generateAgenticResponse(
      contextualMessage,
      [], // No conversation history for welcome messages
      undefined, // No streaming for welcome messages
      undefined // No abort signal
    );

    if (agenticResponse.content) {
      return {
        message: agenticResponse.content,
        success: true
      };
    } else {
      throw new Error('Agentic service returned empty response');
    }

  } catch (error) {
    console.error('Error generating daily motivation:', error);
    
    // Fallback messages based on context
    let fallbackMessage = "Welcome back to Gymzy! ";
    
    if (context.hasWorkoutToday) {
      fallbackMessage += "Great job on today's workout! 💪";
    } else if (context.currentStreak > 5) {
      fallbackMessage += `Amazing ${context.currentStreak}-day streak! Keep it going! 🔥`;
    } else {
      fallbackMessage += "Ready to crush your fitness goals today? 🚀";
    }

    return {
      message: fallbackMessage,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export default {
  sendChatMessage,
  generateDailyMotivation
};
