/**
 * Comprehensive Fixes Service
 * Addresses all identified issues and implements improvements
 */

import { UnifiedUserProfileService } from './unified-user-profile-service';
import { AgenticStateManager } from './agentic-state-manager';

export class ComprehensiveFixesService {
  
  /**
   * Fix 1: Null Safety for User Profile Data
   */
  static ensureUserProfileSafety(userProfile: any): any {
    if (!userProfile) {
      console.warn('⚠️ ComprehensiveFixes: User profile is null, using defaults');
      return this.getDefaultUserProfile();
    }

    return {
      fitnessLevel: userProfile.fitnessLevel || 'beginner',
      goals: Array.isArray(userProfile.goals) ? userProfile.goals : ['general_fitness'],
      preferredWorkoutTypes: Array.isArray(userProfile.preferredWorkoutTypes) 
        ? userProfile.preferredWorkoutTypes 
        : ['bodyweight'],
      availableEquipment: Array.isArray(userProfile.availableEquipment) 
        ? userProfile.availableEquipment 
        : ['bodyweight'],
      workoutFrequency: userProfile.workoutFrequency || '2-3 times per week',
      timePerWorkout: userProfile.timePerWorkout || '30-45 minutes',
      injuries: Array.isArray(userProfile.injuries) ? userProfile.injuries : [],
      preferences: {
        communicationStyle: userProfile.preferences?.communicationStyle || 'motivational',
        detailLevel: userProfile.preferences?.detailLevel || 'detailed',
        workoutComplexity: userProfile.preferences?.workoutComplexity || 'beginner'
      }
    };
  }

