/**
 * Test endpoint for Firebase Admin SDK
 *
 * GET /api/test-admin?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp, getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    logger.info('[TestAdmin] Testing admin access', 'api', { userId });

    // Try to initialize admin
    try {
      initializeAdminApp();
      logger.info('[TestAdmin] Admin SDK initialized', 'api');
    } catch (initError) {
      logger.error('[TestAdmin] Failed to initialize admin SDK', 'api', initError instanceof Error ? initError : undefined);
      return NextResponse.json({
        success: false,
        error: 'Admin SDK initialization failed',
        details: initError instanceof Error ? initError.message : String(initError)
      });
    }

    // Try to get workouts
    try {
      const db = getAdminDb();
      const workoutsRef = db.collection('workouts');

      const snapshot = await workoutsRef
        .where('userId', '==', userId)
        .orderBy('date', 'desc')
        .limit(5)
        .get();

      const workouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info('[TestAdmin] Workouts fetched successfully', 'api', { count: workouts.length });

      return NextResponse.json({
        success: true,
        count: workouts.length,
        workouts: workouts.map(w => ({
          id: w.id,
          title: w.title,
          date: w.date?.toDate?.()?.toISOString() || 'unknown'
        }))
      });

    } catch (queryError) {
      logger.error('[TestAdmin] Failed to query workouts', 'api', queryError instanceof Error ? queryError : undefined);
      return NextResponse.json({
        success: false,
        error: 'Query failed',
        details: queryError instanceof Error ? queryError.message : String(queryError)
      });
    }

  } catch (error) {
    logger.error('[TestAdmin] Unexpected error', 'api', error instanceof Error ? error : undefined);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
