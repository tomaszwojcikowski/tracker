# Exercise Options Feature Guide

## Overview

Exercise options allow you to define multiple variations of an exercise that users can choose from during their workout. This is useful when:

- Multiple equipment options exist (barbell, dumbbells, bands)
- Different rep schemes serve different goals (strength vs. endurance)
- Stance or technique variations are available (conventional vs. sumo)
- Unilateral vs. bilateral variations exist (lunges, split squats, single-leg RDLs)

## Key Concepts

### Exercise Options vs. Alternatives

The tracker supports two similar but distinct features:

**Alternatives** (Legacy):
- Simple exercise name swaps
- Listed as an array of strings
- User can swap the entire exercise for a different one
- No parameter changes, just name substitution

**Exercise Options** (v2.3.0+):
- Rich variation definitions with full parameter control
- Each option can override: sets, reps, load, equipment, and more
- User selects one option before starting the exercise
- Selection persisted per workout session

## Schema Structure

### Basic Example

```json
{
  "exerciseName": "Lower Body Compound",
  "category": "main",
  "sets": 4,
  "repsMin": 8,
  "repsMax": 12,
  "restSeconds": 180,
  "exerciseOptions": [
    {
      "optionName": "Barbell Back Squat",
      "description": "Classic strength builder",
      "loadUnit": "kg",
      "loadMin": 60,
      "loadMax": 100,
      "equipment": ["barbell", "rack"]
    },
    {
      "optionName": "Goblet Squat",
      "sets": 4,
      "loadUnit": "kg",
      "loadMin": 24,
      "loadMax": 40,
      "equipment": ["dumbbell"]
    }
  ]
}
```

### Option Properties

Each exercise option can override the following base exercise properties:

| Property | Type | Description |
|----------|------|-------------|
| `optionName` | string | **Required.** Name of this option (e.g., "Barbell", "Dumbbell") |
| `exerciseName` | string | Override the exercise name for this option |
| `description` | string | Description of when to use this option |
| `sets` | number | Override number of sets |
| `restSeconds` | number | Override rest between sets |
| `rpe` | number | Override target RPE |
| `notes` | string | Override training notes |
| `loadMin` | number | Override minimum weight |
| `loadMax` | number | Override maximum weight |
| `loadUnit` | string | Override load unit (kg, lb, band, bodyweight, percent) |
| `loadPerHand` | boolean | Override per-hand flag (for dumbbells) |
| `repsType` | string | Override reps type (reps, time, ladder, amrap, etc.) |
| `repsValue` | number \| number[] | Override reps value |
| `repsMin` | number | Override minimum reps |
| `repsMax` | number | Override maximum reps |
| `repsUnit` | string | Override reps unit (seconds, minutes) |
| `repsPerSide` | boolean | Override per-side flag |
| `equipment` | string[] | Required equipment for this option |
| `variation` | string | Variation descriptor for tracking |

## Use Cases

### 1. Equipment Variations

Different equipment options for the same movement pattern:

```json
{
  "exerciseName": "Horizontal Press",
  "sets": 3,
  "repsMin": 8,
  "repsMax": 12,
  "exerciseOptions": [
    {
      "optionName": "Barbell Bench Press",
      "loadUnit": "kg",
      "loadMin": 60,
      "loadMax": 100,
      "equipment": ["barbell", "bench", "rack"]
    },
    {
      "optionName": "Dumbbell Bench Press",
      "loadUnit": "kg",
      "loadMin": 20,
      "loadMax": 40,
      "loadPerHand": true,
      "equipment": ["dumbbells", "bench"]
    },
    {
      "optionName": "Push-Ups",
      "loadUnit": "bodyweight",
      "repsMin": 15,
      "repsMax": 20,
      "equipment": []
    }
  ]
}
```

### 2. Rep Scheme Variations

Different rep schemes for different training goals:

```json
{
  "exerciseName": "Deadlift",
  "sets": 4,
  "restSeconds": 180,
  "exerciseOptions": [
    {
      "optionName": "Strength Focus (5x5)",
      "sets": 5,
      "repsValue": 5,
      "loadMin": 100,
      "loadMax": 140,
      "description": "Heavy weight, low reps for maximum strength"
    },
    {
      "optionName": "Hypertrophy (4x10)",
      "sets": 4,
      "repsValue": 10,
      "loadMin": 70,
      "loadMax": 90,
      "restSeconds": 90,
      "description": "Moderate weight, higher reps for muscle growth"
    },
    {
      "optionName": "Volume (3x15)",
      "sets": 3,
      "repsValue": 15,
      "loadMin": 50,
      "loadMax": 70,
      "restSeconds": 60,
      "description": "Light weight, high reps for work capacity"
    }
  ]
}
```

### 3. Unilateral vs. Bilateral

Options for single-leg vs. double-leg exercises:

```json
{
  "exerciseName": "Lower Body Unilateral",
  "category": "accessory",
  "sets": 3,
  "repsMin": 10,
  "repsMax": 12,
  "exerciseOptions": [
    {
      "optionName": "Walking Lunges",
      "repsPerSide": true,
      "description": "Dynamic, requires space"
    },
    {
      "optionName": "Bulgarian Split Squat",
      "repsPerSide": true,
      "equipment": ["bench", "dumbbells"],
      "description": "Elevated rear foot, more quad focus"
    },
    {
      "optionName": "Single-Leg RDL",
      "repsPerSide": true,
      "equipment": ["dumbbell"],
      "description": "Balance challenge, hamstring focus"
    }
  ]
}
```

