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
  limit as firestoreLimit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { ContextualDataService, UserContext } from './contextual-data-service';
import { getRecentWorkouts } from './workout-service';

// AI Recommendation Interfaces
export interface AIRecommendation {
  id: string;
  userId: string;
  type: 'workout' | 'exercise' | 'recovery' | 'motivation' | 'nutrition' | 'form' | 'progression';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  content: {
    title: string;
    description: string;
    actionItems: string[];
    reasoning: string;
    expectedBenefit: string;
  };
  metadata: {
    confidence: number; // 0-1
    category: string;
    tags: string[];
    estimatedImpact: 'low' | 'medium' | 'high';
  };
  status: 'pending' | 'viewed' | 'accepted' | 'dismissed' | 'completed';
  createdAt: Timestamp;
  expiresAt: Timestamp;
  viewedAt?: Timestamp;
  actionTakenAt?: Timestamp;
}

export interface WorkoutRecommendation {
  workoutType: string;
  exercises: Array<{
    exerciseId: string;
    sets: number;
    reps: string;
    weight?: number;
    reasoning: string;
  }>;
  estimatedDuration: number;
  targetMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  reasoning: string;
}

export interface RecoveryRecommendation {
  type: 'rest' | 'active_recovery' | 'deload' | 'mobility';
  duration: string;
  activities: string[];
  reasoning: string;
  urgency: 'low' | 'medium' | 'high';
}

// AI Recommendations Service
export class AIRecommendationsService {
  
  // Generate personalized recommendations for a user
  static async generateRecommendations(userId: string): Promise<AIRecommendation[]> {
    try {
      // Get user context and recent workouts
      const userContext = await ContextualDataService.getUserContext(userId);
      const recentWorkouts = await getRecentWorkouts(userId, 10);
      
      if (!userContext) {
        return this.generateDefaultRecommendations(userId);
      }

      const recommendations: AIRecommendation[] = [];

      // Generate workout recommendations
      const workoutRecs = await this.generateWorkoutRecommendations(userId, userContext, recentWorkouts);
      recommendations.push(...workoutRecs);

      // Generate recovery recommendations
      const recoveryRecs = await this.generateRecoveryRecommendations(userId, userContext, recentWorkouts);
      recommendations.push(...recoveryRecs);

      // Generate motivation recommendations
      const motivationRecs = await this.generateMotivationRecommendations(userId, userContext);
      recommendations.push(...motivationRecs);

      // Generate progression recommendations
      const progressionRecs = await this.generateProgressionRecommendations(userId, userContext, recentWorkouts);
      recommendations.push(...progressionRecs);

      // Save recommendations to database
      await this.saveRecommendations(userId, recommendations);

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.generateDefaultRecommendations(userId);
    }
  }

