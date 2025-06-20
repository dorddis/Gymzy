import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  increment 
} from 'firebase/firestore';

// User Context Interfaces
export interface WorkoutPatterns {
  frequency: number; // workouts per week
  preferredTimes: string[]; // preferred workout times
  averageVolume: number; // average total volume per workout
  progressionRate: number; // rate of progression (0-1)
  consistencyScore: number; // consistency score (0-1)
  averageDuration: number; // average workout duration in minutes
  preferredExercises: string[]; // most frequently used exercises
  lastUpdated: Timestamp;
}

export interface PerformanceMetrics {
  strengthProgression: Record<string, number[]>; // exercise -> weight progression
  enduranceProgression: Record<string, number[]>; // exercise -> endurance metrics
  volumeProgression: number[]; // total volume over time
  rpePatterns: number[]; // RPE patterns over time
  recoveryTimes: number[]; // recovery times between workouts
  injuryIndicators: string[]; // potential injury warning signs
  lastUpdated: Timestamp;
}

export interface BehavioralPatterns {
  workoutSkipReasons: Record<string, number>; // reasons for skipping workouts
  motivationLevels: number[]; // motivation levels over time (1-10)
  socialEngagement: {
    likesGiven: number;
    commentsPosted: number;
    workoutsShared: number;
    followersGained: number;
  };
  appUsagePatterns: {
    sessionDurations: number[];
    featuresUsed: Record<string, number>;
    peakUsageTimes: string[];
  };
  goalAdjustments: Array<{
    oldGoal: string;
    newGoal: string;
    reason: string;
    timestamp: Timestamp;
  }>;
  lastUpdated: Timestamp;
}

export interface LifestyleContext {
  sleepQuality: number[]; // sleep quality ratings over time (1-10)
  stressLevels: number[]; // stress levels over time (1-10)
  energyLevels: number[]; // energy levels over time (1-10)
  nutritionHabits: {
    mealsLogged: number;
    hydrationLevel: number; // 1-10
    supplementUsage: string[];
  };
  externalFactors: {
    workSchedule: string; // 'regular' | 'irregular' | 'shift'
    travelFrequency: string; // 'none' | 'occasional' | 'frequent'
    seasonalPatterns: Record<string, any>; // seasonal behavior changes
  };
  lastUpdated: Timestamp;
}

