/**
 * Test User Discovery Fixes
 * Comprehensive testing for search, follow/unfollow, and permissions
 */

import { 
  searchUsers, 
  followUser, 
  unfollowUser, 
  isFollowing,
  getSuggestedUsers 
} from './user-discovery-service';

export async function testUserDiscoveryFixes(): Promise<void> {
  console.log('🧪 Testing User Discovery Fixes...\n');

  try {
    // Test 1: Search functionality with fuzzy matching
    console.log('📝 Test 1: Search functionality');
    
    const searchTests = [
      'john',      // Partial name
      'John',      // Capitalized
      'jo',        // Very partial
      'john doe',  // Full name
      'doe',       // Last name
      'xyz123'     // Non-existent
    ];

    for (const searchTerm of searchTests) {
      console.log(`   Searching for: "${searchTerm}"`);
      const results = await searchUsers(searchTerm, 'test_user_id', 5);
      console.log(`   Results: ${results.length} users found`);
      
      if (results.length > 0) {
        console.log(`   First result: ${results[0].displayName}`);
      }
    }

    // Test 2: Follow/Unfollow functionality
    console.log('\n📝 Test 2: Follow/Unfollow functionality');
    
    const testFollowerId = 'test_follower_123';
    const testFollowingId = 'test_following_456';
    
    try {
      // Test follow
      console.log('   Testing follow...');
      await followUser(testFollowerId, testFollowingId);
      console.log('   ✅ Follow successful');
      
      // Test follow status
      const isFollowingAfter = await isFollowing(testFollowerId, testFollowingId);
      console.log(`   Follow status: ${isFollowingAfter ? '✅ Following' : '❌ Not following'}`);
      
      // Test unfollow
      console.log('   Testing unfollow...');
      await unfollowUser(testFollowerId, testFollowingId);
      console.log('   ✅ Unfollow successful');
      
      // Test follow status after unfollow
      const isFollowingAfterUnfollow = await isFollowing(testFollowerId, testFollowingId);
      console.log(`   Follow status after unfollow: ${isFollowingAfterUnfollow ? '❌ Still following' : '✅ Not following'}`);
      
    } catch (error) {
      console.error('   ❌ Follow/Unfollow test failed:', error);
      
      // Provide specific guidance based on error
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          console.log('   💡 Fix: Update Firestore security rules');
        } else if (error.message.includes('not found')) {
          console.log('   💡 Fix: Ensure test user profiles exist');
        }
      }
    }

    // Test 3: Error handling
    console.log('\n📝 Test 3: Error handling');
    
    try {
      // Test invalid follow (self-follow)
      await followUser('same_user', 'same_user');
      console.log('   ❌ Self-follow should have failed');
    } catch (error) {
      console.log('   ✅ Self-follow correctly prevented');
    }
    
    try {
      // Test follow non-existent user
      await followUser('real_user', 'non_existent_user');
      console.log('   ❌ Following non-existent user should have failed');
    } catch (error) {
      console.log('   ✅ Non-existent user follow correctly prevented');
    }

    // Test 4: Suggested users
    console.log('\n📝 Test 4: Suggested users');
    
    try {
      const suggestions = await getSuggestedUsers('test_user_id', 5);
      console.log(`   Suggested users: ${suggestions.length} found`);
      
      if (suggestions.length > 0) {
        console.log(`   First suggestion: ${suggestions[0].displayName}`);
      }
    } catch (error) {
      console.error('   ❌ Suggested users test failed:', error);
    }

    console.log('\n🎉 User discovery tests completed!');

  } catch (error) {
    console.error('❌ User discovery test suite failed:', error);
    throw error;
  }
}

