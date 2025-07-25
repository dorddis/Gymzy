/**
 * Production-Grade Tool Execution Framework
 * Implements circuit breaker pattern, retry mechanisms, and graceful degradation
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
  execute: (params: any, context: ToolExecutionContext) => Promise<ToolResult>;
  validate?: (params: any) => ValidationResult;
  fallback?: (params: any, error: Error) => Promise<ToolResult>;
  retryConfig?: RetryConfig;
  circuitBreakerConfig?: CircuitBreakerConfig;
}

export interface ToolExecutionContext {
  sessionId: string;
  userId: string;
  taskId?: string;
  stepId?: string;
  conversationContext: string;
  userProfile: any;
  previousResults: ToolResult[];
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: ToolError;
  metadata: {
    toolName: string;
    executionTime: number;
    retryCount: number;
    timestamp: Date;
    confidence?: number;
  };
}

export interface ToolError {
  code: string;
  message: string;
  details: any;
  recoverable: boolean;
  suggestedAction: string;
  category: 'validation' | 'execution' | 'timeout' | 'circuit_breaker' | 'unknown';
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number; // milliseconds
  monitoringWindow: number; // milliseconds
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class RobustToolExecutor {
  private tools: Map<string, ToolDefinition> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private executionMetrics: Map<string, ToolMetrics> = new Map();

  constructor() {
    this.initializeDefaultTools();
  }

  /**
   * Register a tool with the executor
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    
    // Initialize circuit breaker if configured
    if (tool.circuitBreakerConfig) {
      this.circuitBreakers.set(tool.name, new CircuitBreaker(tool.circuitBreakerConfig));
    }

    // Initialize metrics tracking
    this.executionMetrics.set(tool.name, new ToolMetrics());
  }

  /**
   * Execute a tool with robust error handling and retry logic
   */
  async executeTool(
    toolName: string, 
    parameters: any, 
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      return this.createErrorResult(toolName, startTime, {
        code: 'TOOL_NOT_FOUND',
        message: `Tool '${toolName}' not found`,
        details: { availableTools: Array.from(this.tools.keys()) },
        recoverable: false,
        suggestedAction: 'Check tool name and ensure it is registered',
        category: 'validation'
      });
    }

    // Validate parameters
    if (tool.validate) {
      const validation = tool.validate(parameters);
      if (!validation.valid) {
        return this.createErrorResult(toolName, startTime, {
          code: 'INVALID_PARAMETERS',
          message: 'Tool parameters validation failed',
          details: { errors: validation.errors, warnings: validation.warnings },
          recoverable: true,
          suggestedAction: 'Fix parameter validation errors and retry',
          category: 'validation'
        });
      }
    }

    // Check circuit breaker
    const circuitBreaker = this.circuitBreakers.get(toolName);
    if (circuitBreaker && circuitBreaker.isOpen()) {
      return this.createErrorResult(toolName, startTime, {
        code: 'CIRCUIT_BREAKER_OPEN',
        message: 'Tool circuit breaker is open due to recent failures',
        details: { nextRetryAt: circuitBreaker.getNextRetryTime() },
        recoverable: true,
        suggestedAction: 'Wait for circuit breaker to reset or use fallback',
        category: 'circuit_breaker'
      });
    }

    // Execute with retry logic
    const retryConfig = tool.retryConfig || this.getDefaultRetryConfig();
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        console.log(`🔧 ToolExecutor: Executing ${toolName} (attempt ${attempt + 1}/${retryConfig.maxRetries + 1})`);
        
        const result = await this.executeWithTimeout(tool, parameters, context);
        
        // Record success
        this.recordSuccess(toolName);
        circuitBreaker?.recordSuccess();
        
        return {
          success: true,
          data: result,
          metadata: {
            toolName,
            executionTime: Date.now() - startTime,
            retryCount: attempt,
            timestamp: new Date()
          }
        };

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ ToolExecutor: ${toolName} failed on attempt ${attempt + 1}:`, error);
        
        // Record failure
        this.recordFailure(toolName, error);
        circuitBreaker?.recordFailure();
        
        // Check if error is retryable
        if (attempt < retryConfig.maxRetries && this.isRetryableError(error, retryConfig)) {
          const delay = this.calculateDelay(attempt, retryConfig);
          console.log(`⏳ ToolExecutor: Retrying ${toolName} in ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }
        
        break;
      }
    }

    // All retries exhausted, try fallback
    if (tool.fallback) {
      try {
        console.log(`🔄 ToolExecutor: Attempting fallback for ${toolName}`);
        const fallbackResult = await tool.fallback(parameters, lastError!);
        
        return {
          success: true,
          data: fallbackResult.data,
          metadata: {
            toolName: `${toolName}_fallback`,
            executionTime: Date.now() - startTime,
            retryCount: retryConfig.maxRetries,
            timestamp: new Date(),
            confidence: 0.5 // Lower confidence for fallback results
          }
        };
      } catch (fallbackError) {
        console.error(`❌ ToolExecutor: Fallback for ${toolName} also failed:`, fallbackError);
      }
    }

    // Return final error
    return this.createErrorResult(toolName, startTime, {
      code: 'EXECUTION_FAILED',
      message: `Tool execution failed after ${retryConfig.maxRetries + 1} attempts`,
      details: { originalError: lastError?.message, attempts: retryConfig.maxRetries + 1 },
      recoverable: false,
      suggestedAction: 'Check tool implementation and parameters',
      category: 'execution'
    }, retryConfig.maxRetries);
  }

  /**
   * Execute multiple tools in parallel with dependency management
   */
  async executeToolChain(
    toolCalls: Array<{ name: string; parameters: any; dependencies?: string[] }>,
    context: ToolExecutionContext
  ): Promise<Map<string, ToolResult>> {
    const results = new Map<string, ToolResult>();
    const pending = new Set(toolCalls.map((_, index) => index));
    const executing = new Set<number>();

    while (pending.size > 0 || executing.size > 0) {
      // Find tools ready to execute (dependencies satisfied)
      const ready = Array.from(pending).filter(index => {
        const toolCall = toolCalls[index];
        return !toolCall.dependencies || 
               toolCall.dependencies.every(dep => results.has(dep) && results.get(dep)!.success);
      });

      // Execute ready tools in parallel
      const executions = ready.map(async (index) => {
        pending.delete(index);
        executing.add(index);
        
        const toolCall = toolCalls[index];
        const result = await this.executeTool(toolCall.name, toolCall.parameters, context);
        
        results.set(toolCall.name, result);
        executing.delete(index);
        
        return { index, result };
      });

      if (executions.length === 0 && executing.size === 0) {
        // Deadlock - circular dependencies or missing dependencies
        break;
      }

      await Promise.all(executions);
    }

    return results;
  }

  private async executeWithTimeout(
    tool: ToolDefinition, 
    parameters: any, 
    context: ToolExecutionContext,
    timeoutMs: number = 30000
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = await tool.execute(parameters, context);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private isRetryableError(error: Error, config: RetryConfig): boolean {
    const errorMessage = error.message.toLowerCase();
    return config.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createErrorResult(
    toolName: string, 
    startTime: number, 
    error: ToolError, 
    retryCount: number = 0
  ): ToolResult {
    return {
      success: false,
      error,
      metadata: {
        toolName,
        executionTime: Date.now() - startTime,
        retryCount,
        timestamp: new Date()
      }
    };
  }

  private recordSuccess(toolName: string): void {
    const metrics = this.executionMetrics.get(toolName);
    if (metrics) {
      metrics.recordSuccess();
    }
  }

  private recordFailure(toolName: string, error: Error): void {
    const metrics = this.executionMetrics.get(toolName);
    if (metrics) {
      metrics.recordFailure(error);
    }
  }

  private getDefaultRetryConfig(): RetryConfig {
    return {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['timeout', 'network', 'temporary', 'rate limit']
    };
  }

  private initializeDefaultTools(): void {
    // Initialize default tools here
    // This would include workout creation, exercise search, etc.
  }

  /**
   * Get execution metrics for monitoring
   */
  getMetrics(): Map<string, any> {
    const metrics = new Map();
    this.executionMetrics.forEach((toolMetrics, toolName) => {
      metrics.set(toolName, toolMetrics.getStats());
    });
    return metrics;
  }
}

class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(private config: CircuitBreakerConfig) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  getNextRetryTime(): Date {
    return new Date(this.lastFailureTime + this.config.resetTimeout);
  }
}

class ToolMetrics {
  private successCount: number = 0;
  private failureCount: number = 0;
  private totalExecutionTime: number = 0;
  private recentErrors: Error[] = [];

  recordSuccess(): void {
    this.successCount++;
  }

  recordFailure(error: Error): void {
    this.failureCount++;
    this.recentErrors.push(error);
    
    // Keep only last 10 errors
    if (this.recentErrors.length > 10) {
      this.recentErrors = this.recentErrors.slice(-10);
    }
  }

  getStats(): any {
    const total = this.successCount + this.failureCount;
    return {
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: total > 0 ? this.successCount / total : 0,
      recentErrors: this.recentErrors.map(e => e.message)
    };
  }
}
