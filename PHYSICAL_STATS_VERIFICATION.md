# Physical Stats Save/Load Verification

## Changes Made

### 1. **Added `physicalStats` field to OnboardingContext**
**File:** `src/services/data/onboarding-context-service.ts`
**Lines:** 95-111

```typescript
physicalStats?: {
  age: number;
  height: { value: number; unit: 'cm' | 'ft_in'; feet?: number; inches?: number; };
  weight: { value: number; unit: 'kg' | 'lbs'; };
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  bmr: number;
  tdee: number;
};
```

### 2. **Added `updatePhysicalStats()` service method**
**File:** `src/services/data/onboarding-context-service.ts`
**Lines:** 348-359

```typescript
static async updatePhysicalStats(
  userId: string,
  physicalStats: OnboardingContext['physicalStats']
): Promise<OnboardingContext>
```

### 3. **Updated PhysicalStatsManager component**
**File:** `src/components/settings/physical-stats-manager.tsx`

**Changes:**
- **Line 21:** Import `OnboardingContextService`
- **Lines 42-43:** Updated props to accept `context` and return updated context
- **Lines 106-110:** Added useEffect to load stats from context
- **Lines 195-213:** Updated `handleSave()` to save to Firestore

**Key code:**
```typescript
const handleSave = async () => {
  if (!user?.uid) return;

  try {
    setIsLoading(true);

    // Save to OnboardingContext in Firestore
    const updatedContext = await OnboardingContextService.updatePhysicalStats(user.uid, stats);

    // Notify parent component
    onUpdate?.(updatedContext);

    console.log('Physical stats saved:', stats);
  } catch (error) {
    console.error('Error saving physical stats:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### 4. **Connected PhysicalStatsManager to settings page**
**File:** `src/app/settings/page.tsx`
**Lines:** 262-265

```typescript
<PhysicalStatsManager
  context={onboardingContext}
  onUpdate={setOnboardingContext}
/>
```

---

## Manual Testing Checklist

### ✅ Pre-Test Setup
1. **Start dev server:** `npm run dev`
2. **Open browser:** http://localhost:9001
3. **Sign in** with your account
4. **Open browser DevTools** (F12) → Console tab

### ✅ Test 1: Save Physical Stats
1. Navigate to **Settings** page
2. Click **Physical Stats** tab
3. Update the following:
   - Age: `25`
   - Height: `180 cm`
   - Weight: `75 kg`
   - Gender: `male`
   - Activity Level: `very_active`
4. Click **Save** button
5. **Check console** for log: `Physical stats saved: {...}`
6. **Check for errors** - there should be NO red errors

**Expected Console Output:**
```
Physical stats saved: {age: 25, height: {...}, weight: {...}, ...}
```

### ✅ Test 2: Verify Persistence (Reload Page)
1. **Refresh the page** (F5 or Ctrl+R)
2. Navigate back to **Settings → Physical Stats**
3. **Verify** all your values are still there:
   - Age should be `25`
   - Height should be `180 cm`
   - Weight should be `75 kg`
   - Activity Level should be `very_active`
   - BMR and TDEE should be calculated values

**If values are missing:** There's an issue with save/load

### ✅ Test 3: Update and Re-Save
1. Change age to `26`
2. Change weight to `77 kg`
3. Click **Save**
4. Refresh the page
5. Verify new values persisted

### ✅ Test 4: Check Firestore Directly
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Firestore Database**
4. Navigate to `onboarding_contexts` collection
5. Find your user document (by your userId)
6. **Verify `physicalStats` field exists** with your data:

```json
{
  "userId": "your-user-id",
  "fitnessGoals": {...},
  "physicalStats": {
    "age": 26,
    "height": {
      "value": 180,
      "unit": "cm"
    },
    "weight": {
      "value": 77,
      "unit": "kg"
    },
    "gender": "male",
    "activityLevel": "very_active",
    "bmr": 1820,
    "tdee": 2992
  },
  ...
}
```

### ✅ Test 5: AI Chat Access
1. Navigate to **Chat** page
2. Send a message asking about nutrition
3. **Check browser console** for AI logs
4. Look for: `📋 User context fetched: Found`
5. Look for: `🎭 Using personalized AI: ...`

**Expected:** AI should have access to your physical stats for nutrition advice

---

## Common Issues & Solutions

### Issue 1: "Physical stats saved" but not persisting after refresh
**Cause:** `updatePhysicalStats()` not being called
**Solution:** Check browser console for errors during save

### Issue 2: Stats don't load on page refresh
**Cause:** Settings page not loading `onboardingContext`
**Solution:** Check that `useEffect` in settings page loads context

### Issue 3: Save button does nothing
**Cause:** User not authenticated or service error
**Solution:** Check console for errors, verify user is signed in

### Issue 4: TypeScript errors
**Run:** `npm run typecheck`
**Fix:** Address any type mismatches

---

## Verification Questions

After running all tests, answer these:

1. ✅ Do physical stats save successfully? (Check console log)
2. ✅ Do stats persist after page refresh?
3. ✅ Can you update stats and see changes?
4. ✅ Does the `physicalStats` field exist in Firestore?
5. ✅ Are there NO errors in browser console?
6. ✅ Does AI chat have access to the data?

**If all YES:** Physical stats are working correctly! ✨
**If any NO:** Note which test failed and share the console errors

---

## Debug Information to Collect

If there are issues, collect this info:

**Browser Console:**
```
Right-click → Inspect → Console tab
Copy all red errors and warnings
```

**Network Tab:**
```
1. Open DevTools → Network tab
2. Click Save button
3. Look for requests to `/api/` or Firestore
4. Check if any failed (red status codes)
```

**Firestore Rules:**
```
Check that onboarding_contexts rules allow:
- Read: if request.auth != null && request.auth.uid == userId
- Write: if request.auth != null && request.auth.uid == userId
```

---

## Expected Behavior Summary

✅ **Physical stats should:**
1. Save to `onboarding_contexts/{userId}/physicalStats`
2. Load when settings page opens
3. Update when you change and save
4. Persist across page refreshes
5. Be accessible to AI chat for personalization
