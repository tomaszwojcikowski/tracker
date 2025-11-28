# Workout Plan Usage Guide

This guide explains how to use and work with workout plans in the Tracker application.

## Overview

The Tracker application uses a modern, structured workout plan format (v2.0.0) with rich metadata.

- **v2.0.0**: Hierarchical format (Plan → Phases → Weeks → Days → Exercises)
- **v1.0.0**: Legacy flat array format (deprecated)

The application is fully migrated to use the v2.0.0 format by default.

## Using Existing Plans

The app uses `workout-plan-v2.json` by default. This file is loaded automatically when the app starts.

**No changes needed** - the app works out of the box with the v2 format.

### Legacy Format (v1.0.0)

The legacy `full-schedule.json` format is no longer the primary data source. If you have data in this format, you should migrate it to v2.0.0 using the provided migration script.

## Creating a New Workout Plan

### Recommended: v2.0.0 Format

Use the full structured format with metadata:

```json
{
  "formatVersion": "2.0.0",
  "plan": {
    "id": "my-custom-plan",
    "name": "My Custom Training Plan",
    "description": "A personalized workout program",
    "author": "Your Name",
    "createdDate": "2024-01-01",
    "lastModified": "2024-01-15",
    "version": "1.0.0",
    "durationWeeks": 12,
    "goals": ["strength", "hypertrophy"],
    "targetLevel": "intermediate",
    "equipment": ["bar", "dumbbells", "bench"],
    "phases": [
      {
        "phaseNumber": 1,
        "name": "Foundation",
        "description": "Build base strength",
        "startWeek": 1,
        "endWeek": 4,
        "focus": "volume",
        "weeks": [
          {
            "weekNumber": 1,
            "description": "Introduction week",
            "focus": "technique",
            "volumeLevel": "moderate",
            "intensityLevel": "low",
            "days": [
              {
                "dayNumber": 1,
                "name": "Upper Body",
                "type": "strength",
                "estimatedDuration": 60,
                "description": "Push and pull exercises",
                "exercises": [
                  {
                    "order": 1,
                    "exerciseName": "Pull-Ups",
                    "exerciseId": "pull_ups",
                    "category": "main",
                    "sets": 3,
                    "reps": "8",
                    "tempo": "2-0-1-0",
                    "restSeconds": 120,
                    "rpe": 8,
                    "load": "bodyweight",
                    "notes": "Focus on full ROM",
                    "alternatives": ["Lat Pulldowns"],
                    "progressionNotes": "Add weight when hitting 3x10",
                    "videoUrl": null,
                    "cues": ["Chest to bar", "Full extension"]
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

See [WORKOUT_PLAN_FORMAT.md](WORKOUT_PLAN_FORMAT.md) for complete field documentation.

## Migrating Between Formats

### v1.0.0 → v2.0.0

Use the migration script:

```bash
node migrate-workout-plan.js
```

**What it does:**
- Converts flat array to structured format
- Infers categories from notes
- Extracts load, tempo, and RPE information
- Groups exercises into phases
- Generates comprehensive metadata
- Creates detailed migration report

**Output:**
- `workout-plan-v2.json` - New format file
- `migration-report.json` - Migration statistics and warnings

**Review the migration:**
```bash
# Check the report
cat migration-report.json | jq '.stats'

