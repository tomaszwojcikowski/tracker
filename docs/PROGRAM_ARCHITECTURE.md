# Program Registry & Data Abstraction Architecture

This document describes the architecture for supporting multiple workout programs in the tracker app.

## Overview

The tracker app has been redesigned to support multiple workout programs instead of a single hardcoded program. This enables users to:

- Load and switch between different workout programs
- Import new programs from JSON files
- Manage installed programs

## Architecture Components

### 1. Program Registry Service (`src/services/programRegistry.ts`)

The Program Registry is a singleton service that manages:

- **Program Manifests**: Metadata about installed programs (name, description, duration, etc.)
- **Program Data**: Schedule and metadata loaded from program files
- **Active Program Tracking**: Which program is currently selected

```typescript
interface ProgramRegistry {
  // Program manifest management
  getAvailablePrograms(): ProgramManifest[];
  getActiveProgram(): ProgramManifest | null;
  getActiveProgramId(): string | null;
  setActiveProgram(programId: string): void;
  getProgramById(programId: string): ProgramManifest | undefined;
  registerProgram(manifest: ProgramManifest): void;
  importProgram(planJson: WorkoutPlanJson): Promise<ProgramManifest>;
  unregisterProgram(programId: string): boolean;
  
  // Program data management
  setProgramData(programId: string, data: ProgramData): void;
  getProgramData(programId: string): ProgramData | null;
  getActiveProgramData(): ProgramData | null;
  hasProgramData(programId: string): boolean;
}
```

**Key Features:**
- Persists program manifests to localStorage
- Stores program data (schedule, metadata) in memory for fast access
- Validates program data on import
- Handles program switching with proper state cleanup

### 2. Schedule Utilities (`src/utils/schedule.ts`)

Schedule utilities have been parameterized to support multiple programs:

```typescript
// Set active program for schedule access
setActiveScheduleProgram(programId: string): void;
getActiveScheduleProgram(): string;

// Schedule data management (accepts optional programId)
setRawSchedule(data: RawScheduleItem[], programId?: string): void;
getRawSchedule(programId?: string): RawScheduleItem[];
getCompleteSchedule(programId?: string): RawScheduleItem[];
buildCompleteSchedule(programId?: string): void;

// Cleanup
clearScheduleForProgram(programId: string): void;
clearAllSchedules(): void;
```

**Data Storage:**
- Uses a `Map<string, ProgramScheduleData>` to store schedules by program ID
- Each program has its own isolated schedule data
- Default program ID used when no programId is specified

### 3. Program Data Module (`src/data/programData.ts`)

Workout retrieval functions accept optional program ID:

```typescript
getBlockForWeek(week: number, programId?: string): ProgramBlock | undefined;
getWorkoutForDay(week: number, day: number, programId?: string): DayWorkout;
```

**Data Resolution Priority:**
1. Check program registry for program data
2. Fall back to `window.TRACKER_APP.workoutPlanMetadata` for backward compatibility

### 4. Program Context (`src/context/ProgramContext.tsx`)

React context provider that:

- Provides program state to all components
- Syncs program data with schedule utilities when programs load/switch
- Exposes hooks for accessing program information

```typescript
interface ProgramContextValue {
  currentProgram: ProgramManifest | null;
  programData: WorkoutPlan | null;
  schedule: InternalSchedule | null;
  metadata: WorkoutPlanMetadata | null;
  availablePrograms: ProgramManifest[];
  switchProgram: (programId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  refreshPrograms: () => void;
  currentProgramId: string | null;
}
```

**Available Hooks:**
- `useProgram()` - Full context access
- `useCurrentProgram()` - Current program manifest only
- `useCurrentProgramId()` - Current program ID only
- `useProgramLoading()` - Loading state only
- `useProgramSchedule()` - Schedule and metadata only

## Data Flow

