"use client";
import React from "react";
import { StatusBar } from "@/components/layout/header";
import { HeatmapCard } from "@/components/dashboard/heatmap-card";
import { StatsCardsRow } from "@/components/dashboard/stats-cards-row";
import { RecentWorkoutsCarousel } from "@/components/dashboard/recent-workouts-carousel";
import { CommunityFeed } from "@/components/dashboard/community-feed";
import { BottomNav } from "@/components/layout/bottom-nav";
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <StatusBar />
      <main className="flex-grow space-y-4 py-4">
        <HeatmapCard />
        <StatsCardsRow />
        {/* Add Workout CTA Button */}
        <div className="px-4">
          <Link href="/workout" passHref>
            <button
              className="w-full bg-secondary text-white py-3 px-4 rounded-xl text-lg font-semibold shadow-md hover:bg-secondary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
            >
              + Add Workout
            </button>
          </Link>
        </div>
        <RecentWorkoutsCarousel />
        <CommunityFeed />
      </main>
      <BottomNav />
    </div>
  );
}
