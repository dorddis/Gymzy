/**
 * Backend Test: Physical Stats Save/Load
 * Tests that physical stats are properly saved to and loaded from Firestore
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TEST_USER_ID = 'test-physical-stats-' + Date.now();

/**
 * Simulate OnboardingContextService.updatePhysicalStats()
 */
async function testSavePhysicalStats() {
  console.log('\n=== TEST 1: Save Physical Stats ===');
  console.log('Test User ID:', TEST_USER_ID);

  const testPhysicalStats = {
    age: 28,
    height: {
      value: 180,
      unit: 'cm'
    },
    weight: {
      value: 75,
      unit: 'kg'
    },
    gender: 'male',
    activityLevel: 'very_active',
    bmr: 1800,
    tdee: 2700
  };

  try {
    console.log('\n📊 Physical stats to save:');
    console.log('  - Age:', testPhysicalStats.age);
    console.log('  - Height:', testPhysicalStats.height.value, testPhysicalStats.height.unit);
    console.log('  - Weight:', testPhysicalStats.weight.value, testPhysicalStats.weight.unit);
    console.log('  - Gender:', testPhysicalStats.gender);
    console.log('  - Activity Level:', testPhysicalStats.activityLevel);
    console.log('  - BMR:', testPhysicalStats.bmr);
    console.log('  - TDEE:', testPhysicalStats.tdee);

    // First, create a base onboarding context (simulate initial onboarding)
    const baseContext = {
      userId: TEST_USER_ID,
      fitnessGoals: {
        primary: 'muscle_gain',
        secondary: ['strength'],
        targetTimeline: '6_months',
        priorityLevel: 'high',
        specificTargets: {}
      },
      experienceLevel: {
        overall: 'intermediate',
        yearsTraining: 2,
        specificExperience: {
          weightlifting: 'intermediate',
          cardio: 'beginner',
          flexibility: 'none',
          sports: 'none'
        },
        previousInjuries: [],
        limitations: []
      },
      equipment: {
        available: ['gym'],
        location: 'gym',
        spaceConstraints: 'moderate',
        acquisitionPlans: [],
        budget: 'medium'
      },
      schedule: {
        workoutDays: ['monday', 'wednesday', 'friday'],
        preferredTimes: ['morning'],
        sessionDuration: '45_60',
        flexibility: 'somewhat_flexible',
        busyPeriods: [],
        restDayPreferences: []
      },
      preferences: {
        workoutIntensity: 'high',
        musicPreferences: [],
        motivationStyle: 'challenging',
        socialPreference: 'solo',
        coachingStyle: 'detailed',
        feedbackFrequency: 'frequent'
      },
      healthInfo: {
        medicalConditions: [],
        medications: [],
        dietaryRestrictions: [],
        allergies: [],
        sleepPattern: {
          averageHours: 7,
          quality: 'good',
          schedule: 'regular'
        },
        stressLevel: 'moderate',
        energyLevels: 'high'
      },
      tracking: {
        progressPhotos: true,
        bodyMeasurements: true,
        performanceMetrics: true,
        moodTracking: false,
        nutritionTracking: true,
        sleepTracking: false
      },
      lastUpdated: Timestamp.now(),
      version: 1
    };

    const docRef = doc(db, 'onboarding_contexts', TEST_USER_ID);
    await setDoc(docRef, baseContext);
    console.log('\n✅ Created base onboarding context');

    // Now update with physical stats
    await updateDoc(docRef, {
      physicalStats: testPhysicalStats,
      lastUpdated: Timestamp.now(),
      version: 2
    });

    console.log('\n✅ Updated with physical stats');
    return testPhysicalStats;
  } catch (error) {
    console.error('\n❌ Error saving physical stats:', error);
    throw error;
  }
}

/**
 * Test loading physical stats
 */
async function testLoadPhysicalStats() {
  console.log('\n=== TEST 2: Load Physical Stats ===');

  try {
    const docRef = doc(db, 'onboarding_contexts', TEST_USER_ID);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('\n❌ Document not found');
      return null;
    }

    const context = docSnap.data();

    console.log('\n✅ Successfully loaded onboarding context');
    console.log('\nChecking physical stats field:');

    if (!context.physicalStats) {
      console.log('\n❌ physicalStats field is MISSING from context!');
      console.log('\nAvailable fields:', Object.keys(context));
      return null;
    }

    const stats = context.physicalStats;
    console.log('\n✅ physicalStats field EXISTS');
    console.log('\n📊 Loaded physical stats:');
    console.log('  - Age:', stats.age || 'MISSING');
    console.log('  - Height:', stats.height?.value || 'MISSING', stats.height?.unit || '');
    console.log('  - Weight:', stats.weight?.value || 'MISSING', stats.weight?.unit || '');
    console.log('  - Gender:', stats.gender || 'MISSING');
    console.log('  - Activity Level:', stats.activityLevel || 'MISSING');
    console.log('  - BMR:', stats.bmr || 'MISSING');
    console.log('  - TDEE:', stats.tdee || 'MISSING');

    return stats;
  } catch (error) {
    console.error('\n❌ Error loading physical stats:', error);
    throw error;
  }
}