```
                   ┌─────────────────────┐
                   │   JSON File Load    │
                   │  (main.tsx/Context) │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  loadWorkoutPlan()  │
                   │ (workout-plan-utils)│
                   └──────────┬──────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ ProgramRegistry │ │ Schedule Utils  │ │ ProgramContext  │
│ (setProgramData)│ │ (setRawSchedule)│ │ (React state)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │   UI Components     │
                   │ (via context/utils) │
                   └─────────────────────┘
```

## Key Design Decisions

### 1. Backward Compatibility

All parameterized functions default to the current active program, ensuring existing code continues to work:

```typescript
// Both of these work identically when using the active program:
getWorkoutForDay(1, 1);           // Uses active program
getWorkoutForDay(1, 1, 'my-program');  // Explicit program ID
```

### 2. No Global State Assumptions

Functions no longer assume a single global program. All program-specific logic operates within the context of a program ID.

### 3. Memory-Based Program Data

Schedule data is stored in memory (Map) rather than localStorage for performance. Program manifests are persisted for resuming the active program on reload.

### 4. Fallback Support

Legacy code relying on `window.TRACKER_APP.workoutPlanMetadata` continues to work through explicit fallback logic.

## Usage Examples

### Switching Programs

```typescript
import { useProgram } from '@/context';

function ProgramSwitcher() {
  const { availablePrograms, switchProgram, currentProgramId, isLoading } = useProgram();
  
  const handleSwitch = async (programId: string) => {
    await switchProgram(programId);
    // Schedule utilities are automatically updated
  };
  
  return (
    <select 
      value={currentProgramId ?? ''} 
      onChange={(e) => handleSwitch(e.target.value)}
      disabled={isLoading}
    >
      {availablePrograms.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}
```

### Accessing Workout Data

```typescript
import { getWorkoutForDay } from '@/data';
import { useCurrentProgramId } from '@/context';

function WorkoutView({ week, day }) {
  const programId = useCurrentProgramId();
  const workout = getWorkoutForDay(week, day, programId);
  
  return <WorkoutDisplay workout={workout} />;
}
```

### Importing a New Program

```typescript
import { getProgramRegistry } from '@/services';
import { loadWorkoutPlan } from '@/workout-plan-utils';
import { setRawSchedule, buildCompleteSchedule } from '@/utils/schedule';

async function importProgram(jsonData: WorkoutPlanJson) {
  const registry = getProgramRegistry();
  
  // Import creates manifest and registers program
  const manifest = await registry.importProgram(jsonData);
  
  // Load and process the data
  const { schedule, metadata } = loadWorkoutPlan(jsonData);
  
  // Store in registry
  registry.setProgramData(manifest.id, { schedule, metadata });
  
  // Sync with schedule utilities
  setRawSchedule(schedule, manifest.id);
  buildCompleteSchedule(manifest.id);
  
  // Optionally switch to the new program
  registry.setActiveProgram(manifest.id);
}
```

## File Structure

```
src/
├── context/
│   ├── ProgramContext.tsx    # React context for program state
│   └── index.ts              # Context exports
├── services/
│   ├── programRegistry.ts    # Program registry service
│   └── index.ts              # Service exports
├── data/
│   ├── programData.ts        # Workout data retrieval (parameterized)
│   └── index.ts              # Data exports
├── utils/
│   └── schedule.ts           # Schedule utilities (multi-program)
└── workout-plan-utils.ts     # Plan loading and conversion
```

## Testing

The architecture is thoroughly tested:

- `src/test/programRegistry.test.jsx` - Registry service tests
- `src/test/programData.test.jsx` - Data module tests
- `src/test/scheduleUtils.test.jsx` - Schedule utility tests

Run tests with:
```bash
npm test
```

## Future Enhancements

1. **Program Import UI**: File picker for importing JSON programs
2. **Program Management UI**: List, delete, and manage installed programs
3. **Program Sync**: Cloud sync for installed programs across devices
4. **Program Validation**: Schema validation on import
5. **Program Versioning**: Handle program updates and migrations
