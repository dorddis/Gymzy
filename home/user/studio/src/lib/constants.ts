// src/lib/constants.ts

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 1) Exported enum `Muscle`: every muscle you reference in your app.
 *    We give each enum member a string value (how it will display on screen).
 * ────────────────────────────────────────────────────────────────────────────
 */
export enum Muscle {
  // Chest
  PectoralisMajor = "Pectoralis Major",

  // Shoulders
  AnteriorDeltoid  = "Anterior Deltoid",
  LateralDeltoid   = "Lateral Deltoid",
  PosteriorDeltoid = "Posterior Deltoid",

  // Back
  LatissimusDorsi  = "Latissimus Dorsi",
  Trapezius        = "Trapezius",
  Rhomboids        = "Rhomboids",
  ErectorSpinae    = "Erector Spinae",
  Infraspinatus    = "Infraspinatus",        // ← Newly added

  // Arms
  BicepsBrachii    = "Biceps Brachii",
  TricepsBrachii   = "Triceps Brachii",
  Forearms         = "Forearms",

  // Legs
  Quadriceps       = "Quadriceps",
  Hamstrings       = "Hamstrings",
  GluteusMaximus   = "Gluteus Maximus",
  Calves           = "Calves",

  // Core
  RectusAbdominis       = "Rectus Abdominis",
  Obliques              = "Obliques",
  Brachialis            = "Brachialis",
  Brachioradialis       = "Brachioradialis",
  LowerTrapezius        = "Lower Trapezius",
  SerratusAnterior      = "Serratus Anterior",
  Soleus                = "Soleus",
  Sternocleidomastoid   = "Sternocleidomastoid",
  TensorFasciaeLatae    = "Tensor Fasciae Latae",
  TeresMajor            = "Teres Major",
  ThoracolumbarFascia   = "Thoracolumbar Fascia",
  AdductorMagnus        = "Adductor Magnus",
  Semitendinosus        = "Semitendinosus",
  Gracilis              = "Gracilis",
  PeroneusLongus        = "Peroneus Longus",
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 2) Interface for an Exercise (used by WorkoutContext).
 *    Each exercise has an id, name, list of primary muscles, and list of secondary muscles.
 * ────────────────────────────────────────────────────────────────────────────
 */
export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 3) A hard‐coded list of Exercises.  Each references `Muscle.<Enum>`.
 * ────────────────────────────────────────────────────────────────────────────
 */
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
    secondaryMuscles: [
      Muscle.LatissimusDorsi,
      Muscle.Trapezius,
      Muscle.Forearms,
      Muscle.Quadriceps,
    ],
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
    secondaryMuscles: [
      Muscle.TricepsBrachii,
      Muscle.AnteriorDeltoid,
      Muscle.RectusAbdominis,
    ],
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

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 4) Major muscle‐group grouping (for filtering/UI).
 * ────────────────────────────────────────────────────────────────────────────
 */
export const MAJOR_MUSCLE_GROUPS = {
  CHEST:     [Muscle.PectoralisMajor],
  BACK:      [
    Muscle.LatissimusDorsi,
    Muscle.Trapezius,
    Muscle.Rhomboids,
    Muscle.ErectorSpinae,
    Muscle.Infraspinatus,    // ← Added here
  ],
  SHOULDERS: [Muscle.AnteriorDeltoid, Muscle.LateralDeltoid, Muscle.PosteriorDeltoid],
  LEGS:      [Muscle.Quadriceps, Muscle.Hamstrings, Muscle.GluteusMaximus, Muscle.Calves],
  ARMS:      [Muscle.BicepsBrachii, Muscle.TricepsBrachii, Muscle.Forearms],
  CORE:      [Muscle.RectusAbdominis, Muscle.Obliques],
};

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 5) Arbitrary thresholds for muscle‐volume alerts/visual cues.
 * ────────────────────────────────────────────────────────────────────────────
 */
export const MUSCLE_VOLUME_THRESHOLDS = {
  LOW:    500,
  MEDIUM: 1500,
  HIGH:   3000, // Example: Overtraining threshold for chest
};
