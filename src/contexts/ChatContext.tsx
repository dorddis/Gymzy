"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Corrected import path
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, Timestamp, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (content: string, modelId?: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: 'Hello! I am your personalized Gymzy AI assistant. How can I help you with your fitness journey today?' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to load chat history
  const loadChatHistory = useCallback(async () => {
    if (isLoading || !user) {
      console.log('ChatContext: loadChatHistory skipped. Loading:', isLoading, 'User:', user);
      return;
    }

    console.log('ChatContext: Attempting to load chat history for user:', user.uid);
    setIsLoading(true);
    setError(null);
    try {
      const chatDocRef = doc(db, 'chats', user.uid); // Reference to a single chat document per user
      const chatDocSnap = await getDoc(chatDocRef);

      if (chatDocSnap.exists()) {
        const chatData = chatDocSnap.data();
        setMessages(chatData.messages || []);
      } else {
        // If no chat exists, initialize with a welcome message and create the document
        const initialMessage = { role: 'ai', content: 'Hello! I am your personalized Gymzy AI assistant. How can I help you with your fitness journey today?' } as ChatMessage;
        setMessages([initialMessage]);
        await setDoc(chatDocRef, {
          userId: user.uid,
          messages: [initialMessage],
          timestamp: Timestamp.now(),
        });
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError(err instanceof Error ? err : new Error('Failed to load chat history'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, user]);

  // Load history on component mount (or when user changes)
  useEffect(() => {
    loadChatHistory();
  }, [user, loadChatHistory]);

  const sendMessage = useCallback(async (content: string, modelId: string = 'gpt-4') => {
    if (content.trim() === '') return;
    if (!user) {
      console.error('ChatContext: sendMessage failed: User not logged in.');
      setError(new Error('User not logged in. Cannot send message.'));
      return;
    }

    console.log('ChatContext: sendMessage for user:', user.uid, 'with message:', content, 'using model:', modelId);
    const newUserMessage: ChatMessage = { role: 'user', content };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages); // Optimistic update
    setIsLoading(true);
    setError(null);

    try {
      // 1. Send message to AI API
      const apiResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          messages: updatedMessages,
          modelId: modelId,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      const newAiMessage: ChatMessage = { role: 'ai', content: data.content };
      const finalMessages = [...updatedMessages, newAiMessage];
      setMessages(finalMessages);

      // 2. Persist chat history to Firestore for the user
      const chatDocRef = doc(db, 'chats', user.uid); // Use user.uid as document ID
      await setDoc(chatDocRef, {
        userId: user.uid,
        messages: finalMessages,
        timestamp: Timestamp.now(),
        lastModelUsed: modelId,
      }, { merge: true }); // Use merge: true to only update specified fields

      console.log('ChatContext: Attempting to save chat history for user:', user.uid);
      // Save chat history to Firestore
      await setDoc(chatDocRef, { messages: finalMessages, lastUpdated: serverTimestamp() }, { merge: true });
      console.log('ChatContext: Chat history saved to Firestore.');

    } catch (err) {
      console.error('Error sending message or saving chat:', err);
      setError(err instanceof Error ? err : new Error('Failed to get AI response or save chat.'));
      setMessages((prev) => [
        ...prev.filter(msg => msg !== newUserMessage), // Remove optimistic update if it failed
        { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, user]);

  const value = {
    messages,
    sendMessage,
    isLoading,
    error,
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