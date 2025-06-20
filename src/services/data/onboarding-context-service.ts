import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface OnboardingContext {
  userId: string;
  
  // Fitness Goals
  fitnessGoals: {
    primary: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength' | 'general_fitness' | 'sport_specific';
    secondary: string[];
    targetTimeline: '1_month' | '3_months' | '6_months' | '1_year' | 'ongoing';
    priorityLevel: 'low' | 'medium' | 'high';
    specificTargets?: {
      weightTarget?: number;
      bodyFatTarget?: number;
      strengthTargets?: Record<string, number>;
    };
  };
  
  // Experience Level
  experienceLevel: {
    overall: 'beginner' | 'intermediate' | 'advanced';
    yearsTraining: number;
    specificExperience: {
      weightlifting: 'none' | 'beginner' | 'intermediate' | 'advanced';
      cardio: 'none' | 'beginner' | 'intermediate' | 'advanced';
      flexibility: 'none' | 'beginner' | 'intermediate' | 'advanced';
      sports: 'none' | 'beginner' | 'intermediate' | 'advanced';
    };
    previousInjuries: string[];
    limitations: string[];
  };
  
  // Equipment & Environment
  equipment: {
    available: string[];
    location: 'home' | 'gym' | 'both' | 'outdoor';
    spaceConstraints: 'minimal' | 'moderate' | 'spacious';
    acquisitionPlans: string[];
    budget: 'low' | 'medium' | 'high' | 'unlimited';
  };
  
  // Schedule & Availability
  schedule: {
    workoutDays: string[]; // ['monday', 'wednesday', 'friday']
    preferredTimes: string[]; // ['morning', 'afternoon', 'evening']
    sessionDuration: '15_30' | '30_45' | '45_60' | '60_90' | '90_plus';
    flexibility: 'rigid' | 'somewhat_flexible' | 'very_flexible';
    busyPeriods: string[];
    restDayPreferences: string[];
  };
  
  // Personal Preferences
  preferences: {
    workoutIntensity: 'low' | 'moderate' | 'high' | 'variable';
    musicPreferences: string[];
    motivationStyle: 'encouraging' | 'challenging' | 'analytical' | 'casual';
    socialPreference: 'solo' | 'partner' | 'group' | 'mixed';
    coachingStyle: 'detailed' | 'concise' | 'visual' | 'conversational';
    feedbackFrequency: 'minimal' | 'moderate' | 'frequent';
  };
  
  // Health & Medical
  healthInfo: {
    medicalConditions: string[];
    medications: string[];
    dietaryRestrictions: string[];
    allergies: string[];
    sleepPattern: {
      averageHours: number;
      quality: 'poor' | 'fair' | 'good' | 'excellent';
      schedule: 'regular' | 'irregular';
    };
    stressLevel: 'low' | 'moderate' | 'high';
    energyLevels: 'low' | 'moderate' | 'high' | 'variable';
  };
  
  // Tracking Preferences
  tracking: {
    progressPhotos: boolean;
    bodyMeasurements: boolean;
    performanceMetrics: boolean;
    moodTracking: boolean;
    nutritionTracking: boolean;
    sleepTracking: boolean;
  };
  
  lastUpdated: Timestamp;
  version: number; // for tracking context evolution
}

export class OnboardingContextService {
  private static readonly COLLECTION_NAME = 'onboarding_contexts';

