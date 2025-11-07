# 🚀 Two-Week Remediation Plan - Gymzy Production Readiness

## Executive Summary

**Goal**: Fix authentication issues, improve navigation performance, and implement industry best practices.

**Timeline**: 2 weeks (10 working days)
**Current State**: 127 identified issues, app working locally but auth broken in production
**Target State**: Production-ready app with working auth, fast navigation, proper testing, and security

---

## 🎯 Success Criteria

### Week 1 Deliverables
- ✅ Users can sign in on deployed Vercel app
- ✅ Navigation is 3x faster (no Three.js bloat, code splitting enabled)
- ✅ Zero exposed API keys or secrets
- ✅ TypeScript compiles with zero errors (strict mode enabled)
- ✅ Error boundaries prevent app crashes

### Week 2 Deliverables
- ✅ 80%+ test coverage for critical paths
- ✅ Proper logging service (no console.log in production)
- ✅ CI/CD pipeline with automated testing
- ✅ Production monitoring and error tracking
- ✅ Documentation for team onboarding

---

## WEEK 1: Critical Fixes (Production Blockers)

### Day 1: Emergency Auth Fix (Your #1 Priority) 🚨

**Issue**: Users can't sign in on Vercel deployment
**Root Cause**: Likely missing/incorrect Firebase env vars in Vercel dashboard