export interface UserContext {
  userId: string;
  workoutPatterns: WorkoutPatterns;
  performanceMetrics: PerformanceMetrics;
  behavioralPatterns: BehavioralPatterns;
  lifestyleContext: LifestyleContext;
  aiInsights: {
    personalityType: string;
    motivationTriggers: string[];
    optimalWorkoutTimes: string[];
    recommendedRestDays: number;
    injuryRiskLevel: 'low' | 'medium' | 'high';
    progressPrediction: number; // predicted progress rate
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Contextual Data Collection Service
export class ContextualDataService {
  
  // Initialize user context
  static async initializeUserContext(userId: string): Promise<void> {
    try {
      const contextRef = doc(db, 'user_context', userId);
      const contextSnap = await getDoc(contextRef);
      
      if (!contextSnap.exists()) {
        const initialContext: UserContext = {
          userId,
          workoutPatterns: {
            frequency: 0,
            preferredTimes: [],
            averageVolume: 0,
            progressionRate: 0,
            consistencyScore: 0,
            averageDuration: 0,
            preferredExercises: [],
            lastUpdated: Timestamp.now()
          },
          performanceMetrics: {
            strengthProgression: {},
            enduranceProgression: {},
            volumeProgression: [],
            rpePatterns: [],
            recoveryTimes: [],
            injuryIndicators: [],
            lastUpdated: Timestamp.now()
          },
          behavioralPatterns: {
            workoutSkipReasons: {},
            motivationLevels: [],
            socialEngagement: {
              likesGiven: 0,
              commentsPosted: 0,
              workoutsShared: 0,
              followersGained: 0
            },
            appUsagePatterns: {
              sessionDurations: [],
              featuresUsed: {},
              peakUsageTimes: []
            },
            goalAdjustments: [],
            lastUpdated: Timestamp.now()
          },
          lifestyleContext: {
            sleepQuality: [],
            stressLevels: [],
            energyLevels: [],
            nutritionHabits: {
              mealsLogged: 0,
              hydrationLevel: 5,
              supplementUsage: []
            },
            externalFactors: {
              workSchedule: 'regular',
              travelFrequency: 'none',
              seasonalPatterns: {}
            },
            lastUpdated: Timestamp.now()
          },
          aiInsights: {
            personalityType: 'balanced',
            motivationTriggers: [],
            optimalWorkoutTimes: [],
            recommendedRestDays: 1,
            injuryRiskLevel: 'low',
            progressPrediction: 0.5
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        await setDoc(contextRef, initialContext);
      }
    } catch (error) {
      console.error('Error initializing user context:', error);
      throw error;
    }
  }

  // Update workout patterns after each workout
  static async updateWorkoutPatterns(userId: string, workoutData: any): Promise<void> {
    try {
      const contextRef = doc(db, 'user_context', userId);
      const contextSnap = await getDoc(contextRef);
      
      if (!contextSnap.exists()) {
        await this.initializeUserContext(userId);
      }
      
      const context = contextSnap.data() as UserContext;
      const workoutTime = new Date().getHours();
      const timeSlot = this.getTimeSlot(workoutTime);
      
      // Calculate workout volume
      const totalVolume = workoutData.exercises?.reduce((total: number, exercise: any) => {
        return total + exercise.sets.reduce((setTotal: number, set: any) => {
          return setTotal + (set.weight * set.reps);
        }, 0);
      }, 0) || 0;
      
      // Update patterns
      const updatedPatterns: Partial<WorkoutPatterns> = {
        averageVolume: this.calculateMovingAverage(
          context.workoutPatterns.averageVolume, 
          totalVolume, 
          10
        ),
        averageDuration: this.calculateMovingAverage(
          context.workoutPatterns.averageDuration,
          workoutData.duration || 0,
          10
        ),
        preferredTimes: this.updatePreferredTimes(
          Array.isArray(context.workoutPatterns.preferredTimes) ? context.workoutPatterns.preferredTimes : [],
          timeSlot
        ),
        preferredExercises: this.updatePreferredExercises(
          Array.isArray(context.workoutPatterns.preferredExercises) ? context.workoutPatterns.preferredExercises : [],
          workoutData.exercises?.map((ex: any) => ex.name) || []
        ),
        lastUpdated: Timestamp.now()
      };
      
      await updateDoc(contextRef, {
        'workoutPatterns': { ...context.workoutPatterns, ...updatedPatterns },
        'updatedAt': Timestamp.now()
      });
      
    } catch (error) {
      console.error('Error updating workout patterns:', error);
      throw error;
    }
  }

  // Update performance metrics
  static async updatePerformanceMetrics(userId: string, exerciseData: any[]): Promise<void> {
    try {
      const contextRef = doc(db, 'user_context', userId);
      const contextSnap = await getDoc(contextRef);
      
      if (!contextSnap.exists()) return;
      
      const context = contextSnap.data() as UserContext;
      const strengthProgression = { ...context.performanceMetrics.strengthProgression };
      const rpeValues: number[] = [];
      
      // Update strength progression for each exercise
      exerciseData.forEach(exercise => {
        const exerciseName = exercise.name;
        const maxWeight = Math.max(...exercise.sets.map((set: any) => set.weight || 0));
        const avgRpe = exercise.sets.reduce((sum: number, set: any) => sum + (set.rpe || 8), 0) / exercise.sets.length;
        
        if (maxWeight > 0) {
          if (!strengthProgression[exerciseName]) {
            strengthProgression[exerciseName] = [];
          }
          strengthProgression[exerciseName].push(maxWeight);
          
          // Keep only last 20 entries
          if (strengthProgression[exerciseName].length > 20) {
            strengthProgression[exerciseName] = strengthProgression[exerciseName].slice(-20);
          }
        }
        
        rpeValues.push(avgRpe);
      });
      
      // Update RPE patterns
      const updatedRpePatterns = [...context.performanceMetrics.rpePatterns, ...rpeValues].slice(-50);
      
      await updateDoc(contextRef, {
        'performanceMetrics.strengthProgression': strengthProgression,
        'performanceMetrics.rpePatterns': updatedRpePatterns,
        'performanceMetrics.lastUpdated': Timestamp.now(),
        'updatedAt': Timestamp.now()
      });
      
    } catch (error) {
      console.error('Error updating performance metrics:', error);
      throw error;
    }
  }

  // Track behavioral patterns
  static async trackBehavioralPattern(
    userId: string, 
    patternType: string, 
    data: any
  ): Promise<void> {
    try {
      const contextRef = doc(db, 'user_context', userId);
      
      switch (patternType) {
        case 'motivation_level':
          await updateDoc(contextRef, {
            'behavioralPatterns.motivationLevels': [...(await this.getArrayField(contextRef, 'behavioralPatterns.motivationLevels') || []), data.level].slice(-30),
            'behavioralPatterns.lastUpdated': Timestamp.now(),
            'updatedAt': Timestamp.now()
          });
          break;
          
        case 'social_engagement':
          await updateDoc(contextRef, {
            [`behavioralPatterns.socialEngagement.${data.action}`]: increment(1),
            'behavioralPatterns.lastUpdated': Timestamp.now(),
            'updatedAt': Timestamp.now()
          });
          break;
          
        case 'feature_usage':
          await updateDoc(contextRef, {
            [`behavioralPatterns.appUsagePatterns.featuresUsed.${data.feature}`]: increment(1),
            'behavioralPatterns.lastUpdated': Timestamp.now(),
            'updatedAt': Timestamp.now()
          });
          break;
      }
    } catch (error) {
      console.error('Error tracking behavioral pattern:', error);
      throw error;
    }
  }

  // Update lifestyle context
  static async updateLifestyleContext(
    userId: string, 
    contextType: string, 
    value: any
  ): Promise<void> {
    try {
      const contextRef = doc(db, 'user_context', userId);
      
      switch (contextType) {
        case 'sleep_quality':
          await updateDoc(contextRef, {
            'lifestyleContext.sleepQuality': [...(await this.getArrayField(contextRef, 'lifestyleContext.sleepQuality') || []), value].slice(-30),
            'lifestyleContext.lastUpdated': Timestamp.now(),
            'updatedAt': Timestamp.now()
          });
          break;
          
        case 'stress_level':
          await updateDoc(contextRef, {
            'lifestyleContext.stressLevels': [...(await this.getArrayField(contextRef, 'lifestyleContext.stressLevels') || []), value].slice(-30),
            'lifestyleContext.lastUpdated': Timestamp.now(),
            'updatedAt': Timestamp.now()
          });
          break;
          
        case 'energy_level':
          await updateDoc(contextRef, {
            'lifestyleContext.energyLevels': [...(await this.getArrayField(contextRef, 'lifestyleContext.energyLevels') || []), value].slice(-30),
            'lifestyleContext.lastUpdated': Timestamp.now(),
            'updatedAt': Timestamp.now()
          });
          break;
      }
    } catch (error) {
      console.error('Error updating lifestyle context:', error);
      throw error;
    }
  }

  // Get user context
  static async getUserContext(userId: string): Promise<UserContext | null> {
    try {
      const contextRef = doc(db, 'user_context', userId);
      const contextSnap = await getDoc(contextRef);
      
      if (contextSnap.exists()) {
        return contextSnap.data() as UserContext;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  // Helper methods
  private static calculateMovingAverage(current: number, newValue: number, windowSize: number): number {
    return (current * (windowSize - 1) + newValue) / windowSize;
  }

  private static getTimeSlot(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private static updatePreferredTimes(current: string[], newTime: string): string[] {
    const safeCurrentTimes = Array.isArray(current) ? current : [];
    const updated = [...safeCurrentTimes, newTime];
    const counts = updated.reduce((acc, time) => {
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([time]) => time);
  }

  private static updatePreferredExercises(current: string[], newExercises: string[]): string[] {
    const safeCurrentExercises = Array.isArray(current) ? current : [];
    const safeNewExercises = Array.isArray(newExercises) ? newExercises : [];
    const updated = [...safeCurrentExercises, ...safeNewExercises];
    const counts = updated.reduce((acc, exercise) => {
      acc[exercise] = (acc[exercise] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([exercise]) => exercise);
  }

  private static async getArrayField(docRef: any, fieldPath: string): Promise<any[]> {
    const doc = await getDoc(docRef);
    if (doc.exists()) {
      const data = doc.data();
      const fields = fieldPath.split('.');
      let value = data;
      for (const field of fields) {
        value = value?.[field];
      }
      return Array.isArray(value) ? value : [];
    }
    return [];
  }
}

export default ContextualDataService;
