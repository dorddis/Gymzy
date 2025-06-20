/**
 * Common Type Definitions
 * Shared utility types and interfaces used across the application
 */

// Generic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ID types for type safety
export type UserId = string;
export type WorkoutId = string;
export type ExerciseId = string;
export type SessionId = string;
export type ChatMessageId = string;
export type FileId = string;

// Timestamp types
export type Timestamp = Date | string;
export type UnixTimestamp = number;

// Common enums
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
  JA = 'ja',
  KO = 'ko',
  ZH = 'zh',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  JPY = 'JPY',
}

// Common interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimestampedEntity {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserOwnedEntity extends BaseEntity {
  userId: string;
  createdBy: string;
}

export interface SoftDeletableEntity extends TimestampedEntity {
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface VersionedEntity extends BaseEntity {
  version: number;
  lastModifiedBy: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// Sorting types
export interface SortParams {
  field: string;
  order: SortOrder;
}

export interface SortOption {
  label: string;
  value: string;
  field: string;
  order: SortOrder;
}

// Filter types
export interface FilterOption<T = any> {
  label: string;
  value: T;
  count?: number;
  disabled?: boolean;
}

export interface FilterGroup {
  name: string;
  label: string;
  type: FilterType;
  options: FilterOption[];
  multiple?: boolean;
  required?: boolean;
}

export enum FilterType {
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RANGE = 'range',
  DATE_RANGE = 'date_range',
  BOOLEAN = 'boolean',
  TEXT = 'text',
}

// Search types
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: SortParams;
  pagination?: PaginationParams;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  filters: Record<string, any>;
  suggestions?: string[];
  facets?: SearchFacet[];
}

export interface SearchFacet {
  field: string;
  label: string;
  values: SearchFacetValue[];
}

export interface SearchFacetValue {
  value: string;
  label: string;
  count: number;
}

// Form types
export interface FormField<T = any> {
  name: string;
  label: string;
  type: FormFieldType;
  value: T;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  validation?: ValidationRule[];
  options?: FormFieldOption[];
  dependsOn?: string[];
  conditional?: ConditionalRule;
}

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PASSWORD = 'password',
  NUMBER = 'number',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  FILE = 'file',
  RANGE = 'range',
  COLOR = 'color',
  URL = 'url',
  PHONE = 'phone',
}

export interface FormFieldOption {
  label: string;
  value: any;
  disabled?: boolean;
  description?: string;
}

export interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
}

export enum ValidationType {
  REQUIRED = 'required',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  MIN_VALUE = 'minValue',
  MAX_VALUE = 'maxValue',
  PATTERN = 'pattern',
  EMAIL = 'email',
  URL = 'url',
  PHONE = 'phone',
  CUSTOM = 'custom',
}

export interface ConditionalRule {
  field: string;
  operator: ConditionalOperator;
  value: any;
}

export enum ConditionalOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  CONTAINS = 'contains',
  IN = 'in',
  NOT_IN = 'notIn',
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  stack?: string;
}

export interface ValidationError extends AppError {
  field: string;
  value: any;
  rule: ValidationRule;
}

export interface NetworkError extends AppError {
  status: number;
  statusText: string;
  url: string;
  method: string;
}

// Loading and async state types
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

export interface LoadingStates {
  [key: string]: boolean;
}

export interface ErrorStates {
  [key: string]: string | null;
}

// Notification types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
  data?: Record<string, any>;
  expiresAt?: Date;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  ACHIEVEMENT = 'achievement',
  SOCIAL = 'social',
  WORKOUT = 'workout',
  SYSTEM = 'system',
}

export interface NotificationAction {
  label: string;
  action: string;
  data?: Record<string, any>;
  style?: 'primary' | 'secondary' | 'danger';
}

// Media types
export interface MediaFile {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  mimeType: string;
  dimensions?: MediaDimensions;
  duration?: number; // for videos
  uploadedAt: Date;
  uploadedBy: string;
}

export interface MediaDimensions {
  width: number;
  height: number;
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

// Geolocation types
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface Location {
  coordinates: Coordinates;
  address?: Address;
  timestamp: Date;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}

// Analytics and tracking types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  environment: Environment;
  version: string;
  features: FeatureFlags;
  limits: AppLimits;
  integrations: IntegrationConfig;
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface AppLimits {
  maxFileSize: number;
  maxWorkoutDuration: number;
  maxExercisesPerWorkout: number;
  maxSetsPerExercise: number;
  apiRateLimit: number;
}

export interface IntegrationConfig {
  analytics?: AnalyticsConfig;
  errorTracking?: ErrorTrackingConfig;
  storage?: StorageConfig;
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  sampleRate?: number;
}

export interface ErrorTrackingConfig {
  enabled: boolean;
  dsn?: string;
  environment?: string;
}

export interface StorageConfig {
  provider: StorageProvider;
  bucket?: string;
  region?: string;
  cdnUrl?: string;
}

export enum StorageProvider {
  LOCAL = 'local',
  AWS_S3 = 'aws_s3',
  GOOGLE_CLOUD = 'google_cloud',
  CLOUDINARY = 'cloudinary',
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  testId?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

// Hook return types
export interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T) => void;
  removeValue: () => void;
}

// Utility functions types
export type Comparator<T> = (a: T, b: T) => number;
export type Predicate<T> = (item: T) => boolean;
export type Mapper<T, U> = (item: T) => U;
export type Reducer<T, U> = (accumulator: U, current: T) => U;

// Export commonly used type combinations
export type ID = string;
export type Timestamp = Date | string;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

// React component types
export type ComponentWithChildren<P = {}> = React.FC<P & { children: React.ReactNode }>;
export type ComponentWithOptionalChildren<P = {}> = React.FC<P & { children?: React.ReactNode }>;

// Event handler types
export type ClickHandler = (event: React.MouseEvent) => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler = (event: React.FormEvent) => void;
export type KeyboardHandler = (event: React.KeyboardEvent) => void;
