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
import { COMMUNICATION_STYLE_PROMPTS, COACHING_STYLE_PROMPTS } from '@/lib/ai-style-constants';

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
    prompt: 'Be encouraging, positive, and motivational. Use supportive language and celebrate progress.'
  },
  {
    id: 'challenging',
    label: 'Challenging',
    description: 'Direct, demanding, and results-focused',
    icon: Zap,
    color: 'bg-red-100 text-red-700',
    prompt: 'Be direct, demanding, and results-focused. Push the user to work harder and challenge their limits.'
  },
  {
    id: 'analytical',
    label: 'Analytical',
    description: 'Data-driven, detailed, and scientific',
    icon: Brain,
    color: 'bg-blue-100 text-blue-700',
    prompt: 'Be analytical and data-driven. Use scientific language, cite performance metrics, and provide detailed explanations.'
  },
  {
    id: 'casual',
    label: 'Casual',
    description: 'Friendly, relaxed, and conversational',
    icon: MessageCircle,
    color: 'bg-purple-100 text-purple-700',
    prompt: 'Be casual, friendly, and conversational. Use a relaxed tone like talking to a friend.'
  }
];

const COACHING_STYLES = [
  {
    id: 'detailed',
    label: 'Detailed',
    description: 'Comprehensive explanations and instructions',
    prompt: 'Provide detailed, comprehensive explanations with step-by-step instructions. Include form cues and technique tips.'
  },
  {
    id: 'concise',
    label: 'Concise',
    description: 'Brief, to-the-point guidance',
    prompt: 'Keep instructions brief and to-the-point. Use short sentences and bullet points. No fluff.'
  },
  {
    id: 'visual',
    label: 'Visual',
    description: 'Emphasis on demonstrations and imagery',
    prompt: 'Use visual imagery and metaphors. Help the user visualize movements and form cues.'
  },
  {
    id: 'conversational',
    label: 'Conversational',
    description: 'Interactive, question-based approach',
    prompt: 'Be conversational and interactive. Ask questions to engage the user and check their progress.'
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
    if (!user?.uid) return;

    setIsTestingStyle(true);
    setTestMessage('');

    try {
      // First, save the current preferences so the AI uses them
      await OnboardingContextService.updatePreferences(user.uid, localPreferences);

      // Create a test session
      const testSessionId = `test-${Date.now()}`;

      // Make real AI call - it will automatically use the saved preferences
      const response = await fetch('/api/ai/gemini-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: testSessionId,
          userId: user.uid,
          message: "Greet me and give me a quick motivational message about starting today's workout. Keep it to 2-3 sentences.",
          streaming: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to test AI style');
      }

      const data = await response.json();
      setTestMessage(data.message || 'AI response received');
    } catch (error) {
      console.error('Error testing AI style:', error);
      setTestMessage('Unable to test style at this time. Please try again.');
    } finally {
      setIsTestingStyle(false);
    }
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
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bot className="h-5 w-5" />
            Your AI Coach Personality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1 text-xs w-fit">
              {selectedCommStyle?.icon && <selectedCommStyle.icon className="h-3 w-3" />}
              {selectedCommStyle?.label}
            </Badge>
            <Badge variant="outline" className="text-xs w-fit">{selectedCoachStyle?.label}</Badge>
            <Badge variant="outline" className="text-xs w-fit">{selectedFeedbackFreq?.label} Feedback</Badge>
          </div>

          <Button
            onClick={handleTestStyle}
            disabled={isTestingStyle}
            variant="default"
            size="sm"
            className="flex items-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
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

          {testMessage && (
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{testMessage}</p>
                </div>
              </div>
            </div>
          )}
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
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${style.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-gray-600">{style.description}</div>
                    </div>
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
                  <div className="text-sm text-gray-600">{style.description}</div>
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
