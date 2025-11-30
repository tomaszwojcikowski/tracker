# Workout Plan Format Specification

## Overview

This document defines the robust and complete workout plan format used by the Tracker application. The format is designed to be comprehensive, extensible, and maintainable while preserving all training data.

## Version

**Current Version:** 2.1.0

**JSON Schema:** [`workout-plan-v2.schema.json`](workout-plan-v2.schema.json)

## What's New in v2.1.0

Version 2.1.0 introduces **day references** to reduce file size and improve maintainability:

1. **Day IDs**: Days can now have an optional `id` field for identification
2. **Day References**: Days can reference other days using `$ref` field
3. **Day Templates**: Optional `dayTemplates` array at plan level for reusable day definitions
4. **~41% smaller files**: Repeated days (like mobility days) only need to be defined once

### Quick Example

```json
{
  "formatVersion": "2.1.0",
  "plan": {
    "dayTemplates": [
      {
        "id": "mobility-day",
        "name": "Mobility & Recovery",
        "type": "mobility",
        "exercises": [...]
      }
    ],
    "phases": [{
      "weeks": [{
        "weekNumber": 1,
        "days": [
          { "dayNumber": 1, "id": "w1d1-pull", "name": "Pull Day A", "exercises": [...] },
          { "dayNumber": 2, "$ref": "mobility-day" },
          { "dayNumber": 3, "id": "w1d3-lower", "name": "Lower Body", "exercises": [...] }
        ]
      }, {
        "weekNumber": 2,
        "days": [
          { "dayNumber": 1, "$ref": "w1d1-pull" },
          { "dayNumber": 2, "$ref": "mobility-day" },
          { "dayNumber": 3, "$ref": "w1d3-lower" }
        ]
      }]
    }]
  }
}
```

## Design Principles

