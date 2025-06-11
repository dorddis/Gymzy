"use client";

import React, { useRef, useEffect } from "react";
import { WorkoutSummaryScreen } from "@/components/workout/workout-summary-screen";
import { WorkoutHeader } from "@/components/workout/workout-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { usePathname } from 'next/navigation';
import { MuscleActivationSVG } from '@/components/workout/muscle-activation-svg';
import { useWorkout } from '@/contexts/WorkoutContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddWorkoutModal } from '@/components/dashboard/add-workout-modal';
import { ChevronDown, RotateCcw, Play, Pause } from 'lucide-react';
import { AnimatedTimer } from '@/components/ui/animated-timer';

export default function WorkoutPage() {
  const pathname = usePathname();
  const isWorkoutPage = pathname === '/workout';
  const mainScrollRef = useRef<HTMLElement>(null);
  const { muscleVolumes, currentWorkoutExercises, totalVolume, setCurrentWorkoutExercises } = useWorkout();
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = React.useState(false);
  const [showRestTimerUI, setShowRestTimerUI] = React.useState(true);
  const [isRestTimerRunning, setIsRestTimerRunning] = React.useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = React.useState(120); // 2 minutes
  const totalRestTime = 120; // Total time for the rest timer (2 minutes)

  const handleTerminateWorkout = () => {
    console.log("Workout terminated!");
  };

  const handleCompleteWorkout = () => {
    console.log("Workout completed!");
  };

  const handleAddExercise = (exerciseWithSets: any) => {
    const existingExerciseIndex = currentWorkoutExercises.findIndex(
      (e) => e.id === exerciseWithSets.id
    );

    if (existingExerciseIndex !== -1) {
      setCurrentWorkoutExercises(prevExercises => {
        const newExercises = [...prevExercises];
        const existingExercise = newExercises[existingExerciseIndex];
        newExercises[existingExerciseIndex] = {
          ...existingExercise,
          sets: [
            ...existingExercise.sets,
            { weight: 0, reps: 0, rpe: 0, isWarmup: false, isExecuted: false }
          ]
        };
        return newExercises;
      });
    } else {
      setCurrentWorkoutExercises(prev => [...prev, exerciseWithSets]);
    }
    setIsAddExerciseModalOpen(false);
  };

  const toggleSetExecuted = (exerciseIndex: number, setIndex: number) => {
    setCurrentWorkoutExercises(prevExercises => {
      const newExercises = [...prevExercises];
      const currentSet = newExercises[exerciseIndex].sets[setIndex];
      const updatedSet = { ...currentSet, isExecuted: !currentSet.isExecuted };
      
      const newSets = [...newExercises[exerciseIndex].sets];
      newSets[setIndex] = updatedSet;

      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: newSets };
      return newExercises;
    });
    setShowRestTimerUI(true);
    setIsRestTimerRunning(true);
    setRestTimeRemaining(totalRestTime);
  };

  const resetRestTimer = () => {
    console.log("Reset button clicked");
    setIsRestTimerRunning(false);
    setRestTimeRemaining(totalRestTime);
  };

  const toggleRestTimer = () => {
    setIsRestTimerRunning(!isRestTimerRunning);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRestTimerRunning && restTimeRemaining > 0) {
      timer = setInterval(() => {
        setRestTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
    } else if (restTimeRemaining === 0) {
      setIsRestTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isRestTimerRunning, restTimeRemaining]);

  const scrollToBottom = () => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        top: mainScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <WorkoutHeader
        onTerminateWorkout={handleTerminateWorkout}
        onCompleteWorkout={handleCompleteWorkout}
        className="fixed top-0 left-0 right-0 z-20"
      />
      
      <div className="fixed top-[72px] left-0 right-0 h-[calc(100vh-72px-180px)] min-h-[400px] z-0">
        <MuscleActivationSVG 
          muscleVolumes={muscleVolumes} 
          className="w-full h-full" 
          scrollElementRef={mainScrollRef} 
        />
      </div>

      <main 
        ref={mainScrollRef} 
        className="flex-grow overflow-y-auto pt-[calc(72px+min(calc(100vh-72px-180px),400px))] pb-[180px] relative z-10 min-h-[calc(100vh-72px)]"
      >
        <WorkoutSummaryScreen toggleSetExecuted={toggleSetExecuted} />
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex flex-col gap-2 z-20 h-[180px]">
        <div className="flex justify-between items-center">
          <h4 className="text-md font-semibold">Total Volume:</h4>
          <span className="text-lg font-bold">{totalVolume.toLocaleString()} kg</span>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            className="flex-[2] bg-primary text-white py-3 rounded-xl font-semibold shadow-sm active:scale-[0.98] active:shadow-none active:text-white hover:text-white transition-all duration-100"
            onClick={() => setIsAddExerciseModalOpen(true)}
          >
            + Add Exercise
          </Button>
          <Button
            className="flex-[1] bg-blue-500 text-white py-3 rounded-xl font-semibold shadow-sm active:scale-[0.98] active:shadow-none active:text-white hover:text-white transition-all duration-100"
            onClick={() => console.log('Special set clicked')}
          >
            + Special set
          </Button>
        </div>

        <div className="w-full flex items-center justify-between rounded-xl font-semibold mt-2 h-12">
          <div className="flex-1 relative">
            <AnimatedTimer 
              totalTime={totalRestTime} 
              timeRemaining={restTimeRemaining} 
              isRestTimerRunning={isRestTimerRunning} 
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRestTimer}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-transparent focus:outline-none focus:ring-0"
            >
              {isRestTimerRunning ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetRestTimer}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-transparent focus:outline-none focus:ring-0"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {currentWorkoutExercises.length > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-[190px] right-4 z-30 bg-white rounded-full shadow-md"
          onClick={scrollToBottom}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      )}

      <AddWorkoutModal
        open={isAddExerciseModalOpen}
        onOpenChange={() => setIsAddExerciseModalOpen(false)}
        onExerciseSave={handleAddExercise}
      />

      {!isWorkoutPage && <BottomNav />}
    </div>
  );
} 