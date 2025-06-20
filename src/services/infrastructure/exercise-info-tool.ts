// src/services/exercise-info-tool.ts
import {
  ToolParams,
  ToolResult,
  CognitiveTool,
  IntelligentAgentMemory
} from './intelligent-agent-service'; // Adjust path as needed
import { findExercise, ExerciseDetails } from '../data/mock-exercise-database'; // Adjust path

export class ExerciseInfoTool implements CognitiveTool {
  name = 'ExerciseInfoTool';
  description = 'Provides information about a specific exercise from the database.';

  async execute(params: ToolParams, currentMemory: Readonly<IntelligentAgentMemory>): Promise<ToolResult> {
    const exerciseName = params.exerciseName as string; // Assuming exerciseName is passed in params

    if (!exerciseName) {
      return { success: false, error: 'No exercise name provided.' };
    }

    const exerciseDetails = findExercise(exerciseName);

    if (!exerciseDetails) {
      return {
        success: false,
        error: `Sorry, I don't have information on an exercise called "${exerciseName}".`,
        // We could suggest alternatives or similar exercises in a more advanced version
      };
    }

    // Format the response message
    let message = `Here's information on ${exerciseDetails.name}:\n`;
    message += `Description: ${exerciseDetails.description}\n`;
    message += `Target Muscles: ${exerciseDetails.targetMuscles.join(', ')}\n`;
    if (exerciseDetails.instructions && exerciseDetails.instructions.length > 0) {
      message += `Instructions:\n${exerciseDetails.instructions.map((step, i) => `  ${i + 1}. ${step}`).join('\n')}\n`;
    }
    if (exerciseDetails.commonMistakes && exerciseDetails.commonMistakes.length > 0) {
      message += `Common Mistakes:\n${exerciseDetails.commonMistakes.map(mistake => `  - ${mistake}`).join('\n')}\n`;
    }
    if (exerciseDetails.videoUrl) {
      message += `You can watch a video here: ${exerciseDetails.videoUrl}\n`;
    }

    return {
      success: true,
      message: message.trim(), // Trim trailing newline
      // We could also return structured data if needed by the agent/UI
      // data: exerciseDetails
    };
  }
}
