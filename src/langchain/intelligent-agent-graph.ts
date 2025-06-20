import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import {
  IntelligentAgentState,
  analyzeIntent,
  extractParameters,
  validateAndCorrect,
  executeWorkoutCreation,
  generateResponse
} from "./intelligent-agent";

// Define the state graph for intelligent workout creation
const createIntelligentWorkoutGraph = () => {
  const workflow = new StateGraph<IntelligentAgentState>({
    channels: {
      user_input: null,
      conversation_history: null,
      user_id: null,
      intent_analysis: null,
      extracted_parameters: null,
      validated_parameters: null,
      workout_data: null,
      response_content: null,
      confidence_score: null,
      error_state: null,
      current_step: null,
      steps_completed: null,
      needs_correction: null
    }
  });

  // Add nodes
  workflow.addNode("analyze_intent", analyzeIntent);
  workflow.addNode("extract_parameters", extractParameters);
  workflow.addNode("validate_and_correct", validateAndCorrect);
  workflow.addNode("execute_workout_creation", executeWorkoutCreation);
  workflow.addNode("generate_response", generateResponse);

  // Define the flow
  workflow.setEntryPoint("analyze_intent");

  // Add edges with conditional logic
  workflow.addConditionalEdges(
    "analyze_intent",
    (state: IntelligentAgentState) => {
      if (state.error_state) return "end";
      return "extract_parameters";
    },
    {
      extract_parameters: "extract_parameters",
      end: END
    }
  );

  workflow.addConditionalEdges(
    "extract_parameters",
    (state: IntelligentAgentState) => {
      if (state.error_state) return "end";
      return "validate_and_correct";
    },
    {
      validate_and_correct: "validate_and_correct",
      end: END
    }
  );

  workflow.addConditionalEdges(
    "validate_and_correct",
    (state: IntelligentAgentState) => {
      if (state.error_state) return "end";
      return "execute_workout_creation";
    },
    {
      execute_workout_creation: "execute_workout_creation",
      end: END
    }
  );

  workflow.addConditionalEdges(
    "execute_workout_creation",
    (state: IntelligentAgentState) => {
      if (state.error_state) return "end";
      return "generate_response";
    },
    {
      generate_response: "generate_response",
      end: END
    }
  );

  workflow.addEdge("generate_response", END);

  return workflow.compile();
};

// Main intelligent agent function
export async function invokeIntelligentAgent(
  userInput: string,
  conversationHistory: BaseMessage[],
  userId: string
): Promise<{
  content: string;
  workoutData?: any;
  confidence: number;
  reasoning: string;
  success: boolean;
  metadata: {
    steps_completed: string[];
    execution_time: number;
    error_state?: string;
  };
}> {
  const startTime = Date.now();
  console.log(`🧠 Intelligent Agent: Processing request for user ${userId}: "${userInput}"`);

  const app = createIntelligentWorkoutGraph();

  const initialState: IntelligentAgentState = {
    user_input: userInput,
    conversation_history: conversationHistory,
    user_id: userId,
    intent_analysis: null,
    extracted_parameters: null,
    validated_parameters: null,
    workout_data: null,
    response_content: "",
    confidence_score: 0,
    error_state: null,
    current_step: "starting",
    steps_completed: [],
    needs_correction: false
  };

  try {
    const finalState = await app.invoke(initialState, { recursionLimit: 10 });

    const executionTime = Date.now() - startTime;
    console.log(`✅ Intelligent Agent: Completed in ${executionTime}ms`);
    console.log(`📊 Steps completed: ${finalState.steps_completed?.join(' → ')}`);

    // Generate reasoning explanation
    const reasoning = generateReasoningExplanation(finalState);

    return {
      content: finalState.response_content || "I encountered an issue processing your request.",
      workoutData: finalState.workout_data,
      confidence: finalState.confidence_score || 0.5,
      reasoning,
      success: !finalState.error_state,
      metadata: {
        steps_completed: finalState.steps_completed || [],
        execution_time: executionTime,
        error_state: finalState.error_state || undefined
      }
    };

  } catch (error) {
    console.error("❌ Intelligent Agent: Execution failed:", error);
    
    return {
      content: "I encountered a technical issue while processing your request. Let me try a simpler approach.",
      confidence: 0.2,
      reasoning: "Agent execution failed due to technical error",
      success: false,
      metadata: {
        steps_completed: ["error"],
        execution_time: Date.now() - startTime,
        error_state: "execution_failed"
      }
    };
  }
}

// Generate reasoning explanation for transparency
function generateReasoningExplanation(state: IntelligentAgentState): string {
  const steps = state.steps_completed || [];
  const reasoning: string[] = [];

  if (steps.includes("analyze_intent")) {
    const muscles = state.intent_analysis?.muscle_groups?.join(", ") || "general";
    reasoning.push(`Identified target muscle groups: ${muscles}`);
  }

  if (steps.includes("extract_parameters")) {
    const count = state.extracted_parameters?.exercise_count || 0;
    const difficulty = state.extracted_parameters?.difficulty || "beginner";
    reasoning.push(`Extracted parameters: ${count} exercises at ${difficulty} level`);
  }

  if (steps.includes("execute_workout_creation")) {
    const exerciseNames = state.workout_data?.exercises?.map((ex: any) => ex.name).join(", ") || "";
    reasoning.push(`Selected exercises: ${exerciseNames}`);
  }

  if (state.error_state) {
    reasoning.push(`Encountered issue: ${state.error_state}`);
  }

  return reasoning.join(". ") || "Processed request using intelligent reasoning chain";
}

export { createIntelligentWorkoutGraph };
