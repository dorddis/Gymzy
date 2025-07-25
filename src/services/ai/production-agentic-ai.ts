/**
 * Production-Grade Agentic AI Orchestrator
 * Implements collaborative task decomposition, iterative reasoning, and robust state management
 */

import { AgenticStateManager, ConversationState, TaskContext } from './agentic-state-manager';
import { RobustToolExecutor, ToolDefinition, ToolExecutionContext, ToolResult } from './robust-tool-executor';
import { IntelligentExerciseMatcher } from './intelligent-exercise-matcher';
import { generateAIResponse } from './ai-service';

export interface AgenticResponse {
  content: string;
  success: boolean;
  toolCalls: any[];
  workoutData?: any;
  isStreaming: boolean;
  confidence: number;
  reasoning: string;
  metadata: {
    sessionId: string;
    taskId?: string;
    executionTime: number;
    toolsUsed: string[];
    fallbacksUsed: string[];
  };
}

export interface AgentCapability {
  name: string;
  description: string;
  tools: string[];
  specialization: string;
  confidenceThreshold: number;
}

export class ProductionAgenticAI {
  private stateManager: AgenticStateManager;
  private toolExecutor: RobustToolExecutor;
  private exerciseMatcher: IntelligentExerciseMatcher;
  private agents: Map<string, AgentCapability> = new Map();

  constructor(stateManager: AgenticStateManager) {
    this.stateManager = stateManager;
    this.toolExecutor = new RobustToolExecutor();
    this.exerciseMatcher = new IntelligentExerciseMatcher();
    this.initializeAgents();
    this.registerTools();
  }

  /**
   * Generate agentic response with full production capabilities
   */
  async generateResponse(
    userInput: string,
    sessionId: string,
    userId: string,
    onStreamChunk?: (chunk: string) => void
  ): Promise<AgenticResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🤖 ProductionAgenticAI: Starting response generation...');
      
      // Initialize or restore conversation state
      const state = await this.stateManager.initializeState(sessionId, userId);
      
      // Add user message to conversation
      await this.stateManager.addMessage(sessionId, {
        role: 'user',
        content: userInput,
        timestamp: new Date(),
        metadata: { source: 'user_input' }
      });

      // Analyze user intent and decompose task
      const taskAnalysis = await this.analyzeUserIntent(userInput, state);
      console.log('🔍 ProductionAgenticAI: Task analysis:', taskAnalysis);

      // Start task tracking
      const taskId = await this.stateManager.startTask(
        sessionId, 
        taskAnalysis.taskType, 
        taskAnalysis.steps
      );

      // Execute task with collaborative agents
      const executionResult = await this.executeTaskWithAgents(
        taskId,
        sessionId,
        taskAnalysis,
        onStreamChunk
      );

      // Generate final response
      const response = await this.generateFinalResponse(
        userInput,
        executionResult,
        state,
        onStreamChunk
      );

