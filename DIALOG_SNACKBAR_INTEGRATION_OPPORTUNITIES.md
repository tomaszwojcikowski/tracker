# Dialog & Snackbar Integration Opportunities

## Overview
This document identifies all places in the codebase where Dialog and Snackbar components should be integrated to replace native alerts, confirms, and error messages. Focus is on high-impact user-facing features.

---

## 1. CONFIRM DIALOG OPPORTUNITIES

### 1.1 🔴 HIGH PRIORITY: Data Reset Confirmations

#### SettingsView.tsx - Clear Progress Data (Line 438-448)
**Current Implementation:**
```tsx
// handleResetProgress() → directly calls resetProgramProgress() with no confirmation
const handleResetProgress = () => {
    haptic.bump();
    const programId = getActiveProgramId();
    resetProgramProgress(programId);
    syncService.scheduleSync();
    setSettingsToastMessage('Progress data cleared');
};

// Button:
onClick={handleResetProgress}
```

**Opportunity:** Destructive action without confirmation
- **Impact:** User can permanently delete all workout history for a program
- **Fix:** Use `ConfirmDialog` with destructive=true before calling resetProgramProgress
- **UI:** "Clear your progress data?" → "This will delete all workout sessions and history for this program. This cannot be undone."

---

#### ErrorBoundary.tsx - Clear All Storage (Line 271-277)
**Current Implementation:**
```tsx
{/* Clear All Confirmation Dialog */}
{/* (Note: Shows dialog but uses simple confirm) */}
showClearConfirm && (
    <ConfirmDialog
        title="Clear All Data?"
        message="This will delete all app data. This cannot be undone."
        onCancel={this.handleCancelClear}
        onConfirm={this.handleConfirmClear}
        destructive={true}
    />
)
```

**Status:** Already implemented ✅ (but check if integration is complete)

---

### 1.2 MEDIUM PRIORITY: Exercise Removal Confirmations

#### AddedExerciseCard.tsx - Remove Exercise (Line 162)
**Current Implementation:**
```tsx
// No confirmation - direct removal
<button
    onClick={() => onRemove(exercise.id)}
    className="btn-icon h-8 w-8 bg-sys-errorContainer text-sys-onErrorContainer"
    aria-label="Remove exercise"
>
    <X size={20} />
</button>
```

**Opportunity:** Removes added exercises without confirmation
- **Impact:** Accidental removal during workout (one-tap delete)
- **Fix:** Add local confirmation before `onRemove()` callback
- **UI:** "Remove {exercise.name}?" → Inline dialog or confirmation toast
- **Alternative:** Undo capability via snackbar action

---

#### WorkoutPlayer.tsx - Remove Added Exercise (Line 917-928)
**Current Implementation:**
```tsx
const removeAddedExercise = (exerciseId: string): void => {
    haptic.tick();
    const updatedAddedExercises = addedExercises.filter((ex) => ex.id !== exerciseId);
    // ... direct removal, no confirmation
};
```

**Opportunity:** Same as above - direct deletion
- **Fix:** Wrap with `ConfirmDialog` in parent component

---

### 1.3 LOW PRIORITY: Program Switch Confirmations

#### ProgramSelector.tsx - Switch Program (Line 251-259)
**Current Implementation:**
```tsx
// handleSwitchProgram() directly switches programs
// No confirmation shown to user (though could be destructive if active workout)
```

**Opportunity:** Switching programs during an active workout
- **Impact:** Low (program switches apply to different scope)
- **Fix:** Optional - warn if active workout exists for current program

---

---

## 2. SNACKBAR / ERROR MESSAGE OPPORTUNITIES

### 2.1 🔴 HIGH PRIORITY: Replace alert() Calls

#### WorkoutPlayer.tsx - Multiple Error Alerts (Lines 567, 878, 887, 916, 1129)

**Location 1: Storage Full Error (Line 567)**
```tsx
catch (error) {
    console.error('Failed to persist logs:', error);
    alert('Failed to save progress. Your storage might be full.');
}
```
- **Type:** Error
- **Frequency:** Rare (storage limit exceeded)
- **Fix:** Use Snackbar with error type and retry action

---

**Location 2: Invalid Exercise Data (Line 878)**
```tsx
if (!exercise || typeof exercise !== 'object' || !exercise.name) {
    console.error('Invalid exercise data:', exercise);
    alert('Failed to add exercise: Invalid exercise data');
    return;
}
```
- **Type:** Validation error
- **Frequency:** Rare (dev error)
- **Fix:** Snackbar with error type, no action needed

---

**Location 3: Duplicate Exercise (Line 887)**
```tsx
if (addedExercises.some((ex) => ex.name === exercise.name)) {
    alert('This exercise has already been added to the workout');
    haptic.tick();
    return;
}
```
- **Type:** Validation warning
- **Frequency:** Common (user adding duplicate)
- **Fix:** Snackbar with warning type
- **Better UX:** Disable/highlight duplicate in selector instead

