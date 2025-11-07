/**
 * System Agent Function Tests (TDD - Unit Level)
 *
 * Tests system-related agent functions: settings, navigation, preferences, privacy.
 * Following TDD: Write tests first, watch them fail, then implement.
 */

import { SystemAgentFunctions } from '@/services/agents/system-agent-functions';
import { mockUserId } from '../fixtures/agent-test-data';

// Mock settings service
jest.mock('@/services/data/user-settings-service', () => ({
  getUserPreferences: jest.fn(),
  updateUserPreferences: jest.fn(),
  getPrivacySettings: jest.fn(),
  updatePrivacySettings: jest.fn(),
  updateTheme: jest.fn(),
  updateUnits: jest.fn(),
  updateNotificationPreferences: jest.fn()
}));

import * as settingsService from '@/services/data/user-settings-service';

describe('SystemAgentFunctions', () => {
  let functions: SystemAgentFunctions;

  beforeEach(() => {
    functions = new SystemAgentFunctions();
    jest.clearAllMocks();
  });

  describe('navigateTo', () => {
    it('should return navigation target for valid page', async () => {
      const result = await functions.navigateTo({ page: 'settings' }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.navigationTarget).toBe('/settings');
      expect(result.message).toContain('settings');
    });

    it('should handle pages with parameters', async () => {
      const result = await functions.navigateTo({
        page: 'profile',
        params: { userId: 'user-123' }
      }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.navigationTarget).toBe('/profile/user-123');
    });

    it('should use current userId when navigating to profile without params', async () => {
      const result = await functions.navigateTo({ page: 'profile' }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.navigationTarget).toBe(`/profile/${mockUserId}`);
    });

    it('should return home for home page', async () => {
      const result = await functions.navigateTo({ page: 'home' }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.navigationTarget).toBe('/');
    });

    it('should return error for invalid page', async () => {
      const result = await functions.navigateTo({ page: 'nonexistent' }, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown page');
    });

    it('should handle all valid app pages', async () => {
      const pages = ['chat', 'workout', 'stats', 'feed', 'notifications', 'discover'];

      for (const page of pages) {
        const result = await functions.navigateTo({ page }, mockUserId);
        expect(result.success).toBe(true);
        expect(result.navigationTarget).toBeTruthy();
      }
    });
  });

  describe('viewSettings', () => {
    it('should return all settings when category is "all"', async () => {
      const mockPrefs = { theme: 'dark', units: 'metric' };
      const mockPrivacy = { profileVisibility: 'public' };

      (settingsService.getUserPreferences as jest.Mock).mockResolvedValue(mockPrefs);
      (settingsService.getPrivacySettings as jest.Mock).mockResolvedValue(mockPrivacy);

      const result = await functions.viewSettings({ category: 'all' }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.settings.preferences).toEqual(mockPrefs);
      expect(result.settings.privacy).toEqual(mockPrivacy);
      expect(result.navigationTarget).toBe('/settings');
    });

    it('should return only preferences when category is "preferences"', async () => {
      const mockPrefs = { theme: 'dark', units: 'metric' };

      (settingsService.getUserPreferences as jest.Mock).mockResolvedValue(mockPrefs);

      const result = await functions.viewSettings({ category: 'preferences' }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.settings.preferences).toEqual(mockPrefs);
      expect(result.settings.privacy).toBeUndefined();
    });

    it('should return only privacy when category is "privacy"', async () => {
      const mockPrivacy = { profileVisibility: 'public' };

      (settingsService.getPrivacySettings as jest.Mock).mockResolvedValue(mockPrivacy);

      const result = await functions.viewSettings({ category: 'privacy' }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.settings.privacy).toEqual(mockPrivacy);
      expect(result.settings.preferences).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      (settingsService.getUserPreferences as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await functions.viewSettings({}, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to retrieve settings');
    });
  });

  describe('updateSettings', () => {
    it('should update theme setting', async () => {
      (settingsService.updateTheme as jest.Mock).mockResolvedValue(undefined);

      const result = await functions.updateSettings({ theme: 'dark' }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('updated successfully');
      expect(settingsService.updateTheme).toHaveBeenCalledWith(mockUserId, 'dark');
    });

    it('should update units setting', async () => {
      (settingsService.updateUnits as jest.Mock).mockResolvedValue(undefined);

      const result = await functions.updateSettings({ units: 'imperial' }, mockUserId);

      expect(result.success).toBe(true);
      expect(settingsService.updateUnits).toHaveBeenCalledWith(mockUserId, 'imperial');
    });

    it('should update notification preferences', async () => {
      (settingsService.updateNotificationPreferences as jest.Mock).mockResolvedValue(undefined);

      const result = await functions.updateSettings(
        { notificationsEnabled: true },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(settingsService.updateNotificationPreferences).toHaveBeenCalledWith(mockUserId, {
        notificationsEnabled: true
      });
    });

    it('should update multiple settings at once', async () => {
      (settingsService.updateTheme as jest.Mock).mockResolvedValue(undefined);
      (settingsService.updateUnits as jest.Mock).mockResolvedValue(undefined);

      const result = await functions.updateSettings(
        { theme: 'dark', units: 'metric' },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(settingsService.updateTheme).toHaveBeenCalled();
      expect(settingsService.updateUnits).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      (settingsService.updateTheme as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      const result = await functions.updateSettings({ theme: 'dark' }, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update settings');
    });
  });

  describe('updatePrivacy', () => {
    it('should update privacy settings', async () => {
      (settingsService.updatePrivacySettings as jest.Mock).mockResolvedValue(undefined);

      const updates = {
        profileVisibility: 'private',
        showWorkouts: false
      };

      const result = await functions.updatePrivacy(updates, mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Privacy settings updated');
      expect(settingsService.updatePrivacySettings).toHaveBeenCalledWith(mockUserId, updates);
    });

    it('should handle privacy update errors', async () => {
      (settingsService.updatePrivacySettings as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      const result = await functions.updatePrivacy({ profileVisibility: 'private' }, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update privacy');
    });
  });

  describe('getHelp', () => {
    it('should return help information', async () => {
      const result = await functions.getHelp({ topic: 'workouts' });

      expect(result.success).toBe(true);
      expect(result.message).toBeTruthy();
      expect(result.topic).toBe('workouts');
    });

    it('should provide general help when no topic specified', async () => {
      const result = await functions.getHelp({});

      expect(result.success).toBe(true);
      expect(result.message).toContain('help');
    });
  });
});
