/**
 * ────────────────────────────────────────────────────────────────────────────
 * 1) Exported enum `Muscle`: every muscle you reference in your app.
 *    We have added the following new members to satisfy the TODOs:
 *
 *    • GluteusMedius          = "Gluteus Medius"
 *    • TricepsLongHead        = "Triceps Long Head"
 *    • TricepsLateralHead     = "Triceps Lateral Head"
 *
 *    (All other enum members remain exactly as before.)
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
  Infraspinatus        = "Infraspinatus",

  // Arms
  BicepsBrachii        = "Biceps Brachii",
  TricepsBrachii       = "Triceps Brachii",
  TricepsLongHead      = "Triceps Long Head",     // ← NEW
  TricepsLateralHead   = "Triceps Lateral Head",  // ← NEW
  Forearms             = "Forearms",
  Brachialis           = "Brachialis",
  Brachioradialis      = "Brachioradialis",

  // Legs
  Quadriceps           = "Quadriceps",
  Hamstrings           = "Hamstrings",
  GluteusMaximus       = "Gluteus Maximus",
  GluteusMedius        = "Gluteus Medius",         // ← NEW
  Calves               = "Calves",

  // Core
  UpperRectusAbdominis = "Upper Rectus Abdominis",
  LowerRectusAbdominis = "Lower Rectus Abdominis",
  Obliques             = "Obliques",
  Sternocleidomastoid  = "Sternocleidomastoid",
  SerratusAnterior     = "Serratus Anterior",
  TensorFasciaeLatae   = "Tensor Fasciae Latae",
  TeresMajor           = "Teres Major",
  ThoracolumbarFascia  = "Thoracolumbar Fascia",
  AdductorMagnus       = "Adductor Magnus",
  Semitendinosus       = "Semitendinosus",
  Gracilis             = "Gracilis",
  PeroneusLongus       = "Peroneus Longus",
  LowerTrapezius       = "Lower Trapezius",
  Soleus               = "Soleus",
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 2) Interface for an Exercise (used by WorkoutContext).
 *    Each exercise has an id, name, list of primary muscles, and list of secondary muscles.
 *    (No changes needed here unless your JSON refers to “Gluteus Medius” or “Triceps Long Head.”)
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
 *    If your raw JSON ever says "Gluteus Medius" or "Triceps Long Head"/"Triceps Lateral Head",
 *    those will now correctly map to the new enum members (GluteusMedius, etc).
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

  // Whenever JSON says “Rectus Abdominis,” split into upper + lower.
  primaryMuscles: e.primaryMuscles.flatMap((m) => {
    if (m === 'Rectus Abdominis') {
      return [Muscle.UpperRectusAbdominis, Muscle.LowerRectusAbdominis];
    }
    if (m === 'Gluteus Medius') {
      return [Muscle.GluteusMedius];
    }
    if (m === 'Triceps Long Head') {
      return [Muscle.TricepsLongHead];
    }
    if (m === 'Triceps Lateral Head') {
      return [Muscle.TricepsLateralHead];
    }
    return [m as Muscle];
  }),

  secondaryMuscles: e.secondaryMuscles.flatMap((m) => {
    if (m === 'Rectus Abdominis') {
      return [Muscle.UpperRectusAbdominis, Muscle.LowerRectusAbdominis];
    }
    if (m === 'Gluteus Medius') {
      return [Muscle.GluteusMedius];
    }
    if (m === 'Triceps Long Head') {
      return [Muscle.TricepsLongHead];
    }
    if (m === 'Triceps Lateral Head') {
      return [Muscle.TricepsLateralHead];
    }
    return [m as Muscle];
  }),
}));

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 4) Major muscle‐group grouping (for filtering/UI).
 *    We add “GluteusMedius”, “TricepsLongHead”, and “TricepsLateralHead” under the natural groupings.
 * ────────────────────────────────────────────────────────────────────────────
 */
export const MAJOR_MUSCLE_GROUPS = {
  CHEST:     [Muscle.PectoralisMajor],
  BACK:      [
    Muscle.LatissimusDorsi,
    Muscle.Trapezius,
    Muscle.Rhomboids,
    Muscle.ErectorSpinae,
    Muscle.Infraspinatus,
  ],
  SHOULDERS: [Muscle.AnteriorDeltoid, Muscle.LateralDeltoid, Muscle.PosteriorDeltoid],
  LEGS:      [
    Muscle.Quadriceps,
    Muscle.Hamstrings,
    Muscle.GluteusMaximus,
    Muscle.GluteusMedius,   // ← NEW
    Muscle.Calves,
  ],
  ARMS:      [
    Muscle.BicepsBrachii,
    Muscle.TricepsBrachii,
    Muscle.TricepsLongHead,   // ← NEW (optional display if you want a separate line)
    Muscle.TricepsLateralHead,// ← NEW
    Muscle.Forearms,
    Muscle.Brachialis,
    Muscle.Brachioradialis,
  ],
  CORE:      [
    Muscle.UpperRectusAbdominis,
    Muscle.LowerRectusAbdominis,
    Muscle.Obliques,
    Muscle.SerratusAnterior,
    Muscle.ThoracolumbarFascia,
  ],
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
