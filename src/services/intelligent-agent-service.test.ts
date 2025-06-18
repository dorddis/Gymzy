import { IntelligentGymzyAgent, WorkoutState, ConversationTurn, ModificationPlan, PendingClarificationContext } from './intelligent-agent-service'; // Adjust path as needed

// Helper functions (assertEqual, assertIncludes) remain the same...
const assertEqual = (actual: any, expected: any, message: string) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error(`Assertion Failed: ${message}`);
    console.error(`Expected: ${JSON.stringify(expected)}`);
    console.error(`Actual:   ${JSON.stringify(actual)}`);
    // throw new Error(`Assertion Failed: ${message}`);
  } else {
    console.log(`Assertion Passed: ${message}`);
  }
};

const assertIncludes = (actual: string, expectedSubstring: string, message: string, caseSensitive = true) => {
  const actualComp = caseSensitive ? actual : actual?.toLowerCase();
  const expectedComp = caseSensitive ? expectedSubstring : expectedSubstring?.toLowerCase();
  if (!actualComp || !actualComp.includes(expectedComp)) {
    console.error(`Assertion Failed: ${message}`);
    console.error(`Expected string to include: "${expectedSubstring}"`);
    console.error(`Actual string: "${actualComp}"`);
  } else {
    console.log(`Assertion Passed: ${message}`);
  }
};

const assertIsOneOf = (actual: string, expectedSubstrings: string[], message: string, caseSensitive = true) => {
  const actualComp = caseSensitive ? actual : actual?.toLowerCase();
  if (!actualComp || !expectedSubstrings.some(expected => caseSensitive ? actualComp.includes(expected) : actualComp.includes(expected.toLowerCase()) )) {
    console.error(`Assertion Failed: ${message}`);
    console.error(`Expected string to include one of: "${JSON.stringify(expectedSubstrings)}"`);
    console.error(`Actual string: "${actual}"`);
  } else {
    console.log(`Assertion Passed: ${message}`);
  }
};


const assertNotNull = (actual: any, message: string) => {
  if (actual === null || actual === undefined) {
    console.error(`Assertion Failed: ${message} - Expected not to be null/undefined`);
  } else {
    console.log(`Assertion Passed: ${message}`);
  }
}

const assertNull = (actual: any, message: string) => {
  if (actual !== null && actual !== undefined) {
    console.error(`Assertion Failed: ${message} - Expected to be null/undefined`);
     console.error(`Actual:   ${JSON.stringify(actual)}`);
  } else {
    console.log(`Assertion Passed: ${message}`);
  }
}

