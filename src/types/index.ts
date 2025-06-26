/**
 * Type Definitions Index
 * Central export point for all application types
 */

// Export all chat-related types
export * from './chat';

// Export all workout-related types
export * from './workout';

// Export all user-related types
export * from './user';

// Export all API-related types
export * from './api';

// Export all common utility types
export * from './common';

// Re-export commonly used types for convenience
export type {
  // Chat types
  ChatMessage,
  ChatSession,
  ChatRequest,
  ChatResponse,
  StreamingChatResponse,
  ChatContext,
  
  // Workout types
  Workout,
  WorkoutExercise,
  Exercise,
  WorkoutSession,
  WorkoutTemplate,
  ExerciseSet,
  PerformedSet,
  
  // User types
  User,
  UserProfile,
  UserPreferences,
  UserSubscription,
  PrivacySettings,
  SocialProfile,
  OnboardingStatus,
  
  // API types
  BaseApiResponse,
  ApiError,
  PaginatedResponse,
  AuthRequest,
  AuthResponse,
  
  // Common types
  BaseEntity,
  TimestampedEntity,
  UserOwnedEntity,
  PaginationParams,
  PaginationMeta,
  SearchParams,
  SearchResult,
  AsyncState,
  Notification,
  AppError,
} from './chat';

export type {
  // Workout enums
  WorkoutType,
  SetType,
  WorkoutCategory,
  ExerciseCategory,
  MuscleGroup,
  Equipment,
  FitnessLevel,
  
  // User enums
  Gender,
  FitnessGoal,
  ActivityLevel,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
  VisibilityLevel,
  AppTheme,
  UnitSystem,
  
  // Common enums
  LoadingState,
  SortOrder,
  Theme,
  Language,
  NotificationType,
  Environment,
} from './workout';

// Type guards for runtime type checking
export const isUser = (obj: any): obj is User => {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
};

export const isWorkout = (obj: any): obj is Workout => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && Array.isArray(obj.exercises);
};

export const isChatMessage = (obj: any): obj is ChatMessage => {
  return obj && typeof obj.id === 'string' && typeof obj.content === 'string' && ['user', 'assistant', 'system'].includes(obj.role);
};

export const isApiError = (obj: any): obj is ApiError => {
  return obj && typeof obj.code === 'string' && typeof obj.message === 'string';
};

// Utility type helpers
export type ExtractArrayType<T> = T extends (infer U)[] ? U : never;
export type ExtractPromiseType<T> = T extends Promise<infer U> ? U : never;
export type NonNullable<T> = T extends null | undefined ? never : T;

// Component prop helpers
export type PropsWithClassName<P = {}> = P & { className?: string };
export type PropsWithChildren<P = {}> = P & { children?: React.ReactNode };
export type PropsWithTestId<P = {}> = P & { testId?: string };

// API response helpers
export type ApiResponseData<T extends BaseApiResponse> = T extends BaseApiResponse<infer U> ? U : never;
export type ApiSuccess<T> = BaseApiResponse<T> & { success: true; data: T };
export type ApiFailure = BaseApiResponse<never> & { success: false; error: ApiError };

// Form helpers
export type FormValues<T> = {
  [K in keyof T]: T[K];
};

export type FormErrors<T> = {
  [K in keyof T]?: string;
};

export type FormTouched<T> = {
  [K in keyof T]?: boolean;
};

// State management helpers
export type ActionType<T extends Record<string, any>> = {
  [K in keyof T]: { type: K; payload: T[K] };
}[keyof T];

export type StateUpdater<T> = (prevState: T) => T;
export type StateAction<T> = T | StateUpdater<T>;

// Database helpers
export type CreateInput<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T extends BaseEntity> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

// Event handler helpers
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Validation helpers
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type Validator<T> = (value: T) => ValidationResult;

// Permission helpers
export type Permission = string;
export type PermissionCheck = (permission: Permission) => boolean;

// Feature flag helpers
export type FeatureFlag = string;
export type FeatureFlagCheck = (flag: FeatureFlag) => boolean;

// Localization helpers
export type LocaleKey = string;
export type TranslationFunction = (key: LocaleKey, params?: Record<string, any>) => string;

// Theme helpers
export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme = 'light' | 'dark';

// Responsive helpers
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

// Animation helpers
export type AnimationDuration = 'fast' | 'normal' | 'slow';
export type AnimationEasing = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';

// Layout helpers
export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
export type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';

// Size helpers
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Spacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;

// Color helpers
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type ColorIntensity = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

// Status helpers
export type Status = 'idle' | 'loading' | 'success' | 'error';
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

// Priority helpers
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Urgency = 'low' | 'medium' | 'high' | 'urgent';

// Confidence helpers
export type Confidence = number; // 0-1
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

// Rating helpers
export type Rating = 1 | 2 | 3 | 4 | 5;
export type StarRating = Rating;

// Progress helpers
export type Progress = number; // 0-100
export type CompletionStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

// Time helpers
export type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
export type Duration = number; // in milliseconds
export type Timestamp = number; // Unix timestamp

// File helpers
export type FileSize = number; // in bytes
export type MimeType = string;
export type FileExtension = string;

// URL helpers
export type URL = string;
export type RelativeURL = string;
export type AbsoluteURL = string;

// ID helpers
export type UUID = string;
export type ShortId = string;
export type NumericId = number;

// Version helpers
export type Version = string; // semver format
export type VersionNumber = number;

// Currency helpers
export type CurrencyCode = string; // ISO 4217
export type MonetaryAmount = number;

// Coordinate helpers
export type Latitude = number; // -90 to 90
export type Longitude = number; // -180 to 180
export type Elevation = number; // in meters

// Weight helpers
export type WeightKg = number;
export type WeightLbs = number;
export type WeightUnit = 'kg' | 'lbs';

// Distance helpers
export type DistanceMeters = number;
export type DistanceFeet = number;
export type DistanceUnit = 'm' | 'ft' | 'km' | 'mi';

// Temperature helpers
export type TemperatureCelsius = number;
export type TemperatureFahrenheit = number;
export type TemperatureUnit = 'C' | 'F';