1. **Completeness**: Capture all relevant training data including metadata, progressions, and constraints
2. **Readability**: Use full field names, no abbreviations
3. **Structure**: Organize data hierarchically (plan → phases → weeks → days → exercises)
4. **Extensibility**: Allow for future additions without breaking existing data
5. **Type Safety**: Clear field types and constraints
6. **Structured Data**: Use explicit fields instead of parsing strings
7. **DRY (Don't Repeat Yourself)**: Use references for duplicate content (v2.1+)

## Format Structure

### Root Level: Training Plan

```json
{
  "formatVersion": "2.1.0",
  "plan": {
    "id": "string",
    "name": "string",
    "description": "string",
    "author": "string",
    "createdDate": "ISO 8601 date",
    "lastModified": "ISO 8601 date",
    "version": "string",
    "durationWeeks": "number",
    "goals": ["string"],
    "targetLevel": "beginner|intermediate|advanced|elite",
    "equipment": ["string"],
    "dayTemplates": [],
    "phases": []
  }
}
```

### Plan Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `formatVersion` | string | Yes | Format specification version (must be "2.1.x") |
| `plan.id` | string | Yes | Unique identifier for the plan |
| `plan.name` | string | Yes | Human-readable plan name |
| `plan.description` | string | No | Detailed description of the training plan |
| `plan.author` | string | No | Creator of the plan |
| `plan.createdDate` | string | No | ISO 8601 date when plan was created |
| `plan.lastModified` | string | No | ISO 8601 date of last modification |
| `plan.version` | string | No | Plan version (independent of format version) |
| `plan.durationWeeks` | number | Yes | Total duration in weeks |
| `plan.goals` | array | No | Training goals (e.g., "muscle-up", "weighted-pull-ups") |
| `plan.targetLevel` | string | No | Intended experience level |
| `plan.equipment` | array | No | Required equipment list |
| `plan.dayTemplates` | array | No | Reusable day templates (v2.1+) |
| `plan.phases` | array | Yes | Array of training phases (mesocycles) |

### Day Templates (v2.1+)

Day templates allow you to define reusable day structures at the plan level. They follow the same structure as regular days but are defined once and referenced multiple times.

```json
{
  "dayTemplates": [
    {
      "id": "mobility-standard",
      "name": "Mobility & Recovery",
      "type": "mobility",
      "estimatedDuration": 25,
      "exercises": [...]
    },
    {
      "id": "deload-pull",
      "name": "Deload Pull Day",
      "type": "strength",
      "estimatedDuration": 30,
      "exercises": [...]
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for referencing this template |
| `name` | string | No | Template name (can be overridden by referencing day) |
| `type` | string | No | Session type |
| `estimatedDuration` | number | No | Duration in minutes |
| `description` | string | No | Template description |
| `exercises` | array | Yes | Array of exercises |
    "phases": []
  }
}
```

### Plan Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `formatVersion` | string | Yes | Format specification version (semantic versioning) |
| `plan.id` | string | Yes | Unique identifier for the plan |
| `plan.name` | string | Yes | Human-readable plan name |
| `plan.description` | string | No | Detailed description of the training plan |
| `plan.author` | string | No | Creator of the plan |
| `plan.createdDate` | string | No | ISO 8601 date when plan was created |
| `plan.lastModified` | string | No | ISO 8601 date of last modification |
| `plan.version` | string | No | Plan version (independent of format version) |
| `plan.durationWeeks` | number | Yes | Total duration in weeks |
| `plan.goals` | array | No | Training goals (e.g., "muscle-up", "weighted-pull-ups") |
| `plan.targetLevel` | string | No | Intended experience level |
| `plan.equipment` | array | No | Required equipment list |
| `plan.phases` | array | Yes | Array of training phases (mesocycles) |

### Phase Structure (Mesocycle)

```json
{
  "phaseNumber": 1,
  "name": "Foundation Phase",
  "description": "Build base strength and movement patterns",
  "startWeek": 1,
  "endWeek": 4,
  "focus": "volume",
  "weeks": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phaseNumber` | number | Yes | Sequential phase number (1-indexed) |
| `name` | string | Yes | Phase name |
| `description` | string | No | Phase description and goals |
| `startWeek` | number | Yes | First week of phase (1-indexed) |
| `endWeek` | number | Yes | Last week of phase (inclusive) |
| `focus` | string | No | Primary focus (volume, intensity, skill, deload, test) |
| `weeks` | array | Yes | Array of week objects |

### Week Structure (Microcycle)

```json
{
  "weekNumber": 1,
  "description": "Introduction week",
  "focus": "technique",
  "volumeLevel": "moderate",
  "intensityLevel": "low",
  "days": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `weekNumber` | number | Yes | Week number within the entire plan (1-indexed) |
| `description` | string | No | Week description or focus |
| `focus` | string | No | Primary focus for the week |
| `volumeLevel` | string | No | Relative volume (low, moderate, high, peak) |
| `intensityLevel` | string | No | Relative intensity (low, moderate, high, peak) |
| `days` | array | Yes | Array of training days |

### Day Structure (Training Session)

A day can be defined inline with full content, or reference another day/template.

#### Inline Day Definition

```json
{
  "dayNumber": 1,
  "id": "w1d1-pull",
  "name": "Pull Day A",
  "type": "strength",
  "estimatedDuration": 60,
  "description": "Upper body pulling focus",
  "exercises": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dayNumber` | number | Yes | Day number within the week (1-7) |
| `id` | string | No | Unique identifier for referencing (v2.1+) |
| `name` | string | No | Descriptive name for the session |
| `type` | string | No | Session type (strength, mobility, cardio, skill, recovery, rest, test) |
| `estimatedDuration` | number | No | Estimated duration in minutes |
| `description` | string | No | Session description or notes |
| `exercises` | array | Yes* | Array of exercise specifications (*required unless using `$ref`) |

#### Day Reference (v2.1+)

Instead of duplicating day content, reference another day or template:

```json
{
  "dayNumber": 2,
  "$ref": "mobility-standard"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dayNumber` | number | Yes | Day number within the week (1-7) |
| `$ref` | string | Yes | ID of the day or template to reference |
| `name` | string | No | Override the referenced day's name |
| `description` | string | No | Override the referenced day's description |

**Reference Resolution Rules:**
1. First, look for matching `id` in `dayTemplates`
2. Then, look for matching `id` in any previously defined day within `phases`
3. Override fields (`name`, `description`) are merged on top of referenced content
4. `dayNumber` always comes from the referencing day, not the referenced

### Exercise Specification

The exercise specification has been updated to use structured fields instead of string parsing. The new format uses explicit fields for load, reps, and tempo data.

```json
{
  "order": 1,
  "exerciseName": "Pull-Ups",
  "exerciseId": "pull_ups",
  "category": "main",
  "sets": 4,
  "restSeconds": 120,
  "rpe": 8,
  "notes": "Focus on full ROM",
  "alternatives": [],
  "progressionNotes": "Add weight when hitting 3x10",
  "videoUrl": null,
  "cues": [],

  "loadMin": 0,
  "loadMax": 0,
  "loadUnit": "bodyweight",

  "repsType": "reps",
  "repsValue": 8,

  "tempoEccentric": 2,
  "tempoPauseBottom": 0,
  "tempoConcentric": 1,
  "tempoPauseTop": 0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order` | number | Yes | Exercise order in the workout (1-indexed) |
| `exerciseName` | string | Yes | Full exercise name as displayed to user |
| `exerciseId` | string | No | Reference to exercise in library |
| `category` | string | No | Exercise category (warmup, main, accessory, cooldown, mobility, skill, core) |
| `sets` | number | Yes | Number of sets |
| `restSeconds` | number | No | Rest between sets in seconds |
| `rpe` | number | No | Target RPE (Rate of Perceived Exertion, 1-10) |
| `notes` | string | No | Training prescription and coaching cues |
| `alternatives` | array | No | Array of alternative exercise IDs |
| `progressionNotes` | string | No | How to progress this exercise |
| `videoUrl` | string | No | Link to demonstration video |
| `cues` | array | No | Array of coaching cue strings |

### Structured Load Fields

Instead of parsing a `load` string, use these explicit fields:

| Field | Type | Description |
|-------|------|-------------|
| `loadMin` | number | Minimum weight value |
| `loadMax` | number | Maximum weight value (same as min for fixed loads) |
| `loadUnit` | string | Unit: `"kg"`, `"band"`, `"bodyweight"`, or `"percent"` |
| `loadPerHand` | boolean | Optional. True if load is per hand (for dumbbell exercises) |

**Examples:**

```json
// Bodyweight exercise (no additional load)
{ "loadMin": 0, "loadMax": 0, "loadUnit": "bodyweight" }

// Fixed weight: 10kg
{ "loadMin": 10, "loadMax": 10, "loadUnit": "kg" }

// Weight range: 5-10kg
{ "loadMin": 5, "loadMax": 10, "loadUnit": "kg" }

// Dumbbells: 8-12kg per hand
{ "loadMin": 8, "loadMax": 12, "loadUnit": "kg", "loadPerHand": true }

// Light resistance band
{ "loadMin": 1, "loadMax": 1, "loadUnit": "band" }

// Medium resistance band
{ "loadMin": 2, "loadMax": 2, "loadUnit": "band" }
```

### Structured Reps Fields

Instead of parsing a `reps` string, use these explicit fields:

| Field | Type | Description |
|-------|------|-------------|
| `repsType` | string | Type: `"reps"`, `"time"`, `"ladder"`, `"amrap"`, `"rm"`, `"max"`, `"effort"`, `"submax"`, `"none"` |
| `repsValue` | number/array/null | Primary value (count, seconds, or ladder steps array) |
| `repsMin` | number | Minimum reps for rep ranges |
| `repsMax` | number | Maximum reps for rep ranges |
| `repsUnit` | string | Unit for time-based: `"seconds"` |
| `repsPerSide` | boolean | True if reps are per side |
| `repsModifier` | number | Modifier for AMRAP (e.g., -1, -20) |

**Examples:**

```json
// Fixed reps: 8 reps
{ "repsType": "reps", "repsValue": 8 }

// Rep range: 8-12 reps
{ "repsType": "reps", "repsMin": 8, "repsMax": 12 }

// Per side: 10/side
{ "repsType": "reps", "repsValue": 10, "repsPerSide": true }

// Time-based: 30 seconds
{ "repsType": "time", "repsValue": 30, "repsUnit": "seconds" }

// Time-based: 2 minutes (120 seconds)
{ "repsType": "time", "repsValue": 120, "repsUnit": "seconds" }

// Time range: 10-20 seconds
{ "repsType": "time", "repsMin": 10, "repsMax": 20, "repsUnit": "seconds" }

// Ladder: (1-2-3) reps
{ "repsType": "ladder", "repsValue": [1, 2, 3] }

// AMRAP Max
{ "repsType": "amrap", "repsValue": null }

// AMRAP - 1 (leave 1 rep in reserve)
{ "repsType": "amrap", "repsValue": null, "repsModifier": 1 }

// 3RM test
{ "repsType": "rm", "repsValue": 3 }

// Max reps
{ "repsType": "max", "repsValue": null }

// Effort-based: 50% effort
{ "repsType": "effort", "repsValue": 50 }
```

### Structured Tempo Fields

Instead of parsing a `tempo` string like "2-1-1-0", use these explicit fields:

| Field | Type | Description |
|-------|------|-------------|
| `tempoEccentric` | number | Eccentric (lowering) phase duration in seconds |
| `tempoPauseBottom` | number | Pause at bottom position in seconds |
| `tempoConcentric` | number | Concentric (lifting) phase duration in seconds |
| `tempoPauseTop` | number | Pause at top position in seconds |

**Example:**

```json
// Tempo 2-1-1-0 (2s down, 1s pause, 1s up, 0s pause at top)
{
  "tempoEccentric": 2,
  "tempoPauseBottom": 1,
  "tempoConcentric": 1,
  "tempoPauseTop": 0
}
```

### Legacy Fields (Deprecated)

The following fields are deprecated but still supported for backward compatibility:

| Field | Replacement |
|-------|-------------|
| `reps` | Use `repsType`, `repsValue`, `repsMin`, `repsMax`, etc. |
| `load` | Use `loadMin`, `loadMax`, `loadUnit`, `loadPerHand` |
| `tempo` | Use `tempoEccentric`, `tempoPauseBottom`, `tempoConcentric`, `tempoPauseTop` |

### Valid Values

#### Session Types
- `strength`: Main strength training
- `mobility`: Mobility and flexibility work
- `cardio`: Cardiovascular conditioning
- `skill`: Skill practice (e.g., handstands, muscle-ups)
- `recovery`: Active recovery session
- `rest`: Complete rest day
- `test`: Testing/assessment day

#### Exercise Categories
- `warmup`: Warm-up exercises
- `main`: Primary working sets
- `accessory`: Accessory/supplemental work
- `cooldown`: Cool-down exercises
- `mobility`: Mobility work
- `skill`: Skill practice
- `core`: Core training

#### Focus Types
- `volume`: Volume accumulation
- `intensity`: Intensity focus
- `skill`: Skill development
- `deload`: Deload/recovery
- `test`: Testing/assessment
- `technique`: Technical refinement

## Example Complete Plan

```json
{
  "formatVersion": "2.0.0",
  "plan": {
    "id": "oneplus-12-pro-tracker-v1",
    "name": "21-Week Calisthenics Strength Program",
    "description": "Progressive bodyweight strength program focusing on pull-ups, dips, and fundamental calisthenics movements",
    "author": "OnePlus 12 Pro Tracker",
    "createdDate": "2024-01-01",
    "lastModified": "2024-01-15",
    "version": "1.0.0",
    "durationWeeks": 21,
    "goals": [
      "weighted-pull-ups",
      "advanced-calisthenics",
      "muscle-endurance",
      "functional-strength"
    ],
    "targetLevel": "intermediate",
    "equipment": [
      "pull-up-bar",
      "rings",
      "parallettes",
      "dip-bars",
      "resistance-bands",
      "rower",
      "dumbbells",
      "barbell"
    ],
    "phases": [
      {
        "phaseNumber": 1,
        "name": "Foundation Phase",
        "description": "Build base strength and establish movement patterns",
        "startWeek": 1,
        "endWeek": 4,
        "focus": "volume",
        "weeks": [
          {
            "weekNumber": 1,
            "description": "Introduction week - establish baseline",
            "focus": "technique",
            "volumeLevel": "moderate",
            "intensityLevel": "low",
            "days": [
              {
                "dayNumber": 1,
                "name": "Pull Day A",
                "type": "strength",
                "estimatedDuration": 60,
                "description": "Upper body pulling and skill work",
                "exercises": [
                  {
                    "order": 1,
                    "exerciseName": "Rower (Zone 1)",
                    "exerciseId": "rower_zone_1",
                    "category": "warmup",
                    "sets": 1,
                    "repsType": "time",
                    "repsValue": 120,
                    "repsUnit": "seconds",
                    "restSeconds": 60,
                    "rpe": 3,
                    "notes": "Easy pace, heart rate zone 1",
                    "cues": ["Keep it easy", "Focus on form"]
                  },
                  {
                    "order": 2,
                    "exerciseName": "Band Pull-Aparts",
                    "category": "warmup",
                    "sets": 1,
                    "repsType": "reps",
                    "repsValue": 20,
                    "loadMin": 1,
                    "loadMax": 1,
                    "loadUnit": "band",
                    "notes": "Warm-up"
                  },
                  {
                    "order": 3,
                    "exerciseName": "Pull-Ups",
                    "category": "main",
                    "sets": 4,
                    "repsType": "reps",
                    "repsMin": 6,
                    "repsMax": 8,
                    "loadMin": 0,
                    "loadMax": 0,
                    "loadUnit": "bodyweight",
                    "tempoEccentric": 2,
                    "tempoPauseBottom": 0,
                    "tempoConcentric": 1,
                    "tempoPauseTop": 0,
                    "restSeconds": 120,
                    "rpe": 7,
                    "notes": "Focus on full ROM"
                  },
                  {
                    "order": 4,
                    "exerciseName": "Weighted Pull-Ups",
                    "category": "main",
                    "sets": 3,
                    "repsType": "reps",
                    "repsValue": 5,
                    "loadMin": 5,
                    "loadMax": 10,
                    "loadUnit": "kg",
                    "restSeconds": 180,
                    "rpe": 8,
                    "notes": "Strength focus"
                  },
                  {
                    "order": 5,
                    "exerciseName": "Bulgarian Split Squat",
                    "category": "accessory",
                    "sets": 3,
                    "repsType": "reps",
                    "repsValue": 8,
                    "repsPerSide": true,
                    "loadMin": 8,
                    "loadMax": 16,
                    "loadUnit": "kg",
                    "loadPerHand": true,
                    "notes": "Dumbbells per hand"
                  },
                  {
                    "order": 6,
                    "exerciseName": "Passive Dead Hang",
                    "category": "cooldown",
                    "sets": 1,
                    "repsType": "time",
                    "repsValue": 60,
                    "repsUnit": "seconds",
                    "notes": "Cool-down stretch"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## Validation Rules

### Schema Validation

Use the JSON Schema file to validate workout plans:

```bash
# Using ajv-cli
npx ajv validate -s workout-plan-v2.schema.json -d workout-plan-v2.1.json

# Using Node.js
node -e "
const Ajv = require('ajv');
const schema = require('./workout-plan-v2.schema.json');
const data = require('./workout-plan-v2.1.json');
const ajv = new Ajv();
const validate = ajv.compile(schema);
const valid = validate(data);
console.log(valid ? '✓ Valid' : '✗ Invalid:', validate.errors);
"
```

### Semantic Rules

1. **Week Numbers**: Must be sequential, starting at 1, with no gaps
2. **Day Numbers**: Must be between 1-7, typically using 1,2,3,5 (4 is rest)
3. **Exercise Order**: Must be sequential, starting at 1, with no gaps within a day
4. **Phase Coverage**: Phases must cover all weeks with no gaps or overlaps
5. **Format Version**: Must be "2.0.0"
6. **Dates**: Must be valid ISO 8601 format

## Benefits of Format

1. **Better Organization**: Clear hierarchical structure
2. **Rich Metadata**: Comprehensive information at all levels
3. **Extensibility**: Easy to add new fields without breaking existing data
4. **Readability**: Full field names make format self-documenting
5. **Tooling Support**: Structured format enables better validation and tooling
6. **Analytics**: Phase/focus data enables better progress tracking
7. **Flexibility**: Supports varying workout styles and progressions
8. **Type Safety**: Clear data types enable better validation
9. **No Parsing Required**: Structured load, reps, and tempo fields eliminate string parsing

## Implementation Notes

1. **Validation**: Implement schema validation on load
2. **Performance**: Consider lazy loading for large plans
3. **Storage**: Ensure localStorage has capacity for the format
4. **Testing**: Comprehensive test coverage for data loading

## Future Extensions

Potential future additions (v3.0.0+):
- Exercise prescriptions with auto-regulation
- Recovery metrics integration
- Progressive overload automation
- Exercise swap suggestions
- Video/image attachments
- Custom exercise creation
- Template system
- Program branching based on performance
