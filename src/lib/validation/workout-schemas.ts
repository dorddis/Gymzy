/**
 * Workout Input Validation Schemas
 * Zod schemas for validating workout-related data
 */

import { z } from 'zod';

// Enum schemas
const workoutTypeSchema = z.enum([
  'strength', 'cardio', 'hiit', 'yoga', 'pilates', 'crossfit', 'bodyweight',
  'powerlifting', 'olympic_lifting', 'circuit', 'superset', 'dropset',
  'pyramid', 'tabata', 'emom', 'amrap'
]);

const setTypeSchema = z.enum([
  'normal', 'warmup', 'working', 'dropset', 'superset', 'circuit',
  'rest_pause', 'cluster', 'mechanical_dropset', 'tempo', 'isometric',
  'eccentric', 'pause_rep'
]);

const exerciseCategorySchema = z.enum([
  'compound', 'isolation', 'cardio', 'plyometric', 'isometric',
  'stretching', 'balance', 'coordination'
]);

const muscleGroupSchema = z.enum([
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'traps', 'lats',
  'delts', 'abs', 'obliques', 'lower_back', 'hip_flexors'
]);

const equipmentSchema = z.enum([
  'barbell', 'dumbbell', 'kettlebell', 'cable', 'machine', 'bodyweight',
  'resistance_band', 'medicine_ball', 'bosu_ball', 'stability_ball', 'trx',
  'pull_up_bar', 'bench', 'squat_rack', 'smith_machine', 'cardio_machine',
  'foam_roller', 'yoga_mat'
]);

const fitnessLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);
const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

// Exercise set schema
export const exerciseSetSchema = z.object({
  type: setTypeSchema,
  reps: z.number().min(1, 'Reps must be at least 1').max(1000, 'Reps must be less than 1000').optional(),
  weight: z.number().min(0, 'Weight cannot be negative').max(1000, 'Weight must be less than 1000kg').optional(),
  duration: z.number().min(1, 'Duration must be at least 1 second').max(7200, 'Duration must be less than 2 hours').optional(),
  distance: z.number().min(0.1, 'Distance must be at least 0.1 meters').max(100000, 'Distance must be less than 100km').optional(),
  restTime: z.number().min(0, 'Rest time cannot be negative').max(1800, 'Rest time must be less than 30 minutes').optional(),
  targetReps: z.number().min(1, 'Target reps must be at least 1').max(1000, 'Target reps must be less than 1000').optional(),
  targetWeight: z.number().min(0, 'Target weight cannot be negative').max(1000, 'Target weight must be less than 1000kg').optional(),
  targetDuration: z.number().min(1, 'Target duration must be at least 1 second').max(7200, 'Target duration must be less than 2 hours').optional(),
  dropsetWeight: z.number().min(0, 'Dropset weight cannot be negative').max(1000, 'Dropset weight must be less than 1000kg').optional(),
  superset: z.string().optional(),
  circuitOrder: z.number().min(1, 'Circuit order must be at least 1').max(20, 'Circuit order must be less than 20').optional(),
});

// Workout exercise schema
export const workoutExerciseSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  name: z.string().min(1, 'Exercise name is required').max(100, 'Exercise name is too long'),
  sets: z.array(exerciseSetSchema).min(1, 'At least one set is required').max(20, 'Too many sets (max 20)'),
  restTime: z.number().min(0, 'Rest time cannot be negative').max(1800, 'Rest time must be less than 30 minutes'),
  notes: z.string().max(500, 'Notes are too long').optional(),
  order: z.number().min(1, 'Exercise order must be at least 1').max(50, 'Exercise order must be less than 50'),
});

// Create workout schema
export const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100, 'Workout name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  exercises: z.array(workoutExerciseSchema).min(1, 'At least one exercise is required').max(30, 'Too many exercises (max 30)'),
  difficulty: difficultySchema,
  workoutType: workoutTypeSchema,
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().min(1, 'Tag cannot be empty').max(30, 'Tag is too long')).max(10, 'Too many tags (max 10)').optional(),
  estimatedDuration: z.number().min(5, 'Estimated duration must be at least 5 minutes').max(300, 'Estimated duration must be less than 5 hours').optional(),
});

// Update workout schema
export const updateWorkoutSchema = createWorkoutSchema.partial().extend({
  id: z.string().min(1, 'Workout ID is required'),
});

