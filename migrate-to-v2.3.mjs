#!/usr/bin/env node

/**
 * Migration script to convert workout-plan-v2.2.json to v2.3 format
 * with routine templates for warmups and cooldowns.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read v2.2 plan
const v22Plan = JSON.parse(fs.readFileSync(path.join(__dirname, 'workout-plan-v2.2.json'), 'utf8'));

// Define the routine templates
const routineTemplates = [
  {
    id: "warmup-pull-day",
    name: "Pull Day Warmup",
    description: "Full warmup protocol for pulling sessions. Includes rower progression, band work, and bar preparation.",
    category: "warmup",
    estimatedDuration: 8,
    targetAreas: ["shoulders", "upper-back", "lats", "rotator-cuff", "grip"],
    exercises: [
      { "$ref": "warmup-rower-zone1" },
      { "$ref": "warmup-rower-zone2" },
      { "$ref": "warmup-rower-sprints" },
      { "$ref": "warmup-band-pull-aparts" },
      { "$ref": "warmup-band-external-rotations" },
      { "$ref": "warmup-scapular-pullups" },
      { "$ref": "warmup-passive-bar-hang" }
    ]
  },
  {
    id: "cooldown-pull-day",
    name: "Pull Day Cooldown",
    description: "Cooldown for pull-focused sessions. Targets lats, triceps, and spine decompression.",
    category: "cooldown",
    estimatedDuration: 5,
    targetAreas: ["lats", "triceps", "spine", "forearms"],
    exercises: [
      { "$ref": "cooldown-passive-dead-hang" },
      { "$ref": "cooldown-butchers-block" },
      { "$ref": "cooldown-cobra-stretch" },
      { "$ref": "cooldown-wrist-extensor" }
    ]
  },
  {
    id: "cooldown-push-day",
    name: "Push Day Cooldown",
    description: "Cooldown for push-focused sessions. Targets pecs, shoulders, and lats.",
    category: "cooldown",
    estimatedDuration: 4,
    targetAreas: ["pectorals", "shoulders", "lats"],
    exercises: [
      { "$ref": "cooldown-banded-pec-stretch" },
      { "$ref": "cooldown-lat-prayer" }
    ]
  },
  {
    id: "cooldown-lower-body",
    name: "Lower Body Cooldown",
    description: "Cooldown for lower body sessions. Targets hip flexors, quads, and hamstrings.",
    category: "cooldown",
    estimatedDuration: 6,
    targetAreas: ["hip-flexors", "quads", "hamstrings", "spine"],
    exercises: [
      { "$ref": "cooldown-couch-stretch" },
      { "$ref": "cooldown-jefferson-curl" },
      { "$ref": "cooldown-90-90-hip-rotations" }
    ]
  }
];

// The standard warmup sequence to look for
const warmupSequence = [
  "warmup-rower-zone1",
  "warmup-rower-zone2",
  "warmup-rower-sprints",
  "warmup-band-pull-aparts",
  "warmup-band-external-rotations",
  "warmup-scapular-pullups",
  "warmup-passive-bar-hang"
];

// The pull day cooldown sequence
const pullCooldownSequence = [
  "cooldown-passive-dead-hang",
  "cooldown-butchers-block",
  "cooldown-cobra-stretch",
  "cooldown-wrist-extensor"
];

// The push day cooldown sequence
const pushCooldownSequence = [
  "cooldown-banded-pec-stretch",
  "cooldown-lat-prayer"
];

// The lower body cooldown sequence
const lowerCooldownSequence = [
  "cooldown-couch-stretch",
  "cooldown-jefferson-curl",
  "cooldown-90-90-hip-rotations"
];

/**
 * Check if exercises starting at index match a sequence
 */
function matchesSequence(exercises, startIndex, sequence) {
  if (startIndex + sequence.length > exercises.length) return false;
  
  for (let i = 0; i < sequence.length; i++) {
    const ex = exercises[startIndex + i];
    if (!ex.$ref || ex.$ref !== sequence[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Replace sequences with routine references in a day's exercises
 */
function replaceSequencesWithRoutines(exercises) {
  if (!exercises || exercises.length === 0) return exercises;
  
  const result = [];
  let i = 0;
  
  while (i < exercises.length) {
    // Check for warmup sequence
    if (matchesSequence(exercises, i, warmupSequence)) {
      result.push({ "$routine": "warmup-pull-day" });
      i += warmupSequence.length;
      continue;
    }
    
    // Check for pull day cooldown sequence
    if (matchesSequence(exercises, i, pullCooldownSequence)) {
      result.push({ "$routine": "cooldown-pull-day" });
      i += pullCooldownSequence.length;
      continue;
    }
    
    // Check for push day cooldown sequence
    if (matchesSequence(exercises, i, pushCooldownSequence)) {
      result.push({ "$routine": "cooldown-push-day" });
      i += pushCooldownSequence.length;
      continue;
    }
    
    // Check for lower body cooldown sequence
    if (matchesSequence(exercises, i, lowerCooldownSequence)) {
      result.push({ "$routine": "cooldown-lower-body" });
      i += lowerCooldownSequence.length;
      continue;
    }
    
    // Keep the exercise as-is
    result.push(exercises[i]);
    i++;
  }
  
  return result;
}

/**
 * Process all phases, weeks, and days
 */
function processPlan(plan) {
  let warmupReplacements = 0;
  let cooldownReplacements = 0;
  
  for (const phase of plan.phases) {
    for (const week of phase.weeks) {
      for (const day of week.days) {
        if (day.exercises && day.exercises.length > 0) {
          const originalLength = day.exercises.length;
          day.exercises = replaceSequencesWithRoutines(day.exercises);
          const newLength = day.exercises.length;
          
          // Count replacements
          const savedExercises = originalLength - newLength;
          if (savedExercises > 0) {
            // Rough estimate based on known sequence lengths
            if (day.exercises.some(e => e.$routine === 'warmup-pull-day')) {
              warmupReplacements++;
            }
            if (day.exercises.some(e => e.$routine?.startsWith('cooldown-'))) {
              cooldownReplacements++;
            }
          }
        }
      }
    }
  }
  
  // Also process day templates
  if (plan.dayTemplates) {
    for (const template of plan.dayTemplates) {
      if (template.exercises && template.exercises.length > 0) {
        template.exercises = replaceSequencesWithRoutines(template.exercises);
      }
    }
  }
  
  return { warmupReplacements, cooldownReplacements };
}

// Create the v2.3 plan
const v23Plan = {
  "$schema": "./workout-plan-v2.3.schema.json",
  "formatVersion": "2.3.0",
  "plan": {
    ...v22Plan.plan,
    "lastModified": new Date().toISOString(),
    "routineTemplates": routineTemplates
  }
};

// Process the plan to replace sequences
const stats = processPlan(v23Plan.plan);

// Write the output
const outputPath = path.join(__dirname, 'workout-plan-v2.3.json');
fs.writeFileSync(outputPath, JSON.stringify(v23Plan, null, 2));

console.log('Migration complete!');
console.log(`- Output: ${outputPath}`);
console.log(`- Warmup routine replacements: ${stats.warmupReplacements}`);
console.log(`- Cooldown routine replacements: ${stats.cooldownReplacements}`);
console.log(`- Created ${routineTemplates.length} routine templates`);

// Calculate file size reduction
const originalSize = fs.statSync(path.join(__dirname, 'workout-plan-v2.2.json')).size;
const newSize = fs.statSync(outputPath).size;
const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
console.log(`- File size: ${(originalSize / 1024).toFixed(1)}KB -> ${(newSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);
