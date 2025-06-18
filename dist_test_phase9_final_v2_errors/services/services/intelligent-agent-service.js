"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligentGymzyAgent = void 0;
// Import the validator and related types
const mathematical_validator_1 = require("./mathematical-validator");
// Import the workout modifier tool
const intelligent_workout_modifier_1 = require("./intelligent-workout-modifier");
// Import the exercise info tool
const exercise_info_tool_1 = require("./exercise-info-tool");
// Placeholder for the Intelligent Gymzy Agent class
class IntelligentGymzyAgent {
    constructor(sessionId) {
        this.memory = {
            workingMemory: {
                currentWorkout: null,
                lastAction: null,
                conversationContext: null,
                userIntent: null,
                pendingClarificationContext: null,
            },
            episodicMemory: {
                recentTurns: [],
            },
        };
        this.validator = new mathematical_validator_1.MathematicalValidator();
        this.tools = new Map();
        const workoutModifier = new intelligent_workout_modifier_1.IntelligentWorkoutModifier();
        this.tools.set(workoutModifier.name, workoutModifier);
        const exerciseInfoTool = new exercise_info_tool_1.ExerciseInfoTool();
        this.tools.set(exerciseInfoTool.name, exerciseInfoTool);
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
    }
    // detectIntent method from Phase 8, Turn 19 (refined logic)
    detectIntent(userInput) {
        const lowerInput = userInput.toLowerCase().trim();
        const { workingMemory } = this.memory;
        let identifiedIntent = null;
        // Stage 1: Check for USER_PROVIDED_CLARIFICATION if a clarification is pending
        if (workingMemory.pendingClarificationContext && workingMemory.pendingClarificationContext.optionsProvided) {
            const { optionsProvided, originalIntentName, relatedData } = workingMemory.pendingClarificationContext;
            for (const option of optionsProvided) {
                const matchTerms = [option.value.toLowerCase(), option.text.toLowerCase()];
                if (option.synonyms) {
                    matchTerms.push(...option.synonyms.map(s => s.toLowerCase()));
                }
                let matchedValue = null;
                if (matchTerms.some(term => term === lowerInput || lowerInput.includes(term) || term.startsWith(lowerInput))) {
                    matchedValue = option.value;
                }
                else {
                    const optionIndex = optionsProvided.indexOf(option);
                    if (lowerInput === (optionIndex + 1).toString() || lowerInput === (optionIndex + 1).toString() + '.') {
                        matchedValue = option.value;
                    }
                }
                if (matchedValue) {
                    identifiedIntent = {
                        name: 'USER_PROVIDED_CLARIFICATION',
                        confidence: 0.95,
                        slots: { clarificationChoice: matchedValue, originalIntentName, relatedData }
                    };
                    this.updateWorkingMemory({ userIntent: identifiedIntent });
                    return identifiedIntent;
                }
            }
        }
        // Stage 2: Detect other primary intents
        const greetingKeywords = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
        if (greetingKeywords.some(keyword => lowerInput.startsWith(keyword))) {
            identifiedIntent = { name: 'GREETING', confidence: 0.9 };
        }
        if (!identifiedIntent) {
            const farewellKeywords = ['bye', 'goodbye', 'see you', 'later', 'farewell', 'im off', 'that is all', 'thats all'];
            if (farewellKeywords.some(keyword => lowerInput.includes(keyword))) {
                identifiedIntent = { name: 'FAREWELL', confidence: 0.9 };
            }
        }
        if (!identifiedIntent) {
            const thanksKeywords = ['thanks', 'thank you', 'thx', 'appreciate it', 'sounds good'];
            if (thanksKeywords.some(keyword => lowerInput.includes(keyword))) {
                identifiedIntent = { name: 'THANKS', confidence: 0.9 };
            }
        }
        if (!identifiedIntent) {
            const helpKeywords = ['help', 'what can you do', 'assist me', 'assistance', 'support'];
            if (helpKeywords.some(keyword => lowerInput.includes(keyword))) {
                identifiedIntent = { name: 'HELP', confidence: 0.9 };
            }
        }
        if (!identifiedIntent) {
            const getExerciseInfoPatterns = [
                /how to (?:do )?(?:a |an )?([\w\s]+)(?:\?)?/i,
                /what is (?:a |an )?([\w\s]+)(?:\?)?/i,
                /tell me about ([\w\s]+)(?:\?)?/i,
                /info on ([\w\s]+)(?:\?)?/i,
            ];
            for (const pattern of getExerciseInfoPatterns) {
                const match = lowerInput.match(pattern);
                if (match && match[1]) {
                    const exerciseName = match[1].trim().replace(/\?$/, '').trim();
                    identifiedIntent = {
                        name: 'GET_EXERCISE_INFO',
                        confidence: 0.85,
                        slots: { exercise_name: exerciseName }
                    };
                    break;
                }
            }
        }
        if (!identifiedIntent) {
            const createWorkoutKeywords = ['create', 'generate', 'give me', 'make me', 'build me', 'workout', 'routine', 'plan', 'program'];
            if (createWorkoutKeywords.some(keyword => lowerInput.includes(keyword))) {
                const slots = {};
                const muscleGroups = {
                    'chest': ['chest', 'pecs'], 'legs': ['legs', 'quads', 'hamstrings', 'glutes'], 'back': ['back', 'lats'],
                    'shoulders': ['shoulders', 'delts'], 'arms': ['arms', 'biceps', 'triceps'],
                    'full body': ['full body', 'whole body', 'total body'], 'upper body': ['upper body'],
                    'lower body': ['lower body'], 'core': ['core', 'abs']
                };
                for (const group in muscleGroups) {
                    if (muscleGroups[group].some(term => lowerInput.includes(term))) {
                        slots.muscle_group = group;
                        break;
                    }
                }
                const durationMatch = lowerInput.match(/(\d+)\s*(minute|min|hr|hour)/i);
                if (durationMatch && durationMatch[1]) {
                    let durationValue = parseInt(durationMatch[1]);
                    if (durationMatch[2].startsWith('h'))
                        durationValue *= 60;
                    slots.duration = durationValue;
                }
                const experienceLevels = {
                    'beginner': ['beginner', 'newbie', 'easy', 'starting out'],
                    'intermediate': ['intermediate', 'mid-level', 'moderate'],
                    'advanced': ['advanced', 'expert', 'hard', 'intense']
                };
                for (const level in experienceLevels) {
                    if (experienceLevels[level].some(term => lowerInput.includes(term))) {
                        slots.experience_level = level;
                        break;
                    }
                }
                identifiedIntent = {
                    name: 'CREATE_WORKOUT',
                    confidence: Object.keys(slots).length > 0 ? 0.85 : 0.8,
                    slots: slots
                };
            }
        }
        if (!identifiedIntent && lowerInput === 'double it') {
            if (workingMemory.currentWorkout) {
                identifiedIntent = { name: 'DOUBLE_WORKOUT', confidence: 1.0 };
            }
            else {
                identifiedIntent = { name: 'CANNOT_DOUBLE_NO_WORKOUT', confidence: 1.0 };
            }
        }
        // Stage 3: Final determination based on whether a clarification was pending
        if (workingMemory.pendingClarificationContext) {
            if (identifiedIntent) {
                // A new primary intent was identified. This new intent takes precedence.
            }
            else {
                // No new primary intent, and it wasn't a USER_PROVIDED_CLARIFICATION (that would have returned in Stage 1).
                identifiedIntent = {
                    name: 'CLARIFICATION_MISMATCH',
                    confidence: 0.7,
                    slots: { originalInput: userInput, pendingQuestion: workingMemory.pendingClarificationContext.clarificationQuestionText }
                };
            }
        }
        else if (!identifiedIntent) {
            identifiedIntent = { name: 'UNKNOWN_INTENT', confidence: 0.5, slots: { originalInput: userInput } };
        }
        this.updateWorkingMemory({ userIntent: identifiedIntent });
        return identifiedIntent;
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
            const memorySnapshot = Object.freeze(JSON.parse(JSON.stringify(this.memory)));
            const toolResult = await tool.execute(params, memorySnapshot);
            if (toolResult.success && toolResult.updatedWorkout) {
                this.updateWorkingMemory({
                    currentWorkout: toolResult.updatedWorkout,
                    lastAction: {
                        type: 'TOOL_EXECUTION',
                        details: { toolName: tool.name, params: params, resultMessage: toolResult.message, },
                    },
                });
            }
            else if (!toolResult.success) {
                this.updateWorkingMemory({
                    lastAction: {
                        type: 'TOOL_EXECUTION_FAILED',
                        details: { toolName: tool.name, params: params, error: toolResult.error, },
                    },
                });
            }
            else {
                this.updateWorkingMemory({
                    lastAction: {
                        type: 'TOOL_EXECUTION',
                        details: { toolName: tool.name, params: params, resultMessage: toolResult.message || 'Tool executed successfully without workout update.', },
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
        var _a, _b, _c, _d;
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
            return toolResult.success ? (toolResult.message || "Action completed successfully.") : (toolResult.error || "Sorry, I couldn't complete that action.");
        }
        if (intent) {
            switch (intent.name) {
                case 'CANNOT_DOUBLE_NO_WORKOUT': return "It looks like there's no active workout to double. Please start or select a workout first.";
                case 'DOUBLE_WORKOUT': return "I need a bit more information to double the workout.";
                case 'GREETING':
                    const greetings = ["Hello! How can I assist with your fitness goals today?", "Hi there! What are we working on?", "Hey! Ready to get started?"];
                    return greetings[Math.floor(Math.random() * greetings.length)];
                case 'FAREWELL':
                    const farewells = ["Goodbye! Keep up the great work!", "See you next time. Stay consistent!", "Alright, take care!"];
                    return farewells[Math.floor(Math.random() * farewells.length)];
                case 'THANKS':
                    const thanksResponses = ["You're welcome!", "Happy to help!", "Anytime! Let me know if there's anything else."];
                    return thanksResponses[Math.floor(Math.random() * thanksResponses.length)];
                case 'HELP':
                    return "I can help you with things like creating workout plans, modifying your current workout (like doubling sets or reps), and providing information about exercises. What would you like to do?";
                case 'GET_EXERCISE_INFO':
                    return ((_a = intent.slots) === null || _a === void 0 ? void 0 : _a.exercise_name) ? `Okay, I'll look up information for "${intent.slots.exercise_name}". (Tool for this will be in Phase 3)` : "Which exercise are you interested in? (Tool for this will be in Phase 3)";
                case 'CREATE_WORKOUT':
                    let createMsg = "Okay, I can help you create a workout";
                    if ((_b = intent.slots) === null || _b === void 0 ? void 0 : _b.muscle_group)
                        createMsg += ` for ${intent.slots.muscle_group}`;
                    if ((_c = intent.slots) === null || _c === void 0 ? void 0 : _c.duration)
                        createMsg += ` for about ${intent.slots.duration} minutes`;
                    if ((_d = intent.slots) === null || _d === void 0 ? void 0 : _d.experience_level) {
                        const article = ['a', 'e', 'i', 'o', 'u'].includes(intent.slots.experience_level.charAt(0).toLowerCase()) ? 'an' : 'a';
                        createMsg += ` at ${article} ${intent.slots.experience_level} level`;
                    }
                    createMsg += ". (Tool for this will be in Phase 3)";
                    return createMsg;
                case 'UNKNOWN_INTENT':
                default:
                    if (this.memory.workingMemory.pendingClarificationContext) {
                        return `I'm not sure about that. Regarding my previous question: ${this.memory.workingMemory.pendingClarificationContext.clarificationQuestionText}\n${this.memory.workingMemory.pendingClarificationContext.optionsProvided.map((opt, idx) => `${idx + 1}. ${opt.text}`).join("\n")}`;
                    }
                    return "Sorry, I'm not quite sure how to help with that. You can ask me to create a workout, tell you about an exercise, or modify your current workout.";
            }
        }
        return "I'm not sure how to respond to that.";
    }
    // New processMessage from Phase 9, Turn 3 prompt
    async processMessage(userInput, sessionId) {
        var _a, _b, _c;
        const detectedIntent = this.detectIntent(userInput);
        let agentResponse = '';
        let toolResult = undefined;
        let clarificationDetails = undefined;
        let errorMessage = undefined;
        if (detectedIntent) {
            this.updateWorkingMemory({ userIntent: detectedIntent }); // Ensure userIntent is current
            switch (detectedIntent.name) {
                case 'USER_PROVIDED_CLARIFICATION':
                    if (detectedIntent.slots && detectedIntent.slots.clarificationChoice) {
                        const choice = detectedIntent.slots.clarificationChoice;
                        const originalIntentName = detectedIntent.slots.originalIntentName;
                        const relatedData = detectedIntent.slots.relatedData;
                        if (originalIntentName === 'DOUBLE_WORKOUT' && (relatedData === null || relatedData === void 0 ? void 0 : relatedData.workoutId) && this.memory.workingMemory.currentWorkout && this.memory.workingMemory.currentWorkout.id === relatedData.workoutId) {
                            const plan = {
                                type: choice,
                                targetWorkoutId: this.memory.workingMemory.currentWorkout.id,
                            };
                            toolResult = await this.executeTool('IntelligentWorkoutModifier', { modificationPlan: plan });
                            this.updateWorkingMemory({ pendingClarificationContext: null });
                        }
                        else {
                            errorMessage = "I seem to have lost the context for your clarification. Could you try again?";
                            this.updateWorkingMemory({ pendingClarificationContext: null });
                        }
                    }
                    else {
                        errorMessage = "I couldn't understand your choice for the clarification. Please try again.";
                        this.updateWorkingMemory({ pendingClarificationContext: null });
                    }
                    break;
                case 'DOUBLE_WORKOUT':
                    // This logic for clearing context was from Phase 8, Turn 21 - ensuring it's here
                    if (this.memory.workingMemory.pendingClarificationContext &&
                        (this.memory.workingMemory.pendingClarificationContext.originalIntentName !== detectedIntent.name ||
                            ((_a = this.memory.workingMemory.pendingClarificationContext.relatedData) === null || _a === void 0 ? void 0 : _a.workoutId) !== ((_b = this.memory.workingMemory.currentWorkout) === null || _b === void 0 ? void 0 : _b.id))) {
                        this.updateWorkingMemory({ pendingClarificationContext: null });
                    }
                    const guidance = this.getModificationGuidance(detectedIntent);
                    if (guidance.clarificationDetails) {
                        clarificationDetails = guidance.clarificationDetails;
                        const currentWorkoutForCtx = this.memory.workingMemory.currentWorkout;
                        // This newOptions mapping with explicit synonyms is from Phase 8, Turn 25/26
                        const newOptions = (guidance.clarificationDetails.options || []).map(opt => {
                            let explicitSynonyms = undefined;
                            if (opt.value === 'DOUBLE_SETS') {
                                explicitSynonyms = ['double sets', 'sets', 'set'];
                            }
                            else if (opt.value === 'DOUBLE_REPS') {
                                explicitSynonyms = ['double reps', 'reps', 'rep'];
                            }
                            else if (opt.value === 'DOUBLE_BOTH') {
                                explicitSynonyms = ['double both', 'both'];
                            }
                            return {
                                text: opt.text,
                                value: opt.value,
                                synonyms: explicitSynonyms
                            };
                        });
                        this.updateWorkingMemory({
                            pendingClarificationContext: {
                                originalIntentName: detectedIntent.name,
                                clarificationQuestionText: guidance.clarificationDetails.question,
                                optionsProvided: newOptions, // Use the newOptions with added synonyms
                                relatedData: { workoutId: currentWorkoutForCtx === null || currentWorkoutForCtx === void 0 ? void 0 : currentWorkoutForCtx.id }
                            }
                        });
                    }
                    else if (guidance.error) {
                        errorMessage = guidance.error;
                        this.updateWorkingMemory({ pendingClarificationContext: null });
                    }
                    break;
                case 'CLARIFICATION_MISMATCH':
                    if (this.memory.workingMemory.pendingClarificationContext) {
                        clarificationDetails = {
                            question: "Sorry, I didn't catch that. " + this.memory.workingMemory.pendingClarificationContext.clarificationQuestionText,
                            options: this.memory.workingMemory.pendingClarificationContext.optionsProvided
                        };
                    }
                    else {
                        errorMessage = "Sorry, I'm a bit confused. Could you rephrase or start over?";
                    }
                    break;
                case 'CANNOT_DOUBLE_NO_WORKOUT':
                    this.updateWorkingMemory({ pendingClarificationContext: null });
                    break;
                case 'GREETING':
                case 'FAREWELL':
                case 'THANKS':
                case 'HELP':
                    // These intents should clear a pending clarification if they are different from the original intent
                    // that led to the clarification.
                    if (this.memory.workingMemory.pendingClarificationContext &&
                        this.memory.workingMemory.pendingClarificationContext.originalIntentName !== detectedIntent.name) {
                        this.updateWorkingMemory({ pendingClarificationContext: null });
                    }
                    break;
                case 'GET_EXERCISE_INFO':
                    if (this.memory.workingMemory.pendingClarificationContext &&
                        this.memory.workingMemory.pendingClarificationContext.originalIntentName !== detectedIntent.name) {
                        this.updateWorkingMemory({ pendingClarificationContext: null });
                    }
                    const exerciseNameToGet = (_c = detectedIntent.slots) === null || _c === void 0 ? void 0 : _c.exercise_name;
                    if (exerciseNameToGet) {
                        toolResult = await this.executeTool('ExerciseInfoTool', { exerciseName: exerciseNameToGet });
                    }
                    else {
                        errorMessage = "Which exercise are you interested in?";
                    }
                    break;
                case 'CREATE_WORKOUT':
                    if (this.memory.workingMemory.pendingClarificationContext &&
                        this.memory.workingMemory.pendingClarificationContext.originalIntentName !== detectedIntent.name) {
                        this.updateWorkingMemory({ pendingClarificationContext: null });
                    }
                    // toolResult = await this.executeTool('WorkoutCreationTool', { slots: detectedIntent.slots });
                    break;
                case 'UNKNOWN_INTENT':
                default:
                    // generateResponse handles UNKNOWN_INTENT, potentially re-prompting if clarification was pending
                    // No need to clear pendingClarificationContext here, as user might be trying to answer
                    // or we want generateResponse to use that context for a more specific unknown message.
                    break;
            }
        }
        else {
            errorMessage = "Sorry, I couldn't understand your input at all.";
            this.updateWorkingMemory({ pendingClarificationContext: null });
        }
        agentResponse = this.generateResponse(this.memory.workingMemory.userIntent, clarificationDetails, toolResult, errorMessage);
        this.addConversationTurn({
            userInput: userInput,
            agentResponse: agentResponse,
            timestamp: new Date(),
        });
        return agentResponse;
    }
    presetWorkoutForTesting(workout) {
        this.updateWorkingMemory({ currentWorkout: workout });
        console.log("Preset workout for testing:", this.memory.workingMemory.currentWorkout);
    }
}
exports.IntelligentGymzyAgent = IntelligentGymzyAgent;
