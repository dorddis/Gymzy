"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Pill, 
  Utensils, 
  AlertTriangle,
  Moon,
  Activity,
  Zap,
  Plus, 
  X, 
  Loader2,
  Info
} from 'lucide-react';
import { OnboardingContext, OnboardingContextService } from '@/services/onboarding-context-service';
import { useAuth } from '@/contexts/AuthContext';

interface HealthInfoManagerProps {
  context: OnboardingContext | null;
  onUpdate: (context: OnboardingContext) => void;
}

const COMMON_CONDITIONS = [
  'Diabetes',
  'High Blood Pressure',
  'Heart Disease',
  'Asthma',
  'Arthritis',
  'Back Pain',
  'Knee Problems',
  'Shoulder Issues',
  'Anxiety',
  'Depression',
  'Thyroid Issues',
  'PCOS',
  'Sleep Apnea'
];

const COMMON_ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Fish',
  'Eggs',
  'Dairy',
  'Soy',
  'Wheat/Gluten',
  'Latex',
  'Pollen',
  'Dust Mites',
  'Pet Dander'
];

const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Low-Fat',
  'Low-Sodium',
  'Diabetic Diet',
  'Heart-Healthy',
  'Mediterranean'
];

const SLEEP_QUALITY_OPTIONS = [
  { id: 'poor', label: 'Poor', description: 'Often tired, restless sleep' },
  { id: 'fair', label: 'Fair', description: 'Sometimes tired, average sleep' },
  { id: 'good', label: 'Good', description: 'Usually well-rested' },
  { id: 'excellent', label: 'Excellent', description: 'Always well-rested, deep sleep' }
];

const STRESS_LEVELS = [
  { id: 'low', label: 'Low', description: 'Rarely stressed, calm most of the time' },
  { id: 'moderate', label: 'Moderate', description: 'Sometimes stressed, manageable' },
  { id: 'high', label: 'High', description: 'Often stressed, affects daily life' }
];

const ENERGY_LEVELS = [
  { id: 'low', label: 'Low', description: 'Often tired, low motivation' },
  { id: 'moderate', label: 'Moderate', description: 'Average energy throughout day' },
  { id: 'high', label: 'High', description: 'Energetic, motivated most of the time' },
  { id: 'variable', label: 'Variable', description: 'Energy levels change frequently' }
];

