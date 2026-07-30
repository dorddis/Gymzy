# Firebase Admin SDK Implementation

**Date:** 2025-11-07
**Issue:** Server-side API routes couldn't access user workout data due to Firebase permission errors
**Solution:** Implemented Firebase Admin SDK for server-side operations

---

## Problem

The Quick Action API route (`/api/quick-action`) was using the client-side Firebase SDK to query Firestore. When called from the server:

- ❌ Client SDK requires browser authentication context (`request.auth`)
- ❌ Server has no browser session, so `request.auth` was null
- ❌ Firestore security rules rejected queries: `permission-denied`
- ❌ User queries like "What is my best bench press?" failed with 500 errors

**Evidence:**
```
Error getting all workouts: [Error [FirebaseError]: Missing or insufficient permissions.] {
  code: 'permission-denied',
  customData: undefined
}
```

User ID `hHuIokDYEoM3MkAVqELo2SGRbx13` had workout data visible in the app UI, but the API couldn't access it.

---

## Solution

### 1. Created Firebase Admin SDK Initialization

**File:** `src/lib/firebase-admin.ts`

- Initializes Firebase Admin SDK for server-side operations
- Admin SDK bypasses Firestore security rules using service account
- Supports both explicit credentials and Application Default Credentials
- Singleton pattern ensures single initialization

**Key Functions:**
- `initializeAdminApp()` - Initialize Firebase Admin
- `getAdminDb()` - Get Admin Firestore instance
- `isAdminInitialized()` - Check initialization status

### 2. Created Admin Workout Service

**File:** `src/services/core/workout-service-admin.ts`

Admin versions of workout functions:
- `getAllWorkoutsAdmin(userId)` - Get all workouts using Admin SDK
- `getRecentWorkoutsAdmin(userId, limit)` - Get recent workouts
- `getWorkoutByIdAdmin(workoutId)` - Get specific workout

**Key Difference:**
```typescript
// OLD (Client SDK - requires auth context)
import { db } from '@/lib/firebase';
const workouts = await getDocs(query(collection(db, 'workouts'), where('userId', '==', userId)));

// NEW (Admin SDK - bypasses security rules)
import { getAdminDb } from '@/lib/firebase-admin';
const db = getAdminDb();
const workouts = await db.collection('workouts').where('userId', '==', userId).get();
```

### 3. Updated Workout Agent Functions

**File:** `src/services/agents/workout-agent-functions.ts`

Changed all functions to use admin SDK:
- `viewWorkoutHistory()` - Uses `getAllWorkoutsAdmin()`
- `viewWorkoutDetails()` - Uses `getAllWorkoutsAdmin()`
- `viewStats()` - Uses `getAllWorkoutsAdmin()`
- `getPersonalBests()` - Uses `getAllWorkoutsAdmin()`

### 4. Updated API Route

**File:** `src/app/api/quick-action/route.ts`

Added admin SDK initialization at the start of the route:
```typescript
import { initializeAdminApp } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  // Initialize Firebase Admin SDK for server-side operations
  initializeAdminApp();

  // ... rest of route logic
}
```

---

## Results

### Before (Client SDK)
```
POST /api/quick-action 500 in 2104ms
Error: Missing or insufficient permissions
```

### After (Admin SDK)
```
POST /api/quick-action 200 in 3437ms
Function executed { function: 'getPersonalBests', success: true }
```

**Test Commands That Now Work:**
- ✅ "What is my best bench press?" - Returns actual PR data
- ✅ "What's my best squat?" - Returns actual PR data
- ✅ "Show my workout stats" - Returns real statistics
- ✅ "View my workout history" - Returns all workouts

---

## Environment Variables

The Admin SDK works with Application Default Credentials in production (Vercel, GCP).

**Optional for local development with explicit credentials:**
```env
# Server-side only (DO NOT use NEXT_PUBLIC_ prefix)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
```

**Required (already set):**
```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID="gymzy-launch"
```

---

## Security Notes

### Admin SDK Benefits
✅ **Server-side only** - Never exposed to client
✅ **Bypasses security rules** - Uses service account with full access
✅ **No auth context needed** - Works in API routes without browser session
✅ **Production ready** - Uses Application Default Credentials on Vercel

### Security Best Practices
⚠️ **NEVER import admin SDK in client code**
⚠️ **Always validate userId** - Ensure users can only access their own data
⚠️ **Keep service account private** - Never commit to git
⚠️ **Use in API routes only** - Server-side execution only

---

## Files Modified

**New Files:**
1. `src/lib/firebase-admin.ts` - Admin SDK initialization
2. `src/services/core/workout-service-admin.ts` - Admin workout service
3. `FIREBASE_ADMIN_SDK_IMPLEMENTATION.md` - This documentation

**Modified Files:**
1. `src/services/agents/workout-agent-functions.ts` - Updated to use admin functions
2. `src/app/api/quick-action/route.ts` - Added admin SDK initialization
3. `package.json` - Added firebase-admin@12.7.0 (66 packages installed)

---

## Client SDK vs Admin SDK

| Feature | Client SDK | Admin SDK |
|---------|-----------|-----------|
| **Where** | Browser & Server | Server Only |
| **Auth** | Requires user session | Uses service account |
| **Security Rules** | Enforced | Bypassed |
| **Use Case** | User-facing UI | Backend operations |
| **Performance** | Fast (direct) | Fast (direct) |

---

## Phase 1 MVP Status

**✅ WORKING FEATURES:**
1. Natural language commands → function calls
2. Navigation ("take me to stats", "go to profile")
3. Workout queries ("what's my best bench press?")
4. Stats queries ("show my stats")
5. Personal records ("what's my PR for squats?")

**Next Steps (Phase 2):**
- Voice input for hands-free gym use
- Conversation history for multi-turn interactions
- More complex function chaining

---

## Troubleshooting

### Issue: "Missing or insufficient permissions"
**Cause:** Code is using client SDK (`getAllWorkouts`) instead of admin SDK
**Fix:** Use `getAllWorkoutsAdmin` from `workout-service-admin.ts`

### Issue: "NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set"
**Cause:** Missing required environment variable
**Fix:** Ensure `.env.local` has `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

### Issue: Admin SDK not initializing
**Cause:** Import cycle or multiple initializations
**Fix:** Call `initializeAdminApp()` once at API route entry point

---

## Testing

**User ID for Testing:** `hHuIokDYEoM3MkAVqELo2SGRbx13`

**Test Commands:**
```
What is my best bench press?
What's my best squat?
Show me my workout stats
View my workout history
```

**Expected Results:**
- Status 200 (not 500)
- Actual user data (not error messages)
- Toast notification with result
- No permission errors in logs

---

## Status: ✅ COMPLETE

The Firebase Admin SDK is fully implemented and tested. Server-side API routes can now access user workout data without permission errors.

**Verified Working:**
- ✅ User hHuIokDYEoM3MkAVqELo2SGRbx13 can query their workout data
- ✅ Personal records queries return actual data
- ✅ Workout stats queries work correctly
- ✅ No more permission-denied errors

**No further action needed for Phase 1 MVP.**
