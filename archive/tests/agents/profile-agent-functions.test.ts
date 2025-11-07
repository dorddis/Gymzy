/**
 * Profile Agent Function Tests (TDD - Unit Level)
 *
 * Tests individual profile-related agent functions.
 * Following TDD: Write tests first, watch them fail, then implement.
 */

import { ProfileAgentFunctions } from '@/services/agents/profile-agent-functions';
import { mockUserId, mockUserProfile } from '../fixtures/agent-test-data';

// Mock the unified user profile service
jest.mock('@/services/core/unified-user-profile-service', () => ({
  UnifiedUserProfileService: jest.fn().mockImplementation(() => ({
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getProfileStats: jest.fn(),
    searchPublicProfiles: jest.fn()
  }))
}));

import { UnifiedUserProfileService } from '@/services/core/unified-user-profile-service';

describe('ProfileAgentFunctions', () => {
  let functions: ProfileAgentFunctions;
  let mockProfileService: jest.Mocked<UnifiedUserProfileService>;

  beforeEach(() => {
    functions = new ProfileAgentFunctions();
    mockProfileService = (functions as any).profileService;
    jest.clearAllMocks();
  });

  describe('viewProfile', () => {
    it('should return current user profile when no userId provided', async () => {
      mockProfileService.getProfile.mockResolvedValue(mockUserProfile);

      const result = await functions.viewProfile({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile.displayName).toBe(mockUserProfile.displayName);
      expect(mockProfileService.getProfile).toHaveBeenCalledWith(mockUserId);
    });

    it('should return other user profile when userId provided', async () => {
      const otherUserId = 'other-user-456';
      mockProfileService.getProfile.mockResolvedValue({
        ...mockUserProfile,
        id: otherUserId
      });

      const result = await functions.viewProfile({ userId: otherUserId }, mockUserId);

      expect(result.success).toBe(true);
      expect(mockProfileService.getProfile).toHaveBeenCalledWith(otherUserId);
    });

    it('should include stats in profile response', async () => {
      mockProfileService.getProfile.mockResolvedValue(mockUserProfile);

      const result = await functions.viewProfile({}, mockUserId);

      expect(result.profile.followers).toBe(0);
      expect(result.profile.following).toBe(0);
      expect(result.profile.workoutCount).toBe(42);
    });

    it('should suggest navigation to profile page', async () => {
      mockProfileService.getProfile.mockResolvedValue(mockUserProfile);

      const result = await functions.viewProfile({}, mockUserId);

      expect(result.navigationTarget).toBe('/profile');
    });

    it('should navigate to specific user profile when viewing others', async () => {
      const otherUserId = 'other-user-456';
      mockProfileService.getProfile.mockResolvedValue({
        ...mockUserProfile,
        id: otherUserId
      });

      const result = await functions.viewProfile({ userId: otherUserId }, mockUserId);

      expect(result.navigationTarget).toBe(`/profile/${otherUserId}`);
    });

    it('should return error when profile not found', async () => {
      mockProfileService.getProfile.mockResolvedValue(null);

      const result = await functions.viewProfile({}, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Profile not found');
    });

    it('should handle service errors gracefully', async () => {
      mockProfileService.getProfile.mockRejectedValue(new Error('Database error'));

      const result = await functions.viewProfile({}, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to retrieve profile');
    });
  });

  describe('updateProfile', () => {
    it('should update profile with provided fields', async () => {
      mockProfileService.updateProfile.mockResolvedValue(undefined);

      const updates = {
        displayName: 'New Name',
        bio: 'Updated bio'
      };

      const result = await functions.updateProfile(updates, mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('updated successfully');
      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(mockUserId, updates);
    });

    it('should handle multiple field updates', async () => {
      mockProfileService.updateProfile.mockResolvedValue(undefined);

      const updates = {
        displayName: 'New Name',
        bio: 'New bio',
        fitnessGoals: ['muscle_gain', 'endurance']
      };

      const result = await functions.updateProfile(updates, mockUserId);

      expect(result.success).toBe(true);
      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(mockUserId, updates);
    });

    it('should handle update errors', async () => {
      mockProfileService.updateProfile.mockRejectedValue(new Error('Update failed'));

      const result = await functions.updateProfile({ bio: 'New bio' }, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update profile');
    });
  });

  describe('updateFitnessGoals', () => {
    it('should update fitness goals', async () => {
      mockProfileService.updateProfile.mockResolvedValue(undefined);

      const result = await functions.updateFitnessGoals(
        { goals: ['muscle_gain', 'strength'] },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(mockUserId, {
        fitnessGoals: ['muscle_gain', 'strength']
      });
    });

    it('should validate fitness goals format', async () => {
      mockProfileService.updateProfile.mockResolvedValue(undefined);

      const result = await functions.updateFitnessGoals({ goals: [] }, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least one goal');
    });
  });

  describe('getProfileStats', () => {
    it('should return comprehensive profile statistics', async () => {
      const mockStats = {
        totalWorkouts: 42,
        workoutStreak: 7,
        totalVolume: 125000,
        followersCount: 10,
        followingCount: 15
      };

      mockProfileService.getProfileStats.mockResolvedValue(mockStats);

      const result = await functions.getProfileStats({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.stats).toEqual(mockStats);
    });

    it('should handle missing stats gracefully', async () => {
      mockProfileService.getProfileStats.mockResolvedValue(null);

      const result = await functions.getProfileStats({}, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to retrieve statistics');
    });
  });

  describe('searchUsers', () => {
    it('should search for users by query', async () => {
      const mockResults = [
        { id: '1', displayName: 'John Doe', username: 'johndoe', bio: 'Fitness enthusiast' },
        { id: '2', displayName: 'Jane Smith', username: 'janesmith', bio: 'Powerlifter' }
      ];

      mockProfileService.searchPublicProfiles.mockResolvedValue(mockResults as any);

      const result = await functions.searchUsers({ query: 'john', limit: 10 }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.users).toHaveLength(2);
      expect(result.users[0].displayName).toBe('John Doe');
      expect(mockProfileService.searchPublicProfiles).toHaveBeenCalledWith('john', 10);
    });

    it('should limit search results', async () => {
      const mockResults = Array(20).fill(null).map((_, i) => ({
        id: `user-${i}`,
        displayName: `User ${i}`,
        username: `user${i}`,
        bio: ''
      }));

      mockProfileService.searchPublicProfiles.mockResolvedValue(mockResults as any);

      const result = await functions.searchUsers({ query: 'user', limit: 5 }, mockUserId);

      expect(mockProfileService.searchPublicProfiles).toHaveBeenCalledWith('user', 5);
    });

    it('should return empty array when no results found', async () => {
      mockProfileService.searchPublicProfiles.mockResolvedValue([]);

      const result = await functions.searchUsers({ query: 'nonexistent' }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.users).toHaveLength(0);
    });

    it('should handle search errors', async () => {
      mockProfileService.searchPublicProfiles.mockRejectedValue(new Error('Search failed'));

      const result = await functions.searchUsers({ query: 'test' }, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to search users');
    });
  });

  describe('viewAchievements', () => {
    it('should return user achievements', async () => {
      const mockAchievements = [
        { id: 'ach-1', name: 'First Workout', description: 'Complete your first workout', earnedAt: new Date() },
        { id: 'ach-2', name: '10 Workouts', description: 'Complete 10 workouts', earnedAt: new Date() }
      ];

      mockProfileService.getProfile.mockResolvedValue({
        ...mockUserProfile,
        achievements: mockAchievements
      } as any);

      const result = await functions.viewAchievements({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.achievements).toHaveLength(2);
    });

    it('should filter achievements by category if provided', async () => {
      const mockAchievements = [
        { id: 'ach-1', name: 'First Workout', category: 'workouts', earnedAt: new Date() },
        { id: 'ach-2', name: 'Social Butterfly', category: 'social', earnedAt: new Date() }
      ];

      mockProfileService.getProfile.mockResolvedValue({
        ...mockUserProfile,
        achievements: mockAchievements
      } as any);

      const result = await functions.viewAchievements({ category: 'workouts' }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.achievements).toHaveLength(1);
      expect(result.achievements[0].category).toBe('workouts');
    });
  });
});
