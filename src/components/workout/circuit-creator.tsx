'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ExerciseWithSets } from '@/types/exercise';
import { X, Clock, Repeat, Play } from 'lucide-react';

interface CircuitParameters {
  workTime: number; // seconds per exercise
  restTime: number; // seconds between exercises
  restBetweenRounds: number; // seconds between circuit rounds
  rounds: number; // number of circuit rounds
  exerciseOrder: 'sequential' | 'random';
}

interface CircuitCreatorProps {
  exercises: ExerciseWithSets[];
  onCreateCircuit: (exerciseIds: string[], parameters: CircuitParameters) => void;
  onClose: () => void;
}

export function CircuitCreator({ exercises, onCreateCircuit, onClose }: CircuitCreatorProps) {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [parameters, setParameters] = useState<CircuitParameters>({
    workTime: 45, // 45 seconds work
    restTime: 15, // 15 seconds rest
    restBetweenRounds: 120, // 2 minutes between rounds
    rounds: 3,
    exerciseOrder: 'sequential'
  });

  const handleExerciseToggle = (exerciseId: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      } else if (prev.length < 8) { // Limit to 8 exercises per circuit
        return [...prev, exerciseId];
      }
      return prev;
    });
  };

  const handleCreate = () => {
    if (selectedExercises.length >= 3) {
      onCreateCircuit(selectedExercises, parameters);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const totalCircuitTime = (parameters.workTime + parameters.restTime) * selectedExercises.length - parameters.restTime;
  const totalWorkoutTime = totalCircuitTime * parameters.rounds + parameters.restBetweenRounds * (parameters.rounds - 1);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Create Circuit</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            What is a Circuit?
          </h3>
          <p className="text-sm text-blue-800">
            A circuit combines multiple exercises performed for time with short rest periods. 
            Complete all exercises in sequence, then rest before starting the next round.
          </p>
        </div>

        {/* Circuit Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="workTime" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Work Time (seconds)
            </Label>
            <Input
              id="workTime"
              type="number"
              min="15"
              max="120"
              value={parameters.workTime}
              onChange={(e) => setParameters(prev => ({ ...prev, workTime: parseInt(e.target.value) || 45 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Rest Time (seconds)
            </Label>
            <Input
              id="restTime"
              type="number"
              min="5"
              max="60"
              value={parameters.restTime}
              onChange={(e) => setParameters(prev => ({ ...prev, restTime: parseInt(e.target.value) || 15 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rounds">Circuit Rounds</Label>
            <Input
              id="rounds"
              type="number"
              min="1"
              max="10"
              value={parameters.rounds}
              onChange={(e) => setParameters(prev => ({ ...prev, rounds: parseInt(e.target.value) || 3 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restBetweenRounds">Rest Between Rounds (seconds)</Label>
            <Input
              id="restBetweenRounds"
              type="number"
              min="30"
              max="300"
              value={parameters.restBetweenRounds}
              onChange={(e) => setParameters(prev => ({ ...prev, restBetweenRounds: parseInt(e.target.value) || 120 }))}
            />
          </div>
        </div>

        {/* Exercise Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Select Exercises ({selectedExercises.length}/8)
          </Label>
          <p className="text-sm text-gray-600">Choose 3-8 exercises for your circuit</p>
          
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedExercises.includes(exercise.id)
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleExerciseToggle(exercise.id)}
              >
                <Checkbox
                  checked={selectedExercises.includes(exercise.id)}
                  onChange={() => handleExerciseToggle(exercise.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-gray-600">
                    {exercise.primaryMuscles?.join(', ') || 'Full body'}
                  </p>
                </div>
                {selectedExercises.includes(exercise.id) && (
                  <span className="text-sm font-medium text-blue-600">
                    #{selectedExercises.indexOf(exercise.id) + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Circuit Summary */}
        {selectedExercises.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Circuit Summary:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Exercises:</span>
                <span className="ml-2 font-medium">{selectedExercises.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Rounds:</span>
                <span className="ml-2 font-medium">{parameters.rounds}</span>
              </div>
              <div>
                <span className="text-gray-600">Time per round:</span>
                <span className="ml-2 font-medium">{formatTime(totalCircuitTime)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total time:</span>
                <span className="ml-2 font-medium">{formatTime(totalWorkoutTime)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={selectedExercises.length < 3}
            className="flex-1"
          >
            Create Circuit ({selectedExercises.length} exercises)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
