// Core LangChain and LangGraph imports
import { StateGraph, END, START, CompiledGraph } from '@langchain/langgraph';
import { Tool } from '@langchain/core/tools';
import { RunnableLambda, TypedValue } from '@langchain/core/runnables'; // TypedValue might not be directly used for state definition but good to know
import { MessagesPlaceholder, ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { AIMessage, HumanMessage, BaseMessage, ToolMessage, SystemMessage } from '@langchain/core/messages';
import { ConversationBufferWindowMemory } from 'langchain/memory'; // For managing chat history

// Vertex AI specific imports
import { ChatVertexAI } from '@langchain/google-vertexai';

// Tool related imports
import { allLangchainTools } from './tools'; // Our LangChain tool wrappers
import { EnhancedWorkoutTools, ToolExecutionContext } from '../services/enhanced-workout-tools'; // To call original tool logic

// Prebuilt components (optional, but ToolExecutor can be useful)
import { ToolExecutor } from '@langchain/langgraph/prebuilt';
import { ToolInvocation } from '@langchain/core/messages'; // Represents a tool call requested by the LLM

// --- 1. Initialize LLM and Tools ---

const llm = new ChatVertexAI({
  modelName: "gemini-1.5-pro-preview-0409", // Using a recommended capable model
  temperature: 0.7,
  // convertSystemMessageToHuman: true, // Keep an eye on this; Gemini generally supports SystemMessages
});

const enhancedWorkoutToolsExecutor = new EnhancedWorkoutTools(); // To access original tool definitions

// If using ToolExecutor, it can simplify calling LangChain tools, but we need to call original tools for context
// const toolExecutor = new ToolExecutor(allLangchainTools);


// --- 2. Define Agent State ---

export interface AgentInvocationResult {
  finalOutput: string;
  workoutData?: { exercises: any[]; workoutId: string } | null;
  // We could add rawToolCalls: ToolInvocation[] if useful for UI/debugging
}

interface AgentState {
  input: string;
  chat_history: BaseMessage[];
  agent_outcome: AIMessage | null;       // LLM's decision, potentially with tool_calls
  intermediate_steps: Array<[ToolInvocation, string]>; // Store tool calls and their string outputs for history
  userId: string | null;                 // User ID for tool context
  extractedWorkoutData?: { exercises: any[]; workoutId: string } | null; // To store structured workout data
  // Potentially add:
  // sessionId: string | null;
  // userProfile: any | null; // If fetched and used by tools via context
}

const defaultAgentState: AgentState = {
    input: "",
    chat_history: [],
    agent_outcome: null,
    intermediate_steps: [],
    userId: null,
    extractedWorkoutData: null,
};

// --- 3. Define Graph Nodes ---

/**
 * Node to call the LLM.
 * The LLM will decide whether to respond to the user or use tools.
 */
const callModel = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log("🚀 Agent: Calling model...");
  const { input, chat_history, userId } = state;

  const systemPrompt = `You are Gymzy, a helpful AI fitness coach.
  Your goal is to assist users with workout creation, exercise searching, and saving their workouts.
  You have access to the following tools:
  ${allLangchainTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

  Based on the user's input and conversation history, decide if you need to use a tool or if you can respond directly.
  If you need to use a tool, provide the tool name and its arguments.
  If the user asks to save a workout but does not provide details (e.g., exercises), you should use the "save_user_workout" tool but also indicate in your thoughts (not directly to the user yet) that you will need to ask for these details if the tool cannot proceed without them. The tool itself might also prompt for this.
  Your response should be an AIMessage. If using tools, include 'tool_calls' in the AIMessage.

  User ID for this interaction (use if tools require it, but don't mention it to the user): ${userId || 'not_provided'}`;


  const prompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(systemPrompt),
    new MessagesPlaceholder("chat_history"),
    new HumanMessage(input),
  ]);

  // Bind tools to LLM for Gemini function calling
  const llmWithTools = llm.bindTools(allLangchainTools);
  const response: AIMessage = await llmWithTools.invoke(await prompt.formatMessages({ chat_history }));

  console.log("🤖 LLM Response:", JSON.stringify(response, null, 2));

  // If the AIMessage contains tool_calls, these are ToolInvocation objects by default from Gemini
  return {
    agent_outcome: response,
  };
};

/**
 * Node to execute tools.
 * This node takes the tool invocations from the LLM and calls the actual underlying tool functions.
 */
