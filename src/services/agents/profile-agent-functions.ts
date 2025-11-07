/**
 * Profile Agent Functions
 *
 * Individual callable functions for profile-related agent operations.
 * Handles user profiles, fitness goals, achievements, and user search.
 */

import { UnifiedUserProfileService } from '@/services/core/unified-user-profile-service';
import { logger } from '@/lib/logger';

export interface AgentFunctionResult {
  success: boolean;
  error?: string;
  message?: string;
  navigationTarget?: string;
  [key: string]: any;
}

export class ProfileAgentFunctions {
  /**
   * View user profile
   */
  async viewProfile(args: any, userId: string): Promise<AgentFunctionResult> {
    const { userId: targetUserId } = args;
    const viewUserId = targetUserId || userId;

    logger.info('[ProfileAgentFunctions] Fetching profile', 'profile', { userId: viewUserId });

    try {
      const profile = await UnifiedUserProfileService.getProfile(viewUserId);

      if (!profile) {
        return {
          success: false,
          error: 'Profile not found'
        };
      }

      return {
        success: true,
        profile: {
          id: profile.uid,
          displayName: profile.displayName,
          bio: profile.bio,
          fitnessGoals: profile.fitnessGoals,
          workoutCount: profile.workoutsCount || 0
        },
        navigationTarget: targetUserId ? `/profile/${targetUserId}` : '/profile'
      };
    } catch (error) {
      logger.error('[ProfileAgentFunctions] Failed to fetch profile', 'profile', error instanceof Error ? error : undefined, {
        userId: viewUserId,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        error: 'Failed to retrieve profile'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(args: any, userId: string): Promise<AgentFunctionResult> {
    logger.info('[ProfileAgentFunctions] Updating profile', 'profile', { userId, updates: Object.keys(args) });

    try {
      await UnifiedUserProfileService.updateProfile(userId, args);

      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      logger.error('[ProfileAgentFunctions] Failed to update profile', 'profile', error instanceof Error ? error : undefined, {
        userId,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  }

  /**
   * Update fitness goals specifically
   */
  async updateFitnessGoals(args: any, userId: string): Promise<AgentFunctionResult> {
    const { goals } = args;

    logger.info('[ProfileAgentFunctions] Updating fitness goals', 'profile', { userId, goals });

    // Validate goals
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return {
        success: false,
        error: 'Please provide at least one goal'
      };
    }

    try {
      await UnifiedUserProfileService.updateProfile(userId, {
        fitnessGoals: goals
      });

      return {
        success: true,
        message: 'Fitness goals updated successfully'
      };
    } catch (error) {
      logger.error('[ProfileAgentFunctions] Failed to update fitness goals', 'profile', error instanceof Error ? error : undefined, {
        userId,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        error: 'Failed to update fitness goals'
      };
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(args: any, userId: string): Promise<AgentFunctionResult> {
    logger.info('[ProfileAgentFunctions] Fetching profile stats', 'profile', { userId });

    try {
      const stats = await UnifiedUserProfileService.getProfileStats();

      if (!stats) {
        return {
          success: false,
          error: 'Failed to retrieve statistics'
        };
      }

      return {
        success: true,
        stats
      };
    } catch (error) {
      logger.error('[ProfileAgentFunctions] Failed to fetch stats', 'profile', error instanceof Error ? error : undefined, {
        userId,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        error: 'Failed to retrieve statistics'
      };
    }
  }

  /**
   * Search for users
   */
  async searchUsers(args: any, userId: string): Promise<AgentFunctionResult> {
    const { query, limit = 10 } = args;

    logger.info('[ProfileAgentFunctions] Searching users', 'profile', { userId, query, limit });

    try {
      const results = await UnifiedUserProfileService.searchPublicProfiles(query, limit);

      return {
        success: true,
        users: results.map((user: any) => ({
          id: user.id,
          displayName: user.displayName,
          username: user.username,
          bio: user.bio
        })),
        query
      };
    } catch (error) {
      logger.error('[ProfileAgentFunctions] Failed to search users', 'profile', error instanceof Error ? error : undefined, {
        userId,
        query,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        error: 'Failed to search users'
      };
    }
  }

  /**
   * View user achievements
   */
  async viewAchievements(args: any, userId: string): Promise<AgentFunctionResult> {
    const { category } = args;

    logger.info('[ProfileAgentFunctions] Fetching achievements', 'profile', { userId, category });

    try {
      const profile = await UnifiedUserProfileService.getProfile(userId);

      if (!profile) {
        return {
          success: false,
          error: 'Profile not found'
        };
      }

      // Get achievements (may be undefined on profile)
      let achievements = (profile as any).achievements || [];

      // Filter by category if provided
      if (category) {
        achievements = achievements.filter((ach: any) => ach.category === category);
      }

      return {
        success: true,
        achievements
      };
    } catch (error) {
      logger.error('[ProfileAgentFunctions] Failed to fetch achievements', 'profile', error instanceof Error ? error : undefined, {
        userId,
        category,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        error: 'Failed to retrieve achievements'
      };
    }
  }
}
