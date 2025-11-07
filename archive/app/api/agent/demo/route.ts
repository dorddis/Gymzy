/**
 * AI Agent Demo API Route
 *
 * Demonstrates the AI agent using Vercel AI SDK with our function registry.
 * This is a working prototype of the full agent system.
 */

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { functionRegistry } from '@/services/agents/function-registry';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { message, userId = 'demo-user-123' } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    logger.info('[Agent Demo] Processing message', { message, userId });

    // Get tool definitions from registry
    const tools = functionRegistry.getToolDefinitions('all');

    // Convert tools to work with our function registry
    const executableTools: any = {};
    Object.entries(tools).forEach(([name, tool]) => {
      executableTools[name] = {
        ...tool,
        execute: async (args: any) => {
          // Execute through function registry instead
          return await functionRegistry.execute(name, args, userId);
        }
      };
    });

    // Call AI with tools
    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      system: `You are Gymzy AI, a helpful fitness assistant. You can:
- Help users view and manage their workouts
- Assist with profile management and fitness goals
- Navigate the app for users
- Manage settings and preferences
- Search for other users

Be friendly, motivating, and proactive. When you provide data, also suggest relevant navigation.
For example, after showing workout stats, suggest "Would you like to see your full stats page?"

IMPORTANT: Always call the appropriate function when the user asks for something. Don't just describe what you would do - actually do it!`,
      prompt: message,
      tools: executableTools,
      maxToolRoundtrips: 5 // Allow up to 5 tool call rounds
    });

    // Extract function calls and results
    const functionCalls: any[] = [];
    if (result.toolCalls) {
      result.toolCalls.forEach((call: any) => {
        functionCalls.push({
          name: call.toolName,
          args: call.args || {},
          result: call.result || {}
        });
      });
    }

    logger.info('[Agent Demo] Response generated', {
      message,
      functionCallCount: functionCalls?.length || 0,
      response: result.text
    });

    return Response.json({
      success: true,
      message: result.text,
      functionCalls: functionCalls || [],
      usage: result.usage
    });

  } catch (error) {
    logger.error('[Agent Demo] Error processing message', { error });
    return Response.json(
      {
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
