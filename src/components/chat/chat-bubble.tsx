"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  workoutData?: {
    exercises: any[];
    workoutId: string;
  };
  onStartWorkout?: (workoutData: any) => void;
}

export function ChatBubble({ role, content, workoutData, onStartWorkout }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      className={`p-3 rounded-xl max-w-[75%] leading-relaxed
        ${
          isUser
            ? 'bg-primary text-white self-end ml-auto rounded-br-none'
            : 'bg-gray-100 text-gray-800 self-start mr-auto rounded-bl-none'
        }`}
    >
      {isUser ? (
        <div className="whitespace-pre-wrap">{content}</div>
      ) : (
        <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      )}

      {/* Workout Start Button */}
      {!isUser && workoutData && onStartWorkout && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Button
            onClick={() => onStartWorkout(workoutData)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Start This Workout
          </Button>
        </div>
      )}
    </div>
  );
}