# Review first few exercises
cat workout-plan-v2.json | jq '.plan.phases[0].weeks[0].days[0].exercises[0]'
```

### v2.0.0 → v1.0.0

The app utilities can convert v2 back to v1 format internally, but there's no script for this since v2 contains more information that would be lost.

## Testing Your Plan

### 1. Validate Format

```bash
# Test v1 format
node -e "
const data = require('./full-schedule.json');
console.log('✓ Valid JSON');
console.log(\`✓ \${data.length} entries\`);
console.log(\`✓ First: \${data[0].ex}\`);
"

# Test v2 format
node -e "
const data = require('./workout-plan-v2.json');
console.log('✓ Valid JSON');
console.log(\`✓ Format: \${data.formatVersion}\`);
console.log(\`✓ Plan: \${data.plan.name}\`);
console.log(\`✓ Weeks: \${data.plan.durationWeeks}\`);
"
```

### 2. Run Unit Tests

```bash
npm test
```

All tests should pass, including workout plan format tests.

### 3. Test in App

```bash
# Start dev server
npm run dev

# Open in browser
# Navigate to http://localhost:5173/tracker/

# Check console for:
# "Loaded workout plan: [Plan Name] (format v1.0.0 or v2.0.0)"
```

### 4. Build Test

```bash
npm run build
npm run preview
```

Visit the preview URL and verify:
- ✓ App loads without errors
- ✓ Week selector shows correct range
- ✓ Exercises display correctly
- ✓ Workout tracking works

## Customization

### Adding Exercises

Add exercises to `exercises.json`:

```json
{
  "id": "my_exercise",
  "name": "My Exercise",
  "primaryMuscles": ["chest"],
  "secondaryMuscles": ["triceps"],
  "equipment": ["dumbbells"],
  "category": "push",
  "isBodyweight": false,
  "suggestedLoad": "10-15kg per hand",
  "variations": []
}
```

**Fields:**
- `id`: Unique identifier for the exercise
- `name`: Display name
- `primaryMuscles`: Main muscles targeted
- `secondaryMuscles`: Supporting muscles
- `equipment`: Required equipment
- `category`: Exercise type (push, pull, legs, core, etc.)
- `isBodyweight`: true for bodyweight exercises, false for weighted
- `suggestedLoad`: (Optional) Suggested starting load for weighted exercises
- `variations`: Alternative exercise names

### Modifying Plan Structure

**v1.0.0:**
- Directly edit the array
- Add/remove entries
- Keep fields consistent

**v2.0.0:**
- Edit phases, weeks, days hierarchically
- Add metadata at any level
- Use full field names
- Include progression notes

## Best Practices

1. **Version Control**: Keep both v1 and v2 files in git
2. **Backup**: Save originals before migration
3. **Validate**: Run tests after changes
4. **Document**: Add notes and descriptions in v2 format
5. **Iterate**: Test small changes before deploying
6. **Review**: Check migration reports for warnings

## Common Issues

### "Invalid workout plan format"

**Cause**: JSON syntax error or missing required fields

**Fix:**
```bash
# Validate JSON syntax
cat your-file.json | jq '.'

# Check required fields
node -e "
const data = require('./your-file.json');
const required = ['w', 'd', 'ex', 's', 'r', 'n'];
const first = data[0] || data;
const missing = required.filter(k => !(k in first));
console.log(missing.length ? \`Missing: \${missing}\` : '✓ All required fields present');
"
```

### "Failed to load data"

**Cause**: File not found or network timeout

**Fix:**
- Verify file exists in `public/` directory
- Check file name matches import
- Ensure build includes the file
- Check browser network tab

### Migration warnings

**"Exercise IDs need manual mapping"**

The migration script doesn't automatically link exercises to the library. To fix:

1. Open `workout-plan-v2.json`
2. Find exercises with `"exerciseId": null`
3. Match with IDs from `exercises.json`
4. Update manually or write a script

**"Rest periods not specified"**

v1.0.0 format doesn't include rest periods. Add them manually in v2.0.0 format based on exercise type:

- Main lifts: 120-180 seconds
- Accessories: 60-90 seconds
- Mobility: 30-60 seconds

## Advanced Usage

### Programmatic Access

```javascript
import { loadWorkoutPlan, getPhaseForWeek } from './src/workout-plan-utils.js';

// Load any format
const { schedule, metadata } = loadWorkoutPlan(data);

// Get phase info
const phase = getPhaseForWeek(metadata, 5);
console.log(`Week 5 is in: ${phase.name}`);

// Access metadata
console.log(`Plan duration: ${metadata.durationWeeks} weeks`);
console.log(`Goals: ${metadata.goals.join(', ')}`);
```

### Custom Validation

```javascript
function validateWorkoutPlan(data) {
  const { schedule, metadata } = loadWorkoutPlan(data);

  // Check week coverage
  const weeks = new Set(schedule.map(e => e.w));
  const expectedWeeks = metadata.durationWeeks;
  if (weeks.size !== expectedWeeks) {
    console.warn(`Expected ${expectedWeeks} weeks, found ${weeks.size}`);
  }

  // Check day distribution
  const days = schedule.reduce((acc, e) => {
    acc[e.d] = (acc[e.d] || 0) + 1;
    return acc;
  }, {});
  console.log('Exercises per day:', days);

  return true;
}
```

## Resources

- [WORKOUT_PLAN_FORMAT.md](WORKOUT_PLAN_FORMAT.md) - Complete format specification
- [README.md](README.md) - Application documentation
- [TESTING.md](TESTING.md) - Testing guide
- Migration script: `migrate-workout-plan.js`
- Format utilities: `src/workout-plan-utils.js`
- Test suite: `src/test/workoutPlanUtils.test.jsx`

## Support

For issues or questions:
1. Check existing tests for examples
2. Review migration reports for warnings
3. Validate JSON format
4. Test in development mode first
5. Check browser console for errors


# Appendix: Quick Reference

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

The app is configured to use the v2.0.0 format by default.

```javascript
// v2.0.0 - Object with formatVersion (Standard)
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
├── workout-plan-v2.json            # v2.0.0 format (current)
├── full-schedule.json              # v1.0.0 format (legacy)
├── migration-report.json           # Migration details
├── migrate-workout-plan.js         # Migration script
├── WORKOUT_PLAN_FORMAT.md          # Full specification
├── WORKOUT_PLAN_USAGE.md           # Detailed usage guide
├── src/
│   ├── main.jsx                    # App entry (format loading)
│   ├── workout-plan-utils.ts       # Format utilities
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
