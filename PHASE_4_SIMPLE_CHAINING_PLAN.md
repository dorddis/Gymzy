# Phase 4: Simple Chaining - Implementation Plan

**Status:** Planning
**Priority:** High (Phase 2 & 3 postponed)
**Estimated Effort:** 3-4 days

---

## Goal

Enable the Quick Action system to execute **multiple functions in sequence** for complex user requests.

### Example Use Cases:
- "Log a chest workout" → Navigate to log-workout + Pre-fill workout type
- "Show me my best squat and then go to stats" → Get PR + Navigate
- "View my last workout and copy it" → Fetch workout + Start new with template
- "Update my weight to 180 and show my profile" → Update profile + Navigate

---

## Current State (Phase 1)

✅ **Working:**
- Single function execution
- Natural language → function mapping
- 17 individual functions available
- Secure authentication
- Toast feedback

❌ **Limitations:**
- Only executes ONE function per command
- No multi-step workflows
- Cannot maintain context between steps
- No conditional logic

---

## Architecture Design

### Option 1: **Sequential Execution (Recommended for MVP)**

Simple approach: LLM returns **array of function calls**, execute them in order.

```typescript
// Current (Phase 1)
{
  "function": "viewStats",
  "args": {}
}

// New (Phase 4)
{
  "functions": [
    { "function": "getPersonalBests", "args": { "exerciseName": "squat" } },
    { "function": "navigateTo", "args": { "page": "stats" } }
  ]
}
```

**Pros:**
- Simple to implement
- No complex state management
- Uses existing function registry
- Easy to debug

**Cons:**
- No conditional logic
- No error recovery between steps
- All steps must complete

---

### Option 2: **LangGraph State Machine (Future)**

For Phase 5, implement full agentic orchestration with LangGraph.

**Defer this until:**
- Phase 4 shows clear need for conditional logic
- Users request complex multi-step reasoning
- Simple chaining proves insufficient

---

## Implementation Plan

### Step 1: Update API Route (30 minutes)

**File:** `src/app/api/quick-action/route.ts`

#### 1.1 Update LLM Prompt

```typescript
const prompt = `You are a fitness app AI assistant. Convert the user's natural language request into function calls.

Available functions:
${functionDescriptions}

User request: "${message}"

Rules:
1. Return ONE function for simple requests
2. Return MULTIPLE functions for complex requests (in execution order)
3. Extract parameters from the user's message
4. Use null for optional parameters
5. Return ONLY valid JSON, no markdown

Response format (single):
{
  "functions": [
    {"function": "functionName", "args": {...}}
  ]
}

Response format (multiple):
{
  "functions": [
    {"function": "firstFunction", "args": {...}},
    {"function": "secondFunction", "args": {...}}
  ]
}

Examples:

User: "Show my stats"
Response: {"functions": [{"function": "viewStats", "args": {}}]}

User: "What's my best squat and then go to stats"
Response: {
  "functions": [
    {"function": "getPersonalBests", "args": {"exerciseName": "squat"}},
    {"function": "navigateTo", "args": {"page": "stats"}}
  ]
}

User: "Log a chest workout"
Response: {
  "functions": [
    {"function": "navigateTo", "args": {"page": "log-workout"}},
    {"function": "logWorkout", "args": {"workoutType": "strength"}}
  ]
}

Now respond for: "${message}"`;
```

#### 1.2 Update Execution Logic

```typescript
// Parse LLM response
const response = JSON.parse(cleanedResponse);
const functionCalls = Array.isArray(response.functions)
  ? response.functions
  : [{ function: response.function, args: response.args }]; // Backward compatibility

// Execute all functions in sequence
const results = [];
let lastNavigationTarget = null;

for (const call of functionCalls) {
  // Validate function exists
  if (!allFunctions.includes(call.function)) {
    logger.warn('[QuickAction] Invalid function in chain', 'api', {
      function: call.function,
      step: results.length + 1
    });
    continue; // Skip invalid functions
  }

  // Execute function
  logger.info('[QuickAction] Executing step', 'api', {
    step: results.length + 1,
    total: functionCalls.length,
    function: call.function,
    args: call.args
  });

  const result = await functionRegistry.execute(
    call.function,
    call.args,
    userId
  );

  results.push({
    step: results.length + 1,
    function: call.function,
    success: result.success,
    message: result.message,
    navigationTarget: result.navigationTarget
  });

  // Track last navigation target
  if (result.navigationTarget) {
    lastNavigationTarget = result.navigationTarget;
  }

  // Stop on error (fail-fast)
  if (!result.success) {
    logger.error('[QuickAction] Step failed, stopping chain', 'api', {
      step: results.length,
      function: call.function,
      error: result.error
    });
    break;
  }
}

// Combine all messages
const combinedMessage = results
  .filter(r => r.message)
  .map((r, i) => `${i + 1}. ${r.message}`)
  .join('\n');

return NextResponse.json({
  success: true,
  message: combinedMessage || 'Actions completed successfully',
  navigationTarget: lastNavigationTarget,
  steps: results,
  data: results[results.length - 1] // Last result
});
```

