
export enum Muscle {
  // Chest
  PectoralisMajor = "Pectoralis Major",
  // Shoulders
  AnteriorDeltoid = "Anterior Deltoid",
  LateralDeltoid = "Lateral Deltoid",
  PosteriorDeltoid = "Posterior Deltoid",
  // Back
  LatissimusDorsi = "Latissimus Dorsi",
  Trapezius = "Trapezius",
  Rhomboids = "Rhomboids",
  ErectorSpinae = "Erector Spinae",
  // Arms
  BicepsBrachii = "Biceps Brachii",
  TricepsBrachii = "Triceps Brachii",
  Forearms = "Forearms",
  // Legs
  Quadriceps = "Quadriceps",
  Hamstrings = "Hamstrings",
  GluteusMaximus = "Gluteus Maximus",
  Calves = "Calves",
  // Core
  RectusAbdominis = "Rectus Abdominis",
  Obliques = "Obliques",
}

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
}

export const EXERCISES: Exercise[] = [
  {
    id: "bench-press",
    name: "Bench Press",
    primaryMuscles: [Muscle.PectoralisMajor],
    secondaryMuscles: [Muscle.TricepsBrachii, Muscle.AnteriorDeltoid],
  },
  {
    id: "squat",
    name: "Squat",
    primaryMuscles: [Muscle.Quadriceps, Muscle.GluteusMaximus],
    secondaryMuscles: [Muscle.Hamstrings, Muscle.ErectorSpinae],
  },
  {
    id: "deadlift",
    name: "Deadlift",
    primaryMuscles: [Muscle.Hamstrings, Muscle.GluteusMaximus, Muscle.ErectorSpinae],
    secondaryMuscles: [Muscle.LatissimusDorsi, Muscle.Trapezius, Muscle.Forearms, Muscle.Quadriceps],
  },
  {
    id: "overhead-press",
    name: "Overhead Press",
    primaryMuscles: [Muscle.AnteriorDeltoid, Muscle.LateralDeltoid],
    secondaryMuscles: [Muscle.TricepsBrachii, Muscle.Trapezius],
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    primaryMuscles: [Muscle.LatissimusDorsi, Muscle.Trapezius, Muscle.Rhomboids],
    secondaryMuscles: [Muscle.BicepsBrachii, Muscle.PosteriorDeltoid],
  },
  {
    id: "pull-up",
    name: "Pull-up / Lat Pulldown",
    primaryMuscles: [Muscle.LatissimusDorsi],
    secondaryMuscles: [Muscle.BicepsBrachii, Muscle.Trapezius, Muscle.Forearms],
  },
  {
    id: "push-up",
    name: "Push-up",
    primaryMuscles: [Muscle.PectoralisMajor],
    secondaryMuscles: [Muscle.TricepsBrachii, Muscle.AnteriorDeltoid, Muscle.RectusAbdominis],
  },
  {
    id: "dumbbell-lunges",
    name: "Dumbbell Lunges",
    primaryMuscles: [Muscle.Quadriceps, Muscle.GluteusMaximus],
    secondaryMuscles: [Muscle.Hamstrings],
  },
  {
    id: "bicep-curl",
    name: "Bicep Curl",
    primaryMuscles: [Muscle.BicepsBrachii],
    secondaryMuscles: [Muscle.Forearms],
  },
  {
    id: "tricep-extension",
    name: "Tricep Extension",
    primaryMuscles: [Muscle.TricepsBrachii],
    secondaryMuscles: [],
  },
];

export const MAJOR_MUSCLE_GROUPS = {
  CHEST: [Muscle.PectoralisMajor],
  BACK: [Muscle.LatissimusDorsi, Muscle.Trapezius, Muscle.Rhomboids, Muscle.ErectorSpinae],
  SHOULDERS: [Muscle.AnteriorDeltoid, Muscle.LateralDeltoid, Muscle.PosteriorDeltoid],
  LEGS: [Muscle.Quadriceps, Muscle.Hamstrings, Muscle.GluteusMaximus, Muscle.Calves],
  ARMS: [Muscle.BicepsBrachii, Muscle.TricepsBrachii, Muscle.Forearms],
  CORE: [Muscle.RectusAbdominis, Muscle.Obliques],
};

// Arbitrary thresholds for muscle volume to trigger alerts or visual cues
export const MUSCLE_VOLUME_THRESHOLDS = {
  LOW: 500,
  MEDIUM: 1500,
  HIGH: 3000, // Example: Overtraining threshold for chest
};
