import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Exercise } from '@/types/exercise';

interface MostUsedExercisesProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
}

export function MostUsedExercises({ exercises, onSelect }: MostUsedExercisesProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-2">Most Used</h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-4">
          {exercises.map((exercise) => (
            <Button
              key={exercise.id}
              variant="outline"
              className="rounded-full text-sm"
              onClick={() => onSelect(exercise)}
            >
              {exercise.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
} 