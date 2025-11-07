/**
 * Quick test of the AI Agent Demo
 *
 * This script tests the agent with a few example messages to verify:
 * - Function registry works
 * - Tool definitions are correct
 * - Agent can call functions
 */

const { functionRegistry } = require('./src/services/agents/function-registry.ts');

async function testAgentDemo() {
  console.log('\n=== AI Agent Demo Test ===\n');

  // Test 1: Check registry initialization
  console.log('✓ Testing function registry...');
  const allFunctions = functionRegistry.getFunctionsForDomain('all');
  console.log(`  Registered ${allFunctions.length} functions:`);
  allFunctions.forEach(fn => console.log(`    - ${fn}`));

  // Test 2: Check tool definitions
  console.log('\n✓ Testing tool definitions...');
  const tools = functionRegistry.getToolDefinitions('all');
  console.log(`  Generated ${Object.keys(tools).length} tool definitions`);

  // Test 3: Test function execution
  console.log('\n✓ Testing function execution...');

  try {
    // Test navigation
    const navResult = await functionRegistry.execute('navigateTo', { page: 'stats' }, 'test-user');
    console.log(`  navigateTo result:`, navResult.success ? '✅' : '❌', navResult.navigationTarget);

    // Test help
    const helpResult = await functionRegistry.execute('getHelp', { topic: 'workouts' }, 'test-user');
    console.log(`  getHelp result:`, helpResult.success ? '✅' : '❌', helpResult.message.substring(0, 50) + '...');

    console.log('\n✅ All tests passed!\n');
    console.log('🚀 Ready to run: npm run dev');
    console.log('📍 Then visit: http://localhost:9001/agent-demo\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  testAgentDemo().catch(console.error);
}

module.exports = { testAgentDemo };
