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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [dateTime, setDateTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not supported. Please upload images (JPEG, PNG, GIF) or videos (MP4, MOV).`
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds 10MB limit. Please choose a smaller file.`
      };
    }

    return { isValid: true };
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate each file
    const validationResults = files.map(file => ({
      file,
      ...validateFile(file)
    }));

    // Separate valid and invalid files
    const validFiles = validationResults.filter(result => result.isValid).map(result => result.file);
    const invalidFiles = validationResults.filter(result => !result.isValid);

    // Show error messages for invalid files
    invalidFiles.forEach(result => {
      toast({
        title: "Invalid file",
        description: result.error,
        variant: "destructive",
      });
    });

    // Add valid files to state
    if (validFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...validFiles]);
      
      // Show success message if any files were added
      if (validFiles.length === files.length) {
        toast({
          title: "Files added",
          description: `Added ${validFiles.length} file(s) to upload.`,
        });
      } else {
        toast({
          title: "Partial success",
          description: `Added ${validFiles.length} of ${files.length} files. Some files were invalid.`,
          variant: "warning",
        });
      }
    }

    // Reset the input value to allow selecting the same file again
    event.target.value = '';
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

    try {
      setIsSaving(true);
      setUploadProgress(0);
      console.log("handleSave: Starting save process.");

      // Create a temporary workout ID for media uploads
      const tempWorkoutId = `temp_${Date.now()}`;
      console.log("handleSave: Temporary workout ID generated:", tempWorkoutId);

      // Upload media files if any
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        console.log("handleSave: Uploading media files...");
        try {
          // Show initial upload progress
          setUploadProgress(10);
          toast({
            title: "Uploading media",
            description: `Starting upload of ${mediaFiles.length} file(s)...`,
          });

          // Upload files with progress tracking
          const uploadResults = await uploadMultipleMedia(
            mediaFiles,
            user.uid,
            tempWorkoutId,
            (progress) => {
              setUploadProgress(progress);
              if (progress % 20 === 0) { // Update toast every 20%
                toast({
                  title: "Uploading media",
                  description: `Uploading... ${progress}% complete`,
                });
              }
            }
          );
          
          // Extract secure URLs from Cloudinary responses
          mediaUrls = uploadResults.map(result => result.secure_url);
          
          setUploadProgress(100);
          console.log("handleSave: Media uploaded successfully:", mediaUrls);
          
          toast({
            title: "Media uploaded",
            description: `Successfully uploaded ${mediaUrls.length} file(s).`,
          });
        } catch (error) {
          console.error('Error uploading media:', error);
          
          // Check if any files were uploaded successfully
          if (mediaUrls.length > 0) {
            toast({
              title: "Partial Upload",
              description: `Only ${mediaUrls.length} of ${mediaFiles.length} files were uploaded. The workout will be saved with available media.`,
              variant: "warning",
            });
          } else {
            toast({
              title: "Media Upload Failed",
              description: "Could not upload media files. The workout will be saved without media.",
              variant: "destructive",
            });
          }
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
            weight: set.weight || 0,
            reps: set.reps || 0,
            rpe: (set.rpe !== undefined && set.rpe >= 1 && set.rpe <= 10) ? set.rpe : undefined,
            isWarmup: set.isWarmup || false,
            isExecuted: set.isExecuted || false,
          })),
          targetedMuscles: exercise.primaryMuscles || [],
          notes: exercise.notes || '',
          order: exercise.order || 0,
        })),
        totalVolume: totalVolume || 0,
        notes: notes || '',
        mediaUrls: mediaUrls || [],
        isPublic: isPublic || false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Debug logging
      console.log('Workout data before saving:', JSON.stringify(workoutData, null, 2));
      Object.entries(workoutData).forEach(([key, value]) => {
        if (value === undefined) {
          console.error(`Undefined field in workout data: ${key}`);
        }
      });

      // Show saving workout toast
      toast({
        title: "Saving workout",
        description: "Saving your workout data...",
      });

      // Remove createdAt and updatedAt as they are added by createWorkout
      const { createdAt, updatedAt, ...workoutDataToSave } = workoutData;
      
      // Debug logging for final data
      console.log('Workout data to save:', JSON.stringify(workoutDataToSave, null, 2));
      Object.entries(workoutDataToSave).forEach(([key, value]) => {
        if (value === undefined) {
          console.error(`Undefined field in final workout data: ${key}`);
        }
      });

      await addWorkout(workoutDataToSave);
      console.log("handleSave: addWorkout completed.");

      toast({
        title: "Workout saved!",
        description: mediaUrls.length > 0 
          ? `Your workout has been saved with ${mediaUrls.length} media file(s).`
          : "Your workout has been saved successfully.",
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("handleSave: Error during save process:", error);
      toast({
        title: "Error saving workout",
        description: error instanceof Error 
          ? error.message 
          : "There was an error saving your workout. Please try again.",
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
                disabled={isSaving}
              />
              <label
                htmlFor="media-upload"
                className={`flex flex-col items-center justify-center cursor-pointer ${
                  isSaving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {isSaving ? 'Uploading...' : 'Tap to upload photo or video'}
                </p>
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
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {isSaving && uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploading... {uploadProgress}%
                  </p>
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
        <div className="px-4 py-3 border-t border-gray-200">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Saving...' : 'Save Workout'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 