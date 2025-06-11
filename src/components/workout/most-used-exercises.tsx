import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Exercise } from '@/types/exercise';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Import chevron icons

interface MostUsedExercisesProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
}

export function MostUsedExercises({ exercises, onSelect }: MostUsedExercisesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200; // Adjust as needed
      if (direction === 'left') {
        scrollRef.current.scrollLeft -= scrollAmount;
      } else {
        scrollRef.current.scrollLeft += scrollAmount;
      }
    }
  };

  return (
    <div className="mb-6 relative">
      <h3 className="text-sm font-medium mb-2">Most Used</h3>
      <ScrollArea viewportRef={scrollRef} className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-4">
          {exercises.map((exercise) => (
            <Button
              key={exercise.id}
              variant="outline"
              className="rounded-full text-sm flex-shrink-0"
              onClick={() => onSelect(exercise)}
            >
              {exercise.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Left Chevron Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 rounded-full shadow-md z-10"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Right Chevron Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 rounded-full shadow-md z-10"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
} 