/**
 * Quick Action API Route
 *
 * Phase 1 MVP: Single function call execution from natural language
 * Converts user message -> function name + args -> executes -> returns result
 */

import { NextRequest, NextResponse } from 'next/server';
import { functionRegistry } from '@/services/agents/function-registry';
import { logger } from '@/lib/logger';
import { getAPIConfig } from '@/lib/env-config';
import { initializeAdminApp } from '@/lib/firebase-admin';
import { verifyAuth, verifyUserAccess } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // Initialize Firebase Admin SDK for server-side operations
  initializeAdminApp();

  try {
    // 🔒 SECURITY: Verify authentication from Authorization header
    const authenticatedUser = await verifyAuth(request);
    const userId = authenticatedUser.uid;

    logger.info('[QuickAction] Authenticated request', 'api', {
      userId,
      email: authenticatedUser.email
    });

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Optional: If client still sends userId, verify it matches authenticated user
    if (body.userId && body.userId !== userId) {
      logger.warn('[QuickAction] User ID mismatch', 'api', {
        authenticatedUserId: userId,
        requestedUserId: body.userId
      });
      return NextResponse.json(
        { error: 'Access denied: User ID mismatch' },
        { status: 403 }
      );
    }

    logger.info('[QuickAction] Processing request', 'api', { message, userId });

    // Get all available functions
    const allFunctions = functionRegistry.getFunctionsForDomain('all');
    const toolDefs = functionRegistry.getToolDefinitions('all');

    // Build function descriptions for the LLM
    const functionDescriptions = allFunctions.map(fnName => {
      const tool = toolDefs[fnName];
      return `${fnName}: ${tool?.description || 'No description'}`;
    }).join('\n');

    const prompt = `You are a fitness app AI assistant. Convert the user's natural language request into a SINGLE function call.

Available functions:
${functionDescriptions}

User request: "${message}"

Rules:
1. Choose the SINGLE most appropriate function
2. Extract parameters from the user's message
3. Return ONLY valid JSON, no markdown, no explanation
4. Use null for optional parameters not mentioned

Response format:
{
  "function": "functionName",
  "args": { "param1": "value1", "param2": "value2" }
}

Examples:
User: "Show my stats"
Response: {"function": "viewStats", "args": {}}

User: "Go to profile"
Response: {"function": "navigateTo", "args": {"page": "profile"}}

User: "What's my best squat?"
Response: {"function": "getPersonalBests", "args": {"exerciseName": "squat"}}

Now respond for: "${message}"`;

    // Call Gemini API
    const config = getAPIConfig();

    if (!config.gemini.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;

    const geminiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      logger.error('[QuickAction] Gemini API error', 'api', undefined, { errorText });
      throw new Error('Failed to get response from AI');
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    logger.info('[QuickAction] LLM response', 'api', { responseText });

    // Parse LLM response
    let functionCall: { function: string; args: any };
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      functionCall = JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.error('[QuickAction] Failed to parse LLM response', 'api', parseError instanceof Error ? parseError : undefined, {
        responseText
      });
      return NextResponse.json(
        {
          error: 'Failed to understand your request. Try rephrasing it.',
          message: 'I could not understand that command. Try something like "show my stats" or "go to profile".'
        },
        { status: 400 }
      );
    }

    // Validate function exists
    if (!allFunctions.includes(functionCall.function)) {
      logger.warn('[QuickAction] Invalid function', 'api', { function: functionCall.function });
      return NextResponse.json(
        {
          error: 'Invalid function',
          message: `I don't know how to do that yet. I can help with workouts, stats, profile, and navigation.`
        },
        { status: 400 }
      );
    }

    // Execute the function
    logger.info('[QuickAction] Executing function', 'api', {
      function: functionCall.function,
      args: functionCall.args
    });

    const result = await functionRegistry.execute(
      functionCall.function,
      functionCall.args,
      userId
    );

    logger.info('[QuickAction] Function executed', 'api', {
      function: functionCall.function,
      success: result.success
    });

    // Return result
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to execute action',
          message: result.message || 'Something went wrong. Please try again.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Action completed successfully',
      navigationTarget: result.navigationTarget,
      data: result
    });

  } catch (error) {
    logger.error('[QuickAction] Request failed', 'api', error instanceof Error ? error : undefined, {
      errorMessage: error instanceof Error ? error.message : String(error)
    });

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Authentication failed')) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required. Please sign in.'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Something went wrong. Please try again.'
      },
      { status: 500 }
    );
  }
}
