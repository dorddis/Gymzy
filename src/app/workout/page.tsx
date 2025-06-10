"use client";

import React, { useRef } from "react";
import { WorkoutSummaryScreen } from "@/components/workout/workout-summary-screen";
import { WorkoutHeader } from "@/components/workout/workout-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { usePathname } from 'next/navigation';
import { MuscleActivationSVG } from '@/components/workout/muscle-activation-svg';
import { useWorkout } from '@/contexts/WorkoutContext';

export default function WorkoutPage() {
  const pathname = usePathname();
  const isWorkoutPage = pathname === '/workout';
  const mainScrollRef = useRef<HTMLElement>(null);
  const { muscleVolumes } = useWorkout();

  // Placeholder functions for now, will be implemented with actual logic in WorkoutSummaryScreen
  const handleTerminateWorkout = () => {
    console.log("Workout terminated!");
  };

  const handleCompleteWorkout = () => {
    console.log("Workout completed!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <WorkoutHeader
        onTerminateWorkout={handleTerminateWorkout}
        onCompleteWorkout={handleCompleteWorkout}
        className="fixed top-0 left-0 right-0 z-20"
      />
      
      {/* Muscle Activation SVG as fixed background */}
      <div className="fixed top-[72px] left-0 right-0 h-[300px] z-0"> {/* Fixed position, below header, increased height */}
        <MuscleActivationSVG muscleVolumes={muscleVolumes} className="w-full h-full" scrollElementRef={mainScrollRef} />
      </div>

      <main ref={mainScrollRef} className="flex-grow overflow-y-auto pt-[372px] pb-4 relative z-10 min-h-[calc(100vh - 72px)]"> {/* Main scrollable content, adjusted top padding to account for fixed header + SVG */}
        <WorkoutSummaryScreen />
      </main>
      {!isWorkoutPage && <BottomNav />}
    </div>
  );
} 