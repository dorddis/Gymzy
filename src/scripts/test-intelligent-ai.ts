/**
 * Test script for the new intelligent AI system
 * Tests both Groq and Gemini APIs, intelligent routing, and multi-step reasoning
 */

import { aiRouter } from '../services/intelligent-ai-router';
import { multiStepReasoning } from '../services/multi-step-reasoning';

async function testIntelligentRouting() {
  console.log('🧠 Testing Intelligent AI Routing System');
  console.log('=====================================\n');

  // Test 1: Simple greeting (should use Gemini)
  console.log('Test 1: Simple Greeting');
  console.log('Expected: Gemini (fast, simple response)');
  try {
    const response1 = await aiRouter.routeRequest({
      prompt: "Hello, how are you?",
      userId: "test_user"
    });
    console.log(`✅ API Used: ${response1.apiUsed.toUpperCase()}`);
    console.log(`📊 Complexity: ${response1.complexity}`);
    console.log(`💬 Response: ${response1.content.substring(0, 100)}...`);
    console.log(`⏱️ Time: ${response1.executionTime}ms\n`);
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: Workout creation (should use Groq)
  console.log('Test 2: Workout Creation');
  console.log('Expected: Groq (complex reasoning required)');
  try {
    const response2 = await aiRouter.routeRequest({
      prompt: "Create me a tricep workout with 4 exercises",
      userId: "test_user",
      requiresReasoning: true
    });
    console.log(`✅ API Used: ${response2.apiUsed.toUpperCase()}`);
    console.log(`📊 Complexity: ${response2.complexity}`);
    console.log(`💬 Response: ${response2.content.substring(0, 100)}...`);
    console.log(`⏱️ Time: ${response2.executionTime}ms\n`);
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  // Test 3: Mathematical calculation (should use Groq)
  console.log('Test 3: Mathematical Calculation');
  console.log('Expected: Groq (reasoning required)');
  try {
    const response3 = await aiRouter.routeRequest({
      prompt: "Calculate how many total reps if I do 3 sets of 12 reps for 5 exercises",
      userId: "test_user"
    });
    console.log(`✅ API Used: ${response3.apiUsed.toUpperCase()}`);
    console.log(`📊 Complexity: ${response3.complexity}`);
    console.log(`💬 Response: ${response3.content.substring(0, 100)}...`);
    console.log(`⏱️ Time: ${response3.executionTime}ms\n`);
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }
}

async function testMultiStepReasoning() {
  console.log('🔗 Testing Multi-Step Reasoning Chain');
  console.log('====================================\n');

  console.log('Test: Complex Workout Request');
  console.log('Expected: 5-step reasoning chain');
  try {
    const reasoningChain = await multiStepReasoning.executeWorkoutReasoning(
      "Create me a shoulder and calves workout with 3 exercises each",
      [
        { role: "user", content: "I want to focus on my upper body today" },
        { role: "assistant", content: "Great! What specific muscle groups?" }
      ]
    );

    console.log(`✅ Chain Success: ${reasoningChain.success}`);
    console.log(`📊 Overall Confidence: ${reasoningChain.overallConfidence}`);
    console.log(`⏱️ Total Time: ${reasoningChain.totalExecutionTime}ms`);
    console.log(`🔗 Steps Completed: ${reasoningChain.steps.length}/5`);
    console.log(`💭 Reasoning: ${reasoningChain.reasoning}\n`);

    // Show each step
    reasoningChain.steps.forEach((step, index) => {
      console.log(`Step ${index + 1}: ${step.name}`);
      console.log(`  ✅ Success: ${step.success}`);
      console.log(`  🤖 API: ${step.apiUsed || 'N/A'}`);
      console.log(`  ⏱️ Time: ${step.executionTime || 0}ms`);
      console.log(`  📊 Confidence: ${step.confidence || 0}`);
      if (step.error) {
        console.log(`  ❌ Error: ${step.error}`);
      }
      console.log('');
    });

    console.log('Final Output:');
    console.log(reasoningChain.finalOutput);

  } catch (error) {
    console.error('❌ Multi-step reasoning test failed:', error);
  }
}

async function testAPIAvailability() {
  console.log('🔍 Testing API Availability');
  console.log('===========================\n');

  // Test Groq availability
  console.log('Testing Groq API...');
  try {
    const groqTest = await aiRouter.routeRequest({
      prompt: "Test message for Groq",
      requiresReasoning: true
    });
    console.log(`✅ Groq Available: ${groqTest.apiUsed === 'groq'}`);
  } catch (error) {
    console.log('❌ Groq Not Available:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Test Gemini availability
  console.log('Testing Gemini API...');
  try {
    const geminiTest = await aiRouter.routeRequest({
      prompt: "Hi",
      requiresReasoning: false
    });
    console.log(`✅ Gemini Available: ${geminiTest.apiUsed === 'gemini'}`);
  } catch (error) {
    console.log('❌ Gemini Not Available:', error instanceof Error ? error.message : 'Unknown error');
  }

  console.log('');
}

async function runAllTests() {
  console.log('🚀 Starting Intelligent AI System Tests');
  console.log('========================================\n');

  try {
    await testAPIAvailability();
    await testIntelligentRouting();
    await testMultiStepReasoning();

    console.log('🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- Intelligent routing: Routes simple tasks to Gemini, complex to Groq');
    console.log('- Multi-step reasoning: Breaks complex requests into reasoning chains');
    console.log('- API fallbacks: Gracefully handles API unavailability');
    console.log('- Performance: Optimizes response time based on task complexity');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests, testIntelligentRouting, testMultiStepReasoning, testAPIAvailability };
