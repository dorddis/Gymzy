"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligentWorkoutModifier = void 0;
class IntelligentWorkoutModifier {
    constructor() {
        this.name = 'IntelligentWorkoutModifier';
        this.description = 'Modifies a workout based on a specific plan (e.g., doubles sets/reps).';
    }
    async execute(params, currentMemory) {
        const plan = params.modificationPlan;
        const currentWorkout = currentMemory.workingMemory.currentWorkout;
        if (!plan) {
            return { success: false, error: 'No modification plan provided.' };
        }
        if (!currentWorkout) {
            return { success: false, error: 'No current workout in memory to modify.' };
        }
        if (currentWorkout.id !== plan.targetWorkoutId) {
            return { success: false, error: `Modification plan target ID ('${plan.targetWorkoutId}') does not match current workout ID ('${currentWorkout.id}').` };
        }
        // Deep copy to avoid modifying the memory snapshot directly
        let modifiedWorkout = JSON.parse(JSON.stringify(currentWorkout));
        let modificationError = null;
        modifiedWorkout.exercises = modifiedWorkout.exercises.map(exercise => {
            // Create a new object for each exercise to ensure we're not modifying the original array's items by reference
            const newExercise = Object.assign({}, exercise);
            switch (plan.type) {
                case 'DOUBLE_SETS':
                    newExercise.sets *= 2;
                    break;
                case 'DOUBLE_REPS':
                    newExercise.reps *= 2;
                    break;
                case 'DOUBLE_BOTH':
                    newExercise.sets *= 2;
                    newExercise.reps *= 2;
                    break;
                default:
                    // This case should ideally not be reached if plan types are validated before calling the tool
                    // Using 'as any' to satisfy TypeScript for this default, but plan.type should be strictly one of the ModificationPlan types.
                    modificationError = `Unknown modification type: ${plan.type}`;
                    // Return the original exercise if the type is unknown to avoid partial modification
                    return exercise;
            }
            return newExercise;
        });
        if (modificationError) {
            return { success: false, error: modificationError };
        }
        return {
            success: true,
            message: `Workout modified successfully: ${plan.type}`,
            updatedWorkout: modifiedWorkout,
        };
    }
}
exports.IntelligentWorkoutModifier = IntelligentWorkoutModifier;
