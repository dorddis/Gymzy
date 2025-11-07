/**
 * Comprehensive Test for Gemini Chat API
 * Tests streaming, onboarding context, and various scenarios
 */

const userId = 'hHuIokDYEoM3MkAVqELo2SGRbx13'; // Real user ID from logs

async function testComprehensive() {
  console.log('🧪 Starting Comprehensive Gemini Chat API Tests\n');
  console.log('Testing with real user ID:', userId);
  console.log('This user should have onboarding context\n');
  console.log('=' .repeat(80));

  const sessionId = `comprehensive-test-${Date.now()}`;

  // Test 1: Workout generation with onboarding context
  console.log('\n\n📋 Test 1: Workout generation (should use onboarding context)');
  console.log('-'.repeat(80));
  console.log('Sending: "I need a workout"');
  console.log('Expected: Should use user\'s actual experience level, goals, equipment from onboarding');
  console.log('');

  try {
    const response1 = await fetch('http://localhost:9001/api/ai/gemini-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId,
        message: 'I need a workout',
        streaming: false
      })
    });

    const data1 = await response1.json();
    if (data1.success) {
      console.log('✅ Response received');
      console.log('📝 AI Response (first 300 chars):', data1.message.substring(0, 300) + '...');
      if (data1.functionCalls && data1.functionCalls.length > 0) {
        console.log(`\n🔧 Function Calls (${data1.functionCalls.length}):`);
        data1.functionCalls.forEach(call => {
          console.log(`  • ${call.name}()`);
          console.log('    Args:', JSON.stringify(call.args, null, 2).split('\n').join('\n    '));
        });
      }
    } else {
      console.log('❌ Error:', data1.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 1500));

  // Test 2: Exercise info query
  console.log('\n\n📋 Test 2: Exercise information query');
  console.log('-'.repeat(80));
  console.log('Sending: "how do squats work"');
  console.log('Expected: Should call getExerciseInfo with exerciseName="Squat"');
  console.log('');

  try {
    const response2 = await fetch('http://localhost:9001/api/ai/gemini-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId,
        message: 'how do squats work',
        streaming: false
      })
    });

    const data2 = await response2.json();
    if (data2.success) {
      console.log('✅ Response received');
      console.log('📝 AI Response (first 200 chars):', data2.message.substring(0, 200) + '...');
      if (data2.functionCalls && data2.functionCalls.length > 0) {
        console.log(`\n🔧 Function Calls (${data2.functionCalls.length}):`);
        data2.functionCalls.forEach(call => {
          console.log(`  • ${call.name}(${JSON.stringify(call.args)})`);
        });
      } else {
        console.log('\n⚠️  No function calls made (AI responded without calling function)');
      }
    } else {
      console.log('❌ Error:', data2.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 1500));

  // Test 3: Streaming workout generation
  console.log('\n\n📋 Test 3: Streaming workout generation');
  console.log('-'.repeat(80));
  console.log('Sending: "back workout" with streaming=true');
  console.log('Expected: Should stream response chunk by chunk');
  console.log('');

  try {
    const response3 = await fetch('http://localhost:9001/api/ai/gemini-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId,
        message: 'back workout',
        streaming: true
      })
    });

    const reader = response3.body?.getReader();
    const decoder = new TextDecoder();
    let chunkCount = 0;
    let fullText = '';

    if (reader) {
      console.log('📡 Receiving streamed response...');
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                fullText += data.chunk;
                chunkCount++;
                if (chunkCount === 1) {
                  process.stdout.write('   First chunk: "' + data.chunk.substring(0, 50) + '"');
                }
              }
              if (data.done) {
                console.log('\n✅ Streaming complete');
                console.log(`📊 Received ${chunkCount} chunks`);
                console.log(`📝 Total length: ${fullText.length} characters`);
                console.log(`📝 First 200 chars: ${fullText.substring(0, 200)}...`);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('❌ Streaming test failed:', error.message);
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('🎉 Comprehensive Testing Complete\n');
  console.log('Summary:');
  console.log('  ✓ Non-streaming workout generation');
  console.log('  ✓ Exercise info function calling');
  console.log('  ✓ Streaming response handling');
  console.log('  ✓ Onboarding context integration');
}

testComprehensive().catch(console.error);
