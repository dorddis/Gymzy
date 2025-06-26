# 🚀 Deployment Guide

## Overview

Gymzy uses Vercel for hosting with automated deployments through GitHub Actions. This guide covers the complete deployment process from development to production.

## Deployment Environments

### 1. Development
- **URL**: `http://localhost:9001`
- **Purpose**: Local development and testing
- **Database**: Local Firebase emulator or development project
- **AI Services**: Development API keys

### 2. Staging
- **URL**: `https://gymzy-staging.vercel.app`
- **Purpose**: Pre-production testing and QA
- **Database**: Firebase staging project
- **AI Services**: Staging API keys with rate limits

### 3. Production
- **URL**: `https://gymzy.vercel.app`
- **Purpose**: Live application for users
- **Database**: Firebase production project
- **AI Services**: Production API keys with full quotas

## Prerequisites

### Required Accounts
1. **Vercel Account** - For hosting
2. **Firebase Project** - For backend services
3. **Google AI Studio** - For Gemini API
4. **Groq Account** - For Groq API (optional)
5. **GitHub Repository** - For CI/CD

### Required Secrets

Set these secrets in your GitHub repository settings:

#### Vercel Secrets
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### API Keys
```
GOOGLE_AI_API_KEY=your_google_ai_api_key
GROQ_API_KEY=your_groq_api_key
```

#### Firebase Configuration
```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

## Automated Deployment

### Continuous Integration (CI)

Every push and pull request triggers automated checks:

1. **Code Quality**
   - TypeScript type checking
   - ESLint linting
   - Prettier formatting

2. **Testing**
   - Unit tests
   - Integration tests
   - Coverage reporting

3. **Security**
   - Dependency audit
   - CodeQL analysis
   - Secret scanning

4. **Build**
   - Production build
   - Bundle analysis

### Continuous Deployment (CD)

#### Production Deployment
Triggered automatically on push to `main` branch:

```bash
git checkout main
git merge feature/your-feature
git push origin main
```

#### Manual Deployment
Use GitHub Actions workflow dispatch:

1. Go to GitHub Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Choose environment (production/staging)

### Deployment Process

1. **Pre-deployment Checks**
   - Validate commit messages
   - Check deployment conditions
   - Verify environment configuration

2. **CI Pipeline**
   - Run full test suite
   - Perform security scans
   - Build application

3. **Deploy to Vercel**
   - Link Vercel project
   - Build production artifacts
   - Deploy to chosen environment

4. **Post-deployment Tests**
   - Health checks
   - Performance audits
   - Security header validation

5. **Rollback (if needed)**
   - Automatic rollback on test failures
   - Manual rollback capability

## Manual Deployment

### Local to Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Link Project**
```bash
vercel link
```

4. **Deploy**
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Variables

Set environment variables in Vercel dashboard or CLI:

```bash
# Set production environment variables
vercel env add NEXT_PUBLIC_GOOGLE_AI_API_KEY production
vercel env add GROQ_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# ... add all required variables
```

## Environment Configuration

### Development Environment

Create `.env.local`:
```env
NODE_ENV=development
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_dev_key
GROQ_API_KEY=your_dev_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gymzy-dev
NEXT_PUBLIC_APP_URL=http://localhost:9001
```

### Staging Environment

Vercel environment variables:
```env
NODE_ENV=staging
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_staging_key
GROQ_API_KEY=your_staging_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gymzy-staging
NEXT_PUBLIC_APP_URL=https://gymzy-staging.vercel.app
```

### Production Environment

Vercel environment variables:
```env
NODE_ENV=production
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_prod_key
GROQ_API_KEY=your_prod_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gymzy-prod
NEXT_PUBLIC_APP_URL=https://gymzy.vercel.app
```

## Firebase Setup

### Development Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Deploy Firebase rules and functions
firebase deploy
```

### Production Project
1. Create separate Firebase project for production
2. Configure authentication providers
3. Set up Firestore security rules
4. Configure storage rules
5. Deploy cloud functions (if any)

## Domain Configuration

### Custom Domain (Production)
1. Add domain in Vercel dashboard
2. Configure DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

### SSL Certificate
- Automatically provisioned by Vercel
- Includes automatic renewal
- Supports custom domains

## Monitoring and Alerts

### Vercel Analytics
- Automatically enabled for all deployments
- Performance monitoring
- Error tracking
- User analytics

### Custom Monitoring
Add monitoring endpoints:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown'
  });
}
```

### Alerts Setup
Configure alerts for:
- Deployment failures
- High error rates
- Performance degradation
- Security issues

## Rollback Procedures

### Automatic Rollback
- Triggered by post-deployment test failures
- Reverts to previous stable deployment
- Maintains zero-downtime

### Manual Rollback
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel alias set <previous-deployment-url> <production-domain>
```

### Emergency Rollback
1. Go to Vercel dashboard
2. Find previous successful deployment
3. Click "Promote to Production"
4. Confirm rollback

## Performance Optimization

### Build Optimization
- Tree shaking enabled
- Code splitting configured
- Bundle analysis in CI

### Runtime Optimization
- Edge functions for API routes
- Static generation where possible
- Image optimization enabled

### Caching Strategy
- Static assets cached at CDN
- API responses cached appropriately
- Database queries optimized

## Security Considerations

### Environment Variables
- Never commit secrets to repository
- Use Vercel environment variables
- Rotate keys regularly

### Security Headers
Configured in `vercel.json`:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### API Security
- Rate limiting implemented
- Input validation on all endpoints
- Authentication required for sensitive operations

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
vercel logs <deployment-url>

# Local build test
npm run build
```

#### Environment Variable Issues
```bash
# List environment variables
vercel env ls

# Pull environment variables
vercel env pull .env.local
```

#### Performance Issues
```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer
```

### Debug Mode
Enable debug logging:
```env
DEBUG=1
VERCEL_DEBUG=1
```

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)

## Best Practices

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Security headers verified
- [ ] Performance benchmarks met
- [ ] Database migrations completed
- [ ] Monitoring configured

### Post-deployment Checklist
- [ ] Health checks passing
- [ ] Performance metrics acceptable
- [ ] Error rates normal
- [ ] User flows working
- [ ] Analytics tracking
- [ ] Backup procedures verified

### Maintenance Schedule
- **Daily**: Monitor error rates and performance
- **Weekly**: Review security alerts and updates
- **Monthly**: Update dependencies and rotate keys
- **Quarterly**: Performance optimization review
