import React from 'react';
import { Card } from '@/components/ui/card';
import { Flame, TrendingUp, RefreshCcw } from 'lucide-react';
import { useWorkout } from '@/contexts/WorkoutContext';
import { StatCardSkeleton } from '@/components/ui/skeleton';

export function StatsCardsRow() {
  const { recentWorkouts, loading, error } = useWorkout();

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4 px-4 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="px-4 text-center text-red-500">Error loading stats</div>;
  }

  // Calculate Total Volume
  const totalVolume = recentWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

  // Calculate Average RPE
  const totalRPE = recentWorkouts.reduce((sum, w) => sum + (w.rpe || 0), 0);
  const averageRPE = recentWorkouts.length > 0 ? (totalRPE / recentWorkouts.length) : 0;

  // Calculate Consistency (placeholder for now, needs actual logic)
  // For demonstration, let&apos;s say 3 workouts in the last 7 days is 'Good'
  const consistency = recentWorkouts.length >= 3 ? 'Good' : 'Needs Work';

  const stats = [
    {
      id: 'totalVolume',
      label: 'Total Volume',
      value: `${totalVolume.toLocaleString()} lbs`,
      icon: Flame,
      color: 'text-red-500',
    },
    {
      id: 'averageRPE',
      label: 'Average RPE',
      value: averageRPE.toFixed(1),
      icon: TrendingUp,
      color: 'text-blue-500',
    },
    {
      id: 'consistency',
      label: 'Consistency',
      value: consistency,
      icon: RefreshCcw,
      color: consistency === 'Good' ? 'text-green-500' : 'text-yellow-500',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 px-4 mb-4">
      {stats.map((stat) => (
        <Card key={stat.id} className="flex flex-col items-center justify-center p-3 text-center rounded-xl shadow-sm bg-white">
          <stat.icon className={`w-6 h-6 mb-1 ${stat.color}`} />
          <p className="text-xs text-gray-500">{stat.label}</p>
          <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
} 