# Import/Export Analysis and Build Issues Specification

## Current Build Issues Identified

### 1. Type Mismatch in Onboarding Page
**File**: `src/app/onboarding/page.tsx:147`
**Error**: `experienceLevel` does not exist in type `UserProfileUpdate`
**Root Cause**: The `UserProfileUpdate` interface only includes `fitnessLevel` but not `experienceLevel`

### 2. Duplicate User Profile Type Definitions
**Issue**: Multiple conflicting user profile interfaces across the codebase
- `src/types/user-profile.ts` - Has `experienceLevel` in `UserProfile` but not in `UserProfileUpdate`
- `src/types/user.ts` - Different `UserProfile` interface structure
- Both define different structures for user profiles

## Import/Export Mapping Analysis

### Core Type Definitions

#### User Profile Types
```typescript
// src/types/user-profile.ts
export interface UserProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'; // ✅ Has experienceLevel
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';    // ✅ Has fitnessLevel
  // ... other fields
}

export interface UserProfileUpdate {
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';   // ✅ Has fitnessLevel
  // ❌ MISSING: experienceLevel field
  // ... other fields
}

// src/types/user.ts
export interface UserProfile {
  fitnessLevel: FitnessLevel;  // ❌ Different structure, conflicts with user-profile.ts
  // ❌ MISSING: experienceLevel field
  // ... different field structure
}
```

#### Service Dependencies
```typescript
// src/services/core/unified-user-profile-service.ts
import { UserProfile, UserProfileUpdate } from '@/types/user-profile';
// ✅ Uses the correct types from user-profile.ts

// src/contexts/AuthContext.tsx  
import { UserProfile, UserProfileUpdate } from '@/types/user-profile';
// ✅ Uses the correct types from user-profile.ts

// src/app/onboarding/page.tsx
// ❌ Tries to use experienceLevel in UserProfileUpdate but it doesn&apos;t exist
```

### Services Directory Structure Issues

#### Current Structure (Problematic)
```
src/services/
├── ai-service.ts                           # ❌ Legacy, should be removed
├── ai/                                     # ✅ Good organization
│   ├── ai-personality-service.ts
│   ├── ai-recommendations-service.ts
│   ├── ai-workout-tools.ts
│   ├── enhanced-workout-tools.ts
│   ├── groq-service.ts
│   ├── intelligent-agent-service.ts
│   ├── intelligent-ai-router.ts            # ❌ May be redundant
│   ├── intelligent-exercise-matcher.ts
│   ├── intelligent-workout-generator.ts
│   ├── intelligent-workout-modifier.ts
│   ├── multi-step-reasoning.ts
│   └── production-agentic-ai.ts
├── core/                                   # ✅ Good organization
│   ├── ai-chat-service.ts
│   ├── production-agentic-service.ts
│   ├── unified-user-profile-service.ts
│   ├── user-discovery-service.ts
│   └── workout-service.ts
├── data/                                   # ✅ Good organization
│   ├── chat-history-service.ts
│   ├── contextual-data-service.ts
│   ├── onboarding-context-service.ts
│   └── workout-context-bridge.ts
├── infrastructure/                         # ✅ Good organization
│   ├── agentic-state-manager.ts
│   ├── exercise-info-tool.ts
│   ├── firebase-state-adapter.ts
│   ├── mathematical-validator.ts
│   └── robust-tool-executor.ts
├── media/                                  # ✅ Good organization
│   ├── media-service.ts
│   └── profile-picture-service.ts
└── social/                                 # ✅ Good organization
    ├── notification-service.ts
    ├── social-feed-service.ts
    └── workout-sharing-service.ts
```

### Import Dependency Analysis

#### High-Usage Services (Critical - Don&apos;t Remove)
- `production-agentic-service.ts` (15+ imports)
- `ai-chat-service.ts` (12+ imports) 
- `workout-service.ts` (10+ imports)
- `user-discovery-service.ts` (8+ imports)

#### Low/No Usage Services (Safe to Remove)
- `ai-service.ts` (1 import - legacy)
- `intelligent-ai-router.ts` (3 imports - functionality moved)

#### Potential Circular Dependencies
```typescript
// src/services/core/production-agentic-service.ts
import { generateAIResponse } from '../ai-service';  // ❌ Imports legacy ai-service

// src/services/data/workout-context-bridge.ts  
import { getRecentWorkouts } from './workout-service';  // ❌ Wrong path, should be '../core/workout-service'
```

