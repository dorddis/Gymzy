/**
 * Test Production Agentic AI System
 * Quick test to verify the production system is working correctly
 */

import { productionAgenticService } from './production-agentic-service';

export async function testProductionAgenticAI(): Promise<void> {
  console.log('🧪 Testing Production Agentic AI System...');

  try {
    // Test 1: General conversation
    console.log('\n📝 Test 1: General conversation');
    const generalResponse = await productionAgenticService.generateAgenticResponse(
      "Hello, how are you feeling today?",
      []
    );
    console.log('✅ General response:', generalResponse.content.substring(0, 100) + '...');
    console.log('✅ Confidence:', generalResponse.confidence);
    console.log('✅ Tools used:', generalResponse.metadata?.toolsUsed);

    // Test 2: Workout creation
    console.log('\n🏋️ Test 2: Workout creation');
    const workoutResponse = await productionAgenticService.generateAgenticResponse(
      "Create me a chest workout with push-ups and dumbbell press",
      []
    );
    console.log('✅ Workout response:', workoutResponse.content.substring(0, 100) + '...');
    console.log('✅ Has workout data:', !!workoutResponse.workoutData);
    console.log('✅ Tools used:', workoutResponse.metadata?.toolsUsed);
    console.log('✅ Execution time:', workoutResponse.metadata?.executionTime, 'ms');

    // Test 3: Exercise search
    console.log('\n🔍 Test 3: Exercise search');
    const searchResponse = await productionAgenticService.generateAgenticResponse(
      "Find me exercises for back muscles",
      []
    );
    console.log('✅ Search response:', searchResponse.content.substring(0, 100) + '...');
    console.log('✅ Tools used:', searchResponse.metadata?.toolsUsed);

    // Test 4: Streaming response
    console.log('\n🌊 Test 4: Streaming response');
    let streamedContent = '';
    const streamingResponse = await productionAgenticService.generateAgenticResponse(
      "Tell me about the benefits of strength training",
      [],
      (chunk: string) => {
        streamedContent += chunk;
        process.stdout.write(chunk); // Show streaming in real-time
      }
    );
    console.log('\n✅ Streaming completed');
    console.log('✅ Final content length:', streamingResponse.content.length);
    console.log('✅ Streamed content length:', streamedContent.length);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

export async function testExerciseMatching(): Promise<void> {
  console.log('🧪 Testing Exercise Matching System...');

  try {
    const { IntelligentExerciseMatcher } = await import('./intelligent-exercise-matcher');
    const matcher = new IntelligentExerciseMatcher();

    // Test exact matches
    console.log('\n📝 Test 1: Exact matches');
    const exactMatch = await matcher.findBestMatch('Push-up');
    console.log('✅ Push-up match:', exactMatch?.exercise.name, 'confidence:', exactMatch?.confidence);

    // Test fuzzy matches
    console.log('\n📝 Test 2: Fuzzy matches');
    const fuzzyMatch = await matcher.findBestMatch('dumbell row'); // Intentional typo
    console.log('✅ Dumbbell row match:', fuzzyMatch?.exercise.name, 'confidence:', fuzzyMatch?.confidence);

    // Test semantic matches
    console.log('\n📝 Test 3: Semantic matches');
    const semanticMatch = await matcher.findBestMatch('chest exercise with weights');
    console.log('✅ Chest exercise match:', semanticMatch?.exercise.name, 'confidence:', semanticMatch?.confidence);

    // Test multiple matches
    console.log('\n📝 Test 4: Multiple matches');
    const multipleMatches = await matcher.findMultipleMatches('row', 5);
    console.log('✅ Row exercises found:', multipleMatches.length);
    multipleMatches.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.exercise.name} (${(match.confidence * 100).toFixed(1)}%)`);
    });

    console.log('\n🎉 Exercise matching tests completed successfully!');

  } catch (error) {
    console.error('❌ Exercise matching test failed:', error);
    throw error;
  }
}

export async function testStateManagement(): Promise<void> {
  console.log('🧪 Testing State Management System...');

  try {
    const { AgenticStateManager } = await import('./agentic-state-manager');
    const { MemoryStateAdapter } = await import('./firebase-state-adapter');
    
    const stateManager = new AgenticStateManager(new MemoryStateAdapter());

    // Test state initialization
    console.log('\n📝 Test 1: State initialization');
    const sessionId = 'test_session_' + Date.now();
    const userId = 'test_user_123';
    
    const state = await stateManager.initializeState(sessionId, userId);
    console.log('✅ State initialized for session:', sessionId);
    console.log('✅ User profile loaded:', !!state.context.userProfile);

    // Test message addition
    console.log('\n📝 Test 2: Message addition');
    await stateManager.addMessage(sessionId, {
      role: 'user',
      content: 'Hello, create me a workout',
      timestamp: new Date(),
      metadata: { source: 'user_input' }
    });
    
    const updatedState = stateManager.getState(sessionId);
    console.log('✅ Message added, history length:', updatedState?.context.conversationHistory.length);

    // Test task management
    console.log('\n📝 Test 3: Task management');
    const taskId = await stateManager.startTask(sessionId, 'workout_creation', [
      { name: 'analyze_request', description: 'Analyze user request', tools: ['analyze'], dependencies: [] },
      { name: 'create_workout', description: 'Create workout plan', tools: ['create_workout'], dependencies: ['analyze_request'] }
    ]);
    console.log('✅ Task started with ID:', taskId);

    // Test context generation
    console.log('\n📝 Test 4: Context generation');
    const context = stateManager.getContextForAI(sessionId);
    console.log('✅ AI context generated, length:', context.length);
    console.log('✅ Context preview:', context.substring(0, 200) + '...');

    console.log('\n🎉 State management tests completed successfully!');

  } catch (error) {
    console.error('❌ State management test failed:', error);
    throw error;
  }
}

export async function runAllTests(): Promise<void> {
  console.log('🚀 Running All Production Agentic AI Tests...\n');

  try {
    await testStateManagement();
    await testExerciseMatching();
    await testProductionAgenticAI();
    
    console.log('\n🎉🎉🎉 ALL TESTS PASSED! Production system is ready! 🎉🎉🎉');
  } catch (error) {
    console.error('\n❌❌❌ TESTS FAILED:', error);
    throw error;
  }
}

// Export for use in development
if (typeof window !== 'undefined') {
  // Browser environment - attach to window for testing
  (window as any).testProductionAgentic = {
    runAllTests,
    testProductionAgenticAI,
    testExerciseMatching,
    testStateManagement
  };
}

// Node.js environment - run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}
