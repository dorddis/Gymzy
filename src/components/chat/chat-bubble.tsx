"use client";

import React from 'react';
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

  // Format content with basic markdown-like formatting
  const formatContent = (text: string) => {
    // Split by double newlines for paragraphs
    const paragraphs = text.split('\n\n');

    return paragraphs.map((paragraph, index) => {
      // Handle bullet points
      if (paragraph.includes('•') || paragraph.includes('-')) {
        const lines = paragraph.split('\n');
        return (
          <div key={index} className={index > 0 ? 'mt-3' : ''}>
            {lines.map((line, lineIndex) => {
              if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                return (
                  <div key={lineIndex} className="flex items-start mb-1">
                    <span className="mr-2 mt-1">•</span>
                    <span>{line.replace(/^[•-]\s*/, '')}</span>
                  </div>
                );
              }
              return <div key={lineIndex} className="mb-1">{line}</div>;
            })}
          </div>
        );
      }

      // Handle numbered lists
      if (/^\d+\./.test(paragraph.trim())) {
        const lines = paragraph.split('\n');
        return (
          <div key={index} className={index > 0 ? 'mt-3' : ''}>
            {lines.map((line, lineIndex) => {
              if (/^\d+\./.test(line.trim())) {
                return (
                  <div key={lineIndex} className="mb-1">
                    {line}
                  </div>
                );
              }
              return <div key={lineIndex} className="mb-1 ml-4">{line}</div>;
            })}
          </div>
        );
      }

      // Regular paragraphs
      return (
        <div key={index} className={index > 0 ? 'mt-3' : ''}>
          {paragraph.split('\n').map((line, lineIndex) => (
            <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
              {line}
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div
      className={`p-3 rounded-xl max-w-[75%] leading-relaxed
        ${
          isUser
            ? 'bg-primary text-white self-end ml-auto rounded-br-none'
            : 'bg-gray-100 text-gray-800 self-start mr-auto rounded-bl-none'
        }`}
    >
      {isUser ? content : formatContent(content)}

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