/**
 * Test Script: Verify Workout Data Extraction
 * Tests that workoutData is properly returned for the "Start Workout" button
 */

const userId = 'test-user-123';
const sessionId = `workout-button-test-${Date.now()}`;

async function testWorkoutDataExtraction() {
  console.log('🧪 Testing Workout Data Extraction for Start Workout Button\n');
  console.log('Testing with sessionId:', sessionId);
  console.log('API endpoint: http://localhost:9001/api/ai/gemini-chat\n');
  console.log('=' .repeat(80));

  // Test 1: Non-streaming workout generation
  console.log('\n\n📋 Test 1: Non-Streaming Workout Generation');
  console.log('-'.repeat(80));
  console.log('Request: "I need a leg workout" (streaming: false)');
  console.log('Expected: Response should include workoutData with exercises array\n');

  try {
    const response = await fetch('http://localhost:9001/api/ai/gemini-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId,
        message: 'I need a leg workout',
        streaming: false
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ API Response received');

      if (data.workoutData) {
        console.log('✅ workoutData present in response');
        console.log('   Fields:', Object.keys(data.workoutData).join(', '));

        if (data.workoutData.exercises && Array.isArray(data.workoutData.exercises)) {
          console.log('✅ exercises array present');
          console.log(`   Exercise count: ${data.workoutData.exercises.length}`);

          if (data.workoutData.exercises.length > 0) {
            console.log('✅ Exercises populated');
            console.log('   First exercise:', data.workoutData.exercises[0].name);
            console.log('   Structure:', JSON.stringify(data.workoutData.exercises[0], null, 2).split('\n').join('\n   '));
          } else {
            console.log('❌ Exercises array is empty');
          }
        } else {
          console.log('❌ exercises array missing or not an array');
        }

        if (data.workoutData.workoutId) {
          console.log('✅ workoutId present:', data.workoutData.workoutId);
        } else {
          console.log('❌ workoutId missing');
        }

        if (data.workoutData.title) {
          console.log('✅ title present:', data.workoutData.title);
        }

        console.log('\n📦 Full workoutData structure:');
        console.log(JSON.stringify(data.workoutData, null, 2).split('\n').slice(0, 15).join('\n'));
      } else {
        console.log('❌ workoutData MISSING from response');
        console.log('   Response keys:', Object.keys(data).join(', '));
      }
    } else {
      console.log('❌ API Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Streaming workout generation
  console.log('\n\n📋 Test 2: Streaming Workout Generation');
  console.log('-'.repeat(80));
  console.log('Request: "chest workout" (streaming: true)');
  console.log('Expected: SSE stream should include workoutData event\n');

  try {
    const response = await fetch('http://localhost:9001/api/ai/gemini-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId + '-streaming',
        userId,
        message: 'chest workout',
        streaming: true
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let workoutDataReceived = false;
    let workoutData = null;

    if (reader) {
      console.log('📡 Reading SSE stream...');
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.workoutData) {
                workoutDataReceived = true;
                workoutData = data.workoutData;
                console.log('✅ workoutData event received!');
                console.log('   Exercise count:', data.workoutData.exercises?.length || 0);
              }

              if (data.done) {
                console.log('✅ Stream completed');
                break;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      if (workoutDataReceived) {
        console.log('✅ Workout data successfully streamed');
        console.log('   Title:', workoutData.title);
        console.log('   Exercises:', workoutData.exercises?.length || 0);
        console.log('   First exercise:', workoutData.exercises?.[0]?.name || 'N/A');
      } else {
        console.log('❌ workoutData event NOT received in stream');
      }
    }
  } catch (error) {
    console.log('❌ Streaming test failed:', error.message);
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('🎉 Test Complete\n');
  console.log('Summary:');
  console.log('  - Non-streaming workout data extraction');
  console.log('  - Streaming workout data event handling');
  console.log('\nIf both tests show ✅ for workoutData, the "Start Workout" button should now appear!');
}

testWorkoutDataExtraction().catch(console.error);