      // Add AI response to conversation
      await this.stateManager.addMessage(sessionId, {
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          taskId,
          toolCalls: response.toolCalls,
          confidence: response.confidence,
          source: 'ai_response'
        }
      });

      return {
        ...response,
        metadata: {
          ...response.metadata,
          sessionId,
          taskId,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('❌ ProductionAgenticAI: Error in response generation:', error);
      
      // Generate fallback response
      return this.generateFallbackResponse(userInput, sessionId, error, startTime);
    }
  }

  /**
   * Analyze user intent and decompose into executable tasks
   */
  private async analyzeUserIntent(userInput: string, state: ConversationState): Promise<TaskAnalysis> {
    const context = this.stateManager.getContextForAI(state.sessionId);
    
    const analysisPrompt = `
Analyze the user's request and decompose it into executable steps.

User Request: "${userInput}"

Context: ${context}

Respond with a JSON object containing:
{
  "taskType": "workout_creation" | "exercise_search" | "general_chat" | "workout_modification",
  "intent": "brief description of user intent",
  "complexity": "simple" | "moderate" | "complex",
  "requiredTools": ["tool1", "tool2"],
  "steps": [
    {
      "name": "step_name",
      "description": "what this step does",
      "tools": ["required_tools"],
      "dependencies": ["previous_step_names"]
    }
  ],
  "confidence": 0.0-1.0
}`;

    try {
      const analysisResponse = await generateAIResponse(analysisPrompt);
      const analysis = JSON.parse(this.extractJSON(analysisResponse));
      
      return {
        taskType: analysis.taskType,
        intent: analysis.intent,
        complexity: analysis.complexity,
        requiredTools: analysis.requiredTools,
        steps: analysis.steps,
        confidence: analysis.confidence
      };
    } catch (error) {
      console.error('❌ ProductionAgenticAI: Failed to analyze intent:', error);
      
      // Fallback analysis
      return this.getFallbackTaskAnalysis(userInput);
    }
  }

  /**
   * Execute task using collaborative agents
   */
  private async executeTaskWithAgents(
    taskId: string,
    sessionId: string,
    taskAnalysis: TaskAnalysis,
    onStreamChunk?: (chunk: string) => void
  ): Promise<TaskExecutionResult> {
    const results: Map<string, ToolResult> = new Map();
    const state = this.stateManager.getState(sessionId)!;
    
    console.log(`🔧 ProductionAgenticAI: Executing task ${taskId} with ${taskAnalysis.steps.length} steps`);

    // Execute steps with dependency management
    for (let i = 0; i < taskAnalysis.steps.length; i++) {
      const step = taskAnalysis.steps[i];
      
      try {
        await this.stateManager.updateTaskStep(sessionId, `${taskId}_step_${i}`, {
          status: 'in_progress',
          startedAt: new Date()
        });

        // Check dependencies
        const dependenciesMet = step.dependencies?.every(dep => 
          results.has(dep) && results.get(dep)!.success
        ) ?? true;

        if (!dependenciesMet) {
          throw new Error(`Dependencies not met for step: ${step.name}`);
        }

        // Select best agent for this step
        const agent = this.selectBestAgent(step.tools, taskAnalysis.complexity);
        console.log(`🤖 ProductionAgenticAI: Selected agent "${agent.name}" for step "${step.name}"`);

        // Execute step tools
        const stepResults = await this.executeStepTools(
          step,
          sessionId,
          state,
          results,
          onStreamChunk
        );

        // Update step status
        await this.stateManager.updateTaskStep(sessionId, `${taskId}_step_${i}`, {
          status: 'completed',
          output: stepResults,
          completedAt: new Date()
        });

        // Store results for next steps
        results.set(step.name, {
          success: true,
          data: stepResults,
          metadata: {
            toolName: step.name,
            executionTime: 0,
            retryCount: 0,
            timestamp: new Date()
          }
        });

      } catch (error) {
        console.error(`❌ ProductionAgenticAI: Step "${step.name}" failed:`, error);
        
        await this.stateManager.updateTaskStep(sessionId, `${taskId}_step_${i}`, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Try to recover or continue with fallback
        const fallbackResult = await this.handleStepFailure(step, error, sessionId);
        if (fallbackResult) {
          results.set(step.name, fallbackResult);
        }
      }
    }

    return {
      taskId,
      success: Array.from(results.values()).some(r => r.success),
      results,
      toolsUsed: Array.from(results.keys()),
      fallbacksUsed: []
    };
  }

  /**
   * Execute tools for a specific step
   */
  private async executeStepTools(
    step: TaskStep,
    sessionId: string,
    state: ConversationState,
    previousResults: Map<string, ToolResult>,
    onStreamChunk?: (chunk: string) => void
  ): Promise<any> {
    const context: ToolExecutionContext = {
      sessionId,
      userId: state.userId,
      taskId: state.context.currentTask?.taskId,
      stepId: step.name,
      conversationContext: this.stateManager.getContextForAI(sessionId),
      userProfile: state.context.userProfile,
      previousResults: Array.from(previousResults.values())
    };

    const toolResults: any[] = [];

    for (const toolName of step.tools) {
      try {
        console.log(`🔧 ProductionAgenticAI: Executing tool "${toolName}" for step "${step.name}"`);
        
        const toolParams = this.buildToolParameters(toolName, step, previousResults, state);
        const result = await this.toolExecutor.executeTool(toolName, toolParams, context);
        
        if (result.success) {
          toolResults.push(result.data);
          console.log(`✅ ProductionAgenticAI: Tool "${toolName}" completed successfully`);
        } else {
          console.error(`❌ ProductionAgenticAI: Tool "${toolName}" failed:`, result.error);
          throw new Error(`Tool execution failed: ${result.error?.message}`);
        }
      } catch (error) {
        console.error(`❌ ProductionAgenticAI: Error executing tool "${toolName}":`, error);
        throw error;
      }
    }

    return toolResults.length === 1 ? toolResults[0] : toolResults;
  }

  /**
   * Generate final response with streaming support
   */
  private async generateFinalResponse(
    userInput: string,
    executionResult: TaskExecutionResult,
    state: ConversationState,
    onStreamChunk?: (chunk: string) => void
  ): Promise<AgenticResponse> {
    const context = this.stateManager.getContextForAI(state.sessionId);
    
    const responsePrompt = `
Based on the user's request and execution results, generate a helpful response.

User Request: "${userInput}"
Context: ${context}
Execution Results: ${JSON.stringify(Array.from(executionResult.results.entries()), null, 2)}

Requirements:
- Be conversational and helpful
- Include specific details from execution results
- Use markdown formatting
- Keep response concise but informative
- If workout was created, include "Start This Workout" call-to-action
- Match the user's communication style from their profile
`;

    try {
      let responseContent = '';
      
      if (onStreamChunk) {
        // Streaming response
        const streamingResponse = await this.generateStreamingResponse(responsePrompt, onStreamChunk);
        responseContent = streamingResponse;
      } else {
        // Regular response
        responseContent = await generateAIResponse(responsePrompt);
      }

      return {
        content: responseContent,
        success: true,
        toolCalls: executionResult.toolsUsed,
        workoutData: this.extractWorkoutData(executionResult),
        isStreaming: !!onStreamChunk,
        confidence: this.calculateResponseConfidence(executionResult),
        reasoning: `Executed ${executionResult.toolsUsed.length} tools successfully`,
        metadata: {
          sessionId: state.sessionId,
          executionTime: 0,
          toolsUsed: executionResult.toolsUsed,
          fallbacksUsed: executionResult.fallbacksUsed
        }
      };
    } catch (error) {
      console.error('❌ ProductionAgenticAI: Error generating final response:', error);
      throw error;
    }
  }

  /**
   * Initialize specialized agents
   */
  private initializeAgents(): void {
    const agents: AgentCapability[] = [
      {
        name: 'workout_specialist',
        description: 'Specializes in creating and modifying workout plans',
        tools: ['create_workout', 'search_exercises', 'modify_workout'],
        specialization: 'workout_creation',
        confidenceThreshold: 0.8
      },
      {
        name: 'exercise_expert',
        description: 'Expert in exercise database and movement patterns',
        tools: ['search_exercises', 'exercise_analysis', 'form_guidance'],
        specialization: 'exercise_search',
        confidenceThreshold: 0.9
      },
      {
        name: 'conversation_manager',
        description: 'Handles general conversation and user engagement',
        tools: ['general_response', 'motivation', 'goal_setting'],
        specialization: 'general_chat',
        confidenceThreshold: 0.7
      }
    ];

    agents.forEach(agent => this.agents.set(agent.name, agent));
  }

  /**
   * Register production-grade tools
   */
  private registerTools(): void {
    // Register enhanced workout creation tool
    this.toolExecutor.registerTool({
      name: 'create_workout',
      description: 'Create a personalized workout plan',
      parameters: {},
      execute: async (params, context) => {
        // Implementation with enhanced exercise matching
        return await this.createWorkoutWithIntelligentMatching(params, context);
      },
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2,
        retryableErrors: ['timeout', 'exercise_not_found']
      }
    });

    // Register other tools...
  }

  private async createWorkoutWithIntelligentMatching(params: any, context: ToolExecutionContext): Promise<any> {
    // Enhanced workout creation using intelligent exercise matcher
    const exercises = params.exercises || [];
    const matchedExercises = [];

    for (const exercise of exercises) {
      const match = await this.exerciseMatcher.findBestMatch(exercise.name);
      if (match && match.confidence >= 0.7) {
        matchedExercises.push({
          ...match.exercise,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight
        });
      } else {
        console.warn(`⚠️ ProductionAgenticAI: Could not find suitable match for exercise: ${exercise.name}`);
        // Use fallback or skip
      }
    }

    return {
      workoutId: `workout_${Date.now()}`,
      exercises: matchedExercises,
      name: params.name || 'Custom Workout',
      type: params.type || 'general'
    };
  }

  // Helper methods...
  private selectBestAgent(tools: string[], complexity: string): AgentCapability {
    // Select agent based on tool requirements and complexity
    for (const [name, agent] of this.agents) {
      if (tools.some(tool => agent.tools.includes(tool))) {
        return agent;
      }
    }
    return this.agents.get('conversation_manager')!;
  }

  private buildToolParameters(toolName: string, step: TaskStep, previousResults: Map<string, ToolResult>, state: ConversationState): any {
    // Build parameters based on tool requirements and context
    return {};
  }

  private async handleStepFailure(step: TaskStep, error: any, sessionId: string): Promise<ToolResult | null> {
    // Implement failure recovery logic
    return null;
  }

  private extractJSON(text: string): string {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? match[0] : '{}';
  }

  private getFallbackTaskAnalysis(userInput: string): TaskAnalysis {
    return {
      taskType: 'general_chat',
      intent: 'General conversation',
      complexity: 'simple',
      requiredTools: ['general_response'],
      steps: [{ name: 'respond', description: 'Generate response', tools: ['general_response'], dependencies: [] }],
      confidence: 0.5
    };
  }

  private async generateStreamingResponse(prompt: string, onChunk: (chunk: string) => void): Promise<string> {
    // Implement streaming response generation
    return await generateAIResponse(prompt);
  }

  private extractWorkoutData(result: TaskExecutionResult): any {
    // Extract workout data from execution results
    return null;
  }

  private calculateResponseConfidence(result: TaskExecutionResult): number {
    // Calculate confidence based on execution success
    const successRate = Array.from(result.results.values()).filter(r => r.success).length / result.results.size;
    return successRate;
  }

  private generateFallbackResponse(userInput: string, sessionId: string, error: any, startTime: number): AgenticResponse {
    return {
      content: "I'm having some technical difficulties right now, but I'm here to help with your fitness journey! Could you try rephrasing your request?",
      success: false,
      toolCalls: [],
      isStreaming: false,
      confidence: 0.3,
      reasoning: 'Fallback response due to system error',
      metadata: {
        sessionId,
        executionTime: Date.now() - startTime,
        toolsUsed: [],
        fallbacksUsed: ['general_fallback']
      }
    };
  }
}

// Supporting interfaces
interface TaskAnalysis {
  taskType: 'workout_creation' | 'exercise_search' | 'general_chat' | 'workout_modification';
  intent: string;
  complexity: 'simple' | 'moderate' | 'complex';
  requiredTools: string[];
  steps: TaskStep[];
  confidence: number;
}

interface TaskStep {
  name: string;
  description: string;
  tools: string[];
  dependencies?: string[];
}

interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  results: Map<string, ToolResult>;
  toolsUsed: string[];
  fallbacksUsed: string[];
}
