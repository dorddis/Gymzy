import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle, ChevronRight } from 'lucide-react';
import { Exercise } from '@/types/exercise';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExerciseListProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onInfo: (exercise: Exercise) => void;
}

export function ExerciseList({ exercises, onSelect, onInfo }: ExerciseListProps) {
  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="bg-gray-100 rounded-xl p-3 flex justify-between items-center cursor-pointer"
            onClick={() => onSelect(exercise)}
          >
            <div className="flex items-center flex-1">
              <span className="font-medium">{exercise.name}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 w-5 h-5 rounded-full bg-gray-200 text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInfo(exercise);
                      }}
                    >
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View exercise details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 