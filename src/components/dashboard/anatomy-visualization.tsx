
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Scan, UserRound, RotateCcwSquare, Zap } from "lucide-react";
import { useWorkout } from '@/contexts/WorkoutContext';
import { Muscle, MUSCLE_VOLUME_THRESHOLDS } from '@/lib/constants';

const getMuscleActivationLevel = (volume: number | undefined): {level: "Low" | "Medium" | "High" | "None", color: string} => {
  if (volume === undefined || volume === 0) return {level: "None", color: "bg-muted/20"};
  if (volume < MUSCLE_VOLUME_THRESHOLDS.LOW) return {level: "Low", color: "bg-green-500/30"};
  if (volume < MUSCLE_VOLUME_THRESHOLDS.MEDIUM) return {level: "Medium", color: "bg-yellow-500/40"};
  return {level: "High", color: "bg-red-500/50"};
};

const getMuscleSvgFillColor = (volume: number | undefined): string => {
  const baseOpacity = 0.6;
  const highOpacity = 0.8;
  const inactiveFill = "hsl(var(--muted) / 0.15)";
  const lowFill = `hsl(var(--chart-3) / ${baseOpacity})`;
  const mediumFill = `hsl(var(--chart-2) / ${baseOpacity})`;
  const highFill = `hsl(var(--primary) / ${highOpacity})`;

  if (volume === undefined || volume === 0) return inactiveFill;
  if (volume < MUSCLE_VOLUME_THRESHOLDS.LOW) return lowFill;
  if (volume < MUSCLE_VOLUME_THRESHOLDS.MEDIUM) return mediumFill;
  return highFill;
};

const AnatomyFigureSvg = ({ muscleVolumes, view }: { muscleVolumes: ReturnType<typeof useWorkout>['muscleVolumes'], view: 'front' | 'back' }) => {
  const bodyStrokeColor = "hsl(var(--foreground) / 0.3)";
  const bodyFillColor = "hsl(var(--muted) / 0.1)";

  // Simplified path for a generic body outline
  const bodyOutlinePath = "M150,50 Q140,30 120,30 Q80,30 70,70 Q70,110 90,130 L90,270 Q90,310 70,330 L70,450 Q70,480 100,480 L200,480 Q230,480 230,450 L230,330 Q210,310 210,270 L210,130 Q230,110 230,70 Q220,30 180,30 Q160,30 150,50 Z";

  return (
    <svg viewBox="0 0 300 500" width="100%" height="100%" aria-labelledby="anatomy-title" role="img">
      <title id="anatomy-title">Anatomy {view} view showing muscle activation</title>
      <path d={bodyOutlinePath} fill={bodyFillColor} stroke={bodyStrokeColor} strokeWidth="1.5" />

      {view === 'front' && (
        <>
          {/* Pectoralis Major */}
          <path d="M115,135 Q150,125 185,135 Q190,180 150,195 Q110,180 115,135 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.PectoralisMajor])} stroke={bodyStrokeColor} strokeWidth="1" />
          {/* Rectus Abdominis */}
          <rect x="130" y="200" width="40" height="70" rx="5" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.RectusAbdominis])} stroke={bodyStrokeColor} strokeWidth="1" />
          {/* Anterior Deltoid */}
          <ellipse cx="105" cy="135" rx="25" ry="30" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.AnteriorDeltoid])} stroke={bodyStrokeColor} strokeWidth="1" />
          <ellipse cx="195" cy="135" rx="25" ry="30" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.AnteriorDeltoid])} stroke={bodyStrokeColor} strokeWidth="1" />
          {/* Biceps Brachii */}
          <ellipse cx="100" cy="190" rx="15" ry="35" transform="rotate(-10 100 190)" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.BicepsBrachii])} stroke={bodyStrokeColor} strokeWidth="1" />
          <ellipse cx="200" cy="190" rx="15" ry="35" transform="rotate(10 200 190)" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.BicepsBrachii])} stroke={bodyStrokeColor} strokeWidth="1" />
          {/* Quadriceps */}
          <path d="M100,275 Q100,350 120,420 L135,420 Q150,350 150,275 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Quadriceps])} stroke={bodyStrokeColor} strokeWidth="1" />
          <path d="M150,275 Q150,350 165,420 L180,420 Q200,350 200,275 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Quadriceps])} stroke={bodyStrokeColor} strokeWidth="1" />
        </>
      )}

      {view === 'back' && (
        <>
          {/* Trapezius */}
          <path d="M130,115 Q150,105 170,115 L180,170 L150,190 L120,170 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Trapezius])} stroke={bodyStrokeColor} strokeWidth="1" />
          {/* Latissimus Dorsi */}
          <path d="M110,170 Q90,250 125,280 L175,280 Q210,250 190,170 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.LatissimusDorsi])} stroke={bodyStrokeColor} strokeWidth="1" />
           {/* Erector Spinae */}
          <rect x="135" y="190" width="30" height="90" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.ErectorSpinae])} stroke={bodyStrokeColor} strokeWidth="1"/>
          {/* Posterior Deltoid */}
          <ellipse cx="105" cy="135" rx="25" ry="30" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.PosteriorDeltoid])} stroke={bodyStrokeColor} strokeWidth="1" />
          <ellipse cx="195" cy="135" rx="25" ry="30" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.PosteriorDeltoid])} stroke={bodyStrokeColor} strokeWidth="1" />
          {/* Triceps Brachii */}
          <ellipse cx="100" cy="195" rx="15" ry="40" transform="rotate(-5 100 195)" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.TricepsBrachii])} stroke={bodyStrokeColor} strokeWidth="1" />
          <ellipse cx="200" cy="195" rx="15" ry="40" transform="rotate(5 200 195)" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.TricepsBrachii])} stroke={bodyStrokeColor} strokeWidth="1" />
          {/* Gluteus Maximus */}
          <ellipse cx="125" cy="300" rx="35" ry="30" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.GluteusMaximus])} stroke={bodyStrokeColor} strokeWidth="1" />
          <ellipse cx="175" cy="300" rx="35" ry="30" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.GluteusMaximus])} stroke={bodyStrokeColor} strokeWidth="1" />
          {/* Hamstrings */}
          <path d="M105,330 Q110,400 125,430 L135,430 Q145,400 150,330 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Hamstrings])} stroke={bodyStrokeColor} strokeWidth="1" />
           <path d="M150,330 Q155,400 165,430 L175,430 Q190,400 195,330 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Hamstrings])} stroke={bodyStrokeColor} strokeWidth="1" />
        </>
      )}
    </svg>
  );
};


