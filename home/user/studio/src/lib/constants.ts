/**
 * ────────────────────────────────────────────────────────────────────────────
 * 1) Exported enum `Muscle`: every muscle you reference in your app.
 *    We have added the following new member:
 *
 *      • Deltoid                = "Deltoid"
 *
 *    so that the back‐view TSX can refer to `Muscle.Deltoid` (one umbrella group).
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

  // ← Newly added umbrella “Deltoid” so the back‐view SVG (which only has one <g> for all delts)
  //    can still light up whenever any one of the three heads was worked.
  Deltoid              = "Deltoid",

  // Back
  LatissimusDorsi      = "Latissimus Dorsi",
  Trapezius            = "Trapezius",
  Rhomboids            = "Rhomboids",
  ErectorSpinae        = "Erector Spinae",
  Infraspinatus        = "Infraspinatus",

  // Arms
  BicepsBrachii        = "Biceps Brachii",
  TricepsBrachii       = "Triceps Brachii",
  TricepsLongHead      = "Triceps Long Head",     // ← already existed
  TricepsLateralHead   = "Triceps Lateral Head",  // ← already existed
  Forearms             = "Forearms",
  Brachialis           = "Brachialis",
  Brachioradialis      = "Brachioradialis",

  // Legs
  Quadriceps           = "Quadriceps",
  Hamstrings           = "Hamstrings",
  GluteusMaximus       = "Gluteus Maximus",
  GluteusMedius        = "Gluteus Medius",        // ← already existed
  Calves               = "Calves",
  Sartorius = "Sartorius",

  // Core
  UpperRectusAbdominis = "Upper Rectus Abdominis",
  LowerRectusAbdominis = "Lower Rectus Abdominis",
  Obliques             = "Obliques",
  Sternocleidomastoid  = "Sternocleidomastoid",
  SerratusAnterior     = "Serratus Anterior",     // ← already existed
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
 *    (No changes here other than the fact that now we have a new enum member Deltoid.)
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
 *    Because we now have a `Deltoid` enum‐value, we *could* map JSON strings to it,
 *    but our JSON never refers to “Deltoid” directly—rather it says “Anterior Deltoid,”
 *    “Lateral Deltoid,” or “Posterior Deltoid.”  So we do NOT need to change this
 *    mapping for “Deltoid.”  We leave it as‐is, and handle the umbrella logic in WorkoutContext.
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
    // “Anterior Deltoid”, “Lateral Deltoid”, “Posterior Deltoid” stay as‐is
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
 *    We add “Deltoid” under the natural grouping so that UI filters still “see”
 *    all deltoids (heads + umbrella) in one place if necessary.
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
  SHOULDERS: [
    Muscle.Deltoid,               // ← new umbrella key
    Muscle.AnteriorDeltoid,
    Muscle.LateralDeltoid,
    Muscle.PosteriorDeltoid,
  ],
  LEGS:      [
    Muscle.Quadriceps,
    Muscle.Hamstrings,
    Muscle.GluteusMaximus,
    Muscle.GluteusMedius,         // ← already there
    Muscle.Calves,
  ],
  ARMS:      [
    Muscle.BicepsBrachii,
    Muscle.TricepsBrachii,
    Muscle.TricepsLongHead,       // ← already there
    Muscle.TricepsLateralHead,    // ← already there
    Muscle.Forearms,
    Muscle.Brachialis,
    Muscle.Brachioradialis,
  ],
  CORE:      [
    Muscle.UpperRectusAbdominis,
    Muscle.LowerRectusAbdominis,
    Muscle.Obliques,
    Muscle.SerratusAnterior,      // ← already there
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