  /**
   * Fix 2: Enhanced Session Management
   */
  static getOrCreateSessionId(): string {
    if (typeof window === 'undefined') {
      return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    const STORAGE_KEY = 'gymzy_chat_session_id';
    const EXPIRY_KEY = 'gymzy_chat_session_expiry';
    const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    try {
      const existingSessionId = localStorage.getItem(STORAGE_KEY);
      const expiryTime = localStorage.getItem(EXPIRY_KEY);

      if (existingSessionId && expiryTime) {
        const expiry = parseInt(expiryTime, 10);
        if (Date.now() < expiry) {
          console.log('🔄 ComprehensiveFixes: Using existing session:', existingSessionId);
          return existingSessionId;
        }
      }

      // Create new session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const newExpiry = Date.now() + SESSION_DURATION;

      localStorage.setItem(STORAGE_KEY, newSessionId);
      localStorage.setItem(EXPIRY_KEY, newExpiry.toString());

      console.log('✨ ComprehensiveFixes: Created new session:', newSessionId);
      return newSessionId;

    } catch (error) {
      console.error('❌ ComprehensiveFixes: Error managing session:', error);
      return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
  }

  /**
   * Fix 3: Robust User ID Extraction
   */
  static async getUserId(): Promise<string> {
    // Try Firebase Auth first
    if (typeof window !== 'undefined') {
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        if (auth.currentUser) {
          console.log('✅ ComprehensiveFixes: Got user ID from Firebase Auth:', auth.currentUser.uid);
          return auth.currentUser.uid;
        }
      } catch (error) {
        console.warn('⚠️ ComprehensiveFixes: Could not get user from Firebase Auth:', error);
      }

      // Try localStorage fallback
      try {
        const storedUserId = localStorage.getItem('gymzy_user_id');
        if (storedUserId) {
          console.log('🔄 ComprehensiveFixes: Got user ID from localStorage:', storedUserId);
          return storedUserId;
        }
      } catch (error) {
        console.warn('⚠️ ComprehensiveFixes: Could not get user from localStorage:', error);
      }
    }

    console.warn('⚠️ ComprehensiveFixes: Using anonymous user ID');
    return 'anonymous';
  }

  /**
   * Fix 4: Enhanced Error Handling for AI Responses
   */
  static handleAIResponseError(error: any, context: string): any {
    console.error(`❌ ComprehensiveFixes: AI Response Error in ${context}:`, error);

    const errorResponse = {
      content: "I apologize, but I'm experiencing some technical difficulties right now. Let me try to help you with a basic response.",
      toolCalls: [],
      workoutData: null,
      isStreaming: false,
      confidence: 0.3,
      reasoning: 'Fallback response due to technical error',
      metadata: {
        error: true,
        errorType: error?.name || 'Unknown',
        errorMessage: error?.message || 'Unknown error',
        context,
        timestamp: new Date().toISOString()
      }
    };

    // Provide specific fallback based on context
    if (context.includes('workout')) {
      errorResponse.content = "I'm having trouble creating a workout right now. Would you like me to suggest a simple bodyweight routine instead?";
    } else if (context.includes('search')) {
      errorResponse.content = "I'm having trouble searching exercises right now. Could you try describing what type of workout you're looking for?";
    }

    return errorResponse;
  }

  /**
   * Fix 5: Conversation History Validation
   */
  static validateAndCleanChatHistory(chatHistory: any[]): any[] {
    if (!Array.isArray(chatHistory)) {
      console.warn('⚠️ ComprehensiveFixes: Chat history is not an array, using empty array');
      return [];
    }

    return chatHistory.map((msg, index) => ({
      id: msg.id || `msg_${index}_${Date.now()}`,
      role: (msg.role === 'user' || msg.role === 'assistant') ? msg.role : 'user',
      content: typeof msg.content === 'string' ? msg.content : '',
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(),
      userId: msg.userId || 'unknown'
    })).filter(msg => msg.content.trim().length > 0); // Remove empty messages
  }

  /**
   * Fix 6: Enhanced State Initialization
   */
  static async initializeAgenticState(userId: string, sessionId: string): Promise<any> {
    try {
      console.log('🔧 ComprehensiveFixes: Initializing agentic state...');

      // Ensure user profile exists and is valid
      let userProfile = await UnifiedUserProfileService.getProfile(userId);
      
      if (!userProfile) {
        console.log('📝 ComprehensiveFixes: Creating default profile for user');
        userProfile = await UnifiedUserProfileService.createProfile(
          userId,
          'user@example.com',
          'User',
          { hasCompletedOnboarding: false }
        );
      }

      // Convert to fitness profile for AI context
      const safeProfile = this.ensureUserProfileSafety(userProfile);

      console.log('✅ ComprehensiveFixes: Agentic state initialized successfully');
      return {
        sessionId,
        userId,
        userProfile: safeProfile,
        initialized: true
      };

    } catch (error) {
      console.error('❌ ComprehensiveFixes: Error initializing agentic state:', error);
      
      // Return minimal safe state
      return {
        sessionId,
        userId,
        userProfile: this.getDefaultUserProfile(),
        initialized: false,
        error: error.message
      };
    }
  }

  /**
   * Fix 7: Workout Data Validation
   */
  static validateWorkoutData(workoutData: any): any {
    if (!workoutData) {
      return null;
    }

    return {
      id: workoutData.id || `workout_${Date.now()}`,
      name: workoutData.name || workoutData.title || 'Untitled Workout',
      exercises: Array.isArray(workoutData.exercises) ? workoutData.exercises : [],
      type: workoutData.type || 'custom',
      duration: workoutData.duration || 'Unknown',
      difficulty: workoutData.difficulty || 'beginner',
      notes: workoutData.notes || '',
      createdAt: workoutData.createdAt || new Date(),
      userId: workoutData.userId || 'unknown'
    };
  }

  /**
   * Fix 8: Performance Monitoring
   */
  static monitorPerformance(operation: string, startTime: number): void {
    const duration = Date.now() - startTime;
    
    if (duration > 5000) {
      console.warn(`⚠️ ComprehensiveFixes: Slow operation detected - ${operation}: ${duration}ms`);
    } else if (duration > 2000) {
      console.log(`🐌 ComprehensiveFixes: Operation took longer than expected - ${operation}: ${duration}ms`);
    } else {
      console.log(`⚡ ComprehensiveFixes: Operation completed - ${operation}: ${duration}ms`);
    }
  }

  /**
   * Fix 9: Memory Management
   */
  static cleanupMemory(): void {
    if (typeof window !== 'undefined') {
      try {
        // Clean up old session data
        const keys = Object.keys(localStorage);
        const now = Date.now();
        
        keys.forEach(key => {
          if (key.startsWith('gymzy_') && key.includes('_expiry')) {
            const expiry = parseInt(localStorage.getItem(key) || '0', 10);
            if (expiry < now) {
              const dataKey = key.replace('_expiry', '');
              localStorage.removeItem(key);
              localStorage.removeItem(dataKey);
              console.log(`🧹 ComprehensiveFixes: Cleaned up expired data: ${dataKey}`);
            }
          }
        });
      } catch (error) {
        console.error('❌ ComprehensiveFixes: Error cleaning up memory:', error);
      }
    }
  }

  /**
   * Helper: Get default user profile
   */
  private static getDefaultUserProfile(): any {
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

  /**
   * Run all fixes and improvements
   */
  static async runComprehensiveFixes(): Promise<void> {
    console.log('🚀 ComprehensiveFixes: Running comprehensive fixes...');

    try {
      // Clean up memory
      this.cleanupMemory();

      // Initialize session
      const sessionId = this.getOrCreateSessionId();
      const userId = await this.getUserId();

      // Initialize state
      await this.initializeAgenticState(userId, sessionId);

      console.log('✅ ComprehensiveFixes: All fixes applied successfully');

    } catch (error) {
      console.error('❌ ComprehensiveFixes: Error running comprehensive fixes:', error);
    }
  }
}

// Auto-run fixes on import in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ComprehensiveFixesService.runComprehensiveFixes();
}

export default ComprehensiveFixesService;
