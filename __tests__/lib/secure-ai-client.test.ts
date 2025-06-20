/**
 * Secure AI Client Tests
 * Tests for the secure AI client service
 */

import {
  generateSecureAIResponse,
  generateSecureStreamingResponse,
  checkAIServiceHealth,
  determineOptimalModel,
  generateSmartAIResponse,
} from '@/lib/secure-ai-client';

// Mock fetch globally
global.fetch = jest.fn();

describe('Secure AI Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecureAIResponse', () => {
    it('should generate AI response successfully', async () => {
      const mockResponse = {
        success: true,
        content: 'Test AI response',
        model: 'gemini',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request = {
        prompt: 'Test prompt',
        model: 'gemini' as const,
        maxTokens: 1000,
        temperature: 0.7,
      };

      const result = await generateSecureAIResponse(request);

      expect(fetch).toHaveBeenCalledWith('/api/internal/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test prompt',
          model: 'gemini',
          maxTokens: 1000,
          temperature: 0.7,
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      const mockErrorResponse = {
        error: 'API rate limit exceeded',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve(mockErrorResponse),
      });

      const request = {
        prompt: 'Test prompt',
      };

      const result = await generateSecureAIResponse(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API rate limit exceeded');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const request = {
        prompt: 'Test prompt',
      };

      const result = await generateSecureAIResponse(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should use default values for optional parameters', async () => {
      const mockResponse = {
        success: true,
        content: 'Test response',
        model: 'gemini',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request = {
        prompt: 'Test prompt',
      };

      await generateSecureAIResponse(request);

      expect(fetch).toHaveBeenCalledWith('/api/internal/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test prompt',
          model: 'gemini', // default
          maxTokens: 1000, // default
          temperature: 0.7, // default
        }),
      });
    });
  });

  describe('generateSecureStreamingResponse', () => {
    it('should handle streaming response', async () => {
      const mockChunks = [
        'data: {"content": "Hello"}\n\n',
        'data: {"content": " world"}\n\n',
        'data: {"content": "!"}\n\n',
      ];

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockChunks[0]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockChunks[1]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockChunks[2]) })
          .mockResolvedValueOnce({ done: true }),
        releaseLock: jest.fn(),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => {
        chunks.push(chunk);
      });
      const onComplete = jest.fn();

      const request = {
        prompt: 'Test streaming prompt',
      };

      await generateSecureStreamingResponse(request, onChunk, onComplete);

      expect(fetch).toHaveBeenCalledWith('/api/internal/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test streaming prompt',
          model: 'gemini',
          maxTokens: 1000,
          temperature: 0.7,
        }),
      });

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Hello');
      expect(onChunk).toHaveBeenNthCalledWith(2, ' world');
      expect(onChunk).toHaveBeenNthCalledWith(3, '!');
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle streaming errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Streaming error'));

      const onChunk = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      const request = {
        prompt: 'Test prompt',
      };

      await generateSecureStreamingResponse(request, onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('Streaming error');
      expect(onChunk).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('checkAIServiceHealth', () => {
    it('should check service health successfully', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        services: { gemini: true, groq: true },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      });

      const result = await checkAIServiceHealth();

      expect(fetch).toHaveBeenCalledWith('/api/internal/ai', {
        method: 'GET',
      });

      expect(result).toEqual(mockHealthResponse);
    });

    it('should handle health check failures', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Health check failed'));

      const result = await checkAIServiceHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.services).toEqual({ gemini: false, groq: false });
    });
  });

  describe('determineOptimalModel', () => {
    it('should select groq for complex fitness prompts', () => {
      const complexPrompts = [
        'Create a workout for building muscle',
        'Generate a tricep exercise routine',
        'Modify my chest workout to increase difficulty',
        'Calculate calories burned during this workout',
      ];

      complexPrompts.forEach(prompt => {
        const model = determineOptimalModel(prompt);
        expect(model).toBe('groq');
      });
    });

    it('should select gemini for simple prompts', () => {
      const simplePrompts = [
        'Hello, how are you?',
        'What is the weather like?',
        'Tell me a joke',
        'How do I log out?',
      ];

      simplePrompts.forEach(prompt => {
        const model = determineOptimalModel(prompt);
        expect(model).toBe('gemini');
      });
    });

    it('should handle mixed case and special characters', () => {
      const prompt = 'CREATE A WORKOUT!!! with TRICEP exercises...';
      const model = determineOptimalModel(prompt);
      expect(model).toBe('groq');
    });
  });

  describe('generateSmartAIResponse', () => {
    it('should automatically select optimal model', async () => {
      const mockResponse = {
        success: true,
        content: 'Smart AI response',
        model: 'groq',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request = {
        prompt: 'Create a workout for building muscle', // Should select groq
        maxTokens: 1500,
      };

      const result = await generateSmartAIResponse(request);

      expect(fetch).toHaveBeenCalledWith('/api/internal/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Create a workout for building muscle',
          model: 'groq', // Automatically selected
          maxTokens: 1500,
          temperature: 0.7,
        }),
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Legacy compatibility', () => {
    it('should warn about deprecated generateAIResponse', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mockResponse = {
        success: true,
        content: 'Legacy response',
        model: 'gemini',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Import the legacy function
      const { generateAIResponse } = await import('@/lib/secure-ai-client');
      
      const result = await generateAIResponse('Test prompt');

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ generateAIResponse is deprecated. Use generateSecureAIResponse instead.'
      );
      expect(result).toBe('Legacy response');

      consoleSpy.mockRestore();
    });

    it('should throw error for failed legacy requests', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mockResponse = {
        success: false,
        error: 'Legacy error',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { generateAIResponse } = await import('@/lib/secure-ai-client');

      await expect(generateAIResponse('Test prompt')).rejects.toThrow('Legacy error');

      consoleSpy.mockRestore();
    });
  });
});
