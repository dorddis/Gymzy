"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligentGymzyAgent = void 0;
// Import the validator and related types
const mathematical_validator_1 = require("./mathematical-validator");
// Import the workout modifier tool
const intelligent_workout_modifier_1 = require("./intelligent-workout-modifier");
// Placeholder for the Intelligent Gymzy Agent class
class IntelligentGymzyAgent {
    constructor(sessionId) {
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
        this.validator = new mathematical_validator_1.MathematicalValidator();
        this.tools = new Map();
        const workoutModifier = new intelligent_workout_modifier_1.IntelligentWorkoutModifier();
        this.tools.set(workoutModifier.name, workoutModifier);
        // Placeholder for loading memory for the session
        this.loadMemoryForSession(sessionId);
    }
    loadMemoryForSession(sessionId) {
        console.log(`Placeholder: Attempting to load memory for session ${sessionId}`);
    }
    getMemory() {
        return this.memory;
    }
    updateWorkingMemory(updates) {
        this.memory.workingMemory = Object.assign(Object.assign({}, this.memory.workingMemory), updates);
    }
    addConversationTurn(turn) {
        this.memory.episodicMemory.recentTurns.push(turn);
        // Optional: Trim to last N turns
        // const maxTurns = 10;
        // if (this.memory.episodicMemory.recentTurns.length > maxTurns) {
        //   this.memory.episodicMemory.recentTurns = this.memory.episodicMemory.recentTurns.slice(-maxTurns);
        // }
    }
    detectIntent(userInput) {
        const lowerInput = userInput.toLowerCase().trim();
        if (lowerInput === 'double it') {
            if (this.memory.workingMemory.currentWorkout) {
                const intent = { name: 'DOUBLE_WORKOUT', confidence: 1.0 };
                this.updateWorkingMemory({ userIntent: intent });
                return intent;
            }
            else {
                // No current workout to double, could set a different intent or handle as an error/clarification later
                const intent = { name: 'CANNOT_DOUBLE_NO_WORKOUT', confidence: 1.0 };
                this.updateWorkingMemory({ userIntent: intent });
                return intent;
            }
        }
        // Placeholder for more sophisticated intent detection
        const defaultIntent = { name: 'UNKNOWN_INTENT', confidence: 0.5, slots: { originalInput: userInput } };
        this.updateWorkingMemory({ userIntent: defaultIntent });
        return defaultIntent;
    }
    getModificationGuidance(intent) {
        const currentWorkout = this.memory.workingMemory.currentWorkout;
        return this.validator.prepareWorkoutModification(intent, currentWorkout);
    }
    async executeTool(toolName, params) {
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
            const memorySnapshot = Object.freeze(JSON.parse(JSON.stringify(this.memory)));
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
            }
            else if (!toolResult.success) { // Handles explicit failure from tool
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
            }
            else { // Handles success without workout update (e.g. query tool)
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
        }
        catch (e) {
            this.updateWorkingMemory({
                lastAction: {
                    type: 'TOOL_EXECUTION_EXCEPTION',
                    details: { toolName: tool.name, params: params, error: e.message },
                },
            });
            return { success: false, error: `Exception executing tool '${toolName}': ${e.message}` };
        }
    }
    generateResponse(intent, clarificationDetails, toolResult, errorMessage) {
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
            }
            else {
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
    async processMessage(userInput, sessionId) {
        // Note: Memory is initialized in the constructor for this sessionId.
        // In a stateless server environment, you'd load/initialize memory here per request.
        // For now, we assume agent instance per session or appropriate memory loading.
        // sessionId is passed but not explicitly used here yet beyond constructor time.
        const detectedIntent = this.detectIntent(userInput);
        let agentResponse = '';
        let toolResult = undefined;
        let clarificationDetails = undefined;
        let errorMessage = undefined;
        if (detectedIntent) {
            this.updateWorkingMemory({ userIntent: detectedIntent });
            if (detectedIntent.name === 'DOUBLE_WORKOUT') {
                const guidance = this.getModificationGuidance(detectedIntent);
                if (guidance.clarificationDetails) {
                    clarificationDetails = guidance.clarificationDetails;
                }
                else if (guidance.error) {
                    errorMessage = guidance.error;
                }
                // If guidance.modificationPlan exists, it means clarification was somehow skipped or already handled.
                // For this phase, DOUBLE_WORKOUT always leads to clarification from getModificationGuidance.
            }
            else if (detectedIntent.name === 'CANNOT_DOUBLE_NO_WORKOUT') {
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
                let plan = undefined;
                if (lowerInput.includes("double the sets")) {
                    plan = {
                        type: 'DOUBLE_SETS',
                        targetWorkoutId: this.memory.workingMemory.currentWorkout.id
                    };
                }
                else if (lowerInput.includes("double the reps")) {
                    plan = {
                        type: 'DOUBLE_REPS',
                        targetWorkoutId: this.memory.workingMemory.currentWorkout.id
                    };
                }
                else if (lowerInput.includes("double both")) { // Added for completeness
                    plan = {
                        type: 'DOUBLE_BOTH',
                        targetWorkoutId: this.memory.workingMemory.currentWorkout.id
                    };
                }
                if (plan) {
                    // If the original intent was DOUBLE_WORKOUT, we've now got a plan from the simulated clarification.
                    // So, we clear clarificationDetails as we are proceeding with action.
                    if (detectedIntent.name === 'DOUBLE_WORKOUT')
                        clarificationDetails = undefined;
                    toolResult = await this.executeTool('IntelligentWorkoutModifier', { modificationPlan: plan });
                }
            }
            // --- End Simulation ---
        }
        else {
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
    presetWorkoutForTesting(workout) {
        this.updateWorkingMemory({ currentWorkout: workout });
        console.log("Preset workout for testing:", this.memory.workingMemory.currentWorkout);
    }
}
exports.IntelligentGymzyAgent = IntelligentGymzyAgent;
