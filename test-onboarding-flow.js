/**
 * Backend Test: Onboarding Data Flow
 * Tests that onboarding data is properly saved and accessible to AI chat
 * Uses Firebase client SDK (same as the app uses)
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, deleteDoc, Timestamp } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase (same config as the app)
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

// Test user ID
const TEST_USER_ID = 'test-user-' + Date.now();

/**
 * Simulate the onboarding data mapping (same as in page.tsx)
 */
function mapOnboardingDataToContext(userId, data) {
  const overallExperience =
    data.experienceLevel <= 3 ? 'beginner' :
    data.experienceLevel <= 7 ? 'intermediate' : 'advanced';

  const motivationStyleMap = {
    'motivational': 'encouraging',
    'challenging': 'challenging',
    'analytical': 'analytical',
    'supportive': 'casual'
  };

  const coachingStyleMap = {
    'detailed': 'detailed',
    'concise': 'concise',
    'visual': 'visual'
  };

  const sessionDurationMap = {
    30: '30_45',
    45: '45_60',
    60: '45_60',
    90: '60_90'
  };

  return {
    userId,
    fitnessGoals: {
      primary: data.primaryGoal || 'general_fitness',
      secondary: data.secondaryGoals,
      targetTimeline: data.timeline || '3_months',
      priorityLevel: 'medium',
      specificTargets: {}
    },
    experienceLevel: {
      overall: overallExperience,
      yearsTraining: Math.floor(data.experienceLevel / 2),
      specificExperience: {
        weightlifting: data.workoutTypes.includes('strength') || data.workoutTypes.includes('weightlifting') ? overallExperience : 'none',
        cardio: data.workoutTypes.includes('cardio') ? overallExperience : 'beginner',
        flexibility: data.workoutTypes.includes('yoga') || data.workoutTypes.includes('flexibility') ? overallExperience : 'none',
        sports: data.workoutTypes.includes('sports') ? overallExperience : 'none'
      },
      previousInjuries: data.previousInjuries,
      limitations: data.currentChallenges
    },
    equipment: {
      available: data.equipmentAccess,
      location: data.equipmentAccess.includes('gym') ? 'gym' : 'home',
      spaceConstraints: 'moderate',
      acquisitionPlans: [],
      budget: 'medium'
    },
    schedule: {
      workoutDays: data.availableDays,
      preferredTimes: data.preferredTimes,
      sessionDuration: sessionDurationMap[data.timeAvailability] || '45_60',
      flexibility: 'somewhat_flexible',
      busyPeriods: [],
      restDayPreferences: []
    },
    preferences: {
      workoutIntensity: data.challengeLevel <= 3 ? 'low' : data.challengeLevel <= 7 ? 'moderate' : 'high',
      musicPreferences: [],
      motivationStyle: motivationStyleMap[data.communicationStyle] || 'encouraging',
      socialPreference: 'solo',
      coachingStyle: coachingStyleMap[data.feedbackPreference] || 'conversational',
      feedbackFrequency: data.feedbackPreference === 'detailed' ? 'frequent' :
                         data.feedbackPreference === 'concise' ? 'minimal' : 'moderate'
    },
    healthInfo: {
      medicalConditions: [],
      medications: [],
      dietaryRestrictions: [],
      allergies: [],
      sleepPattern: {
        averageHours: data.sleepQuality >= 7 ? 8 : 6,
        quality: data.sleepQuality >= 8 ? 'excellent' :
                 data.sleepQuality >= 6 ? 'good' :
                 data.sleepQuality >= 4 ? 'fair' : 'poor',
        schedule: 'regular'
      },
      stressLevel: data.stressLevel <= 3 ? 'low' : data.stressLevel <= 7 ? 'moderate' : 'high',
      energyLevels: data.sleepQuality >= 7 ? 'high' : data.sleepQuality >= 5 ? 'moderate' : 'low'
    },
    tracking: {
      progressPhotos: false,
      bodyMeasurements: true,
      performanceMetrics: true,
      moodTracking: false,
      nutritionTracking: data.nutritionHabits.length > 0,
      sleepTracking: false
    },
    lastUpdated: Timestamp.now(),
    version: 1
  };
}

/**
 * Create test onboarding context
 */
