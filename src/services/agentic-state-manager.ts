/**
 * Production-Grade Agentic AI State Management System
 * Implements layered context management, conversation persistence, and state recovery
 */

export interface ConversationState {
  sessionId: string;
  userId: string;
  context: {
    userProfile: UserProfile;
    conversationHistory: ConversationMessage[];
    currentTask: TaskContext | null;
    workoutContext: WorkoutContext | null;
    preferences: UserPreferences;
  };
  metadata: {
    createdAt: Date;
    lastUpdated: Date;
    version: number;
    flags: string[];
  };
}

export interface TaskContext {
  taskId: string;
  type: 'workout_creation' | 'exercise_search' | 'general_chat';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  steps: TaskStep[];
  currentStep: number;
  retryCount: number;
  maxRetries: number;
  startedAt: Date;
  completedAt?: Date;
  error?: TaskError;
}

export interface TaskStep {
  stepId: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  input?: any;
  output?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
}

export interface TaskError {
  code: string;
  message: string;
  details: any;
  recoverable: boolean;
  suggestedAction: string;
  timestamp: Date;
}

// Import unified profile types
import { FitnessProfile, ProfileConverter } from '@/types/user-profile';
import { UnifiedUserProfileService } from './unified-user-profile-service';

// Use FitnessProfile for AI context (alias for backward compatibility)
export type UserProfile = FitnessProfile;

export interface WorkoutContext {
  currentWorkout?: {
    id: string;
    name: string;
    exercises: any[];
    status: 'planning' | 'active' | 'completed';
  };
  recentWorkouts: any[];
  workoutHistory: any[];
  preferences: {
    preferredExercises: string[];
    avoidedExercises: string[];
    targetMuscleGroups: string[];
  };
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata: {
    taskId?: string;
    toolCalls?: any[];
    confidence?: number;
    source: 'user_input' | 'ai_response' | 'tool_result' | 'system_message';
  };
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: {
    workoutReminders: boolean;
    progressUpdates: boolean;
    motivationalMessages: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
  };
}

export class AgenticStateManager {
  private states: Map<string, ConversationState> = new Map();
  private persistenceAdapter: StateStorageAdapter;
  private eventEmitter: EventEmitter;

