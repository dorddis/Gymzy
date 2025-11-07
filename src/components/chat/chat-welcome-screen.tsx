import React from 'react';
import { MessageSquare } from 'lucide-react';

interface ChatWelcomeScreenProps {
  userName?: string;
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatWelcomeScreen({ userName, onSuggestionClick }: ChatWelcomeScreenProps) {
  const displayName = userName || 'there';

  const suggestions = [
    {
      title: 'Workout Planning',
      description: 'Create personalized workout routines',
      prompt: 'Can you help me create a personalized workout routine?'
    },
    {
      title: 'Exercise Form',
      description: 'Get guidance on proper technique',
      prompt: 'Can you explain proper form for exercises?'
    },
    {
      title: 'Nutrition Advice',
      description: 'Learn about diet and supplements',
      prompt: 'Can you give me nutrition advice for my fitness goals?'
    },
    {
      title: 'Progress Tracking',
      description: 'Analyze your fitness journey',
      prompt: 'How can I track my fitness progress effectively?'
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
          <MessageSquare className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Hey, {displayName}
        </h1>
        <p className="text-xl text-gray-600">
          How can I help you today?
        </p>
      </div>

      <div className="max-w-2xl w-full space-y-4">
        <p className="text-sm text-gray-500 mb-6">
          I'm Gymzy, your AI fitness companion. I can help you with:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick?.(suggestion.prompt)}
              className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer text-left"
            >
              <div className="font-semibold text-gray-900 mb-1">{suggestion.title}</div>
              <div className="text-sm text-gray-600">{suggestion.description}</div>
            </button>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Type a message below to get started
          </p>
        </div>
      </div>
    </div>
  );
}
