"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExerciseWithSets } from '@/types/exercise';
import { Plus, X, Link, Timer, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupersetCreatorProps {
  exercises: ExerciseWithSets[];
  onCreateSuperset: (exerciseIds: string[], parameters: SupersetParameters) => void;
  onClose: () => void;
}

interface SupersetParameters {
  restBetweenExercises: number;
  restBetweenSets: number;
  rounds: number;
}

export function SupersetCreator({ exercises, onCreateSuperset, onClose }: SupersetCreatorProps) {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [parameters, setParameters] = useState<SupersetParameters>({
    restBetweenExercises: 0, // No rest between superset exercises
    restBetweenSets: 90, // 90 seconds between superset rounds
    rounds: 3
  });

  const handleExerciseToggle = (exerciseId: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      } else if (prev.length < 4) { // Limit to 4 exercises per superset
        return [...prev, exerciseId];
      }
      return prev;
    });
  };

  const handleCreateSuperset = () => {
    if (selectedExercises.length >= 2) {
      onCreateSuperset(selectedExercises, parameters);
      onClose();
    }
  };

  const selectedExerciseObjects = exercises.filter(ex => selectedExercises.includes(ex.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl my-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Link className="h-5 w-5 text-blue-600" />
            Create Superset
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">What is a Superset?</h3>
            <p className="text-sm text-blue-800">
              A superset combines 2-4 exercises performed back-to-back with no rest between them. 
              Rest only after completing all exercises in the superset.
            </p>
          </div>

          {/* Exercise Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Select Exercises ({selectedExercises.length}/4)
            </Label>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all",
                    selectedExercises.includes(exercise.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleExerciseToggle(exercise.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{exercise.name}</h4>
                      <p className="text-sm text-gray-600">
                        {exercise.sets.length} sets • {exercise.primaryMuscles.join(', ')}
                      </p>
                    </div>
                    {selectedExercises.includes(exercise.id) && (
                      <Badge variant="default" className="bg-blue-600">
                        {selectedExercises.indexOf(exercise.id) + 1}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Exercises Preview */}
          {selectedExercises.length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Superset Order</Label>
              <div className="space-y-2">
                {selectedExerciseObjects.map((exercise, index) => (
                  <div key={exercise.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{exercise.name}</span>
                    <span className="text-sm text-gray-600">
                      {exercise.sets.length} sets
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parameters */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Superset Parameters</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restBetweenSets" className="text-sm flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Rest Between Sets (seconds)
                </Label>
                <Input
                  id="restBetweenSets"
                  type="number"
                  value={parameters.restBetweenSets}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    restBetweenSets: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rounds" className="text-sm flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Rounds
                </Label>
                <Input
                  id="rounds"
                  type="number"
                  value={parameters.rounds}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    rounds: parseInt(e.target.value) || 1
                  }))}
                  min="1"
                  max="10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Rest Between Exercises</Label>
                <div className="p-2 bg-gray-100 rounded text-sm text-gray-700">
                  No rest (superset)
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSuperset}
              disabled={selectedExercises.length < 2}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Create Superset ({selectedExercises.length} exercises)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
