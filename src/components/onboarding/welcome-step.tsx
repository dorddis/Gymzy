import React from 'react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, Users, TrendingUp } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-3xl font-bold text-primary">
          Welcome to Your AI Fitness Journey! 🚀
        </CardTitle>
        <CardDescription className="text-lg">
          Let's create your personalized AI coach that understands you better than anyone else
        </CardDescription>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <div className="flex flex-col items-center p-4 rounded-lg bg-secondary/10">
          <Brain className="h-12 w-12 text-secondary mb-3" />
          <h3 className="font-semibold mb-2">AI-Powered Coaching</h3>
          <p className="text-sm text-muted-foreground text-center">
            Your AI coach learns your preferences, adapts to your progress, and provides personalized guidance
          </p>
        </div>

        <div className="flex flex-col items-center p-4 rounded-lg bg-secondary/10">
          <Target className="h-12 w-12 text-secondary mb-3" />
          <h3 className="font-semibold mb-2">Personalized Goals</h3>
          <p className="text-sm text-muted-foreground text-center">
            Set and track goals that matter to you, with AI-driven recommendations for optimal progress
          </p>
        </div>

        <div className="flex flex-col items-center p-4 rounded-lg bg-secondary/10">
          <Users className="h-12 w-12 text-secondary mb-3" />
          <h3 className="font-semibold mb-2">Social Community</h3>
          <p className="text-sm text-muted-foreground text-center">
            Connect with like-minded fitness enthusiasts and share your journey
          </p>
        </div>

        <div className="flex flex-col items-center p-4 rounded-lg bg-secondary/10">
          <TrendingUp className="h-12 w-12 text-secondary mb-3" />
          <h3 className="font-semibold mb-2">Smart Analytics</h3>
          <p className="text-sm text-muted-foreground text-center">
            Track your progress with intelligent insights and predictive analytics
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-primary/5 p-4 rounded-lg">
          <h4 className="font-semibold text-primary mb-2">What to Expect</h4>
          <ul className="text-sm space-y-1 text-left">
            <li>• 6 quick steps to understand your fitness background and goals</li>
            <li>• Questions about your preferences and personality</li>
            <li>• Lifestyle and schedule information</li>
            <li>• Takes about 5-7 minutes to complete</li>
          </ul>
        </div>

        <p className="text-sm text-muted-foreground">
          Your responses help us create an AI coach that speaks your language and understands your unique needs.
        </p>

        <Button onClick={onNext} size="lg" className="w-full">
          Let's Get Started! 🎯
        </Button>
      </div>
    </div>
  );
}
