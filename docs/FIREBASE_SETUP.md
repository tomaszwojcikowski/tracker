# Firebase Setup Guide

This guide will help you set up Firebase for the tracker application to enable cloud sync and Google authentication.

## Overview

The Firebase integration provides:
- **Google Authentication**: Sign in with your Google account
- **Realtime Data Sync**: Automatically sync workout data across all your devices
- **Secure Storage**: Each user's data is private and protected by Firebase Security Rules
- **Offline Support**: Works offline with localStorage, syncs when online

## Prerequisites

- A Google account
- Access to [Firebase Console](https://console.firebase.google.com)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add Project"** or **"Create a project"**
3. Enter a project name (e.g., `tracker-app`)
4. Click **Continue**
5. (Optional) Enable Google Analytics if desired
6. Click **Create Project**
7. Wait for the project to be created, then click **Continue**

## Step 2: Enable Google Authentication

1. In your Firebase project, click **Build** → **Authentication** in the left sidebar
2. Click **Get started** if this is your first time
3. Click the **Sign-in method** tab
4. Find **Google** in the list of providers
5. Click **Google** to expand it
6. Toggle **Enable** to ON
7. Enter a **Support email** (your email address)
8. Click **Save**

### Add Authorized Domains (Important for Production)

1. Still in the **Authentication** section, click the **Settings** tab
2. Scroll down to **Authorized domains**
3. Add your production domain (e.g., `yourapp.github.io`)
4. `localhost` is already authorized by default for development

## Step 3: Create Realtime Database

1. In your Firebase project, click **Build** → **Realtime Database** in the left sidebar
2. Click **Create Database**
3. Select a location for your database (choose one close to your users):
   - `us-central1` (United States)
   - `europe-west1` (Belgium)
   - Other regions available
4. Click **Next**
5. Select **Start in test mode** (we'll secure it next)
6. Click **Enable**

## Step 4: Configure Security Rules

Security rules ensure that each user can only access their own data.

1. In the **Realtime Database** section, click the **Rules** tab
2. Delete the existing rules
3. Paste the following rules:

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

4. Click **Publish**

### What These Rules Do

- **`.read: "$uid === auth.uid"`**: Users can only read data where the path `$uid` matches their authenticated user ID
- **`.write: "$uid === auth.uid"`**: Users can only write data where the path `$uid` matches their authenticated user ID
- This creates a **user-private data model** where each user has their own branch at `/users/{uid}`
- Unauthenticated users cannot read or write any data

## Step 5: Get Firebase Configuration

1. In your Firebase project, click the **gear icon** (⚙️) next to **Project Overview**
2. Click **Project settings**
3. Scroll down to **Your apps** section
4. Click the **Web** icon (`</>`) to add a web app
5. Enter an app nickname (e.g., `Tracker Web App`)
6. Do NOT check "Also set up Firebase Hosting" (unless you want to)
7. Click **Register app**
8. Copy the **firebaseConfig** object. It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

9. Click **Continue to console**

## Step 6: Configure App with Firebase Credentials

Firebase credentials are configured at **build time** using environment variables. This means users don't need to configure Firebase - it's already built into the app.

### For App Developers/Deployers

1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your Firebase credentials from Step 5:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   ```

3. Build the app (credentials will be bundled):
   ```bash
   npm run build
   ```

4. Deploy the `dist/` directory to your hosting service

### For GitHub Actions / CI/CD

If deploying via GitHub Actions or other CI/CD:

1. Go to your repository **Settings** → **Secrets and variables** → **Actions**
2. Add these repository secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_AUTH_DOMAIN`

3. Update your workflow to use these secrets during build

### Security Note

Environment variables prefixed with `VITE_` are **public** - they're bundled into the client-side JavaScript. This is safe because:
- Firebase credentials are designed to be public (they identify your project)
- Security is enforced by Firebase Security Rules, not by hiding credentials
- Only authenticated users can access data, as defined by your security rules

## Step 7: Using Cloud Sync (End Users)

Once the app is deployed with Firebase configuration:

1. Open the tracker app
2. Navigate to the **Settings** tab (profile icon in bottom navigation)
3. Look for the **Cloud Sync** section
4. Click **Sign In with Google**
5. A Google Sign-In popup will appear
6. Select your Google account
7. Grant the requested permissions
8. Your profile will be displayed in the Settings page
9. Your local data will automatically sync to the cloud

**That's it!** No configuration needed - just sign in and your data syncs automatically.

### Enable Automatic Sync

1. In the **Firebase Sync** section, toggle **Automatic Sync** to ON
2. Now all your workout data will automatically sync to the cloud as you make changes

### Manual Sync

If you prefer to control when data is synced:
1. Keep **Automatic Sync** OFF
2. Click **Manual Sync** button whenever you want to upload your data

## Data That Gets Synced

The following data is synchronized to Firebase:

- **Workout Sessions**: All completed and in-progress workouts (Week 1-21, Days 1,2,3,5)
- **Exercise History**: Your workout history and statistics
- **Settings**: Gemini API key and preferences
- **Workout Notes**: Free-text notes for each workout

## Using on Multiple Devices

1. On your first device (e.g., laptop):
   - Configure Firebase and sign in
   - Your local data is uploaded to the cloud

2. On your second device (e.g., phone):
   - Configure Firebase with the SAME credentials
   - Sign in with the SAME Google account
   - Your data will automatically download and sync

3. Changes on any device are instantly reflected on all other devices where you're signed in

## Security and Privacy

- Your data is stored in Firebase Realtime Database under `/users/{your-uid}`
- Only you can access your data (enforced by Firebase Security Rules)
- Your Firebase configuration values are stored locally in your browser
- Your Gemini API key (if configured) is synced to your private Firebase space
- No one else, including the app developers, can access your data

## Troubleshooting

### Error: "Login failed: auth/popup-blocked"

**Solution**: Your browser is blocking the Google Sign-In popup. Check your browser's popup blocker settings and allow popups for this site.

### Error: "Login failed: auth/unauthorized-domain"

**Solution**: Your domain is not authorized in Firebase.
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your domain to the list

### Error: "Sync failed: permission-denied"

**Solution**: Your Firebase Security Rules may not be configured correctly.
1. Go to Firebase Console → Realtime Database → Rules
2. Verify the rules match the ones in Step 4
3. Make sure you're signed in with a Google account

### Error: "Failed to initialize Firebase"

**Solution**: Your Firebase configuration is incomplete or incorrect.
1. Double-check all values from Firebase Console → Project Settings
2. Make sure you copied the entire value for each field
3. Try re-saving the configuration

### Data Not Syncing

**Possible causes:**
1. **Not signed in**: Make sure you're signed in with Google
2. **Automatic Sync disabled**: Enable Automatic Sync or use Manual Sync
3. **Network issues**: Check your internet connection
4. **Browser cache**: Try clearing your browser cache and signing in again

### Testing Sync Across Devices

To test that sync is working:
1. On Device A: Make a change (e.g., complete a set)
2. On Device B: Refresh the page or wait a few seconds
3. The change from Device A should appear on Device B

## Advanced: Using Environment Variables

If you're deploying the app yourself, you can pre-configure Firebase by setting environment variables during build time. This is optional and not required for normal use.

Add these to your `.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

Then modify `src/firebase-service.js` to use these values if available.

## Cost and Quotas

Firebase offers a generous free tier:

- **Authentication**: 10,000 verifications/month (free)
- **Realtime Database**: 
  - 1 GB stored (free)
  - 10 GB/month downloaded (free)
  - 100 simultaneous connections (free)

For a personal fitness tracking app, you're extremely unlikely to exceed these limits.

## Next Steps

- ✅ Firebase is now configured
- 🏋️ Start tracking workouts
- 📱 Install the app on your other devices
- 🔄 Enjoy automatic sync across all your devices

## Support

If you encounter issues not covered in this guide:
1. Check the browser console for error messages
2. Verify your Firebase configuration in the Firebase Console
3. Review Firebase Security Rules
4. Ensure you're using a supported browser (Chrome, Firefox, Safari, Edge)
