"use client";

import React, { useRef, useEffect, useState } from "react";
import { WorkoutSummaryScreen } from "@/components/workout/workout-summary-screen";
import { WorkoutHeader } from "@/components/workout/workout-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { usePathname } from "next/navigation";
import { MuscleActivationSVG } from "@/components/workout/muscle-activation-svg";
import { useWorkout } from "@/contexts/WorkoutContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddWorkoutModal } from "@/components/dashboard/add-workout-modal";
import { RotateCcw, Play, Pause } from "lucide-react";
import { AnimatedTimer } from "@/components/ui/animated-timer";
import { FinishWorkoutModal } from "@/components/workout/finish-workout-modal";
import { useRouter } from "next/navigation";

export default function WorkoutPage() {
  const pathname = usePathname();
  const isWorkoutPage = pathname === "/workout";
  const router = useRouter();

  const {
    muscleVolumes,
    currentWorkoutExercises,
    totalVolume,
    setCurrentWorkoutExercises,
  } = useWorkout();

  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [isFinishWorkoutModalOpen, setIsFinishWorkoutModalOpen] = useState(false);
  const [showRestTimerUI, setShowRestTimerUI] = useState(true);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(120);
  const totalRestTime = 120;
  const [showIncompleteSetsWarning, setShowIncompleteSetsWarning] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  const MIN_HEIGHT = 320;               // Slightly increased height
  const MAX_HEIGHT = MIN_HEIGHT * 1.5;  // Adjusted multiplier
  const DEFAULT_SCALE = 1.0;            // Slightly increased scale

  // scroll handler to shrink SVG from MAX_HEIGHT → MIN_HEIGHT
  useEffect(() => {
    const mainEl = mainRef.current;
    const svgEl = svgWrapperRef.current;
    if (!mainEl || !svgEl) return;

    // initialize at max height
    svgEl.style.height = `${MAX_HEIGHT}px`;

    const onScroll = () => {
      const scrollTop = mainEl.scrollTop;
      const newHeight = Math.max(MAX_HEIGHT - scrollTop, MIN_HEIGHT);
      svgEl.style.height = `${newHeight}px`;
    };

    mainEl.addEventListener("scroll", onScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", onScroll);
  }, []);

  // rest timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRestTimerRunning && restTimeRemaining > 0) {
      timer = setInterval(() => setRestTimeRemaining((t) => t - 1), 1000);
    } else if (restTimeRemaining === 0) {
      setIsRestTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isRestTimerRunning, restTimeRemaining]);

  const handleTerminateWorkout = () => {
    if (window.confirm("Are you sure you want to terminate the workout? All progress will be lost.")) {
      setCurrentWorkoutExercises([]);
      // TODO: Navigate back to home
    }
  };

  const handleCompleteWorkout = () => {
    // Check if all sets are executed
    const allSetsExecuted = currentWorkoutExercises.every(exercise => 
      exercise.sets.every(set => set.isExecuted)
    );

    if (allSetsExecuted) {
      setIsFinishWorkoutModalOpen(true);
    } else {
      // Show warning in WorkoutSummaryScreen
      const remainingSets = currentWorkoutExercises.reduce((total, exercise) => 
        total + exercise.sets.filter(set => !set.isExecuted).length, 0);
      
      // Pass this to WorkoutSummaryScreen to show warning
      setShowIncompleteSetsWarning(true);
    }
  };

  const handleSaveWorkout = () => {
    // The actual save logic is handled in the FinishWorkoutModal component
    setCurrentWorkoutExercises([]);
    router.push('/'); // Navigate back to home after saving
  };

  const handleAddExercise = (exerciseWithSets: any) => {
    const idx = currentWorkoutExercises.findIndex((e) => e.id === exerciseWithSets.id);
    if (idx !== -1) {
      setCurrentWorkoutExercises((prev) => {
        const clone = [...prev];
        const existing = clone[idx];
        clone[idx] = {
          ...existing,
          sets: [
            ...existing.sets,
            { weight: 0, reps: 0, rpe: 0, isWarmup: false, isExecuted: false },
          ],
        };
        return clone;
      });
    } else {
      setCurrentWorkoutExercises((prev) => [...prev, exerciseWithSets]);
    }
    setIsAddExerciseModalOpen(false);
  };

  const toggleSetExecuted = (exerciseIndex: number, setIndex: number) => {
    setCurrentWorkoutExercises((prev) => {
      const clone = [...prev];
      const set = clone[exerciseIndex].sets[setIndex];
      clone[exerciseIndex].sets[setIndex] = { ...set, isExecuted: !set.isExecuted };
      return clone;
    });
    setShowRestTimerUI(true);
    setIsRestTimerRunning(true);
    setRestTimeRemaining(totalRestTime);
  };

  const resetRestTimer = () => {
    setIsRestTimerRunning(false);
    setRestTimeRemaining(totalRestTime);
  };

  const toggleRestTimer = () => setIsRestTimerRunning((r) => !r);

  return (
    <div className="flex flex-col h-full">
      <WorkoutHeader
        onTerminateWorkout={handleTerminateWorkout}
        onCompleteWorkout={handleCompleteWorkout}
        className="fixed top-0 left-0 right-0 z-20"
      />

      <main
        ref={mainRef}
        className="flex-grow overflow-y-auto pt-[72px] pb-[180px]"
      >
        <div
          ref={svgWrapperRef}
          className="relative w-full mb-6 mt-4 transition-all duration-300 ease-in-out overflow-hidden"
          style={{ height: `${MIN_HEIGHT}px` }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <MuscleActivationSVG
              muscleVolumes={muscleVolumes}
              className="w-full h-full"
              scale={DEFAULT_SCALE}
            />
          </div>
        </div>

        <div className="mt-4 px-4 relative z-10">
          <WorkoutSummaryScreen 
            toggleSetExecuted={toggleSetExecuted}
            showIncompleteSetsWarning={showIncompleteSetsWarning}
            remainingSets={currentWorkoutExercises.reduce((total, exercise) => 
              total + exercise.sets.filter(set => !set.isExecuted).length, 0)}
          />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex flex-col gap-2 z-20 h-[180px]">
        <div className="flex justify-between items-center">
          <h4 className="text-md font-semibold">Total Volume:</h4>
          <span className="text-lg font-bold">{totalVolume.toLocaleString()} kg</span>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            className="flex-[2] bg-primary text-white py-3 rounded-xl font-semibold shadow-sm hover:opacity-95"
            onClick={() => setIsAddExerciseModalOpen(true)}
          >
            + Add Exercise
          </Button>
          <Button
            className="flex-[1] bg-blue-500 text-white py-3 rounded-xl font-semibold shadow-sm hover:opacity-95"
            onClick={() => console.log("Special set clicked")}
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
              className="absolute left-2 top-1/2 -translate-y-1/2 focus:ring-0 focus:ring-offset-0 active:bg-transparent"
            >
              {isRestTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetRestTimer}
              className="absolute right-2 top-1/2 -translate-y-1/2 focus:ring-0 focus:ring-offset-0 active:bg-transparent"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <AddWorkoutModal
        open={isAddExerciseModalOpen}
        onOpenChange={() => setIsAddExerciseModalOpen(false)}
        onExerciseSave={handleAddExercise}
      />

      <FinishWorkoutModal
        open={isFinishWorkoutModalOpen}
        onOpenChange={setIsFinishWorkoutModalOpen}
        onSave={handleSaveWorkout}
      />

      {!isWorkoutPage && <BottomNav />}
    </div>
  );
}
