"use client";

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dumbbell,
  Clock,
  Zap,
  Target,
  Play,
  Heart,
  Flame,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useAuth } from '@/contexts/AuthContext';
import { EXERCISES } from '@/lib/constants';
import { getRecentWorkouts } from '@/services/core/workout-service';
import { 
  ResponsiveContainer, 
  ResponsiveCard, 
  ResponsiveText, 
  useResponsiveValue, 
  useResponsiveSpacing 
} from '@/components/layout/responsive-container';
import { cn } from '@/lib/utils';

// Reuse the same workout template interface and data
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
];

export function ResponsiveWorkoutTemplates() {
  const router = useRouter();
  const { user } = useAuth();
  const { setCurrentWorkoutExercises } = useWorkout();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { spacing, gap } = useResponsiveSpacing();

  // Responsive configuration
  const maxTemplates = useResponsiveValue({
    mobile: 3,
    tablet: 3,
    desktop: 3,
    splitScreen: 2, // Show fewer templates in split-screen
  });

  const showDescription = useResponsiveValue({
    mobile: true,
    tablet: true,
    desktop: true,
    splitScreen: false, // Hide descriptions in compact mode
  });

  const showAllBadges = useResponsiveValue({
    mobile: true,
    tablet: true,
    desktop: true,
    splitScreen: false, // Show fewer badges in compact mode
  });

  const iconSize = useResponsiveValue({
    mobile: 'h-4 w-4',
    tablet: 'h-4 w-4',
    desktop: 'h-4 w-4',
    splitScreen: 'h-3 w-3',
  });

  const badgeSize = useResponsiveValue({
    mobile: 'text-xs',
    tablet: 'text-xs',
    desktop: 'text-xs',
    splitScreen: 'text-xs px-1 py-0.5',
  });

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
    const iconClass = showAllBadges ? 'h-3 w-3' : 'h-2 w-2';
    switch (type) {
      case 'strength':
        return <Dumbbell className={iconClass} />;
      case 'cardio':
        return <Heart className={iconClass} />;
      case 'hiit':
        return <Flame className={iconClass} />;
      case 'flexibility':
        return <Activity className={iconClass} />;
      case 'full_body':
        return <Target className={iconClass} />;
      default:
        return <Dumbbell className={iconClass} />;
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

  const viewTemplate = (template: WorkoutTemplate) => {
    setSelectedTemplate(selectedTemplate === template.id ? null : template.id);
  };

  return (
    <ResponsiveContainer className="px-4">
      <div className="flex justify-between items-center mb-4">
        <ResponsiveText variant="heading3" className="font-semibold" as="h2">
          Quick Start Workouts
        </ResponsiveText>
        <Button
          size="sm"
          onClick={() => router.push('/templates')}
          className="bg-secondary text-white hover:bg-secondary/90 text-sm px-2 py-1 h-auto font-medium rounded-md"
        >
          View All
        </Button>
      </div>

      <div className={cn(spacing.sm)}>
        {WORKOUT_TEMPLATES.slice(0, maxTemplates).map((template) => {
          const Icon = template.icon;
          const isExpanded = selectedTemplate === template.id;
          
          return (
            <ResponsiveCard 
              key={template.id} 
              className="hover:shadow-md transition-all"
              padding="sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg text-white', template.color)}>
                    <Icon className={iconSize} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <ResponsiveText 
                      variant="small" 
                      className="font-medium text-gray-900"
                      as="h3"
                    >
                      {template.name}
                    </ResponsiveText>
                    {showDescription && (
                      <ResponsiveText 
                        variant="tiny" 
                        className="text-gray-600"
                        as="p"
                      >
                        {template.description}
                      </ResponsiveText>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => viewTemplate(template)}
                  className="p-1 h-auto text-secondary hover:text-secondary/80 hover:bg-transparent flex-shrink-0"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              <div className={cn('flex items-center flex-wrap mb-3', gap.xs)}>
                <Badge variant="outline" className={badgeSize}>
                  <Clock className="h-3 w-3 mr-1" />
                  {template.duration}m
                </Badge>
                {showAllBadges && (
                  <>
                    <Badge variant="outline" className={badgeSize}>
                      <Flame className="h-3 w-3 mr-1" />
                      {template.calories} cal
                    </Badge>
                    <Badge className={cn(badgeSize, getDifficultyColor(template.difficulty))}>
                      {template.difficulty}
                    </Badge>
                  </>
                )}
                <Badge variant="outline" className={badgeSize}>
                  {getTypeIcon(template.type)}
                  <span className="ml-1 capitalize">{template.type}</span>
                </Badge>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="space-y-2 mb-4">
                    <ResponsiveText variant="small" className="font-medium text-gray-700" as="h4">
                      Exercises:
                    </ResponsiveText>
                    {template.exercises.map((templateExercise, index) => {
                      const exerciseData = EXERCISES.find(ex => ex.id === templateExercise.exerciseId);
                      return (
                        <div key={index} className="flex justify-between items-center">
                          <ResponsiveText variant="tiny" className="text-gray-600">
                            {exerciseData?.name || templateExercise.exerciseId}
                          </ResponsiveText>
                          <ResponsiveText variant="tiny" className="text-gray-500">
                            {templateExercise.sets} × {templateExercise.reps}
                          </ResponsiveText>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mb-4">
                    <ResponsiveText variant="small" className="font-medium text-gray-700 mb-2" as="h4">
                      Target Muscles:
                    </ResponsiveText>
                    <div className={cn('flex flex-wrap', gap.xs)}>
                      {template.targetMuscles.map((muscle, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <ResponsiveText variant="small" className="font-medium text-gray-700 mb-2" as="h4">
                      Equipment:
                    </ResponsiveText>
                    <div className={cn('flex flex-wrap', gap.xs)}>
                      {template.equipment.map((item, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={() => startWorkout(template)}
                className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:opacity-95 flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Workout
              </Button>
            </ResponsiveCard>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={() => router.push('/templates')}
          className="w-full py-3 text-green-600 border-green-400 hover:border-green-600 hover:bg-green-50 font-medium"
        >
          Browse All Templates
        </Button>
      </div>
    </ResponsiveContainer>
  );
}