### 4. Stance Variations

Different stances or techniques for the same exercise:

```json
{
  "exerciseName": "Deadlift Variation",
  "sets": 4,
  "repsMin": 5,
  "repsMax": 8,
  "exerciseOptions": [
    {
      "optionName": "Conventional Deadlift",
      "description": "Standard stance, hip-width grip"
    },
    {
      "optionName": "Sumo Deadlift",
      "description": "Wide stance, reduces lower back stress"
    },
    {
      "optionName": "Romanian Deadlift (RDL)",
      "repsMin": 8,
      "repsMax": 12,
      "description": "Hamstring focus, partial range of motion"
    }
  ]
}
```

## Best Practices

### 1. Meaningful Differences

Each option should provide a meaningfully different training stimulus:

✅ **Good:** Different equipment with different load ranges
```json
{
  "optionName": "Barbell",
  "loadMin": 60,
  "loadMax": 100,
  "loadUnit": "kg"
},
{
  "optionName": "Dumbbell",
  "loadMin": 20,
  "loadMax": 40,
  "loadUnit": "kg",
  "loadPerHand": true
}
```

❌ **Bad:** Options with no real difference
```json
{
  "optionName": "Option A"
},
{
  "optionName": "Option B"
}
```

### 2. Clear Descriptions

Help users make informed choices:

✅ **Good:**
```json
{
  "optionName": "Bulgarian Split Squat",
  "description": "Elevated rear foot, more quad focus, requires bench"
}
```

❌ **Bad:**
```json
{
  "optionName": "Bulgarian Split Squat"
}
```

### 3. Equipment Tags

Always specify required equipment:

```json
{
  "optionName": "Barbell Back Squat",
  "equipment": ["barbell", "rack"]
}
```

### 4. Appropriate Default Values

Set sensible base values that work for most options:

```json
{
  "exerciseName": "Squat Variation",
  "sets": 4,              // Base sets (works for most)
  "repsMin": 8,           // Base rep range
  "repsMax": 12,
  "restSeconds": 180,     // Standard rest for compound
  "exerciseOptions": [
    {
      "optionName": "Heavy Barbell",
      "repsMin": 5,       // Override for this specific option
      "repsMax": 8
    },
    {
      "optionName": "Bodyweight",
      "sets": 5,          // Override sets
      "repsMin": 15,
      "repsMax": 20
    }
  ]
}
```

## User Experience Flow

1. **Exercise with Options Appears**
   - Badge shows "X options" with indicator
   - If no option selected yet, badge pulses to draw attention

2. **User Clicks Badge or Exercise**
   - Modal opens showing all available options
   - Each option displays:
     - Name and description
     - Summary (sets, reps, load)
     - Required equipment
     - Check mark if currently selected

3. **User Selects Option**
   - Modal closes
   - Exercise updates to reflect selected parameters
   - Badge shows selected state (no pulse)
   - Selection persisted for this workout session

4. **Exercise Tracking**
   - All tracking (sets, weight, RPE) uses selected option's parameters
   - History saved with variation name for tracking progress per option

## Implementation Notes

### Storage

Selected options are stored per workout session:

```typescript
interface WorkoutSessionData {
  // ... other fields
  exerciseOptions?: Record<string, string>; // exerciseId -> optionName
}
```

### History Tracking

When an exercise with options is completed, the selected option's variation name (or option name) is used for history tracking, allowing separate progress tracking per variation.

### Backward Compatibility

- Exercises without `exerciseOptions` work exactly as before
- Existing `alternatives` field continues to work
- Both features can coexist on the same exercise (though not recommended)

## Migration Guide

### Converting Alternatives to Options

If you have exercises with simple alternatives:

**Before (v2.2):**
```json
{
  "exerciseName": "Squat",
  "sets": 4,
  "reps": "8-12",
  "alternatives": ["Leg Press", "Goblet Squat"]
}
```

**After (v2.3):**
```json
{
  "exerciseName": "Squat",
  "sets": 4,
  "repsMin": 8,
  "repsMax": 12,
  "exerciseOptions": [
    {
      "optionName": "Barbell Back Squat",
      "loadUnit": "kg",
      "loadMin": 60,
      "loadMax": 100
    },
    {
      "optionName": "Leg Press",
      "exerciseName": "Leg Press",
      "loadUnit": "kg",
      "loadMin": 80,
      "loadMax": 120
    },
    {
      "optionName": "Goblet Squat",
      "exerciseName": "Goblet Squat",
      "loadUnit": "kg",
      "loadMin": 20,
      "loadMax": 40
    }
  ]
}
```

## Testing

When adding exercise options to your workout plan:

1. **Validate Schema**: Ensure JSON validates against `workout-plan-v2.3.schema.json`
2. **Test Each Option**: Try each option to ensure parameters apply correctly
3. **Check History**: Verify that each option tracks history separately
4. **Verify Persistence**: Confirm selection survives page reload

## Resources

- [Workout Plan Format Specification](WORKOUT_PLAN_FORMAT.md)
- [JSON Schema](../data/workout-plan-v2.3.schema.json)
- [Example Workout Plan](../data/workout-plan-v2.5.json) - Current plan data with exercise options
