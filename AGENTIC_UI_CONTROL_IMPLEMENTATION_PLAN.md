# Agentic UI Control Implementation Plan

## 🎯 Goal
Build an AI agent system that can **control the entire Gymzy app** through natural language - navigating pages, pressing buttons, filling forms, executing workflows - everything.

---

## 🔬 Research Summary: Latest 2025 LangGraph Patterns

### Key Discoveries from Research

#### 1. **Visual Browser Agents (WebVoyager Pattern)**
- LangGraph agents can control web UIs by viewing **annotated screenshots**
- Agent decides actions based on visual understanding + available actions
- Real-world: Used for complex web automation tasks

#### 2. **Generative UI + LangGraph Integration**
- **CopilotKit AG-UI Protocol**: Open-source framework for in-app AI copilots
- Agents can generate custom UI components on the fly
- Two-way communication: Agent → UI actions, UI → Agent feedback

#### 3. **Multi-Agent Orchestration**
- **Supervisor Pattern**: One agent coordinates multiple specialist agents
- **Hierarchical**: Planner → Executors → Observer pattern
- **State Persistence**: LangGraph maintains context across sessions

#### 4. **Enterprise Implementations (2025)**
- **Airtop + LangGraph**: Browser automation via natural language APIs
- **UiPath + LangGraph**: RPA + AI agentic automation
- Pattern: Individual automations as LangGraph **subgraphs**

---

## 🏗️ Architecture Design

### Option 1: **Full UI Control Agent** (Recommended)
Build a LangGraph agent that can control your Next.js app like a human user.

```
┌─────────────────────────────────────────────────────────┐
│                   User Chat Interface                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  LangGraph Agent   │
         │   (Supervisor)     │
         └────────┬───────────┘
                  │
        ┌─────────┼──────────┐
        │         │          │
        ▼         ▼          ▼
   ┌────────┐ ┌──────┐ ┌────────┐
   │Navigate│ │Action│ │Observe │
   │ Agent  │ │Agent │ │ Agent  │
   └────┬───┘ └───┬──┘ └────┬───┘
        │         │         │
        ▼         ▼         ▼
   ┌──────────────────────────┐
   │   Next.js App Context    │
   │  - Router (navigation)   │
   │  - React Context (state) │
   │  - Custom Actions API    │
   └──────────────────────────┘
```

### Option 2: **Hybrid Agent + Function Calling** (Quick Start)
Extend your existing function registry with LangGraph orchestration.

```
User Input → LangGraph → Function Registry → App Functions
                ↓
         State Management
         (conversation + context)
```

---

## 📋 Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal**: Set up LangGraph orchestration layer

#### 1.1 Create Agent State Schema
```typescript
// src/services/agents/agentic-state.ts

interface AgenticUIState {
  // User interaction
  userInput: string;
  conversationHistory: BaseMessage[];
  userId: string;

  // Current UI state
  currentPage: string;
  currentRoute: string;
  pageContext: Record<string, any>;

  // Action tracking
  pendingActions: Action[];
  completedActions: Action[];
  actionResults: ActionResult[];

  // Agent reasoning
  intent: 'navigate' | 'action' | 'query' | 'complex';
  plan: Step[];
  currentStep: number;

  // Error handling
  errors: string[];
  retryCount: number;

  // Response
  agentResponse: string;
  uiUpdates: UIUpdate[];
}

interface Action {
  type: 'navigate' | 'click' | 'input' | 'submit' | 'wait';
  target: string; // element ID, route, etc.
  value?: any;
  requiresConfirmation?: boolean;
}

interface UIUpdate {
  component: string;
  props: Record<string, any>;
  action: 'show' | 'hide' | 'update' | 'highlight';
}
```

#### 1.2 Build Navigation Control Layer
```typescript
// src/services/agents/navigation-controller.ts

export class NavigationController {
  private router: AppRouterInstance;

  async navigate(route: string, params?: Record<string, any>) {
    // Use Next.js router
    this.router.push(route);

    // Wait for navigation
    await this.waitForNavigation();

    // Capture page state
    return this.capturePageState();
  }

  async capturePageState() {
    // Get current route, params, visible components, form state
    return {
      route: window.location.pathname,
      params: this.getRouteParams(),
      components: this.getVisibleComponents(),
      forms: this.getFormStates(),
      interactiveElements: this.getInteractiveElements()
    };
  }

  getInteractiveElements() {
    // Return list of all buttons, links, inputs with IDs/selectors
    return Array.from(document.querySelectorAll('[data-agent-action]'))
      .map(el => ({
        id: el.getAttribute('data-agent-id'),
        type: el.tagName,
        action: el.getAttribute('data-agent-action'),
        label: el.textContent || el.getAttribute('aria-label')
      }));
  }
}
```

