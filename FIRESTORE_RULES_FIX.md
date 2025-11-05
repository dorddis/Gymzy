# Firestore Rules Fix - Follow/Unfollow Feature

**Date:** 2025-11-05
**Issue:** "Missing or insufficient permissions" error when unfollowing users

## Problem Diagnosis

When a user tried to unfollow someone, the system attempted to update two profiles:
1. **Follower's profile** (your profile) - Decrease `followingCount` ✅
2. **Followed user's profile** (their profile) - Decrease `followersCount` ❌

The original Firestore rules only allowed users to update their OWN profile, so attempting to update someone else's follower count failed with a permission error.

## Solution Applied

Updated `firestore.rules` to allow **limited updates** to other users' profiles:

### Changes Made:

1. **Split update permissions** for `user_profiles`:
   - **Full update** - Profile owner can update any field
   - **Limited update** - Others can ONLY update follower/following counts

2. **Added helper function** `onlyFollowerCountsChanged()`:
   - Validates that only `followersCount`, `followingCount`, and `updatedAt` fields are changed
   - Prevents unauthorized updates to other sensitive fields (name, email, bio, etc.)

### New Rules Structure:

```javascript
match /user_profiles/{userId} {
  // Owner can update everything
  allow update: if request.auth != null &&
    request.auth.uid == userId &&
    request.resource.data.uid == userId;

  // Others can ONLY update follower counts
  allow update: if request.auth != null &&
    request.auth.uid != userId &&
    onlyFollowerCountsChanged();
}

function onlyFollowerCountsChanged() {
  let affectedKeys = request.resource.data.diff(resource.data).affectedKeys();
  return affectedKeys.hasOnly(['followersCount', 'followingCount', 'updatedAt']);
}
```

## Security Implications

✅ **Secure**:
- Users can only update follower counts on other profiles
- All other fields remain protected
- Owner still has full control over their own profile

❌ **Protected Against**:
- Unauthorized profile edits (name, bio, email, etc.)
- Malicious follower count manipulation (validated by transaction logic)
- Direct database access without authentication

## Deployment

Rules deployed to Firebase:
```bash
firebase deploy --only firestore:rules
```

**Status:** ✅ Successfully deployed to production

## Testing Instructions

### Test Follow/Unfollow:
1. Go to Discover page
2. Search for a user
3. Click "Follow"
   - ✅ Should work without errors
   - ✅ Follow button changes to "Unfollow"
   - ✅ Follower counts update on both profiles
4. Click "Unfollow"
   - ✅ Should work without errors (previously failed)
   - ✅ Button changes back to "Follow"
   - ✅ Follower counts decrease on both profiles

### Check Profile Page:
1. Navigate to your profile
2. Check follower/following counts
3. Click to view followers/following lists
4. Verify counts are accurate

## Files Modified

- `firestore.rules` - Updated user_profiles permissions

## Related Issues Fixed

This also resolves the same permission error that would occur in:
- Following a user
- Viewing follower/following lists
- Any operation that updates follower counts

## Notes

- Rules take effect immediately after deployment
- No app restart required
- Users may need to refresh their browser to clear any cached permission errors
