import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Camera, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMultipleMedia } from '@/services/media-service';

interface FinishWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function FinishWorkoutModal({ open, onOpenChange, onSave }: FinishWorkoutModalProps) {
  const { currentWorkoutExercises, totalVolume, addWorkout } = useWorkout();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [dateTime, setDateTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setMediaFiles(prev => [...prev, ...files]);
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a workout.",
        variant: "destructive",
      });
      return;
    }

    const selectedDate = new Date(dateTime);
    if (selectedDate > new Date()) {
      toast({
        title: "Error",
        description: "Workout date and time cannot be in the future.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      setUploadProgress(0);

      // Create a temporary workout ID for media uploads
      const tempWorkoutId = `temp_${Date.now()}`;

      // Upload media files if any
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        try {
          mediaUrls = await uploadMultipleMedia(mediaFiles, user.uid, tempWorkoutId);
          setUploadProgress(100);
        } catch (error) {
          console.error('Error uploading media:', error);
          toast({
            title: "Warning",
            description: "Some media files failed to upload. The workout will be saved without them.",
            variant: "destructive",
          });
        }
      }

      // Create workout data
      const workoutData = {
        userId: user.uid,
        title: `Workout ${new Date().toLocaleDateString()}`,
        date: Timestamp.fromDate(new Date(dateTime)),
        exercises: currentWorkoutExercises.map(exercise => ({
          exerciseId: exercise.id,
          name: exercise.name,
          sets: exercise.sets.map(set => ({
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe || 0,
            isWarmup: set.isWarmup || false,
          })),
          targetedMuscles: exercise.primaryMuscles,
          notes: exercise.notes || '',
          order: exercise.order || 0,
        })),
        totalVolume,
        notes,
        mediaUrls,
        isPublic,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addWorkout(workoutData);

      toast({
        title: "Workout saved!",
        description: "Your workout has been successfully saved.",
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error saving workout",
        description: "There was an error saving your workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-w-lg w-[90vw] md:w-full h-auto max-h-[95vh] p-0 rounded-xl overflow-hidden">
        <div className="px-4 py-5 flex justify-between items-center border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold">Finish Workout</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="datetime">Date & Time</Label>
            <input
              type="datetime-local"
              id="datetime"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">How do you feel?</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this workout..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24 resize-none"
              maxLength={500}
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label>Media</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
              <input
                type="file"
                id="media-upload"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaUpload}
                className="hidden"
              />
              <label
                htmlFor="media-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Tap to upload photo or video</p>
              </label>
              {mediaFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMediaFile(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="privacy">Make this workout public</Label>
            <Switch
              id="privacy"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold shadow-sm hover:opacity-95 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Saving...'}</span>
              </div>
            ) : (
              'Save Workout'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 