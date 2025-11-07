# AI Agent Architecture Plan - Gymzy Voice/Text Control System

## Executive Summary

This document outlines a comprehensive, scalable architecture for enabling AI-powered voice and text control of the entire Gymzy fitness app. Based on 2025 best practices from LangGraph, LangChain, and Vercel AI SDK research.

---

## Core Challenges Identified

### 1. **Context Management**
- Large app with many functions → exceeds context window
- Need conversation memory across sessions
- Must maintain workout state, user preferences, navigation history

### 2. **Function Organization**
- 50+ potential functions across workout, profile, settings, social, stats
- Risk of overwhelming the AI with too many tools
- Need intelligent routing to relevant function subsets

### 3. **State & Memory**
- Short-term: Current conversation, active workout, navigation state
- Long-term: User preferences, workout history, personal bests
- Working memory: Partially completed tasks, pending confirmations

### 4. **Testing Complexity**
- Non-deterministic AI outputs
- Need behavioral tests, not just unit tests
- Must test multi-turn conversations, error recovery

### 5. **User Experience**
- Confirmation for destructive actions
- Graceful error handling
- Natural language understanding quality

---

## Proposed Architecture

### **High-Level: Layered Agent System**

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│          (Voice Input + Text Chat + Navigation)          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              AGENT ORCHESTRATOR                          │
│  - Intent classification                                 │
│  - Context loading                                       │
│  - Sub-agent routing                                     │
│  - Safety/confirmation checks                            │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        │             │             │             │
┌───────▼──────┐ ┌───▼──────┐ ┌───▼──────┐ ┌───▼──────┐
│   WORKOUT    │ │  PROFILE │ │  SOCIAL  │ │  SYSTEM  │
│  SUB-AGENT   │ │SUB-AGENT │ │SUB-AGENT │ │SUB-AGENT │
│              │ │          │ │          │ │          │
│ - Generate   │ │ - View   │ │ - Feed   │ │ - Nav    │
│ - Log        │ │ - Update │ │ - Follow │ │ - Settings│
│ - History    │ │ - Stats  │ │ - Post   │ │ - Prefs  │
│ - Delete     │ │ - Goals  │ │ - Search │ │ - Privacy│
└───────┬──────┘ └───┬──────┘ └───┬──────┘ └───┬──────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              SERVICE LAYER (Existing)                    │
│  workout-service, profile-service, settings-service...   │
└──────────────────────────────────────────────────────────┘
```

### **Why This Architecture?**

1. **Hub-and-Spoke Pattern** (from LangGraph research)
   - Orchestrator classifies intent and routes to specialized sub-agents
   - Reduces context per agent (each sub-agent sees only relevant tools)
   - Easier to test and debug individual sub-agents

2. **Swarm Benefits** (from benchmarking research)
   - Sub-agents can respond directly to user
   - Avoids "telephone game" of pure supervisor pattern
   - Orchestrator maintains conversation coherence

3. **Context Isolation**
   - Each sub-agent has focused prompt and toolset
   - Only load relevant context (e.g., workout agent doesn't need social feed data)
   - Reduces token usage by ~60-80%

---

## Detailed Component Design

### 1. **Agent Orchestrator** (Main Coordinator)

**Responsibilities:**
- Classify user intent into domains: workout, profile, social, system, general
- Load relevant context from memory stores
- Route to appropriate sub-agent
- Handle confirmations for destructive actions
- Manage conversation continuity

**Tools Available:**
- `classifyIntent` - Determines which domain (workout/profile/social/system)
- `loadContext` - Fetches relevant context from memory
- `routeToSubAgent` - Delegates to specialized agent
- `confirmAction` - Handles user confirmations
- `navigate` - Controls app navigation

**Context Management:**
```typescript
interface OrchestratorContext {
  conversationId: string;
  userId: string;
  currentDomain: 'workout' | 'profile' | 'social' | 'system' | 'general';
  navigationStack: string[]; // Track page history
  pendingConfirmation?: {
    action: string;
    params: any;
    prompt: string;
  };
  recentMessages: Message[]; // Last 10 messages for continuity
}
```

**Prompt Template:**
```
You are Gymzy's AI coordinator. Your job is to understand user intent and route to the right specialist.

