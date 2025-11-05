/**
 * Chat Input Validation Schemas
 * Zod schemas for validating chat-related data
 */

import { z } from 'zod';

// Basic chat message schema
export const chatMessageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message is too long (max 10,000 characters)')
    .refine(content => content.trim().length > 0, 'Message cannot be only whitespace'),
  role: z.enum(['user', 'assistant', 'system']),
  sessionId: z.string().min(1, 'Session ID is required').optional(),
  userId: z.string().min(1, 'User ID is required').optional(),
});

// Chat request schema
export const chatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message is too long (max 10,000 characters)')
    .refine(content => content.trim().length > 0, 'Message cannot be only whitespace'),
  sessionId: z.string().min(1, 'Session ID is required').optional(),
  userId: z.string().min(1, 'User ID is required'),
  context: z.object({
    previousMessages: z.array(chatMessageSchema).max(50, 'Too many previous messages (max 50)').optional(),
    userPreferences: z.object({
      preferredModel: z.enum(['gemini']).optional(),
      responseLength: z.enum(['short', 'medium', 'long']).optional(),
      includeExplanations: z.boolean().optional(),
      workoutStyle: z.array(z.string()).max(10, 'Too many workout styles (max 10)').optional(),
      fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
      availableEquipment: z.array(z.string()).max(20, 'Too many equipment types (max 20)').optional(),
      timeConstraints: z.number().min(5, 'Time constraint must be at least 5 minutes').max(300, 'Time constraint must be less than 5 hours').optional(),
    }).optional(),
    workoutHistory: z.array(z.object({
      id: z.string(),
      name: z.string(),
      date: z.date(),
      duration: z.number(),
      exercises: z.array(z.string()),
      muscleGroups: z.array(z.string()),
      difficulty: z.string(),
      rating: z.number().min(1).max(5).optional(),
    })).max(20, 'Too many workout history items (max 20)').optional(),
    currentWorkout: z.object({
      id: z.string(),
      name: z.string(),
      exercises: z.array(z.object({
        id: z.string(),
        name: z.string(),
        sets: z.number(),
        reps: z.union([z.number(), z.string()]),
        weight: z.number().optional(),
      })),
    }).optional(),
  }).optional(),
  options: z.object({
    model: z.enum(['gemini']).optional(),
    maxTokens: z.number().min(1, 'Max tokens must be at least 1').max(4000, 'Max tokens must be less than 4000').optional(),
    temperature: z.number().min(0, 'Temperature must be at least 0').max(2, 'Temperature must be at most 2').optional(),
    stream: z.boolean().optional(),
    includeWorkoutTools: z.boolean().optional(),
  }).optional(),
});

// Chat session creation schema
export const createChatSessionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Session title is required').max(100, 'Session title is too long').optional(),
  initialMessage: z.string().min(1, 'Initial message is required').max(1000, 'Initial message is too long').optional(),
});

// Chat session update schema
export const updateChatSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  title: z.string().min(1, 'Session title is required').max(100, 'Session title is too long').optional(),
  isActive: z.boolean().optional(),
});

// Tool call schema
export const toolCallSchema = z.object({
  name: z.string().min(1, 'Tool name is required').max(50, 'Tool name is too long'),
  arguments: z.record(z.any()),
});

// Tool response schema
export const toolResponseSchema = z.object({
  toolCallId: z.string().min(1, 'Tool call ID is required'),
  result: z.any(),
  success: z.boolean(),
  error: z.string().max(500, 'Error message is too long').optional(),
});

// Workout generation request schema
export const workoutGenerationRequestSchema = z.object({
  prompt: z.string()
    .min(10, 'Workout prompt must be at least 10 characters')
    .max(1000, 'Workout prompt is too long (max 1000 characters)'),
  preferences: z.object({
    duration: z.number().min(5, 'Duration must be at least 5 minutes').max(300, 'Duration must be less than 5 hours').optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    targetMuscles: z.array(z.string()).max(10, 'Too many target muscles (max 10)').optional(),
    equipment: z.array(z.string()).max(20, 'Too many equipment types (max 20)').optional(),
    workoutType: z.string().max(50, 'Workout type is too long').optional(),
    exerciseCount: z.number().min(1, 'Exercise count must be at least 1').max(30, 'Exercise count must be less than 30').optional(),
    setsPerExercise: z.number().min(1, 'Sets per exercise must be at least 1').max(10, 'Sets per exercise must be less than 10').optional(),
    repsRange: z.object({
      min: z.number().min(1, 'Minimum reps must be at least 1').max(100, 'Minimum reps must be less than 100'),
      max: z.number().min(1, 'Maximum reps must be at least 1').max(100, 'Maximum reps must be less than 100'),
    }).refine(data => data.min <= data.max, 'Minimum reps must be less than or equal to maximum reps').optional(),
    restTime: z.number().min(10, 'Rest time must be at least 10 seconds').max(600, 'Rest time must be less than 10 minutes').optional(),
  }).optional(),
  modifyExisting: z.object({
    workoutId: z.string().min(1, 'Workout ID is required'),
    modifications: z.array(z.enum([
      'increase_difficulty',
      'decrease_difficulty',
      'add_exercises',
      'remove_exercises',
      'change_equipment',
      'adjust_duration',
      'focus_different_muscles',
      'change_workout_type'
    ])).min(1, 'At least one modification is required').max(5, 'Too many modifications (max 5)'),
  }).optional(),
});

