import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MuscleActivationSVG } from '@/components/workout/muscle-activation-svg';
import { Muscle } from '@/lib/constants';
import { MuscleMapSkeleton } from '@/components/ui/skeleton';

interface HeatmapCardProps {
  title?: string;
  muscleVolumes: Record<Muscle, number | undefined>;
  className?: string;
  height?: string;
  scale?: number;
  loading?: boolean;
}

export function HeatmapCard({
  title = "Weekly Muscle Activation",
  muscleVolumes,
  className = "",
  height = "350px",
  scale = 1.3, // Adjusted scale for dashboard
  loading = false
}: HeatmapCardProps) {
  return (
    <Card className={`bg-white rounded-xl shadow-md p-4 ${className}`}>
      <div className="flex flex-col gap-4">
        {title && (
          <div className="px-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {title}
            </h2>
          </div>
        )}

        <CardContent className="bg-white rounded-lg w-full flex items-center justify-center overflow-hidden" style={{ height }}>
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

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 rounded-sm mr-1" />
            <span className="text-xs text-gray-700 font-medium">Low</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-300 rounded-sm mr-1" />
            <span className="text-xs text-gray-700 font-medium">Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-sm mr-1" />
            <span className="text-xs text-gray-700 font-medium">High</span>
          </div>
        </div>
      </div>
    </Card>
  );
} 