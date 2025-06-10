"use client";
import React, { useState } from "react";
import { StatusBar } from "@/components/layout/header";
import { HeatmapCard } from "@/components/dashboard/heatmap-card";
import { StatsCardsRow } from "@/components/dashboard/stats-cards-row";
import { AddWorkoutModal } from "@/components/dashboard/add-workout-modal";
import { RecentWorkoutsCarousel } from "@/components/dashboard/recent-workouts-carousel";
import { CommunityFeed } from "@/components/dashboard/community-feed";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function HomePage() {
  const [isAddWorkoutModalOpen, setIsAddWorkoutModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <StatusBar />
      <main className="flex-grow space-y-4 py-4">
        <HeatmapCard />
        <StatsCardsRow />
        {/* Add Workout CTA Button */}
        <div className="px-4">
          <button
            onClick={() => setIsAddWorkoutModalOpen(true)}
            className="w-full bg-secondary text-white py-3 px-4 rounded-xl text-lg font-semibold shadow-md hover:bg-secondary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          >
            + Add Workout
          </button>
        </div>
        <RecentWorkoutsCarousel />
        <CommunityFeed />
      </main>
      <BottomNav />

      <AddWorkoutModal
        open={isAddWorkoutModalOpen}
        onOpenChange={setIsAddWorkoutModalOpen}
      />
    </div>
  );
}
