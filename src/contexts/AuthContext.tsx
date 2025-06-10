"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { User, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if Firebase is properly configured
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setError(new Error('Firebase configuration is missing. Please check your .env.local file.'));
      setLoading(false);
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const attemptAnonymousSignIn = async () => {
      try {
        const { user: anonUser } = await signInAnonymously(auth);
        console.log('AuthContext: Anonymous user created:', anonUser.uid);
        setUser(anonUser);
        setError(null);
      } catch (authError) {
        console.error('AuthContext: Failed to sign in anonymously:', authError);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`AuthContext: Retrying anonymous sign in (attempt ${retryCount}/${maxRetries})...`);
          setTimeout(attemptAnonymousSignIn, retryDelay);
        } else {
          setError(authError instanceof Error ? authError : new Error('Failed to sign in anonymously after multiple attempts'));
        }
      }
    };

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          console.log('AuthContext: User detected:', firebaseUser.uid);
          setUser(firebaseUser);
          setError(null);
        } else {
          console.log('AuthContext: No user detected, attempting anonymous sign in');
          attemptAnonymousSignIn();
        }
        setLoading(false);
      },
      (authError) => {
        console.error('AuthContext: Firebase auth error:', authError);
        setError(authError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
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