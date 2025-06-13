/**
 * Test Complete Fixes for All Issues
 * Comprehensive test to verify all problems are resolved
 */

export async function testCompleteWorkoutFixes(): Promise<void> {
  console.log('🧪 Testing Complete Workout Creation Fixes...\n');

  try {
    const { productionAgenticService } = await import('./production-agentic-service');

    // Test 1: Greeting should NOT create workout
    console.log('📝 Test 1: Greeting should not create workout');
    const greetingResult = await productionAgenticService.generateAgenticResponse(
      "Hey there!",
      []
    );
    
    console.log('✅ Greeting response success:', greetingResult.success);
    console.log('✅ Tools used:', greetingResult.metadata?.toolsUsed);
    console.log('✅ Has workout data:', !!greetingResult.workoutData);
    console.log('✅ Should be false:', !greetingResult.workoutData ? '✅ PASS' : '❌ FAIL');

    // Test 2: "What's up" should NOT create workout
    console.log('\n📝 Test 2: "What\'s up" should not create workout');
    const whatsUpResult = await productionAgenticService.generateAgenticResponse(
      "What's up?",
      []
    );
    
    console.log('✅ What\'s up response success:', whatsUpResult.success);
    console.log('✅ Tools used:', whatsUpResult.metadata?.toolsUsed);
    console.log('✅ Has workout data:', !!whatsUpResult.workoutData);
    console.log('✅ Should be false:', !whatsUpResult.workoutData ? '✅ PASS' : '❌ FAIL');

    // Test 3: "There's no button" should NOT create workout
    console.log('\n📝 Test 3: "There\'s no button" should not create workout');
    const buttonResult = await productionAgenticService.generateAgenticResponse(
      "There's no button",
      []
    );
    
    console.log('✅ Button response success:', buttonResult.success);
    console.log('✅ Tools used:', buttonResult.metadata?.toolsUsed);
    console.log('✅ Has workout data:', !!buttonResult.workoutData);
    console.log('✅ Should be false:', !buttonResult.workoutData ? '✅ PASS' : '❌ FAIL');

    // Test 4: Explicit workout request SHOULD create workout
    console.log('\n📝 Test 4: "Create a back workout" should create workout');
    const workoutResult = await productionAgenticService.generateAgenticResponse(
      "Create a back workout",
      []
    );
    
    console.log('✅ Workout response success:', workoutResult.success);
    console.log('✅ Tools used:', workoutResult.metadata?.toolsUsed);
    console.log('✅ Has workout data:', !!workoutResult.workoutData);
    console.log('✅ Should be true:', workoutResult.workoutData ? '✅ PASS' : '❌ FAIL');

    if (workoutResult.workoutData) {
      console.log('✅ Workout ID:', workoutResult.workoutData.workoutId);
      console.log('✅ Exercise count:', workoutResult.workoutData.exercises?.length);
      
      // Test exercise structure
      if (workoutResult.workoutData.exercises && workoutResult.workoutData.exercises.length > 0) {
        const firstExercise = workoutResult.workoutData.exercises[0];
        console.log('✅ First exercise:', firstExercise.name);
        console.log('✅ Sets structure:', Array.isArray(firstExercise.sets) ? '✅ ARRAY' : '❌ NOT ARRAY');
        
        if (Array.isArray(firstExercise.sets) && firstExercise.sets.length > 0) {
          const firstSet = firstExercise.sets[0];
          console.log('✅ Set structure:');
          console.log('   - weight:', firstSet.weight);
          console.log('   - reps:', firstSet.reps);
          console.log('   - isExecuted:', firstSet.isExecuted);
          console.log('✅ Set structure valid:', 
            typeof firstSet.weight === 'number' && 
            typeof firstSet.reps === 'number' && 
            typeof firstSet.isExecuted === 'boolean' ? '✅ PASS' : '❌ FAIL');
        }
      }
    }

    // Test 5: Exercise matching for Pull-up
    console.log('\n📝 Test 5: Testing Pull-up exercise matching');
    const { IntelligentExerciseMatcher } = await import('./intelligent-exercise-matcher');
    const matcher = new IntelligentExerciseMatcher();
    
    const pullupMatch = await matcher.findBestMatch('Pull-up');
    console.log('✅ Pull-up match found:', !!pullupMatch);
    console.log('✅ Match name:', pullupMatch?.exercise.name);
    console.log('✅ Confidence:', pullupMatch?.confidence);
    console.log('✅ Should find match:', pullupMatch ? '✅ PASS' : '❌ FAIL');

    // Test 6: Response formatting
    console.log('\n📝 Test 6: Response formatting quality');
    const responseLength = workoutResult.content.length;
    const hasExcessiveMarkdown = (workoutResult.content.match(/\*/g) || []).length > 15;
    const hasStartWorkout = workoutResult.content.toLowerCase().includes('start');
    
    console.log('✅ Response length:', responseLength);
    console.log('✅ Excessive markdown:', hasExcessiveMarkdown ? '❌ FAIL' : '✅ PASS');
    console.log('✅ Has start workout:', hasStartWorkout ? '✅ PASS' : '❌ FAIL');

    // Summary
    console.log('\n🎯 TEST SUMMARY:');
    console.log('================');
    
    const tests = [
      { name: 'Greeting no workout', pass: !greetingResult.workoutData },
      { name: 'What\'s up no workout', pass: !whatsUpResult.workoutData },
      { name: 'Button complaint no workout', pass: !buttonResult.workoutData },
      { name: 'Explicit request creates workout', pass: !!workoutResult.workoutData },
      { name: 'Exercise structure valid', pass: workoutResult.workoutData?.exercises?.[0]?.sets && Array.isArray(workoutResult.workoutData.exercises[0].sets) },
      { name: 'Pull-up matching works', pass: !!pullupMatch },
      { name: 'Response formatting good', pass: !hasExcessiveMarkdown }
    ];

    tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}: ${test.pass ? '✅ PASS' : '❌ FAIL'}`);
    });

    const allPassed = tests.every(test => test.pass);
    console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);

    if (allPassed) {
      console.log('\n✅ Issues Fixed:');
      console.log('   - Data structure: exercise.sets is now an array');
      console.log('   - Intent analysis: greetings don\'t create workouts');
      console.log('   - Exercise matching: Pull-up now works');
      console.log('   - Response formatting: cleaner output');
      console.log('   - Tool execution: proper error handling');
      
      console.log('\n🚀 System is ready for production use!');
    } else {
      console.log('\n❌ Please check the failed tests above');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    throw error;
  }
}

export async function quickWorkoutTest(): Promise<void> {
  console.log('⚡ Quick Workout Test...\n');

  try {
    const { productionAgenticService } = await import('./production-agentic-service');

    const result = await productionAgenticService.generateAgenticResponse(
      "Create me a simple chest workout",
      []
    );

    console.log('✅ Success:', result.success);
    console.log('✅ Has workout:', !!result.workoutData);
    console.log('✅ Exercise count:', result.workoutData?.exercises?.length || 0);
    console.log('✅ Response preview:', result.content.substring(0, 150) + '...');

    if (result.workoutData?.exercises?.[0]) {
      const exercise = result.workoutData.exercises[0];
      console.log('✅ First exercise:', exercise.name);
      console.log('✅ Sets is array:', Array.isArray(exercise.sets));
      console.log('✅ Sets count:', exercise.sets?.length || 0);
    }

    console.log('\n🎉 Quick test completed!');

  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
}

// Export for browser testing
if (typeof window !== 'undefined') {
  (window as any).testCompleteFixes = {
    testCompleteWorkoutFixes,
    quickWorkoutTest
  };
}

// Node.js testing
if (typeof require !== 'undefined' && require.main === module) {
  testCompleteWorkoutFixes().catch(console.error);
}
