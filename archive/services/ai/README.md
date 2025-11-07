# Archived AI Services

## ai-personality-service.ts

**Archived Date:** 2025-01-06

**Reason:** Deprecated in favor of unified `OnboardingContextService`

### Why was this archived?

This service created a duplicate data collection (`ai_personality_profiles`) that was disconnected from the AI chat system. The AI chat was reading from `onboarding_contexts` collection via `OnboardingContextService`, but onboarding was writing to `ai_personality_profiles`, causing the AI to have no access to user onboarding data.

### Migration

All functionality has been consolidated into:
- **Service:** `src/services/data/onboarding-context-service.ts`
- **Collection:** `onboarding_contexts` (Firestore)
- **Onboarding:** Uses `mapOnboardingDataToContext()` helper in `src/app/onboarding/page.tsx`

### Schema Mapping

The `OnboardingContext` schema is more comprehensive and properly structured:
- Better nested organization (fitnessGoals, experienceLevel, equipment, schedule, preferences, healthInfo)
- Aligned with AI chat system expectations
- More detailed fields for personalization

### Related Changes

- `src/app/onboarding/page.tsx`: Updated to use `OnboardingContextService.createOnboardingContext()`
- `src/types/user-profile.ts`: `AIPersonalityProfile` interface may also be removed in future cleanup
