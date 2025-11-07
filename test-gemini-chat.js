/**
 * Test Script for Gemini Chat API
 * Tests onboarding context integration and function calling
 */

const userId = 'test-user-123';

// Test cases
const testCases = [
  {
    name: 'Test 1: Simple leg workout request',
    message: 'I need a leg workout',
    expectedBehavior: 'Should immediately call generateWorkout with targetMuscles=["quadriceps","hamstrings","glutes","calves"]'
  },
  {
    name: 'Test 2: Chest workout with details',
    message: 'chest workout, 30 minutes, beginner',
    expectedBehavior: 'Should call generateWorkout with chest muscles, 30min duration, beginner experience'
  },
  {
    name: 'Test 3: Upper body request',
    message: 'give me an upper body workout',
    expectedBehavior: 'Should call generateWorkout with upper body muscles'
  },
  {
    name: 'Test 4: Conversational follow-up',
    message: 'make it more advanced',
    expectedBehavior: 'Should reference previous workout and adjust difficulty'
  },
  {
    name: 'Test 5: Exercise info request',
    message: 'tell me about bench press',
    expectedBehavior: 'Should call getExerciseInfo with exerciseName="Bench Press"'
  }
];

async function testGeminiChat() {
  console.log('🧪 Starting Gemini Chat API Tests\n');
  console.log('Using userId:', userId);
  console.log('API endpoint: http://localhost:9001/api/ai/gemini-chat\n');
  console.log('=' .repeat(80));

  const sessionId = `test-session-${Date.now()}`;

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`\n\n📋 ${test.name}`);
    console.log('Expected:', test.expectedBehavior);
    console.log('-'.repeat(80));
    console.log('Sending message:', test.message);
    console.log('');

    try {
      const response = await fetch('http://localhost:9001/api/ai/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          message: test.message,
          streaming: false
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Response received');
        console.log('📝 AI Response:', data.message.substring(0, 200) + (data.message.length > 200 ? '...' : ''));

        if (data.functionCalls && data.functionCalls.length > 0) {
          console.log(`\n🔧 Function Calls (${data.functionCalls.length}):`);
          data.functionCalls.forEach((call, idx) => {
            console.log(`  ${idx + 1}. ${call.name}()`);
            console.log('     Args:', JSON.stringify(call.args, null, 2).split('\n').join('\n     '));
          });
        } else {
          console.log('\n⚠️  No function calls made');
        }
      } else {
        console.log('❌ Error:', data.error);
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }

    // Wait between tests
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('🎉 Testing Complete\n');
}

testGeminiChat().catch(console.error);
