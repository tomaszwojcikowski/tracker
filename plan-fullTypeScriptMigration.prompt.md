# Plan: Full TypeScript Migration for Tracker Codebase

Migrate all remaining JavaScript files (~38) to TypeScript, with the main challenge being `App.jsx` decomposition (~3,037 lines into separate component files). Estimated total effort: 50-60 hours across 4 phases.

---

## Current State Summary

### Already Migrated (22 TypeScript files)
- `src/constants.ts` - App constants
- `src/hooks/*.ts` (8 files) - All hooks typed
- `src/utils/*.ts` (10 files) - All utilities typed
- `src/types/index.ts` - Core type definitions (344 lines)

### Remaining (38 JavaScript files)
- `src/App.jsx` (~3,037 lines) - **Main challenge**
- `src/main.jsx` (~107 lines)
- `src/firebase-service.js` (~279 lines)
- `src/icons.js` (~67 lines)
- `src/components/*.jsx` (15+ component files)
- `src/utils/*.js` (7 duplicate files to delete)

---

## Phase 1 - Cleanup & Quick Wins (Day 1-2)

### 1.1 Delete duplicate `.js` files where `.ts` versions exist

```bash
# Files to delete in src/utils/:
rm src/utils/index.js
rm src/utils/storage.js
rm src/utils/exerciseHistory.js
rm src/utils/time.js
rm src/utils/audio.js
rm src/utils/volume.js
rm src/utils/sanitize.js
```

### 1.2 Convert `icons.js` → `icons.ts`

Simple re-export file, minimal type changes needed.

### 1.3 Convert all `index.js` → `index.ts` in component subdirectories

- `src/components/index.js`
- `src/components/animations/index.js`
- `src/components/feedback/index.js`
- `src/components/modals/index.js`
- `src/components/navigation/index.js`
- `src/components/progress/index.js`
- `src/components/skeletons/index.js`

### 1.4 Add missing prop types to `src/types/index.ts`

```typescript
// Component Props
export interface WorkoutPlayerProps {
  week: number;
  day: ValidDay;
  onComplete: () => void;
}

export interface DashboardProps {
  currentWeek: number;
  setCurrentWeek: (week: number) => void;
  onStartWorkout: (day: ValidDay) => void;
}

export interface ActionBarProps {
  onFinish: () => void;
  timerState: { time: number };
  setTimerActive: (active: boolean) => void;
  setTimerSeconds: (seconds: number) => void;
  emomState: { active: boolean; seconds: number; interval: number };
  setEmomActive: (active: boolean) => void;
  setEmomSeconds: (seconds: number) => void;
  setEmomInterval: (interval: number) => void;
}

export interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
}

// Firebase Service types
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface FirebaseServiceModule {
  isFirebaseInitialized: () => boolean;
  initSync: (callback: (data: CloudData) => void) => () => void;
  saveToCloud: (data: LocalData) => Promise<void>;
  handleLogin: () => Promise<FirebaseUser | null>;
  handleLogout: () => Promise<void>;
  getFirebaseStatus: () => { initialized: boolean; user: FirebaseUser | null };
  getLastSyncTime: () => number | null;
}
```

---

## Phase 2 - Small Components (Day 3-5)

### 2.1 Convert standalone components

| File | Priority | Estimated Time |
|------|----------|----------------|
| `FloatingTimer.jsx` | High | 1 hour |
| `PullToRefresh.jsx` | High | 1 hour |
| `SwipeIndicator.jsx` | High | 1 hour |
| `ThemeSelector.jsx` | Medium | 1 hour |
| `VolumeCard.jsx` | Medium | 1 hour |
| `PWAPrompt.jsx` | Medium | 1 hour |
| `PWAWrapper.jsx` | Medium | 1 hour |
| `SyncStatusIndicator.jsx` | Medium | 30 min |
| `ErrorBoundary.jsx` | Medium | 1 hour |

### 2.2 Convert subdirectory components

| Directory | Files | Estimated Time |
|-----------|-------|----------------|
| `animations/` | `AnimatedNumber.jsx` | 1 hour |
| `feedback/` | `EmptyState.jsx` | 1 hour |
| `modals/` | `ConfirmDialog.jsx` | 1 hour |
| `navigation/` | `NavigationBar.jsx`, `TabContent.jsx` | 2 hours |
| `progress/` | Progress components | 2 hours |
| `skeletons/` | Skeleton components | 1 hour |

