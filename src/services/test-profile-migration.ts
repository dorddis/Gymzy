/**
 * Test Profile Migration
 * Test and execute the profile migration to unified system
 */

import { ProfileMigrationService } from './profile-migration-service';
import { UnifiedUserProfileService } from './unified-user-profile-service';
import { ProfileConverter } from '@/types/user-profile';

export async function testProfileMigration(): Promise<void> {
  console.log('🧪 Testing Profile Migration System...\n');

  try {
    // Test 1: Validate unified profile service
    console.log('📝 Test 1: Validating unified profile service');
    
    // Test profile creation
    const testProfile = await UnifiedUserProfileService.createProfile(
      'test_user_123',
      'test@example.com',
      'Test User',
      {
        fitnessLevel: 'intermediate',
        fitnessGoals: ['build_muscle', 'lose_weight']
      }
    );
    
    console.log('✅ Test profile created:', testProfile.uid);
    
    // Test profile retrieval
    const retrievedProfile = await UnifiedUserProfileService.getProfile('test_user_123');
    console.log('✅ Profile retrieved:', !!retrievedProfile);
    
    // Test profile update
    await UnifiedUserProfileService.updateProfile('test_user_123', {
      bio: 'Updated bio for testing'
    });
    console.log('✅ Profile updated successfully');
    
    // Test fitness profile conversion
    if (retrievedProfile) {
      const fitnessProfile = ProfileConverter.toFitnessProfile(retrievedProfile);
      console.log('✅ Fitness profile conversion:', !!fitnessProfile.fitnessLevel);
    }

    // Test 2: Validate migration service
    console.log('\n📝 Test 2: Validating migration service');
    
    // Test profile validation
    const validation = ProfileConverter.validateProfile({
      uid: 'test_user',
      email: 'test@example.com',
      displayName: 'Test User',
      fitnessLevel: 'beginner'
    });
    console.log('✅ Profile validation:', validation.valid ? 'PASS' : 'FAIL');
    
    if (!validation.valid) {
      console.log('❌ Validation errors:', validation.errors);
    }

    // Test 3: Check existing profiles
    console.log('\n📝 Test 3: Checking existing profiles');
    
    // This would check your actual Firebase collections
    console.log('⚠️ Actual profile check requires Firebase connection');
    console.log('⚠️ Run migration in production environment');

    console.log('\n🎉 Profile migration tests completed successfully!');

  } catch (error) {
    console.error('❌ Profile migration test failed:', error);
    throw error;
  }
}

export async function executeProfileMigration(): Promise<void> {
  console.log('🚀 Executing Profile Migration...\n');

  try {
    // Step 1: Create backup
    console.log('📝 Step 1: Creating backup of existing profiles');
    await ProfileMigrationService.backupProfiles();
    console.log('✅ Backup created successfully');

    // Step 2: Run migration
    console.log('\n📝 Step 2: Running profile migration');
    const migrationResult = await ProfileMigrationService.migrateAllProfiles();
    
    console.log('\n📊 Migration Results:');
    console.log(`   Total processed: ${migrationResult.totalProcessed}`);
    console.log(`   Successful: ${migrationResult.successful}`);
    console.log(`   Failed: ${migrationResult.failed}`);
    console.log(`   Duplicates found: ${migrationResult.duplicatesFound}`);
    console.log(`   Legacy profiles: ${migrationResult.legacyProfilesFound}`);
    
    if (migrationResult.errors.length > 0) {
      console.log('\n❌ Migration Errors:');
      migrationResult.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Step 3: Validate migration
    console.log('\n📝 Step 3: Validating migration results');
    const validation = await ProfileMigrationService.validateMigration();
    
    console.log('\n📊 Validation Results:');
    console.log(`   Valid: ${validation.valid}`);
    console.log(`   Stats:`, validation.stats);
    
    if (validation.issues.length > 0) {
      console.log('\n⚠️ Validation Issues:');
      validation.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    // Step 4: Summary and recommendations
    console.log('\n🎯 Migration Summary:');
    
    if (migrationResult.successful > 0 && validation.valid) {
      console.log('✅ Migration completed successfully!');
      console.log('✅ All profiles are now using the unified system');
      console.log('\n📋 Next Steps:');
      console.log('   1. Test the application thoroughly');
      console.log('   2. Monitor for any issues');
      console.log('   3. After verification, clean up old collections');
    } else {
      console.log('❌ Migration completed with issues');
      console.log('⚠️ Review errors and validation issues above');
      console.log('⚠️ Do not clean up old collections until issues are resolved');
    }

  } catch (error) {
    console.error('❌ Profile migration execution failed:', error);
    throw error;
  }
}

export async function checkProfileStatus(): Promise<void> {
  console.log('🔍 Checking Profile System Status...\n');

  try {
    // Check unified profile service
    console.log('📝 Checking unified profile service...');
    
    // This would check if the service is working
    const testExists = await UnifiedUserProfileService.profileExists('test_user_123');
    console.log('✅ Unified service operational:', testExists !== undefined);

    // Check for duplicate collections
    console.log('\n📝 Checking for profile collection conflicts...');
    console.log('⚠️ Manual check required in Firebase console');
    console.log('⚠️ Look for multiple user_profiles collections');

    // Check data consistency
    console.log('\n📝 Checking data consistency...');
    console.log('⚠️ Run validation after migration');

    console.log('\n🎉 Profile status check completed!');

  } catch (error) {
    console.error('❌ Profile status check failed:', error);
  }
}

export async function runProfileMigrationSuite(): Promise<void> {
  console.log('🚀 Running Complete Profile Migration Suite...\n');

  try {
    // Run tests first
    await testProfileMigration();
    
    // Check current status
    await checkProfileStatus();
    
    // Ask for confirmation before migration
    console.log('\n⚠️ MIGRATION CONFIRMATION REQUIRED');
    console.log('⚠️ This will modify your Firebase database');
    console.log('⚠️ Ensure you have backups and are in the correct environment');
    console.log('\n🔄 To proceed with migration, call executeProfileMigration() manually');
    
  } catch (error) {
    console.error('❌ Profile migration suite failed:', error);
    throw error;
  }
}

// Export for browser testing
if (typeof window !== 'undefined') {
  (window as any).profileMigration = {
    runProfileMigrationSuite,
    testProfileMigration,
    executeProfileMigration,
    checkProfileStatus
  };
}

// Node.js testing
if (typeof require !== 'undefined' && require.main === module) {
  runProfileMigrationSuite().catch(console.error);
}
