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
    // Common parameters
    restBetweenExercises?: number;
    restBetweenSets?: number;
    rounds?: number;

    // Circuit-specific parameters
    workTime?: number; // seconds per exercise in circuit
    restTime?: number; // seconds between exercises in circuit
    restBetweenRounds?: number; // seconds between circuit rounds
    exerciseOrder?: 'sequential' | 'random';

    // Drop set parameters
    dropPercentages?: number[];

    // Tempo parameters
    tempo?: string;

    // Rest-pause parameters
    restPauseDuration?: number; // seconds for mini-rest
    miniSets?: number; // number of mini-sets after failure

    // Cluster parameters
    clusterReps?: number[]; // reps per cluster
    clusterRest?: number; // seconds between clusters
  };
}