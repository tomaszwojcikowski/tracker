#!/usr/bin/env node
/**
 * Migration script to convert workout-plan-v2.1.json to workout-plan-v2.2.json
 * 
 * This script:
 * 1. Identifies common exercises that appear multiple times with the same base properties
 * 2. Creates exercise templates for these common exercises
 * 3. Replaces full exercise definitions with $ref references
 * 4. Allows overriding specific fields that differ between instances
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the v2.1 workout plan
const inputPath = path.join(__dirname, 'workout-plan-v2.1.json');
const outputPath = path.join(__dirname, 'workout-plan-v2.2.json');

const plan = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// Exercise templates to create based on frequency analysis
// These are exercises that appear many times with mostly the same properties
const exerciseTemplateDefinitions = [
  // Warmup exercises (appear 40+ times each)
  {
    id: 'warmup-rower-zone1',
    exerciseName: 'Rower (Zone 1)',
    category: 'warmup',
    sets: 1,
    notes: 'Warm-up. Min 1-2: Easy pace to warm up (Zone 1).',
    repsType: 'time',
    repsValue: 120,
    repsUnit: 'seconds',
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 30
  },
  {
    id: 'warmup-rower-zone2',
    exerciseName: 'Rower (Zone 2)',
    category: 'warmup',
    sets: 1,
    notes: 'Warm-up. Min 3-4: Moderate intensity (Zone 2).',
    repsType: 'time',
    repsValue: 120,
    repsUnit: 'seconds',
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 30
  },
  {
    id: 'warmup-rower-sprints',
    exerciseName: 'Rower Sprints',
    category: 'warmup',
    sets: 3,
    notes: 'Warm-up. Min 5: 3 x 10s Sprints to wake up CNS.',
    repsType: 'time',
    repsValue: 10,
    repsUnit: 'seconds',
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 30
  },
  {
    id: 'warmup-band-pull-aparts',
    exerciseName: 'Band Pull-Aparts',
    category: 'warmup',
    sets: 1,
    notes: 'Warm-up. Global Tendon Prep.',
    loadMin: 1,
    loadMax: 1,
    loadUnit: 'band',
    repsType: 'reps',
    repsValue: 20,
    restSeconds: 30
  },
  {
    id: 'warmup-band-external-rotations',
    exerciseName: 'Band External Rotations',
    category: 'warmup',
    sets: 1,
    notes: 'Warm-up. Global Tendon Prep. Pin elbow to ribcage using a towel roll.',
    loadMin: 1,
    loadMax: 1,
    loadUnit: 'band',
    repsType: 'reps',
    repsValue: 15,
    repsPerSide: true,
    restSeconds: 30,
    cues: ['Elbow pinned', 'Rotate away from belly']
  },
  {
    id: 'warmup-scapular-pullups',
    exerciseName: 'Scapular Pull-Ups (3s ISO-HOLD)',
    category: 'warmup',
    sets: 3,
    notes: 'Warm-up. Global Tendon Prep. 3s ISO-HOLD at top. No bouncy reps.',
    repsType: 'reps',
    repsValue: 5,
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 30,
    alternatives: ['Lat Pulldowns', 'Ring Rows', 'Assisted Pull-Ups'],
    cues: ['Straight arms', 'Depress scapula', 'Hold 3s']
  },
  {
    id: 'warmup-passive-bar-hang',
    exerciseName: 'Passive Bar Hang',
    category: 'warmup',
    sets: 1,
    notes: 'Warm-up. Global Tendon Prep. Passive hang.',
    repsType: 'time',
    repsValue: 30,
    repsUnit: 'seconds',
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 30,
    cues: ['Relax shoulders', 'Decompress spine']
  },
  
  // Cooldown exercises (appear 18-19 times each)
  {
    id: 'cooldown-passive-dead-hang',
    exerciseName: 'Passive Dead Hang',
    category: 'cooldown',
    sets: 1,
    notes: 'Cool-down. Spinal decompression.',
    repsType: 'time',
    repsValue: 60,
    repsUnit: 'seconds',
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 0
  },
  {
    id: 'cooldown-butchers-block',
    exerciseName: "Butcher's Block Stretch",
    category: 'cooldown',
    sets: 1,
    notes: 'Cool-down. Targeting Lats/Triceps.',
    repsType: 'time',
    repsValue: 60,
    repsUnit: 'seconds',
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 0
  },
  {
    id: 'cooldown-cobra-stretch',
    exerciseName: 'Cobra Stretch',
    category: 'cooldown',
    sets: 1,
    notes: 'Cool-down. Releasing abs.',
    repsType: 'time',
    repsValue: 60,
    repsUnit: 'seconds',
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 0
  },
  {
    id: 'cooldown-wrist-extensor',
    exerciseName: 'Wrist Extensor Stretch',
    category: 'cooldown',
    sets: 1,
    notes: 'Cool-down. Forearm health.',
    repsType: 'time',
    repsValue: 30,
    repsUnit: 'seconds',
    repsPerSide: true,
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 0
  },
  {
    id: 'cooldown-banded-pec-stretch',
    exerciseName: 'Banded Pec Stretch',
    category: 'cooldown',
    sets: 1,
    notes: 'Cool-down. Release tension from dips.',
    repsType: 'time',
    repsValue: 60,
    repsUnit: 'seconds',
    repsPerSide: true,
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 0
  },
  {
    id: 'cooldown-lat-prayer',
    exerciseName: 'Lat Prayer',
    category: 'cooldown',
    sets: 1,
    notes: 'Cool-down. Lat release.',
    repsType: 'time',
    repsValue: 60,
    repsUnit: 'seconds',
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 0
  },
  {
    id: 'cooldown-standing-quad-stretch',
    exerciseName: 'Standing Quad Stretch',
    category: 'cooldown',
    sets: 1,
    notes: 'Cool-down. Quad release.',
    repsType: 'time',
    repsValue: 60,
    repsUnit: 'seconds',
    repsPerSide: true,
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 0
  },
  {
    id: 'cooldown-couch-stretch',
    exerciseName: 'Couch Stretch',
    category: 'cooldown',
    sets: 1,
    notes: 'Cool-down. Hip flexor release.',
    repsType: 'time',
    repsValue: 90,
    repsUnit: 'seconds',
    repsPerSide: true,
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 0
  },
  {
    id: 'cooldown-jefferson-curl',
    exerciseName: 'Light Weighted Jefferson Curl',
    category: 'cooldown',
    sets: 1,
    notes: 'Cool-down. Spinal segmentation. Tuck chin, roll down one vertebra at a time.',
    loadMin: 5,
    loadMax: 10,
    loadUnit: 'kg',
    repsType: 'time',
    repsValue: 120,
    repsUnit: 'seconds',
    restSeconds: 0,
    cues: ['Use empty bar or light DB', 'Do not use PVC', 'Passive pull']
  },
  {
    id: 'cooldown-90-90-hip-rotations',
    exerciseName: '90/90 Hip Rotations',
    category: 'cooldown',
    sets: 1,
    notes: 'Cool-down. Hip mobility.',
    repsType: 'reps',
    repsValue: 10,
    repsPerSide: true,
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    restSeconds: 0
  },
  
  // Main/Accessory exercises (appear 10+ times)
  {
    id: 'main-goblet-squats',
    exerciseName: 'Goblet Squats',
    category: 'main',
    sets: 3,
    notes: 'Pattern Maint. Reinforce healthy squat patterns. Ankle mobility focus.',
    loadMin: 16,
    loadMax: 24,
    loadUnit: 'kg',
    repsType: 'reps',
    repsValue: 10,
    restSeconds: 120,
    cues: ['Upright torso', 'Knees track toes']
  },
  {
    id: 'accessory-face-pulls',
    exerciseName: 'Face Pulls',
    category: 'accessory',
    sets: 3,
    notes: 'Accessory. Tempo 2-1-1-0. Upper back health.',
    loadMin: 2,
    loadMax: 2,
    loadUnit: 'band',
    repsType: 'reps',
    repsValue: 15,
    restSeconds: 60
  },
  
  // Core exercises
  {
    id: 'core-hollow-rocks',
    exerciseName: 'Hollow Rocks',
    category: 'core',
    sets: 3,
    notes: 'Core Work. Tempo controlled. Lower back must stay glued.',
    loadMin: 0,
    loadMax: 0,
    loadUnit: 'bodyweight',
    repsType: 'reps',
    repsMin: 12,
    repsMax: 15,
    restSeconds: 60,
    alternatives: ['V-Ups', 'Dead Bugs']
  },
  {
    id: 'core-weighted-hollow-rocks',
    exerciseName: 'Weighted Hollow Rocks',
    category: 'core',
    sets: 3,
    notes: 'Core Work. Arms straight overhead. If lower back arches, drop weight immediately.',
    loadMin: 1.25,
    loadMax: 2.5,
    loadUnit: 'kg',
    repsType: 'reps',
    repsMin: 12,
    repsMax: 15,
    restSeconds: 60,
    progressionNotes: 'Start 1.25/2.5kg. Move to 5kg only when holding shape perfectly for 45s.'
  }
];

// Build a map for quick template lookup by exercise name
const templateByName = new Map();
for (const template of exerciseTemplateDefinitions) {
  templateByName.set(template.exerciseName, template);
}

/**
 * Compare exercise with template to find which fields differ
 */
