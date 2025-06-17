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
import { sendStreamingChatMessage, ChatMessage as ServiceChatMessage, StreamingChatResponse } from '@/services/ai-chat-service';
import ReactMarkdown from 'react-markdown';
import { ChatMessageSkeleton } from '@/components/ui/skeleton';

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
      content: "Hi! I'm **Gymzy**, your AI fitness coach. I can help you create workouts, find exercises, and start training sessions. What would you like to work on today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
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
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Create a placeholder message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    setStreamingMessageId(assistantMessageId);

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      let accumulatedContent = ""; // To store the full response content
      const streamingChatResponse = await sendStreamingChatMessage(
        user!.uid, // Assuming user object is available and has uid
        currentInput,
        messages.map(m => ({ // Map to ServiceChatMessage if necessary
          id: m.id,
          role: m.role === 'user' ? 'user' : 'assistant', // Ensure role is 'user'|'assistant'|'system'
          content: m.content,
          timestamp: m.timestamp,
          // userId: user!.uid // userId might be needed per message in history for some services
        })),
        (chunk: string) => {
          accumulatedContent += chunk;
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + chunk } // Append chunk for streaming display
              : msg
          ));
        }
      );

      // After streaming is complete, streamingChatResponse contains toolCalls and workoutData
      // The `accumulatedContent` has the full text.
      // Update the assistant's message with the full content and any tool/workout data.
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: accumulatedContent, // Use the fully accumulated content
              toolCalls: streamingChatResponse.toolCalls,
              workoutData: streamingChatResponse.workoutData
            }
          : msg
      ));

      // Force a re-render to ensure workout button appears (if this is still needed)
      setTimeout(() => {
        setMessages(prev => [...prev]);
      }, 100);

    } catch (error) {
      console.error('Error generating AI response:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: "I'm sorry, I encountered an error. Please try again."
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
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
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                      code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-200 pl-3 italic">{children}</blockquote>
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                
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
                      onClick={() => {
                        console.log('Start workout clicked:', message.workoutData);
                        handleStartWorkout(message.workoutData);
                      }}
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
        
        {isLoading && !streamingMessageId && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-gray-500">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="p-3 rounded-lg bg-gray-100">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Gymzy is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {streamingMessageId && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-gray-500">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="p-3 rounded-lg bg-gray-100">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Typing...</span>
                </div>
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
