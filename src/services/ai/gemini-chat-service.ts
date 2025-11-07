/**
 * Modern Gemini 2.5 Flash Chat Service
 *
 * Clean implementation following 2025 best practices:
 * - Native Gemini function calling (no routing layers)
 * - Proper conversation state management
 * - Streaming support
 * - Simple, maintainable architecture
 */

import { GoogleGenerativeAI, Content, FunctionDeclaration, Tool } from '@google/generative-ai';
import exercisesData from '@/lib/exercises.json';
import { getAllWorkouts } from '@/services/core/workout-service';
import { OnboardingContext } from '@/services/data/onboarding-context-service';
import { COMMUNICATION_STYLE_PROMPTS, COACHING_STYLE_PROMPTS } from '@/lib/ai-style-constants';
import { functionRegistry } from '@/services/agents/function-registry';

// ============================================================================
// Types
// ============================================================================

interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

const exercises = exercisesData as Exercise[];

export interface ChatMessage {
  role: 'user' | 'model' | 'function';
  content: string;
  functionCall?: {
    name: string;
    args: Record<string, any>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, any>;
  };
  timestamp: Date;
}

export interface ConversationState {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
  userContext?: OnboardingContext | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatResponse {
  message: string;
  functionCalls?: Array<{
    name: string;
    args: Record<string, any>;
    result?: any;
  }>;
  success: boolean;
  error?: string;
}

// ============================================================================
// Workout Tool Definitions (Gemini Function Calling Format)
// ============================================================================

const workoutTools: Tool = {
  functionDeclarations: [
    {
      name: 'generateWorkout',
      description: 'IMMEDIATELY generate a personalized workout plan when user requests a workout. CALL THIS FUNCTION as soon as you know the target muscles. Use intelligent defaults for any unspecified parameters.',
      parameters: {
        type: 'OBJECT',
        properties: {
          targetMuscles: {
            type: 'ARRAY',
            description: 'Target muscle groups. INFER from keywords: "leg/legs"=["quadriceps","hamstrings","glutes","calves"], "chest"=["chest","triceps"], "back"=["back","biceps"], "arms"=["biceps","triceps"], "shoulders"=["shoulders","traps"], "full body"=["legs","chest","back","shoulders","arms"]',
            items: { type: 'STRING' }
          },
          workoutType: {
            type: 'STRING',
            description: 'Type of workout. DEFAULT: "strength" if not specified',
            enum: ['strength', 'hypertrophy', 'endurance', 'powerlifting', 'bodyweight']
          },
          experience: {
            type: 'STRING',
            description: 'User fitness experience level. DEFAULT: "intermediate" if not specified',
            enum: ['beginner', 'intermediate', 'advanced']
          },
          duration: {
            type: 'NUMBER',
            description: 'Desired workout duration in minutes. DEFAULT: 45 if not specified'
          },
          equipment: {
            type: 'ARRAY',
            description: 'Available equipment. DEFAULT: ["gym equipment"] if not specified',
            items: { type: 'STRING' }
          }
        },
        required: ['targetMuscles']
      }
    } as FunctionDeclaration,
    {
      name: 'getExerciseInfo',
      description: 'IMMEDIATELY call this when user asks about a specific exercise (e.g. "tell me about bench press", "how to do squats", "what muscles does deadlift work"). Get detailed information about form, muscles worked, and variations.',
      parameters: {
        type: 'OBJECT',
        properties: {
          exerciseName: {
            type: 'STRING',
            description: 'Name of the exercise (e.g. "Bench Press", "Squat", "Deadlift"). INFER from user keywords: "bench"→"Bench Press", "squat"→"Squat", "deadlift"→"Deadlift"'
          }
        },
        required: ['exerciseName']
      }
    } as FunctionDeclaration,
    {
      name: 'getWorkoutHistory',
      description: 'Retrieve user workout history to provide personalized recommendations',
      parameters: {
        type: 'OBJECT',
        properties: {
          limit: {
            type: 'NUMBER',
            description: 'Number of recent workouts to retrieve (default: 5)'
          },
          muscleGroup: {
            type: 'STRING',
            description: 'Filter by specific muscle group (optional)'
          }
        }
      }
    } as FunctionDeclaration
  ]
};

// ============================================================================
// Function Implementations
// ============================================================================

class WorkoutFunctions {
  /**
   * Generate a complete workout plan with real exercises from database
   */
  async generateWorkout(args: any, userId?: string, userContext?: OnboardingContext | null): Promise<any> {
    console.log('🏋️ Generating workout with params:', args);
    console.log('📋 User context available:', !!userContext);

    // Extract context-aware defaults
    const contextDefaults = userContext ? {
      experience: userContext.experienceLevel.overall,
      workoutType: this.deriveWorkoutType(userContext.fitnessGoals.primary),
      duration: this.deriveDuration(userContext.schedule.sessionDuration),
      equipment: userContext.equipment.available
    } : {
      experience: 'intermediate',
      workoutType: 'strength',
      duration: 45,
      equipment: ['gym equipment']
    };

    // Use provided values or context defaults
    const { 
      targetMuscles = [], 
      workoutType = contextDefaults.workoutType, 
      experience = contextDefaults.experience, 
      duration = contextDefaults.duration, 
      equipment = contextDefaults.equipment 
    } = args;

    console.log(`✅ Using experience=${experience}, type=${workoutType}, duration=${duration}min`);

    // Check for injuries/limitations
    if (userContext?.experienceLevel.previousInjuries && userContext.experienceLevel.previousInjuries.length > 0) {
      console.log(`⚠️ User has injuries: ${userContext.experienceLevel.previousInjuries.join(', ')}`);
    }

    // Normalize muscle names for matching
    const normalizeMuscle = (muscle: string) => muscle.toLowerCase().trim();
    const targetMusclesNorm = targetMuscles.map(normalizeMuscle);

    // Filter exercises by target muscles
    const matchingExercises = exercises.filter(ex => {
      const allMuscles = [...ex.primaryMuscles, ...ex.secondaryMuscles].map(normalizeMuscle);
      return targetMusclesNorm.some(target =>
        allMuscles.some(muscle => muscle.includes(target) || target.includes(muscle))
      );
    });

    if (matchingExercises.length === 0) {
      return {
        success: false,
        error: `No exercises found for: ${targetMuscles.join(', ')}. Try: chest, back, legs, shoulders, arms`
      };
    }

    // Get workout configuration
    const config = this.getWorkoutConfig(workoutType, experience);

    // Select exercises (2-3 per muscle group, max 8 total)
    const exercisesPerGroup = Math.max(2, Math.floor(duration / 15));
    const selectedExercises: Exercise[] = [];

    targetMusclesNorm.forEach(target => {
      const muscleExercises = matchingExercises
        .filter(ex => {
          const allMuscles = [...ex.primaryMuscles, ...ex.secondaryMuscles].map(normalizeMuscle);
          return allMuscles.some(m => m.includes(target) || target.includes(m));
        })
        .slice(0, exercisesPerGroup);
      selectedExercises.push(...muscleExercises);
    });

    // Remove duplicates and limit
    const uniqueExercises = Array.from(new Set(selectedExercises.map(e => e.id)))
      .map(id => selectedExercises.find(e => e.id === id)!)
      .slice(0, 8);

    // Build workout
    const workoutExercises = uniqueExercises.map((ex, index) => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: config.sets,
      reps: config.reps,
      restSeconds: config.restSeconds,
      targetMuscles: ex.primaryMuscles,
      order: index + 1
    }));

