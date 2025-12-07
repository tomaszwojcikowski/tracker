# Exercise Options Feature Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       WorkoutPlayer Component                    │
│                                                                   │
│  State:                                                          │
│  ├─ selectedExerciseOptions: Record<string, string>             │
│  ├─ showOptionsFor: { exerciseId, exerciseName, options } | null│
│  └─ logs: WorkoutSessionData (includes exerciseOptions)         │
│                                                                   │
│  Functions:                                                      │
│  ├─ handleSelectExerciseOption(exerciseId, optionName)          │
│  ├─ getExerciseWithOption(exercise) -> exercise with overrides  │
│  └─ persistLogs(updatedLogs) -> saves & syncs                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ├─────────────────────────┐
                           │                         │
                           ▼                         ▼
         ┌──────────────────────────┐   ┌──────────────────────┐
         │   CompactExerciseRow     │   │    ExerciseCard      │
         │                          │   │                      │
         │  Shows:                  │   │  Shows:              │
         │  ├─ Exercise name        │   │  ├─ Exercise name    │
         │  ├─ Set buttons          │   │  ├─ Set buttons      │
         │  └─ ExerciseOptionsBadge │   │  └─ ExerciseOptions  │
         │     (if options exist)   │   │     Badge            │
         │                          │   │     (if options)     │
         │  Props:                  │   │                      │
         │  ├─ exerciseOptions      │   │  Props:              │
         │  ├─ selectedOption       │   │  ├─ exerciseOptions  │
         │  └─ onShowOptions()      │   │  ├─ selectedOption   │
         └──────────────────────────┘   │  └─ onShowOptions()  │
                           │             └──────────────────────┘
                           │                         │
                           └────────┬────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │ ExerciseOptionsBadge      │
                    │                           │
                    │ Visual States:            │
                    │ ├─ No selection:          │
                    │ │  Amber, pulsing         │
                    │ │  "4 options"            │
                    │ └─ Selected:              │
                    │    Blue, solid            │
                    │    "4 options"            │
                    │                           │
                    │ onClick -> triggers       │
                    │ onShowOptions()           │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  ExerciseOptionsModal     │
                    │                           │
                    │  Displays:                │
                    │  ├─ Option name           │
                    │  ├─ Description           │
                    │  ├─ Parameter summary     │
                    │  ├─ Equipment tags        │
                    │  └─ Checkmark (selected)  │
                    │                           │
                    │  onSelectOption ->        │
                    │  handleSelectExercise     │
                    │  Option()                 │
                    └───────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────────┐
│  Workout Plan JSON   │
│                      │
│  {                   │
│    "exerciseOptions":│
│    [                 │
│      {               │
│        "optionName": │
│        "Barbell",    │
│        "sets": 5,    │
│        ...           │
│      }               │
│    ]                 │
│  }                   │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  Schedule Builder    │
│  (workout-plan-      │
│   utils.ts)          │
│                      │
│  Parses JSON and     │
│  builds WorkoutEx-   │
│  ercise objects      │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  WorkoutExercise     │
│                      │
│  {                   │
│    name: string,     │
│    sets: number,     │
│    exerciseOptions?: │
│      ExerciseOption[]│
│    ...               │
│  }                   │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  WorkoutPlayer       │
│                      │
│  Loads from local-   │
│  Storage:            │
│  exerciseOptions:    │
│  {                   │
│    "ex_squat":       │
│    "Barbell"         │
│  }                   │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  getExerciseWith     │
│  Option()            │
│                      │
│  Applies overrides   │
│  from selected       │
│  option to exercise  │
│  properties          │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  Rendered Exercise   │
│                      │
│  Name: "Barbell..."  │
│  Sets: 5 (override)  │
│  Badge: "4 options"  │
│  Status: Selected    │
└──────────────────────┘
```

## State Management Flow

```
User Action:
  Click ExerciseOptionsBadge
         │
         ▼
  setShowOptionsFor({
    exerciseId: "ex_squat",
    exerciseName: "Squat",
    options: [...]
  })
         │
         ▼
  ExerciseOptionsModal opens
         │
         ▼
  User selects "Goblet Squat"
         │
         ▼
  handleSelectExerciseOption(
    "ex_squat",
    "Goblet Squat"
  )
         │
         ├─────────────────────┬──────────────────┐
         │                     │                  │
         ▼                     ▼                  ▼
  Update State          Persist Data       Sync Cloud
         │                     │                  │
  setSelected           const updated       syncService
  ExerciseOptions       Logs = {            .scheduleSync()
  ({                    ...logs,                 │
    ...prev,            exerciseOptions: {       │
    "ex_squat":         ...logs.exercise         │
    "Goblet Squat"      Options,                 │
  })                    "ex_squat":              │
         │              "Goblet Squat"            │
         │              },                        │
         │              lastModified: now         │
         │              }                         │
         │                     │                  │
         │              safeSetJSON(              │
         │              sessionKey,               │
         │              updatedLogs)              │
         │                     │                  │
         └─────────────────────┴──────────────────┘
                              │
                              ▼
                    Modal closes
                              │
                              ▼
                    Exercise re-renders
                    with new option applied
