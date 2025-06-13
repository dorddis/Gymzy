"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { WelcomeStep } from '@/components/onboarding/welcome-step';
import { FitnessBackgroundStep } from '@/components/onboarding/fitness-background-step';
import { GoalsMotivationStep } from '@/components/onboarding/goals-motivation-step';
import { PreferencesStep } from '@/components/onboarding/preferences-step';
import { PersonalityStep } from '@/components/onboarding/personality-step';
import { PersonalLifeStep } from '@/components/onboarding/personal-life-step';
import { LifestyleStep } from '@/components/onboarding/lifestyle-step';
import { CompletionStep } from '@/components/onboarding/completion-step';
import { createAIPersonalityProfile } from '@/services/ai-personality-service';

export interface OnboardingData {
  // Fitness Background
  experienceLevel: number;
  previousInjuries: string[];
  currentActivity: string;

  // Goals & Motivation
  primaryGoal: string;
  secondaryGoals: string[];
  timeline: string;
  motivationFactors: string[];

  // Preferences
  workoutTypes: string[];
  timeAvailability: number;
  equipmentAccess: string[];
  workoutFrequency: number;

  // Personality
  communicationStyle: 'motivational' | 'analytical' | 'supportive' | 'challenging';
  feedbackPreference: 'detailed' | 'concise' | 'visual';
  challengeLevel: number;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic';

  // Personal Life Context
  personalGoals: string[];
  lifeValues: string[];
  currentChallenges: string[];
  personalMotivation: string;
  lifeContext: string;
  supportSystem: string[];

  // Lifestyle
  availableDays: string[];
  preferredTimes: string[];
  stressLevel: number;
  sleepQuality: number;
  nutritionHabits: string;
}

const TOTAL_STEPS = 8;

export default function OnboardingPage() {
  const { user, loading, updateUserProfile, refreshUserProfile } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    experienceLevel: 1,
    previousInjuries: [],
    currentActivity: '',
    primaryGoal: '',
    secondaryGoals: [],
    timeline: '',
    motivationFactors: [],
    workoutTypes: [],
    timeAvailability: 30,
    equipmentAccess: [],
    workoutFrequency: 3,
    communicationStyle: 'motivational',
    feedbackPreference: 'detailed',
    challengeLevel: 5,
    learningStyle: 'visual',
    personalGoals: [],
    lifeValues: [],
    currentChallenges: [],
    personalMotivation: '',
    lifeContext: '',
    supportSystem: [],
    availableDays: [],
    preferredTimes: [],
    stressLevel: 5,
    sleepQuality: 7,
    nutritionHabits: ''
  });

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log('Onboarding: No user, redirecting to auth');
      router.replace('/auth');
    }
  }, [user, loading, router]);

  // Redirect if user has already completed onboarding
  useEffect(() => {
    if (user?.profile?.hasCompletedOnboarding) {
      console.log('Onboarding: User already completed onboarding, redirecting to home');
      router.replace('/');
    }
  }, [user, router]);

  const updateOnboardingData = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      console.log('Onboarding: Starting completion process');

      // Create AI personality profile
      console.log('Onboarding: Creating AI personality profile');
      await createAIPersonalityProfile(user.uid, onboardingData);
      console.log('Onboarding: AI personality profile created');

      // Update user profile to mark onboarding as complete
      console.log('Onboarding: Updating user profile');
      await updateUserProfile({
        hasCompletedOnboarding: true,
        fitnessGoals: [onboardingData.primaryGoal, ...onboardingData.secondaryGoals].filter(Boolean),
        experienceLevel: onboardingData.experienceLevel <= 3 ? 'beginner' :
                        onboardingData.experienceLevel <= 7 ? 'intermediate' : 'advanced',
        preferredWorkoutTypes: onboardingData.workoutTypes
      });
      console.log('Onboarding: User profile updated');

      // Force refresh the user profile to ensure it's updated
      console.log('Onboarding: Refreshing user profile');
      await refreshUserProfile();

      // Wait a moment for the state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to main app
      console.log('Onboarding: Redirecting to home');
      router.replace('/');

    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Handle error - maybe show a toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={nextStep} />;
      case 1:
        return (
          <FitnessBackgroundStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 2:
        return (
          <GoalsMotivationStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <PreferencesStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <PersonalityStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 5:
        return (
          <PersonalLifeStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 6:
        return (
          <LifestyleStep
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 7:
        return (
          <CompletionStep
            data={onboardingData}
            onComplete={completeOnboarding}
            onPrev={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Setup Progress</span>
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} of {TOTAL_STEPS}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="p-6">
              {renderStep()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
