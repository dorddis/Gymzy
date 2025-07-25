/**
 * User-related Type Definitions
 * Consolidated user types for consistency across the app
 */

// Core user interface
export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  
  // Profile information
  profile: UserProfile;
  
  // Authentication
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified?: boolean;
  
  // Account metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  
  // Subscription and permissions
  subscription: UserSubscription;
  permissions: UserPermissions;
  
  // Privacy settings
  privacy: PrivacySettings;
  
  // Social features
  social: SocialProfile;
  
  // App preferences
  preferences: UserPreferences;
  
  // Onboarding and setup
  onboarding: OnboardingStatus;
}

// Detailed user profile
export interface UserProfile {
  // Basic information
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  
  // Profile media
  profilePictureUrl?: string;
  coverImageUrl?: string;
  
  // Physical characteristics
  height?: number; // in cm
  weight?: number; // in kg
  bodyFatPercentage?: number;
  
  // Fitness information
  fitnessLevel: FitnessLevel;
  fitnessGoals: FitnessGoal[];
  activityLevel: ActivityLevel;
  
  // Health information
  healthConditions?: string[];
  injuries?: Injury[];
  medications?: string[];
  allergies?: string[];
  
  // Preferences
  preferredWorkoutTypes: WorkoutType[];
  availableEquipment: Equipment[];
  workoutDuration: number; // preferred duration in minutes
  workoutFrequency: number; // times per week
  
  // Location and timezone
  location?: UserLocation;
  timezone?: string;
  
  // Bio and interests
  bio?: string;
  interests?: string[];
  
  // Professional information (for trainers)
  isProfessional?: boolean;
  certifications?: Certification[];
  specializations?: string[];
}

// User subscription information
export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  
  // Payment information
  paymentMethod?: PaymentMethod;
  billingCycle: BillingCycle;
  
  // Usage tracking
  features: SubscriptionFeatures;
  usage: UsageMetrics;
  
  // Trial information
  trialUsed: boolean;
  trialEndDate?: Date;
}

// User permissions and roles
export interface UserPermissions {
  role: UserRole;
  canCreatePublicWorkouts: boolean;
  canModerateContent: boolean;
  canAccessBetaFeatures: boolean;
  canExportData: boolean;
  
  // AI features
  canUseAdvancedAI: boolean;
  canUsePersonalTrainer: boolean;
  aiRequestsPerDay: number;
  
  // Social features
  canFollowUsers: boolean;
  canCreateGroups: boolean;
  canHostChallenges: boolean;
}

// Privacy settings
export interface PrivacySettings {
  profileVisibility: VisibilityLevel;
  workoutVisibility: VisibilityLevel;
  progressVisibility: VisibilityLevel;
  
  // Data sharing
  allowDataAnalytics: boolean;
  allowPersonalization: boolean;
  allowMarketingEmails: boolean;
  allowPushNotifications: boolean;
  
  // Social privacy
  allowFollowers: boolean;
  allowDirectMessages: boolean;
  allowWorkoutSharing: boolean;
  allowLocationSharing: boolean;
  
  // AI privacy
  allowAIPersonalization: boolean;
  allowAIDataCollection: boolean;
  allowAIInsights: boolean;
}

// Social profile information
export interface SocialProfile {
  // Connections
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  
  // Activity
  postsCount: number;
  workoutsShared: number;
  likesReceived: number;
  commentsReceived: number;
  
  // Achievements
  badges: Badge[];
  achievements: Achievement[];
  streaks: Streak[];
  
  // Groups and communities
  groups: GroupMembership[];
  challenges: ChallengeMembership[];
  
  // Reputation
  reputationScore: number;
  helpfulVotes: number;
  
  // Social verification
  isVerified: boolean;
  verificationBadges: VerificationBadge[];
}

// User preferences for app behavior
export interface UserPreferences {
  // App behavior
  theme: AppTheme;
  language: string;
  units: UnitSystem;
  
  // Notifications
  notifications: NotificationPreferences;
  
  // Workout preferences
  defaultRestTime: number; // seconds
  autoStartTimer: boolean;
  showProgressPhotos: boolean;
  trackHeartRate: boolean;
  
  // AI preferences
  aiPersonality: AIPersonality;
  aiResponseLength: ResponseLength;
  preferredAIModel: AIModel;
  aiCoachingStyle: CoachingStyle;
  
  // Data and sync
  autoSync: boolean;
  syncFrequency: SyncFrequency;
  dataRetention: DataRetentionPeriod;
  
  // Accessibility
  accessibility: AccessibilitySettings;
}

// Onboarding status and progress
export interface OnboardingStatus {
  isCompleted: boolean;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  skippedSteps: string[];
  
  // Onboarding data
  responses: OnboardingResponse[];
  
  // Progress tracking
  startedAt: Date;
  completedAt?: Date;
  lastActiveStep?: string;
}

// Supporting interfaces and enums
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum FitnessLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum FitnessGoal {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  STRENGTH = 'strength',
  ENDURANCE = 'endurance',
  FLEXIBILITY = 'flexibility',
  GENERAL_FITNESS = 'general_fitness',
  SPORT_PERFORMANCE = 'sport_performance',
  REHABILITATION = 'rehabilitation',
  STRESS_RELIEF = 'stress_relief',
  BODY_COMPOSITION = 'body_composition',
}

