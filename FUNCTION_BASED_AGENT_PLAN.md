# Function-Based Agentic Control (No Screenshots)

## 🎯 Pure Function Orchestration Approach

The agent controls your app through **intelligent function calling** - no screenshots, no DOM manipulation, just clean API calls.

---

## 🧠 How It Works

```
User Input → Agent Planning → Multi-Step Execution → UI Updates
     ↓              ↓                    ↓                ↓
  "Show stats"  [navigateTo,      Execute functions   Router.push()
                 viewStats]        in sequence         + UI updates
```

### Agent's Mental Model:

```typescript
{
  // What the agent knows
  availableFunctions: [
    'navigateTo', 'viewWorkoutHistory', 'logWorkout',
    'viewProfile', 'updateSettings', etc...
  ],

  // Current context
  currentPage: '/workout',
  currentUser: { id: '123', name: 'John' },

  // What it can do
  capabilities: [
    'Navigate between pages',
    'View/create/delete workouts',
    'Manage profile',
    'Search users',
    'Update settings'
  ]
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         User Chat Input                 │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│    LangGraph Agent Orchestrator         │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │ Planner  │→│ Executor │→│ Reply│ │
│  └──────────┘  └──────────┘  └──────┘ │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Your Function Registry (17 functions) │
│   - navigateTo                          │
│   - viewWorkoutHistory                  │
│   - logWorkout                          │
│   - viewProfile                         │
│   - etc...                              │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   React App (Next.js)                   │
│   - Router updates                      │
│   - State changes                       │
│   - UI re-renders                       │
└─────────────────────────────────────────┘
```

---

## 📋 Implementation Steps

### Step 1: Agent State Schema

```typescript
// src/services/agents/agentic-orchestrator.ts

interface AgentState {
  // Input
  userInput: string;
  conversationHistory: Array<{role: 'user' | 'agent', content: string}>;
  userId: string;

  // Context
  currentPage: string;
  availableFunctions: string[];

  // Planning
  intent: 'navigate' | 'action' | 'query' | 'workflow';
  plan: FunctionCall[];

  // Execution
  currentStep: number;
  executedCalls: FunctionCall[];
  results: any[];

  // Output
  agentResponse: string;
  navigationTarget?: string;
  error?: string;
}

interface FunctionCall {
  functionName: string;
  args: Record<string, any>;
  reasoning: string;
}
```

### Step 2: LangGraph Orchestrator

```typescript
// src/services/agents/agentic-orchestrator.ts

import { StateGraph, END } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { functionRegistry } from './function-registry';

export function createAgentOrchestrator() {
  const graph = new StateGraph<AgentState>({
    channels: {
      userInput: null,
      conversationHistory: null,
      userId: null,
      currentPage: null,
      availableFunctions: null,
      intent: null,
      plan: null,
      currentStep: null,
      executedCalls: null,
      results: null,
      agentResponse: null,
      navigationTarget: null,
      error: null
    }
  });

  // Node 1: Plan - Convert user input to function calls
  graph.addNode("plan", async (state: AgentState) => {
    const llm = new ChatGroq({
      model: "llama3-70b-8192",
      temperature: 0
    });

    const availableFunctions = functionRegistry.getToolDefinitions('all');
    const functionDescriptions = Object.entries(availableFunctions).map(([name, def]) =>
      `${name}: ${def.description}`
    ).join('\n');

    const prompt = `You are controlling a fitness app.

Available functions:
${functionDescriptions}

Current context:
- User ID: ${state.userId}
- Current page: ${state.currentPage}
- Previous conversation: ${JSON.stringify(state.conversationHistory.slice(-3))}

User request: "${state.userInput}"

Generate a plan as a JSON array of function calls to fulfill this request.
Think step-by-step. For example:
- To show stats, you need: [{ function: "navigateTo", args: { page: "stats" } }]
- To create workout, you need: [
    { function: "navigateTo", args: { page: "log-workout" } },
    { function: "logWorkout", args: { workoutType: "strength" } }
  ]

