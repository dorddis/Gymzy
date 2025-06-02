
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Scan, UserRound, RotateCcwSquare, TrendingUp, Zap } from "lucide-react";
import { useWorkout } from '@/contexts/WorkoutContext';
import { Muscle, MUSCLE_VOLUME_THRESHOLDS } from '@/lib/constants';

const getMuscleActivationLevel = (volume: number | undefined): {level: "Low" | "Medium" | "High" | "None", color: string} => {
  if (volume === undefined || volume === 0) return {level: "None", color: "bg-muted/20"};
  if (volume < MUSCLE_VOLUME_THRESHOLDS.LOW) return {level: "Low", color: "bg-green-500/30"};
  if (volume < MUSCLE_VOLUME_THRESHOLDS.MEDIUM) return {level: "Medium", color: "bg-yellow-500/40"};
  return {level: "High", color: "bg-red-500/50"};
};

export function AnatomyVisualization() {
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const { muscleVolumes } = useWorkout();

  const toggleView = () => {
    setCurrentView(prevView => prevView === 'front' ? 'back' : 'front');
  };

  // Filter muscles based on view (simplified: all muscles for now, could be refined)
  // For a real app, you'd map muscles to front/back views
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
              {currentView === 'front' ? (
                <Image 
                  src="https://placehold.co/300x500.png" 
                  alt="Anatomy Front View" 
                  layout="fill" 
                  objectFit="contain"
                  data-ai-hint="anatomy front"
                  priority
                />
              ) : (
                <Image 
                  src="https://placehold.co/300x500.png" 
                  alt="Anatomy Back View" 
                  layout="fill" 
                  objectFit="contain"
                  data-ai-hint="anatomy back"
                  priority
                />
              )}
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
                    if (activation.level === "None" && !volume) return null; // Don't show unworked muscles unless they have 0 volume explicitly

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
