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
  const { latestWorkout } = useWorkout();

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
    // Find the exact exercise from EXERCISES to ensure ID matches
    const exactExercise = EXERCISES.find(e => e.id === exercise.id);
    if (!exactExercise) {
      console.error(`Exercise not found: ${exercise.id}`);
      return;
    }
    
    let setsToCopy = [{ weight: 0, reps: 0, rpe: 0, isWarmup: false, isExecuted: false }];

    if (copyLastSession && latestWorkout) {
      const lastSessionExercise = latestWorkout.exercises.find(
        (ex) => ex.exerciseId === exactExercise.id
      );

      if (lastSessionExercise && lastSessionExercise.sets.length > 0) {
        setsToCopy = lastSessionExercise.sets.map(set => ({
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe || 0,
          isWarmup: set.isWarmup || false,
          isExecuted: false, // Sets from previous session should not be pre-marked as executed
        }));
      }
    }

    onExerciseSave({ 
      ...exactExercise, 
      sets: setsToCopy
    });
    onOpenChange(false); // Close the modal
  }, [onExerciseSave, onOpenChange, copyLastSession, latestWorkout]);

  const handleExerciseInfo = useCallback((exercise: Exercise) => {
    // TODO: Show exercise details modal - this will need to be re-evaluated if still needed
    console.log('Show exercise info:', exercise);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-w-lg w-[90vw] md:w-full h-auto max-h-[95vh] p-0 rounded-xl overflow-hidden">
        <div className="px-4 py-5 flex justify-between items-center border-b border-gray-200 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">Add Exercise</DialogTitle>
        </div>

        <div className="p-4 flex flex-col flex-grow overflow-y-auto">
          {/* Date and Copy Last Session */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
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
          <div className="mb-4 flex-shrink-0">
            <ExerciseSearch onSearch={handleSearch} />
          </div>

          <MostUsedExercises
            exercises={mostUsedExercises}
            onSelect={handleExerciseSelect}
          />

          <ExerciseList
            exercises={filteredExercises}
            onSelect={handleExerciseSelect}
            onInfo={handleExerciseInfo}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 