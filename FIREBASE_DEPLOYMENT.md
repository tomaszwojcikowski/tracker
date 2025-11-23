# Firebase Deployment Quick Start

This guide helps you quickly deploy the tracker app with Firebase cloud sync enabled.

## Prerequisites

- Node.js and npm installed
- Firebase account (free tier is sufficient)
- Hosting service (GitHub Pages, Vercel, Netlify, etc.)

## Step 1: Create Firebase Project (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name: `tracker-app` (or your choice)
4. Disable Google Analytics (optional, not needed)
5. Click "Create Project"

## Step 2: Enable Google Authentication (2 minutes)

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get Started"
3. Click **Sign-in method** tab
4. Click **Google** provider
5. Toggle **Enable** to ON
6. Enter your **Support email**
7. Click **Save**

## Step 3: Create Realtime Database (2 minutes)

1. Go to **Build** → **Realtime Database**
2. Click "Create Database"
3. Choose a location (e.g., `us-central1`)
4. Select **Start in test mode**
5. Click "Enable"

## Step 4: Configure Security Rules (1 minute)

1. In **Realtime Database**, click **Rules** tab
2. Replace all content with:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

3. Click **Publish**

## Step 5: Get Firebase Configuration (1 minute)

1. Click the **gear icon** (⚙️) → **Project settings**
2. Scroll to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register app with nickname: `Tracker Web`
5. Copy the config values (you'll need them next)

The config looks like:
```javascript
{
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  // ... other fields
}
```

## Step 6: Configure Environment Variables

### Option A: Local Development

1. Create `.env` file in project root:
```bash
cp .env.example .env
```

2. Edit `.env` and add your values:
```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
```

3. Build:
```bash
npm install
npm run build
```

4. Test locally:
```bash
npm run preview
```

### Option B: GitHub Actions (Recommended for GitHub Pages)

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:
   - Name: `VITE_FIREBASE_API_KEY`, Value: your API key
   - Name: `VITE_FIREBASE_PROJECT_ID`, Value: your project ID
   - Name: `VITE_FIREBASE_DATABASE_URL`, Value: your database URL
   - Name: `VITE_FIREBASE_AUTH_DOMAIN`, Value: your auth domain

4. Update `.github/workflows/deploy.yml` to use these secrets:
```yaml
- name: Build
  run: npm run build
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
    VITE_FIREBASE_DATABASE_URL: ${{ secrets.VITE_FIREBASE_DATABASE_URL }}
    VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
```

5. Push to main branch → deployment will happen automatically

### Option C: Vercel/Netlify

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each `VITE_FIREBASE_*` variable
3. Redeploy

**Netlify:**
1. Go to Site settings → Build & deploy → Environment
2. Add each `VITE_FIREBASE_*` variable
3. Trigger redeploy

## Step 7: Verify Deployment

1. Open deployed app
2. Go to Settings tab
3. You should see "Cloud Sync" section
4. Click "Sign In with Google"
5. Complete sign-in
6. Verify your profile appears

## Troubleshooting

### "Cloud Sync" section doesn't appear
- **Cause**: Environment variables not set during build
- **Fix**: Verify environment variables are set and rebuild

### "Login failed: auth/unauthorized-domain"
- **Cause**: Your domain is not authorized in Firebase
- **Fix**: 
  1. Go to Firebase Console → Authentication → Settings → Authorized domains
  2. Add your deployment domain (e.g., `yourapp.github.io`)

### "Permission denied" when syncing
- **Cause**: Security rules not configured correctly
- **Fix**: Verify rules in Firebase Console → Realtime Database → Rules

### Environment variables not working
- **Cause**: Variables must be prefixed with `VITE_`
- **Fix**: Ensure all variables start with `VITE_FIREBASE_`

## Security Notes

✅ **Safe to expose**: `VITE_*` environment variables are bundled into client-side JavaScript. This is safe because:
- Firebase credentials identify your project (public by design)
- Security is enforced by Firebase Security Rules (server-side)
- Only authenticated users can access their own data

❌ **Never commit**: Do not commit `.env` file to git (already in `.gitignore`)

## Cost

Firebase free tier includes:
- Authentication: 10,000 verifications/month
- Realtime Database: 1 GB storage, 10 GB/month download
- More than sufficient for personal use

## Next Steps

After deployment:
1. Share the app URL with users
2. Users just need to sign in with Google
3. Data syncs automatically across all their devices
4. Monitor usage in Firebase Console if needed

## Support

For detailed setup instructions, see:
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Complete guide
- [README.md](README.md) - General app documentation

For Firebase help:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com)
