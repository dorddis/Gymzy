"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MuscleActivationSVG } from '@/components/workout/muscle-activation-svg';
import { Muscle } from '@/lib/constants';
import { MuscleMapSkeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, ResponsiveCard, ResponsiveText, useResponsiveValue } from '@/components/layout/responsive-container';

interface ResponsiveHeatmapCardProps {
  title?: string;
  muscleVolumes: Record<Muscle, number | undefined>;
  className?: string;
  loading?: boolean;
}

export function ResponsiveHeatmapCard({
  title = "Weekly Muscle Activation",
  muscleVolumes,
  className = "",
  loading = false
}: ResponsiveHeatmapCardProps) {
  
  // Responsive configuration
  const height = useResponsiveValue({
    mobile: "350px",
    tablet: "350px", 
    desktop: "350px",
    splitScreen: "280px", // Reduced height for split-screen
  });

  const scale = useResponsiveValue({
    mobile: 1.3,
    tablet: 1.3,
    desktop: 1.3,
    splitScreen: 1.1, // Smaller scale for split-screen
  });

  const showTitle = useResponsiveValue({
    mobile: true,
    tablet: true,
    desktop: true,
    splitScreen: true,
  });

  const showLegend = useResponsiveValue({
    mobile: true,
    tablet: true,
    desktop: true,
    splitScreen: false, // Hide legend in compact mode
  });

  const titleVariant = useResponsiveValue({
    mobile: 'heading2' as const,
    tablet: 'heading2' as const,
    desktop: 'heading2' as const,
    splitScreen: 'heading3' as const,
  });

  return (
    <ResponsiveContainer className={className}>
      <ResponsiveCard className="flex flex-col gap-4">
        {showTitle && title && (
          <div className="px-2">
            <ResponsiveText 
              variant={titleVariant}
              className="font-semibold text-gray-800"
              as="h2"
            >
              {title}
            </ResponsiveText>
          </div>
        )}

        <CardContent 
          className="bg-white rounded-lg w-full flex items-center justify-center overflow-hidden" 
          style={{ height }}
        >
          <div className="w-full h-full flex items-center justify-center">
            {loading ? (
              <MuscleMapSkeleton />
            ) : (
              <MuscleActivationSVG
                muscleVolumes={muscleVolumes}
                className="w-full h-full"
                scale={scale}
              />
            )}
          </div>
        </CardContent>

        {showLegend && (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 rounded-sm mr-1" />
              <ResponsiveText variant="tiny" className="text-gray-700 font-medium">
                Low
              </ResponsiveText>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-300 rounded-sm mr-1" />
              <ResponsiveText variant="tiny" className="text-gray-700 font-medium">
                Medium
              </ResponsiveText>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-sm mr-1" />
              <ResponsiveText variant="tiny" className="text-gray-700 font-medium">
                High
              </ResponsiveText>
            </div>
          </div>
        )}
      </ResponsiveCard>
    </ResponsiveContainer>
  );
}