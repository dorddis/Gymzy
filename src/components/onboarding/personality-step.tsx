import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingData } from '@/app/onboarding/page';
import { MessageCircle, BarChart3, Heart, Zap, Eye, Headphones, Hand } from 'lucide-react';

interface PersonalityStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const COMMUNICATION_STYLES = [
  { 
    id: 'motivational', 
    label: 'Motivational', 
    icon: Zap, 
    description: 'Energetic, encouraging, and inspiring messages' 
  },
  { 
    id: 'analytical', 
    label: 'Analytical', 
    icon: BarChart3, 
    description: 'Data-driven insights and detailed explanations' 
  },
  { 
    id: 'supportive', 
    label: 'Supportive', 
    icon: Heart, 
    description: 'Gentle, understanding, and empathetic guidance' 
  },
  { 
    id: 'challenging', 
    label: 'Challenging', 
    icon: MessageCircle, 
    description: 'Direct, goal-focused, and performance-oriented' 
  }
];

const FEEDBACK_PREFERENCES = [
  { 
    id: 'detailed', 
    label: 'Detailed', 
    description: 'Comprehensive explanations and thorough analysis' 
  },
  { 
    id: 'concise', 
    label: 'Concise', 
    description: 'Brief, to-the-point summaries and quick tips' 
  },
  { 
    id: 'visual', 
    label: 'Visual', 
    description: 'Charts, graphs, and visual progress indicators' 
  }
];

const LEARNING_STYLES = [
  { 
    id: 'visual', 
    label: 'Visual', 
    icon: Eye, 
    description: 'Learn best through images, videos, and demonstrations' 
  },
  { 
    id: 'auditory', 
    label: 'Auditory', 
    icon: Headphones, 
    description: 'Learn best through spoken instructions and audio cues' 
  },
  { 
    id: 'kinesthetic', 
    label: 'Kinesthetic', 
    icon: Hand, 
    description: 'Learn best through hands-on practice and movement' 
  }
];

export function PersonalityStep({ data, updateData, onNext, onPrev }: PersonalityStepProps) {
  return (
    <div className="space-y-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Let's personalize your AI coach</CardTitle>
        <CardDescription>
          These preferences help your AI coach communicate with you in the way that works best for you
        </CardDescription>
      </CardHeader>

      <div className="space-y-6">
        {/* Communication Style */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            How would you like your AI coach to communicate with you?
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMMUNICATION_STYLES.map((style) => {
              const Icon = style.icon;
              const isSelected = data.communicationStyle === style.id;
              return (
                <div
                  key={style.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateData({ communicationStyle: style.id as any })}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`h-6 w-6 mt-1 ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
                    <div>
                      <h3 className="font-medium">{style.label}</h3>
                      <p className="text-sm text-muted-foreground">{style.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Preference */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            How do you prefer to receive feedback?
          </Label>
          <div className="space-y-2">
            {FEEDBACK_PREFERENCES.map((preference) => (
              <div
                key={preference.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  data.feedbackPreference === preference.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateData({ feedbackPreference: preference.id as any })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{preference.label}</h3>
                    <p className="text-sm text-muted-foreground">{preference.description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    data.feedbackPreference === preference.id
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Challenge Level */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            How much do you like to be challenged? ({data.challengeLevel}/10)
          </Label>
          <div className="px-3">
            <Slider
              value={[data.challengeLevel]}
              onValueChange={(value) => updateData({ challengeLevel: value[0] })}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Take it easy</span>
              <span>Moderate challenge</span>
              <span>Push me hard</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.challengeLevel <= 3 && "We'll keep things comfortable and gradually build up."}
            {data.challengeLevel > 3 && data.challengeLevel <= 7 && "Perfect balance of challenge and achievability."}
            {data.challengeLevel > 7 && "Ready for intense challenges! We'll push your limits safely."}
          </p>
        </div>

        {/* Learning Style */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            How do you learn best?
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LEARNING_STYLES.map((style) => {
              const Icon = style.icon;
              const isSelected = data.learningStyle === style.id;
              return (
                <div
                  key={style.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateData({ learningStyle: style.id as any })}
                >
                  <div className="text-center space-y-2">
                    <Icon className={`h-8 w-8 mx-auto ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
                    <h3 className="font-medium">{style.label}</h3>
                    <p className="text-xs text-muted-foreground">{style.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personality Summary */}
        <div className="bg-primary/5 p-4 rounded-lg">
          <h4 className="font-semibold text-primary mb-2">Your AI Coach Personality</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Communication:</strong> {COMMUNICATION_STYLES.find(s => s.id === data.communicationStyle)?.label}</p>
            <p><strong>Feedback Style:</strong> {FEEDBACK_PREFERENCES.find(p => p.id === data.feedbackPreference)?.label}</p>
            <p><strong>Challenge Level:</strong> {data.challengeLevel}/10</p>
            <p><strong>Learning Style:</strong> {LEARNING_STYLES.find(s => s.id === data.learningStyle)?.label}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your AI coach will adapt to these preferences and evolve as it learns more about you.
          </p>
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