DOMAINS:
- WORKOUT: Generating workouts, logging exercises, viewing workout history
- PROFILE: User info, fitness goals, personal stats
- SOCIAL: Feed, following, posts, discovery
- SYSTEM: Navigation, settings, preferences, privacy

When unsure, ask clarifying questions. Always maintain conversation context.
```

---

### 2. **Workout Sub-Agent** (Specialized)

**Tools Available:**
- `generateWorkout` (params: muscles, type, duration, equipment)
- `logWorkout` (params: workoutId, exercises, sets, reps)
- `viewWorkoutHistory` (params: limit, timeframe, muscleGroup)
- `getWorkoutDetails` (params: workoutId)
- `deleteWorkout` (params: workoutId) [requires confirmation]
- `getPersonalBests` (params: exercise?)
- `compareWorkouts` (params: workoutId1, workoutId2)

**Context Schema:**
```typescript
interface WorkoutAgentContext {
  userId: string;
  recentWorkouts: Workout[]; // Last 5 workouts
  activeWorkout?: Workout; // If currently logging
  fitnessGoals: string[];
  experienceLevel: string;
  equipment: string[];
  injuries: string[];
  personalBests: Record<string, number>;
}
```

**Prompt Template:**
```
You are Gymzy's workout specialist. You help users:
- Generate personalized workout plans
- Log and track workouts
- View history and progress
- Analyze performance

USER CONTEXT:
- Experience: {experienceLevel}
- Goals: {fitnessGoals}
- Equipment: {equipment}
- Injuries/Limitations: {injuries}

Be motivating, specific, and safety-conscious.
```

---

### 3. **Profile Sub-Agent**

**Tools:**
- `viewProfile` (params: userId?)
- `updateProfile` (params: displayName, bio, goals, etc.)
- `viewStats` (params: timeframe, metric)
- `getAchievements` (params: category?)
- `updateGoals` (params: goals[])

**Context:**
```typescript
interface ProfileAgentContext {
  userId: string;
  profile: UserProfile;
  stats: {
    totalWorkouts: number;
    totalVolume: number;
    streak: number;
    achievements: Achievement[];
  };
}
```

---

### 4. **Social Sub-Agent**

**Tools:**
- `viewFeed` (params: feedType, limit)
- `searchUsers` (params: query, limit)
- `followUser` (params: userId)
- `unfollowUser` (params: userId) [requires confirmation]
- `viewNotifications` (params: unreadOnly?)
- `discoverUsers` (params: filters)

---

### 5. **System Sub-Agent**

**Tools:**
- `navigate` (params: page, params)
- `updateSettings` (params: theme, units, notifications, etc.)
- `updatePrivacy` (params: visibility, sharing, etc.)
- `getHelp` (params: topic)
- `reportIssue` (params: description)

---

## Memory & State Management Strategy

### **Three-Tier Memory System**

#### 1. **Working Memory** (In-Session)
- **Storage:** Redis or in-memory (Node.js Map)
- **Lifetime:** Current conversation session
- **Contents:**
  - Recent message history (last 20 messages)
  - Current intent/domain
  - Pending actions awaiting confirmation
  - Navigation state

```typescript
interface WorkingMemory {
  sessionId: string;
  userId: string;
  messages: Message[];
  currentContext: OrchestratorContext;
  expiresAt: Date; // 30 min timeout
}
```

#### 2. **Short-Term Memory** (Recent Sessions)
- **Storage:** Firestore `agent_sessions` collection
- **Lifetime:** 7 days
- **Contents:**
  - Conversation summaries
  - User preferences mentioned in chat
  - Frequently used commands
  - Error patterns

```typescript
interface ShortTermMemory {
  userId: string;
  sessionSummaries: {
    date: Date;
    summary: string;
    intents: string[];
    outcomes: string[];
  }[];
  preferences: Record<string, any>;
  frequentCommands: string[];
}
```

#### 3. **Long-Term Memory** (Persistent)
- **Storage:** Firestore (existing collections)
- **Lifetime:** Forever
- **Contents:**
  - User profile and preferences
  - Workout history
  - Personal records
  - Settings and privacy preferences

**Context Loading Strategy:**

```typescript
async function loadRelevantContext(
  userId: string,
  domain: string,
  intent: string
): Promise<AgentContext> {
  const context: any = {
    userId,
    domain,
    intent
  };

  // Always load user profile (lightweight)
  context.profile = await getProfile(userId);

  // Domain-specific context (lazy load)
  switch (domain) {
    case 'workout':
      context.recentWorkouts = await getRecentWorkouts(userId, 5);
      context.personalBests = await getPersonalBests(userId);
      context.activeWorkout = await getActiveWorkout(userId);
      break;

    case 'social':
      context.followingCount = await getFollowingCount(userId);
      context.unreadNotifications = await getUnreadCount(userId);
      break;

    case 'profile':
      context.stats = await getUserStats(userId);
      break;
  }

  return context;
}
```

---

## Test-Driven Development Strategy

### **Test Pyramid for AI Agents**

```
           ┌─────────────────┐
           │  E2E Scenarios  │  ← 10% (Full conversations)
           └────────┬────────┘
          ┌─────────▼──────────┐
          │  Agent Behaviors   │  ← 30% (Multi-turn interactions)
          └────────┬───────────┘
         ┌─────────▼──────────────┐
         │  Function Unit Tests   │  ← 60% (Individual tools)
         └────────────────────────┘