#### 1.3 Build Action Execution Layer
```typescript
// src/services/agents/action-executor.ts

export class ActionExecutor {
  async executeAction(action: Action): Promise<ActionResult> {
    switch (action.type) {
      case 'click':
        return this.clickElement(action.target);

      case 'input':
        return this.fillInput(action.target, action.value);

      case 'submit':
        return this.submitForm(action.target);

      case 'navigate':
        return this.navigateTo(action.target);

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private clickElement(selector: string) {
    const element = document.querySelector(`[data-agent-id="${selector}"]`);
    if (element) {
      (element as HTMLElement).click();
      return { success: true, action: 'click', target: selector };
    }
    return { success: false, error: 'Element not found' };
  }

  private fillInput(selector: string, value: any) {
    const input = document.querySelector(`[data-agent-id="${selector}"]`) as HTMLInputElement;
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return { success: true, action: 'input', target: selector, value };
    }
    return { success: false, error: 'Input not found' };
  }
}
```

### Phase 2: LangGraph Agent (Week 1-2)
**Goal**: Create the intelligent orchestration layer

#### 2.1 Create Main Agent Graph
```typescript
// src/services/agents/agentic-ui-graph.ts

import { StateGraph, END } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";

export function createAgenticUIGraph() {
  const graph = new StateGraph<AgenticUIState>({
    channels: {
      userInput: null,
      conversationHistory: null,
      currentPage: null,
      intent: null,
      plan: null,
      pendingActions: null,
      completedActions: null,
      agentResponse: null,
      uiUpdates: null,
      errors: null
    }
  });

  // Node 1: Analyze Intent
  graph.addNode("analyzeIntent", async (state) => {
    const llm = new ChatGroq({
      model: "llama3-70b-8192",
      temperature: 0.1
    });

    const prompt = `
    You are controlling a fitness app. User said: "${state.userInput}"
    Current page: ${state.currentPage}
    Available actions: ${JSON.stringify(state.pageContext.interactiveElements)}

    Determine:
    1. Intent (navigate/action/query/complex)
    2. If action needed, what actions?
    3. Generate a plan

    Respond in JSON format.
    `;

    const response = await llm.invoke(prompt);
    const analysis = JSON.parse(response.content);

    return {
      ...state,
      intent: analysis.intent,
      plan: analysis.plan
    };
  });

  // Node 2: Execute Navigation
  graph.addNode("executeNavigation", async (state) => {
    const navController = new NavigationController();
    const step = state.plan[state.currentStep];

    if (step.type === 'navigate') {
      const result = await navController.navigate(step.target);

      return {
        ...state,
        currentPage: result.route,
        pageContext: result,
        completedActions: [...state.completedActions, step],
        currentStep: state.currentStep + 1
      };
    }

    return state;
  });

  // Node 3: Execute Actions
  graph.addNode("executeActions", async (state) => {
    const executor = new ActionExecutor();
    const step = state.plan[state.currentStep];

    const result = await executor.executeAction(step);

    return {
      ...state,
      completedActions: [...state.completedActions, step],
      actionResults: [...state.actionResults, result],
      currentStep: state.currentStep + 1
    };
  });

  // Node 4: Observe & Verify
  graph.addNode("observeAndVerify", async (state) => {
    const navController = new NavigationController();
    const currentState = await navController.capturePageState();

    // Check if action was successful
    const lastAction = state.completedActions[state.completedActions.length - 1];
    const lastResult = state.actionResults[state.actionResults.length - 1];

    if (!lastResult.success) {
      return {
        ...state,
        errors: [...state.errors, `Action failed: ${lastResult.error}`],
        retryCount: state.retryCount + 1
      };
    }

    return {
      ...state,
      pageContext: currentState
    };
  });

  // Node 5: Generate Response
  graph.addNode("generateResponse", async (state) => {
    const llm = new ChatGroq({ model: "llama3-70b-8192" });

    const prompt = `
    User asked: "${state.userInput}"
    Actions completed: ${JSON.stringify(state.completedActions)}
    Current page: ${state.currentPage}

    Generate a friendly response explaining what you did.
    `;

    const response = await llm.invoke(prompt);

    return {
      ...state,
      agentResponse: response.content
    };
  });

  // Define edges (control flow)
  graph.addEdge("analyzeIntent", "shouldNavigate");

  graph.addConditionalEdges(
    "shouldNavigate",
    (state) => {
      const nextStep = state.plan[state.currentStep];
      if (!nextStep) return "generateResponse";
      if (nextStep.type === "navigate") return "executeNavigation";
      return "executeActions";
    },
    {
      executeNavigation: "executeNavigation",
      executeActions: "executeActions",
      generateResponse: "generateResponse"
    }
  );

  graph.addEdge("executeNavigation", "observeAndVerify");
  graph.addEdge("executeActions", "observeAndVerify");
  graph.addEdge("observeAndVerify", "shouldNavigate"); // Loop back
  graph.addEdge("generateResponse", END);

  graph.setEntryPoint("analyzeIntent");

  return graph.compile();
}
```

