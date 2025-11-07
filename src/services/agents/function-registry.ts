/**
 * Function Registry
 *
 * Central registry for all agent functions.
 * Maps function names to implementations and provides tool definitions for AI.
 *
 * Architecture:
 * - Functions organized by domain (workout, profile, system, social)
 * - Each domain has its own function class
 * - Registry provides unified interface for agent orchestrator
 * - Tool definitions follow Vercel AI SDK format
 */

import { WorkoutAgentFunctions } from './workout-agent-functions';
import { ProfileAgentFunctions } from './profile-agent-functions';
import { SystemAgentFunctions } from './system-agent-functions';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export interface AgentFunctionResult {
  success: boolean;
  error?: string;
  message?: string;
  navigationTarget?: string;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  pendingAction?: {
    function: string;
    args: any;
  };
  [key: string]: any;
}

type AgentFunction = (args: any, userId: string) => Promise<AgentFunctionResult>;

/**
 * Function Registry
 * Provides centralized access to all agent functions
 */
export class FunctionRegistry {
  private workoutFunctions: WorkoutAgentFunctions;
  private profileFunctions: ProfileAgentFunctions;
  private systemFunctions: SystemAgentFunctions;

  // Function map for dynamic execution
  private functionMap: Map<string, AgentFunction>;

  constructor() {
    this.workoutFunctions = new WorkoutAgentFunctions();
    this.profileFunctions = new ProfileAgentFunctions();
    this.systemFunctions = new SystemAgentFunctions();

    // Build function map
    this.functionMap = new Map();
    this.registerFunctions();
  }

  /**
   * Register all available functions
   */
  private registerFunctions() {
    // Workout functions
    this.register('viewWorkoutHistory', this.workoutFunctions.viewWorkoutHistory.bind(this.workoutFunctions));
    this.register('viewWorkoutDetails', this.workoutFunctions.viewWorkoutDetails.bind(this.workoutFunctions));
    this.register('deleteWorkout', this.workoutFunctions.deleteWorkout.bind(this.workoutFunctions));
    this.register('logWorkout', this.workoutFunctions.logWorkout.bind(this.workoutFunctions));
    this.register('viewStats', this.workoutFunctions.viewStats.bind(this.workoutFunctions));
    this.register('getPersonalBests', this.workoutFunctions.getPersonalBests.bind(this.workoutFunctions));

    // Profile functions
    this.register('viewProfile', this.profileFunctions.viewProfile.bind(this.profileFunctions));
    this.register('updateProfile', this.profileFunctions.updateProfile.bind(this.profileFunctions));
    this.register('updateFitnessGoals', this.profileFunctions.updateFitnessGoals.bind(this.profileFunctions));
    this.register('getProfileStats', this.profileFunctions.getProfileStats.bind(this.profileFunctions));
    this.register('searchUsers', this.profileFunctions.searchUsers.bind(this.profileFunctions));
    this.register('viewAchievements', this.profileFunctions.viewAchievements.bind(this.profileFunctions));

    // System functions
    this.register('navigateTo', this.systemFunctions.navigateTo.bind(this.systemFunctions));
    this.register('viewSettings', this.systemFunctions.viewSettings.bind(this.systemFunctions));
    this.register('updateSettings', this.systemFunctions.updateSettings.bind(this.systemFunctions));
    this.register('updatePrivacy', this.systemFunctions.updatePrivacy.bind(this.systemFunctions));
    this.register('getHelp', this.systemFunctions.getHelp.bind(this.systemFunctions));

    logger.info('[FunctionRegistry] Registered functions', 'registry', {
      count: this.functionMap.size,
      functions: Array.from(this.functionMap.keys())
    });
  }

  /**
   * Register a function
   */
  private register(name: string, fn: AgentFunction) {
    this.functionMap.set(name, fn);
  }

