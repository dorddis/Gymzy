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
  TricepsLongHead      = "Triceps Long Head",
  TricepsLateralHead   = "Triceps Lateral Head",
  Forearms             = "Forearms",
  Brachialis           = "Brachialis",
  Brachioradialis      = "Brachioradialis",

  // Legs
  Quadriceps           = "Quadriceps",
  Hamstrings           = "Hamstrings",
  GluteusMaximus       = "Gluteus Maximus",
  GluteusMedius        = "Gluteus Medius",
  Calves               = "Calves",
  Sartorius            = "Sartorius",

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
  primaryMuscles: e.primaryMuscles.map(m => {
    // Map string muscle names to Muscle enum values
    switch (m) {
      case 'Pectoralis Major': return Muscle.PectoralisMajor;
      case 'Anterior Deltoid': return Muscle.AnteriorDeltoid;
      case 'Lateral Deltoid': return Muscle.LateralDeltoid;
      case 'Posterior Deltoid': return Muscle.PosteriorDeltoid;
      case 'Deltoid': return Muscle.Deltoid;
      case 'Latissimus Dorsi': return Muscle.LatissimusDorsi;
      case 'Trapezius': return Muscle.Trapezius;
      case 'Rhomboids': return Muscle.Rhomboids;
      case 'Erector Spinae': return Muscle.ErectorSpinae;
      case 'Infraspinatus': return Muscle.Infraspinatus;
      case 'Biceps Brachii': return Muscle.BicepsBrachii;
      case 'Triceps Brachii': return Muscle.TricepsBrachii;
      case 'Triceps Long Head': return Muscle.TricepsLongHead;
      case 'Triceps Lateral Head': return Muscle.TricepsLateralHead;
      case 'Forearms': return Muscle.Forearms;
      case 'Brachialis': return Muscle.Brachialis;
      case 'Brachioradialis': return Muscle.Brachioradialis;
      case 'Quadriceps': return Muscle.Quadriceps;
      case 'Hamstrings': return Muscle.Hamstrings;
      case 'Gluteus Maximus': return Muscle.GluteusMaximus;
      case 'Gluteus Medius': return Muscle.GluteusMedius;
      case 'Calves': return Muscle.Calves;
      case 'Sartorius': return Muscle.Sartorius;
      case 'Upper Rectus Abdominis': return Muscle.UpperRectusAbdominis;
      case 'Lower Rectus Abdominis': return Muscle.LowerRectusAbdominis;
      case 'Obliques': return Muscle.Obliques;
      case 'Sternocleidomastoid': return Muscle.Sternocleidomastoid;
      case 'Serratus Anterior': return Muscle.SerratusAnterior;
      case 'Tensor Fasciae Latae': return Muscle.TensorFasciaeLatae;
      case 'Teres Major': return Muscle.TeresMajor;
      case 'Thoracolumbar Fascia': return Muscle.ThoracolumbarFascia;
      case 'Adductor Magnus': return Muscle.AdductorMagnus;
      case 'Semitendinosus': return Muscle.Semitendinosus;
      case 'Gracilis': return Muscle.Gracilis;
      case 'Peroneus Longus': return Muscle.PeroneusLongus;
      case 'Lower Trapezius': return Muscle.LowerTrapezius;
      case 'Soleus': return Muscle.Soleus;
      default: throw new Error(`Unknown muscle: ${m}`);
    }
  }),
  secondaryMuscles: e.secondaryMuscles.map(m => {
    // Map string muscle names to Muscle enum values
    switch (m) {
      case 'Pectoralis Major': return Muscle.PectoralisMajor;
      case 'Anterior Deltoid': return Muscle.AnteriorDeltoid;
      case 'Lateral Deltoid': return Muscle.LateralDeltoid;
      case 'Posterior Deltoid': return Muscle.PosteriorDeltoid;
      case 'Deltoid': return Muscle.Deltoid;
      case 'Latissimus Dorsi': return Muscle.LatissimusDorsi;
      case 'Trapezius': return Muscle.Trapezius;
      case 'Rhomboids': return Muscle.Rhomboids;
      case 'Erector Spinae': return Muscle.ErectorSpinae;
      case 'Infraspinatus': return Muscle.Infraspinatus;
      case 'Biceps Brachii': return Muscle.BicepsBrachii;
      case 'Triceps Brachii': return Muscle.TricepsBrachii;
      case 'Triceps Long Head': return Muscle.TricepsLongHead;
      case 'Triceps Lateral Head': return Muscle.TricepsLateralHead;
      case 'Forearms': return Muscle.Forearms;
      case 'Brachialis': return Muscle.Brachialis;
      case 'Brachioradialis': return Muscle.Brachioradialis;
      case 'Quadriceps': return Muscle.Quadriceps;
      case 'Hamstrings': return Muscle.Hamstrings;
      case 'Gluteus Maximus': return Muscle.GluteusMaximus;
      case 'Gluteus Medius': return Muscle.GluteusMedius;
      case 'Calves': return Muscle.Calves;
      case 'Sartorius': return Muscle.Sartorius;
      case 'Upper Rectus Abdominis': return Muscle.UpperRectusAbdominis;
      case 'Lower Rectus Abdominis': return Muscle.LowerRectusAbdominis;
      case 'Obliques': return Muscle.Obliques;
      case 'Sternocleidomastoid': return Muscle.Sternocleidomastoid;
      case 'Serratus Anterior': return Muscle.SerratusAnterior;
      case 'Tensor Fasciae Latae': return Muscle.TensorFasciaeLatae;
      case 'Teres Major': return Muscle.TeresMajor;
      case 'Thoracolumbar Fascia': return Muscle.ThoracolumbarFascia;
      case 'Adductor Magnus': return Muscle.AdductorMagnus;
      case 'Semitendinosus': return Muscle.Semitendinosus;
      case 'Gracilis': return Muscle.Gracilis;
      case 'Peroneus Longus': return Muscle.PeroneusLongus;
      case 'Lower Trapezius': return Muscle.LowerTrapezius;
      case 'Soleus': return Muscle.Soleus;
      default: throw new Error(`Unknown muscle: ${m}`);
    }
  }),
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
    Muscle.Infraspinatus,
  ],
  SHOULDERS: [
    Muscle.Deltoid,
    Muscle.AnteriorDeltoid,
    Muscle.LateralDeltoid,
    Muscle.PosteriorDeltoid,
  ],
  LEGS:      [
    Muscle.Quadriceps,
    Muscle.Hamstrings,
    Muscle.GluteusMaximus,
    Muscle.GluteusMedius,
    Muscle.Calves,
  ],
  ARMS:      [
    Muscle.BicepsBrachii,
    Muscle.TricepsBrachii,
    Muscle.TricepsLongHead,
    Muscle.TricepsLateralHead,
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