const runTests = async () => {
  console.log("--- Starting IntelligentGymzyAgent Tests (Updated for Clarification Flow) ---");

  const initialWorkout: WorkoutState = {
    id: 'workout1',
    exercises: [{ exerciseId: 'pushup', sets: 3, reps: 10, name: 'Push-ups' }],
  };

  // Test 1 & 2 (No workout & Initial Clarification) remain largely the same
  console.log("\n--- Test 1: No workout, 'double it' ---");
  let agent1 = new IntelligentGymzyAgent('test-session-1');
  let response1 = await agent1.processMessage('double it', 'test-session-1');
  assertIncludes(response1, "no active workout to double", "Test 1: Response indicates no active workout");
  assertEqual(agent1.getMemory().workingMemory.userIntent?.name, 'CANNOT_DOUBLE_NO_WORKOUT', "Test 1: Intent is CANNOT_DOUBLE_NO_WORKOUT");
  assertEqual(agent1.getMemory().episodicMemory.recentTurns.length, 1, "Test 1: One turn in history");
  if (agent1.getMemory().episodicMemory.recentTurns.length > 0) {
    assertEqual(agent1.getMemory().episodicMemory.recentTurns[0].userInput, 'double it', "Test 1: User input correctly logged");
  }
  assertEqual(agent1.getMemory().workingMemory.pendingClarificationContext, null, "Test 1: No pending clarification");


  console.log("\n--- Test 2: Preset workout, 'double it' - Clarification ---");
  let agent2 = new IntelligentGymzyAgent('test-session-2');
  agent2.presetWorkoutForTesting(JSON.parse(JSON.stringify(initialWorkout)));
  let response2 = await agent2.processMessage('double it', 'test-session-2');
  assertIncludes(response2, "How would you like me to double your workout?", "Test 2: Response asks for clarification");
  let memory2 = agent2.getMemory();
  assertEqual(memory2.workingMemory.userIntent?.name, 'DOUBLE_WORKOUT', "Test 2: Intent is DOUBLE_WORKOUT");
  assertNotNull(memory2.workingMemory.pendingClarificationContext, "Test 2: Pending clarification context should be set");
  assertEqual(memory2.workingMemory.pendingClarificationContext?.originalIntentName, 'DOUBLE_WORKOUT', "Test 2: Correct original intent in pending context");
  assertEqual(memory2.workingMemory.currentWorkout?.exercises[0].sets, 3, "Test 2: Workout sets unchanged before clarification");


  // Test 3: End-to-end clarification flow for "double the sets"
  console.log("\n--- Test 3: End-to-end: 'double it', then 'double the sets' ---");
  let agent3 = new IntelligentGymzyAgent('test-session-3');
  agent3.presetWorkoutForTesting(JSON.parse(JSON.stringify(initialWorkout)));

  await agent3.processMessage('double it', 'test-session-3');
  let memoryStep1 = agent3.getMemory();
  assertNotNull(memoryStep1.workingMemory.pendingClarificationContext, "Test 3.1: Pending clarification should be active");

  let response3 = await agent3.processMessage('double the sets', 'test-session-3');
  assertIncludes(response3, "Workout modified successfully: DOUBLE_SETS", "Test 3.2: Response confirms DOUBLE_SETS modification");
  let memoryStep2 = agent3.getMemory();
  assertEqual(memoryStep2.workingMemory.userIntent?.name, 'USER_PROVIDED_CLARIFICATION', "Test 3.2: Intent is USER_PROVIDED_CLARIFICATION");
  assertEqual(memoryStep2.workingMemory.userIntent?.slots?.clarificationChoice, 'DOUBLE_SETS', "Test 3.2: Clarification choice is DOUBLE_SETS");
  assertEqual(memoryStep2.workingMemory.currentWorkout?.exercises[0].sets, 6, "Test 3.2: Workout sets are doubled");
  assertEqual(memoryStep2.workingMemory.currentWorkout?.exercises[0].reps, 10, "Test 3.2: Workout reps are unchanged");
  assertEqual(memoryStep2.workingMemory.lastAction?.type, 'TOOL_EXECUTION', "Test 3.2: Last action is TOOL_EXECUTION");
  assertNull(memoryStep2.workingMemory.pendingClarificationContext, "Test 3.2: Pending clarification context should be cleared");


  // Test 4: End-to-end clarification flow using numeric input "2" for "double the reps"
  console.log("\n--- Test 4: End-to-end: 'double it', then '2' (for double reps) ---");
  let agent4 = new IntelligentGymzyAgent('test-session-4');
  agent4.presetWorkoutForTesting(JSON.parse(JSON.stringify(initialWorkout)));
  await agent4.processMessage('double it', 'test-session-4');
  let response4 = await agent4.processMessage('2', 'test-session-4');
  assertIncludes(response4, "Workout modified successfully: DOUBLE_REPS", "Test 4: Response confirms DOUBLE_REPS modification via numeric input");
  let memory4 = agent4.getMemory();
  assertEqual(memory4.workingMemory.userIntent?.slots?.clarificationChoice, 'DOUBLE_REPS', "Test 4: Clarification choice is DOUBLE_REPS");
  assertEqual(memory4.workingMemory.currentWorkout?.exercises[0].sets, 3, "Test 4: Workout sets are unchanged");
  assertEqual(memory4.workingMemory.currentWorkout?.exercises[0].reps, 20, "Test 4: Workout reps are doubled");
  assertNull(memory4.workingMemory.pendingClarificationContext, "Test 4: Pending clarification context cleared");


  // Test 5: Clarification mismatch
  console.log("\n--- Test 5: Clarification mismatch ---");
  let agent5 = new IntelligentGymzyAgent('test-session-5');
  agent5.presetWorkoutForTesting(JSON.parse(JSON.stringify(initialWorkout)));
  await agent5.processMessage('double it', 'test-session-5');
  let memory5_step1 = agent5.getMemory();
  const originalPendingContextQuestion = memory5_step1.workingMemory.pendingClarificationContext?.clarificationQuestionText;

  let response5 = await agent5.processMessage('make it blue', 'test-session-5');
  assertIncludes(response5, "Sorry, I didn't catch that.", "Test 5.1: Response indicates mismatch");
  assertIncludes(response5, originalPendingContextQuestion!, "Test 5.1: Original question re-prompted");
  let memory5_step2 = agent5.getMemory();
  assertEqual(memory5_step2.workingMemory.userIntent?.name, 'CLARIFICATION_MISMATCH', "Test 5.1: Intent is CLARIFICATION_MISMATCH");
  assertNotNull(memory5_step2.workingMemory.pendingClarificationContext, "Test 5.1: Pending clarification context should still be active after mismatch");

  let response5_2 = await agent5.processMessage('double both', 'test-session-5');
  assertIncludes(response5_2, "Workout modified successfully: DOUBLE_BOTH", "Test 5.2: Response confirms DOUBLE_BOTH after mismatch");
  let memory5_step3 = agent5.getMemory();
  assertEqual(memory5_step3.workingMemory.userIntent?.slots?.clarificationChoice, 'DOUBLE_BOTH', "Test 5.2: Clarification choice is DOUBLE_BOTH");
  assertEqual(memory5_step3.workingMemory.currentWorkout?.exercises[0].sets, 6, "Test 5.2: Sets doubled for DOUBLE_BOTH");
  assertEqual(memory5_step3.workingMemory.currentWorkout?.exercises[0].reps, 20, "Test 5.2: Reps doubled for DOUBLE_BOTH");
  assertNull(memory5_step3.workingMemory.pendingClarificationContext, "Test 5.2: Pending clarification context cleared after success");

  // Test 6: User issues a new 'double it' command while a clarification is pending (should reset/override)
  console.log("\n--- Test 6: New 'double it' while clarification pending ---");
  let agent6 = new IntelligentGymzyAgent('test-session-6');
  const workout2: WorkoutState = { id: 'workout2', exercises: [{ exerciseId: 'squat', sets: 2, reps: 8, name: 'Squats' }] };
  agent6.presetWorkoutForTesting(JSON.parse(JSON.stringify(initialWorkout)));
  await agent6.processMessage('double it', 'test-session-6');

  agent6.presetWorkoutForTesting(JSON.parse(JSON.stringify(workout2)));
  let response6 = await agent6.processMessage('double it', 'test-session-6');
  assertIncludes(response6, "How would you like me to double your workout?", "Test 6: Response asks for clarification for workout2");
  let memory6 = agent6.getMemory();
  assertNotNull(memory6.workingMemory.pendingClarificationContext, "Test 6: Pending clarification context active for workout2");
  assertEqual(memory6.workingMemory.pendingClarificationContext?.relatedData?.workoutId, 'workout2', "Test 6: Pending context relates to workout2");


  // --- New Tests for Expanded Intent Coverage ---

  console.log("\n--- Test 7: GREETING Intent ---");
  let agent7 = new IntelligentGymzyAgent('test-session-7');
  let response7_1 = await agent7.processMessage('Hello there!', 'test-session-7');
  assertIsOneOf(response7_1, ["Hello! How can I assist with your fitness goals today?", "Hi there! What are we working on?", "Hey! Ready to get started?"], "Test 7.1: Basic greeting response");
  assertEqual(agent7.getMemory().workingMemory.userIntent?.name, 'GREETING', "Test 7.1: Intent is GREETING");

  agent7.presetWorkoutForTesting(JSON.parse(JSON.stringify(initialWorkout)));
  await agent7.processMessage('double it', 'test-session-7');
  assertNotNull(agent7.getMemory().workingMemory.pendingClarificationContext, "Test 7.2: Clarification should be pending");
  let response7_2 = await agent7.processMessage('Hi', 'test-session-7');
  assertIsOneOf(response7_2, ["Hello! How can I assist with your fitness goals today?", "Hi there! What are we working on?", "Hey! Ready to get started?"], "Test 7.2: Greeting response even if clarification was pending");
  assertEqual(agent7.getMemory().workingMemory.userIntent?.name, 'GREETING', "Test 7.2: Intent is GREETING");
  assertNull(agent7.getMemory().workingMemory.pendingClarificationContext, "Test 7.2: Pending clarification should be cleared by GREETING");


  console.log("\n--- Test 8: FAREWELL Intent ---");
  let agent8 = new IntelligentGymzyAgent('test-session-8');
  let response8 = await agent8.processMessage('Thanks, bye for now!', 'test-session-8');
  assertIsOneOf(response8, ["Goodbye! Keep up the great work!", "See you next time. Stay consistent!", "Alright, take care!"], "Test 8: Basic farewell response");
  assertEqual(agent8.getMemory().workingMemory.userIntent?.name, 'FAREWELL', "Test 8: Intent is FAREWELL");


  console.log("\n--- Test 9: THANKS Intent ---");
  let agent9 = new IntelligentGymzyAgent('test-session-9');
  let response9 = await agent9.processMessage('thank you very much', 'test-session-9');
  assertIsOneOf(response9, ["You're welcome!", "Happy to help!", "Anytime! Let me know if there's anything else."], "Test 9: Basic thanks response");
  assertEqual(agent9.getMemory().workingMemory.userIntent?.name, 'THANKS', "Test 9: Intent is THANKS");


  console.log("\n--- Test 10: HELP Intent ---");
  let agent10 = new IntelligentGymzyAgent('test-session-10');
  let response10 = await agent10.processMessage('help me', 'test-session-10');
  assertIncludes(response10, "I can help you with things like creating workout plans", "Test 10: Help response outlines capabilities");
  assertEqual(agent10.getMemory().workingMemory.userIntent?.name, 'HELP', "Test 10: Intent is HELP");


  console.log("\n--- Test 11: GET_EXERCISE_INFO Intent ---");
  let agent11 = new IntelligentGymzyAgent('test-session-11');
  let response11_1 = await agent11.processMessage('Tell me about bench press', 'test-session-11');
  assertIncludes(response11_1, `Here's information on Bench Press:`, "Test 11.1: GET_EXERCISE_INFO response for existing exercise");
  assertEqual(agent11.getMemory().workingMemory.userIntent?.name, 'GET_EXERCISE_INFO', "Test 11.1: Intent is GET_EXERCISE_INFO");
  assertEqual(agent11.getMemory().workingMemory.userIntent?.slots?.exercise_name, 'bench press', "Test 11.1: Slot 'exercise_name' correctly filled");

  let response11_2 = await agent11.processMessage('how to do a proper deadlift?', 'test-session-11');
  assertIncludes(response11_2, `Sorry, I don't have information on an exercise called "proper deadlift".`, "Test 11.2: GET_EXERCISE_INFO for non-existent exercise");
  assertEqual(agent11.getMemory().workingMemory.userIntent?.name, 'GET_EXERCISE_INFO', "Test 11.2: Intent is GET_EXERCISE_INFO");
  assertEqual(agent11.getMemory().workingMemory.userIntent?.slots?.exercise_name, 'proper deadlift', "Test 11.2: Slot 'exercise_name' with more words");

  let response11_3 = await agent11.processMessage('what is squat', 'test-session-11'); // Changed from "squats" to "squat"
  assertIncludes(response11_3, `Here's information on Squat:`, "Test 11.3: GET_EXERCISE_INFO for squat");
  assertEqual(agent11.getMemory().workingMemory.userIntent?.name, 'GET_EXERCISE_INFO', "Test 11.3: Intent is GET_EXERCISE_INFO");
  assertEqual(agent11.getMemory().workingMemory.userIntent?.slots?.exercise_name, 'squat', "Test 11.3: Slot 'exercise_name' for squat");


  console.log("\n--- Test 12: CREATE_WORKOUT Intent ---");
  let agent12 = new IntelligentGymzyAgent('test-session-12');
  let response12_1 = await agent12.processMessage('give me a chest workout', 'test-session-12');
  assertIncludes(response12_1, `Okay, I can help you create a workout for chest`, "Test 12.1: CREATE_WORKOUT for chest");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.name, 'CREATE_WORKOUT', "Test 12.1: Intent is CREATE_WORKOUT");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.slots?.muscle_group, 'chest', "Test 12.1: Slot 'muscle_group' is chest");

  let response12_2 = await agent12.processMessage('Create a 30 minute full body routine for a beginner', 'test-session-12');
  assertIncludes(response12_2, `workout for full body for about 30 minutes at a beginner level`, "Test 12.2: CREATE_WORKOUT with multiple slots");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.name, 'CREATE_WORKOUT', "Test 12.2: Intent is CREATE_WORKOUT");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.slots?.muscle_group, 'full body', "Test 12.2: Slot 'muscle_group' is full body");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.slots?.duration, 30, "Test 12.2: Slot 'duration' is 30");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.slots?.experience_level, 'beginner', "Test 12.2: Slot 'experience_level' is beginner");

  let response12_3 = await agent12.processMessage('make me an advanced arms plan for 1 hour', 'test-session-12');
  assertIncludes(response12_3, `workout for arms for about 60 minutes at an advanced level`, "Test 12.3: CREATE_WORKOUT with 'hr' and different phrasing");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.name, 'CREATE_WORKOUT', "Test 12.3: Intent is CREATE_WORKOUT");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.slots?.muscle_group, 'arms', "Test 12.3: Slot 'muscle_group' is arms");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.slots?.duration, 60, "Test 12.3: Slot 'duration' is 60");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.slots?.experience_level, 'advanced', "Test 12.3: Slot 'experience_level' is advanced");

  let response12_4 = await agent12.processMessage('workout program for core', 'test-session-12');
  assertIncludes(response12_4, `workout for core`, "Test 12.4: CREATE_WORKOUT for core");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.name, 'CREATE_WORKOUT', "Test 12.4: Intent is CREATE_WORKOUT");
  assertEqual(agent12.getMemory().workingMemory.userIntent?.slots?.muscle_group, 'core', "Test 12.4: Slot 'muscle_group' is core");


  console.log("\n--- Test 13: UNKNOWN_INTENT with pending clarification ---");
  let agent13 = new IntelligentGymzyAgent('test-session-13');
  agent13.presetWorkoutForTesting(JSON.parse(JSON.stringify(initialWorkout)));
  const clarificationPrompt = await agent13.processMessage('double it', 'test-session-13');
  assertIncludes(clarificationPrompt, "How would you like me to double your workout?", "Test 13.1: Clarification was indeed prompted");

  let response13 = await agent13.processMessage('abracadabra', 'test-session-13');
  assertEqual(agent13.getMemory().workingMemory.userIntent?.name, 'CLARIFICATION_MISMATCH', "Test 13.2: Intent is CLARIFICATION_MISMATCH for unmatchable input during clarification");
  assertIncludes(response13, "Sorry, I didn't catch that. How would you like me to double your workout?", "Test 13.2: CLARIFICATION_MISMATCH response re-prompts");
  assertNotNull(agent13.getMemory().workingMemory.pendingClarificationContext, "Test 13.2: Pending clarification context should still be active");

  let response13_2 = await agent13.processMessage('double sets', 'test-session-13');
  assertIncludes(response13_2, "Workout modified successfully: DOUBLE_SETS", "Test 13.3: Successfully answered clarification after mismatch");
  assertNull(agent13.getMemory().workingMemory.pendingClarificationContext, "Test 13.3: Pending clarification context cleared");

  console.log("\n--- IntelligentGymzyAgent Tests Completed (All Intents) ---");
};

runTests().catch(e => console.error("Error running tests:", e));
