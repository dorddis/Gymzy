"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { WorkoutSummaryScreen } from "@/components/workout/workout-summary-screen";
import { WorkoutHeader } from "@/components/workout/workout-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { usePathname } from "next/navigation";
import { MuscleActivationSVG } from "@/components/workout/muscle-activation-svg";
import { useWorkout } from "@/contexts/WorkoutContext";
import { Button } from "@/components/ui/button";

import { AddWorkoutModal } from "@/components/dashboard/add-workout-modal";
import { useContextualTracking } from "@/hooks/useContextualTracking";
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
    clearCurrentWorkout,
  } = useWorkout();

  const { trackWorkoutCompletion, trackFeatureUsage } = useContextualTracking();

  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [isFinishWorkoutModalOpen, setIsFinishWorkoutModalOpen] = useState(false);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(120);
  const [workoutStartTime] = useState(Date.now());
  const totalRestTime = 120;
  const [showIncompleteSetsWarning, setShowIncompleteSetsWarning] = useState(false);
  const [showInvalidSetsWarning, setShowInvalidSetsWarning] = useState(false);

  // Reset warnings when exercises change
  useEffect(() => {
    setShowIncompleteSetsWarning(false);
    setShowInvalidSetsWarning(false);
  }, [currentWorkoutExercises]);

  // Check if there are any changes in the workout
  const hasChanges = useMemo(() => {
    const changed = currentWorkoutExercises.some(exercise => 
      exercise.sets.some(set => set.isExecuted || set.weight > 0 || set.reps > 0)
    );
    console.log(`WorkoutPage - currentWorkoutExercises length: ${currentWorkoutExercises.length}, hasChanges: ${changed}`);
    return changed;
  }, [currentWorkoutExercises]);

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

  const handleTerminateWorkout = useCallback(() => {
    clearCurrentWorkout();
    router.push('/');
  }, [router, clearCurrentWorkout]);

  const handleCompleteWorkout = useCallback(() => {
    if (currentWorkoutExercises.length === 0) {
      setShowIncompleteSetsWarning(true);
      return;
    }

    // Check if all sets are executed (higher priority)
    const allSetsExecuted = currentWorkoutExercises.every((exercise) => 
      exercise.sets.every((set) => set.isExecuted)
    );

    if (!allSetsExecuted) {
      setShowIncompleteSetsWarning(true);
      return;
    }

    // Check for invalid sets (0 weight and 0 reps - lower priority)
    const hasInvalidSets = currentWorkoutExercises.some(exercise => 
      exercise.sets.some(set => set.weight === 0 && set.reps === 0)
    );

    if (hasInvalidSets) {
      setShowInvalidSetsWarning(true);
      return;
    }

    // If all checks pass, open the finish workout modal
    setIsFinishWorkoutModalOpen(true);
  }, [currentWorkoutExercises, setIsFinishWorkoutModalOpen]);

  const handleSaveWorkout = async (data: { date: Date; notes: string; isPublic: boolean; mediaUrls: string[]; }) => {
    try {
      // Track workout completion with contextual data
      const workoutData = {
        exercises: currentWorkoutExercises,
        duration: Math.floor((Date.now() - workoutStartTime) / 1000 / 60), // duration in minutes
        totalVolume,
        date: data.date,
        notes: data.notes,
        isPublic: data.isPublic,
        mediaUrls: data.mediaUrls
      };

      // Track the workout completion for AI insights
      await trackWorkoutCompletion(workoutData);

      // Track feature usage
      await trackFeatureUsage('workout_completion');

      // The actual save logic is handled in the FinishWorkoutModal component
      setCurrentWorkoutExercises([]);
      router.push('/'); // Navigate back to home after saving
    } catch (error) {
      console.error('Error saving workout:', error);
      // Still proceed with navigation even if tracking fails
      setCurrentWorkoutExercises([]);
      router.push('/');
    }
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
            { weight: 0, reps: 0, rpe: 8, isWarmup: false, isExecuted: false },
          ],
        };
        return clone;
      });
    } else {
      setCurrentWorkoutExercises((prev) => [...prev, exerciseWithSets]);
    }
    setIsAddExerciseModalOpen(false);
  };

  const startRestTimer = () => {
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
        hasChanges={hasChanges}
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
            showIncompleteSetsWarning={showIncompleteSetsWarning}
            remainingSets={currentWorkoutExercises.reduce((total, exercise) =>
              total + exercise.sets.filter((set) => !set.isExecuted).length, 0)}
            showInvalidSetsWarning={showInvalidSetsWarning}
            onSetExecuted={startRestTimer}
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
            onClick={() => setIsAddExerciseModalOpen(true)}
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
              className="absolute left-2 top-1/2 -translate-y-1/2 focus:ring-0 focus:ring-offset-0 active:bg-blue-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
            >
              {isRestTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetRestTimer}
              className="absolute right-2 top-1/2 -translate-y-1/2 focus:ring-0 focus:ring-offset-0 active:bg-blue-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
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
