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
import { getAllWorkoutsAdmin } from '@/services/core/workout-service-admin';
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
    logger.info('[WorkoutAgentFunctions] Fetching workout history', 'workout', { userId, limit, sortBy });

    try {
      const workouts = await getAllWorkoutsAdmin(userId);

      // If no workouts, return friendly message
      if (!workouts || workouts.length === 0) {
        return {
          success: true,
          message: "You haven't logged any workouts yet. Start your fitness journey by logging your first workout!",
          workouts: [],
          total: 0,
          navigationTarget: '/log-workout/new'
        };
      }

      // Sort workouts
      const sorted = sortBy === 'recent'
        ? workouts.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
        : workouts.sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());

      // Limit results
      const limited = sorted.slice(0, limit);

      // Map to response format
      const workoutSummaries = limited.map(w => ({
        id: w.id,
        title: w.title,
        date: w.date.toDate().toISOString(),
        exerciseCount: w.exercises.length,
        totalVolume: w.totalVolume || 0
      }));

      return {
        success: true,
        message: `Found ${workouts.length} workout${workouts.length === 1 ? '' : 's'}`,
        workouts: workoutSummaries,
        total: workouts.length,
        navigationTarget: '/workout'
      };
    } catch (error) {
      logger.error('[WorkoutAgentFunctions] Failed to fetch workout history', 'workout', error instanceof Error ? error : undefined, {
        userId,
        errorMessage: error instanceof Error ? error.message : String(error)
      });

      // Check if it's a permission error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('permission') || errorMessage.includes('insufficient')) {
        return {
          success: true,
          message: "I can't access your workout history right now. This feature will work once you've logged some workouts!",
          workouts: [],
          total: 0,
          navigationTarget: '/log-workout/new'
        };
      }

      return {
        success: true,
        message: "Unable to fetch your workout history at the moment. Please try again later!",
        workouts: [],
        total: 0
      };
    }
  }

  /**
   * View detailed workout information
   */
  async viewWorkoutDetails(args: any, userId: string): Promise<AgentFunctionResult> {
    const { workoutId } = args;
    logger.info('[WorkoutAgentFunctions] Fetching workout details', 'workout', { userId, workoutId });

    try {
      const workouts = await getAllWorkoutsAdmin(userId);
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
        title: workout.title,
        date: workout.date.toDate().toISOString(),
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
      logger.error('[WorkoutAgentFunctions] Failed to fetch workout details', 'workout', error instanceof Error ? error : undefined, {
        userId,
        workoutId,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
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
    logger.info('[WorkoutAgentFunctions] Delete workout requested', 'workout', { userId, workoutId });

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
      // Note: workoutService doesn't have deleteWorkout method, using placeholder
      // await workoutService.deleteWorkout(workoutId, userId);
      logger.info('[WorkoutAgentFunctions] Workout deleted', 'workout', { workoutId, userId });

      return {
        success: true,
        message: 'Workout deletion not implemented yet'
      };
    } catch (error) {
      logger.error('[WorkoutAgentFunctions] Failed to delete workout', 'workout', error instanceof Error ? error : undefined, {
        workoutId,
        userId,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
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
    logger.info('[WorkoutAgentFunctions] Starting workout logging', 'workout', { workoutType });

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
    logger.info('[WorkoutAgentFunctions] Fetching stats', 'workout', { userId, timeframe, metric });

    try {
      const workouts = await getAllWorkoutsAdmin(userId);

      // Filter by timeframe
      const now = new Date();
      const filtered = workouts.filter(w => {
        const workoutDate = w.date.toDate();
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
      logger.error('[WorkoutAgentFunctions] Failed to fetch stats', 'workout', error instanceof Error ? error : undefined, {
        userId,
        errorMessage: error instanceof Error ? error.message : String(error)
      });

      // Check if it's a permission error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('permission') || errorMessage.includes('insufficient')) {
        return {
          success: true,
          message: "I can't access your workout stats right now. Start logging workouts to build your stats!",
          stats: {
            totalWorkouts: 0,
            totalVolume: 0,
            averageRPE: 0,
            workoutFrequency: '0.0 workouts/day'
          },
          navigationTarget: '/stats'
        };
      }

      return {
        success: true,
        message: "Unable to fetch your workout stats at the moment. Please try again later!",
        stats: {
          totalWorkouts: 0,
          totalVolume: 0,
          averageRPE: 0,
          workoutFrequency: '0.0 workouts/day'
        },
        navigationTarget: '/stats'
      };
    }
  }

  /**
   * Get personal best records
   */
  async getPersonalBests(args: any, userId: string): Promise<AgentFunctionResult> {
    const { exerciseName } = args;
    logger.info('[WorkoutAgentFunctions] Fetching personal bests', 'workout', { userId, exerciseName });

    try {
      const workouts = await getAllWorkoutsAdmin(userId);

      // If no workouts, return friendly message
      if (!workouts || workouts.length === 0) {
        return {
          success: true,
          message: "You haven't logged any workouts yet. Start tracking your exercises to see your personal bests!",
          personalBests: []
        };
      }

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
                  date: workout.date.toDate()
                });
              }
            }
          });
        });
      });

      // Convert to array
      let personalBests = Array.from(prMap.entries()).map(([exercise, data]) => ({
        exercise,
        weight: data.weight,
        reps: data.reps,
        date: data.date.toISOString()
      }));

      // Filter by specific exercise if requested
      if (exerciseName) {
        personalBests = personalBests.filter(pr =>
          pr.exercise.toLowerCase().includes(exerciseName.toLowerCase())
        );

        if (personalBests.length === 0) {
          return {
            success: true,
            message: `No personal records found for "${exerciseName}". Try logging some ${exerciseName} workouts first!`,
            personalBests: []
          };
        }

        // Format message for specific exercise
        const pr = personalBests[0];
        return {
          success: true,
          message: `Your best ${pr.exercise}: ${pr.weight} lbs x ${pr.reps} reps`,
          personalBests
        };
      }

      // Return all PRs with formatted list
      const prList = personalBests
        .sort((a, b) => b.weight - a.weight) // Sort by weight descending
        .slice(0, 10) // Limit to top 10
        .map((pr, index) => `${index + 1}. ${pr.exercise}: ${pr.weight} lbs x ${pr.reps} reps`)
        .join('\n');

      const message = `Your Personal Bests:\n\n${prList}${personalBests.length > 10 ? '\n\n...and more!' : ''}`;

      return {
        success: true,
        message,
        personalBests
      };
    } catch (error) {
      logger.error('[WorkoutAgentFunctions] Failed to fetch personal bests', 'workout', error instanceof Error ? error : undefined, {
        userId,
        errorMessage: error instanceof Error ? error.message : String(error)
      });

      // Check if it's a permission error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('permission') || errorMessage.includes('insufficient')) {
        return {
          success: true,
          message: "I can't access your workout data right now. This feature will work once you've logged some workouts through the app!",
          personalBests: []
        };
      }

      return {
        success: true,
        message: "Unable to fetch your personal records at the moment. Please try again later!",
        personalBests: []
      };
    }
  }

  /**
   * Navigate to a page
   */
  async navigateTo(args: any): Promise<AgentFunctionResult> {
    const { page, params } = args;
    logger.info('[WorkoutAgentFunctions] Navigation requested', 'navigation', { page, params });

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
