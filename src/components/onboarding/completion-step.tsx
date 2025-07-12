import React from 'react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingData } from '@/app/onboarding/page';
import { CheckCircle, Loader2, Sparkles, Target, Calendar, Brain } from 'lucide-react';

interface CompletionStepProps {
  data: OnboardingData;
  onComplete: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
}

export function CompletionStep({ data, onComplete, onPrev, isSubmitting }: CompletionStepProps) {
  const getExperienceText = () => {
    if (data.experienceLevel <= 3) return 'Beginner';
    if (data.experienceLevel <= 7) return 'Intermediate';
    return 'Advanced';
  };

  const getChallengeText = () => {
    if (data.challengeLevel <= 3) return 'Gentle';
    if (data.challengeLevel <= 7) return 'Moderate';
    return 'Intense';
  };

  return (
    <div className="space-y-6">
      <CardHeader className="pb-4 text-center">
        <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl">You&apos;re all set! 🎉</CardTitle>
        <CardDescription className="text-lg">
          Your AI coach is ready to help you achieve your fitness goals
        </CardDescription>
      </CardHeader>

      <div className="space-y-6">
        {/* Profile Summary */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Your Personalized AI Coach Profile
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-secondary mt-0.5" />
                <div>
                  <p className="font-medium">Primary Goal</p>
                  <p className="text-sm text-muted-foreground">{data.primaryGoal.replace('_', ' ')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-secondary mt-0.5" />
                <div>
                  <p className="font-medium">Schedule</p>
                  <p className="text-sm text-muted-foreground">
                    {data.workoutFrequency}x/week, {data.timeAvailability} min sessions
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-secondary mt-0.5" />
                <div>
                  <p className="font-medium">Experience Level</p>
                  <p className="text-sm text-muted-foreground">
                    {getExperienceText()} ({data.experienceLevel}/10)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-secondary mt-0.5" />
                <div>
                  <p className="font-medium">Coaching Style</p>
                  <p className="text-sm text-muted-foreground">
                    {data.communicationStyle} & {getChallengeText().toLowerCase()} challenge
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What&apos;s Next */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Your AI coach will create personalized workout recommendations
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              You&apos;ll get daily motivation and guidance tailored to your preferences
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Your coach will learn and adapt as you progress
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Connect with the community and share your fitness journey
            </li>
          </ul>
        </div>

        {/* Key Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="mx-auto mb-2 p-2 bg-primary/10 rounded-full w-fit">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-medium mb-1">Smart Recommendations</h4>
            <p className="text-xs text-muted-foreground">
              AI-powered workout and nutrition suggestions
            </p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="mx-auto mb-2 p-2 bg-secondary/10 rounded-full w-fit">
              <Target className="h-6 w-6 text-secondary" />
            </div>
            <h4 className="font-medium mb-1">Progress Tracking</h4>
            <p className="text-xs text-muted-foreground">
              Visual analytics and achievement milestones
            </p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="mx-auto mb-2 p-2 bg-green-500/10 rounded-full w-fit">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-medium mb-1">Social Community</h4>
            <p className="text-xs text-muted-foreground">
              Connect with like-minded fitness enthusiasts
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Privacy Note:</strong> Your personal information is secure and will only be used to 
            personalize your fitness experience. You can update these preferences anytime in your profile settings.
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev} disabled={isSubmitting}>
          Back
        </Button>
        <Button 
          onClick={onComplete} 
          disabled={isSubmitting}
          size="lg"
          className="min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Start My Journey! 🚀
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
