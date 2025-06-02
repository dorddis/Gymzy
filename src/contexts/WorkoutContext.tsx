// src/contexts/WorkoutContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Muscle, EXERCISES, Exercise } from '@/lib/constants';

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

export type MuscleVolumes = { [key in Muscle]?: number };

interface WorkoutContextType {
  loggedWorkouts: LoggedWorkout[];
  muscleVolumes: MuscleVolumes;
  addWorkout: (workoutData: {
    exerciseId: string;
    sets: number;
    reps: number;
    weight: number;
  }) => void;
  getExerciseById: (id: string) => Exercise | undefined;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [loggedWorkouts, setLoggedWorkouts] = useState<LoggedWorkout[]>([]);
  const [muscleVolumes, setMuscleVolumes] = useState<MuscleVolumes>({});

  /**
   * getExerciseById
   *  - We guard against EXERCISES being undefined or non-array.
   */
  const getExerciseById = useCallback((id: string): Exercise | undefined => {
    const allExercises: Exercise[] = Array.isArray(EXERCISES) ? EXERCISES : [];
    return allExercises.find((ex) => ex.id === id);
  }, []);

  /**
   * addWorkout
   *  - Logs a new workout and updates muscleVolumes accordingly.
   */
  const addWorkout = useCallback(
    (workoutData: { exerciseId: string; sets: number; reps: number; weight: number }) => {
      const exercise = getExerciseById(workoutData.exerciseId);
      if (!exercise) {
        console.error("⚠️ [WorkoutContext] Exercise not found for ID:", workoutData.exerciseId);
        return;
      }

      // Calculate volume = sets × reps × (weight or 1 if weight=0)
      const volume =
        workoutData.sets * workoutData.reps * (workoutData.weight > 0 ? workoutData.weight : 1);

      const newWorkout: LoggedWorkout = {
        id: Date.now().toString(),
        ...workoutData,
        date: new Date(),
        volume,
        targetedMuscles: [...exercise.primaryMuscles, ...exercise.secondaryMuscles],
      };

      setLoggedWorkouts((prev) => [...prev, newWorkout]);

      // Update muscleVolumes: primary muscles get full, secondary get half
      setMuscleVolumes((prevVolumes) => {
        const updated: MuscleVolumes = { ...prevVolumes };
        const allTargets = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
        allTargets.forEach((m) => {
          const share = exercise.primaryMuscles.includes(m) ? volume : volume * 0.5;
          updated[m] = (updated[m] || 0) + share;
        });
        return updated;
      });
    },
    [getExerciseById]
  );

  return (
    <WorkoutContext.Provider
      value={{ loggedWorkouts, muscleVolumes, addWorkout, getExerciseById }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = (): WorkoutContextType => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
