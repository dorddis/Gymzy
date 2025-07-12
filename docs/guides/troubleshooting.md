# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### Development Environment Issues

#### Environment Variables Not Loading
**Problem**: Environment variables are undefined or not loading properly.

**Solutions**:
1. **Check file location**:
   ```bash
   # Ensure .env.local is in the root directory
   ls -la .env.local
   ```

2. **Verify variable names**:
   ```bash
   # Check for typos in variable names (case-sensitive)
   cat .env.local | grep -i api_key
   ```

3. **Restart development server**:
   ```bash
   # Stop server (Ctrl+C) and restart
   npm run dev
   ```

4. **Check Next.js environment variable rules**:
   - Client-side variables must start with `NEXT_PUBLIC_`
   - Server-side variables don&apos;t need prefix
   - Variables are loaded at build time

#### Firebase Connection Issues
**Problem**: Firebase authentication or database connection fails.

**Solutions**:
1. **Verify Firebase configuration**:
   ```typescript
   // Check src/lib/firebase.ts
   console.log('Firebase config:', {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
     // ... other config
   });
   ```

2. **Check Firebase project status**:
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Ensure project is active
   - Check billing status
   - Verify services are enabled

3. **Test Firebase connection**:
   ```typescript
   import { db } from '@/lib/firebase';
   import { collection, getDocs } from 'firebase/firestore';
   
   // Test Firestore connection
   const testConnection = async () => {
     try {
       const snapshot = await getDocs(collection(db, 'test'));
       console.log('Firebase connected successfully');
     } catch (error) {
       console.error('Firebase connection failed:', error);
     }
   };
   ```

#### API Key Issues
**Problem**: AI services return authentication errors.

**Solutions**:
1. **Verify API keys are valid**:
   ```bash
   # Test Google AI API key
   curl -H "Authorization: Bearer $NEXT_PUBLIC_GOOGLE_AI_API_KEY" \
        https://generativelanguage.googleapis.com/v1/models
   
   # Test Groq API key
   curl -H "Authorization: Bearer $GROQ_API_KEY" \
        https://api.groq.com/openai/v1/models
   ```

2. **Check API key permissions**:
   - Google AI Studio: Ensure key has Gemini API access
   - Groq: Verify account has sufficient credits
   - Check rate limits and quotas

3. **Regenerate API keys**:
   - Create new keys if existing ones are compromised
   - Update environment variables
   - Restart development server

### Build and Deployment Issues

#### TypeScript Build Errors
**Problem**: Build fails with TypeScript errors.

**Solutions**:
1. **Run type checking locally**:
   ```bash
   npm run typecheck
   ```

2. **Common TypeScript fixes**:
   ```typescript
   // Fix missing type imports
   import type { User } from '@/types/user';
   
   // Fix any types
   const data: unknown = response.data;
   const user = data as User;
   
   // Fix missing properties
   interface Props {
     title: string;
     optional?: boolean;
   }
   ```

3. **Check tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

#### ESLint Errors
**Problem**: Linting errors prevent build.

**Solutions**:
1. **Run linting locally**:
   ```bash
   npm run lint
   npm run lint -- --fix  # Auto-fix issues
   ```

2. **Common ESLint fixes**:
   ```typescript
   // Fix unused variables
   const handleClick = useCallback(() => {
     // Implementation
   }, []);
   
   // Fix missing dependencies
   useEffect(() => {
     fetchData();
   }, [fetchData]);  // Add dependencies
   
   // Fix console statements
   // Remove console.log or use logger
   import { logger } from '@/lib/logger';
   logger.info('Debug message');
   ```

#### Vercel Deployment Failures
**Problem**: Deployment fails on Vercel.

**Solutions**:
1. **Check build logs**:
   ```bash
   vercel logs <deployment-url>
   ```

2. **Common deployment issues**:
   - **Environment variables**: Ensure all required variables are set in Vercel
   - **Build timeout**: Optimize build process or increase timeout
   - **Memory issues**: Reduce bundle size or upgrade plan

3. **Test build locally**:
   ```bash
   npm run build
   npm run start
   ```

### Runtime Issues

#### AI Service Errors
**Problem**: AI responses fail or return errors.

**Solutions**:
1. **Check service health**:
   ```typescript
   // Test AI service endpoint
   const response = await fetch('/api/internal/ai/health');
   const health = await response.json();
   console.log('AI service health:', health);
   ```

2. **Handle rate limiting**:
   ```typescript
   // Implement retry logic
   const retryWithBackoff = async (fn: () => Promise<any>, retries = 3) => {
     try {
       return await fn();
     } catch (error) {
       if (retries > 0 && error.status === 429) {
         await new Promise(resolve => setTimeout(resolve, 1000));
         return retryWithBackoff(fn, retries - 1);
       }
       throw error;
     }
   };
   ```

3. **Check API quotas**:
   - Google AI Studio: Monitor usage dashboard
   - Groq: Check account credits and limits

#### Database Connection Issues
**Problem**: Firestore operations fail or timeout.

