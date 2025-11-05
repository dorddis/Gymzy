/**
 * AI Chat Service Tests
 * Tests for the core AI chat service functionality
 */

import { sendChatMessage, getChatHistory, createChatSession } from '@/services/core/ai-chat-service';

// Mock the secure AI client
jest.mock('@/lib/secure-ai-client', () => ({
  generateSecureAIResponse: jest.fn(),
  generateSecureStreamingResponse: jest.fn(),
}));

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(() => Promise.resolve()),
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ id: 'test-session', messages: [] }),
        })),
        update: jest.fn(() => Promise.resolve()),
      })),
      add: jest.fn(() => Promise.resolve({ id: 'new-session-id' })),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({
              docs: [
                {
                  id: 'message-1',
                  data: () => ({
                    id: 'message-1',
                    role: 'user',
                    content: 'Hello',
                    timestamp: new Date(),
                  }),
                },
              ],
            })),
          })),
        })),
      })),
    })),
  },
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('AI Chat Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendChatMessage', () => {
    it('should send a chat message successfully', async () => {
      const { generateSecureAIResponse } = require('@/lib/secure-ai-client');
      
      generateSecureAIResponse.mockResolvedValue({
        success: true,
        content: 'AI response to user message',
        model: 'gemini',
        timestamp: '2024-01-01T00:00:00.000Z',
      });

      const result = await sendChatMessage(
        'Hello, AI!',
        'test-user-id',
        'test-session-id'
      );

      expect(generateSecureAIResponse).toHaveBeenCalledWith({
        prompt: 'Hello, AI!',
        model: 'gemini',
        maxTokens: 1000,
        temperature: 0.7,
      });

      expect(result).toMatchObject({
        success: true,
        message: expect.objectContaining({
          role: 'assistant',
          content: 'AI response to user message',
        }),
      });
    });

    it('should handle AI service errors', async () => {
      const { generateSecureAIResponse } = require('@/lib/secure-ai-client');
      
      generateSecureAIResponse.mockResolvedValue({
        success: false,
        error: 'AI service unavailable',
      });

      const result = await sendChatMessage(
        'Hello, AI!',
        'test-user-id',
        'test-session-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service unavailable');
    });

    it('should create a new session if none provided', async () => {
      const { generateSecureAIResponse } = require('@/lib/secure-ai-client');
      
      generateSecureAIResponse.mockResolvedValue({
        success: true,
        content: 'AI response',
        model: 'gemini',
        timestamp: '2024-01-01T00:00:00.000Z',
      });

      const result = await sendChatMessage(
        'Hello, AI!',
        'test-user-id'
        // No session ID provided
      );

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('new-session-id');
    });

    it('should validate input parameters', async () => {
      // Test empty message
      const result1 = await sendChatMessage('', 'test-user-id');
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Message cannot be empty');

      // Test empty user ID
      const result2 = await sendChatMessage('Hello', '');
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('User ID is required');

      // Test message too long
      const longMessage = 'a'.repeat(10001);
      const result3 = await sendChatMessage(longMessage, 'test-user-id');
      expect(result3.success).toBe(false);
      expect(result3.error).toContain('Message is too long');
    });

    it('should handle database errors', async () => {
      const { generateSecureAIResponse } = require('@/lib/secure-ai-client');
      const { db } = require('@/lib/firebase');
      
      generateSecureAIResponse.mockResolvedValue({
        success: true,
        content: 'AI response',
        model: 'gemini',
        timestamp: '2024-01-01T00:00:00.000Z',
      });

      // Mock database error
      db.collection().doc().set.mockRejectedValue(new Error('Database error'));

      const result = await sendChatMessage(
        'Hello, AI!',
        'test-user-id',
        'test-session-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('getChatHistory', () => {
    it('should retrieve chat history successfully', async () => {
      const { db } = require('@/lib/firebase');
      
      const mockMessages = [
        {
          id: 'message-1',
          data: () => ({
            id: 'message-1',
            role: 'user',
            content: 'Hello',
            timestamp: { toDate: () => new Date('2024-01-01T10:00:00.000Z') },
          }),
        },
        {
          id: 'message-2',
          data: () => ({
            id: 'message-2',
            role: 'assistant',
            content: 'Hi there!',
            timestamp: { toDate: () => new Date('2024-01-01T10:01:00.000Z') },
          }),
        },
      ];

      db.collection().where().orderBy().limit().get.mockResolvedValue({
        docs: mockMessages,
      });

      const result = await getChatHistory('test-session-id', 10);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'message-1',
        role: 'user',
        content: 'Hello',
      });
      expect(result[1]).toMatchObject({
        id: 'message-2',
        role: 'assistant',
        content: 'Hi there!',
      });
    });

    it('should handle empty chat history', async () => {
      const { db } = require('@/lib/firebase');
      
      db.collection().where().orderBy().limit().get.mockResolvedValue({
        docs: [],
      });

      const result = await getChatHistory('test-session-id', 10);

      expect(result).toHaveLength(0);
    });

    it('should validate session ID', async () => {
      await expect(getChatHistory('', 10)).rejects.toThrow('Session ID is required');
    });

    it('should handle database errors in history retrieval', async () => {
      const { db } = require('@/lib/firebase');
      
      db.collection().where().orderBy().limit().get.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(getChatHistory('test-session-id', 10)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('createChatSession', () => {
    it('should create a new chat session successfully', async () => {
      const { db } = require('@/lib/firebase');
      
      db.collection().add.mockResolvedValue({ id: 'new-session-id' });

      const result = await createChatSession('test-user-id', 'Test Session');

      expect(db.collection).toHaveBeenCalledWith('chatSessions');
      expect(db.collection().add).toHaveBeenCalledWith({
        userId: 'test-user-id',
        title: 'Test Session',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        isActive: true,
        messageCount: 0,
      });

      expect(result).toMatchObject({
        success: true,
        sessionId: 'new-session-id',
      });
    });

    it('should create session with default title', async () => {
      const { db } = require('@/lib/firebase');
      
      db.collection().add.mockResolvedValue({ id: 'new-session-id' });

      const result = await createChatSession('test-user-id');

      expect(db.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Chat',
        })
      );

      expect(result.success).toBe(true);
    });

    it('should validate user ID for session creation', async () => {
      await expect(createChatSession('')).rejects.toThrow('User ID is required');
    });

    it('should handle database errors in session creation', async () => {
      const { db } = require('@/lib/firebase');
      
      db.collection().add.mockRejectedValue(new Error('Failed to create session'));

      await expect(createChatSession('test-user-id')).rejects.toThrow(
        'Failed to create session'
      );
    });
  });

  describe('Message Validation', () => {
    it('should validate message content', async () => {
      // Test whitespace-only message
      const result1 = await sendChatMessage('   \n\t   ', 'test-user-id');
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Message cannot be only whitespace');

      // Test message with only special characters
      const result2 = await sendChatMessage('!!!@@@###', 'test-user-id');
      expect(result2.success).toBe(true); // This should be valid
    });

    it('should handle special characters in messages', async () => {
      const { generateSecureAIResponse } = require('@/lib/secure-ai-client');
      
      generateSecureAIResponse.mockResolvedValue({
        success: true,
        content: 'Response to special characters',
        model: 'gemini',
        timestamp: '2024-01-01T00:00:00.000Z',
      });

      const specialMessage = 'Hello! 🏋️‍♂️ Can you help me with émojis and àccénts?';
      const result = await sendChatMessage(specialMessage, 'test-user-id');

      expect(result.success).toBe(true);
      expect(generateSecureAIResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: specialMessage,
        })
      );
    });
  });
});
