'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ExerciseWithSets } from '@/types/exercise';
import { Play, Pause, SkipForward, RotateCcw, Clock, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CircuitDisplayProps {
  exercises: ExerciseWithSets[];
  groupId: string;
  onSetExecuted: (exerciseIndex: number, setIndex: number) => void;
  className?: string;
}

interface CircuitState {
  currentRound: number;
  currentExercise: number;
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  phase: 'work' | 'rest' | 'roundRest' | 'complete';
}

export function CircuitDisplay({ 
  exercises, 
  groupId, 
  onSetExecuted, 
  className 
}: CircuitDisplayProps) {
  const circuitParameters = exercises[0]?.specialSetParameters;
  const workTime = circuitParameters?.workTime || 45;
  const restTime = circuitParameters?.restTime || 15;
  const restBetweenRounds = circuitParameters?.restBetweenRounds || 120;
  const totalRounds = circuitParameters?.rounds || 3;

  const [circuitState, setCircuitState] = useState<CircuitState>({
    currentRound: 1,
    currentExercise: 0,
    isActive: false,
    isPaused: false,
    timeRemaining: workTime,
    phase: 'work'
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentExercise = () => exercises[circuitState.currentExercise];
  const isCircuitComplete = circuitState.currentRound > totalRounds;

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (circuitState.isActive && !circuitState.isPaused && circuitState.timeRemaining > 0) {
      interval = setInterval(() => {
        setCircuitState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
    } else if (circuitState.timeRemaining === 0 && circuitState.isActive) {
      // Time's up, move to next phase
      handlePhaseTransition();
    }

    return () => clearInterval(interval);
  }, [circuitState.isActive, circuitState.isPaused, circuitState.timeRemaining]);

  const handlePhaseTransition = useCallback(() => {
    setCircuitState(prev => {
      if (prev.phase === 'work') {
        // Mark current exercise as completed
        onSetExecuted(prev.currentExercise, prev.currentRound - 1);
        
        // Check if this was the last exercise in the round
        if (prev.currentExercise === exercises.length - 1) {
          // End of round
          if (prev.currentRound === totalRounds) {
            // Circuit complete
            return {
              ...prev,
              phase: 'complete',
              isActive: false,
              timeRemaining: 0
            };
          } else {
            // Rest between rounds
            return {
              ...prev,
              phase: 'roundRest',
              timeRemaining: restBetweenRounds,
              currentExercise: 0,
              currentRound: prev.currentRound + 1
            };
          }
        } else {
          // Rest between exercises
          return {
            ...prev,
            phase: 'rest',
            timeRemaining: restTime,
            currentExercise: prev.currentExercise + 1
          };
        }
      } else if (prev.phase === 'rest') {
        // Start next exercise
        return {
          ...prev,
          phase: 'work',
          timeRemaining: workTime
        };
      } else if (prev.phase === 'roundRest') {
        // Start next round
        return {
          ...prev,
          phase: 'work',
          timeRemaining: workTime
        };
      }
      return prev;
    });
  }, [exercises.length, totalRounds, workTime, restTime, restBetweenRounds, onSetExecuted]);

  const startCircuit = () => {
    setCircuitState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false
    }));
  };

  const pauseCircuit = () => {
    setCircuitState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  };

  const resetCircuit = () => {
    setCircuitState({
      currentRound: 1,
      currentExercise: 0,
      isActive: false,
      isPaused: false,
      timeRemaining: workTime,
      phase: 'work'
    });
  };

  const skipPhase = () => {
    setCircuitState(prev => ({
      ...prev,
      timeRemaining: 0
    }));
  };

  const getPhaseColor = () => {
    switch (circuitState.phase) {
      case 'work': return 'text-green-600';
      case 'rest': return 'text-blue-600';
      case 'roundRest': return 'text-purple-600';
      case 'complete': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getPhaseLabel = () => {
    switch (circuitState.phase) {
      case 'work': return 'WORK';
      case 'rest': return 'REST';
      case 'roundRest': return 'ROUND REST';
      case 'complete': return 'COMPLETE';
      default: return '';
    }
  };

  const getProgressPercentage = () => {
    const maxTime = circuitState.phase === 'work' ? workTime : 
                   circuitState.phase === 'rest' ? restTime : restBetweenRounds;
    return ((maxTime - circuitState.timeRemaining) / maxTime) * 100;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          Circuit Training
          <span className="text-sm font-normal text-gray-500">
            ({exercises.length} exercises)
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Circuit Status */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">
            <span className={getPhaseColor()}>{getPhaseLabel()}</span>
          </div>
          <div className="text-5xl font-mono font-bold">
            {formatTime(circuitState.timeRemaining)}
          </div>
          <div className="text-sm text-gray-600">
            Round {circuitState.currentRound} of {totalRounds}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={getProgressPercentage()} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Exercise {circuitState.currentExercise + 1} of {exercises.length}</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
        </div>

        {/* Current Exercise */}
        {!isCircuitComplete && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-1">Current Exercise:</h4>
            <p className="text-lg font-semibold">{getCurrentExercise()?.name}</p>
            <p className="text-sm text-gray-600">
              {getCurrentExercise()?.primaryMuscles?.join(', ')}
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!circuitState.isActive ? (
            <Button onClick={startCircuit} className="flex-1" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Circuit
            </Button>
          ) : (
            <>
              <Button 
                onClick={pauseCircuit} 
                variant="outline" 
                size="lg"
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-2" />
                {circuitState.isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button 
                onClick={skipPhase} 
                variant="outline" 
                size="lg"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button 
            onClick={resetCircuit} 
            variant="outline" 
            size="lg"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Circuit Instructions */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Circuit Instructions:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Work for {workTime}s, rest for {restTime}s between exercises</li>
            <li>• Complete all {exercises.length} exercises for 1 round</li>
            <li>• Rest {Math.floor(restBetweenRounds/60)}m {restBetweenRounds%60}s between rounds</li>
            <li>• Complete {totalRounds} total rounds</li>
          </ul>
        </div>

        {/* Exercise List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Exercise Order:</h4>
          <div className="grid gap-2">
            {exercises.map((exercise, index) => (
              <div 
                key={exercise.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded border text-sm",
                  index === circuitState.currentExercise && circuitState.isActive
                    ? "bg-green-100 border-green-300"
                    : index < circuitState.currentExercise
                    ? "bg-gray-100 border-gray-300"
                    : "bg-white border-gray-200"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{exercise.name}</span>
                </div>
                {index === circuitState.currentExercise && circuitState.isActive && (
                  <span className="text-green-600 font-medium">Active</span>
                )}
                {index < circuitState.currentExercise && (
                  <span className="text-gray-500">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