### Component Import Issues

#### Missing Imports
```typescript
// src/components/workout/workout-summary-screen.tsx
// Commented out imports that may still be needed:
// import { ScrollArea } from '@/components/ui/scroll-area'; // Remove ScrollArea import
// import { ExerciseInfoModal } from '@/components/workout/exercise-info-modal'; // Keep this for now for the help button
```

#### SVG Asset Imports
```typescript
// src/components/workout/muscle-activation-svg.tsx
import FrontFullBody from '@/assets/images/front-full-body-with-all-muscles-showing.svg';
import BackFullBody from '@/assets/images/back-full-body-with-all-muscles-showing.svg';
// ✅ These imports look correct
```

## Inconsistencies and Loops

### 1. Type Definition Conflicts
**Problem**: Two different `UserProfile` interfaces
**Files**: 
- `src/types/user-profile.ts` 
- `src/types/user.ts`
**Impact**: Causes confusion and potential runtime errors

### 2. Missing Type Properties
**Problem**: `UserProfileUpdate` missing `experienceLevel` field
**Impact**: Build failure in onboarding page

### 3. Legacy Service Dependencies
**Problem**: Production services still importing legacy services
**Impact**: Potential for inconsistent behavior

### 4. Incorrect Import Paths
**Problem**: Some services importing from wrong paths
**Impact**: Runtime errors and build issues

## Implementation Steps to Fix Problems

### Phase 1: Fix Immediate Build Issues
1. **Fix UserProfileUpdate Type**
   - Add `experienceLevel?: 'beginner' | 'intermediate' | 'advanced';` to `UserProfileUpdate` interface
   - Update onboarding page to use correct field name

2. **Resolve Type Conflicts**
   - Consolidate user profile types into single source of truth
   - Choose `src/types/user-profile.ts` as primary definition
   - Update all imports to use consistent types

### Phase 2: Clean Up Import Dependencies  
1. **Remove Legacy Services**
   - Remove `src/services/ai-service.ts`
   - Update `production-agentic-service.ts` to use proper AI services
   - Remove `intelligent-ai-router.ts` if redundant

2. **Fix Import Paths**
   - Update `workout-context-bridge.ts` import path
   - Verify all service imports use correct paths

### Phase 3: Verify and Test
1. **Run Build Verification**
   - Execute `npm run build` to verify fixes
   - Run `npm run typecheck` for type validation
   - Test key functionality

2. **Import Validation**
   - Verify no circular dependencies
   - Ensure all imports resolve correctly
   - Check for unused imports

### Phase 4: Cleanup and Organization
1. **Remove Unused Files**
   - Archive or remove test files and debug services
   - Clean up commented imports
   - Remove redundant service files

2. **Optimize Structure**
   - Ensure services are properly organized
   - Verify component imports are clean
   - Update documentation

## Detailed Import/Export Verification

### Critical Import Chains to Verify

#### 1. Authentication Flow
```typescript
// src/contexts/AuthContext.tsx
import { UnifiedUserProfileService } from '@/services/core/unified-user-profile-service';
import { UserProfile, UserProfileUpdate } from '@/types/user-profile';

// src/services/core/unified-user-profile-service.ts
import { UserProfile, UserProfileUpdate, ProfileConverter } from '@/types/user-profile';
import { db } from '@/lib/firebase';

// ✅ Chain looks good, but need to verify ProfileConverter export
```

#### 2. AI Service Chain
```typescript
// src/services/core/production-agentic-service.ts
import { generateAIResponse } from '../ai-service';  // ❌ PROBLEM: Legacy import

// Should be:
import { generateAIResponse } from '../ai/groq-service';
// OR
import { generateAIResponse } from '../ai/production-agentic-ai';
```

#### 3. Workout Context Chain
```typescript
// src/services/data/workout-context-bridge.ts
import { getRecentWorkouts } from './workout-service';  // ❌ PROBLEM: Wrong path

// Should be:
import { getRecentWorkouts } from '../core/workout-service';
```

#### 4. Component Import Verification
```typescript
// src/components/workout/muscle-activation-svg.tsx
import { Muscle, MUSCLE_VOLUME_THRESHOLDS } from '@/lib/constants';
// ✅ Verify these exports exist in constants.ts

// src/components/workout/workout-summary-screen.tsx
import { Exercise, ExerciseWithSets } from '@/types/exercise';
// ✅ Verify these types are properly exported
```

### Export Verification Checklist

