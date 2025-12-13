# Manual Testing Guide for State Management & URL Routing

## Features Implemented

1. **Remember Last Workout State**: The app saves and restores the last viewed workout/tab
2. **URL-Based Routing**: URLs reflect current app state and can be shared/bookmarked
3. **Browser History Support**: Back/forward buttons work correctly
4. **Workout Notes**: Free-text notes for each workout session
5. **RPE Tracking**: Rate of Perceived Exertion tracking per set (scale 6-10)

## Test Scenarios

### Scenario 0: Training & Logging Enhancements
#### Workout Notes
1. Open any workout (e.g., Week 1, Day 1)
2. **Expected**: See "Workout Notes" section at the top with a text area
3. Type some notes (e.g., "Felt strong today, good form on pull-ups")
4. Navigate away and come back
5. **Expected**: Notes should be persisted

#### RPE Tracking
1. Complete a set by clicking on a set button
2. **Expected**: An RPE dropdown appears below the completed set
3. Select an RPE value (6-10)
4. Complete the workout and check History
5. **Expected**: RPE values should be displayed for each set (e.g., "S1: 8, S2: 9")

#### History View - Notes & RPE
1. Complete a workout with notes and RPE data
2. Navigate to History tab
3. Expand the completed workout entry
4. **Expected**: 
   - Workout notes should be displayed in a separate section
   - RPE values should be shown for each exercise with format "S1: 8, S2: 9"

#### Coach/AI View - Enhanced Data
1. Configure Gemini API key in Settings
2. Complete a workout with notes and RPE
3. Navigate to Coach tab
4. **Expected**: AI feedback should reference the workout notes and RPE values you provided

### Scenario 1: History & Analytics Improvements
#### Timeline View Enhancements
1. Complete 2-3 workouts over different days
2. Navigate to History tab
3. **Expected**: 
   - Timeline showing completed workouts by date
   - Week/day labels clearly visible
   - Expandable entries showing exercise details

#### Stats View
1. In History tab, click the "Stats" toggle button
2. **Expected**:
   - View switches from timeline to statistics
   - Shows list of all exercises with history
   - Each exercise shows: total workouts, max weight, estimated 1RM

#### Per-Exercise Statistics
1. In Stats view, click on any exercise
2. **Expected**:
   - Expands to show detailed stats grid:
     - Total Workouts
     - Max Sets
     - Max Weight
     - Estimated 1RM
   - Shows simple weight progress graph (last 10 workouts)
   - Shows recent history (last 5 sessions)

#### Progress Graphs
1. Complete same exercise multiple times with different weights
2. Check Stats view for that exercise
3. **Expected**: 
   - Weight progress graph showing trend line
   - Min and max weight labels
   - Data points for each workout

### Scenario 2: Coach (Gemini) Integration UX
#### Settings - API Key Configuration
1. Navigate to Settings tab
2. Enter a Gemini API key
3. Click "Test" button
4. **Expected**:
   - Shows "Testing..." while validating
   - Shows "✓ API key is valid" if key is valid
   - Shows "✗ Invalid API key" if key is invalid
5. Click "Validate & Save"
6. **Expected**: 
   - Validates key again
   - Shows success message if valid
   - Saves to localStorage

#### Settings - Auto-sync Toggle
1. In Settings, find "Auto-sync with Coach AI" toggle
2. Toggle it on/off
3. **Expected**:
   - Toggle switches between green (on) and gray (off)
   - Setting persists after page reload
4. Complete a workout with auto-sync disabled
5. **Expected**: 
   - No Gemini sync toast appears
   - Workout completes normally

#### Auto-sync During Workout Completion
1. Enable auto-sync in Settings
2. Complete a workout
3. Click "Finish"
4. **Expected**:
   - Toast shows "Syncing with AI Coach..."
   - After sync: shows "✓ Synced successfully" or error message
   - Toast is non-blocking (can be dismissed with X)

#### Coach Tab - Viewing AI Feedback
1. Complete workouts with auto-sync enabled
2. Navigate to Coach tab
3. **Expected**:
   - Shows list of workouts with AI feedback
   - Each entry displays: Week/Day, Date, AI feedback content
   - Feedback is formatted with markdown (bold, lists, etc.)

#### Coach Tab - Asking Questions
1. In Coach tab, find "Ask the Coach" section
2. Type a question (e.g., "How can I improve my pull-ups?")
3. Click "Ask Question"
4. **Expected**:
   - Button shows "Asking..." with spinner
   - Response appears below in green box
   - Response is formatted with markdown
   - Question adds to Gemini chat history (maintains context)

