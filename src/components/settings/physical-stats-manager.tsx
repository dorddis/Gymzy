"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Scale, 
  Ruler, 
  Calendar, 
  User, 
  Activity,
  Calculator,
  TrendingUp,
  Loader2,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingContextService, OnboardingContext } from '@/services/data/onboarding-context-service';

interface PhysicalStats {
  age: number;
  height: {
    value: number;
    unit: 'cm' | 'ft_in';
    feet?: number;
    inches?: number;
  };
  weight: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  bmr: number;
  tdee: number;
}

interface PhysicalStatsManagerProps {
  context?: OnboardingContext | null;
  onUpdate?: (context: OnboardingContext | null) => void;
}

const GENDER_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' }
];

const ACTIVITY_LEVELS = [
  { 
    id: 'sedentary', 
    label: 'Sedentary', 
    description: 'Little to no exercise',
    multiplier: 1.2
  },
  { 
    id: 'lightly_active', 
    label: 'Lightly Active', 
    description: 'Light exercise 1-3 days/week',
    multiplier: 1.375
  },
  { 
    id: 'moderately_active', 
    label: 'Moderately Active', 
    description: 'Moderate exercise 3-5 days/week',
    multiplier: 1.55
  },
  { 
    id: 'very_active', 
    label: 'Very Active', 
    description: 'Hard exercise 6-7 days/week',
    multiplier: 1.725
  },
  { 
    id: 'extremely_active', 
    label: 'Extremely Active', 
    description: 'Very hard exercise, physical job',
    multiplier: 1.9
  }
];

