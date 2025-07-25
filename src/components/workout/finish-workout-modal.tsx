import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { MediaUpload } from './media-upload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMultipleMedia } from '@/services/media/media-service';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FinishWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    date: Date;
    notes: string;
    isPublic: boolean;
    mediaUrls: string[];
  }) => Promise<void>;
}

export function FinishWorkoutModal({ open, onOpenChange, onSave }: FinishWorkoutModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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
          console.error("handleSave: Error uploading media:", error);
          toast({
            title: "Error uploading media",
            description: error instanceof Error ? error.message : "Failed to upload media files.",
            variant: "destructive",
          });
          throw error;
        }
      }

      // Save workout data
      console.log("handleSave: Saving workout data...");
      await onSave({
        date,
        notes,
        isPublic,
        mediaUrls,
      });

      console.log("handleSave: Workout saved successfully.");
      toast({
        title: "Workout saved",
        description: "Your workout has been saved successfully.",
      });

      // Reset form and close modal
      setDate(new Date());
      setNotes('');
      setIsPublic(false);
      setMediaFiles([]);
      setUploadProgress(0);
      onOpenChange(false);
    } catch (error) {
      console.error("handleSave: Error saving workout:", error);
      toast({
        title: "Error saving workout",
        description: error instanceof Error ? error.message : "Failed to save workout.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[425px] max-h-[90vh] flex flex-col mx-auto px-4 rounded-xl">
        <DialogHeader className="px-1">
          <DialogTitle>Finish Workout</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 px-1">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                    !date && "text-muted-foreground"
                  )}
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
                <AnimatePresence>
                  {showCalendar && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-50 mt-2 w-[calc(100%-rem)]"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => {
                          setDate(date || new Date());
                          setShowCalendar(false);
                        }}
                        initialFocus
                        disabled={(date) => date > new Date()}
                        className="bg-background border rounded-lg shadow-lg"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes <span className="text-sm text-gray-500 font-normal">(optional)</span></Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about your workout..."
                className="min-h-[100px] border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus-visible:ring-2 focus-visible:ring-blue-200"
              />
            </div>

            <div className="grid gap-2">
              <Label>Media</Label>
              <MediaUpload
                onFilesChange={setMediaFiles}
                onUploadProgress={setUploadProgress}
                isUploading={isSaving}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Label htmlFor="public" className="flex flex-col gap-1">
                <span className="font-medium">Public Workout <span className="text-sm text-gray-500 font-normal">(optional)</span></span>
                <span className="text-sm text-gray-600">
                  Share your workout with the community
                </span>
              </Label>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isSaving}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            <AnimatePresence>
              {isSaving && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {uploadProgress < 100 ? 'Uploading media...' : 'Saving workout...'}
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="relative text-white"
          >
            {isSaving ? (
              <>
                <span className="opacity-0">Save Workout</span>
                <Loader2 className="absolute h-4 w-4 animate-spin" />
              </>
            ) : (
              'Save Workout'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 