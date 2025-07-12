import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingData } from '@/app/onboarding/page';
import { Dumbbell, Home, Users, Bike, Waves, Mountain } from 'lucide-react';

interface PreferencesStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const WORKOUT_TYPES = [
  { id: 'strength_training', label: 'Strength Training', icon: Dumbbell, description: 'Weight lifting, resistance exercises' },
  { id: 'cardio', label: 'Cardio', icon: Bike, description: 'Running, cycling, HIIT' },
  { id: 'yoga', label: 'Yoga', icon: Mountain, description: 'Flexibility, mindfulness, balance' },
  { id: 'swimming', label: 'Swimming', icon: Waves, description: 'Pool workouts, water aerobics' },
  { id: 'group_fitness', label: 'Group Fitness', icon: Users, description: 'Classes, team workouts' },
  { id: 'home_workouts', label: 'Home Workouts', icon: Home, description: 'Bodyweight, minimal equipment' }
];

const EQUIPMENT_OPTIONS = [
  'No equipment (bodyweight)',
  'Dumbbells',
  'Resistance bands',
  'Kettlebells',
  'Barbell',
  'Pull-up bar',
  'Yoga mat',
  'Cardio machine',
  'Full gym access',
  'Suspension trainer (TRX)',
  'Medicine ball',
  'Foam roller'
];

export function PreferencesStep({ data, updateData, onNext, onPrev }: PreferencesStepProps) {
  const handleWorkoutTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      updateData({ workoutTypes: [...data.workoutTypes, type] });
    } else {
      updateData({ workoutTypes: data.workoutTypes.filter(t => t !== type) });
    }
  };

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    if (checked) {
      updateData({ equipmentAccess: [...data.equipmentAccess, equipment] });
    } else {
      updateData({ equipmentAccess: data.equipmentAccess.filter(e => e !== equipment) });
    }
  };

  const canProceed = data.workoutTypes.length > 0 && data.equipmentAccess.length > 0;

  return (
    <div className="space-y-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">What are your workout preferences?</CardTitle>
        <CardDescription>
          Tell us about your preferred workout styles and available equipment
        </CardDescription>
      </CardHeader>

      <div className="space-y-6">
        {/* Workout Types */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            What types of workouts do you enjoy or want to try? (Select all that apply)
          </Label>
          <p className="text-sm text-muted-foreground">
            Don&apos;t worry if you&apos;re new to some of these - your AI coach will help you get started safely.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {WORKOUT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = data.workoutTypes.includes(type.id);
              return (
                <div
                  key={type.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleWorkoutTypeChange(type.id, !isSelected)}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`h-6 w-6 mt-1 ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
                    <div>
                      <h3 className="font-medium">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Availability */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            How much time can you dedicate per workout? ({data.timeAvailability} minutes)
          </Label>
          <div className="px-3">
            <Slider
              value={[data.timeAvailability]}
              onValueChange={(value) => updateData({ timeAvailability: value[0] })}
              max={120}
              min={15}
              step={15}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>15 min</span>
              <span>60 min</span>
              <span>120 min</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.timeAvailability <= 30 && "Perfect for quick, efficient workouts!"}
            {data.timeAvailability > 30 && data.timeAvailability <= 60 && "Great for comprehensive training sessions."}
            {data.timeAvailability > 60 && "Excellent for detailed, thorough workouts."}
          </p>
        </div>

        {/* Workout Frequency */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            How many times per week do you want to work out? ({data.workoutFrequency} times)
          </Label>
          <div className="px-3">
            <Slider
              value={[data.workoutFrequency]}
              onValueChange={(value) => updateData({ workoutFrequency: value[0] })}
              max={7}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1x/week</span>
              <span>4x/week</span>
              <span>7x/week</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.workoutFrequency <= 2 && "A great start! We&apos;ll make each session count."}
            {data.workoutFrequency > 2 && data.workoutFrequency <= 4 && "Excellent frequency for steady progress."}
            {data.workoutFrequency > 4 && "High commitment! We&apos;ll ensure proper recovery."}
          </p>
        </div>

        {/* Equipment Access */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            What equipment do you have access to? (Select all that apply)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EQUIPMENT_OPTIONS.map((equipment) => (
              <div key={equipment} className="flex items-center space-x-2">
                <Checkbox
                  id={equipment}
                  checked={data.equipmentAccess.includes(equipment)}
                  onCheckedChange={(checked) => handleEquipmentChange(equipment, checked as boolean)}
                />
                <Label htmlFor={equipment} className="text-sm cursor-pointer">
                  {equipment}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences Summary */}
        {data.workoutTypes.length > 0 && (
          <div className="bg-secondary/10 p-4 rounded-lg">
            <h4 className="font-semibold text-secondary mb-2">Your Workout Preferences</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Preferred Workouts:</strong> {data.workoutTypes.map(type => 
                WORKOUT_TYPES.find(t => t.id === type)?.label
              ).join(', ')}</p>
              <p><strong>Time per Session:</strong> {data.timeAvailability} minutes</p>
              <p><strong>Frequency:</strong> {data.workoutFrequency} times per week</p>
              <p><strong>Total Weekly Time:</strong> {data.timeAvailability * data.workoutFrequency} minutes</p>
              {data.equipmentAccess.length > 0 && (
                <p><strong>Available Equipment:</strong> {data.equipmentAccess.slice(0, 3).join(', ')}
                  {data.equipmentAccess.length > 3 && ` +${data.equipmentAccess.length - 3} more`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Continue
        </Button>
      </div>
    </div>
  );
}
