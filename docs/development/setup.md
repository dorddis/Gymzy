# 🚀 Gymzy Development Setup Guide

## Prerequisites

Before setting up the Gymzy development environment, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** (v2.30.0 or higher)
- **Firebase CLI** (v12.0.0 or higher)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/gymzy.git
cd gymzy
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Copy the environment template and configure your variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual API keys and configuration:

```env
# Required - Get from Google AI Studio
NEXT_PUBLIC_GOOGLE_AI_API_KEY="your_google_ai_api_key_here"

# Optional - Get from Groq Console
GROQ_API_KEY="your_groq_api_key_here"

# Firebase Configuration - Get from Firebase Console
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:9001"
NEXT_PUBLIC_API_URL="http://localhost:9001/api"
```

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:9001`

## Getting API Keys

### Google AI Studio (Gemini)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to `NEXT_PUBLIC_GOOGLE_AI_API_KEY`

### Groq API (Optional)
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for an account
3. Generate an API key
4. Copy the key to `GROQ_API_KEY`

### Firebase Setup
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable Authentication, Firestore, and Storage
4. Get configuration from Project Settings > General > Your apps
5. Copy all configuration values to your `.env.local`

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Project Structure

```
gymzy/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   └── internal/      # Secure internal APIs
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   └── workout/           # Workout pages
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── forms/            # Form components
│   │   ├── chat/             # Chat interface components
│   │   └── error-boundaries/ # Error boundary components
│   ├── services/             # Business logic services
│   │   ├── core/             # Core business services
│   │   ├── ai/               # AI-related services
│   │   ├── data/             # Data management services
│   │   ├── media/            # Media handling services
│   │   ├── social/           # Social features services
│   │   └── infrastructure/   # Supporting services
│   ├── lib/                  # Utility libraries
│   │   ├── validation/       # Zod validation schemas
│   │   ├── firebase.ts       # Firebase configuration
│   │   ├── logger.ts         # Logging service
│   │   └── secure-ai-client.ts # Secure AI client
│   ├── types/                # TypeScript type definitions
│   │   ├── chat.ts           # Chat-related types
│   │   ├── workout.ts        # Workout-related types
│   │   ├── user.ts           # User-related types
│   │   ├── api.ts            # API types
│   │   └── common.ts         # Common utility types
│   ├── hooks/                # Custom React hooks
│   ├── contexts/             # React contexts
│   └── utils/                # Utility functions
├── __tests__/                # Test files
├── __mocks__/                # Mock implementations
├── docs/                     # Documentation
├── public/                   # Static assets
└── archive/                  # Archived files
```

## Development Workflow

### 1. Feature Development
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes following the coding standards
3. Write tests for your changes
4. Run tests: `npm run test`
5. Run type checking: `npm run typecheck`
6. Run linting: `npm run lint`
7. Commit your changes with descriptive messages
8. Push and create a pull request

### 2. Testing
- Write unit tests for services in `__tests__/services/`
- Write component tests in `__tests__/components/`
- Use the provided test utilities in `jest.setup.js`
- Aim for >80% test coverage on critical paths

### 3. Code Quality
- Follow TypeScript strict mode requirements
- Use the provided validation schemas for all user inputs
- Follow the established service organization patterns
- Use the logging service instead of console.log
- Handle errors properly with error boundaries

## Common Issues & Solutions

### Environment Variables Not Loading
- Ensure `.env.local` is in the root directory
- Restart the development server after changing environment variables
- Check that variable names match exactly (case-sensitive)

### Firebase Connection Issues
- Verify all Firebase configuration values are correct
- Ensure Firebase services (Auth, Firestore, Storage) are enabled
- Check Firebase project permissions

### API Key Issues
- Ensure API keys are valid and not expired
- Check API key permissions and quotas
- Verify the correct environment variables are set

### Build Errors
- Run `npm run typecheck` to identify TypeScript errors
- Ensure all imports are correct and files exist
- Check that all required environment variables are set

### Test Failures
- Ensure all mocks are properly configured
- Check that test data matches expected schemas
- Verify async operations are properly awaited in tests

## Getting Help

- Check the [Architecture Documentation](./architecture.md)
- Review the [API Documentation](../api/)
- Look at existing tests for examples
- Check the [Troubleshooting Guide](../guides/troubleshooting.md)

## Next Steps

After setting up your development environment:

1. Read the [Architecture Overview](./architecture.md)
2. Review the [Coding Standards](../guides/coding-standards.md)
3. Check out the [API Documentation](../api/)
4. Start with the [Contributing Guide](../guides/contributing.md)