---

### Step 2: Update Client Component (15 minutes)

**File:** `src/components/quick-action-button.tsx`

#### 2.1 Handle Multi-Step Results

```typescript
const result = await response.json();

if (!response.ok) {
  toast({
    title: 'Error',
    description: result.message || 'Failed to process your request',
    variant: 'destructive',
  });
  return;
}

// Check if multi-step
const isMultiStep = result.steps && result.steps.length > 1;

// Show success message (may be multi-line for multi-step)
toast({
  title: 'Success',
  description: result.message || 'Action completed',
  duration: isMultiStep ? 5000 : 3000, // Longer duration for multi-step
});

// Handle navigation (only use last navigationTarget)
if (result.navigationTarget) {
  // Small delay so user can see toast for multi-step
  if (isMultiStep) {
    setTimeout(() => {
      router.push(result.navigationTarget);
    }, 1000);
  } else {
    router.push(result.navigationTarget);
  }
}
```

---

### Step 3: Add Multi-Step Examples (5 minutes)

**File:** `src/components/quick-action-button.tsx`

Update the examples in the dialog:

```tsx
<div className="text-xs text-muted-foreground space-y-1">
  <p className="font-medium">Single Actions:</p>
  <ul className="list-disc list-inside space-y-0.5 ml-2">
    <li>Show my workout stats</li>
    <li>What is my best bench press?</li>
    <li>Go to my profile</li>
  </ul>

  <p className="font-medium mt-2">Multi-Step Actions:</p>
  <ul className="list-disc list-inside space-y-0.5 ml-2">
    <li>Show my best squat then go to stats</li>
    <li>Log a chest workout</li>
    <li>View my last workout and copy it</li>
  </ul>
</div>
```

---

### Step 4: Add Step-by-Step Visual Feedback (Optional, 30 minutes)

For better UX, show each step as it executes:

```tsx
const [executionSteps, setExecutionSteps] = useState<string[]>([]);

// During execution
const handleAction = async (e: React.FormEvent) => {
  // ... existing code

  setExecutionSteps([]); // Clear previous steps

  // Simulate step tracking (would need streaming API in reality)
  // For now, just show final steps after completion

  if (result.steps && result.steps.length > 1) {
    setExecutionSteps(result.steps.map(s => s.message || s.function));
  }
};

// In the dialog
{executionSteps.length > 0 && (
  <div className="text-xs bg-muted p-2 rounded space-y-1">
    <p className="font-medium">Steps executed:</p>
    {executionSteps.map((step, i) => (
      <div key={i} className="flex items-center gap-2">
        <Check className="w-3 h-3 text-green-600" />
        <span>{step}</span>
      </div>
    ))}
  </div>
)}
```

---

### Step 5: Error Recovery (20 minutes)

Add graceful error handling for failed steps:

```typescript
// In API route
if (!result.success) {
  // Don't completely fail - return partial success
  return NextResponse.json({
    success: false,
    message: `Completed ${results.length - 1} of ${functionCalls.length} steps. Last step failed: ${result.error}`,
    partialSuccess: true,
    completedSteps: results.length - 1,
    totalSteps: functionCalls.length,
    steps: results,
    navigationTarget: lastNavigationTarget // Still navigate if previous steps succeeded
  });
}
```

---

## Common Multi-Step Workflows

### Workflow 1: **Log Workout with Pre-fill**
```
User: "Log a chest workout"

Functions:
1. navigateTo({ page: 'log-workout' })
2. (Future: Pre-fill workout data via URL params)

Current limitation: Cannot pre-fill form fields yet
Solution: Add form pre-fill support in Phase 5
```

