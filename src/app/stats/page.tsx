"use client";

import React from 'react';
import { StatusBar } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useWorkout } from '@/contexts/WorkoutContext';
import { TrendingUp, Activity, Gauge, CalendarCheck } from 'lucide-react';
import { Muscle } from '@/lib/constants'; // Import Muscle enum

interface WeeklyData {
  date: string;
  volume: number;
  workouts: number;
}

interface DailyVolume {
  date: string;
  volume: number;
}

// Helper to get dates for a given range (e.g., last 7 days, last 3 months)
const getDatesInRange = (days: number): string[] => {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]); // YYYY-MM-DD format
  }
  return dates;
};

const getVolumeColor = (volume: number, maxVolume: number): string => {
  if (volume === 0) return 'bg-gray-200';
  if (maxVolume === 0) return 'bg-green-300'; // Fallback if no max volume

  const intensity = volume / maxVolume;

  if (intensity < 0.25) return 'bg-green-100';
  if (intensity < 0.5) return 'bg-green-300';
  if (intensity < 0.75) return 'bg-green-500';
  return 'bg-green-700';
};

export default function StatsTrendsScreen() {
  const { recentWorkouts, allWorkouts, loading, error } = useWorkout();

  const last7Days = getDatesInRange(7).map(date => new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }));
  const last3MonthsDates = getDatesInRange(90);

  const {
    weeklyVolumeData,
    weeklyFrequencyData,
    totalVolumeLast7Days,
    averageRPE,
    consistencyStreak,
    topMuscleGroup,
    dailyVolumesForTracker,
    maxDailyVolume
  } = React.useMemo(() => {
    const volumeMap7Days = new Map<string, number>(last7Days.map(date => [date, 0]));
    const frequencyMap7Days = new Map<string, number>(last7Days.map(date => [date, 0]));
    const dailyVolumeMap3Months = new Map<string, number>(last3MonthsDates.map(date => [date, 0]));

    let totalVolume7Days = 0;
    let totalRPE7Days = 0;
    let workoutCount7Days = 0;
    const muscleGroupVolumes: { [key: string]: number } = {};

    if (allWorkouts) {
      allWorkouts.forEach(workout => {
        const workoutDateFormatted = workout.date.toDate().toISOString().split('T')[0]; // YYYY-MM-DD
        const workoutDateShort = new Date(workoutDateFormatted).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

        // For 7-day charts
        if (volumeMap7Days.has(workoutDateShort)) {
          volumeMap7Days.set(workoutDateShort, (volumeMap7Days.get(workoutDateShort) || 0) + (workout.totalVolume || 0));
          frequencyMap7Days.set(workoutDateShort, (frequencyMap7Days.get(workoutDateShort) || 0) + 1);
          totalVolume7Days += (workout.totalVolume || 0);
          totalRPE7Days += (workout.rpe || 0);
          workoutCount7Days++;
        }

        // For 3-month progress tracker
        if (dailyVolumeMap3Months.has(workoutDateFormatted)) {
          dailyVolumeMap3Months.set(workoutDateFormatted, (dailyVolumeMap3Months.get(workoutDateFormatted) || 0) + (workout.totalVolume || 0));
        }

        workout.exercises.forEach(exercise => {
          exercise.targetedMuscles.forEach(muscle => {
            muscleGroupVolumes[muscle] = (muscleGroupVolumes[muscle] || 0) + (exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0));
          });
        });
      });
    }

    const weeklyVolumeData = Array.from(volumeMap7Days.entries()).map(([date, volume]) => ({ date, volume }));
    const weeklyFrequencyData = Array.from(frequencyMap7Days.entries()).map(([date, workouts]) => ({ date, workouts }));

    const dailyVolumesForTracker: DailyVolume[] = Array.from(dailyVolumeMap3Months.entries()).map(([date, volume]) => ({ date, volume }));
    const maxDailyVolume = dailyVolumesForTracker.reduce((max, day) => Math.max(max, day.volume), 0);

    const sortedMuscleGroups = Object.entries(muscleGroupVolumes).sort(([, a], [, b]) => b - a);
    const topMuscleGroup = sortedMuscleGroups.length > 0 ? sortedMuscleGroups[0][0] as Muscle : 'N/A';

    const consistencyStreak = weeklyFrequencyData.filter(d => d.workouts > 0).length;

    return {
      weeklyVolumeData,
      weeklyFrequencyData,
      totalVolumeLast7Days: totalVolume7Days,
      averageRPE: workoutCount7Days > 0 ? (totalRPE7Days / workoutCount7Days) : 0,
      consistencyStreak,
      topMuscleGroup,
      dailyVolumesForTracker,
      maxDailyVolume
    };
  }, [allWorkouts, last7Days, last3MonthsDates]);

  if (loading) {
    return <div className="text-center py-8">Loading stats...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading stats.</div>;
  }

  const monthLabels = last3MonthsDates.reduce((acc: string[], dateString, index) => {
    const date = new Date(dateString);
    if (index === 0 || date.getDate() === 1) { // Show month for the first day or the first day of a month
        acc.push(date.toLocaleDateString('en-US', { month: 'short' }));
    } else {
        acc.push('');
    }
    return acc;
}, []);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
        <h1 className="text-2xl font-headline font-bold mb-6">Stats & Trends</h1>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-lg border-none bg-card p-4">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <TrendingUp className="mr-2 text-primary" /> Total Volume (7D)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-3xl font-bold text-gray-900">
                {totalVolumeLast7Days.toLocaleString()} lbs
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-none bg-card p-4">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Gauge className="mr-2 text-secondary" /> Avg RPE
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-3xl font-bold text-gray-900">
                {averageRPE.toFixed(1)}
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-none bg-card p-4">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <CalendarCheck className="mr-2 text-primary" /> Consistency (7D)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-3xl font-bold text-gray-900">
                {consistencyStreak} Days
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-none bg-card p-4">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Activity className="mr-2 text-secondary" /> Top Muscle Group
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-3xl font-bold text-gray-900">
                {topMuscleGroup}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* GitHub-style Progress Tracker */}
        <Card className="mb-6 shadow-lg border-none bg-card p-4">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg font-semibold">Workout Progress (Last 3 Months)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row items-start gap-2">
              {/* Day Labels */}
              <div className="grid grid-rows-7 gap-1 text-xs text-gray-500 mr-2">
                <span></span> {/* Empty space for month label alignment */}
                {daysOfWeek.map((day, index) => (
                  <span key={day} className="h-4 flex items-center justify-end pr-1">
                    {index % 2 === 1 ? day.charAt(0) : ''}
                  </span>
                ))}
              </div>
              {/* Progress Grid */}
              <div className="flex-grow overflow-x-auto pb-2">
                <div className="grid grid-flow-col grid-rows-7 gap-1 auto-cols-min">
                  {monthLabels.map((month, index) => (
                    <div key={index} className="text-xs text-gray-500" style={{ gridRow: 1, gridColumn: index + 2 }}>
                      {month}
                    </div>
                  ))}
                  {last3MonthsDates.map((dateString) => {
                    const day = new Date(dateString).getDay(); // 0 for Sunday, 6 for Saturday
                    const dailyVolume = dailyVolumesForTracker.find(d => d.date === dateString)?.volume || 0;
                    const colorClass = getVolumeColor(dailyVolume, maxDailyVolume);
                    return (
                      <div
                        key={dateString}
                        className={`w-4 h-4 rounded-sm ${colorClass}`}
                        style={{ gridRow: day + 2 }} // +1 for skipping month row, +1 for day labels
                        title={`${dateString}: ${dailyVolume} lbs`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volume Trend Chart */}
        <Card className="mb-6 shadow-lg border-none bg-card">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg font-semibold">Volume Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="volume" stroke="hsl(var(--secondary))" strokeWidth={2} activeDot={{ r: 6, fill: 'hsl(var(--secondary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Frequency Chart */}
        <Card className="mb-6 shadow-lg border-none bg-card">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg font-semibold">Training Frequency (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="workouts" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </main>
      <BottomNav />
    </div>
  );
} 