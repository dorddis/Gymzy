# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gymzy is an AI-powered fitness companion built with Next.js 15, React 18, TypeScript, and Firebase. It provides smart workout tracking, muscle activation visualization, AI chat assistance, and comprehensive fitness analytics.

**Tech Stack:**
- **Frontend**: Next.js 15.2.3 (App Router), React 18.3.1, TypeScript 5, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore), Vercel hosting
- **AI Services**: Google AI Studio (Gemini), Groq API, Firebase Genkit
- **UI Components**: shadcn/ui, Radix UI primitives
- **State Management**: React Context (AuthContext, WorkoutContext)
- **Forms**: React Hook Form + Zod validation
- **Data Visualization**: Recharts
- **Media Storage**: Cloudinary

## Development Commands

### Local Development
```bash
# Start development server on port 9001
npm run dev

# Start Genkit AI development environment
npm run genkit:watch
```

### Building & Type Checking
```bash
# Build for production
npm run build

# Type check without emitting files
npm run typecheck

# Lint code
npm run lint
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (no watch, with coverage)
npm run test:ci

# Debug test issues (detect open handles)
npm run test:debug
```

### Firebase Deployment
```bash
# Deploy storage rules
npm run deploy:storage

# Deploy CORS configuration
npm run deploy:cors
```

## Architecture

### Directory Structure

```
src/
├── app/                      # Next.js App Router pages & API routes
│   ├── api/                  # Server-side API endpoints
│   │   ├── ai/              # AI chat & generation endpoints
│   │   ├── internal/        # Internal secure API routes
│   │   └── special-sets/    # Special workout set operations
│   ├── auth/                # Authentication page
│   ├── chat/                # AI chat interface
│   ├── log-workout/[id]/    # Dynamic workout logging
│   └── [page]/              # Other app pages
├── components/              # React components organized by feature
│   ├── chat/               # Chat UI components
│   ├── dashboard/          # Dashboard & home components
│   ├── error-boundaries/   # Error boundary components
│   ├── layout/             # Layout components (header, nav)
│   ├── profile/            # User profile components
│   ├── settings/           # Settings UI
│   ├── ui/                 # shadcn/ui components
│   └── workout/            # Workout tracking components
├── contexts/               # React Context providers
│   ├── AuthContext.tsx     # Authentication state
│   └── WorkoutContext.tsx  # Active workout state
├── hooks/                  # Custom React hooks
├── lib/                    # Core utilities & configuration
│   ├── constants.ts        # App constants & muscle definitions
│   ├── env-config.ts       # Environment variable validation
│   ├── firebase.ts         # Firebase initialization
│   ├── logger.ts           # Structured logging service
│   ├── secure-ai-client.ts # Secure AI API client
│   ├── validation/         # Zod validation schemas
│   └── [other utilities]
├── services/               # Business logic & data access
│   ├── core/              # Core services (user, workout, chat)
│   ├── ai/                # AI-specific services
│   ├── data/              # Data fetching & manipulation
│   ├── infrastructure/    # Infrastructure services
│   ├── media/             # Media upload & processing
│   └── social/            # Social features (feed, following)
├── types/                  # TypeScript type definitions
│   ├── api.ts             # API types
│   ├── chat.ts            # Chat types
│   ├── common.ts          # Shared types
│   ├── user.ts            # User & profile types
│   └── workout.ts         # Workout & exercise types
└── ai/                     # Firebase Genkit AI configuration
```

### Key Architectural Patterns

**1. Service Layer Architecture**
- All business logic lives in `/src/services/`
- Services are organized by domain: core, AI, data, infrastructure, media, social
- Core services include: `ai-chat-service.ts`, `workout-service.ts`, `unified-user-profile-service.ts`

**2. Type-Safe Validation**
- All user inputs validated using Zod schemas in `/src/lib/validation/`
- Separate schema files: `chat-schemas.ts`, `user-schemas.ts`, `workout-schemas.ts`
- Schemas are used both client-side (forms) and server-side (API routes)

**3. Secure API Pattern**
- API keys are **server-side only** (no NEXT_PUBLIC_ prefix for secrets)
- Client -> Server API route -> External AI service
- All AI calls go through `/src/app/api/ai/*` or `/src/app/api/internal/*`
- Use `secure-ai-client.ts` for API calls with proper error handling

