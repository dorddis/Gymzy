/**
 * Environment Configuration
 * Simple environment variable access without complex validation
 */

// Check if we&apos;re on the server side
const isServer = typeof window === 'undefined';

// Simple environment configuration object
export const env = {
  // AI Service Configuration (Gemini only)
  NEXT_PUBLIC_GOOGLE_AI_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '',

  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',

  // Application Configuration
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9001',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001/api',

  // Development Configuration
  NEXT_PUBLIC_DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE === 'true',
  NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',

  // Server-only variables (only available on server)
  NODE_ENV: (isServer ? process.env.NODE_ENV : 'development') as 'development' | 'staging' | 'production',
  NEXTAUTH_SECRET: isServer ? process.env.NEXTAUTH_SECRET : undefined,
  NEXTAUTH_URL: isServer ? process.env.NEXTAUTH_URL : undefined,
  API_RATE_LIMIT: isServer ? parseInt(process.env.API_RATE_LIMIT || '100', 10) : 100,
};

// Type for environment configuration
export type EnvConfig = typeof env;

// Helper functions for environment checks
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isStaging = env.NODE_ENV === 'staging';

// API configuration helpers
export const getAPIConfig = () => ({
  gemini: {
    apiKey: env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
    model: 'gemini-2.5-flash',
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

// Security helpers (server-side only)
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
    console.log(`  - Gemini AI: ${env.NEXT_PUBLIC_GOOGLE_AI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  - Firebase: ${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  - Dev Mode: ${env.NEXT_PUBLIC_DEV_MODE ? '✅ Enabled' : '❌ Disabled'}`);
  }
};

// Export for use in other files
export default env;
