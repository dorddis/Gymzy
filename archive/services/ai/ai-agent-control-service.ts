/**
 * AI Agent Control Service
 *
 * Comprehensive AI agent that can control the entire Gymzy app through voice or text.
 * Uses Gemini function calling to route commands to appropriate services.
 *
 * Architecture:
 * - User input (voice/text) -> AI interprets intent -> Calls appropriate function
 * - Functions map to existing services (workout, profile, settings, navigation, etc.)
 * - AI maintains conversation context and confirms destructive actions
 *
 * Features:
 * - Workout management (log, view, delete)
 * - Profile management (view, update)
 * - Settings control (preferences, privacy)
 * - Navigation (go to any page)
 * - Stats and analytics (view progress, charts)
 * - Social features (feed, follow, post)
 * - Notifications management
 */

import { GoogleGenerativeAI, Content, FunctionDeclaration, Tool } from '@google/generative-ai';
import { workoutService } from '@/services/core/workout-service';
import { UnifiedUserProfileService } from '@/services/core/unified-user-profile-service';
import {
  getUserPreferences,
  updateUserPreferences,
  getPrivacySettings,
  updatePrivacySettings,
  updateTheme,
  updateUnits
} from '@/services/data/user-settings-service';
import { getPersonalizedFeed, getFollowingFeed, getTrendingPosts } from '@/services/social/social-feed-service';
import { logger } from '@/lib/logger';
import { COMMUNICATION_STYLE_PROMPTS, COACHING_STYLE_PROMPTS } from '@/lib/ai-style-constants';

// ============================================================================
// Types
// ============================================================================

export interface AgentMessage {
  role: 'user' | 'model' | 'function';
  content: string;
  functionCall?: {
    name: string;
    args: Record<string, any>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, any>;
  };
  timestamp: Date;
}

export interface AgentResponse {
  message: string;
  functionCalls?: Array<{
    name: string;
    args: Record<string, any>;
    result?: any;
  }>;
  navigationTarget?: string; // If AI wants to navigate to a page
  success: boolean;
  error?: string;
  requiresConfirmation?: boolean; // For destructive actions
  confirmationPrompt?: string;
}

// ============================================================================
// AI Tool Definitions - Complete App Control
// ============================================================================

