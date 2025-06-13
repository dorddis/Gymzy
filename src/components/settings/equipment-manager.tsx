"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dumbbell, 
  Home, 
  Building, 
  MapPin,
  Plus, 
  X, 
  DollarSign,
  Loader2,
  Check
} from 'lucide-react';
import { OnboardingContext, OnboardingContextService } from '@/services/onboarding-context-service';
import { useAuth } from '@/contexts/AuthContext';

interface EquipmentManagerProps {
  context: OnboardingContext | null;
  onUpdate: (context: OnboardingContext) => void;
}

const COMMON_EQUIPMENT = [
  'Dumbbells',
  'Barbell',
  'Resistance Bands',
  'Pull-up Bar',
  'Yoga Mat',
  'Kettlebells',
  'Bench',
  'Treadmill',
  'Exercise Bike',
  'Cable Machine',
  'Smith Machine',
  'Leg Press',
  'Rowing Machine',
  'Medicine Ball',
  'Foam Roller',
  'Jump Rope',
  'Battle Ropes',
  'TRX Suspension Trainer',
  'Stability Ball',
  'Bosu Ball'
];

const LOCATIONS = [
  { id: 'home', label: 'Home', icon: Home, description: 'Workout at home' },
  { id: 'gym', label: 'Gym', icon: Building, description: 'Commercial gym' },
  { id: 'both', label: 'Both', icon: MapPin, description: 'Home and gym' },
  { id: 'outdoor', label: 'Outdoor', icon: MapPin, description: 'Parks, trails, etc.' }
] as const;

const SPACE_CONSTRAINTS = [
  { id: 'minimal', label: 'Minimal', description: 'Small apartment, limited space' },
  { id: 'moderate', label: 'Moderate', description: 'Dedicated workout area' },
  { id: 'spacious', label: 'Spacious', description: 'Large room or home gym' }
] as const;

const BUDGET_LEVELS = [
  { id: 'low', label: 'Low ($0-$200)', description: 'Basic equipment only' },
  { id: 'medium', label: 'Medium ($200-$1000)', description: 'Quality essentials' },
  { id: 'high', label: 'High ($1000-$5000)', description: 'Premium equipment' },
  { id: 'unlimited', label: 'Unlimited ($5000+)', description: 'No budget constraints' }
] as const;

export function EquipmentManager({ context, onUpdate }: EquipmentManagerProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localEquipment, setLocalEquipment] = useState(context?.equipment || {
    available: [],
    location: 'home' as const,
    spaceConstraints: 'moderate' as const,
    acquisitionPlans: [],
    budget: 'medium' as const
  });
  const [newEquipment, setNewEquipment] = useState('');
  const [newAcquisitionPlan, setNewAcquisitionPlan] = useState('');

  const handleEquipmentToggle = (equipment: string) => {
    setLocalEquipment(prev => ({
      ...prev,
      available: prev.available.includes(equipment)
        ? prev.available.filter(e => e !== equipment)
        : [...prev.available, equipment]
    }));
  };

  const handleAddCustomEquipment = () => {
    if (newEquipment.trim() && !localEquipment.available.includes(newEquipment.trim())) {
      setLocalEquipment(prev => ({
        ...prev,
        available: [...prev.available, newEquipment.trim()]
      }));
      setNewEquipment('');
    }
  };

  const handleRemoveEquipment = (equipment: string) => {
    setLocalEquipment(prev => ({
      ...prev,
      available: prev.available.filter(e => e !== equipment)
    }));
  };

  const handleAddAcquisitionPlan = () => {
    if (newAcquisitionPlan.trim() && !localEquipment.acquisitionPlans.includes(newAcquisitionPlan.trim())) {
      setLocalEquipment(prev => ({
        ...prev,
        acquisitionPlans: [...prev.acquisitionPlans, newAcquisitionPlan.trim()]
      }));
      setNewAcquisitionPlan('');
    }
  };

  const handleRemoveAcquisitionPlan = (plan: string) => {
    setLocalEquipment(prev => ({
      ...prev,
      acquisitionPlans: prev.acquisitionPlans.filter(p => p !== plan)
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const updatedContext = await OnboardingContextService.updateEquipment(
        user.uid,
        localEquipment
      );
      onUpdate(updatedContext);
    } catch (error) {
      console.error('Error updating equipment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Workout Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {LOCATIONS.map((location) => {
              const Icon = location.icon;
              const isSelected = localEquipment.location === location.id;
              
              return (
                <button
                  key={location.id}
                  onClick={() => setLocalEquipment(prev => ({ ...prev, location: location.id }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{location.label}</span>
                  </div>
                  <div className="text-sm text-gray-600">{location.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Space Constraints */}
      <Card>
        <CardHeader>
          <CardTitle>Space Constraints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SPACE_CONSTRAINTS.map((space) => {
              const isSelected = localEquipment.spaceConstraints === space.id;
              
              return (
                <button
                  key={space.id}
                  onClick={() => setLocalEquipment(prev => ({ ...prev, spaceConstraints: space.id }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{space.label}</div>
                  <div className="text-sm text-gray-600">{space.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Available Equipment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Available Equipment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Common Equipment Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {COMMON_EQUIPMENT.map((equipment) => {
              const isSelected = localEquipment.available.includes(equipment);
              
              return (
                <div
                  key={equipment}
                  className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleEquipmentToggle(equipment)}
                >
                  <Checkbox 
                    checked={isSelected}
                    onChange={() => handleEquipmentToggle(equipment)}
                  />
                  <span className="text-sm">{equipment}</span>
                </div>
              );
            })}
          </div>

          {/* Add Custom Equipment */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom equipment..."
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomEquipment()}
            />
            <Button onClick={handleAddCustomEquipment} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Equipment */}
          {localEquipment.available.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Selected Equipment:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {localEquipment.available.map((equipment, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {equipment}
                    <button
                      onClick={() => handleRemoveEquipment(equipment)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Equipment Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {BUDGET_LEVELS.map((budget) => {
              const isSelected = localEquipment.budget === budget.id;
              
              return (
                <button
                  key={budget.id}
                  onClick={() => setLocalEquipment(prev => ({ ...prev, budget: budget.id }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{budget.label}</div>
                  <div className="text-sm text-gray-600">{budget.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Acquisition Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Future Equipment Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Equipment you plan to get..."
              value={newAcquisitionPlan}
              onChange={(e) => setNewAcquisitionPlan(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddAcquisitionPlan()}
            />
            <Button onClick={handleAddAcquisitionPlan} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {localEquipment.acquisitionPlans.map((plan, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {plan}
                <button
                  onClick={() => handleRemoveAcquisitionPlan(plan)}
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
            'Save Equipment'
          )}
        </Button>
      </div>
    </div>
  );
}