  constructor(persistenceAdapter: StateStorageAdapter) {
    this.persistenceAdapter = persistenceAdapter;
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Initialize or restore conversation state
   */
  async initializeState(sessionId: string, userId: string): Promise<ConversationState> {
    try {
      // Try to restore existing state
      let state = await this.persistenceAdapter.loadState(sessionId);
      
      if (!state) {
        // Create new state
        const userProfile = await this.loadUserProfile(userId);
        state = this.createNewState(sessionId, userId, userProfile);
      }

      // Validate and migrate state if needed
      state = await this.validateAndMigrateState(state);
      
      this.states.set(sessionId, state);
      this.emitEvent('state_initialized', { sessionId, userId });
      
      return state;
    } catch (error) {
      console.error('❌ StateManager: Failed to initialize state:', error);
      throw new StateManagerError('Failed to initialize conversation state', error);
    }
  }

  /**
   * Update conversation state with new context
   */
  async updateState(sessionId: string, updates: Partial<ConversationState['context']>): Promise<void> {
    const state = this.getState(sessionId);
    if (!state) {
      throw new StateManagerError(`State not found for session: ${sessionId}`);
    }

    // Merge updates with existing context
    state.context = {
      ...state.context,
      ...updates
    };

    state.metadata.lastUpdated = new Date();
    state.metadata.version += 1;

    // Persist changes
    await this.persistenceAdapter.saveState(state);
    this.emitEvent('state_updated', { sessionId, updates });
  }

  /**
   * Add message to conversation history
   */
  async addMessage(sessionId: string, message: Omit<ConversationMessage, 'id'>): Promise<void> {
    const state = this.getState(sessionId);
    if (!state) {
      throw new StateManagerError(`State not found for session: ${sessionId}`);
    }

    const fullMessage: ConversationMessage = {
      ...message,
      id: this.generateMessageId()
    };

    state.context.conversationHistory.push(fullMessage);
    
    // Keep only last 50 messages to prevent memory bloat
    if (state.context.conversationHistory.length > 50) {
      state.context.conversationHistory = state.context.conversationHistory.slice(-50);
    }

    await this.updateState(sessionId, { conversationHistory: state.context.conversationHistory });
  }

  /**
   * Start a new task with context
   */
  async startTask(sessionId: string, taskType: TaskContext['type'], steps: Omit<TaskStep, 'stepId' | 'status' | 'retryCount'>[]): Promise<string> {
    const taskId = this.generateTaskId();
    const task: TaskContext = {
      taskId,
      type: taskType,
      status: 'pending',
      steps: steps.map((step, index) => ({
        ...step,
        stepId: `${taskId}_step_${index}`,
        status: 'pending',
        retryCount: 0
      })),
      currentStep: 0,
      retryCount: 0,
      maxRetries: 3,
      startedAt: new Date()
    };

    await this.updateState(sessionId, { currentTask: task });
    this.emitEvent('task_started', { sessionId, taskId, taskType });
    
    return taskId;
  }

  /**
   * Update task progress
   */
  async updateTaskStep(sessionId: string, stepId: string, update: Partial<TaskStep>): Promise<void> {
    const state = this.getState(sessionId);
    if (!state?.context.currentTask) {
      throw new StateManagerError(`No active task found for session: ${sessionId}`);
    }

    const step = state.context.currentTask.steps.find(s => s.stepId === stepId);
    if (!step) {
      throw new StateManagerError(`Step not found: ${stepId}`);
    }

    Object.assign(step, update);
    
    if (update.status === 'completed') {
      step.completedAt = new Date();
    }

    await this.updateState(sessionId, { currentTask: state.context.currentTask });
    this.emitEvent('task_step_updated', { sessionId, stepId, update });
  }

  /**
   * Get current conversation state
   */
  getState(sessionId: string): ConversationState | null {
    return this.states.get(sessionId) || null;
  }

  /**
   * Get conversation context for AI
   */
  getContextForAI(sessionId: string): string {
    const state = this.getState(sessionId);
    if (!state) return '';

    const { userProfile, conversationHistory, currentTask, workoutContext } = state.context;
    
    let context = `User Profile:\n`;
    context += `- Fitness Level: ${userProfile.fitnessLevel || 'beginner'}\n`;
    context += `- Goals: ${Array.isArray(userProfile.goals) ? userProfile.goals.join(', ') : 'general_fitness'}\n`;
    context += `- Equipment: ${Array.isArray(userProfile.availableEquipment) ? userProfile.availableEquipment.join(', ') : 'bodyweight'}\n`;
    context += `- Workout Frequency: ${userProfile.workoutFrequency || '2-3 times per week'}\n`;
    
    if (currentTask) {
      context += `\nCurrent Task: ${currentTask.type} (${currentTask.status})\n`;
      context += `Progress: Step ${currentTask.currentStep + 1}/${currentTask.steps.length}\n`;
    }

    if (workoutContext?.currentWorkout) {
      context += `\nCurrent Workout: ${workoutContext.currentWorkout.name} (${workoutContext.currentWorkout.status})\n`;
    }

    // Add recent conversation history
    const recentMessages = conversationHistory.slice(-5);
    if (recentMessages.length > 0) {
      context += `\nRecent Conversation:\n`;
      recentMessages.forEach(msg => {
        context += `${msg.role}: ${msg.content}\n`;
      });
    }

    return context;
  }

  private createNewState(sessionId: string, userId: string, userProfile: UserProfile): ConversationState {
    return {
      sessionId,
      userId,
      context: {
        userProfile,
        conversationHistory: [],
        currentTask: null,
        workoutContext: null,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: {
            workoutReminders: true,
            progressUpdates: true,
            motivationalMessages: true
          },
          ui: {
            theme: 'auto',
            compactMode: false
          }
        }
      },
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1,
        flags: []
      }
    };
  }

  private async loadUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Try to load from localStorage first (faster)
      const localProfile = localStorage.getItem('userProfile');
      if (localProfile) {
        const profile = JSON.parse(localProfile);
        console.log('🔍 StateManager: Loaded user profile from localStorage');
        return this.normalizeUserProfile(profile);
      }

      // Load from unified profile service
      console.log('🔍 StateManager: Loading user profile from unified service...');

      const fullProfile = await UnifiedUserProfileService.getProfile(userId);
      if (fullProfile) {
        const fitnessProfile = ProfileConverter.toFitnessProfile(fullProfile);
        console.log('✅ StateManager: Profile loaded from unified service');
        return fitnessProfile;
      }

      console.log('📭 StateManager: No profile found, using default');
      return this.getDefaultUserProfile();
    } catch (error) {
      console.error('❌ StateManager: Error loading user profile:', error);
      return this.getDefaultUserProfile();
    }
  }

  private normalizeUserProfile(profile: any): UserProfile {
    return {
      fitnessLevel: profile.fitnessLevel || 'beginner',
      goals: Array.isArray(profile.goals) ? profile.goals : ['general_fitness'],
      preferredWorkoutTypes: Array.isArray(profile.preferredWorkoutTypes) ? profile.preferredWorkoutTypes : ['bodyweight'],
      availableEquipment: Array.isArray(profile.availableEquipment) ? profile.availableEquipment : ['bodyweight'],
      workoutFrequency: profile.workoutFrequency || '2-3 times per week',
      timePerWorkout: profile.timePerWorkout || '30-45 minutes',
      injuries: Array.isArray(profile.injuries) ? profile.injuries : [],
      preferences: {
        communicationStyle: profile.preferences?.communicationStyle || 'motivational',
        detailLevel: profile.preferences?.detailLevel || 'detailed',
        workoutComplexity: profile.preferences?.workoutComplexity || 'beginner'
      }
    };
  }

  private getDefaultUserProfile(): UserProfile {
    return {
      fitnessLevel: 'beginner',
      goals: ['general_fitness'],
      preferredWorkoutTypes: ['bodyweight'],
      availableEquipment: ['bodyweight'],
      workoutFrequency: '2-3 times per week',
      timePerWorkout: '30-45 minutes',
      injuries: [],
      preferences: {
        communicationStyle: 'motivational',
        detailLevel: 'detailed',
        workoutComplexity: 'beginner'
      }
    };
  }

  private async validateAndMigrateState(state: ConversationState): Promise<ConversationState> {
    // Add validation and migration logic here
    return state;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private emitEvent(event: string, data: any): void {
    this.eventEmitter.emit(event, data);
  }
}

export interface StateStorageAdapter {
  loadState(sessionId: string): Promise<ConversationState | null>;
  saveState(state: ConversationState): Promise<void>;
  deleteState(sessionId: string): Promise<void>;
}

export class StateManagerError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'StateManagerError';
  }
}

// Event emitter for state changes
class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  emit(event: string, data: any): void {
    const handlers = this.events.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  on(event: string, handler: Function): void {
    const handlers = this.events.get(event) || [];
    handlers.push(handler);
    this.events.set(event, handlers);
  }
}
