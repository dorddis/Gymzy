"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useMemo
} from 'react';
import { Muscle, EXERCISES, Exercise } from '../../home/user/studio/src/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { Workout, getRecentWorkouts, createWorkout, updateWorkout, deleteWorkout } from '@/services/workout-service';
import { ExerciseWithSets } from '@/types/exercise';

interface LoggedWorkout {
  id: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  date: Date;
  volume: number;
  targetedMuscles: Muscle[];
}

export type MuscleVolumes = Record<Muscle, number>;

interface WorkoutContextType {
  recentWorkouts: Workout[];
  loading: boolean;
  error: Error | null;
  addWorkout: (workoutData: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWorkout: (workoutId: string, workoutData: Partial<Workout>) => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  refreshWorkouts: () => Promise<void>;
  muscleVolumes: MuscleVolumes;
  currentWorkoutExercises: ExerciseWithSets[];
  setCurrentWorkoutExercises: React.Dispatch<React.SetStateAction<ExerciseWithSets[]>>;
  totalVolume: number;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// Helper to initialize muscle volumes with all muscles set to 0
const initializeMuscleVolumes = (): MuscleVolumes => {
  return Object.values(Muscle).reduce((acc, muscle) => {
    acc[muscle] = 0;
    return acc;
  }, {} as MuscleVolumes);
};

// Helper to calculate muscle volumes from a list of workouts
const calculateMuscleVolumes = (workouts: Workout[]): MuscleVolumes => {
  const volumes = initializeMuscleVolumes();

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      const exerciseDetails = EXERCISES.find(e => e.id === exercise.exerciseId);
      if (exerciseDetails) {
        const totalExerciseVolume = exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
        
        // Add volume to primary muscles
        if (exerciseDetails.primaryMuscles) {
          exerciseDetails.primaryMuscles.forEach(muscle => {
            volumes[muscle] = (volumes[muscle] || 0) + totalExerciseVolume;
          });
        }
        
        // Add volume to secondary muscles
        if (exerciseDetails.secondaryMuscles) {
          exerciseDetails.secondaryMuscles.forEach(muscle => {
            volumes[muscle] = (volumes[muscle] || 0) + (totalExerciseVolume * 0.5); // Secondary muscles get 50% of the volume
          });
        }
      }
    });
  });
  return volumes;
};

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [calculatedMuscleVolumes, setCalculatedMuscleVolumes] = useState<MuscleVolumes>(initializeMuscleVolumes());
  const [currentWorkoutExercises, setCurrentWorkoutExercises] = useState<ExerciseWithSets[]>([]);

  const totalVolume = useMemo(() => {
    return currentWorkoutExercises.reduce((totalExerciseVolume, exercise) => {
      const exerciseVolume = exercise.sets.reduce((totalSetVolume, set) => {
        return totalSetVolume + (set.weight * set.reps);
      }, 0);
      return totalExerciseVolume + exerciseVolume;
    }, 0);
  }, [currentWorkoutExercises]);

  // Calculate muscle volumes from current workout exercises
  const currentWorkoutMuscleVolumes = useMemo(() => {
    const volumes = initializeMuscleVolumes();

    currentWorkoutExercises.forEach(exercise => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => {
        // Only count volume from executed sets
        return sum + (set.isExecuted ? set.weight * set.reps : 0);
      }, 0);

      // Add volume to primary muscles
      if (exercise.primaryMuscles) {
        exercise.primaryMuscles.forEach(muscle => {
          volumes[muscle] = (volumes[muscle] || 0) + (exerciseVolume * 0.7); // Primary muscles get 70% of volume
        });
      }
      
      // Add volume to secondary muscles
      if (exercise.secondaryMuscles) {
        exercise.secondaryMuscles.forEach(muscle => {
          volumes[muscle] = (volumes[muscle] || 0) + (exerciseVolume * 0.3); // Secondary muscles get 30% of volume
        });
      }
    });

    return volumes;
  }, [currentWorkoutExercises]);

  // Combine historical and current workout muscle volumes
  const combinedMuscleVolumes = useMemo(() => {
    const volumes = initializeMuscleVolumes();
    
    // Add historical volumes
    Object.entries(calculatedMuscleVolumes).forEach(([muscle, volume]) => {
      volumes[muscle as Muscle] = volume;
    });
    
    // Add current workout volumes
    Object.entries(currentWorkoutMuscleVolumes).forEach(([muscle, volume]) => {
      volumes[muscle as Muscle] += volume;
    });

    return volumes;
  }, [calculatedMuscleVolumes, currentWorkoutMuscleVolumes]);

  const fetchWorkouts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const workouts = await getRecentWorkouts(user.uid);
      setRecentWorkouts(workouts);
      setCalculatedMuscleVolumes(calculateMuscleVolumes(workouts));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch workouts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [user]);

  const addWorkout = async (workoutData: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      const newWorkout = await createWorkout({
        ...workoutData,
        userId: user.uid
      });
      setRecentWorkouts(prev => [newWorkout, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add workout'));
      throw err;
    }
  };

  const updateWorkoutHandler = async (workoutId: string, workoutData: Partial<Workout>) => {
    try {
      const updatedWorkout = await updateWorkout(workoutId, workoutData);
      setRecentWorkouts(prev => 
        prev.map(workout => 
          workout.id === workoutId ? { ...workout, ...updatedWorkout } : workout
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update workout'));
      throw err;
    }
  };

  const deleteWorkoutHandler = async (workoutId: string) => {
    try {
      await deleteWorkout(workoutId);
      setRecentWorkouts(prev => prev.filter(workout => workout.id !== workoutId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete workout'));
      throw err;
    }
  };

  const value = {
    recentWorkouts,
    loading,
    error,
    addWorkout,
    updateWorkout: updateWorkoutHandler,
    deleteWorkout: deleteWorkoutHandler,
    refreshWorkouts: fetchWorkouts,
    muscleVolumes: combinedMuscleVolumes,
    currentWorkoutExercises,
    setCurrentWorkoutExercises,
    totalVolume,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