    return {
      success: true,
      workout: {
        title: `${experience} ${targetMuscles.join(' & ')} Workout`,
        workoutType,
        experience,
        exercises: workoutExercises,
        totalExercises: workoutExercises.length,
        notes: `${config.sets} sets × ${config.reps} reps, ${config.restSeconds}s rest`
      }
    };
  }

  /**
   * Derive workout type from fitness goal
   */
  private deriveWorkoutType(goal: string): string {
    const goalMap: Record<string, string> = {
      'weight_loss': 'endurance',
      'muscle_gain': 'hypertrophy',
      'endurance': 'endurance',
      'strength': 'strength',
      'general_fitness': 'strength',
      'sport_specific': 'strength'
    };
    return goalMap[goal] || 'strength';
  }

  /**
   * Derive duration from schedule preference
   */
  private deriveDuration(sessionDuration: string): number {
    const durationMap: Record<string, number> = {
      '15_30': 25,
      '30_45': 40,
      '45_60': 50,
      '60_90': 75,
      '90_plus': 90
    };
    return durationMap[sessionDuration] || 45;
  }

  /**
   * Get exercise info from database
   */
  async getExerciseInfo(args: any, userId?: string): Promise<any> {
    console.log('📖 Getting exercise info for:', args.exerciseName);

    const searchTerm = args.exerciseName.toLowerCase().trim();
    const exercise = exercises.find(ex =>
      ex.name.toLowerCase() === searchTerm ||
      ex.id === searchTerm ||
      ex.name.toLowerCase().includes(searchTerm)
    );

    if (!exercise) {
      return {
        success: false,
        error: `Exercise "${args.exerciseName}" not found. Try: Bench Press, Squat, Deadlift`
      };
    }

    return {
      success: true,
      exercise: {
        name: exercise.name,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        description: `Primarily targets ${exercise.primaryMuscles.join(', ')}${exercise.secondaryMuscles.length > 0 ? `, also works ${exercise.secondaryMuscles.join(', ')}` : ''}`
      }
    };
  }

  /**
   * Get workout history from Firestore
   */
  async getWorkoutHistory(args: any, userId: string): Promise<any> {
    console.log('📊 Getting workout history for:', userId);

    try {
      const limit = args.limit || 5;
      const workouts = await getAllWorkouts(userId, limit);

      const history = workouts.map(w => ({
        title: w.title,
        date: w.date.toDate().toISOString().split('T')[0],
        exercises: w.exercises.map(e => e.name),
        volume: w.totalVolume,
        rpe: w.rpe
      }));

      return {
        success: true,
        workouts: history,
        message: history.length > 0 ? `Found ${history.length} workouts` : 'No history yet'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch history',
        workouts: []
      };
    }
  }

  private getWorkoutConfig(workoutType: string, experience: string) {
    const configs: Record<string, Record<string, any>> = {
      strength: {
        beginner: { sets: 3, reps: 8, restSeconds: 120 },
        intermediate: { sets: 4, reps: 6, restSeconds: 150 },
        advanced: { sets: 5, reps: 5, restSeconds: 180 }
      },
      hypertrophy: {
        beginner: { sets: 3, reps: 12, restSeconds: 60 },
        intermediate: { sets: 4, reps: 10, restSeconds: 75 },
        advanced: { sets: 5, reps: 8, restSeconds: 90 }
      },
      endurance: {
        beginner: { sets: 2, reps: 15, restSeconds: 45 },
        intermediate: { sets: 3, reps: 20, restSeconds: 45 },
        advanced: { sets: 4, reps: 25, restSeconds: 30 }
      },
      powerlifting: {
        beginner: { sets: 3, reps: 5, restSeconds: 180 },
        intermediate: { sets: 5, reps: 3, restSeconds: 240 },
        advanced: { sets: 6, reps: 2, restSeconds: 300 }
      },
      bodyweight: {
        beginner: { sets: 3, reps: 10, restSeconds: 60 },
        intermediate: { sets: 4, reps: 15, restSeconds: 60 },
        advanced: { sets: 5, reps: 20, restSeconds: 45 }
      }
    };

    return configs[workoutType]?.[experience] || configs.strength.intermediate;
  }
}

