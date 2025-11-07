# Vercel Environment Variable Update Required

## ⚠️ CRITICAL SECURITY UPDATE

The Gemini API key has been moved from client-side to server-side only for security.

## Action Required in Vercel Dashboard

1. Go to your project settings: https://vercel.com/YOUR_PROJECT/settings/environment-variables

2. **DELETE** this environment variable:
   - `NEXT_PUBLIC_GOOGLE_AI_API_KEY`

3. **ADD** this new environment variable:
   - Name: `GOOGLE_AI_API_KEY`
   - Value: (Use the same value as the old NEXT_PUBLIC_GOOGLE_AI_API_KEY)
   - Scope: Production, Preview, Development (all three)

## Why This Change?

### Before (INSECURE):
- `NEXT_PUBLIC_GOOGLE_AI_API_KEY` was exposed in the browser
- Anyone could steal the API key from the client-side JavaScript
- Your API quota could be abused by malicious users

### After (SECURE):
- `GOOGLE_AI_API_KEY` is server-side only
- API key never sent to the browser
- Only your server can access the Gemini AI API
- Protected from abuse and theft

## Verification

After updating Vercel:
1. Trigger a new deployment
2. Test the AI chat functionality
3. Verify no errors in deployment logs
4. Check browser DevTools → Network tab → No API key visible in responses

## Local Development

Your `.env.local` file has already been updated with the new variable name.
No action needed for local development.
