"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Send, ChevronLeft, Loader2, MessageSquare, Trash2, Plus, X, AlignRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ChatBubble } from '@/components/chat/chat-bubble';
import { Button } from '@/components/ui/button';
import { 
  createChatSession, 
  getChatSessions, 
  saveChatMessage, 
  getChatMessages, 
  deleteChatSession,
  ChatSession
} from '@/services/chat-history-service';
import { sendStreamingChatMessage } from '@/services/ai-chat-service';
import { useWorkout } from '@/contexts/WorkoutContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  workoutData?: {
    exercises: any[];
    workoutId: string;
  };
}

function ChatContent() {
  const { user } = useAuth();
  const { setCurrentWorkoutExercises } = useWorkout();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on mount
  useEffect(() => {
    if (user?.uid) {
      loadChatSessions();
      createNewChat();
    }
  }, [user]);

  // Handle initial message from URL params
  useEffect(() => {
    const initialMessage = searchParams.get('message');
    if (initialMessage && user?.uid && !currentSessionId) {
      createNewChatWithMessage(initialMessage);
    }
  }, [searchParams, user, currentSessionId]);

  const loadChatSessions = async () => {
    if (!user?.uid) return;
    try {
      const sessions = await getChatSessions(user.uid);
      setChatSessions(sessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const createNewChat = async () => {
    if (!user?.uid) return;
    try {
      const sessionId = await createChatSession(user.uid);
      setCurrentSessionId(sessionId);
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m Gymzy, your personalized AI fitness coach. How can I help you with your fitness journey today?',
        timestamp: new Date()
      }]);
      await loadChatSessions();
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const createNewChatWithMessage = async (initialMessage: string) => {
    if (!user?.uid) return;
    try {
      const sessionId = await createChatSession(user.uid, initialMessage);
      setCurrentSessionId(sessionId);
      setMessages([{
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      }]);
      setInput('');
      
      // Send the message to AI and get response
      await handleSendMessage(initialMessage, sessionId);
      await loadChatSessions();
    } catch (error) {
      console.error('Error creating new chat with message:', error);
    }
  };

  const loadChatSession = async (sessionId: string) => {
    try {
      const chatMessages = await getChatMessages(sessionId);
      const formattedMessages: ChatMessage[] = chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toDate()
      }));
      
      setMessages(formattedMessages);
      setCurrentSessionId(sessionId);
      setShowSidebar(false);
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  const deleteChatSessionHandler = async (sessionId: string) => {
    try {
      await deleteChatSession(sessionId);
      await loadChatSessions();
      
      if (sessionId === currentSessionId) {
        await createNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
    }
  };

  const handleSendMessage = async (message?: string, sessionId?: string) => {
    if (!user?.uid) return;
    
    const messageToSend = message || input.trim();
    const targetSessionId = sessionId || currentSessionId;
    if (!messageToSend || !targetSessionId) return;

    try {
      setIsLoading(true);
      
      if (!message) {
        setInput('');
      }
      
      if (!sessionId) {
        setMessages(prev => [...prev, {
          role: 'user',
          content: messageToSend,
          timestamp: new Date()
        }]);
      }
      
      await saveChatMessage(targetSessionId, 'user', messageToSend);

      const conversationHistory = messages.map(msg => ({
        id: Math.random().toString(36),
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date(),
        userId: user.uid
      }));

      console.log('💬 ChatPage: Sending message to AI service with streaming...');

      // Create a placeholder message for streaming
      const streamingMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, streamingMessage]);

      let fullStreamedContent = '';

      const aiResponse = await sendStreamingChatMessage(
        user.uid,
        messageToSend,
        conversationHistory,
        (chunk: string) => {
          fullStreamedContent += chunk;
          console.log('💬 ChatPage: Received streaming chunk:', chunk);

          // Update the streaming message with new content
          setMessages(prev => prev.map((msg, index) =>
            index === prev.length - 1 && msg.role === 'assistant' && msg.content.length <= fullStreamedContent.length
              ? { ...msg, content: fullStreamedContent }
              : msg
          ));
        }
      );

      console.log('💬 ChatPage: AI streaming response completed:', aiResponse);

      if (aiResponse.success) {
        await saveChatMessage(targetSessionId, 'assistant', fullStreamedContent);

        // Update the final message with workout data
        setMessages(prev => prev.map((msg, index) =>
          index === prev.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: fullStreamedContent, workoutData: aiResponse.workoutData }
            : msg
        ));
      }
      
      await loadChatSessions();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartWorkout = (workoutData: any) => {
    if (workoutData?.exercises) {
      setCurrentWorkoutExercises(workoutData.exercises);
      router.push('/workout');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Chat with Gymzy</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={createNewChat}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(true)}
              className="lg:hidden text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <AlignRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <ChatBubble
              key={index}
              role={message.role}
              content={message.content}
              workoutData={message.workoutData}
              onStartWorkout={handleStartWorkout}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-xl p-3 max-w-[75%]">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Gymzy anything about fitness..."
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Sidebar - moved to right */}
      <div className={`${showSidebar ? 'translate-x-0' : 'translate-x-full'} fixed inset-y-0 right-0 z-50 w-80 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(false)}
              className="lg:hidden text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 mb-1 ${
                  session.id === currentSessionId ? 'bg-blue-50 border border-blue-200' : ''
                }`}
                onClick={() => loadChatSession(session.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium truncate">{session.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{session.lastMessage}</p>
                  <p className="text-xs text-gray-400">
                    {session.updatedAt.toDate().toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChatSessionHandler(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 p-1"
                >
                  <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading chat...</p>
          </div>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
