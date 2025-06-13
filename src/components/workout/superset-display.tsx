"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExerciseWithSets } from '@/types/exercise';
import { Link, Timer, RotateCcw, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupersetDisplayProps {
  exercises: ExerciseWithSets[];
  groupId: string;
  onSetExecuted: (exerciseIndex: number, setIndex: number) => void;
  isRestTimerRunning?: boolean;
  restTimeRemaining?: number;
  onToggleRestTimer?: () => void;
  className?: string;
}

export function SupersetDisplay({ 
  exercises, 
  groupId, 
  onSetExecuted, 
  isRestTimerRunning = false,
  restTimeRemaining = 0,
  onToggleRestTimer,
  className 
}: SupersetDisplayProps) {
  const supersetParameters = exercises[0]?.specialSetParameters;
  const currentRound = Math.max(...exercises.flatMap(ex => 
    ex.sets.map((set, index) => set.isExecuted ? index + 1 : 0)
  ));
  const totalRounds = supersetParameters?.rounds || 3;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isRoundComplete = (roundIndex: number) => {
    return exercises.every(exercise => 
      exercise.sets[roundIndex]?.isExecuted || false
    );
  };

  const getNextExerciseInRound = (roundIndex: number) => {
    for (let i = 0; i < exercises.length; i++) {
      if (!exercises[i].sets[roundIndex]?.isExecuted) {
        return i;
      }
    }
    return -1;
  };

  return (
    <Card className={cn("border-l-4 border-l-blue-500", className)}>
      <CardContent className="p-4">
        {/* Superset Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Superset</h3>
            <Badge variant="outline" className="text-xs">
              {exercises.length} exercises
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RotateCcw className="h-4 w-4" />
            Round {currentRound}/{totalRounds}
          </div>
        </div>

        {/* Rest Timer (if active) */}
        {isRestTimerRunning && restTimeRemaining > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Rest Between Sets</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-blue-600">
                  {formatTime(restTimeRemaining)}
                </span>
                {onToggleRestTimer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleRestTimer}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {isRestTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="space-y-3">
          {exercises.map((exercise, exerciseIndex) => {
            const nextExerciseIndex = getNextExerciseInRound(currentRound - 1);
            const isNextExercise = nextExerciseIndex === exerciseIndex;
            
            return (
              <div 
                key={exercise.id}
                className={cn(
                  "p-3 border rounded-lg transition-all",
                  isNextExercise ? "border-blue-300 bg-blue-50" : "border-gray-200"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={isNextExercise ? "default" : "outline"} 
                      className={cn(
                        "w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs",
                        isNextExercise ? "bg-blue-600" : ""
                      )}
                    >
                      {exerciseIndex + 1}
                    </Badge>
                    <h4 className="font-medium">{exercise.name}</h4>
                    {isNextExercise && (
                      <Badge variant="secondary" className="text-xs">
                        Next
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Sets for this exercise */}
                <div className="grid grid-cols-1 gap-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div 
                      key={setIndex}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div className="flex items-center gap-4 text-sm">
                        <span className="w-12 text-gray-600">Set {setIndex + 1}</span>
                        <span>{set.weight}kg × {set.reps} reps</span>
                        {set.rpe && <span className="text-gray-500">RPE {set.rpe}</span>}
                      </div>
                      
                      <Button
                        variant={set.isExecuted ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSetExecuted(exerciseIndex, setIndex)}
                        className={cn(
                          "w-8 h-8 p-0",
                          set.isExecuted 
                            ? "bg-green-600 hover:bg-green-700" 
                            : "hover:bg-gray-50"
                        )}
                      >
                        {set.isExecuted ? "✓" : ""}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Superset Instructions */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Superset Instructions:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Perform exercises {exercises.map((_, i) => i + 1).join(' → ')} back-to-back</li>
            <li>• No rest between exercises in the superset</li>
            <li>• Rest {supersetParameters?.restBetweenSets || 90}s between superset rounds</li>
            <li>• Complete {totalRounds} total rounds</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
