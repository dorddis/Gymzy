import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AddWorkoutModal } from '@/components/dashboard/add-workout-modal';
import { Exercise, ExerciseWithSets } from '@/types/exercise';
import { Plus, MoreVertical, HelpCircle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { ExerciseInfoModal } from '@/components/workout/exercise-info-modal'; // Keep this for now for the help button
import { Muscle } from '@/lib/constants';
import { MuscleActivationSVG } from '@/components/workout/muscle-activation-svg'; // Import the new SVG component

export function WorkoutSummaryScreen() {
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  // const [isExerciseInfoModalOpen, setIsExerciseInfoModalOpen] = useState(false);
  // const [exerciseInfoModalExercise, setExerciseInfoModalExercise] = useState<Exercise | null>(null);
  const [currentWorkoutExercises, setCurrentWorkoutExercises] = useState<ExerciseWithSets[]>([]);

  const handleAddExercise = (exerciseWithSets: ExerciseWithSets) => {
    setCurrentWorkoutExercises(prev => [...prev, exerciseWithSets]);
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
      const newSets = [...newExercises[exerciseIndex].sets, { weight: 0, reps: 0, rpe: 0, isWarmup }];
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: newSets };
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

  // const openExerciseInfoModal = (exercise: Exercise) => {
  //   setExerciseInfoModalExercise(exercise);
  //   setIsExerciseInfoModalOpen(true);
  // };

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

  // const handleExportCSV = () => {
  //   let csvContent = "Exercise,Set,Weight,Reps,RPE,Warmup\n";
  //   currentWorkoutExercises.forEach(exercise => {
  //     exercise.sets.forEach((set, setIndex) => {
  //       csvContent += `${exercise.name},${set.isWarmup ? 'Warmup' : setIndex + 1},${set.weight},${set.reps},${set.rpe},${set.isWarmup ? 'Yes' : 'No'}\n`;
  //     });
  //   });

  //   csvContent += "\nTotal Volume (kg):," + totalVolume + "\n";
  //   csvContent += "Muscle,Activated Volume (kg)\n";
  //   Array.from(Object.entries(muscleVolumes)).forEach(([muscle, volume]) => {
  //     csvContent += `${muscle},${volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n`;
  //   });

  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //   const link = document.createElement('a');
  //   link.href = URL.createObjectURL(blob);
  //   link.setAttribute('download', `workout_${new Date().toISOString().slice(0, 10)}.csv`);
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  return (
    <div className="p-4">
      <MuscleActivationSVG muscleVolumes={muscleVolumes} /> {/* Integrated Muscle Activation SVG */}

      {/* Current workout exercises */}
      <ScrollArea className="h-[calc(100vh-170px)]"> {/* Adjusted height after removing CSV button and smaller footer */}
        {currentWorkoutExercises.length === 0 ? (
          <p className="text-center text-gray-500">No exercises added yet. Click "Add Exercise" to start!</p>
        ) : (
          <div className="space-y-6">
            {currentWorkoutExercises.map((exercise, exerciseIndex) => (
              <div key={exercise.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200"> {/* Added rounded border */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{exercise.name}</h3>
                  <div className="flex items-center space-x-2">
                    {/* <Button variant="ghost" size="icon" onClick={() => openExerciseInfoModal(exercise)}>
                      <HelpCircle className="h-4 w-4 text-gray-500" />
                    </Button> */}
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>

                {/* Warm-up and Sets */}
                <div className="space-y-3">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center justify-between bg-transparent p-3"> {/* Removed bg-gray-100 */}
                      <div className="flex items-center space-x-3">
                        {set.isWarmup ? (
                          <span className="text-md font-semibold text-purple-600">Warm-up</span>
                        ) : (
                          <span className="text-sm font-semibold text-secondary flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10">{setIndex + 1}</span>
                        )}
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={set.weight}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                            className="w-16 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto" // No border, smaller, no ring
                          />
                          <span className="text-sm text-gray-600">kg</span>
                          <Input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                            className="w-16 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto" // No border, smaller, no ring
                          />
                          <span className="text-sm text-gray-600">reps</span>
                          <Input
                            type="number"
                            value={set.rpe}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', parseFloat(e.target.value) || 0)}
                            className="w-16 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto" // No border, smaller, no ring
                          />
                          <span className="text-sm text-gray-600">RPE</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-1">
                          <Checkbox
                            checked={set.isWarmup}
                            onCheckedChange={(checked) => updateSet(exerciseIndex, setIndex, 'isWarmup', checked as boolean)}
                            className="border-gray-300" // Keep border for checkbox if desired
                          />
                          <span className="text-xs text-gray-600">Warmup</span>
                        </label>
                        <Button variant="ghost" size="icon" onClick={() => removeSetFromExercise(exerciseIndex, setIndex)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-center text-primary-500 mt-2"
                    onClick={() => addSetToExercise(exerciseIndex, true)} // Add Warm-up Set
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Warm-up
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-center text-primary-500"
                    onClick={() => addSetToExercise(exerciseIndex)} // Add Regular Set
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Set
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add Exercise Button, Summary, and Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex flex-col gap-2"> {/* Adjusted bottom for nav bar removal */}
        <div className="flex justify-between items-center">
          <h4 className="text-md font-semibold">Total Volume:</h4>
          <span className="text-lg font-bold">{totalVolume.toLocaleString()} kg</span>
        </div>

        {/* Removed detailed muscle activation display */}

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

      <AddWorkoutModal
        open={isAddExerciseModalOpen}
        onOpenChange={() => setIsAddExerciseModalOpen(false)}
        onExerciseSave={handleAddExercise}
      />

      {/* {isExerciseInfoModalOpen && exerciseInfoModalExercise && (
        <ExerciseInfoModal
          isOpen={isExerciseInfoModalOpen}
          onClose={() => setIsExerciseInfoModalOpen(false)}
          exercise={exerciseInfoModalExercise}
        />
      )} */}
    </div>
  );
} 