export function PhysicalStatsManager({ context, onUpdate }: PhysicalStatsManagerProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<PhysicalStats>(context?.physicalStats || {
    age: 25,
    height: {
      value: 170,
      unit: 'cm'
    },
    weight: {
      value: 70,
      unit: 'kg'
    },
    gender: 'prefer_not_to_say',
    activityLevel: 'moderately_active',
    bmr: 0,
    tdee: 0
  });

  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = (statsData: PhysicalStats): number => {
    const { age, height, weight, gender } = statsData;
    
    // Convert height to cm
    let heightInCm = height.value;
    if (height.unit === 'ft_in') {
      heightInCm = ((height.feet || 0) * 12 + (height.inches || 0)) * 2.54;
    }
    
    // Convert weight to kg
    let weightInKg = weight.value;
    if (weight.unit === 'lbs') {
      weightInKg = weight.value * 0.453592;
    }
    
    // BMR calculation
    let bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age;
    
    if (gender === 'male') {
      bmr += 5;
    } else if (gender === 'female') {
      bmr -= 161;
    } else {
      // For other/prefer not to say, use average
      bmr -= 78; // Average of male (+5) and female (-161)
    }
    
    return Math.round(bmr);
  };

  // Calculate TDEE (Total Daily Energy Expenditure)
  const calculateTDEE = (bmr: number, activityLevel: string): number => {
    const activityData = ACTIVITY_LEVELS.find(level => level.id === activityLevel);
    const multiplier = activityData?.multiplier || 1.55;
    return Math.round(bmr * multiplier);
  };

  // Update calculations when relevant stats change
  useEffect(() => {
    const newBmr = calculateBMR(stats);
    const newTdee = calculateTDEE(newBmr, stats.activityLevel);

    // Only update if BMR or TDEE actually changed (prevents infinite loop)
    setStats(prev => {
      if (prev.bmr === newBmr && prev.tdee === newTdee) {
        return prev; // No change, return same reference
      }
      return {
        ...prev,
        bmr: newBmr,
        tdee: newTdee
      };
    });
  }, [stats.age, stats.height.value, stats.height.unit, stats.height.feet, stats.height.inches, stats.weight.value, stats.weight.unit, stats.gender, stats.activityLevel]);

  const handleHeightChange = (value: number, unit?: 'cm' | 'ft_in') => {
    setStats(prev => ({
      ...prev,
      height: {
        ...prev.height,
        value,
        unit: unit || prev.height.unit
      }
    }));
  };

  const handleHeightFeetInchesChange = (feet?: number, inches?: number) => {
    setStats(prev => ({
      ...prev,
      height: {
        ...prev.height,
        feet,
        inches,
        value: (feet || 0) + (inches || 0) / 12 // Store as decimal feet for calculations
      }
    }));
  };

  const handleWeightChange = (value: number, unit?: 'kg' | 'lbs') => {
    setStats(prev => ({
      ...prev,
      weight: {
        value,
        unit: unit || prev.weight.unit
      }
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);

      // Save to OnboardingContext in Firestore
      const updatedContext = await OnboardingContextService.updatePhysicalStats(user.uid, stats);

      // Notify parent component
      onUpdate?.(updatedContext);

      console.log('Physical stats saved:', stats);
    } catch (error) {
      console.error('Error saving physical stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedActivityLevel = ACTIVITY_LEVELS.find(level => level.id === stats.activityLevel);

  return (
    <div className="space-y-6">
      {/* BMR/TDEE Display */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Metabolic Calculations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.bmr}</div>
              <div className="text-sm text-gray-600">BMR (calories/day)</div>
              <div className="text-xs text-gray-500 mt-1">Basal Metabolic Rate</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.tdee}</div>
              <div className="text-sm text-gray-600">TDEE (calories/day)</div>
              <div className="text-xs text-gray-500 mt-1">Total Daily Energy Expenditure</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>BMR is your body&apos;s energy needs at rest. TDEE includes your activity level and represents your total daily calorie needs.</p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="age"
                  type="number"
                  min="13"
                  max="100"
                  value={stats.age}
                  onChange={(e) => setStats(prev => ({ ...prev, age: parseInt(e.target.value) || 25 }))}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">years</span>
              </div>
            </div>

            <div>
              <Label>Gender</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {GENDER_OPTIONS.map((gender) => {
                  const isSelected = stats.gender === gender.id;
                  return (
                    <button
                      key={gender.id}
                      onClick={() => setStats(prev => ({ ...prev, gender: gender.id as any }))}
                      className={`p-2 text-sm rounded-lg border transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {gender.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Height */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Height
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => handleHeightChange(stats.height.value, 'cm')}
              className={`px-4 py-2 rounded-lg border transition-all ${
                stats.height.unit === 'cm' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Centimeters
            </button>
            <button
              onClick={() => handleHeightChange(stats.height.value, 'ft_in')}
              className={`px-4 py-2 rounded-lg border transition-all ${
                stats.height.unit === 'ft_in' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Feet & Inches
            </button>
          </div>

          {stats.height.unit === 'cm' ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="100"
                max="250"
                value={stats.height.value}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 170)}
                className="w-24"
              />
              <span className="text-sm text-gray-600">cm</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="3"
                max="8"
                value={stats.height.feet || 5}
                onChange={(e) => handleHeightFeetInchesChange(parseInt(e.target.value) || 5, stats.height.inches)}
                className="w-20"
              />
              <span className="text-sm text-gray-600">ft</span>
              <Input
                type="number"
                min="0"
                max="11"
                value={stats.height.inches || 8}
                onChange={(e) => handleHeightFeetInchesChange(stats.height.feet, parseInt(e.target.value) || 8)}
                className="w-20"
              />
              <span className="text-sm text-gray-600">in</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weight */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => handleWeightChange(stats.weight.value, 'kg')}
              className={`px-4 py-2 rounded-lg border transition-all ${
                stats.weight.unit === 'kg' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Kilograms
            </button>
            <button
              onClick={() => handleWeightChange(stats.weight.value, 'lbs')}
              className={`px-4 py-2 rounded-lg border transition-all ${
                stats.weight.unit === 'lbs' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Pounds
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="30"
              max="300"
              value={stats.weight.value}
              onChange={(e) => handleWeightChange(parseInt(e.target.value) || 70)}
              className="w-24"
            />
            <span className="text-sm text-gray-600">{stats.weight.unit}</span>
          </div>
        </CardContent>
      </Card>

      {/* Activity Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ACTIVITY_LEVELS.map((level) => {
              const isSelected = stats.activityLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => setStats(prev => ({ ...prev, activityLevel: level.id as any }))}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm text-gray-600">{level.description}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {level.multiplier}x BMR
                    </Badge>
                  </div>
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
            'Save Physical Stats'
          )}
        </Button>
      </div>
    </div>
  );
}