  /**
   * Execute a function by name
   */
  async execute(functionName: string, args: any, userId: string): Promise<AgentFunctionResult> {
    const fn = this.functionMap.get(functionName);

    if (!fn) {
      logger.error('[FunctionRegistry] Function not found', 'execute', undefined, {
        functionName
      });
      return {
        success: false,
        error: `Unknown function: ${functionName}`
      };
    }

    try {
      logger.info('[FunctionRegistry] Executing function', 'execute', { functionName, userId });
      return await fn(args, userId);
    } catch (error) {
      logger.error('[FunctionRegistry] Function execution failed', 'execute', error instanceof Error ? error : undefined, {
        functionName,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        error: `Failed to execute ${functionName}`
      };
    }
  }

  /**
   * Get available functions for a specific domain
   */
  getFunctionsForDomain(domain: 'workout' | 'profile' | 'system' | 'all'): string[] {
    const allFunctions = Array.from(this.functionMap.keys());

    if (domain === 'all') {
      return allFunctions;
    }

    // Filter by domain prefix or known function names
    const domainPrefixes: Record<string, string[]> = {
      workout: ['viewWorkoutHistory', 'viewWorkoutDetails', 'deleteWorkout', 'logWorkout', 'viewStats', 'getPersonalBests'],
      profile: ['viewProfile', 'updateProfile', 'updateFitnessGoals', 'getProfileStats', 'searchUsers', 'viewAchievements'],
      system: ['navigateTo', 'viewSettings', 'updateSettings', 'updatePrivacy', 'getHelp']
    };

    return domainPrefixes[domain] || [];
  }

  /**
   * Get tool definitions for Vercel AI SDK
   * Returns tools in the format expected by Vercel AI SDK
   */
  getToolDefinitions(domain?: 'workout' | 'profile' | 'system' | 'all'): Record<string, any> {
    const tools: Record<string, any> = {};
    const functions = domain ? this.getFunctionsForDomain(domain) : this.getFunctionsForDomain('all');

    // Define tools based on available functions
    functions.forEach(functionName => {
      const toolDef = this.getToolDefinition(functionName);
      if (toolDef) {
        tools[functionName] = toolDef;
      }
    });

    return tools;
  }

  /**
   * Get individual tool definition
   */
  private getToolDefinition(functionName: string): any | null {
    // Tool definitions as plain schema objects (actual execution handled by registry)
    const toolDefinitions: Record<string, any> = {
      // ========================================
      // WORKOUT TOOLS
      // ========================================
      viewWorkoutHistory: {
        description: 'View workout history. Use when user asks "show my workouts", "what did I do last week"',
        parameters: z.object({
          limit: z.number().optional().describe('Number of workouts to retrieve (default: 10)'),
          sortBy: z.enum(['recent', 'oldest']).optional().describe('Sort order (default: recent)')
        })
      },

      viewWorkoutDetails: {
        description: 'Get detailed information about a specific workout',
        parameters: z.object({
          workoutId: z.string().describe('ID of the workout to view')
        })
      },

      deleteWorkout: {
        description: 'Delete a workout (requires confirmation). Use when user says "delete my last workout"',
        parameters: z.object({
          workoutId: z.string().describe('ID of the workout to delete')
        })
      },

      logWorkout: {
        description: 'Start logging a new workout session',
        parameters: z.object({
          workoutType: z.enum(['strength', 'cardio', 'flexibility', 'sports']).optional()
        })
      },

      viewStats: {
        description: 'View workout statistics and progress',
        parameters: z.object({
          timeframe: z.enum(['week', 'month', 'year', 'all-time']).optional(),
          metric: z.enum(['volume', 'frequency', 'strength', 'overview']).optional()
        })
      },

      getPersonalBests: {
        description: 'Get personal best records for exercises',
        parameters: z.object({
          exerciseName: z.string().optional().describe('Specific exercise (omit for all PRs)')
        })
      },

      // ========================================
      // PROFILE TOOLS
      // ========================================
      viewProfile: {
        description: 'View user profile. Use when user says "show my profile"',
        parameters: z.object({
          userId: z.string().optional().describe('User ID (omit for current user)')
        })
      },

      updateProfile: {
        description: 'Update user profile information',
        parameters: z.object({
          displayName: z.string().optional(),
          bio: z.string().optional(),
          fitnessGoals: z.array(z.string()).optional()
        })
      },

      updateFitnessGoals: {
        description: 'Update fitness goals specifically',
        parameters: z.object({
          goals: z.array(z.string()).describe('Array of fitness goals')
        })
      },

      getProfileStats: {
        description: 'Get comprehensive profile statistics',
        parameters: z.object({})
      },

      searchUsers: {
        description: 'Search for other users by name or username',
        parameters: z.object({
          query: z.string().describe('Search query'),
          limit: z.number().optional().describe('Number of results (default: 10)')
        })
      },

      viewAchievements: {
        description: 'View user achievements and badges',
        parameters: z.object({
          category: z.string().optional().describe('Filter by category (workouts, social, etc)')
        })
      },

      // ========================================
      // SYSTEM TOOLS
      // ========================================
      navigateTo: {
        description: 'Navigate to a different page. Use when user says "go to stats", "show me settings"',
        parameters: z.object({
          page: z.enum([
            'home', 'chat', 'workout', 'log-workout', 'stats', 'feed',
            'profile', 'settings', 'notifications', 'discover', 'recommendations', 'templates'
          ]).describe('Target page'),
          params: z.object({
            workoutId: z.string().optional(),
            userId: z.string().optional()
          }).optional()
        })
      },

      viewSettings: {
        description: 'View current user settings',
        parameters: z.object({
          category: z.enum(['all', 'preferences', 'privacy', 'notifications']).optional()
        })
      },

      updateSettings: {
        description: 'Update user settings',
        parameters: z.object({
          theme: z.enum(['light', 'dark', 'system']).optional(),
          units: z.enum(['metric', 'imperial']).optional(),
          notificationsEnabled: z.boolean().optional()
        })
      },

      updatePrivacy: {
        description: 'Update privacy settings',
        parameters: z.object({
          profileVisibility: z.enum(['public', 'friends', 'private']).optional(),
          showWorkouts: z.boolean().optional()
        })
      },

      getHelp: {
        description: 'Get help information about app features',
        parameters: z.object({
          topic: z.enum(['workouts', 'profile', 'settings', 'navigation', 'social']).optional()
        })
      }
    };

    return toolDefinitions[functionName] || null;
  }
}

// Export singleton instance
export const functionRegistry = new FunctionRegistry();