#### Morning (2-3 hours)
**1.1 Audit Firebase Configuration**
```bash
# Check local .env.local for all Firebase vars
cat .env.local | grep FIREBASE

# Expected vars:
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

**1.2 Verify Vercel Environment Variables**
- [ ] Go to Vercel Dashboard → Project Settings → Environment Variables
- [ ] Verify ALL 6 Firebase env vars are set for Production environment
- [ ] Check for typos (common issue: extra spaces, wrong values)
- [ ] Ensure variables are scoped to "Production" AND "Preview" environments

**1.3 Add Debug Logging to Auth**
- [ ] Temporarily add console.log to `src/lib/firebase.ts` to verify config loaded
- [ ] Add try-catch around Firebase initialization
- [ ] Deploy and check Vercel logs for errors

#### Afternoon (2-3 hours)
**1.4 Implement Auth Error Boundary**
```typescript
// Create: src/components/error-boundaries/AuthErrorBoundary.tsx
// Wrap AuthProvider with error boundary to catch auth failures gracefully
```

**1.5 Test Auth Flow End-to-End**
- [ ] Sign up new user on deployed site
- [ ] Sign in existing user
- [ ] Test password reset
- [ ] Test session persistence on refresh
- [ ] Check browser console for errors

**Checkpoint**: Users should be able to sign in on production site by end of Day 1.

---

### Day 2: Performance - Remove Bundle Bloat ⚡

**Issue**: Navigation is slow due to 2MB+ bundle size
**Target**: Reduce initial bundle to <500KB gzipped

#### Morning (3 hours)
**2.1 Remove Unused Three.js Dependencies**
```bash
# Check if Three.js is actually used
npm run build && npx webpack-bundle-analyzer .next/static/chunks/*.js

# If not used, remove:
npm uninstall @react-three/drei @react-three/fiber three @types/three
```

**2.2 Audit Other Heavy Dependencies**
```bash
# Check if LangGraph is used
grep -r "langgraph" src/

# If not used:
npm uninstall @langchain/langgraph

# Check Genkit usage
grep -r "@genkit-ai" src/
```

#### Afternoon (3 hours)
**2.3 Implement Code Splitting**

```typescript
// Update: src/app/chat/page.tsx
// Change from:
import { ChatInterface } from '@/components/chat/chat-interface';

// To:
import dynamic from 'next/dynamic';
const ChatInterface = dynamic(
  () => import('@/components/chat/chat-interface'),
  { loading: () => <p>Loading chat...</p> }
);
```

Apply to heavy components:
- [ ] Chat interface
- [ ] Workout SVG visualizations
- [ ] Profile picture upload
- [ ] AI recommendations panel

**2.4 Configure Next.js for Better Performance**
```javascript
// Update: next.config.js
module.exports = {
  // Enable SWC minification
  swcMinify: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
  },
};
```

**Checkpoint**: Bundle size reduced by 50%+, navigation noticeably faster.

---

### Day 3: Security - Fix API Key Exposure 🔒

**Issue**: API keys exposed in client-side code and documentation

#### Morning (3 hours)
**3.1 Remove Exposed API Keys from Documentation**
```bash
# Find all exposed keys
grep -r "AIzaSy" . --exclude-dir={node_modules,.next}
grep -r "NEXT_PUBLIC.*API_KEY" . --exclude-dir={node_modules,.next}

# Remove from files:
# - INTELLIGENT_AI_IMPLEMENTATION_COMPLETE.md (line 76)
# - Any other documentation files
```

**3.2 Move Google AI API to Server-Side**

Current (INSECURE):
```typescript
// src/services/ai-service.ts - CLIENT-SIDE ❌
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
```

Fixed (SECURE):
```typescript
// 1. Create: src/app/api/ai/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  const { prompt, userId } = await req.json();

  // Server-side only - never exposed to client
  const apiKey = process.env.GOOGLE_AI_API_KEY; // No NEXT_PUBLIC_!
  const genAI = new GoogleGenerativeAI(apiKey);

  // ... AI logic
}

// 2. Update: src/services/ai-service.ts - CLIENT-SIDE
export async function generateAIResponse(prompt: string) {
  // Call server-side API instead
  const response = await fetch('/api/ai/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  return response.json();
}
```

#### Afternoon (2-3 hours)
**3.3 Update Vercel Environment Variables**
- [ ] Rename `NEXT_PUBLIC_GOOGLE_AI_API_KEY` → `GOOGLE_AI_API_KEY` (remove NEXT_PUBLIC_)
- [ ] Rename `NEXT_PUBLIC_GROQ_API_KEY` → `GROQ_API_KEY` (if it exists)
- [ ] Update local `.env.local` to match
- [ ] Add to `.env.example` (without actual values)

**3.4 Create Environment Validation**
```typescript
// Update: src/lib/env-config.ts
import { z } from 'zod';

const envSchema = z.object({
  // Server-side only (no NEXT_PUBLIC_)
  GOOGLE_AI_API_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),

  // Client-safe (NEXT_PUBLIC_ is OK for Firebase)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  // ... other Firebase vars
});

// Validate on app startup
export const env = envSchema.parse(process.env);
```

**Checkpoint**: Zero API keys exposed to client, all AI calls go through secure server routes.

---

### Day 4: TypeScript Strict Mode & Error Handling 🛠️

**Issue**: TypeScript errors ignored, poor error handling causes crashes

#### Morning (3 hours)
**4.1 Enable TypeScript Strict Checking**
```javascript
// Update: next.config.js
module.exports = {
  typescript: {
    ignoreBuildErrors: false, // ✅ Enable strict checking
  },
  eslint: {
    ignoreDuringBuilds: false, // ✅ Enable ESLint
  },
};
```

```bash
# Run build to see all errors
npm run build 2>&1 | tee typescript-errors.log

# Expect 50-100 errors - this is normal!
```

**4.2 Fix Critical Type Errors (Prioritize)**

Priority order:
1. **src/types/** - Fix shared type definitions first
2. **src/services/core/** - Fix core services
3. **src/contexts/** - Fix context providers
4. **src/components/** - Fix components (can defer some)

Common fixes:
```typescript
// ❌ Before
function fetchData(id: any) { ... }

// ✅ After
function fetchData(id: string): Promise<Data> { ... }

// ❌ Before
const data = await getDoc(docRef);
return data.data();

// ✅ After
const data = await getDoc(docRef);
const result = data.data();
if (!result) throw new Error('Document not found');
return result as UserData;
```

#### Afternoon (3 hours)
**4.3 Add Error Boundaries**

```typescript
// Create: src/components/error-boundaries/AppErrorBoundary.tsx
'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to monitoring service (Sentry, etc.)
    console.error('AppErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

```typescript
// Update: src/app/layout.tsx
import { AppErrorBoundary } from '@/components/error-boundaries/AppErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
```

**4.4 Add Async Error Handling**

```typescript
// Create: src/lib/error-handling.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<[Error | null, T | null]> {
  return promise
    .then((data) => [null, data] as [null, T])
    .catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      if (errorMessage) {
        err.message = `${errorMessage}: ${err.message}`;
      }
      return [err, null] as [Error, null];
    });
}

// Usage:
const [error, data] = await handleAsyncError(
  fetchUserData(userId),
  'Failed to fetch user data'
);
if (error) {
  console.error(error);
  return;
}
// TypeScript knows data is not null here
console.log(data.name);
```

**Checkpoint**: App builds with zero TypeScript errors, error boundaries catch crashes.

---

### Day 5: Logging Service & Console Cleanup 📝

**Issue**: 200+ console.log statements causing performance issues

#### Morning (2-3 hours)
**5.1 Create Structured Logging Service**

```typescript
// Update: src/lib/logger.ts (already exists, enhance it)
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();

    if (this.isDevelopment) {
      // Pretty print for development
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      console[level === 'debug' ? 'log' : level](
        `${emoji} [${timestamp}] ${message}`,
        context || ''
      );
    } else {
      // Structured JSON for production (ready for log aggregation)
      console.log(JSON.stringify({
        timestamp,
        level,
        message,
        ...context,
      }));
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.formatMessage('debug', message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.formatMessage('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.formatMessage('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    this.formatMessage('error', message, {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
  }
}

export const logger = new Logger();
```

#### Afternoon (3 hours)
**5.2 Replace All Console.log Statements**

```bash
# Find all console.log statements
grep -r "console\\.log" src/ --exclude-dir={node_modules,.next} | wc -l

# Create a script to help with replacement
# Create: scripts/replace-console-logs.sh
```

Strategy:
1. **Delete**: Debug logs (e.g., "entering function X")
2. **Keep as logger.info**: Important state changes
3. **Keep as logger.error**: Error logging
4. **Keep as logger.warn**: Warnings

```bash
# Use find & replace in VS Code:
# Find: console\.log\((.*)\)
# Replace: logger.info($1)

# Then manually review each and:
# - Delete unnecessary debug logs
# - Change to logger.debug/info/warn/error as appropriate
# - Add context objects where helpful
```

Example transformations:
```typescript
// ❌ Before
console.log('🔧 Creating profile for', uid);
console.log('Workout data:', workoutData);

// ✅ After (delete debug, keep important logs)
logger.info('Creating user profile', { userId: uid });
logger.debug('Workout data received', { workoutId: workoutData.id });

// ❌ Before
console.error('Failed to save:', error);

// ✅ After
logger.error('Failed to save workout', error, {
  userId,
  workoutId
});
```

**Checkpoint**: <20 console.log statements remaining (all in error boundaries).

---

## WEEK 2: Testing, Monitoring & Best Practices

### Day 6-7: Testing Infrastructure 🧪

**Goal**: Implement testing for critical paths (80%+ coverage)

#### Day 6 Morning: Setup Testing Framework
```bash
# Already installed, just need configuration
npm install --save-dev jest-environment-jsdom

# Create: jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/services/core/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

# Create: jest.setup.js
import '@testing-library/jest-dom';
```

#### Day 6 Afternoon - Day 7: Write Critical Tests

**Priority Test Files**:
1. Auth Context Tests
2. Workout Service Tests
3. AI Chat Service Tests (mock external APIs)
4. Core Component Tests

```typescript
// Create: __tests__/contexts/AuthContext.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  },
  db: {},
}));

describe('AuthContext', () => {
  it('provides auth context to children', () => {
    const TestComponent = () => {
      const { user, loading } = useAuth();
      return <div>User: {user?.email || 'None'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText(/User:/)).toBeInTheDocument();
  });

  it('handles sign in', async () => {
    // Test sign in functionality
  });

  it('handles sign out', async () => {
    // Test sign out functionality
  });
});
```

```typescript
// Create: __tests__/services/workout-service.test.ts
import { WorkoutService } from '@/services/core/workout-service';
import { Workout } from '@/types/workout';

// Mock Firestore
jest.mock('firebase/firestore');

describe('WorkoutService', () => {
  it('creates a workout', async () => {
    const workout: Workout = {
      // ... workout data
    };

    const result = await WorkoutService.createWorkout(workout, 'user123');
    expect(result).toBeDefined();
    expect(result.userId).toBe('user123');
  });

  it('fetches user workouts', async () => {
    const workouts = await WorkoutService.getUserWorkouts('user123');
    expect(Array.isArray(workouts)).toBe(true);
  });
});
```

**Add Test Scripts to package.json**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

**Checkpoint**: 80%+ test coverage for core services, all tests passing.

---

### Day 8: Input Validation & Security Hardening 🔐

**Goal**: Implement Zod validation for all user inputs

#### Morning (3 hours)
**8.1 Create Validation Schemas**

```typescript
// Create: src/lib/validation/user-schemas.ts
import { z } from 'zod';

export const userProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
  fitnessGoals: z.array(z.string()).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export const updateProfileSchema = userProfileSchema.partial();

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

```typescript
// Create: src/lib/validation/workout-schemas.ts
import { z } from 'zod';

export const exerciseSchema = z.object({
  name: z.string().min(1).max(100),
  muscleGroups: z.array(z.string()).min(1),
  sets: z.number().int().positive().max(20),
  reps: z.number().int().positive().max(500),
  weight: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const workoutSchema = z.object({
  name: z.string().min(1).max(100),
  exercises: z.array(exerciseSchema).min(1),
  date: z.date(),
  duration: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type WorkoutInput = z.infer<typeof workoutSchema>;
```

#### Afternoon (3 hours)
**8.2 Apply Validation to API Routes**

```typescript
// Update: src/app/api/workouts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { workoutSchema } from '@/lib/validation/workout-schemas';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = workoutSchema.parse(body);

    // Process validated data
    const result = await createWorkout(validatedData);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error', { errors: error.errors });
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to create workout', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**8.3 Add Rate Limiting**

```typescript
// Create: src/middleware/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';

const rateLimit = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(
  req: NextRequest,
  maxRequests = 100,
  windowMs = 60000 // 1 minute
) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    return null; // Allow request
  }

  if (userLimit.count >= maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  userLimit.count++;
  return null; // Allow request
}
```

**Checkpoint**: All API routes validate inputs, rate limiting prevents abuse.

---

### Day 9: CI/CD Pipeline & Monitoring 🔄

**Goal**: Automate testing and deployments

#### Morning (3 hours)
**9.1 Setup GitHub Actions**

```yaml
# Create: .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, master]
  push:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck || npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/coverage-final.json
```

```yaml
# Create: .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main, master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### Afternoon (3 hours)
**9.2 Setup Error Tracking (Sentry)**

```bash
npm install --save @sentry/nextjs
npx @sentry/wizard -i nextjs
```

```typescript
// Create: sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',

  // Adjust sample rates for production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    return event;
  },
});
```

```typescript
// Update: src/lib/logger.ts
import * as Sentry from '@sentry/nextjs';

class Logger {
  error(message: string, error?: Error | unknown, context?: LogContext) {
    // Log to console/structured logging
    this.formatMessage('error', message, { ...context, error });

    // Also send to Sentry in production
    if (process.env.NODE_ENV === 'production' && error instanceof Error) {
      Sentry.captureException(error, {
        contexts: {
          custom: context,
        },
        tags: {
          message,
        },
      });
    }
  }
}
```

**Checkpoint**: CI/CD pipeline runs on all PRs, errors automatically tracked in Sentry.

---

### Day 10: Documentation & Final Cleanup 📚

**Goal**: Create documentation for team onboarding

#### Morning (3 hours)
**10.1 Create Development Documentation**

```markdown
# Create: docs/DEVELOPMENT.md
# Development Guide

## Prerequisites
- Node.js 18+
- npm 9+
- Firebase account
- Google AI API key

## Setup

1. Clone repository:
   ```bash
   git clone <repo-url>
   cd gymzy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## Project Structure
- `src/app/` - Next.js app routes
- `src/components/` - React components
- `src/services/` - Business logic
- `src/lib/` - Utilities and configuration
- `__tests__/` - Test files

## Common Tasks

### Adding a New Feature
1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Ensure tests pass
5. Create pull request

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```
```

```markdown
# Create: docs/API.md
# API Documentation

## Authentication

All API routes require authentication via Firebase Auth token.

### Headers
```
Authorization: Bearer <firebase-id-token>
```

## Endpoints

### POST /api/workouts
Create a new workout.

**Request Body:**
```json
{
  "name": "Chest Day",
  "exercises": [
    {
      "name": "Bench Press",
      "sets": 4,
      "reps": 10,
      "weight": 135
    }
  ]
}
```

**Response:**
```json
{
  "id": "workout123",
  "userId": "user123",
  "createdAt": "2025-01-07T..."
}
```
```

#### Afternoon (3 hours)
**10.2 Final Cleanup**

- [ ] Delete all `dist_test_*` directories
- [ ] Move migration files to `archive/migration/`
- [ ] Move docs to `docs/` directory
- [ ] Update README.md with quick start guide
- [ ] Create `.env.example` with all required vars
- [ ] Run final tests
- [ ] Verify production deployment

**10.3 Create Deployment Checklist**

```markdown
# Create: docs/DEPLOYMENT.md
# Deployment Checklist

## Pre-Deployment
- [ ] All tests passing
- [ ] TypeScript compiles with zero errors
- [ ] No console.log statements in code
- [ ] Environment variables configured in Vercel
- [ ] Firebase configuration verified
- [ ] API rate limiting tested

## Vercel Configuration
- [ ] Environment variables set for Production
- [ ] Build settings: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm ci`

## Post-Deployment Verification
- [ ] Users can sign in/sign up
- [ ] Workouts can be created and saved
- [ ] AI chat functionality works
- [ ] No errors in Sentry dashboard
- [ ] Performance metrics acceptable (<3s page load)

## Rollback Procedure
If deployment fails:
1. Revert to previous deployment in Vercel dashboard
2. Check error logs in Sentry
3. Fix issue in development
4. Re-run tests
5. Deploy again
```

**Checkpoint**: Complete documentation, clean codebase, production-ready app.

---

## 🎯 Final Deliverables Checklist

### Week 1 ✅
- [x] Auth working in production (users can sign in)
- [x] Navigation 3x faster (bundle size <500KB)
- [x] Zero exposed API keys
- [x] TypeScript strict mode enabled (0 errors)
- [x] Error boundaries implemented
- [x] Logging service (no console.log)

### Week 2 ✅
- [x] 80%+ test coverage
- [x] CI/CD pipeline with automated tests
- [x] Error tracking (Sentry)
- [x] Input validation (Zod schemas)
- [x] Rate limiting on API routes
- [x] Complete documentation

---

## 📊 Metrics Tracking

Track progress daily:

| Day | Metric | Target | Actual |
|-----|--------|--------|--------|
| 1 | Auth works in prod? | Yes | ___ |
| 2 | Bundle size (KB) | <500 | ___ |
| 3 | Exposed API keys | 0 | ___ |
| 4 | TypeScript errors | 0 | ___ |
| 5 | Console.log count | <20 | ___ |
| 6-7 | Test coverage (%) | 80+ | ___ |
| 8 | API validation | 100% | ___ |
| 9 | CI/CD pipeline | Working | ___ |
| 10 | Docs complete | Yes | ___ |

---

## 🚨 Risk Mitigation

### If You Fall Behind Schedule

**Days 1-3 are CRITICAL** - these fix your immediate production issues:
- Day 1: Auth MUST work
- Day 2: Performance MUST improve
- Day 3: Security MUST be fixed

If you're behind after Day 3:
- **Option A**: Extend Week 1 to 7 days (delay Week 2)
- **Option B**: Reduce test coverage target to 60%
- **Option C**: Defer documentation to Day 11-12

### Blockers & Solutions

**Blocker**: Can't figure out why auth is broken
**Solution**: Share Vercel deployment logs + browser console errors for debugging

**Blocker**: Too many TypeScript errors to fix
**Solution**: Use `@ts-ignore` temporarily for non-critical files, focus on services/

**Blocker**: Tests are flaky or failing
**Solution**: Mock Firebase/external APIs properly, use jest-environment-jsdom

---

## 🎓 Learning Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Zod Validation](https://zod.dev/)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [Sentry Error Tracking](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Deployment](https://vercel.com/docs)

---

## 💡 After Week 2: Next Steps

Once this plan is complete, you'll be ready to:
1. ✅ Add new AI services safely (with tests, validation, monitoring)
2. ✅ Onboard team members (documentation ready)
3. ✅ Scale to production users (proper monitoring, error handling)
4. ✅ Iterate quickly (CI/CD pipeline, automated tests)

**You asked for a plan to fix all these issues - this is it!** 🚀

Ready to start with Day 1: Emergency Auth Fix?
