/**
 * Workout Agent Functions
 *
 * Individual callable functions for workout-related agent operations.
 * Each function is designed to be used as a tool by the AI agent.
 *
 * These functions follow the pattern:
 * - Accept structured arguments (from AI function calling)
 * - Return structured responses (success/error/data)
 * - Handle errors gracefully
 * - Require confirmation for destructive actions
 */

import { workoutService, getAllWorkouts } from '@/services/core/workout-service';
import { logger } from '@/lib/logger';

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
  [key: string]: any; // Allow additional data fields
}

export class WorkoutAgentFunctions {
  /**
   * View workout history
   */
  async viewWorkoutHistory(args: any, userId: string): Promise<AgentFunctionResult> {
    const { limit = 10, sortBy = 'recent' } = args;
    logger.info('[WorkoutAgentFunctions] Fetching workout history', { userId, limit, sortBy });

    try {
      const workouts = await getAllWorkouts(userId);

      // Sort workouts
      const sorted = sortBy === 'recent'
        ? workouts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        : workouts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Limit results
      const limited = sorted.slice(0, limit);

      // Map to response format
      const workoutSummaries = limited.map(w => ({
        id: w.id,
        name: w.name,
        date: w.createdAt.toISOString(),
        exerciseCount: w.exercises.length,
        duration: w.duration,
        totalVolume: w.totalVolume || 0
      }));

      return {
        success: true,
        workouts: workoutSummaries,
        total: workouts.length
      };
    } catch (error) {
      logger.error('[WorkoutAgentFunctions] Failed to fetch workout history', { error });
      return {
        success: false,
        error: 'Failed to retrieve workout history'
      };
    }
  }

  /**
   * View detailed workout information
   */
  async viewWorkoutDetails(args: any, userId: string): Promise<AgentFunctionResult> {
    const { workoutId } = args;
    logger.info('[WorkoutAgentFunctions] Fetching workout details', { userId, workoutId });

    try {
      const workouts = await getAllWorkouts(userId);
      const workout = workouts.find(w => w.id === workoutId);

      if (!workout) {
        return {
          success: false,
          error: 'Workout not found'
        };
      }

      // Build detailed response
      const workoutDetails = {
        id: workout.id,
        name: workout.name,
        date: workout.createdAt.toISOString(),
        duration: workout.duration,
        totalVolume: workout.totalVolume || 0,
        exercises: workout.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets.length,
          totalReps: ex.sets.reduce((sum, set) => sum + (set.reps || 0), 0),
          totalWeight: ex.sets.reduce((sum, set) => sum + (set.weight || 0), 0)
        })),
        averageRPE: workout.rpe || 0
      };

      return {
        success: true,
        workout: workoutDetails
      };
    } catch (error) {
      logger.error('[WorkoutAgentFunctions] Failed to fetch workout details', { error });
      return {
        success: false,
        error: 'Failed to retrieve workout details'
      };
    }
  }

  /**
   * Delete workout (requires confirmation)
   */
  async deleteWorkout(args: any, userId: string): Promise<AgentFunctionResult> {
    const { workoutId } = args;
    logger.info('[WorkoutAgentFunctions] Delete workout requested', { userId, workoutId });

    // This is a destructive action - requires confirmation
    return {
      success: false,
      requiresConfirmation: true,
      confirmationPrompt: 'Are you sure you want to delete this workout? This cannot be undone.',
      pendingAction: {
        function: 'deleteWorkout',
        args: { workoutId, userId }
      }
    };
  }

  /**
   * Execute confirmed workout deletion
   */
  async executeDeleteWorkout(workoutId: string, userId: string): Promise<AgentFunctionResult> {
    try {
      await workoutService.deleteWorkout(workoutId, userId);
      logger.info('[WorkoutAgentFunctions] Workout deleted', { workoutId, userId });

      return {
        success: true,
        message: 'Workout deleted successfully'
      };
    } catch (error) {
      logger.error('[WorkoutAgentFunctions] Failed to delete workout', { error });
      return {
        success: false,
        error: 'Failed to delete workout'
      };
    }
  }

  /**
   * Start logging a new workout
   */
  async logWorkout(args: any): Promise<AgentFunctionResult> {
    const { workoutType = 'strength' } = args;
    logger.info('[WorkoutAgentFunctions] Starting workout logging', { workoutType });

    return {
      success: true,
      navigationTarget: '/log-workout/new',
      message: `Starting new ${workoutType} workout session...`
    };
  }

  /**
   * View workout statistics
   */
  async viewStats(args: any, userId: string): Promise<AgentFunctionResult> {
    const { timeframe = 'month', metric = 'overview' } = args;
    logger.info('[WorkoutAgentFunctions] Fetching stats', { userId, timeframe, metric });

    try {
      const workouts = await getAllWorkouts(userId);

      // Filter by timeframe
      const now = new Date();
      const filtered = workouts.filter(w => {
        const workoutDate = w.createdAt;
        const diffMs = now.getTime() - workoutDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (timeframe) {
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case 'year':
            return diffDays <= 365;
          default: // all-time
            return true;
        }
      });

      // Calculate statistics
      const totalWorkouts = filtered.length;
      const totalVolume = filtered.reduce(
        (sum, w) => sum + (w.totalVolume || 0),
        0
      );
      const averageRPE = totalWorkouts > 0
        ? filtered.reduce((sum, w) => sum + (w.rpe || 0), 0) / totalWorkouts
        : 0;

      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'year' ? 365 : 1;
      const workoutFrequency = `${(totalWorkouts / days).toFixed(1)} workouts/day`;

      const stats = {
        totalWorkouts,
        totalVolume,
        averageRPE: Number(averageRPE.toFixed(1)),
        workoutFrequency
      };

      return {
        success: true,
        timeframe,
        stats,
        navigationTarget: '/stats'
      };
    } catch (error) {
      logger.error('[WorkoutAgentFunctions] Failed to fetch stats', { error });
      return {
        success: false,
        error: 'Failed to retrieve statistics'
      };
    }
  }

  /**
   * Get personal best records
   */
  async getPersonalBests(args: any, userId: string): Promise<AgentFunctionResult> {
    logger.info('[WorkoutAgentFunctions] Fetching personal bests', { userId });

    try {
      const workouts = await getAllWorkouts(userId);
      const prMap = new Map<string, { weight: number; reps: number; date: Date }>();

      // Find max weight for each exercise
      workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            if (set.weight && set.weight > 0) {
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

      // Convert to array
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
      logger.error('[WorkoutAgentFunctions] Failed to fetch personal bests', { error });
      return {
        success: false,
        error: 'Failed to retrieve personal records'
      };
    }
  }

  /**
   * Navigate to a page
   */
  async navigateTo(args: any): Promise<AgentFunctionResult> {
    const { page, params } = args;
    logger.info('[WorkoutAgentFunctions] Navigation requested', { page, params });

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
}