```

## Option Override Application

```
Base Exercise:
{
  name: "Lower Body Compound",
  sets: 4,
  repsMin: 8,
  repsMax: 12,
  restSeconds: 180,
  loadMin: 60,
  loadMax: 100,
  loadUnit: "kg"
}
         │
         ▼
Selected Option:
{
  optionName: "Goblet Squat",
  sets: 4,          // Same as base
  loadMin: 24,      // Override
  loadMax: 40,      // Override
  equipment: ["dumbbell", "kettlebell"]
}
         │
         ▼
applyExerciseOption(base, option)
         │
         ▼
Result (Merged):
{
  name: "Lower Body Compound",
  sets: 4,          // From base (not overridden)
  repsMin: 8,       // From base (not overridden)
  repsMax: 12,      // From base (not overridden)
  restSeconds: 180, // From base (not overridden)
  loadMin: 24,      // Overridden by option
  loadMax: 40,      // Overridden by option
  loadUnit: "kg",   // From base (not overridden)
  equipment: ["dumbbell", "kettlebell"] // From option
}
```

## Persistence Flow

```
┌──────────────────────┐
│  WorkoutSessionData  │
│  in localStorage     │
│                      │
│  {                   │
│    exercises: {...}, │
│    exerciseOptions: {│
│      "ex_squat":     │
│      "Barbell"       │
│    },                │
│    lastModified:     │
│    "2024-01-15..."   │
│  }                   │
└──────────────────────┘
           │
           ├────────────────────┐
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│  localStorage    │  │  Firebase RTDB   │
│                  │  │                  │
│  Key:            │  │  users/          │
│  session_w1d1    │  │  {userId}/       │
│                  │  │  sessions/       │
│  Value:          │  │  session_w1d1    │
│  {...}           │  │                  │
│                  │  │  Synced via      │
│  Auto-saved on   │  │  syncService     │
│  every change    │  │  with debounce   │
└──────────────────┘  └──────────────────┘
```

## UI Component Hierarchy

```
WorkoutPlayer
├── ActionBar
├── Workout Sections
│   ├── Section Header
│   └── Exercises
│       ├── CompactExerciseRow (compact view)
│       │   ├── Exercise Info
│       │   ├── Set Buttons
│       │   └── ExerciseOptionsBadge ⭐ NEW
│       │       └── Click -> showOptionsFor
│       │
│       └── ExerciseCard (card view)
│           ├── Exercise Header
│           ├── Set Buttons
│           ├── Weight Input
│           └── ExerciseOptionsBadge ⭐ NEW
│               └── Click -> showOptionsFor
│
├── Modals
│   ├── ExerciseDetailModal
│   ├── ExerciseSelectorModal
│   └── ExerciseOptionsModal ⭐ NEW
│       ├── Option List
│       │   ├── Option Name
│       │   ├── Description
│       │   ├── Summary
│       │   └── Equipment Tags
│       └── Select -> handleSelectExerciseOption
│
└── WorkoutSummary
```

## Badge Visual States

```
┌─────────────────────────────┐
│  No Option Selected         │
│                             │
│  ┌─────────────────────┐    │
│  │ ⚙️ 4 options        │    │
│  └─────────────────────┘    │
│                             │
│  Style:                     │
│  - Amber background         │
│  - Pulsing animation        │
│  - Attention-grabbing       │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Option Selected            │
│                             │
│  ┌─────────────────────┐    │
│  │ ⚙️ 4 options        │    │
│  └─────────────────────┘    │
│                             │
│  Style:                     │
│  - Blue/accent background   │
│  - Solid (no pulse)         │
│  - Indicates selected       │
└─────────────────────────────┘
```

## Testing Strategy

```
Unit Tests (9 tests)
├── State initialization
│   ├── Default options
│   └── Load existing
├── Persistence
│   ├── Save to localStorage
│   ├── Handle empty data
│   └── Handle invalid data
└── Multiple selections
    ├── Multiple exercises
    └── Change selection

Integration (In WorkoutPlayer)
├── Modal open/close
├── Option selection
├── Badge display
└── Option application

End-to-End (Manual)
├── Full user flow
├── Cross-device sync
└── Persistence across sessions
```

## Key Implementation Details

### Type Safety
- All option-related types imported from `workout-plan-utils.ts`
- `ExerciseOption` interface defines all possible overrides
- `WorkoutSessionData` includes `exerciseOptions` field
- Proper TypeScript generics used in `applyExerciseOption`

### Performance
- Options only applied when exercise is rendered
- Memoized getExerciseWithOption with useCallback
- Modal only rendered when open (conditional rendering)
- Badge only shown when options exist

### Accessibility
- Modal has proper aria-label
- Badge has descriptive title attribute
- Touch-optimized tap targets
- Keyboard navigation support

### Error Handling
- Graceful handling of missing options
- Validates option exists before applying
- Fallback to base exercise if option invalid
- Safe localStorage access with error catching