```

### **1. Function Unit Tests** (Traditional TDD)

Test each tool function independently with known inputs/outputs.

```typescript
// __tests__/agents/workout-functions.test.ts

describe('Workout Agent Functions', () => {
  describe('generateWorkout', () => {
    it('should generate chest workout with proper exercises', async () => {
      const result = await workoutFunctions.generateWorkout({
        targetMuscles: ['chest', 'triceps'],
        workoutType: 'hypertrophy',
        experience: 'intermediate',
        duration: 60
      }, 'user-123');

      expect(result.success).toBe(true);
      expect(result.workout.exercises.length).toBeGreaterThan(0);
      expect(result.workout.exercises.every(ex =>
        ex.targetMuscles.some(m => ['chest', 'triceps'].includes(m))
      )).toBe(true);
    });

    it('should handle invalid muscle groups gracefully', async () => {
      const result = await workoutFunctions.generateWorkout({
        targetMuscles: ['invalid-muscle']
      }, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No exercises found');
    });
  });

  describe('deleteWorkout', () => {
    it('should require confirmation for destructive action', async () => {
      const result = await workoutFunctions.deleteWorkout({
        workoutId: 'workout-123'
      }, 'user-123');

      expect(result.requiresConfirmation).toBe(true);
      expect(result.confirmationPrompt).toContain('Are you sure');
    });
  });
});
```

### **2. Agent Behavior Tests** (Behavioral TDD)

Test multi-turn conversation behaviors and intent understanding.

```typescript
// __tests__/agents/workout-agent-behavior.test.ts

describe('Workout Agent Behavior', () => {
  let agent: WorkoutSubAgent;

  beforeEach(() => {
    agent = new WorkoutSubAgent();
  });

  it('should handle vague workout request with intelligent defaults', async () => {
    const response = await agent.processMessage(
      'I want to work out',
      'user-123',
      { fitnessGoals: ['muscle_gain'], experienceLevel: 'beginner' }
    );

    // Should ask clarifying question or use intelligent defaults
    expect(
      response.message.includes('muscle') ||
      response.functionCalls?.some(fc => fc.name === 'generateWorkout')
    ).toBe(true);
  });

  it('should maintain context across multiple messages', async () => {
    // Turn 1: User mentions chest workout
    const response1 = await agent.processMessage(
      'I want to do chest today',
      'user-123',
      {}
    );

    // Turn 2: User mentions duration (should remember chest)
    const response2 = await agent.processMessage(
      'Make it 45 minutes',
      'user-123',
      {},
      response1.context // Pass context forward
    );

    expect(response2.functionCalls).toContainEqual(
      expect.objectContaining({
        name: 'generateWorkout',
        args: expect.objectContaining({
          targetMuscles: expect.arrayContaining(['chest']),
          duration: 45
        })
      })
    );
  });

  it('should proactively suggest navigation after providing data', async () => {
    const response = await agent.processMessage(
      'Show me my workout history',
      'user-123',
      {}
    );

    expect(response.functionCalls).toContainEqual(
      expect.objectContaining({ name: 'viewWorkoutHistory' })
    );
    expect(response.navigationTarget).toBe('/stats');
  });
});
```

### **3. End-to-End Scenario Tests** (Acceptance TDD)

Test complete user journeys.

```typescript
// __tests__/agents/e2e-scenarios.test.ts

describe('E2E Agent Scenarios', () => {
  it('should complete full workout generation flow via voice', async () => {
    const orchestrator = new AgentOrchestrator();

    // User: "I want to work out"
    const r1 = await orchestrator.processCommand(
      'I want to work out',
      'user-123'
    );
    expect(r1.success).toBe(true);

    // User: "Chest and back"
    const r2 = await orchestrator.processCommand(
      'Chest and back',
      'user-123',
      r1.conversationHistory
    );

    // User: "45 minutes"
    const r3 = await orchestrator.processCommand(
      '45 minutes',
      'user-123',
      r2.conversationHistory
    );

    // Should have generated workout
    expect(r3.functionCalls).toContainEqual(
      expect.objectContaining({
        name: 'generateWorkout',
        args: expect.objectContaining({
          targetMuscles: expect.arrayContaining(['chest', 'back']),
          duration: 45
        })
      })
    );

    // Should suggest starting workout
    expect(r3.navigationTarget).toMatch(/log-workout/);
  });

  it('should handle delete confirmation flow', async () => {
    const orchestrator = new AgentOrchestrator();

    // User: "Delete my last workout"
    const r1 = await orchestrator.processCommand(
      'Delete my last workout',
      'user-123'
    );

    expect(r1.requiresConfirmation).toBe(true);

    // User: "Yes, delete it"
    const r2 = await orchestrator.processCommand(
      'Yes, delete it',
      'user-123',
      r1.conversationHistory
    );

    expect(r2.success).toBe(true);
    expect(r2.message).toContain('deleted');
  });
});
```

### **Test Evaluation Criteria** (For Non-Deterministic Outputs)

Since AI outputs vary, use scoring rubrics instead of exact matches:

```typescript
interface AgentResponseQuality {
  relevance: number;      // 0-1: Did it understand intent?
  completeness: number;   // 0-1: Did it provide all needed info?
  safety: number;         // 0-1: Did it ask for confirmation when needed?
  naturalness: number;    // 0-1: Is the language natural and friendly?
  accuracy: number;       // 0-1: Are function calls correct?
}

function evaluateResponse(
  response: AgentResponse,
  expectedBehavior: ExpectedBehavior
): AgentResponseQuality {
  return {
    relevance: checkIntentMatch(response, expectedBehavior.intent),
    completeness: checkInfoCompleteness(response, expectedBehavior.requiredInfo),
    safety: checkSafetyMeasures(response, expectedBehavior.destructive),
    naturalness: checkLanguageQuality(response.message),
    accuracy: checkFunctionCallAccuracy(response, expectedBehavior.expectedCalls)
  };
}

// Test passes if average score > 0.8
expect(evaluateResponse(response, expected).average()).toBeGreaterThan(0.8);
```

---

## Framework Selection

### **Recommended: Vercel AI SDK + Custom Orchestration**

**Why Vercel AI SDK:**
1. ✅ Native Next.js integration (already using Next.js)
2. ✅ Streaming support for real-time responses
3. ✅ Built-in tool calling with TypeScript types
4. ✅ Lightweight and performant
5. ✅ Active development and good docs

**Why NOT LangChain/LangGraph:**
1. ❌ Overkill for single-app agent (not multi-agent orchestration)
2. ❌ Python-centric (we're TypeScript/Next.js)
3. ❌ Heavier abstractions, steeper learning curve
4. ❌ More dependencies and complexity

**Hybrid Approach:**
- Use **Vercel AI SDK** for core agent runtime (generateText, streamText, tool calling)
- Build **custom orchestration** layer for routing and memory
- Keep it simple, maintainable, and aligned with existing Next.js codebase

---

## Implementation Phases

### **Phase 1: Foundation** (Week 1)
- [ ] Set up test infrastructure with Jest
- [ ] Create function unit tests for all tools
- [ ] Implement modular function registry (workout, profile, social, system)
- [ ] Build context loading utilities
- [ ] Create memory storage interfaces (Redis + Firestore)

**Deliverables:**
- All service functions callable as agent tools
- 100% test coverage on function layer
- Context loader with mocked data

### **Phase 2: Single Sub-Agent** (Week 2)
- [ ] Implement Workout Sub-Agent with Vercel AI SDK
- [ ] Write behavioral tests for workout agent
- [ ] Implement conversation memory
- [ ] Test multi-turn conversations
- [ ] Add confirmation flows

**Deliverables:**
- Fully functional workout agent
- Behavioral test suite passing
- E2E scenario: Generate workout via text

### **Phase 3: Orchestrator** (Week 3)
- [ ] Build agent orchestrator
- [ ] Implement intent classification
- [ ] Add routing logic to sub-agents
- [ ] Create profile + system sub-agents
- [ ] Test orchestrator routing

**Deliverables:**
- Orchestrator routing to correct agents
- 3 sub-agents operational (workout, profile, system)
- Context preservation across domains

### **Phase 4: Voice Integration** (Week 4)
- [ ] Integrate voice input component
- [ ] Add speech-to-text pipeline
- [ ] Test voice commands end-to-end
- [ ] Optimize latency (<500ms response time)
- [ ] Add visual feedback for voice status

**Deliverables:**
- Voice input working in chat interface
- E2E voice scenario tests passing
- Production-ready voice UX

### **Phase 5: Polish & Production** (Week 5)
- [ ] Add social sub-agent
- [ ] Implement error recovery
- [ ] Add usage analytics
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing

**Deliverables:**
- All sub-agents complete
- Production deployment
- Monitoring and analytics
- User documentation

---

## Success Metrics

### **Technical Metrics**
- ✅ 90%+ intent classification accuracy
- ✅ <2s average response time (text)
- ✅ <500ms voice input latency
- ✅ 95%+ function call success rate
- ✅ <5% token budget overruns

### **User Experience Metrics**
- ✅ 80%+ user commands understood on first try
- ✅ <3 turns to complete average task
- ✅ 0 false confirmations for non-destructive actions
- ✅ 100% confirmation for destructive actions
- ✅ Natural, friendly conversation tone

### **Testing Metrics**
- ✅ 100% unit test coverage on functions
- ✅ 80%+ behavioral test coverage
- ✅ 20+ E2E scenarios passing
- ✅ All tests passing with >0.8 quality score

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Context window overflow | High | High | Sub-agent architecture + summarization |
| Poor intent classification | Medium | High | TDD behavioral tests + intent examples |
| High API costs | Medium | Medium | Context caching, efficient prompts |
| Voice input browser support | Low | Medium | Graceful degradation, text fallback |
| Slow response times | Medium | High | Streaming, optimistic UI, caching |
| Security vulnerabilities | Low | Critical | Server-side validation, rate limiting |

---

## Open Questions

1. **Memory retention policy:** How long to keep conversation history? 7 days? 30 days?
2. **Multi-language support:** Start with English-only or multilingual from day 1?
3. **Offline mode:** Should voice work offline (on-device models)?
4. **Cost control:** Set hard limits on API usage per user?
5. **Privacy:** Store voice recordings? GDPR compliance?

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Prioritize features:** Which sub-agents are MVP?
3. **Set up test infrastructure:** Jest + mocks + fixtures
4. **Write first test:** Start with workout `generateWorkout` function
5. **Implement first passing test:** Build the function
6. **Iterate:** Red-Green-Refactor cycle

---

## Resources

- **Vercel AI SDK Docs:** https://sdk.vercel.ai/docs
- **LangGraph Patterns:** https://blog.langchain.com/building-langgraph/
- **AI Agent Memory:** https://medium.com/@bravekjh/memory-management-for-ai-agents
- **TDD with AI:** https://www.latent.space/p/anita-tdd
- **Gemini Function Calling:** https://ai.google.dev/docs/function_calling

---

**Document Status:** Draft v1.0
**Last Updated:** 2025-01-06
**Author:** Claude Code + User Collaboration
