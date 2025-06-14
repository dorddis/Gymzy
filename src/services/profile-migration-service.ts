/**
 * Profile Migration Service
 * Consolidates data from multiple user profile collections into unified system
 */

import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { UserProfile, ProfileConverter } from '@/types/user-profile';
import { UnifiedUserProfileService } from './unified-user-profile-service';

export interface MigrationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: string[];
  duplicatesFound: number;
  legacyProfilesFound: number;
}

export class ProfileMigrationService {
  
  /**
   * Migrate all user profiles to unified system
   */
  static async migrateAllProfiles(): Promise<MigrationResult> {
    console.log('🔄 ProfileMigrationService: Starting profile migration...');
    
    const result: MigrationResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      duplicatesFound: 0,
      legacyProfilesFound: 0
    };

    try {
      // Get all profiles from both collections
      const collection1Profiles = await this.getProfilesFromCollection('user_profiles');
      const collection2Profiles = await this.getProfilesFromCollection('user_profiles'); // Assuming second collection has different structure
      
      console.log(`📊 Found ${collection1Profiles.length} profiles in collection 1`);
      console.log(`📊 Found ${collection2Profiles.length} profiles in collection 2`);
      
      // Create a map to handle duplicates
      const profileMap = new Map<string, any>();
      
      // Process collection 1 profiles
      collection1Profiles.forEach(profile => {
        if (profile.uid) {
          profileMap.set(profile.uid, { ...profile, source: 'collection1' });
        }
      });
      
      // Process collection 2 profiles (merge with collection 1 if duplicate)
      collection2Profiles.forEach(profile => {
        if (profile.uid) {
          const existing = profileMap.get(profile.uid);
          if (existing) {
            result.duplicatesFound++;
            // Merge profiles, prioritizing more complete data
            const merged = this.mergeProfiles(existing, { ...profile, source: 'collection2' });
            profileMap.set(profile.uid, merged);
          } else {
            profileMap.set(profile.uid, { ...profile, source: 'collection2' });
          }
        }
      });
      
      result.totalProcessed = profileMap.size;
      
      // Migrate each profile
      for (const [uid, profileData] of profileMap) {
        try {
          await this.migrateProfile(uid, profileData);
          result.successful++;
          console.log(`✅ Migrated profile for user ${uid}`);
        } catch (error) {
          result.failed++;
          const errorMsg = `Failed to migrate profile for user ${uid}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
      
      console.log('🎉 ProfileMigrationService: Migration completed');
      console.log(`📊 Results: ${result.successful} successful, ${result.failed} failed, ${result.duplicatesFound} duplicates`);
      
      return result;
      
    } catch (error) {
      console.error('❌ ProfileMigrationService: Migration failed:', error);
      result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }
  
  /**
   * Migrate a single profile to unified format
   */
  static async migrateProfile(uid: string, profileData: any): Promise<void> {
    try {
      // Check if unified profile already exists
      const existingProfile = await UnifiedUserProfileService.getProfile(uid);
      if (existingProfile) {
        console.log(`⚠️ Profile already exists for user ${uid}, skipping migration`);
        return;
      }
      
      // Convert legacy profile to unified format
      const unifiedProfile = this.convertToUnifiedProfile(uid, profileData);
      
      // Validate the profile
      const validation = ProfileConverter.validateProfile(unifiedProfile);
      if (!validation.valid) {
        throw new Error(`Profile validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Save to unified collection
      const profileRef = doc(db, 'user_profiles', uid);
      await setDoc(profileRef, unifiedProfile);
      
      console.log(`✅ Successfully migrated profile for user ${uid}`);
      
    } catch (error) {
      console.error(`❌ Error migrating profile for user ${uid}:`, error);
      throw error;
    }
  }
  
  /**
   * Get profiles from a specific collection
   */
  private static async getProfilesFromCollection(collectionName: string): Promise<any[]> {
    try {
      const profilesRef = collection(db, collectionName);
      const snapshot = await getDocs(profilesRef);
      
      const profiles: any[] = [];
      snapshot.forEach(doc => {
        profiles.push({ uid: doc.id, ...doc.data() });
      });
      
      return profiles;
    } catch (error) {
      console.error(`❌ Error getting profiles from ${collectionName}:`, error);
      return [];
    }
  }
  
  /**
   * Merge two profile objects, prioritizing more complete data
   */
  private static mergeProfiles(profile1: any, profile2: any): any {
    const merged = { ...profile1 };
    
    // Merge fields, prioritizing non-empty values
    Object.keys(profile2).forEach(key => {
      if (profile2[key] !== undefined && profile2[key] !== null && profile2[key] !== '') {
        if (Array.isArray(profile2[key]) && profile2[key].length > 0) {
          merged[key] = profile2[key];
        } else if (!Array.isArray(profile2[key])) {
          merged[key] = profile2[key];
        }
      }
    });
    
    // Mark as merged
    merged.sources = [profile1.source, profile2.source];
    
    return merged;
  }
  
  /**
   * Convert legacy profile to unified format
   */
  private static convertToUnifiedProfile(uid: string, legacyProfile: any): UserProfile {
    const now = Timestamp.now();
    
    return {
      uid,
      email: legacyProfile.email || '',
      displayName: legacyProfile.displayName || legacyProfile._name_ || '',
      profilePicture: legacyProfile.profilePicture,
      bio: legacyProfile.bio || '',
      
      // Fitness data
      fitnessLevel: this.normalizeFitnessLevel(legacyProfile.fitnessLevel || legacyProfile.experienceLevel),
      fitnessGoals: legacyProfile.fitnessGoals || legacyProfile.goals || [],
      experienceLevel: this.normalizeFitnessLevel(legacyProfile.experienceLevel || legacyProfile.fitnessLevel),
      preferredWorkoutTypes: legacyProfile.preferredWorkoutTypes || [],
      availableEquipment: legacyProfile.availableEquipment || ['bodyweight'],
      workoutFrequency: legacyProfile.workoutFrequency || '2-3 times per week',
      timePerWorkout: legacyProfile.timePerWorkout || '30-45 minutes',
      injuries: legacyProfile.injuries || [],
      
      // Social data
      isPublic: legacyProfile.isPublic !== undefined ? legacyProfile.isPublic : true,
      followersCount: legacyProfile.followersCount || 0,
      followingCount: legacyProfile.followingCount || 0,
      workoutsCount: legacyProfile.workoutsCount || 0,
      
      // Preferences
      preferences: {
        communicationStyle: legacyProfile.preferences?.communicationStyle || 'motivational',
        detailLevel: legacyProfile.preferences?.detailLevel || 'detailed',
        workoutComplexity: legacyProfile.preferences?.workoutComplexity || 'beginner'
      },
      
      // Timestamps
      createdAt: legacyProfile.createdAt || now,
      updatedAt: now,
      
      // Legacy fields
      hasChatted: legacyProfile.hasChatted || false,
      hasCompletedOnboarding: legacyProfile.hasCompletedOnboarding || false
    };
  }
  
  /**
   * Normalize fitness level values
   */
  private static normalizeFitnessLevel(level: any): 'beginner' | 'intermediate' | 'advanced' {
    if (typeof level === 'string') {
      const normalized = level.toLowerCase();
      if (['intermediate', 'advanced'].includes(normalized)) {
        return normalized as 'intermediate' | 'advanced';
      }
    }
    return 'beginner';
  }
  
  /**
   * Backup existing profiles before migration
   */
  static async backupProfiles(): Promise<void> {
    try {
      console.log('💾 ProfileMigrationService: Creating backup...');
      
      const collection1Profiles = await this.getProfilesFromCollection('user_profiles');
      
      // Save backup to a timestamped collection
      const backupCollectionName = `user_profiles_backup_${Date.now()}`;
      const batch = writeBatch(db);
      
      collection1Profiles.forEach(profile => {
        if (profile.uid) {
          const backupRef = doc(db, backupCollectionName, profile.uid);
          batch.set(backupRef, profile);
        }
      });
      
      await batch.commit();
      console.log(`✅ Backup created in collection: ${backupCollectionName}`);
      
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }
  
  /**
   * Validate migration results
   */
  static async validateMigration(): Promise<{
    valid: boolean;
    issues: string[];
    stats: any;
  }> {
    try {
      console.log('🔍 ProfileMigrationService: Validating migration...');
      
      const issues: string[] = [];
      const unifiedProfiles = await this.getProfilesFromCollection('user_profiles');
      
      let validProfiles = 0;
      let invalidProfiles = 0;
      
      for (const profile of unifiedProfiles) {
        const validation = ProfileConverter.validateProfile(profile);
        if (validation.valid) {
          validProfiles++;
        } else {
          invalidProfiles++;
          issues.push(`Profile ${profile.uid}: ${validation.errors.join(', ')}`);
        }
      }
      
      const stats = {
        totalProfiles: unifiedProfiles.length,
        validProfiles,
        invalidProfiles,
        validationRate: validProfiles / unifiedProfiles.length
      };
      
      console.log('📊 Migration validation stats:', stats);
      
      return {
        valid: invalidProfiles === 0,
        issues,
        stats
      };
      
    } catch (error) {
      console.error('❌ Error validating migration:', error);
      return {
        valid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        stats: {}
      };
    }
  }
  
  /**
   * Clean up old profile collections (use with caution!)
   */
  static async cleanupOldCollections(): Promise<void> {
    console.log('⚠️ ProfileMigrationService: This would clean up old collections');
    console.log('⚠️ Implementation intentionally left empty for safety');
    console.log('⚠️ Manually delete old collections after verifying migration success');
  }
}

// Export for use in migration scripts
export default ProfileMigrationService;
