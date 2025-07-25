"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useChatActions } from '@/components/chat/chat-action-handler';
import { useAppLayout } from '@/components/layout/app-layout-provider';
import { useAppChatBridge } from '@/contexts/AppChatBridgeContext';
import { visualFeedbackUtils } from '@/components/ui/visual-feedback';
import { notificationUtils } from '@/components/ui/notification-system';

export function ChatIntegrationDemo() {
  const { isDesktopLayout } = useAppLayout();
  const chatActions = useChatActions();
  const bridge = useAppChatBridge();
  const [demoActive, setDemoActive] = useState(false);

  // Sample workout data
  const sampleWorkout = [
    {
      id: 'exercise-1',
      name: 'Push-ups',
      sets: [
        { weight: 0, reps: 10, isWarmup: false, isExecuted: false },
        { weight: 0, reps: 12, isWarmup: false, isExecuted: false },
        { weight: 0, reps: 15, isWarmup: false, isExecuted: false },
      ],
      muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
      equipment: 'Bodyweight',
      primaryMuscles: ['Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders']
    },
    {
      id: 'exercise-2',
      name: 'Squats',
      sets: [
        { weight: 0, reps: 12, isWarmup: false, isExecuted: false },
        { weight: 0, reps: 12, isWarmup: false, isExecuted: false },
        { weight: 0, reps: 12, isWarmup: false, isExecuted: false },
      ],
      muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
      equipment: 'Bodyweight',
      primaryMuscles: ['Quadriceps'],
      secondaryMuscles: ['Glutes', 'Hamstrings']
    },
  ];

  // Run a demo of chat-to-app interactions
  const runDemo = async () => {
    setDemoActive(true);
    
    try {
      // Step 1: Show notification
      notificationUtils.info('Demo Started', 'Starting chat integration demo...');
      await delay(1000);
      
      // Step 2: Highlight this component
      visualFeedbackUtils.highlightInfo('.chat-integration-demo', 'This is the demo component');
      await delay(2000);
      
      // Step 3: Create a workout
      notificationUtils.info('Creating Workout', 'The AI assistant is creating a workout for you');
      await delay(1500);
      
      // Step 4: Trigger workout creation
      chatActions.createWorkout(sampleWorkout);
      await delay(2000);
      
      // Step 5: Show stats
      chatActions.showStats();
      await delay(2000);
      
      // Step 6: Navigate back home
      chatActions.navigateTo('/');
      await delay(1000);
      
      // Step 7: Finish demo
      notificationUtils.success('Demo Complete', 'Chat integration demo completed successfully!');
    } catch (error) {
      notificationUtils.error('Demo Error', 'An error occurred during the demo');
      console.error('Demo error:', error);
    } finally {
      setDemoActive(false);
    }
  };

  // Helper function to create delays
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Send a message to the chat
  const sendChatMessage = (message: string) => {
    bridge.triggerChatMessage(message);
    notificationUtils.info('Message Sent', `Sent to chat: "${message}"`);
  };

  if (!isDesktopLayout) {
    return null; // Only show in desktop layout
  }

  return (
    <Card className="p-4 chat-integration-demo">
      <h3 className="text-lg font-semibold mb-4">Chat Integration Demo</h3>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          This demo shows how the AI chat can control the app interface.
          Click the buttons below to see different interactions.
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={runDemo} 
            disabled={demoActive}
            className="w-full"
          >
            {demoActive ? 'Demo Running...' : 'Run Full Demo'}
          </Button>
          
          <Button 
            onClick={() => sendChatMessage('Create a workout for me')} 
            variant="outline"
            className="w-full"
          >
            Send Chat Message
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => chatActions.showStats()} 
            variant="secondary"
            className="w-full"
          >
            Show Stats
          </Button>
          
          <Button 
            onClick={() => visualFeedbackUtils.highlightSuccess('.chat-integration-demo', 'Highlighted!')} 
            variant="secondary"
            className="w-full"
          >
            Highlight Element
          </Button>
        </div>
      </div>
    </Card>
  );
}