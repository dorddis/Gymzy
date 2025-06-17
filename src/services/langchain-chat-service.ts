import { invokeGymzyAgent } from '../../langchain/agent'; // Adjusted path
import {
  AIMessage,
  HumanMessage,
  BaseMessage,
  SystemMessage, // For potential future use
  ToolMessage   // For potential future use
} from '@langchain/core/messages';

// Matches the ChatMessage in AIChatInterface or a similar UI structure
export interface UIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'ai'; // Allowing for expansion
  content: string;
  name?: string;         // For tool name if role is 'tool' or for named HumanMessages
  tool_call_id?: string; // For linking tool responses
  // UI specific fields like workoutData or toolCalls are usually part of assistant messages
  // but the history itself is simpler.
}

export interface LangchainServiceResponse {
  content: string;
  // These are placeholders; actual data would come from structured agent output
  toolCalls?: Array<{ name: string; parameters: any; result?: any }>;
  workoutData?: { exercises: any[]; workoutId: string } | null;
  error?: string; // To communicate errors to the UI
}

/**
 * Sends a message to the Langchain agent and gets a response.
 * @param userId The ID of the user.
 * @param userInput The current text input from the user.
 * @param uiChatHistory The existing chat history from the UI.
 * @param onStreamChunk Optional callback for handling streaming chunks of the response.
 * @returns A promise that resolves to the agent's response.
 */
export async function sendLangchainMessage(
  userId: string,
  userInput: string,
  uiChatHistory: UIChatMessage[],
  onStreamChunk?: (chunk: string) => void // For future streaming from the agent
): Promise<LangchainServiceResponse> {

  console.log(`[LangchainChatService] Sending message for user ${userId}: "${userInput}"`);
  console.log(`[LangchainChatService] UI Chat History:`, uiChatHistory);

  const mappedHistory: BaseMessage[] = uiChatHistory.map(msg => {
    switch (msg.role) {
      case 'user':
        return new HumanMessage({ content: msg.content, name: msg.name });
      case 'assistant':
      case 'ai': // Handle 'ai' as an alias for assistant if UI uses it
        // For now, assuming UI AIMessages are simple content.
        // If they need to represent past tool_calls initiated by AI, this would need adjustment.
        return new AIMessage({ content: msg.content });
      case 'system':
        return new SystemMessage({ content: msg.content });
      case 'tool':
        if (!msg.tool_call_id) {
          console.warn("[LangchainChatService] Tool message in history is missing tool_call_id:", msg);
          // Fallback or decide how to handle this. For now, creating a generic ToolMessage.
          return new ToolMessage({ content: msg.content, name: msg.name || "unknown_tool" });
        }
        return new ToolMessage({
          content: msg.content,
          name: msg.name,
          tool_call_id: msg.tool_call_id
        });
      default:
        // Fallback for any unhandled roles, or throw an error
        console.warn(`[LangchainChatService] Unknown role in chat history: ${msg.role}. Treating as HumanMessage.`);
        return new HumanMessage({ content: msg.content });
    }
  });

  console.log(`[LangchainChatService] Mapped History for Agent:`, mappedHistory);

  try {
    // invokeGymzyAgent currently returns a string (the final AI textual response)
    // It needs to be updated to return a more structured object if we want to extract
    // workoutData or specific toolCalls directly from its return.
    // For now, we assume the string response is the primary content.
    // The onStreamChunk is passed for future-proofing; invokeGymzyAgent needs to implement streaming.
    const agentFinalResponseString = await invokeGymzyAgent(userInput, mappedHistory, userId /*, onStreamChunk */);

    // Placeholder for extracting structured data like workoutData.
    // This logic would depend on how invokeGymzyAgent is modified to return such data.
    // For example, if a tool like 'create_workout_plan' ran, its output (containing workout details)
    // should be identifiable in the agent's final state or a specially formatted part of its response.
    // For now, we'll assume workoutData is not yet extracted here and will be null.
    let workoutData: { exercises: any[]; workoutId: string } | null = null;
    let toolCallsForUI: Array<{ name: string; parameters: any; result?: any }> | undefined = undefined;

    // TODO: Refine workoutData extraction.
    // This might involve checking the agent's last AIMessage if it's returned by invokeGymzyAgent,
    // or having invokeGymzyAgent return a structured object.
    // If the agent's response string *is* the workout data (e.g. formatted markdown),
    // then the UI would parse it. But ideally, structured data is better.

    let contentToStream = agentFinalResponseString;

    // Simulate streaming for UI development if onStreamChunk is provided,
    // as invokeGymzyAgent might not be streaming yet.
    if (onStreamChunk && contentToStream) {
      // Clear content as it will be delivered via chunks
      const fullContent = contentToStream;
      contentToStream = "";

      const chunks = fullContent.split(/(?<=\s)|(?<=\.)|(?<=\?)|(?<=!)/); // Split by spaces or sentence enders for more natural streaming
      for (const chunk of chunks) {
        if (chunk) {
          await new Promise(res => setTimeout(res, Math.random() * 50 + 20)); // Simulate network delay for chunks
          onStreamChunk(chunk);
          contentToStream += chunk; // Reconstruct content if needed by other parts of this func
        }
      }
    } else if (!contentToStream) {
        contentToStream = "Sorry, I couldn't generate a response.";
    }


    return {
      content: contentToStream, // This would be the fully accumulated content if streaming was real
      workoutData: workoutData,
      toolCalls: toolCallsForUI,
    };

  } catch (error: any) {
    console.error("[LangchainChatService] Error calling invokeGymzyAgent:", error);
    const errorMessage = error.message || "An unexpected error occurred with the AI agent.";
    if (onStreamChunk) {
      onStreamChunk(`Error: ${errorMessage}`);
    }
    return {
      content: `Sorry, I encountered an error: ${errorMessage}`,
      workoutData: null,
      error: errorMessage,
    };
  }
}
console.log("Langchain Chat Service defined.");
