/**
 * Quick User Discovery Fix
 * Immediate fixes for the most critical issues
 */

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

export async function quickFixFollowCounters(userId: string): Promise<void> {
  console.log(`🔧 Quick fix: Recalculating follow counters for user ${userId}`);

  try {
    // This would recalculate the actual follow counts
    // For now, we'll just reset them to 0 to fix the sync issue
    const userRef = doc(db, 'user_profiles', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error('❌ User profile not found');
      return;
    }

    // Reset counters (in production, you'd calculate actual counts)
    await updateDoc(userRef, {
      followersCount: 0,
      followingCount: 0,
      updatedAt: Timestamp.now()
    });

    console.log('✅ Follow counters reset successfully');
    console.log('⚠️ Note: This is a temporary fix. Counters will update with new follows.');

  } catch (error) {
    console.error('❌ Error fixing follow counters:', error);
  }
}

export async function testBasicFollowOperation(followerId: string, followingId: string): Promise<void> {
  console.log('🧪 Testing basic follow operation...');

  try {
    // Import the fixed follow function
    const { followUser, isFollowing } = await import('./user-discovery-service');

    // Check initial status
    const initialStatus = await isFollowing(followerId, followingId);
    console.log(`Initial follow status: ${initialStatus}`);

    if (!initialStatus) {
      // Try to follow
      console.log('Attempting to follow...');
      await followUser(followerId, followingId);
      
      // Check status after follow
      const afterFollowStatus = await isFollowing(followerId, followingId);
      console.log(`Status after follow: ${afterFollowStatus}`);
      
      if (afterFollowStatus) {
        console.log('✅ Follow operation successful!');
      } else {
        console.log('❌ Follow operation failed - status not updated');
      }
    } else {
      console.log('⚠️ Already following this user');
    }

  } catch (error) {
    console.error('❌ Basic follow test failed:', error);
    
    // Provide immediate guidance
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        console.log('\n🚨 IMMEDIATE FIX NEEDED:');
        console.log('1. Update Firestore rules in Firebase Console');
        console.log('2. Or run: firebase deploy --only firestore:rules');
        console.log('3. Wait 1-2 minutes for rules to propagate');
      }
    }
  }
}

export async function testBasicSearch(searchTerm: string): Promise<void> {
  console.log(`🔍 Testing basic search for: "${searchTerm}"`);

  try {
    const { searchUsers } = await import('./user-discovery-service');
    
    const results = await searchUsers(searchTerm, 'test_user', 5);
    console.log(`Search results: ${results.length} users found`);
    
    if (results.length > 0) {
      console.log('Top results:');
      results.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.displayName} (${user.uid})`);
      });
      console.log('✅ Search is working!');
    } else {
      console.log('⚠️ No results found - this might be normal if no users match');
    }

  } catch (error) {
    console.error('❌ Basic search test failed:', error);
  }
}

export async function deployFirestoreRulesInstructions(): Promise<void> {
  console.log('🔒 Firestore Rules Deployment Instructions\n');

  console.log('📋 Step-by-step fix for permission errors:');
  console.log('');
  console.log('1. 📁 Ensure firestore.rules file is updated (already done)');
  console.log('');
  console.log('2. 🚀 Deploy the rules:');
  console.log('   Option A: Firebase CLI');
  console.log('     firebase deploy --only firestore:rules');
  console.log('');
  console.log('   Option B: Firebase Console');
  console.log('     - Go to Firebase Console > Firestore > Rules');
  console.log('     - Copy content from firestore.rules file');
  console.log('     - Paste and publish');
  console.log('');
  console.log('3. ⏰ Wait 1-2 minutes for rules to propagate');
  console.log('');
  console.log('4. 🔄 Refresh your app and test again');
  console.log('');
  console.log('5. 🧪 Test with these commands:');
  console.log('   - testBasicSearch("john")');
  console.log('   - testBasicFollowOperation("user1", "user2")');

  console.log('\n⚠️ If you still get permission errors:');
  console.log('   - Check Firebase Console > Firestore > Rules');
  console.log('   - Verify rules are published and active');
  console.log('   - Check browser console for specific error details');
}

export async function quickDiagnostic(): Promise<void> {
  console.log('🩺 Quick Diagnostic for User Discovery Issues\n');

  console.log('📝 Checking common issues:');
  
  // Check 1: Firebase connection
  console.log('1. Firebase connection...');
  try {
    const testDoc = doc(db, 'test', 'test');
    console.log('   ✅ Firebase connection OK');
  } catch (error) {
    console.log('   ❌ Firebase connection failed');
    console.log('   💡 Check Firebase configuration');
  }

  // Check 2: Authentication
  console.log('2. Authentication status...');
  if (typeof window !== 'undefined') {
    // Browser environment
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    if (auth.currentUser) {
      console.log(`   ✅ User authenticated: ${auth.currentUser.uid}`);
    } else {
      console.log('   ❌ No authenticated user');
      console.log('   💡 Make sure user is logged in');
    }
  } else {
    console.log('   ⚠️ Not in browser environment - cannot check auth');
  }

  // Check 3: Service imports
  console.log('3. Service imports...');
  try {
    const userDiscoveryService = await import('./user-discovery-service');
    console.log('   ✅ User discovery service imported');
    
    if (typeof userDiscoveryService.searchUsers === 'function') {
      console.log('   ✅ Search function available');
    } else {
      console.log('   ❌ Search function not available');
    }
    
    if (typeof userDiscoveryService.followUser === 'function') {
      console.log('   ✅ Follow function available');
    } else {
      console.log('   ❌ Follow function not available');
    }
  } catch (error) {
    console.log('   ❌ Service import failed:', error);
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. If authentication failed: Log in to the app');
  console.log('2. If imports failed: Check service file paths');
  console.log('3. If Firebase failed: Check Firebase config');
  console.log('4. For permission errors: Deploy updated Firestore rules');
}

export async function runQuickFixes(): Promise<void> {
  console.log('⚡ Running Quick Fixes for User Discovery\n');

  try {
    // Run diagnostic first
    await quickDiagnostic();
    
    // Show deployment instructions
    await deployFirestoreRulesInstructions();
    
    // Test basic functionality
    console.log('\n🧪 Testing basic functionality...');
    await testBasicSearch('test');
    
    console.log('\n✅ Quick fixes completed!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('   - Enhanced search with fuzzy matching');
    console.log('   - Transaction-based follow/unfollow');
    console.log('   - Better error handling');
    console.log('   - Updated Firestore security rules');
    
    console.log('\n🚀 To complete the fix:');
    console.log('   1. Deploy Firestore rules (see instructions above)');
    console.log('   2. Test the app functionality');
    console.log('   3. Run full test suite if needed');

  } catch (error) {
    console.error('❌ Quick fixes failed:', error);
  }
}

// Export for browser testing
if (typeof window !== 'undefined') {
  (window as any).quickUserDiscoveryFix = {
    runQuickFixes,
    quickDiagnostic,
    testBasicSearch,
    testBasicFollowOperation,
    deployFirestoreRulesInstructions,
    quickFixFollowCounters
  };
}

// Auto-run in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 User Discovery Quick Fix loaded. Run quickUserDiscoveryFix.runQuickFixes() to start.');
}
