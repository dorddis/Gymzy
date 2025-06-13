"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, Timestamp, doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { sendChatMessage, ChatMessage as AIChatMessage } from '@/services/ai-chat-service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  timestamp?: Date;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (content: string, modelId?: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  startNewChat: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const initialFirstChatPrompt: ChatMessage = { role: 'assistant', content: 'Hello! I am Gymzy, your personalized AI fitness coach. How can I help you with your fitness journey today?' };
  const initialSubsequentChatPrompt: ChatMessage = { role: 'assistant', content: 'Welcome back! I\'m Gymzy, ready to help with your fitness goals. What would you like to work on today?' };

  const [messages, setMessages] = useState<ChatMessage[]>([initialFirstChatPrompt]); // Default to first-time message
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const hasLoadedHistory = useRef(false);

  // Function to load chat history
  const loadChatHistory = useCallback(async () => {
    if (isLoading || !user || hasLoadedHistory.current) {
      console.log('ChatContext: loadChatHistory skipped. Loading:', isLoading, 'User:', user, 'Has Loaded History:', hasLoadedHistory.current);
      return;
    }

    console.log('ChatContext: Attempting to load chat history for user:', user.uid);
    setIsLoading(true);
    setError(null);
    try {
      const chatDocRef = doc(db, 'chats', user.uid);
      const chatDocSnap = await getDoc(chatDocRef);

      let actualInitialMessage = user.hasChatted ? initialSubsequentChatPrompt : initialFirstChatPrompt;

      if (chatDocSnap.exists()) {
        let loadedMessages = chatDocSnap.data().messages || [];

        // Ensure the correct initial AI message is always present at the beginning
        if (loadedMessages.length === 0 || loadedMessages[0].content !== actualInitialMessage.content) {
          loadedMessages = [actualInitialMessage, ...loadedMessages.filter((msg: ChatMessage) => msg.content !== initialFirstChatPrompt.content && msg.content !== initialSubsequentChatPrompt.content)];
        }
        setMessages(loadedMessages);
      } else {
        // If no chat exists in Firestore, set the messages to the appropriate initial prompt
        setMessages([actualInitialMessage]);
        console.log('ChatContext: No existing chat history found. Initial message from state will be set to:', actualInitialMessage.content);
      }
      hasLoadedHistory.current = true;
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError(err instanceof Error ? err : new Error('Failed to load chat history'));
    } finally {
      setIsLoading(false);
    }
  }, [user, initialFirstChatPrompt, initialSubsequentChatPrompt]);

  // Load history on component mount (or when user changes)
  useEffect(() => {
    loadChatHistory();
  }, [user, loadChatHistory]);

  // Function to start a new chat
  const startNewChat = useCallback(async () => {
    if (!user) {
      console.warn('ChatContext: Cannot start new chat, user not available.');
      setError(new Error('Cannot start new chat: User not logged in.'));
      return;
    }

    console.log('ChatContext: Attempting to start a new chat for user:', user.uid);
    setIsLoading(true);
    setError(null);
    try {
      const chatDocRef = doc(db, 'chats', user.uid);
      await deleteDoc(chatDocRef);
      console.log('ChatContext: Previous chat history deleted from Firestore.');
      
      // Set messages to the appropriate initial prompt for a new session
      const newSessionInitialMessage = user.hasChatted ? initialSubsequentChatPrompt : initialFirstChatPrompt;
      setMessages([newSessionInitialMessage]);

      hasLoadedHistory.current = false;
      setIsLoading(false);
      console.log('ChatContext: New chat started successfully.');
    } catch (err) {
      console.error('Error starting new chat:', err);
      setError(err instanceof Error ? err : new Error('Failed to start new chat'));
      setIsLoading(false);
    }
  }, [user, initialFirstChatPrompt, initialSubsequentChatPrompt]);

  const sendMessage = useCallback(async (content: string, modelId: string = 'gpt-4') => {
    if (content.trim() === '') return;
    if (!user) {
      console.error('ChatContext: sendMessage failed: User not logged in.');
      setError(new Error('User not logged in. Cannot send message.'));
      return;
    }

    console.log('ChatContext: sendMessage for user:', user.uid, 'with message:', content, 'using model:', modelId);
    const newUserMessage: ChatMessage = { role: 'user', content };

    // Determine the actual initial message for this context, considering if it's a fresh start or ongoing.
    // This ensures that even if history loaded, the first message is there. Also handle if this is the FIRST EVER message.
    const actualInitialMessageForPersist = user.hasChatted ? initialSubsequentChatPrompt : initialFirstChatPrompt;

    const currentMessagesWithoutInitial = messages.filter((msg: ChatMessage) => 
      msg.content !== initialFirstChatPrompt.content && msg.content !== initialSubsequentChatPrompt.content
    );

    const updatedMessages = [actualInitialMessageForPersist, ...currentMessagesWithoutInitial, newUserMessage];
    setMessages(updatedMessages); // Optimistic update
    setIsLoading(true);
    setError(null);

    try {
      // 1. Send message to AI service
      console.log('ChatContext: Sending message to AI service');

      // Convert messages to the format expected by AI service
      const conversationHistory: AIChatMessage[] = currentMessagesWithoutInitial.map(msg => ({
        id: Math.random().toString(36),
        role: msg.role === 'ai' ? 'assistant' : msg.role,
        content: msg.content,
        timestamp: new Date(),
        userId: user.uid
      }));

      const aiResponse = await sendChatMessage(user.uid, content, conversationHistory);

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'Failed to get AI response');
      }

      const newAiMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse.message,
        id: Math.random().toString(36),
        timestamp: new Date()
      };
      const finalMessages = [...updatedMessages, newAiMessage];
      setMessages(finalMessages);

      // 2. Persist chat history to Firestore for the user
      const chatDocRef = doc(db, 'chats', user.uid);
      await setDoc(chatDocRef, {
        userId: user.uid,
        messages: finalMessages,
        timestamp: Timestamp.now(),
        lastModelUsed: modelId,
      }, { merge: true });

      console.log('ChatContext: Chat history saved to Firestore.');

      // Mark user as having chatted for the first time
      if (!user.hasChatted) {
        const userProfileRef = doc(db, 'users', user.uid);
        await setDoc(userProfileRef, { hasChatted: true }, { merge: true });
        console.log('ChatContext: User marked as having chatted for the first time.');
        // Update the user object in AuthContext if possible, or trigger a re-fetch
        // For now, assume AuthContext will re-fetch or is updated elsewhere.
      }

    } catch (err) {
      console.error('Error sending message or saving chat:', err);
      setError(err instanceof Error ? err : new Error('Failed to get AI response or save chat.'));
      setMessages((prev) => {
        const revertedMessages = prev.filter((msg: ChatMessage) => msg !== newUserMessage && msg.content !== initialFirstChatPrompt.content && msg.content !== initialSubsequentChatPrompt.content);
        const fallbackMessage = user.hasChatted ? initialSubsequentChatPrompt : initialFirstChatPrompt;
        return [fallbackMessage, ...revertedMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, initialFirstChatPrompt, initialSubsequentChatPrompt]); 

  const value = {
    messages,
    sendMessage,
    isLoading,
    error,
    startNewChat,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 