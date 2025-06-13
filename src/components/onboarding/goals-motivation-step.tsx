import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingData } from '@/app/onboarding/page';
import { Target, Clock, Zap, Heart, Trophy, Shield } from 'lucide-react';

interface GoalsMotivationStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const PRIMARY_GOALS = [
  { id: 'lose_weight', label: 'Lose Weight', icon: Target, description: 'Burn fat and achieve a healthier body composition' },
  { id: 'build_muscle', label: 'Build Muscle', icon: Zap, description: 'Increase muscle mass and strength' },
  { id: 'improve_endurance', label: 'Improve Endurance', icon: Heart, description: 'Enhance cardiovascular fitness and stamina' },
  { id: 'get_stronger', label: 'Get Stronger', icon: Trophy, description: 'Increase overall strength and power' },
  { id: 'stay_healthy', label: 'Stay Healthy', icon: Shield, description: 'Maintain general health and wellness' },
  { id: 'sport_performance', label: 'Sport Performance', icon: Target, description: 'Improve performance in a specific sport' }
];

const SECONDARY_GOALS = [
  'Improve flexibility',
  'Better posture',
  'Stress relief',
  'Better sleep',
  'Increase energy',
  'Injury prevention',
  'Tone muscles',
  'Improve balance',
  'Build confidence',
  'Social connection'
];

const TIMELINES = [
  '1-3 months',
  '3-6 months',
  '6-12 months',
  '1+ years',
  'Ongoing lifestyle'
];

const MOTIVATION_FACTORS = [
  'Health benefits',
  'Looking good',
  'Feeling strong',
  'Stress relief',
  'Social aspect',
  'Competition',
  'Personal challenge',
  'Doctor recommendation',
  'Energy boost',
  'Confidence building'
];

export function GoalsMotivationStep({ data, updateData, onNext, onPrev }: GoalsMotivationStepProps) {
  const handleSecondaryGoalChange = (goal: string, checked: boolean) => {
    if (checked) {
      updateData({ secondaryGoals: [...data.secondaryGoals, goal] });
    } else {
      updateData({ secondaryGoals: data.secondaryGoals.filter(g => g !== goal) });
    }
  };

  const handleMotivationChange = (factor: string, checked: boolean) => {
    if (checked) {
      updateData({ motivationFactors: [...data.motivationFactors, factor] });
    } else {
      updateData({ motivationFactors: data.motivationFactors.filter(f => f !== factor) });
    }
  };

  const canProceed = (data.primaryGoal.length > 0 || data.secondaryGoals.length > 0) && data.timeline.length > 0;

  return (
    <div className="space-y-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">What are your fitness goals?</CardTitle>
        <CardDescription>
          Understanding your goals helps us create a personalized plan that keeps you motivated
        </CardDescription>
      </CardHeader>

      <div className="space-y-6">
        {/* Primary Goals - Now Multi-Select */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">What are your main fitness goals? (Select all that apply)</Label>
          <p className="text-sm text-muted-foreground">
            Choose all the goals that matter to you - your AI coach will help you balance them effectively.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRIMARY_GOALS.map((goal) => {
              const Icon = goal.icon;
              const isSelected = data.secondaryGoals.includes(goal.id) || data.primaryGoal === goal.id;
              return (
                <div
                  key={goal.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      // Remove from both primary and secondary
                      if (data.primaryGoal === goal.id) {
                        updateData({ primaryGoal: '' });
                      }
                      updateData({ secondaryGoals: data.secondaryGoals.filter(g => g !== goal.id) });
                    } else {
                      // Add to secondary goals, or make primary if none selected
                      if (!data.primaryGoal) {
                        updateData({ primaryGoal: goal.id });
                      } else {
                        updateData({ secondaryGoals: [...data.secondaryGoals, goal.id] });
                      }
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`h-6 w-6 mt-1 ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
                    <div>
                      <h3 className="font-medium">
                        {goal.label}
                        {data.primaryGoal === goal.id && (
                          <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                            Primary
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">What's your timeline for achieving this goal?</Label>
          <div className="space-y-2">
            {TIMELINES.map((timeline) => (
              <div key={timeline} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={timeline}
                  name="timeline"
                  value={timeline}
                  checked={data.timeline === timeline}
                  onChange={(e) => updateData({ timeline: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor={timeline} className="text-sm cursor-pointer">
                  {timeline}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Goals */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Any additional goals? (Select all that apply)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SECONDARY_GOALS.map((goal) => (
              <div key={goal} className="flex items-center space-x-2">
                <Checkbox
                  id={goal}
                  checked={data.secondaryGoals.includes(goal)}
                  onCheckedChange={(checked) => handleSecondaryGoalChange(goal, checked as boolean)}
                />
                <Label htmlFor={goal} className="text-sm cursor-pointer">
                  {goal}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Motivation Factors */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            What motivates you to exercise? (Select all that apply)
          </Label>
          <p className="text-sm text-muted-foreground">
            This helps your AI coach provide the right type of encouragement
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MOTIVATION_FACTORS.map((factor) => (
              <div key={factor} className="flex items-center space-x-2">
                <Checkbox
                  id={factor}
                  checked={data.motivationFactors.includes(factor)}
                  onCheckedChange={(checked) => handleMotivationChange(factor, checked as boolean)}
                />
                <Label htmlFor={factor} className="text-sm cursor-pointer">
                  {factor}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Summary */}
        {data.primaryGoal && (
          <div className="bg-primary/5 p-4 rounded-lg">
            <h4 className="font-semibold text-primary mb-2">Your Goal Summary</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Primary Goal:</strong> {PRIMARY_GOALS.find(g => g.id === data.primaryGoal)?.label}</p>
              <p><strong>Timeline:</strong> {data.timeline}</p>
              {data.secondaryGoals.length > 0 && (
                <p><strong>Additional Goals:</strong> {data.secondaryGoals.join(', ')}</p>
              )}
              {data.motivationFactors.length > 0 && (
                <p><strong>Motivation:</strong> {data.motivationFactors.join(', ')}</p>
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