### Phase 3: UI Integration (Week 2)
**Goal**: Make your React components agent-controllable

#### 3.1 Add Agent Attributes to Components
```tsx
// Mark components as agent-controllable
<button
  data-agent-id="start-workout-btn"
  data-agent-action="click"
  data-agent-description="Start a new workout session"
  onClick={handleStartWorkout}
>
  Start Workout
</button>

<input
  data-agent-id="workout-name-input"
  data-agent-action="input"
  data-agent-description="Enter workout name"
  value={workoutName}
  onChange={(e) => setWorkoutName(e.target.value)}
/>

<Link
  href="/stats"
  data-agent-id="nav-stats"
  data-agent-action="navigate"
  data-agent-description="Navigate to statistics page"
>
  View Stats
</Link>
```

#### 3.2 Create Agent Control Context
```tsx
// src/contexts/AgentContext.tsx

interface AgentContextType {
  executeAgentCommand: (command: string) => Promise<AgentResponse>;
  agentState: AgenticUIState;
  isAgentActive: boolean;
}

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agentState, setAgentState] = useState<AgenticUIState>(initialState);
  const agentGraph = useRef(createAgenticUIGraph());

  const executeAgentCommand = async (command: string) => {
    const result = await agentGraph.current.invoke({
      ...agentState,
      userInput: command,
      conversationHistory: [
        ...agentState.conversationHistory,
        new HumanMessage(command)
      ]
    });

    setAgentState(result);
    return result;
  };

  return (
    <AgentContext.Provider value={{ executeAgentCommand, agentState, isAgentActive: true }}>
      {children}
    </AgentContext.Provider>
  );
}
```

#### 3.3 Build Agent Chat Interface
```tsx
// src/components/AgentChatInterface.tsx

export function AgentChatInterface() {
  const { executeAgentCommand, agentState } = useAgent();
  const [input, setInput] = useState('');

  const handleSubmit = async () => {
    await executeAgentCommand(input);
    setInput('');
  };

  return (
    <div className="agent-chat">
      <div className="messages">
        {agentState.conversationHistory.map((msg, i) => (
          <div key={i} className={msg.type}>
            {msg.content}
          </div>
        ))}
      </div>

      {/* Show agent actions in real-time */}
      {agentState.pendingActions.length > 0 && (
        <div className="agent-actions">
          <h4>Agent is working...</h4>
          {agentState.pendingActions.map((action, i) => (
            <div key={i}>
              {action.type}: {action.target}
            </div>
          ))}
        </div>
      )}

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Tell the agent what to do..."
      />
      <button onClick={handleSubmit}>Send</button>
    </div>
  );
}
```

### Phase 4: Advanced Features (Week 3)
**Goal**: Add visual understanding and multi-step workflows

#### 4.1 Screenshot-Based Navigation (WebVoyager Pattern)
```typescript
// Use Puppeteer or Playwright for screenshots
async function capturePageScreenshot() {
  // In browser environment, use html2canvas
  const canvas = await html2canvas(document.body);
  return canvas.toDataURL();
}

// Send to vision-capable LLM
async function analyzeScreenshot(screenshot: string, userIntent: string) {
  const llm = new ChatOpenAI({
    model: "gpt-4-vision-preview"
  });

  const response = await llm.invoke([
    new HumanMessage({
      content: [
        { type: "text", text: userIntent },
        { type: "image_url", image_url: screenshot }
      ]
    })
  ]);

  return response;
}
```

