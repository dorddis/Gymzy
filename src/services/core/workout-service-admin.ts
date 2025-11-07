/**
 * Workout Service - Admin SDK Version
 *
 * Server-side workout operations using Firebase Admin SDK.
 * Use this in API routes and server components.
 *
 * IMPORTANT: Only use in server-side code. This bypasses Firestore security rules.
 */

import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface AdminWorkout {
  id: string;
  userId: string;
  title: string;
  date: Timestamp;
  exercises: Array<{
    exerciseId: string;
    name: string;
    sets: Array<{
      weight?: number;
      reps?: number;
      rpe?: number;
      isWarmup?: boolean;
      isExecuted?: boolean;
    }>;
    targetedMuscles?: string[];
    notes?: string;
    order?: number;
  }>;
  totalVolume?: number;
  rpe?: number;
  notes?: string;
  mediaUrls?: string[];
  isPublic?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Get all workouts for a user (Admin SDK version)
 *
 * @param userId - The user's Firebase UID
 * @returns Array of workouts
 */
export async function getAllWorkoutsAdmin(userId: string): Promise<AdminWorkout[]> {
  try {
    const db = getAdminDb();
    const workoutsRef = db.collection('workouts');

    const snapshot = await workoutsRef
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .get();

    if (snapshot.empty) {
      console.log('[Admin] No workouts found for user:', userId);
      return [];
    }

    const workouts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || userId,
        title: data.title || 'Untitled Workout',
        date: data.date,
        exercises: data.exercises || [],
        totalVolume: data.totalVolume || 0,
        rpe: data.rpe,
        notes: data.notes || '',
        mediaUrls: data.mediaUrls || [],
        isPublic: data.isPublic || false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as AdminWorkout;
    });

    console.log(`[Admin] Found ${workouts.length} workouts for user:`, userId);
    return workouts;
  } catch (error) {
    console.error('[Admin] Error getting workouts:', error);
    throw error;
  }
}

/**
 * Get recent workouts for a user (Admin SDK version)
 *
 * @param userId - The user's Firebase UID
 * @param limitCount - Number of workouts to return
 * @returns Array of recent workouts
 */
export async function getRecentWorkoutsAdmin(
  userId: string,
  limitCount: number = 5
): Promise<AdminWorkout[]> {
  try {
    const db = getAdminDb();
    const workoutsRef = db.collection('workouts');

    const snapshot = await workoutsRef
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .limit(limitCount)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const workouts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || userId,
        title: data.title || 'Untitled Workout',
        date: data.date,
        exercises: data.exercises || [],
        totalVolume: data.totalVolume || 0,
        rpe: data.rpe,
        notes: data.notes || '',
        mediaUrls: data.mediaUrls || [],
        isPublic: data.isPublic || false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as AdminWorkout;
    });

    return workouts;
  } catch (error) {
    console.error('[Admin] Error getting recent workouts:', error);
    throw error;
  }
}

/**
 * Get a specific workout by ID (Admin SDK version)
 *
 * @param workoutId - The workout document ID
 * @returns Workout or null if not found
 */
export async function getWorkoutByIdAdmin(
  workoutId: string
): Promise<AdminWorkout | null> {
  try {
    const db = getAdminDb();
    const docRef = db.collection('workouts').doc(workoutId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data()!;
    return {
      id: docSnap.id,
      userId: data.userId,
      title: data.title || 'Untitled Workout',
      date: data.date,
      exercises: data.exercises || [],
      totalVolume: data.totalVolume || 0,
      rpe: data.rpe,
      notes: data.notes || '',
      mediaUrls: data.mediaUrls || [],
      isPublic: data.isPublic || false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as AdminWorkout;
  } catch (error) {
    console.error('[Admin] Error getting workout by ID:', error);
    throw error;
  }
}
