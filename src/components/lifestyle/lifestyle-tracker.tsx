"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Moon,
  Zap,
  Brain,
  Heart,
  CheckCircle,
  TrendingUp,
  X
} from 'lucide-react';
import { useContextualTracking } from '@/hooks/useContextualTracking';

interface LifestyleTrackerProps {
  onClose?: () => void;
}

export function LifestyleTracker({ onClose }: LifestyleTrackerProps) {
  const { trackLifestyleContext, trackFeatureUsage } = useContextualTracking();
  
  const [sleepQuality, setSleepQuality] = useState([7]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [energyLevel, setEnergyLevel] = useState([7]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Track lifestyle context
      await trackLifestyleContext('sleep_quality', sleepQuality[0]);
      await trackLifestyleContext('stress_level', stressLevel[0]);
      await trackLifestyleContext('energy_level', energyLevel[0]);
      
      // Track feature usage
      await trackFeatureUsage('lifestyle_tracking');
      
      setSubmitted(true);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose?.();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting lifestyle data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSleepQualityLabel = (value: number) => {
    if (value <= 3) return 'Poor';
    if (value <= 5) return 'Fair';
    if (value <= 7) return 'Good';
    return 'Excellent';
  };

  const getStressLevelLabel = (value: number) => {
    if (value <= 3) return 'Low';
    if (value <= 5) return 'Moderate';
    if (value <= 7) return 'High';
    return 'Very High';
  };

  const getEnergyLevelLabel = (value: number) => {
    if (value <= 3) return 'Low';
    if (value <= 5) return 'Moderate';
    if (value <= 7) return 'High';
    return 'Very High';
  };

  const getStressColor = (value: number) => {
    if (value <= 3) return 'bg-green-100 text-green-800';
    if (value <= 5) return 'bg-yellow-100 text-yellow-800';
    if (value <= 7) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getEnergyColor = (value: number) => {
    if (value <= 3) return 'bg-red-100 text-red-800';
    if (value <= 5) return 'bg-yellow-100 text-yellow-800';
    if (value <= 7) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Lifestyle Data Recorded!
          </h3>
          <p className="text-sm text-green-700">
            Your AI coach will use this information to provide better recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Check-in
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Help your AI coach understand how you&apos;re feeling today
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sleep Quality */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Sleep Quality</span>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {getSleepQualityLabel(sleepQuality[0])}
            </Badge>
          </div>
          <Slider
            value={sleepQuality}
            onValueChange={setSleepQuality}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Stress Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Stress Level</span>
            </div>
            <Badge variant="outline" className={getStressColor(stressLevel[0])}>
              {getStressLevelLabel(stressLevel[0])}
            </Badge>
          </div>
          <Slider
            value={stressLevel}
            onValueChange={setStressLevel}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low</span>
            <span>Very High</span>
          </div>
        </div>

        {/* Energy Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Energy Level</span>
            </div>
            <Badge variant="outline" className={getEnergyColor(energyLevel[0])}>
              {getEnergyLevelLabel(energyLevel[0])}
            </Badge>
          </div>
          <Slider
            value={energyLevel}
            onValueChange={setEnergyLevel}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low</span>
            <span>Very High</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Heart className="h-4 w-4 mr-2 animate-pulse" />
                Recording...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Record Daily Check-in
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          This data helps your AI coach provide personalized recommendations
        </div>
      </CardContent>
    </Card>
  );
}
