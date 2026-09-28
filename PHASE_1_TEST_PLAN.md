# Phase 1 Quick Action - Test Plan

**Date:** 2025-11-08
**Status:** In Progress
**Tester:** Manual testing by user

---

## Test Environment

- **URL:** http://localhost:9001
- **Test User:** dorddis2@gmail.com (UID: hHuIokDYEoM3MkAVqELo2SGRbx13)
- **Browser:** Chrome/Edge (recommended)
- **Mobile Testing:** Chrome DevTools responsive mode

---

## Test Categories

### 1. UI/UX Tests

#### 1.1 Button Visibility
- [x] **Logged Out State**
  - Action: Navigate to http://localhost:9001 without logging in
  - Expected: Quick Action button should NOT appear
  - Actual: ___________

- [x] **Logged In State**
  - Action: Sign in with test account
  - Expected: Purple/blue gradient ⚡️ button appears in bottom-right corner
  - Actual: ___________

- [x] **Button Positioning**
  - Action: Check button location on desktop
  - Expected: Fixed position, bottom-right, z-index 50
  - Actual: ___________

- [x] **Button Hover Effect**
  - Action: Hover over the ⚡️ button
  - Expected: Gradient darkens, shadow increases, icon scales up
  - Actual: ___________

#### 1.2 Dialog Modal
- [x] **Open Dialog**
  - Action: Click the ⚡️ button
  - Expected: Modal opens with input field, examples, and buttons
  - Actual: ___________

- [x] **Close Dialog - Cancel Button**
  - Action: Click "Cancel" button
  - Expected: Dialog closes, input cleared
  - Actual: ___________

- [x] **Close Dialog - Escape Key**
  - Action: Press Escape key while dialog is open
  - Expected: Dialog closes
  - Actual: ___________

- [x] **Input Auto-Focus**
  - Action: Open dialog
  - Expected: Input field is automatically focused
  - Actual: ___________

- [x] **Submit on Enter**
  - Action: Type command and press Enter
  - Expected: Command executes (same as clicking Execute button)
  - Actual: ___________

#### 1.3 Loading States
- [x] **Processing State**
  - Action: Submit a command
  - Expected: Button shows "Processing..." with spinner, input disabled
  - Actual: ___________

- [x] **Button Disabled During Processing**
  - Action: Try clicking Execute while already processing
  - Expected: Button is disabled, cannot submit twice
  - Actual: ___________

---

### 2. Navigation Commands

#### 2.1 Profile Navigation
- [x] **Command: "Go to profile"**
  - Expected Function: `navigateTo({ page: 'profile' })`
  - Expected Result: Navigate to /profile
  - Expected Toast: "Navigating to profile..."
  - Actual: ___________

- [x] **Command: "Show my profile"**
  - Expected Function: `navigateTo({ page: 'profile' })`
  - Expected Result: Navigate to /profile
  - Actual: ___________

#### 2.2 Stats Navigation
- [x] **Command: "Show my stats"**
  - Expected Function: `viewStats({})`
  - Expected Result: Navigate to /stats with stats data
  - Expected Toast: Stats summary message
  - Actual: ___________

- [x] **Command: "View my workout stats"**
  - Expected Function: `viewStats({})`
  - Expected Result: Navigate to /stats
  - Actual: ___________

#### 2.3 Workout Navigation
- [ ] **Command: "View my workouts"**
  - Expected Function: `viewWorkoutHistory({})`
  - Expected Result: Navigate to /workout
  - Actual: ___________

- [ ] **Command: "Show workout history"**
  - Expected Function: `viewWorkoutHistory({})`
  - Expected Result: Navigate to /workout
  - Actual: ___________

#### 2.4 Other Pages
- [ ] **Command: "Go to settings"**
  - Expected Function: `navigateTo({ page: 'settings' })`
  - Expected Result: Navigate to /settings
  - Actual: ___________

- [ ] **Command: "Show feed"**
  - Expected Function: `navigateTo({ page: 'feed' })`
  - Expected Result: Navigate to /feed
  - Actual: ___________

- [ ] **Command: "Go home"**
  - Expected Function: `navigateTo({ page: 'home' })`
  - Expected Result: Navigate to /
  - Actual: ___________

---

### 3. Workout Data Commands

#### 3.1 Personal Bests - Specific Exercise
- [ ] **Command: "What is my best bench press?"**
  - Expected Function: `getPersonalBests({ exerciseName: 'bench press' })`
  - Expected Result: Toast showing "Your best Bench Press: X lbs x Y reps"
  - Actual: ___________

- [ ] **Command: "Show my best squat"**
  - Expected Function: `getPersonalBests({ exerciseName: 'squat' })`
  - Expected Result: Toast with squat PR
  - Actual: ___________

- [ ] **Command: "What's my heaviest deadlift?"**
  - Expected Function: `getPersonalBests({ exerciseName: 'deadlift' })`
  - Expected Result: Toast with deadlift PR
  - Actual: ___________

