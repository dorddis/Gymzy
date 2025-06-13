"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Play,
  Dumbbell,
  Search,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useRouter } from 'next/navigation';
import { AI_WORKOUT_TOOLS, executeAITool, WorkoutExercise } from '@/services/ai-workout-tools';
import { generateAIResponse } from '@/services/ai-service';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    name: string;
    parameters: any;
    result: any;
  }>;
  workoutData?: {
    exercises: WorkoutExercise[];
    workoutId: string;
  };
}

interface AIChatInterfaceProps {
  onStartWorkout?: (exercises: WorkoutExercise[]) => void;
}

export function AIChatInterface({ onStartWorkout }: AIChatInterfaceProps) {
  const { user } = useAuth();
  const { setCurrentWorkoutExercises } = useWorkout();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI fitness coach. I can help you create workouts, find exercises, and start training sessions. What would you like to work on today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Generate AI response with tool capabilities
      const aiResponse = await generateAIResponseWithTools(inputMessage, messages);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        toolCalls: aiResponse.toolCalls,
        workoutData: aiResponse.workoutData
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponseWithTools = async (userInput: string, chatHistory: ChatMessage[]) => {
    // Analyze user input to determine if tools should be used
    const lowerInput = userInput.toLowerCase();
    
    let toolCalls: any[] = [];
    let workoutData: any = null;
    let responseContent = '';

    // Check for workout creation requests
    if (lowerInput.includes('create workout') || lowerInput.includes('make workout') || lowerInput.includes('design workout')) {
      try {
        // Extract workout parameters from user input (simplified)
        const workoutParams = extractWorkoutParams(userInput);
        const result = await executeAITool('create_workout', workoutParams);
        
        toolCalls.push({
          name: 'create_workout',
          parameters: workoutParams,
          result
        });

        workoutData = {
          exercises: result.exercises,
          workoutId: result.workoutId
        };

        responseContent = `I've created a ${workoutParams.workoutName} workout for you! Here's what I've prepared:\n\n`;
        result.exercises.forEach((ex: WorkoutExercise, index: number) => {
          responseContent += `${index + 1}. **${ex.name}** - ${ex.sets.length} sets of ${ex.sets[0]?.reps || 8} reps\n`;
        });
        responseContent += '\nWould you like to start this workout now?';
      } catch (error) {
        responseContent = "I had trouble creating that workout. Could you be more specific about what exercises you'd like to include?";
      }
    }
    // Check for exercise search requests
    else if (lowerInput.includes('find exercise') || lowerInput.includes('search exercise') || lowerInput.includes('what exercises')) {
      try {
        const searchQuery = extractSearchQuery(userInput);
        const result = await executeAITool('search_exercises', { query: searchQuery, limit: 5 });
        
        toolCalls.push({
          name: 'search_exercises',
          parameters: { query: searchQuery },
          result
        });

        responseContent = `I found these exercises for "${searchQuery}":\n\n`;
        result.exercises.forEach((ex: any, index: number) => {
          responseContent += `${index + 1}. **${ex.name}** - Targets: ${ex.primaryMuscles.join(', ')}\n`;
        });
      } catch (error) {
        responseContent = "I couldn't find exercises matching your request. Try being more specific!";
      }
    }
    // Check for workout suggestions
    else if (lowerInput.includes('suggest workout') || lowerInput.includes('recommend workout') || lowerInput.includes('workout plan')) {
      try {
        const planParams = extractPlanParams(userInput);
        const result = await executeAITool('suggest_workout_plan', planParams);
        
        toolCalls.push({
          name: 'suggest_workout_plan',
          parameters: planParams,
          result
        });

        const plan = result.workoutPlan;
        responseContent = `Here's a ${plan.name} I recommend:\n\n**Duration:** ${plan.duration} minutes\n**Difficulty:** ${plan.difficulty}\n\n**Exercises:**\n`;
        plan.exercises.forEach((ex: any, index: number) => {
          responseContent += `${index + 1}. ${ex.name} - ${ex.sets} sets of ${ex.reps} reps\n`;
        });
        responseContent += '\nWould you like me to create this workout for you?';
      } catch (error) {
        responseContent = "I can suggest a workout! Tell me your fitness goal (strength, muscle gain, weight loss, etc.) and how much time you have.";
      }
    }
    // Default AI response
    else {
      responseContent = await generateContextualResponse(userInput, chatHistory);
    }

    return {
      content: responseContent,
      toolCalls,
      workoutData
    };
  };

  const extractWorkoutParams = (input: string) => {
    // Simplified parameter extraction - in a real app, you'd use more sophisticated NLP
    const lowerInput = input.toLowerCase();
    
    let workoutName = 'Custom Workout';
    let exercises = [];

    if (lowerInput.includes('push')) {
      workoutName = 'Push Day';
      exercises = [
        { exerciseId: 'push-ups', sets: 3, reps: 10 },
        { exerciseId: 'overhead-press', sets: 3, reps: 8 },
        { exerciseId: 'dips', sets: 3, reps: 8 }
      ];
    } else if (lowerInput.includes('leg')) {
      workoutName = 'Leg Day';
      exercises = [
        { exerciseId: 'squat', sets: 4, reps: 10 },
        { exerciseId: 'romanian-deadlift', sets: 3, reps: 10 },
        { exerciseId: 'calf-raises', sets: 3, reps: 15 }
      ];
    } else if (lowerInput.includes('core') || lowerInput.includes('abs')) {
      workoutName = 'Core Workout';
      exercises = [
        { exerciseId: 'plank', sets: 3, reps: 60 },
        { exerciseId: 'russian-twists', sets: 3, reps: 20 },
        { exerciseId: 'bicycle-crunches', sets: 3, reps: 20 }
      ];
    } else {
      // Default full body
      exercises = [
        { exerciseId: 'push-ups', sets: 3, reps: 10 },
        { exerciseId: 'squat', sets: 3, reps: 12 },
        { exerciseId: 'plank', sets: 2, reps: 45 }
      ];
    }

    return { workoutName, exercises };
  };

  const extractSearchQuery = (input: string): string => {
    // Extract search terms from user input
    const words = input.toLowerCase().split(' ');
    const searchWords = words.filter(word => 
      !['find', 'search', 'exercise', 'exercises', 'for', 'what', 'are', 'some'].includes(word)
    );
    return searchWords.join(' ') || 'chest';
  };

  const extractPlanParams = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    let goal = 'general_fitness';
    let experience = 'intermediate';
    let duration = 30;

    if (lowerInput.includes('strength')) goal = 'strength';
    else if (lowerInput.includes('muscle') || lowerInput.includes('gain')) goal = 'muscle_gain';
    else if (lowerInput.includes('weight loss') || lowerInput.includes('lose weight')) goal = 'weight_loss';
    else if (lowerInput.includes('endurance') || lowerInput.includes('cardio')) goal = 'endurance';

    if (lowerInput.includes('beginner')) experience = 'beginner';
    else if (lowerInput.includes('advanced')) experience = 'advanced';

    const durationMatch = lowerInput.match(/(\d+)\s*min/);
    if (durationMatch) duration = parseInt(durationMatch[1]);

    return { goal, experience, duration };
  };

  const generateContextualResponse = async (input: string, history: ChatMessage[]): Promise<string> => {
    // Generate contextual responses based on input
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! I'm here to help you with your fitness journey. I can create custom workouts, find exercises, and help you start training. What would you like to do?";
    }
    
    if (lowerInput.includes('help')) {
      return "I can help you with:\n• Creating custom workouts\n• Finding specific exercises\n• Suggesting workout plans\n• Starting workout sessions\n\nJust tell me what you'd like to work on!";
    }

    return "I'm here to help with your fitness goals! You can ask me to create workouts, find exercises, or suggest training plans. What would you like to do?";
  };

  const handleStartWorkout = (workoutData: any) => {
    if (workoutData?.exercises) {
      setCurrentWorkoutExercises(workoutData.exercises);
      router.push('/workout');
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2 rounded-full ${message.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'}`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <div className={`p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Tool Results */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.toolCalls.map((tool, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tool.name === 'create_workout' && <Dumbbell className="h-3 w-3 mr-1" />}
                        {tool.name === 'search_exercises' && <Search className="h-3 w-3 mr-1" />}
                        {tool.name === 'suggest_workout_plan' && <Target className="h-3 w-3 mr-1" />}
                        {tool.name.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Workout Start Button */}
                {message.workoutData && (
                  <div className="mt-3">
                    <Button
                      onClick={() => handleStartWorkout(message.workoutData)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start This Workout
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-gray-500">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="p-3 rounded-lg bg-gray-100">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me to create a workout, find exercises, or suggest a plan..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
