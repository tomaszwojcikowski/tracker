# Agent Capabilities and Documentation

This document describes the capabilities of AI agents that can interact with the OnePlus 12 Pro Tracker codebase.

## Project Overview

**Repository**: tomaszwojcikowski/tracker
**Type**: Progressive Web Application (PWA) with offline support
**Framework**: React 18 + Vite 5
**Language**: TypeScript (all new code) + JavaScript (legacy, being migrated)
**Testing**: Vitest + Testing Library + Playwright (E2E)
**Styling**: Tailwind CSS 3
**Cloud Sync**: Firebase Auth + Realtime Database (optional)
**PWA**: Workbox service worker with offline caching

## Codebase Structure

```
tracker/
├── src/
│   ├── App.jsx               # Main application component (~4k lines)
│   ├── main.jsx              # Application entry point
│   ├── main.css              # Global styles
│   ├── constants.js/.ts      # App constants and configuration
│   ├── firebase-service.js   # Firebase auth + realtime sync layer
│   ├── icons.js              # Tree-shaken Lucide icon imports
│   ├── workout-plan-utils.js # Workout plan parsing utilities
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts          # Core types (Exercise, WorkoutSet, AppState, etc.)
│   ├── components/           # Reusable UI components
│   │   ├── PWAPrompt.jsx     # PWA install prompt
│   │   ├── PWAWrapper.jsx    # PWA lifecycle wrapper
│   │   ├── SyncStatusIndicator.jsx  # Cloud sync status display
│   │   └── VolumeCard.jsx    # Volume tracking display
│   ├── hooks/                # Custom React hooks (TypeScript)
│   │   ├── index.ts          # Hook exports with full type definitions
│   │   ├── useAutomergeSync.ts   # CRDT-based sync with Automerge
│   │   ├── useOptimisticSync.ts  # Background cloud sync with debouncing
│   │   ├── usePWA.ts         # PWA install/update hooks
│   │   ├── useAccessibility.ts   # Focus trap, keyboard shortcuts
│   │   └── useTheme.ts       # Theme management hook
│   ├── utils/                # Utility functions (JS + TS)
│   │   ├── index.js/.ts      # Centralized exports
│   │   ├── storage.js/.ts    # localStorage utilities
│   │   ├── time.js/.ts       # Time formatting
│   │   ├── audio.js/.ts      # Web Audio API sounds
│   │   ├── volume.js/.ts     # Volume tracking calculations
│   │   ├── exerciseHistory.js/.ts  # Exercise history management
│   │   ├── automergeSync.ts  # CRDT-based conflict-free merging
│   │   └── sanitize.js/.ts   # DOMPurify HTML sanitization
│   └── test/                 # Unit tests (Vitest + Testing Library)
│       ├── setup.js
│       ├── *.test.jsx        # 12+ test files, 210+ specs
├── e2e/                  # End-to-end tests (Playwright)
│   ├── navigation.spec.js
│   ├── workout.spec.js
│   └── pwa.spec.js
├── public/               # Static assets
├── workout-plan-v2.json  # Current workout program (v2 format)
├── exercises.json        # Exercise library data (50+ exercises)
├── tsconfig.json         # TypeScript configuration
├── playwright.config.js  # E2E test configuration
├── eslint.config.js      # ESLint flat config
├── package.json          # Dependencies and scripts
├── vite.config.js        # Build + PWA configuration
├── vitest.config.js      # Test configuration
└── tailwind.config.js    # Tailwind CSS configuration
```

## Key Capabilities for Agents

### 1. Code Understanding

**Main Application File**: `src/App.jsx` is organized into 11 logical sections:
1. Global State & Data Structures
2. LocalStorage Utilities
3. Schedule Utilities
4. Custom Hooks
5. Application Constants & Program Data
6. UI Components
7. Gemini Integration Utilities
8. Exercise History & Stats Utilities
9. Main Application Components
10. URL & State Management Utilities
11. Application Initialization

