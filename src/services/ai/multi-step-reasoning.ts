/**
 * Multi-Step Reasoning Service
 * Implements intelligent reasoning chains for complex AI tasks
 */

import { aiRouter, AIRequest, AIResponse } from './intelligent-ai-router';

export interface ReasoningStep {
  id: string;
  name: string;
  description: string;
  input: string;
  output?: string;
  confidence?: number;
  apiUsed?: 'groq' | 'gemini';
  executionTime?: number;
  success?: boolean;
  error?: string;
}

export interface ReasoningChain {
  id: string;
  userInput: string;
  steps: ReasoningStep[];
  finalOutput: string;
  overallConfidence: number;
  totalExecutionTime: number;
  success: boolean;
  reasoning: string;
}

export interface WorkoutParameters {
  targetMuscles: string[];
  exerciseCount: number;
  difficulty: string;
  equipment: string[];
  duration?: number;
  workoutType: string;
}

export class MultiStepReasoningService {
  private static instance: MultiStepReasoningService;

  private constructor() {}

  public static getInstance(): MultiStepReasoningService {
    if (!MultiStepReasoningService.instance) {
      MultiStepReasoningService.instance = new MultiStepReasoningService();
    }
    return MultiStepReasoningService.instance;
  }

  /**
   * Execute multi-step reasoning for workout creation
   */
  public async executeWorkoutReasoning(
    userInput: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    onStreamChunk?: (chunk: string) => void
  ): Promise<ReasoningChain> {
    const chainId = `reasoning_${Date.now()}`;
    const startTime = Date.now();

    console.log('🧠 Multi-Step Reasoning: Starting workout reasoning chain');
    console.log('📝 User Input:', userInput);

    const steps: ReasoningStep[] = [];

    try {
      // Step 1: Intent Analysis (Fast - use Gemini)
      const intentStep = await this.executeIntentAnalysis(userInput, conversationHistory);
      steps.push(intentStep);

      if (!intentStep.success) {
        throw new Error('Intent analysis failed');
      }

      // Step 2: Parameter Extraction (Complex - use Groq)
      const parameterStep = await this.executeParameterExtraction(userInput, intentStep.output!, conversationHistory);
      steps.push(parameterStep);

      if (!parameterStep.success) {
        throw new Error('Parameter extraction failed');
      }

      // Step 3: Validation and Correction (Moderate - use best available)
      const validationStep = await this.executeValidation(parameterStep.output!, userInput);
      steps.push(validationStep);

      // Step 4: Workout Generation (Complex - use Groq)
      const generationStep = await this.executeWorkoutGeneration(validationStep.output!, userInput);
      steps.push(generationStep);

      // Step 5: Response Formatting (Simple - use Gemini)
      const formattingStep = await this.executeResponseFormatting(
        generationStep.output!,
        userInput,
        onStreamChunk
      );
      steps.push(formattingStep);

      const totalExecutionTime = Date.now() - startTime;
      const overallConfidence = this.calculateOverallConfidence(steps);

      return {
        id: chainId,
        userInput,
        steps,
        finalOutput: formattingStep.output || 'Failed to generate response',
        overallConfidence,
        totalExecutionTime,
        success: formattingStep.success || false,
        reasoning: this.generateReasoningExplanation(steps)
      };

    } catch (error) {
      console.error('❌ Multi-Step Reasoning: Chain execution failed:', error);

      return {
        id: chainId,
        userInput,
        steps,
        finalOutput: "I encountered an issue while processing your workout request. Let me try a simpler approach.",
        overallConfidence: 0.2,
        totalExecutionTime: Date.now() - startTime,
        success: false,
        reasoning: `Reasoning chain failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Step 1: Intent Analysis
   */
  private async executeIntentAnalysis(
    userInput: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<ReasoningStep> {
    const stepId = 'intent_analysis';
    const startTime = Date.now();

    try {
      const prompt = `Analyze this fitness request and extract the user's intent:

User Request: "${userInput}"

Recent conversation context:
${conversationHistory.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Respond with a JSON object containing:
{
  "intent": "workout_creation|workout_modification|general_question|greeting",
  "target_muscles": ["muscle1", "muscle2"],
  "workout_type": "strength|cardio|flexibility|mixed",
  "modification_type": "none|add_exercises|remove_exercises|change_difficulty|double_workout",
  "confidence": 0.0-1.0
}`;

      const request: AIRequest = {
        prompt,
        context: 'intent_analysis',
        conversationHistory,
        requiresReasoning: false
      };

      const response = await aiRouter.routeRequest(request);

      return {
        id: stepId,
        name: 'Intent Analysis',
        description: 'Analyze user intent and extract basic workout requirements',
        input: userInput,
        output: response.content,
        confidence: response.confidence,
        apiUsed: response.apiUsed,
        executionTime: Date.now() - startTime,
        success: response.success
      };

    } catch (error) {
      return {
        id: stepId,
        name: 'Intent Analysis',
        description: 'Analyze user intent and extract basic workout requirements',
        input: userInput,
        confidence: 0.1,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Step 2: Parameter Extraction
   */
  private async executeParameterExtraction(
    userInput: string,
    intentAnalysis: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<ReasoningStep> {
    const stepId = 'parameter_extraction';
    const startTime = Date.now();

    try {
      const prompt = `Based on the intent analysis, extract detailed workout parameters:

User Request: "${userInput}"
Intent Analysis: ${intentAnalysis}

Extract specific parameters and respond with ONLY valid JSON (no additional text):

{
  "target_muscles": ["specific muscle groups"],
  "exercise_count": 4,
  "difficulty": "intermediate",
  "equipment": ["bodyweight", "dumbbell"],
  "duration_minutes": 30,
  "workout_type": "strength",
  "special_requirements": []
}

IMPORTANT:
- Respond with ONLY the JSON object
- Use double quotes for all strings
- No trailing commas
- Be specific about muscle groups (e.g., "triceps", "shoulders", "calves" not just "arms")`;

      const request: AIRequest = {
        prompt,
        context: 'parameter_extraction',
        conversationHistory,
        requiresReasoning: true
      };

      const response = await aiRouter.routeRequest(request);

      return {
        id: stepId,
        name: 'Parameter Extraction',
        description: 'Extract detailed workout parameters from user request',
        input: intentAnalysis,
        output: response.content,
        confidence: response.confidence,
        apiUsed: response.apiUsed,
        executionTime: Date.now() - startTime,
        success: response.success
      };

    } catch (error) {
      return {
        id: stepId,
        name: 'Parameter Extraction',
        description: 'Extract detailed workout parameters from user request',
        input: intentAnalysis,
        confidence: 0.1,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Step 3: Validation and Correction
   */
  private async executeValidation(
    extractedParameters: string,
    userInput: string
  ): Promise<ReasoningStep> {
    const stepId = 'validation';
    const startTime = Date.now();

    try {
      const prompt = `Validate and correct these workout parameters:

Original Request: "${userInput}"
Extracted Parameters: ${extractedParameters}

Validate and correct any issues:
1. Ensure muscle groups are specific and accurate
2. Verify exercise count is reasonable (1-8 exercises)
3. Check equipment availability
4. Ensure difficulty matches user level

Respond with corrected JSON parameters and explanation of any changes made.`;

      const request: AIRequest = {
        prompt,
        context: 'validation',
        requiresReasoning: true
      };

      const response = await aiRouter.routeRequest(request);

      return {
        id: stepId,
        name: 'Validation & Correction',
        description: 'Validate and correct extracted parameters',
        input: extractedParameters,
        output: response.content,
        confidence: response.confidence,
        apiUsed: response.apiUsed,
        executionTime: Date.now() - startTime,
        success: response.success
      };

    } catch (error) {
      return {
        id: stepId,
        name: 'Validation & Correction',
        description: 'Validate and correct extracted parameters',
        input: extractedParameters,
        confidence: 0.1,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Step 4: Workout Generation
   */
  private async executeWorkoutGeneration(
    validatedParameters: string,
    userInput: string
  ): Promise<ReasoningStep> {
    const stepId = 'workout_generation';
    const startTime = Date.now();

    try {
      const prompt = `Generate a complete workout based on these validated parameters:

Parameters: ${validatedParameters}
Original Request: "${userInput}"

Create a detailed workout and respond with ONLY valid JSON (no additional text):

{
  "workout_name": "Back Strength Workout",
  "exercises": [
    {
      "name": "Pull-ups",
      "sets": 3,
      "reps": 8,
      "rest_seconds": 60,
      "instructions": "Full range of motion"
    },
    {
      "name": "Bent-over Rows",
      "sets": 3,
      "reps": 10,
      "rest_seconds": 60,
      "instructions": "Keep back straight"
    }
  ],
  "estimated_duration": "25-30 minutes",
  "target_muscles": ["latissimus dorsi", "rhomboids", "trapezius"],
  "difficulty": "intermediate"
}

IMPORTANT:
- Respond with ONLY the JSON object
- Use double quotes for all strings
- No trailing commas
- Include 3-5 exercises for the target muscle groups
- Use specific exercise names`;

      const request: AIRequest = {
        prompt,
        context: 'workout_generation',
        requiresReasoning: true
      };

      const response = await aiRouter.routeRequest(request);

      return {
        id: stepId,
        name: 'Workout Generation',
        description: 'Generate complete workout structure',
        input: validatedParameters,
        output: response.content,
        confidence: response.confidence,
        apiUsed: response.apiUsed,
        executionTime: Date.now() - startTime,
        success: response.success
      };

    } catch (error) {
      return {
        id: stepId,
        name: 'Workout Generation',
        description: 'Generate complete workout structure',
        input: validatedParameters,
        confidence: 0.1,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Step 5: Response Formatting
   */
  private async executeResponseFormatting(
    workoutData: string,
    userInput: string,
    onStreamChunk?: (chunk: string) => void
  ): Promise<ReasoningStep> {
    const stepId = 'response_formatting';
    const startTime = Date.now();

    try {
      const prompt = `Format this workout data into a friendly, conversational response:

Workout Data: ${workoutData}
Original Request: "${userInput}"

Create a natural, encouraging response that:
1. Acknowledges the user's specific request
2. Presents the workout in an easy-to-read format
3. Explains why these exercises were chosen
4. Includes motivational language
5. Keeps it concise but informative

Write as Gymzy, the friendly AI fitness coach.`;

      const request: AIRequest = {
        prompt,
        context: 'response_formatting',
        requiresReasoning: false
      };

      const response = await aiRouter.routeRequest(request, onStreamChunk);

      return {
        id: stepId,
        name: 'Response Formatting',
        description: 'Format workout into user-friendly response',
        input: workoutData,
        output: response.content,
        confidence: response.confidence,
        apiUsed: response.apiUsed,
        executionTime: Date.now() - startTime,
        success: response.success
      };

    } catch (error) {
      return {
        id: stepId,
        name: 'Response Formatting',
        description: 'Format workout into user-friendly response',
        input: workoutData,
        confidence: 0.1,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate overall confidence from all steps
   */
  private calculateOverallConfidence(steps: ReasoningStep[]): number {
    const successfulSteps = steps.filter(step => step.success && step.confidence);
    if (successfulSteps.length === 0) return 0.1;

    const avgConfidence = successfulSteps.reduce((sum, step) => sum + (step.confidence || 0), 0) / successfulSteps.length;
    const successRate = successfulSteps.length / steps.length;

    return Math.min(0.95, avgConfidence * successRate);
  }

  /**
   * Generate reasoning explanation
   */
  private generateReasoningExplanation(steps: ReasoningStep[]): string {
    const completedSteps = steps.filter(step => step.success);
    const stepNames = completedSteps.map(step => step.name);
    
    return `Completed ${completedSteps.length}/${steps.length} reasoning steps: ${stepNames.join(' → ')}`;
  }
}

// Export singleton instance
export const multiStepReasoning = MultiStepReasoningService.getInstance();
