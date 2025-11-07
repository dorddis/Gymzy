"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Dumbbell, 
  Heart, 
  TrendingUp, 
  Zap, 
  Clock,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { AIRecommendation } from '@/services/ai-recommendations-service';

interface AIRecommendationsPanelProps {
  maxRecommendations?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function AIRecommendationsPanel({ 
  maxRecommendations = 5, 
  showHeader = true,
  compact = false 
}: AIRecommendationsPanelProps) {
  const {
    recommendations,
    isLoading,
    error,
    generateRecommendations,
    markAsViewed,
    markAsCompleted,
    dismissRecommendation
  } = useAIRecommendations();

  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const displayedRecommendations = recommendations
    .filter(rec => rec.status === 'pending' || rec.status === 'viewed')
    .slice(0, maxRecommendations);

  const handleExpand = (recId: string) => {
    const newExpanded = new Set(expandedRecs);
    if (newExpanded.has(recId)) {
      newExpanded.delete(recId);
    } else {
      newExpanded.add(recId);
      // Mark as viewed when expanded
      markAsViewed(recId);
    }
    setExpandedRecs(newExpanded);
  };

  const handleComplete = async (recId: string) => {
    await markAsCompleted(recId);
  };

  const handleDismiss = async (recId: string) => {
    await dismissRecommendation(recId);
  };

  const handleGenerateNew = async () => {
    setIsGenerating(true);
    await generateRecommendations();
    setIsGenerating(false);
  };

  const getRecommendationIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'workout':
        return <Dumbbell className="h-4 w-4" />;
      case 'recovery':
        return <Heart className="h-4 w-4" />;
      case 'motivation':
        return <Zap className="h-4 w-4" />;
      case 'progression':
        return <TrendingUp className="h-4 w-4" />;
      case 'nutrition':
        return <Target className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: AIRecommendation['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'workout':
        return 'text-blue-600';
      case 'recovery':
        return 'text-green-600';
      case 'motivation':
        return 'text-purple-600';
      case 'progression':
        return 'text-orange-600';
      case 'nutrition':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-700">
            <X className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Recommendations
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateNew}
              disabled={isLoading || isGenerating}
              className="h-8 w-8 p-0 hover:bg-purple-100"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              ) : (
                <RefreshCw className="h-4 w-4 text-purple-600" />
              )}
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={showHeader ? "pt-0" : "p-4"}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="ml-2 text-sm text-gray-600">Loading recommendations...</span>
          </div>
        ) : displayedRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-3">No recommendations available</p>
            <Button
              onClick={handleGenerateNew}
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 h-auto text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedRecommendations.map((recommendation) => {
              const isExpanded = expandedRecs.has(recommendation.id);
              
              return (
                <div
                  key={recommendation.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <div
                    className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleExpand(recommendation.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-1.5 rounded-md ${getTypeColor(recommendation.type)} bg-opacity-10`}>
                          {getRecommendationIcon(recommendation.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {recommendation.content.title}
                            </h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(recommendation.priority)}`}
                            >
                              {recommendation.priority}
                            </Badge>
                          </div>
                          
                          {!compact && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {recommendation.content.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {recommendation.type}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {recommendation.metadata.estimatedImpact} impact
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50">
                      <div className="pt-3 space-y-3">
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 mb-1">Action Items:</h5>
                          <ul className="space-y-1">
                            {recommendation.content.actionItems.map((item, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <span className="text-purple-500 mt-0.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 mb-1">Why this matters:</h5>
                          <p className="text-xs text-gray-600">{recommendation.content.reasoning}</p>
                        </div>
                        
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 mb-1">Expected benefit:</h5>
                          <p className="text-xs text-gray-600">{recommendation.content.expectedBenefit}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleComplete(recommendation.id)}
                            className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDismiss(recommendation.id)}
                            className="h-7 px-3 text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
