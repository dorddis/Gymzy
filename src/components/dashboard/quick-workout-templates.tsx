"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, 
  Clock, 
  Zap, 
  Target, 
  Play,
  Heart,
  Flame,
  Activity,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWorkout } from '@/contexts/WorkoutContext';

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'full_body';
  exercises: Array<{
    name: string;
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
      { name: 'Push-ups', sets: 3, reps: '8-12' },
      { name: 'Overhead Press', sets: 3, reps: '8-10', restTime: 90 },
      { name: 'Dips', sets: 3, reps: '6-10' },
      { name: 'Lateral Raises', sets: 3, reps: '12-15' }
    ],
    targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
    equipment: ['Dumbbells', 'Dip Station'],
    calories: 250,
    icon: Dumbbell,
    color: 'bg-blue-500'
  },
  {
    id: 'hiit_cardio',
    name: 'HIIT Blast',
    description: 'High-intensity interval training for fat burning',
    duration: 20,
    difficulty: 'advanced',
    type: 'hiit',
    exercises: [
      { name: 'Burpees', sets: 4, reps: '30s on, 30s off' },
      { name: 'Mountain Climbers', sets: 4, reps: '30s on, 30s off' },
      { name: 'Jump Squats', sets: 4, reps: '30s on, 30s off' },
      { name: 'High Knees', sets: 4, reps: '30s on, 30s off' }
    ],
    targetMuscles: ['Full Body', 'Cardio'],
    equipment: ['Bodyweight'],
    calories: 300,
    icon: Flame,
    color: 'bg-red-500'
  },
  {
    id: 'leg_power',
    name: 'Leg Power',
    description: 'Build strong legs and glutes',
    duration: 45,
    difficulty: 'intermediate',
    type: 'strength',
    exercises: [
      { name: 'Squats', sets: 4, reps: '8-12', restTime: 120 },
      { name: 'Romanian Deadlifts', sets: 3, reps: '10-12' },
      { name: 'Bulgarian Split Squats', sets: 3, reps: '8-10 each leg' },
      { name: 'Calf Raises', sets: 3, reps: '15-20' }
    ],
    targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
    equipment: ['Barbell', 'Dumbbells'],
    calories: 350,
    icon: Target,
    color: 'bg-green-500'
  },
  {
    id: 'core_blast',
    name: 'Core Blast',
    description: 'Strengthen your core and improve stability',
    duration: 15,
    difficulty: 'beginner',
    type: 'strength',
    exercises: [
      { name: 'Plank', sets: 3, reps: '30-60s' },
      { name: 'Russian Twists', sets: 3, reps: '20-30' },
      { name: 'Dead Bug', sets: 3, reps: '10 each side' },
      { name: 'Bicycle Crunches', sets: 3, reps: '20-30' }
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
      { name: 'Deadlifts', sets: 3, reps: '6-8', restTime: 120 },
      { name: 'Push-ups', sets: 3, reps: '8-12' },
      { name: 'Squats', sets: 3, reps: '10-15' },
      { name: 'Pull-ups', sets: 3, reps: '5-10' },
      { name: 'Plank', sets: 2, reps: '45-60s' }
    ],
    targetMuscles: ['Full Body'],
    equipment: ['Barbell', 'Pull-up Bar'],
    calories: 400,
    icon: Zap,
    color: 'bg-orange-500'
  }
];

export function QuickWorkoutTemplates() {
  const router = useRouter();
  const { setCurrentWorkoutExercises } = useWorkout();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

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

  const startWorkout = (template: WorkoutTemplate) => {
    // Convert template exercises to workout format
    const workoutExercises = template.exercises.map((exercise, index) => ({
      id: `template_${template.id}_${index}`,
      name: exercise.name,
      sets: Array.from({ length: exercise.sets }, () => ({
        weight: 0,
        reps: 0,
        rpe: 8,
        isWarmup: false,
        isExecuted: false
      })),
      muscleGroups: template.targetMuscles,
      equipment: template.equipment[0] || 'Bodyweight'
    }));

    setCurrentWorkoutExercises(workoutExercises);
    router.push('/workout');
  };

  const viewTemplate = (template: WorkoutTemplate) => {
    setSelectedTemplate(selectedTemplate === template.id ? null : template.id);
  };

  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Quick Start Workouts</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/templates')}
          className="text-secondary hover:text-secondary/80 text-sm p-0 h-auto font-medium"
        >
          View All
        </Button>
      </div>

      <div className="space-y-3">
        {WORKOUT_TEMPLATES.slice(0, 3).map((template) => {
          const Icon = template.icon;
          const isExpanded = selectedTemplate === template.id;
          
          return (
            <Card key={template.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${template.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-xs text-gray-600">{template.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewTemplate(template)}
                    className="p-1 h-auto"
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-3">
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

                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-medium text-gray-700">Exercises:</h4>
                      {template.exercises.map((exercise, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{exercise.name}</span>
                          <span className="text-gray-500">{exercise.sets} × {exercise.reps}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Target Muscles:</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.targetMuscles.map((muscle, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Equipment:</h4>
                      <div className="flex flex-wrap gap-1">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/templates')}
          className="w-full"
        >
          Browse All Templates
        </Button>
      </div>
    </div>
  );
}
