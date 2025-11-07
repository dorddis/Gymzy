/**
 * Firebase Admin SDK Initialization
 *
 * This module initializes the Firebase Admin SDK for server-side operations.
 * Admin SDK bypasses Firestore security rules and uses service account authentication.
 *
 * IMPORTANT: Only use this in server-side code (API routes, server components).
 * Never import this in client-side code.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

/**
 * Initialize Firebase Admin SDK
 *
 * In development: Reads service account from JSON file
 * In production: Uses Application Default Credentials (Vercel, GCP)
 */
export function initializeAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set');
    }

    // In development, read service account JSON file directly
    // This works around Next.js not loading server-side env vars from .env.local
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      try {
        // Read service account from project root
        const serviceAccountPath = join(process.cwd(), 'firebase-admin-key.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

        console.log('[Firebase Admin] Using service account from firebase-admin-key.json');
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });

        console.log('[Firebase Admin] Initialized successfully with service account');
        return adminApp;
      } catch (fileError) {
        console.warn('[Firebase Admin] Could not read service account file:', fileError);
        // Fall through to ADC
      }
    }

    // Production or fallback: Use Application Default Credentials
    console.log('[Firebase Admin] Using Application Default Credentials');
    adminApp = initializeApp({
      projectId,
    });

    console.log('[Firebase Admin] Initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Get Admin Firestore instance
 */
export function getAdminDb(): Firestore {
  if (adminDb) {
    return adminDb;
  }

  const app = initializeAdminApp();
  adminDb = getFirestore(app);

  return adminDb;
}

/**
 * Check if Admin SDK is initialized
 */
export function isAdminInitialized(): boolean {
  return adminApp !== undefined;
}
