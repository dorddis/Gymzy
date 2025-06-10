import React, { useRef, useEffect, useState } from 'react';
import { useWorkout } from '@/contexts/WorkoutContext';
import FrontFullBody from '@/assets/images/front-full-body-with-all-muscles-showing.svg';
import BackFullBody from '@/assets/images/back-full-body-with-all-muscles-showing.svg';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Muscle } from '../../../home/user/studio/src/lib/constants';

// Activation logic (reuse from anatomy-visualization)
const getMuscleActivationLevel = (
  volume: number | undefined
): { level: 'Low' | 'Medium' | 'High' | 'None'; color: string } => {
  if (volume === undefined || volume === 0) {
    return { level: 'None', color: 'bg-red-100' };
  }
  if (volume < 500) {
    return { level: 'Low', color: 'bg-red-100' };
  }
  if (volume < 1500) {
    return { level: 'Medium', color: 'bg-red-300' };
  }
  return { level: 'High', color: 'bg-red-500' };
};

// Map logic (copy from anatomy-visualization, but only for demo: real logic should be DRYed/shared)
const frontMuscleIdMap: Partial<Record<Muscle, string | string[]>> = {};
const backMuscleIdMap: Partial<Record<Muscle, string | string[]>> = {};
// (For brevity, not copying the full map here. In real code, import/share this.)

export function HeatmapCard() {
  const [view, setView] = useState<'front' | 'back'>('front');
  const { muscleVolumes } = useWorkout();
  const svgRef = useRef<SVGSVGElement>(null);
  const BodySvg = view === 'front' ? FrontFullBody : BackFullBody;
  const relevantMuscles = typeof Muscle === 'object' && Muscle !== null ? (Object.values(Muscle) as Muscle[]) : [];
  const currentMuscleIdMap = view === 'front' ? frontMuscleIdMap : backMuscleIdMap;

  useEffect(() => {
    if (!svgRef.current) return;
    // Hide all
    const allGroupIds: string[] = Object.values(currentMuscleIdMap).reduce<string[]>((acc, maybeId) => {
      if (!maybeId) return acc;
      return acc.concat(Array.isArray(maybeId) ? maybeId : [maybeId]);
    }, []);
    allGroupIds.forEach((groupId) => {
      const g = svgRef.current!.querySelector<SVGGElement>(`#${groupId}`);
      if (g) g.style.opacity = '0';
    });
    // Highlight active
    relevantMuscles.forEach((muscle) => {
      const maybeId = currentMuscleIdMap[muscle];
      if (!maybeId) return;
      const groupIds: string[] = Array.isArray(maybeId) ? maybeId : [maybeId];
      const volume = muscleVolumes[muscle];
      const activation = getMuscleActivationLevel(volume);
      let opacityValue = 0;
      switch (activation.level) {
        case 'Low': opacityValue = 0.3; break;
        case 'Medium': opacityValue = 0.6; break;
        case 'High': opacityValue = 1.0; break;
        default: opacityValue = 0;
      }
      groupIds.forEach((groupId) => {
        const g = svgRef.current!.querySelector<SVGGElement>(`#${groupId}`);
        if (g) g.style.opacity = `${opacityValue}`;
      });
    });
  }, [view, muscleVolumes, relevantMuscles, currentMuscleIdMap]);

  return (
    <Card className="mx-4 bg-white rounded-xl shadow-md p-4 mb-4 relative overflow-visible">
      {/* Overlay header */}
      <div className="absolute top-2 left-4 z-10 pointer-events-none">
        <h2 className="text-lg font-semibold text-gray-800 drop-shadow-sm bg-white/80 px-2 rounded">Weekly Muscle Activation</h2>
      </div>
      <CardHeader className="flex flex-row justify-end items-center mb-1 p-0 min-h-0 h-8">
        <Button
          className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium h-8"
          onClick={() => setView(view === 'front' ? 'back' : 'front')}
        >
          {view === 'front' ? 'Show Back' : 'Show Front'}
        </Button>
      </CardHeader>
      <CardContent className="bg-white rounded-lg h-[280px] w-full flex items-center justify-center mb-3">
        <BodySvg ref={svgRef} className="w-full h-full" />
      </CardContent>
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 rounded-sm mr-1" />
          <span className="text-xs text-gray-700 font-medium">Low</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-300 rounded-sm mr-1" />
          <span className="text-xs text-gray-700 font-medium">Medium</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-sm mr-1" />
          <span className="text-xs text-gray-700 font-medium">High</span>
        </div>
      </div>
    </Card>
  );
} 