#### Type Exports to Verify
- [ ] `@/types/user-profile` exports `UserProfile`, `UserProfileUpdate`, `ProfileConverter`
- [ ] `@/types/exercise` exports `Exercise`, `ExerciseWithSets`
- [ ] `@/types/user` exports are not conflicting with user-profile types
- [ ] `@/lib/constants` exports `Muscle`, `MUSCLE_VOLUME_THRESHOLDS`

#### Service Exports to Verify
- [ ] `@/services/core/unified-user-profile-service` exports `UnifiedUserProfileService`
- [ ] `@/services/core/workout-service` exports `getRecentWorkouts`
- [ ] `@/services/ai/groq-service` exports `generateAIResponse`
- [ ] `@/lib/firebase` exports `db`

### Potential Circular Dependencies to Check

#### 1. AI Services Circular Reference
```
production-agentic-service.ts → ai-service.ts → groq-service.ts → production-agentic-ai.ts
```
**Risk**: High - Could cause runtime issues

#### 2. User Profile Services
```
AuthContext.tsx → unified-user-profile-service.ts → user-profile.ts
```
**Risk**: Low - Linear dependency chain

#### 3. Workout Context Bridge
```
workout-context-bridge.ts → workout-service.ts → contextual-data-service.ts
```
**Risk**: Medium - Need to verify no back-references

### Files That Need Import Path Updates

#### Immediate Fixes Required
1. **src/services/data/workout-context-bridge.ts**
   ```typescript
   // Current (WRONG):
   import { getRecentWorkouts } from './workout-service';

   // Fix to:
   import { getRecentWorkouts } from '../core/workout-service';
   ```

2. **src/services/core/production-agentic-service.ts**
   ```typescript
   // Current (LEGACY):
   import { generateAIResponse } from '../ai-service';

   // Fix to:
   import { generateAIResponse } from '../ai/groq-service';
   ```

3. **src/types/user-profile.ts**
   ```typescript
   // Current (MISSING):
   export interface UserProfileUpdate {
     fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
     // Missing experienceLevel
   }

   // Fix to:
   export interface UserProfileUpdate {
     fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
     experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
     // ... other fields
   }
   ```

### Build Verification Commands
```bash
# 1. Type checking
npm run typecheck

# 2. Build verification
npm run build

# 3. Lint checking
npm run lint

# 4. Dependency analysis
npx depcheck

# 5. Import analysis
npx madge --circular src/
```

## VERIFIED EXPORT ANALYSIS

### ✅ Confirmed Exports (Working)
1. **src/lib/constants.ts**
   - ✅ `export enum Muscle` - Contains all muscle definitions
   - ✅ `export const MUSCLE_VOLUME_THRESHOLDS` - Contains LOW, MEDIUM, HIGH thresholds

2. **src/types/exercise.ts**
   - ✅ `export interface Exercise` - Basic exercise interface
   - ✅ `export interface ExerciseWithSets` - Exercise with sets data

3. **src/services/core/workout-service.ts**
   - ✅ `export const getRecentWorkouts` - Function to get recent workouts

4. **src/services/ai/groq-service.ts**
   - ✅ `export const generateAIResponse` - Main AI response function
   - ✅ `export const generateCharacterStreamingResponse` - Streaming function

5. **src/types/user-profile.ts**
   - ✅ `export interface UserProfile` - Has both `fitnessLevel` and `experienceLevel`
   - ❌ `export interface UserProfileUpdate` - MISSING `experienceLevel` field

### ❌ Confirmed Import Issues (Need Fixing)

#### 1. **CRITICAL: Type Mismatch in Onboarding**
**File**: `src/app/onboarding/page.tsx:147`
**Issue**: Using `experienceLevel` in `UserProfileUpdate` but field doesn&apos;t exist
**Current Code**:
```typescript
await updateUserProfile({
  hasCompletedOnboarding: true,
  fitnessGoals: [onboardingData.primaryGoal, ...onboardingData.secondaryGoals].filter(Boolean),
  experienceLevel: onboardingData.experienceLevel <= 3 ? 'beginner' :  // ❌ Field doesn&apos;t exist
                  onboardingData.experienceLevel <= 7 ? 'intermediate' : 'advanced',
  preferredWorkoutTypes: onboardingData.workoutTypes
});
```