  // Generate workout recommendations based on user context
  static async generateWorkoutRecommendations(
    userId: string, 
    userContext: UserContext, 
    recentWorkouts: any[]
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    const { workoutPatterns, performanceMetrics, lifestyleContext } = userContext;

    // Analyze workout frequency
    const daysSinceLastWorkout = this.getDaysSinceLastWorkout(recentWorkouts);
    
    if (daysSinceLastWorkout >= 3) {
      recommendations.push({
        id: `workout_frequency_${Date.now()}`,
        userId,
        type: 'workout',
        priority: daysSinceLastWorkout >= 5 ? 'high' : 'medium',
        content: {
          title: 'Time for Your Next Workout!',
          description: `It's been ${daysSinceLastWorkout} days since your last workout. Let's get back on track!`,
          actionItems: [
            'Start with a light warm-up',
            'Choose exercises you enjoy',
            'Focus on form over intensity'
          ],
          reasoning: 'Consistent workout frequency is crucial for maintaining progress and building habits.',
          expectedBenefit: 'Maintain momentum and prevent fitness regression'
        },
        metadata: {
          confidence: 0.9,
          category: 'frequency',
          tags: ['consistency', 'habit-building'],
          estimatedImpact: 'high'
        },
        status: 'pending',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours
      });
    }

    // Analyze muscle group balance
    const muscleGroupBalance = this.analyzeMuscleGroupBalance(recentWorkouts);
    const undertrainedMuscles = Object.entries(muscleGroupBalance)
      .filter(([_, frequency]) => frequency < 0.3)
      .map(([muscle]) => muscle);

    if (undertrainedMuscles.length > 0) {
      recommendations.push({
        id: `muscle_balance_${Date.now()}`,
        userId,
        type: 'workout',
        priority: 'medium',
        content: {
          title: 'Balance Your Training',
          description: `Your ${undertrainedMuscles.join(', ')} could use more attention for balanced development.`,
          actionItems: [
            `Add exercises targeting ${undertrainedMuscles[0]}`,
            'Consider a full-body workout approach',
            'Track muscle group frequency'
          ],
          reasoning: 'Balanced muscle development prevents imbalances and reduces injury risk.',
          expectedBenefit: 'Improved overall strength and reduced injury risk'
        },
        metadata: {
          confidence: 0.8,
          category: 'balance',
          tags: ['muscle-balance', 'injury-prevention'],
          estimatedImpact: 'medium'
        },
        status: 'pending',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) // 3 days
      });
    }

    // Analyze workout timing based on energy levels
    const optimalWorkoutTime = this.getOptimalWorkoutTime(userContext);
    if (optimalWorkoutTime) {
      recommendations.push({
        id: `timing_${Date.now()}`,
        userId,
        type: 'workout',
        priority: 'low',
        content: {
          title: 'Optimize Your Workout Timing',
          description: `Based on your energy patterns, ${optimalWorkoutTime} might be your best workout time.`,
          actionItems: [
            `Try scheduling workouts in the ${optimalWorkoutTime}`,
            'Track how you feel during different workout times',
            'Adjust your schedule gradually'
          ],
          reasoning: 'Working out when your energy is highest can improve performance and consistency.',
          expectedBenefit: 'Better workout performance and consistency'
        },
        metadata: {
          confidence: 0.6,
          category: 'timing',
          tags: ['optimization', 'energy'],
          estimatedImpact: 'medium'
        },
        status: 'pending',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
      });
    }