function getOverrides(exercise, template) {
  const overrides = {};
  const fieldsToCompare = [
    'exerciseName', 'category', 'sets', 'restSeconds', 'rpe', 'notes',
    'loadMin', 'loadMax', 'loadUnit', 'loadPerHand',
    'repsType', 'repsValue', 'repsMin', 'repsMax', 'repsUnit', 'repsPerSide', 'repsModifier',
    'tempoEccentric', 'tempoPauseBottom', 'tempoConcentric', 'tempoPauseTop',
    'isEmom', 'isUnilateral', 'supersetGroup', 'progressionNotes'
  ];
  
  for (const field of fieldsToCompare) {
    const exerciseValue = exercise[field];
    const templateValue = template[field];
    
    // Skip if both undefined/null
    if (exerciseValue == null && templateValue == null) continue;
    
    // Compare values - JSON stringify for arrays/objects
    const exStr = JSON.stringify(exerciseValue);
    const tmplStr = JSON.stringify(templateValue);
    
    if (exStr !== tmplStr) {
      overrides[field] = exerciseValue;
    }
  }
  
  // Handle arrays separately (alternatives, cues)
  if (exercise.alternatives) {
    const exAlt = JSON.stringify(exercise.alternatives || []);
    const tmplAlt = JSON.stringify(template.alternatives || []);
    if (exAlt !== tmplAlt) {
      overrides.alternatives = exercise.alternatives;
    }
  }
  if (exercise.cues) {
    const exCues = JSON.stringify(exercise.cues || []);
    const tmplCues = JSON.stringify(template.cues || []);
    if (exCues !== tmplCues) {
      overrides.cues = exercise.cues;
    }
  }
  
  return overrides;
}