### 2.3 Convert `firebase-service.js` → `firebase-service.ts`

Complexity: Medium (~279 lines)
- Add Firebase types
- Type all exported functions
- Handle auth state types

---

## Phase 3 - App.jsx Decomposition (Day 6-12)

### Proposed folder structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── TopAppBar.tsx
│   │   ├── ActionBar.tsx
│   │   └── ExerciseListItem.tsx
│   ├── workout/               # Workout-specific components
│   │   ├── WorkoutPlayer.tsx  # ~865 lines
│   │   └── ExerciseCard.tsx   # Extracted from WorkoutPlayer
│   ├── views/                 # Full-page views
│   │   ├── Dashboard.tsx      # ~200 lines
│   │   ├── HistoryView.tsx    # ~190 lines
│   │   ├── SettingsView.tsx   # ~335 lines
│   │   ├── ExerciseLibraryView.tsx  # ~230 lines
│   │   └── ExerciseDetailView.tsx   # ~160 lines
│   ├── stats/                 # Statistics components
│   │   ├── ExerciseStatsView.tsx
│   │   └── SimpleWeightGraph.tsx
│   └── feedback/              # Already exists
│       ├── LoadingScreen.tsx
│       └── ErrorScreen.tsx
```

### 3.1 Extract `WorkoutPlayer` (~865 lines) - HIGHEST PRIORITY

The largest and most complex component. Extract to `src/components/workout/WorkoutPlayer.tsx`.

Key internal state:
- Timer state (rest timer, EMOM timer)
- Exercise logs
- Collapsed exercises
- Added exercises
- Exercise history modal

Consider further decomposition:
- `ExerciseCard.tsx` - Single exercise in workout
- `TimerControls.tsx` - Timer UI
- `ExerciseSelector.tsx` - Add exercise modal

### 3.2 Extract `Dashboard` (~200 lines)

Move to `src/components/views/Dashboard.tsx`.

Dependencies:
- `useHaptic`, `useSwipeNavigation`, `useLucideIcons` hooks
- `SwipeIndicator` component
- `PROGRAM_DATA` constant

### 3.3 Extract `HistoryView` + `ExerciseStatsView` (~380 lines)

Move to `src/components/views/HistoryView.tsx` and `src/components/stats/ExerciseStatsView.tsx`.

Dependencies:
- `useHaptic`, `useLucideIcons` hooks
- `PullToRefresh` component
- `getAllExercisesWithHistory`, `calculateExerciseStats` utilities
- `SimpleWeightGraph` component (extract separately)

### 3.4 Extract `SettingsView` (~335 lines)

Move to `src/components/views/SettingsView.tsx`.

Dependencies:
- `useHaptic`, `useTheme`, `useLucideIcons` hooks
- `ThemeSelector` component
- Firebase service
- `markdownToHtml` utility (move to `src/utils/markdown.ts`)

### 3.5 Extract `ExerciseLibraryView` + `ExerciseDetailView` (~390 lines)

Move to `src/components/views/ExerciseLibraryView.tsx` and `ExerciseDetailView.tsx`.

Dependencies:
- `useHaptic`, `useDebounce`, `useLucideIcons` hooks
- `getAllExercisesWithHistory`, `getExerciseHistory`, `calculateExerciseStats` utilities

### 3.6 Extract UI components

Move to `src/components/ui/`:
- `TopAppBar.tsx` (~30 lines)
- `ActionBar.tsx` (~150 lines)
- `ExerciseListItem.tsx` (~80 lines)

### 3.7 Extract utility screens

Move to `src/components/feedback/`:
- `LoadingScreen.tsx` (~30 lines)
- `ErrorScreen.tsx` (~30 lines)

### 3.8 Extract `markdownToHtml` utility

Move to `src/utils/markdown.ts` (~70 lines).

---

## Phase 4 - Finalize (Day 13-15)

### 4.1 Convert remaining `App.jsx` → `App.tsx`

After extraction, App.tsx should be ~300 lines containing:
- Global state variables
- Data loading logic
- Main router/view switching
- PWA wrapper

### 4.2 Convert `main.jsx` → `main.tsx`

Simple entry point conversion (~107 lines).

### 4.3 Update `vite.config.js`

Verify entry point works with `.tsx` files.

### 4.4 Final verification

```bash
# Run all checks
npm run typecheck
npm test -- --run
npm run build
npm run lint
```

---

## Migration Checklist

### Phase 1
- [ ] Delete 7 duplicate `.js` utility files
- [ ] Convert `icons.js` → `icons.ts`
- [ ] Convert all `index.js` → `index.ts`
- [ ] Add missing prop types to `types/index.ts`

### Phase 2
- [ ] Convert `FloatingTimer.jsx` → `.tsx`
- [ ] Convert `PullToRefresh.jsx` → `.tsx`
- [ ] Convert `SwipeIndicator.jsx` → `.tsx`
- [ ] Convert `ThemeSelector.jsx` → `.tsx`
- [ ] Convert `VolumeCard.jsx` → `.tsx`
- [ ] Convert `PWAPrompt.jsx` → `.tsx`
- [ ] Convert `PWAWrapper.jsx` → `.tsx`
- [ ] Convert `SyncStatusIndicator.jsx` → `.tsx`
- [ ] Convert `ErrorBoundary.jsx` → `.tsx`
- [ ] Convert `animations/AnimatedNumber.jsx` → `.tsx`
- [ ] Convert `feedback/EmptyState.jsx` → `.tsx`
- [ ] Convert `modals/ConfirmDialog.jsx` → `.tsx`
- [ ] Convert `navigation/NavigationBar.jsx` → `.tsx`
- [ ] Convert `navigation/TabContent.jsx` → `.tsx`
- [ ] Convert `progress/*.jsx` → `.tsx`
- [ ] Convert `skeletons/*.jsx` → `.tsx`
- [ ] Convert `firebase-service.js` → `.ts`

### Phase 3
- [ ] Extract `WorkoutPlayer` component
- [ ] Extract `Dashboard` component
- [ ] Extract `HistoryView` component
- [ ] Extract `ExerciseStatsView` component
- [ ] Extract `SettingsView` component
- [ ] Extract `ExerciseLibraryView` component
- [ ] Extract `ExerciseDetailView` component
- [ ] Extract `TopAppBar`, `ActionBar`, `ExerciseListItem`
- [ ] Extract `LoadingScreen`, `ErrorScreen`
- [ ] Extract `markdownToHtml` to `utils/markdown.ts`
- [ ] Extract `SimpleWeightGraph` component

### Phase 4
- [ ] Convert `App.jsx` → `App.tsx`
- [ ] Convert `main.jsx` → `main.tsx`
- [ ] Update vite config if needed
- [ ] Run typecheck
- [ ] Run all 331 tests
- [ ] Run production build
- [ ] Run linter

---

## Decisions Needed

1. **Component folder structure:** Use `views/`, `workout/`, `ui/`, `stats/` subdirectories as proposed?

2. **Audio utilities:** Move `playTickSound`, `playBeepSound` from App.jsx inline to `src/utils/audio.ts`?

3. **Constants organization:** Keep `PROGRAM_DATA` in App.tsx or move to `src/constants.ts`?

4. **Test files:** Keep as `.jsx` (recommended) or migrate to `.tsx`?

5. **PR strategy:**
   - One PR per phase?
   - One PR per major component extraction?
   - Single large PR?

---

## Estimated Timeline

| Phase | Days | Hours |
|-------|------|-------|
| Phase 1 - Cleanup | 1-2 | 4-6 |
| Phase 2 - Components | 3-5 | 16-20 |
| Phase 3 - App.jsx | 6-12 | 28-38 |
| Phase 4 - Finalize | 13-15 | 4-6 |
| **Total** | **15 days** | **52-70 hours** |

---

## Success Criteria

- [ ] Zero `.js`/`.jsx` files in `src/` (except tests)
- [ ] `npm run typecheck` passes with no errors
- [ ] All 331 tests pass
- [ ] Production build succeeds
- [ ] No increase in bundle size (within 5%)
- [ ] All features work correctly in browser
