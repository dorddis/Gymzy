"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBar } from "@/components/layout/header";
import { HeatmapCard } from "@/components/dashboard/heatmap-card";
import { StatsCardsRow } from "@/components/dashboard/stats-cards-row";
import { RecentWorkoutsCarousel } from "@/components/dashboard/recent-workouts-carousel";
import { CommunityFeed } from "@/components/dashboard/community-feed";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AIWelcomeMessage } from "@/components/dashboard/ai-welcome-message";
import { QuickWorkoutTemplates } from "@/components/dashboard/quick-workout-templates";
import { useWorkout } from "@/contexts/WorkoutContext";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Heart } from "lucide-react";
import { LifestyleTracker } from "@/components/lifestyle/lifestyle-tracker";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


export default function HomePage() {
  const { combinedMuscleVolumes } = useWorkout();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLifestyleDialogOpen, setIsLifestyleDialogOpen] = useState(false);

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
        // Don&apos;t redirect yet, wait for profile to load
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

  // Don&apos;t render if user is not authenticated or hasn&apos;t completed onboarding
  if (!user || !user.profile?.hasCompletedOnboarding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 pb-24 max-w-4xl">
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

          <QuickWorkoutTemplates />

          {/* Daily Check-in */}
          <div className="flex justify-center px-4">
            <Dialog open={isLifestyleDialogOpen} onOpenChange={setIsLifestyleDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-3 text-purple-600 border-2 border-purple-400 hover:border-purple-500 hover:bg-purple-50 hover:shadow-sm active:bg-purple-100 active:text-purple-700 font-medium rounded-lg transition-all duration-200"
                >
                  <Heart className="h-4 w-4" />
                  Daily Check-in
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <LifestyleTracker onClose={() => setIsLifestyleDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <RecentWorkoutsCarousel />
          <CommunityFeed />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
