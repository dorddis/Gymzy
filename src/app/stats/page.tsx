"use client";

import React from 'react';
import { StatusBar } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useWorkout } from '@/contexts/WorkoutContext';
import { TrendingUp, Activity, Gauge, CalendarCheck, Flame, Award } from 'lucide-react';
import { Muscle } from '@/lib/constants'; // Import Muscle enum

// Constants for the GitHub-style progress tracker
const DAY_SQUARE_SIZE = 20; // px
const GAP_SIZE = 6; // px
const ROW_HEIGHT = DAY_SQUARE_SIZE + GAP_SIZE; // 26px

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

  // Helper function to get dates in user's local timezone
  const getLocalDateString = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
    });
  };

  // Helper function to get start of day in user's timezone
  const getStartOfDay = (date: Date) => {
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    return localDate;
  };

  const last7Days = getDatesInRange(14).map(date => getLocalDateString(new Date(date))); // Changed to 14 days
  const last6MonthsDates = getDatesInRange(180); // Changed to 6 months

  const {
    weeklyVolumeData,
    weeklyFrequencyData,
    totalVolumeLast7Days,
    averageRPE,
    consistencyStreak,
    topMuscleGroup,
    dailyVolumesForTracker,
    maxDailyVolume,
    totalCaloriesBurnt,
    personalBestLift
  } = React.useMemo(() => {
    const volumeMap7Days = new Map<string, number>(last7Days.map(date => [date, 0]));
    const frequencyMap7Days = new Map<string, number>(last7Days.map(date => [date, 0]));
    const dailyVolumeMap6Months = new Map<string, number>(last6MonthsDates.map(date => [date, 0])); // Changed to 6 months

    let totalVolume7Days = 0;
    let totalRPE7Days = 0;
    let totalRPEsets = 0;
    const muscleGroupVolumes: { [key: string]: number } = {};

    if (allWorkouts) {
      allWorkouts.forEach(workout => {
        // Convert workout date to user's local timezone
        const workoutDate = workout.date.toDate();
        const localWorkoutDate = getStartOfDay(workoutDate);
        const workoutDateFormatted = localWorkoutDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const workoutDateShort = getLocalDateString(localWorkoutDate);

        // For 7-day charts
        if (volumeMap7Days.has(workoutDateShort)) {
          volumeMap7Days.set(workoutDateShort, (volumeMap7Days.get(workoutDateShort) || 0) + (workout.totalVolume || 0));
          frequencyMap7Days.set(workoutDateShort, (frequencyMap7Days.get(workoutDateShort) || 0) + 1);
          totalVolume7Days += (workout.totalVolume || 0);
          
          // Calculate RPE from individual sets
          workout.exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
              if (set.isExecuted && set.rpe !== undefined && set.rpe > 0) {
                totalRPE7Days += set.rpe;
                totalRPEsets++;
              }
            });
          });
        }

        // For 6-month progress tracker
        if (dailyVolumeMap6Months.has(workoutDateFormatted)) {
          dailyVolumeMap6Months.set(workoutDateFormatted, (dailyVolumeMap6Months.get(workoutDateFormatted) || 0) + (workout.totalVolume || 0));
        }

        // Calculate muscle group volumes
        workout.exercises.forEach(exercise => {
          exercise.targetedMuscles.forEach(muscle => {
            const exerciseVolume = exercise.sets.reduce((sum, set) => {
              if (!set.isExecuted) return sum;
              return sum + (set.weight * set.reps);
            }, 0);
            muscleGroupVolumes[muscle] = (muscleGroupVolumes[muscle] || 0) + exerciseVolume;
          });
        });
      });
    }

    const weeklyVolumeData = Array.from(volumeMap7Days.entries()).map(([date, volume]) => ({ date, volume }));
    const weeklyFrequencyData = Array.from(frequencyMap7Days.entries()).map(([date, workouts]) => ({ date, workouts }));

    const dailyVolumesForTracker: DailyVolume[] = Array.from(dailyVolumeMap6Months.entries()).map(([date, volume]) => ({ date, volume }));
    const maxDailyVolume = dailyVolumesForTracker.reduce((max, day) => Math.max(max, day.volume), 0);

    const sortedMuscleGroups = Object.entries(muscleGroupVolumes).sort(([, a], [, b]) => b - a);
    const topMuscleGroup = sortedMuscleGroups.length > 0 ? sortedMuscleGroups[0][0] as Muscle : 'N/A';

    const consistencyStreak = weeklyFrequencyData.filter(d => d.workouts > 0).length;

    // Placeholder for total calories burnt (to be replaced with actual calculation)
    const totalCaloriesBurnt = Math.round(totalVolume7Days * 0.1); // Very rough estimate

    // Calculate personal best lift
    let personalBestLift: { weight: number; exercise: string } | null = null;
    if (allWorkouts) {
      allWorkouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            if (set.weight > (personalBestLift?.weight || 0)) {
              personalBestLift = { weight: set.weight, exercise: exercise.name };
            }
          });
        });
      });
    }

    return {
      weeklyVolumeData,
      weeklyFrequencyData,
      totalVolumeLast7Days: totalVolume7Days,
      averageRPE: totalRPEsets > 0 ? (totalRPE7Days / totalRPEsets) : 0,
      consistencyStreak,
      topMuscleGroup,
      dailyVolumesForTracker,
      maxDailyVolume,
      totalCaloriesBurnt,
      personalBestLift
    };
  }, [allWorkouts, last7Days, last6MonthsDates]);

  const monthLabelsWithColumns = React.useMemo(() => {
    const labels: { month: string; startColumn: number; spanInColumns: number; }[] = [];
    let currentMonth = -1;
    const firstDayOfRange = new Date(last6MonthsDates[0]);

    let monthStartColumn = 0;
    let monthEndColumn = 0;

    last6MonthsDates.forEach((dateString, index) => {
      const date = new Date(dateString);

      const currentColumn = Math.floor((firstDayOfRange.getDay() + index) / 7) + 1; // 1-indexed column

      if (date.getMonth() !== currentMonth) {
        if (currentMonth !== -1) {
          labels.push({
            month: new Date(firstDayOfRange.getFullYear(), currentMonth, 1).toLocaleDateString('en-US', { month: 'short' }),
            startColumn: monthStartColumn,
            spanInColumns: monthEndColumn - monthStartColumn + 1
          });
        }
        currentMonth = date.getMonth();
        monthStartColumn = currentColumn;
      }
      monthEndColumn = currentColumn;
    });

    // Add the last month after the loop
    if (currentMonth !== -1) {
      labels.push({
        month: new Date(firstDayOfRange.getFullYear(), currentMonth, 1).toLocaleDateString('en-US', { month: 'short' }),
        startColumn: monthStartColumn,
        spanInColumns: monthEndColumn - monthStartColumn + 1
      });
    }
    return labels;
  }, [last6MonthsDates]);

  if (loading) {
    return <div className="text-center py-8">Loading stats...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading stats.</div>;
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
        <h1 className="text-2xl font-headline font-bold mb-6 text-primary">Stats & Trends</h1>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="shadow-md border-none bg-white p-4 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-lg font-semibold flex items-center text-gray-700">
                <TrendingUp className="mr-2 text-primary" /> Total Volume (7D)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-2xl font-bold text-primary">
                {totalVolumeLast7Days.toLocaleString()} lbs
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-md border-none bg-white p-4 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-lg font-semibold flex items-center text-gray-700">
                <Gauge className="mr-2 text-primary" /> Avg RPE
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-2xl font-bold text-primary">
                {averageRPE.toFixed(1)}
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-md border-none bg-white p-4 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-lg font-semibold flex items-center text-gray-700">
                <CalendarCheck className="mr-2 text-primary" /> Streak
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-2xl font-bold text-primary">
                {consistencyStreak} Days
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-md border-none bg-white p-4 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-lg font-semibold flex items-center text-gray-700">
                <Activity className="mr-2 text-primary" /> Top Muscle Group
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-2xl font-bold text-primary">
                {topMuscleGroup}
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-md border-none bg-white p-4 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-lg font-semibold flex items-center text-gray-700">
                <Flame className="mr-2 text-primary" /> Total Calories Burnt
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-2xl font-bold text-primary">
                {totalCaloriesBurnt.toLocaleString()} kcal
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-md border-none bg-white p-4 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-lg font-semibold flex items-center text-gray-700">
                <Award className="mr-2 text-primary" /> Personal Best Lift
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-2xl font-bold text-primary">
                {personalBestLift ? `${personalBestLift.weight.toLocaleString()} lbs (${personalBestLift.exercise})` : 'N/A'}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* GitHub-style Progress Tracker */}
        <Card className="mb-6 shadow-md border-none bg-white p-4">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg font-semibold text-gray-700">Workout Progress (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-start"> {/* Use flex to align day labels and calendar grid */}
              {/* Day Labels Column */}
              <div className="flex flex-col justify-between text-xs text-gray-600 mr-2" style={{height: `${7 * ROW_HEIGHT - GAP_SIZE}px`, marginTop: `${ROW_HEIGHT}px`}}> 
                {daysOfWeek.map((day, index) => (
                  <span key={day} className="flex items-center justify-end pr-1" style={{height: `${DAY_SQUARE_SIZE}px`}}> {/* Use DAY_SQUARE_SIZE for height */}
                    {/* Only show M, W, F */}
                    {index === 1 && 'M'} {/* Monday */}
                    {index === 3 && 'W'} {/* Wednesday */}
                    {index === 5 && 'F'} {/* Friday */}
                  </span>
                ))}
              </div>

              {/* Main Calendar Grid Area */}
              <div className="flex-1 overflow-x-auto px-1 pb-2"> {/* Added px-1 for padding, and removed p-2 from parent div */}
                <div className="relative" style={{height: `${7 * ROW_HEIGHT + ROW_HEIGHT}px`}}> {/* Adjusted height for absolute positioning of month labels and grid */}
                  {/* Month labels */}
                  {monthLabelsWithColumns.map((label, index) => (
                    <div
                      key={index}
                      className="absolute text-xs text-gray-600 text-center" // Changed to text-center
                      style={{
                        left: `${(label.startColumn - 1) * (DAY_SQUARE_SIZE + GAP_SIZE)}px`, // Calculate left position based on column
                        top: 0, // Position at the top
                        width: `${(label.spanInColumns * (DAY_SQUARE_SIZE + GAP_SIZE)) - GAP_SIZE}px`, // Dynamic width based on spanInColumns
                      }}
                    >
                      {label.month}
                    </div>
                  ))}
                  {/* Actual Grid for days */}
                  <div className="grid grid-flow-col auto-cols-min" style={{
                      gridTemplateRows: `repeat(7, ${DAY_SQUARE_SIZE}px)`, // 7 rows for days
                      paddingTop: `${ROW_HEIGHT}px`, // Add padding for month labels
                      gap: `${GAP_SIZE}px`, // Added gap for grid cells
                    }}>
                    {last6MonthsDates.map((dateString, index) => {
                      const date = new Date(dateString);
                      const day = date.getDay(); // 0 for Sunday, 6 for Saturday
                      const dailyVolume = dailyVolumesForTracker.find(d => d.date === dateString)?.volume || 0;
                      const colorClass = getVolumeColor(dailyVolume, maxDailyVolume);

                      const firstDayOfRange = new Date(last6MonthsDates[0]);
                      const diffTime = Math.abs(date.getTime() - firstDayOfRange.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const column = Math.floor((firstDayOfRange.getDay() + diffDays) / 7) + 1; // 1-indexed column

                      return (
                        <div
                          key={dateString}
                          className={`rounded-sm ${colorClass} hover:ring-2 hover:ring-primary/20 transition-all duration-200`}
                          style={{
                            gridRow: day + 1, // Day 0 (Sunday) will be row 1, etc.
                            gridColumn: column,
                            width: `${DAY_SQUARE_SIZE}px`,
                            height: `${DAY_SQUARE_SIZE}px`,
                          }}
                          title={`${dailyVolume.toLocaleString()} lbs on ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex justify-end items-center mt-4 text-xs text-gray-600">
              <span className="mr-2">Less</span>
              <div className="flex">
                <div className="rounded-sm bg-gray-200 mr-1" style={{width: `${DAY_SQUARE_SIZE}px`, height: `${DAY_SQUARE_SIZE}px`}}></div>
                <div className="rounded-sm bg-green-100 mr-1" style={{width: `${DAY_SQUARE_SIZE}px`, height: `${DAY_SQUARE_SIZE}px`}}></div>
                <div className="rounded-sm bg-green-300 mr-1" style={{width: `${DAY_SQUARE_SIZE}px`, height: `${DAY_SQUARE_SIZE}px`}}></div>
                <div className="rounded-sm bg-green-500 mr-1" style={{width: `${DAY_SQUARE_SIZE}px`, height: `${DAY_SQUARE_SIZE}px`}}></div>
                <div className="rounded-sm bg-green-700" style={{width: `${DAY_SQUARE_SIZE}px`, height: `${DAY_SQUARE_SIZE}px`}}></div>
              </div>
              <span className="ml-2">More</span>
            </div>
          </CardContent>
        </Card>

        {/* Volume Trend Chart */}
        <Card className="mb-6 shadow-md border-none bg-white">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg font-semibold text-gray-700">Volume Trend (Last 14 Days)</CardTitle> {/* Changed title to 14 Days */}
          </CardHeader>
          <CardContent className="p-2 overflow-x-auto"> {/* Reduced padding and added overflow-x-auto */}
            <div style={{ width: '700px' }}> {/* Fixed width container for chart content */}
              <ResponsiveContainer width="100%" height={200}> {/* Reduced height. Width will fill parent */}
                <LineChart data={weeklyVolumeData}> {/* Removed margin prop */}
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid hsl(var(--border))', borderRadius: '0.25rem' }}
                    labelStyle={{ color: 'hsl(var(--primary))' }}
                    itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <Line type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Workout Frequency Chart */}
        <Card className="shadow-md border-none bg-white">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg font-semibold text-gray-700">Workout Frequency (Last 14 Days)</CardTitle> {/* Changed title to 14 Days */}
          </CardHeader>
          <CardContent className="p-2 overflow-x-auto"> {/* Reduced padding and added overflow-x-auto */}
            <div style={{ width: '700px' }}> {/* Fixed width container for chart content */}
              <ResponsiveContainer width="100%" height={200}> {/* Reduced height. Width will fill parent */}
                <BarChart data={weeklyFrequencyData}> {/* Removed margin prop */}
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid hsl(var(--border))', borderRadius: '0.25rem' }}
                    labelStyle={{ color: 'hsl(var(--primary))' }}
                    itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <Bar dataKey="workouts" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
} 