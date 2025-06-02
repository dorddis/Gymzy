
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
  const baseOpacity = 0.7; // Increased opacity for better visibility
  const highOpacity = 0.9;
  const inactiveFill = "hsl(var(--muted) / 0.1)"; // More subtle inactive fill
  const lowFill = `hsl(var(--chart-3) / ${baseOpacity * 0.6})`;
  const mediumFill = `hsl(var(--chart-2) / ${baseOpacity * 0.8})`;
  const highFill = `hsl(var(--primary) / ${highOpacity})`;

  if (volume === undefined || volume === 0) return inactiveFill;
  if (volume < MUSCLE_VOLUME_THRESHOLDS.LOW) return lowFill;
  if (volume < MUSCLE_VOLUME_THRESHOLDS.MEDIUM) return mediumFill;
  return highFill;
};

const AnatomyFigureSvg = ({ muscleVolumes, view }: { muscleVolumes: ReturnType<typeof useWorkout>['muscleVolumes'], view: 'front' | 'back' }) => {
  const bodyStrokeColor = "hsl(var(--foreground) / 0.35)"; // Slightly darker for better contrast
  const bodyFillColor = "hsl(var(--muted) / 0.05)"; // Even more subtle body fill
  const muscleStrokeWidth = "0.75";

  // Detailed body outline (approximated)
  const bodyOutlinePath = 
    "M150,30 C145,25 135,25 125,30 C110,40 100,60 95,80 C90,100 90,120 92,135 L88,140 C80,150 75,170 75,190 C75,220 80,240 85,260 L85,350 C85,380 80,400 75,420 L70,470 Q75,490 100,495 L200,495 Q225,490 230,470 L225,420 C220,400 215,380 215,350 L215,260 C220,240 225,220 225,190 C225,170 220,150 212,140 L208,135 C210,120 210,100 205,80 C200,60 190,40 175,30 C165,25 155,25 150,30 Z";

  // Define a head shape (can be part of body outline or separate)
  const headPath = "M150,30 Q130,28 125,50 Q120,70 150,75 Q180,70 175,50 Q170,28 150,30 Z";


  return (
    <svg viewBox="0 0 300 500" width="100%" height="100%" aria-labelledby="anatomy-title" role="img">
      <title id="anatomy-title">Anatomy {view} view showing muscle activation</title>
      <path d={bodyOutlinePath} fill={bodyFillColor} stroke={bodyStrokeColor} strokeWidth="2" />
      <path d={headPath} fill={bodyFillColor} stroke={bodyStrokeColor} strokeWidth="1.5" />

      {view === 'front' && (
        <g stroke={bodyStrokeColor} strokeWidth={muscleStrokeWidth}>
          {/* Pectoralis Major (Chest) */}
          <path d="M150,135 C130,135 115,145 110,160 C105,180 115,195 130,195 L150,190 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.PectoralisMajor])} />
          <path d="M150,135 C170,135 185,145 190,160 C195,180 185,195 170,195 L150,190 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.PectoralisMajor])} />
          
          {/* Deltoids (Anterior/Lateral) */}
          <path d="M110,130 C95,135 90,150 92,165 C95,175 105,175 110,170 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.AnteriorDeltoid])} /> {/* Left Anterior */}
          <path d="M190,130 C205,135 210,150 208,165 C205,175 195,175 190,170 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.AnteriorDeltoid])} /> {/* Right Anterior */}
          <path d="M92,135 C85,140 82,155 88,165 C92,170 95,165 92,155 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.LateralDeltoid])} /> {/* Left Lateral */}
          <path d="M208,135 C215,140 218,155 212,165 C208,170 205,165 208,155 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.LateralDeltoid])} /> {/* Right Lateral */}

          {/* Biceps Brachii */}
          <path d="M100,175 C95,180 95,210 100,225 C105,230 110,220 108,200 C105,185 103,175 100,175 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.BicepsBrachii])} />
          <path d="M200,175 C205,180 205,210 200,225 C195,230 190,220 192,200 C195,185 197,175 200,175 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.BicepsBrachii])} />

          {/* Rectus Abdominis (Abs) */}
          <path d="M135,200 H165 V275 H135 Z M135,225 H165 M135,250 H165 M150,200 V275" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.RectusAbdominis])} strokeWidth="0.5" />

          {/* Obliques */}
          <path d="M115,200 C110,210 110,260 120,275 L130,275 L130,200 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Obliques])} />
          <path d="M185,200 C190,210 190,260 180,275 L170,275 L170,200 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Obliques])} />

          {/* Quadriceps */}
          <path d="M105,285 C100,320 105,380 120,430 L135,430 C140,380 140,320 135,285 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Quadriceps])} /> {/* Left */}
          <path d="M165,285 C160,320 160,380 165,430 L180,430 C195,380 200,320 195,285 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Quadriceps])} /> {/* Right */}
          
          {/* Forearms (simplified) */}
          <path d="M90,230 C85,250 90,280 100,280 L105,280 C105,260 100,240 95,230 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Forearms])} /> {/* Left */}
          <path d="M210,230 C215,250 210,280 200,280 L195,280 C195,260 200,240 205,230 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Forearms])} /> {/* Right */}

          {/* Calves (Tibialis Anterior - front view) */}
          <path d="M110,435 C110,450 115,465 125,470 L130,470 C130,460 125,445 120,435 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Calves])} /> {/* Left */}
          <path d="M170,435 C170,450 165,465 175,470 L180,470 C180,460 185,445 190,435 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Calves])} /> {/* Right */}
        </g>
      )}

      {view === 'back' && (
        <g stroke={bodyStrokeColor} strokeWidth={muscleStrokeWidth}>
          {/* Trapezius */}
          <path d="M150,80 C130,90 125,120 135,150 L150,180 L165,150 C175,120 170,90 150,80 Z 
                   M150,80 L150,130 M140,120 L160,120" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Trapezius])} />
          
          {/* Posterior Deltoids */}
          <path d="M115,130 C100,135 95,150 100,165 C105,175 115,170 115,160 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.PosteriorDeltoid])} /> {/* Left */}
          <path d="M185,130 C200,135 205,150 200,165 C195,175 185,170 185,160 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.PosteriorDeltoid])} /> {/* Right */}
           {/* Lateral Deltoids (visible from back too) */}
          <path d="M92,135 C85,140 82,155 88,165 C92,170 95,165 92,155 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.LateralDeltoid])} /> {/* Left Lateral */}
          <path d="M208,135 C215,140 218,155 212,165 C208,170 205,165 208,155 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.LateralDeltoid])} /> {/* Right Lateral */}


          {/* Latissimus Dorsi (Lats) */}
          <path d="M125,170 C100,190 100,250 130,285 L140,285 L140,175 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.LatissimusDorsi])} /> {/* Left */}
          <path d="M175,170 C200,190 200,250 170,285 L160,285 L160,175 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.LatissimusDorsi])} /> {/* Right */}
          
          {/* Rhomboids (simplified, under traps) */}
          <path d="M140,140 L160,140 L155,170 L145,170 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Rhomboids])} />

          {/* Erector Spinae */}
          <path d="M142,180 C140,220 140,260 142,290 L148,290 L148,180 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.ErectorSpinae])} /> {/* Left Strip */}
          <path d="M158,180 C160,220 160,260 158,290 L152,290 L152,180 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.ErectorSpinae])} /> {/* Right Strip */}
          
          {/* Triceps Brachii */}
          <path d="M105,175 C100,185 100,215 110,225 C115,230 120,220 115,200 C112,185 110,175 105,175 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.TricepsBrachii])} /> {/* Left */}
          <path d="M195,175 C200,185 200,215 190,225 C185,230 180,220 185,200 C188,185 190,175 195,175 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.TricepsBrachii])} /> {/* Right */}

          {/* Gluteus Maximus */}
          <path d="M105,290 C95,300 95,335 120,345 C140,350 145,330 145,310 C145,295 130,290 105,290 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.GluteusMaximus])} /> {/* Left */}
          <path d="M195,290 C205,300 205,335 180,345 C160,350 155,330 155,310 C155,295 170,290 195,290 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.GluteusMaximus])} /> {/* Right */}
          
          {/* Hamstrings */}
          <path d="M110,345 C105,370 110,410 125,435 L135,435 C140,410 140,370 135,345 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Hamstrings])} /> {/* Left */}
          <path d="M165,345 C160,370 160,410 175,435 L185,435 C190,410 190,370 185,345 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Hamstrings])} /> {/* Right */}

          {/* Forearms (simplified, back view) */}
           <path d="M88,230 C83,250 88,280 98,280 L103,280 C103,260 98,240 93,230 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Forearms])} /> {/* Left */}
          <path d="M212,230 C217,250 212,280 202,280 L197,280 C197,260 202,240 207,230 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Forearms])} /> {/* Right */}

          {/* Calves (Gastrocnemius/Soleus - back view) */}
          <path d="M115,435 C110,455 115,470 125,475 L135,475 C135,465 130,450 125,435 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Calves])} /> {/* Left */}
          <path d="M185,435 C190,455 185,470 175,475 L165,475 C165,465 170,450 175,435 Z" fill={getMuscleSvgFillColor(muscleVolumes[Muscle.Calves])} /> {/* Right */}
        </g>
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
            <div className="relative w-full aspect-[3/5] max-w-xs sm:max-w-sm mb-4 rounded-lg overflow-hidden bg-muted/10 border border-border">
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
                    if (activation.level === "None" && !volume) return null; // Only show if there's some volume or explicitly "None"

                    return (
                      <li key={muscleName} className={`flex justify-between items-center p-2 rounded-md text-sm ${activation.color}`}>
                        <span>{muscleName}</span>
                        <Badge variant={activation.level === "High" ? "destructive" : activation.level === "Medium" ? "default" : "secondary"} className="capitalize">
                          {activation.level} {volume !== undefined ? `(${Math.round(volume)})` : ''}
                        </Badge>
                      </li>
                    );
                  })}
                   {Object.values(muscleVolumes).every(v => v === 0 || v === undefined) && (
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
    

      