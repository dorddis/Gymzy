
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

  // Slightly refined body outline path
  const bodyOutlinePath = "M150,40 Q140,25 120,25 Q80,25 65,65 Q60,110 85,135 L85,270 Q85,310 65,335 L65,455 Q70,485 100,485 L200,485 Q230,485 235,455 L235,335 Q215,310 215,270 L215,135 Q240,110 235,65 Q220,25 180,25 Q160,25 150,40 Z";

  return (
    <svg viewBox="0 0 300 500" width="100%" height="100%" aria-labelledby="anatomy-title" role="img">
      <title id="anatomy-title">Anatomy {view} view showing muscle activation</title>
      <path d={bodyOutlinePath} fill={bodyFillColor} stroke={bodyStrokeColor} strokeWidth="1.5" />

      {view === 'front' && (
        <>
          {/* Pectoralis Major - refined shape */}
          <path d="M115,135 C120,130 180,130 185,135 C195,150 190,175 185,185 C170,195 130,195 115,185 C110,175 105,150 115,135 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.PectoralisMajor])} stroke={bodyStrokeColor} strokeWidth="1" />
          
          {/* Rectus Abdominis - more detailed "abs" */}
          <path d="M132,200 C130,200 130,225 132,225 L132,228 C130,228 130,250 132,250 L132,253 C130,253 130,270 132,270 L168,270 C170,270 170,253 168,253 L168,250 C170,250 170,228 168,228 L168,225 C170,225 170,200 168,200 Z 
                   M132,225 L168,225 M132,250 L168,250" 
                fill={getMuscleSvgFillColor(muscleVolumes[Muscle.RectusAbdominis])} stroke={bodyStrokeColor} strokeWidth="1" />
          <line x1="150" y1="200" x2="150" y2="270" stroke={bodyStrokeColor} strokeWidth="0.5" />


          {/* Anterior Deltoid - more shoulder-like */}
          <path d="M95,125 C85,130 80,150 90,160 C95,165 110,160 115,145 C118,135 110,125 95,125 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.AnteriorDeltoid])} stroke={bodyStrokeColor} strokeWidth="1" />
          <path d="M205,125 C215,130 220,150 210,160 C205,165 190,160 185,145 C182,135 190,125 205,125 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.AnteriorDeltoid])} stroke={bodyStrokeColor} strokeWidth="1" />
          
          {/* Biceps Brachii - more defined */}
          <path d="M90,170 C85,180 85,210 95,220 C105,225 110,210 105,190 C100,175 95,170 90,170 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.BicepsBrachii])} stroke={bodyStrokeColor} strokeWidth="1" />
          <path d="M210,170 C215,180 215,210 205,220 C195,225 190,210 195,190 C200,175 205,170 210,170 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.BicepsBrachii])} stroke={bodyStrokeColor} strokeWidth="1" />

          {/* Quadriceps - more detailed thigh muscles */}
          <path d="M100,280 C95,320 100,380 115,425 L130,425 C135,380 145,320 145,280 Q125,270 100,280 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Quadriceps])} stroke={bodyStrokeColor} strokeWidth="1" />
          <path d="M155,280 C155,320 165,380 170,425 L185,425 C200,380 205,320 200,280 Q175,270 155,280 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Quadriceps])} stroke={bodyStrokeColor} strokeWidth="1" />
        </>
      )}

      {view === 'back' && (
        <>
          {/* Trapezius - refined shape */}
          <path d="M130,110 C125,120 120,150 135,175 L150,190 L165,175 C180,150 175,120 170,110 Q150,100 130,110 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Trapezius])} stroke={bodyStrokeColor} strokeWidth="1" />
          
          {/* Latissimus Dorsi - "wings" */}
          <path d="M105,175 C90,200 90,260 120,290 L180,290 C210,260 210,200 195,175 L180,185 Q150,195 120,185 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.LatissimusDorsi])} stroke={bodyStrokeColor} strokeWidth="1" />
          
          {/* Erector Spinae - refined */}
          <path d="M138,195 C135,230 135,270 138,290 L162,290 C165,270 165,230 162,195 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.ErectorSpinae])} stroke={bodyStrokeColor} strokeWidth="1"/>
          
          {/* Posterior Deltoid - more shoulder-like */}
          <path d="M95,125 C85,130 80,150 90,160 C95,165 110,160 115,145 C118,135 110,125 95,125 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.PosteriorDeltoid])} stroke={bodyStrokeColor} strokeWidth="1" />
          <path d="M205,125 C215,130 220,150 210,160 C205,165 190,160 185,145 C182,135 190,125 205,125 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.PosteriorDeltoid])} stroke={bodyStrokeColor} strokeWidth="1" />
          
          {/* Triceps Brachii - more defined */}
          <path d="M90,175 C88,185 90,215 100,225 C108,230 110,215 105,195 C100,180 95,175 90,175 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.TricepsBrachii])} stroke={bodyStrokeColor} strokeWidth="1" />
          <path d="M210,175 C212,185 210,215 200,225 C192,230 190,215 195,195 C200,180 205,175 210,175 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.TricepsBrachii])} stroke={bodyStrokeColor} strokeWidth="1" />
          
          {/* Gluteus Maximus - more rounded */}
          <path d="M100,290 C90,300 90,330 110,340 C130,345 140,330 140,310 C140,295 125,285 100,290 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.GluteusMaximus])} stroke={bodyStrokeColor} strokeWidth="1" />
          <path d="M200,290 C210,300 210,330 190,340 C170,345 160,330 160,310 C160,295 175,285 200,290 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.GluteusMaximus])} stroke={bodyStrokeColor} strokeWidth="1" />
          
          {/* Hamstrings - more detailed */}
          <path d="M105,340 C100,370 105,410 120,435 L130,435 C135,410 145,370 145,340 Q125,335 105,340 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Hamstrings])} stroke={bodyStrokeColor} strokeWidth="1" />
          <path d="M155,340 C155,370 165,410 170,435 L180,435 C195,410 200,370 195,340 Q175,335 155,340 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Hamstrings])} stroke={bodyStrokeColor} strokeWidth="1" />
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

    