const agentTools: Tool = {
  functionDeclarations: [
    // ========================================
    // NAVIGATION FUNCTIONS
    // ========================================
    {
      name: 'navigateTo',
      description: 'Navigate to a different page in the app. Use when user wants to go to/open/view a specific section (e.g., "show me stats", "go to settings", "open my profile")',
      parameters: {
        type: 'OBJECT',
        properties: {
          page: {
            type: 'STRING',
            description: 'Target page to navigate to',
            enum: [
              'home',
              'chat',
              'workout',
              'log-workout',
              'stats',
              'feed',
              'profile',
              'settings',
              'notifications',
              'discover',
              'recommendations',
              'templates'
            ]
          },
          params: {
            type: 'OBJECT',
            description: 'Optional parameters (e.g., {workoutId: "123"} for log-workout)',
            properties: {}
          }
        },
        required: ['page']
      }
    } as FunctionDeclaration,

    // ========================================
    // WORKOUT FUNCTIONS
    // ========================================
    {
      name: 'viewWorkoutHistory',
      description: 'View user workout history. Use when user asks "show my workouts", "what did I do last week", "my workout history"',
      parameters: {
        type: 'OBJECT',
        properties: {
          limit: {
            type: 'NUMBER',
            description: 'Number of workouts to retrieve (default: 10)'
          },
          sortBy: {
            type: 'STRING',
            description: 'Sort order',
            enum: ['recent', 'oldest']
          }
        }
      }
    } as FunctionDeclaration,

    {
      name: 'viewWorkoutDetails',
      description: 'Get detailed information about a specific workout',
      parameters: {
        type: 'OBJECT',
        properties: {
          workoutId: {
            type: 'STRING',
            description: 'ID of the workout to view'
          }
        },
        required: ['workoutId']
      }
    } as FunctionDeclaration,

    {
      name: 'deleteWorkout',
      description: 'Delete a workout. REQUIRES USER CONFIRMATION. Use when user says "delete my last workout", "remove workout"',
      parameters: {
        type: 'OBJECT',
        properties: {
          workoutId: {
            type: 'STRING',
            description: 'ID of the workout to delete'
          }
        },
        required: ['workoutId']
      }
    } as FunctionDeclaration,

    {
      name: 'logWorkout',
      description: 'Start logging a new workout session. Use when user says "log a workout", "track my workout"',
      parameters: {
        type: 'OBJECT',
        properties: {
          workoutType: {
            type: 'STRING',
            description: 'Type of workout',
            enum: ['strength', 'cardio', 'flexibility', 'sports']
          }
        }
      }
    } as FunctionDeclaration,

    // ========================================
    // STATS & ANALYTICS FUNCTIONS
    // ========================================
    {
      name: 'viewStats',
      description: 'View workout statistics and progress. Use when user asks "show my stats", "how am I doing", "my progress"',
      parameters: {
        type: 'OBJECT',
        properties: {
          timeframe: {
            type: 'STRING',
            description: 'Time period for stats',
            enum: ['week', 'month', 'year', 'all-time']
          },
          metric: {
            type: 'STRING',
            description: 'Specific metric to view',
            enum: ['volume', 'frequency', 'strength', 'overview']
          }
        }
      }
    } as FunctionDeclaration,

    {
      name: 'getPersonalBests',
      description: 'Get user personal best records for exercises',
      parameters: {
        type: 'OBJECT',
        properties: {
          exerciseName: {
            type: 'STRING',
            description: 'Specific exercise (optional, omit for all PRs)'
          }
        }
      }
    } as FunctionDeclaration,

    // ========================================
    // PROFILE FUNCTIONS
    // ========================================
    {
      name: 'viewProfile',
      description: 'View user profile information. Use when user says "show my profile", "my info"',
      parameters: {
        type: 'OBJECT',
        properties: {
          userId: {
            type: 'STRING',
            description: 'User ID (omit for current user, provide for viewing others)'
          }
        }
      }
    } as FunctionDeclaration,

    {
      name: 'updateProfile',
      description: 'Update user profile information (name, bio, fitness goals, etc.)',
      parameters: {
        type: 'OBJECT',
        properties: {
          displayName: {
            type: 'STRING',
            description: 'Display name'
          },
          bio: {
            type: 'STRING',
            description: 'User bio'
          },
          fitnessGoals: {
            type: 'ARRAY',
            description: 'Fitness goals',
            items: { type: 'STRING' }
          }
        }
      }
    } as FunctionDeclaration,

    // ========================================
    // SETTINGS FUNCTIONS
    // ========================================
    {
      name: 'viewSettings',
      description: 'View current user settings and preferences',
      parameters: {
        type: 'OBJECT',
        properties: {
          category: {
            type: 'STRING',
            description: 'Settings category',
            enum: ['all', 'preferences', 'privacy', 'notifications']
          }
        }
      }
    } as FunctionDeclaration,

    {
      name: 'updateSettings',
      description: 'Update user settings (theme, units, notifications, privacy)',
      parameters: {
        type: 'OBJECT',
        properties: {
          theme: {
            type: 'STRING',
            description: 'App theme',
            enum: ['light', 'dark', 'system']
          },
          units: {
            type: 'STRING',
            description: 'Measurement units',
            enum: ['metric', 'imperial']
          },
          notificationsEnabled: {
            type: 'BOOLEAN',
            description: 'Enable/disable notifications'
          }
        }
      }
    } as FunctionDeclaration,

    {
      name: 'updatePrivacy',
      description: 'Update privacy settings (profile visibility, workout sharing)',
      parameters: {
        type: 'OBJECT',
        properties: {
          profileVisibility: {
            type: 'STRING',
            description: 'Who can see profile',
            enum: ['public', 'friends', 'private']
          },
          showWorkouts: {
            type: 'BOOLEAN',
            description: 'Show workouts on profile'
          }
        }
      }
    } as FunctionDeclaration,

    // ========================================
    // SOCIAL FUNCTIONS
    // ========================================
    {
      name: 'viewFeed',
      description: 'View social feed (personalized, following, or trending)',
      parameters: {
        type: 'OBJECT',
        properties: {
          feedType: {
            type: 'STRING',
            description: 'Type of feed to view',
            enum: ['personalized', 'following', 'trending']
          },
          limit: {
            type: 'NUMBER',
            description: 'Number of posts to retrieve (default: 20)'
          }
        }
      }
    } as FunctionDeclaration,

    {
      name: 'viewNotifications',
      description: 'View user notifications. Use when user says "show notifications", "any updates"',
      parameters: {
        type: 'OBJECT',
        properties: {
          unreadOnly: {
            type: 'BOOLEAN',
            description: 'Show only unread notifications'
          }
        }
      }
    } as FunctionDeclaration,

    // ========================================
    // SEARCH & DISCOVERY FUNCTIONS
    // ========================================
    {
      name: 'searchUsers',
      description: 'Search for other users by name or username',
      parameters: {
        type: 'OBJECT',
        properties: {
          query: {
            type: 'STRING',
            description: 'Search query (name or username)'
          },
          limit: {
            type: 'NUMBER',
            description: 'Number of results (default: 10)'
          }
        },
        required: ['query']
      }
    } as FunctionDeclaration,

    {
      name: 'getRecommendations',
      description: 'Get AI-powered workout or user recommendations',
      parameters: {
        type: 'OBJECT',
        properties: {
          type: {
            type: 'STRING',
            description: 'Type of recommendations',
            enum: ['workouts', 'users', 'exercises']
          }
        }
      }
    } as FunctionDeclaration
  ]
};

