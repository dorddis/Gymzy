// src/components/dashboard/anatomy-visualization.tsx
'use client';

import React, { useRef, useState } from 'react';
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
   1) Import the two body‐outline SVGs as default React components.
      (Your SVGR loader must convert each `.svg` into a React component.)
──────────────────────────────────────────────────────────────────────────── */
import FrontOutline from '@/assets/images/all/muscles/front/body-black-outline.svg';
import BackOutline from '@/assets/images/all/muscles/back/body-black-outline.svg';

/* ───────────────────────────────────────────────────────────────────────────
   2) Import each individual muscle SVG as a default React component.
      Only the files you showed in "front/" and "back/" folders are used.
──────────────────────────────────────────────────────────────────────────── */
/*  Front‐view muscle SVGs  */
import DeltoidsFront from '@/assets/images/all/musclegroups/front/deltoids.svg';
import BicepsBrachiiFront from '@/assets/images/all/musclegroups/front/biceps-brachii.svg';
import BrachialisFront from '@/assets/images/all/musclegroups/front/brachialis.svg';
import BrachioradialisFront from '@/assets/images/all/musclegroups/front/brachioradialis.svg';
import PectoralisMajorFront from '@/assets/images/all/musclegroups/front/pectoralis-major.svg';
import TricepsBrachiiLongHeadFront from '@/assets/images/all/musclegroups/front/triceps-brachii-long-head.svg';
import RectusAbdominusFront from '@/assets/images/all/musclegroups/front/rectus-abdominus.svg';
import ExternalObliquesFront from '@/assets/images/all/musclegroups/front/external-obliques.svg';
import SerratusAnteriorFront from '@/assets/images/all/musclegroups/front/serratus-anterior.svg';
import SoleusFront from '@/assets/images/all/musclegroups/front/soleus.svg';
import SternocleidomastoidFront from '@/assets/images/all/musclegroups/front/sternocleidomastoid.svg';
import TensorFasciaeLataeFront from '@/assets/images/all/musclegroups/front/tensor-fasciae-latae.svg';
import TrapeziusFront from '@/assets/images/all/musclegroups/front/trapezius.svg';
import PeroneusLongusFront from '@/assets/images/all/musclegroups/front/peroneus-longus.svg';
import GastrocnemiusCalfFront from '@/assets/images/all/musclegroups/front/gastrocnemius-calf.svg';
import RectusFemorisFront from '@/assets/images/all/musclegroups/front/rectus-femoris.svg';
import VastusLateralisFront from '@/assets/images/all/musclegroups/front/vastus-lateralis.svg';
import VastusMedialisFront from '@/assets/images/all/musclegroups/front/vastus-medialis.svg';

/*  Back‐view muscle SVGs  */
import DeltoidsBack from '@/assets/images/all/musclegroups/back/deltoids.svg';
import LattisimusDorsiBack from '@/assets/images/all/musclegroups/back/lattisimus-dorsi.svg';
import TrapeziusBack from '@/assets/images/all/musclegroups/back/trapezius.svg';
import RhomboidMajorBack from '@/assets/images/all/musclegroups/back/rhomboid-major.svg';
import BicepsFemorisBack from '@/assets/images/all/musclegroups/back/biceps-femoris.svg';
import GluteusMaximusBack from '@/assets/images/all/musclegroups/back/gluteus-maximus.svg';
import GastrocnemiusMedialHeadBack from '@/assets/images/all/musclegroups/back/gastrocnemius-medial-head.svg';
import ExternalObliquesBack from '@/assets/images/all/musclegroups/back/external-obliques.svg';
import BrachioradialisBack from '@/assets/images/all/musclegroups/back/brachioradialis.svg';
import LowerTrapeziusBack from '@/assets/images/all/musclegroups/back/lower-trapezius.svg';
import SerratusAnteriorBack from '@/assets/images/all/musclegroups/back/serratus-anterior.svg';
import TensorFascieLataeBack from '@/assets/images/all/musclegroups/back/tensor-fascie-latae.svg';
import TeresMajorBack from '@/assets/images/all/musclegroups/back/teres-major.svg';
import ThoracolumbarFasciaBack from '@/assets/images/all/musclegroups/back/thoracolumbar-fascia.svg';
import AdductorMagnusBack from '@/assets/images/all/musclegroups/back/adductor-magnus.svg';
import SemitendinosusBack from '@/assets/images/all/musclegroups/back/semitendinosus.svg';
import GracilisBack from '@/assets/images/all/musclegroups/back/gracilis.svg';
import PeroneusLongusBack from '@/assets/images/all/musclegroups/back/peroneus-longus.svg';
import TricepsBrachiiLongHeadLateralHeadBack from '@/assets/images/all/musclegroups/back/triceps-brachii-long-head-lateral-head.svg';

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
 *  - Renders the body outline (front/back) and overlays muscle SVGs based on activation.
 */
