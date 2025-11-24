# Workout Plan Usage Guide

This guide explains how to use and work with workout plans in the Tracker application.

## Overview

The Tracker application supports two workout plan formats:

- **v1.0.0**: Legacy flat array format (backward compatible)
- **v2.0.0**: Modern structured format with rich metadata

The application automatically detects which format you're using and handles the conversion seamlessly.

## Using Existing Plans

### With v1.0.0 Format (Current Default)

The app currently uses `full-schedule.json` by default. This file is loaded automatically when the app starts.

**No changes needed** - the app works out of the box with the existing format.

### Switching to v2.0.0 Format

To use the new v2.0.0 format with enhanced features:

1. **Generate v2 format from existing data:**
   ```bash
   node migrate-workout-plan.js
   ```
   This creates `workout-plan-v2.json`

2. **Update the app to use v2 format:**
   - Open `src/main.jsx`
   - Change the fetch URL from `full-schedule.json` to `workout-plan-v2.json`:
   ```javascript
   fetchWithTimeout(`${import.meta.env.BASE_URL}workout-plan-v2.json`, FETCH_TIMEOUT_MS)
   ```

3. **Rebuild and test:**
   ```bash
   npm run build
   npm run preview
   ```

## Creating a New Workout Plan

### Option 1: Start with v1.0.0 Format (Simple)

Create a JSON file with this structure:

```json
[
  {
    "w": 1,
    "d": 1,
    "ex": "Pull-Ups",
    "s": 3,
    "r": "8",
    "n": "Main"
  },
  {
    "w": 1,
    "d": 1,
    "ex": "Dips",
    "s": 3,
    "r": "10",
    "n": "Accessory"
  }
]
```

**Fields:**
- `w`: Week number (1-21)
- `d`: Day number (1, 2, 3, or 5)
- `ex`: Exercise name
- `s`: Number of sets
- `r`: Reps (string, can be time or range)
- `n`: Notes/category

### Option 2: Create v2.0.0 Format (Recommended)

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
  "variations": []
}
```

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
