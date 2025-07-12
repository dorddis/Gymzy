import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Enhanced state for intelligent reasoning
interface IntelligentAgentState {
  user_input: string;
  conversation_history: BaseMessage[];
  user_id: string;
  
  // Reasoning chain states
  intent_analysis: {
    muscle_groups: string[];
    workout_type: string;
    modifications: any;
    complexity: string;
    confidence: number;
  } | null;
  
  extracted_parameters: {
    target_muscles: string[];
    exercise_count: number;
    difficulty: string;
    equipment: string[];
    time_constraints?: number;
  } | null;
  
  validated_parameters: any | null;
  workout_data: any | null;
  response_content: string;
  confidence_score: number;
  error_state: string | null;
  
  // Execution tracking
  current_step: string;
  steps_completed: string[];
  needs_correction: boolean;
}

// Initialize LLM
const llm = new ChatGroq({
  model: "llama3-8b-8192",
  temperature: 0.3, // Lower temperature for more consistent reasoning
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

// Comprehensive muscle group mapping
const MUSCLE_GROUPS = {
  // Upper body
  chest: ['chest', 'pecs', 'pectoral'],
  back: ['back', 'lats', 'latissimus', 'rhomboids', 'traps'],
  shoulders: ['shoulders', 'delts', 'deltoids', 'shoulder'],
  triceps: ['triceps', 'tricep', 'tri'],
  biceps: ['biceps', 'bicep', 'bi'],
  forearms: ['forearms', 'forearm', 'wrists'],
  
  // Lower body
  quadriceps: ['quads', 'quadriceps', 'thighs', 'front thigh'],
  hamstrings: ['hamstrings', 'hams', 'back thigh'],
  glutes: ['glutes', 'butt', 'glute', 'buttocks'],
  calves: ['calves', 'calf', 'lower leg'],
  
  // Core
  abs: ['abs', 'core', 'abdominals', 'stomach'],
  obliques: ['obliques', 'side abs', 'love handles'],
  
  // Full body
  full_body: ['full body', 'total body', 'whole body', 'everything']
};

// Exercise database by muscle group
const EXERCISE_DATABASE = {
  triceps: [
    { name: 'Tricep Dips', equipment: 'bodyweight', difficulty: 'intermediate' },
    { name: 'Close-Grip Push-ups', equipment: 'bodyweight', difficulty: 'beginner' },
    { name: 'Overhead Tricep Extension', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Diamond Push-ups', equipment: 'bodyweight', difficulty: 'advanced' }
  ],
  shoulders: [
    { name: 'Shoulder Press', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Lateral Raises', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Front Raises', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Pike Push-ups', equipment: 'bodyweight', difficulty: 'intermediate' }
  ],
  calves: [
    { name: 'Calf Raises', equipment: 'bodyweight', difficulty: 'beginner' },
    { name: 'Jump Rope', equipment: 'jump_rope', difficulty: 'beginner' },
    { name: 'Box Jumps', equipment: 'box', difficulty: 'intermediate' },
    { name: 'Single-Leg Calf Raises', equipment: 'bodyweight', difficulty: 'intermediate' }
  ],
  legs: [
    { name: 'Squat', equipment: 'bodyweight', difficulty: 'beginner' },
    { name: 'Bulgarian Split Squat', equipment: 'bodyweight', difficulty: 'intermediate' },
    { name: 'Lunge', equipment: 'bodyweight', difficulty: 'beginner' },
    { name: 'Wall Sit', equipment: 'bodyweight', difficulty: 'beginner' }
  ],
  back: [
    { name: 'Pull-up', equipment: 'pull_up_bar', difficulty: 'intermediate' },
    { name: 'Dumbbell Row', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Superman', equipment: 'bodyweight', difficulty: 'beginner' },
    { name: 'Reverse Fly', equipment: 'dumbbell', difficulty: 'beginner' }
  ]
};

// Tool: Muscle Group Classifier
const classifyMuscleGroups = tool(
  async ({ user_input }: { user_input: string }) => {
    const lowerInput = user_input.toLowerCase();
    const detectedGroups: string[] = [];
    
    // Check for specific muscle groups
    for (const [muscle, keywords] of Object.entries(MUSCLE_GROUPS)) {
      for (const keyword of keywords) {
        if (lowerInput.includes(keyword)) {
          detectedGroups.push(muscle);
          break;
        }
      }
    }
    
    // If no specific groups found, use LLM for semantic analysis
    if (detectedGroups.length === 0) {
      const analysisPrompt = `Analyze this fitness request and identify the specific muscle groups mentioned: "${user_input}"
      
Available muscle groups: ${Object.keys(MUSCLE_GROUPS).join(', ')}

Respond with only the muscle group names, separated by commas. If no specific muscle groups are mentioned, respond with "general".`;

      const response = await llm.invoke([new HumanMessage(analysisPrompt)]);
      const muscleGroups = response.content.toString().split(',').map(m => m.trim().toLowerCase());
      detectedGroups.push(...muscleGroups.filter(m => Object.keys(MUSCLE_GROUPS).includes(m)));
    }
    
    return {
      detected_groups: detectedGroups,
      confidence: detectedGroups.length > 0 ? 0.9 : 0.3
    };
  },
  {
    name: "classify_muscle_groups",
    description: "Classify specific muscle groups mentioned in user input",
    schema: z.object({
      user_input: z.string().describe("The user&apos;s workout request")
    })
  }
);

// Tool: Exercise Selector
const selectExercises = tool(
  async ({ muscle_groups, exercise_count, difficulty, equipment }: { 
    muscle_groups: string[], 
    exercise_count: number, 
    difficulty: string,
    equipment: string[]
  }) => {
    const selectedExercises: any[] = [];
    const availableEquipment = equipment.length > 0 ? equipment : ['bodyweight'];
    
    for (const muscleGroup of muscle_groups) {
      const exercises = EXERCISE_DATABASE[muscleGroup as keyof typeof EXERCISE_DATABASE] || [];
      
      // Filter by equipment and difficulty
      const suitableExercises = exercises.filter(ex => 
        availableEquipment.includes(ex.equipment) &&
        (difficulty === 'any' || ex.difficulty === difficulty || 
         (difficulty === 'beginner' && ex.difficulty !== 'advanced'))
      );
      
      // Select exercises for this muscle group
      const exercisesPerGroup = Math.max(1, Math.floor(exercise_count / muscle_groups.length));
      const selected = suitableExercises.slice(0, exercisesPerGroup);
      selectedExercises.push(...selected);
    }
    
    // If we don&apos;t have enough exercises, fill with general exercises
    while (selectedExercises.length < exercise_count && selectedExercises.length < 8) {
      const generalExercises = [
        { name: 'Push-ups', equipment: 'bodyweight', difficulty: 'beginner' },
        { name: 'Squats', equipment: 'bodyweight', difficulty: 'beginner' },
        { name: 'Plank', equipment: 'bodyweight', difficulty: 'beginner' }
      ];
      
      for (const ex of generalExercises) {
        if (!selectedExercises.find(sel => sel.name === ex.name)) {
          selectedExercises.push(ex);
          if (selectedExercises.length >= exercise_count) break;
        }
      }
      break;
    }
    
    return {
      exercises: selectedExercises.slice(0, exercise_count),
      total_selected: selectedExercises.length
    };
  },
  {
    name: "select_exercises",
    description: "Select appropriate exercises based on muscle groups and constraints",
    schema: z.object({
      muscle_groups: z.array(z.string()).describe("Target muscle groups"),
      exercise_count: z.number().describe("Number of exercises to select"),
      difficulty: z.string().describe("Difficulty level"),
      equipment: z.array(z.string()).describe("Available equipment")
    })
  }
);

// Tool: Workout Validator
const validateWorkout = tool(
  async ({ workout_data }: { workout_data: any }) => {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Validate exercise count
    if (workout_data.exercises.length === 0) {
      issues.push("No exercises selected");
    } else if (workout_data.exercises.length > 8) {
      issues.push("Too many exercises for a single workout");
      suggestions.push("Consider splitting into multiple workouts");
    }
    
    // Validate muscle group targeting
    const targetedMuscles = workout_data.target_muscles || [];
    if (targetedMuscles.length === 0) {
      issues.push("No specific muscle groups targeted");
    }
    
    // Validate workout duration
    const estimatedDuration = workout_data.exercises.length * 5; // 5 minutes per exercise
    if (estimatedDuration > 60) {
      suggestions.push("Workout may be too long, consider reducing exercises");
    }
    
    return {
      is_valid: issues.length === 0,
      issues,
      suggestions,
      confidence: issues.length === 0 ? 0.9 : 0.5
    };
  },
  {
    name: "validate_workout",
    description: "Validate workout structure for safety and effectiveness",
    schema: z.object({
      workout_data: z.any().describe("The workout data to validate")
    })
  }
);

// Available tools
const tools = [classifyMuscleGroups, selectExercises, validateWorkout];

// Agent Nodes

// Node 1: Intent Analysis
async function analyzeIntent(state: IntelligentAgentState): Promise<Partial<IntelligentAgentState>> {
  console.log("🔍 Intelligent Agent: Analyzing intent...");

  try {
    // Step 1: Classify muscle groups
    const muscleClassification = await classifyMuscleGroups.invoke({ user_input: state.user_input });

    // Step 2: Determine workout type and complexity
    const analysisPrompt = `Analyze this fitness request for workout type and complexity: "${state.user_input}"

Detected muscle groups: ${muscleClassification.detected_groups.join(', ')}

Determine:
1. Workout type (strength, cardio, flexibility, mixed)
2. Complexity (simple, moderate, complex)
3. Any modification requests (add, remove, change, double, etc.)

Respond in JSON format:
{
  "workout_type": "strength|cardio|flexibility|mixed",
  "complexity": "simple|moderate|complex",
  "modifications": {
    "type": "none|add|remove|change|double",
    "details": "description of modification"
  }
}`;

    const analysisResponse = await llm.invoke([new HumanMessage(analysisPrompt)]);
    const analysis = JSON.parse(analysisResponse.content.toString());

    return {
      intent_analysis: {
        muscle_groups: muscleClassification.detected_groups,
        workout_type: analysis.workout_type,
        modifications: analysis.modifications,
        complexity: analysis.complexity,
        confidence: muscleClassification.confidence
      },
      current_step: "intent_analyzed",
      steps_completed: [...state.steps_completed, "analyze_intent"]
    };
  } catch (error) {
    console.error("❌ Intent analysis failed:", error);
    return {
      error_state: "intent_analysis_failed",
      needs_correction: true
    };
  }
}

// Node 2: Parameter Extraction
async function extractParameters(state: IntelligentAgentState): Promise<Partial<IntelligentAgentState>> {
  console.log("📋 Intelligent Agent: Extracting parameters...");

  if (!state.intent_analysis) {
    return { error_state: "missing_intent_analysis" };
  }

  try {
    const extractionPrompt = `Extract workout parameters from this request: "${state.user_input}"

Context:
- Detected muscle groups: ${state.intent_analysis.muscle_groups.join(', ')}
- Workout type: ${state.intent_analysis.workout_type}
- Complexity: ${state.intent_analysis.complexity}

Extract:
1. Number of exercises (default: 3-4 for specific muscle groups, 5-6 for full body)
2. Difficulty level (beginner, intermediate, advanced)
3. Equipment preferences (bodyweight, dumbbell, etc.)
4. Time constraints (if mentioned)

Respond in JSON format:
{
  "exercise_count": number,
  "difficulty": "beginner|intermediate|advanced",
  "equipment": ["bodyweight", "dumbbell", etc.],
  "time_constraints": number_in_minutes_or_null
}`;

    const extractionResponse = await llm.invoke([new HumanMessage(extractionPrompt)]);
    const parameters = JSON.parse(extractionResponse.content.toString());

    // Set defaults if not specified
    const extractedParams = {
      target_muscles: state.intent_analysis.muscle_groups,
      exercise_count: parameters.exercise_count || (state.intent_analysis.muscle_groups.length === 1 ? 3 : 4),
      difficulty: parameters.difficulty || 'beginner',
      equipment: parameters.equipment || ['bodyweight'],
      time_constraints: parameters.time_constraints
    };

    return {
      extracted_parameters: extractedParams,
      current_step: "parameters_extracted",
      steps_completed: [...state.steps_completed, "extract_parameters"]
    };
  } catch (error) {
    console.error("❌ Parameter extraction failed:", error);
    return {
      error_state: "parameter_extraction_failed",
      needs_correction: true
    };
  }
}

// Node 3: Validation and Correction
async function validateAndCorrect(state: IntelligentAgentState): Promise<Partial<IntelligentAgentState>> {
  console.log("✅ Intelligent Agent: Validating parameters...");

  if (!state.extracted_parameters) {
    return { error_state: "missing_extracted_parameters" };
  }

  let params = { ...state.extracted_parameters };
  const corrections: string[] = [];

  // Validate muscle groups
  if (params.target_muscles.length === 0) {
    params.target_muscles = ['full_body'];
    corrections.push("No specific muscle groups detected, defaulting to full body");
  }

  // Validate exercise count
  if (params.exercise_count < 1 || params.exercise_count > 8) {
    params.exercise_count = Math.max(1, Math.min(8, params.exercise_count));
    corrections.push(`Adjusted exercise count to ${params.exercise_count}`);
  }

  // Validate equipment
  if (params.equipment.length === 0) {
    params.equipment = ['bodyweight'];
    corrections.push("No equipment specified, defaulting to bodyweight");
  }

  return {
    validated_parameters: params,
    current_step: "parameters_validated",
    steps_completed: [...state.steps_completed, "validate_parameters"],
    needs_correction: corrections.length > 0
  };
}

// Node 4: Execute Workout Creation
async function executeWorkoutCreation(state: IntelligentAgentState): Promise<Partial<IntelligentAgentState>> {
  console.log("🏋️ Intelligent Agent: Creating workout...");

  if (!state.validated_parameters) {
    return { error_state: "missing_validated_parameters" };
  }

  try {
    const params = state.validated_parameters;

    // Select exercises using the tool
    const exerciseSelection = await selectExercises.invoke({
      muscle_groups: params.target_muscles,
      exercise_count: params.exercise_count,
      difficulty: params.difficulty,
      equipment: params.equipment
    });

    // Build workout structure
    const workoutData = {
      id: `workout_${Date.now()}`,
      name: generateWorkoutName(params.target_muscles),
      exercises: exerciseSelection.exercises.map((ex: any, index: number) => ({
        id: `exercise_${index}`,
        name: ex.name,
        sets: getDifficultyBasedSets(params.difficulty),
        reps: getDifficultyBasedReps(params.difficulty, ex.name),
        weight: 0,
        restTime: 60,
        equipment: ex.equipment,
        instructions: `Perform ${ex.name} with proper form`
      })),
      target_muscles: params.target_muscles,
      difficulty: params.difficulty,
      estimated_duration: exerciseSelection.exercises.length * 5,
      created_at: new Date().toISOString()
    };

    // Validate the created workout
    const validation = await validateWorkout.invoke({ workout_data: workoutData });

    return {
      workout_data: workoutData,
      confidence_score: validation.confidence,
      current_step: "workout_created",
      steps_completed: [...state.steps_completed, "execute_workout_creation"],
      error_state: validation.is_valid ? null : "workout_validation_failed"
    };
  } catch (error) {
    console.error("❌ Workout creation failed:", error);
    return {
      error_state: "workout_creation_failed",
      needs_correction: true
    };
  }
}

// Node 5: Generate Response
async function generateResponse(state: IntelligentAgentState): Promise<Partial<IntelligentAgentState>> {
  console.log("💬 Intelligent Agent: Generating response...");

  if (!state.workout_data) {
    return { error_state: "missing_workout_data" };
  }

  try {
    const workout = state.workout_data;
    const muscleGroups = workout.target_muscles.join(', ');

    const responsePrompt = `Generate a friendly, conversational response for a workout that was just created.

Workout Details:
- Name: ${workout.name}
- Target Muscles: ${muscleGroups}
- Exercises: ${workout.exercises.map((ex: any) => `${ex.name} (${ex.sets} sets of ${ex.reps} reps)`).join(', ')}
- Estimated Duration: ${workout.estimated_duration} minutes
- Difficulty: ${workout.difficulty}

Requirements:
1. Be enthusiastic and encouraging
2. Mention the specific muscle groups being targeted
3. Briefly explain why these exercises were chosen
4. Keep it conversational and human-like
5. Don&apos;t be overly long - 2-3 sentences max

Original user request: "${state.user_input}"`;

    const responseMessage = await llm.invoke([new HumanMessage(responsePrompt)]);

    return {
      response_content: responseMessage.content.toString(),
      current_step: "response_generated",
      steps_completed: [...state.steps_completed, "generate_response"]
    };
  } catch (error) {
    console.error("❌ Response generation failed:", error);
    return {
      response_content: `I've created a ${state.workout_data.name} for you! This workout targets your ${state.workout_data.target_muscles.join(' and ')} with ${state.workout_data.exercises.length} exercises. Let&apos;s get started!`,
      error_state: "response_generation_failed"
    };
  }
}

// Helper functions
function generateWorkoutName(muscleGroups: string[]): string {
  if (muscleGroups.length === 1) {
    const muscle = muscleGroups[0];
    return `${muscle.charAt(0).toUpperCase() + muscle.slice(1)} Workout`;
  } else if (muscleGroups.length === 2) {
    return `${muscleGroups.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ')} Workout`;
  } else {
    return 'Full Body Workout';
  }
}

function getDifficultyBasedSets(difficulty: string): number {
  switch (difficulty) {
    case 'advanced': return 4;
    case 'intermediate': return 3;
    default: return 3;
  }
}

function getDifficultyBasedReps(difficulty: string, exerciseName: string): number {
  const isBodyweight = !exerciseName.toLowerCase().includes('dumbbell') &&
                      !exerciseName.toLowerCase().includes('barbell');

  if (isBodyweight) {
    switch (difficulty) {
      case 'advanced': return 15;
      case 'intermediate': return 12;
      default: return 10;
    }
  } else {
    switch (difficulty) {
      case 'advanced': return 12;
      case 'intermediate': return 10;
      default: return 8;
    }
  }
}

export type { IntelligentAgentState };
export {
  tools,
  MUSCLE_GROUPS,
  EXERCISE_DATABASE,
  analyzeIntent,
  extractParameters,
  validateAndCorrect,
  executeWorkoutCreation,
  generateResponse
};
