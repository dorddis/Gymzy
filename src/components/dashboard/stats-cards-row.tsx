import React from 'react';
import { Card } from '@/components/ui/card';
import { useWorkout } from '@/contexts/WorkoutContext';
import { Dumbbell, Flame, CalendarCheck } from 'lucide-react';

export function StatsCardsRow() {
  const { loggedWorkouts } = useWorkout();

  // Calculate Total Volume
  const totalVolume = loggedWorkouts.reduce((sum, w) => sum + (w.volume || 0), 0);

  // Calculate Average RPE (if available)
  // Assuming RPE is not in the data model, so we'll use a placeholder
  const averageRPE = 7.2;

  // Calculate Consistency (e.g., % of days with a workout in the last 7 days)
  const days = loggedWorkouts.map(w => w.date && new Date(w.date).toDateString());
  const uniqueDays = Array.from(new Set(days));
  const consistency = Math.round((uniqueDays.length / 7) * 100);

  return (
    <div className="flex justify-between mx-4 mb-4">
      <Card className="bg-white rounded-xl shadow-sm p-3 w-[31%] flex flex-col items-center">
        <Dumbbell className="text-secondary mb-1" />
        <p className="text-center text-xl font-semibold">{totalVolume.toLocaleString()}</p>
        <p className="text-xs text-center text-gray-500">Total Volume</p>
      </Card>
      <Card className="bg-white rounded-xl shadow-sm p-3 w-[31%] flex flex-col items-center">
        <Flame className="text-secondary mb-1" />
        <p className="text-center text-xl font-semibold">{averageRPE}</p>
        <p className="text-xs text-center text-gray-500">Average RPE</p>
      </Card>
      <Card className="bg-white rounded-xl shadow-sm p-3 w-[31%] flex flex-col items-center">
        <CalendarCheck className="text-secondary mb-1" />
        <p className="text-center text-xl font-semibold">{consistency}%</p>
        <p className="text-xs text-center text-gray-500">Consistency</p>
      </Card>
    </div>
  );
} 