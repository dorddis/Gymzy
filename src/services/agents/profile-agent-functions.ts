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
  private profileService: UnifiedUserProfileService;

  constructor() {
    this.profileService = new UnifiedUserProfileService();
  }

  /**
   * View user profile
   */
  async viewProfile(args: any, userId: string): Promise<AgentFunctionResult> {
    const { userId: targetUserId } = args;
    const viewUserId = targetUserId || userId;

    logger.info('[ProfileAgentFunctions] Fetching profile', { userId: viewUserId });

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
          id: profile.id,
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
      logger.error('[ProfileAgentFunctions] Failed to fetch profile', { error });
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
    logger.info('[ProfileAgentFunctions] Updating profile', { userId, updates: Object.keys(args) });

    try {
      await this.profileService.updateProfile(userId, args);

      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      logger.error('[ProfileAgentFunctions] Failed to update profile', { error });
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

    logger.info('[ProfileAgentFunctions] Updating fitness goals', { userId, goals });

    // Validate goals
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return {
        success: false,
        error: 'Please provide at least one goal'
      };
    }

    try {
      await this.profileService.updateProfile(userId, {
        fitnessGoals: goals
      });

      return {
        success: true,
        message: 'Fitness goals updated successfully'
      };
    } catch (error) {
      logger.error('[ProfileAgentFunctions] Failed to update fitness goals', { error });
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
    logger.info('[ProfileAgentFunctions] Fetching profile stats', { userId });

    try {
      const stats = await this.profileService.getProfileStats(userId);

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
      logger.error('[ProfileAgentFunctions] Failed to fetch stats', { error });
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

    logger.info('[ProfileAgentFunctions] Searching users', { userId, query, limit });

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
      logger.error('[ProfileAgentFunctions] Failed to search users', { error });
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

    logger.info('[ProfileAgentFunctions] Fetching achievements', { userId, category });

    try {
      const profile = await this.profileService.getProfile(userId);

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
      logger.error('[ProfileAgentFunctions] Failed to fetch achievements', { error });
      return {
        success: false,
        error: 'Failed to retrieve achievements'
      };
    }
  }
}