/**
 * Test update operation (simulate settings page save)
 */
async function testUpdatePhysicalStats() {
  console.log('\n=== TEST 3: Update Physical Stats (Settings Page Simulation) ===');

  const updatedStats = {
    age: 29,  // Changed from 28
    height: {
      value: 180,
      unit: 'cm'
    },
    weight: {
      value: 77,  // Changed from 75
      unit: 'kg'
    },
    gender: 'male',
    activityLevel: 'extremely_active',  // Changed from very_active
    bmr: 1820,  // Recalculated
    tdee: 3458   // Recalculated
  };

  try {
    console.log('\n📝 Updating physical stats...');
    console.log('  - New Age:', updatedStats.age);
    console.log('  - New Weight:', updatedStats.weight.value, updatedStats.weight.unit);
    console.log('  - New Activity Level:', updatedStats.activityLevel);
    console.log('  - New TDEE:', updatedStats.tdee);

    const docRef = doc(db, 'onboarding_contexts', TEST_USER_ID);

    // Get current context
    const currentDoc = await getDoc(docRef);
    if (!currentDoc.exists()) {
      throw new Error('Context not found for update');
    }

    const currentContext = currentDoc.data();

    // Update with new physical stats
    await updateDoc(docRef, {
      physicalStats: updatedStats,
      lastUpdated: Timestamp.now(),
      version: currentContext.version + 1
    });

    console.log('\n✅ Physical stats updated successfully');
    return updatedStats;
  } catch (error) {
    console.error('\n❌ Error updating physical stats:', error);
    throw error;
  }
}

/**
 * Verify the update persisted
 */
async function verifyUpdate() {
  console.log('\n=== TEST 4: Verify Update Persisted ===');

  try {
    const docRef = doc(db, 'onboarding_contexts', TEST_USER_ID);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('\n❌ Document not found after update');
      return false;
    }

    const context = docSnap.data();
    const stats = context.physicalStats;

    if (!stats) {
      console.log('\n❌ Physical stats missing after update!');
      return false;
    }

    console.log('\n✅ Physical stats still present after update');
    console.log('\n📊 Current values:');
    console.log('  - Age:', stats.age, '(expected: 29)');
    console.log('  - Weight:', stats.weight.value, stats.weight.unit, '(expected: 77 kg)');
    console.log('  - Activity:', stats.activityLevel, '(expected: extremely_active)');
    console.log('  - TDEE:', stats.tdee, '(expected: 3458)');

    // Verify values
    const isCorrect = stats.age === 29 &&
                     stats.weight.value === 77 &&
                     stats.activityLevel === 'extremely_active' &&
                     stats.tdee === 3458;

    if (isCorrect) {
      console.log('\n✅ All values match expected results!');
    } else {
      console.log('\n⚠️  Some values do not match expected results');
    }

    return isCorrect;
  } catch (error) {
    console.error('\n❌ Error verifying update:', error);
    throw error;
  }
}

/**
 * Cleanup
 */
async function cleanup() {
  console.log('\n=== CLEANUP ===');
  try {
    const docRef = doc(db, 'onboarding_contexts', TEST_USER_ID);
    await deleteDoc(docRef);
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  PHYSICAL STATS SAVE/LOAD TEST                             ║');
  console.log('║  Testing: Physical stats persistence in OnboardingContext  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Save
    await testSavePhysicalStats();
    testsPassed++;

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Load
    const loadedStats = await testLoadPhysicalStats();
    if (loadedStats && loadedStats.age === 28) {
      testsPassed++;
    } else {
      testsFailed++;
      console.log('\n❌ TEST 2 FAILED: Loaded stats do not match saved stats');
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Update
    await testUpdatePhysicalStats();
    testsPassed++;

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Verify
    const verified = await verifyUpdate();
    if (verified) {
      testsPassed++;
    } else {
      testsFailed++;
      console.log('\n❌ TEST 4 FAILED: Update verification failed');
    }

    // Cleanup
    await cleanup();

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    if (testsFailed === 0) {
      console.log('║  ✅ ALL TESTS PASSED                                       ║');
    } else {
      console.log('║  ⚠️  SOME TESTS FAILED                                     ║');
    }
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);

    if (testsFailed === 0) {
      console.log('\n✨ Summary:');
      console.log('   - Physical stats can be saved to onboarding_contexts');
      console.log('   - Physical stats can be loaded from Firestore');
      console.log('   - Physical stats can be updated');
      console.log('   - Updates persist correctly');
      console.log('\n🎉 Physical stats save/load is working correctly!\n');
    } else {
      console.log('\n⚠️  There are issues with physical stats persistence.');
      console.log('    Check the test output above for details.\n');
    }

    process.exit(testsFailed === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error);
    await cleanup();
    process.exit(1);
  }
}

// Run tests
runTests();
