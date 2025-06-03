// src/components/dashboard/anatomy-visualization.tsx
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
     2) Build a map from Muscle enum → the exact <g id="..."> string
        for the back‐view SVG.  Each of those IDs comes from the
        provided <svg> text.  Only “groups present in that SVG”
        get mapped here.  (Any muscle not in this list is simply
        omitted—its id won’t exist in the back SVG.)
  ─────────────────────────────────────────────────────────────── */
  const backMuscleIdMap: Partial<Record<Muscle, string>> = {
    [Muscle.Rhomboids]:
      'Rhomboid_major_00000153702420119838252620000014513967375993411263_',
    [Muscle.Hamstrings]:
      'Semimembranosis_00000165197940537239056910000018339456362161962915_',
    [Muscle.Trapezius]:
      'Trapz_00000086658569290832975040000006959360490215844261_',
    [Muscle.LowerTrapezius]:
      'Middle_and_lower_trapz_00000011030372104423980000000004308217814190120081_',
    [Muscle.Soleus]:
      'Soleus_00000162330102282724997570000015371067798349489349489321_',
    [Muscle.Calves]:
      'Claves_00000142896635816991424760000005189009876859777974_',
    [Muscle.AnteriorDeltoid]:
      'Delts_00000037683310307467639390000007902456789317736638_',
    [Muscle.LateralDeltoid]:
      'Delts_00000037683310307467639390000007902456789317736638_',
    [Muscle.PosteriorDeltoid]:
      'Delts_00000037683310307467639390000007902456789317736638_',
    [Muscle.TeresMajor]:
      'Teres_Major_00000116932973775553672460000017841647355507566270_',
    [Muscle.Infraspinatus]:
      'Infraspinatus_00000055693351133629568060000011005395473393824395_',
  };

  /* ───────────────────────────────────────────────────────────────
     3) (Placeholder) Front‐view map would go here once the front SVG
        is provided.  For now we leave it empty, to be filled in later.
  ─────────────────────────────────────────────────────────────── */
  const frontMuscleIdMap: Partial<Record<Muscle, string>> = {
    /* fill in after front SVG is shared */
  };

  // 4) Choose which map to use based on `view`
  const currentMuscleIdMap =
    view === 'front' ? frontMuscleIdMap : backMuscleIdMap;

  // 5) Whenever `view` or `muscleVolumes` change, loop through each mapped
  //    muscle, find its <g id="..."> inside the SVG, and adjust `style.opacity`.
  useEffect(() => {
    if (!svgRef.current) return;

    relevantMuscles.forEach((muscle) => {
      const groupId = currentMuscleIdMap[muscle];
      if (!groupId) return;

      // Use `getElementById` on the SVG root to find the group
      const groupElem = svgRef.current.querySelector<SVGGElement>(
        `#${groupId}`
      );
      if (!groupElem) return;

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

      groupElem.style.opacity = `${opacityValue}`;
    });
  }, [view, muscleVolumes, relevantMuscles, currentMuscleIdMap]);

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
