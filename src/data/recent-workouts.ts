export interface RecentWorkout {
  id: string;
  title: string;
  date: string;
  exercises: {
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }[];
  totalVolume: number;
  rpe: number;
}

export const recentWorkouts: RecentWorkout[] = [
  {
    id: '1',
    title: 'Upper Body Strength',
    date: '2 hours ago',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 185 },
      { name: 'Overhead Press', sets: 3, reps: 10, weight: 135 },
      { name: 'Pull-ups', sets: 3, reps: 12, weight: 0 }
    ],
    totalVolume: 12500,
    rpe: 8
  },
  {
    id: '2',
    title: 'Leg Day',
    date: 'Yesterday',
    exercises: [
      { name: 'Squats', sets: 5, reps: 5, weight: 225 },
      { name: 'Romanian Deadlifts', sets: 4, reps: 8, weight: 185 },
      { name: 'Leg Press', sets: 3, reps: 12, weight: 315 }
    ],
    totalVolume: 18750,
    rpe: 9
  },
  {
    id: '3',
    title: 'Push Day',
    date: '2 days ago',
    exercises: [
      { name: 'Incline Bench', sets: 4, reps: 8, weight: 155 },
      { name: 'Shoulder Press', sets: 3, reps: 10, weight: 125 },
      { name: 'Tricep Pushdowns', sets: 3, reps: 15, weight: 45 }
    ],
    totalVolume: 10200,
    rpe: 7
  }
]; 