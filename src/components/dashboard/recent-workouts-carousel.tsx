import React from 'react';
import { useWorkout } from '@/contexts/WorkoutContext';
import { Card } from '@/components/ui/card';

export function RecentWorkoutsCarousel() {
  const { loggedWorkouts, getExerciseById } = useWorkout();
  // Sort workouts by date descending
  const sorted = [...loggedWorkouts].sort((a, b) => (b.date as any) - (a.date as any));
  // Take the most recent 3 workouts for the carousel
  const recent = sorted.slice(0, 3);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center px-4 mb-2">
        <h2 className="text-lg font-semibold">Recent Workouts</h2>
        <span className="text-secondary text-sm cursor-pointer">See All</span>
      </div>
      <div className="overflow-x-auto px-4 flex space-x-3 pb-2">
        {recent.length === 0 && (
          <div className="text-gray-400 text-center w-full">No recent workouts</div>
        )}
        {recent.map((w) => {
          const exercise = getExerciseById(w.exerciseId);
          return (
            <Card key={w.id} className="bg-white rounded-xl shadow-sm p-3 min-w-[200px] flex-shrink-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{exercise ? exercise.name : 'Workout'}</h3>
                  <p className="text-xs text-gray-500">{w.date ? new Date(w.date).toLocaleDateString() : ''}</p>
                </div>
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">High</span>
              </div>
              <div className="text-xs text-gray-600">
                <p>{w.sets || 0} sets • {w.reps || 0} reps</p>
                <p>{exercise && exercise.primaryMuscles ? exercise.primaryMuscles.join(', ') : ''}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 