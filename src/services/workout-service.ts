import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { z } from 'zod';
import { Muscle } from '@/lib/constants';

// Zod schema for workout validation
const exerciseSchema = z.object({
  exerciseId: z.string(),
  name: z.string().min(1),
  sets: z.array(z.object({
    weight: z.number().min(0),
    reps: z.number().min(0),
    rpe: z.number().min(1).max(10).optional(),
    isWarmup: z.boolean().optional(),
  })),
  targetedMuscles: z.array(z.nativeEnum(Muscle)),
  notes: z.string().optional(),
  order: z.number().optional(),
});

const workoutSchema = z.object({
  userId: z.string(),
  title: z.string().min(1),
  date: z.instanceof(Timestamp),
  exercises: z.array(exerciseSchema),
  totalVolume: z.number().min(0).optional(),
  rpe: z.number().min(1).max(10).optional(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp)
});

export type Workout = z.infer<typeof workoutSchema> & { id: string };

// Helper function to calculate total volume
const calculateTotalVolume = (exercises: z.infer<typeof exerciseSchema>[]): number => {
  return exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets.reduce((setSum, set) => setSum + (set.weight * set.reps), 0);
    return total + exerciseVolume;
  }, 0);
};

// Create a new workout
export const createWorkout = async (workoutData: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = Timestamp.now();
    const workout = {
      ...workoutData,
      createdAt: now,
      updatedAt: now
    };

    // Validate workout data
    workoutSchema.parse(workout);

    // Calculate total volume if not provided or if exercises are updated
    if (workout.exercises && workout.totalVolume === undefined) {
      workout.totalVolume = calculateTotalVolume(workout.exercises);
    }

    const docRef = await addDoc(collection(db, 'workouts'), workout);
    return { id: docRef.id, ...workout };
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
};

// Get recent workouts for a user
export const getRecentWorkouts = async (userId: string, limitCount: number = 5) => {
  try {
    const workoutsQuery = query(
      collection(db, 'workouts'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(workoutsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Workout));
  } catch (error) {
    console.error('Error getting recent workouts:', error);
    throw error;
  }
};

// Update an existing workout
export const updateWorkout = async (workoutId: string, workoutData: Partial<Workout>) => {
  try {
    const workoutRef = doc(db, 'workouts', workoutId);
    const updateData = {
      ...workoutData,
      updatedAt: Timestamp.now()
    };

    // If exercises are updated, recalculate total volume
    if (workoutData.exercises) {
      updateData.totalVolume = calculateTotalVolume(workoutData.exercises);
    }

    await updateDoc(workoutRef, updateData);
    return { id: workoutId, ...updateData };
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
};

// Delete a workout
export const deleteWorkout = async (workoutId: string) => {
  try {
    const workoutRef = doc(db, 'workouts', workoutId);
    await deleteDoc(workoutRef);
    return workoutId;
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}; 