---

**Location 4: Add Exercise Failed (Line 916)**
```tsx
catch (error) {
    console.error('Failed to add exercise:', error);
    alert('Failed to add exercise. Please try again.');
}
```
- **Type:** Error
- **Frequency:** Rare
- **Fix:** Snackbar with error + retry action

---

**Location 5: Complete Workout Failed (Line 1129)**
```tsx
catch (error) {
    console.error('Failed to complete workout:', error);
    alert('Failed to save workout completion. Please try again.');
}
```
- **Type:** Error
- **Frequency:** Rare
- **Fix:** Snackbar with error + retry action

---

#### SettingsView.tsx - Sentry Test Alert (Line 411)
**Current Implementation:**
```tsx
alert('Test error sent to Sentry! Check your Sentry dashboard.');
```
- **Type:** Info/Success
- **Frequency:** Once during setup
- **Fix:** Use Snackbar with success type
- **UI:** "Test error sent successfully. Check your Sentry dashboard."

---

#### SettingsView.tsx - Sync Error (Line 213-214)
**Current Implementation:**
```tsx
.catch((err: Error) => {
    console.error('Failed to sync data:', err);
    // No user-facing error shown
})
```
- **Type:** Error
- **Frequency:** Common (sync failures)
- **Fix:** Add Snackbar with error message and retry action
- **Message:** "Failed to sync data. Retrying automatically..."

---

### 2.2 MEDIUM PRIORITY: Success Messages

#### SettingsView.tsx - Already Using Snackbar ✅
**Current Implementation (Good Pattern):**
```tsx
// After sync
setFirebaseMessage('✓ Data synced successfully');

// After logout
setFirebaseMessage('✓ Logged out successfully');

// After save
setFirebaseMessage('✓ Data synced to cloud successfully');

// After reset
setSettingsToastMessage('Progress data cleared');
```

**Status:** Using Snackbar correctly - keep as-is

---

#### ProgramSelector.tsx - Program Import/Switch Success
**Current Implementation:**
```tsx
// handleSwitchProgram() - completion is silent (no success feedback)
// handleImportProgram() - completion is silent (no success feedback)
```

**Opportunity:** Add success feedback
- **Fix:** Show Snackbar after successful program switch/import
- **Message:** "Program switched successfully" / "Program imported successfully"
- **Duration:** 2-3 seconds

---

### 2.3 MEDIUM PRIORITY: Console Errors → User Feedback

#### WorkoutPlayer.tsx - Toggle Set Errors (Lines 663, 715, 734, 813, 823, 915, 1118, 1128)
**Current Pattern:**
```tsx
catch (error) {
    console.error('Failed to toggle set:', error);
    // No user-facing message
}
```

