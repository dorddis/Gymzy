import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Workout } from '@/services/workout-service';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { workoutService } from '@/services/workout-service';

export default function LogWorkoutPage() {
  const { id } = useParams();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkout = async () => {
      if (typeof id !== 'string') {
        setError('Invalid workout ID');
        setLoading(false);
        return;
      }
      try {
        const fetchedWorkout = await workoutService.getWorkoutById(id);
        setWorkout(fetchedWorkout);
      } catch (err) {
        console.error("Failed to fetch workout:", err);
        setError('Failed to load workout details.');
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading workout...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error: {error}</div>;
  }

  if (!workout) {
    return <div className="flex items-center justify-center min-h-screen">Workout not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="flex items-center justify-between mb-6">
        <Link href="/" passHref>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Workout Details</h1>
        <div></div> {/* Placeholder for right-aligned items if any */}
      </header>

      <main className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-700">{workout.title}</h2>
          {workout.date && (
            <p className="text-sm text-gray-500">
              {format(workout.date.toDate(), 'PPPp')}
            </p>
          )}
        </div>

        {workout.notes && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold mb-2">Notes</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{workout.notes}</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold mb-3">Exercises</h3>
          <div className="space-y-4">
            {workout.exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h4 className="text-md font-semibold text-gray-800 mb-2">{exercise.name}</h4>
                <div className="space-y-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center text-gray-600 text-sm">
                      <span className="font-medium mr-2">Set {setIndex + 1}:</span>
                      <span>{set.weight} kg x {set.reps} reps</span>
                      {set.rpe !== undefined && set.rpe !== null && (
                        <span className="ml-2">(RPE: {set.rpe})</span>
                      )}
                      {set.isWarmup && (
                        <span className="ml-2 text-xs text-blue-500">(Warm-up)</span>
                      )}
                    </div>
                  ))}
                </div>
                {exercise.notes && (
                  <div className="mt-3 pt-2 border-t border-gray-200 text-sm text-gray-500">
                    <p className="font-medium">Exercise Notes:</p>
                    <p className="whitespace-pre-wrap">{exercise.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold">Total Volume: <span className="font-bold">{workout.totalVolume?.toLocaleString() || 0} kg</span></h3>
        </div>

        {workout.mediaUrls && workout.mediaUrls.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold mb-2">Media</h3>
            <div className="grid grid-cols-2 gap-4">
              {workout.mediaUrls.map((url, index) => (
                <img key={index} src={url} alt={`Workout media ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 text-sm text-gray-500">
          <p>Created: {workout.createdAt && format(workout.createdAt.toDate(), 'PPPp')}</p>
          <p>Last Updated: {workout.updatedAt && format(workout.updatedAt.toDate(), 'PPPp')}</p>
          <p>Status: {workout.isPublic ? 'Public' : 'Private'}</p>
        </div>
      </main>
    </div>
  );
} 