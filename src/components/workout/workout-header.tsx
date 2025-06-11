import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WorkoutHeaderProps {
  onTerminateWorkout: () => void;
  onCompleteWorkout: () => void;
  className?: string;
  hasChanges: boolean;
}

export function WorkoutHeader({ onTerminateWorkout, onCompleteWorkout, className, hasChanges }: WorkoutHeaderProps) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsRunning(true);
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ].filter(Boolean).join(':');
  };

  const handleTerminateClick = useCallback(() => {
    if (hasChanges) {
      setIsExitDialogOpen(true);
    } else {
      onTerminateWorkout();
      router.push('/');
    }
  }, [onTerminateWorkout, router, hasChanges]);

  const handleConfirmExit = useCallback(() => {
    onTerminateWorkout();
    router.push('/');
    setIsExitDialogOpen(false);
  }, [onTerminateWorkout, router]);

  const handleCompleteClick = useCallback(() => {
    onCompleteWorkout();
  }, [onCompleteWorkout]);

  return (
    <>
      <header className={`w-full bg-background px-4 py-4 flex justify-between items-center border-b border-gray-200 ${className || ''}`}>
        <Button variant="ghost" size="icon" onClick={handleTerminateClick}>
          <X className="h-5 w-5 text-red-500" />
        </Button>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <span className="text-xl font-semibold">{formatTime(time)}</span>
        </div>

        <Button variant="ghost" size="icon" onClick={handleCompleteClick}>
          <Check className="h-5 w-5 text-green-500" />
        </Button>
      </header>

      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Workout?</DialogTitle>
            <DialogDescription>
              {hasChanges ? (
                "You have unsaved changes. Are you sure you want to exit? This action cannot be undone."
              ) : (
                "Are you sure you want to exit this workout?"
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsExitDialogOpen(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmExit}
              className="flex-1 sm:flex-none"
            >
              Exit Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 