**Critical Functions to Understand**:
- `safeGetJSON`, `safeSetJSON`, `safeRemove` - localStorage utilities with error handling
- `buildCompleteSchedule` - Auto-generates warmup/cooldown protocols for weeks 2-21
- `toggleSet` - Handles set completion with RPE data management
- `updateExerciseHistory` - Tracks workout performance
- `calculateExerciseStats` - Computes statistics and 1RM estimates
- `getUrlParams`, `updateUrl`, `saveAppState`, `loadAppState` - State management
- `mergeCloudData` - Timestamp-aware merging of workouts/settings pulled from Firebase
- `initializeFirebase`, `initSync`, `handleLogin`, `handleLogout`, `saveToCloud` (in `src/firebase-service.js`) - Auth lifecycle + realtime sync harness

### 2. Testing

**Test Suite**: 210+ Vitest specs + Playwright E2E tests covering UI logic, storage, routing, cloud sync, and user flows

**Unit Test Categories / Files**:
- Storage utilities — `storageUtils.test.jsx`
- Schedule building — `scheduleUtils.test.jsx`
- Exercise history + stats — `exerciseHistory.test.jsx`
- URL routing & deep links — `urlRouting.test.jsx`
- Set toggle logic + RPE — `toggleSet.test.jsx`
- Firebase timestamp merge + settings sync — `firebaseSync.test.jsx`
- Automerge CRDT sync — `automergeSync.test.jsx`
- Browser history regressions — `backNavigation.test.jsx`
- Optimistic sync hook — `optimisticSync.test.jsx`
- EMOM timer logic — `emomTimer.test.jsx`
- Volume calculations — `volume.test.jsx`
- PWA hooks — `pwa.test.jsx`
- Workout plan utilities — `workoutPlanUtils.test.jsx`
- Shared config/mocks — `src/test/setup.js`

**E2E Test Categories** (Playwright):
- Navigation flows — `e2e/navigation.spec.js`
- Workout tracking — `e2e/workout.spec.js`
- PWA functionality — `e2e/pwa.spec.js`

**Running Tests**:
```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode
npm run test:ui       # UI mode
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # E2E tests with UI
npm run typecheck     # TypeScript type checking
```

**Test Philosophy**:
- All tests use mocked localStorage
- Tests mirror actual implementation logic
- Error handling is explicitly tested
- Integration scenarios are covered

### 3. Build and Development

**Development Commands**:
```bash
npm install           # Install dependencies
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build (includes PWA service worker)
npm run preview      # Preview production build
npm run typecheck    # Run TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
```

