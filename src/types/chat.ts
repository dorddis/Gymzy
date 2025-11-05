/**
 * Chat-related Type Definitions
 * Consolidated from multiple files to ensure consistency
 */

// Base chat message interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  
  // Optional metadata
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
    confidence?: number;
  };
  
  // Tool calls and responses
  toolCalls?: ToolCall[];
  toolResponses?: ToolResponse[];
  
  // Workout-specific data
  workoutData?: WorkoutGenerationData;
  
  // Error information
  error?: {
    message: string;
    code?: string;
    retryable?: boolean;
  };
  
  // UI state
  isStreaming?: boolean;
  isComplete?: boolean;
  isTyping?: boolean;
}

// Tool call interface for AI function calls
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  timestamp: Date;
}

// Tool response interface
export interface ToolResponse {
  toolCallId: string;
  result: any;
  success: boolean;
  error?: string;
  timestamp: Date;
}

// Workout generation data embedded in chat messages
export interface WorkoutGenerationData {
  exercises: Exercise[];
  duration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  targetMuscles?: string[];
  equipment?: string[];
  workoutType?: string;
  instructions?: string;
}

// Exercise interface for workout data
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | string; // Can be "10-12" or number
  weight?: number;
  duration?: number; // For time-based exercises
  restTime?: number;
  instructions?: string;
  muscleGroups: string[];
  equipment?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

// Chat session interface
export interface ChatSession {
  id: string;
  userId: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  
  // Session metadata
  metadata?: {
    totalMessages: number;
    totalTokens: number;
    averageResponseTime: number;
    lastActivity: Date;
  };
  
  // Context preservation
  context?: {
    userPreferences?: UserPreferences;
    workoutHistory?: WorkoutSummary[];
    currentGoals?: string[];
  };
}

// User preferences for chat personalization
export interface UserPreferences {
  preferredModel?: 'gemini';
  responseLength?: 'short' | 'medium' | 'long';
  includeExplanations?: boolean;
  workoutStyle?: string[];
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  availableEquipment?: string[];
  timeConstraints?: number; // minutes
}

// Workout summary for context
export interface WorkoutSummary {
  id: string;
  name: string;
  date: Date;
  duration: number;
  exercises: string[]; // Exercise names
  muscleGroups: string[];
  difficulty: string;
  rating?: number; // 1-5 stars
}

// Chat API request/response types
export interface ChatRequest {
  message: string;
  sessionId?: string;
  userId: string;
  context?: {
    previousMessages?: ChatMessage[];
    userPreferences?: UserPreferences;
    workoutHistory?: WorkoutSummary[];
  };
  options?: {
    model?: 'gemini';
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
  };
}

export interface ChatResponse {
  success: boolean;
  message?: ChatMessage;
  sessionId: string;
  error?: {
    message: string;
    code: string;
    retryable: boolean;
  };
  metadata?: {
    model: string;
    tokens: number;
    processingTime: number;
  };
}

// Streaming chat response
export interface StreamingChatResponse {
  type: 'start' | 'chunk' | 'tool_call' | 'tool_response' | 'complete' | 'error';
  content?: string;
  messageId?: string;
  toolCall?: ToolCall;
  toolResponse?: ToolResponse;
  error?: string;
  metadata?: {
    tokens?: number;
    model?: string;
  };
}

// Chat context for maintaining conversation state
export interface ChatContext {
  currentSession: ChatSession | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  
  // Actions
  sendMessage: (message: string, options?: Partial<ChatRequest['options']>) => Promise<void>;
  startNewSession: () => void;
  loadSession: (sessionId: string) => Promise<void>;
  clearError: () => void;
  
  // Streaming actions
  startStreaming: () => void;
  stopStreaming: () => void;
  
  // Session management
  getSessions: () => Promise<ChatSession[]>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
}

// Chat UI component props
export interface ChatInterfaceProps {
  sessionId?: string;
  initialMessages?: ChatMessage[];
  onMessageSent?: (message: ChatMessage) => void;
  onSessionCreated?: (session: ChatSession) => void;
  onError?: (error: string) => void;
  className?: string;
  
  // Customization options
  showSessionHistory?: boolean;
  showWorkoutActions?: boolean;
  enableVoiceInput?: boolean;
  maxMessages?: number;
  
  // Styling options
  theme?: 'light' | 'dark' | 'auto';
  compact?: boolean;
}

// Chat message component props
export interface ChatMessageProps {
  message: ChatMessage;
  isOwn: boolean;
  showTimestamp?: boolean;
  showAvatar?: boolean;
  onRetry?: () => void;
  onCopy?: () => void;
  onStartWorkout?: (workoutData: WorkoutGenerationData) => void;
  className?: string;
}

// Export utility types
export type ChatRole = ChatMessage['role'];
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'error';
export type ChatTheme = 'light' | 'dark' | 'auto';
export type ResponseLength = 'short' | 'medium' | 'long';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type AIModel = 'gemini';
