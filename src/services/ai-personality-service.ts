import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { OnboardingData } from '@/app/onboarding/page';

export interface AIPersonalityProfile {
  userId: string;
  // Fitness Profile
  experienceLevel: number; // 1-10 scale
  fitnessGoals: {
    primary: string;
    secondary: string[];
    timeline: string;
  };
  workoutPreferences: {
    types: string[];
    duration: number;
    frequency: number;
    intensity: number;
  };
  // Personality Traits
  communicationStyle: 'motivational' | 'analytical' | 'supportive' | 'challenging';
  feedbackPreference: 'detailed' | 'concise' | 'visual';
  motivationFactors: string[];
  // Lifestyle Context
  schedule: {
    availableDays: string[];
    preferredTimes: string[];
    timeConstraints: string[];
  };
  // Learning & Adaptation
  learningStyle: 'visual' | 'auditory' | 'kinesthetic';
  adaptationRate: number; // How quickly to adjust recommendations
  // Health & Safety
  previousInjuries: string[];
  currentActivity: string;
  stressLevel: number;
  sleepQuality: number;
  nutritionHabits: string;
  // Equipment & Environment
  equipmentAccess: string[];
  // AI Coaching Preferences
  challengeLevel: number; // 1-10 scale
  // Personal Life Context
  personalGoals: string[];
  lifeValues: string[];
  currentChallenges: string[];
  personalMotivation: string;
  lifeContext: string;
  supportSystem: string[];
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number; // For profile evolution tracking
}