#### 4.2 Complex Workflow Examples
```typescript
// Example: "Log a chest workout with bench press and push-ups"
const complexWorkflow = {
  steps: [
    { type: 'navigate', target: '/log-workout/new' },
    { type: 'wait', duration: 500 },
    { type: 'click', target: 'workout-type-strength' },
    { type: 'input', target: 'workout-name', value: 'Chest Day' },
    { type: 'click', target: 'add-exercise-btn' },
    { type: 'input', target: 'exercise-search', value: 'bench press' },
    { type: 'click', target: 'exercise-bench-press' },
    { type: 'input', target: 'set-1-weight', value: '135' },
    { type: 'input', target: 'set-1-reps', value: '10' },
    { type: 'click', target: 'add-exercise-btn' },
    { type: 'input', target: 'exercise-search', value: 'push ups' },
    { type: 'click', target: 'exercise-push-ups' },
    { type: 'input', target: 'set-1-reps', value: '20' },
    { type: 'click', target: 'save-workout-btn' },
    { type: 'wait', duration: 1000 },
    { type: 'navigate', target: '/workout' }
  ]
};
```

---

## 🚀 Quick Start Implementation

### Step 1: Install Latest Packages
```bash
npm install @langchain/langgraph@latest @langchain/core@latest
npm install html2canvas # for screenshots
```

### Step 2: Create Basic Agent (30 minutes)
```typescript
// src/services/agents/basic-ui-agent.ts

import { StateGraph } from "@langchain/langgraph";
import { functionRegistry } from './function-registry';

export async function executeUICommand(command: string, userId: string) {
  // Simple approach: Use LLM to convert command to function calls
  const llm = new ChatGroq({ model: "llama3-70b-8192" });

  const availableFunctions = functionRegistry.getToolDefinitions('all');

  const prompt = `
  User command: "${command}"

  Available functions: ${JSON.stringify(Object.keys(availableFunctions))}

  Convert this command into a sequence of function calls.
  Return JSON array of: [{ function: 'name', args: {...} }]
  `;

  const response = await llm.invoke(prompt);
  const functionCalls = JSON.parse(response.content);

  // Execute each function
  const results = [];
  for (const call of functionCalls) {
    const result = await functionRegistry.execute(call.function, call.args, userId);
    results.push(result);
  }

  return results;
}
```

### Step 3: Add to Chat Interface (15 minutes)
```typescript
// In your existing chat component
const handleAgentCommand = async (message: string) => {
  const results = await executeUICommand(message, user.uid);

  // Handle navigation
  results.forEach(result => {
    if (result.navigationTarget) {
      router.push(result.navigationTarget);
    }
  });

  return results;
};
```

---

## 📊 Example Use Cases

### 1. Simple Navigation
```
User: "Show me my workout stats"
Agent:
  1. Calls navigateTo({ page: 'stats' })
  2. Responds: "Here are your workout statistics"
```

### 2. Complex Workflow
```
User: "Create a leg day workout with squats and lunges"
Agent:
  1. navigateTo({ page: 'log-workout' })
  2. logWorkout({ workoutType: 'strength' })
  3. [Fills in exercise details]
  4. Responds: "I've created a leg day workout for you with squats and lunges"
```

### 3. Multi-Step Query
```
User: "What's my heaviest bench press and show me my chest workout history"
Agent:
  1. getPersonalBests({ exerciseName: 'bench press' })
  2. viewWorkoutHistory({ filter: 'chest' })
  3. Generates response with both pieces of info
```

---

## 🎯 Recommended Approach

**For Quick MVP (This Week):**
1. Use **Option 2** (Hybrid) - extend your existing function registry
2. Add basic LangGraph orchestration for multi-step workflows
3. Use your existing agent functions (already typed and working!)
4. Add simple UI annotations (data-agent-id)

**For Full Agentic Control (Weeks 2-3):**
1. Implement **Option 1** (Full UI Control)
2. Add screenshot analysis with vision LLM
3. Build real-time action visualization
4. Create complex workflow patterns

---

## 📚 Key Technologies

- **LangGraph**: State machine orchestration
- **Your Existing Function Registry**: Already has 17 functions ready!
- **Next.js App Router**: For navigation control
- **React Context**: For agent state management
- **data-agent-* attributes**: Make UI controllable
- **Vision LLM (optional)**: For screenshot-based control

---

## ✅ Next Steps

1. **Choose approach**: Quick MVP or Full Control?
2. **Start with**: Basic agent orchestration using your function registry
3. **Add**: UI annotations to key components
4. **Build**: Agent chat interface
5. **Test**: Simple workflows first, then complex

Want me to start implementing the Quick MVP approach first?
