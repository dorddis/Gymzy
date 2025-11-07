import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  UserPreferences,
  PrivacySettings,
  AppTheme,
  UnitSystem,
  NotificationPreferences,
  DigestFrequency,
  FontSize,
  AccessibilitySettings
} from '@/types/user';

/**
 * User Settings Service
 * Manages user preferences, privacy settings, and app configuration
 */

// Default preferences for new users
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  // App behavior
  theme: AppTheme.AUTO,
  language: 'en',
  units: UnitSystem.METRIC,

  // Notifications
  notifications: {
    email: true,
    push: true,
    sms: false,
    workoutReminders: true,
    socialActivity: true,
    achievements: true,
    challenges: true,
    systemUpdates: true,
    marketingOffers: false,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    },
    digestFrequency: DigestFrequency.DAILY
  },

  // Workout preferences
  defaultRestTime: 90,
  autoStartTimer: true,
  showProgressPhotos: true,
  trackHeartRate: false,

  // AI preferences
  aiPersonality: 'supportive' as any,
  aiResponseLength: 'medium' as any,
  preferredAIModel: 'gemini' as any,
  aiCoachingStyle: 'adaptive' as any,

  // Data and sync
  autoSync: true,
  syncFrequency: 'real_time' as any,
  dataRetention: 'indefinite' as any,

  // Accessibility
  accessibility: {
    fontSize: FontSize.MEDIUM,
    highContrast: false,
    reduceMotion: false,
    screenReader: false,
    voiceCommands: false,
    hapticFeedback: true
  }
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: 'public' as any,
  workoutVisibility: 'friends' as any,
  progressVisibility: 'private' as any,

  // Data sharing
  allowDataAnalytics: true,
  allowPersonalization: true,
  allowMarketingEmails: false,
  allowPushNotifications: true,

  // Social privacy
  allowFollowers: true,
  allowDirectMessages: true,
  allowWorkoutSharing: true,
  allowLocationSharing: false,

  // AI privacy
  allowAIPersonalization: true,
  allowAIDataCollection: true,
  allowAIInsights: true
};

/**
 * Get user preferences from Firestore
 */
export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  try {
    const userDoc = await getDoc(doc(db, 'user_settings', userId));

    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.preferences || DEFAULT_USER_PREFERENCES;
    }

    // Return defaults if no settings exist
    return DEFAULT_USER_PREFERENCES;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return DEFAULT_USER_PREFERENCES;
  }
};

/**
 * Get user privacy settings from Firestore
 */
export const getPrivacySettings = async (userId: string): Promise<PrivacySettings> => {
  try {
    const userDoc = await getDoc(doc(db, 'user_settings', userId));

    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.privacy || DEFAULT_PRIVACY_SETTINGS;
    }

    return DEFAULT_PRIVACY_SETTINGS;
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    return DEFAULT_PRIVACY_SETTINGS;
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<boolean> => {
  try {
    const settingsRef = doc(db, 'user_settings', userId);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      // Update existing
      await updateDoc(settingsRef, {
        preferences: {
          ...settingsDoc.data().preferences,
          ...preferences
        },
        updatedAt: new Date()
      });
    } else {
      // Create new
      await setDoc(settingsRef, {
        userId,
        preferences: {
          ...DEFAULT_USER_PREFERENCES,
          ...preferences
        },
        privacy: DEFAULT_PRIVACY_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return false;
  }
};

/**
 * Update privacy settings
 */
export const updatePrivacySettings = async (
  userId: string,
  privacy: Partial<PrivacySettings>
): Promise<boolean> => {
  try {
    const settingsRef = doc(db, 'user_settings', userId);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      await updateDoc(settingsRef, {
        privacy: {
          ...settingsDoc.data().privacy,
          ...privacy
        },
        updatedAt: new Date()
      });
    } else {
      await setDoc(settingsRef, {
        userId,
        preferences: DEFAULT_USER_PREFERENCES,
        privacy: {
          ...DEFAULT_PRIVACY_SETTINGS,
          ...privacy
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return false;
  }
};

/**
 * Update theme preference
 */
export const updateTheme = async (userId: string, theme: AppTheme): Promise<boolean> => {
  return updateUserPreferences(userId, { theme });
};

/**
 * Update units preference
 */
export const updateUnits = async (userId: string, units: UnitSystem): Promise<boolean> => {
  return updateUserPreferences(userId, { units });
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  notifications: Partial<NotificationPreferences>
): Promise<boolean> => {
  const currentPrefs = await getUserPreferences(userId);
  return updateUserPreferences(userId, {
    notifications: {
      ...currentPrefs.notifications,
      ...notifications
    }
  });
};

/**
 * Reset all settings to defaults
 */
export const resetToDefaults = async (userId: string): Promise<boolean> => {
  try {
    const settingsRef = doc(db, 'user_settings', userId);
    await setDoc(settingsRef, {
      userId,
      preferences: DEFAULT_USER_PREFERENCES,
      privacy: DEFAULT_PRIVACY_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error resetting settings:', error);
    return false;
  }
};

export default {
  getUserPreferences,
  getPrivacySettings,
  updateUserPreferences,
  updatePrivacySettings,
  updateTheme,
  updateUnits,
  updateNotificationPreferences,
  resetToDefaults
};
