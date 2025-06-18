"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathematicalValidator = void 0;
class MathematicalValidator {
    prepareWorkoutModification(intent, currentWorkout) {
        if (intent.name === 'DOUBLE_WORKOUT') {
            if (!currentWorkout || !currentWorkout.exercises || currentWorkout.exercises.length === 0) {
                return { error: "There's no current workout to double or it's empty." };
            }
            // For now, always ask for clarification for "DOUBLE_WORKOUT"
            return {
                clarificationDetails: {
                    question: 'How would you like me to double your workout? You can:',
                    options: [
                        { text: 'Double the sets', value: 'DOUBLE_SETS' },
                        { text: 'Double the reps', value: 'DOUBLE_REPS' },
                        { text: 'Double both sets and reps', value: 'DOUBLE_BOTH' },
                    ],
                },
            };
        }
        // Placeholder for other intents
        return { error: 'Intent not recognized for modification.' };
    }
}
exports.MathematicalValidator = MathematicalValidator;
