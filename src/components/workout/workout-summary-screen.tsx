import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
// Removed: import { AddWorkoutModal } from '@/components/dashboard/add-workout-modal';
import { Exercise, ExerciseWithSets } from '@/types/exercise';
import { Plus, MoreVertical, HelpCircle, Trash2, Info, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
// import { ScrollArea } from '@/components/ui/scroll-area'; // Remove ScrollArea import
// import { ExerciseInfoModal } from '@/components/workout/exercise-info-modal'; // Keep this for now for the help button
import { Muscle } from '@/lib/constants';
import { MuscleActivationSVG } from '@/components/workout/muscle-activation-svg'; // Import the new SVG component
import { useWorkout } from '@/contexts/WorkoutContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, ArrowDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkoutSummaryScreenProps {
  toggleSetExecuted: (exerciseIndex: number, setIndex: number) => void;
  showIncompleteSetsWarning: boolean;
  remainingSets: number;
}

export function WorkoutSummaryScreen({ 
  toggleSetExecuted,
  showIncompleteSetsWarning,
  remainingSets
}: WorkoutSummaryScreenProps) {
  const { currentWorkoutExercises, setCurrentWorkoutExercises } = useWorkout();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = React.useState(false);
  const [exerciseToDeleteIndex, setExerciseToDeleteIndex] = React.useState<number | null>(null);
  const [deletingExerciseId, setDeletingExerciseId] = React.useState<string | null>(null);
  const [expandedNotesExerciseId, setExpandedNotesExerciseId] = React.useState<string | null>(null);

  // Calculate total sets
  const totalSets = React.useMemo(() => 
    currentWorkoutExercises.reduce((total: number, exercise: ExerciseWithSets) => 
      total + exercise.sets.length, 0),
    [currentWorkoutExercises]
  );

  // Check if all sets are executed
  const allSetsExecuted = React.useMemo(() => 
    currentWorkoutExercises.every(exercise => 
      exercise.sets.every(set => set.isExecuted)
    ),
    [currentWorkoutExercises]
  );

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof ExerciseWithSets['sets'][0], value: number | boolean) => {
    setCurrentWorkoutExercises((prevExercises: ExerciseWithSets[]) => {
      const newExercises = [...prevExercises];
      newExercises[exerciseIndex] = {
        ...newExercises[exerciseIndex],
        sets: newExercises[exerciseIndex].sets.map((set, i) => 
          i === setIndex ? { ...set, [field]: value } : set
        )
      };
      return newExercises;
    });
  };

  const addSetToExercise = (exerciseIndex: number, isWarmup: boolean = false) => {
    setCurrentWorkoutExercises((prevExercises: ExerciseWithSets[]) => {
      const newExercises = [...prevExercises];
      const currentSets = [...newExercises[exerciseIndex].sets];
      
      // Get the last non-warmup set's values if adding a regular set
      // or the last warmup set's values if adding a warmup set
      let lastSetValues = { weight: 0, reps: 0, rpe: 0 };
      if (currentSets.length > 0) {
        if (isWarmup) {
          // Find the last warmup set
          for (let i = currentSets.length - 1; i >= 0; i--) {
            if (currentSets[i].isWarmup) {
              lastSetValues = { ...currentSets[i] };
              break;
            }
          }
        } else {
          // Find the last non-warmup set
          for (let i = currentSets.length - 1; i >= 0; i--) {
            if (!currentSets[i].isWarmup) {
              lastSetValues = { ...currentSets[i] };
              break;
            }
          }
        }
      }

      const newSet = { 
        ...lastSetValues,
        isWarmup, 
        isExecuted: false 
      };

      if (isWarmup) {
        // Find the last warmup set index to insert after it, or at the beginning if no warmups exist
        let insertIndex = 0;
        for (let i = currentSets.length - 1; i >= 0; i--) {
          if (currentSets[i].isWarmup) {
            insertIndex = i + 1;
            break;
          }
        }
        currentSets.splice(insertIndex, 0, newSet);
      } else {
        currentSets.push(newSet);
      }
      
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: currentSets };
      return newExercises;
    });
  };

  const removeSetFromExercise = (exerciseIndex: number, setIndex: number) => {
    setCurrentWorkoutExercises((prevExercises: ExerciseWithSets[]) => {
      const newExercises = [...prevExercises];
      const newSets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: newSets };
      return newExercises;
    });
  };

  const moveExerciseUp = (index: number) => {
    setCurrentWorkoutExercises((prevExercises: ExerciseWithSets[]) => {
      if (index === 0) return prevExercises; // Cannot move up the first item
      const newExercises = [...prevExercises];
      const [movedExercise] = newExercises.splice(index, 1);
      newExercises.splice(index - 1, 0, movedExercise);
      return newExercises;
    });
  };

  const moveExerciseDown = (index: number) => {
    setCurrentWorkoutExercises((prevExercises: ExerciseWithSets[]) => {
      if (index === prevExercises.length - 1) return prevExercises; // Cannot move down the last item
      const newExercises = [...prevExercises];
      const [movedExercise] = newExercises.splice(index, 1);
      newExercises.splice(index + 1, 0, movedExercise);
      return newExercises;
    });
  };

  const confirmRemoveExercise = (index: number) => {
    setExerciseToDeleteIndex(index);
    setIsConfirmDeleteOpen(true);
  };

  const handleRemoveExercise = () => {
    if (exerciseToDeleteIndex !== null) {
      const exerciseId = currentWorkoutExercises[exerciseToDeleteIndex].id;
      setDeletingExerciseId(exerciseId);
      setTimeout(() => {
        setCurrentWorkoutExercises((prevExercises: ExerciseWithSets[]) => 
          prevExercises.filter((_, i) => i !== exerciseToDeleteIndex)
        );
        setIsConfirmDeleteOpen(false);
        setExerciseToDeleteIndex(null);
        setDeletingExerciseId(null);
      }, 300); // Duration of the fade-out animation
    }
  };

  const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
    setCurrentWorkoutExercises((prevExercises: ExerciseWithSets[]) => {
      const newExercises = [...prevExercises];
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], notes };
      return newExercises;
    });
  };

  const toggleNotesVisibility = (exerciseId: string) => {
    setExpandedNotesExerciseId(prevId => (prevId === exerciseId ? null : exerciseId));
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showIncompleteSetsWarning && !allSetsExecuted && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-lg shadow-lg"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 font-medium">
                    You have {remainingSets} unfinished sets. Please mark all sets as executed before finishing your workout.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    1
                  </div>
                  <ArrowRight className="h-4 w-4" />
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <span>Tap the number circles to mark sets as executed</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentWorkoutExercises.length === 0 ? (
        <p className="text-center text-gray-500">No exercises added yet. Click "Add Exercise" to start!</p>
      ) : (
        <div className="space-y-4"> {/* Reduced vertical spacing between exercises */}
          {currentWorkoutExercises.map((exercise, exerciseIndex) => (
            <div 
              key={exercise.id}
              className={`bg-white rounded-xl shadow-sm p-3 border border-gray-200 transition-all duration-300 ease-in-out
                ${deletingExerciseId === exercise.id ? 'opacity-0 transform -translate-y-4' : ''}
              `}
              style={{ order: exerciseIndex }} // This helps with FLIP animations for reordering
            >
              <div className="flex justify-between items-center mb-2"> {/* Reduced margin */}
                <h3 className="text-lg font-semibold">{exercise.name}</h3>
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => moveExerciseUp(exerciseIndex)} disabled={exerciseIndex === 0}>
                        Move Up
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => moveExerciseDown(exerciseIndex)} disabled={exerciseIndex === currentWorkoutExercises.length - 1}>
                        Move Down
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleNotesVisibility(exercise.id)}>
                        {expandedNotesExerciseId === exercise.id ? "Hide Notes" : "Show Notes"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => confirmRemoveExercise(exerciseIndex)} className="text-red-500">
                        Delete Exercise
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Exercise Notes Section (Conditionally Rendered) */}
              {expandedNotesExerciseId === exercise.id && (
                <div className="mb-4 mt-2">
                  <label htmlFor={`notes-${exercise.id}`} className="text-sm font-semibold text-gray-700 mb-1 block">Notes:</label>
                  <textarea
                    id={`notes-${exercise.id}`}
                    value={exercise.notes || ''}
                    onChange={(e) => updateExerciseNotes(exerciseIndex, e.target.value)}
                    placeholder="Add exercise notes here..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-2 mb-2"> {/* Reduced margin */}
                <Button
                  variant="ghost"
                  className="flex-1 flex items-center justify-center text-primary-500 hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-primary-500 active:text-primary-500 focus:text-primary-500"
                  onClick={() => addSetToExercise(exerciseIndex, true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Warm-up
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 flex items-center justify-center text-primary-500 hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-primary-500 active:text-primary-500 focus:text-primary-500"
                  onClick={() => addSetToExercise(exerciseIndex)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Set
                </Button>
              </div>

              <div className="space-y-2"> {/* Reduced vertical spacing between sets */}
                {exercise.sets.map((set, setIndex) => (
                  <div key={setIndex} className="flex items-center justify-between bg-transparent p-2"> {/* Reduced padding */}
                    <div className="flex items-center space-x-3">
                      <button
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${
                          set.isExecuted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-secondary/10 text-secondary'
                        }`}
                        onClick={() => toggleSetExecuted(exerciseIndex, setIndex)}
                      >
                        {set.isWarmup ? "W" : setIndex + 1}
                      </button>
                      <div className="flex items-center justify-center space-x-1">
                        <div className="flex items-center justify-center">
                          <Input
                            type="number"
                            value={set.weight}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                            className="w-12 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                          />
                          <span className="text-xs text-gray-600">kg</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <Input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                            className="w-12 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                          />
                          <span className="text-xs text-gray-600">reps</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <Input
                            type="number"
                            value={set.rpe}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', parseFloat(e.target.value) || 0)}
                            className="w-12 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                          />
                          <span className="text-xs text-gray-600">RPE</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeSetFromExercise(exerciseIndex, setIndex)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exercise? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveExercise}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 