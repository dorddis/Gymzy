/**
 * Workout Agent Function Tests (TDD - Unit Level)
 *
 * Tests individual agent functions that will be exposed as tools.
 * Following TDD: Write tests first, watch them fail, then implement.
 */

import { WorkoutAgentFunctions } from '@/services/agents/workout-agent-functions';
import { mockUserId, mockWorkout, mockWorkouts, mockOnboardingContext } from '../fixtures/agent-test-data';

// Mock the workout service
jest.mock('@/services/core/workout-service', () => ({
  workoutService: {
    createWorkout: jest.fn(),
    deleteWorkout: jest.fn()
  },
  getAllWorkouts: jest.fn()
}));

import { workoutService, getAllWorkouts } from '@/services/core/workout-service';

describe('WorkoutAgentFunctions', () => {
  let functions: WorkoutAgentFunctions;

  beforeEach(() => {
    functions = new WorkoutAgentFunctions();
    jest.clearAllMocks();
  });

  describe('viewWorkoutHistory', () => {
    it('should return workout history with default limit', async () => {
      (getAllWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);

      const result = await functions.viewWorkoutHistory({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.workouts).toHaveLength(3);
      expect(result.workouts[0].id).toBe(mockWorkouts[0].id);
      expect(getAllWorkouts).toHaveBeenCalledWith(mockUserId);
    });

    it('should limit results when limit parameter is provided', async () => {
      (getAllWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);

      const result = await functions.viewWorkoutHistory({ limit: 2 }, mockUserId);

      expect(result.success).toBe(true);
      expect(result.workouts).toHaveLength(2);
    });

    it('should sort by recent by default', async () => {
      (getAllWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);

      const result = await functions.viewWorkoutHistory({}, mockUserId);

      expect(result.workouts[0].date).toBe(mockWorkouts[0].createdAt.toISOString());
    });

    it('should handle empty workout history gracefully', async () => {
      (getAllWorkouts as jest.Mock).mockResolvedValue([]);

      const result = await functions.viewWorkoutHistory({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.workouts).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle errors and return failure response', async () => {
      (getAllWorkouts as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await functions.viewWorkoutHistory({}, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to retrieve workout history');
    });
  });

  describe('viewWorkoutDetails', () => {
    it('should return detailed workout information', async () => {
      (getAllWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);

      const result = await functions.viewWorkoutDetails(
        { workoutId: mockWorkouts[0].id },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.workout).toBeDefined();
      expect(result.workout.id).toBe(mockWorkouts[0].id);
      expect(result.workout.exercises).toHaveLength(2);
      expect(result.workout.totalVolume).toBe(9700); // From mock data
      expect(result.workout.averageRPE).toBe(8);
    });

    it('should return error when workout not found', async () => {
      (getAllWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);

      const result = await functions.viewWorkoutDetails(
        { workoutId: 'non-existent-id' },
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Workout not found');
    });

    it('should include exercise details with sets and totals', async () => {
      (getAllWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);

      const result = await functions.viewWorkoutDetails(
        { workoutId: mockWorkouts[0].id },
        mockUserId
      );

      const exercise = result.workout.exercises[0];
      expect(exercise.name).toBe('Bench Press');
      expect(exercise.sets).toBe(3);
      expect(exercise.totalReps).toBeGreaterThan(0);
      expect(exercise.totalWeight).toBeGreaterThan(0);
    });
  });

  describe('deleteWorkout', () => {
    it('should require confirmation for destructive action', async () => {
      const result = await functions.deleteWorkout(
        { workoutId: mockWorkouts[0].id },
        mockUserId
      );

      expect(result.requiresConfirmation).toBe(true);
      expect(result.confirmationPrompt).toContain('Are you sure');
      expect(result.success).toBe(false);
      expect(workoutService.deleteWorkout).not.toHaveBeenCalled();
    });

    it('should include pending action details in response', async () => {
      const result = await functions.deleteWorkout(
        { workoutId: mockWorkouts[0].id },
        mockUserId
      );

      expect(result.pendingAction).toBeDefined();
      expect(result.pendingAction.function).toBe('deleteWorkout');
      expect(result.pendingAction.args.workoutId).toBe(mockWorkouts[0].id);
    });
  });

  describe('executeDeleteWorkout', () => {
    it('should delete workout when confirmed', async () => {
      (workoutService.deleteWorkout as jest.Mock).mockResolvedValue(undefined);

      const result = await functions.executeDeleteWorkout(
        mockWorkouts[0].id,
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
      expect(workoutService.deleteWorkout).toHaveBeenCalledWith(
        mockWorkouts[0].id,
        mockUserId
      );
    });

    it('should handle deletion errors gracefully', async () => {
      (workoutService.deleteWorkout as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      const result = await functions.executeDeleteWorkout(
        mockWorkouts[0].id,
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to delete workout');
    });
  });

  describe('logWorkout', () => {
    it('should return navigation target for new workout', async () => {
      const result = await functions.logWorkout({ workoutType: 'strength' });

      expect(result.success).toBe(true);
      expect(result.navigationTarget).toBe('/log-workout/new');
      expect(result.message).toContain('strength');
    });

    it('should handle missing workout type with default', async () => {
      const result = await functions.logWorkout({});

      expect(result.success).toBe(true);
      expect(result.message).toContain('strength');
    });
  });

  describe('viewStats', () => {
    beforeEach(() => {
      (getAllWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);
    });

    it('should calculate stats for specified timeframe', async () => {
      const result = await functions.viewStats(
        { timeframe: 'month', metric: 'overview' },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalWorkouts).toBeGreaterThanOrEqual(0);
      expect(result.timeframe).toBe('month');
    });

    it('should filter workouts by timeframe correctly', async () => {
      const now = new Date();
      const recentWorkouts = [
        {
          ...mockWorkout,
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        {
          ...mockWorkout,
          id: 'old-workout',
          createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
        }
      ];

      (getAllWorkouts as jest.Mock).mockResolvedValue(recentWorkouts);

      const weekResult = await functions.viewStats({ timeframe: 'week' }, mockUserId);

      expect(weekResult.stats.totalWorkouts).toBe(1); // Only the recent one
    });

    it('should calculate total volume across all workouts', async () => {
      const result = await functions.viewStats({ timeframe: 'all-time' }, mockUserId);

      expect(result.stats.totalVolume).toBeGreaterThan(0);
    });

    it('should suggest navigating to stats page', async () => {
      const result = await functions.viewStats({}, mockUserId);

      expect(result.navigationTarget).toBe('/stats');
    });
  });

  describe('getPersonalBests', () => {
    it('should extract personal bests from workout history', async () => {
      (getAllWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);

      const result = await functions.getPersonalBests({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.personalBests).toBeDefined();
      expect(Array.isArray(result.personalBests)).toBe(true);
    });

    it('should track highest weight for each exercise', async () => {
      (getAllWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);

      const result = await functions.getPersonalBests({}, mockUserId);

      const benchPR = result.personalBests.find((pr: any) => pr.exercise === 'Bench Press');
      expect(benchPR).toBeDefined();
      expect(benchPR.weight).toBeGreaterThan(0);
    });

    it('should handle workouts with no weight data', async () => {
      const bodyweightWorkouts = [
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockWorkout.exercises[0],
              sets: [{ setNumber: 1, reps: 10, completed: true }]
            }
          ]
        }
      ];

      (getAllWorkouts as jest.Mock).mockResolvedValue(bodyweightWorkouts);

      const result = await functions.getPersonalBests({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.personalBests).toHaveLength(0);
    });
  });

  describe('navigateTo', () => {
    it('should return navigation target for valid page', async () => {
      const result = await functions.navigateTo({ page: 'stats' });

      expect(result.success).toBe(true);
      expect(result.navigationTarget).toBe('/stats');
      expect(result.message).toContain('stats');
    });

    it('should handle workout logging with ID', async () => {
      const result = await functions.navigateTo({
        page: 'log-workout',
        params: { workoutId: 'workout-123' }
      });

      expect(result.success).toBe(true);
      expect(result.navigationTarget).toBe('/log-workout/workout-123');
    });

    it('should return error for invalid page', async () => {
      const result = await functions.navigateTo({ page: 'invalid-page' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown page');
    });
  });
});
