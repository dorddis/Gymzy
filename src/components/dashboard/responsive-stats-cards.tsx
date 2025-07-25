"use client";

import React from 'react';
import { Flame, TrendingUp, RefreshCcw } from 'lucide-react';
import { useWorkout } from '@/contexts/WorkoutContext';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveCard, ResponsiveText, useResponsiveValue, useResponsiveSpacing } from '@/components/layout/responsive-container';
import { cn } from '@/lib/utils';

export function ResponsiveStatsCards() {
  const { recentWorkouts, loading, error } = useWorkout();
  const { gap } = useResponsiveSpacing();

  // Responsive configuration
  const columns = useResponsiveValue({
    mobile: 3,
    tablet: 3,
    desktop: 3,
    splitScreen: 2, // Fewer columns in split-screen mode
  });

  const showLabels = useResponsiveValue({
    mobile: true,
    tablet: true,
    desktop: true,
    splitScreen: false, // Hide labels in compact mode
  });

  const iconSize = useResponsiveValue({
    mobile: 'w-6 h-6',
    tablet: 'w-6 h-6',
    desktop: 'w-6 h-6',
    splitScreen: 'w-5 h-5',
  });

  if (loading) {
    return (
      <ResponsiveContainer className="px-4 mb-4">
        <ResponsiveGrid 
          contentType="dashboard" 
          className={cn(gap.sm)}
          minItemWidth={120}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </ResponsiveGrid>
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <div className="px-4 text-center text-red-500 text-sm">
        Error loading stats
      </div>
    );
  }

  // Calculate stats
  const totalVolume = recentWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
  const totalRPE = recentWorkouts.reduce((sum, w) => sum + (w.rpe || 0), 0);
  const averageRPE = recentWorkouts.length > 0 ? (totalRPE / recentWorkouts.length) : 0;
  const consistency = recentWorkouts.length >= 3 ? 'Good' : 'Needs Work';

  const stats = [
    {
      id: 'totalVolume',
      label: 'Total Volume',
      value: `${totalVolume.toLocaleString()} lbs`,
      shortValue: `${Math.round(totalVolume / 1000)}k`,
      icon: Flame,
      color: 'text-red-500',
    },
    {
      id: 'averageRPE',
      label: 'Average RPE',
      value: averageRPE.toFixed(1),
      shortValue: averageRPE.toFixed(1),
      icon: TrendingUp,
      color: 'text-blue-500',
    },
    {
      id: 'consistency',
      label: 'Consistency',
      value: consistency,
      shortValue: consistency === 'Good' ? '✓' : '!',
      icon: RefreshCcw,
      color: consistency === 'Good' ? 'text-green-500' : 'text-yellow-500',
    },
  ];

  // Show only first 2 stats in split-screen mode
  const displayStats = columns === 2 ? stats.slice(0, 2) : stats;

  return (
    <ResponsiveContainer className="px-4 mb-4">
      <ResponsiveGrid 
        contentType="dashboard" 
        className={cn(gap.sm)}
        minItemWidth={120}
      >
        {displayStats.map((stat) => (
          <ResponsiveCard 
            key={stat.id} 
            className="flex flex-col items-center justify-center text-center"
            padding="sm"
          >
            <stat.icon className={cn(iconSize, 'mb-1', stat.color)} />
            {showLabels && (
              <ResponsiveText 
                variant="tiny" 
                className="text-gray-500 mb-1"
                as="p"
              >
                {stat.label}
              </ResponsiveText>
            )}
            <ResponsiveText 
              variant={showLabels ? "small" : "body"} 
              className="font-semibold text-gray-900"
              as="p"
            >
              {showLabels ? stat.value : stat.shortValue}
            </ResponsiveText>
          </ResponsiveCard>
        ))}
      </ResponsiveGrid>
    </ResponsiveContainer>
  );
}