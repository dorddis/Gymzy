import { OnboardingContextService } from './onboarding-context-service';
import { getUserPreferences, updateUserPreferences } from './user-settings-service';
import { UserPreferences } from '@/types/user';

/**
 * Settings Sync Service
 * Syncs user preferences between user_settings and onboarding_contexts
 * Ensures AI has access to latest user preferences
 */

/**
 * Sync preferences to onboarding context
 * This ensures AI can access user preferences for personalization
 */
export const syncPreferencesToOnboarding = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<boolean> => {
  try {
    const context = await OnboardingContextService.getOnboardingContext(userId);

    if (!context) {
      console.warn('No onboarding context found for user:', userId);
      return false;
    }

    // Update onboarding context with new preferences
    const updatedContext = {
      ...context,
      preferences: {
        ...context.preferences,
        ...preferences
      },
      lastModified: new Date()
    };

    await OnboardingContextService.saveOnboardingContext(userId, updatedContext);
    console.log('✅ Synced preferences to onboarding context');
    return true;
  } catch (error) {
    console.error('Error syncing preferences to onboarding:', error);
    return false;
  }
};

/**
 * Sync onboarding context changes back to user settings
 * When users update fitness profile, sync to app settings
 */
export const syncOnboardingToPreferences = async (
  userId: string
): Promise<boolean> => {
  try {
    const context = await OnboardingContextService.getOnboardingContext(userId);

    if (!context?.preferences) {
      return false;
    }

    // Update user settings with onboarding preferences
    await updateUserPreferences(userId, context.preferences);
    console.log('✅ Synced onboarding to user preferences');
    return true;
  } catch (error) {
    console.error('Error syncing onboarding to preferences:', error);
    return false;
  }
};

/**
 * Get merged context for AI
 * Combines onboarding context with user preferences
 */
export const getMergedContextForAI = async (userId: string) => {
  try {
    const [onboardingContext, preferences] = await Promise.all([
      OnboardingContextService.getOnboardingContext(userId),
      getUserPreferences(userId)
    ]);

    return {
      ...onboardingContext,
      preferences: {
        ...onboardingContext?.preferences,
        ...preferences
      }
    };
  } catch (error) {
    console.error('Error getting merged context:', error);
    return null;
  }
};

/**
 * Full bidirectional sync
 * Ensures consistency between all settings sources
 */
export const performFullSync = async (userId: string): Promise<boolean> => {
  try {
    const [onboardingContext, preferences] = await Promise.all([
      OnboardingContextService.getOnboardingContext(userId),
      getUserPreferences(userId)
    ]);

    if (!onboardingContext) {
      console.warn('No onboarding context found, skipping sync');
      return false;
    }

    // Merge preferences (onboarding takes precedence for fitness data)
    const mergedPreferences = {
      ...preferences,
      ...onboardingContext.preferences
    };

    // Update both sources
    await Promise.all([
      updateUserPreferences(userId, mergedPreferences),
      OnboardingContextService.saveOnboardingContext(userId, {
        ...onboardingContext,
        preferences: mergedPreferences
      })
    ]);

    console.log('✅ Full sync completed');
    return true;
  } catch (error) {
    console.error('Error performing full sync:', error);
    return false;
  }
};

export default {
  syncPreferencesToOnboarding,
  syncOnboardingToPreferences,
  getMergedContextForAI,
  performFullSync
};
