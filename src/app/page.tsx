'use client';
import { StatusBar } from "@/components/layout/header";
import { HeatmapCard } from "@/components/dashboard/heatmap-card";
import { StatsCardsRow } from "@/components/dashboard/stats-cards-row";
import { AddWorkoutModal } from "@/components/dashboard/add-workout-modal";
import { RecentWorkoutsCarousel } from "@/components/dashboard/recent-workouts-carousel";
import { CommunityFeed } from "@/components/dashboard/community-feed";
import { BottomNav } from "@/components/layout/bottom-nav";
import React, { useState } from "react";

export default function HomePage() {
  const [addWorkoutOpen, setAddWorkoutOpen] = useState(false);
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground items-center w-full">
      <StatusBar />
      <main className="flex-grow w-full max-w-[430px] min-w-0 sm:min-w-[390px] sm:max-w-[430px] px-0 sm:px-0 mx-auto pt-0 pb-20">
        <div className="w-full px-0 sm:px-0">
          <HeatmapCard />
          <StatsCardsRow />
          {/* Add Workout CTA Button */}
          <div className="mx-4 mb-4">
            <button
              className="w-full bg-secondary text-white py-3 rounded-xl font-semibold shadow-sm flex items-center justify-center text-lg"
              onClick={() => setAddWorkoutOpen(true)}
            >
              <span className="mr-2">+</span> Add Workout
            </button>
          </div>
          <AddWorkoutModal open={addWorkoutOpen} onOpenChange={setAddWorkoutOpen} />
          <RecentWorkoutsCarousel />
          <CommunityFeed />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
