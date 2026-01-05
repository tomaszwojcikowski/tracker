#!/usr/bin/env node

/**
 * Workout Data Validation Script
 *
 * Validates workout plan JSON files to ensure they can be loaded without errors.
 * Used by the pre-commit git hook to prevent broken workout data from being committed.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Files to validate (defaults). Can be overridden by passing file paths as args.
const DEFAULT_WORKOUT_FILES = [
  'data/workout-plan-v2.5.json',
];

// Dynamically import the workout plan utils
async function validateWorkoutData() {
  console.log('🔍 Validating workout data...\n');

  const args = process.argv.slice(2).filter(Boolean);
  const workoutFiles = args.length > 0 ? args : DEFAULT_WORKOUT_FILES;

  let hasErrors = false;

  for (const file of workoutFiles) {
    const filePath = join(rootDir, file);

    if (file.endsWith('.schema.json')) {
      console.log(`⏭️  Skipping ${file} (schema file)`);
      continue;
    }

    if (!existsSync(filePath)) {
      console.log(`⏭️  Skipping ${file} (file not found)`);
      continue;
    }

    console.log(`📄 Checking ${file}...`);

    try {
      // Parse JSON
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Validate structure
      if (!data.plan) {
        throw new Error('Missing "plan" property');
      }

      if (!data.plan.exerciseTemplates || !Array.isArray(data.plan.exerciseTemplates)) {
        throw new Error('Missing or invalid "exerciseTemplates" array');
      }

      if (!data.plan.phases || !Array.isArray(data.plan.phases)) {
        throw new Error('Missing or invalid "phases" array');
      }

      // Build exercise templates map
      const exerciseTemplates = new Map();
      for (const template of data.plan.exerciseTemplates) {
        if (!template.id) {
          throw new Error(`Exercise template missing "id": ${JSON.stringify(template).slice(0, 100)}`);
        }
        exerciseTemplates.set(template.id, template);
      }

      // Build routines map (routineTemplates in the schema)
      const routines = new Map();
      if (data.plan.routineTemplates) {
        for (const routine of data.plan.routineTemplates) {
          if (!routine.id) {
            throw new Error(`Routine missing "id": ${JSON.stringify(routine).slice(0, 100)}`);
          }
          routines.set(routine.id, routine);
        }
      }

      // Build day templates map
      const dayTemplates = new Map();
      if (data.plan.dayTemplates) {
        for (const dayTemplate of data.plan.dayTemplates) {
          if (!dayTemplate.id) {
            throw new Error(`Day template missing "id": ${JSON.stringify(dayTemplate).slice(0, 100)}`);
          }
          dayTemplates.set(dayTemplate.id, dayTemplate);
        }
      }

      // Validate all references
      let totalExercises = 0;
      let totalDays = 0;

      for (const phase of data.plan.phases) {
        if (!phase.weeks || !Array.isArray(phase.weeks)) {
          throw new Error(`Phase ${phase.phaseNumber} missing "weeks" array`);
        }

        for (const week of phase.weeks) {
          if (!week.days || !Array.isArray(week.days)) {
            throw new Error(`Week ${week.weekNumber} missing "days" array`);
          }

          for (const day of week.days) {
            totalDays++;

            // Handle day references
            if (day.$ref && !dayTemplates.has(day.$ref)) {
              throw new Error(`Day template "${day.$ref}" not found (Week ${week.weekNumber})`);
            }

            const exercises = day.exercises || [];

            for (const exercise of exercises) {
              totalExercises++;

              // Check exercise template references
              if (exercise.$ref && !exerciseTemplates.has(exercise.$ref)) {
                throw new Error(`Exercise template "${exercise.$ref}" not found (Week ${week.weekNumber}, Day ${day.dayNumber})`);
              }

              // Check routine references
              if (exercise.$routine && !routines.has(exercise.$routine)) {
                throw new Error(`Routine "${exercise.$routine}" not found (Week ${week.weekNumber}, Day ${day.dayNumber})`);
              }
            }
          }
        }
      }

      console.log(`   ✅ Valid: ${exerciseTemplates.size} templates, ${routines.size} routines, ${totalDays} days, ${totalExercises} exercise references`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      hasErrors = true;
    }
  }

  console.log('');

  if (hasErrors) {
    console.error('❌ Workout data validation failed!\n');
    process.exit(1);
  } else {
    console.log('✅ All workout data is valid!\n');
    process.exit(0);
  }
}

validateWorkoutData();