// Exercise creation schema
export const createExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(100, 'Exercise name is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description is too long'),
  instructions: z.array(z.string().min(1, 'Instruction cannot be empty').max(200, 'Instruction is too long')).min(1, 'At least one instruction is required').max(10, 'Too many instructions (max 10)'),
  muscleGroups: z.array(muscleGroupSchema).min(1, 'At least one muscle group is required').max(10, 'Too many muscle groups (max 10)'),
  equipment: z.array(equipmentSchema).min(1, 'At least one equipment type is required').max(5, 'Too many equipment types (max 5)'),
  difficulty: fitnessLevelSchema,
  category: exerciseCategorySchema,
  imageUrl: z.string().url('Invalid image URL').optional(),
  videoUrl: z.string().url('Invalid video URL').optional(),
  animationUrl: z.string().url('Invalid animation URL').optional(),
  commonMistakes: z.array(z.string().min(1, 'Common mistake cannot be empty').max(200, 'Common mistake is too long')).max(5, 'Too many common mistakes (max 5)').optional(),
  safetyTips: z.array(z.string().min(1, 'Safety tip cannot be empty').max(200, 'Safety tip is too long')).max(5, 'Too many safety tips (max 5)').optional(),
  contraindications: z.array(z.string().min(1, 'Contraindication cannot be empty').max(200, 'Contraindication is too long')).max(5, 'Too many contraindications (max 5)').optional(),
});

// Performed set schema (for workout sessions)
export const performedSetSchema = z.object({
  setNumber: z.number().min(1, 'Set number must be at least 1').max(50, 'Set number must be less than 50'),
  reps: z.number().min(0, 'Reps cannot be negative').max(1000, 'Reps must be less than 1000'),
  weight: z.number().min(0, 'Weight cannot be negative').max(1000, 'Weight must be less than 1000kg').optional(),
  duration: z.number().min(0, 'Duration cannot be negative').max(7200, 'Duration must be less than 2 hours').optional(),
  distance: z.number().min(0, 'Distance cannot be negative').max(100000, 'Distance must be less than 100km').optional(),
  rpe: z.number().min(1, 'RPE must be at least 1').max(10, 'RPE must be at most 10').optional(),
  restTime: z.number().min(0, 'Rest time cannot be negative').max(1800, 'Rest time must be less than 30 minutes').optional(),
  notes: z.string().max(200, 'Notes are too long').optional(),
  isPersonalBest: z.boolean().optional(),
  formBreakdown: z.boolean().optional(),
});

// Session exercise schema
export const sessionExerciseSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  name: z.string().min(1, 'Exercise name is required').max(100, 'Exercise name is too long'),
  sets: z.array(performedSetSchema).min(1, 'At least one set is required').max(20, 'Too many sets (max 20)'),
  notes: z.string().max(500, 'Notes are too long').optional(),
  formRating: z.number().min(1, 'Form rating must be at least 1').max(5, 'Form rating must be at most 5').optional(),
  difficultyRating: z.number().min(1, 'Difficulty rating must be at least 1').max(5, 'Difficulty rating must be at most 5').optional(),
});

// Start workout session schema
export const startWorkoutSessionSchema = z.object({
  workoutId: z.string().min(1, 'Workout ID is required'),
  location: z.string().max(100, 'Location is too long').optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
  mood: z.number().min(1, 'Mood rating must be at least 1').max(5, 'Mood rating must be at most 5').optional(),
  energy: z.number().min(1, 'Energy rating must be at least 1').max(5, 'Energy rating must be at most 5').optional(),
});

// Update workout session schema
export const updateWorkoutSessionSchema = z.object({
  exercises: z.array(sessionExerciseSchema).optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
  mood: z.number().min(1, 'Mood rating must be at least 1').max(5, 'Mood rating must be at most 5').optional(),
  energy: z.number().min(1, 'Energy rating must be at least 1').max(5, 'Energy rating must be at most 5').optional(),
  location: z.string().max(100, 'Location is too long').optional(),
});

// Complete workout session schema
export const completeWorkoutSessionSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  shareWithFollowers: z.boolean().optional(),
  estimatedCalories: z.number().min(0, 'Calories cannot be negative').max(5000, 'Calories must be less than 5000').optional(),
  averageHeartRate: z.number().min(30, 'Heart rate must be at least 30 bpm').max(250, 'Heart rate must be less than 250 bpm').optional(),
  maxHeartRate: z.number().min(30, 'Heart rate must be at least 30 bpm').max(250, 'Heart rate must be less than 250 bpm').optional(),
});