#### 2. **Wrong Import Path in Workout Context Bridge**
**File**: `src/services/data/workout-context-bridge.ts:6`
**Issue**: Importing from wrong path
**Current Code**:
```typescript
import { getRecentWorkouts } from './workout-service';  // ❌ Wrong path
```
**Should be**:
```typescript
import { getRecentWorkouts } from '../core/workout-service';  // ✅ Correct path
```

#### 3. **Legacy Import in Production Service**
**File**: `src/services/core/production-agentic-service.ts:10`
**Issue**: Importing from legacy ai-service
**Current Code**:
```typescript
import { generateAIResponse, generateCharacterStreamingResponse } from '../ai-service';  // ❌ Legacy
```
**Should be**:
```typescript
import { generateAIResponse, generateCharacterStreamingResponse } from '../ai/groq-service';  // ✅ Modern
```

#### 4. **Problematic Import in Workout Generator**
**File**: `src/services/ai/intelligent-workout-generator.ts:6`
**Issue**: Importing from wrong path
**Current Code**:
```typescript
import { EXERCISES, Exercise, Muscle } from '../../home/user/studio/src/lib/constants';  // ❌ Wrong path
```
**Should be**:
```typescript
import { EXERCISES, Exercise, Muscle } from '@/lib/constants';  // ✅ Correct path
```

#### 5. **Dynamic Require in Workout Context Bridge**
**File**: `src/services/data/workout-context-bridge.ts:95`
**Issue**: Using require() for constants
**Current Code**:
```typescript
const { EXERCISES } = require('../../home/user/studio/src/lib/constants');  // ❌ Wrong path + require
```
**Should be**:
```typescript
import { EXERCISES } from '@/lib/constants';  // ✅ Proper import
```

## FINAL IMPLEMENTATION STEPS

### Phase 1: Fix Critical Type Issues (IMMEDIATE)

#### Step 1.1: Fix UserProfileUpdate Interface
**File**: `src/types/user-profile.ts`
**Action**: Add missing `experienceLevel` field to `UserProfileUpdate`

```typescript
// Current UserProfileUpdate interface (line ~154)
export interface UserProfileUpdate {
  displayName?: string;
  bio?: string;
  profilePicture?: string;
  fitnessGoals?: string[];
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  // ADD THIS LINE:
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredWorkoutTypes?: string[];
  // ... rest of fields
}
```

#### Step 1.2: Fix Onboarding Page (Alternative Solution)
**File**: `src/app/onboarding/page.tsx`
**Action**: Use `fitnessLevel` instead of `experienceLevel` OR wait for Step 1.1

```typescript
// Option A: Use fitnessLevel instead
await updateUserProfile({
  hasCompletedOnboarding: true,
  fitnessGoals: [onboardingData.primaryGoal, ...onboardingData.secondaryGoals].filter(Boolean),
  fitnessLevel: onboardingData.experienceLevel <= 3 ? 'beginner' :  // ✅ Use fitnessLevel
               onboardingData.experienceLevel <= 7 ? 'intermediate' : 'advanced',
  preferredWorkoutTypes: onboardingData.workoutTypes
});
```

### Phase 2: Fix Import Paths (IMMEDIATE)

#### Step 2.1: Fix Workout Context Bridge Import
**File**: `src/services/data/workout-context-bridge.ts`
**Line 6**: Change import path

```typescript
// Change from:
import { getRecentWorkouts } from './workout-service';

// To:
import { getRecentWorkouts } from '../core/workout-service';
```

#### Step 2.2: Fix Production Agentic Service Import
**File**: `src/services/core/production-agentic-service.ts`
**Line 10**: Change import path

```typescript
// Change from:
import { generateAIResponse, generateCharacterStreamingResponse } from '../ai-service';

// To:
import { generateAIResponse, generateCharacterStreamingResponse } from '../ai/groq-service';
```

#### Step 2.3: Fix Workout Generator Import
**File**: `src/services/ai/intelligent-workout-generator.ts`
**Line 6**: Fix import path

```typescript
// Change from:
import { EXERCISES, Exercise, Muscle } from '../../home/user/studio/src/lib/constants';

// To:
import { EXERCISES, Exercise, Muscle } from '@/lib/constants';
```

#### Step 2.4: Fix Workout Context Bridge Constants Import
**File**: `src/services/data/workout-context-bridge.ts`
**Line 95**: Replace require with proper import

```typescript
// Add to top of file:
import { EXERCISES } from '@/lib/constants';

// Remove line 95:
// const { EXERCISES } = require('../../home/user/studio/src/lib/constants');
```

### Phase 3: Verification and Testing

