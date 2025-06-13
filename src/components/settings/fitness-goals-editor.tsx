"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Plus, 
  X, 
  TrendingUp, 
  Calendar,
  Weight,
  Zap,
  Trophy,
  Activity,
  Loader2
} from 'lucide-react';
import { OnboardingContext, OnboardingContextService } from '@/services/onboarding-context-service';
import { useAuth } from '@/contexts/AuthContext';

interface FitnessGoalsEditorProps {
  context: OnboardingContext | null;
  onUpdate: (context: OnboardingContext) => void;
}

const PRIMARY_GOALS = [
  { id: 'weight_loss', label: 'Weight Loss', icon: TrendingUp, color: 'bg-red-100 text-red-700' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: Zap, color: 'bg-blue-100 text-blue-700' },
  { id: 'endurance', label: 'Endurance', icon: Activity, color: 'bg-green-100 text-green-700' },
  { id: 'strength', label: 'Strength', icon: Weight, color: 'bg-purple-100 text-purple-700' },
  { id: 'general_fitness', label: 'General Fitness', icon: Trophy, color: 'bg-orange-100 text-orange-700' },
  { id: 'sport_specific', label: 'Sport Specific', icon: Target, color: 'bg-indigo-100 text-indigo-700' }
] as const;

const TIMELINES = [
  { id: '1_month', label: '1 Month', description: 'Quick results' },
  { id: '3_months', label: '3 Months', description: 'Balanced approach' },
  { id: '6_months', label: '6 Months', description: 'Sustainable progress' },
  { id: '1_year', label: '1 Year', description: 'Long-term transformation' },
  { id: 'ongoing', label: 'Ongoing', description: 'Lifestyle change' }
] as const;

const PRIORITY_LEVELS = [
  { id: 'low', label: 'Low', description: 'Flexible, when convenient' },
  { id: 'medium', label: 'Medium', description: 'Important, regular focus' },
  { id: 'high', label: 'High', description: 'Top priority, daily focus' }
] as const;

export function FitnessGoalsEditor({ context, onUpdate }: FitnessGoalsEditorProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localGoals, setLocalGoals] = useState(context?.fitnessGoals || {
    primary: 'general_fitness' as const,
    secondary: [],
    targetTimeline: '3_months' as const,
    priorityLevel: 'medium' as const,
    specificTargets: {}
  });
  const [newSecondaryGoal, setNewSecondaryGoal] = useState('');

  const handlePrimaryGoalChange = (goalId: string) => {
    setLocalGoals(prev => ({
      ...prev,
      primary: goalId as any
    }));
  };

  const handleSecondaryGoalAdd = () => {
    if (newSecondaryGoal.trim() && !localGoals.secondary.includes(newSecondaryGoal.trim())) {
      setLocalGoals(prev => ({
        ...prev,
        secondary: [...prev.secondary, newSecondaryGoal.trim()]
      }));
      setNewSecondaryGoal('');
    }
  };

  const handleSecondaryGoalRemove = (goal: string) => {
    setLocalGoals(prev => ({
      ...prev,
      secondary: prev.secondary.filter(g => g !== goal)
    }));
  };

  const handleTimelineChange = (timeline: string) => {
    setLocalGoals(prev => ({
      ...prev,
      targetTimeline: timeline as any
    }));
  };

  const handlePriorityChange = (priority: string) => {
    setLocalGoals(prev => ({
      ...prev,
      priorityLevel: priority as any
    }));
  };

  const handleSpecificTargetChange = (key: string, value: string) => {
    setLocalGoals(prev => ({
      ...prev,
      specificTargets: {
        ...prev.specificTargets,
        [key]: value ? parseFloat(value) : undefined
      }
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const updatedContext = await OnboardingContextService.updateFitnessGoals(
        user.uid,
        localGoals
      );
      onUpdate(updatedContext);
    } catch (error) {
      console.error('Error updating fitness goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPrimaryGoal = PRIMARY_GOALS.find(g => g.id === localGoals.primary);
  const selectedTimeline = TIMELINES.find(t => t.id === localGoals.targetTimeline);
  const selectedPriority = PRIORITY_LEVELS.find(p => p.id === localGoals.priorityLevel);

  return (
    <div className="space-y-6">
      {/* Primary Goal Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Primary Fitness Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRIMARY_GOALS.map((goal) => {
              const Icon = goal.icon;
              const isSelected = localGoals.primary === goal.id;
              
              return (
                <button
                  key={goal.id}
                  onClick={() => handlePrimaryGoalChange(goal.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${goal.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{goal.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Secondary Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Secondary Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a secondary goal..."
              value={newSecondaryGoal}
              onChange={(e) => setNewSecondaryGoal(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSecondaryGoalAdd()}
            />
            <Button onClick={handleSecondaryGoalAdd} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {localGoals.secondary.map((goal, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {goal}
                <button
                  onClick={() => handleSecondaryGoalRemove(goal)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Target Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TIMELINES.map((timeline) => {
              const isSelected = localGoals.targetTimeline === timeline.id;
              
              return (
                <button
                  key={timeline.id}
                  onClick={() => handleTimelineChange(timeline.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{timeline.label}</div>
                  <div className="text-sm text-gray-600">{timeline.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Priority Level */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRIORITY_LEVELS.map((priority) => {
              const isSelected = localGoals.priorityLevel === priority.id;
              
              return (
                <button
                  key={priority.id}
                  onClick={() => handlePriorityChange(priority.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium capitalize">{priority.label}</div>
                  <div className="text-sm text-gray-600">{priority.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Specific Targets */}
      <Card>
        <CardHeader>
          <CardTitle>Specific Targets (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {localGoals.primary === 'weight_loss' && (
            <div>
              <Label htmlFor="weightTarget">Target Weight (kg)</Label>
              <Input
                id="weightTarget"
                type="number"
                placeholder="e.g., 70"
                value={localGoals.specificTargets?.weightTarget || ''}
                onChange={(e) => handleSpecificTargetChange('weightTarget', e.target.value)}
              />
            </div>
          )}
          
          {localGoals.primary === 'muscle_gain' && (
            <div>
              <Label htmlFor="bodyFatTarget">Target Body Fat % (optional)</Label>
              <Input
                id="bodyFatTarget"
                type="number"
                placeholder="e.g., 15"
                value={localGoals.specificTargets?.bodyFatTarget || ''}
                onChange={(e) => handleSpecificTargetChange('bodyFatTarget', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} className="min-w-32">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Goals'
          )}
        </Button>
      </div>
    </div>
  );
}
