#!/usr/bin/env node
/**
 * Normalize workout-plan-v2.json to properly separate load (kg values) from notes (prescriptions).
 * 
 * Rules:
 * - load: Contains actual weight in kg (e.g., "5-10kg", "60-80kg", "bodyweight", "light band")
 * - notes: Contains training prescription (e.g., "Heavy", "Light", "Accumulation", "Deload")
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Prescription terms that should be in notes, not load
const PRESCRIPTION_TERMS = [
  'Heavy',
  'Light',
  'Light/Tech',
  'Light (Deload)',
  'Moderate',
  'Easy',
  '50% (Easy)',
  '60% (Reload)',
];

// Mapping from exercise names to their standard load values from exercises.json
const EXERCISE_LOADS = {
  // Pull exercises
  'Weighted Pull-Ups': '5-10kg',
  'Neutral Grip Weighted Pull-Ups': '5-10kg',
  '3RM Weighted Pull-Up': '15-20kg',
  'Chest Supported Row': '10-15kg per dumbbell',
  
  // Push exercises
  'Weighted Dips': '5-10kg',
  '5RM Weighted Push-Up': '10-15kg',
  
  // Lower body
  'RDL': '60-80kg',
  'Single Leg RDL': '8-12kg per hand',
  'Goblet Squats': '16-24kg',
  'Bulgarian Split Squat': '8-16kg per hand',
  'Bulgarian Split Squat (Left)': '8-16kg per hand',
  'Bulgarian Split Squat (Right)': '8-16kg per hand',
  'Weighted Glute Bridge': '40-60kg',
  
  // Core
  'Weighted V-Ups': '3-5kg',
  'Dragon Flags OR Weighted V-Ups': '3-5kg',
  'Light Weighted Jefferson Curl': '5-10kg',
  
  // Bands/accessories
  'Pallof Press': 'light band',
  'Face Pulls': 'light-medium band',
  'Band Pull-Aparts': 'light band',
  'Band External Rotations': 'light band',
  'Band Internal Rotations': 'light band',
};

// Bodyweight exercises (no load or "bodyweight")
const BODYWEIGHT_EXERCISES = [
  'Pull-Ups',
  'Dips',
  'Push-Ups',
  'Pike Push-Ups',
  'Assisted Pistol Squat',
  'Plank',
  'Hollow Body Hold',
  'Superman',
  'Bird Dog',
  'Dead Bug',
  'Shoulder Dislocates',
  'Cat-Cow',
  'World\'s Greatest Stretch',
  'Hip CARs',
  'Shoulder CARs',
  'Scapular Pull-Ups',
  'Archer Push-Ups',
  'Diamond Push-Ups',
  'One-Arm Push-Up Progression',
];

function normalizeExercise(exercise) {
  const { exerciseName, load, notes, ...rest } = exercise;
  
  let newLoad = null;
  let newNotes = notes;
  
  // Check if current load is a prescription term
  const isPrescription = PRESCRIPTION_TERMS.some(term => 
    load && load.toLowerCase() === term.toLowerCase()
  );
  
  if (isPrescription) {
    // Move prescription to notes
    if (newNotes) {
      newNotes = `${load} - ${newNotes}`;
    } else {
      newNotes = load;
    }
    // Get proper load from exercise library
    newLoad = EXERCISE_LOADS[exerciseName] || null;
  } else if (load && load.includes('%')) {
    // Handle percentage-based loads like "60% (Reload)"
    // Keep the percentage as is but extract any prescription
    const match = load.match(/^(\d+%)\s*\((.+)\)$/);
    if (match) {
      newLoad = match[1]; // Just the percentage
      const prescriptionPart = match[2];
      if (newNotes) {
        newNotes = `${prescriptionPart} - ${newNotes}`;
      } else {
        newNotes = prescriptionPart;
      }
    } else {
      newLoad = load;
    }
  } else if (load) {
    // Already has proper load value
    newLoad = load;
  } else if (EXERCISE_LOADS[exerciseName]) {
    // No load set, but we have a standard load for this exercise
    newLoad = EXERCISE_LOADS[exerciseName];
  } else if (BODYWEIGHT_EXERCISES.some(bw => exerciseName.includes(bw))) {
    // Pure bodyweight exercise
    newLoad = null;
  }
  
  // Normalize bodyweight exercises
  if (newLoad === 'bodyweight') {
    // For exercises that are normally weighted but being done at bodyweight
    // Check if there's a weighted version in our library
    const isNormallyWeighted = EXERCISE_LOADS[exerciseName] || 
      exerciseName.toLowerCase().includes('weighted');
    
    if (!isNormallyWeighted) {
      // Pure bodyweight exercise, no load needed
      newLoad = null;
    }
  }
  
  return {
    ...rest,
    exerciseName,
    load: newLoad,
    notes: newNotes,
  };
}

function normalizeWorkoutPlan(plan) {
  let exerciseCount = 0;
  let modifiedCount = 0;
  
  const normalizedPlan = {
    ...plan,
    plan: {
      ...plan.plan,
      phases: plan.plan.phases.map(phase => ({
        ...phase,
        weeks: phase.weeks.map(week => ({
          ...week,
          days: week.days.map(day => ({
            ...day,
            exercises: day.exercises.map(exercise => {
              exerciseCount++;
              const normalized = normalizeExercise(exercise);
              
              // Track if we modified the exercise
              if (normalized.load !== exercise.load || normalized.notes !== exercise.notes) {
                modifiedCount++;
                console.log(`Normalized: ${exercise.exerciseName}`);
                console.log(`  load: "${exercise.load}" -> "${normalized.load}"`);
                console.log(`  notes: "${exercise.notes}" -> "${normalized.notes}"`);
              }
              
              return normalized;
            }),
          })),
        })),
      })),
    },
  };
  
  console.log(`\nTotal exercises: ${exerciseCount}`);
  console.log(`Modified: ${modifiedCount}`);
  
  return normalizedPlan;
}

// Main execution
const workoutPlanPath = path.join(__dirname, 'workout-plan-v2.json');
const workoutPlan = JSON.parse(fs.readFileSync(workoutPlanPath, 'utf-8'));

console.log('Normalizing workout plan...\n');
const normalizedPlan = normalizeWorkoutPlan(workoutPlan);

// Write the normalized plan
fs.writeFileSync(workoutPlanPath, JSON.stringify(normalizedPlan, null, 2));
console.log('\n✅ Workout plan normalized and saved!');

// Also copy to public folder
const publicPath = path.join(__dirname, 'public', 'workout-plan-v2.json');
fs.writeFileSync(publicPath, JSON.stringify(normalizedPlan, null, 2));
console.log('✅ Public copy updated!');

// Show a summary of all unique load values after normalization
const finalLoads = [];
normalizedPlan.plan.phases.forEach(phase => {
  phase.weeks.forEach(week => {
    week.days.forEach(day => {
      day.exercises.forEach(ex => {
        if (ex.load && !finalLoads.includes(ex.load)) {
          finalLoads.push(ex.load);
        }
      });
    });
  });
});

console.log('\n📊 Final unique load values:');
finalLoads.sort().forEach(load => console.log(`  - ${load}`));
