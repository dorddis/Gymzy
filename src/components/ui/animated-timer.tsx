import React from 'react';

interface AnimatedTimerProps {
  totalTime: number;
  timeRemaining: number;
  isRestTimerRunning: boolean;
}

export function AnimatedTimer({ totalTime, timeRemaining, isRestTimerRunning }: AnimatedTimerProps) {
  const percentage = (timeRemaining / totalTime) * 100;
  const formattedTime = `${Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:${(timeRemaining % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative w-full h-12 bg-gray-200 rounded-xl overflow-hidden flex items-center">
      <div
        className={`absolute top-0 left-0 h-full ${isRestTimerRunning ? 'bg-blue-200' : 'bg-blue-100'} transition-all duration-1000 ease-linear`}
        style={{ width: `${percentage}%` }}
      ></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-800">
          Rest \ {formattedTime}
        </span>
      </div>
    </div>
  );
} 