export function HealthInfoManager({ context, onUpdate }: HealthInfoManagerProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localHealthInfo, setLocalHealthInfo] = useState(context?.healthInfo || {
    medicalConditions: [],
    medications: [],
    dietaryRestrictions: [],
    allergies: [],
    sleepPattern: {
      averageHours: 7,
      quality: 'good' as const,
      schedule: 'regular' as const
    },
    stressLevel: 'moderate' as const,
    energyLevels: 'moderate' as const
  });

  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');

  const handleAddItem = (category: keyof typeof localHealthInfo, item: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (item.trim() && Array.isArray(localHealthInfo[category])) {
      const currentArray = localHealthInfo[category] as string[];
      if (!currentArray.includes(item.trim())) {
        setLocalHealthInfo(prev => ({
          ...prev,
          [category]: [...currentArray, item.trim()]
        }));
        setter('');
      }
    }
  };

  const handleRemoveItem = (category: keyof typeof localHealthInfo, item: string) => {
    if (Array.isArray(localHealthInfo[category])) {
      setLocalHealthInfo(prev => ({
        ...prev,
        [category]: (prev[category] as string[]).filter(i => i !== item)
      }));
    }
  };

  const handleToggleItem = (category: keyof typeof localHealthInfo, item: string) => {
    if (Array.isArray(localHealthInfo[category])) {
      const currentArray = localHealthInfo[category] as string[];
      setLocalHealthInfo(prev => ({
        ...prev,
        [category]: currentArray.includes(item)
          ? currentArray.filter(i => i !== item)
          : [...currentArray, item]
      }));
    }
  };

  const handleSleepHoursChange = (hours: number) => {
    setLocalHealthInfo(prev => ({
      ...prev,
      sleepPattern: {
        ...prev.sleepPattern,
        averageHours: Math.max(1, Math.min(12, hours))
      }
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const updatedContext = await OnboardingContextService.updateHealthInfo(
        user.uid,
        localHealthInfo
      );
      onUpdate(updatedContext);
    } catch (error) {
      console.error('Error updating health info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Privacy Notice</p>
              <p>Your health information is encrypted and only used to personalize your fitness experience. This information is never shared with third parties.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Medical Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {COMMON_CONDITIONS.map((condition) => {
              const isSelected = localHealthInfo.medicalConditions.includes(condition);
              return (
                <button
                  key={condition}
                  onClick={() => handleToggleItem('medicalConditions', condition)}
                  className={`p-2 text-sm rounded-lg border transition-all ${
                    isSelected 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {condition}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add other medical condition..."
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem('medicalConditions', newCondition, setNewCondition)}
            />
            <Button onClick={() => handleAddItem('medicalConditions', newCondition, setNewCondition)} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {localHealthInfo.medicalConditions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {localHealthInfo.medicalConditions.map((condition, index) => (
                <Badge key={index} variant="destructive" className="flex items-center gap-1">
                  {condition}
                  <button
                    onClick={() => handleRemoveItem('medicalConditions', condition)}
                    className="ml-1 hover:text-red-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Current Medications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add medication..."
              value={newMedication}
              onChange={(e) => setNewMedication(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem('medications', newMedication, setNewMedication)}
            />
            <Button onClick={() => handleAddItem('medications', newMedication, setNewMedication)} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {localHealthInfo.medications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {localHealthInfo.medications.map((medication, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {medication}
                  <button
                    onClick={() => handleRemoveItem('medications', medication)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dietary Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Dietary Restrictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {DIETARY_RESTRICTIONS.map((restriction) => {
              const isSelected = localHealthInfo.dietaryRestrictions.includes(restriction);
              return (
                <button
                  key={restriction}
                  onClick={() => handleToggleItem('dietaryRestrictions', restriction)}
                  className={`p-2 text-sm rounded-lg border transition-all ${
                    isSelected 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {restriction}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Allergies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {COMMON_ALLERGIES.map((allergy) => {
              const isSelected = localHealthInfo.allergies.includes(allergy);
              return (
                <button
                  key={allergy}
                  onClick={() => handleToggleItem('allergies', allergy)}
                  className={`p-2 text-sm rounded-lg border transition-all ${
                    isSelected 
                      ? 'border-orange-500 bg-orange-50 text-orange-700' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {allergy}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sleep Pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Sleep Pattern
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sleepHours">Average Hours of Sleep per Night</Label>
            <div className="flex items-center gap-4 mt-2">
              <Input
                id="sleepHours"
                type="number"
                min="1"
                max="12"
                value={localHealthInfo.sleepPattern.averageHours}
                onChange={(e) => handleSleepHoursChange(parseInt(e.target.value) || 7)}
                className="w-20"
              />
              <span className="text-sm text-gray-600">hours</span>
            </div>
          </div>

          <div>
            <Label>Sleep Quality</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
              {SLEEP_QUALITY_OPTIONS.map((quality) => {
                const isSelected = localHealthInfo.sleepPattern.quality === quality.id;
                return (
                  <button
                    key={quality.id}
                    onClick={() => setLocalHealthInfo(prev => ({
                      ...prev,
                      sleepPattern: { ...prev.sleepPattern, quality: quality.id as any }
                    }))}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{quality.label}</div>
                    <div className="text-sm text-gray-600">{quality.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stress Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Stress Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {STRESS_LEVELS.map((stress) => {
              const isSelected = localHealthInfo.stressLevel === stress.id;
              return (
                <button
                  key={stress.id}
                  onClick={() => setLocalHealthInfo(prev => ({ ...prev, stressLevel: stress.id as any }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{stress.label}</div>
                  <div className="text-sm text-gray-600">{stress.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Energy Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Energy Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {ENERGY_LEVELS.map((energy) => {
              const isSelected = localHealthInfo.energyLevels === energy.id;
              return (
                <button
                  key={energy.id}
                  onClick={() => setLocalHealthInfo(prev => ({ ...prev, energyLevels: energy.id as any }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{energy.label}</div>
                  <div className="text-sm text-gray-600">{energy.description}</div>
                </button>
              );
            })}
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
            'Save Health Info'
          )}
        </Button>
      </div>
    </div>
  );
}