const AnatomyFigureSvg = (props: {
  view: 'front' | 'back';
  muscleVolumes: Record<Muscle, number | undefined>;
  relevantMuscles: Muscle[];
}) => {
  const { view, muscleVolumes, relevantMuscles } = props;
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // 1) Pick the correct body‐outline component:
  const BodyOutlineSvg = view === 'front' ? FrontOutline : BackOutline;

  // 2) Build the “front” map (Muscle → corresponding front SVG):
  let frontMuscleSvgs: Partial<Record<Muscle, React.FC<SVGProps<SVGSVGElement>>>> = {};
  if (typeof Muscle === 'object' && Muscle !== null) {
    frontMuscleSvgs = {
      [Muscle.PectoralisMajor]: PectoralisMajorFront,
      [Muscle.AnteriorDeltoid]: DeltoidsFront,
      [Muscle.LateralDeltoid]: DeltoidsFront,
      [Muscle.PosteriorDeltoid]: DeltoidsFront,
      [Muscle.BicepsBrachii]: BicepsBrachiiFront,
      [Muscle.TricepsBrachii]: TricepsBrachiiLongHeadFront,
      [Muscle.Brachialis]: BrachialisFront,
      [Muscle.Brachioradialis]: BrachioradialisFront,
      [Muscle.RectusAbdominis]: RectusAbdominusFront,
      [Muscle.Obliques]: ExternalObliquesFront,
      [Muscle.SerratusAnterior]: SerratusAnteriorFront,
      [Muscle.Soleus]: SoleusFront,
      [Muscle.Sternocleidomastoid]: SternocleidomastoidFront,
      [Muscle.TensorFasciaeLatae]: TensorFasciaeLataeFront,
      [Muscle.Trapezius]: TrapeziusFront,
      [Muscle.PeroneusLongus]: PeroneusLongusFront,
      [Muscle.Calves]: GastrocnemiusCalfFront,
      [Muscle.Quadriceps]: RectusFemorisFront,      // Use Rectus Femoris as quadriceps
      // (Optionally override with Vastus Lateralis/Medialis if desired)
    };
  }

  // 3) Build the “back” map (Muscle → corresponding back SVG):
  let backMuscleSvgs: Partial<Record<Muscle, React.FC<SVGProps<SVGSVGElement>>>> = {};
  if (typeof Muscle === 'object' && Muscle !== null) {
    backMuscleSvgs = {
      [Muscle.AnteriorDeltoid]: DeltoidsBack,
      [Muscle.LateralDeltoid]: DeltoidsBack,
      [Muscle.PosteriorDeltoid]: DeltoidsBack,
      [Muscle.LatissimusDorsi]: LattisimusDorsiBack,
      [Muscle.Trapezius]: TrapeziusBack,
      [Muscle.Rhomboids]: RhomboidMajorBack,
      [Muscle.TricepsBrachii]: TricepsBrachiiLongHeadLateralHeadBack,
      [Muscle.Forearms]: BrachioradialisBack,            // approximate
      [Muscle.Hamstrings]: BicepsFemorisBack,
      [Muscle.GluteusMaximus]: GluteusMaximusBack,
      [Muscle.Calves]: GastrocnemiusMedialHeadBack,
      [Muscle.Obliques]: ExternalObliquesBack,
      [Muscle.Brachioradialis]: BrachioradialisBack,
      [Muscle.LowerTrapezius]: LowerTrapeziusBack,
      [Muscle.SerratusAnterior]: SerratusAnteriorBack,
      [Muscle.TensorFasciaeLatae]: TensorFascieLataeBack,
      [Muscle.TeresMajor]: TeresMajorBack,
      [Muscle.ThoracolumbarFascia]: ThoracolumbarFasciaBack,
      [Muscle.AdductorMagnus]: AdductorMagnusBack,
      [Muscle.Semitendinosus]: SemitendinosusBack,
      [Muscle.Gracilis]: GracilisBack,
      [Muscle.PeroneusLongus]: PeroneusLongusBack,
    };
  }

  // 4) Choose which map to use based on `view`
  const currentMuscleSvgs = view === 'front' ? frontMuscleSvgs : backMuscleSvgs;

  return (
    <div ref={svgContainerRef} className="relative w-full h-full">
      {/* Render the body outline */}
      <BodyOutlineSvg className="pointer-events-none absolute top-0 left-0 w-full h-full" />

      {/* Overlay each relevant muscle if it has activation > 0 */}
      {relevantMuscles.map((muscleName) => {
        const volume = muscleVolumes[muscleName];
        const activation = getMuscleActivationLevel(volume);

        // Only attempt to render if activation is not “None” and we have a matching SVG
        const MuscleSvgComponent = currentMuscleSvgs[muscleName];
        if (activation.level !== 'None' && MuscleSvgComponent) {
          let opacity = 0;
          switch (activation.level) {
            case 'Low':
              opacity = 0.3;
              break;
            case 'Medium':
              opacity = 0.6;
              break;
            case 'High':
              opacity = 1.0;
              break;
          }

          return (
            <MuscleSvgComponent
              key={muscleName}
              className="pointer-events-none absolute top-0 left-0 w-full h-full"
              style={{ opacity }}
            />
          );
        }
        return null;
      })}
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

  // Safely collect all enum values (e.g. ["Pectoralis Major", "Anterior Deltoid", …])
  const relevantMuscles =
    typeof Muscle === 'object' && Muscle !== null
      ? (Object.values(Muscle) as Muscle[])
      : [];

  return (
    <Card className="flex flex-col h-full shadow-xl bg-card hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Scan className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-xl">Interactive Anatomy</CardTitle>
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
