'use client';

/**
 * Quick Action Button
 *
 * Phase 1 MVP: Floating action button for single natural language commands
 * Opens modal with input -> Sends to API -> Handles navigation/feedback
 */

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function QuickActionButton() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !user) return;

    setIsProcessing(true);

    try {
      // Get Firebase ID token for authentication
      let idToken: string;
      try {
        // Use Firebase auth instance to get current user's token
        const { auth } = await import('@/lib/firebase');
        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error('Not authenticated');
        }

        idToken = await currentUser.getIdToken(/* forceRefresh */ true);
        console.log('[QuickAction] Got ID token, length:', idToken.length);
      } catch (tokenError) {
        console.error('[QuickAction] Failed to get ID token:', tokenError);
        toast({
          title: 'Authentication Error',
          description: 'Please try signing out and signing back in.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/quick-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: input.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.message || 'Failed to process your request',
          variant: 'destructive',
        });
        return;
      }

      // Show success message
      toast({
        title: 'Success',
        description: result.message || 'Action completed',
      });

      // Handle navigation if needed
      if (result.navigationTarget) {
        router.push(result.navigationTarget);
      }

      // Close dialog and clear input
      setOpen(false);
      setInput('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't show if user is not logged in
  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
        aria-label="Quick Action"
      >
        <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Quick Action Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] fixed bottom-20 right-4 left-4 sm:left-auto top-auto translate-x-0 translate-y-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Quick Action
            </DialogTitle>
            <DialogDescription>
              Tell me what you want to do in natural language
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAction} className="space-y-4">
            <div className="space-y-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Try "show my stats" or "go to profile"...'
                autoFocus
                disabled={isProcessing}
                className="text-base"
              />

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Examples:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Show my workout stats</li>
                  <li>What is my best bench press?</li>
                  <li>Go to my profile</li>
                  <li>View my workout history</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Execute
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
