import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { useWorkout } from '@/contexts/WorkoutContext';
import { Exercise, ExerciseWithSets } from '@/types/exercise';
import { ExerciseSearch } from '@/components/workout/exercise-search';
import { MostUsedExercises } from '@/components/workout/most-used-exercises';
import { ExerciseList } from '@/components/workout/exercise-list';
import { EXERCISES } from '@/lib/constants';

interface AddWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExerciseSave: (exerciseWithSets: ExerciseWithSets) => void;
}

export function AddWorkoutModal({ open, onOpenChange, onExerciseSave }: AddWorkoutModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copyLastSession, setCopyLastSession] = useState(false);
  const { recentWorkouts } = useWorkout();

  // Filter exercises based on search query
  const filteredExercises = EXERCISES.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get most used exercises (placeholder logic - can be enhanced based on actual usage data)
  const mostUsedExercises = EXERCISES.slice(0, 5);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleExerciseSelect = useCallback((exercise: Exercise) => {
    // Directly save the exercise with an initial empty set
    onExerciseSave({ ...exercise, sets: [{ weight: 0, reps: 0, rpe: 0, isWarmup: false }] });
    onOpenChange(false); // Close the modal
  }, [onExerciseSave, onOpenChange]);

  const handleExerciseInfo = useCallback((exercise: Exercise) => {
    // TODO: Show exercise details modal - this will need to be re-evaluated if still needed
    console.log('Show exercise info:', exercise);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 rounded-xl">
        <>
          <div className="px-4 py-5 flex justify-between items-center border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold">Add Exercise</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4">
            {/* Date and Copy Last Session */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </p>
              </div>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={copyLastSession}
                  onCheckedChange={(checked) => setCopyLastSession(checked as boolean)}
                />
                <span className="text-sm">Copy last session sets</span>
              </label>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <ExerciseSearch onSearch={handleSearch} />
            </div>

            {/* Most Used Exercises */}
            <MostUsedExercises
              exercises={mostUsedExercises}
              onSelect={handleExerciseSelect}
            />

            {/* Exercise List */}
            <ExerciseList
              exercises={filteredExercises}
              onSelect={handleExerciseSelect}
              onInfo={handleExerciseInfo}
            />
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
} 