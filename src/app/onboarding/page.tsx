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
import { OnboardingContextService, OnboardingContext } from '@/services/data/onboarding-context-service';
import { Timestamp } from 'firebase/firestore';

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

/**
 * Maps OnboardingData to OnboardingContext format
 */
function mapOnboardingDataToContext(
  userId: string,
  data: OnboardingData
): Omit<OnboardingContext, 'lastUpdated' | 'version'> {
  // Map experience level (1-10) to beginner/intermediate/advanced
  const overallExperience: 'beginner' | 'intermediate' | 'advanced' =
    data.experienceLevel <= 3 ? 'beginner' :
    data.experienceLevel <= 7 ? 'intermediate' : 'advanced';

  // Map communication style to motivation style
  const motivationStyleMap: Record<string, 'encouraging' | 'challenging' | 'analytical' | 'casual'> = {
    'motivational': 'encouraging',
    'challenging': 'challenging',
    'analytical': 'analytical',
    'supportive': 'casual'
  };

  // Map feedback preference to coaching style
  const coachingStyleMap: Record<string, 'detailed' | 'concise' | 'visual' | 'conversational'> = {
    'detailed': 'detailed',
    'concise': 'concise',
    'visual': 'visual'
  };

  // Map session duration
  const sessionDurationMap: Record<number, '15_30' | '30_45' | '45_60' | '60_90' | '90_plus'> = {
    30: '30_45',
    45: '45_60',
    60: '45_60',
    90: '60_90'
  };

  return {
    userId,
    fitnessGoals: {
      primary: (data.primaryGoal as any) || 'general_fitness',
      secondary: data.secondaryGoals,
      targetTimeline: (data.timeline as any) || '3_months',
      priorityLevel: 'medium',
      specificTargets: {}
    },
    experienceLevel: {
      overall: overallExperience,
      yearsTraining: Math.floor(data.experienceLevel / 2),
      specificExperience: {
        weightlifting: data.workoutTypes.includes('strength') || data.workoutTypes.includes('weightlifting') ? overallExperience : 'none',
        cardio: data.workoutTypes.includes('cardio') ? overallExperience : 'beginner',
        flexibility: data.workoutTypes.includes('yoga') || data.workoutTypes.includes('flexibility') ? overallExperience : 'none',
        sports: data.workoutTypes.includes('sports') ? overallExperience : 'none'
      },
      previousInjuries: data.previousInjuries,
      limitations: data.currentChallenges
    },
    equipment: {
      available: data.equipmentAccess,
      location: data.equipmentAccess.includes('gym') ? 'gym' : 'home',
      spaceConstraints: 'moderate',
      acquisitionPlans: [],
      budget: 'medium'
    },
    schedule: {
      workoutDays: data.availableDays,
      preferredTimes: data.preferredTimes,
      sessionDuration: sessionDurationMap[data.timeAvailability] || '45_60',
      flexibility: 'somewhat_flexible',
      busyPeriods: [],
      restDayPreferences: []
    },
    preferences: {
      workoutIntensity: data.challengeLevel <= 3 ? 'low' : data.challengeLevel <= 7 ? 'moderate' : 'high',
      musicPreferences: [],
      motivationStyle: motivationStyleMap[data.communicationStyle] || 'encouraging',
      socialPreference: 'solo',
      coachingStyle: coachingStyleMap[data.feedbackPreference] || 'conversational',
      feedbackFrequency: data.feedbackPreference === 'detailed' ? 'frequent' :
                         data.feedbackPreference === 'concise' ? 'minimal' : 'moderate'
    },
    healthInfo: {
      medicalConditions: [],
      medications: [],
      dietaryRestrictions: [],
      allergies: [],
      sleepPattern: {
        averageHours: data.sleepQuality >= 7 ? 8 : 6,
        quality: data.sleepQuality >= 8 ? 'excellent' :
                 data.sleepQuality >= 6 ? 'good' :
                 data.sleepQuality >= 4 ? 'fair' : 'poor',
        schedule: 'regular'
      },
      stressLevel: data.stressLevel <= 3 ? 'low' : data.stressLevel <= 7 ? 'moderate' : 'high',
      energyLevels: data.sleepQuality >= 7 ? 'high' : data.sleepQuality >= 5 ? 'moderate' : 'low'
    },
    tracking: {
      progressPhotos: false,
      bodyMeasurements: true,
      performanceMetrics: true,
      moodTracking: false,
      nutritionTracking: data.nutritionHabits.length > 0,
      sleepTracking: false
    }
  };
}

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

      // Create onboarding context for AI personalization
      console.log('Onboarding: Creating onboarding context');
      const contextData = mapOnboardingDataToContext(user.uid, onboardingData);
      await OnboardingContextService.createOnboardingContext(user.uid, contextData);
      console.log('Onboarding: Onboarding context created successfully');

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

      // Force refresh the user profile to ensure it&apos;s updated
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