### Scenario 3: Internal Refactors & Storage Utilities
**Note:** This PR focuses on internal code organization and does not add new user-facing features.

#### Code Organization
The script section is now organized into 11 logical sections:
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

#### Storage Utilities
Three new utility functions for localStorage access:
- `safeGetJSON(key, defaultValue)` - Get and parse JSON with error handling
- `safeSetJSON(key, value)` - Stringify and save JSON with error handling
- `safeRemove(key)` - Remove item with error handling

These utilities are used throughout the codebase for improved error handling and code consistency.

#### Regression Testing After Refactor
No new user-facing features were added. The refactor maintains existing functionality with better code organization.

**Key areas to smoke-test:**
1. **Workout Navigation**: Load workouts and navigate between different weeks/days (e.g., Week 1 Day 1, Week 5 Day 3)
   - Expected: Workouts load correctly, navigation works smoothly
   
2. **Workout Logging**: Complete sets in a workout and finish the workout
   - Expected: Set completion persists, workout logs saved after page refresh
   
3. **Exercise History**: Complete multiple workouts with weighted exercises
   - Navigate to History tab → Stats view
   - Expected: Exercise statistics (total workouts, max weight, 1RM) display correctly
   
4. **State Persistence**: Navigate through app, reload the page
   - Expected: App returns to the last viewed page/workout
   
5. **Gemini Integration** (if API key configured):
   - Complete a workout with auto-sync enabled
   - Expected: AI feedback appears in Coach tab, no sync errors
   - Ask a question in Coach tab
   - Expected: AI responds correctly, chat history maintains context

**What changed internally:**
- JSON data (workout logs, history, app state) now uses safe storage utilities
- Better error handling prevents crashes from corrupted localStorage
- Added comments explaining non-obvious behavior (warmup/cooldown generation, chat initialization)

### Scenario 4: UX Polish for Workout Player & Navigation
#### Enhanced Section Headers
1. Start any workout
2. **Expected**:
   - Each section (Warm Up, Main Work, etc.) has an icon
   - Section progress shows (e.g., "2/5")
   - Mini progress bar below section header
   - Different colors for different section types

#### Set Buttons with Numbered Dots
1. In workout, view set buttons
2. **Expected**:
   - Uncompleted sets show: numbered dot (circle) with number below
   - Completed sets show: check icon with number below
   - Clear visual distinction between states
   - RPE dropdown appears below completed sets

#### Collapsed Exercise Summary
1. Complete all sets for an exercise
2. Click the collapse button (chevron)
3. **Expected**:
   - Exercise collapses to summary view
   - Shows: prescription, weight used, mini progress bar
   - All info visible at a glance
   - Can expand again by clicking

#### Navigation Accessibility
1. Use screen reader or inspect elements
2. Check navigation bar buttons
3. **Expected**:
   - Each button has `aria-label` attribute
   - Active tab has `aria-current="page"`
   - Icons and labels properly aligned
   - Touch targets are large enough (56px min-height)

#### Complete All Sets Feature
1. Start an exercise
2. Click "Complete All" button
3. **Expected**:
   - All sets marked complete at once
   - Button provides one-tap completion
   - Sets can still be individually toggled after

### Scenario 1: State Persistence on Reload
1. Open the app: `http://localhost:8080/`
2. Navigate to Week 5, Day 3 workout
3. Reload the page (F5)
4. **Expected**: App should return to Week 5, Day 3 workout

### Scenario 2: URL Deep Linking - Workout
1. Open: `http://localhost:8080/?view=workout&week=10&day=2`
2. **Expected**: App should open directly to Week 10, Day 2 workout

### Scenario 3: URL Deep Linking - Tab View
1. Open: `http://localhost:8080/?tab=library&week=7`
2. **Expected**: App should open Library tab with week 7 selected

### Scenario 4: URL Updates on Navigation
1. Open the app
2. Navigate to different tabs (Library, History, etc.)
3. Check URL in address bar
4. **Expected**: URL should change to reflect current tab (e.g., `?tab=library`)

### Scenario 5: Browser Back Button
1. Open the app (Dashboard)
2. Navigate to Library tab
3. Navigate to History tab
4. Click browser back button twice
5. **Expected**: Should go back through Library tab to Dashboard

### Scenario 6: State Priority
1. Save state by navigating to Week 5
2. Close browser
3. Open with URL: `http://localhost:8080/?week=10`
4. **Expected**: URL parameter (week 10) takes priority over saved state

## URL Format Reference