export function AnatomyVisualization() {
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const { muscleVolumes } = useWorkout();

  const toggleView = () => {
    setCurrentView(prevView => prevView === 'front' ? 'back' : 'front');
  };

  const relevantMuscles = Object.values(Muscle); 

  return (
    <Card className="flex flex-col h-full shadow-xl bg-card hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Scan className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-xl">Interactive Anatomy</CardTitle>
        </div>
        <CardDescription>Visualize muscle engagement. Switch views and see activation levels from logged workouts.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-[3/4] max-w-xs sm:max-w-sm mb-4 rounded-lg overflow-hidden bg-muted/50 border border-border">
              <AnatomyFigureSvg muscleVolumes={muscleVolumes} view={currentView} />
            </div>
            <div className="flex space-x-2">
              <Button 
                variant={currentView === 'front' ? "default" : "outline"}
                size="default" 
                aria-label="Show Front View" 
                className="transition-transform hover:scale-110 active:scale-95"
                onClick={() => setCurrentView('front')}
              >
                <UserRound className="w-5 h-5 mr-2" /> Front
              </Button>
              <Button 
                variant={currentView === 'back' ? "default" : "outline"}
                size="default" 
                aria-label="Show Back View" 
                className="transition-transform hover:scale-110 active:scale-95"
                onClick={() => setCurrentView('back')}
              >
                <RotateCcwSquare className="w-5 h-5 mr-2" /> Back 
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-2 flex items-center"><Zap className="w-5 h-5 mr-2 text-primary"/>Muscle Activation</h3>
            <ScrollArea className="h-[300px] md:h-[400px] pr-3 border rounded-md bg-background/30 p-3">
              {relevantMuscles.length > 0 ? (
                <ul className="space-y-2">
                  {relevantMuscles.map(muscleName => {
                    const volume = muscleVolumes[muscleName as Muscle];
                    const activation = getMuscleActivationLevel(volume);
                    if (activation.level === "None" && !volume) return null;

                    return (
                      <li key={muscleName} className={`flex justify-between items-center p-2 rounded-md text-sm ${activation.color}`}>
                        <span>{muscleName}</span>
                        <Badge variant={activation.level === "High" ? "destructive" : activation.level === "Medium" ? "default" : "secondary"} className="capitalize">
                          {activation.level} {volume !== undefined ? `(${Math.round(volume)})` : ''}
                        </Badge>
                      </li>
                    );
                  })}
                   {Object.keys(muscleVolumes).length === 0 && (
                     <p className="text-muted-foreground text-center py-4">Log a workout to see muscle activation.</p>
                   )}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">Log a workout to see muscle activation.</p>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

    