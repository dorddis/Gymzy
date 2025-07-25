"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dumbbell, 
  Clock, 
  Zap, 
  Target, 
  Play,
  Heart,
  Flame,
  Activity,
  ChevronLeft,
  Search,
  Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useAuth } from '@/contexts/AuthContext';
import { EXERCISES } from '@/lib/constants';
import { getRecentWorkouts } from '@/services/core/workout-service';

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'full_body';
  exercises: Array<{
    exerciseId: string;
    sets: number;
    reps: string;
    restTime?: number;
  }>;
  targetMuscles: string[];
  equipment: string[];
  calories: number;
  icon: React.ComponentType<any>;
  color: string;
}

const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'quick_push',
    name: 'Quick Push Day',
    description: 'Upper body push muscles - chest, shoulders, triceps',
    duration: 30,
    difficulty: 'intermediate',
    type: 'strength',
    exercises: [
      { exerciseId: 'push-ups', sets: 3, reps: '8-12' },
      { exerciseId: 'overhead-press', sets: 3, reps: '8-10', restTime: 90 },
      { exerciseId: 'dips', sets: 3, reps: '6-10' },
      { exerciseId: 'lateral-raises', sets: 3, reps: '12-15' }
    ],
    targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
    equipment: ['Dumbbells', 'Dip Station'],
    calories: 250,
    icon: Dumbbell,
    color: 'bg-blue-400'
  },
  {
    id: 'hiit_cardio',
    name: 'HIIT Blast',
    description: 'High-intensity interval training for fat burning',
    duration: 20,
    difficulty: 'advanced',
    type: 'hiit',
    exercises: [
      { exerciseId: 'burpees', sets: 4, reps: '30s on, 30s off' },
      { exerciseId: 'mountain-climbers', sets: 4, reps: '30s on, 30s off' },
      { exerciseId: 'jump-squats', sets: 4, reps: '30s on, 30s off' },
      { exerciseId: 'high-knees', sets: 4, reps: '30s on, 30s off' }
    ],
    targetMuscles: ['Full Body', 'Cardio'],
    equipment: ['Bodyweight'],
    calories: 300,
    icon: Flame,
    color: 'bg-red-400'
  },
  {
    id: 'leg_power',
    name: 'Leg Power',
    description: 'Build strong legs and glutes',
    duration: 45,
    difficulty: 'intermediate',
    type: 'strength',
    exercises: [
      { exerciseId: 'squat', sets: 4, reps: '8-12', restTime: 120 },
      { exerciseId: 'romanian-deadlift', sets: 3, reps: '10-12' },
      { exerciseId: 'bulgarian-split-squat', sets: 3, reps: '8-10 each leg' },
      { exerciseId: 'calf-raises', sets: 3, reps: '15-20' }
    ],
    targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
    equipment: ['Barbell', 'Dumbbells'],
    calories: 350,
    icon: Target,
    color: 'bg-green-400'
  },
  {
    id: 'core_blast',
    name: 'Core Blast',
    description: 'Strengthen your core and improve stability',
    duration: 15,
    difficulty: 'beginner',
    type: 'strength',
    exercises: [
      { exerciseId: 'plank', sets: 3, reps: '30-60s' },
      { exerciseId: 'russian-twists', sets: 3, reps: '20-30' },
      { exerciseId: 'dead-bug', sets: 3, reps: '10 each side' },
      { exerciseId: 'bicycle-crunches', sets: 3, reps: '20-30' }
    ],
    targetMuscles: ['Core', 'Abs', 'Obliques'],
    equipment: ['Bodyweight'],
    calories: 120,
    icon: Activity,
    color: 'bg-purple-500'
  },
  {
    id: 'full_body_quick',
    name: 'Full Body Express',
    description: 'Complete workout hitting all major muscle groups',
    duration: 35,
    difficulty: 'intermediate',
    type: 'full_body',
    exercises: [
      { exerciseId: 'deadlift', sets: 3, reps: '6-8', restTime: 120 },
      { exerciseId: 'push-ups', sets: 3, reps: '8-12' },
      { exerciseId: 'squat', sets: 3, reps: '10-15' },
      { exerciseId: 'pull-up', sets: 3, reps: '5-10' },
      { exerciseId: 'plank', sets: 2, reps: '45-60s' }
    ],
    targetMuscles: ['Full Body'],
    equipment: ['Barbell', 'Pull-up Bar'],
    calories: 400,
    icon: Zap,
    color: 'bg-orange-400'
  },
  {
    id: 'upper_body_strength',
    name: 'Upper Body Strength',
    description: 'Build upper body muscle and strength',
    duration: 50,
    difficulty: 'intermediate',
    type: 'strength',
    exercises: [
      { exerciseId: 'bench-press', sets: 4, reps: '6-8', restTime: 120 },
      { exerciseId: 'pull-up', sets: 3, reps: '8-12' },
      { exerciseId: 'overhead-press', sets: 3, reps: '8-10' },
      { exerciseId: 'barbell-rows', sets: 3, reps: '8-12' },
      { exerciseId: 'dips', sets: 3, reps: '10-15' }
    ],
    targetMuscles: ['Chest', 'Back', 'Shoulders', 'Arms'],
    equipment: ['Barbell', 'Pull-up Bar', 'Dip Station'],
    calories: 380,
    icon: Dumbbell,
    color: 'bg-blue-500'
  }
];

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setCurrentWorkoutExercises } = useWorkout();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Function to get default values from previous workouts
  const getDefaultValues = async (exerciseName: string) => {
    if (!user?.uid) return { weight: 0, reps: 8 };

    try {
      const recentWorkouts = await getRecentWorkouts(user.uid, 5);

      for (const workout of recentWorkouts) {
        const exercise = workout.exercises?.find(ex => ex.name === exerciseName);
        if (exercise && exercise.sets && exercise.sets.length > 0) {
          const lastExecutedSet = exercise.sets
            .filter(set => set.isExecuted && set.weight > 0 && set.reps > 0)
            .pop();

          if (lastExecutedSet) {
            return {
              weight: lastExecutedSet.weight,
              reps: lastExecutedSet.reps
            };
          }
        }
      }
    } catch (error) {
      console.error('Error fetching previous workout data:', error);
    }

    return { weight: 0, reps: 8 };
  };

  const getDifficultyColor = (difficulty: WorkoutTemplate['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: WorkoutTemplate['type']) => {
    switch (type) {
      case 'strength':
        return <Dumbbell className="h-3 w-3" />;
      case 'cardio':
        return <Heart className="h-3 w-3" />;
      case 'hiit':
        return <Flame className="h-3 w-3" />;
      case 'flexibility':
        return <Activity className="h-3 w-3" />;
      case 'full_body':
        return <Target className="h-3 w-3" />;
      default:
        return <Dumbbell className="h-3 w-3" />;
    }
  };

  const startWorkout = async (template: WorkoutTemplate) => {
    const workoutExercises = await Promise.all(
      template.exercises.map(async (templateExercise, index) => {
        const exerciseData = EXERCISES.find(ex => ex.id === templateExercise.exerciseId);

        if (!exerciseData) {
          console.warn(`Exercise with id ${templateExercise.exerciseId} not found in EXERCISES`);
          return null;
        }

        const defaultValues = await getDefaultValues(exerciseData.name);

        return {
          id: `template_${template.id}_${index}`,
          name: exerciseData.name,
          sets: Array.from({ length: templateExercise.sets }, () => ({
            weight: defaultValues.weight,
            reps: defaultValues.reps,
            rpe: 8,
            isWarmup: false,
            isExecuted: false
          })),
          muscleGroups: exerciseData.primaryMuscles,
          equipment: 'Bodyweight',
          primaryMuscles: exerciseData.primaryMuscles,
          secondaryMuscles: exerciseData.secondaryMuscles || []
        };
      })
    );

    const validExercises = workoutExercises.filter(Boolean);

    if (validExercises.length === 0) {
      console.error('No valid exercises found for template:', template.id);
      return;
    }

    setCurrentWorkoutExercises(validExercises);
    router.push('/workout');
  };

  // Filter templates based on search and filters
  const filteredTemplates = WORKOUT_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.targetMuscles.some(muscle => muscle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    const matchesType = selectedType === 'all' || template.type === selectedType;

    return matchesSearch && matchesDifficulty && matchesType;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Workout Templates</h1>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('all')}
          >
            All Levels
          </Button>
          <Button
            variant={selectedDifficulty === 'beginner' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('beginner')}
          >
            Beginner
          </Button>
          <Button
            variant={selectedDifficulty === 'intermediate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('intermediate')}
          >
            Intermediate
          </Button>
          <Button
            variant={selectedDifficulty === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('advanced')}
          >
            Advanced
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('all')}
          >
            All Types
          </Button>
          <Button
            variant={selectedType === 'strength' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('strength')}
          >
            Strength
          </Button>
          <Button
            variant={selectedType === 'cardio' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('cardio')}
          >
            Cardio
          </Button>
          <Button
            variant={selectedType === 'hiit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('hiit')}
          >
            HIIT
          </Button>
          <Button
            variant={selectedType === 'full_body' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('full_body')}
          >
            Full Body
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="px-4 pb-6">
        <div className="grid gap-4">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            
            return (
              <Card key={template.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${template.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {template.duration}m
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Flame className="h-3 w-3 mr-1" />
                      {template.calories} cal
                    </Badge>
                    <Badge className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getTypeIcon(template.type)}
                      <span className="ml-1 capitalize">{template.type}</span>
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Exercises:</h4>
                    <div className="space-y-1">
                      {template.exercises.slice(0, 3).map((templateExercise, index) => {
                        const exerciseData = EXERCISES.find(ex => ex.id === templateExercise.exerciseId);
                        return (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">
                              {exerciseData?.name || templateExercise.exerciseId}
                            </span>
                            <span className="text-gray-500">{templateExercise.sets} × {templateExercise.reps}</span>
                          </div>
                        );
                      })}
                      {template.exercises.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{template.exercises.length - 3} more exercises
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => startWorkout(template)}
                    className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:opacity-95 flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Workout
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No templates found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
