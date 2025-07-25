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
  addDoc 
} from 'firebase/firestore';
import { ContextualDataService } from '@/services/data/contextual-data-service';
import { getRecentWorkouts } from '@/services/core/workout-service';

// Notification Types
export interface SmartNotification {
  id: string;
  userId: string;
  type: 'workout_reminder' | 'social' | 'ai_insight' | 'habit_support' | 'achievement' | 'recovery';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  metadata: {
    category: string;
    tags: string[];
    scheduledFor?: Timestamp;
    expiresAt?: Timestamp;
    context?: any;
  };
  status: 'pending' | 'sent' | 'read' | 'dismissed' | 'expired';
  createdAt: Timestamp;
  sentAt?: Timestamp;
  readAt?: Timestamp;
}

export interface NotificationPreferences {
  userId: string;
  workoutReminders: {
    enabled: boolean;
    preferredTimes: string[]; // ['09:00', '18:00']
    daysInAdvance: number;
    restDayReminders: boolean;
  };
  socialNotifications: {
    enabled: boolean;
    friendWorkouts: boolean;
    newFollowers: boolean;
    likes: boolean;
    comments: boolean;
  };
  aiInsights: {
    enabled: boolean;
    dailyTips: boolean;
    weeklyProgress: boolean;
    monthlyReviews: boolean;
  };
  habitSupport: {
    enabled: boolean;
    streakReminders: boolean;
    motivationalMessages: boolean;
    goalCelebrations: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // '22:00'
    endTime: string; // '08:00'
  };
  updatedAt: Timestamp;
}

// Smart Notification Service
export class SmartNotificationService {
  
  // Initialize user notification preferences
  static async initializeUserPreferences(userId: string): Promise<void> {
    try {
      const prefsRef = doc(db, 'notification_preferences', userId);
      const prefsSnap = await getDoc(prefsRef);
      
      if (!prefsSnap.exists()) {
        const defaultPrefs: NotificationPreferences = {
          userId,
          workoutReminders: {
            enabled: true,
            preferredTimes: ['09:00', '18:00'],
            daysInAdvance: 1,
            restDayReminders: true
          },
          socialNotifications: {
            enabled: true,
            friendWorkouts: true,
            newFollowers: true,
            likes: false,
            comments: true
          },
          aiInsights: {
            enabled: true,
            dailyTips: true,
            weeklyProgress: true,
            monthlyReviews: true
          },
          habitSupport: {
            enabled: true,
            streakReminders: true,
            motivationalMessages: true,
            goalCelebrations: true
          },
          quietHours: {
            enabled: true,
            startTime: '22:00',
            endTime: '08:00'
          },
          updatedAt: Timestamp.now()
        };
        
        await setDoc(prefsRef, defaultPrefs);
      }
    } catch (error) {
      console.error('Error initializing notification preferences:', error);
      throw error;
    }
  }