- **Dashboard (Train tab)**: `?tab=train` or `?tab=train&week=5`
- **Library tab**: `?tab=library`
- **History tab**: `?tab=history`
- **Coach tab**: `?tab=coach`
- **Settings tab**: `?tab=profile`
- **Workout view**: `?view=workout&week=5&day=3`

## Implementation Details

### State Storage
- **localStorage key**: `tracker_app_state`
- **Stored data**: `{ viewMode, activeTab, currentWeek, activeDay }`
- **Backward compatibility**: `tracker_week` key still maintained

### URL Parameters
- `view`: "workout" for workout player
- `tab`: Tab name (train, library, history, coach, profile)
- `week`: Current week (1-21)
- `day`: Current day (1, 2, 3, 5) - Note: Day 4 is rest day and not included

### Priority Order
1. URL query parameters (highest priority)
2. localStorage saved state
3. Default values (lowest priority)

---

# Automated Testing Requirements

## Overview
All code changes MUST pass both unit tests and E2E tests before committing. This ensures code quality and prevents regressions.

## Pre-Commit Testing Workflow

### Required Tests
Before committing any code changes, run all tests in this order:

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Run TypeScript type checking
npm run typecheck

# 3. Run all unit tests
npm test

# 4. Run all E2E tests
npm run test:e2e

# 5. Build verification (optional but recommended)
npm run build
```

### Test Suites

#### 1. Unit Tests (Vitest)
**Command**: `npm test`

**Coverage**: 60 test files, 1244+ tests
- Component tests (React Testing Library)
- Utility function tests
- Hook tests
- State management tests
- Data model tests

**Key test files**:
- `densityRepControls.test.tsx` - Density exercise controls (18 tests)
- `exerciseHistory.test.jsx` - Exercise history tracking
- `storageUtils.test.jsx` - localStorage utilities
- `scheduleUtils.test.jsx` - Schedule building
- `toggleSet.test.jsx` - Set completion logic
- `firebaseSync.test.jsx` - Cloud sync
- `automergeSync.test.tsx` - CRDT sync
- And 53 more test files...

**Expected output**:
```
✓ Test Files  60 passed (60)
  Tests  1244 passed | 4 skipped (1248)
```

#### 2. E2E Tests (Playwright)
**Command**: `npm run test:e2e`

**Coverage**: 86 end-to-end tests
- Navigation flows
- Workout tracking
- PWA functionality
- Program selection
- Deep linking
- Mobile responsiveness

**Test files**:
- `e2e/navigation.spec.js`
- `e2e/workout.spec.js`
- `e2e/pwa.spec.js`
- `e2e/program-selector.spec.js`
- `e2e/new-features.spec.js`

**Expected output**:
```
Running 86 tests using 4 workers
86 passed (53.6s)
```

**First-time setup**:
If Playwright browsers aren't installed:
```bash
npx playwright install chromium
```

#### 3. Type Checking
**Command**: `npm run typecheck`

Verifies TypeScript type safety across the codebase.

### When Tests Fail

#### Unit Test Failures
1. Read the error message carefully - it shows which test failed and why
2. Check if your changes broke existing functionality
3. Update tests if the behavior change was intentional
4. Fix the code if the test caught a real bug

Example: When updating DensityRepControls to change text from `"15 / 30 reps"` to `"15/30"`, update test assertions:
```diff
- expect(screen.getByText('15 / 30 reps')).toBeInTheDocument();
+ expect(screen.getByText('15/30')).toBeInTheDocument();
```

#### E2E Test Failures
1. Check if the UI change broke user workflows
2. Review Playwright trace files (shown in error output)
3. Run failing test in headed mode for debugging:
```bash
npx playwright test --headed --grep "test name"
```

### CI/CD Integration
All tests run automatically on:
- Pull request creation
- Pull request updates
- Merge to main branch

The PR cannot be merged until all tests pass.

### Test-Driven Development
For new features:
1. Write tests first (or alongside implementation)
2. Ensure tests fail initially (red)
3. Implement feature
4. Ensure tests pass (green)
5. Refactor if needed
6. Run full test suite before committing

### Performance
- Unit tests: ~28-30 seconds
- E2E tests: ~50-60 seconds
- Total pre-commit testing: ~1.5-2 minutes

### Tips
- Run specific test file: `npm test -- densityRepControls`
- Run tests in watch mode: `npm run test:watch`
- Run E2E tests in UI mode: `npm run test:e2e:ui`
- Check test coverage: Tests are comprehensive but not tracked by coverage tools currently

## Summary
✅ **Always run both `npm test` and `npm run test:e2e` before committing**
✅ All 1244+ unit tests must pass
✅ All 86 E2E tests must pass
✅ TypeScript must compile without errors
