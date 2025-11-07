"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Dumbbell,
  Heart,
  TrendingUp,
  Zap,
  Target,
  Lightbulb,
  Filter,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { BackButton } from '@/components/layout/back-button';
import { useRouter } from 'next/navigation';
import { StatusBar } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AIRecommendationsPanel } from '@/components/recommendations/ai-recommendations-panel';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';

export default function RecommendationsPage() {
  const router = useRouter();
  const {
    recommendations,
    isLoading,
    generateRecommendations,
    getRecommendationsByType,
    getHighPriorityRecommendations
  } = useAIRecommendations();

  const [activeTab, setActiveTab] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateNew = async () => {
    setIsGenerating(true);
    await generateRecommendations();
    setIsGenerating(false);
  };

  const getTabCount = (type: string) => {
    switch (type) {
      case 'all':
        return recommendations.filter(r => r.status === 'pending' || r.status === 'viewed').length;
      case 'high-priority':
        return getHighPriorityRecommendations().length;
      case 'workout':
        return getRecommendationsByType('workout').length;
      case 'recovery':
        return getRecommendationsByType('recovery').length;
      case 'motivation':
        return getRecommendationsByType('motivation').length;
      case 'progression':
        return getRecommendationsByType('progression').length;
      default:
        return 0;
    }
  };

  const getFilteredRecommendations = () => {
    const activeRecs = recommendations.filter(r => r.status === 'pending' || r.status === 'viewed');
    
    switch (activeTab) {
      case 'high-priority':
        return activeRecs.filter(r => r.priority === 'high' || r.priority === 'urgent');
      case 'workout':
        return activeRecs.filter(r => r.type === 'workout');
      case 'recovery':
        return activeRecs.filter(r => r.type === 'recovery');
      case 'motivation':
        return activeRecs.filter(r => r.type === 'motivation');
      case 'progression':
        return activeRecs.filter(r => r.type === 'progression');
      default:
        return activeRecs;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StatusBar />
      
      <div className="pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-full bg-purple-500">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Recommendations</h1>
                <p className="text-sm text-gray-600">Personalized fitness guidance</p>
              </div>
            </div>
            <Button
              onClick={handleGenerateNew}
              disabled={isLoading || isGenerating}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 h-auto text-sm font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-lg font-semibold">
                      {recommendations.filter(r => r.status === 'pending' || r.status === 'viewed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-100">
                    <Target className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">High Priority</p>
                    <p className="text-lg font-semibold">
                      {getHighPriorityRecommendations().length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="all" className="text-xs">
                All ({getTabCount('all')})
              </TabsTrigger>
              <TabsTrigger value="high-priority" className="text-xs">
                <Filter className="h-3 w-3 mr-1" />
                Priority ({getTabCount('high-priority')})
              </TabsTrigger>
              <TabsTrigger value="workout" className="text-xs">
                <Dumbbell className="h-3 w-3 mr-1" />
                Workout ({getTabCount('workout')})
              </TabsTrigger>
              <TabsTrigger value="recovery" className="text-xs">
                <Heart className="h-3 w-3 mr-1" />
                Recovery ({getTabCount('recovery')})
              </TabsTrigger>
              <TabsTrigger value="motivation" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Motivation ({getTabCount('motivation')})
              </TabsTrigger>
              <TabsTrigger value="progression" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Progress ({getTabCount('progression')})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <AIRecommendationsPanel maxRecommendations={20} showHeader={false} />
            </TabsContent>

            <TabsContent value="high-priority" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4 text-orange-600" />
                    High Priority Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getHighPriorityRecommendations().length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No high priority recommendations</p>
                      <p className="text-xs text-gray-500 mt-1">You&apos;re doing great! Keep up the good work.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getHighPriorityRecommendations().map((rec) => (
                        <div key={rec.id} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                          <h4 className="font-medium text-sm text-orange-900 mb-1">
                            {rec.content.title}
                          </h4>
                          <p className="text-xs text-orange-700 mb-2">
                            {rec.content.description}
                          </p>
                          <Badge className="bg-orange-600 text-white text-xs">
                            {rec.priority} priority
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workout" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Dumbbell className="h-4 w-4 text-blue-600" />
                    Workout Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getRecommendationsByType('workout').length === 0 ? (
                    <div className="text-center py-8">
                      <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No workout recommendations</p>
                      <p className="text-xs text-gray-500 mt-1">Your workout routine looks solid!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getRecommendationsByType('workout').map((rec) => (
                        <div key={rec.id} className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <h4 className="font-medium text-sm text-blue-900 mb-1">
                            {rec.content.title}
                          </h4>
                          <p className="text-xs text-blue-700">
                            {rec.content.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recovery" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4 text-green-600" />
                    Recovery Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getRecommendationsByType('recovery').length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No recovery recommendations</p>
                      <p className="text-xs text-gray-500 mt-1">Your recovery looks on track!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getRecommendationsByType('recovery').map((rec) => (
                        <div key={rec.id} className="p-3 border border-green-200 rounded-lg bg-green-50">
                          <h4 className="font-medium text-sm text-green-900 mb-1">
                            {rec.content.title}
                          </h4>
                          <p className="text-xs text-green-700">
                            {rec.content.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="motivation" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="h-4 w-4 text-purple-600" />
                    Motivation Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getRecommendationsByType('motivation').length === 0 ? (
                    <div className="text-center py-8">
                      <Zap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No motivation recommendations</p>
                      <p className="text-xs text-gray-500 mt-1">You&apos;re staying motivated!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getRecommendationsByType('motivation').map((rec) => (
                        <div key={rec.id} className="p-3 border border-purple-200 rounded-lg bg-purple-50">
                          <h4 className="font-medium text-sm text-purple-900 mb-1">
                            {rec.content.title}
                          </h4>
                          <p className="text-xs text-purple-700">
                            {rec.content.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progression" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    Progression Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getRecommendationsByType('progression').length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No progression recommendations</p>
                      <p className="text-xs text-gray-500 mt-1">Your progress is steady!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getRecommendationsByType('progression').map((rec) => (
                        <div key={rec.id} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                          <h4 className="font-medium text-sm text-orange-900 mb-1">
                            {rec.content.title}
                          </h4>
                          <p className="text-xs text-orange-700">
                            {rec.content.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