  static async getOnboardingContext(userId: string): Promise<OnboardingContext | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as OnboardingContext;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting onboarding context:', error);
      return null;
    }
  }

  static async createOnboardingContext(
    userId: string,
    context: Partial<OnboardingContext>
  ): Promise<OnboardingContext> {
    try {
      const defaultContext: OnboardingContext = {
        userId,
        fitnessGoals: {
          primary: 'general_fitness',
          secondary: [],
          targetTimeline: '3_months',
          priorityLevel: 'medium',
          specificTargets: {}
        },
        experienceLevel: {
          overall: 'beginner',
          yearsTraining: 0,
          specificExperience: {
            weightlifting: 'none',
            cardio: 'beginner',
            flexibility: 'none',
            sports: 'none'
          },
          previousInjuries: [],
          limitations: []
        },
        equipment: {
          available: [],
          location: 'home',
          spaceConstraints: 'moderate',
          acquisitionPlans: [],
          budget: 'medium'
        },
        schedule: {
          workoutDays: ['monday', 'wednesday', 'friday'],
          preferredTimes: ['evening'],
          sessionDuration: '45_60',
          flexibility: 'somewhat_flexible',
          busyPeriods: [],
          restDayPreferences: ['sunday']
        },
        preferences: {
          workoutIntensity: 'moderate',
          musicPreferences: [],
          motivationStyle: 'encouraging',
          socialPreference: 'solo',
          coachingStyle: 'conversational',
          feedbackFrequency: 'moderate'
        },
        healthInfo: {
          medicalConditions: [],
          medications: [],
          dietaryRestrictions: [],
          allergies: [],
          sleepPattern: {
            averageHours: 7,
            quality: 'good',
            schedule: 'regular'
          },
          stressLevel: 'moderate',
          energyLevels: 'moderate'
        },
        tracking: {
          progressPhotos: false,
          bodyMeasurements: true,
          performanceMetrics: true,
          moodTracking: false,
          nutritionTracking: false,
          sleepTracking: false
        },
        lastUpdated: Timestamp.now(),
        version: 1
      };

      // Merge with provided context
      const finalContext = { ...defaultContext, ...context };
      
      await setDoc(doc(db, this.COLLECTION_NAME, userId), finalContext);
      return finalContext;
    } catch (error) {
      console.error('Error creating onboarding context:', error);
      throw new Error('Failed to create onboarding context');
    }
  }

  static async updateOnboardingContext(
    userId: string,
    updates: Partial<OnboardingContext>
  ): Promise<OnboardingContext> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      const currentDoc = await getDoc(docRef);
      
      if (!currentDoc.exists()) {
        throw new Error('Onboarding context not found');
      }

      const currentContext = currentDoc.data() as OnboardingContext;
      const updatedContext = {
        ...currentContext,
        ...updates,
        lastUpdated: Timestamp.now(),
        version: currentContext.version + 1
      };

      await updateDoc(docRef, updatedContext);
      return updatedContext;
    } catch (error) {
      console.error('Error updating onboarding context:', error);
      throw new Error('Failed to update onboarding context');
    }
  }

  static async updateFitnessGoals(
    userId: string,
    goals: Partial<OnboardingContext['fitnessGoals']>
  ): Promise<void> {
    try {
      const context = await this.getOnboardingContext(userId);
      if (!context) {
        throw new Error('Onboarding context not found');
      }

      const updatedGoals = { ...context.fitnessGoals, ...goals };
      await this.updateOnboardingContext(userId, { fitnessGoals: updatedGoals });
    } catch (error) {
      console.error('Error updating fitness goals:', error);
      throw new Error('Failed to update fitness goals');
    }
  }

  static async updateExperienceLevel(
    userId: string,
    experience: Partial<OnboardingContext['experienceLevel']>
  ): Promise<void> {
    try {
      const context = await this.getOnboardingContext(userId);
      if (!context) {
        throw new Error('Onboarding context not found');
      }

      const updatedExperience = { ...context.experienceLevel, ...experience };
      await this.updateOnboardingContext(userId, { experienceLevel: updatedExperience });
    } catch (error) {
      console.error('Error updating experience level:', error);
      throw new Error('Failed to update experience level');
    }
  }

  static async updateEquipment(
    userId: string,
    equipment: Partial<OnboardingContext['equipment']>
  ): Promise<void> {
    try {
      const context = await this.getOnboardingContext(userId);
      if (!context) {
        throw new Error('Onboarding context not found');
      }

      const updatedEquipment = { ...context.equipment, ...equipment };
      await this.updateOnboardingContext(userId, { equipment: updatedEquipment });
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw new Error('Failed to update equipment');
    }
  }

  static async updateSchedule(
    userId: string,
    schedule: Partial<OnboardingContext['schedule']>
  ): Promise<void> {
    try {
      const context = await this.getOnboardingContext(userId);
      if (!context) {
        throw new Error('Onboarding context not found');
      }

      const updatedSchedule = { ...context.schedule, ...schedule };
      await this.updateOnboardingContext(userId, { schedule: updatedSchedule });
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw new Error('Failed to update schedule');
    }
  }

  static async updatePreferences(
    userId: string,
    preferences: Partial<OnboardingContext['preferences']>
  ): Promise<void> {
    try {
      const context = await this.getOnboardingContext(userId);
      if (!context) {
        throw new Error('Onboarding context not found');
      }

      const updatedPreferences = { ...context.preferences, ...preferences };
      await this.updateOnboardingContext(userId, { preferences: updatedPreferences });
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  static async updateHealthInfo(
    userId: string,
    healthInfo: Partial<OnboardingContext['healthInfo']>
  ): Promise<void> {
    try {
      const context = await this.getOnboardingContext(userId);
      if (!context) {
        throw new Error('Onboarding context not found');
      }

      const updatedHealthInfo = { ...context.healthInfo, ...healthInfo };
      await this.updateOnboardingContext(userId, { healthInfo: updatedHealthInfo });
    } catch (error) {
      console.error('Error updating health info:', error);
      throw new Error('Failed to update health info');
    }
  }
}
