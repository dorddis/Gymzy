'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExerciseWithSets } from '@/types/exercise';
import { X, TrendingDown, Calculator, Info } from 'lucide-react';

interface DropSetParameters {
  dropType: 'single' | 'double' | 'triple';
  dropPercentages: number[]; // percentage reduction for each drop
  restBetweenDrops: number; // seconds between drops
  targetReps: number; // reps to aim for in each drop
}

interface DropSetCreatorProps {
  exercises: ExerciseWithSets[];
  onCreateDropSet: (exerciseId: string, parameters: DropSetParameters) => void;
  onClose: () => void;
}

export function DropSetCreator({ exercises, onCreateDropSet, onClose }: DropSetCreatorProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [parameters, setParameters] = useState<DropSetParameters>({
    dropType: 'single',
    dropPercentages: [20], // 20% reduction for single drop
    restBetweenDrops: 10, // 10 seconds between drops
    targetReps: 8 // aim for 8 reps in each drop
  });

  const handleDropTypeChange = (type: 'single' | 'double' | 'triple') => {
    const dropPercentages = {
      single: [20],
      double: [20, 30],
      triple: [20, 30, 40]
    };
    
    setParameters(prev => ({
      ...prev,
      dropType: type,
      dropPercentages: dropPercentages[type]
    }));
  };

  const handlePercentageChange = (index: number, value: number) => {
    setParameters(prev => ({
      ...prev,
      dropPercentages: prev.dropPercentages.map((percent, i) => 
        i === index ? value : percent
      )
    }));
  };

  const handleCreate = () => {
    if (selectedExercise) {
      onCreateDropSet(selectedExercise, parameters);
    }
  };

  const selectedExerciseData = exercises.find(ex => ex.id === selectedExercise);
  const lastSet = selectedExerciseData?.sets[selectedExerciseData.sets.length - 1];
  const baseWeight = lastSet?.weight || 100; // Use last set weight or default

  const calculateDropWeights = () => {
    return parameters.dropPercentages.map(percentage => {
      const dropWeight = baseWeight * (1 - percentage / 100);
      return Math.round(dropWeight * 2) / 2; // Round to nearest 0.5kg
    });
  };

  const dropWeights = calculateDropWeights();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Create Drop Set</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            What is a Drop Set?
          </h3>
          <p className="text-sm text-orange-800">
            Perform an exercise to failure, then immediately reduce the weight and continue for more reps. 
            This technique increases muscle fatigue and promotes growth.
          </p>
        </div>

        {/* Exercise Selection */}
        <div className="space-y-2">
          <Label htmlFor="exercise">Select Exercise</Label>
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an exercise for drop set" />
            </SelectTrigger>
            <SelectContent>
              {exercises
                .filter(ex => ex.sets.some(set => set.weight && set.weight > 0))
                .map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                  {exercise.sets.length > 0 && (
                    <span className="text-gray-500 ml-2">
                      (Last: {exercise.sets[exercise.sets.length - 1]?.weight || 0}kg)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {exercises.filter(ex => ex.sets.some(set => set.weight && set.weight > 0)).length === 0 && (
            <p className="text-sm text-gray-500">
              Add some sets with weights first to create drop sets
            </p>
          )}
        </div>

        {/* Drop Set Type */}
        <div className="space-y-2">
          <Label>Drop Set Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['single', 'double', 'triple'] as const).map((type) => (
              <Button
                key={type}
                variant={parameters.dropType === type ? 'default' : 'outline'}
                onClick={() => handleDropTypeChange(type)}
                className="capitalize"
              >
                {type} Drop
              </Button>
            ))}
          </div>
        </div>

        {/* Drop Percentages */}
        <div className="space-y-3">
          <Label>Weight Reduction (%)</Label>
          {parameters.dropPercentages.map((percentage, index) => (
            <div key={index} className="flex items-center gap-3">
              <Label className="w-16 text-sm">Drop {index + 1}:</Label>
              <Input
                type="number"
                min="10"
                max="50"
                value={percentage}
                onChange={(e) => handlePercentageChange(index, parseInt(e.target.value) || 20)}
                className="w-20"
              />
              <span className="text-sm text-gray-600">%</span>
              {selectedExercise && (
                <span className="text-sm font-medium">
                  = {dropWeights[index]}kg
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Additional Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="restBetweenDrops">Rest Between Drops (seconds)</Label>
            <Input
              id="restBetweenDrops"
              type="number"
              min="0"
              max="30"
              value={parameters.restBetweenDrops}
              onChange={(e) => setParameters(prev => ({ 
                ...prev, 
                restBetweenDrops: parseInt(e.target.value) || 10 
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetReps">Target Reps per Drop</Label>
            <Input
              id="targetReps"
              type="number"
              min="3"
              max="20"
              value={parameters.targetReps}
              onChange={(e) => setParameters(prev => ({ 
                ...prev, 
                targetReps: parseInt(e.target.value) || 8 
              }))}
            />
          </div>
        </div>

        {/* Weight Calculation Preview */}
        {selectedExercise && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Drop Set Preview:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Starting weight:</span>
                <span className="font-medium">{baseWeight}kg</span>
              </div>
              {dropWeights.map((weight, index) => (
                <div key={index} className="flex justify-between">
                  <span>Drop {index + 1} ({parameters.dropPercentages[index]}% reduction):</span>
                  <span className="font-medium">{weight}kg</span>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Rest between drops:</span>
                  <span>{parameters.restBetweenDrops}s</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Target reps per drop:</span>
                  <span>{parameters.targetReps} reps</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Drop Set Tips:
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Perform the main set to failure first</li>
            <li>• Reduce weight immediately (minimal rest)</li>
            <li>• Continue until failure on each drop</li>
            <li>• Focus on maintaining good form throughout</li>
            <li>• Use drop sets sparingly (1-2 per workout)</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!selectedExercise}
            className="flex-1"
          >
            Create Drop Set
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
