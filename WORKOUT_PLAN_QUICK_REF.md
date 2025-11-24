# Workout Plan Format - Quick Reference

## Format Comparison

| Feature | v1.0.0 | v2.0.0 |
|---------|--------|--------|
| **Structure** | Flat array | Hierarchical (phases → weeks → days → exercises) |
| **Field Names** | Abbreviated (`w`, `d`, `ex`, `s`, `r`, `n`) | Full names (`weekNumber`, `dayNumber`, `exerciseName`) |
| **Metadata** | None | Comprehensive (plan info, goals, phases) |
| **Exercise Details** | Basic | Extended (tempo, rest, RPE, load, cues) |
| **File Size** | ~73KB | ~481KB |
| **Readability** | Low | High |
| **Extensibility** | Limited | Excellent |

## Quick Commands

```bash
# Migrate v1 to v2
node migrate-workout-plan.js

# Test format
npm test

# Build app
npm run build

# Start dev server
npm run dev

# Preview production build
npm run preview
```

## Format Detection

The app automatically detects format:

```javascript
// v1.0.0 - Array
[
  { w: 1, d: 1, ex: "Pull-Ups", s: 3, r: "8", n: "Main" }
]

// v2.0.0 - Object with formatVersion
{
  "formatVersion": "2.0.0",
  "plan": { ... }
}
```

## Minimum Valid Examples

### v1.0.0

```json
[
  {
    "w": 1,
    "d": 1,
    "ex": "Exercise Name",
    "s": 3,
    "r": "8",
    "n": "Category"
  }
]
```

### v2.0.0

```json
{
  "formatVersion": "2.0.0",
  "plan": {
    "id": "plan-id",
    "name": "Plan Name",
    "durationWeeks": 1,
    "phases": [
      {
        "phaseNumber": 1,
        "name": "Phase 1",
        "startWeek": 1,
        "endWeek": 1,
        "focus": "volume",
        "weeks": [
          {
            "weekNumber": 1,
            "volumeLevel": "moderate",
            "intensityLevel": "low",
            "days": [
              {
                "dayNumber": 1,
                "name": "Day 1",
                "type": "strength",
                "estimatedDuration": 60,
                "exercises": [
                  {
                    "order": 1,
                    "exerciseName": "Exercise",
                    "category": "main",
                    "sets": 3,
                    "reps": "8",
                    "tempo": null,
                    "restSeconds": 120,
                    "rpe": 8,
                    "load": "bodyweight",
                    "notes": null,
                    "alternatives": [],
                    "progressionNotes": null,
                    "videoUrl": null,
                    "cues": []
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

## Field Reference

### v1.0.0 Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `w` | number | Week number | `1` |
| `d` | number | Day number | `1` |
| `ex` | string | Exercise name | `"Pull-Ups"` |
| `s` | number | Sets | `3` |
| `r` | string | Reps/duration | `"8"` or `"2 min"` |
| `n` | string | Notes/category | `"Main"` |

### v2.0.0 Key Fields

| Field | Level | Type | Description |
|-------|-------|------|-------------|
| `formatVersion` | Root | string | Format version |
| `plan` | Root | object | Plan container |
| `id` | Plan | string | Unique plan ID |
| `name` | Plan | string | Plan name |
| `durationWeeks` | Plan | number | Total weeks |
| `phases` | Plan | array | Training phases |
| `phaseNumber` | Phase | number | Phase number |
| `startWeek` | Phase | number | First week |
| `endWeek` | Phase | number | Last week |
| `weeks` | Phase | array | Week objects |
| `weekNumber` | Week | number | Week number |
| `days` | Week | array | Day objects |
| `dayNumber` | Day | number | Day number (1-7) |
| `type` | Day | string | Session type |
| `exercises` | Day | array | Exercise objects |
| `order` | Exercise | number | Exercise order |
| `exerciseName` | Exercise | string | Exercise name |
| `sets` | Exercise | number | Number of sets |
| `reps` | Exercise | string | Rep scheme |
| `tempo` | Exercise | string | Tempo (e.g., "2-0-1-0") |
| `restSeconds` | Exercise | number | Rest time |
| `rpe` | Exercise | number | Target RPE (1-10) |
| `load` | Exercise | string | Load specification |
| `category` | Exercise | string | Exercise category |

## Categories

### Exercise Categories (v2.0.0)

- `warmup` - Warm-up exercises
- `main` - Primary working sets
- `accessory` - Accessory/supplemental
- `cooldown` - Cool-down exercises
- `mobility` - Mobility work
- `skill` - Skill practice
- `core` - Core training

### Session Types (v2.0.0)

- `strength` - Strength training
- `mobility` - Mobility session
- `cardio` - Cardio work
- `skill` - Skill practice
- `recovery` - Active recovery
- `rest` - Rest day
- `test` - Testing/assessment

## Validation Rules

✅ **Required:**
- Week numbers: 1-21 (sequential, no gaps)
- Day numbers: 1-7 (typically 1, 2, 3, 5)
- Exercise order: Sequential from 1
- Phase coverage: All weeks, no gaps/overlaps

❌ **Invalid:**
- Missing required fields
- Week/day out of range
- Duplicate exercise orders
- Phase gaps or overlaps

## API Usage

```javascript
import {
  detectFormatVersion,
  loadWorkoutPlan,
  getPhaseForWeek,
  isV2Format,
  getPlanSummary
} from './src/workout-plan-utils.js';

