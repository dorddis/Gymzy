"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  MessageCircle, 
  Volume2, 
  Eye,
  Heart,
  Brain,
  Zap,
  Target,
  Users,
  Clock,
  Loader2,
  Play,
  Pause
} from 'lucide-react';
import { OnboardingContext, OnboardingContextService } from '@/services/data/onboarding-context-service';
import { useAuth } from '@/contexts/AuthContext';

interface AICoachSettingsProps {
  context: OnboardingContext | null;
  onUpdate: (context: OnboardingContext) => void;
}

const COMMUNICATION_STYLES = [
  { 
    id: 'encouraging', 
    label: 'Encouraging', 
    description: 'Positive, supportive, and motivational',
    icon: Heart,
    color: 'bg-green-100 text-green-700',
    example: "Great job! You&apos;re making amazing progress. Keep pushing forward!"
  },
  { 
    id: 'challenging', 
    label: 'Challenging', 
    description: 'Direct, demanding, and results-focused',
    icon: Zap,
    color: 'bg-red-100 text-red-700',
    example: "Time to step it up! I know you can push harder than that."
  },
  { 
    id: 'analytical', 
    label: 'Analytical', 
    description: 'Data-driven, detailed, and scientific',
    icon: Brain,
    color: 'bg-blue-100 text-blue-700',
    example: "Based on your performance data, increasing intensity by 10% would optimize results."
  },
  { 
    id: 'casual', 
    label: 'Casual', 
    description: 'Friendly, relaxed, and conversational',
    icon: MessageCircle,
    color: 'bg-purple-100 text-purple-700',
    example: "Hey! Ready for today&apos;s workout? Let&apos;s have some fun with it!"
  }
];

const COACHING_STYLES = [
  { 
    id: 'detailed', 
    label: 'Detailed', 
    description: 'Comprehensive explanations and instructions',
    example: "For this exercise, focus on proper form: keep your core engaged, shoulders back..."
  },
  { 
    id: 'concise', 
    label: 'Concise', 
    description: 'Brief, to-the-point guidance',
    example: "3 sets of 12 reps. Focus on form. Rest 60 seconds between sets."
  },
  { 
    id: 'visual', 
    label: 'Visual', 
    description: 'Emphasis on demonstrations and imagery',
    example: "Imagine you&apos;re sitting back into a chair. Keep your chest proud and core tight."
  },
  { 
    id: 'conversational', 
    label: 'Conversational', 
    description: 'Interactive, question-based approach',
    example: "How are you feeling? Ready to increase the weight or stick with this for now?"
  }
];

const FEEDBACK_FREQUENCIES = [
  { 
    id: 'minimal', 
    label: 'Minimal', 
    description: 'Only essential feedback and corrections',
    frequency: 'Weekly check-ins'
  },
  { 
    id: 'moderate', 
    label: 'Moderate', 
    description: 'Regular encouragement and progress updates',
    frequency: 'Every few workouts'
  },
  { 
    id: 'frequent', 
    label: 'Frequent', 
    description: 'Constant motivation and real-time guidance',
    frequency: 'During every workout'
  }
];

const MOTIVATION_STYLES = [
  { 
    id: 'encouraging', 
    label: 'Encouraging', 
    description: 'Positive reinforcement and celebration',
    icon: Heart
  },
  { 
    id: 'challenging', 
    label: 'Challenging', 
    description: 'Push limits and overcome obstacles',
    icon: Target
  },
  { 
    id: 'analytical', 
    label: 'Analytical', 
    description: 'Progress tracking and data insights',
    icon: Brain
  },
  { 
    id: 'casual', 
    label: 'Casual', 
    description: 'Friendly reminders and gentle nudges',
    icon: Users
  }
];

