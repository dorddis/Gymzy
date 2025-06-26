/**
 * API-related Type Definitions
 * Consolidated API types for consistent request/response handling
 */

// Base API response structure
export interface BaseApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

// API error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string; // For validation errors
  retryable?: boolean;
  timestamp: string;
}

// Response metadata
export interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  version: string;
  processingTime?: number;
  rateLimit?: RateLimitInfo;
  pagination?: PaginationInfo;
}

// Rate limiting information
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string;
  retryAfter?: number;
}

// Pagination information
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Paginated response
export interface PaginatedResponse<T> extends BaseApiResponse<T[]> {
  pagination: PaginationInfo;
}

// API request base
export interface BaseApiRequest {
  requestId?: string;
  timestamp?: string;
  clientVersion?: string;
}

// Authentication request/response
export interface AuthRequest extends BaseApiRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse extends BaseApiResponse {
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    expiresAt: string;
  };
}

export interface RefreshTokenRequest extends BaseApiRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse extends BaseApiResponse {
  data?: {
    token: string;
    expiresAt: string;
  };
}

// User API types
export interface CreateUserRequest extends BaseApiRequest {
  email: string;
  password: string;
  username?: string;
  profile?: Partial<UserProfile>;
}

export interface UpdateUserRequest extends BaseApiRequest {
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
  privacy?: Partial<PrivacySettings>;
}

export interface UserSearchRequest extends BaseApiRequest {
  query: string;
  filters?: UserSearchFilters;
  pagination?: PaginationRequest;
}

export interface UserSearchFilters {
  fitnessLevel?: FitnessLevel[];
  location?: string;
  interests?: string[];
  isTrainer?: boolean;
  isVerified?: boolean;
}

// Workout API types
export interface CreateWorkoutRequest extends BaseApiRequest {
  name: string;
  description?: string;
  exercises: WorkoutExerciseInput[];
  difficulty: FitnessLevel;
  workoutType: WorkoutType;
  isPublic?: boolean;
  tags?: string[];
}

export interface WorkoutExerciseInput {
  exerciseId: string;
  sets: ExerciseSetInput[];
  restTime: number;
  notes?: string;
  order: number;
}

export interface ExerciseSetInput {
  type: SetType;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  targetReps?: number;
  targetWeight?: number;
}

export interface UpdateWorkoutRequest extends BaseApiRequest {
  name?: string;
  description?: string;
  exercises?: WorkoutExerciseInput[];
  difficulty?: FitnessLevel;
  workoutType?: WorkoutType;
  isPublic?: boolean;
  tags?: string[];
}

export interface WorkoutSearchRequest extends BaseApiRequest {
  query?: string;
  filters?: WorkoutSearchFilters;
  pagination?: PaginationRequest;
  sort?: SortOptions;
}

export interface WorkoutSearchFilters {
  difficulty?: FitnessLevel[];
  workoutType?: WorkoutType[];
  duration?: DurationRange;
  equipment?: Equipment[];
  muscleGroups?: MuscleGroup[];
  tags?: string[];
  createdBy?: string;
  isPublic?: boolean;
}

export interface DurationRange {
  min?: number;
  max?: number;
}

// Exercise API types
export interface CreateExerciseRequest extends BaseApiRequest {
  name: string;
  description: string;
  instructions: string[];
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: FitnessLevel;
  category: ExerciseCategory;
  imageUrl?: string;
  videoUrl?: string;
}

export interface ExerciseSearchRequest extends BaseApiRequest {
  query?: string;
  filters?: ExerciseSearchFilters;
  pagination?: PaginationRequest;
}

export interface ExerciseSearchFilters {
  muscleGroups?: MuscleGroup[];
  equipment?: Equipment[];
  difficulty?: FitnessLevel[];
  category?: ExerciseCategory[];
}

// Chat API types
export interface ChatRequest extends BaseApiRequest {
  message: string;
  sessionId?: string;
  context?: ChatContext;
  options?: ChatOptions;
}

export interface ChatContext {
  previousMessages?: ChatMessage[];
  userPreferences?: UserPreferences;
  workoutHistory?: WorkoutSummary[];
  currentWorkout?: Workout;
}

export interface ChatOptions {
  model?: AIModel;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  includeWorkoutTools?: boolean;
}