### Workflow 2: **Check PR then Navigate**
```
User: "Show my best squat and go to stats"

Functions:
1. getPersonalBests({ exerciseName: 'squat' })
2. navigateTo({ page: 'stats' })

Result: Shows toast with PR, then navigates to stats
```

### Workflow 3: **Profile Update + View**
```
User: "Update my weight to 180 and show my profile"

Functions:
1. updateProfile({ weight: 180 })
2. navigateTo({ page: 'profile' })

Result: Updates weight, navigates to profile to see change
```

### Workflow 4: **Multi-Data Fetch**
```
User: "Show me my stats and personal bests"

Functions:
1. viewStats({})
2. getPersonalBests({})

Result: Displays both in toast, navigates to stats
Note: Both messages combined in toast
```

---

## Testing Plan

### Test Cases:

1. **Simple Single Function** (backward compatibility)
   - Input: "Show my stats"
   - Expected: Same behavior as Phase 1

2. **Two-Step Navigation**
   - Input: "Show my best squat and go to stats"
   - Expected: Toast with PR, then navigate to stats

3. **Failed Step**
   - Input: "Show invalid data and go to profile"
   - Expected: Error toast, still navigates if first step failed gracefully

4. **Three+ Steps**
   - Input: "Show my best squat, bench press, and deadlift"
   - Expected: Multiple PRs in toast

5. **Invalid Function in Chain**
   - Input: "Delete everything and show stats"
   - Expected: Skip invalid function, continue with valid ones

---

## Success Criteria

Phase 4 is successful if:
- ✅ Backward compatible with Phase 1 (single functions still work)
- ✅ Can execute 2-3 functions in sequence
- ✅ Properly handles errors in chain
- ✅ Shows combined results in toast
- ✅ Navigates to last specified page
- ✅ Logs each step clearly
- ✅ Users can understand multi-step results

---

## Known Limitations

### What Phase 4 Will NOT Do:
- ❌ Conditional logic (if/else based on results)
- ❌ Loops or iteration
- ❌ Real-time step-by-step visualization (would need streaming)
- ❌ Pre-filling form fields (requires UI annotations)
- ❌ Waiting for user confirmation mid-workflow
- ❌ Dynamic function selection based on previous results

### Why These Are Deferred:
These require **Phase 5: LangGraph** with full state machine orchestration. Phase 4 is intentionally simple to prove the concept before adding complexity.

---

## Rollback Plan

If Phase 4 causes issues:
1. **Quick Rollback**: Revert to single function execution
2. **The prompt change is backward compatible** - can still return single function
3. **API still accepts old format**: `{function, args}` converted to `[{function, args}]`

---

## Timeline

**Day 1 (2 hours):**
- Update API route prompt
- Add sequential execution logic
- Test with simple 2-step commands

**Day 2 (2 hours):**
- Update client component
- Add multi-step examples
- Test error handling

**Day 3 (2 hours):**
- Add step visualization (optional)
- Comprehensive testing
- Documentation

**Day 4 (1 hour):**
- Bug fixes
- Final testing
- Commit & push

---

## Next Steps After Phase 4

If Phase 4 succeeds, consider:
1. **Phase 5: LangGraph** - Full agentic orchestration with conditional logic
2. **UI Annotations** - Make forms controllable by agents
3. **Streaming Responses** - Real-time step-by-step feedback
4. **Workflow Templates** - Pre-defined multi-step workflows

If Phase 4 shows limited usage:
- Focus on improving Phase 1 single-function accuracy
- Add more individual functions instead of chaining
- Consider voice input (Phase 2) instead

---

## Questions to Answer During Implementation

1. Should we wait between steps? (e.g., 500ms delay for UX)
2. How do we combine toast messages for 3+ steps?
3. Should failed steps stop execution or continue?
4. Do we need a maximum chain length? (suggest: 5 steps max)
5. Should we log each step to database for analytics?

---

## Resources

- Current Function Registry: `src/services/agents/function-registry.ts` (17 functions)
- Current API Route: `src/app/api/quick-action/route.ts`
- Current UI Component: `src/components/quick-action-button.tsx`
- Phase 1 Documentation: `PHASE_1_QUICK_ACTION_IMPLEMENTATION.md`
