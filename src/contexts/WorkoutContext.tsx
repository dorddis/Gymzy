
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback } from 'react';
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

type MuscleVolumes = { [key in Muscle]?: number };

interface WorkoutContextType {
  loggedWorkouts: LoggedWorkout[];
  muscleVolumes: MuscleVolumes;
  addWorkout: (workoutData: { exerciseId: string; sets: number; reps: number; weight: number }) => void;
  getExerciseById: (id: string) => Exercise | undefined;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [loggedWorkouts, setLoggedWorkouts] = useState<LoggedWorkout[]>([]);
  const [muscleVolumes, setMuscleVolumes] = useState<MuscleVolumes>({});

  const getExerciseById = useCallback((id: string): Exercise | undefined => {
    return EXERCISES.find(ex => ex.id === id);
  }, []);

  const addWorkout = useCallback((workoutData: { exerciseId: string; sets: number; reps: number; weight: number }) => {
    const exercise = getExerciseById(workoutData.exerciseId);
    if (!exercise) {
      console.error("Exercise not found for ID:", workoutData.exerciseId);
      return;
    }

    const volume = workoutData.sets * workoutData.reps * (workoutData.weight > 0 ? workoutData.weight : 1); // Ensure volume is not 0 for bodyweight
    const newWorkout: LoggedWorkout = {
      id: Date.now().toString(), // Simple unique ID
      ...workoutData,
      date: new Date(),
      volume,
      targetedMuscles: [...exercise.primaryMuscles, ...exercise.secondaryMuscles],
    };

    setLoggedWorkouts(prevWorkouts => [...prevWorkouts, newWorkout]);

    setMuscleVolumes(prevVolumes => {
      const updatedVolumes = { ...prevVolumes };
      const allMusclesTargeted = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
      
      allMusclesTargeted.forEach(muscle => {
        // Primary muscles get full volume, secondary get half (example distribution)
        const volumeShare = exercise.primaryMuscles.includes(muscle) ? volume : volume * 0.5;
        updatedVolumes[muscle] = (updatedVolumes[muscle] || 0) + volumeShare;
      });
      return updatedVolumes;
    });
  }, [getExerciseById]);

  return (
    <WorkoutContext.Provider value={{ loggedWorkouts, muscleVolumes, addWorkout, getExerciseById }}>
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
