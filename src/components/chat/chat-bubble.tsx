"use client";

import React from 'react';

interface ChatBubbleProps {
  role: 'user' | 'ai';
  content: string;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      className={`p-3 rounded-xl max-w-[75%] leading-snug
        ${
          isUser
            ? 'bg-primary text-white self-end ml-auto rounded-br-none'
            : 'bg-gray-100 text-gray-800 self-start mr-auto rounded-bl-none'
        }`}
    >
      {content}
    </div>
  );
} 