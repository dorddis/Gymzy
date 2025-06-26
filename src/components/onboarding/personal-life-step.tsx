import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingData } from '@/app/onboarding/page';
import { Heart, Target, Users, Briefcase, Home, Sparkles } from 'lucide-react';

interface PersonalLifeStepProps {
  data: OnboardingData & {
    personalGoals?: string[];
    lifeValues?: string[];
    currentChallenges?: string[];
    personalMotivation?: string;
    lifeContext?: string;
    supportSystem?: string[];
  };
  updateData: (updates: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const PERSONAL_GOALS = [
  'Build confidence and self-esteem',
  'Improve mental health and mood',
  'Set a positive example for family',
  'Increase energy for daily activities',
  'Improve work performance and focus',
  'Feel more attractive and confident',
  'Reduce stress and anxiety',
  'Sleep better and feel more rested',
  'Keep up with kids/grandchildren',
  'Prepare for a special event',
  'Overcome past negative experiences',
  'Build discipline and consistency',
  'Feel stronger and more capable',
  'Improve overall quality of life'
];

const LIFE_VALUES = [
  'Health and wellness',
  'Family and relationships',
  'Career and achievement',
  'Personal growth',
  'Adventure and experiences',
  'Financial security',
  'Helping others',
  'Creativity and self-expression',
  'Independence and freedom',
  'Spiritual growth',
  'Community involvement',
  'Learning and knowledge'
];

const CURRENT_CHALLENGES = [
  'Lack of time due to work',
  'Family responsibilities',
  'Low energy levels',
  'Past injuries or health issues',
  'Lack of motivation',
  'Financial constraints',
  'Social anxiety or self-consciousness',
  'Inconsistent schedule',
  'Lack of knowledge about fitness',
  'Previous failed attempts',
  'Perfectionism or all-or-nothing thinking',
  'Lack of support from others'
];

const SUPPORT_SYSTEM = [
  'Spouse/partner',
  'Family members',
  'Close friends',
  'Workout buddies',
  'Personal trainer',
  'Online communities',
  'Coworkers',
  'Healthcare providers',
  'Mental health professionals',
  'Fitness apps/technology',
  'Social media fitness accounts',
  'Local fitness groups'
];

export function PersonalLifeStep({ data, updateData, onNext, onPrev }: PersonalLifeStepProps) {
  const handlePersonalGoalChange = (goal: string, checked: boolean) => {
    const currentGoals = data.personalGoals || [];
    if (checked) {
      updateData({ personalGoals: [...currentGoals, goal] });
    } else {
      updateData({ personalGoals: currentGoals.filter(g => g !== goal) });
    }
  };

  const handleValueChange = (value: string, checked: boolean) => {
    const currentValues = data.lifeValues || [];
    if (checked) {
      updateData({ lifeValues: [...currentValues, value] });
    } else {
      updateData({ lifeValues: currentValues.filter(v => v !== value) });
    }
  };

  const handleChallengeChange = (challenge: string, checked: boolean) => {
    const currentChallenges = data.currentChallenges || [];
    if (checked) {
      updateData({ currentChallenges: [...currentChallenges, challenge] });
    } else {
      updateData({ currentChallenges: currentChallenges.filter(c => c !== challenge) });
    }
  };

  const handleSupportChange = (support: string, checked: boolean) => {
    const currentSupport = data.supportSystem || [];
    if (checked) {
      updateData({ supportSystem: [...currentSupport, support] });
    } else {
      updateData({ supportSystem: currentSupport.filter(s => s !== support) });
    }
  };

  return (
    <div className="space-y-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          Tell us about your personal journey
        </CardTitle>
        <CardDescription>
          Understanding your personal context helps your AI coach provide more meaningful and relevant guidance
        </CardDescription>
      </CardHeader>

      <div className="space-y-6">
        {/* Personal Goals Beyond Fitness */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            What personal goals do you hope fitness will help you achieve? (Select all that apply)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PERSONAL_GOALS.map((goal) => (
              <div key={goal} className="flex items-center space-x-2">
                <Checkbox
                  id={goal}
                  checked={(data.personalGoals || []).includes(goal)}
                  onCheckedChange={(checked) => handlePersonalGoalChange(goal, checked as boolean)}
                />
                <Label htmlFor={goal} className="text-sm cursor-pointer">
                  {goal}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Life Values */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            What do you value most in life? (Select your top 5)
          </Label>
          <p className="text-sm text-muted-foreground">
            This helps your AI coach understand what matters most to you when making recommendations.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {LIFE_VALUES.map((value) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={value}
                  checked={(data.lifeValues || []).includes(value)}
                  onCheckedChange={(checked) => handleValueChange(value, checked as boolean)}
                />
                <Label htmlFor={value} className="text-sm cursor-pointer">
                  {value}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Current Life Challenges */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            What are your biggest challenges when it comes to staying active? (Select all that apply)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CURRENT_CHALLENGES.map((challenge) => (
              <div key={challenge} className="flex items-center space-x-2">
                <Checkbox
                  id={challenge}
                  checked={(data.currentChallenges || []).includes(challenge)}
                  onCheckedChange={(checked) => handleChallengeChange(challenge, checked as boolean)}
                />
                <Label htmlFor={challenge} className="text-sm cursor-pointer">
                  {challenge}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Motivation Story */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            What's your personal "why" for wanting to get fit?
          </Label>
          <p className="text-sm text-muted-foreground">
            Share your story - what drives you? What would achieving your fitness goals mean to you personally?
          </p>
          <Textarea
            placeholder="e.g., I want to be able to play with my kids without getting tired, I want to feel confident in my own skin again, I want to prove to myself that I can stick to something..."
            value={data.personalMotivation || ''}
            onChange={(e) => updateData({ personalMotivation: e.target.value })}
            className="min-h-[100px]"
          />
        </div>

        {/* Life Context */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Tell us about your current life situation
          </Label>
          <p className="text-sm text-muted-foreground">
            What's going on in your life right now? This helps your AI coach understand your context and provide appropriate support.
          </p>
          <Textarea
            placeholder="e.g., I'm a busy parent with two young kids, I just started a new job, I'm going through a difficult time, I'm preparing for a wedding, I'm recovering from an injury..."
            value={data.lifeContext || ''}
            onChange={(e) => updateData({ lifeContext: e.target.value })}
            className="min-h-[80px]"
          />
        </div>

        {/* Support System */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Who or what supports you in your fitness journey? (Select all that apply)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SUPPORT_SYSTEM.map((support) => (
              <div key={support} className="flex items-center space-x-2">
                <Checkbox
                  id={support}
                  checked={(data.supportSystem || []).includes(support)}
                  onCheckedChange={(checked) => handleSupportChange(support, checked as boolean)}
                />
                <Label htmlFor={support} className="text-sm cursor-pointer">
                  {support}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