// ============================================================================
// Main Gemini Chat Service
// ============================================================================

export class GeminiChatService {
  private genAI: GoogleGenerativeAI;
  private workoutFunctions: WorkoutFunctions;
  private conversations: Map<string, ConversationState>;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_GOOGLE_AI_API_KEY is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.workoutFunctions = new WorkoutFunctions();
    this.conversations = new Map();

    console.log('✅ GeminiChatService initialized with function calling');
  }

  /**
   * Build system instruction based on user preferences
   */
  private buildSystemInstruction(userContext?: OnboardingContext | null): string {
    let communicationStyle = '';
    let coachingStyle = '';

    // Apply user preferences if available
    if (userContext?.preferences) {
      communicationStyle = COMMUNICATION_STYLE_PROMPTS[userContext.preferences.motivationStyle] || COMMUNICATION_STYLE_PROMPTS['encouraging'];
      coachingStyle = COACHING_STYLE_PROMPTS[userContext.preferences.coachingStyle] || COACHING_STYLE_PROMPTS['conversational'];
    } else {
      // Default styles
      communicationStyle = COMMUNICATION_STYLE_PROMPTS['encouraging'];
      coachingStyle = COACHING_STYLE_PROMPTS['conversational'];
    }

    return `You are Gymzy AI, a comprehensive fitness and wellness assistant dedicated to helping users achieve their fitness goals.

<personality>
${communicationStyle}
${coachingStyle}
</personality>

<role>
You are a complete fitness assistant with expertise in ALL areas of fitness, health, and wellness:

**Training & Exercise:**
- Workout programming and generation (your PRIMARY function with immediate function calling)
- Exercise technique, form, and biomechanics
- Progressive overload and periodization strategies
- Strength training, hypertrophy, powerlifting, bodyweight training
- Cardio and conditioning (HIIT, LISS, steady-state)
- Warm-ups, cool-downs, and mobility work
- Sport-specific training

**Nutrition & Diet:**
- Macronutrient recommendations (protein, carbs, fats)
- Calorie targets for various goals (muscle gain, fat loss, recomp, maintenance)
- Meal timing, frequency, and nutrient timing
- Supplement guidance (when beneficial, what to take, dosing)
- Hydration strategies
- Diet approaches (flexible dieting, keto, intermittent fasting, etc.)
- Pre/post-workout nutrition

**Recovery & Health:**
- Sleep optimization for performance and recovery
- Rest days and active recovery strategies
- Deload weeks and recovery protocols
- Injury prevention and management
- Managing soreness (DOMS) and fatigue
- Stress management and its impact on fitness
- Signs of overtraining

**Mental & Lifestyle:**
- Motivation and building discipline
- Goal setting and tracking progress
- Overcoming plateaus (physical and mental)
- Building sustainable habits
- Work-life-training balance
- Mindset for long-term success

**General Fitness Knowledge:**
- Answering "should I..." questions (train when sore, do cardio, etc.)
- Explaining fitness concepts (mind-muscle connection, progressive overload, etc.)
- Troubleshooting common issues
- Evidence-based fitness information
- Debunking fitness myths

NEVER say "I can only help with X" for ANY fitness, health, or wellness-related question. You are a COMPLETE fitness assistant.
</role>

<user_context_handling>
IMPORTANT: At the start of each conversation, you receive a [USER CONTEXT] block containing the user's:
- Fitness goals and timeline
- Experience level and training history
- Previous injuries and limitations
- Available equipment and location
- Workout schedule and preferred times
- Personality preferences (communication and coaching style)
- Health information (sleep, stress, medical conditions)

When the user asks "what do you know about me?", "tell me my profile", "share my data", or similar:
→ READ the [USER CONTEXT] block you received at the start of the conversation
→ SUMMARIZE it back to them in a friendly, organized way
→ Group information by category: Goals, Experience, Equipment, Schedule, Preferences, Health
→ DO NOT say "I don't have access" - you DO have access via the context block
→ Be specific - mention their actual goals, equipment, schedule days, etc.

Use this context naturally in ALL responses to personalize recommendations.
</user_context_handling>

<critical_behavior>
Follow this intelligent decision flow:

1. **WORKOUT REQUEST** (e.g., "give me a leg workout", "chest day")
   → Immediately call generateWorkout() function with inferred parameters
   → DO NOT ask for confirmation, just generate

2. **EXERCISE QUESTION** (e.g., "tell me about bench press", "how to squat")
   → Immediately call getExerciseInfo() function
   → Provide detailed form, muscle, and variation information

3. **WORKOUT HISTORY** (e.g., "show my past workouts", "what did I train last week")
   → Immediately call viewWorkoutHistory() function

4. **VIEW STATS/PROGRESS** (e.g., "show my stats", "how am I doing this month")
   → Immediately call viewStats() function
   → After showing data, suggest: "Would you like to see your full stats page?"

5. **NAVIGATION REQUEST** (e.g., "take me to settings", "go to my profile", "show me the feed")
   → Immediately call navigateTo() function
   → Confirm: "Taking you to [page] now!"

6. **PROFILE VIEW/UPDATE** (e.g., "show my profile", "update my fitness goals")
   → Call viewProfile() or updateProfile() as appropriate
   → After updates, confirm success

7. **SETTINGS CHANGE** (e.g., "change theme to dark", "switch to metric units")
   → Call updateSettings() function
   → Confirm the change was made

8. **USER SEARCH** (e.g., "find users named John", "search for powerlifters")
   → Call searchUsers() function
   → Present results in a friendly format

9. **NUTRITION QUESTION** (macros, calories, diet, supplements)
   → Provide evidence-based, personalized nutrition advice
   → Consider their goals from user context
   → Be specific with numbers and recommendations

10. **RECOVERY/HEALTH QUESTION** (sleep, rest days, soreness, injury)
   → Provide comprehensive guidance on recovery strategies
   → Explain the science when helpful
   → Prioritize safety and long-term health

11. **MENTAL/MOTIVATION** (staying consistent, overcoming plateaus, discipline)
   → Provide supportive, actionable advice
   → Draw from behavioral psychology and proven strategies
   → Acknowledge challenges while offering solutions

12. **GENERAL FITNESS QUESTION** (concepts, "should I...", troubleshooting)
   → Explain clearly and thoroughly
   → Use examples when helpful
   → Provide evidence-based information

The key: Be PROACTIVE and SMART about using functions. When user asks for action, DO IT - don't just talk about it!
</critical_behavior>

<nutrition_guidance>
Provide specific, personalized nutrition advice:

**For Body Recomposition:**
- Calories: Slight deficit (200-300 below maintenance) OR maintenance
- Protein: 0.8-1g per lb bodyweight (crucial for muscle preservation)
- Carbs: Moderate-high, especially around training
- Fats: 0.3-0.4g per lb bodyweight for hormones
- Emphasize: Progressive overload, patience, whole foods, sleep

**For Muscle Gain (Bulking):**
- Calories: 200-500 surplus (lean bulk) or 500+ (aggressive bulk)
- Protein: 0.8-1g per lb bodyweight
- Carbs: High for performance and recovery
- Fats: 0.3-0.5g per lb bodyweight
- Emphasize: Progressive overload, adequate recovery, consistency

**For Fat Loss (Cutting):**
- Calories: 300-500 deficit (moderate) or 500-750 (aggressive)
- Protein: 1-1.2g per lb bodyweight (preserve muscle)
- Carbs: Moderate, prioritize around training
- Fats: 0.25-0.35g per lb bodyweight minimum
- Emphasize: Maintain training intensity, high protein, patience

**Supplements Worth Considering:**
- Creatine monohydrate: 5g daily (most researched, effective)
- Protein powder: If struggling to hit protein targets
- Caffeine: Pre-workout for energy and performance
- Vitamin D: If deficient (common in many climates)
- Fish oil: For overall health if not eating fatty fish

Always mention individual variance and the importance of adjusting based on results.
</nutrition_guidance>

<recovery_guidance>
**Sleep Optimization:**
- 7-9 hours for most people, athletes may need more
- Consistent sleep schedule
- Dark, cool room (65-68°F optimal)
- Limit blue light 1-2 hours before bed
- Sleep impacts recovery, hormones, performance

**Rest and Recovery:**
- Rest days are when muscles grow (not in the gym)
- Active recovery: Light walking, swimming, yoga
- Deload weeks: Every 4-8 weeks, reduce volume/intensity 40-50%
- Listen to your body: Persistent fatigue = need more recovery

**Managing Soreness (DOMS):**
- Normal after new exercises or higher volume
- Peaks 24-72 hours post-workout
- Light activity helps (increases blood flow)
- Can train through mild soreness safely
- Severe pain or joint pain = stop and assess

**Injury Prevention:**
- Proper warm-up (5-10 min, movement prep)
- Progressive overload (don't jump weight too fast)
- Good form > heavy weight
- Address mobility limitations
- Don't ignore pain (pain ≠ gain)
</recovery_guidance>

<inference_rules>
For workout requests, automatically infer target muscles from common phrases:

- "leg workout" / "legs" / "lower body" → ["quadriceps", "hamstrings", "glutes", "calves"]
- "upper body" → ["chest", "back", "shoulders", "arms"]
- "chest workout" / "chest day" → ["chest", "triceps"]
- "back workout" / "back day" → ["back", "biceps"]
- "arm workout" / "arms" → ["biceps", "triceps", "forearms"]
- "shoulder workout" / "shoulders" → ["shoulders", "traps"]
- "core" / "abs" → ["abs", "obliques", "lower back"]
- "full body" → ["legs", "chest", "back", "shoulders", "arms"]
- "push" → ["chest", "shoulders", "triceps"]
- "pull" → ["back", "biceps"]

Default workout parameters if not specified:
- experience: "intermediate"
- workoutType: "strength"
- duration: 45 minutes
- equipment: ["gym equipment"]
</inference_rules>

<function_calling_rules>
1. Workout request with inferable muscles → CALL generateWorkout() IMMEDIATELY
2. Exercise-specific question → CALL getExerciseInfo() IMMEDIATELY
3. Workout history request → CALL getWorkoutHistory() IMMEDIATELY
4. Everything else (nutrition, recovery, motivation, general questions) → Provide comprehensive advice directly

ONLY ask clarifying questions if genuinely critical info is missing and cannot be inferred.
</function_calling_rules>

<examples>
<good_example>
User: "I need a leg workout"
Assistant: [IMMEDIATELY calls generateWorkout with targetMuscles=["quadriceps","hamstrings","glutes","calves"], experience="intermediate", workoutType="strength"]
</good_example>

<good_example>
User: "Should I train when I'm sore?"
Assistant: "Yes, you can definitely train when sore, but it depends on the severity:

**Mild to moderate soreness (DOMS):**
✅ Safe to train the same muscles
- Light activity actually helps by increasing blood flow
- Your performance might be slightly reduced
- The soreness will improve as you warm up

**Severe soreness or sharp pain:**
⚠️ Take it easy or focus on different muscle groups
- Could indicate you overdid it
- Risk of compensating with poor form
- Better to let it recover another day

**Best approach:** Start your workout. If the soreness decreases after warming up and you can maintain good form, continue. If it worsens or affects your technique, switch to a different muscle group or do lighter work.

Also: Consistent training actually reduces DOMS over time as your body adapts."
</good_example>

<good_example>
User: "How much protein should I eat for muscle gain?"
Assistant: "For muscle gain, aim for **0.8-1g of protein per pound of bodyweight** daily. 

If you weigh 180 lbs, that's 144-180g protein per day.

**Why this amount?**
- Maximizes muscle protein synthesis
- Supports recovery and growth
- Higher amounts (>1g/lb) don't show additional benefits in research

**Distribution matters too:**
- Spread across 3-5 meals (20-40g per meal)
- Post-workout protein within 2-3 hours is beneficial
- Consistent daily intake is more important than precise timing

**Good sources:**
- Lean meats: chicken, turkey, lean beef
- Fish: salmon, tuna, white fish
- Eggs and egg whites
- Greek yogurt, cottage cheese
- Protein powder (whey, casein) if needed to hit targets

If you're struggling to hit your protein goals, we can discuss meal planning or supplementation strategies. What's your current typical daily intake?"
</good_example>

<good_example>
User: "tell me about bench press"
Assistant: [IMMEDIATELY calls getExerciseInfo with exerciseName="Bench Press"]
</good_example>

<good_example>
User: "Looking to get nutrition advice for recomp"
Assistant: "For body recomposition (building muscle while losing fat), here's your complete nutrition strategy:

**Calorie Target:**
Eat at maintenance OR a slight deficit (200-300 below maintenance). Recomp works best near maintenance with patient, consistent training.

**Macronutrients:**
- **Protein**: 0.8-1g per lb bodyweight (MOST IMPORTANT - preserves muscle in deficit, supports growth)
- **Fats**: 0.3-0.4g per lb bodyweight (hormone production, satiety)
- **Carbs**: Fill remaining calories, prioritize around workouts for performance

**Example for 180 lb person:**
- Calories: 2400-2500 (assuming ~2700 maintenance)
- Protein: 144-180g (576-720 calories)
- Fats: 54-72g (486-648 calories)
- Carbs: 280-320g (remaining calories)

**Key Principles:**
1. **Progressive overload is CRITICAL** - must be getting stronger to build muscle
2. **Be patient** - recomp is slower than pure bulking or cutting (expect 2-3 months to see clear changes)
3. **Track protein religiously** - it's the most important macro for recomp
4. **Eat more on training days if desired** (carb cycling can work well)
5. **Sleep 7-9 hours** - recovery is when muscle grows
6. **Manage stress** - high cortisol hurts recomp progress

**What to track:**
- Weekly average weight (should stay relatively stable)
- Strength progress (should be going up)
- Photos every 2-3 weeks (better than scale)
- How clothes fit

What's your current training split and experience level? I can help optimize your training to match this nutrition approach."
</good_example>

<good_example>
User: "I keep losing motivation after 2 weeks"
Assistant: "This is incredibly common - you're not alone. The issue isn't motivation; it's relying on motivation in the first place. Here's how to fix it:

**The Real Problem:**
Motivation is an emotion - it comes and goes. Successful people use **systems and habits**, not motivation.

**Solutions:**

**1. Make it stupid easy to start**
- Lay out gym clothes the night before
- Pack gym bag in advance
- Choose a gym on your commute (remove friction)
- Lower the barrier: "I'll just do 10 minutes" (you'll usually do more)

**2. Anchor to existing habits**
- "After my morning coffee, I do my workout"
- "Right after work, I go to the gym (no going home first)"
- Use existing routines as triggers

**3. Focus on the process, not results**
- Instead of "I want to lose 20 lbs" → "I will train 4x per week"
- Celebrate showing up, not just progress
- Track workout completion (streak tracking is powerful)

**4. Start smaller than you think**
- 2-3 days per week is better than an ambitious 6-day plan you quit
- 30-minute workouts you actually do > 90-minute workouts you skip

**5. Remove the decision**
- Same workout days each week (non-negotiable calendar blocks)
- Same time if possible
- Don't debate "should I go?" - it's already decided

**The 2-week pattern:**
That's when novelty wears off. This is where discipline takes over. Push through weeks 3-4, and it starts becoming automatic around week 6-8.

Would it help to create a realistic, sustainable workout schedule that fits your lifestyle? What days/times work best for you?"
</good_example>

<bad_example>
User: "Should I do cardio?"
Assistant: "I can only help with workout generation. I can't provide cardio advice."
[WRONG - you should provide comprehensive advice about cardio: when to do it, types, benefits, how to integrate with lifting, etc.]
</bad_example>

<bad_example>
User: "I need a leg workout"
Assistant: "What type of workout are you looking for? What's your experience level?"
[WRONG - should immediately generate with intelligent defaults]
</bad_example>

<bad_example>
User: "How do I stay consistent?"
Assistant: "Just stay motivated and keep going!"
[WRONG - too vague, not helpful. Should provide specific, actionable strategies like habit stacking, reducing friction, tracking, etc.]
</bad_example>
</examples>

<response_style>
- **Be helpful and comprehensive** for general questions
- **Be direct and immediate** for workout generation
- **Be specific with numbers** for nutrition advice
- **Be supportive but actionable** for motivation/mental questions
- **Explain the "why"** when it adds value
- **Keep it concise** but don't sacrifice helpfulness
- **Never refuse fitness-related questions** - you're a complete fitness assistant
</response_style>`;
  }

  /**
   * Get or create model with user-specific system instruction
   */
  private getModel(userContext?: OnboardingContext | null) {
    const systemInstruction = this.buildSystemInstruction(userContext);

    if (userContext?.preferences) {
      console.log(`🎭 Using personalized AI: ${userContext.preferences.motivationStyle} communication + ${userContext.preferences.coachingStyle} coaching`);
    } else {
      console.log('🤖 Using default AI personality');
    }

    // Combine workout tools with ALL agent function tools from registry
    const allTools: Tool[] = [
      workoutTools, // Keep existing workout generation tools
      ...this.getAgentTools() // Add profile, settings, navigation, etc.
    ];

    console.log(`🔧 AI has ${allTools.length} tool groups available (workout + agent functions)`);

    return this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: allTools,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
      systemInstruction
    });
  }

  /**
   * Get agent function tools from registry
   */
  private getAgentTools(): Tool[] {
    // Get all tool definitions except workout generation (already handled above)
    const profileFunctions = functionRegistry.getFunctionsForDomain('profile');
    const systemFunctions = functionRegistry.getFunctionsForDomain('system');
    const workoutOtherFunctions = ['viewWorkoutHistory', 'viewWorkoutDetails', 'deleteWorkout',
                                    'logWorkout', 'viewStats', 'getPersonalBests'];

    const functionDeclarations: FunctionDeclaration[] = [];

    // Add workout helper functions
    workoutOtherFunctions.forEach(fnName => {
      const decl = this.getFunctionDeclaration(fnName);
      if (decl) functionDeclarations.push(decl);
    });

    // Add profile functions
    profileFunctions.forEach(fnName => {
      const decl = this.getFunctionDeclaration(fnName);
      if (decl) functionDeclarations.push(decl);
    });

    // Add system functions
    systemFunctions.forEach(fnName => {
      const decl = this.getFunctionDeclaration(fnName);
      if (decl) functionDeclarations.push(decl);
    });

    return [{ functionDeclarations }];
  }

  /**
   * Get Gemini function declaration for a function name
   */
  private getFunctionDeclaration(name: string): FunctionDeclaration | null {
    const declarations: Record<string, FunctionDeclaration> = {
      // Workout functions
      viewWorkoutHistory: {
        name: 'viewWorkoutHistory',
        description: 'View workout history. Use when user asks "show my workouts", "what did I do last week"',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            limit: { type: 'NUMBER' as const, description: 'Number of workouts (default: 10)' },
            sortBy: { type: 'STRING' as const, description: 'Sort order: recent or oldest' }
          }
        }
      },
      viewWorkoutDetails: {
        name: 'viewWorkoutDetails',
        description: 'Get detailed information about a specific workout',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            workoutId: { type: 'STRING' as const, description: 'ID of the workout' }
          },
          required: ['workoutId']
        }
      },
      viewStats: {
        name: 'viewStats',
        description: 'View workout statistics and progress',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            timeframe: { type: 'STRING' as const, description: 'week, month, year, or all-time' },
            metric: { type: 'STRING' as const, description: 'volume, frequency, strength, or overview' }
          }
        }
      },
      getPersonalBests: {
        name: 'getPersonalBests',
        description: 'Get personal best records',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            exerciseName: { type: 'STRING' as const, description: 'Specific exercise (optional)' }
          }
        }
      },
      logWorkout: {
        name: 'logWorkout',
        description: 'Start logging a new workout',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            workoutType: { type: 'STRING' as const, description: 'Type: strength, cardio, flexibility, sports' }
          }
        }
      },

      // Profile functions
      viewProfile: {
        name: 'viewProfile',
        description: 'View user profile. Use when user says "show my profile"',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            userId: { type: 'STRING' as const, description: 'User ID (optional)' }
          }
        }
      },
      updateProfile: {
        name: 'updateProfile',
        description: 'Update user profile',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            displayName: { type: 'STRING' as const },
            bio: { type: 'STRING' as const },
            fitnessGoals: { type: 'ARRAY' as const, items: { type: 'STRING' as const } }
          }
        }
      },
      searchUsers: {
        name: 'searchUsers',
        description: 'Search for users',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            query: { type: 'STRING' as const, description: 'Search query' },
            limit: { type: 'NUMBER' as const }
          },
          required: ['query']
        }
      },

      // System functions
      navigateTo: {
        name: 'navigateTo',
        description: 'Navigate to a page. Use when user says "go to stats", "show settings", "take me to profile"',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            page: { type: 'STRING' as const, description: 'Page: home, chat, workout, stats, feed, profile, settings, notifications, discover' }
          },
          required: ['page']
        }
      },
      viewSettings: {
        name: 'viewSettings',
        description: 'View user settings',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            category: { type: 'STRING' as const, description: 'all, preferences, privacy, or notifications' }
          }
        }
      },
      updateSettings: {
        name: 'updateSettings',
        description: 'Update settings like theme or units',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            theme: { type: 'STRING' as const, description: 'light, dark, or system' },
            units: { type: 'STRING' as const, description: 'metric or imperial' }
          }
        }
      }
    };

    return declarations[name] || null;
  }

  /**
   * Get or create conversation state
   */
  private async getConversation(
    sessionId: string,
    userId: string,
    userContext?: OnboardingContext | null,
    providedHistory?: Array<{role: string; content: string}>
  ): Promise<ConversationState> {
    if (!this.conversations.has(sessionId)) {
      console.log(`🔄 Session ${sessionId} not in memory, loading history...`);

      // Create new conversation
      const conversation: ConversationState = {
        sessionId,
        userId,
        messages: [],
        userContext,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // If we have user context, inject it as a system message at the start
      if (userContext) {
        const contextSummary = this.buildContextSummary(userContext);
        conversation.messages.push({
          role: 'user',
          content: contextSummary,
          timestamp: new Date()
        });
        console.log('✅ Injected user context into new conversation');
      }

      // Use provided history if available (from frontend)
      if (providedHistory && providedHistory.length > 0) {
        console.log(`📚 Using provided history: ${providedHistory.length} messages`);
        const loadedMessages: ChatMessage[] = providedHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          content: msg.content,
          timestamp: new Date()
        }));
        conversation.messages.push(...loadedMessages);
      }

      this.conversations.set(sessionId, conversation);
    }

    // Update context if provided and different
    const conversation = this.conversations.get(sessionId)!;
    if (userContext && !conversation.userContext) {
      conversation.userContext = userContext;

      // If messages are empty or only have one message, inject context
      if (conversation.messages.length <= 1) {
        const contextSummary = this.buildContextSummary(userContext);
        conversation.messages.unshift({
          role: 'user',
          content: contextSummary,
          timestamp: new Date()
        });
        console.log('✅ Injected user context into existing conversation');
      }
    }

    return conversation;
  }

  /**
   * Build a concise context summary from user onboarding data
   */
  private buildContextSummary(context: OnboardingContext): string {
    console.log('🔍 Building context summary from:', JSON.stringify(context, null, 2));

    const parts: string[] = [
      `[USER CONTEXT - This information should guide all workout recommendations]`
    ];

    // Fitness Goals
    if (context.fitnessGoals) {
      parts.push(`\nGoals: Primary=${context.fitnessGoals.primary}, Timeline=${context.fitnessGoals.targetTimeline}`);
      if (context.fitnessGoals.secondary && context.fitnessGoals.secondary.length > 0) {
        parts.push(`Secondary goals: ${context.fitnessGoals.secondary.join(', ')}`);
      }
    }

    // Experience Level
    if (context.experienceLevel) {
      parts.push(`\nExperience: ${context.experienceLevel.overall} (${context.experienceLevel.yearsTraining} years training)`);
      const exp = context.experienceLevel.specificExperience;
      parts.push(`Specific: Weightlifting=${exp.weightlifting}, Cardio=${exp.cardio}, Flexibility=${exp.flexibility}`);
      
      if (context.experienceLevel.previousInjuries && context.experienceLevel.previousInjuries.length > 0) {
        parts.push(`⚠️ Previous Injuries: ${context.experienceLevel.previousInjuries.join(', ')}`);
      }
      if (context.experienceLevel.limitations && context.experienceLevel.limitations.length > 0) {
        parts.push(`⚠️ Limitations: ${context.experienceLevel.limitations.join(', ')}`);
      }
    }

    // Equipment & Environment
    if (context.equipment) {
      parts.push(`\nEquipment: ${context.equipment.location} - ${context.equipment.available.join(', ') || 'None specified'}`);
      parts.push(`Space: ${context.equipment.spaceConstraints}`);
    }

    // Schedule
    if (context.schedule) {
      parts.push(`\nSchedule: ${context.schedule.workoutDays.join(', ')}`);
      parts.push(`Preferred times: ${context.schedule.preferredTimes.join(', ')}`);
      parts.push(`Session duration: ${context.schedule.sessionDuration}`);
    }

    // Preferences (AI personality is already applied via system instruction)
    if (context.preferences) {
      parts.push(`\nPreferences: Intensity=${context.preferences.workoutIntensity}, Social=${context.preferences.socialPreference}`);
      parts.push(`Feedback frequency=${context.preferences.feedbackFrequency}`);
      parts.push(`Note: Communication style (${context.preferences.motivationStyle}) and coaching style (${context.preferences.coachingStyle}) are already active in my personality.`);
    }

    // Health Info
    if (context.healthInfo) {
      if (context.healthInfo.medicalConditions && context.healthInfo.medicalConditions.length > 0) {
        parts.push(`\n⚠️ Medical conditions: ${context.healthInfo.medicalConditions.join(', ')}`);
      }
      parts.push(`\nSleep: ${context.healthInfo.sleepPattern.averageHours}h (${context.healthInfo.sleepPattern.quality})`);
      parts.push(`Stress: ${context.healthInfo.stressLevel}, Energy: ${context.healthInfo.energyLevels}`);
    }

    parts.push(`\n[END USER CONTEXT - Use this to personalize all recommendations]`);

    return parts.join('\n');
  }

  /**
   * Convert ChatMessage to Gemini Content format
   */
  private toGeminiContent(messages: ChatMessage[]): Content[] {
    return messages.map(msg => {
      if (msg.role === 'function' && msg.functionResponse) {
        // Function response format
        return {
          role: 'function',
          parts: [{
            functionResponse: msg.functionResponse
          }]
        };
      }

      if (msg.functionCall) {
        // Function call from model
        return {
          role: 'model',
          parts: [{
            functionCall: msg.functionCall
          }]
        };
      }

      // Regular text message
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      };
    });
  }

  /**
   * Execute function call
   */
  private async executeFunction(name: string, args: Record<string, any>, userId: string, userContext?: OnboardingContext | null): Promise<any> {
    console.log(`🔧 Executing function: ${name}`);

    // Special handling for workout generation (needs userContext)
    if (name === 'generateWorkout') {
      return await this.workoutFunctions.generateWorkout(args, userId, userContext);
    }

    // Use function registry for all other functions
    // This includes: workout history, profile, settings, navigation, etc.
    const result = await functionRegistry.execute(name, args, userId);

    console.log(`✅ Function ${name} executed:`, result.success ? 'SUCCESS' : 'FAILED');

    return result;
  }

  /**
   * Send message with automatic function calling
   */
  async sendMessage(
    sessionId: string,
    userId: string,
    userMessage: string,
    userContext?: OnboardingContext | null,
    providedHistory?: Array<{role: string; content: string}>
  ): Promise<ChatResponse> {
    try {
      const conversation = await this.getConversation(sessionId, userId, userContext, providedHistory);

      // Add user message to history
      conversation.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Convert history to Gemini format
      const history = this.toGeminiContent(conversation.messages);

      // Get personalized model based on user preferences
      const model = this.getModel(userContext);

      // Start chat with history
      const chat = model.startChat({
        history: history.slice(0, -1), // All messages except the last one
      });

      // Send message
      let result = await chat.sendMessage(userMessage);
      let response = result.response;

      // Handle function calls
      const functionCalls: ChatResponse['functionCalls'] = [];

      // Keep calling functions until we get a text response
      let calls = response.functionCalls?.();
      while (calls && calls.length > 0) {
        console.log('📞 Model requested function calls');

        // Execute all function calls
        for (const call of calls) {
          console.log(`   → ${call.name}(${JSON.stringify(call.args)})`);

          // Execute function
          const functionResult = await this.executeFunction(call.name, call.args, userId, conversation.userContext);

          // Store function call info
          functionCalls.push({
            name: call.name,
            args: call.args,
            result: functionResult
          });

          // Add function call to history
          conversation.messages.push({
            role: 'model',
            content: '',
            functionCall: {
              name: call.name,
              args: call.args
            },
            timestamp: new Date()
          });

          // Add function response to history
          conversation.messages.push({
            role: 'function',
            content: '',
            functionResponse: {
              name: call.name,
              response: functionResult
            },
            timestamp: new Date()
          });

          // Send function result back to model
          result = await chat.sendMessage([{
            functionResponse: {
              name: call.name,
              response: functionResult
            }
          }]);

          response = result.response;
        }
        
        // Check for more function calls
        calls = response.functionCalls?.();
      }

      // Get final text response
      const finalMessage = response.text();

      // Add assistant response to history
      conversation.messages.push({
        role: 'model',
        content: finalMessage,
        timestamp: new Date()
      });

      conversation.updatedAt = new Date();

      return {
        message: finalMessage,
        functionCalls,
        success: true
      };

    } catch (error) {
      console.error('❌ GeminiChatService error:', error);
      return {
        message: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send message with streaming
   */
  async sendMessageStreaming(
    sessionId: string,
    userId: string,
    userMessage: string,
    onChunk: (chunk: string) => void,
    userContext?: OnboardingContext | null,
    providedHistory?: Array<{role: string; content: string}>
  ): Promise<ChatResponse> {
    try {
      const conversation = await this.getConversation(sessionId, userId, userContext, providedHistory);

      // Add user message
      conversation.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Convert history
      const history = this.toGeminiContent(conversation.messages);

      // Get personalized model based on user preferences
      const model = this.getModel(userContext);

      // Start chat
      const chat = model.startChat({
        history: history.slice(0, -1),
      });

      // Send with streaming
      let result = await chat.sendMessageStream(userMessage);

      let fullText = '';
      const functionCalls: ChatResponse['functionCalls'] = [];

      // First pass: collect initial response
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          onChunk(chunkText);
        }
      }

      // Get the aggregated response with null safety
      // Note: In streaming, result.response returns the response directly (not wrapped)
      let response = await result.response;

      if (!response) {
        console.warn('⚠️ No response after initial streaming');
        // Return what we have so far
        conversation.messages.push({
          role: 'model',
          content: fullText,
          timestamp: new Date()
        });
        conversation.updatedAt = new Date();
        return {
          message: fullText,
          functionCalls,
          success: true
        };
      }

      // Handle function calls in a loop (like non-streaming version)
      let calls = response?.functionCalls ? response.functionCalls() : undefined;
      while (calls && calls.length > 0) {
        console.log('📞 Model requested function calls (streaming)');

        // Execute all function calls
        for (const call of calls) {
          console.log(`   → ${call.name}(${JSON.stringify(call.args)})`);

          // Execute function
          const functionResult = await this.executeFunction(call.name, call.args, userId, conversation.userContext);

          // Store function call info
          functionCalls.push({
            name: call.name,
            args: call.args,
            result: functionResult
          });

          // Send function result back to continue conversation
          result = await chat.sendMessageStream([{
            functionResponse: {
              name: call.name,
              response: functionResult
            }
          }]);

          // Stream the model's response about the function result
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              fullText += chunkText;
              onChunk(chunkText);
            }
          }

          // Safely get response with null checks
          // Note: In streaming, result.response returns the response directly
          response = await result.response;
          if (!response) {
            console.warn('⚠️ No response after function call');
            break;
          }
        }

        // Check for more function calls with null safety
        calls = response?.functionCalls ? response.functionCalls() : undefined;
      }

      // Add to history
      conversation.messages.push({
        role: 'model',
        content: fullText,
        timestamp: new Date()
      });

      conversation.updatedAt = new Date();

      return {
        message: fullText,
        functionCalls,
        success: true
      };

    } catch (error) {
      console.error('❌ GeminiChatService streaming error:', error);
      return {
        message: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId: string): ChatMessage[] {
    return this.conversations.get(sessionId)?.messages || [];
  }

  /**
   * Clear conversation
   */
  clearHistory(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  /**
   * Get active conversations count
   */
  getActiveConversationsCount(): number {
    return this.conversations.size;
  }
}

// Export singleton instance
export const geminiChatService = new GeminiChatService();
