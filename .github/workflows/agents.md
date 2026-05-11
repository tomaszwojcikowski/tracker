# Agent Capabilities and Documentation

This document describes the capabilities of AI agents that can interact with the OnePlus 12 Pro Tracker codebase.

## Project Overview

**Repository**: tomaszwojcikowski/tracker
**Type**: Progressive Web Application (PWA)
**Framework**: React 18 + Vite 5
**Language**: TypeScript (fully migrated)
**Testing**: Vitest + Testing Library + Playwright (E2E)
**Styling**: Tailwind CSS 3
**Cloud Sync**: Firebase Auth + Realtime Database (optional)
**Error Tracking**: Sentry (optional)
**PWA**: Workbox service worker

## Codebase Structure

```
tracker/
├── src/
│   ├── App.tsx               # Main application component (TypeScript)
│   ├── main.tsx              # Application entry point
│   ├── main.css              # Global styles
│   ├── constants.ts          # App constants and configuration
│   ├── firebase-service.ts   # Firebase auth + realtime sync layer
│   ├── icons.ts              # Tree-shaken Lucide icon imports
│   ├── workout-plan-utils.ts # Workout plan parsing utilities
│   ├── sw.ts                 # Service worker for PWA
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts          # Core types
│   ├── components/           # Reusable UI components (30+ components)
│   ├── hooks/                # Custom React hooks (15+ hooks)
│   ├── utils/                # Utility functions (all TypeScript)
│   ├── context/              # React context providers
│   ├── services/             # Service layer
│   ├── data/                 # Data utilities
│   └── test/                 # Test suite (60+ test files, 300+ specs)
│       ├── setup.js
│       ├── __mocks__/
│       └── *.test.tsx
├── data/                     # Data files (JSON)
│   ├── exercises.json        # Exercise library data (50+ exercises)
│   ├── workout-plan-v2.5.json # Current workout program
│   └── *.schema.json         # JSON schemas for validation
├── docs/                     # Documentation
├── scripts/                  # Migration and utility scripts
├── e2e/                      # End-to-end tests (Playwright)
├── public/                   # Static assets
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
└── vite.config.js            # Build + PWA configuration
```

## Key Capabilities for Agents

### 1. Code Understanding

**Main Application File**: `src/App.tsx` is organized into modular sections with TypeScript types

**Critical Functions to Understand**:
- `safeGetJSON`, `safeSetJSON`, `safeRemove` (storage.ts) - localStorage utilities with error handling
- `buildCompleteSchedule` (schedule.ts) - Stores schedule data in memory
- `getWorkoutForDay` (programData.ts) - Retrieves workout data with full exercise details
- `toggleSet` - Handles set completion with RPE data management
- `updateExerciseHistory` (exerciseHistory.ts) - Tracks workout performance
- `calculateExerciseStats` - Computes statistics and 1RM estimates
- `getUrlParams`, `updateUrl`, `saveAppState`, `loadAppState` - State management
- `mergeCloudData` - Timestamp-aware merging of workouts/settings from Firebase
- `initializeFirebase`, `initSync`, `handleLogin`, `handleLogout`, `saveToCloud` (firebase-service.ts) - Auth and sync

### 2. Testing

**Test Suite**: 300+ Vitest specs covering UI logic, storage, routing, and cloud sync

**Test Categories / Files** (all TypeScript `.tsx`):
- Storage utilities — `storageUtils.test.tsx`
- Schedule building — `scheduleUtils.test.tsx`
- Exercise history + stats — `exerciseHistory.test.tsx`, `exerciseHistoryComprehensive.test.tsx`
- URL routing & deep links — `urlRouting.test.tsx`
- Set toggle logic + RPE — `toggleSet.test.tsx`
- Firebase sync — `firebaseSync.test.tsx`
- Automerge CRDT — `automergeSync.test.tsx`
- Browser history — `backNavigation.test.tsx`
- Timer logic — `emomTimer.test.tsx`, `densityTimer.test.tsx`
- Focus mode — `focusMode.test.tsx`
- Exercise options — `exerciseOptions.test.tsx`
- Error handling — `errorBoundary.test.tsx`, `errorReporting.test.tsx`
- Accessibility — `accessibility.test.tsx`
- UI components — 40+ component tests
- Shared config/mocks — `src/test/setup.js`, `__mocks__/`

**Running Tests**:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # UI mode
npm run test:e2e      # Playwright E2E tests
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
npm run build        # Production build
npm run preview      # Preview production build
npm run typecheck    # TypeScript type checking
npm run lint         # Run ESLint
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
- EMOM and density timer support
- Flow exercises and supersets
- Focus mode for distraction-free workouts
- Auto-save to localStorage

#### Exercise History & Analytics
- Timeline view of completed workouts
- Exercise statistics (total workouts, max weight, max sets)
- 1RM estimation using Brzycki formula
- Progress graphs with visual weight trends
- Per-exercise detailed history
- Time-based filtering and calendar view

#### Cloud Sync & Authentication
- Optional Google Sign-In via Firebase Auth (popup flow)
- Per-user data isolation under `users/{uid}` in Firebase Realtime Database
- `initSync` streams cloud changes into the app and `mergeCloudData` resolves conflicts via `lastModified`
- `saveToCloud` pushes sessions, settings, and exercise history after workouts
- Status helpers (`getFirebaseStatus`, `getLastSyncTime`) power UI indicators
- **Optimistic Updates**: Background sync with debouncing
- **CRDT-Based Sync**: Conflict-free merging with Automerge

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
3. Add corresponding tests in `src/test/` (as `.tsx` files)
4. Use existing utilities from `src/utils/` (all TypeScript)
5. Define proper types in `src/types/index.ts` for new data structures
6. Update README.md if user-facing

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
touch src/test/newFeature.test.tsx

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
// 5. Run npm run typecheck && npm test
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

#### Task: Debug localStorage issues
```typescript
// Use safe utilities for all localStorage access (TypeScript)
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
- Workout days currently support 1, 2, 3, 4, 5, and 7; day 6 is not part of the app's valid workout-day set
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
- **ERROR_REPORTING_SETUP.md** - Sentry setup and configuration
- **agents.md** (this file) - Agent capabilities and guidelines

## Best Practices for AI Agents

1. **Read First**: Always examine existing code patterns before implementing changes
2. **Test Everything**: Write tests for new functionality, run all tests before completing
3. **Minimal Changes**: Make the smallest possible changes to achieve goals
4. **TypeScript Required**: All code is TypeScript. Use proper types and run `npm run typecheck`
5. **Error Handling**: Use typed error handling with proper error types
6. **Documentation**: Update README.md for user-facing changes
7. **Validation**: Validate inputs with TypeScript type guards
8. **Backward Compatibility**: Don't break existing functionality
9. **Performance**: Consider bundle size and runtime performance
10. **Security**: Never commit API keys or sensitive data
11. **Code Style**: Follow existing patterns (2-space indent, TSDoc comments)
12. **Cloud Sync Guards**: Always check auth before invoking sync helpers
13. **Accessibility**: Ensure keyboard navigation and ARIA labels

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
