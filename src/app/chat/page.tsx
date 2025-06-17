"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Send, ChevronLeft, Loader2, MessageSquare, Trash2, Plus, X, AlignRight, Square } from 'lucide-react';
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
  const [isInitialMessageHandled, setIsInitialMessageHandled] = useState(false);
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAiStreamingRef = useRef(isAiStreaming);
  const router = useRouter();
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
    } else if (!currentSessionId && !isInitialMessageHandled && !initialUrlMessage) {
      console.log("ChatPage: No initial message, no current session. Loading sessions or creating new generic chat.");
      loadChatSessions().then(_sessions => {
        if (!currentSessionId) {
          createNewChat();
        }
      });
    }
  }, [user?.uid, searchParams, currentSessionId, isInitialMessageHandled]);

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
      const sessionId = await createChatSession(user.uid);
      setCurrentSessionId(sessionId);
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m Gymzy, your personalized AI fitness coach. How can I help you with your fitness journey today?',
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

  const createNewChatWithMessage = async (initialMessage: string) => {
    if (!user?.uid) return;
    console.log("ChatPage: createNewChatWithMessage called with:", initialMessage);
    try {
      setIsLoading(true);
      const sessionId = await createChatSession(user.uid, initialMessage);
      setCurrentSessionId(sessionId);
      setMessages([{
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      }]);
      setInput('');
      setIsInitialMessageHandled(true);
      await handleSendMessage(initialMessage, sessionId);
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
    
    const messageToSend = messageOverride || input.trim();
    const targetSessionId = sessionIdOverride || currentSessionId;
    if (!messageToSend || !targetSessionId) return;

    const isInitialAutomatedCall = !!(messageOverride && sessionIdOverride);

    try {
      setIsLoading(true);
      setIsAiStreaming(true); // Start streaming indication
      isAiStreamingRef.current = true; // Set ref before starting
      
      if (!isInitialAutomatedCall) {
        setInput('');
        setMessages(prevMessages => [...prevMessages, {
          role: 'user',
          content: messageToSend,
          timestamp: new Date()
        }]);
      }
      
      await saveChatMessage(targetSessionId, 'user', messageToSend);

      let conversationHistoryForAI: Array<{id: string, role: 'user' | 'assistant' | 'system', content: string, timestamp: Date, userId?: string}>;
      if (isInitialAutomatedCall) {
          // For the initial automated call, history should only contain the user's first message
          conversationHistoryForAI = [{
              id: new Date().toISOString() + Math.random().toString(), // Generate a simple unique ID
              role: 'user',
              content: messageToSend,
              timestamp: new Date(),
              userId: user.uid
          }];
      } else {
          // For subsequent messages, use the current messages state
          // Ensure to use the `messages` state that includes the latest user message if just added
          // This requires careful handling of async state updates.
          // A functional update to setMessages OR passing the latest messages array directly would be more robust.
          // For this subtask, we'll use the current `messages` state, assuming it's updated before this map.
          // This might be an area for future refinement if race conditions appear with history.
          const currentMessageList = messages; // This will capture messages before adding the new user one if not careful
                                           // For isInitialAutomatedCall = false, the user message is added above.
                                           // So `messages` here for that path is correct.

          conversationHistoryForAI = currentMessageList.map(msg => ({
            id: msg.timestamp?.toISOString() + Math.random().toString(),
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp || new Date(),
            userId: user.uid
          }));
      }

      console.log('💬 ChatPage: Sending message to AI service with streaming. History length:', conversationHistoryForAI.length);

      const streamingMessagePlaceholder: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, streamingMessagePlaceholder]);

      let fullStreamedContent = '';
      // Assuming sendStreamingChatMessage and saveChatMessage can handle workoutData.
      // These service functions might need updates if they don't already.
      const aiResponse = await sendStreamingChatMessage(
        user.uid,
        messageToSend,
        conversationHistoryForAI,
        (chunk: string) => {
          if (!isAiStreamingRef.current) {
            return;
          }
          fullStreamedContent += chunk;
          setMessages(prevMsgs => prevMsgs.map((msg, index) => {
            if (index === prevMsgs.length - 1 && msg.role === 'assistant') {
              return { ...msg, content: msg.content + chunk };
            }
            return msg;
          }));
        }
      );

      console.log('💬 ChatPage: AI streaming response completed.');

      // After streaming is complete, update the message with the fullStreamedContent
      // to ensure consistency and save the complete message.
      // This is important because the chunk-by-chunk update might have slight variations
      // or if any chunk processing was missed.
      if (aiResponse.success) {
        await saveChatMessage(targetSessionId, 'assistant', fullStreamedContent, aiResponse.workoutData);
        setMessages(prevMsgs => prevMsgs.map((msg, index) =>
          index === prevMsgs.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: fullStreamedContent, workoutData: aiResponse.workoutData } // Ensure final content is fullStreamedContent
            : msg
        ));
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
          {isAiStreaming && (
            <div className="flex justify-center mb-2">
              <Button
                variant="destructive" // Or "outline"
                onClick={() => {
                  isAiStreamingRef.current = false; // Use ref to signal stop to callback
                  setIsAiStreaming(false); // Update state to hide button & re-enable input
                  // Potentially save the partially streamed message here
                  const lastMessageIdx = messages.length -1;
                  if(messages[lastMessageIdx]?.role === 'assistant' && messages[lastMessageIdx]?.content){
                      saveChatMessage(currentSessionId!, 'assistant', messages[lastMessageIdx].content)
                          .then(() => console.log("ChatPage: Saved partially streamed message."))
                          .catch(err => console.error("ChatPage: Error saving partially streamed message:", err));
                  }
                }}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" /> Stop
              </Button>
            </div>
          )}
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
                disabled={isLoading || isAiStreaming} // Updated disabled logic
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading || isAiStreaming} // Updated disabled logic
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
