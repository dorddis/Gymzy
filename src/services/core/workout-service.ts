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
  Timestamp,
  getDoc
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
    isExecuted: z.boolean().optional(),
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
  notes: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp)
});

export type WorkoutData = z.infer<typeof workoutSchema>;
export type Workout = WorkoutData & { id: string };

// Define the input type for creating a workout
type WorkoutInput = Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>;

// Helper function to calculate total volume
const calculateTotalVolume = (exercises: z.infer<typeof exerciseSchema>[]): number => {
  return exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets.reduce((setSum, set) => setSum + (set.weight * set.reps), 0);
    return total + exerciseVolume;
  }, 0);
};

// Helper function to calculate average RPE
const calculateAverageRPE = (exercises: z.infer<typeof exerciseSchema>[]): number => {
  let totalRPE = 0;
  let totalSets = 0;

  exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      if (set.isExecuted) {
        // Use 7 as default RPE if undefined or invalid
        const rpe = (set.rpe !== undefined && set.rpe >= 1 && set.rpe <= 10) ? set.rpe : 7;
        totalRPE += rpe;
        totalSets++;
      }
    });
  });

  return totalSets > 0 ? totalRPE / totalSets : 7; // Default to 7 if no sets
};

// Create a new workout
export const createWorkout = async (workoutData: Omit<WorkoutData, 'createdAt' | 'updatedAt'>): Promise<Workout> => {
  try {
    // Calculate total volume
    const totalVolume = calculateTotalVolume(workoutData.exercises);
    
    // Calculate average RPE
    const averageRPE = calculateAverageRPE(workoutData.exercises);

    // Add timestamps
    const workoutWithTimestamps = {
      ...workoutData,
      totalVolume,
      rpe: averageRPE,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Validate the workout data
    const validatedData = workoutSchema.parse(workoutWithTimestamps);

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'workouts'), validatedData);
    
    return {
      id: docRef.id,
      ...validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation Error creating workout:', error.issues);
    } else {
      console.error('Error creating workout:', error);
    }
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
    const workouts = snapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure all required fields are present with default values
      const workoutData = {
        id: doc.id,
        userId: data.userId || userId,
        title: data.title || 'Untitled Workout',
        date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
        exercises: data.exercises || [],
        totalVolume: data.totalVolume || 0,
        rpe: data.rpe,
        notes: data.notes || '',
        mediaUrls: data.mediaUrls || [],
        isPublic: data.isPublic || false,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt)),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.fromDate(new Date(data.updatedAt))
      };
      return workoutData as Workout;
    });
    return workouts;
  } catch (error) {
    console.error('Error getting recent workouts:', error);
    throw error;
  }
};

// Get all workouts for a user
export const getAllWorkouts = async (userId: string): Promise<Workout[]> => {
  try {
    const workoutsQuery = query(
      collection(db, 'workouts'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(workoutsQuery);
    const workouts = snapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure all required fields are present with default values
      const workoutData = {
        id: doc.id,
        userId: data.userId || userId,
        title: data.title || 'Untitled Workout',
        date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
        exercises: data.exercises || [],
        totalVolume: data.totalVolume || 0,
        rpe: data.rpe,
        notes: data.notes || '',
        mediaUrls: data.mediaUrls || [],
        isPublic: data.isPublic || false,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt)),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.fromDate(new Date(data.updatedAt))
      };
      return workoutData as Workout;
    });
    return workouts;
  } catch (error) {
    console.error('Error getting all workouts:', error);
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

    // If exercises are updated, recalculate total volume and average RPE
    if (workoutData.exercises) {
      updateData.totalVolume = calculateTotalVolume(workoutData.exercises);
      updateData.rpe = calculateAverageRPE(workoutData.exercises);
    }

    await updateDoc(workoutRef, updateData);
    console.log('Workout updated successfully:', workoutId);
    return { id: workoutId, ...updateData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation Error updating workout:', error.issues);
    } else {
      console.error('Error updating workout:', error);
    }
    throw error;
  }
};

// Delete a workout
export const deleteWorkout = async (workoutId: string) => {
  try {
    const workoutRef = doc(db, 'workouts', workoutId);
    await deleteDoc(workoutRef);
    console.log('Workout deleted successfully:', workoutId);
    return workoutId;
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
};

export const workoutService = {
  getLatestWorkout: async (userId: string): Promise<Workout | null> => {
    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(1)
    );
    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        console.log('Latest workout fetched successfully.');
        return { id: doc.id, ...doc.data() as WorkoutData };
      }
      console.log('No latest workout found.');
      return null;
    } catch (error) {
      console.error('Error fetching latest workout:', error);
      throw error;
    }
  },
  
  getWorkoutById: async (workoutId: string): Promise<Workout | null> => {
    try {
      const docRef = doc(db, 'workouts', workoutId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("Workout fetched by ID successfully.");
        return { id: docSnap.id, ...docSnap.data() as WorkoutData };
      } else {
        console.log("No such workout found!");
        return null;
      }
    } catch (error) {
      console.error("Error getting workout by ID:", error);
      throw error;
    }
  },
}; 