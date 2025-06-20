/**
 * Environment Configuration & Validation
 * Validates required environment variables and provides type-safe access
 */

import { z } from 'zod';

// Environment variable schema for validation
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // AI Service Configuration
  NEXT_PUBLIC_GOOGLE_AI_API_KEY: z.string().min(1, 'Google AI API key is required'),
  GROQ_API_KEY: z.string().min(1, 'Groq API key is required').optional(),
  NEXT_PUBLIC_GROQ_MODEL_NAME: z.string().default('llama3-8b-8192'),
  
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),
  
  // Application Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:9001'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:9001/api'),
  
  // Security Configuration
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters').optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Development Configuration
  NEXT_PUBLIC_DEV_MODE: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
  
  // API Configuration
  API_RATE_LIMIT: z.string().transform(val => parseInt(val, 10)).default('100'),
});

// Type for validated environment variables
export type EnvConfig = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `❌ Invalid environment configuration:\n${missingVars.join('\n')}\n\n` +
        `Please check your .env.local file and ensure all required variables are set.\n` +
        `See .env.local.example for reference.`
      );
    }
    throw error;
  }
}

// Validated environment configuration
export const env = validateEnv();

// Helper functions for environment checks
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isStaging = env.NODE_ENV === 'staging';

// API configuration helpers
export const getAPIConfig = () => ({
  googleAI: {
    apiKey: env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    streamingEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:streamGenerateContent',
  },
  groq: {
    apiKey: env.GROQ_API_KEY,
    modelName: env.NEXT_PUBLIC_GROQ_MODEL_NAME,
  },
  rateLimit: env.API_RATE_LIMIT,
});

// Firebase configuration helper
export const getFirebaseConfig = () => ({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

// Security helpers
export const getSecurityConfig = () => ({
  nextAuthSecret: env.NEXTAUTH_SECRET,
  nextAuthUrl: env.NEXTAUTH_URL,
});

// Development helpers
export const getDevConfig = () => ({
  devMode: env.NEXT_PUBLIC_DEV_MODE,
  debugMode: env.NEXT_PUBLIC_DEBUG_MODE,
});

// Logging helper for environment validation
export const logEnvironmentStatus = () => {
  if (isDevelopment) {
    console.log('🔧 Environment Configuration:');
    console.log(`  - Environment: ${env.NODE_ENV}`);
    console.log(`  - App URL: ${env.NEXT_PUBLIC_APP_URL}`);
    console.log(`  - API URL: ${env.NEXT_PUBLIC_API_URL}`);
    console.log(`  - Google AI: ${env.NEXT_PUBLIC_GOOGLE_AI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  - Groq API: ${env.GROQ_API_KEY ? '✅ Configured' : '⚠️ Optional - Missing'}`);
    console.log(`  - Firebase: ${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  - Dev Mode: ${env.NEXT_PUBLIC_DEV_MODE ? '✅ Enabled' : '❌ Disabled'}`);
  }
};

// Export for use in other files
export default env;