const callTools = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log("🛠️ Agent: Calling tools...");
  const { agent_outcome, userId, chat_history, intermediate_steps } = state;
  const newIntermediateSteps: Array<[ToolInvocation, string]> = [...intermediate_steps]; // Preserve existing steps initially
  let extractedWorkoutDataUpdate: { exercises: any[]; workoutId: string } | null = state.extractedWorkoutData ?? null; // Carry over existing unless updated

  if (!agent_outcome || !agent_outcome.tool_calls || agent_outcome.tool_calls.length === 0) {
    console.log("🛠️ Agent: No tools to call.");
    // Ensure to return all relevant state fields even if no tools are called
    return {
        intermediate_steps: newIntermediateSteps,
        extractedWorkoutData: extractedWorkoutDataUpdate
    };
  }

  const toolMessages: ToolMessage[] = [];
  let specificToolUpdates: Partial<AgentState> = {};


  for (const toolCall of agent_outcome.tool_calls) {
    const toolName = toolCall.name;
    const toolArgs = toolCall.args;
    const toolCallId = toolCall.id || `tool_call_${Date.now()}`; // Ensure there's an ID

    console.log(`📞 Executing tool: ${toolName} with args:`, toolArgs);

    const originalToolDefinition = enhancedWorkoutToolsExecutor.getToolDefinitions().find(t => t.name === toolName || t.name === toolName.replace('_plan','').replace('user_','').replace('fitness_',''));

    if (originalToolDefinition?.execute) {
      const toolExecutionContext: ToolExecutionContext = {
        userId: userId || "unknown-langchain-user",
        sessionId: "langchain-session-placeholder", // This needs a more robust solution
        conversationContext: chat_history.map(msg => `${msg._getType()}: ${msg.content}`).join('\n'),
        previousResults: newIntermediateSteps.map(step => ({ toolName: step[0].name, result: step[1] })),
        // userProfile: state.userProfile || {}, // If userProfile is part of AgentState
      };

      try {
        const result = await originalToolDefinition.execute(toolArgs, toolExecutionContext);
        // Summarize complex result objects for the LLM. LangChain tools expect string outputs.
        let resultSummary = "";
        // Check if the executed tool was 'create_workout' (or its LangChain wrapper name)
        // The original tool name from EnhancedWorkoutTools is 'create_workout'
        if (originalToolDefinition.name === 'create_workout' && result.success && result.workout) {
            extractedWorkoutDataUpdate = {
              exercises: result.workout.exercises, // Assuming this is the UI-compatible version
              workoutId: result.workout.id,
            };
            resultSummary = `Workout "${result.workout.name || result.workout.title}" (ID: ${result.workout.id}) created with ${result.workout.exercises?.length || 0} exercises.`;
            if (result.workout.metadata?.unmatchedExercises && result.workout.metadata.unmatchedExercises.length > 0) {
                resultSummary += ` Could not find matches for: ${result.workout.metadata.unmatchedExercises.join(', ')}.`;
            }
        } else if (originalToolDefinition.name === 'save_workout' && result.success) {
            resultSummary = result.message || `Workout saved successfully with ID ${result.savedWorkoutId}.`;
        } else if (originalToolDefinition.name === 'search_exercises' && result.results) {
            resultSummary = `Found ${result.results.length} exercises. Top: ${result.results.slice(0,3).map((ex:any)=>ex.name).join(', ')}.`;
        } else if (result.message) { // General case for tools returning a message
            resultSummary = result.message;
        } else if (typeof result === 'string') {
            resultSummary = result;
        } else if (result.success === false && result.error) {
            resultSummary = `Tool ${toolName} failed: ${result.error}`;
        }
         else {
            resultSummary = JSON.stringify(result); // Fallback
        }

        toolMessages.push(new ToolMessage({ tool_call_id: toolCallId, content: resultSummary, name: toolName }));
        newIntermediateSteps.push([{ name: toolName, args: toolArgs, id: toolCallId }, resultSummary]);
      } catch (error: any) {
        console.error(`❌ Error executing original tool ${toolName}:`, error);
        const errorMessage = `Error executing tool ${toolName}: ${error.message || 'Unknown error'}`;
        toolMessages.push(new ToolMessage({ tool_call_id: toolCallId, content: errorMessage, name: toolName, additional_kwargs: { error: true } }));
        newIntermediateSteps.push([{ name: toolName, args: toolArgs, id: toolCallId }, errorMessage]);
      }
    } else {
      console.warn(`⚠️ Tool ${toolName} not found in EnhancedWorkoutTools definitions.`);
      const errorMessage = `Tool ${toolName} not found.`;
      toolMessages.push(new ToolMessage({ tool_call_id: toolCallId, content: errorMessage, name: toolName, additional_kwargs: { error: true } }));
      newIntermediateSteps.push([{ name: toolName, args: toolArgs, id: toolCallId }, errorMessage]);
    }
  }

  // The agent_outcome should be cleared or updated after tools are called.
  // The new AIMessage with tool results will be generated in the next callModel pass.
  // For now, we return the tool messages to be added to chat history.
  // The actual AIMessage with tool results is often constructed by the LLM in the next turn.
  // LangGraph expects the 'intermediate_steps' to be updated, and these tool_messages should be part of chat history for the next LLM call.
  // The key is that the next call to `callModel` will include these `toolMessages` in `chat_history`.

  const newChatHistory = [...chat_history, agent_outcome!, ...toolMessages];

  return {
    intermediate_steps: newIntermediateSteps,
    chat_history: newChatHistory,
    agent_outcome: null, // Clear agent_outcome as its tool calls are processed
    input: state.input, // Preserve input for this turn
    extractedWorkoutData: extractedWorkoutDataUpdate, // Pass on any extracted workout data
  };
};


