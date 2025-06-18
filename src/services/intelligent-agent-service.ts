// Interface for the state of the current workout
export interface WorkoutState {
  id: string;
  exercises: Array<{ exerciseId: string; sets: number; reps: number; name?: string }>;
}

// Interface for actions taken by the agent
export interface AgentAction {
  type: string;
  details: Record<string, any>;
}

// Interface for the detected user intent
export interface IntentState {
  name: string;
  confidence: number;
  slots?: Record<string, any>;
}

// Interface for a single turn in a conversation
export interface ConversationTurn {
  userInput: string;
  agentResponse: string;
  timestamp: Date;
  context?: any;
}

// Interface for workout modification plans
export interface ModificationPlan {
  type: 'DOUBLE_SETS' | 'DOUBLE_REPS' | 'DOUBLE_BOTH'; // Example types
  targetWorkoutId: string;
}

// Interface for clarification details when the agent needs more information
export interface ClarificationDetails {
  question: string;
  options?: Array<{ text: string; value: string }>; // Options user can pick
}

// Import the validator and related types
import { MathematicalValidator } from './mathematical-validator';
// Import the workout modifier tool
import { IntelligentWorkoutModifier } from './intelligent-workout-modifier';


// Placeholder for the Intelligent Gymzy Agent class
export class IntelligentGymzyAgent {
  // Future components:
  // private intentDetector: IntentDetector; // More sophisticated version
  // private toolExecutor: ToolExecutor; // This might be replaced by the executeTool method or manage it
  // private responseGenerator: ResponseGenerator;

  private memory: IntelligentAgentMemory;
  private validator: MathematicalValidator;
  private tools: Map<string, CognitiveTool>;

  constructor(sessionId: string) { // sessionId might be used later for persistence
    this.memory = {
      workingMemory: {
        currentWorkout: null,
        lastAction: null,
        conversationContext: null,
        userIntent: null,
      },
      episodicMemory: {
        recentTurns: [],
      },
    };
    this.validator = new MathematicalValidator();

    this.tools = new Map<string, CognitiveTool>();
    const workoutModifier = new IntelligentWorkoutModifier();
    this.tools.set(workoutModifier.name, workoutModifier);

    // Placeholder for loading memory for the session
    this.loadMemoryForSession(sessionId);
  }

  private loadMemoryForSession(sessionId: string): void {
    console.log(`Placeholder: Attempting to load memory for session ${sessionId}`);
  }

  public getMemory(): IntelligentAgentMemory {
    return this.memory;
  }

  public updateWorkingMemory(updates: Partial<WorkingMemory>): void {
    this.memory.workingMemory = { ...this.memory.workingMemory, ...updates };
  }

  public addConversationTurn(turn: ConversationTurn): void {
    this.memory.episodicMemory.recentTurns.push(turn);
    // Optional: Trim to last N turns
    // const maxTurns = 10;
    // if (this.memory.episodicMemory.recentTurns.length > maxTurns) {
    //   this.memory.episodicMemory.recentTurns = this.memory.episodicMemory.recentTurns.slice(-maxTurns);
    // }
  }

  public detectIntent(userInput: string): IntentState | null {
    const lowerInput = userInput.toLowerCase().trim();
    if (lowerInput === 'double it') {
      if (this.memory.workingMemory.currentWorkout) {
        const intent: IntentState = { name: 'DOUBLE_WORKOUT', confidence: 1.0 };
        this.updateWorkingMemory({ userIntent: intent });
        return intent;
      } else {
        // No current workout to double, could set a different intent or handle as an error/clarification later
        const intent: IntentState = { name: 'CANNOT_DOUBLE_NO_WORKOUT', confidence: 1.0 };
        this.updateWorkingMemory({ userIntent: intent });
        return intent;
      }
    }
    // Placeholder for more sophisticated intent detection
    const defaultIntent: IntentState = { name: 'UNKNOWN_INTENT', confidence: 0.5, slots: { originalInput: userInput } };
    this.updateWorkingMemory({ userIntent: defaultIntent });
    return defaultIntent;
  }

  public getModificationGuidance(intent: IntentState): { modificationPlan?: ModificationPlan; clarificationDetails?: ClarificationDetails; error?: string } {
    const currentWorkout = this.memory.workingMemory.currentWorkout;
    return this.validator.prepareWorkoutModification(intent, currentWorkout);
  }