/**
 * Convert an exercise to use template reference if applicable
 */
function convertExercise(exercise) {
  const template = templateByName.get(exercise.exerciseName);
  
  if (!template) {
    // No template for this exercise, keep as-is
    return exercise;
  }
  
  const overrides = getOverrides(exercise, template);
  
  // If too many overrides, keep as full exercise
  // (more than 5 overrides means the template doesn't save much)
  if (Object.keys(overrides).length > 5) {
    return exercise;
  }
  
  // Create reference with overrides
  const ref = { $ref: template.id };
  
  // Add overrides
  for (const [key, value] of Object.entries(overrides)) {
    ref[key] = value;
  }
  
  return ref;
}

/**
 * Process exercises array, converting to references where applicable
 */
function processExercises(exercises) {
  if (!exercises) return exercises;
  return exercises.map(convertExercise);
}

/**
 * Process a day template
 */
function processDayTemplate(dayTemplate) {
  return {
    ...dayTemplate,
    exercises: processExercises(dayTemplate.exercises)
  };
}

/**
 * Process a day
 */
function processDay(day) {
  if (day.$ref) {
    // Day uses a reference, keep as-is
    return day;
  }
  
  return {
    ...day,
    exercises: processExercises(day.exercises)
  };
}

// Create the v2.2 plan
const v22Plan = {
  $schema: './workout-plan-v2.2.schema.json',
  formatVersion: '2.2.0',
  plan: {
    ...plan.plan,
    // Add exercise templates
    exerciseTemplates: exerciseTemplateDefinitions,
    // Process day templates
    dayTemplates: plan.plan.dayTemplates?.map(processDayTemplate),
    // Process phases
    phases: plan.plan.phases.map(phase => ({
      ...phase,
      weeks: phase.weeks.map(week => ({
        ...week,
        days: week.days.map(processDay)
      }))
    }))
  }
};

// Update lastModified
v22Plan.plan.lastModified = new Date().toISOString();

// Write output
fs.writeFileSync(outputPath, JSON.stringify(v22Plan, null, 2));

// Calculate statistics
let totalExercises = 0;
let templatedExercises = 0;

function countExercises(exercises) {
  if (!exercises) return;
  for (const ex of exercises) {
    totalExercises++;
    if (ex.$ref) templatedExercises++;
  }
}

for (const phase of v22Plan.plan.phases) {
  for (const week of phase.weeks) {
    for (const day of week.days) {
      if (day.exercises) {
        countExercises(day.exercises);
      }
    }
  }
}

if (v22Plan.plan.dayTemplates) {
  for (const template of v22Plan.plan.dayTemplates) {
    countExercises(template.exercises);
  }
}

console.log('Migration complete!');
console.log(`Output: ${outputPath}`);
console.log(`Exercise templates created: ${exerciseTemplateDefinitions.length}`);
console.log(`Total exercises processed: ${totalExercises}`);
console.log(`Exercises using templates: ${templatedExercises}`);
console.log(`Reduction: ${((templatedExercises / totalExercises) * 100).toFixed(1)}%`);

// Also show file size reduction
const originalSize = fs.statSync(inputPath).size;
const newSize = fs.statSync(outputPath).size;
console.log(`File size: ${(originalSize / 1024).toFixed(1)}KB -> ${(newSize / 1024).toFixed(1)}KB (${((1 - newSize / originalSize) * 100).toFixed(1)}% reduction)`);
