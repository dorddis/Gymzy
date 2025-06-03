/**
 * ────────────────────────────────────────────────────────────────────────────
 * 1) Exported enum `Muscle`: every muscle you reference in your app.
 *    We give each enum member a string value (how it will display on screen).
 * ────────────────────────────────────────────────────────────────────────────
 */
export enum Muscle {
  // Chest
  PectoralisMajor      = "Pectoralis Major",

  // Shoulders
  AnteriorDeltoid      = "Anterior Deltoid",
  LateralDeltoid       = "Lateral Deltoid",
  PosteriorDeltoid     = "Posterior Deltoid",

  // Back
  LatissimusDorsi      = "Latissimus Dorsi",
  Trapezius            = "Trapezius",
  Rhomboids            = "Rhomboids",
  ErectorSpinae        = "Erector Spinae",
  Infraspinatus        = "Infraspinatus",        // ← newly added

  // Arms
  BicepsBrachii        = "Biceps Brachii",
  TricepsBrachii       = "Triceps Brachii",
  Forearms             = "Forearms",

  // Legs
  Quadriceps           = "Quadriceps",
  Hamstrings           = "Hamstrings",
  GluteusMaximus       = "Gluteus Maximus",
  Calves               = "Calves",

  // Core
  RectusAbdominis      = "Rectus Abdominis",
  Obliques             = "Obliques",
  Brachialis           = "Brachialis",
  Brachioradialis      = "Brachioradialis",
  LowerTrapezius       = "Lower Trapezius",
  SerratusAnterior     = "Serratus Anterior",
  Soleus               = "Soleus",
  Sternocleidomastoid  = "Sternocleidomastoid",
  TensorFasciaeLatae   = "Tensor Fasciae Latae",
  TeresMajor           = "Teres Major",
  ThoracolumbarFascia  = "Thoracolumbar Fascia",
  AdductorMagnus       = "Adductor Magnus",
  Semitendinosus       = "Semitendinosus",
  Gracilis             = "Gracilis",
  PeroneusLongus       = "Peroneus Longus",
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
 * 3) Import the JSON array of exercises, then coerce its strings into `Muscle` enum values.
 * ────────────────────────────────────────────────────────────────────────────
 */
import rawExercises from './exercises.json';

export const EXERCISES: Exercise[] = (rawExercises as Array<{
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}>).map((e) => ({
  id: e.id,
  name: e.name,
  primaryMuscles: e.primaryMuscles.map((m) => m as Muscle),
  secondaryMuscles: e.secondaryMuscles.map((m) => m as Muscle),
}));

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
    Muscle.Infraspinatus,    // ← Included here as well
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
  HIGH:   3000,
};
