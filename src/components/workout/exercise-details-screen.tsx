import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Exercise, ExerciseSet } from '@/types/exercise';

interface ExerciseDetailsScreenProps {
  exercise: Exercise;
  onBack: () => void;
  onSave: (sets: ExerciseSet[]) => void;
}

export function ExerciseDetailsScreen({ exercise, onBack, onSave }: ExerciseDetailsScreenProps) {
  const [sets, setSets] = useState<ExerciseSet[]>([
    { weight: 0, reps: 0, rpe: 8, isWarmup: false }
  ]);

  const addSet = () => {
    setSets([...sets, { weight: 0, reps: 0, rpe: 8, isWarmup: false }]);
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const updateSet = (index: number, field: keyof ExerciseSet, value: number | boolean) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  const handleSave = () => {
    onSave(sets);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-5 flex items-center border-b border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">{exercise.name}</h2>
      </div>

      {/* Sets List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {sets.map((set, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="flex-1">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Weight (kg)</label>
                    <Input
                      type="number"
                      value={set.weight}
                      onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Reps</label>
                    <Input
                      type="number"
                      value={set.reps}
                      onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">RPE</label>
                    <Input
                      type="number"
                      value={set.rpe}
                      onChange={(e) => updateSet(index, 'rpe', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={set.isWarmup}
                    onCheckedChange={(checked) => updateSet(index, 'isWarmup', checked as boolean)}
                  />
                  <span className="text-sm">Warmup</span>
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSet(index)}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={addSet}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Set
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleSave}
          >
            Save Exercise
          </Button>
        </div>
      </div>
    </div>
  );
} 