export interface ChatResponse extends BaseApiResponse {
  data?: {
    message: ChatMessage;
    sessionId: string;
    usage?: TokenUsage;
  };
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Workout session API types
export interface StartWorkoutSessionRequest extends BaseApiRequest {
  workoutId: string;
  location?: string;
  notes?: string;
}

export interface UpdateWorkoutSessionRequest extends BaseApiRequest {
  exercises?: SessionExerciseUpdate[];
  notes?: string;
  mood?: number;
  energy?: number;
}

export interface SessionExerciseUpdate {
  exerciseId: string;
  sets: PerformedSetUpdate[];
  notes?: string;
}

export interface PerformedSetUpdate {
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  rpe?: number;
  notes?: string;
}

export interface CompleteWorkoutSessionRequest extends BaseApiRequest {
  rating?: number;
  notes?: string;
  shareWithFollowers?: boolean;
}

// Social API types
export interface FollowUserRequest extends BaseApiRequest {
  userId: string;
}

export interface CreatePostRequest extends BaseApiRequest {
  content: string;
  workoutId?: string;
  imageUrls?: string[];
  tags?: string[];
  visibility?: VisibilityLevel;
}

export interface LikePostRequest extends BaseApiRequest {
  postId: string;
}

export interface CommentRequest extends BaseApiRequest {
  postId: string;
  content: string;
  parentCommentId?: string;
}

// File upload API types
export interface FileUploadRequest extends BaseApiRequest {
  file: File;
  type: FileType;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  description?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface FileUploadResponse extends BaseApiResponse {
  data?: {
    fileId: string;
    url: string;
    thumbnailUrl?: string;
    metadata: UploadedFileMetadata;
  };
}

export interface UploadedFileMetadata {
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

// Analytics API types
export interface AnalyticsRequest extends BaseApiRequest {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface ProgressAnalyticsRequest extends BaseApiRequest {
  timeRange: TimeRange;
  metrics?: ProgressMetric[];
}

export interface ProgressAnalyticsResponse extends BaseApiResponse {
  data?: {
    metrics: ProgressData[];
    insights: ProgressInsight[];
    recommendations: ProgressRecommendation[];
  };
}

export interface ProgressData {
  metric: ProgressMetric;
  values: DataPoint[];
  trend: TrendDirection;
  change: number;
  changePercentage: number;
}

export interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ProgressInsight {
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
}

export interface ProgressRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  priority: Priority;
  estimatedImpact: ImpactLevel;
}

// Utility types and enums
export enum FileType {
  PROFILE_PICTURE = 'profile_picture',
  WORKOUT_IMAGE = 'workout_image',
  EXERCISE_VIDEO = 'exercise_video',
  PROGRESS_PHOTO = 'progress_photo',
  DOCUMENT = 'document',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export interface SortOptions {
  field: string;
  direction: SortDirection;
}

export interface PaginationRequest {
  page?: number;
  limit?: number;
}

export enum TimeRange {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  ALL_TIME = 'all_time',
}

export enum ProgressMetric {
  WEIGHT = 'weight',
  BODY_FAT = 'body_fat',
  MUSCLE_MASS = 'muscle_mass',
  WORKOUT_FREQUENCY = 'workout_frequency',
  TOTAL_VOLUME = 'total_volume',
  PERSONAL_BESTS = 'personal_bests',
  CONSISTENCY = 'consistency',
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
}

export enum InsightType {
  PROGRESS = 'progress',
  PLATEAU = 'plateau',
  IMPROVEMENT = 'improvement',
  CONCERN = 'concern',
  ACHIEVEMENT = 'achievement',
}

export enum RecommendationType {
  WORKOUT_ADJUSTMENT = 'workout_adjustment',
  NUTRITION = 'nutrition',
  RECOVERY = 'recovery',
  GOAL_SETTING = 'goal_setting',
  TECHNIQUE = 'technique',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

// HTTP status codes for better error handling
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

// API endpoint types
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  requiresAuth?: boolean;
  rateLimit?: number;
}

// Webhook types
export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature: string;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  error?: string;
}

// Import required types from other files
import { User, UserProfile, UserPreferences, PrivacySettings, FitnessLevel } from './user';
import { Workout, WorkoutType, Exercise, MuscleGroup, Equipment, ExerciseCategory, SetType, WorkoutSummary } from './workout';
import { ChatMessage, AIModel } from './chat';
