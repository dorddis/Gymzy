"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  RefreshCw,
  MessageCircle,
  Target,
  TrendingUp,
  Calendar,
  Loader2,
  Brain
} from 'lucide-react';
import { generateDailyMotivation } from '@/services/ai-chat-service';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useRouter } from 'next/navigation';

interface MotivationContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  lastWorkout?: Date;
  currentStreak: number;
  hasWorkoutToday: boolean;
  weeklyGoalProgress: number;
}

export function AIWelcomeMessage() {
  const { user } = useAuth();
  const { workouts } = useWorkout();
  const router = useRouter();
  
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [motivationContext, setMotivationContext] = useState<MotivationContext | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user?.uid && isClient) {
      generateMotivationContext();
    }
  }, [user, workouts, isClient]);

  useEffect(() => {
    if (motivationContext) {
      if (shouldGenerateNewMessage()) {
        generateMessage();
      } else if (!message) {
        // Set fallback message immediately if no message exists
        setMessage(getFallbackMessage());
      }
    }
  }, [motivationContext]);

  const generateMotivationContext = () => {
    if (!user || !isClient) return;

    // If workouts is null or undefined, use empty array
    const userWorkouts = workouts || [];

    const now = new Date();
    const hour = now.getHours();
    
    // Determine time of day
    let timeOfDay: 'morning' | 'afternoon' | 'evening';
    if (hour < 12) {
      timeOfDay = 'morning';
    } else if (hour < 18) {
      timeOfDay = 'afternoon';
    } else {
      timeOfDay = 'evening';
    }

    // Find last workout
    const sortedWorkouts = [...userWorkouts].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastWorkout = sortedWorkouts.length > 0 ? new Date(sortedWorkouts[0].date) : undefined;

    // Check if user worked out today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasWorkoutToday = userWorkouts.some(workout => {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate.getTime() === today.getTime();
    });

    // Calculate current streak
    let currentStreak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    // If no workout today, start checking from yesterday
    if (!hasWorkoutToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const hasWorkoutOnDate = userWorkouts.some(workout => {
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });

      if (hasWorkoutOnDate) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate weekly goal progress (assuming 3-4 workouts per week goal)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const workoutsThisWeek = userWorkouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= weekStart;
    });
    
    const weeklyGoalProgress = Math.min((workoutsThisWeek.length / 3) * 100, 100);

    setMotivationContext({
      timeOfDay,
      lastWorkout,
      currentStreak,
      hasWorkoutToday,
      weeklyGoalProgress
    });
  };

  const shouldGenerateNewMessage = (): boolean => {
    if (!lastGenerated) return true;
    
    // Generate new message if it's been more than 4 hours
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);
    
    return lastGenerated < fourHoursAgo;
  };

  const generateMessage = async () => {
    if (!user?.uid || !motivationContext) return;

    try {
      setIsLoading(true);

      let selectedMessageType: 'motivational' | 'tip' | 'joke' | 'general';

      if (motivationContext.hasWorkoutToday) {
        selectedMessageType = 'tip';
      } else {
        // No workout today
        if (Math.random() < 0.2) { // 20% chance for a joke
          selectedMessageType = 'joke';
        } else if (shouldGenerateNewMessage()) {
          // Prioritize motivational or general if it's a "new" message session
          selectedMessageType = Math.random() < 0.5 ? 'motivational' : 'general';
        } else {
          // If message is being refreshed but not "stale", default to general or motivational
          selectedMessageType = Math.random() < 0.3 ? 'motivational' : 'general'; // Slight chance for motivational on refresh
        }
      }
      
      const response = await generateDailyMotivation(user.uid, motivationContext, selectedMessageType);
      
      if (response.success) {
        setMessage(response.message);
        setLastGenerated(new Date());
      } else {
        // Use fallback message
        setMessage(getFallbackMessage());
      }
    } catch (error) {
      console.error('Error generating motivation message:', error);
      setMessage(getFallbackMessage());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackMessage = (): string => {
    if (!motivationContext) return "Welcome back to Gymzy! Ready to crush your fitness goals? 💪";

    const { timeOfDay, hasWorkoutToday, currentStreak } = motivationContext;

    if (hasWorkoutToday) {
      return `Great job on today's workout! 🎉 ${currentStreak > 1 ? `You're on a ${currentStreak}-day streak!` : 'Keep the momentum going!'} 💪`;
    }

    if (timeOfDay === 'morning') {
      return `Good morning! ${currentStreak > 0 ? `Don't break your ${currentStreak}-day streak!` : 'Today is a perfect day to start your fitness journey!'} 🌅`;
    } else if (timeOfDay === 'afternoon') {
      return `Afternoon energy boost time! ${currentStreak > 0 ? `Keep your ${currentStreak}-day streak alive!` : 'A quick workout can energize your day!'} ⚡`;
    } else {
      return `Evening wind-down or final push? ${currentStreak > 0 ? `Your ${currentStreak}-day streak is waiting!` : 'End your day with some movement!'} 🌙`;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await generateMessage();
    setIsRefreshing(false);
  };

  const handleMessageClick = () => {
    // Add a subtle animation before navigation
    const messageElement = document.querySelector('.ai-message-clickable');
    if (messageElement) {
      messageElement.classList.add('animate-pulse');
      setTimeout(() => {
        messageElement.classList.remove('animate-pulse');
      }, 300);
    }

    // Navigate to chat with the current message as context
    setTimeout(() => {
      const chatUrl = `/chat?message=${encodeURIComponent(message)}`;
      router.push(chatUrl);
    }, 150);
  };

  const getMessageIcon = () => {
    if (!motivationContext) return <Sparkles className="h-5 w-5 text-primary" />;

    const { hasWorkoutToday, currentStreak } = motivationContext;
    
    if (hasWorkoutToday) {
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    } else if (currentStreak > 0) {
      return <Target className="h-5 w-5 text-orange-500" />;
    } else {
      return <Calendar className="h-5 w-5 text-blue-500" />;
    }
  };

  const getContextBadge = () => {
    if (!motivationContext) return null;

    const { hasWorkoutToday, currentStreak, weeklyGoalProgress } = motivationContext;
    
    if (hasWorkoutToday) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <TrendingUp className="h-3 w-3" />
          Workout Complete
        </div>
      );
    } else if (currentStreak > 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
          <Target className="h-3 w-3" />
          {currentStreak}-day streak
        </div>
      );
    } else if (weeklyGoalProgress > 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          <Calendar className="h-3 w-3" />
          {Math.round(weeklyGoalProgress)}% weekly goal
        </div>
      );
    }
    
    return null;
  };

  if (!user || !isClient) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getMessageIcon()}
            <span className="font-medium text-sm">Talk to Gymzy</span>
          </div>
          
          <div className="flex items-center gap-2">
            {getContextBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="h-8 w-8 p-0"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div
          className="ai-message-clickable mb-3 cursor-pointer hover:bg-primary/5 rounded-lg p-2 -m-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          onClick={handleMessageClick}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating personalized message...</span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-gray-800">{message}</p>
          )}
        </div>
        
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/recommendations'}
              className="text-xs h-7 px-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50"
            >
              <Brain className="h-3 w-3 mr-1" />
              View recommendations
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/chat'}
              className="text-xs h-7 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Reply in chat...
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
