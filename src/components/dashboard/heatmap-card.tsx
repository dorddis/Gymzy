import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MuscleActivationSVG } from '@/components/workout/muscle-activation-svg';
import { Muscle } from '@/lib/constants';

interface HeatmapCardProps {
  title?: string;
  muscleVolumes: Record<Muscle, number | undefined>;
  className?: string;
  height?: string;
  scale?: number;
}

export function HeatmapCard({ 
  title = "Muscle Activation", 
  muscleVolumes, 
  className = "",
  height = "350px",
  scale = 1.3 // Adjusted scale for dashboard
}: HeatmapCardProps) {
  return (
    <Card className={`bg-white rounded-xl shadow-md p-4 ${className}`}>
      {title && (
        <div className="absolute top-2 left-4 z-10 pointer-events-none">
          <h2 className="text-lg font-semibold text-gray-800 drop-shadow-sm bg-white/80 px-2 rounded">
            {title}
          </h2>
        </div>
      )}

      <CardContent className="bg-white rounded-lg w-full flex items-center justify-center overflow-hidden" style={{ height }}>
        <div className="w-full h-full flex items-center justify-center">
          <MuscleActivationSVG 
            muscleVolumes={muscleVolumes} 
            className="w-full h-full" 
            scale={scale}
          />
        </div>
      </CardContent>

      <div className="flex items-center justify-between px-2 mt-2">
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
    </Card>
  );
} 