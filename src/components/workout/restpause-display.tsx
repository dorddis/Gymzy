'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ExerciseWithSets } from '@/types/exercise';
import { Clock, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestPauseDisplayProps {
  exercise: ExerciseWithSets;
  onSetExecuted: (setIndex: number, actualReps: number, actualWeight: number) => void;
  className?: string;
}

interface RestPauseState {
  currentMiniSet: number;
  isResting: boolean;
  restTimeRemaining: number;
  completedMiniSets: Array<{
    reps: number;
    completed: boolean;
  }>;
  totalRepsCompleted: number;
}

export function RestPauseDisplay({ exercise, onSetExecuted, className }: RestPauseDisplayProps) {
  const restPauseParams = exercise.specialSetParameters;
  const baseWeight = exercise.sets[exercise.sets.length - 1]?.weight || 100;
  const restPauseDuration = restPauseParams?.restPauseDuration || 15;
  const miniSets = restPauseParams?.miniSets || 3;
  const targetTotalReps = restPauseParams?.targetTotalReps || 20;

  const [restPauseState, setRestPauseState] = useState<RestPauseState>({
    currentMiniSet: 0,
    isResting: false,
    restTimeRemaining: 0,
    completedMiniSets: Array.from({ length: miniSets }, () => ({
      reps: 0,
      completed: false
    })),
    totalRepsCompleted: 0
  });

  const [currentReps, setCurrentReps] = useState<number>(0);
  const [isMainSetComplete, setIsMainSetComplete] = useState(false);
  const [mainSetReps, setMainSetReps] = useState<number>(0);

  // Rest timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (restPauseState.isResting && restPauseState.restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestPauseState(prev => ({
          ...prev,
          restTimeRemaining: prev.restTimeRemaining - 1
        }));
      }, 1000);
    } else if (restPauseState.restTimeRemaining === 0 && restPauseState.isResting) {
      // Rest is over, ready for next mini-set
      setRestPauseState(prev => ({
        ...prev,
        isResting: false
      }));
    }

    return () => clearInterval(interval);
  }, [restPauseState.isResting, restPauseState.restTimeRemaining]);

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  const handleMainSetComplete = (reps: number) => {
    setMainSetComplete(true);
    setMainSetReps(reps);
    setRestPauseState(prev => ({
      ...prev,
      totalRepsCompleted: reps,
      isResting: true,
      restTimeRemaining: restPauseDuration
    }));
    
    // Execute the main set
    onSetExecuted(0, reps, baseWeight);
  };

  const handleMiniSetComplete = () => {
    const newTotalReps = restPauseState.totalRepsCompleted + currentReps;
    
    // Mark current mini-set as completed
    setRestPauseState(prev => ({
      ...prev,
      completedMiniSets: prev.completedMiniSets.map((miniSet, index) => 
        index === restPauseState.currentMiniSet 
          ? { reps: currentReps, completed: true }
          : miniSet
      ),
      totalRepsCompleted: newTotalReps
    }));

    // Execute the mini-set
    onSetExecuted(restPauseState.currentMiniSet + 1, currentReps, baseWeight);

    // Move to next mini-set or finish
    if (restPauseState.currentMiniSet < miniSets - 1) {
      setRestPauseState(prev => ({
        ...prev,
        currentMiniSet: prev.currentMiniSet + 1,
        isResting: true,
        restTimeRemaining: restPauseDuration
      }));
      setCurrentReps(0);
    }
  };

  const isRestPauseComplete = () => {
    return restPauseState.completedMiniSets.every(miniSet => miniSet.completed);
  };

  const canStartMiniSet = () => {
    return isMainSetComplete && !restPauseState.isResting && !isRestPauseComplete();
  };

  const getCurrentPhase = () => {
    if (!isMainSetComplete) return 'main-set';
    if (restPauseState.isResting) return 'resting';
    if (isRestPauseComplete()) return 'complete';
    return 'mini-set';
  };

  const getPhaseLabel = () => {
    switch (getCurrentPhase()) {
      case 'main-set': return 'Perform Main Set to Failure';
      case 'resting': return `Rest-Pause ${restPauseState.currentMiniSet + 1}`;
      case 'mini-set': return `Mini-Set ${restPauseState.currentMiniSet + 1}`;
      case 'complete': return 'Rest-Pause Complete';
      default: return '';
    }
  };

  const getPhaseColor = () => {
    switch (getCurrentPhase()) {
      case 'main-set': return 'text-blue-600';
      case 'resting': return 'text-orange-600';
      case 'mini-set': return 'text-purple-600';
      case 'complete': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressPercentage = () => {
    return Math.min((restPauseState.totalRepsCompleted / targetTotalReps) * 100, 100);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Rest-Pause: {exercise.name}
          <span className="text-sm font-normal text-gray-500">
            ({miniSets} mini-sets)
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Phase Status */}
        <div className="text-center space-y-2">
          <div className={cn("text-lg font-semibold", getPhaseColor())}>
            {getPhaseLabel()}
          </div>
          
          {restPauseState.isResting && (
            <div className="text-3xl font-mono font-bold text-orange-600">
              {formatTime(restPauseState.restTimeRemaining)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Reps Progress</span>
            <span>{restPauseState.totalRepsCompleted} / {targetTotalReps}</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-3" />
        </div>

        {/* Main Set */}
        {!isMainSetComplete && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Main Set (to failure)</h4>
                  <p className="text-sm text-gray-600">
                    Use {baseWeight}kg and perform until failure
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="mainReps" className="text-sm">Reps Completed</Label>
                  <Input
                    id="mainReps"
                    type="number"
                    min="1"
                    max="50"
                    value={currentReps}
                    onChange={(e) => setCurrentReps(parseInt(e.target.value) || 0)}
                    className="mt-1"
                    placeholder="Enter reps to failure"
                  />
                </div>
                <Button 
                  onClick={() => handleMainSetComplete(currentReps)}
                  disabled={currentReps <= 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Main Set
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Current Mini-Set */}
        {canStartMiniSet() && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">
                    Mini-Set {restPauseState.currentMiniSet + 1} of {miniSets}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Continue with {baseWeight}kg until failure
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {baseWeight}kg
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="miniReps" className="text-sm">Additional Reps</Label>
                  <Input
                    id="miniReps"
                    type="number"
                    min="1"
                    max="20"
                    value={currentReps}
                    onChange={(e) => setCurrentReps(parseInt(e.target.value) || 0)}
                    className="mt-1"
                    placeholder="Reps in this mini-set"
                  />
                </div>
                <Button 
                  onClick={handleMiniSetComplete}
                  disabled={currentReps <= 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Complete Mini-Set
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mini-Set Progress */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Rest-Pause Progression:</h4>
          
          {/* Main Set */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border",
            isMainSetComplete 
              ? "bg-blue-50 border-blue-200" 
              : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                isMainSetComplete 
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-600"
              )}>
                {isMainSetComplete ? '✓' : 'M'}
              </div>
              <span className="font-medium">Main Set</span>
            </div>
            <div className="text-right">
              {isMainSetComplete ? (
                <span className="text-blue-600 font-medium">
                  {mainSetReps} reps ✓
                </span>
              ) : (
                <span className="text-gray-400">To failure</span>
              )}
            </div>
          </div>

          {/* Mini-Sets */}
          {restPauseState.completedMiniSets.map((miniSet, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                miniSet.completed 
                  ? "bg-purple-50 border-purple-200" 
                  : index === restPauseState.currentMiniSet && canStartMiniSet()
                  ? "bg-orange-50 border-orange-200"
                  : "bg-gray-50 border-gray-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  miniSet.completed 
                    ? "bg-purple-600 text-white"
                    : index === restPauseState.currentMiniSet && canStartMiniSet()
                    ? "bg-orange-600 text-white"
                    : "bg-gray-300 text-gray-600"
                )}>
                  {miniSet.completed ? '✓' : index + 1}
                </div>
                <span className="font-medium">Mini-Set {index + 1}</span>
              </div>
              
              <div className="text-right">
                {miniSet.completed ? (
                  <span className="text-purple-600 font-medium">
                    +{miniSet.reps} reps ✓
                  </span>
                ) : index === restPauseState.currentMiniSet && canStartMiniSet() ? (
                  <span className="text-orange-600 font-medium">Active</span>
                ) : (
                  <span className="text-gray-400">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-purple-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Rest-Pause Instructions:
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Perform main set to complete failure</li>
            <li>• Rest exactly {restPauseDuration} seconds between mini-sets</li>
            <li>• Use the same weight for all mini-sets</li>
            <li>• Continue each mini-set until failure</li>
            <li>• Target: {targetTotalReps} total reps across all sets</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
