# Build Errors Resolution Plan

## Current Build Errors

### Errors
*   `./src/app/stats/page.tsx:350:57 - Type error: Property 'weight' does not exist on type 'never'.`

### Warnings
*   **React Hook useEffect/useCallback missing dependencies:**
    *   `./src/app/chat/page.tsx`
    *   `./src/app/discover/page.tsx`
    *   `./src/app/feed/page.tsx`
    *   `./src/app/profile/[userId]/page.tsx`
    *   `./src/app/settings/page.tsx`
    *   `./src/app/workout/page.tsx`
    *   `./src/components/dashboard/ai-welcome-message.tsx`
    *   `./src/components/settings/physical-stats-manager.tsx`
    *   `./src/components/workout/media-upload.tsx`
    *   `./src/contexts/AuthContext.tsx`
    *   `./src/contexts/WorkoutContext.tsx`
*   **Using `<img>` instead of `<Image />`:**
    *   `./src/app/log-workout/[id]/page.tsx`
    *   `./src/components/profile/profile-picture-upload.tsx`
    *   `./src/components/workout/exercise-info-modal.tsx`
    *   `./src/components/workout/media-upload.tsx`
*   **Assign object to a variable before exporting as module default:**
    *   `./src/services/ai/ai-personality-service.ts`
    *   `./src/services/ai/groq-service.ts`
    *   `./src/services/ai-service.ts`
    *   `./src/services/core/ai-chat-service.ts`
    *   `./src/services/core/user-discovery-service.ts`
    *   `./src/services/data/chat-history-service.ts`
    *   `./src/services/social/social-feed-service.ts`
    *   `./src/services/social/workout-sharing-service.ts`

## Resolution Plan

1.  **Fix Type Error in `src/app/stats/page.tsx`:**
    *   Investigate the `personalBestLift` type to understand why `weight` is `never`.
    *   Adjust the type definition or the access to `personalBestLift.weight` to resolve the type error.
2.  **Address React Hook Dependencies:**
    *   For each `useEffect` and `useCallback` warning, add the missing dependencies to their respective dependency arrays.
    *   If a dependency is not meant to trigger a re-run, consider using `useRef` or `useCallback` to memoize functions or values.
3.  **Replace `<img>` with `next/image`'s `<Image />` component:**
    *   Import `Image` from `next/image` in the relevant files.
    *   Replace `<img>` tags with `<Image />` components, ensuring proper `src`, `alt`, `width`, and `height` (or `fill`) props are provided for optimization.
4.  **Resolve "Assign object to a variable before exporting as module default" warnings:**
    *   Modify the export statements in the listed service files to assign the object to a named variable before exporting it as the default. This typically involves changing `export default { ... }` to `const service = { ... }; export default service;`.

This plan addresses all identified errors and warnings to ensure a clean build.
