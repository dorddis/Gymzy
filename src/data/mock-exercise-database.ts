// src/data/mock-exercise-database.ts

export interface ExerciseDetails {
  id: string;
  name: string;
  description: string;
  targetMuscles: string[];
  instructions?: string[];
  videoUrl?: string;
  commonMistakes?: string[];
}

export const mockExerciseDatabase: ExerciseDetails[] = [
  {
    id: 'bench_press',
    name: 'Bench Press',
    description: 'A compound exercise that targets the chest, shoulders, and triceps.',
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    instructions: [
      'Lie flat on a bench with your feet flat on the floor.',
      'Grip the barbell with hands slightly wider than shoulder-width apart.',
      'Lower the bar to your mid-chest.',
      'Push the bar back up until your arms are fully extended.'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=example_bench_press',
    commonMistakes: ['Arching the back too much.', 'Bouncing the bar off the chest.']
  },
  {
    id: 'squat',
    name: 'Squat',
    description: 'A compound exercise that primarily targets the thighs (quadriceps, hamstrings) and glutes.',
    targetMuscles: ['quadriceps', 'hamstrings', 'glutes', 'core'],
    instructions: [
      'Stand with your feet shoulder-width apart.',
      'Lower your hips as if sitting back in a chair, keeping your chest up and back straight.',
      'Go as low as comfortable, ideally until your thighs are parallel to the floor.',
      'Push back up to the starting position.'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=example_squat',
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    description: 'A compound exercise that works multiple muscle groups including the back, legs, and core.',
    targetMuscles: ['lower back', 'glutes', 'hamstrings', 'quadriceps', 'traps', 'forearms'],
    instructions: [
        'Stand with mid-foot under the barbell.',
        'Bend over and grip the bar with a shoulder-width grip.',
        'Bend your knees until your shins touch the bar.',
        'Lift your chest up and straighten your lower back.',
        'Take a big breath, hold it, and stand up with the weight.'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=example_deadlift',
  },
  {
    id: 'pull_up',
    name: 'Pull Up',
    description: 'An upper-body compound pulling exercise.',
    targetMuscles: ['latissimus dorsi', 'biceps', 'middle back', 'shoulders'],
    instructions: [
        'Grab the pull-up bar with an overhand grip, slightly wider than shoulder-width.',
        'Hang with your arms fully extended.',
        'Pull your body up until your chin is over the bar.',
        'Lower your body back to the starting position in a controlled manner.'
    ],
  }
];

// Function to find an exercise by name (case-insensitive, basic match)
export const findExercise = (name: string): ExerciseDetails | undefined => {
  if (!name) return undefined;
  const lowerCaseName = name.toLowerCase().trim();
  return mockExerciseDatabase.find(ex => ex.name.toLowerCase() === lowerCaseName || ex.id === lowerCaseName);
};
