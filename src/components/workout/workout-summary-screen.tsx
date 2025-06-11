import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AddWorkoutModal } from '@/components/dashboard/add-workout-modal';
import { Exercise, ExerciseWithSets } from '@/types/exercise';
import { Plus, MoreVertical, HelpCircle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
// import { ScrollArea } from '@/components/ui/scroll-area'; // Remove ScrollArea import
// import { ExerciseInfoModal } from '@/components/workout/exercise-info-modal'; // Keep this for now for the help button
import { Muscle } from '@/lib/constants';
import { MuscleActivationSVG } from '@/components/workout/muscle-activation-svg'; // Import the new SVG component

export function WorkoutSummaryScreen() {
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  // const contentScrollRef = useRef<HTMLDivElement>(null); // No longer needed here

  const [currentWorkoutExercises, setCurrentWorkoutExercises] = useState<ExerciseWithSets[]>([]);

  const handleAddExercise = (exerciseWithSets: ExerciseWithSets) => {
    // Check if exercise already exists in the workout
    const existingExerciseIndex = currentWorkoutExercises.findIndex(
      (e) => e.id === exerciseWithSets.id
    );

    if (existingExerciseIndex !== -1) {
      // If exercise exists, add a new set to it
      setCurrentWorkoutExercises(prevExercises => {
        const newExercises = [...prevExercises];
        const existingExercise = newExercises[existingExerciseIndex];
        newExercises[existingExerciseIndex] = {
          ...existingExercise,
          sets: [
            ...existingExercise.sets,
            { weight: 0, reps: 0, rpe: 0, isWarmup: false }
          ]
        };
        return newExercises;
      });
    } else {
      // If exercise doesn't exist, add it as a new exercise
      setCurrentWorkoutExercises(prev => [...prev, exerciseWithSets]);
    }
    setIsAddExerciseModalOpen(false);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof ExerciseWithSets['sets'][0], value: number | boolean) => {
    setCurrentWorkoutExercises(prevExercises => {
      const newExercises = [...prevExercises];
      const newSets = [...newExercises[exerciseIndex].sets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: newSets };
      return newExercises;
    });
  };

  const addSetToExercise = (exerciseIndex: number, isWarmup: boolean = false) => {
    setCurrentWorkoutExercises(prevExercises => {
      const newExercises = [...prevExercises];
      const currentSets = [...newExercises[exerciseIndex].sets];
      const newSet = { weight: 0, reps: 0, rpe: 0, isWarmup };

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
    setCurrentWorkoutExercises(prevExercises => {
      const newExercises = [...prevExercises];
      const newSets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: newSets };
      return newExercises;
    });
  };

  const totalVolume = useMemo(() => {
    return currentWorkoutExercises.reduce((totalExerciseVolume, exercise) => {
      const exerciseVolume = exercise.sets.reduce((totalSetVolume, set) => {
        return totalSetVolume + (set.weight * set.reps);
      }, 0);
      return totalExerciseVolume + exerciseVolume;
    }, 0);
  }, [currentWorkoutExercises]);

  const muscleVolumes = useMemo(() => {
    const volumes: Record<Muscle, number> = Object.values(Muscle).reduce((acc, muscle) => {
      acc[muscle] = 0;
      return acc;
    }, {} as Record<Muscle, number>);

    currentWorkoutExercises.forEach(exercise => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);

      const distributeVolume = (muscles: Muscle[], volume: number) => {
        if (muscles.length === 0) return;
        const volumePerMuscle = volume / muscles.length;
        muscles.forEach(muscle => {
          volumes[muscle] = (volumes[muscle] || 0) + volumePerMuscle;
        });
      };

      distributeVolume(exercise.primaryMuscles, exerciseVolume * 0.7); // Primary muscles get 70% of volume
      distributeVolume(exercise.secondaryMuscles, exerciseVolume * 0.3); // Secondary muscles get 30% of volume
    });

    return volumes;
  }, [currentWorkoutExercises]);

  const handleFinishWorkout = () => {
    // TODO: Implement logic to save the workout to the backend
    console.log("Workout Finished:", currentWorkoutExercises);
    console.log("Total Volume:", totalVolume);
    console.log("Muscle Volumes:", muscleVolumes);
    alert("Workout Finished! Check console for details.");
    setCurrentWorkoutExercises([]); // Clear exercises after finishing workout
  };

  return (
    <div className="px-4"> {/* Removed general p-4, using px-4 for horizontal padding only */}
      {/* Muscle Activation SVG is now in src/app/workout/page.tsx, removed from here */}

      {/* Main content area, padding for exercises will be here */}
      <div>
        {currentWorkoutExercises.length === 0 ? (
          <p className="text-center text-gray-500">No exercises added yet. Click "Add Exercise" to start!</p>
        ) : (
          <div className="space-y-6">
            {currentWorkoutExercises.map((exercise, exerciseIndex) => (
              <div key={exercise.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{exercise.name}</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <Button
                    variant="ghost"
                    className="flex-1 flex items-center justify-center text-primary-500"
                    onClick={() => addSetToExercise(exerciseIndex, true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Warm-up
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 flex items-center justify-center text-primary-500"
                    onClick={() => addSetToExercise(exerciseIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Set
                  </Button>
                </div>

                <div className="space-y-3">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center justify-between bg-transparent p-3">
                      <div className="flex items-center space-x-3">
                        {set.isWarmup ? (
                          <span className="text-sm font-semibold text-secondary flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10">W</span>
                        ) : (
                          <span className="text-sm font-semibold text-secondary flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10">{setIndex + 1}</span>
                        )}
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={set.weight}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="w-12 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                          />
                          <span className="text-xs text-gray-600 -ml-1">kg</span>
                          <Input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="w-12 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                          />
                          <span className="text-xs text-gray-600 -ml-1">reps</span>
                          <Input
                            type="number"
                            value={set.rpe}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="w-12 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                          />
                          <span className="text-xs text-gray-600 -ml-1">RPE</span>
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

        {/* Add Exercise Button, Summary, and Action Buttons */}
        <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-2 mt-6">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-semibold">Total Volume:</h4>
            <span className="text-lg font-bold">{totalVolume.toLocaleString()} kg</span>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              className="flex-[2] bg-primary text-white py-3 rounded-xl font-semibold shadow-sm"
              onClick={() => setIsAddExerciseModalOpen(true)}
            >
              + Add Exercise
            </Button>
            <Button
              className="flex-[1] bg-blue-500 text-white py-3 rounded-xl font-semibold shadow-sm"
              onClick={() => console.log('Special set clicked')}
            >
              + Special set
            </Button>
          </div>

          <Button
            className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold shadow-sm"
            onClick={handleFinishWorkout}
          >
            Finish Workout
          </Button>
        </div>
      </div>

      <AddWorkoutModal
        open={isAddExerciseModalOpen}
        onOpenChange={() => setIsAddExerciseModalOpen(false)}
        onExerciseSave={handleAddExercise}
      />
    </div>
  );
} 