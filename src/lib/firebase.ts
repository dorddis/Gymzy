import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirebaseConfig } from './env-config';

// Get validated Firebase configuration
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase only if we have the required config
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Validate Firebase configuration
if (!firebaseConfig.apiKey) {
  console.warn(
    'Firebase API key is missing. Please check your .env.local file and ensure all Firebase configuration variables are set.'
  );
} 