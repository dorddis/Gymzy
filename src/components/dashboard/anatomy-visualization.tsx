
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scan, UserRound, RotateCcwSquare } from "lucide-react"; // Using RotateCcwSquare for back view

export function AnatomyVisualization() {
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');

  const toggleView = () => {
    setCurrentView(prevView => prevView === 'front' ? 'back' : 'front');
  };

  return (
    <Card className="flex flex-col h-full shadow-xl bg-card hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Scan className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-xl">Interactive Anatomy</CardTitle>
        </div>
        <CardDescription>Visualize muscle engagement. Switch between front and back 2D anatomy views.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="relative w-full aspect-[3/4] max-w-xs sm:max-w-sm md:max-w-md mb-4 rounded-lg overflow-hidden bg-muted/50 border border-border">
          {currentView === 'front' ? (
            <Image 
              src="https://placehold.co/300x500.png" 
              alt="Anatomy Front View" 
              layout="fill" 
              objectFit="contain"
              data-ai-hint="anatomy front"
            />
          ) : (
            <Image 
              src="https://placehold.co/300x500.png" 
              alt="Anatomy Back View" 
              layout="fill" 
              objectFit="contain"
              data-ai-hint="anatomy back"
            />
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="default" 
            aria-label="Show Front View" 
            className="transition-transform hover:scale-110 active:scale-95"
            onClick={() => setCurrentView('front')}
            disabled={currentView === 'front'}
          >
            <UserRound className="w-5 h-5 mr-2" /> Front
          </Button>
          <Button 
            variant="outline" 
            size="default" 
            aria-label="Show Back View" 
            className="transition-transform hover:scale-110 active:scale-95"
            onClick={() => setCurrentView('back')}
            disabled={currentView === 'back'}
          >
            <RotateCcwSquare className="w-5 h-5 mr-2" /> Back 
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground px-2">
          Use the buttons above to switch between front and back views.
        </p>
      </CardContent>
    </Card>
  );
}
