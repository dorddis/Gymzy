import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingData } from '@/app/onboarding/page';

interface FitnessBackgroundStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const COMMON_INJURIES = [
  'Lower back pain',
  'Knee injury',
  'Shoulder injury',
  'Ankle injury',
  'Wrist/elbow pain',
  'Hip injury',
  'Neck pain',
  'Previous surgery'
];

const ACTIVITY_LEVELS = [
  'Sedentary (little to no exercise)',
  'Lightly active (light exercise 1-3 days/week)',
  'Moderately active (moderate exercise 3-5 days/week)',
  'Very active (hard exercise 6-7 days/week)',
  'Extremely active (very hard exercise, physical job)'
];

export function FitnessBackgroundStep({ data, updateData, onNext, onPrev }: FitnessBackgroundStepProps) {
  const handleInjuryChange = (injury: string, checked: boolean) => {
    if (checked) {
      updateData({ previousInjuries: [...data.previousInjuries, injury] });
    } else {
      updateData({ previousInjuries: data.previousInjuries.filter(i => i !== injury) });
    }
  };

  const canProceed = data.currentActivity.length > 0;

  return (
    <div className="space-y-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Tell us about your fitness background</CardTitle>
        <CardDescription>
          This helps us understand your starting point and any considerations we should keep in mind
        </CardDescription>
      </CardHeader>

      <div className="space-y-6">
        {/* Experience Level */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            How would you rate your fitness experience? ({data.experienceLevel}/10)
          </Label>
          <div className="px-3">
            <Slider
              value={[data.experienceLevel]}
              onValueChange={(value) => updateData({ experienceLevel: value[0] })}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Complete Beginner</span>
              <span>Fitness Expert</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.experienceLevel <= 3 && "Perfect! We'll start with the basics and build from there."}
            {data.experienceLevel > 3 && data.experienceLevel <= 7 && "Great! You have some experience to build upon."}
            {data.experienceLevel > 7 && "Excellent! We'll help you optimize your advanced training."}
          </p>
        </div>

        {/* Current Activity Level */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">What best describes your current activity level?</Label>
          <p className="text-sm text-muted-foreground">
            Be honest - this helps us start you at the right level and progress safely.
          </p>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={level}
                  name="activityLevel"
                  value={level}
                  checked={data.currentActivity === level}
                  onChange={(e) => updateData({ currentActivity: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor={level} className="text-sm cursor-pointer">
                  {level}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Previous Injuries */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Do you have any previous injuries or physical limitations?
          </Label>
          <p className="text-sm text-muted-foreground">
            Select all that apply. This helps us recommend safe exercises and modifications.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMMON_INJURIES.map((injury) => (
              <div key={injury} className="flex items-center space-x-2">
                <Checkbox
                  id={injury}
                  checked={data.previousInjuries.includes(injury)}
                  onCheckedChange={(checked) => handleInjuryChange(injury, checked as boolean)}
                />
                <Label htmlFor={injury} className="text-sm cursor-pointer">
                  {injury}
                </Label>
              </div>
            ))}
          </div>
          
          {/* Custom injury input */}
          <div className="space-y-2">
            <Label htmlFor="customInjury" className="text-sm">
              Other (please specify):
            </Label>
            <Input
              id="customInjury"
              placeholder="e.g., Chronic condition, specific injury..."
              onBlur={(e) => {
                if (e.target.value && !data.previousInjuries.includes(e.target.value)) {
                  updateData({ previousInjuries: [...data.previousInjuries, e.target.value] });
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>

        {/* Selected injuries display */}
        {data.previousInjuries.length > 0 && (
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-orange-800 mb-2">
              We'll keep these in mind when creating your program:
            </p>
            <div className="flex flex-wrap gap-2">
              {data.previousInjuries.map((injury) => (
                <span
                  key={injury}
                  className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                >
                  {injury}
                  <button
                    onClick={() => handleInjuryChange(injury, false)}
                    className="ml-1 text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              ))}
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
