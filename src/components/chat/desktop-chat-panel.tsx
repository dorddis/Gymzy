"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, MessageSquare, Trash2, Plus, Square, Minimize2, Maximize2 } from 'lucide-react';
import { ChatMessageSkeleton } from '@/components/ui/skeleton';
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
} from '@/services/data/chat-history-service';
import { sendStreamingChatMessage } from '@/services/core/ai-chat-service';
import { useWorkout } from '@/contexts/WorkoutContext';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  workoutData?: {
    exercises: any[];
    workoutId: string;
  };
}

interface DesktopChatPanelProps {
  isEmbedded?: boolean;
  onAppAction?: (action: string, data?: any) => void;
  highlightTarget?: (selector: string, duration?: number) => void;
  className?: string;
  initialMessage?: string;
  compact?: boolean;
}

export function DesktopChatPanel({
  isEmbedded = true,
  onAppAction,
  highlightTarget,
  className,
  initialMessage,
  compact = false,
}: DesktopChatPanelProps) {
  const { user } = useAuth();
  const { setCurrentWorkoutExercises } = useWorkout();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isInitialMessageHandled, setIsInitialMessageHandled] = useState(false);
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAiStreamingRef = useRef(isAiStreaming);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Update the ref whenever isAiStreaming changes
  useEffect(() => {
    isAiStreamingRef.current = isAiStreaming;
  }, [isAiStreaming]);

  // Initialize chat with initial message or default
  useEffect(() => {
    if (!user?.uid) return;

    if (initialMessage && !isInitialMessageHandled) {
      createNewChatWithMessage(initialMessage);
    } else if (!currentSessionId && !isInitialMessageHandled && !initialMessage) {
      loadChatSessions().then(_sessions => {
        if (!currentSessionId) {
          createNewChat();
        }
      });
    }
  }, [user?.uid, initialMessage, currentSessionId, isInitialMessageHandled]);

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
      setIsLoading(true);
      const sessionId = await createChatSession(user.uid);
      setCurrentSessionId(sessionId);
      setMessages([{
        role: 'assistant',
        content: isEmbedded 
          ? 'Hi! I\'m your AI fitness assistant. I can help you control the app, create workouts, track progress, and answer fitness questions. What would you like to do?'
          : 'Hello! I\'m Gymzy, your personalized AI fitness coach. How can I help you with your fitness journey today?',
        timestamp: new Date()
      }]);
      setIsInitialMessageHandled(true);
      await loadChatSessions();
    } catch (error) {
      console.error('Error creating new chat:', error);
      setMessages([{ role: 'assistant', content: 'Sorry, I couldn\'t start a new chat. Please try again.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChatWithMessage = async (message: string) => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      const sessionId = await createChatSession(user.uid, message);
      setCurrentSessionId(sessionId);
      setMessages([{
        role: 'assistant',
        content: message,
        timestamp: new Date()
      }]);
      setInput('');
      setIsInitialMessageHandled(true);
      await saveChatMessage(sessionId, 'assistant', message);
      await loadChatSessions();
    } catch (error) {
      console.error('Error creating new chat with message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error starting our chat. Please try again.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
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

    const isInitialAutomatedCall = !!(message && sessionId);

    try {
      setIsLoading(true);
      setIsAiStreaming(true);
      isAiStreamingRef.current = true;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      if (!isInitialAutomatedCall) {
        setInput('');
        setMessages(prevMessages => [...prevMessages, {
          role: 'user',
          content: messageToSend,
          timestamp: new Date()
        }]);
      }
      
      await saveChatMessage(targetSessionId, 'user', messageToSend);

      // Build conversation history for AI
      let conversationHistoryForAI: Array<{id: string, role: 'user' | 'assistant' | 'system', content: string, timestamp: Date, userId?: string}>;

      if (isInitialAutomatedCall) {
        conversationHistoryForAI = [{
          id: new Date().toISOString() + Math.random().toString(),
          role: 'user',
          content: messageToSend,
          timestamp: new Date(),
          userId: user.uid
        }];
      } else {
        const allMessages = [...messages];
        allMessages.push({
          role: 'user',
          content: messageToSend,
          timestamp: new Date()
        });

        conversationHistoryForAI = allMessages.map(msg => ({
          id: msg.timestamp?.toISOString() + Math.random().toString(),
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp || new Date(),
          userId: user.uid
        }));
      }

      let hasAddedPlaceholder = false;
      let fullStreamedContent = '';
      
      const aiResponse = await sendStreamingChatMessage(
        user.uid,
        messageToSend,
        conversationHistoryForAI,
        (chunk: string) => {
          if (!isAiStreamingRef.current || abortController.signal.aborted) {
            return;
          }

          if (!hasAddedPlaceholder) {
            const streamingMessagePlaceholder: ChatMessage = {
              role: 'assistant',
              content: '',
              timestamp: new Date()
            };
            setMessages(prevMessages => [...prevMessages, streamingMessagePlaceholder]);
            hasAddedPlaceholder = true;
          }

          fullStreamedContent += chunk;
          setMessages(prevMsgs => prevMsgs.map((msg, index) => {
            if (index === prevMsgs.length - 1 && msg.role === 'assistant') {
              return { ...msg, content: msg.content + chunk };
            }
            return msg;
          }));
        },
        abortController.signal
      );

      if (aiResponse.success) {
        await saveChatMessage(targetSessionId, 'assistant', fullStreamedContent);
        setMessages(prevMsgs => prevMsgs.map((msg, index) =>
          index === prevMsgs.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: fullStreamedContent, workoutData: aiResponse.workoutData }
            : msg
        ));

        // Trigger app actions if embedded
        if (isEmbedded && aiResponse.workoutData) {
          onAppAction?.('workout-created', aiResponse.workoutData);
        }
      } else {
        setMessages(prevMsgs => {
          const updatedMessages = prevMsgs.slice(0, -1);
          return [...updatedMessages, { role: 'assistant', content: aiResponse.error || 'Sorry, an error occurred with the AI response.', timestamp: new Date() }];
        });
      }
      
      if (!isInitialAutomatedCall) {
        await loadChatSessions();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages => [...prevMessages, {
        role: 'assistant',
        content: 'Sorry, I encountered an error sending your message. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsAiStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      isAiStreamingRef.current = false;
      setIsAiStreaming(false);

      const lastMessageIdx = messages.length - 1;
      if (messages[lastMessageIdx]?.role === 'assistant' && messages[lastMessageIdx]?.content) {
        saveChatMessage(currentSessionId!, 'assistant', messages[lastMessageIdx].content)
          .catch(err => console.error("Error saving partially streamed message:", err));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAiStreaming) {
      handleStopStreaming();
    } else {
      await handleSendMessage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isAiStreaming) {
        handleStopStreaming();
      } else {
        handleSendMessage();
      }
    }
  };

  const handleStartWorkout = (workoutData: any) => {
    if (workoutData?.exercises) {
      setCurrentWorkoutExercises(workoutData.exercises);
      onAppAction?.('navigate', '/workout');
      highlightTarget?.('.workout-section', 2000);
    }
  };

  if (!user) {
    return (
      <div className={cn("flex flex-col h-full bg-white", className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full bg-white", className)}>
      {/* Chat History Sidebar */}
      {showSidebar && !compact && (
        <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Chat History</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-white mb-1 text-xs",
                  session.id === currentSessionId ? 'bg-white border border-blue-200' : ''
                )}
                onClick={() => loadChatSession(session.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <MessageSquare className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="font-medium truncate text-xs">{session.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{session.lastMessage}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChatSessionHandler(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between border-b border-gray-200 bg-white",
          compact ? "px-3 py-2" : "px-4 py-3"
        )}>
          <div className="flex items-center gap-2">
            {!showSidebar && !compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(true)}
                className="h-6 w-6 p-0"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
            <h2 className={cn(
              "font-semibold text-gray-900",
              compact ? "text-sm" : "text-base"
            )}>
              AI Assistant
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={createNewChat}
              className={cn(
                "flex items-center gap-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                compact ? "text-xs px-2 py-1" : "text-sm"
              )}
            >
              <Plus className={compact ? "h-3 w-3" : "h-4 w-4"} />
              New
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className={cn(
          "flex-1 overflow-y-auto space-y-3",
          compact ? "p-2" : "p-4"
        )}>
          {messages.map((message, index) => (
            <ChatBubble
              key={index}
              role={message.role}
              content={message.content}
              workoutData={message.workoutData}
              onStartWorkout={handleStartWorkout}
              compact={compact}
            />
          ))}
          {isLoading && !isAiStreaming && (
            <ChatMessageSkeleton />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className={cn(
          "border-t border-gray-200 bg-white",
          compact ? "p-2" : "p-3"
        )}>
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isEmbedded ? "Ask me to help with your workout..." : "Ask Gymzy anything about fitness..."}
                className={cn(
                  "w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent chat-input",
                  compact ? "text-sm" : "text-base"
                )}
                rows={1}
                style={{ 
                  minHeight: compact ? '32px' : '40px', 
                  maxHeight: compact ? '80px' : '120px' 
                }}
                disabled={isLoading && !isAiStreaming}
                aria-label="Chat message input"
                aria-multiline="true"
                aria-autocomplete="none"
                aria-describedby="chat-input-help"
              />
              <span id="chat-input-help" className="sr-only">
                Type your message and press Enter to send. Use Shift+Enter for a new line.
              </span>
            </div>
            <Button
              type="submit"
              disabled={(!input.trim() && !isAiStreaming) || (isLoading && !isAiStreaming)}
              className={compact ? "px-2 py-2" : "px-4 py-2"}
              variant={isAiStreaming ? "destructive" : "default"}
              size={compact ? "sm" : "default"}
            >
              {isAiStreaming ? (
                <Square className={compact ? "h-3 w-3" : "h-4 w-4"} />
              ) : (
                <Send className={compact ? "h-3 w-3" : "h-4 w-4"} />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}