// ============================================================================
// Function Implementations
// ============================================================================

class AgentFunctions {
  private profileService = new UnifiedUserProfileService();

  // ========================================
  // NAVIGATION
  // ========================================
  async navigateTo(args: any): Promise<any> {
    const { page, params } = args;
    logger.info('[AI Agent] Navigation requested', { page, params });

    const pageMap: Record<string, string> = {
      'home': '/',
      'chat': '/chat',
      'workout': '/workout',
      'log-workout': params?.workoutId ? `/log-workout/${params.workoutId}` : '/log-workout/new',
      'stats': '/stats',
      'feed': '/feed',
      'profile': '/profile',
      'settings': '/settings',
      'notifications': '/notifications',
      'discover': '/discover',
      'recommendations': '/recommendations',
      'templates': '/templates'
    };

    const targetUrl = pageMap[page];
    if (!targetUrl) {
      return {
        success: false,
        error: `Unknown page: ${page}`
      };
    }

    return {
      success: true,
      navigationTarget: targetUrl,
      message: `Navigating to ${page}...`
    };
  }

  // ========================================
  // WORKOUTS
  // ========================================
  async viewWorkoutHistory(args: any, userId: string): Promise<any> {
    const { limit = 10, sortBy = 'recent' } = args;
    logger.info('[AI Agent] Fetching workout history', { userId, limit, sortBy });

    try {
      const workouts = await workoutService.getAllWorkouts(userId);
      const sorted = sortBy === 'recent'
        ? workouts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        : workouts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const limited = sorted.slice(0, limit);

      return {
        success: true,
        workouts: limited.map(w => ({
          id: w.id,
          name: w.name,
          date: w.createdAt.toISOString(),
          exerciseCount: w.exercises.length,
          duration: w.duration,
          totalVolume: workoutService.calculateTotalVolume(w)
        })),
        total: workouts.length
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to fetch workout history', { error });
      return {
        success: false,
        error: 'Failed to retrieve workout history'
      };
    }
  }

  async viewWorkoutDetails(args: any, userId: string): Promise<any> {
    const { workoutId } = args;
    logger.info('[AI Agent] Fetching workout details', { userId, workoutId });

    try {
      // Note: You may need to add a getWorkout method to workout-service
      const workouts = await workoutService.getAllWorkouts(userId);
      const workout = workouts.find(w => w.id === workoutId);

      if (!workout) {
        return {
          success: false,
          error: 'Workout not found'
        };
      }

      return {
        success: true,
        workout: {
          id: workout.id,
          name: workout.name,
          date: workout.createdAt.toISOString(),
          duration: workout.duration,
          exercises: workout.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets.length,
            totalReps: ex.sets.reduce((sum, set) => sum + (set.reps || 0), 0),
            totalWeight: ex.sets.reduce((sum, set) => sum + (set.weight || 0), 0)
          })),
          totalVolume: workoutService.calculateTotalVolume(workout),
          averageRPE: workoutService.calculateAverageRPE(workout)
        }
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to fetch workout details', { error });
      return {
        success: false,
        error: 'Failed to retrieve workout details'
      };
    }
  }

  async deleteWorkout(args: any, userId: string): Promise<any> {
    const { workoutId } = args;
    logger.info('[AI Agent] Delete workout requested', { userId, workoutId });

    // This is a destructive action - requires confirmation
    return {
      success: false,
      requiresConfirmation: true,
      confirmationPrompt: `Are you sure you want to delete this workout? This cannot be undone.`,
      pendingAction: {
        function: 'deleteWorkout',
        args: { workoutId, userId }
      }
    };
  }

  async executeDeleteWorkout(workoutId: string, userId: string): Promise<any> {
    try {
      await workoutService.deleteWorkout(workoutId, userId);
      logger.info('[AI Agent] Workout deleted', { workoutId, userId });
      return {
        success: true,
        message: 'Workout deleted successfully'
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to delete workout', { error });
      return {
        success: false,
        error: 'Failed to delete workout'
      };
    }
  }

  async logWorkout(args: any): Promise<any> {
    const { workoutType } = args;
    logger.info('[AI Agent] Starting workout logging', { workoutType });

    return {
      success: true,
      navigationTarget: '/log-workout/new',
      message: `Starting new ${workoutType || 'strength'} workout session...`
    };
  }

  // ========================================
  // STATS & ANALYTICS
  // ========================================
  async viewStats(args: any, userId: string): Promise<any> {
    const { timeframe = 'month', metric = 'overview' } = args;
    logger.info('[AI Agent] Fetching stats', { userId, timeframe, metric });

    try {
      const workouts = await workoutService.getAllWorkouts(userId);

      // Filter by timeframe
      const now = new Date();
      const filtered = workouts.filter(w => {
        const workoutDate = w.createdAt;
        switch (timeframe) {
          case 'week':
            return (now.getTime() - workoutDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          case 'month':
            return (now.getTime() - workoutDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
          case 'year':
            return (now.getTime() - workoutDate.getTime()) <= 365 * 24 * 60 * 60 * 1000;
          default:
            return true;
        }
      });

      const stats = {
        totalWorkouts: filtered.length,
        totalVolume: filtered.reduce((sum, w) => sum + workoutService.calculateTotalVolume(w), 0),
        averageRPE: filtered.length > 0
          ? filtered.reduce((sum, w) => sum + workoutService.calculateAverageRPE(w), 0) / filtered.length
          : 0,
        workoutFrequency: `${(filtered.length / (timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365)).toFixed(1)} workouts/day`
      };

      return {
        success: true,
        timeframe,
        stats,
        navigationTarget: '/stats' // Suggest navigating to stats page for visual charts
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to fetch stats', { error });
      return {
        success: false,
        error: 'Failed to retrieve statistics'
      };
    }
  }

  async getPersonalBests(args: any, userId: string): Promise<any> {
    logger.info('[AI Agent] Fetching personal bests', { userId });

    try {
      const workouts = await workoutService.getAllWorkouts(userId);
      const prMap = new Map<string, { weight: number, reps: number, date: Date }>();

      workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            if (set.weight) {
              const current = prMap.get(exercise.name);
              if (!current || set.weight > current.weight) {
                prMap.set(exercise.name, {
                  weight: set.weight,
                  reps: set.reps || 0,
                  date: workout.createdAt
                });
              }
            }
          });
        });
      });

      const personalBests = Array.from(prMap.entries()).map(([exercise, data]) => ({
        exercise,
        weight: data.weight,
        reps: data.reps,
        date: data.date.toISOString()
      }));

      return {
        success: true,
        personalBests
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to fetch personal bests', { error });
      return {
        success: false,
        error: 'Failed to retrieve personal records'
      };
    }
  }

  // ========================================
  // PROFILE
  // ========================================
  async viewProfile(args: any, userId: string): Promise<any> {
    const { userId: targetUserId } = args;
    const viewUserId = targetUserId || userId;

    logger.info('[AI Agent] Fetching profile', { userId: viewUserId });

    try {
      const profile = await this.profileService.getProfile(viewUserId);

      if (!profile) {
        return {
          success: false,
          error: 'Profile not found'
        };
      }

      return {
        success: true,
        profile: {
          displayName: profile.displayName,
          username: profile.username,
          bio: profile.bio,
          fitnessGoals: profile.fitnessGoals,
          followers: profile.followers?.length || 0,
          following: profile.following?.length || 0,
          workoutCount: profile.workoutCount || 0
        },
        navigationTarget: targetUserId ? `/profile/${targetUserId}` : '/profile'
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to fetch profile', { error });
      return {
        success: false,
        error: 'Failed to retrieve profile'
      };
    }
  }

  async updateProfile(args: any, userId: string): Promise<any> {
    logger.info('[AI Agent] Updating profile', { userId, updates: Object.keys(args) });

    try {
      await this.profileService.updateProfile(userId, args);
      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to update profile', { error });
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  }

  // ========================================
  // SETTINGS
  // ========================================
  async viewSettings(args: any, userId: string): Promise<any> {
    const { category = 'all' } = args;
    logger.info('[AI Agent] Fetching settings', { userId, category });

    try {
      const settings: any = {};

      if (category === 'all' || category === 'preferences') {
        settings.preferences = await getUserPreferences(userId);
      }

      if (category === 'all' || category === 'privacy') {
        settings.privacy = await getPrivacySettings(userId);
      }

      return {
        success: true,
        settings,
        navigationTarget: '/settings'
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to fetch settings', { error });
      return {
        success: false,
        error: 'Failed to retrieve settings'
      };
    }
  }

  async updateSettings(args: any, userId: string): Promise<any> {
    logger.info('[AI Agent] Updating settings', { userId, updates: Object.keys(args) });

    try {
      const { theme, units, notificationsEnabled, ...otherPrefs } = args;

      if (theme) {
        await updateTheme(userId, theme);
      }

      if (units) {
        await updateUnits(userId, units);
      }

      if (Object.keys(otherPrefs).length > 0) {
        await updateUserPreferences(userId, otherPrefs);
      }

      return {
        success: true,
        message: 'Settings updated successfully'
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to update settings', { error });
      return {
        success: false,
        error: 'Failed to update settings'
      };
    }
  }

  async updatePrivacy(args: any, userId: string): Promise<any> {
    logger.info('[AI Agent] Updating privacy settings', { userId, updates: Object.keys(args) });

    try {
      await updatePrivacySettings(userId, args);
      return {
        success: true,
        message: 'Privacy settings updated successfully'
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to update privacy', { error });
      return {
        success: false,
        error: 'Failed to update privacy settings'
      };
    }
  }

  // ========================================
  // SOCIAL
  // ========================================
  async viewFeed(args: any, userId: string): Promise<any> {
    const { feedType = 'personalized', limit = 20 } = args;
    logger.info('[AI Agent] Fetching feed', { userId, feedType, limit });

    try {
      let posts;

      switch (feedType) {
        case 'following':
          posts = await getFollowingFeed(userId, limit);
          break;
        case 'trending':
          posts = await getTrendingPosts(limit);
          break;
        default:
          posts = await getPersonalizedFeed(userId, limit);
      }

      return {
        success: true,
        posts: posts.slice(0, limit),
        feedType,
        navigationTarget: '/feed'
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to fetch feed', { error });
      return {
        success: false,
        error: 'Failed to retrieve feed'
      };
    }
  }

  async viewNotifications(args: any, userId: string): Promise<any> {
    const { unreadOnly = false } = args;
    logger.info('[AI Agent] Fetching notifications', { userId, unreadOnly });

    // Note: You may need to implement notification fetching in notification-service
    return {
      success: true,
      message: 'Notifications feature coming soon',
      navigationTarget: '/notifications'
    };
  }

  // ========================================
  // SEARCH & DISCOVERY
  // ========================================
  async searchUsers(args: any, userId: string): Promise<any> {
    const { query, limit = 10 } = args;
    logger.info('[AI Agent] Searching users', { userId, query, limit });

    try {
      const results = await this.profileService.searchPublicProfiles(query, limit);

      return {
        success: true,
        users: results.map(user => ({
          id: user.id,
          displayName: user.displayName,
          username: user.username,
          bio: user.bio
        })),
        query
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to search users', { error });
      return {
        success: false,
        error: 'Failed to search users'
      };
    }
  }

  async getRecommendations(args: any, userId: string): Promise<any> {
    const { type = 'workouts' } = args;
    logger.info('[AI Agent] Fetching recommendations', { userId, type });

    return {
      success: true,
      message: `Viewing ${type} recommendations`,
      navigationTarget: '/recommendations'
    };
  }
}

// ============================================================================
// Main AI Agent Service
// ============================================================================

export class AIAgentControlService {
  private genai: GoogleGenerativeAI;
  private model: any;
  private functions: AgentFunctions;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not found');
    }

    this.genai = new GoogleGenerativeAI(apiKey);
    this.model = this.genai.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      tools: [agentTools]
    });
    this.functions = new AgentFunctions();
  }

  /**
   * Process user command (voice or text) and execute appropriate action
   */
  async processCommand(
    userInput: string,
    userId: string,
    conversationHistory: AgentMessage[] = []
  ): Promise<AgentResponse> {
    try {
      logger.info('[AI Agent] Processing command', { userId, input: userInput });

      // Build conversation history for context
      const history: Content[] = conversationHistory.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add system prompt for agent behavior
      const systemPrompt = `You are Gymzy AI, a comprehensive fitness assistant that can control the entire Gymzy app.

CAPABILITIES:
- Navigate to any page (stats, settings, profile, feed, etc.)
- Manage workouts (view, log, delete)
- View statistics and progress
- Update user profile and settings
- Control privacy and preferences
- Browse social feed and notifications
- Search for users and content

BEHAVIOR:
- Be proactive: When user asks to "see stats", call viewStats AND suggest navigation
- Be conversational: Use friendly, motivating language
- Confirm destructive actions: Always ask before deleting
- Provide context: Summarize data before suggesting navigation
- Be smart about intent: "show me" = view data, "take me to" = navigate

${COMMUNICATION_STYLE_PROMPTS.encouraging}
${COACHING_STYLE_PROMPTS.supportive}`;

      // Start chat with system context
      const chat = this.model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood! I\'m ready to help you control Gymzy through voice or text. What would you like to do?' }] },
          ...history
        ]
      });

      // Send user message
      const result = await chat.sendMessage(userInput);
      const response = result.response;

      // Check for function calls
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        // Execute all function calls
        const results = [];
        let navigationTarget: string | undefined;
        let requiresConfirmation = false;
        let confirmationPrompt: string | undefined;

        for (const fc of functionCalls) {
          logger.info('[AI Agent] Executing function', { function: fc.name, args: fc.args });

          let functionResult;

          // Route to appropriate function
          switch (fc.name) {
            // Navigation
            case 'navigateTo':
              functionResult = await this.functions.navigateTo(fc.args);
              if (functionResult.navigationTarget) {
                navigationTarget = functionResult.navigationTarget;
              }
              break;

            // Workouts
            case 'viewWorkoutHistory':
              functionResult = await this.functions.viewWorkoutHistory(fc.args, userId);
              break;
            case 'viewWorkoutDetails':
              functionResult = await this.functions.viewWorkoutDetails(fc.args, userId);
              break;
            case 'deleteWorkout':
              functionResult = await this.functions.deleteWorkout(fc.args, userId);
              if (functionResult.requiresConfirmation) {
                requiresConfirmation = true;
                confirmationPrompt = functionResult.confirmationPrompt;
              }
              break;
            case 'logWorkout':
              functionResult = await this.functions.logWorkout(fc.args);
              if (functionResult.navigationTarget) {
                navigationTarget = functionResult.navigationTarget;
              }
              break;

            // Stats
            case 'viewStats':
              functionResult = await this.functions.viewStats(fc.args, userId);
              if (functionResult.navigationTarget) {
                navigationTarget = functionResult.navigationTarget;
              }
              break;
            case 'getPersonalBests':
              functionResult = await this.functions.getPersonalBests(fc.args, userId);
              break;

            // Profile
            case 'viewProfile':
              functionResult = await this.functions.viewProfile(fc.args, userId);
              if (functionResult.navigationTarget) {
                navigationTarget = functionResult.navigationTarget;
              }
              break;
            case 'updateProfile':
              functionResult = await this.functions.updateProfile(fc.args, userId);
              break;

            // Settings
            case 'viewSettings':
              functionResult = await this.functions.viewSettings(fc.args, userId);
              if (functionResult.navigationTarget) {
                navigationTarget = functionResult.navigationTarget;
              }
              break;
            case 'updateSettings':
              functionResult = await this.functions.updateSettings(fc.args, userId);
              break;
            case 'updatePrivacy':
              functionResult = await this.functions.updatePrivacy(fc.args, userId);
              break;

            // Social
            case 'viewFeed':
              functionResult = await this.functions.viewFeed(fc.args, userId);
              if (functionResult.navigationTarget) {
                navigationTarget = functionResult.navigationTarget;
              }
              break;
            case 'viewNotifications':
              functionResult = await this.functions.viewNotifications(fc.args, userId);
              if (functionResult.navigationTarget) {
                navigationTarget = functionResult.navigationTarget;
              }
              break;

            // Search & Discovery
            case 'searchUsers':
              functionResult = await this.functions.searchUsers(fc.args, userId);
              break;
            case 'getRecommendations':
              functionResult = await this.functions.getRecommendations(fc.args, userId);
              if (functionResult.navigationTarget) {
                navigationTarget = functionResult.navigationTarget;
              }
              break;

            default:
              functionResult = {
                success: false,
                error: `Unknown function: ${fc.name}`
              };
          }

          results.push({
            name: fc.name,
            args: fc.args,
            result: functionResult
          });
        }

        // Send function results back to model for natural language response
        const functionResponses = results.map(r => ({
          functionResponse: {
            name: r.name,
            response: r.result
          }
        }));

        const finalResult = await chat.sendMessage(functionResponses);
        const finalResponse = finalResult.response.text();

        return {
          message: finalResponse,
          functionCalls: results,
          navigationTarget,
          success: true,
          requiresConfirmation,
          confirmationPrompt
        };
      }

      // No function calls, just return the text response
      return {
        message: response.text(),
        success: true
      };

    } catch (error) {
      logger.error('[AI Agent] Command processing failed', { error });
      return {
        message: 'Sorry, I encountered an error processing your command. Please try again.',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute a confirmed destructive action
   */
  async executeConfirmedAction(action: any, userId: string): Promise<AgentResponse> {
    try {
      if (action.function === 'deleteWorkout') {
        const result = await this.functions.executeDeleteWorkout(action.args.workoutId, userId);
        return {
          message: result.success ? 'Workout deleted successfully' : 'Failed to delete workout',
          success: result.success,
          error: result.error
        };
      }

      return {
        message: 'Unknown action',
        success: false,
        error: 'Action not recognized'
      };
    } catch (error) {
      logger.error('[AI Agent] Failed to execute confirmed action', { error });
      return {
        message: 'Failed to execute action',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const aiAgentControlService = new AIAgentControlService();
