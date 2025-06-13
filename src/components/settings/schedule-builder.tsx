"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Sun, 
  Sunrise, 
  Sunset,
  Moon,
  Plus, 
  X, 
  Loader2,
  CheckCircle
} from 'lucide-react';
import { OnboardingContext, OnboardingContextService } from '@/services/onboarding-context-service';
import { useAuth } from '@/contexts/AuthContext';

interface ScheduleBuilderProps {
  context: OnboardingContext | null;
  onUpdate: (context: OnboardingContext) => void;
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday', short: 'Mon' },
  { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { id: 'thursday', label: 'Thursday', short: 'Thu' },
  { id: 'friday', label: 'Friday', short: 'Fri' },
  { id: 'saturday', label: 'Saturday', short: 'Sat' },
  { id: 'sunday', label: 'Sunday', short: 'Sun' }
];

const PREFERRED_TIMES = [
  { id: 'early_morning', label: 'Early Morning', time: '5:00-7:00 AM', icon: Sunrise, color: 'bg-orange-100 text-orange-700' },
  { id: 'morning', label: 'Morning', time: '7:00-10:00 AM', icon: Sun, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'late_morning', label: 'Late Morning', time: '10:00-12:00 PM', icon: Sun, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00-5:00 PM', icon: Sun, color: 'bg-blue-100 text-blue-700' },
  { id: 'evening', label: 'Evening', time: '5:00-8:00 PM', icon: Sunset, color: 'bg-purple-100 text-purple-700' },
  { id: 'night', label: 'Night', time: '8:00-11:00 PM', icon: Moon, color: 'bg-indigo-100 text-indigo-700' }
];

const SESSION_DURATIONS = [
  { id: '15_30', label: '15-30 minutes', description: 'Quick sessions' },
  { id: '30_45', label: '30-45 minutes', description: 'Standard sessions' },
  { id: '45_60', label: '45-60 minutes', description: 'Full workouts' },
  { id: '60_90', label: '60-90 minutes', description: 'Extended sessions' },
  { id: '90_plus', label: '90+ minutes', description: 'Long sessions' }
];

const FLEXIBILITY_LEVELS = [
  { id: 'rigid', label: 'Rigid', description: 'Fixed schedule, same times' },
  { id: 'somewhat_flexible', label: 'Somewhat Flexible', description: 'Can adjust within time blocks' },
  { id: 'very_flexible', label: 'Very Flexible', description: 'Can workout anytime' }
];

export function ScheduleBuilder({ context, onUpdate }: ScheduleBuilderProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localSchedule, setLocalSchedule] = useState(context?.schedule || {
    workoutDays: ['monday', 'wednesday', 'friday'],
    preferredTimes: ['evening'],
    sessionDuration: '45_60' as const,
    flexibility: 'somewhat_flexible' as const,
    busyPeriods: [],
    restDayPreferences: ['sunday']
  });
  const [newBusyPeriod, setNewBusyPeriod] = useState('');

  const handleWorkoutDayToggle = (day: string) => {
    setLocalSchedule(prev => ({
      ...prev,
      workoutDays: prev.workoutDays.includes(day)
        ? prev.workoutDays.filter(d => d !== day)
        : [...prev.workoutDays, day]
    }));
  };

  const handleRestDayToggle = (day: string) => {
    setLocalSchedule(prev => ({
      ...prev,
      restDayPreferences: prev.restDayPreferences.includes(day)
        ? prev.restDayPreferences.filter(d => d !== day)
        : [...prev.restDayPreferences, day]
    }));
  };

  const handlePreferredTimeToggle = (time: string) => {
    setLocalSchedule(prev => ({
      ...prev,
      preferredTimes: prev.preferredTimes.includes(time)
        ? prev.preferredTimes.filter(t => t !== time)
        : [...prev.preferredTimes, time]
    }));
  };

  const handleAddBusyPeriod = () => {
    if (newBusyPeriod.trim() && !localSchedule.busyPeriods.includes(newBusyPeriod.trim())) {
      setLocalSchedule(prev => ({
        ...prev,
        busyPeriods: [...prev.busyPeriods, newBusyPeriod.trim()]
      }));
      setNewBusyPeriod('');
    }
  };

  const handleRemoveBusyPeriod = (period: string) => {
    setLocalSchedule(prev => ({
      ...prev,
      busyPeriods: prev.busyPeriods.filter(p => p !== period)
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const updatedContext = await OnboardingContextService.updateSchedule(
        user.uid,
        localSchedule
      );
      onUpdate(updatedContext);
    } catch (error) {
      console.error('Error updating schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workout Days Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Workout Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isWorkoutDay = localSchedule.workoutDays.includes(day.id);
              const isRestDay = localSchedule.restDayPreferences.includes(day.id);
              
              return (
                <div key={day.id} className="text-center">
                  <button
                    onClick={() => handleWorkoutDayToggle(day.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all mb-2 ${
                      isWorkoutDay 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{day.short}</div>
                    <div className="text-xs">
                      {isWorkoutDay && <CheckCircle className="h-3 w-3 mx-auto mt-1" />}
                    </div>
                  </button>
                  <div className="text-xs text-gray-600">{day.label}</div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Selected workout days: {localSchedule.workoutDays.length} days per week</p>
          </div>
        </CardContent>
      </Card>

      {/* Preferred Times */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Preferred Workout Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PREFERRED_TIMES.map((time) => {
              const Icon = time.icon;
              const isSelected = localSchedule.preferredTimes.includes(time.id);
              
              return (
                <button
                  key={time.id}
                  onClick={() => handlePreferredTimeToggle(time.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${time.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{time.label}</div>
                      <div className="text-sm text-gray-600">{time.time}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Session Duration */}
      <Card>
        <CardHeader>
          <CardTitle>Session Duration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SESSION_DURATIONS.map((duration) => {
              const isSelected = localSchedule.sessionDuration === duration.id;
              
              return (
                <button
                  key={duration.id}
                  onClick={() => setLocalSchedule(prev => ({ ...prev, sessionDuration: duration.id as any }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{duration.label}</div>
                  <div className="text-sm text-gray-600">{duration.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Flexibility Level */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Flexibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FLEXIBILITY_LEVELS.map((flexibility) => {
              const isSelected = localSchedule.flexibility === flexibility.id;
              
              return (
                <button
                  key={flexibility.id}
                  onClick={() => setLocalSchedule(prev => ({ ...prev, flexibility: flexibility.id as any }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{flexibility.label}</div>
                  <div className="text-sm text-gray-600">{flexibility.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rest Day Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferred Rest Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isRestDay = localSchedule.restDayPreferences.includes(day.id);
              
              return (
                <button
                  key={day.id}
                  onClick={() => handleRestDayToggle(day.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    isRestDay 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{day.short}</div>
                  {isRestDay && <CheckCircle className="h-3 w-3 mx-auto mt-1" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Busy Periods */}
      <Card>
        <CardHeader>
          <CardTitle>Busy Periods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add busy period (e.g., 'Work travel in March')..."
              value={newBusyPeriod}
              onChange={(e) => setNewBusyPeriod(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddBusyPeriod()}
            />
            <Button onClick={handleAddBusyPeriod} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {localSchedule.busyPeriods.map((period, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {period}
                <button
                  onClick={() => handleRemoveBusyPeriod(period)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} className="min-w-32">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Schedule'
          )}
        </Button>
      </div>
    </div>
  );
}
