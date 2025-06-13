import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, Users, TrendingUp, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSwitchAccount = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // The auth context will redirect to /auth automatically
    } catch (error) {
      console.error('Error logging out:', error);
      setIsLoggingOut(false);
    }
  };
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

      {/* Current User Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <User className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-800">
            Setting up for: {user?.email}
          </span>
        </div>
        <p className="text-sm text-blue-600 mb-3">
          This onboarding will be linked to your current account
        </p>
        <Button
          onClick={handleSwitchAccount}
          disabled={isLoggingOut}
          variant="outline"
          size="sm"
          className="border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          {isLoggingOut ? (
            <>
              <LogOut className="h-4 w-4 mr-2 animate-spin" />
              Switching...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              Use Different Account
            </>
          )}
        </Button>
      </div>

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

        <Button
          onClick={onNext}
          size="lg"
          className="w-full"
          disabled={isLoggingOut}
        >
          Let's Get Started! 🎯
        </Button>
      </div>
    </div>
  );
}