    return recommendations;
  }

  // Generate recovery recommendations
  static async generateRecoveryRecommendations(
    userId: string, 
    userContext: UserContext, 
    recentWorkouts: any[]
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    const { performanceMetrics, lifestyleContext } = userContext;

    // Analyze RPE patterns for overtraining
    const avgRPE = this.calculateAverageRPE(performanceMetrics.rpePatterns);
    if (avgRPE > 8.5) {
      recommendations.push({
        id: `recovery_rpe_${Date.now()}`,
        userId,
        type: 'recovery',
        priority: 'high',
        content: {
          title: 'Consider a Recovery Day',
          description: 'Your recent workouts show high intensity. Your body might benefit from active recovery.',
          actionItems: [
            'Take 1-2 days of active recovery',
            'Focus on light stretching or walking',
            'Ensure adequate sleep and nutrition'
          ],
          reasoning: 'High RPE patterns indicate potential overreaching and need for recovery.',
          expectedBenefit: 'Prevent overtraining and improve subsequent workout quality'
        },
        metadata: {
          confidence: 0.85,
          category: 'overtraining',
          tags: ['recovery', 'rpe', 'overtraining'],
          estimatedImpact: 'high'
        },
        status: 'pending',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)) // 2 days
      });
    }

    // Analyze sleep quality impact
    const avgSleepQuality = this.calculateAverage(lifestyleContext.sleepQuality);
    if (avgSleepQuality < 6) {
      recommendations.push({
        id: `sleep_recovery_${Date.now()}`,
        userId,
        type: 'recovery',
        priority: 'medium',
        content: {
          title: 'Prioritize Sleep for Better Recovery',
          description: 'Your sleep quality has been below optimal. This affects recovery and performance.',
          actionItems: [
            'Aim for 7-9 hours of sleep',
            'Create a consistent bedtime routine',
            'Avoid screens 1 hour before bed'
          ],
          reasoning: 'Poor sleep quality significantly impacts muscle recovery and workout performance.',
          expectedBenefit: 'Improved recovery, energy levels, and workout performance'
        },
        metadata: {
          confidence: 0.9,
          category: 'sleep',
          tags: ['sleep', 'recovery', 'performance'],
          estimatedImpact: 'high'
        },
        status: 'pending',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)) // 5 days
      });
    }

    return recommendations;
  }

  // Generate motivation recommendations
  static async generateMotivationRecommendations(
    userId: string, 
    userContext: UserContext
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    const { behavioralPatterns } = userContext;

    // Analyze motivation trends
    const recentMotivation = behavioralPatterns.motivationLevels.slice(-7); // Last 7 entries
    const avgMotivation = this.calculateAverage(recentMotivation);

    if (avgMotivation < 6) {
      recommendations.push({
        id: `motivation_boost_${Date.now()}`,
        userId,
        type: 'motivation',
        priority: 'medium',
        content: {
          title: 'Boost Your Motivation',
          description: 'Your motivation levels have been lower recently. Let\'s reignite that fitness fire!',
          actionItems: [
            'Set a small, achievable goal for this week',
            'Try a new type of workout',
            'Connect with the Gymzy community for support'
          ],
          reasoning: 'Low motivation can lead to workout skipping and goal abandonment.',
          expectedBenefit: 'Renewed enthusiasm and consistent workout habits'
        },
        metadata: {
          confidence: 0.7,
          category: 'motivation',
          tags: ['motivation', 'goals', 'community'],
          estimatedImpact: 'medium'
        },
        status: 'pending',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) // 3 days
      });
    }

    return recommendations;
  }

  // Generate progression recommendations
  static async generateProgressionRecommendations(
    userId: string, 
    userContext: UserContext, 
    recentWorkouts: any[]
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    const { performanceMetrics } = userContext;

    // Analyze strength progression
    const stagnantExercises = this.findStagnantExercises(performanceMetrics.strengthProgression);
    
    if (stagnantExercises.length > 0) {
      recommendations.push({
        id: `progression_${Date.now()}`,
        userId,
        type: 'progression',
        priority: 'medium',
        content: {
          title: 'Break Through Plateaus',
          description: `Your progress in ${stagnantExercises[0]} has plateaued. Time to mix things up!`,
          actionItems: [
            'Try different rep ranges (5-8 for strength, 12-15 for endurance)',
            'Add pause reps or tempo variations',
            'Consider deload week with 70% of current weight'
          ],
          reasoning: 'Plateaus are normal but require strategic changes to continue progressing.',
          expectedBenefit: 'Renewed strength gains and improved muscle adaptation'
        },
        metadata: {
          confidence: 0.8,
          category: 'progression',
          tags: ['plateau', 'strength', 'variation'],
          estimatedImpact: 'medium'
        },
        status: 'pending',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
      });
    }

    return recommendations;
  }

  // Helper methods
  private static getDaysSinceLastWorkout(workouts: any[]): number {
    if (workouts.length === 0) return 999;
    
    const lastWorkout = workouts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    const daysDiff = Math.floor(
      (Date.now() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysDiff;
  }

  private static analyzeMuscleGroupBalance(workouts: any[]): Record<string, number> {
    const muscleFrequency: Record<string, number> = {};
    const totalWorkouts = workouts.length;
    
    if (totalWorkouts === 0) return {};

    workouts.forEach(workout => {
      const musclesWorked = new Set<string>();
      
      workout.exercises?.forEach((exercise: any) => {
        exercise.primaryMuscles?.forEach((muscle: string) => {
          musclesWorked.add(muscle);
        });
      });
      
      musclesWorked.forEach(muscle => {
        muscleFrequency[muscle] = (muscleFrequency[muscle] || 0) + 1;
      });
    });

    // Convert to frequency (0-1)
    Object.keys(muscleFrequency).forEach(muscle => {
      muscleFrequency[muscle] = muscleFrequency[muscle] / totalWorkouts;
    });

    return muscleFrequency;
  }

  private static getOptimalWorkoutTime(userContext: UserContext): string | null {
    const { lifestyleContext, workoutPatterns } = userContext;
    
    // Analyze energy levels by time of day
    const energyByTime = this.analyzeEnergyByTime(lifestyleContext.energyLevels);
    const preferredTimes = workoutPatterns.preferredTimes;
    
    if (preferredTimes.length > 0) {
      return preferredTimes[0]; // Most frequent workout time
    }
    
    return null;
  }

  private static calculateAverageRPE(rpePatterns: number[]): number {
    if (rpePatterns.length === 0) return 7; // Default moderate RPE
    return rpePatterns.reduce((sum, rpe) => sum + rpe, 0) / rpePatterns.length;
  }

  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private static findStagnantExercises(strengthProgression: Record<string, number[]>): string[] {
    const stagnant: string[] = [];
    
    Object.entries(strengthProgression).forEach(([exercise, weights]) => {
      if (weights.length >= 5) {
        const lastFive = weights.slice(-5);
        const hasProgression = lastFive.some((weight, index) => 
          index > 0 && weight > lastFive[index - 1]
        );
        
        if (!hasProgression) {
          stagnant.push(exercise);
        }
      }
    });
    
    return stagnant;
  }

  private static analyzeEnergyByTime(energyLevels: number[]): Record<string, number> {
    // This would need more sophisticated time-based analysis
    // For now, return empty object
    return {};
  }

  // Save recommendations to database
  private static async saveRecommendations(userId: string, recommendations: AIRecommendation[]): Promise<void> {
    try {
      const batch = recommendations.map(async (rec) => {
        const recRef = doc(db, 'ai_recommendations', rec.id);
        await setDoc(recRef, rec);
      });
      
      await Promise.all(batch);
    } catch (error) {
      console.error('Error saving recommendations:', error);
    }
  }

  // Get user recommendations
  static async getUserRecommendations(userId: string, limit: number = 10): Promise<AIRecommendation[]> {
    try {
      const q = query(
        collection(db, 'ai_recommendations'),
        where('userId', '==', userId),
        where('status', 'in', ['pending', 'viewed']),
        where('expiresAt', '>', Timestamp.now()),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as AIRecommendation);
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      return [];
    }
  }

  // Generate default recommendations for new users
  private static generateDefaultRecommendations(userId: string): AIRecommendation[] {
    return [
      {
        id: `default_welcome_${Date.now()}`,
        userId,
        type: 'motivation',
        priority: 'medium',
        content: {
          title: 'Welcome to Your Fitness Journey!',
          description: 'Start with a simple workout to build the habit. Consistency beats perfection!',
          actionItems: [
            'Complete your first workout',
            'Set a realistic weekly goal',
            'Explore the exercise library'
          ],
          reasoning: 'Building initial momentum is crucial for long-term success.',
          expectedBenefit: 'Establish a strong foundation for your fitness journey'
        },
        metadata: {
          confidence: 1.0,
          category: 'onboarding',
          tags: ['welcome', 'first-workout'],
          estimatedImpact: 'high'
        },
        status: 'pending',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      }
    ];
  }

  // Mark recommendation as viewed
  static async markRecommendationViewed(recommendationId: string): Promise<void> {
    try {
      const recRef = doc(db, 'ai_recommendations', recommendationId);
      await updateDoc(recRef, {
        status: 'viewed',
        viewedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking recommendation as viewed:', error);
    }
  }

  // Mark recommendation as accepted/completed
  static async markRecommendationCompleted(recommendationId: string): Promise<void> {
    try {
      const recRef = doc(db, 'ai_recommendations', recommendationId);
      await updateDoc(recRef, {
        status: 'completed',
        actionTakenAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking recommendation as completed:', error);
    }
  }
}

export default AIRecommendationsService;
