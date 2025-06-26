'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExerciseWithSets } from '@/types/exercise';
import { X, Clock, Zap, Info } from 'lucide-react';

interface RestPauseParameters {
  restPauseDuration: number; // seconds for mini-rest
  miniSets: number; // number of mini-sets after failure
  targetTotalReps: number; // total reps to aim for across all mini-sets
}

interface RestPauseCreatorProps {
  exercises: ExerciseWithSets[];
  onCreateRestPause: (exerciseId: string, parameters: RestPauseParameters) => void;
  onClose: () => void;
}

export function RestPauseCreator({ exercises, onCreateRestPause, onClose }: RestPauseCreatorProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [parameters, setParameters] = useState<RestPauseParameters>({
    restPauseDuration: 15, // 15 seconds mini-rest
    miniSets: 3, // 3 mini-sets after failure
    targetTotalReps: 20 // aim for 20 total reps
  });

  const handleCreate = () => {
    if (selectedExercise) {
      onCreateRestPause(selectedExercise, parameters);
    }
  };

  const selectedExerciseData = exercises.find(ex => ex.id === selectedExercise);
  const lastSet = selectedExerciseData?.sets[selectedExerciseData.sets.length - 1];
  const baseWeight = lastSet?.weight || 100;
  const baseReps = lastSet?.reps || 8;

  const estimatedMiniSetReps = () => {
    // Typically each mini-set yields 2-4 reps after failure
    const avgRepsPerMiniSet = Math.max(2, Math.floor((parameters.targetTotalReps - baseReps) / parameters.miniSets));
    return Array.from({ length: parameters.miniSets }, (_, i) => 
      Math.max(1, avgRepsPerMiniSet - i) // Decreasing reps per mini-set
    );
  };

  const totalEstimatedReps = baseReps + estimatedMiniSetReps().reduce((sum, reps) => sum + reps, 0);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Create Rest-Pause Set</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            What is a Rest-Pause Set?
          </h3>
          <p className="text-sm text-purple-800">
            Perform a set to failure, rest 10-15 seconds, then continue for more reps. 
            Repeat this process to extend the set and increase training volume.
          </p>
        </div>

        {/* Exercise Selection */}
        <div className="space-y-2">
          <Label htmlFor="exercise">Select Exercise</Label>
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an exercise for rest-pause" />
            </SelectTrigger>
            <SelectContent>
              {exercises
                .filter(ex => ex.sets.some(set => set.weight && set.weight > 0))
                .map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                  {exercise.sets.length > 0 && (
                    <span className="text-gray-500 ml-2">
                      (Last: {exercise.sets[exercise.sets.length - 1]?.weight || 0}kg × {exercise.sets[exercise.sets.length - 1]?.reps || 0})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {exercises.filter(ex => ex.sets.some(set => set.weight && set.weight > 0)).length === 0 && (
            <p className="text-sm text-gray-500">
              Add some sets with weights first to create rest-pause sets
            </p>
          )}
        </div>

        {/* Rest-Pause Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="restPauseDuration">Mini-Rest Duration (seconds)</Label>
            <Input
              id="restPauseDuration"
              type="number"
              min="10"
              max="30"
              value={parameters.restPauseDuration}
              onChange={(e) => setParameters(prev => ({ 
                ...prev, 
                restPauseDuration: parseInt(e.target.value) || 15 
              }))}
            />
            <p className="text-xs text-gray-500">Typical: 10-15 seconds</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="miniSets">Number of Mini-Sets</Label>
            <Input
              id="miniSets"
              type="number"
              min="2"
              max="5"
              value={parameters.miniSets}
              onChange={(e) => setParameters(prev => ({ 
                ...prev, 
                miniSets: parseInt(e.target.value) || 3 
              }))}
            />
            <p className="text-xs text-gray-500">Typical: 2-4 mini-sets</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetTotalReps">Target Total Reps</Label>
          <Input
            id="targetTotalReps"
            type="number"
            min="15"
            max="50"
            value={parameters.targetTotalReps}
            onChange={(e) => setParameters(prev => ({ 
              ...prev, 
              targetTotalReps: parseInt(e.target.value) || 20 
            }))}
          />
          <p className="text-xs text-gray-500">Total reps across main set + mini-sets</p>
        </div>

        {/* Rest-Pause Preview */}
        {selectedExercise && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Rest-Pause Preview:
            </h4>
            <div className="space-y-3">
              {/* Main Set */}
              <div className="flex justify-between items-center p-2 bg-blue-100 rounded">
                <span className="font-medium">Main Set (to failure)</span>
                <span className="text-blue-700 font-medium">{baseWeight}kg × {baseReps} reps</span>
              </div>

              {/* Mini-Sets */}
              {estimatedMiniSetReps().map((reps, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-purple-100 rounded">
                  <span>Mini-Set {index + 1} (after {parameters.restPauseDuration}s rest)</span>
                  <span className="text-purple-700 font-medium">{baseWeight}kg × ~{reps} reps</span>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-between items-center p-2 bg-green-100 rounded border-t-2 border-green-300">
                <span className="font-medium">Estimated Total</span>
                <span className="text-green-700 font-bold">{baseWeight}kg × {totalEstimatedReps} reps</span>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-600">
              <p>• Main set: Perform to failure with {baseWeight}kg</p>
              <p>• Mini-sets: Rest {parameters.restPauseDuration}s, then continue with same weight</p>
              <p>• Goal: Achieve {parameters.targetTotalReps} total reps across all sets</p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Rest-Pause Tips:
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Perform main set to complete muscular failure</li>
            <li>• Rest exactly 10-15 seconds (no longer)</li>
            <li>• Use the same weight for all mini-sets</li>
            <li>• Stop when you can't complete at least 1 rep</li>
            <li>• Best for isolation exercises (bicep curls, lateral raises)</li>
            <li>• Limit to 1-2 rest-pause sets per workout</li>
          </ul>
        </div>

        {/* Intensity Warning */}
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <h4 className="font-medium text-sm mb-1 text-orange-900">⚠️ High Intensity Technique</h4>
          <p className="text-xs text-orange-800">
            Rest-pause sets are extremely demanding. Use sparingly and ensure proper recovery between sessions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!selectedExercise}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            Create Rest-Pause Set
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
