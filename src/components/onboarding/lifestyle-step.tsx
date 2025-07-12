import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingData } from '@/app/onboarding/page';
import { Calendar, Clock, Brain, Moon } from 'lucide-react';

interface LifestyleStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const TIME_SLOTS = [
  'Early morning (5-7 AM)',
  'Morning (7-9 AM)',
  'Mid-morning (9-11 AM)',
  'Lunch time (11 AM-1 PM)',
  'Afternoon (1-4 PM)',
  'Early evening (4-6 PM)',
  'Evening (6-8 PM)',
  'Night (8-10 PM)',
  'Late night (10 PM+)'
];

export function LifestyleStep({ data, updateData, onNext, onPrev }: LifestyleStepProps) {
  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      updateData({ availableDays: [...data.availableDays, day] });
    } else {
      updateData({ availableDays: data.availableDays.filter(d => d !== day) });
    }
  };

  const handleTimeChange = (time: string, checked: boolean) => {
    if (checked) {
      updateData({ preferredTimes: [...data.preferredTimes, time] });
    } else {
      updateData({ preferredTimes: data.preferredTimes.filter(t => t !== time) });
    }
  };

  const canProceed = data.availableDays.length > 0 && data.preferredTimes.length > 0;

  return (
    <div className="space-y-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Tell us about your lifestyle</CardTitle>
        <CardDescription>
          Understanding your schedule and lifestyle helps us recommend the best times and types of workouts
        </CardDescription>
      </CardHeader>

      <div className="space-y-6">
        {/* Available Days */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Which days are you available to work out? (Select all that apply)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                  data.availableDays.includes(day)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleDayChange(day, !data.availableDays.includes(day))}
              >
                <span className="font-medium">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Times */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            What times work best for you? (Select all that apply)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {TIME_SLOTS.map((time) => (
              <div key={time} className="flex items-center space-x-2">
                <Checkbox
                  id={time}
                  checked={data.preferredTimes.includes(time)}
                  onCheckedChange={(checked) => handleTimeChange(time, checked as boolean)}
                />
                <Label htmlFor={time} className="text-sm cursor-pointer">
                  {time}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Stress Level */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            How would you rate your typical stress level? ({data.stressLevel}/10)
          </Label>
          <div className="px-3">
            <Slider
              value={[data.stressLevel]}
              onValueChange={(value) => updateData({ stressLevel: value[0] })}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Very relaxed</span>
              <span>Moderate stress</span>
              <span>Very stressed</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.stressLevel <= 3 && "Great! We can focus on maintaining your zen while building fitness."}
            {data.stressLevel > 3 && data.stressLevel <= 7 && "We&apos;ll include stress-relieving workouts in your routine."}
            {data.stressLevel > 7 && "Exercise can be a great stress reliever! We&apos;ll prioritize calming activities."}
          </p>
        </div>

        {/* Sleep Quality */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Moon className="h-5 w-5" />
            How would you rate your sleep quality? ({data.sleepQuality}/10)
          </Label>
          <div className="px-3">
            <Slider
              value={[data.sleepQuality]}
              onValueChange={(value) => updateData({ sleepQuality: value[0] })}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Poor sleep</span>
              <span>Average sleep</span>
              <span>Excellent sleep</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.sleepQuality <= 4 && "We&apos;ll recommend gentle workouts and recovery-focused activities."}
            {data.sleepQuality > 4 && data.sleepQuality <= 7 && "Good sleep supports your fitness goals!"}
            {data.sleepQuality > 7 && "Excellent! Your good sleep will help maximize workout recovery."}
          </p>
        </div>

        {/* Nutrition Habits */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Tell us about your nutrition habits (optional)
          </Label>
          <Textarea
            placeholder="e.g., I eat mostly healthy foods, I'm vegetarian, I struggle with meal prep, I have dietary restrictions..."
            value={data.nutritionHabits}
            onChange={(e) => updateData({ nutritionHabits: e.target.value })}
            className="min-h-[80px]"
          />
          <p className="text-sm text-muted-foreground">
            This helps us provide better nutrition tips and meal timing suggestions.
          </p>
        </div>

        {/* Lifestyle Summary */}
        {data.availableDays.length > 0 && (
          <div className="bg-secondary/10 p-4 rounded-lg">
            <h4 className="font-semibold text-secondary mb-2">Your Lifestyle Summary</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Available Days:</strong> {data.availableDays.join(', ')}</p>
              <p><strong>Preferred Times:</strong> {data.preferredTimes.slice(0, 2).join(', ')}
                {data.preferredTimes.length > 2 && ` +${data.preferredTimes.length - 2} more`}
              </p>
              <p><strong>Stress Level:</strong> {data.stressLevel}/10</p>
              <p><strong>Sleep Quality:</strong> {data.sleepQuality}/10</p>
              <p><strong>Weekly Availability:</strong> {data.availableDays.length} days × {data.timeAvailability} min = {data.availableDays.length * data.timeAvailability} minutes total</p>
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
