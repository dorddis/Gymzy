'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { SVGProps } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Scan, UserRound, RotateCcwSquare, Zap } from 'lucide-react';

import { useWorkout } from '@/contexts/WorkoutContext';
import { Muscle, MUSCLE_VOLUME_THRESHOLDS } from '@/lib/constants';

/* ───────────────────────────────────────────────────────────────────────────
   1) Import the two full‐body SVGs (front & back) as React components.
      These single SVGs each already contain all of the muscle‐group <g> IDs
      that we’ll dynamically show/hide via opacity.
──────────────────────────────────────────────────────────────────────────── */
import FrontFullBody from '@/assets/images/front-full-body-with-all-muscles-showing.svg';
import BackFullBody from '@/assets/images/back-full-body-with-all-muscles-showing.svg';

/**
 * Given a numeric volume, return activation level + Tailwind‐class color.
 */
const getMuscleActivationLevel = (
  volume: number | undefined
): { level: 'Low' | 'Medium' | 'High' | 'None'; color: string } => {
  if (volume === undefined || volume === 0) {
    return { level: 'None', color: 'bg-muted/20' };
  }
  if (volume < MUSCLE_VOLUME_THRESHOLDS.LOW) {
    return { level: 'Low', color: 'bg-green-500/30' };
  }
  if (volume < MUSCLE_VOLUME_THRESHOLDS.MEDIUM) {
    return { level: 'Medium', color: 'bg-yellow-500/40' };
  }
  return { level: 'High', color: 'bg-red-500/50' };
};

/**
 * AnatomyFigureSvg
 *  - Renders either the front or back full‐body SVG (imported above),
 *    then, via a ref + useEffect, toggles the opacity of each <g id="...">
 *    inside that SVG according to its activation level.
 *
 * Implementation detail for “Option B”:
 *   • We build two maps (front & back), each keyed by `Muscle` and pointing to
 *     either a single `string` (one `<g>` ID) or an array of `string[]` (multiple sub‐IDs).
 *   • In the effect, we first force‐hide every single ID in the current map (by setting
 *     `opacity=0`). Then, for each “relevantMuscle” that has volume>0, we re‐set
 *     its opacity to 0.3 / 0.6 / 1.0.
 */
