/**
 * Authentication Middleware for API Routes
 *
 * Verifies Firebase ID tokens from Authorization header
 * Returns authenticated user ID or throws error
 */

import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from './firebase-admin';
import { logger } from './logger';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

/**
 * Verify Firebase ID token from Authorization header
 *
 * @param request - Next.js request object
 * @returns Authenticated user info
 * @throws Error if token is invalid or missing
 */
export async function verifyAuth(request: NextRequest): Promise<AuthenticatedUser> {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header. Expected format: "Bearer <token>"');
    }

    // Extract token
    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      throw new Error('No token provided in Authorization header');
    }

    // Initialize Firebase Admin SDK
    initializeAdminApp();
    const auth = getAuth();

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(token);

    logger.info('[Auth] Token verified successfully', 'auth', {
      uid: decodedToken.uid,
      email: decodedToken.email
    });

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };
  } catch (error) {
    logger.error('[Auth] Token verification failed', 'auth', error instanceof Error ? error : undefined);

    if (error instanceof Error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
    throw new Error('Authentication failed: Unknown error');
  }
}

/**
 * Verify that the authenticated user matches the requested userId
 *
 * @param authenticatedUid - UID from verified token
 * @param requestedUserId - User ID from request body/params
 * @throws Error if UIDs don't match
 */
export function verifyUserAccess(authenticatedUid: string, requestedUserId: string): void {
  if (authenticatedUid !== requestedUserId) {
    logger.warn('[Auth] User attempted to access another user\'s data', 'auth', {
      authenticatedUid,
      requestedUserId
    });
    throw new Error('Access denied: Cannot access another user\'s data');
  }
}