// Workout template schema
export const workoutTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Template name is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description is too long'),
  exercises: z.array(z.object({
    exerciseId: z.string().min(1, 'Exercise ID is required'),
    name: z.string().min(1, 'Exercise name is required').max(100, 'Exercise name is too long'),
    sets: z.number().min(1, 'Sets must be at least 1').max(20, 'Sets must be less than 20'),
    reps: z.union([
      z.number().min(1, 'Reps must be at least 1').max(1000, 'Reps must be less than 1000'),
      z.string().regex(/^\d+-\d+$/, 'Rep range must be in format "8-12"')
    ]),
    weight: z.union([
      z.enum(['bodyweight', 'light', 'medium', 'heavy']),
      z.number().min(0, 'Weight cannot be negative').max(1000, 'Weight must be less than 1000kg')
    ]).optional(),
    restTime: z.number().min(0, 'Rest time cannot be negative').max(1800, 'Rest time must be less than 30 minutes'),
    notes: z.string().max(200, 'Notes are too long').optional(),
  })).min(1, 'At least one exercise is required').max(20, 'Too many exercises (max 20)'),
  estimatedDuration: z.number().min(5, 'Estimated duration must be at least 5 minutes').max(300, 'Estimated duration must be less than 5 hours'),
  difficulty: difficultySchema,
  targetMuscles: z.array(muscleGroupSchema).min(1, 'At least one target muscle is required').max(10, 'Too many target muscles (max 10)'),
  equipment: z.array(equipmentSchema).min(1, 'At least one equipment type is required').max(10, 'Too many equipment types (max 10)'),
  category: z.enum(['push', 'pull', 'legs', 'upper_body', 'lower_body', 'full_body', 'core', 'cardio', 'flexibility', 'rehabilitation', 'sport_specific']),
  tags: z.array(z.string().min(1, 'Tag cannot be empty').max(30, 'Tag is too long')).max(10, 'Too many tags (max 10)').optional(),
});

// Workout search schema
export const workoutSearchSchema = z.object({
  query: z.string().max(100, 'Search query is too long').optional(),
  difficulty: z.array(difficultySchema).optional(),
  workoutType: z.array(workoutTypeSchema).optional(),
  duration: z.object({
    min: z.number().min(1, 'Minimum duration must be at least 1 minute').max(300, 'Minimum duration must be less than 5 hours').optional(),
    max: z.number().min(1, 'Maximum duration must be at least 1 minute').max(300, 'Maximum duration must be less than 5 hours').optional(),
  }).optional(),
  equipment: z.array(equipmentSchema).optional(),
  muscleGroups: z.array(muscleGroupSchema).optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
  isPublic: z.boolean().optional(),
  page: z.number().min(1, 'Page must be at least 1').optional(),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be less than 100').optional(),
});

// Exercise search schema
export const exerciseSearchSchema = z.object({
  query: z.string().max(100, 'Search query is too long').optional(),
  muscleGroups: z.array(muscleGroupSchema).optional(),
  equipment: z.array(equipmentSchema).optional(),
  difficulty: z.array(fitnessLevelSchema).optional(),
  category: z.array(exerciseCategorySchema).optional(),
  page: z.number().min(1, 'Page must be at least 1').optional(),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be less than 100').optional(),
});

// Workout rating schema
export const workoutRatingSchema = z.object({
  workoutId: z.string().min(1, 'Workout ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  review: z.string().max(500, 'Review is too long').optional(),
});

// Workout sharing schema
export const workoutSharingSchema = z.object({
  workoutId: z.string().min(1, 'Workout ID is required'),
  visibility: z.enum(['public', 'friends', 'followers', 'private']),
  message: z.string().max(280, 'Message is too long').optional(),
  tags: z.array(z.string().min(1, 'Tag cannot be empty').max(30, 'Tag is too long')).max(10, 'Too many tags (max 10)').optional(),
});

// Personal best record schema
export const personalBestSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  type: z.enum(['weight', 'reps', 'duration', 'volume']),
  value: z.number().min(0, 'Value cannot be negative').max(100000, 'Value is too large'),
  sessionId: z.string().min(1, 'Session ID is required'),
  notes: z.string().max(200, 'Notes are too long').optional(),
});

// Export type inference helpers
export type ExerciseSetInput = z.infer<typeof exerciseSetSchema>;
export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type PerformedSetInput = z.infer<typeof performedSetSchema>;
export type SessionExerciseInput = z.infer<typeof sessionExerciseSchema>;
export type StartWorkoutSessionInput = z.infer<typeof startWorkoutSessionSchema>;
export type UpdateWorkoutSessionInput = z.infer<typeof updateWorkoutSessionSchema>;
export type CompleteWorkoutSessionInput = z.infer<typeof completeWorkoutSessionSchema>;
export type WorkoutTemplateInput = z.infer<typeof workoutTemplateSchema>;
export type WorkoutSearchInput = z.infer<typeof workoutSearchSchema>;
export type ExerciseSearchInput = z.infer<typeof exerciseSearchSchema>;
export type WorkoutRatingInput = z.infer<typeof workoutRatingSchema>;
export type WorkoutSharingInput = z.infer<typeof workoutSharingSchema>;
export type PersonalBestInput = z.infer<typeof personalBestSchema>;
