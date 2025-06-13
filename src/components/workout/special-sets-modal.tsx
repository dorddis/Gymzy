"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExerciseWithSets } from '@/types/exercise';
import { X, Link, Zap, TrendingDown, Clock, Repeat, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SupersetCreator } from './superset-creator';

interface SpecialSetsModalProps {
  exercises: ExerciseWithSets[];
  onCreateSuperset: (exerciseIds: string[], parameters: any) => void;
  onClose: () => void;
}

interface SpecialSetType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  comingSoon?: boolean;
}

const SPECIAL_SET_TYPES: SpecialSetType[] = [
  {
    id: 'superset',
    name: 'Superset',
    description: 'Perform 2-4 exercises back-to-back with no rest between them',
    icon: Link,
    available: true
  },
  {
    id: 'circuit',
    name: 'Circuit',
    description: 'Timed rounds of multiple exercises with work/rest intervals',
    icon: Repeat,
    available: false,
    comingSoon: true
  },
  {
    id: 'dropset',
    name: 'Drop Set',
    description: 'Reduce weight after reaching failure to continue the set',
    icon: TrendingDown,
    available: false,
    comingSoon: true
  },
  {
    id: 'restpause',
    name: 'Rest-Pause',
    description: 'Short rest periods within a set to extend total reps',
    icon: Clock,
    available: false,
    comingSoon: true
  },
  {
    id: 'cluster',
    name: 'Cluster Set',
    description: 'Break sets into smaller clusters with mini-rest periods',
    icon: Target,
    available: false,
    comingSoon: true
  },
  {
    id: 'tempo',
    name: 'Tempo Set',
    description: 'Control exercise tempo for specific training adaptations',
    icon: Zap,
    available: false,
    comingSoon: true
  }
];

export function SpecialSetsModal({ exercises, onCreateSuperset, onClose }: SpecialSetsModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showSupersetCreator, setShowSupersetCreator] = useState(false);

  const handleSpecialSetSelect = (typeId: string) => {
    if (typeId === 'superset') {
      setShowSupersetCreator(true);
    } else {
      // For future implementation
      console.log(`${typeId} coming soon!`);
    }
  };

  const handleSupersetCreate = (exerciseIds: string[], parameters: any) => {
    onCreateSuperset(exerciseIds, parameters);
    setShowSupersetCreator(false);
    onClose();
  };

  if (showSupersetCreator) {
    return (
      <SupersetCreator
        exercises={exercises}
        onCreateSuperset={handleSupersetCreate}
        onClose={() => setShowSupersetCreator(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Special Sets
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6 overflow-y-auto">
          {/* Instructions */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-2">Advanced Training Techniques</h3>
            <p className="text-sm text-purple-800">
              Special sets help you break through plateaus and add variety to your training. 
              Choose a technique to enhance your workout intensity and effectiveness.
            </p>
          </div>

          {/* Special Set Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SPECIAL_SET_TYPES.map((type) => {
              const Icon = type.icon;
              const isAvailable = type.available;
              
              return (
                <div
                  key={type.id}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-all relative",
                    isAvailable
                      ? "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                      : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                  )}
                  onClick={() => isAvailable && handleSpecialSetSelect(type.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isAvailable ? "bg-purple-100" : "bg-gray-200"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isAvailable ? "text-purple-600" : "text-gray-400"
                      )} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{type.name}</h4>
                        {type.comingSoon && (
                          <Badge variant="secondary" className="text-xs">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      
                      {type.id === 'superset' && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Available Now
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Requirements */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Requirements</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You need at least 2 exercises to create a superset</li>
              <li>• Other special sets will be available in future updates</li>
              <li>• Special sets can be mixed with regular exercises in the same workout</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
