# Density Exercise Rep Tracking Implementation

## Overview

This document describes the implementation of density exercise rep tracking controls for the OnePlus 12 Pro Tracker application. Density exercises allow users to track reps completed in chunks within a time limit (e.g., "Complete 30 pull-ups in 10 minutes").

## Problem Statement

Previously, density exercises only had a timer button. Users needed:
- A way to count reps in chunks as they complete them
- Visual progress tracking showing total reps vs target
- Ability to mark exercise as complete even if not all reps were finished
- Automatic completion when all reps are done

## Solution

### 1. Data Model Updates

**File: `src/types/workout.ts`**

Added two new optional fields to `ExerciseLogEntry`:
```typescript
/** Rep chunks for density exercises (v2.5+) - array of rep counts (e.g., [5, 3, 4] = 12 total) */
densityRepChunks?: number[];
/** Whether the density exercise is marked as complete (v2.5+) */
densityComplete?: boolean;
```

### 2. DensityRepControls Component

**File: `src/components/DensityRepControls.tsx`**

A new TypeScript component that provides:

#### Features
- **Progress Bar**: Visual indicator showing completion percentage
- **Quick Add Buttons**: +1, +3, +5 rep buttons for fast input
- **Custom Amount Input**: Number input for custom rep counts
- **Rep Chunk Display**: Shows all rep chunks with removal capability
- **Mark Complete Button**: Manual completion toggle
- **Auto-Complete**: Automatically marks complete when target reps reached
- **Collapsible Interface**: Expandable/collapsible chunks section
- **Haptic Feedback**: Touch feedback on all interactions

#### Props Interface
```typescript
export interface DensityRepControlsProps {
    targetReps: number;              // Total target reps (e.g., 30)
    repChunks: number[];             // Current chunks (e.g., [5, 3, 4])
    isComplete: boolean;             // Completion status
    isFirstIncomplete?: boolean;     // Highlight state
    haptic: HapticFeedback;          // Haptic feedback interface
    onUpdateRepChunks: (chunks: number[]) => void;  // Update callback
    onMarkComplete: (complete: boolean) => void;    // Completion callback
}
```

### 3. Integration with Exercise Cards

#### ExerciseCard Component

**File: `src/components/ExerciseCard.tsx`**

- Added density-specific props: `isDensity`, `densityTimeMinutes`, `densityRepsTotal`
- Added callbacks: `onUpdateDensityRepChunks`, `onMarkDensityComplete`
- Conditionally renders `DensityRepControls` instead of regular set buttons for density exercises
- Shows density badge in exercise header (cyan with gauge icon)

#### CompactExerciseRow Component

**File: `src/components/CompactExerciseRow.tsx`**

- Added same density props and callbacks as ExerciseCard
- Renders `DensityRepControls` in expanded section for density exercises
- Maintains existing density timer button functionality

### 4. WorkoutPlayer Integration

**File: `src/components/views/WorkoutPlayer.tsx`**

Added two new callback functions:
```typescript
const updateDensityRepChunks = useCallback((id: string, chunks: number[]): void => {
    saveLog(id, 'densityRepChunks', chunks);
}, [saveLog]);

const markDensityComplete = useCallback((id: string, complete: boolean): void => {
    saveLog(id, 'densityComplete', complete);
}, [saveLog]);
```

These callbacks are passed to both ExerciseCard and CompactExerciseRow instances.

### 5. Exercise Props Utilities

**File: `src/utils/exerciseProps.ts`**

The existing `getExerciseTypeFlags` function already extracted density exercise information:
```typescript
isDensity: ex.repsRange?.type === 'density',
densityTimeMinutes: ex.densityTimeMinutes,
densityRepsTotal: ex.densityRepsTotal,
```

## Test Coverage

**File: `src/test/densityRepControls.test.tsx`**

Created comprehensive test suite with 20 tests covering:

1. **Initial State** (4 tests)
   - Rendering with no chunks
   - Total reps calculation
   - Completion state display
   - Marked complete state

2. **Progress Bar** (2 tests)
   - Correct percentage calculation
   - Capping at 100% when over target

3. **Quick Add Buttons** (3 tests)
   - +1, +3, +5 rep additions
   - Haptic feedback verification

4. **Custom Amount Input** (3 tests)
   - Adding custom amounts
   - Input clearing after add
   - Invalid input rejection

5. **Rep Chunk Display and Removal** (3 tests)
   - Displaying all chunks
   - Removing specific chunks
   - Empty state message

6. **Mark Complete Functionality** (3 tests)
   - Manual completion toggle
   - Marking incomplete
   - Auto-complete on target reach

7. **Expandable Chunks Section** (2 tests)
   - Default expanded state
   - Toggle functionality

All tests use proper mocking and follow existing test patterns.

## Usage Example

When a user encounters a density exercise (e.g., "Pull-Up Density: 30 reps in 10 minutes"):

1. User starts the density timer (10m countdown)
2. User completes 5 reps, clicks "+5" button → adds [5] chunk
3. User completes 3 more reps, clicks "+3" → adds [3] chunk (total: 8/30, 27%)
4. User continues adding chunks as they complete reps
5. Progress bar updates with each addition
6. When user reaches 30 total reps, exercise auto-marks as complete
7. User can also manually mark complete if they decide to stop early

## Visual Design

- **Progress Bar**: Cyan gradient (matching density timer theme)
- **Badges**: Cyan background with gauge icon
- **Buttons**: System surface high background, responsive touch states
- **Complete State**: Green success color
- **Chunk Pills**: Cyan background with remove button

## Data Persistence

All density rep data is stored in localStorage under the session key structure:
```typescript
{
  exercises: {
    "pull_ups": {
      densityRepChunks: [5, 3, 4, 6, 5, 7],
      densityComplete: true
    }
  }
}
```

This integrates seamlessly with:
- Cloud sync (Firebase Realtime Database)
- Optimistic sync with debouncing
- Automerge CRDT conflict resolution

## Backward Compatibility

- Existing exercises without density data work unchanged
- Non-density exercises display regular set controls
- Optional fields ensure compatibility with old workout sessions
- Type-safe implementation prevents runtime errors

## Browser Support

Works in all modern browsers supporting:
- ES6+ JavaScript
- CSS Grid and Flexbox
- LocalStorage API
- Modern React 18 features

## Performance Considerations

- Memoized calculations for progress percentages
- Efficient re-rendering using React.useCallback
- Minimal DOM updates with conditional rendering
- Lightweight component (~200 lines)

## Future Enhancements

Potential improvements:
- Voice input for hands-free rep tracking
- Auto-suggest next chunk based on previous patterns
- Graph showing rep pace over time
- Integration with heart rate monitors
- Export density performance data

## Files Changed

1. `src/types/workout.ts` - Added density data fields
2. `src/components/DensityRepControls.tsx` - New component (created)
3. `src/components/ExerciseCard.tsx` - Added density support
4. `src/components/CompactExerciseRow.tsx` - Added density support
5. `src/components/views/WorkoutPlayer.tsx` - Added callbacks
6. `src/test/densityRepControls.test.tsx` - Test suite (created)

## Conclusion

The density exercise rep tracking implementation provides a complete solution for tracking high-rep exercises within time constraints. The implementation follows existing patterns, maintains backward compatibility, and includes comprehensive test coverage.