#### Step 3.1: Run Build Tests
```bash
npm run typecheck  # Should pass after fixes
npm run build      # Should complete successfully
npm run lint       # Check for any remaining issues
```

#### Step 3.2: Test Key Functionality
- Test onboarding completion
- Test AI chat functionality
- Test workout creation
- Verify no runtime import errors

### Phase 4: Optional Cleanup (AFTER VERIFICATION)

#### Step 4.1: Remove Legacy Files (Only if unused)
- `src/services/ai-service.ts` (after confirming no other imports)
- `src/services/ai/intelligent-ai-router.ts` (if redundant)

#### Step 4.2: Consolidate User Types
- Consider merging `src/types/user.ts` and `src/types/user-profile.ts`
- Ensure no conflicts between different UserProfile definitions

## RISK ASSESSMENT

### High Risk (Fix Immediately)
- ❌ Type mismatch in onboarding (blocks build)
- ❌ Wrong import paths (runtime errors)

### Medium Risk (Fix Soon)
- ⚠️ Legacy service dependencies (inconsistent behavior)
- ⚠️ Dynamic requires (bundling issues)

### Low Risk (Cleanup Later)
- 📝 Duplicate type definitions (confusion)
- 📝 Unused legacy files (clutter)

## ADDITIONAL IMPORT ISSUES DISCOVERED

### ❌ More Legacy AI Service Imports Found

#### 6. **Intelligent AI Router Legacy Import**
**File**: `src/services/ai/intelligent-ai-router.ts:6`
**Issue**: Also importing from legacy ai-service
**Current Code**:
```typescript
import { generateAIResponse, generateCharacterStreamingResponse } from '../ai-service';  // ❌ Legacy
```
**Should be**:
```typescript
import { generateAIResponse, generateCharacterStreamingResponse } from './groq-service';  // ✅ Modern
```

### 🔍 COMPLETE LEGACY AI-SERVICE IMPORT AUDIT

**Files importing from legacy `ai-service.ts`:**
1. ✅ `src/services/core/production-agentic-service.ts:10` - IDENTIFIED
2. ✅ `src/services/ai/intelligent-ai-router.ts:6` - IDENTIFIED

**Total Legacy Imports**: 2 files need updating

### 📋 FINAL VERIFICATION CHECKLIST

#### Critical Fixes (Must Complete)
- [ ] **Fix UserProfileUpdate type** - Add `experienceLevel` field
- [ ] **Fix onboarding page** - Use correct field or wait for type fix
- [ ] **Fix workout-context-bridge import** - Change to `../core/workout-service`
- [ ] **Fix production-agentic-service import** - Change to `../ai/groq-service`
- [ ] **Fix intelligent-ai-router import** - Change to `./groq-service`
- [ ] **Fix workout-generator import** - Change to `@/lib/constants`
- [ ] **Fix workout-context-bridge require** - Replace with proper import

#### Verification Steps
- [ ] **Run `npm run typecheck`** - Should pass with no errors
- [ ] **Run `npm run build`** - Should complete successfully
- [ ] **Test onboarding flow** - Should complete without errors
- [ ] **Test AI chat** - Should work with proper imports
- [ ] **Test workout creation** - Should work with fixed imports

#### Optional Cleanup (After Verification)
- [ ] **Remove `src/services/ai-service.ts`** - After confirming no other imports
- [ ] **Remove `src/services/ai/intelligent-ai-router.ts`** - If redundant
- [ ] **Consolidate user types** - Merge conflicting UserProfile definitions

## SUMMARY

This specification has identified **7 critical import/export issues** that are causing the build failure:

1. **Type Mismatch**: `experienceLevel` missing from `UserProfileUpdate`
2. **Wrong Path**: `workout-context-bridge.ts` importing from wrong path
3. **Legacy Import**: `production-agentic-service.ts` using legacy ai-service
4. **Legacy Import**: `intelligent-ai-router.ts` using legacy ai-service
5. **Wrong Path**: `intelligent-workout-generator.ts` using wrong constants path
6. **Dynamic Require**: `workout-context-bridge.ts` using require() instead of import
7. **Build Error**: Onboarding page using non-existent type field

**Priority**: Fix items 1-7 immediately to resolve build issues. Items in "Optional Cleanup" can be addressed after verification.

**Estimated Fix Time**: 15-30 minutes for all critical fixes.

**Risk Level**: Low - All fixes are straightforward import/type corrections with no logic changes required.
