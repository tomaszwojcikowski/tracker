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
- `dist/workout-plan-v2.5.json` - Workout plan data (current version)
- `dist/exercises.json` - Exercise library data
- `dist/colors.css` - CSS custom properties

### Technology Stack

- **React 19** - UI framework (Latest stable)
- **TypeScript 5** - Type-safe programming (100% migrated)
- **Tailwind CSS v4** - CSS-first utility framework with Material Design 3 integration
- **Vite 7** - Ultra-fast build tool and dev server
- **Vitest 4** - Modern unit testing framework
- **Playwright** - Reliable end-to-end testing
- **Testing Library** - Comprehensive React component testing
- **Lucide Icons** - Tree-shaken vector icons
- **Firebase 12** - Secure cloud sync and Google authentication
- **Automerge** - CRDT-based conflict-free data synchronization
- **Google Gemini AI** - Optional personalized coaching integration
- **Sentry** - Optional production error monitoring
- **Workbox** - Advanced PWA service worker logic

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run E2E tests (Playwright)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run TypeScript type checking
npm run typecheck
```

The test suite includes **1,300+ comprehensive specs** across 70+ test files, covering:
- **Storage Utilities** (`storageUtils.test.tsx`): LocalStorage operations with error handling
- **Schedule Building** (`scheduleUtils.test.tsx`): Schedule data loading and processing
- **Exercise History & Stats** (`exerciseHistory.test.tsx`, `exerciseHistoryComprehensive.test.tsx`): Workout timelines, stats, and 1RM calculations
- **URL Routing & Deep Links** (`urlRouting.test.tsx`): State management, URL parsing, navigation behavior
- **Set Toggle Logic** (`toggleSet.test.tsx`): Workout progress tracking and RPE data management
- **Firebase Timestamp Merge** (`firebaseSync.test.tsx`): Cloud/local conflict resolution using `lastModified`
- **Automerge CRDT Sync** (`automergeSync.test.tsx`): Conflict-free data synchronization
- **Browser History Regression** (`backNavigation.test.tsx`): Ensures forward/back buttons stay in sync with state
- **Optimistic Sync Hook** (`optimisticSync.test.tsx`): Background cloud sync with debouncing
- **Action Logging** (`actionLogger.test.tsx`, `useActionLogger.test.tsx`): User action tracking and CSV export (58 tests)
- **EMOM Timer Logic** (`emomTimer.test.tsx`, `densityTimer.test.tsx`): Timer functionality for special exercise types
- **Volume Calculations** (`volume.test.tsx`): Training volume tracking
- **PWA Hooks** (`pwa.test.tsx`): Progressive Web App functionality
- **Workout Plan Utilities** (`workoutPlanUtils.test.tsx`): Workout plan parsing and validation
- **Flow Exercise Feature** (`flowExercise.test.tsx`): Flow exercise sequences
- **Focus Mode** (`focusMode.test.tsx`): Single-exercise focus view
- **Exercise Options** (`exerciseOptions.test.tsx`, `exerciseOptionsModal.test.tsx`): Exercise customization
- **Density Controls** (`densityRepControls.test.tsx`): Density exercise rep tracking
- **Error Handling** (`errorBoundary.test.tsx`, `errorReporting.test.tsx`): Error boundaries and reporting
- **Accessibility** (`accessibility.test.tsx`): Keyboard navigation and screen reader support
- **UI Components** (`exerciseCard.test.tsx`, `addedExerciseCard.test.tsx`, `exerciseCollapse.test.tsx`): Component behavior
- **Feature Integrity** (`featureIntegrity.test.tsx`): Cross-feature integration testing
- **Shared config/mocks** — `src/test/setup.js`

For detailed manual testing scenarios, see [TESTING.md](TESTING.md).

## Features

### 🏋️ Core Training Experience
- **Progressive Set Tracking**: Mark sets as complete with visual feedback and haptic responses.
- **Material Design 3 UI**: Full implementation of MD3 color system, elevation, and typography.
- **Focus Mode**: Distraction-free single-exercise view with swipe navigation for immersive workouts.
- **Dynamic Training Protocols**: Built-in support for EMOM, Density, and Flow exercise types with specialized timers and controls.
- **Superset Support**: Group exercises together with visual indicators and optimized execution flows.
- **Weight & RPE Logging**: Track weight and Rate of Perceived Exertion (RPE 6-10) for every set.
- **Rest & EMOM Timers**: Integrated timers with notifications and audio cues to optimize recovery.
- **Dynamic Exercise Modification**: Add, remove, or customize exercise variations on the fly during active sessions.

### 📊 Intelligence & Analytics
- **Personal Records**: Automatic PR tracking and highlights for every exercise in your library.
- **Progress Visualization**: Interactive charts for weight progression, volume, and performance trends.
- **1RM Estimation**: Real-time Brzycki formula calculations providing strength insights for every lift.
- **Calendar View**: Comprehensive training schedule visualization showing completed and upcoming sessions.
- **AI Coaching (Optional)**: Deep integration with Google Gemini for personalized session analysis and feedback.
- **User Action Logging**: Detailed tracking of user interactions with CSV export for UX analysis and flow optimization.

### ☁️ Data & Persistence
- **Offline-First Resilience**: Full PWA capabilities with Workbox service worker for seamless offline usage even in gyms with poor connectivity.
- **Zero-Conflict Sync**: Advanced Automerge CRDT-based synchronization for perfect data consistency across multiple devices concurrently.
- **Google Sign-In**: Secure authentication and cloud storage powered by Firebase Auth and Realtime Database.
- **Universal Library Search**: Fast exercise lookup with muscle-group filtering, historical performance access, and smart variations.
- **Optimistic Updates**: Background cloud sync with intelligent debouncing ensures the UI stays snappy regardless of network latency.

### 🧭 State Management & Navigation
- **URL-Based Routing**: Shareable URLs that deep-link to specific workouts, tabs, or individual exercises for easy reference.
- **Browser History Support**: Native back/forward behavior preserved throughout the single-page application experience.
- **Haptic Design Language**: Physical vibration feedback patterns for set completions, timer alerts, and critical UI interactions.
- **Gesture-Driven UX**: Intuitive swipe-to-navigate, pull-to-refresh, and long-press actions optimized for mobile use.

### 🛠️ Developer Excellence
- **100% TypeScript**: Modern, type-safe codebase using strict mode, custom decorators, and advanced utility types.
- **Massive Test Coverage**: over 1,300+ unit and E2E tests ensuring stability, accessibility, and performance across all features.
- **Tailwind CSS v4**: Bleeding-edge CSS-first configuration and performance-oriented styling with MD3 semantic tokens.
- **Vite 7**: Next-gen build pipeline providing ultra-fast HMR and highly optimized production bundles.

### 📦 Program & Program Management
- **Structured Programs**: Support for multi-week programs with phases, warm-ups, main work, and cool-downs.
- **Dynamic Import/Export**: Import custom JSON workout plans with strict schema validation or export your progress.
- **Version Migration**: Automatic, non-destructive migration between program format versions (v2.x).
- **Progress Archiving**: Snapshot your training history before starting new cycles or resets.

### ⚡ User Experience
- **Theme Support**: Integrated light and dark modes with automatic system preference detection.
- **Accessibility**: ARIA-standard keyboard navigation, focus trap management, and screen reader compatibility.
- **Animations**: Fluid transitions and micro-interactions powered by Framer Motion for a premium feel.
- **Error Resilience**: Robust error boundary protection with Sentry integration for real-time monitoring and reporting.

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

### Error Reporting Setup (Optional)

To enable automatic error tracking and monitoring with Sentry:

1. Create a free account at [Sentry.io](https://sentry.io)
2. Create a new React project
3. Copy your DSN and set the environment variable:
   ```env
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
   ```

The app will automatically capture and report errors, helping you identify and fix issues quickly.

**For detailed setup instructions, see [ERROR_REPORTING_SETUP.md](ERROR_REPORTING_SETUP.md)**

## User Action Logging

The app includes a comprehensive user action logging system for UX analysis and improvement. Logs track user interactions including navigation, workout activities, and system events.

### Features

- **Automatic Tracking**: Logs user actions automatically without disrupting the workout experience
- **Privacy-First**: PII (Personally Identifiable Information) is automatically filtered from logs
- **Configurable**: Enable/disable logging, adjust sampling rates, and exclude specific categories
- **Storage Management**: Circular buffer with automatic rotation based on age and count limits
- **CSV Export**: Export logs in CSV format for analysis by AI agents or data tools
- **Rich Metadata**: Logs include timestamp, session ID, action type, category, and contextual information

### Log Categories

- **Navigation**: Tab changes, view switches, deep links, program changes
- **Workout**: Session start/end, pause/resume, completion tracking
- **Exercise**: Set completion, weight/RPE changes, exercise modifications
- **Timer**: Rest, EMOM, and density timer interactions
- **Settings**: Configuration changes
- **Data**: Import/export operations, cloud sync events
- **UI**: Modal interactions, gestures, pull-to-refresh
- **Error**: Error tracking and boundary captures
- **Performance**: Page load times and metrics

### Configuration

Access action log settings in **Settings → Logs** tab:

1. **Enable/Disable**: Toggle action logging on or off
2. **View Statistics**: See total logs, storage usage, category breakdown, and top actions
3. **Export**: Download logs as CSV with optional metadata columns
4. **Clear**: Remove old logs or clear all logs

### Default Settings

- **Enabled**: Yes
- **Max Logs**: 10,000 entries
- **Max Age**: 30 days
- **Sampling Rate**: 100% (log all actions)
- **Sensitive Data**: Excluded by default

### Usage for Developers

The logging system can be integrated into any component using the `useActionLogger` hook:

```typescript
import { useActionLogger } from '@/hooks';