**Opportunity:** Silent failures that affect workout
- **Impact:** Medium (workout not saved but user doesn't know)
- **Fix:** Show error snackbar for critical operations
- **Priority:** Toggle set, superset round, save RPE

**Specific Locations:**
- Line 716: `Failed to toggle set`
- Line 813: `Failed to toggle superset round`
- Line 823: `Failed to save RPE`
- Line 1118: `Failed to sync workout to cloud`
- Line 1128: `Failed to complete workout`

---

#### ProgramSelector.tsx - Program Load Errors (Line 579)
**Current Implementation:**
```tsx
.catch((error: Error) => {
    haptic.error();
    const message = error instanceof Error ? error.message : 'Failed to import program';
    setErrorMessage(message);
})
```

**Status:** Using error message state (good), but could be Snackbar for consistency
- **Consider:** Use Snackbar instead of inline error div for consistency
- **Current UI:** Shows error in alert container (functional but not modal)

---

---

## 3. BOTTOM SHEET → DIALOG OPPORTUNITIES

### 3.1 ProgramSelector Modal (Line 240+)
**Current:** BottomSheet with error message
**Opportunity:** Consider Dialog for confirmations within modal
- **Status:** Already functional with error display

---

### 3.2 ExerciseSelectorModal (Line 50+)
**Current:** BottomSheet for exercise selection
**Status:** Good pattern, no changes needed

---

---

## 4. CUSTOM MODAL PATTERNS TO STANDARDIZE

### 4.1 RPE Selection Modal (WorkoutPlayer.tsx)
**Current:** Custom modal via `showRPEPrompt` state
**Status:** Works, but could use Dialog component for consistency

---

### 4.2 Notes Entry (WorkoutPlayer.tsx)
**Current:** Inline editing, no modal
**Status:** Acceptable pattern

---

---

## 5. VALIDATION ERROR MESSAGES

### 5.1 ProgramSelector - Error Display (Line 338-340)
**Current Implementation:**
```tsx
{errorMessage && (
    <div className="mx-4 mt-4 p-3 rounded-xl bg-sys-errorContainer border border-sys-error/20 text-sys-onErrorContainer text-sm" role="alert">
        {errorMessage}
    </div>
)}
```

**Status:** Custom alert container (functional)
**Consideration:** Could standardize with Snackbar for consistency, though inline display is useful here

---

### 5.2 Invalid History Format (HistoryView.tsx, Line 474)
**Current:**
```tsx
console.warn('Invalid history format, resetting');
```

**Opportunity:** Silent error recovery
- **Fix:** Show warning snackbar when data is auto-recovered/reset
- **Message:** "Invalid workout history recovered. Some data may have been lost."

---

---

## SUMMARY TABLE

| Component | Type | Line(s) | Severity | Current State | Recommended Action |
|-----------|------|---------|----------|---------------|-------------------|
| **SettingsView** | Reset data | 438-448 | 🔴 HIGH | Direct action | Use ConfirmDialog (destructive) |
| **SettingsView** | Sentry test | 411 | LOW | alert() | Use Snackbar (success) |
| **SettingsView** | Sync error | 213-214 | 🔴 HIGH | Silent | Add Snackbar (error + retry) |
| **WorkoutPlayer** | Storage full | 567 | 🔴 HIGH | alert() | Use Snackbar (error + action) |
| **WorkoutPlayer** | Invalid exercise | 878 | MEDIUM | alert() | Use Snackbar (error) |
| **WorkoutPlayer** | Duplicate exercise | 887 | MEDIUM | alert() | Use Snackbar (warning) + disable in UI |
| **WorkoutPlayer** | Add exercise error | 916 | 🔴 HIGH | alert() | Use Snackbar (error + retry) |
| **WorkoutPlayer** | Complete workout error | 1129 | 🔴 HIGH | alert() | Use Snackbar (error + retry) |
| **WorkoutPlayer** | Toggle set errors | 716, 813, 823 | MEDIUM | Silent console | Use Snackbar (error) |
| **WorkoutPlayer** | Sync to cloud error | 1118 | MEDIUM | Silent console | Use Snackbar (error) |
| **AddedExerciseCard** | Remove exercise | 162 | MEDIUM | No confirmation | Use inline ConfirmDialog or undo snackbar |
| **ProgramSelector** | Program switch/import | 251+, 287+ | LOW | Silent success | Add Snackbar (success) |
| **ProgramSelector** | Program import error | 579 | MEDIUM | Custom error div | Consider Snackbar (error) |
| **HistoryView** | Invalid format | 474 | LOW | Silent recovery | Add Snackbar (warning) |
| **ErrorBoundary** | Clear all | 271-277 | 🔴 HIGH | Already implemented ✅ | Verify working |

---

## IMPLEMENTATION PRIORITY

### Phase 1 (🔴 HIGH - User-visible data loss)
1. SettingsView: Clear progress confirmation dialog
2. WorkoutPlayer: Storage full error snackbar
3. WorkoutPlayer: Add exercise error snackbar
4. WorkoutPlayer: Complete workout error snackbar
5. SettingsView: Sync error snackbar with retry

### Phase 2 (MEDIUM - Common user actions)
6. WorkoutPlayer: Toggle set errors snackbar
7. AddedExerciseCard: Remove exercise confirmation
8. WorkoutPlayer: Duplicate exercise detection
9. ProgramSelector: Program success feedback

### Phase 3 (LOW - Edge cases)
10. HistoryView: Invalid format recovery message
11. SettingsView: Sentry test success message
12. WorkoutPlayer: RPE/superset errors snackbar

---

## COMPONENT USAGE PATTERNS

### ConfirmDialog Pattern (Destructive)
```tsx
const [showConfirm, setShowConfirm] = useState(false);

// In render:
<ConfirmDialog
    isOpen={showConfirm}
    title="Clear all progress?"
    message="This will permanently delete all workout data for this program."
    confirmText="Delete"
    cancelText="Cancel"
    destructive={true}
    onConfirm={() => {
        handleResetProgress();
        setShowConfirm(false);
    }}
    onCancel={() => setShowConfirm(false)}
/>

<button onClick={() => setShowConfirm(true)}>
    Clear Progress
</button>
```

### Snackbar Pattern (Error)
```tsx
const [errorMessage, setErrorMessage] = useState('');

// After error:
setErrorMessage('Failed to save workout. Retrying...');

// In render:
<Snackbar
    isOpen={!!errorMessage}
    message={errorMessage}
    type="error"
    onClose={() => setErrorMessage('')}
    duration={4000}
    action={{
        label: 'Retry',
        onClick: handleRetry
    }}
/>
```

### Snackbar Pattern (Success)
```tsx
const [successMessage, setSuccessMessage] = useState('');

// After success:
setSuccessMessage('Workout completed successfully!');

// In render:
<Snackbar
    isOpen={!!successMessage}
    message={successMessage}
    type="success"
    onClose={() => setSuccessMessage('')}
    duration={3000}
/>
```

