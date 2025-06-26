import { Muscle } from '@/lib/constants';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  category?: string;
  equipment?: string;
  instructions?: string[];
  tips?: string[];
  imageUrl?: string;
  videoUrl?: string;
}

export interface ExerciseSet {
  weight: number;
  reps: number;
  rpe: number | undefined;
  isWarmup: boolean;
  isExecuted?: boolean;
}

export interface ExerciseWithSets extends Exercise {
  sets: ExerciseSet[];
  notes?: string;
  order?: number;
  specialSetType?: 'superset' | 'circuit' | 'dropset' | 'restpause' | 'cluster' | 'tempo';
  specialSetGroup?: string; // ID to group exercises in the same special set
  specialSetParameters?: {
    restBetweenExercises?: number;
    restBetweenSets?: number;
    rounds?: number;
    tempo?: string;
    dropPercentages?: number[];
  };
}