**Solutions**:
1. **Check Firestore rules**:
   ```javascript
   // Ensure rules allow authenticated access
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

2. **Implement error handling**:
   ```typescript
   import { doc, getDoc } from 'firebase/firestore';
   
   const fetchUser = async (userId: string) => {
     try {
       const userDoc = await getDoc(doc(db, 'users', userId));
       if (userDoc.exists()) {
         return userDoc.data();
       }
       throw new Error('User not found');
     } catch (error) {
       logger.error('Failed to fetch user', error);
       throw error;
     }
   };
   ```

3. **Check network connectivity**:
   ```typescript
   // Test basic connectivity
   const testConnectivity = async () => {
     try {
       await fetch('https://www.google.com', { mode: 'no-cors' });
       console.log('Network connectivity OK');
     } catch (error) {
       console.error('Network connectivity issue:', error);
     }
   };
   ```

### Performance Issues

#### Slow Page Loading
**Problem**: Pages load slowly or timeout.

**Solutions**:
1. **Analyze bundle size**:
   ```bash
   npm run build
   npx @next/bundle-analyzer
   ```

2. **Optimize imports**:
   ```typescript
   // Use dynamic imports for large components
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <div>Loading...</div>
   });
   
   // Use tree shaking
   import { specific } from 'library/specific';
   // Instead of: import * as library from 'library';
   ```

3. **Implement caching**:
   ```typescript
   // Cache API responses
   const cache = new Map();
   
   const fetchWithCache = async (key: string, fetcher: () => Promise<any>) => {
     if (cache.has(key)) {
       return cache.get(key);
     }
     const result = await fetcher();
     cache.set(key, result);
     return result;
   };
   ```

#### Memory Leaks
**Problem**: Application memory usage increases over time.

**Solutions**:
1. **Clean up event listeners**:
   ```typescript
   useEffect(() => {
     const handleResize = () => {
       // Handle resize
     };
     
     window.addEventListener('resize', handleResize);
     return () => window.removeEventListener('resize', handleResize);
   }, []);
   ```

2. **Cancel async operations**:
   ```typescript
   useEffect(() => {
     const abortController = new AbortController();
     
     const fetchData = async () => {
       try {
         const response = await fetch('/api/data', {
           signal: abortController.signal
         });
         // Handle response
       } catch (error) {
         if (error.name !== 'AbortError') {
           console.error('Fetch error:', error);
         }
       }
     };
     
     fetchData();
     return () => abortController.abort();
   }, []);
   ```

### Testing Issues

#### Test Failures
**Problem**: Tests fail unexpectedly.

**Solutions**:
1. **Check test environment**:
   ```bash
   # Run tests with verbose output
   npm run test -- --verbose
   
   # Run specific test file
   npm run test -- validation.test.ts
   ```

2. **Fix common test issues**:
   ```typescript
   // Mock external dependencies
   jest.mock('@/lib/firebase', () => ({
     db: mockFirestore,
     auth: mockAuth
   }));
   
   // Handle async operations
   await waitFor(() => {
     expect(screen.getByText('Expected text')).toBeInTheDocument();
   });
   
   // Clean up after tests
   afterEach(() => {
     jest.clearAllMocks();
     cleanup();
   });
   ```

3. **Update snapshots**:
   ```bash
   npm run test -- --updateSnapshot
   ```

### Security Issues

#### CORS Errors
**Problem**: Cross-origin requests are blocked.

**Solutions**:
1. **Configure CORS headers**:
   ```typescript
   // In API routes
   export async function GET(request: Request) {
     const response = new Response(JSON.stringify(data));
     response.headers.set('Access-Control-Allow-Origin', '*');
     response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
     return response;
   }
   ```

2. **Use Next.js API routes**:
   ```typescript
   // Move client-side API calls to server-side
   // Instead of calling external APIs from client
   const response = await fetch('/api/internal/ai', {
     method: 'POST',
     body: JSON.stringify(data)
   });
   ```

#### Authentication Issues
**Problem**: User authentication fails or tokens expire.

**Solutions**:
1. **Handle token refresh**:
   ```typescript
   import { onAuthStateChanged } from 'firebase/auth';
   
   useEffect(() => {
     const unsubscribe = onAuthStateChanged(auth, async (user) => {
       if (user) {
         // Refresh token if needed
         const token = await user.getIdToken(true);
         // Update auth context
       }
     });
     
     return unsubscribe;
   }, []);
   ```

2. **Implement proper error handling**:
   ```typescript
   const handleAuthError = (error: any) => {
     switch (error.code) {
       case 'auth/user-not-found':
         // Handle user not found
         break;
       case 'auth/wrong-password':
         // Handle wrong password
         break;
       case 'auth/too-many-requests':
         // Handle rate limiting
         break;
       default:
         // Handle other errors
         break;
     }
   };
   ```

## Debug Tools and Commands

### Development Debugging
```bash
# Enable debug mode
DEBUG=* npm run dev

# Check environment variables
node -e "console.log(process.env)"

# Test API endpoints
curl -X POST http://localhost:9001/api/test \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
```

### Production Debugging
```bash
# Check Vercel logs
vercel logs --follow

# Check build output
vercel build

# Test production build locally
npm run build && npm run start
```

### Database Debugging
```bash
# Firebase emulator
firebase emulators:start

# Check Firestore data
firebase firestore:export ./backup

# Test security rules
firebase emulators:exec --only firestore "npm test"
```

## Getting Help

### Internal Resources
- [Development Setup](../development/setup.md)
- [Architecture Overview](../development/architecture.md)
- [API Documentation](../api/)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Support Channels
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and help
- **Team Chat**: For urgent issues
- **Documentation**: For detailed guides

### Emergency Contacts
- **Production Issues**: Contact DevOps team immediately
- **Security Issues**: Follow security incident response plan
- **Data Issues**: Contact database administrator
