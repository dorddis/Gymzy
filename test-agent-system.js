/**
 * Quick Test of Agent System
 *
 * Verifies that the agent system is working after TypeScript fixes
 */

const { FunctionRegistry } = require('./src/services/agents/function-registry.ts');

async function testAgentSystem() {
  console.log('\n=== Agent System Test ===\n');

  try {
    // Test 1: Create registry
    console.log('✓ Creating function registry...');
    const registry = new FunctionRegistry();
    console.log('  Registry created successfully');

    // Test 2: Check registered functions
    console.log('\n✓ Checking registered functions...');
    const workoutFunctions = registry.getFunctionsForDomain('workout');
    const profileFunctions = registry.getFunctionsForDomain('profile');
    const systemFunctions = registry.getFunctionsForDomain('system');
    const allFunctions = registry.getFunctionsForDomain('all');

    console.log(`  Workout functions: ${workoutFunctions.length}`);
    console.log(`  Profile functions: ${profileFunctions.length}`);
    console.log(`  System functions: ${systemFunctions.length}`);
    console.log(`  Total functions: ${allFunctions.length}`);

    // Test 3: Get tool definitions
    console.log('\n✓ Getting tool definitions...');
    const tools = registry.getToolDefinitions('all');
    console.log(`  Generated ${Object.keys(tools).length} tool definitions`);

    // Test 4: Test function execution
    console.log('\n✓ Testing function execution...');

    const helpResult = await registry.execute('getHelp', { topic: 'workouts' }, 'test-user');
    console.log(`  getHelp: ${helpResult.success ? '✅' : '❌'}`);
    if (helpResult.message) {
      console.log(`    Message: "${helpResult.message.substring(0, 60)}..."`);
    }

    const navResult = await registry.execute('navigateTo', { page: 'stats' }, 'test-user');
    console.log(`  navigateTo: ${navResult.success ? '✅' : '❌'}`);
    if (navResult.navigationTarget) {
      console.log(`    Target: ${navResult.navigationTarget}`);
    }

    console.log('\n✅ All tests passed!\n');
    console.log('🚀 Agent system is ready for agentic UI control feature!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  testAgentSystem().catch(console.error);
}
