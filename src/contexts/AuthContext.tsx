"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { User, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface CustomUser extends User {
  hasChatted?: boolean;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const attemptAnonymousSignIn = async () => {
      console.log(`AuthContext: Attempting anonymous sign-in (retryCount: ${retryCount})...`);
      try {
        const { user: anonUser } = await signInAnonymously(auth);
        console.log('AuthContext: Anonymous user created:', anonUser.uid, anonUser);

        // Fetch or create user profile in Firestore
        const userProfileRef = doc(db, 'users', anonUser.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        let customUser: CustomUser = anonUser;

        if (!userProfileSnap.exists()) {
          // Create new user profile if it doesn't exist
          await setDoc(userProfileRef, { uid: anonUser.uid, hasChatted: false });
          customUser.hasChatted = false;
          console.log('AuthContext: New user profile created for', anonUser.uid);
        } else {
          // Load existing hasChatted status
          customUser.hasChatted = userProfileSnap.data()?.hasChatted || false;
          console.log('AuthContext: Existing user profile loaded for', anonUser.uid, ', hasChatted:', customUser.hasChatted);
        }

        setUser(customUser);
        setError(null);
        console.log('AuthContext: User state set after anonymous sign-in.');

      } catch (authError) {
        console.error('AuthContext: Failed to sign in anonymously:', authError);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`AuthContext: Retrying anonymous sign in (attempt ${retryCount}/${maxRetries})...`);
          setTimeout(attemptAnonymousSignIn, retryDelay);
        } else {
          const finalError = authError instanceof Error ? authError : new Error('Failed to sign in anonymously after multiple attempts');
          setError(finalError);
          console.error('AuthContext: Final anonymous sign-in attempt failed:', finalError);
        }
      }
    };

    console.log('AuthContext: Setting up onAuthStateChanged listener.');
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        console.log('AuthContext: onAuthStateChanged callback triggered.');
        if (firebaseUser) {
          console.log('AuthContext: User detected:', firebaseUser.uid, firebaseUser);

          // Fetch or create user profile in Firestore for existing users
          const userProfileRef = doc(db, 'users', firebaseUser.uid);
          const userProfileSnap = await getDoc(userProfileRef);
          let customUser: CustomUser = firebaseUser;

          if (!userProfileSnap.exists()) {
            await setDoc(userProfileRef, { uid: firebaseUser.uid, hasChatted: false });
            customUser.hasChatted = false;
            console.log('AuthContext: New user profile created for', firebaseUser.uid);
          } else {
            customUser.hasChatted = userProfileSnap.data()?.hasChatted || false;
            console.log('AuthContext: Existing user profile loaded for', firebaseUser.uid, ', hasChatted:', customUser.hasChatted);
          }
          setUser(customUser);
          setError(null);
          console.log('AuthContext: User state set after onAuthStateChanged.');
        } else {
          console.log('AuthContext: No user detected in onAuthStateChanged, attempting anonymous sign in.');
          attemptAnonymousSignIn();
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
    error
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