/**
 * System Agent Functions
 *
 * Functions for system-level operations: navigation, settings, privacy, preferences.
 * These functions control app behavior and configuration.
 */

import {
  getUserPreferences,
  updateUserPreferences,
  getPrivacySettings,
  updatePrivacySettings,
  updateTheme,
  updateUnits,
  updateNotificationPreferences
} from '@/services/data/user-settings-service';
import { logger } from '@/lib/logger';

export interface AgentFunctionResult {
  success: boolean;
  error?: string;
  message?: string;
  navigationTarget?: string;
  [key: string]: any;
}

export class SystemAgentFunctions {
  /**
   * Navigate to a page in the app
   */
  async navigateTo(args: any, userId: string): Promise<AgentFunctionResult> {
    const { page, params } = args;
    logger.info('[SystemAgentFunctions] Navigation requested', { page, params, userId });

    const pageMap: Record<string, string> = {
      'home': '/',
      'chat': '/chat',
      'workout': '/workout',
      'log-workout': params?.workoutId ? `/log-workout/${params.workoutId}` : '/log-workout/new',
      'stats': '/stats',
      'feed': '/feed',
      // For profile: use provided userId, or default to current user's ID
      'profile': params?.userId ? `/profile/${params.userId}` : `/profile/${userId}`,
      'settings': '/settings',
      'notifications': '/notifications',
      'discover': '/discover',
      'recommendations': '/recommendations',
      'templates': '/templates',
      'onboarding': '/onboarding',
      'auth': '/auth'
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

  /**
   * View user settings
   */
  async viewSettings(args: any, userId: string): Promise<AgentFunctionResult> {
    const { category = 'all' } = args;
    logger.info('[SystemAgentFunctions] Fetching settings', { userId, category });

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
      logger.error('[SystemAgentFunctions] Failed to fetch settings', { error });
      return {
        success: false,
        error: 'Failed to retrieve settings'
      };
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(args: any, userId: string): Promise<AgentFunctionResult> {
    logger.info('[SystemAgentFunctions] Updating settings', { userId, updates: Object.keys(args) });

    try {
      const { theme, units, notificationsEnabled, ...otherPrefs } = args;

      // Update theme if provided
      if (theme) {
        await updateTheme(userId, theme);
      }

      // Update units if provided
      if (units) {
        await updateUnits(userId, units);
      }

      // Update notification preferences if provided
      if (notificationsEnabled !== undefined) {
        await updateNotificationPreferences(userId, { notificationsEnabled });
      }

      // Update other preferences if any
      if (Object.keys(otherPrefs).length > 0) {
        await updateUserPreferences(userId, otherPrefs);
      }

      return {
        success: true,
        message: 'Settings updated successfully'
      };
    } catch (error) {
      logger.error('[SystemAgentFunctions] Failed to update settings', { error });
      return {
        success: false,
        error: 'Failed to update settings'
      };
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacy(args: any, userId: string): Promise<AgentFunctionResult> {
    logger.info('[SystemAgentFunctions] Updating privacy settings', { userId, updates: Object.keys(args) });

    try {
      await updatePrivacySettings(userId, args);

      return {
        success: true,
        message: 'Privacy settings updated successfully'
      };
    } catch (error) {
      logger.error('[SystemAgentFunctions] Failed to update privacy', { error });
      return {
        success: false,
        error: 'Failed to update privacy settings'
      };
    }
  }

  /**
   * Get help information
   */
  async getHelp(args: any): Promise<AgentFunctionResult> {
    const { topic } = args;
    logger.info('[SystemAgentFunctions] Help requested', { topic });

    const helpMessages: Record<string, string> = {
      'workouts': 'I can help you generate personalized workouts, log your exercises, view your workout history, and track your progress. Just tell me what you want to do!',
      'profile': 'I can help you view and update your profile, set fitness goals, and see your achievements. What would you like to do with your profile?',
      'settings': 'I can help you change your theme, units of measurement, notification preferences, and privacy settings. What would you like to adjust?',
      'navigation': 'I can take you to any page in the app. Just say things like "go to stats" or "show me the feed".',
      'social': 'I can help you view your feed, search for users, and manage your followers. What social feature would you like to use?'
    };

    const message = topic && helpMessages[topic]
      ? helpMessages[topic]
      : 'I\'m your AI fitness assistant! I can help you with workouts, profile management, navigation, settings, and more. What would you like to do?';

    return {
      success: true,
      message,
      topic
    };
  }
}
