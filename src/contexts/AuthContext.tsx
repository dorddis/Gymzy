"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  User,
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

// Import unified user profile types
import { UserProfile, UserProfileUpdate } from '@/types/user-profile';
import { UnifiedUserProfileService } from '@/services/unified-user-profile-service';

interface CustomUser extends User {
  profile?: UserProfile;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  error: Error | null;
  // Authentication methods
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: UserProfileUpdate) => Promise<void>;
  deleteAccount: () => Promise<void>;
  // Profile management
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Google Auth Provider
  const googleProvider = new GoogleAuthProvider();

  // Helper function to create user profile using unified service
  const createUserProfile = async (firebaseUser: User, additionalData?: Partial<UserProfile>): Promise<UserProfile> => {
    console.log('AuthContext: Creating user profile using unified service');

    return await UnifiedUserProfileService.createProfile(
      firebaseUser.uid,
      firebaseUser.email || '',
      firebaseUser.displayName || '',
      {
        profilePicture: firebaseUser.photoURL || undefined,
        ...additionalData
      }
    );
  };

  // Helper function to load user profile using unified service
  const loadUserProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      console.log('AuthContext: Loading user profile using unified service for', firebaseUser.uid);

      let profile = await UnifiedUserProfileService.getProfile(firebaseUser.uid);

      if (!profile) {
        console.log('AuthContext: No profile found, creating new profile');
        // Create profile if it doesn't exist (for legacy users)
        profile = await createUserProfile(firebaseUser);
        console.log('AuthContext: New profile created', { hasCompletedOnboarding: profile.hasCompletedOnboarding });
      } else {
        console.log('AuthContext: Profile found', { hasCompletedOnboarding: profile.hasCompletedOnboarding });
      }

      return profile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await updateProfile(newUser, { displayName });

      // Create user profile
      await createUserProfile(newUser, { displayName });

    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Failed to create account');
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await signInWithEmailAndPassword(auth, email, password);

    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Failed to sign in');
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await signInWithPopup(auth, googleProvider);

      // Check if user profile exists, create if not
      const userProfileRef = doc(db, 'user_profiles', result.user.uid);
      const userProfileSnap = await getDoc(userProfileRef);

      if (!userProfileSnap.exists()) {
        await createUserProfile(result.user);
      }

    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Failed to sign in with Google');
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Failed to sign out');
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Failed to send password reset email');
      setError(authError);
      throw authError;
    }
  };

  // Update user profile using unified service
  const updateUserProfile = async (updates: UserProfileUpdate): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('AuthContext: Updating profile using unified service with:', updates);

      // Check if profile exists first
      const profileExists = await UnifiedUserProfileService.profileExists(user.uid);

      if (!profileExists) {
        console.log('AuthContext: Profile does not exist, creating new profile...');
        // Create profile if it doesn't exist
        await createUserProfile(user, updates);
      } else {
        console.log('AuthContext: Updating existing profile');
        await UnifiedUserProfileService.updateProfile(user.uid, updates);
        console.log('AuthContext: Profile updated successfully');
      }

      // Refresh user profile
      console.log('AuthContext: Refreshing user profile after update');
      await refreshUserProfile();
      console.log('AuthContext: Profile refresh completed');

    } catch (error) {
      console.error('Error updating user profile:', error);
      const updateError = error instanceof Error ? error : new Error('Failed to update profile');
      setError(updateError);
      throw updateError;
    }
  };

  // Delete account
  const deleteAccount = async (): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      setLoading(true);

      // Delete user profile from Firestore
      const userProfileRef = doc(db, 'user_profiles', user.uid);
      await deleteDoc(userProfileRef);

      // Delete user from Firebase Auth
      await deleteUser(user);

    } catch (error) {
      const deleteError = error instanceof Error ? error : new Error('Failed to delete account');
      setError(deleteError);
      throw deleteError;
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile
  const refreshUserProfile = async (): Promise<void> => {
    if (!user) {
      console.log('AuthContext: No user to refresh profile for');
      return;
    }

    try {
      console.log('AuthContext: Refreshing user profile for', user.uid);
      const profile = await loadUserProfile(user);
      if (profile) {
        console.log('AuthContext: Profile loaded during refresh', { hasCompletedOnboarding: profile.hasCompletedOnboarding });
        const updatedUser: CustomUser = { ...user, profile };
        setUser(updatedUser);
        console.log('AuthContext: User state updated with refreshed profile');
      } else {
        console.log('AuthContext: No profile found during refresh');
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  useEffect(() => {
    console.log('AuthContext: useEffect running.');

    // Check if Firebase is properly configured
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      const firebaseConfigError = new Error('Firebase configuration is missing. Please check your .env.local file.');
      setError(firebaseConfigError);
      setLoading(false);
      console.error('AuthContext: Firebase configuration error:', firebaseConfigError);
      return;
    }

    console.log('AuthContext: Setting up onAuthStateChanged listener.');
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        console.log('AuthContext: onAuthStateChanged callback triggered.');

        if (firebaseUser) {
          console.log('AuthContext: User detected:', firebaseUser.uid);

          try {
            // Load user profile
            const profile = await loadUserProfile(firebaseUser);
            const customUser: CustomUser = {
              ...firebaseUser,
              profile: profile || undefined
            };

            setUser(customUser);
            setError(null);
            console.log('AuthContext: User state set with profile.');
          } catch (error) {
            console.error('AuthContext: Error loading user profile:', error);
            // Still set user even if profile loading fails
            setUser(firebaseUser);
            setError(error instanceof Error ? error : new Error('Failed to load user profile'));
          }
        } else {
          console.log('AuthContext: No user detected.');
          setUser(null);
          setError(null);
        }

        setLoading(false);
        console.log('AuthContext: Loading set to false.');
      },
      (authError) => {
        console.error('AuthContext: Firebase auth error from onAuthStateChanged:', authError);
        setError(authError);
        setLoading(false);
        console.log('AuthContext: Loading set to false on auth error.');
      }
    );

    return () => {
      console.log('AuthContext: Cleaning up onAuthStateChanged listener.');
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut: handleSignOut,
    resetPassword,
    updateUserProfile,
    deleteAccount,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 