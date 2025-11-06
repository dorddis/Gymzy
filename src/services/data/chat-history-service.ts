import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
  workoutData?: {
    exercises: any[];
    workoutId: string;
    title: string;
    notes?: string;
  };
}

// Create a new chat session
export const createChatSession = async (
  userId: string, 
  initialMessage?: string
): Promise<string> => {
  try {
    const sessionId = `${userId}_${Date.now()}`;
    const now = Timestamp.now();
    
    // Generate title from initial message or use default
    let title = 'New Chat';
    if (initialMessage) {
      // Take first 30 characters and add ellipsis if longer
      title = initialMessage.length > 30 
        ? initialMessage.substring(0, 30) + '...' 
        : initialMessage;
    }
    
    const session: ChatSession = {
      id: sessionId,
      userId,
      title,
      lastMessage: initialMessage || 'Chat started.', // Placeholder, will be updated by the first actual message
      messageCount: 0, // Will be incremented by saveChatMessage
      createdAt: now,
      updatedAt: now
    };

    const sessionRef = doc(db, 'chat_sessions', sessionId);
    await setDoc(sessionRef, session);

    // Do NOT save the initialMessage here.
    // The calling context (e.g., chat/page.tsx) is responsible for saving the first message with the correct role.
    // For example, if it&apos;s a welcome message from AI, it should be saved as 'assistant'.

    return sessionId;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
};

// Get all chat sessions for a user
export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    const sessionsQuery = query(
      collection(db, 'chat_sessions'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(50) // Limit to last 50 chats
    );

    const querySnapshot = await getDocs(sessionsQuery);
    const sessions: ChatSession[] = [];

    querySnapshot.forEach((doc) => {
      sessions.push(doc.data() as ChatSession);
    });

    return sessions;
  } catch (error) {
    console.error('Error getting chat sessions:', error);
    return [];
  }
};

// Save a chat message
export const saveChatMessage = async (
  sessionId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  workoutData?: any
): Promise<string> => {
  try {
    const messageId = `${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Timestamp.now();

    const message: ChatMessage = {
      id: messageId,
      sessionId,
      userId,
      role,
      content,
      timestamp: now,
      ...(workoutData && { workoutData })
    };

    const messageRef = doc(db, 'chat_messages', messageId);
    await setDoc(messageRef, message);

    // Update session with last message and count
    const sessionRef = doc(db, 'chat_sessions', sessionId);
    const sessionUpdate = {
      lastMessage: content,
      messageCount: await getChatMessageCount(sessionId, userId) + 1,
      updatedAt: now
    };
    
    await setDoc(sessionRef, sessionUpdate, { merge: true });

    return messageId;
  } catch (error) {
    console.error('Error saving chat message:', error);
    throw error;
  }
};

// Get messages for a chat session
export const getChatMessages = async (sessionId: string, userId: string): Promise<ChatMessage[]> => {
  try {
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('sessionId', '==', sessionId),
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(messagesQuery);
    const messages: ChatMessage[] = [];

    querySnapshot.forEach((doc) => {
      messages.push(doc.data() as ChatMessage);
    });

    return messages;
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return [];
  }
};

// Get message count for a session
const getChatMessageCount = async (sessionId: string, userId: string): Promise<number> => {
  try {
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('sessionId', '==', sessionId),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(messagesQuery);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting message count:', error);
    return 0;
  }
};

// Delete a chat session and all its messages
export const deleteChatSession = async (sessionId: string, userId: string): Promise<void> => {
  try {
    // Delete all messages in the session
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('sessionId', '==', sessionId),
      where('userId', '==', userId)
    );

    const messagesSnapshot = await getDocs(messagesQuery);
    const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete the session
    const sessionRef = doc(db, 'chat_sessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    console.error('Error deleting chat session:', error);
    throw error;
  }
};

// Update session title
export const updateSessionTitle = async (sessionId: string, title: string): Promise<void> => {
  try {
    const sessionRef = doc(db, 'chat_sessions', sessionId);
    await setDoc(sessionRef, { 
      title,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating session title:', error);
    throw error;
  }
};

export default {
  createChatSession,
  getChatSessions,
  saveChatMessage,
  getChatMessages,
  deleteChatSession,
  updateSessionTitle
};
