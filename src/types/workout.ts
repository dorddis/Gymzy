/**
 * Workout-related Type Definitions
 * Consolidated workout types for consistency across the app
 */

// Core workout interfaces
export interface Workout {
  id: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  duration: number; // in minutes
  difficulty: FitnessLevel;
  targetMuscles: string[];
  equipment: string[];
  workoutType: WorkoutType;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // userId
  isPublic: boolean;
  isTemplate: boolean;
  
  // Performance tracking
  estimatedCalories?: number;
  averageRating?: number;
  totalCompletions?: number;
  
  // AI-generated metadata
  aiGenerated?: boolean;
  aiModel?: string;
  generationPrompt?: string;
  
  // Social features
  likes?: number;
  shares?: number;
  comments?: WorkoutComment[];
  
  // Tags and categorization
  tags?: string[];
  category?: WorkoutCategory;
}

// Exercise within a workout context
export interface WorkoutExercise {
  id: string;
  exerciseId: string; // Reference to base exercise
  name: string;
  sets: ExerciseSet[];
  restTime: number; // seconds between sets
  notes?: string;
  order: number; // Position in workout
  
  // Exercise details (denormalized for performance)
  muscleGroups: string[];
  equipment: string[];
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
  
  // Modifications
  modifications?: ExerciseModification[];
  
  // Performance tracking
  personalBest?: PersonalBest;
  lastPerformed?: Date;
  averageRating?: number;
}

// Exercise set definition
export interface ExerciseSet {
  id: string;
  type: SetType;
  reps?: number;
  weight?: number; // in kg or lbs
  duration?: number; // in seconds for time-based exercises
  distance?: number; // in meters for cardio
  restTime?: number; // override workout rest time
  
  // Set-specific data
  targetReps?: number; // for progressive overload
  targetWeight?: number;
  targetDuration?: number;
  
  // Performance tracking
  completed?: boolean;
  actualReps?: number;
  actualWeight?: number;
  actualDuration?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  
  // Special set types
  dropsetWeight?: number; // for dropsets
  superset?: string; // ID of paired exercise for supersets
  circuitOrder?: number; // for circuit training
}

// Base exercise definition (exercise library)
export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: FitnessLevel;
  category: ExerciseCategory;
  
  // Media
  imageUrl?: string;
  videoUrl?: string;
  animationUrl?: string;
  
  // Variations and progressions
  variations?: ExerciseVariation[];
  progressions?: ExerciseProgression[];
  regressions?: ExerciseProgression[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean; // Verified by fitness professionals
  
  // Performance data
  averageRating?: number;
  totalUses?: number;
  
  // Safety and form
  commonMistakes?: string[];
  safetyTips?: string[];
  contraindications?: string[];
}

// Workout session (actual performance)
export interface WorkoutSession {
  id: string;
  workoutId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // actual duration in minutes
  
  // Performance data
  exercises: SessionExercise[];
  totalVolume: number; // total weight lifted
  estimatedCalories: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  
  // Session metadata
  location?: string;
  weather?: string;
  mood?: number; // 1-5 scale
  energy?: number; // 1-5 scale
  notes?: string;
  
  // Completion status
  completed: boolean;
  completionPercentage: number;
  
  // Social features
  isPublic: boolean;
  shareWithFollowers?: boolean;
  
  // AI insights
  aiInsights?: SessionInsight[];
}

// Exercise performance in a session
export interface SessionExercise {
  exerciseId: string;
  name: string;
  sets: PerformedSet[];
  notes?: string;
  
  // Performance metrics
  totalVolume: number;
  personalBestAchieved?: boolean;
  formRating?: number; // 1-5 scale
  difficultyRating?: number; // 1-5 scale
}

// Actually performed set
export interface PerformedSet {
  setNumber: number;
  reps: number;
  weight?: number;
  duration?: number;
  distance?: number;
  rpe?: number;
  restTime?: number;
  notes?: string;
  
  // Performance indicators
  isPersonalBest?: boolean;
  formBreakdown?: boolean;
}

// Workout template for quick workouts
export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: TemplateExercise[];
  estimatedDuration: number;
  difficulty: FitnessLevel;
  targetMuscles: string[];
  equipment: string[];
  
  // Template metadata
  category: WorkoutCategory;
  tags: string[];
  isPopular: boolean;
  usageCount: number;
  
  // Customization
  isCustomizable: boolean;
  variations?: TemplateVariation[];
}

// Exercise in a template
export interface TemplateExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number | string; // "8-12" or specific number
  weight?: 'bodyweight' | 'light' | 'medium' | 'heavy' | number;
  restTime: number;
  notes?: string;
}

// Enums and utility types
export enum WorkoutType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  HIIT = 'hiit',
  YOGA = 'yoga',
  PILATES = 'pilates',
  CROSSFIT = 'crossfit',
  BODYWEIGHT = 'bodyweight',
  POWERLIFTING = 'powerlifting',
  OLYMPIC_LIFTING = 'olympic_lifting',
  CIRCUIT = 'circuit',
  SUPERSET = 'superset',
  DROPSET = 'dropset',
  PYRAMID = 'pyramid',
  TABATA = 'tabata',
  EMOM = 'emom', // Every Minute on the Minute
  AMRAP = 'amrap', // As Many Rounds As Possible
}