#### 3.2 Personal Bests - All Exercises
- [ ] **Command: "What are my best lifts?"**
  - Expected Function: `getPersonalBests({ exerciseName: null })`
  - Expected Result: Toast with top 10 personal bests formatted list
  - Actual: ___________

- [ ] **Command: "Show all my PRs"**
  - Expected Function: `getPersonalBests({ exerciseName: null })`
  - Expected Result: Top 10 PRs sorted by weight
  - Actual: ___________

#### 3.3 Workout History
- [ ] **Command: "Show my last 5 workouts"**
  - Expected Function: `viewWorkoutHistory({ limit: 5 })`
  - Expected Result: Navigate to /workout, toast with count
  - Actual: ___________

---

### 4. Error Handling

#### 4.1 Invalid Commands
- [ ] **Command: "Make me a sandwich"**
  - Expected Result: Error toast "I don't know how to do that yet..."
  - Actual: ___________

- [ ] **Command: "asdfghjkl"**
  - Expected Result: Error toast or fallback to closest function
  - Actual: ___________

#### 4.2 Empty Input
- [ ] **Action: Click Execute with empty input**
  - Expected Result: Button disabled, cannot submit
  - Actual: ___________

- [ ] **Action: Submit only whitespace**
  - Expected Result: Button disabled (trimmed input is empty)
  - Actual: ___________

#### 4.3 Authentication Errors
- [ ] **Logout and attempt command**
  - Action: Sign out, open DevTools, manually call API
  - Expected Result: 401 Unauthorized error
  - Actual: ___________

---

### 5. Toast Notifications

#### 5.1 Success Toasts
- [ ] **Successful Navigation**
  - Expected: Green toast with success message
  - Actual: ___________

- [ ] **Successful Data Fetch**
  - Expected: Toast shows fetched data (e.g., personal bests)
  - Actual: ___________

#### 5.2 Error Toasts
- [ ] **API Error**
  - Expected: Red destructive toast with error message
  - Actual: ___________

- [ ] **Authentication Error**
  - Expected: Red toast "Authentication required. Please sign in."
  - Actual: ___________

---

### 6. Mobile Responsiveness

#### 6.1 Button on Mobile
- [ ] **Button Position**
  - Action: Open DevTools, set to iPhone viewport
  - Expected: Button still visible in bottom-right, not cut off
  - Actual: ___________

#### 6.2 Dialog on Mobile
- [ ] **Dialog Positioning**
  - Expected: Dialog positioned `bottom-20 right-4 left-4` on mobile
  - Expected: Dialog is responsive, fits screen width
  - Actual: ___________

- [ ] **Touch Interaction**
  - Expected: Button tap works, no double-tap zoom issues
  - Actual: ___________

---

### 7. Advanced Function Tests

#### 7.1 Profile Functions
- [ ] **Command: "Update my fitness goal"**
  - Expected Function: `updateFitnessGoals({})`
  - Actual: ___________

- [ ] **Command: "Show my achievements"**
  - Expected Function: `viewAchievements({})`
  - Actual: ___________

#### 7.2 Logging Workout
- [ ] **Command: "Log a new workout"**
  - Expected Function: `logWorkout({})`
  - Expected Result: Navigate to /log-workout/new
  - Actual: ___________

- [ ] **Command: "Start a workout"**
  - Expected Function: `logWorkout({})`
  - Expected Result: Navigate to /log-workout/new
  - Actual: ___________

---

## Server Log Verification

For each test, verify in the server logs:
- [ ] `[QuickAction] Processing request` appears
- [ ] `[QuickAction] LLM response` shows correct function
- [ ] `[QuickAction] Executing function` with correct args
- [ ] `[QuickAction] Function executed` with success: true
- [ ] No TypeScript errors or warnings
- [ ] Authentication logs show verified user

---

## Known Issues

### From Server Logs:
1. ✅ **Authentication working** - 401 errors when no auth header (expected behavior)
2. ✅ **Personal bests working** - Successfully fetched from 35 workouts
3. ✅ **LLM parsing working** - Correctly removes markdown code blocks

### To Investigate:
- [ ] Does LLM always choose the correct function?
- [ ] Are there any commands that fail consistently?
- [ ] Is the response time acceptable (<3 seconds)?

---

## Success Criteria

Phase 1 is considered successful if:
- ✅ **Security**: All requests require authentication
- [ ] **Accuracy**: >80% of commands execute correct function
- [ ] **Speed**: <3 seconds average response time
- [ ] **UX**: Button visible, modal works, toasts appear correctly
- [ ] **Mobile**: Works on mobile viewport
- [ ] **Error Handling**: Invalid commands show helpful errors

---

## Test Results Summary

**Total Tests:** 50+
**Passed:** ___
**Failed:** ___
**Blocked:** ___
**Success Rate:** ___%

---

## Next Steps After Testing

If all tests pass:
1. Mark Phase 1 as COMPLETE ✅
2. Document any issues found
3. Move to Phase 4: Simple Chaining implementation

If critical issues found:
1. Document issues in detail
2. Create bug fixes
3. Re-test failed cases