  // Generate intelligent workout reminders
  static async generateWorkoutReminders(userId: string): Promise<SmartNotification[]> {
    try {
      const userContext = await ContextualDataService.getUserContext(userId);
      const recentWorkouts = await getRecentWorkouts(userId, 7);
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences?.workoutReminders.enabled || !userContext) {
        return [];
      }

      const notifications: SmartNotification[] = [];
      const now = new Date();
      const daysSinceLastWorkout = this.getDaysSinceLastWorkout(recentWorkouts);
      
      // Workout frequency reminder
      if (daysSinceLastWorkout >= 2) {
        const priority = daysSinceLastWorkout >= 4 ? 'high' : 'medium';
        const scheduledTime = this.getNextOptimalWorkoutTime(userContext, preferences);
        
        notifications.push({
          id: `workout_reminder_${Date.now()}`,
          userId,
          type: 'workout_reminder',
          priority,
          title: daysSinceLastWorkout >= 4 ? 'Time to Get Back on Track!' : 'Ready for Your Next Workout?',
          message: this.generateWorkoutReminderMessage(daysSinceLastWorkout, userContext),
          actionText: 'Start Workout',
          actionUrl: '/workout',
          metadata: {
            category: 'frequency',
            tags: ['workout', 'reminder', 'frequency'],
            scheduledFor: scheduledTime,
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
            context: { daysSinceLastWorkout }
          },
          status: 'pending',
          createdAt: Timestamp.now()
        });
      }

      // Energy-based workout suggestions
      const avgEnergyLevel = this.calculateAverageEnergyLevel(userContext);
      if (avgEnergyLevel > 7) {
        const optimalTime = this.getOptimalHighEnergyWorkoutTime();
        
        notifications.push({
          id: `energy_workout_${Date.now()}`,
          userId,
          type: 'workout_reminder',
          priority: 'medium',
          title: 'High Energy Detected!',
          message: 'Your energy levels are great right now. Perfect time for an intense workout!',
          actionText: 'Crush a Workout',
          actionUrl: '/workout',
          metadata: {
            category: 'energy_optimization',
            tags: ['energy', 'workout', 'optimization'],
            scheduledFor: optimalTime,
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 4 * 60 * 60 * 1000)), // 4 hours
            context: { energyLevel: avgEnergyLevel }
          },
          status: 'pending',
          createdAt: Timestamp.now()
        });
      }

      // Recovery-based rest day recommendations
      const avgRPE = this.calculateAverageRPE(userContext);
      if (avgRPE > 8.5 && preferences.workoutReminders.restDayReminders) {
        notifications.push({
          id: `recovery_reminder_${Date.now()}`,
          userId,
          type: 'recovery',
          priority: 'high',
          title: 'Recovery Day Recommended',
          message: 'Your recent workouts show high intensity. Consider taking a rest day or doing light activity.',
          actionText: 'View Recovery Tips',
          actionUrl: '/recommendations',
          metadata: {
            category: 'recovery',
            tags: ['recovery', 'rest', 'overtraining'],
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000)), // 48 hours
            context: { avgRPE }
          },
          status: 'pending',
          createdAt: Timestamp.now()
        });
      }

      return notifications;
    } catch (error) {
      console.error('Error generating workout reminders:', error);
      return [];
    }
  }

  // Generate AI insights notifications
  static async generateAIInsights(userId: string): Promise<SmartNotification[]> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences?.aiInsights.enabled) return [];

      const notifications: SmartNotification[] = [];
      const userContext = await ContextualDataService.getUserContext(userId);
      
      if (!userContext) return [];

      // Daily fitness tip
      if (preferences.aiInsights.dailyTips) {
        const tip = this.generateDailyFitnessTip(userContext);
        
        notifications.push({
          id: `daily_tip_${Date.now()}`,
          userId,
          type: 'ai_insight',
          priority: 'low',
          title: 'Daily Fitness Tip',
          message: tip,
          actionText: 'Learn More',
          actionUrl: '/chat',
          metadata: {
            category: 'daily_tip',
            tags: ['tip', 'education', 'daily'],
            scheduledFor: this.getNextMorningTime(),
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
          },
          status: 'pending',
          createdAt: Timestamp.now()
        });
      }

      // Weekly progress summary
      if (preferences.aiInsights.weeklyProgress && this.isWeeklyProgressDue()) {
        const progressSummary = this.generateWeeklyProgressSummary(userContext);
        
        notifications.push({
          id: `weekly_progress_${Date.now()}`,
          userId,
          type: 'ai_insight',
          priority: 'medium',
          title: 'Your Weekly Progress',
          message: progressSummary,
          actionText: 'View Details',
          actionUrl: '/stats',
          metadata: {
            category: 'weekly_progress',
            tags: ['progress', 'weekly', 'summary'],
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
          },
          status: 'pending',
          createdAt: Timestamp.now()
        });
      }

      return notifications;
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return [];
    }
  }

  // Generate habit formation support notifications
  static async generateHabitSupport(userId: string): Promise<SmartNotification[]> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences?.habitSupport.enabled) return [];

      const notifications: SmartNotification[] = [];
      const userContext = await ContextualDataService.getUserContext(userId);
      const recentWorkouts = await getRecentWorkouts(userId, 30);
      
      if (!userContext) return [];

      // Streak maintenance
      if (preferences.habitSupport.streakReminders) {
        const currentStreak = this.calculateCurrentStreak(recentWorkouts);
        
        if (currentStreak >= 3) {
          notifications.push({
            id: `streak_maintenance_${Date.now()}`,
            userId,
            type: 'habit_support',
            priority: 'medium',
            title: `${currentStreak}-Day Streak! 🔥`,
            message: `You're on fire! Don't break your ${currentStreak}-day workout streak. Keep the momentum going!`,
            actionText: 'Continue Streak',
            actionUrl: '/workout',
            metadata: {
              category: 'streak',
              tags: ['streak', 'motivation', 'consistency'],
              expiresAt: Timestamp.fromDate(new Date(Date.now() + 12 * 60 * 60 * 1000)), // 12 hours
              context: { currentStreak }
            },
            status: 'pending',
            createdAt: Timestamp.now()
          });
        }
      }

      // Motivational messages based on patterns
      if (preferences.habitSupport.motivationalMessages) {
        const motivationLevel = this.getAverageMotivationLevel(userContext);
        
        if (motivationLevel < 6) {
          notifications.push({
            id: `motivation_boost_${Date.now()}`,
            userId,
            type: 'habit_support',
            priority: 'medium',
            title: 'Need a Motivation Boost?',
            message: 'Remember why you started. Every small step counts towards your bigger goals!',
            actionText: 'Get Motivated',
            actionUrl: '/chat',
            metadata: {
              category: 'motivation',
              tags: ['motivation', 'encouragement', 'mindset'],
              expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
            },
            status: 'pending',
            createdAt: Timestamp.now()
          });
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error generating habit support notifications:', error);
      return [];
    }
  }

  // Save notifications to database
  static async saveNotifications(notifications: SmartNotification[]): Promise<void> {
    try {
      const batch = notifications.map(async (notification) => {
        const notifRef = doc(db, 'smart_notifications', notification.id);
        await setDoc(notifRef, notification);
      });
      
      await Promise.all(batch);
    } catch (error) {
      console.error('Error saving notifications:', error);
      throw error;
    }
  }

  // Get user notifications
  static async getUserNotifications(userId: string, limitCount: number = 20): Promise<SmartNotification[]> {
    try {
      const q = query(
        collection(db, 'smart_notifications'),
        where('userId', '==', userId),
        where('status', 'in', ['pending', 'sent']),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as SmartNotification);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Get user preferences
  static async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const prefsRef = doc(db, 'notification_preferences', userId);
      const prefsSnap = await getDoc(prefsRef);
      
      if (prefsSnap.exists()) {
        return prefsSnap.data() as NotificationPreferences;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  // Helper methods
  private static getDaysSinceLastWorkout(workouts: any[]): number {
    if (workouts.length === 0) return 999;
    
    const lastWorkout = workouts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    return Math.floor((Date.now() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24));
  }

  private static getNextOptimalWorkoutTime(userContext: any, preferences: NotificationPreferences): Timestamp {
    const now = new Date();
    const preferredTimes = preferences.workoutReminders.preferredTimes;
    
    // Find next preferred time
    for (const timeStr of preferredTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const targetTime = new Date(now);
      targetTime.setHours(hours, minutes, 0, 0);
      
      if (targetTime > now) {
        return Timestamp.fromDate(targetTime);
      }
    }
    
    // If no time today, use first preferred time tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hours, minutes] = preferredTimes[0].split(':').map(Number);
    tomorrow.setHours(hours, minutes, 0, 0);
    
    return Timestamp.fromDate(tomorrow);
  }

  private static calculateAverageEnergyLevel(userContext: any): number {
    const energyLevels = userContext.lifestyleContext?.energyLevels || [];
    if (energyLevels.length === 0) return 5;
    
    const recent = energyLevels.slice(-7); // Last 7 entries
    return recent.reduce((sum: number, level: number) => sum + level, 0) / recent.length;
  }

  private static calculateAverageRPE(userContext: any): number {
    const rpePatterns = userContext.performanceMetrics?.rpePatterns || [];
    if (rpePatterns.length === 0) return 7;
    
    const recent = rpePatterns.slice(-10); // Last 10 entries
    return recent.reduce((sum: number, rpe: number) => sum + rpe, 0) / recent.length;
  }

  private static getOptimalHighEnergyWorkoutTime(): Timestamp {
    const now = new Date();
    const targetTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    return Timestamp.fromDate(targetTime);
  }

  private static getNextMorningTime(): Timestamp {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0); // 8 AM
    return Timestamp.fromDate(tomorrow);
  }

  private static isWeeklyProgressDue(): boolean {
    const now = new Date();
    return now.getDay() === 0; // Sunday
  }

  private static generateWorkoutReminderMessage(daysSinceLastWorkout: number, userContext: any): string {
    if (daysSinceLastWorkout >= 4) {
      return `It's been ${daysSinceLastWorkout} days since your last workout. Your body is ready to get back into action!`;
    } else if (daysSinceLastWorkout === 3) {
      return "Time to get moving! A quick workout will boost your energy and mood.";
    } else {
      return "Ready to continue your fitness journey? Let's make today count!";
    }
  }

  private static generateDailyFitnessTip(userContext: any): string {
    const tips = [
      "Proper hydration can improve your workout performance by up to 15%.",
      "Getting 7-9 hours of sleep is crucial for muscle recovery and growth.",
      "Progressive overload is key - gradually increase weight, reps, or sets over time.",
      "Compound exercises like squats and deadlifts work multiple muscle groups efficiently.",
      "Rest days are just as important as workout days for muscle growth."
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  private static generateWeeklyProgressSummary(userContext: any): string {
    const workoutFreq = userContext.workoutPatterns?.frequency || 0;
    const avgVolume = userContext.workoutPatterns?.averageVolume || 0;
    
    return `This week: ${workoutFreq} workouts completed with an average volume of ${Math.round(avgVolume)} lbs. Keep up the great work!`;
  }

  private static calculateCurrentStreak(workouts: any[]): number {
    if (workouts.length === 0) return 0;
    
    const sortedWorkouts = workouts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].date);
      workoutDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff === streak + 1) {
        // Allow for one day gap
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private static getAverageMotivationLevel(userContext: any): number {
    const motivationLevels = userContext.behavioralPatterns?.motivationLevels || [];
    if (motivationLevels.length === 0) return 7;
    
    const recent = motivationLevels.slice(-7); // Last 7 entries
    return recent.reduce((sum: number, level: number) => sum + level, 0) / recent.length;
  }
}

export default SmartNotificationService;