const AnatomyFigureSvg = (props: {
  view: 'front' | 'back';
  muscleVolumes: Record<Muscle, number | undefined>;
  relevantMuscles: Muscle[];
}) => {
  const { view, muscleVolumes, relevantMuscles } = props;
  const svgRef = useRef<SVGSVGElement>(null);

  // 1) Pick the correct full‐body component:
  const BodySvg = view === 'front' ? FrontFullBody : BackFullBody;

  /* ───────────────────────────────────────────────────────────────
     2) Build a map from Muscle enum → one or more `<g id="...">` strings
        for the *back*‐view SVG.  Each key is a Muscle enum, and each RHS is
        either a single string (one `<g>`) or an array of strings (if the
        “muscle” is actually split into multiple sub‐<g> groups in the SVG).
  ─────────────────────────────────────────────────────────────── */
  const backMuscleIdMap: Partial<Record<Muscle, string | string[]>> = {
    [Muscle.Rhomboids]:
      'Rhomboid_major_00000153702420119838252620000014513967375993411263_',

    // HAMSTRINGS: multiple sub‐groups
    [Muscle.Hamstrings]: [
      'Semimembranosis_00000165197940537239056910000018339456362161962915_',
      'Semi_Tendinosis_00000142172608923587160350000008002679039365734793_',
      'Upper_inner_hamstring_00000155141996103184447130000003953608675083121284_',
      'Biceps_Femoris_00000110447600570690947540000000638541115458994341_',
    ],

    [Muscle.Trapezius]:
      'Trapz_00000086658569290832975040000006959360490215844261_',
    [Muscle.LowerTrapezius]:
      'Middle_and_lower_trapz_00000011030372104423980000000004308217814190120081_',

    [Muscle.LatissimusDorsi]:
      'Lats_00000133492815442984477070000001790843316009520005_',

    /*
      DELTOIDS (all three heads share the same “Delts_…” ID on the back)
      => merged into a single entry here (these are kept for future implementation):
      [Muscle.AnteriorDeltoid]: // we’ll use this one key for all three heads on the back
      [Muscle.LateralDeltoid]:
      [Muscle.PosteriorDeltoid]:
    */

    /*TODO: make changes in constants and context files to map activation to
    deltiods muscle 
    */
    [Muscle.Deltoid]:
      'Delts_00000037683310307467639390000007902456789317736638_',

    [Muscle.TeresMajor]:
      'Teres_Major_00000116932973775553672460000017841647355507566270_',

    [Muscle.Infraspinatus]:
      'Infraspinatus_00000055693351133629568060000011005395473393824395_',

    /*
      On the back, the SVG only has one <g> for “TricepsBrachii.”
      The separate heads do NOT exist here. We therefore map the umbrella term.
    */
    [Muscle.TricepsBrachii]:
      'Triceps_00000058563430122785195830000004356675806786654858_',

    [Muscle.Obliques]: [
      'Obliques_00000144307680268788205310000005818624216599975297_',
      'Upper_obliques_00000163063841218330492000000005773978221908945313_',
    ],

    [Muscle.Forearms]: [
      'Extensor_carpi_00000116200407099860938660000003262073282377889712_',
      'Extensor_digitorum_00000071523930808613392550000017694714289508163976_',
      'Extensor_carpi_ulnaris_00000134217785543749064480000005604883019983209609_',
      'Flexor_digitorium__x28_Under_arm_x29__00000159435954906204878840000011072027011836770979_',
    ],

    [Muscle.GluteusMaximus]:
      'Gluteus_maximus_00000168110655002960868070000014188754410659059374_',
    [Muscle.GluteusMedius]:
      'Gluteus_medius_00000112621038774864745760000016539011443425383349_',

    [Muscle.ThoracolumbarFascia]:
      'Thoracolumbar_00000067950730854538543580000014263760795646897319_',

    [Muscle.Soleus]: [
      'Soleus_00000162330102282724997570000015371067798349489321_',
      'Soleus_00000162330102282724997570000015371067798349489349489321_',
    ],

    [Muscle.Calves]:
      'Claves_00000142896635816991424760000005189009876859777974_',

    [Muscle.Quadriceps]:
      'Outer_quads_00000121269285701693319920000012886749065288244405_',
  };

  /* ───────────────────────────────────────────────────────────────
     3) Front‐view map—using the `<g id="…">` strings from your *front* SVG.
     Each key is the same `Muscle` enum value, but the RHS is either a single
     string or an array of strings (if that muscle’s shape is split into multiple
     <g> sub‐groups in the SVG).  Here we explicitly separate “upper vs. lower abs,”
     “gluteus medius vs. maximus,” etc.
  ─────────────────────────────────────────────────────────────── */
  const frontMuscleIdMap: Partial<Record<Muscle, string | string[]>> = {
    // ───────────────────────────────────────────────────────────
    // 1) CHEST
    [Muscle.PectoralisMajor]:
      'Pecs_00000113330972391601112060000005331138571180189576_',

    // ───────────────────────────────────────────────────────────
    // 2) CORE: split into two separate keys
    [Muscle.UpperRectusAbdominis]:
      'Upper_abs_00000046315355844623453780000011985032790848095113_',

    [Muscle.LowerRectusAbdominis]: [
      'Lower_abs_upper_00000119081192880914562810000012168525010772388750_',
      'Lower_abs_00000109003454546266000020000013768254758986680995_',
    ],

    [Muscle.Obliques]:
      'Obliques_external_00000132808153117246191410000008142061127064473252_',

    [Muscle.SerratusAnterior]:
      'Serratus_Anterior_00000078742877783113189840000003461162299842308526_',

    // ───────────────────────────────────────────────────────────
    // 3) GLUTES / UPPER LEG
    [Muscle.GluteusMedius]:
      'Gluteus_medius_00000080201568885703178310000010756533600557290409_',
    [Muscle.GluteusMaximus]:
      'Gluteus_maximus_00000168110655002960868070000014188754410659059374_',

    /*
      QUADRICEPS: four separate sub‐IDs (no further changes needed here).
    */
    [Muscle.Quadriceps]: [
      'Outer_quads_00000121269285701693319920000012886749065288244405_',
      'Inner_quads_00000130614576889879192780000002899524873876548237_',
      'Inner_quads_00000132084545112020286850000018311130309988591026_',
      'Mid_quad_00000159455298854971660020000007518134995342161842_',
    ],

    [Muscle.Sartorius]:
      'Sartorius__x28_inner_leg_x29__00000060747210191620450210000000874795006996621474_',
    [Muscle.AdductorMagnus]:
      'Pectinius__x28_Inner_groin_muscle_x29__00000139279253852462966920000017582585951695724936_',

    // ───────────────────────────────────────────────────────────
    // 4) LOWER LEG / CALVES / ANKLES
    [Muscle.PeroneusLongus]:
      'Peroneus_longus_00000062179120547177543840000016909121641372359095_',
    [Muscle.Soleus]:
      'Soleus_00000181065268647695928680000018209480433536768399_',
    [Muscle.Calves]: [
      'Calves__x28_medial_head_x29__00000152234539263550023980000009007724782308122012_',
      'Calves__x28_medial_head_x29__00000144309093221821848954800000014225574352369808823_',
      'Calves__x28_medial_head_x29__00000034059829512782314760000010611914542469866172_',
      'Calves__x28_medial_head_x29__00000116931660906523261270000008161269292030177950_',
      'Calves__x28_medial_head_x29__00000165214869862005764650000008485716200638106512_',
    ],

    // ───────────────────────────────────────────────────────────
    // 5) ARMS / FOREARMS
    [Muscle.Forearms]: [
      'Extensor__x28_fore_arm_lower_x29__00000012468373894602770780000006966979348039066248_',
      'Flexor_digitorium__x28_Under_arm_x29__00000159435954906204878840000011072027011836770979_',
    ],
    [Muscle.Brachioradialis]:
      'Brachioradialis__x28_fore_arm_upper_x29__00000132086081680176933160000000575656365073902269_',
    [Muscle.Brachialis]:
      'Biceps_Brachialis_00000003086861433688303320000017820228468836316309_',

    // ───────────────────────────────────────────────────────────
    // 6) NECK / TRAPS / DELTS / BISEPS / TRICEPS
    [Muscle.Sternocleidomastoid]: [
      'Sternocleids_00000000901235046718923910000008305278881673465734_',
      'Scm_00000050638738960208808000000011068059099103715510_',
    ],
    [Muscle.Trapezius]:
      'Front_traps_00000021839012028885905390000000215930882222765978_',

    /*
      On the front, the triceps heads do exist separately:
      If you want to highlight “TricepsBrachii” as both heads, you can add:
      [Muscle.TricepsBrachii]: [<both IDs>] 
      but we’ll keep them split:
    */
    [Muscle.TricepsBrachii]: [
      'Triceps_long_head_00000083776378062729911360000007780280132728440204_',
      'triceps_lateral_head_00000114039035336761946620000010495095347100091037_',
    ],
    [Muscle.TricepsLongHead]:
      'Triceps_long_head_00000083776378062729911360000007780280132728440204_',
    [Muscle.TricepsLateralHead]:
      'triceps_lateral_head_00000114039035336761946620000010495095347100091037_',

    [Muscle.BicepsBrachii]:
      'Biceps_brachii_00000165913426772514415860000005830889273115133587_',
    [Muscle.AnteriorDeltoid]:
      'Deltoids_front_00000075869929722435460100000017330691835694619786_',
  };

  // ───────────────────────────────────────────────────────────────
  // 4) Choose which map to use based on `view`
  const currentMuscleIdMap =
    view === 'front' ? frontMuscleIdMap : backMuscleIdMap;

  // ───────────────────────────────────────────────────────────────
  // 5) Whenever `view`, `muscleVolumes`, or `relevantMuscles` changes,
  //    we:
  //    • First “hide” every single <g> in `currentMuscleIdMap` by forcing
  //      opacity=0
  //    • Then loop over each `relevantMuscle` (from the enum) and set its
  //      correct opacity based on volume.
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return;

    // --- STEP 1: Force-hide all mapped <g> IDs (so nothing is “pre‐lit”)
    const allGroupIds: string[] = Object.values(currentMuscleIdMap).reduce<
      string[]
    >((acc, maybeId) => {
      if (!maybeId) return acc;
      // If it's an array of IDs, flatten; if string, wrap in array:
      return acc.concat(Array.isArray(maybeId) ? maybeId : [maybeId]);
    }, []);

    allGroupIds.forEach((groupId) => {
      const g = svgRef.current!.querySelector<SVGGElement>(`#${groupId}`);
      if (g) {
        g.style.opacity = '0';
      }
    });

    // --- STEP 2: Now “light up” each muscle that actually has a volume > 0
    relevantMuscles.forEach((muscle) => {
      const maybeId = currentMuscleIdMap[muscle];
      if (!maybeId) return; // This muscle isn’t in the map → skip.

      // Normalize to array-of-strings so we can set opacity on each sub-group:
      const groupIds: string[] = Array.isArray(maybeId)
        ? maybeId
        : [maybeId];

      const volume = muscleVolumes[muscle];
      const activation = getMuscleActivationLevel(volume);
      let opacityValue = 0;
      switch (activation.level) {
        case 'Low':
          opacityValue = 0.3;
          break;
        case 'Medium':
          opacityValue = 0.6;
          break;
        case 'High':
          opacityValue = 1.0;
          break;
        default:
          opacityValue = 0;
      }

      groupIds.forEach((groupId) => {
        const g = svgRef.current!.querySelector<SVGGElement>(
          `#${groupId}`
        );
        if (g) {
          g.style.opacity = `${opacityValue}`;
        }
      });
    });
  }, [view, muscleVolumes, relevantMuscles, currentMuscleIdMap]);

  // ───────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      <BodySvg
        ref={svgRef}
        className="pointer-events-none absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
};