Return ONLY a JSON array, no other text:
[
  { "function": "functionName", "args": {...}, "reasoning": "why this step" }
]`;

    const response = await llm.invoke(prompt);
    const plan = JSON.parse(response.content as string);

    return {
      ...state,
      plan,
      currentStep: 0,
      intent: plan.length === 1 ? 'action' : 'workflow'
    };
  });

  // Node 2: Execute - Run function calls one by one
  graph.addNode("execute", async (state: AgentState) => {
    const currentCall = state.plan[state.currentStep];

    if (!currentCall) {
      // No more steps, done executing
      return state;
    }

    try {
      const result = await functionRegistry.execute(
        currentCall.functionName,
        currentCall.args,
        state.userId
      );

      return {
        ...state,
        executedCalls: [...state.executedCalls, currentCall],
        results: [...state.results, result],
        currentStep: state.currentStep + 1,
        navigationTarget: result.navigationTarget || state.navigationTarget
      };
    } catch (error) {
      return {
        ...state,
        error: `Failed to execute ${currentCall.functionName}: ${error.message}`
      };
    }
  });

  // Node 3: Reply - Generate natural language response
  graph.addNode("reply", async (state: AgentState) => {
    const llm = new ChatGroq({ model: "llama3-70b-8192" });

    const prompt = `User asked: "${state.userInput}"

You executed these actions:
${state.executedCalls.map((call, i) =>
  `${i+1}. ${call.functionName}(${JSON.stringify(call.args)}) - ${call.reasoning}`
).join('\n')}

Results:
${JSON.stringify(state.results, null, 2)}

Generate a friendly, concise response explaining what you did. Be natural and helpful.`;

    const response = await llm.invoke(prompt);

    return {
      ...state,
      agentResponse: response.content as string,
      conversationHistory: [
        ...state.conversationHistory,
        { role: 'user', content: state.userInput },
        { role: 'agent', content: response.content as string }
      ]
    };
  });

  // Define edges
  graph.addEdge("plan", "execute");

  graph.addConditionalEdges(
    "execute",
    (state) => {
      // If error, go to reply
      if (state.error) return "reply";

      // If more steps, continue executing
      if (state.currentStep < state.plan.length) return "execute";

      // Otherwise, generate reply
      return "reply";
    },
    {
      execute: "execute",
      reply: "reply"
    }
  );

  graph.addEdge("reply", END);

  graph.setEntryPoint("plan");

  return graph.compile();
}
```

### Step 3: Agent Service

```typescript
// src/services/agents/agent-service.ts

import { createAgentOrchestrator } from './agentic-orchestrator';

class AgentService {
  private orchestrator = createAgentOrchestrator();
  private conversationHistory: Array<{role: string, content: string}> = [];

  async executeCommand(
    userInput: string,
    userId: string,
    currentPage: string
  ) {
    const result = await this.orchestrator.invoke({
      userInput,
      userId,
      currentPage,
      conversationHistory: this.conversationHistory,
      availableFunctions: Object.keys(
        functionRegistry.getToolDefinitions('all')
      ),
      currentStep: 0,
      executedCalls: [],
      results: [],
      plan: [],
      intent: 'query'
    });

    // Update conversation history
    this.conversationHistory = result.conversationHistory;

    return {
      response: result.agentResponse,
      navigationTarget: result.navigationTarget,
      executedActions: result.executedCalls,
      error: result.error
    };
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

export const agentService = new AgentService();
```

### Step 4: React Hook