export enum SetType {
  NORMAL = 'normal',
  WARMUP = 'warmup',
  WORKING = 'working',
  DROPSET = 'dropset',
  SUPERSET = 'superset',
  CIRCUIT = 'circuit',
  REST_PAUSE = 'rest_pause',
  CLUSTER = 'cluster',
  MECHANICAL_DROPSET = 'mechanical_dropset',
  TEMPO = 'tempo',
  ISOMETRIC = 'isometric',
  ECCENTRIC = 'eccentric',
  PAUSE_REP = 'pause_rep',
}

export enum WorkoutCategory {
  PUSH = 'push',
  PULL = 'pull',
  LEGS = 'legs',
  UPPER_BODY = 'upper_body',
  LOWER_BODY = 'lower_body',
  FULL_BODY = 'full_body',
  CORE = 'core',
  CARDIO = 'cardio',
  FLEXIBILITY = 'flexibility',
  REHABILITATION = 'rehabilitation',
  SPORT_SPECIFIC = 'sport_specific',
}

export enum ExerciseCategory {
  COMPOUND = 'compound',
  ISOLATION = 'isolation',
  CARDIO = 'cardio',
  PLYOMETRIC = 'plyometric',
  ISOMETRIC = 'isometric',
  STRETCHING = 'stretching',
  BALANCE = 'balance',
  COORDINATION = 'coordination',
}

export enum MuscleGroup {
  CHEST = 'chest',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  FOREARMS = 'forearms',
  CORE = 'core',
  QUADRICEPS = 'quadriceps',
  HAMSTRINGS = 'hamstrings',
  GLUTES = 'glutes',
  CALVES = 'calves',
  TRAPS = 'traps',
  LATS = 'lats',
  DELTS = 'delts',
  ABS = 'abs',
  OBLIQUES = 'obliques',
  LOWER_BACK = 'lower_back',
  HIP_FLEXORS = 'hip_flexors',
}

export enum Equipment {
  BARBELL = 'barbell',
  DUMBBELL = 'dumbbell',
  KETTLEBELL = 'kettlebell',
  CABLE = 'cable',
  MACHINE = 'machine',
  BODYWEIGHT = 'bodyweight',
  RESISTANCE_BAND = 'resistance_band',
  MEDICINE_BALL = 'medicine_ball',
  BOSU_BALL = 'bosu_ball',
  STABILITY_BALL = 'stability_ball',
  TRX = 'trx',
  PULL_UP_BAR = 'pull_up_bar',
  BENCH = 'bench',
  SQUAT_RACK = 'squat_rack',
  SMITH_MACHINE = 'smith_machine',
  CARDIO_MACHINE = 'cardio_machine',
  FOAM_ROLLER = 'foam_roller',
  YOGA_MAT = 'yoga_mat',
}

export enum FitnessLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

// Supporting interfaces
export interface ExerciseModification {
  type: 'easier' | 'harder' | 'different_equipment';
  description: string;
  exerciseId?: string; // Alternative exercise
}

export interface ExerciseVariation {
  id: string;
  name: string;
  description: string;
  difficulty: FitnessLevel;
  equipment: Equipment[];
}

export interface ExerciseProgression {
  id: string;
  name: string;
  description: string;
  difficulty: FitnessLevel;
  requirements?: string[];
}

export interface PersonalBest {
  type: 'weight' | 'reps' | 'duration' | 'volume';
  value: number;
  date: Date;
  sessionId: string;
}

export interface WorkoutComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  likes: number;
}

export interface SessionInsight {
  type: 'performance' | 'form' | 'progression' | 'recovery';
  title: string;
  description: string;
  recommendation?: string;
  confidence: number; // 0-1
}

export interface TemplateVariation {
  id: string;
  name: string;
  description: string;
  modifications: TemplateModification[];
}

export interface TemplateModification {
  exerciseId: string;
  change: 'replace' | 'modify' | 'add' | 'remove';
  newExercise?: TemplateExercise;
  modifications?: Partial<TemplateExercise>;
}

// API request/response types
export interface CreateWorkoutRequest {
  name: string;
  description?: string;
  exercises: Omit<WorkoutExercise, 'id'>[];
  difficulty: FitnessLevel;
  workoutType: WorkoutType;
  isPublic?: boolean;
  tags?: string[];
}

export interface WorkoutResponse {
  success: boolean;
  workout?: Workout;
  error?: string;
}

export interface WorkoutListResponse {
  success: boolean;
  workouts: Workout[];
  total: number;
  page: number;
  limit: number;
  error?: string;
}

// Utility types
export type WorkoutStatus = 'draft' | 'active' | 'completed' | 'archived';
export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'skipped';
export type ProgressionType = 'linear' | 'double_progression' | 'wave' | 'block';
export type VolumeUnit = 'kg' | 'lbs' | 'reps' | 'time' | 'distance';
