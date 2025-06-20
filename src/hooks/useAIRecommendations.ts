import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AIRecommendationsService, AIRecommendation } from '@/services/ai/ai-recommendations-service';

export function useAIRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recommendations for the current user
  const loadRecommendations = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const userRecommendations = await AIRecommendationsService.getUserRecommendations(user.uid);
      setRecommendations(userRecommendations);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Generate new recommendations
  const generateRecommendations = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const newRecommendations = await AIRecommendationsService.generateRecommendations(user.uid);
      setRecommendations(newRecommendations);
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError('Failed to generate recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Mark recommendation as viewed
  const markAsViewed = useCallback(async (recommendationId: string) => {
    try {
      await AIRecommendationsService.markRecommendationViewed(recommendationId);
      
      // Update local state
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, status: 'viewed' as const, viewedAt: new Date() as any }
            : rec
        )
      );
    } catch (err) {
      console.error('Error marking recommendation as viewed:', err);
    }
  }, []);

  // Mark recommendation as completed
  const markAsCompleted = useCallback(async (recommendationId: string) => {
    try {
      await AIRecommendationsService.markRecommendationCompleted(recommendationId);
      
      // Update local state
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, status: 'completed' as const, actionTakenAt: new Date() as any }
            : rec
        )
      );
    } catch (err) {
      console.error('Error marking recommendation as completed:', err);
    }
  }, []);

  // Dismiss recommendation
  const dismissRecommendation = useCallback(async (recommendationId: string) => {
    try {
      // Update local state immediately for better UX
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, status: 'dismissed' as const }
            : rec
        )
      );
    } catch (err) {
      console.error('Error dismissing recommendation:', err);
    }
  }, []);

  // Get recommendations by type
  const getRecommendationsByType = useCallback((type: AIRecommendation['type']) => {
    return recommendations.filter(rec => rec.type === type);
  }, [recommendations]);

  // Get recommendations by priority
  const getRecommendationsByPriority = useCallback((priority: AIRecommendation['priority']) => {
    return recommendations.filter(rec => rec.priority === priority);
  }, [recommendations]);

  // Get high priority recommendations
  const getHighPriorityRecommendations = useCallback(() => {
    return recommendations.filter(rec => rec.priority === 'high' || rec.priority === 'urgent');
  }, [recommendations]);

  // Load recommendations when user changes
  useEffect(() => {
    if (user?.uid) {
      loadRecommendations();
    }
  }, [user?.uid, loadRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    loadRecommendations,
    generateRecommendations,
    markAsViewed,
    markAsCompleted,
    dismissRecommendation,
    getRecommendationsByType,
    getRecommendationsByPriority,
    getHighPriorityRecommendations
  };
}