**Firebase Environment** (`.env` or `.env.local` - never commit secrets):
```
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_DATABASE_URL="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

**Build Output**:
- `dist/index.html` - Optimized entry point
- `dist/assets/` - Bundled JS (231KB) and CSS (25KB)
- `dist/*.json` - Data files
- `dist/colors.css` - CSS variables

### 4. Feature Implementation Areas

#### Workout Tracking
- Set completion with visual feedback
- Weight and RPE (6-10 scale) logging
- Workout notes (free-text)
- Rest timer with notifications
- Auto-save to localStorage

#### Exercise History & Analytics
- Timeline view of completed workouts
- Exercise statistics (total workouts, max weight, max sets)
- 1RM estimation using Brzycki formula
- Progress graphs with visual weight trends
- Per-exercise detailed history

#### Cloud Sync & Authentication
- Optional Google Sign-In via Firebase Auth (popup flow)
- Per-user data isolation under `users/{uid}` in Firebase Realtime Database
- `initSync` streams cloud changes into the app and `mergeCloudData` resolves conflicts via `lastModified`
- `saveToCloud` pushes sessions, settings, and exercise history after workouts
- Status helpers (`getFirebaseStatus`, `getLastSyncTime`) power UI indicators
- **Optimistic Updates**: `useOptimisticSync` hook provides background sync with debouncing
  - Debounced sync (2s) to batch rapid changes
  - Immediate sync option for critical updates
  - Auto-retry with configurable attempts
  - Offline detection with pending change tracking
- **CRDT-Based Sync**: `useAutomergeSync` hook provides conflict-free merging
  - Uses Automerge CRDTs for automatic conflict resolution
  - No data loss from concurrent edits on multiple devices
  - Deterministic merging - same inputs always produce same output
  - Automatic migration from timestamp-based sync
  - Binary document serialization for efficient storage

#### Progressive Web App (PWA)
- **Offline Support**: Workbox service worker caches app shell and API responses
- **Install Prompt**: Native install experience on supported platforms
- **Update Detection**: Automatic update prompts when new version available
- **Background Sync**: Queued changes sync when connection restored
- **usePWA Hook**: `canInstall`, `isInstalled`, `needsUpdate`, `updateAvailable` states

#### AI Integration (Optional)
- Google Gemini API integration
- Auto-sync on workout completion
- Contextual feedback with workout data
- Interactive Q&A
- Chat history maintenance

#### State Management
- URL-based routing with deep linking
- Browser history support
- localStorage persistence
- State validation and error handling

### 5. Code Modification Guidelines

**When Adding Features**:
1. Follow the modular architecture (components/, hooks/, utils/)
2. **MANDATORY**: Write all new code in TypeScript (`.ts`/`.tsx` extension)
3. Add corresponding tests in `src/test/` (tests can remain `.jsx` for now)
4. Use existing utilities from `src/utils/` (import from `.ts` versions)
5. Define proper types in `src/types/index.ts` for new data structures
6. Maintain error handling patterns with typed error handling
7. Update README.md if user-facing
8. For complex flows, add E2E tests in `e2e/`

**When Fixing Bugs**:
1. Write a failing test first
2. Fix the issue minimally
3. Verify all tests pass
4. Check production build works

**When Refactoring**:
1. Maintain existing test coverage
2. Run tests before and after
3. Keep backward compatibility
4. Update comments if behavior changes

### 6. Data Models

#### Exercise History Entry
```javascript
{
  date: "2024-01-15",           // ISO date string
  week: 5,                      // Week number (1-21)
  day: 1,                       // Day number (1, 2, 3, or 5)
  prescription: "3x8 reps",     // Exercise prescription
  sets: [true, true, true],     // Set completion status
  weight: "50kg",               // Weight used (string or number)
  rpe: { 0: "8", 1: "8", 2: "9" } // RPE per set (optional)
}
```

#### App State
```javascript
{
  viewMode: "tab" | "workout",  // Current view mode
  activeTab: "train" | "library" | "history" | "coach" | "profile",
  currentWeek: 1-21,            // Current week
  activeDay: 1 | 2 | 3 | 5      // Active day (4 is rest)
}
```

#### Exercise Definition
```javascript
{
  id: "pull_ups",
  name: "Pull-Ups",
  primaryMuscles: ["lats", "upper_back"],
  secondaryMuscles: ["biceps", "forearms"],
  equipment: ["bar", "rings"],
  category: "pull",
  isBodyweight: true,
  variations: ["Weighted Pull-Ups", ...]
}
```

### 7. Common Tasks for Agents

#### Task: Add a new test
```bash
# Create test file
touch src/test/newFeature.test.jsx

# Import vitest and setup
import { describe, it, expect, beforeEach, vi } from 'vitest';

# Write tests following existing patterns
# Run: npm test
```

#### Task: Add a new utility function
```typescript
// 1. Create new file in src/utils/ with .ts extension
// 2. Define types in src/types/index.ts if needed
// 3. Add corresponding tests in src/test/
// 4. Document with TSDoc comments
// 5. Export from src/utils/index.ts
// 6. Run npm run typecheck && npm test
```

#### Task: Update dependencies
```bash
# Check current versions
npm outdated

# Update (be cautious with breaking changes)
npm update

# Test thoroughly
npm test && npm run build
```

#### Task: Convert a JavaScript file to TypeScript
```bash
# 1. Create TypeScript version
cp src/utils/myFile.js src/utils/myFile.ts

# 2. Add type annotations, fix any type errors
# 3. Update imports in consuming files
# 4. Run typecheck
npm run typecheck

# 5. Run tests to ensure behavior is unchanged
npm test

# 6. Delete old .js file once migration complete
rm src/utils/myFile.js
```

#### Task: Debug localStorage issues
```typescript
// Use safe utilities for all localStorage access (from .ts version)
import { safeGetJSON, safeSetJSON, safeRemove } from '@/utils/storage';

const data = safeGetJSON<MyType>('key', defaultValue);
const success = safeSetJSON('key', value);
const removed = safeRemove('key');

// Check localStorage in browser DevTools
localStorage.getItem('tracker_app_state');
```

#### Task: Enable Firebase Sync
```bash
# 1. Create .env.local with VITE_FIREBASE_* keys (see FIREBASE_SETUP.md)
# 2. Verify Firebase initialized in console (App Mount -> "Firebase initialized")
# 3. Use handleLogin() to start Google popup auth
# 4. Call saveToCloud(appState) after workout completion
# 5. Confirm initSync merge logs show timestamp decisions
```

### 8. Deployment

**Automatic Deployment**:
- GitHub Actions workflow on push to `main`
- Deploys to GitHub Pages
- See DEPLOYMENT.md for details

**Manual Deployment**:
```bash
npm run build
# Deploy dist/ directory to hosting provider
```

### 9. Known Constraints

**Limitations**:
- Day 4 is always a rest day (not in VALID_DAYS array)
- Week range is 1-21 only
- RPE scale is 6-10 (standard Borg scale)
- localStorage has ~5-10MB limit (browser-dependent)
- Gemini API requires user-provided key
- Firebase sync requires configured VITE_FIREBASE_* env vars; app gracefully degrades to offline mode if missing

**Browser Compatibility**:
- Modern browsers with ES6+ support
- localStorage API required
- Optional: Vibration API for haptic feedback

### 10. Documentation References

- **README.md** - User-facing features and setup
- **TESTING.md** - Manual testing scenarios
- **DEPLOYMENT.md** - GitHub Pages pipeline
- **FIREBASE_SETUP.md** - Local/project Firebase configuration
- **FIREBASE_DEPLOYMENT.md** - Firebase secrets + CI guidance
- **WORKOUT_PLAN_FORMAT.md** - Workout plan JSON schema
- **WORKOUT_PLAN_USAGE.md** - How to use workout plans
- **copilot-instructions.md** (this file) - Agent capabilities and guidelines

### 11. TypeScript Migration Policy

> **⚠️ MANDATORY: All new code MUST be written in TypeScript.**

The codebase is actively migrating to TypeScript. Legacy JavaScript files are being converted incrementally.

**Configuration** (`tsconfig.json`):
- Strict mode enabled for all new code
- `allowJs: true` for backward compatibility during migration
- Path aliases: `@/*` → `src/*`

**Migration Status**:

| Directory | Status | Notes |
|-----------|--------|-------|
| `src/utils/` | ✅ Complete | All utilities have `.ts` versions |
| `src/hooks/` | ✅ Complete | All hooks migrated to TypeScript |
| `src/types/` | ✅ Complete | Core type definitions |
| `src/components/` | 🔄 In Progress | Migrate to `.tsx` as touched |
| `src/App.jsx` | 📋 Planned | Large file, incremental extraction |
| `src/test/` | ⏳ Optional | Tests can remain `.jsx` |

**Fully Typed Modules** (in `src/utils/`):
- `storage.ts` - Generic typed localStorage wrappers
- `time.ts` - Time formatting utilities
- `audio.ts` - Web Audio API utilities
- `sanitize.ts` - DOMPurify HTML sanitization
- `volume.ts` - Volume tracking calculations
- `exerciseHistory.ts` - Exercise history management
- `automergeSync.ts` - CRDT-based conflict-free data merging

**Fully Typed Hooks** (in `src/hooks/`):
- `index.ts` - Hook exports with full type definitions
- `useAutomergeSync.ts` - CRDT-based sync with Automerge
- `useOptimisticSync.ts` - Cloud sync with typed status
- `usePWA.ts` - PWA lifecycle with typed state
- `useAccessibility.ts` - Focus trap, keyboard shortcuts
- `useTheme.ts` - Theme management with typed themes

**Core Types** (`src/types/index.ts`):
```typescript
// Key interfaces available:
Exercise, WorkoutSet, ExerciseSession, DaySession,
WorkoutProgress, ExerciseHistoryEntry, AppState, UserProfile,
SessionKey, CloudData
```

**Automerge Types** (`src/utils/automergeSync.ts`):
```typescript
// CRDT document types:
AutomergeDoc, AutomergeSessionData, AutomergeBinary
```

**Writing New TypeScript Code**:
```typescript
// 1. Import from utils with type safety
import { safeGetJSON, safeSetJSON } from '@/utils/storage';

// 2. Use generic typed localStorage
const data = safeGetJSON<MyType>('key', defaultValue);

// 3. Define new types in src/types/index.ts
export interface MyNewFeature {
  id: string;
  data: Record<string, unknown>;
}

// 4. Export typed hooks
export function useMyHook(): MyHookReturn {
  // Implementation
}
```

**Converting Existing Files**:
1. Create `.ts`/`.tsx` version alongside `.js`/`.jsx`
2. Add proper type annotations
3. Update imports to use new typed version
4. Delete old `.js`/`.jsx` file once all consumers migrated
5. Run `npm run typecheck` to verify

## Best Practices for AI Agents

1. **Read First**: Always examine existing code patterns before implementing changes
2. **Test Everything**: Write tests for new functionality, run all tests before completing
3. **TypeScript Mandatory**: All new code MUST be TypeScript (`.ts`/`.tsx`). No exceptions.
4. **Type Definitions**: Add new interfaces/types to `src/types/index.ts`
5. **Error Handling**: Use typed error handling with proper error types
6. **Documentation**: Update README.md for user-facing changes, use TSDoc for code
7. **Validation**: Validate inputs with TypeScript type guards when needed
8. **Backward Compatibility**: Don't break existing functionality
9. **Performance**: Consider bundle size and runtime performance
10. **Security**: Never commit API keys or sensitive data; use DOMPurify for user content
11. **Code Style**: Follow existing patterns (2-space indent, TSDoc comments)
12. **Cloud Sync Guards**: Always check `isFirebaseInitialized()`/user auth before invoking sync helpers
13. **PWA Awareness**: Test offline scenarios; use `useOptimisticSync` for cloud operations
14. **CRDT Sync**: Prefer `useAutomergeSync` for new sync features; it provides conflict-free merging
15. **Modular Architecture**: Place new code in appropriate directories (components/, hooks/, utils/)
16. **Run Typecheck**: Always run `npm run typecheck` before committing TypeScript changes

## Agent Interaction Examples

### Example 1: Adding a New Feature Test
```javascript
// Agent should:
// 1. Create test file in src/test/
// 2. Import necessary testing utilities
// 3. Follow existing test structure
// 4. Mock localStorage appropriately
// 5. Test happy path and error cases
// 6. Run npm test to verify
```

### Example 2: Fixing a Bug
```javascript
// Agent should:
// 1. Locate the bug in App.jsx
// 2. Write a failing test that reproduces the bug
// 3. Fix the bug minimally
// 4. Verify the test now passes
// 5. Run full test suite
// 6. Check production build
```

### Example 3: Updating Documentation
```markdown
// Agent should:
// 1. Read existing README.md structure
// 2. Add content in appropriate section
// 3. Use consistent formatting (emojis, bullets)
// 4. Include code examples if relevant
// 5. Verify markdown renders correctly
```

## Conclusion

This codebase is well-structured with comprehensive test coverage. Agents should leverage existing utilities and patterns, maintain test coverage, and follow the established code organization. The application is production-ready with automatic deployment and requires careful attention to data persistence and state management.

For questions or clarifications, refer to the code comments, existing tests, and documentation files.