export const createAIPersonalityProfile = async (
  userId: string,
  onboardingData: OnboardingData
): Promise<AIPersonalityProfile> => {
  try {
    // Helper function to clean undefined values
    const cleanValue = (value: any, defaultValue: any) => {
      return value !== undefined && value !== null ? value : defaultValue;
    };

    // Ensure all required fields have valid values and no undefined
    const profile: AIPersonalityProfile = {
      userId,
      experienceLevel: cleanValue(onboardingData.experienceLevel, 1),
      fitnessGoals: {
        primary: cleanValue(onboardingData.primaryGoal, ''),
        secondary: cleanValue(onboardingData.secondaryGoals, []),
        timeline: cleanValue(onboardingData.timeline, ''),
      },
      workoutPreferences: {
        types: cleanValue(onboardingData.workoutTypes, []),
        duration: cleanValue(onboardingData.timeAvailability, 30),
        frequency: cleanValue(onboardingData.workoutFrequency, 3),
        intensity: cleanValue(onboardingData.challengeLevel, 5),
      },
      communicationStyle: cleanValue(onboardingData.communicationStyle, 'motivational'),
      feedbackPreference: cleanValue(onboardingData.feedbackPreference, 'detailed'),
      motivationFactors: cleanValue(onboardingData.motivationFactors, []),
      schedule: {
        availableDays: cleanValue(onboardingData.availableDays, []),
        preferredTimes: cleanValue(onboardingData.preferredTimes, []),
        timeConstraints: [], // Can be expanded later
      },
      learningStyle: cleanValue(onboardingData.learningStyle, 'visual'),
      adaptationRate: 0.5, // Default moderate adaptation rate
      previousInjuries: cleanValue(onboardingData.previousInjuries, []),
      currentActivity: cleanValue(onboardingData.currentActivity, ''),
      stressLevel: cleanValue(onboardingData.stressLevel, 5),
      sleepQuality: cleanValue(onboardingData.sleepQuality, 7),
      nutritionHabits: cleanValue(onboardingData.nutritionHabits, ''),
      equipmentAccess: cleanValue(onboardingData.equipmentAccess, []),
      challengeLevel: cleanValue(onboardingData.challengeLevel, 5),
      personalGoals: cleanValue(onboardingData.personalGoals, []),
      lifeValues: cleanValue(onboardingData.lifeValues, []),
      currentChallenges: cleanValue(onboardingData.currentChallenges, []),
      personalMotivation: cleanValue(onboardingData.personalMotivation, ''),
      lifeContext: cleanValue(onboardingData.lifeContext, ''),
      supportSystem: cleanValue(onboardingData.supportSystem, []),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      version: 1,
    };

    console.log('Creating AI personality profile for user:', userId);
    console.log('Profile data keys:', Object.keys(profile));

    const profileRef = doc(db, 'ai_personality_profiles', userId);
    console.log('Document reference path:', profileRef.path);

    await setDoc(profileRef, profile);

    console.log('AI personality profile created successfully');
    return profile;
  } catch (error) {
    console.error('Error creating AI personality profile:', error);
    throw new Error(`Failed to create AI personality profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getAIPersonalityProfile = async (userId: string): Promise<AIPersonalityProfile | null> => {
  try {
    const profileRef = doc(db, 'ai_personality_profiles', userId);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      return profileSnap.data() as AIPersonalityProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching AI personality profile:', error);
    return null;
  }
};

export const updateAIPersonalityProfile = async (
  userId: string, 
  updates: Partial<AIPersonalityProfile>
): Promise<void> => {
  try {
    const profileRef = doc(db, 'ai_personality_profiles', userId);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
      version: (updates.version || 1) + 1,
    };
    
    await updateDoc(profileRef, updateData);
  } catch (error) {
    console.error('Error updating AI personality profile:', error);
    throw error;
  }
};

// Helper function to generate AI coaching context from profile
export const generateAIContext = (profile: AIPersonalityProfile): string => {
  const experienceLevelText = profile.experienceLevel <= 3 ? 'beginner' : 
                             profile.experienceLevel <= 7 ? 'intermediate' : 'advanced';
  
  const intensityText = profile.challengeLevel <= 3 ? 'low' :
                       profile.challengeLevel <= 7 ? 'moderate' : 'high';

  return `User Profile Context:
- Experience Level: ${experienceLevelText} (${profile.experienceLevel}/10)
- Primary Goal: ${profile.fitnessGoals.primary}
- Secondary Goals: ${profile.fitnessGoals.secondary.join(', ')}
- Timeline: ${profile.fitnessGoals.timeline}
- Preferred Workouts: ${profile.workoutPreferences.types.join(', ')}
- Available Time: ${profile.workoutPreferences.duration} minutes
- Workout Frequency: ${profile.workoutPreferences.frequency} times per week
- Communication Style: ${profile.communicationStyle}
- Feedback Preference: ${profile.feedbackPreference}
- Learning Style: ${profile.learningStyle}
- Challenge Level: ${intensityText} (${profile.challengeLevel}/10)
- Available Days: ${profile.schedule.availableDays.join(', ')}
- Preferred Times: ${profile.schedule.preferredTimes.join(', ')}
- Equipment Access: ${profile.equipmentAccess.join(', ')}
- Previous Injuries: ${profile.previousInjuries.length > 0 ? profile.previousInjuries.join(', ') : 'None'}
- Current Activity Level: ${profile.currentActivity}
- Stress Level: ${profile.stressLevel}/10
- Sleep Quality: ${profile.sleepQuality}/10
- Motivation Factors: ${profile.motivationFactors.join(', ')}

Personal Context:
- Personal Goals: ${profile.personalGoals.join(', ')}
- Life Values: ${profile.lifeValues.join(', ')}
- Current Challenges: ${profile.currentChallenges.join(', ')}
- Personal Motivation: ${profile.personalMotivation}
- Life Context: ${profile.lifeContext}
- Support System: ${profile.supportSystem.join(', ')}

Coaching Instructions:
- Adapt communication to ${profile.communicationStyle} style
- Provide ${profile.feedbackPreference} feedback
- Consider ${profile.learningStyle} learning preferences
- Respect injury history and current limitations
- Align recommendations with stated goals and timeline
- Consider available equipment and schedule constraints
- Adjust intensity based on stress and sleep quality
- Connect fitness goals to personal values and life context
- Address current challenges with empathy and practical solutions
- Leverage their support system when appropriate
- Reference their personal motivation to maintain engagement`;
};

// Helper function to calculate compatibility score between users (for social features)
export const calculateCompatibilityScore = (
  profile1: AIPersonalityProfile, 
  profile2: AIPersonalityProfile
): number => {
  let score = 0;
  let factors = 0;

  // Experience level similarity (closer levels = higher score)
  const experienceDiff = Math.abs(profile1.experienceLevel - profile2.experienceLevel);
  score += Math.max(0, 10 - experienceDiff);
  factors++;

  // Common workout types
  const commonWorkouts = profile1.workoutPreferences.types.filter(type => 
    profile2.workoutPreferences.types.includes(type)
  );
  score += commonWorkouts.length * 2;
  factors++;

  // Similar goals
  const commonGoals = profile1.fitnessGoals.secondary.filter(goal => 
    profile2.fitnessGoals.secondary.includes(goal) || goal === profile2.fitnessGoals.primary
  );
  if (profile1.fitnessGoals.primary === profile2.fitnessGoals.primary) {
    score += 5;
  }
  score += commonGoals.length;
  factors++;

  // Similar schedule availability
  const commonDays = profile1.schedule.availableDays.filter(day => 
    profile2.schedule.availableDays.includes(day)
  );
  score += commonDays.length;
  factors++;

  // Similar equipment access
  const commonEquipment = profile1.equipmentAccess.filter(equipment => 
    profile2.equipmentAccess.includes(equipment)
  );
  score += commonEquipment.length;
  factors++;

  return Math.min(100, (score / factors) * 10); // Normalize to 0-100 scale
};

export default {
  createAIPersonalityProfile,
  getAIPersonalityProfile,
  updateAIPersonalityProfile,
  generateAIContext,
  calculateCompatibilityScore,
};