function MyComponent() {
  const logger = useActionLogger({ component: 'MyComponent' });

  const handleAction = () => {
    logger.logUI('button_click', 'User clicked submit', {
      uiContext: { elementType: 'button' }
    });
  };

  return <button onClick={handleAction}>Submit</button>;
}
```

For programmatic access without a React component, use the action logger utility directly:

```typescript
import { logAction } from '@/utils/actionLogger';

logAction('workout', 'set_complete', 'Completed set 1', {
  workoutContext: {
    week: 5,
    day: 1,
    exerciseId: 'squats',
    setIndex: 0
  }
});
```

### Export Format

CSV exports include the following columns:

**Basic Export**:
- ID, Timestamp, Session ID, Category, Type, Description

**Full Export (with metadata)**:
- All basic columns plus: View Mode, Active Tab, Current Week, Active Day, Exercise ID, Set Index, Component, Timer Type, Error Severity, Metadata JSON

The exported data can be analyzed by AI agents to identify:
- Common user flows and navigation patterns
- Points of friction or confusion
- Feature usage frequency
- Error patterns and recovery paths
- Performance bottlenecks

## Workout Plan Format

The tracker supports two workout plan formats:

### Format v1.0.0 (Legacy)
- Flat array structure with abbreviated field names
- File: `full-schedule.json`
- Used for backward compatibility

### Format v2.5.0 (Current)
- Comprehensive structured format with full metadata and program rules
- File: `workout-plan-v2.5.json`
- Features:
  - Plan metadata (name, description, author, goals)
  - Phase/mesocycle structure (multiple training phases/blocks)
  - Enhanced exercise specifications (tempo, rest, RPE, load)
  - Support for density exercises (rep targets within time limits)
  - Support for flow exercises (multi-movement sequences)
  - Support for supersets and exercise grouping
  - Full field names (no abbreviations)
  - Better organization and extensibility

### Migration

The app automatically detects and supports multiple formats (v2.2, v2.3, v2.4, v2.5). To migrate an existing plan:

```bash
node scripts/migrate-workout-plan-v2-2-to-v2-3.mjs
node scripts/migrate-workout-plan-v2-3-to-v2-4.mjs
node scripts/migrate-workout-plan-v2-4-to-v2-5.mjs
```

These generate:
- `workout-plan-v2.x.json` - Converted plan in new format
- `migration-report.json` - Detailed migration report

For complete format specification, see [WORKOUT_PLAN_FORMAT.md](WORKOUT_PLAN_FORMAT.md)

## 🚀 Potential Roadmap

### 🏁 Short-Term (Q1 2026)
- [ ] **Advanced Volume Analytics**: Visual distribution of training load across primary and secondary muscle groups.
- [ ] **Progressive Intensity Scoring**: Algorithm-based recommendations for weight/reps adjusted for session RPE.
- [ ] **Interactive Onboarding 2.0**: Guided tour for new features (Density, Flow, Focus Mode).

### 🏔️ Mid-Term (Q2-Q3 2026)
- [ ] **AI Program Generation**: GPT/Gemini-driven creation of unique workout cycles based on user goals and equipment.
- [ ] **Wearable Integration**: Companion app for Apple Watch and WearOS for heart rate tracking and set completion.
- [ ] **Muscle Load Heatmaps**: 3D or 2D anatomical visualization of accumulated fatigue and training focus.

### 🌌 Long-Term (2027+)
- [ ] **Social Training Ecosystem**: Shared programs, community challenges, and verified coach profiles.
- [ ] **Native Mobile Releases**: Capacitor or React Native wrappers for App Store and Play Store availability.
- [ ] **Computer Vision Form Analysis**: Optional real-time form feedback using device camera and ML.
