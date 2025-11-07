"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Send, Loader2, MessageSquare, Trash2, Plus, X, AlignRight, Square } from 'lucide-react';
import { ChatMessageSkeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
import { BackButton } from '@/components/layout/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { ChatBubble } from '@/components/chat/chat-bubble';
import { ChatWelcomeScreen } from '@/components/chat/chat-welcome-screen';
import { Button } from '@/components/ui/button';
import {
  createChatSession,
  getChatSessions,
  saveChatMessage,
  getChatMessages,
  deleteChatSession,
  ChatSession
} from '@/services/data/chat-history-service';
// Using new Gemini 2.5 Flash chat API
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
  const [isInitialMessageHandled, setIsInitialMessageHandled] = useState(false);
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAiStreamingRef = useRef(isAiStreaming);
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const { navigateBack } = useOptimizedNavigation();
  const searchParams = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update the ref whenever isAiStreaming changes
  useEffect(() => {
    isAiStreamingRef.current = isAiStreaming;
  }, [isAiStreaming]);

  // New consolidated useEffect for chat initialization logic
  useEffect(() => {
    if (!user?.uid) return;

    const initialUrlMessage = searchParams.get('message');

    if (initialUrlMessage && !isInitialMessageHandled) {
      console.log("ChatPage: Initial message from URL detected:", initialUrlMessage);
      if (currentSessionId || messages.length > 0) {
          setCurrentSessionId(null);
          setMessages([]);
      }
      createNewChatWithMessage(initialUrlMessage);
    } else if (!isInitialMessageHandled && !initialUrlMessage) {
      // Just load existing chat sessions, don't auto-create a new one
      console.log("ChatPage: Loading existing chat sessions.");
      loadChatSessions();
      setIsInitialMessageHandled(true);
    }
  }, [user?.uid, searchParams, isInitialMessageHandled]);

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
    console.log("ChatPage: createNewChat called");
    if (searchParams.get('message') && !isInitialMessageHandled) {
      console.warn("ChatPage: createNewChat called while an initial message was present but not handled.");
    }
    try {
      setIsLoading(true);
      // Clear messages to show welcome screen
      setMessages([]);
      // Clear input field
      setInput('');
      // Clear current session - will be created when user sends first message
      setCurrentSessionId(null);
      setIsInitialMessageHandled(true);
      await loadChatSessions();
    } catch (error) {
      console.error('Error creating new chat:', error);
      setMessages([{ role: 'assistant', content: 'Sorry, I couldn\&apos;t start a new chat. Please try again.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChatWithMessage = async (initialMessage: string) => {
    if (!user?.uid) return;
    console.log("ChatPage: createNewChatWithMessage called with:", initialMessage);
    try {
      setIsLoading(true);
      const sessionId = await createChatSession(user.uid, initialMessage);
      setCurrentSessionId(sessionId);

      // Set the initial message as an assistant message (this is the welcome message from home page)
      setMessages([{
        role: 'assistant',
        content: initialMessage,
        timestamp: new Date()
      }]);
      setInput('');
      setIsInitialMessageHandled(true);

      // Save the initial assistant message to the history
      await saveChatMessage(sessionId, user.uid, 'assistant', initialMessage);

      // The welcome message is now the first message in the conversation
      // When user types their first message, it will have proper context

      await loadChatSessions();
    } catch (error) {
      console.error('Error creating new chat with message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error starting our chat. Please try again.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatSession = async (sessionId: string) => {
    if (!user?.uid) return;
    try {
      const chatMessages = await getChatMessages(sessionId, user.uid);
      const formattedMessages: ChatMessage[] = chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toDate(),
        ...(msg.workoutData && { workoutData: msg.workoutData })
      }));

      setMessages(formattedMessages);
      setCurrentSessionId(sessionId);
      setShowSidebar(false);
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  const deleteChatSessionHandler = async (sessionId: string) => {
    if (!user?.uid) return;
    try {
      await deleteChatSession(sessionId, user.uid);
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
    if (!messageToSend) return;

    // If there's no current session, create one first
    let targetSessionId = sessionId || currentSessionId;
    if (!targetSessionId) {
      console.log("ChatPage: No active session, creating new chat session for first message");
      try {
        targetSessionId = await createChatSession(user.uid);
        setCurrentSessionId(targetSessionId);
        await loadChatSessions();
      } catch (error) {
        console.error('Error creating chat session:', error);
        setMessages([{ role: 'assistant', content: 'Sorry, I couldn\&apos;t start a new chat. Please try again.', timestamp: new Date() }]);
        return;
      }
    }

    const isInitialAutomatedCall = !!(message && sessionId);

    try {
      setIsLoading(true);
      setIsAiStreaming(true); // Start streaming indication
      isAiStreamingRef.current = true; // Set ref before starting

      // Create abort controller for this request
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

      await saveChatMessage(targetSessionId, user.uid, 'user', messageToSend);

      // Build conversation history for AI - include ALL messages for proper context
      let conversationHistoryForAI: Array<{id: string, role: 'user' | 'assistant' | 'system', content: string, timestamp: Date, userId?: string}>;

      if (isInitialAutomatedCall) {
          // For the initial automated call, history should only contain the user&apos;s first message
          conversationHistoryForAI = [{
              id: new Date().toISOString() + Math.random().toString(),
              role: 'user',
              content: messageToSend,
              timestamp: new Date(),
              userId: user.uid
          }];
      } else {
          // For subsequent messages, include ALL messages (including welcome message) for proper context
          // This ensures the AI remembers the welcome message and conversation flow
          const allMessages = [...messages];

          // Add the current user message to the history for AI context
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

      console.log('💬 ChatPage: Sending message to AI service with streaming. History length:', conversationHistoryForAI.length);

      // Only add streaming placeholder when we start receiving chunks
      let hasAddedPlaceholder = false;

      let fullStreamedContent = '';
      let aiResponse: { success: boolean; workoutData?: any; navigationTarget?: string; error?: string } = { success: false };

      try {
        console.log('📤 Sending to API:', { sessionId: targetSessionId, userId: user.uid, message: messageToSend, streaming: true, historyLength: messages.length });

        // Call new Gemini 2.5 Flash chat API with streaming
        const response = await fetch('/api/ai/gemini-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: targetSessionId,
            userId: user.uid,
            message: messageToSend,
            streaming: true,
            // Send conversation history for context
            history: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          }),
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        // Process streaming response
        while (true) {
          const { value, done } = await reader.read();
          if (done || !isAiStreamingRef.current || abortController.signal.aborted) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.chunk) {
                  // Add placeholder on first chunk
                  if (!hasAddedPlaceholder) {
                    const streamingMessagePlaceholder: ChatMessage = {
                      role: 'assistant',
                      content: '',
                      timestamp: new Date()
                    };
                    setMessages(prevMessages => [...prevMessages, streamingMessagePlaceholder]);
                    hasAddedPlaceholder = true;
                  }

                  fullStreamedContent += data.chunk;
                  setMessages(prevMsgs => prevMsgs.map((msg, index) => {
                    if (index === prevMsgs.length - 1 && msg.role === 'assistant') {
                      return { ...msg, content: msg.content + data.chunk };
                    }
                    return msg;
                  }));
                }

                // Handle workout data
                if (data.workoutData) {
                  console.log('💪 Received workout data:', data.workoutData);
                  aiResponse.workoutData = data.workoutData;
                }

                // Handle navigation target
                if (data.navigationTarget) {
                  console.log('🧭 Received navigation target:', data.navigationTarget);
                  aiResponse.navigationTarget = data.navigationTarget;
                }

                if (data.done) {
                  aiResponse.success = true;
                  break;
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }

        // If we got content, consider it successful
        if (fullStreamedContent) {
          aiResponse.success = true;
        }
      } catch (fetchError) {
        console.error('Streaming error:', fetchError);
        aiResponse.error = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      }

      console.log('💬 ChatPage: AI streaming response completed.');

      // After streaming is complete, update the message with the fullStreamedContent
      // to ensure consistency and save the complete message.
      // This is important because the chunk-by-chunk update might have slight variations
      // or if any chunk processing was missed.
      if (aiResponse.success) {
        await saveChatMessage(targetSessionId, user.uid, 'assistant', fullStreamedContent, aiResponse.workoutData);
        setMessages(prevMsgs => prevMsgs.map((msg, index) =>
          index === prevMsgs.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: fullStreamedContent, workoutData: aiResponse.workoutData } // Ensure final content is fullStreamedContent
            : msg
        ));

        // Handle navigation if AI requested it
        if (aiResponse.navigationTarget) {
          console.log('🧭 Navigating to:', aiResponse.navigationTarget);
          // Small delay to let user see the AI response before navigating
          setTimeout(() => {
            router.push(aiResponse.navigationTarget!);
          }, 1500);
        }
      } else {
        // If AI response failed, remove the placeholder and add error message
        // Or update the placeholder to show the error
        setMessages(prevMsgs => {
          const updatedMessages = prevMsgs.slice(0, -1); // Remove the streaming placeholder
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
      setIsAiStreaming(false); // Stop streaming indication
      abortControllerRef.current = null; // Clear abort controller
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      isAiStreamingRef.current = false;
      setIsAiStreaming(false);

      // Save the partially streamed message
      const lastMessageIdx = messages.length - 1;
      if (messages[lastMessageIdx]?.role === 'assistant' && messages[lastMessageIdx]?.content && user) {
        saveChatMessage(currentSessionId!, user.uid, 'assistant', messages[lastMessageIdx].content)
          .then(() => console.log("ChatPage: Saved partially streamed message."))
          .catch(err => console.error("ChatPage: Error saving partially streamed message:", err));
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

  const handleSuggestionClick = (suggestion: string) => {
    // When a suggestion is clicked, populate the input field
    setInput(suggestion);
  };

  const handleStartWorkout = (workoutData: any) => {
    if (workoutData?.exercises) {
      // Transform AI-generated exercises to WorkoutContext format
      // AI gives: { sets: 4, reps: 6 }
      // WorkoutContext expects: { sets: [{ weight: 0, reps: 6, isExecuted: false }, ...] }
      const transformedExercises = workoutData.exercises.map((exercise: any) => {
        // If sets is already an array, use it as-is
        if (Array.isArray(exercise.sets)) {
          return exercise;
        }

        // Otherwise, transform number of sets into array of set objects
        const numSets = typeof exercise.sets === 'number' ? exercise.sets : 3;
        const repsPerSet = typeof exercise.reps === 'number' ? exercise.reps : 10;

        return {
          ...exercise,
          id: exercise.exerciseId || exercise.id,
          sets: Array.from({ length: numSets }, () => ({
            weight: 0,
            reps: repsPerSet,
            isExecuted: false
          }))
        };
      });

      setCurrentWorkoutExercises(transformedExercises);
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
    <div className="flex h-screen bg-background justify-center">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-3xl">
        <div className="flex items-center justify-between p-4 md:px-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <BackButton onClick={navigateBack} />
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

        {/* Messages or Welcome Screen */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 ? (
            <ChatWelcomeScreen
              userName={user.profile?.displayName || user.displayName || undefined}
              onSuggestionClick={handleSuggestionClick}
            />
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatBubble
                  key={index}
                  role={message.role}
                  content={message.content}
                  workoutData={message.workoutData}
                  onStartWorkout={handleStartWorkout}
                />
              ))}
              {/* Show thinking indicator when AI is processing but hasn't started streaming yet */}
              {isAiStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <div className="flex items-center gap-2 p-3 rounded-xl max-w-[75%] bg-gray-100 text-gray-600 self-start mr-auto rounded-bl-none">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Gymzy is thinking...</span>
                </div>
              )}
              {isLoading && !isAiStreaming && (
                <ChatMessageSkeleton />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 border-t border-gray-200 bg-white">
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
                disabled={isLoading && !isAiStreaming} // Only disable when loading but not streaming
              />
            </div>
            <Button
              type="submit"
              disabled={(!input.trim() && !isAiStreaming) || (isLoading && !isAiStreaming)}
              className="px-4 py-2"
              variant={isAiStreaming ? "destructive" : "default"}
            >
              {isAiStreaming ? (
                <Square className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Sidebar - moved to right */}
      <div className={`${showSidebar ? 'translate-x-0' : 'translate-x-full'} fixed inset-y-0 right-0 z-50 w-80 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block`}>
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