/**
 * Node to determine the next step.
 */
const shouldContinue = (state: AgentState): "tools" | typeof END => {
  console.log("🤔 Agent: Deciding next step...");
  if (state.agent_outcome && state.agent_outcome.tool_calls && state.agent_outcome.tool_calls.length > 0) {
    console.log(" decyzja -> tools");
    return "tools";
  }
  console.log(" decyzja -> END");
  return END;
};

// --- 4. Construct the Graph ---

// Define the channels for the graph state
// This ensures that the state is correctly managed and updated across nodes
const graphChannels = {
  input: { value: (x?: string, y?: string) => y ?? x ?? defaultAgentState.input, default: () => defaultAgentState.input },
  chat_history: { value: (x?: BaseMessage[], y?: BaseMessage[]) => y ?? x ?? defaultAgentState.chat_history, default: () => defaultAgentState.chat_history },
  agent_outcome: { value: (x?: AIMessage | null, y?: AIMessage | null) => y ?? x ?? defaultAgentState.agent_outcome, default: () => defaultAgentState.agent_outcome },
  intermediate_steps: { value: (x?: Array<[ToolInvocation, string]>, y?: Array<[ToolInvocation, string]>) => y ?? x ?? defaultAgentState.intermediate_steps, default: () => defaultAgentState.intermediate_steps },
  userId: { value: (x?: string | null, y?: string | null) => y ?? x ?? defaultAgentState.userId, default: () => defaultAgentState.userId },
  extractedWorkoutData: { value: (x?, y?) => y ?? x ?? defaultAgentState.extractedWorkoutData, default: () => defaultAgentState.extractedWorkoutData },
};


const workflow = new StateGraph<AgentState>({ channels: graphChannels });

workflow.addNode("agent", callModel);
workflow.addNode("tools", callTools);

workflow.setEntryPoint("agent");

workflow.addConditionalEdges(
  "agent",
  shouldContinue,
  {
    tools: "tools",
    [END]: END,
  }
);

workflow.addEdge("tools", "agent"); // After tools are called, go back to the agent to process results

const app: CompiledGraph<AgentState, Partial<AgentState>, string> = workflow.compile();

// --- 5. Export Invocation Function ---

export async function invokeGymzyAgent(
  userInput: string,
  currentChatHistory: BaseMessage[],
  userId: string,
  // onStreamChunk?: (chunk: string) => void // For future streaming from agent
): Promise<AgentInvocationResult> {
  console.log(`💬 Invoking Gymzy Agent for user ${userId} with input: "${userInput}"`);

  const initialState: AgentState = {
    input: userInput,
    chat_history: currentChatHistory,
    agent_outcome: null,
    intermediate_steps: [],
    userId: userId,
    extractedWorkoutData: null, // Initialize
  };

  try {
    const finalState = await app.invoke(initialState, { recursionLimit: 10 });

    console.log("✅ Agent invocation complete. Final state:", JSON.stringify(finalState, null, 2));

    let aiResponseContent = "Sorry, I couldn't generate a response.";
    // The final AI response should be the content of the last AIMessage in the chat_history,
    // especially if the graph ended because there were no more tool calls.
    // If agent_outcome is present and has no tool_calls, it's the final message.
    if (finalState.agent_outcome && finalState.agent_outcome.content && !finalState.agent_outcome.tool_calls?.length) {
        aiResponseContent = finalState.agent_outcome.content as string;
    } else {
        // Look for the last AI message in the history that isn't a tool call request
        const historyMessages = finalState.chat_history;
        for (let i = historyMessages.length - 1; i >= 0; i--) {
            const msg = historyMessages[i];
            if (msg._getType() === "ai") {
                const aiMsg = msg as AIMessage;
                if (aiMsg.content && !aiMsg.tool_calls?.length) { // Ensure it has content and is not asking for tools
                    aiResponseContent = aiMsg.content as string;
                    break;
                }
            }
        }
    }

    return {
      finalOutput: aiResponseContent,
      workoutData: finalState.extractedWorkoutData || null,
    };

  } catch (error: any) {
    console.error("❌ Error invoking Gymzy Agent:", error);
    return {
      finalOutput: "Sorry, I encountered an error. Please try again.",
      workoutData: null,
    };
  }
}

// Example usage (for testing within this file, normally called from elsewhere)
/*
async function testAgent() {
  const history: BaseMessage[] = [];
  let response;

  response = await invokeGymzyAgent("Hello!", history, "test-user-123");
  console.log("Final Response 1:", response);
  history.push(new HumanMessage("Hello!"));
  history.push(new AIMessage(response));


  response = await invokeGymzyAgent("Create a chest workout for me.", history, "test-user-123");
  console.log("Final Response 2:", response);
  history.push(new HumanMessage("Create a chest workout for me."));
  history.push(new AIMessage(response));

  response = await invokeGymzyAgent("Save my last workout. It had 3 sets of pushups, 10 reps each.", history, "test-user-123");
  console.log("Final Response 3:", response);
}

// testAgent();
*/
console.log("LangChain agent structure defined.");