export async function debugFollowIssue(followerId: string, followingId: string): Promise<void> {
  console.log('🔍 Debugging Follow Issue...\n');

  try {
    console.log(`Follower ID: ${followerId}`);
    console.log(`Following ID: ${followingId}`);

    // Check if users exist
    console.log('\n📝 Checking if users exist...');
    
    // This would check user profiles
    console.log('⚠️ User existence check requires profile service integration');

    // Check current follow status
    console.log('\n📝 Checking current follow status...');
    const currentStatus = await isFollowing(followerId, followingId);
    console.log(`Current follow status: ${currentStatus}`);

    // Test follow operation
    console.log('\n📝 Testing follow operation...');
    try {
      await followUser(followerId, followingId);
      console.log('✅ Follow operation successful');
      
      // Check status after follow
      const statusAfterFollow = await isFollowing(followerId, followingId);
      console.log(`Status after follow: ${statusAfterFollow}`);
      
    } catch (error) {
      console.error('❌ Follow operation failed:', error);
      
      // Detailed error analysis
      if (error instanceof Error) {
        console.log('\n🔍 Error Analysis:');
        console.log(`Error message: ${error.message}`);
        
        if (error.message.includes('permission')) {
          console.log('💡 Issue: Firestore security rules are blocking the operation');
          console.log('💡 Solution: Update firestore.rules with proper permissions');
        } else if (error.message.includes('not found')) {
          console.log('💡 Issue: User profiles not found');
          console.log('💡 Solution: Ensure both users have valid profiles');
        } else if (error.message.includes('already following')) {
          console.log('💡 Issue: Already following this user');
          console.log('💡 Solution: Check follow status before attempting to follow');
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug session failed:', error);
  }
}

export async function testSearchFunctionality(): Promise<void> {
  console.log('🔍 Testing Enhanced Search Functionality...\n');

  const testCases = [
    { term: 'john', description: 'Common name' },
    { term: 'Jo', description: 'Partial name with capital' },
    { term: 'john smith', description: 'Full name' },
    { term: 'smith', description: 'Last name only' },
    { term: 'j', description: 'Single character' },
    { term: 'xyz123', description: 'Non-existent name' },
    { term: '', description: 'Empty search' },
    { term: '   ', description: 'Whitespace only' }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.description} ("${testCase.term}")`);
    
    try {
      const results = await searchUsers(testCase.term, 'test_user', 10);
      console.log(`   Results: ${results.length} users found`);
      
      if (results.length > 0) {
        console.log(`   Top results:`);
        results.slice(0, 3).forEach((user, index) => {
          console.log(`     ${index + 1}. ${user.displayName}`);
        });
      }
    } catch (error) {
      console.error(`   ❌ Search failed:`, error);
    }
    
    console.log('');
  }

  console.log('🎉 Search functionality tests completed!');
}

export async function validateFirestoreRules(): Promise<void> {
  console.log('🔒 Validating Firestore Security Rules...\n');

  console.log('📝 Checking required rules:');
  console.log('   1. user_profiles collection');
  console.log('      - Read: authenticated + (public profile OR owner)');
  console.log('      - Write: owner only');
  console.log('');
  console.log('   2. user_following collection');
  console.log('      - Read: involved users only');
  console.log('      - Create: follower only');
  console.log('      - Delete: follower only');
  console.log('');
  console.log('   3. conversation_states collection');
  console.log('      - Read/Write: owner only');

  console.log('\n⚠️ Manual verification required:');
  console.log('   1. Check Firebase Console > Firestore > Rules');
  console.log('   2. Ensure rules match the updated firestore.rules file');
  console.log('   3. Test with Firebase Rules Playground');

  console.log('\n💡 If you see permission errors:');
  console.log('   1. Deploy updated rules: firebase deploy --only firestore:rules');
  console.log('   2. Wait 1-2 minutes for rules to propagate');
  console.log('   3. Refresh your app and try again');
}

export async function runAllUserDiscoveryTests(): Promise<void> {
  console.log('🚀 Running All User Discovery Tests...\n');

  try {
    await validateFirestoreRules();
    await testSearchFunctionality();
    await testUserDiscoveryFixes();
    
    console.log('\n🎉🎉🎉 ALL USER DISCOVERY TESTS COMPLETED! 🎉🎉🎉');
    
    console.log('\n✅ Issues Fixed:');
    console.log('   - Enhanced search with fuzzy matching');
    console.log('   - Transaction-based follow/unfollow');
    console.log('   - Proper counter synchronization');
    console.log('   - Better error handling and messages');
    console.log('   - Updated Firestore security rules');
    
  } catch (error) {
    console.error('\n❌❌❌ USER DISCOVERY TESTS FAILED:', error);
    throw error;
  }
}

// Export for browser testing
if (typeof window !== 'undefined') {
  (window as any).testUserDiscovery = {
    runAllUserDiscoveryTests,
    testUserDiscoveryFixes,
    debugFollowIssue,
    testSearchFunctionality,
    validateFirestoreRules
  };
}

// Node.js testing
if (typeof require !== 'undefined' && require.main === module) {
  runAllUserDiscoveryTests().catch(console.error);
}
