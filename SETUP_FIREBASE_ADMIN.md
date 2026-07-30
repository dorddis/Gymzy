# Firebase Admin SDK Setup (Optional)

The Admin SDK requires credentials to work. Here's how to set it up:

## Option 1: Generate Service Account Key (Recommended for Local Development)

### Step 1: Generate Key from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **gymzy-launch**
3. Click the gear icon → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file

### Step 2: Add to Environment Variables

Open `.env.local` and add:

```env
# Firebase Admin SDK (server-side only - NEVER commit this)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxxxx@gymzy-launch.iam.gserviceaccount.com"
```

**Important:**
- Replace `YOUR_PRIVATE_KEY_HERE` with the `private_key` from the downloaded JSON
- Replace the client email with the `client_email` from the JSON
- Keep the `\n` characters in the private key - they're important!

### Step 3: Restart Dev Server

```bash
npm run dev
```

## Option 2: Use Application Default Credentials (Production)

In production (Vercel), the Admin SDK automatically uses Application Default Credentials. No setup needed.

## Test It Works

```bash
curl "http://localhost:9001/api/test-admin?userId=hHuIokDYEoM3MkAVqELo2SGRbx13"
```

Should return workout data instead of credentials error.

---

## For Now: Using Client-Side Fallback

I've implemented a fallback that uses the client SDK when admin credentials aren't available. This works but has limitations (can't query other users' data server-side).
