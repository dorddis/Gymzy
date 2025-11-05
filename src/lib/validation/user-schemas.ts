/**
 * User Input Validation Schemas
 * Zod schemas for validating user-related data
 */

import { z } from 'zod';

// Basic validation patterns
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

const phoneSchema = z.string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
  .optional();

// Enum schemas
const genderSchema = z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']);
const fitnessLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);
const activityLevelSchema = z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']);
const subscriptionPlanSchema = z.enum(['free', 'plus', 'pro', 'enterprise']);
const userRoleSchema = z.enum(['user', 'trainer', 'moderator', 'admin', 'super_admin']);
const visibilityLevelSchema = z.enum(['public', 'friends', 'followers', 'private']);
const themeSchema = z.enum(['light', 'dark', 'auto']);
const unitSystemSchema = z.enum(['metric', 'imperial']);

// User registration schema
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  username: usernameSchema.optional(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long').optional(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
  agreeToPrivacy: z.boolean().refine(val => val === true, 'You must agree to the privacy policy'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// User login schema
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Password reset schemas
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// User profile update schema
export const userProfileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long').optional(),
  username: usernameSchema.optional(),
  displayName: z.string().max(100, 'Display name is too long').optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
  dateOfBirth: z.date().max(new Date(), 'Date of birth cannot be in the future').optional(),
  gender: genderSchema.optional(),
  height: z.number().min(50, 'Height must be at least 50cm').max(300, 'Height must be less than 300cm').optional(),
  weight: z.number().min(20, 'Weight must be at least 20kg').max(500, 'Weight must be less than 500kg').optional(),
  bodyFatPercentage: z.number().min(1, 'Body fat percentage must be at least 1%').max(50, 'Body fat percentage must be less than 50%').optional(),
  fitnessLevel: fitnessLevelSchema.optional(),
  activityLevel: activityLevelSchema.optional(),
  phoneNumber: phoneSchema,
  location: z.object({
    country: z.string().min(1, 'Country is required'),
    state: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
  timezone: z.string().optional(),
  interests: z.array(z.string()).max(20, 'Too many interests selected').optional(),
});

// Fitness goals schema
export const fitnessGoalsSchema = z.object({
  goals: z.array(z.enum([
    'weight_loss',
    'muscle_gain',
    'strength',
    'endurance',
    'flexibility',
    'general_fitness',
    'sport_performance',
    'rehabilitation',
    'stress_relief',
    'body_composition'
  ])).min(1, 'Please select at least one fitness goal').max(5, 'Please select no more than 5 goals'),
  targetWeight: z.number().min(20, 'Target weight must be at least 20kg').max(500, 'Target weight must be less than 500kg').optional(),
  targetBodyFat: z.number().min(1, 'Target body fat must be at least 1%').max(50, 'Target body fat must be less than 50%').optional(),
  workoutFrequency: z.number().min(1, 'Workout frequency must be at least 1 time per week').max(14, 'Workout frequency must be less than 14 times per week'),
  workoutDuration: z.number().min(10, 'Workout duration must be at least 10 minutes').max(300, 'Workout duration must be less than 300 minutes'),
});

// Health information schema
export const healthInformationSchema = z.object({
  healthConditions: z.array(z.string()).optional(),
  injuries: z.array(z.object({
    type: z.string().min(1, 'Injury type is required'),
    description: z.string().min(1, 'Injury description is required'),
    date: z.date().max(new Date(), 'Injury date cannot be in the future'),
    severity: z.enum(['minor', 'moderate', 'severe']),
    affectedAreas: z.array(z.string()).min(1, 'At least one affected area is required'),
    isActive: z.boolean(),
    restrictions: z.array(z.string()).optional(),
  })).optional(),
  medications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
});

// Equipment availability schema
export const equipmentAvailabilitySchema = z.object({
  availableEquipment: z.array(z.enum([
    'barbell',
    'dumbbell',
    'kettlebell',
    'cable',
    'machine',
    'bodyweight',
    'resistance_band',
    'medicine_ball',
    'bosu_ball',
    'stability_ball',
    'trx',
    'pull_up_bar',
    'bench',
    'squat_rack',
    'smith_machine',
    'cardio_machine',
    'foam_roller',
    'yoga_mat'
  ])).optional(),
  gymAccess: z.boolean(),
  homeGym: z.boolean(),
  outdoorSpace: z.boolean(),
});

// Privacy settings schema
export const privacySettingsSchema = z.object({
  profileVisibility: visibilityLevelSchema,
  workoutVisibility: visibilityLevelSchema,
  progressVisibility: visibilityLevelSchema,
  allowDataAnalytics: z.boolean(),
  allowPersonalization: z.boolean(),
  allowMarketingEmails: z.boolean(),
  allowPushNotifications: z.boolean(),
  allowFollowers: z.boolean(),
  allowDirectMessages: z.boolean(),
  allowWorkoutSharing: z.boolean(),
  allowLocationSharing: z.boolean(),
  allowAIPersonalization: z.boolean(),
  allowAIDataCollection: z.boolean(),
  allowAIInsights: z.boolean(),
});

// User preferences schema
export const userPreferencesSchema = z.object({
  theme: themeSchema,
  language: z.string().min(2, 'Language code must be at least 2 characters').max(5, 'Language code is too long'),
  units: unitSystemSchema,
  defaultRestTime: z.number().min(10, 'Rest time must be at least 10 seconds').max(600, 'Rest time must be less than 10 minutes'),
  autoStartTimer: z.boolean(),
  showProgressPhotos: z.boolean(),
  trackHeartRate: z.boolean(),
  aiPersonality: z.enum(['motivational', 'supportive', 'analytical', 'casual', 'professional']),
  aiResponseLength: z.enum(['short', 'medium', 'long']),
  preferredAIModel: z.enum(['gemini']),
  aiCoachingStyle: z.enum(['encouraging', 'challenging', 'educational', 'adaptive']),
  autoSync: z.boolean(),
  syncFrequency: z.enum(['real_time', 'hourly', 'daily', 'weekly', 'manual']),
  dataRetention: z.enum(['1_month', '3_months', '6_months', '1_year', 'indefinite']),
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  sms: z.boolean(),
  workoutReminders: z.boolean(),
  socialActivity: z.boolean(),
  achievements: z.boolean(),
  challenges: z.boolean(),
  systemUpdates: z.boolean(),
  marketingOffers: z.boolean(),
  quietHours: z.object({
    enabled: z.boolean(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  }),
  digestFrequency: z.enum(['daily', 'weekly', 'monthly', 'never']),
});

// Subscription update schema
export const subscriptionUpdateSchema = z.object({
  plan: subscriptionPlanSchema,
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly', 'lifetime']),
  autoRenew: z.boolean(),
});

// Account deletion schema
export const accountDeletionSchema = z.object({
  password: z.string().min(1, 'Password is required for account deletion'),
  reason: z.string().min(1, 'Please provide a reason for account deletion').max(500, 'Reason is too long'),
  confirmDeletion: z.boolean().refine(val => val === true, 'You must confirm account deletion'),
});

// Profile picture upload schema
export const profilePictureUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), 'File must be a JPEG, PNG, or WebP image'),
});

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: emailSchema,
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long'),
  category: z.enum(['general', 'technical', 'billing', 'feature_request', 'bug_report', 'other']),
});

// Feedback schema
export const feedbackSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters').max(1000, 'Feedback is too long'),
  category: z.enum(['app_performance', 'user_interface', 'features', 'content', 'support', 'other']),
  wouldRecommend: z.boolean(),
});

// Export type inference helpers
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type FitnessGoalsInput = z.infer<typeof fitnessGoalsSchema>;
export type HealthInformationInput = z.infer<typeof healthInformationSchema>;
export type EquipmentAvailabilityInput = z.infer<typeof equipmentAvailabilitySchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;
export type AccountDeletionInput = z.infer<typeof accountDeletionSchema>;
export type ProfilePictureUploadInput = z.infer<typeof profilePictureUploadSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