export function AICoachSettings({ context, onUpdate }: AICoachSettingsProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingStyle, setIsTestingStyle] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  
  const [localPreferences, setLocalPreferences] = useState(context?.preferences || {
    workoutIntensity: 'moderate' as const,
    musicPreferences: [],
    motivationStyle: 'encouraging' as const,
    socialPreference: 'solo' as const,
    coachingStyle: 'conversational' as const,
    feedbackFrequency: 'moderate' as const
  });

  const handleTestStyle = async () => {
    setIsTestingStyle(true);
    
    // Simulate AI response based on selected style
    const selectedCommStyle = COMMUNICATION_STYLES.find(s => s.id === localPreferences.motivationStyle);
    const selectedCoachStyle = COACHING_STYLES.find(s => s.id === localPreferences.coachingStyle);
    
    setTimeout(() => {
      setTestMessage(selectedCommStyle?.example || "Hello! I'm your AI coach, ready to help you achieve your fitness goals!");
      setIsTestingStyle(false);
    }, 1500);
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const updatedContext = await OnboardingContextService.updatePreferences(
        user.uid,
        localPreferences
      );
      onUpdate(updatedContext);
    } catch (error) {
      console.error('Error updating AI coach settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCommStyle = COMMUNICATION_STYLES.find(s => s.id === localPreferences.motivationStyle);
  const selectedCoachStyle = COACHING_STYLES.find(s => s.id === localPreferences.coachingStyle);
  const selectedFeedbackFreq = FEEDBACK_FREQUENCIES.find(f => f.id === localPreferences.feedbackFrequency);

  return (
    <div className="space-y-6">
      {/* AI Personality Preview */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Your AI Coach Personality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedCommStyle?.icon && <selectedCommStyle.icon className="h-3 w-3" />}
                {selectedCommStyle?.label}
              </Badge>
              <Badge variant="outline">{selectedCoachStyle?.label}</Badge>
              <Badge variant="outline">{selectedFeedbackFreq?.label} Feedback</Badge>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleTestStyle} 
                disabled={isTestingStyle}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                {isTestingStyle ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Test Style
                  </>
                )}
              </Button>
            </div>

            {testMessage && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{testMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Communication Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Communication Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMMUNICATION_STYLES.map((style) => {
              const Icon = style.icon;
              const isSelected = localPreferences.motivationStyle === style.id;
              
              return (
                <button
                  key={style.id}
                  onClick={() => setLocalPreferences(prev => ({ ...prev, motivationStyle: style.id as any }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${style.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-gray-600">{style.description}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 italic">
                    &quot;{style.example}&quot;
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Coaching Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Coaching Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {COACHING_STYLES.map((style) => {
              const isSelected = localPreferences.coachingStyle === style.id;
              
              return (
                <button
                  key={style.id}
                  onClick={() => setLocalPreferences(prev => ({ ...prev, coachingStyle: style.id as any }))}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium mb-1">{style.label}</div>
                  <div className="text-sm text-gray-600 mb-2">{style.description}</div>
                  <div className="text-xs text-gray-500 italic">
                    Example: &quot;{style.example}&quot;
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Feedback Frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FEEDBACK_FREQUENCIES.map((freq) => {
              const isSelected = localPreferences.feedbackFrequency === freq.id;
              
              return (
                <button
                  key={freq.id}
                  onClick={() => setLocalPreferences(prev => ({ ...prev, feedbackFrequency: freq.id as any }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{freq.label}</div>
                  <div className="text-sm text-gray-600 mb-1">{freq.description}</div>
                  <div className="text-xs text-gray-500">{freq.frequency}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Workout Intensity Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Workout Intensity Preference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {['low', 'moderate', 'high', 'variable'].map((intensity) => {
              const isSelected = localPreferences.workoutIntensity === intensity;
              
              return (
                <button
                  key={intensity}
                  onClick={() => setLocalPreferences(prev => ({ ...prev, workoutIntensity: intensity as any }))}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium capitalize">{intensity}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Social Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Preference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { id: 'solo', label: 'Solo', description: 'Prefer working out alone' },
              { id: 'partner', label: 'Partner', description: 'With a workout buddy' },
              { id: 'group', label: 'Group', description: 'In group classes or teams' },
              { id: 'mixed', label: 'Mixed', description: 'Varies by mood and workout' }
            ].map((pref) => {
              const isSelected = localPreferences.socialPreference === pref.id;
              
              return (
                <button
                  key={pref.id}
                  onClick={() => setLocalPreferences(prev => ({ ...prev, socialPreference: pref.id as any }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{pref.label}</div>
                  <div className="text-sm text-gray-600">{pref.description}</div>
                </button>
              );
            })}
          </div>
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
            'Save AI Settings'
          )}
        </Button>
      </div>
    </div>
  );
}