// Exercise modification request schema
export const exerciseModificationRequestSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  modificationType: z.enum([
    'increase_sets',
    'decrease_sets',
    'increase_reps',
    'decrease_reps',
    'increase_weight',
    'decrease_weight',
    'change_exercise',
    'add_dropset',
    'add_superset',
    'change_rest_time'
  ]),
  value: z.number().min(0, 'Modification value cannot be negative').max(1000, 'Modification value is too large').optional(),
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason is too long').optional(),
});

// Chat feedback schema
export const chatFeedbackSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
  rating: z.enum(['helpful', 'not_helpful', 'inappropriate', 'incorrect']),
  feedback: z.string().max(500, 'Feedback is too long').optional(),
  category: z.enum([
    'accuracy',
    'helpfulness',
    'clarity',
    'safety',
    'personalization',
    'response_time',
    'other'
  ]).optional(),
});

// Chat export request schema
export const chatExportRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required').optional(),
  userId: z.string().min(1, 'User ID is required'),
  format: z.enum(['json', 'csv', 'txt', 'pdf']),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).refine(data => data.start <= data.end, 'Start date must be before or equal to end date').optional(),
  includeMetadata: z.boolean().optional(),
  includeToolCalls: z.boolean().optional(),
});

// Chat search schema
export const chatSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query is too long'),
  userId: z.string().min(1, 'User ID is required'),
  sessionId: z.string().min(1, 'Session ID is required').optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).refine(data => data.start <= data.end, 'Start date must be before or equal to end date').optional(),
  messageType: z.enum(['user', 'assistant', 'system', 'all']).optional(),
  includeWorkoutData: z.boolean().optional(),
  page: z.number().min(1, 'Page must be at least 1').optional(),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be less than 100').optional(),
});

// AI model preference schema
export const aiModelPreferenceSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  preferredModel: z.enum(['gemini']),
  responseLength: z.enum(['short', 'medium', 'long']),
  temperature: z.number().min(0, 'Temperature must be at least 0').max(2, 'Temperature must be at most 2'),
  includeExplanations: z.boolean(),
  autoSelectModel: z.boolean(),
  modelSelectionCriteria: z.object({
    prioritizeSpeed: z.boolean(),
    prioritizeAccuracy: z.boolean(),
    prioritizeCreativity: z.boolean(),
    prioritizeCost: z.boolean(),
  }).optional(),
});

// Chat analytics request schema
export const chatAnalyticsRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  timeRange: z.enum(['day', 'week', 'month', 'quarter', 'year', 'all_time']),
  metrics: z.array(z.enum([
    'message_count',
    'session_count',
    'average_session_length',
    'response_time',
    'user_satisfaction',
    'tool_usage',
    'workout_generations',
    'model_usage'
  ])).min(1, 'At least one metric is required').max(10, 'Too many metrics (max 10)'),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

// Conversation summary request schema
export const conversationSummaryRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  summaryType: z.enum(['brief', 'detailed', 'key_points', 'action_items']),
  includeWorkouts: z.boolean().optional(),
  includeRecommendations: z.boolean().optional(),
  maxLength: z.number().min(50, 'Max length must be at least 50 characters').max(2000, 'Max length must be less than 2000 characters').optional(),
});

// Chat moderation schema
export const chatModerationSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Content is too long'),
  checkFor: z.array(z.enum([
    'inappropriate_content',
    'spam',
    'harassment',
    'misinformation',
    'unsafe_advice',
    'personal_information',
    'commercial_content'
  ])).min(1, 'At least one check is required').max(7, 'Too many checks'),
  severity: z.enum(['low', 'medium', 'high']).optional(),
});

// Export type inference helpers
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type UpdateChatSessionInput = z.infer<typeof updateChatSessionSchema>;
export type ToolCallInput = z.infer<typeof toolCallSchema>;
export type ToolResponseInput = z.infer<typeof toolResponseSchema>;
export type WorkoutGenerationRequestInput = z.infer<typeof workoutGenerationRequestSchema>;
export type ExerciseModificationRequestInput = z.infer<typeof exerciseModificationRequestSchema>;
export type ChatFeedbackInput = z.infer<typeof chatFeedbackSchema>;
export type ChatExportRequestInput = z.infer<typeof chatExportRequestSchema>;
export type ChatSearchInput = z.infer<typeof chatSearchSchema>;
export type AIModelPreferenceInput = z.infer<typeof aiModelPreferenceSchema>;
export type ChatAnalyticsRequestInput = z.infer<typeof chatAnalyticsRequestSchema>;
export type ConversationSummaryRequestInput = z.infer<typeof conversationSummaryRequestSchema>;
export type ChatModerationInput = z.infer<typeof chatModerationSchema>;