// Detect format
const version = detectFormatVersion(data); // "1.0.0" or "2.0.0"

// Load plan
const { schedule, metadata } = loadWorkoutPlan(data);

// Get phase info
const phase = getPhaseForWeek(metadata, 5);

// Check format
const isV2 = isV2Format(data); // true/false

// Get summary
const summary = getPlanSummary(metadata);
```

## Common Patterns

### Check Plan Duration

```javascript
const { metadata } = loadWorkoutPlan(data);
console.log(`Duration: ${metadata.durationWeeks} weeks`);
```

### Get Phase for Current Week

```javascript
const { metadata } = loadWorkoutPlan(data);
const currentWeek = 5;
const phase = getPhaseForWeek(metadata, currentWeek);
console.log(`Phase: ${phase.name} (${phase.focus})`);
```

### Filter Exercises by Category

```javascript
const { schedule } = loadWorkoutPlan(v2Data);
const mainExercises = schedule.filter(e => 
  e.n === 'Main' || e.n.includes('Load:')
);
```

## Migration Notes

### What's Preserved

✅ All exercise data (name, sets, reps)
✅ Week and day structure
✅ Notes and categories
✅ Load information (extracted)
✅ Tempo prescriptions (extracted)

### What's Inferred

🔄 Phase structure (6 phases)
🔄 Session types (strength, mobility, etc.)
🔄 Volume/intensity levels
🔄 Session names
🔄 Estimated durations

### What's Missing

❌ Exercise IDs (need manual mapping)
❌ Rest periods (not in v1.0.0)
❌ Specific RPE targets (some extracted)
❌ Video URLs
❌ Coaching cues

## File Locations

```
tracker/
├── full-schedule.json              # v1.0.0 format (current)
├── workout-plan-v2.json            # v2.0.0 format (migrated)
├── migration-report.json           # Migration details
├── migrate-workout-plan.js         # Migration script
├── WORKOUT_PLAN_FORMAT.md          # Full specification
├── WORKOUT_PLAN_USAGE.md           # Detailed usage guide
├── WORKOUT_PLAN_QUICK_REF.md       # This file
├── src/
│   ├── main.jsx                    # App entry (format loading)
│   ├── workout-plan-utils.js       # Format utilities
│   └── test/
│       └── workoutPlanUtils.test.jsx  # Format tests
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid format" | Validate JSON syntax: `cat file.json \| jq '.'` |
| "Missing fields" | Check required fields match specification |
| "Load failed" | Verify file exists in correct location |
| Migration warnings | Review `migration-report.json` |
| Exercise IDs null | Manually map to `exercises.json` IDs |
| Tests fail | Run `npm test` for detailed errors |

## Resources

📖 [WORKOUT_PLAN_FORMAT.md](WORKOUT_PLAN_FORMAT.md) - Complete specification
📚 [WORKOUT_PLAN_USAGE.md](WORKOUT_PLAN_USAGE.md) - Detailed usage guide
🧪 [Test Suite](src/test/workoutPlanUtils.test.jsx) - Code examples
🔧 [Migration Script](migrate-workout-plan.js) - Conversion tool
📊 [Migration Report](migration-report.json) - Conversion stats
