# OnePlus 12 Pro Tracker

A progressive web app for tracking workouts with AI-powered coaching feedback. Built with React, Tailwind CSS, and optional Google Gemini AI integration for personalized training insights.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/tomaszwojcikowski/tracker.git
cd tracker

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

Visit `http://localhost:5173/` to start tracking your workouts!

> **Optional (Firebase Cloud Sync)**: Create a `.env.local` file with your Firebase credentials before running the dev server. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for the full variable list and setup flow.

## Deployment

This repository includes a GitHub Actions workflow that automatically builds and deploys the application to GitHub Pages on every push to the `main` branch. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions and configuration options.

## Production Build Setup

This project uses a modern build pipeline to ensure optimal production performance:

- **Tailwind CSS**: Properly installed as a PostCSS plugin (not via CDN)
- **React**: Pre-compiled with Babel (no in-browser transformation)
- **Vite**: Fast build tool for bundling and optimization

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at `http://localhost:5173/`

### Production Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

The production build outputs to the `dist/` directory and includes:
- Minified and bundled JavaScript
- Optimized CSS with Tailwind utilities
- Static assets (JSON files, CSS variables)

### Build Output

- `dist/index.html` - Optimized HTML entry point
- `dist/assets/` - Bundled JS and CSS files
- `dist/*.json` - Data files (schedule and exercises)
- `dist/colors.css` - CSS custom properties

### Technology Stack

- **React 18** - UI framework
- **Tailwind CSS 3** - Utility-first CSS framework
- **Vite 5** - Build tool and dev server
- **Vitest** - Unit testing framework
- **Testing Library** - React component testing
- **Lucide Icons** - Icon library
- **Firebase** - Cloud sync and Google authentication
- **Google Gemini AI** - Optional AI coaching integration

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

The test suite includes 100+ comprehensive Vitest specs covering:
- **Storage Utilities** (`storageUtils.test.jsx`): LocalStorage operations with error handling
- **Schedule Building** (`scheduleUtils.test.jsx`): Auto-generation of warmup/cooldown protocols
- **Exercise History & Stats** (`exerciseHistory.test.jsx`): Workout timelines, stats, and 1RM calculations
- **URL Routing & Deep Links** (`urlRouting.test.jsx`): State management, URL parsing, navigation behavior
- **Set Toggle Logic** (`toggleSet.test.jsx`): Workout progress tracking and RPE data management
- **Firebase Timestamp Merge** (`firebaseSync.test.jsx`): Cloud/local conflict resolution using `lastModified`
- **Browser History Regression** (`backNavigation.test.jsx`): Ensures forward/back buttons stay in sync with state

For detailed manual testing scenarios, see [TESTING.md](TESTING.md).

## Features

### 🏋️ Workout Tracking & Logging
- **Progressive Set Tracking**: Mark sets as complete with visual feedback and haptic responses
- **Weight & RPE Logging**: Track weight lifted and Rate of Perceived Exertion (RPE scale 6-10) for each set
- **Workout Notes**: Add free-text notes to document your workout sessions, training observations, and form cues
- **Rest Timer**: Built-in countdown timer with notifications to optimize rest periods between sets
- **Dynamic Exercise Addition**: Add custom exercises from the library during your workout
- **Auto-generated Protocols**: Automatic warmup and cooldown routines for weeks 2-21 based on workout type
- **Session Persistence**: Your workout progress is automatically saved and survives page reloads

### 📊 Exercise History & Analytics
- **Comprehensive History View**: Timeline of all completed workouts with expandable details
- **Exercise Statistics**: Track total workouts, max sets, max weight, and estimated 1RM for each exercise
- **Progress Graphs**: Visual weight progression charts showing your strength gains over time
- **Personal Records**: Automatically calculated and tracked for all exercises
- **Per-Exercise Details**: Detailed history showing weight, sets, reps, and RPE for each session
- **1RM Estimation**: Brzycki formula used to estimate one-rep max from your working sets

### 🤖 AI-Powered Coaching (Optional)
- **Google Gemini Integration**: Connect with Gemini AI for personalized workout feedback
- **Auto-sync on Completion**: Automatically sync completed workouts to receive AI analysis
- **Contextual Feedback**: AI considers your workout notes, RPE values, and performance history
- **Interactive Q&A**: Ask your AI coach questions about form, programming, or recovery
- **Chat History**: Maintains conversation context for more relevant coaching advice
- **Configurable**: Enable/disable auto-sync and test API connectivity from Settings

### 🗂️ Exercise Library
- **Comprehensive Database**: 50+ exercises with detailed information
- **Smart Filtering**: Filter by muscle groups (pull, push, legs, core)
- **Search Functionality**: Quick search to find exercises by name
- **Exercise Details**: View primary/secondary muscles, equipment needed, and available variations
- **Exercise History Access**: View historical performance directly from the library