export enum ActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHTLY_ACTIVE = 'lightly_active',
  MODERATELY_ACTIVE = 'moderately_active',
  VERY_ACTIVE = 'very_active',
  EXTREMELY_ACTIVE = 'extremely_active',
}

export enum SubscriptionPlan {
  FREE = 'free',
  PLUS = 'plus',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
  PAST_DUE = 'past_due',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime',
}

export enum UserRole {
  USER = 'user',
  TRAINER = 'trainer',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum VisibilityLevel {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

export enum AppTheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export enum UnitSystem {
  METRIC = 'metric',
  IMPERIAL = 'imperial',
}

export enum AIPersonality {
  MOTIVATIONAL = 'motivational',
  SUPPORTIVE = 'supportive',
  ANALYTICAL = 'analytical',
  CASUAL = 'casual',
  PROFESSIONAL = 'professional',
}

export enum CoachingStyle {
  ENCOURAGING = 'encouraging',
  CHALLENGING = 'challenging',
  EDUCATIONAL = 'educational',
  ADAPTIVE = 'adaptive',
}

export enum SyncFrequency {
  REAL_TIME = 'real_time',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MANUAL = 'manual',
}

export enum DataRetentionPeriod {
  ONE_MONTH = '1_month',
  THREE_MONTHS = '3_months',
  SIX_MONTHS = '6_months',
  ONE_YEAR = '1_year',
  INDEFINITE = 'indefinite',
}

// Supporting interfaces
export interface Injury {
  type: string;
  description: string;
  date: Date;
  severity: 'minor' | 'moderate' | 'severe';
  affectedAreas: string[];
  isActive: boolean;
  restrictions?: string[];
}

export interface UserLocation {
  country: string;
  state?: string;
  city?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Certification {
  name: string;
  organization: string;
  dateObtained: Date;
  expirationDate?: Date;
  certificateUrl?: string;
  isVerified: boolean;
}

export interface PaymentMethod {
  type: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface SubscriptionFeatures {
  maxWorkouts: number;
  maxAIRequests: number;
  canCreateCustomWorkouts: boolean;
  canAccessPremiumContent: boolean;
  canUseAdvancedAnalytics: boolean;
  canExportData: boolean;
  prioritySupport: boolean;
}

export interface UsageMetrics {
  workoutsCreated: number;
  aiRequestsUsed: number;
  dataExported: number;
  supportTickets: number;
  lastResetDate: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Date;
  category: BadgeCategory;
  rarity: BadgeRarity;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  isCompleted: boolean;
  completedAt?: Date;
  reward?: AchievementReward;
}

export interface Streak {
  type: StreakType;
  current: number;
  longest: number;
  lastActivity: Date;
  isActive: boolean;
}

export interface GroupMembership {
  groupId: string;
  groupName: string;
  role: GroupRole;
  joinedAt: Date;
  isActive: boolean;
}

export interface ChallengeMembership {
  challengeId: string;
  challengeName: string;
  status: ChallengeStatus;
  joinedAt: Date;
  completedAt?: Date;
  rank?: number;
}

export interface VerificationBadge {
  type: VerificationType;
  verifiedAt: Date;
  verifiedBy: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  
  // Notification types
  workoutReminders: boolean;
  socialActivity: boolean;
  achievements: boolean;
  challenges: boolean;
  systemUpdates: boolean;
  marketingOffers: boolean;
  
  // Timing preferences
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;
  };
  
  // Frequency
  digestFrequency: DigestFrequency;
}

export interface AccessibilitySettings {
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  voiceCommands: boolean;
  hapticFeedback: boolean;
}

export interface OnboardingResponse {
  questionId: string;
  question: string;
  answer: any;
  answeredAt: Date;
}

export interface AchievementReward {
  type: 'badge' | 'points' | 'feature_unlock' | 'discount';
  value: any;
  description: string;
}

// Additional enums
export enum BadgeCategory {
  WORKOUT = 'workout',
  SOCIAL = 'social',
  ACHIEVEMENT = 'achievement',
  MILESTONE = 'milestone',
  SPECIAL = 'special',
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum StreakType {
  DAILY_WORKOUT = 'daily_workout',
  WEEKLY_GOAL = 'weekly_goal',
  LOGIN = 'login',
  SOCIAL_INTERACTION = 'social_interaction',
}

export enum GroupRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  OWNER = 'owner',
}

export enum ChallengeStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABANDONED = 'abandoned',
}

export enum VerificationType {
  EMAIL = 'email',
  PHONE = 'phone',
  IDENTITY = 'identity',
  PROFESSIONAL = 'professional',
  SOCIAL_MEDIA = 'social_media',
}

export enum DigestFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  NEVER = 'never',
}

export enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large',
}

// API request/response types
export interface UpdateUserProfileRequest {
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
  privacy?: Partial<PrivacySettings>;
}

export interface UserResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface UserListResponse {
  success: boolean;
  users: User[];
  total: number;
  page: number;
  limit: number;
  error?: string;
}

// Utility types
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'deleted';
export type ProfileCompleteness = number; // 0-100 percentage
export type ResponseLength = 'short' | 'medium' | 'long';
export type AIModel = 'gemini' | 'groq';
