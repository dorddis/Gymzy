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

export default function WorkoutPage() {
  const pathname = usePathname();
  const isWorkoutPage = pathname === "/workout";

  const {
    muscleVolumes,
    currentWorkoutExercises,
    totalVolume,
    setCurrentWorkoutExercises,
  } = useWorkout();

  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [showRestTimerUI, setShowRestTimerUI] = useState(true);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(120);
  const totalRestTime = 120;

  const mainRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  const MIN_HEIGHT = 300;               // px
  const MAX_HEIGHT = MIN_HEIGHT * 2.2;  // 660px

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

  const handleTerminateWorkout = () => console.log("Workout terminated!");
  const handleCompleteWorkout = () => console.log("Workout completed!");

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
    <div className="min-h-screen bg-background flex flex-col">
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
          className="sticky top-[72px] w-full overflow-hidden z-0 transition-[height] duration-100 ease-out"
          style={{ height: `${MAX_HEIGHT}px` }}
        >
          <MuscleActivationSVG className="w-full h-full" />
        </div>

        <div className="mt-4 px-4 relative z-10">
          <WorkoutSummaryScreen toggleSetExecuted={toggleSetExecuted} />
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
              className="absolute left-2 top-1/2 -translate-y-1/2"
            >
              {isRestTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetRestTimer}
              className="absolute right-2 top-1/2 -translate-y-1/2"
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

      {!isWorkoutPage && <BottomNav />}
    </div>
  );
}
