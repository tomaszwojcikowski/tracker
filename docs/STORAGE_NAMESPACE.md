# Storage Namespace Isolation

This document describes the storage namespace isolation feature that ensures workout data (logs, history, progress) is recorded uniquely per program.

## Overview

The tracker app uses localStorage to persist user data. With multi-program support, it's essential to isolate this data so that:

1. **No cross-program contamination** - Logs from one program don't affect another
2. **Clear data ownership** - Each program's data is easily identifiable
3. **Easy migration** - Existing users' data migrates seamlessly

## Architecture

### Storage Key Format

**Legacy (global) keys:**
```
exercise_history
session_w1d1
session_w2d3
```

**Namespaced keys:**
```
p:{programId}:exercise_history
p:{programId}:session_w1d1
p:{programId}:session_w2d3
```

The namespace prefix `p:{programId}:` ensures:
- Program-specific data is isolated
- Keys are human-readable
- Easy pattern matching for cleanup

### Components

#### 1. Storage Namespace Service (`src/services/storageNamespace.ts`)

Provides functions for creating and parsing namespaced storage keys:

```typescript
// Get namespaced key for active program
getNamespacedKey('exercise_history')
// => 'p:oneplus-12-pro-tracker-v1:exercise_history'

// Get session key for active program  
getSessionKey(1, 1)
// => 'p:oneplus-12-pro-tracker-v1:session_w1d1'

// Parse namespaced key
parseNamespacedKey('p:my-program:exercise_history')
// => { programId: 'my-program', originalKey: 'exercise_history' }

// Check if key should be namespaced
shouldBeNamespaced('session_w1d1') // => true
shouldBeNamespaced('tracker_app_state') // => false (global key)
```

**Namespaced Keys:**
- `exercise_history` - Exercise performance history
- `global_history` - Global workout history
- `session_w{week}d{day}` - Workout session data
- `session_empty_{timestamp}` - Empty/custom workout sessions

**Global Keys (not namespaced):**
- `tracker_app_state` - UI state (active tab, view mode)
- `tracker_program_registry` - Installed programs list
- `tracker_active_program` - Current program ID
- `firebase_sync_enabled` - Sync settings
- `emom_interval` - Timer preferences

#### 2. Storage Migration (`src/services/storageMigration.ts`)

Handles one-time migration of legacy keys to namespaced format:

```typescript
// Run migration manually
const result = runMigration('my-program-id');
// => { success: true, keysMigrated: 5, migratedKeys: [...] }

// Auto-migrate on app start (safe to call multiple times)
autoMigrate();
// => true

// Check migration status
isMigrationCompleted();
// => true

// Clean up legacy keys after successful migration
cleanupLegacyKeys();
// => 3 (number of keys removed)
```

**Migration Process:**
1. Detect legacy (non-namespaced) storage keys
2. Determine target program (active or default)
3. Copy data to namespaced keys
4. Mark migration as complete
5. Optionally clean up legacy keys

**Safety Features:**
- Idempotent - safe to run multiple times
- Non-destructive - legacy keys preserved until explicit cleanup
- Verified cleanup - only removes keys with namespaced copies

## Usage in Application

### App Initialization

The app automatically runs migration on startup in `src/main.tsx`:

```typescript
// Run storage migration if needed
const migrationResult = autoMigrate();
if (migrationResult) {
    const status = getMigrationStatus();
    if (status && status.keysMigrated > 0) {
        console.log(`Storage migration completed: ${status.keysMigrated} keys migrated`);
    }
}
```

### Reading/Writing Session Data

Components use namespaced keys transparently:

```typescript
// In useWorkoutSession hook
const sessionKey = getSessionKey(week, day);
// => 'p:oneplus-12-pro-tracker-v1:session_w1d1'

const logs = safeGetJSON(sessionKey, {});
safeSetJSON(sessionKey, updatedLogs);
```

### Exercise History

The `exerciseHistory.ts` utilities automatically use namespaced keys:

```typescript
// Automatically uses namespaced key for active program
updateExerciseHistory('Pull-Ups', entry);
getExerciseHistory('Pull-Ups');
getAllExercisesWithHistory();
```

### Firebase Sync

Cloud sync operates on namespaced data:

```typescript
// Gets all data for active program
getAllLocalData();
// => { exercise_history: {...}, sessions: {...} }

// Merges cloud data to namespaced local keys
mergeCloudData(cloudData);
```

## Data Isolation

When switching programs:

1. **Active program changes** - `getActiveProgramId()` returns new ID
2. **All keys update** - `getSessionKey(1, 1)` returns new namespaced key
3. **Data appears empty** - New program starts with no history
4. **Old data preserved** - Previous program data still exists under old namespace

Example:

```
// Program A active
getSessionKey(1, 1) => 'p:program-a:session_w1d1'

// Switch to Program B
registry.setActiveProgram('program-b');
getSessionKey(1, 1) => 'p:program-b:session_w1d1'

// Both programs' data exists:
localStorage['p:program-a:session_w1d1'] // Program A's data
localStorage['p:program-b:session_w1d1'] // Program B's data
```

## Testing

Tests for namespace functionality: `src/test/storageNamespace.test.jsx`
Tests for migration functionality: `src/test/storageMigration.test.jsx`

Run tests:
```bash
npm test -- src/test/storageNamespace.test.jsx src/test/storageMigration.test.jsx
```

## Backward Compatibility

For existing users:
1. On first app load after update, `autoMigrate()` runs
2. Legacy keys are copied to namespaced format under default program
3. App continues to work with no user action required
4. Legacy keys can be cleaned up manually or left in place
