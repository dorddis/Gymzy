import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export function AddWorkoutModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 rounded-xl">
        <DialogTitle className="text-xl font-semibold mb-4">Add Workout</DialogTitle>
        {/* Placeholder for Add Workout Modal Content */}
        <div className="p-6 pt-0">
          <p className="text-gray-500">(Modal content will be implemented as per design/add-workout.html.txt)</p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 