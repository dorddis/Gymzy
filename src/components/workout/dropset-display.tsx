'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExerciseWithSets } from '@/types/exercise';
import { TrendingDown, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropSetDisplayProps {
  exercise: ExerciseWithSets;
  onSetExecuted: (setIndex: number, actualReps: number, actualWeight: number) => void;
  className?: string;
}

interface DropState {
  currentDrop: number;
  isRestingBetweenDrops: boolean;
  restTimeRemaining: number;
  completedDrops: Array<{
    weight: number;
    reps: number;
    completed: boolean;
  }>;
}

export function DropSetDisplay({ exercise, onSetExecuted, className }: DropSetDisplayProps) {
  const dropSetParams = exercise.specialSetParameters;
  const baseWeight = exercise.sets[exercise.sets.length - 1]?.weight || 100;
  const dropPercentages = dropSetParams?.dropPercentages || [20];
  const restBetweenDrops = dropSetParams?.restBetweenDrops || 10;
  const targetReps = dropSetParams?.targetReps || 8;

  const [dropState, setDropState] = useState<DropState>({
    currentDrop: 0,
    isRestingBetweenDrops: false,
    restTimeRemaining: 0,
    completedDrops: dropPercentages.map((percentage) => ({
      weight: Math.round(baseWeight * (1 - percentage / 100) * 2) / 2,
      reps: 0,
      completed: false
    }))
  });

  const [currentReps, setCurrentReps] = useState<number>(targetReps);
  const [isMainSetComplete, setIsMainSetComplete] = useState(false);

  // Rest timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (dropState.isRestingBetweenDrops && dropState.restTimeRemaining > 0) {
      interval = setInterval(() => {
        setDropState(prev => ({
          ...prev,
          restTimeRemaining: prev.restTimeRemaining - 1
        }));
      }, 1000);
    } else if (dropState.restTimeRemaining === 0 && dropState.isRestingBetweenDrops) {
      // Rest is over, ready for next drop
      setDropState(prev => ({
        ...prev,
        isRestingBetweenDrops: false
      }));
    }

    return () => clearInterval(interval);
  }, [dropState.isRestingBetweenDrops, dropState.restTimeRemaining]);

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  const handleMainSetComplete = () => {
    setIsMainSetComplete(true);
    if (restBetweenDrops > 0) {
      setDropState(prev => ({
        ...prev,
        isRestingBetweenDrops: true,
        restTimeRemaining: restBetweenDrops
      }));
    }
  };

  const handleDropComplete = () => {
    const currentDropData = dropState.completedDrops[dropState.currentDrop];
    
    // Mark current drop as completed
    setDropState(prev => ({
      ...prev,
      completedDrops: prev.completedDrops.map((drop, index) => 
        index === dropState.currentDrop 
          ? { ...drop, reps: currentReps, completed: true }
          : drop
      )
    }));

    // Execute the set
    onSetExecuted(dropState.currentDrop + 1, currentReps, currentDropData.weight);

    // Move to next drop or finish
    if (dropState.currentDrop < dropPercentages.length - 1) {
      setDropState(prev => ({
        ...prev,
        currentDrop: prev.currentDrop + 1,
        isRestingBetweenDrops: restBetweenDrops > 0,
        restTimeRemaining: restBetweenDrops
      }));
      setCurrentReps(targetReps);
    }
  };

  const getCurrentDropWeight = () => {
    return dropState.completedDrops[dropState.currentDrop]?.weight || baseWeight;
  };

  const isDropSetComplete = () => {
    return dropState.completedDrops.every(drop => drop.completed);
  };

  const canStartDropSet = () => {
    return isMainSetComplete && !dropState.isRestingBetweenDrops;
  };

  const getCurrentPhase = () => {
    if (!isMainSetComplete) return 'main-set';
    if (dropState.isRestingBetweenDrops) return 'resting';
    if (isDropSetComplete()) return 'complete';
    return 'dropping';
  };

  const getPhaseLabel = () => {
    switch (getCurrentPhase()) {
      case 'main-set': return 'Complete Main Set First';
      case 'resting': return 'Rest Between Drops';
      case 'dropping': return `Drop ${dropState.currentDrop + 1}`;
      case 'complete': return 'Drop Set Complete';
      default: return '';
    }
  };

  const getPhaseColor = () => {
    switch (getCurrentPhase()) {
      case 'main-set': return 'text-blue-600';
      case 'resting': return 'text-orange-600';
      case 'dropping': return 'text-green-600';
      case 'complete': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Drop Set: {exercise.name}
          <span className="text-sm font-normal text-gray-500">
            ({dropPercentages.length} drops)
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Phase Status */}
        <div className="text-center space-y-2">
          <div className={cn("text-lg font-semibold", getPhaseColor())}>
            {getPhaseLabel()}
          </div>
          
          {dropState.isRestingBetweenDrops && (
            <div className="text-3xl font-mono font-bold text-orange-600">
              {formatTime(dropState.restTimeRemaining)}
            </div>
          )}
        </div>

        {/* Main Set Status */}
        {!isMainSetComplete && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Main Set</h4>
                <p className="text-sm text-gray-600">
                  Perform to failure with {baseWeight}kg
                </p>
              </div>
              <Button 
                onClick={handleMainSetComplete}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Main Set
              </Button>
            </div>
          </div>
        )}

        {/* Current Drop */}
        {isMainSetComplete && !isDropSetComplete() && canStartDropSet() && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">
                    Drop {dropState.currentDrop + 1} of {dropPercentages.length}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Weight: {getCurrentDropWeight()}kg 
                    ({dropPercentages[dropState.currentDrop]}% reduction)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {getCurrentDropWeight()}kg
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="reps" className="text-sm">Reps Completed</Label>
                  <Input
                    id="reps"
                    type="number"
                    min="1"
                    max="50"
                    value={currentReps}
                    onChange={(e) => setCurrentReps(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleDropComplete}
                  disabled={currentReps <= 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Drop
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Drop Progress */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Drop Progression:</h4>
          <div className="space-y-2">
            {dropState.completedDrops.map((drop, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  drop.completed 
                    ? "bg-green-50 border-green-200" 
                    : index === dropState.currentDrop && canStartDropSet()
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    drop.completed 
                      ? "bg-green-600 text-white"
                      : index === dropState.currentDrop && canStartDropSet()
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  )}>
                    {drop.completed ? '✓' : index + 1}
                  </div>
                  <div>
                    <span className="font-medium">Drop {index + 1}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {drop.weight}kg ({dropPercentages[index]}% reduction)
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  {drop.completed ? (
                    <span className="text-green-600 font-medium">
                      {drop.reps} reps ✓
                    </span>
                  ) : index === dropState.currentDrop && canStartDropSet() ? (
                    <span className="text-blue-600 font-medium">Active</span>
                  ) : (
                    <span className="text-gray-400">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-orange-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Drop Set Instructions:
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Complete main set to failure first</li>
            <li>• Reduce weight immediately for each drop</li>
            <li>• Rest {restBetweenDrops}s between drops</li>
            <li>• Aim for {targetReps}+ reps per drop</li>
            <li>• Maintain proper form throughout</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
