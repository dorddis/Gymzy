'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft, Loader2, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/contexts/ChatContext';
import { ChatBubble } from '@/components/chat/chat-bubble';
import { ModelSelector } from '@/components/ModelSelector';

export default function ChatPage() {
  const { messages, sendMessage, isLoading, error, startNewChat } = useChat();
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    await sendMessage(input, selectedModel);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background text-primary p-4">
        <p>Error: {error.message}</p>
        <p>Please ensure your Firebase is configured correctly and you are logged in.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-primary font-inter">
      {/* Header */}
      <div className="p-4 bg-background flex justify-between items-center relative z-10">
        {/* Left: Back button */}
        <button
          onClick={() => router.back()}
          className="text-primary hover:text-secondary transition-colors focus:outline-none p-1"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        {/* Center: Gymzy Title and Model Selector */}
        <div className="flex items-center flex-grow justify-center space-x-2">
          <h2 className="text-lg font-semibold text-primary">Gymzy</h2>
          <div className="w-32">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          </div>
        </div>
        
        {/* Right: Refresh icon */}
        <button
          onClick={startNewChat}
          className="text-primary hover:text-secondary transition-colors focus:outline-none p-1"
          aria-label="Start new chat"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 flex flex-col relative">
        <div className="space-y-3">
          {messages.map((msg, index) => (
            <ChatBubble key={index} role={msg.role} content={msg.content} />
          ))}
          {isLoading && (
            <div className="bg-primary/10 text-primary p-3 rounded-lg max-w-[75%] animate-pulse self-start mr-auto">
              <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />Typing...
            </div>
          )}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background flex items-center justify-center relative z-10 border-t border-primary/20">
        <div className="relative w-full max-w-2xl bg-secondary/10 rounded-xl flex items-center p-2">
          {/* Plus icon */}
          <button className="text-primary hover:text-secondary p-2 rounded-lg transition-colors focus:outline-none">
            +
          </button>
          {/* Textarea for input */}
          <textarea
            placeholder="Message Gymzy"
            rows={1}
            className="flex-grow p-2 bg-transparent text-primary text-base resize-none overflow-y-hidden focus:outline-none placeholder-primary/60"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            style={{ minHeight: '24px', maxHeight: '150px' }}
          ></textarea>
          {/* Tools / Mic icons */}
          <div className="flex items-center space-x-2 mr-2">
            <button className="text-primary hover:text-secondary text-sm focus:outline-none p-1">Tools</button>
            <button className="text-primary hover:text-secondary p-1 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </button>
          </div>
          {/* Send button */}
          <button
            onClick={handleSendMessage}
            className="bg-secondary text-white w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors hover:bg-secondary/90 focus:outline-none disabled:opacity-50"
            disabled={isLoading}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 