/**
 * Production-Ready Logging Service
 * Replaces console.log statements with structured logging
 */

import { env, isDevelopment, isProduction } from './env-config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  error?: Error;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxBufferSize: number;
  flushInterval: number;
}

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: isDevelopment,
      enableRemote: isProduction,
      maxBufferSize: 100,
      flushInterval: 30000, // 30 seconds
      ...config,
    };

    // Start flush timer for remote logging
    if (this.config.enableRemote) {
      this.startFlushTimer();
    }

    // Flush logs before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const levelName = LogLevel[level];
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    return `${timestamp} ${levelName}${contextStr}: ${message}`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // TODO: Get from auth context
    return undefined;
  }

  private getSessionId(): string | undefined {
    // TODO: Get or generate session ID
    return undefined;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const formattedMessage = this.formatMessage(entry.level, entry.message, entry.context);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.data, entry.error);
        break;
    }
  }

  private addToBuffer(entry: LogEntry): void {
    if (!this.config.enableRemote) return;

    this.buffer.push(entry);

    // Flush if buffer is full
    if (this.buffer.length >= this.config.maxBufferSize) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      // TODO: Send to remote logging service
      // await this.sendToRemoteService(logsToSend);
    } catch (error) {
      console.error('Failed to send logs to remote service:', error);
      // Re-add logs to buffer for retry
      this.buffer.unshift(...logsToSend);
    }
  }

  private async sendToRemoteService(logs: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    const response = await fetch(this.config.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs }),
    });

    if (!response.ok) {
      throw new Error(`Remote logging failed: ${response.status}`);
    }
  }

  public debug(message: string, context?: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, data);
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  public info(message: string, context?: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.createLogEntry(LogLevel.INFO, message, context, data);
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  public warn(message: string, context?: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.createLogEntry(LogLevel.WARN, message, context, data);
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  public error(message: string, context?: string, error?: Error, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry = this.createLogEntry(LogLevel.ERROR, message, context, data, error);
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Convenience functions for common logging patterns
export const log = {
  debug: (message: string, context?: string, data?: any) => logger.debug(message, context, data),
  info: (message: string, context?: string, data?: any) => logger.info(message, context, data),
  warn: (message: string, context?: string, data?: any) => logger.warn(message, context, data),
  error: (message: string, context?: string, error?: Error, data?: any) => logger.error(message, context, error, data),
};

// Service-specific loggers
export const createServiceLogger = (serviceName: string) => ({
  debug: (message: string, data?: any) => logger.debug(message, serviceName, data),
  info: (message: string, data?: any) => logger.info(message, serviceName, data),
  warn: (message: string, data?: any) => logger.warn(message, serviceName, data),
  error: (message: string, error?: Error, data?: any) => logger.error(message, serviceName, error, data),
});

// Performance logging utilities
export const performanceLogger = {
  startTimer: (operation: string): (() => void) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      logger.info(`Performance: ${operation} completed in ${duration.toFixed(2)}ms`, 'Performance');
    };
  },

  measureAsync: async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
    const endTimer = performanceLogger.startTimer(operation);
    try {
      const result = await fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      logger.error(`Performance: ${operation} failed`, 'Performance', error as Error);
      throw error;
    }
  },
};

// Error logging utilities
export const errorLogger = {
  logApiError: (endpoint: string, status: number, message: string, data?: any) => {
    logger.error(`API Error: ${endpoint} returned ${status}`, 'API', undefined, { status, message, data });
  },

  logValidationError: (field: string, value: any, rule: string) => {
    logger.warn(`Validation Error: ${field} failed ${rule}`, 'Validation', { field, value, rule });
  },

  logUserAction: (action: string, userId?: string, data?: any) => {
    logger.info(`User Action: ${action}`, 'UserAction', { userId, ...data });
  },
};

// Development helpers
export const devLogger = {
  // Only logs in development
  log: (message: string, data?: any) => {
    if (isDevelopment) {
      logger.debug(message, 'Dev', data);
    }
  },

  // Logs component lifecycle events
  componentLifecycle: (componentName: string, event: string, data?: any) => {
    if (isDevelopment) {
      logger.debug(`${componentName}: ${event}`, 'Component', data);
    }
  },
};

// Export logger instance as default
export default logger;