**4. Firebase Integration**
- Firestore collections: `users`, `workouts`, `chats`, `user_profiles`, `workout_posts`, `feed_posts`
- Security rules in `firestore.rules` (currently permissive for development)
- Authentication managed via Firebase Auth with `AuthContext`

**5. Component Organization**
- Components grouped by feature domain (not by type)
- UI primitives from shadcn/ui in `/src/components/ui/`
- Error boundaries wrap critical sections
- Anatomy visualization uses custom SVG components

**6. State Management**
- Global auth state: `AuthContext` (user, loading, auth methods)
- Workout state: `WorkoutContext` (active workout, exercises, sets)
- Server state: TanStack Query for Firebase data
- Form state: React Hook Form with Zod resolvers

### Important Files

**Configuration & Setup:**
- `src/lib/env-config.ts` - Environment variable validation (validates all required env vars on startup)
- `src/lib/firebase.ts` - Firebase client initialization
- `src/lib/constants.ts` - App constants including `Muscle` enum and muscle definitions
- `next.config.js` - Custom webpack config for SVG-as-components via @svgr/webpack
- `jest.config.js` - Comprehensive test configuration with coverage thresholds

**Core Services:**
- `src/services/core/ai-chat-service.ts` - AI chat functionality with streaming
- `src/services/core/workout-service.ts` - Workout CRUD operations
- `src/services/core/unified-user-profile-service.ts` - User profile management
- `src/services/core/production-agentic-service.ts` - Advanced agentic AI service

**Security & Logging:**
- `src/lib/logger.ts` - Structured logging with levels (debug, info, warn, error)
- `src/lib/secure-ai-client.ts` - Secure AI client with retry logic and error handling
- `firestore.rules` - Firestore security rules (NOTE: currently permissive for development)

**Key Types:**
- `src/types/workout.ts` - Workout, Exercise, Set, MuscleActivation types
- `src/types/user.ts` - User, UserProfile, UserSettings types
- `src/types/chat.ts` - ChatMessage, ChatSession types

### SVG Muscle Visualization

The app features interactive front/back body muscle visualization:
- SVG files are imported as React components via `@svgr/webpack`
- Muscle groups are defined in `Muscle` enum (src/lib/constants.ts)
- Individual muscle paths can be highlighted based on workout data
- Toggle between front and back views in workout tracking UI

## Testing Strategy

**Coverage Requirements:**
- Global: 70% (branches, functions, lines, statements)
- Core services (`src/services/core/`): 80%
- Validation schemas (`src/lib/validation/`): 85%

**Test Organization:**
- Test files in `__tests__/` directory at root
- Can also place tests adjacent to source: `src/**/__tests__/**/*.test.ts`
- Mocks in `__mocks__/` (Firebase, Next.js router, etc.)

**Running Specific Tests:**
```bash
# Run tests matching pattern
npm test -- --testNamePattern="workout"

# Run specific test file
npm test -- __tests__/services/workout-service.test.ts

# Update snapshots
npm test -- -u
```

## Security Guidelines

**CRITICAL:** This app handles user data and AI API keys. Follow these rules strictly:

1. **Never expose API secrets client-side**
   - ❌ `NEXT_PUBLIC_GROQ_API_KEY` (BAD)
   - ✅ `GROQ_API_KEY` (GOOD - server-side only)

2. **All AI API calls must go through server routes**
   - Client components call `/api/ai/*` or `/api/internal/*`
   - Server routes use secrets from `process.env`
   - Use `secure-ai-client.ts` for external calls

3. **Input validation is mandatory**
   - Validate with Zod schemas from `src/lib/validation/`
   - Validate on both client (forms) and server (API routes)
   - Never trust client input

4. **Firestore security rules**
   - Current rules are permissive for development
   - Before production: restrict rules to owner-only access
   - Users should only read/write their own data

5. **Error handling**
   - Use `logger.ts` for structured logging
   - Never expose internal errors to client
   - Use error boundaries for React components

## Environment Variables

Required environment variables (see `.env.local.example`):

