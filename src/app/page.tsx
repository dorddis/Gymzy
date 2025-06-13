"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatusBar } from "@/components/layout/header";
import { HeatmapCard } from "@/components/dashboard/heatmap-card";
import { StatsCardsRow } from "@/components/dashboard/stats-cards-row";
import { RecentWorkoutsCarousel } from "@/components/dashboard/recent-workouts-carousel";
import { CommunityFeed } from "@/components/dashboard/community-feed";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AIWelcomeMessage } from "@/components/dashboard/ai-welcome-message";
import { useWorkout } from "@/contexts/WorkoutContext";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { combinedMuscleVolumes } = useWorkout();
  const { user, loading } = useAuth();
  const router = useRouter();

  // Handle authentication and onboarding routing
  useEffect(() => {
    console.log('HomePage: Routing check', {
      loading,
      user: !!user,
      hasProfile: !!user?.profile,
      hasCompletedOnboarding: user?.profile?.hasCompletedOnboarding
    });

    if (!loading) {
      if (!user) {
        console.log('HomePage: No user, redirecting to auth');
        router.replace('/auth');
      } else if (user.profile === undefined) {
        console.log('HomePage: Profile is undefined, waiting for profile to load');
        // Don't redirect yet, wait for profile to load
      } else if (user.profile && !user.profile.hasCompletedOnboarding) {
        console.log('HomePage: User has not completed onboarding, redirecting');
        router.replace('/onboarding');
      } else {
        console.log('HomePage: User is authenticated and onboarded, staying on home');
      }
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't render if user is not authenticated or hasn't completed onboarding
  if (!user || !user.profile?.hasCompletedOnboarding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <StatusBar />
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* AI Welcome Message */}
          <AIWelcomeMessage />

          <div className="space-y-4">
            {/* <h2 className="text-2xl font-bold">Weekly Activation</h2> */}
            <div className="grid gap-4">
              <HeatmapCard
                title="Weekly Muscle Activation"
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
