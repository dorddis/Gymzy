import React from 'react';
import { Card } from '@/components/ui/card';
import { useWorkout } from '@/contexts/WorkoutContext';
import { Dumbbell, Clock, TrendingUp, Activity } from 'lucide-react';

export function RecentWorkoutsCarousel() {
  const { recentWorkouts, loading, error } = useWorkout();

  if (loading) {
    return (
      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Recent Workouts</h2>
        </div>
        <div className="text-center text-gray-500">Loading workouts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Recent Workouts</h2>
        </div>
        <div className="text-center text-red-500">Error loading workouts</div>
      </div>
    );
  }

  if (recentWorkouts.length === 0) {
    return (
      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Recent Workouts</h2>
        </div>
        <div className="text-center text-gray-500">No workouts yet</div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Recent Workouts</h2>
        <span className="text-secondary text-sm cursor-pointer">View All</span>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4">
        {recentWorkouts.map((workout) => (
          <Card key={workout.id} className="min-w-[280px] bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center mb-3">
              <Dumbbell className="text-secondary mr-2" />
              <div>
                <h3 className="font-medium text-gray-900">{workout.title}</h3>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {workout.date.toDate().toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-3">
              {workout.exercises.map((exercise, index) => (
                <div key={index} className="text-sm">
                  <p className="font-medium text-gray-900">{exercise.name}</p>
                  <p className="text-gray-500">
                    {exercise.sets.length > 0 ? (
                      `${"" + exercise.sets.length} × ${exercise.sets[0].reps} ${
                        exercise.sets[0].weight > 0 ? `@ ${exercise.sets[0].weight}lbs` : ""
                      }`
                    ) : (
                      "No sets recorded"
                    )}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center text-gray-500">
                <TrendingUp className="w-4 h-4 mr-1" />
                {(workout.totalVolume ?? 0).toLocaleString()} lbs
              </div>
              <div className="flex items-center text-gray-500">
                <Activity className="w-4 h-4 mr-1" />
                RPE {workout.rpe}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 