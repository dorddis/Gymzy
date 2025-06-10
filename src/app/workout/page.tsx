"use client";

import React from "react";
import { WorkoutSummaryScreen } from "@/components/workout/workout-summary-screen";
import { WorkoutHeader } from "@/components/workout/workout-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { usePathname } from 'next/navigation';

export default function WorkoutPage() {
  const pathname = usePathname();
  const isWorkoutPage = pathname === '/workout';

  // Placeholder functions for now, will be implemented with actual logic in WorkoutSummaryScreen
  const handleTerminateWorkout = () => {
    console.log("Workout terminated!");
  };

  const handleCompleteWorkout = () => {
    console.log("Workout completed!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WorkoutHeader
        onTerminateWorkout={handleTerminateWorkout}
        onCompleteWorkout={handleCompleteWorkout}
      />
      <main className="flex-grow space-y-4 py-4">
        <WorkoutSummaryScreen />
      </main>
      {!isWorkoutPage && <BottomNav />}
    </div>
  );
} 