### 🧭 State Management & Navigation
- **URL-Based Routing**: Shareable URLs that deep-link to specific workouts or tabs
- **Browser History Support**: Back/forward buttons work correctly throughout the app
- **State Persistence**: Last viewed workout/tab is remembered across sessions
- **Multi-Tab Navigation**: Switch between Train, Library, History, Coach, and Settings tabs
- **URL Priority**: URL parameters override saved state for reliable deep linking

### 📱 Progressive Web App
- **Mobile-First Design**: Optimized touch targets and responsive layout for phone use
- **Offline Support**: LocalStorage-based persistence works without internet connection
- **Fast Performance**: Built with Vite for optimal load times and bundle size
- **Haptic Feedback**: Physical vibration feedback for set completions and timer alerts
- **Installable**: Can be added to home screen as a standalone app

### ☁️ Cloud Sync & Authentication (Firebase)
- **Google Sign-In**: Secure authentication with your Google account
- **Real-time Sync**: Automatically sync workout data across all your devices
- **Private Data**: Each user's data is securely isolated with Firebase Security Rules
- **Bidirectional Sync**: Changes on any device instantly appear on all other devices
- **Automatic & Manual Sync**: Choose between automatic sync or manual control
- **Offline-First**: Works offline, syncs when connection is restored
- **Cross-Device Support**: Use the same account on phone, tablet, and desktop

### 🎯 Program Structure
- **21-Week Program**: Structured training plan with 4 training days per week (Days 1, 2, 3, 5)
- **Week-Based Navigation**: Easy navigation through program weeks
- **Section Organization**: Workouts divided into Warm-up, Main Work, and Cool-down sections
- **Progress Tracking**: Visual indicators show completion status for each section
- **Collapsible Exercises**: Compact view for completed exercises to reduce scrolling

### ⚡ User Experience
- **Fast Interactions**: Debounced search inputs and optimized rendering
- **Keyboard Shortcuts**: Escape key to dismiss toasts and modals
- **Visual Progress**: Mini progress bars and completion percentages throughout
- **Toast Notifications**: Non-blocking notifications for sync status and timer completion
- **Error Handling**: Graceful degradation with helpful error messages

## Configuration

### Firebase Cloud Sync Setup

Cloud sync is **optional** and configured at build/deployment time. Once configured, users just need to sign in.

#### For End Users (Simple!)

If the app is deployed with Firebase enabled:

1. Open Settings tab
2. Click **Sign In with Google** in the Cloud Sync section
3. That's it! Your data syncs automatically across all devices

#### For Developers/Deployers

To enable Firebase cloud sync in your deployment:

1. Create a Firebase project (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md))
2. Set environment variables in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
   ```
3. Build and deploy: `npm run build`

**Note**: Without Firebase configuration, the app works fully offline with localStorage. Firebase is purely optional for cross-device sync.

**For detailed setup instructions, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md) and [FIREBASE_DEPLOYMENT.md](FIREBASE_DEPLOYMENT.md)**

### AI Coaching Setup (Optional)

To enable AI-powered coaching feedback:

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key for Gemini

2. **Configure in App**:
   - Navigate to Settings tab
   - Enter your Gemini API key
   - Click "Test" to validate the key
   - Click "Validate & Save" to store it
   - Toggle "Auto-sync with Coach AI" on/off as desired

3. **Using AI Coaching**:
   - Complete workouts with auto-sync enabled for automatic feedback
   - View AI analysis in the Coach tab
   - Ask questions to get personalized training advice
   - AI considers your workout notes, RPE values, and exercise history

**Note**: Both Firebase configuration and Gemini API key are stored locally in your browser. With Firebase sync enabled, your settings sync across all your devices securely.

## Workout Plan Format

The tracker supports two workout plan formats:

### Format v1.0.0 (Legacy)
- Flat array structure with abbreviated field names
- File: `full-schedule.json`
- Used for backward compatibility

### Format v2.0.0 (Current)
- Comprehensive structured format with full metadata
- File: `workout-plan-v2.json`
- Features:
  - Plan metadata (name, description, author, goals)
  - Phase/mesocycle structure (6 training phases)
  - Enhanced exercise specifications (tempo, rest, RPE, load)
  - Full field names (no abbreviations)
  - Better organization and extensibility

### Migration

The app automatically detects and supports both formats. To migrate an existing v1.0.0 plan to v2.0.0:

```bash
node migrate-workout-plan.js
```

This generates:
- `workout-plan-v2.json` - Converted plan in new format
- `migration-report.json` - Detailed migration report

For complete format specification, see [WORKOUT_PLAN_FORMAT.md](WORKOUT_PLAN_FORMAT.md)