  public async executeTool(toolName: string, params: ToolParams): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      this.updateWorkingMemory({
        lastAction: {
          type: 'TOOL_EXECUTION_FAILED',
          details: { toolName, error: `Tool '${toolName}' not found.` },
        },
      });
      return { success: false, error: `Tool '${toolName}' not found.` };
    }
    try {
      // Pass a readonly, deep-cloned version of memory to the tool
      const memorySnapshot = Object.freeze(JSON.parse(JSON.stringify(this.memory))) as Readonly<IntelligentAgentMemory>;
      const toolResult = await tool.execute(params, memorySnapshot);

      if (toolResult.success && toolResult.updatedWorkout) {
        this.updateWorkingMemory({
          currentWorkout: toolResult.updatedWorkout,
          lastAction: {
            type: 'TOOL_EXECUTION',
            details: {
              toolName: tool.name,
              params: params,
              resultMessage: toolResult.message,
            },
          },
        });
      } else if (!toolResult.success) { // Handles explicit failure from tool
         this.updateWorkingMemory({
          lastAction: {
            type: 'TOOL_EXECUTION_FAILED',
            details: {
              toolName: tool.name,
              params: params,
              error: toolResult.error,
            },
          },
        });
      } else { // Handles success without workout update (e.g. query tool)
        this.updateWorkingMemory({
          lastAction: {
            type: 'TOOL_EXECUTION', // Still a success
            details: {
              toolName: tool.name,
              params: params,
              resultMessage: toolResult.message || 'Tool executed successfully without workout update.',
            },
          },
        });
      }
      return toolResult;
    } catch (e: any) {
      this.updateWorkingMemory({
        lastAction: {
          type: 'TOOL_EXECUTION_EXCEPTION',
          details: { toolName: tool.name, params: params, error: e.message },
        },
      });
      return { success: false, error: `Exception executing tool '${toolName}': ${e.message}` };
    }
  }

  private generateResponse(
    intent: IntentState | null,
    clarificationDetails?: ClarificationDetails,
    toolResult?: ToolResult,
    errorMessage?: string
  ): string {
    if (errorMessage) {
      return errorMessage;
    }

    if (clarificationDetails) {
      let responseText = clarificationDetails.question;
      if (clarificationDetails.options) {
        responseText += "\n" + clarificationDetails.options.map((opt, idx) => `${idx + 1}. ${opt.text}`).join("\n");
      }
      return responseText;
    }

    if (toolResult) {
      if (toolResult.success) {
        return toolResult.message || "Action completed successfully.";
      } else {
        return toolResult.error || "Sorry, I couldn't complete that action.";
      }
    }

    if (intent) {
      switch (intent.name) {
        case 'CANNOT_DOUBLE_NO_WORKOUT':
          return "It looks like there's no active workout to double. Please start or select a workout first.";
        case 'DOUBLE_WORKOUT': // This case implies it's awaiting clarification if no toolResult/clarificationDetails
          return "I need a bit more information to double the workout."; // Should ideally be handled by clarificationDetails
        case 'GREETING': // Example for future expansion
          return "Hello! How can I help you with your workout today?";
        case 'UNKNOWN_INTENT':
        default:
          return "Sorry, I'm not sure how to handle that. Can you try rephrasing?";
      }
    }

    return "I'm not sure how to respond to that.";
  }

  public async processMessage(userInput: string, sessionId: string): Promise<string> {
    // Note: Memory is initialized in the constructor for this sessionId.
    // In a stateless server environment, you'd load/initialize memory here per request.
    // For now, we assume agent instance per session or appropriate memory loading.
    // sessionId is passed but not explicitly used here yet beyond constructor time.

    const detectedIntent = this.detectIntent(userInput);
    let agentResponse = '';
    let toolResult: ToolResult | undefined = undefined;
    let clarificationDetails: ClarificationDetails | undefined = undefined;
    let errorMessage: string | undefined = undefined;

    if (detectedIntent) {
      this.updateWorkingMemory({ userIntent: detectedIntent });

      if (detectedIntent.name === 'DOUBLE_WORKOUT') {
        const guidance = this.getModificationGuidance(detectedIntent);
        if (guidance.clarificationDetails) {
          clarificationDetails = guidance.clarificationDetails;
        } else if (guidance.error) {
          errorMessage = guidance.error;
        }
        // If guidance.modificationPlan exists, it means clarification was somehow skipped or already handled.
        // For this phase, DOUBLE_WORKOUT always leads to clarification from getModificationGuidance.
      } else if (detectedIntent.name === 'CANNOT_DOUBLE_NO_WORKOUT') {
        // Error is handled by generateResponse based on intent.
      }
      // TODO: Add logic for when user *provides* clarification.
      // This would involve:
      // 1. A new intent like 'USER_PROVIDED_CLARIFICATION'.
      // 2. Parsing the userInput to understand which clarification option was chosen.
      // 3. Constructing a ModificationPlan based on that.
      // 4. Calling executeTool.

      // --- Simulation for testing tool execution ---
      // This block would normally be triggered by a different intent after user clarification.
      // For now, if the user types "double the sets" or "double the reps" AND a workout exists,
      // we directly create a plan and execute it.
      const lowerInput = userInput.toLowerCase();
      if (this.memory.workingMemory.currentWorkout) {
        let plan: ModificationPlan | undefined = undefined;
        if (lowerInput.includes("double the sets")) {
            plan = {
                type: 'DOUBLE_SETS',
                targetWorkoutId: this.memory.workingMemory.currentWorkout.id
            };
        } else if (lowerInput.includes("double the reps")) {
            plan = {
                type: 'DOUBLE_REPS',
                targetWorkoutId: this.memory.workingMemory.currentWorkout.id
            };
        } else if (lowerInput.includes("double both")) { // Added for completeness
            plan = {
                type: 'DOUBLE_BOTH',
                targetWorkoutId: this.memory.workingMemory.currentWorkout.id
            };
        }

        if (plan) {
            // If the original intent was DOUBLE_WORKOUT, we've now got a plan from the simulated clarification.
            // So, we clear clarificationDetails as we are proceeding with action.
            if(detectedIntent.name === 'DOUBLE_WORKOUT') clarificationDetails = undefined;
            toolResult = await this.executeTool('IntelligentWorkoutModifier', { modificationPlan: plan });
        }
      }
      // --- End Simulation ---

    } else {
      errorMessage = "Sorry, I couldn't understand your request.";
    }

    agentResponse = this.generateResponse(detectedIntent, clarificationDetails, toolResult, errorMessage);

    this.addConversationTurn({
      userInput: userInput,
      agentResponse: agentResponse,
      timestamp: new Date(),
      // context: { intent: detectedIntent, toolResult, clarificationDetails, error: errorMessage } // Optional detailed context
    });

    return agentResponse;
  }

  public presetWorkoutForTesting(workout: WorkoutState): void {
    this.updateWorkingMemory({ currentWorkout: workout });
    console.log("Preset workout for testing:", this.memory.workingMemory.currentWorkout);
  }
}

// Interface for tool parameters
export interface ToolParams {
  modificationPlan?: ModificationPlan; // For IntelligentWorkoutModifier
  // other tool params can be added later, e.g., for different tools
  // query?: string; // for a search tool
  // targetDate?: Date; // for a scheduling tool
}

// Interface for tool results
export interface ToolResult {
  success: boolean;
  message?: string; // Optional message from the tool
  updatedWorkout?: WorkoutState; // Optional modified workout state
  error?: string; // Optional error message
  // data?: any; // Could be used for tools that return data other than workout state
}

// Generic interface for cognitive tools
export interface CognitiveTool {
  name: string;
  description: string;
  execute(params: ToolParams, currentMemory: Readonly<IntelligentAgentMemory>): Promise<ToolResult>;
}

// Interface for the agent's working memory
export interface WorkingMemory {
  currentWorkout: WorkoutState | null;
  lastAction: AgentAction | null;
  conversationContext: string | null;
  userIntent: IntentState | null;
}

// Interface for the agent's episodic memory
export interface EpisodicMemory {
  recentTurns: ConversationTurn[];
}

// Interface for the combined agent memory
export interface IntelligentAgentMemory {
  workingMemory: WorkingMemory;
  episodicMemory: EpisodicMemory;
}
