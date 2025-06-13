/**
 * Debug Workout Creation Issues
 * Quick test to verify the fixes for tool name mismatches
 */

import { productionAgenticService } from './production-agentic-service';

export async function debugWorkoutCreation(): Promise<void> {
  console.log('🔧 Debugging Workout Creation Issues...\n');

  const testCases = [
    "Create a simple chest workout",
    "Make me a back workout",
    "I want a leg workout",
    "Design a full body routine",
    "Build me a workout plan"
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: "${testCase}"`);
    console.log('=' + '='.repeat(50));

    try {
      const result = await productionAgenticService.generateAgenticResponse(
        testCase,
        [],
        (chunk) => process.stdout.write(chunk)
      );

      console.log('\n📊 Results:');
      console.log('✅ Success:', result.success);
      console.log('✅ Confidence:', result.confidence);
      console.log('✅ Tools used:', result.metadata?.toolsUsed);
      console.log('✅ Has workout data:', !!result.workoutData);
      console.log('✅ Execution time:', result.metadata?.executionTime, 'ms');
      
      if (result.workoutData) {
        console.log('✅ Workout exercises:', result.workoutData.exercises?.length || 0);
        console.log('✅ Workout ID:', result.workoutData.workoutId);
      }

      if (result.toolCalls && result.toolCalls.length > 0) {
        console.log('✅ Tool calls:');
        result.toolCalls.forEach((call, index) => {
          console.log(`   ${index + 1}. ${call.name} - Success: ${call.result ? 'Yes' : 'No'}`);
        });
      }

    } catch (error) {
      console.error('❌ Test failed:', error);
    }

    console.log('\n' + '-'.repeat(60));
  }

  console.log('\n🎉 Debug session complete!');
}

export async function testToolNameValidation(): Promise<void> {
  console.log('🔧 Testing Tool Name Validation...\n');

  // Import the service to access private methods (for testing)
  const { ProductionAgenticService } = await import('./production-agentic-service');
  
  // Create a test instance
  class TestableProductionAgenticService extends ProductionAgenticService {
    public testValidateAndCorrectToolNames(tools: string[]): string[] {
      return (this as any).validateAndCorrectToolNames(tools);
    }
  }

  const testService = new TestableProductionAgenticService();

  const testCases = [
    ['workout_generator'], // Should become 'create_workout'
    ['generate_workout'], // Should become 'create_workout'
    ['exercise_finder'], // Should become 'search_exercises'
    ['create_workout'], // Should stay the same
    ['invalid_tool'], // Should be filtered out
    ['workout_generator', 'exercise_finder'], // Multiple corrections
  ];

  testCases.forEach((tools, index) => {
    console.log(`\n🧪 Test ${index + 1}: ${JSON.stringify(tools)}`);
    const corrected = testService.testValidateAndCorrectToolNames(tools);
    console.log(`✅ Corrected: ${JSON.stringify(corrected)}`);
  });

  console.log('\n🎉 Tool name validation tests complete!');
}

export async function testIntentAnalysis(): Promise<void> {
  console.log('🔧 Testing Intent Analysis...\n');

  const testInputs = [
    "Create a chest workout",
    "Make me a workout",
    "I want to exercise",
    "Find push-up exercises",
    "How are you today?",
    "What's the weather like?"
  ];

  for (const input of testInputs) {
    console.log(`\n🧪 Testing intent for: "${input}"`);
    
    try {
      // We'll test this by calling the service and seeing what tools it tries to use
      const result = await productionAgenticService.generateAgenticResponse(
        input,
        []
      );

      console.log('✅ Tools attempted:', result.metadata?.toolsUsed);
      console.log('✅ Success:', result.success);
      console.log('✅ Confidence:', result.confidence);

    } catch (error) {
      console.error('❌ Intent analysis failed:', error);
    }
  }

  console.log('\n🎉 Intent analysis tests complete!');
}

export async function runAllDebugTests(): Promise<void> {
  console.log('🚀 Running All Debug Tests...\n');

  try {
    await testToolNameValidation();
    await testIntentAnalysis();
    await debugWorkoutCreation();
    
    console.log('\n🎉🎉🎉 ALL DEBUG TESTS COMPLETED! 🎉🎉🎉');
  } catch (error) {
    console.error('\n❌❌❌ DEBUG TESTS FAILED:', error);
  }
}

// Export for browser testing
if (typeof window !== 'undefined') {
  (window as any).debugWorkoutCreation = {
    runAllDebugTests,
    debugWorkoutCreation,
    testToolNameValidation,
    testIntentAnalysis
  };
}

// Node.js testing
if (typeof require !== 'undefined' && require.main === module) {
  runAllDebugTests().catch(console.error);
}