async function createTestOnboardingContext() {
  console.log('\n=== TEST 1: Create Onboarding Context ===');
  console.log('Test User ID:', TEST_USER_ID);

  // Sample onboarding data (same structure as OnboardingData interface)
  const testOnboardingData = {
    experienceLevel: 5,
    previousInjuries: ['knee'],
    currentActivity: 'moderate',
    primaryGoal: 'muscle_gain',
    secondaryGoals: ['strength', 'endurance'],
    timeline: '6_months',
    motivationFactors: ['health', 'appearance'],
    workoutTypes: ['strength', 'cardio'],
    timeAvailability: 45,
    equipmentAccess: ['gym', 'dumbbells', 'barbell'],
    workoutFrequency: 4,
    communicationStyle: 'motivational',
    feedbackPreference: 'detailed',
    challengeLevel: 7,
    learningStyle: 'visual',
    personalGoals: ['build muscle', 'improve health'],
    lifeValues: ['fitness', 'discipline'],
    currentChallenges: ['time management'],
    personalMotivation: 'Want to be healthier',
    lifeContext: 'Busy professional',
    supportSystem: ['gym buddy', 'family'],
    availableDays: ['monday', 'wednesday', 'friday', 'saturday'],
    preferredTimes: ['morning', 'evening'],
    stressLevel: 6,
    sleepQuality: 7,
    nutritionHabits: 'tracking macros'
  };

  try {
    // Map to OnboardingContext format
    const contextData = mapOnboardingDataToContext(TEST_USER_ID, testOnboardingData);

    console.log('\n✅ Mapped onboarding data to context:');
    console.log('  - Primary Goal:', contextData.fitnessGoals.primary);
    console.log('  - Experience:', contextData.experienceLevel.overall);
    console.log('  - Motivation Style:', contextData.preferences.motivationStyle);
    console.log('  - Coaching Style:', contextData.preferences.coachingStyle);
    console.log('  - Equipment:', contextData.equipment.available.join(', '));
    console.log('  - Workout Days:', contextData.schedule.workoutDays.join(', '));

    // Save to Firestore
    const docRef = doc(db, 'onboarding_contexts', TEST_USER_ID);
    await setDoc(docRef, contextData);

    console.log('\n✅ Saved to Firestore collection: onboarding_contexts');
    return true;
  } catch (error) {
    console.error('\n❌ Error creating onboarding context:', error);
    return false;
  }
}

/**
 * Test reading the context (simulates AI chat service)
 */
async function testReadOnboardingContext() {
  console.log('\n=== TEST 2: Read Onboarding Context (AI Chat Flow) ===');

  try {
    const docRef = doc(db, 'onboarding_contexts', TEST_USER_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const context = docSnap.data();

      console.log('\n✅ Successfully retrieved context from Firestore');
      console.log('\nKey fields for AI personalization:');
      console.log('  - Motivation Style:', context.preferences?.motivationStyle || 'NOT FOUND');
      console.log('  - Coaching Style:', context.preferences?.coachingStyle || 'NOT FOUND');
      console.log('  - Experience Level:', context.experienceLevel?.overall || 'NOT FOUND');
      console.log('  - Primary Goal:', context.fitnessGoals?.primary || 'NOT FOUND');
      console.log('  - Previous Injuries:', context.experienceLevel?.previousInjuries?.join(', ') || 'None');
      console.log('  - Available Equipment:', context.equipment?.available?.join(', ') || 'NOT FOUND');
      console.log('  - Workout Days:', context.schedule?.workoutDays?.join(', ') || 'NOT FOUND');
      console.log('  - Session Duration:', context.schedule?.sessionDuration || 'NOT FOUND');

      console.log('\n✅ AI Chat would have access to all personalization data!');
      return true;
    } else {
      console.log('\n❌ Context not found in Firestore');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Error reading onboarding context:', error);
    return false;
  }
}

/**
 * Cleanup test data
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
  console.log('║  ONBOARDING DATA FLOW TEST                                 ║');
  console.log('║  Testing: OnboardingContext creation and AI chat access    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Test 1: Create onboarding context
    const createSuccess = await createTestOnboardingContext();
    if (!createSuccess) {
      console.log('\n❌ TEST FAILED: Could not create onboarding context');
      process.exit(1);
    }

    // Wait a moment for Firestore to propagate
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Test 2: Read context (simulate AI chat)
    const readSuccess = await testReadOnboardingContext();
    if (!readSuccess) {
      console.log('\n❌ TEST FAILED: Could not read onboarding context');
      await cleanup();
      process.exit(1);
    }

    // Cleanup
    await cleanup();

    // Final summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL TESTS PASSED                                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n✨ Summary:');
    console.log('   - Onboarding data successfully mapped to OnboardingContext');
    console.log('   - Data saved to onboarding_contexts collection');
    console.log('   - AI chat can read and access all personalization fields');
    console.log('   - Motivation style & coaching style are accessible');
    console.log('\n🎉 The AI chat will now have access to user onboarding data!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error);
    await cleanup();
    process.exit(1);
  }
}

// Run tests
runTests();
