"use client";
import React from "react";
import { StatusBar } from "@/components/layout/header";
import { HeatmapCard } from "@/components/dashboard/heatmap-card";
import { StatsCardsRow } from "@/components/dashboard/stats-cards-row";
import { RecentWorkoutsCarousel } from "@/components/dashboard/recent-workouts-carousel";
import { CommunityFeed } from "@/components/dashboard/community-feed";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useWorkout } from "@/contexts/WorkoutContext";

export default function HomePage() {
  const { combinedMuscleVolumes } = useWorkout();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <StatusBar />
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Weekly Activation</h2>
            <div className="grid gap-4">
              <HeatmapCard
                title="Muscle Activation"
                muscleVolumes={combinedMuscleVolumes}
                className="w-full"
              />
            </div>
          </div>
          <StatsCardsRow />
          <RecentWorkoutsCarousel />
          <CommunityFeed />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