**AI Services:**
- `NEXT_PUBLIC_GOOGLE_AI_API_KEY` - Google Gemini API (used client-side, consider moving server-side)
- `GROQ_API_KEY` - Groq API (server-side only)
- `NEXT_PUBLIC_GROQ_MODEL_NAME` - Groq model name (default: "llama3-8b-8192")

**Firebase:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**App Configuration:**
- `NODE_ENV` - "development" | "production"
- `NEXT_PUBLIC_APP_ENV` - "development" | "staging" | "production"
- `NEXT_PUBLIC_APP_URL` - App URL (e.g., "http://localhost:9001")

**Note:** `env-config.ts` validates all required variables on startup and will throw errors if missing.

## Cloudinary Setup

The app uses Cloudinary for media storage. Two upload presets are required:

1. **gymzy_profiles** - Profile pictures
   - Folder: `users/{userId}/profile`
   - Max size: 5MB
   - Formats: jpg, png, webp

2. **gymzy_workouts** - Workout media
   - Folder: `users/{userId}/workouts/{workoutId}`
   - Max size: 10MB
   - Formats: jpg, png, gif, mp4, mov

## Common Development Patterns

### Adding a New API Route

1. Create route file in `src/app/api/[feature]/route.ts`
2. Implement HTTP methods (GET, POST, etc.)
3. Validate inputs with Zod schemas
4. Use `logger` for structured logging
5. Return NextResponse with proper status codes
6. Handle errors gracefully

Example:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { mySchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = mySchema.parse(body);

    // Business logic here

    logger.info('Operation successful', { data: validated });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Operation failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Adding a New Zod Schema

1. Add schema to appropriate file in `src/lib/validation/`
2. Export schema and infer TypeScript type
3. Use schema in forms (React Hook Form resolver) and API routes

Example:
```typescript
import { z } from 'zod';

export const mySchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().positive(),
});

export type MyType = z.infer<typeof mySchema>;
```

### Working with Firebase

**Authentication:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, signIn, signOut } = useAuth();
```

**Firestore Operations:**
```typescript
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Read
const docRef = doc(db, 'collection', 'docId');
const docSnap = await getDoc(docRef);

// Write
await setDoc(docRef, data);

// Update
await updateDoc(docRef, updates);
```

### Logging Best Practices

Use the structured logger instead of console.log:

```typescript
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId: user.uid });
logger.warn('Deprecated API used', { endpoint: '/old-api' });
logger.error('Failed to save workout', { error, workoutId });
logger.debug('Processing data', { step: 'validation', data });
```

## Known Issues & Technical Debt

See `PRODUCTION_READINESS_REFACTORING_PLAN.md` for comprehensive list of issues and refactoring plan.

**High Priority:**
- Migrate remaining client-side API calls to server routes
- Tighten Firestore security rules before production
- Improve test coverage (currently 62% pass rate)
- Remove exposed API keys from documentation files

## Deployment

**Platform:** Vercel

**Configuration:** `vercel.json` includes:
- Security headers (XSS, frame options, content type)
- CORS configuration for API routes
- Function timeout: 30s for API routes
- Cron job: Daily cleanup at 2 AM UTC

**CI/CD:** GitHub Actions workflows in `.github/workflows/`:
- `ci.yml` - Run tests and type checking on PRs
- `deploy.yml` - Deploy to Vercel on merge to main
- `pr-checks.yml` - Comprehensive PR validation

## Path Aliases

TypeScript path aliases configured in `tsconfig.json`:
- `@/*` → `./src/*`

Usage:
```typescript
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { WorkoutService } from '@/services/core/workout-service';
```

## Important Notes

1. **Port Configuration**: Dev server runs on port **9001** (not the Next.js default 3000)
2. **SVG as Components**: SVGs are imported as React components via @svgr/webpack
3. **Test Timeout**: Tests have 10s timeout (configured in jest.config.js)
4. **TypeScript Strict Mode**: Enabled - all code must pass strict type checking
5. **Archive Policy**: Never delete files - move unused code to `/archive/` directory
6. **No Emojis in Code**: Never use emojis or special Unicode characters in filenames or logs (causes issues on Windows)
