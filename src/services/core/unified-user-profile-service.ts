/**
 * Unified User Profile Service
 * Consolidates all user profile operations into a single service
 */

import { db } from '@/lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { 
  UserProfile, 
  PublicUserProfile, 
  FitnessProfile, 
  UserProfileUpdate,
  ProfileConverter,
  PROFILE_CONSTANTS
} from '@/types/user-profile';

export class UnifiedUserProfileService {
  private static readonly COLLECTION_NAME = 'user_profiles';
  
  /**
   * Create a new user profile
   */
  static async createProfile(
    uid: string,
    email: string,
    displayName: string,
    additionalData?: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      console.log('🔧 UnifiedUserProfileService: Creating profile for', uid);
      
      // Create default profile
      const profile = ProfileConverter.createDefaultProfile(
        uid, 
        email, 
        displayName, 
        additionalData
      );
      
      // Validate profile
      const validation = ProfileConverter.validateProfile(profile);
      if (!validation.valid) {
        throw new Error(`Profile validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Save to Firestore
      const profileRef = doc(db, this.COLLECTION_NAME, uid);
      await setDoc(profileRef, profile);
      
      console.log('✅ UnifiedUserProfileService: Profile created successfully');
      return profile;
      
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error creating profile:', error);
      throw error;
    }
  }
  
  /**
   * Get user profile by UID
   */
  static async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      console.log('🔍 UnifiedUserProfileService: Loading profile for', uid);
      
      const profileRef = doc(db, this.COLLECTION_NAME, uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const profile = profileSnap.data() as UserProfile;
        console.log('✅ UnifiedUserProfileService: Profile loaded successfully', {
          profilePicture: profile.profilePicture,
          displayName: profile.displayName
        });
        return profile;
      } else {
        console.log('📭 UnifiedUserProfileService: No profile found');
        return null;
      }
      
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error loading profile:', error);
      return null;
    }
  }
  
  /**
   * Update user profile
   */
  static async updateProfile(uid: string, updates: UserProfileUpdate): Promise<void> {
    try {
      console.log('🔧 UnifiedUserProfileService: Updating profile for', uid);
      
      // Get existing profile
      const existingProfile = await this.getProfile(uid);
      if (!existingProfile) {
        throw new Error('Profile not found');
      }
      
      // Merge updates
      const updatedProfile = ProfileConverter.mergeProfileUpdate(existingProfile, updates);
      
      // Validate updated profile
      const validation = ProfileConverter.validateProfile(updatedProfile);
      if (!validation.valid) {
        throw new Error(`Profile validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Update in Firestore
      const profileRef = doc(db, this.COLLECTION_NAME, uid);
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      console.log('✅ UnifiedUserProfileService: Profile updated successfully');
      
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error updating profile:', error);
      throw error;
    }
  }
  
  /**
   * Get public profile for social features
   */
  static async getPublicProfile(uid: string): Promise<PublicUserProfile | null> {
    try {
      const profile = await this.getProfile(uid);
      if (!profile) return null;
      
      return ProfileConverter.toPublicProfile(profile);
      
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error getting public profile:', error);
      return null;
    }
  }
  
  /**
   * Get fitness profile for AI context
   */
  static async getFitnessProfile(uid: string): Promise<FitnessProfile | null> {
    try {
      const profile = await this.getProfile(uid);
      if (!profile) return null;
      
      return ProfileConverter.toFitnessProfile(profile);
      
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error getting fitness profile:', error);
      return null;
    }
  }
  
  /**
   * Search public profiles
   */
  static async searchPublicProfiles(searchTerm: string, limit: number = 20): Promise<PublicUserProfile[]> {
    try {
      console.log('🔍 UnifiedUserProfileService: Searching profiles for', searchTerm);
      
      const profilesRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        profilesRef,
        where('isPublic', '==', true),
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(q);
      const profiles: PublicUserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        const profile = doc.data() as UserProfile;
        profiles.push(ProfileConverter.toPublicProfile(profile));
      });
      
      console.log(`✅ UnifiedUserProfileService: Found ${profiles.length} public profiles`);
      return profiles.slice(0, limit);
      
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error searching profiles:', error);
      return [];
    }
  }
  
  /**
   * Get profiles by fitness level
   */
  static async getProfilesByFitnessLevel(
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
    limit: number = 20
  ): Promise<PublicUserProfile[]> {
    try {
      const profilesRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        profilesRef,
        where('isPublic', '==', true),
        where('fitnessLevel', '==', fitnessLevel)
      );
      
      const querySnapshot = await getDocs(q);
      const profiles: PublicUserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        const profile = doc.data() as UserProfile;
        profiles.push(ProfileConverter.toPublicProfile(profile));
      });
      
      return profiles.slice(0, limit);
      
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error getting profiles by fitness level:', error);
      return [];
    }
  }
  
  /**
   * Update profile counters (followers, following, workouts)
   */
  static async updateCounters(
    uid: string, 
    counters: {
      followersCount?: number;
      followingCount?: number;
      workoutsCount?: number;
    }
  ): Promise<void> {
    try {
      const profileRef = doc(db, this.COLLECTION_NAME, uid);
      await updateDoc(profileRef, {
        ...counters,
        updatedAt: Timestamp.now()
      });
      
      console.log('✅ UnifiedUserProfileService: Counters updated successfully');
      
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error updating counters:', error);
      throw error;
    }
  }
  
  /**
   * Mark onboarding as completed
   */
  static async completeOnboarding(uid: string, onboardingData: any): Promise<void> {
    try {
      console.log('🔧 UnifiedUserProfileService: Completing onboarding for', uid);
      
      const updates: UserProfileUpdate = {
        hasCompletedOnboarding: true,
        fitnessGoals: onboardingData.goals || [],
        fitnessLevel: onboardingData.fitnessLevel || 'beginner',
        preferredWorkoutTypes: onboardingData.workoutTypes || [],
        availableEquipment: onboardingData.equipment || ['bodyweight'],
        workoutFrequency: onboardingData.frequency || '2-3 times per week',
        timePerWorkout: onboardingData.duration || '30-45 minutes',
        injuries: onboardingData.injuries || [],
        preferences: {
          communicationStyle: onboardingData.communicationStyle || 'motivational',
          detailLevel: onboardingData.detailLevel || 'detailed',
          workoutComplexity: onboardingData.workoutComplexity || 'beginner'
        }
      };
      
      await this.updateProfile(uid, updates);
      console.log('✅ UnifiedUserProfileService: Onboarding completed successfully');
      
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error completing onboarding:', error);
      throw error;
    }
  }
  
  /**
   * Check if profile exists
   */
  static async profileExists(uid: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(uid);
      return profile !== null;
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error checking profile existence:', error);
      return false;
    }
  }
  
  /**
   * Delete profile (for account deletion)
   */
  static async deleteProfile(uid: string): Promise<void> {
    try {
      console.log('🗑️ UnifiedUserProfileService: Deleting profile for', uid);
      
      // Note: In a real implementation, you'd want to handle this more carefully
      // with proper data cleanup, backup, etc.
      const profileRef = doc(db, this.COLLECTION_NAME, uid);
      await updateDoc(profileRef, {
        isPublic: false,
        displayName: '[Deleted User]',
        bio: '',
        profilePicture: '',
        updatedAt: Timestamp.now()
      });
      
      console.log('✅ UnifiedUserProfileService: Profile marked as deleted');
      
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error deleting profile:', error);
      throw error;
    }
  }
  
  /**
   * Get profile statistics
   */
  static async getProfileStats(): Promise<{
    totalProfiles: number;
    publicProfiles: number;
    completedOnboarding: number;
    byFitnessLevel: Record<string, number>;
  }> {
    try {
      // This would typically be implemented with aggregation queries
      // For now, return placeholder data
      return {
        totalProfiles: 0,
        publicProfiles: 0,
        completedOnboarding: 0,
        byFitnessLevel: {
          beginner: 0,
          intermediate: 0,
          advanced: 0
        }
      };
    } catch (error) {
      console.error('❌ UnifiedUserProfileService: Error getting profile stats:', error);
      throw error;
    }
  }
}
