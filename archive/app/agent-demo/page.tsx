'use client';

/**
 * AI Agent Demo Page
 *
 * Interactive demo of the AI agent with function calling.
 * Shows how the agent can control the entire app through conversation.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  functionCalls?: Array<{
    name: string;
    args: any;
    result: any;
  }>;
}

export default function AgentDemoPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your Gymzy AI assistant. I can help you with workouts, profile management, navigation, and more. Try asking me something like:\n\n- "Show me my workout history"\n- "What are my stats for this month?"\n- "Take me to settings"\n- "Update my fitness goals to muscle gain and strength"'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const examplePrompts = [
    "Show me my workout history",
    "What are my personal bests?",
    "Take me to my profile",
    "Show me my stats for this month",
    "Help me with workouts"
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          functionCalls: data.functionCalls
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${data.error}`
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered a connection error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Gymzy AI Agent Demo
            </h1>
          </div>
          <p className="text-slate-400">
            Voice & Text Control - Full App Automation
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            62 functions • 17 tools • All tests passing
          </div>
        </div>

        {/* Example Prompts */}
        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-3">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 mb-4 min-h-[500px] max-h-[600px] overflow-y-auto">
          <div className="p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Show function calls */}
                  {msg.functionCalls && msg.functionCalls.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <p className="text-xs text-slate-400 mb-2">Function calls:</p>
                      {msg.functionCalls.map((call, i) => (
                        <div key={i} className="text-xs bg-slate-800/50 rounded p-2 mb-2">
                          <div className="font-mono text-purple-300">
                            {call.name}({JSON.stringify(call.args, null, 2)})
                          </div>
                          {call.result && (
                            <div className="mt-1 text-slate-400">
                              Result: {call.result.success ? '✅ Success' : '❌ Failed'}
                              {call.result.navigationTarget && (
                                <div className="text-blue-400">
                                  → Navigate to: {call.result.navigationTarget}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-100 rounded-lg p-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message... (e.g., 'Show me my workout history')"
            disabled={isLoading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>

        {/* Info */}
        <div className="mt-4 text-center text-xs text-slate-500">
          <p>This is a demo using mock data. In production, it will access your real workouts and profile.</p>
        </div>
      </div>
    </div>
  );
}