/**
 * AnatomyVisualization
 *  - Parent card containing:
 *      • Front/Back toggle buttons
 *      • AnatomyFigureSvg (full‐body + overlays)
 *      • Scrollable “Muscle Activation” list
 */
export function AnatomyVisualization() {
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const { muscleVolumes } = useWorkout();

  // Safely collect all enum values (e.g. ["Pectoralis Major", "Upper Rectus Abdominis", …])
  const relevantMuscles =
    typeof Muscle === 'object' && Muscle !== null
      ? (Object.values(Muscle) as Muscle[])
      : [];

  return (
    <Card className="flex flex-col h-full shadow-xl bg-card hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Scan className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-xl">
            Interactive Anatomy
          </CardTitle>
        </div>
        <CardDescription>
          Visualize muscle engagement. Switch views and see activation levels from
          logged workouts.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* — Left column: full‐body SVG + toggle buttons — */}
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-[3/5] max-w-xs sm:max-w-sm mb-4 rounded-lg overflow-hidden bg-muted/10 border border-border">
              <AnatomyFigureSvg
                view={currentView}
                muscleVolumes={muscleVolumes}
                relevantMuscles={relevantMuscles}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant={currentView === 'front' ? 'default' : 'outline'}
                size="default"
                aria-label="Show Front View"
                className="transition-transform hover:scale-110 active:scale-95"
                onClick={() => setCurrentView('front')}
              >
                <UserRound className="w-5 h-5 mr-2" /> Front
              </Button>
              <Button
                variant={currentView === 'back' ? 'default' : 'outline'}
                size="default"
                aria-label="Show Back View"
                className="transition-transform hover:scale-110 active:scale-95"
                onClick={() => setCurrentView('back')}
              >
                <RotateCcwSquare className="w-5 h-5 mr-2" /> Back
              </Button>
            </div>
          </div>

          {/* — Right column: scrollable “Muscle Activation” list — */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-primary" />
              Muscle Activation
            </h3>
            <ScrollArea className="h-[300px] md:h-[400px] pr-3 border rounded-md bg-background/30 p-3">
              {relevantMuscles.length > 0 ? (
                <ul className="space-y-2">
                  {relevantMuscles.map((muscleName) => {
                    const volume = muscleVolumes[muscleName];
                    const activation = getMuscleActivationLevel(volume);

                    // Only show a row if activation > 0
                    if (activation.level === 'None' && !volume) return null;

                    return (
                      <li
                        key={muscleName}
                        className={`flex justify-between items-center p-2 rounded-md text-sm ${activation.color}`}
                      >
                        <span>{muscleName}</span>
                        <Badge
                          variant={
                            activation.level === 'High'
                              ? 'destructive'
                              : activation.level === 'Medium'
                              ? 'default'
                              : 'secondary'
                          }
                          className="capitalize"
                        >
                          {activation.level}{' '}
                          {volume !== undefined ? `(${Math.round(volume)})` : ''}
                        </Badge>
                      </li>
                    );
                  })}

                  {Object.values(muscleVolumes).every((v) => v === 0 || v === undefined) && (
                    <p className="text-muted-foreground text-center py-4">
                      Log a workout to see muscle activation.
                    </p>
                  )}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Log a workout to see muscle activation.
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