```typescript
// src/hooks/useAgent.ts

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { agentService } from '@/services/agents/agent-service';

export function useAgent() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const executeCommand = async (command: string) => {
    if (!user) {
      throw new Error('User must be logged in');
    }

    setIsProcessing(true);
    try {
      const result = await agentService.executeCommand(
        command,
        user.uid,
        pathname
      );

      setLastResponse(result.response);

      // Handle navigation
      if (result.navigationTarget) {
        router.push(result.navigationTarget);
      }

      return result;
    } catch (error) {
      console.error('Agent execution failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    executeCommand,
    isProcessing,
    lastResponse,
    clearHistory: () => agentService.clearHistory()
  };
}
```

### Step 5: Chat Interface Component

```typescript
// src/components/AgentChat.tsx

'use client';

import { useState } from 'react';
import { useAgent } from '@/hooks/useAgent';
import { Send, Loader2 } from 'lucide-react';

export function AgentChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: 'user' | 'agent', content: string}>>([]);
  const { executeCommand, isProcessing } = useAgent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const result = await executeCommand(userMessage);
      setMessages(prev => [...prev, { role: 'agent', content: result.response }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600">
        <h2 className="text-white font-bold text-lg">AI Agent Assistant</h2>
        <p className="text-purple-100 text-sm">
          I can control the entire app for you - just tell me what to do!
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg font-medium">Ask me to help you with:</p>
            <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
              <li>• "Show me my workout stats from last week"</li>
              <li>• "Create a chest workout with bench press"</li>
              <li>• "What's my heaviest squat?"</li>
              <li>• "Take me to my profile"</li>
              <li>• "Update my fitness goals"</li>
            </ul>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm text-gray-600">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what to do..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Step 6: Add to Your App

```typescript
// src/app/layout.tsx or create a floating chat widget

import { AgentChat } from '@/components/AgentChat';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}

        {/* Floating agent chat */}
        <div className="fixed bottom-4 right-4 w-96 h-[600px] z-50">
          <AgentChat />
        </div>
      </body>
    </html>
  );
}
```

---

## 🎯 Example Workflows

### Simple Navigation
```
User: "Show me my stats"
↓
Plan: [{ function: "navigateTo", args: { page: "stats" } }]
↓
Execute: navigateTo('stats')
↓
Result: Router.push('/stats')
Response: "Here are your workout statistics!"
```

### Complex Workflow
```
User: "What's my best bench press and show me my chest workouts"
↓
Plan: [
  { function: "getPersonalBests", args: { exerciseName: "bench press" } },
  { function: "viewWorkoutHistory", args: { limit: 10 } }
]
↓
Execute both functions
↓
Response: "Your best bench press is 225 lbs! I found 5 chest workouts..."
```

### Multi-Step with Navigation
```
User: "Create a leg workout"
↓
Plan: [
  { function: "navigateTo", args: { page: "log-workout" } },
  { function: "logWorkout", args: { workoutType: "strength" } }
]
↓
Execute in sequence
↓
Response: "I've navigated to the workout logger and started a new strength workout for you!"
```

---

## ✅ What You Get

**With this approach:**
- ✅ Agent can control **entire app** through functions
- ✅ No screenshot processing (fast & reliable)
- ✅ Multi-step workflows automatically planned
- ✅ Natural conversation with context
- ✅ Clean architecture (uses your existing functions)
- ✅ Easy to extend (add new functions = new capabilities)

**Agent Capabilities:**
- Navigate between pages
- View/create/delete workouts
- Manage profile & settings
- Search users
- Get stats & analytics
- Complex multi-step workflows

---

## 🚀 Next Steps

1. **Install dependencies** (if needed):
   ```bash
   npm install @langchain/langgraph@latest @langchain/groq
   ```

2. **Create files**:
   - `src/services/agents/agentic-orchestrator.ts`
   - `src/services/agents/agent-service.ts`
   - `src/hooks/useAgent.ts`
   - `src/components/AgentChat.tsx`

3. **Test with simple commands**:
   - "Show me my workouts"
   - "Take me to stats"
   - "What's my best squat?"

4. **Expand** with more complex workflows

Ready to start building?
