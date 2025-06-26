import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Exercise } from '@/types/exercise';

interface ExerciseInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: Exercise | null;
}

export function ExerciseInfoModal({ open, onOpenChange, exercise }: ExerciseInfoModalProps) {
  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 rounded-xl">
        <div className="px-4 py-5 flex justify-between items-center border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold">{exercise.name}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {exercise.category && (
            <div>
              <h4 className="font-medium text-gray-700">Category:</h4>
              <p className="text-gray-600">{exercise.category}</p>
            </div>
          )}
          {exercise.primaryMuscles && exercise.primaryMuscles.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700">Primary Muscles:</h4>
              <p className="text-gray-600">{exercise.primaryMuscles.join(', ')}</p>
            </div>
          )}
          {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700">Secondary Muscles:</h4>
              <p className="text-gray-600">{exercise.secondaryMuscles.join(', ')}</p>
            </div>
          )}
          {exercise.equipment && (
            <div>
              <h4 className="font-medium text-gray-700">Equipment:</h4>
              <p className="text-gray-600">{exercise.equipment}</p>
            </div>
          )}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700">Instructions:</h4>
              <ul className="list-disc list-inside text-gray-600">
                {exercise.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>
          )}
          {exercise.tips && exercise.tips.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700">Tips:</h4>
              <ul className="list-disc list-inside text-gray-600">
                {exercise.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          {exercise.imageUrl && (
            <div>
              <h4 className="font-medium text-gray-700">Image:</h4>
              <img src={exercise.imageUrl} alt={exercise.name} className="mt-2 rounded-md" />
            </div>
          )}
          {exercise.videoUrl && (
            <div>
              <h4 className="font-medium text-gray-700">Video:</h4>
              <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                Watch Video
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 