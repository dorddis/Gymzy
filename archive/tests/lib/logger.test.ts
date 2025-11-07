/**
 * Logger Tests
 * Tests for the production logging service
 */

import {
  logger,
  log,
  createServiceLogger,
  performanceLogger,
  errorLogger,
  devLogger,
  LogLevel,
} from '@/lib/logger';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for remote logging
global.fetch = jest.fn();

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Replace console methods with mocks
    Object.assign(console, mockConsole);
  });

  afterEach(() => {
    // Clean up any timers
    jest.clearAllTimers();
  });

  describe('Basic Logging', () => {
    it('should log debug messages in development', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logger.debug('Debug message', 'TestContext', { key: 'value' });

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG [TestContext]: Debug message'),
        { key: 'value' }
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should log info messages', () => {
      logger.info('Info message', 'TestContext', { key: 'value' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO [TestContext]: Info message'),
        { key: 'value' }
      );
    });

    it('should log warning messages', () => {
      logger.warn('Warning message', 'TestContext', { key: 'value' });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN [TestContext]: Warning message'),
        { key: 'value' }
      );
    });

    it('should log error messages with error objects', () => {
      const error = new Error('Test error');
      logger.error('Error message', 'TestContext', error, { key: 'value' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR [TestContext]: Error message'),
        { key: 'value' },
        error
      );
    });

    it('should respect log levels', () => {
      // Mock production environment (higher log level)
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Create a new logger instance for testing
      const { Logger } = require('@/lib/logger');
      const testLogger = new Logger({ level: LogLevel.WARN });

      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warning message');
      testLogger.error('Error message');

      // Debug and info should not be logged in production with WARN level
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Convenience Functions', () => {
    it('should use log convenience functions', () => {
      log.debug('Debug via convenience');
      log.info('Info via convenience');
      log.warn('Warning via convenience');
      log.error('Error via convenience');

      expect(mockConsole.debug).toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should create service-specific loggers', () => {
      const serviceLogger = createServiceLogger('TestService');

      serviceLogger.info('Service message', { data: 'test' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO [TestService]: Service message'),
        { data: 'test' }
      );
    });
  });

  describe('Performance Logger', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should measure operation timing', () => {
      const endTimer = performanceLogger.startTimer('TestOperation');

      // Simulate some time passing
      jest.advanceTimersByTime(100);

      endTimer();

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Performance: TestOperation completed in'),
        undefined
      );
    });

    it('should measure async operations', async () => {
      const asyncOperation = jest.fn().mockResolvedValue('result');

      const result = await performanceLogger.measureAsync('AsyncTest', asyncOperation);

      expect(result).toBe('result');
      expect(asyncOperation).toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Performance: AsyncTest completed in'),
        undefined
      );
    });

    it('should handle async operation errors', async () => {
      const asyncOperation = jest.fn().mockRejectedValue(new Error('Async error'));

      await expect(
        performanceLogger.measureAsync('FailingAsyncTest', asyncOperation)
      ).rejects.toThrow('Async error');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Performance: FailingAsyncTest failed'),
        'Performance',
        expect.any(Error)
      );
    });
  });

  describe('Error Logger', () => {
    it('should log API errors', () => {
      errorLogger.logApiError('/api/test', 404, 'Not found', { userId: 'test' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('API Error: /api/test returned 404'),
        'API',
        undefined,
        { status: 404, message: 'Not found', data: { userId: 'test' } }
      );
    });

    it('should log validation errors', () => {
      errorLogger.logValidationError('email', 'invalid-email', 'email format');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Validation Error: email failed email format'),
        'Validation',
        { field: 'email', value: 'invalid-email', rule: 'email format' }
      );
    });

    it('should log user actions', () => {
      errorLogger.logUserAction('login', 'user-123', { method: 'email' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('User Action: login'),
        'UserAction',
        { userId: 'user-123', method: 'email' }
      );
    });
  });

  describe('Development Logger', () => {
    it('should only log in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test in development
      process.env.NODE_ENV = 'development';
      devLogger.log('Dev message', { data: 'test' });
      expect(mockConsole.debug).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test in production
      process.env.NODE_ENV = 'production';
      devLogger.log('Dev message', { data: 'test' });
      expect(mockConsole.debug).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log component lifecycle events', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      devLogger.componentLifecycle('TestComponent', 'mounted', { props: 'test' });

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent: mounted'),
        'Component',
        { props: 'test' }
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Log Entry Structure', () => {
    it('should create properly structured log entries', () => {
      // Access the logger&apos;s internal methods for testing
      const { Logger } = require('@/lib/logger');
      const testLogger = new Logger();

      // Mock the createLogEntry method
      const createLogEntry = testLogger.createLogEntry.bind(testLogger);
      
      const entry = createLogEntry(
        LogLevel.INFO,
        'Test message',
        'TestContext',
        { key: 'value' },
        new Error('Test error')
      );

      expect(entry).toMatchObject({
        level: LogLevel.INFO,
        message: 'Test message',
        context: 'TestContext',
        data: { key: 'value' },
        error: expect.any(Error),
        timestamp: expect.any(String),
      });
    });
  });

  describe('Message Formatting', () => {
    it('should format messages correctly', () => {
      logger.info('Test message', 'TestContext');

      const call = mockConsole.info.mock.calls[0][0];
      
      // Check that the formatted message includes timestamp, level, context, and message
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z INFO \[TestContext\]: Test message/);
    });

    it('should handle messages without context', () => {
      logger.info('Test message without context');

      const call = mockConsole.info.mock.calls[0][0];
      
      // Should not include context brackets when no context provided
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z INFO: Test message without context/);
    });
  });

  describe('Environment Status Logging', () => {
    it('should log environment status in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { logEnvironmentStatus } = require('@/lib/logger');
      logEnvironmentStatus();

      expect(mockConsole.log).toHaveBeenCalledWith('🔧 Environment Configuration:');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log environment status in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { logEnvironmentStatus } = require('@/lib/logger');
      logEnvironmentStatus();

      expect(mockConsole.log).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
