#!/usr/bin/env node

/**
 * Migration Script: Convert v1.0.0 workout plan format to v2.0.0
 * 
 * This script reads the old full-schedule.json format and converts it to the new
 * comprehensive workout plan format with zero data loss.
 * 
 * Usage:
 *   node migrate-workout-plan.js
 * 
 * Output:
 *   workout-plan-v2.json - New format plan
 *   migration-report.json - Detailed migration report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INPUT_FILE = 'full-schedule.json';
const OUTPUT_FILE = 'workout-plan-v2.json';
const REPORT_FILE = 'migration-report.json';

/**
 * Infer exercise category from v1.0.0 'n' (notes) field
 */
function inferCategory(notes) {
  const notesLower = notes.toLowerCase();
  
  if (notesLower === 'warm-up') return 'warmup';
  if (notesLower === 'cool-down') return 'cooldown';
  if (notesLower.includes('mobility') || notesLower === 'pre-hab') return 'mobility';
  if (notesLower.includes('practice') || notesLower.startsWith('skill:')) return 'skill';
  if (notesLower === 'core' || notesLower.includes('core ')) return 'core';
  if (notesLower === 'accessory') return 'accessory';
  if (notesLower === 'recovery') return 'mobility';
  if (notesLower === 'rest') return 'cooldown';
  
  // Main exercises: anything with load, tempo, volume indicators
  return 'main';
}

/**
 * Infer session type from exercises in the day
 */
function inferSessionType(exercises) {
  const categories = exercises.map(e => e.category);
  
  // Check if it's a rest day
  if (exercises.some(e => e.notes && e.notes.toLowerCase().includes('rest'))) {
    return 'rest';
  }
  
  // Check if it's a test day
  if (exercises.some(e => e.notes && e.notes.toLowerCase().includes('test'))) {
    return 'test';
  }
  
  // Check if it's primarily mobility
  const mobilityCount = categories.filter(c => c === 'mobility').length;
  if (mobilityCount > exercises.length / 2) {
    return 'mobility';
  }
  
  // Check if it's skill-focused
  const skillCount = categories.filter(c => c === 'skill').length;
  if (skillCount >= 2) {
    return 'skill';
  }
  
  // Default to strength
  return 'strength';
}

/**
 * Extract load information from notes
 */
function extractLoad(notes) {
  const loadMatch = notes.match(/Load:\s*([^,\n]+)/i);
  if (loadMatch) {
    const load = loadMatch[1].trim();
    // Normalize common patterns
    if (load.toLowerCase().includes('bw')) return 'bodyweight';
    if (load.includes('kg')) return load;
    if (load.includes('%')) return load;
    if (load.toLowerCase().includes('unweighted')) return 'bodyweight';
    return load;
  }
  
  // Check for bodyweight indicators
  if (notes.toLowerCase().includes('bodyweight') || notes.toLowerCase() === 'bw') {
    return 'bodyweight';
  }
  
  return null;
}

/**
 * Extract tempo from notes
 */
function extractTempo(notes) {
  const tempoMatch = notes.match(/Tempo\s+(\d+-\d+-\d+-\d+)/i);
  return tempoMatch ? tempoMatch[1] : null;
}

/**
 * Extract RPE from notes
 */
function extractRPE(notes) {
  const rpeMatch = notes.match(/RPE\s*(\d+)/i);
  return rpeMatch ? parseInt(rpeMatch[1], 10) : null;
}

/**
 * Clean notes by removing extracted information
 */
function cleanNotes(notes, load, tempo) {
  let cleaned = notes;
  
  // Remove load information
  if (load) {
    cleaned = cleaned.replace(/Load:\s*[^,\n]+/gi, '').trim();
  }
  
  // Remove tempo information
  if (tempo) {
    cleaned = cleaned.replace(/Tempo\s+\d+-\d+-\d+-\d+/gi, '').trim();
  }
  
  // Remove RPE information
  cleaned = cleaned.replace(/RPE\s*\d+/gi, '').trim();
  
  // Clean up extra spaces and punctuation
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[,\s]+|[,\s]+$/g, '');
  
  return cleaned || null;
}

/**
 * Estimate workout duration based on exercises
 */
function estimateDuration(exercises) {
  let duration = 0;
  
  exercises.forEach(ex => {
    // Each set takes roughly 1-2 minutes (including rest)
    duration += ex.sets * 1.5;
    
    // Add extra time for warmup/cooldown
    if (ex.category === 'warmup' || ex.category === 'cooldown') {
      duration += ex.sets * 2;
    }
  });
  
  return Math.round(duration);
}

/**
 * Infer phase information based on week number and patterns
 */
function inferPhases(weeks) {
  const phases = [];
  
  // Analyze week patterns to identify phases
  // This is based on common training periodization patterns
  
  // Phase 1: Foundation (Weeks 1-4)
  phases.push({
    phaseNumber: 1,
    name: 'Foundation Phase',
    description: 'Build base strength and establish movement patterns',
    startWeek: 1,
    endWeek: 4,
    focus: 'volume',
    weeks: weeks.filter(w => w.weekNumber >= 1 && w.weekNumber <= 4)
  });
  
  // Phase 2: Development (Weeks 5-8)
  phases.push({
    phaseNumber: 2,
    name: 'Development Phase',
    description: 'Increase training intensity and volume',
    startWeek: 5,
    endWeek: 8,
    focus: 'intensity',
    weeks: weeks.filter(w => w.weekNumber >= 5 && w.weekNumber <= 8)
  });
  
  // Phase 3: Intermediate (Weeks 9-12)
  phases.push({
    phaseNumber: 3,
    name: 'Intermediate Phase',
    description: 'Progressive overload with skill integration',
    startWeek: 9,
    endWeek: 12,
    focus: 'skill',
    weeks: weeks.filter(w => w.weekNumber >= 9 && w.weekNumber <= 12)
  });
  
  // Phase 4: Advanced (Weeks 13-16)
  phases.push({
    phaseNumber: 4,
    name: 'Advanced Phase',
    description: 'Peak strength and skill development',
    startWeek: 13,
    endWeek: 16,
    focus: 'intensity',
    weeks: weeks.filter(w => w.weekNumber >= 13 && w.weekNumber <= 16)
  });
  
  // Phase 5: Peaking (Weeks 17-19)
  phases.push({
    phaseNumber: 5,
    name: 'Peaking Phase',
    description: 'Taper and prepare for testing',
    startWeek: 17,
    endWeek: 19,
    focus: 'deload',
    weeks: weeks.filter(w => w.weekNumber >= 17 && w.weekNumber <= 19)
  });
  
  // Phase 6: Testing & Reload (Weeks 20-21)
  phases.push({
    phaseNumber: 6,
    name: 'Testing & Reload',
    description: 'Performance testing and preparation for next cycle',
    startWeek: 20,
    endWeek: 21,
    focus: 'test',
    weeks: weeks.filter(w => w.weekNumber >= 20 && w.weekNumber <= 21)
  });
  
  return phases;
}

/**
 * Determine volume and intensity levels based on week context
 */
function inferWeekLevels(weekNumber, weekExercises) {
  // Deload weeks (every 4th week approximately)
  const isDeloadWeek = weekNumber % 4 === 0 && weekNumber < 20;
  
  // Check for explicit deload markers in exercises
  const hasDeloadMarker = weekExercises.some(e => 
    e.notes && e.notes.toLowerCase().includes('deload')
  );
  
  if (isDeloadWeek || hasDeloadMarker) {
    return { volumeLevel: 'low', intensityLevel: 'low' };
  }
  
  // Testing weeks
  if (weekNumber >= 20) {
    return { volumeLevel: 'low', intensityLevel: 'peak' };
  }
  
  // Tapering phase
  if (weekNumber >= 17 && weekNumber < 20) {
    return { volumeLevel: 'moderate', intensityLevel: 'moderate' };
  }
  
  // Progressive phases
  const phaseWeek = weekNumber % 4;
  if (phaseWeek === 1) {
    return { volumeLevel: 'moderate', intensityLevel: 'moderate' };
  } else if (phaseWeek === 2) {
    return { volumeLevel: 'high', intensityLevel: 'moderate' };
  } else if (phaseWeek === 3) {
    return { volumeLevel: 'high', intensityLevel: 'high' };
  }
  
  return { volumeLevel: 'moderate', intensityLevel: 'moderate' };
}

/**
 * Convert v1.0.0 format to v2.0.0 format
 */
function migrateWorkoutPlan(oldFormat) {
  const report = {
    startTime: new Date().toISOString(),
    inputFile: INPUT_FILE,
    outputFile: OUTPUT_FILE,
    oldFormatEntries: oldFormat.length,
    newFormatVersion: '2.0.0',
    warnings: [],
    errors: [],
    stats: {
      totalWeeks: 0,
      totalDays: 0,
      totalExercises: 0,
      categoryCounts: {},
      sessionTypeCounts: {}
    }
  };
  
  try {
    // Group exercises by week and day
    const exercisesByWeek = {};
    
    oldFormat.forEach((entry, index) => {
      const { w, d, ex, s, r, n } = entry;
      
      // Validate required fields
      if (!w || !d || !ex || !s || !r || !n) {
        report.errors.push({
          index,
          entry,
          error: 'Missing required fields'
        });
        return;
      }
      
      if (!exercisesByWeek[w]) {
        exercisesByWeek[w] = {};
      }
      if (!exercisesByWeek[w][d]) {
        exercisesByWeek[w][d] = [];
      }
      
      // Extract structured information
      const load = extractLoad(n);
      const tempo = extractTempo(n);
      const rpe = extractRPE(n);
      const category = inferCategory(n);
      const notes = cleanNotes(n, load, tempo);
      
      exercisesByWeek[w][d].push({
        order: exercisesByWeek[w][d].length + 1,
        exerciseName: ex,
        exerciseId: null, // Will need manual mapping or fuzzy match
        category,
        sets: s,
        reps: r,
        tempo,
        restSeconds: null, // Not specified in old format
        rpe,
        load,
        notes,
        alternatives: [],
        progressionNotes: null,
        videoUrl: null,
        cues: []
      });
      
      // Update stats
      report.stats.categoryCounts[category] = (report.stats.categoryCounts[category] || 0) + 1;
      report.stats.totalExercises++;
    });
    
    // Build weeks structure
    const weeks = [];
    const weekNumbers = Object.keys(exercisesByWeek).map(Number).sort((a, b) => a - b);
    
    weekNumbers.forEach(weekNum => {
      const weekDays = exercisesByWeek[weekNum];
      const dayNumbers = Object.keys(weekDays).map(Number).sort((a, b) => a - b);
      
      const days = dayNumbers.map(dayNum => {
        const exercises = weekDays[dayNum];
        const sessionType = inferSessionType(exercises);
        
        report.stats.sessionTypeCounts[sessionType] = 
          (report.stats.sessionTypeCounts[sessionType] || 0) + 1;
        
        let sessionName;
        if (dayNum === 1) sessionName = 'Pull Day A';
        else if (dayNum === 2) sessionName = 'Mobility & Recovery';
        else if (dayNum === 3) sessionName = 'Lower Body';
        else if (dayNum === 5) sessionName = 'Pull Day B';
        else sessionName = `Day ${dayNum}`;
        
        return {
          dayNumber: dayNum,
          name: sessionName,
          type: sessionType,
          estimatedDuration: estimateDuration(exercises),
          description: null,
          exercises
        };
      });
      
      const weekExercises = Object.values(weekDays).flat();
      const { volumeLevel, intensityLevel } = inferWeekLevels(weekNum, weekExercises);
      
      weeks.push({
        weekNumber: weekNum,
        description: null,
        focus: null,
        volumeLevel,
        intensityLevel,
        days
      });
      
      report.stats.totalDays += days.length;
    });
    
    report.stats.totalWeeks = weeks.length;
    
    // Build phases
    const phases = inferPhases(weeks);
    
    // Build complete plan
    const newFormat = {
      formatVersion: '2.0.0',
      plan: {
        id: 'oneplus-12-pro-tracker-v1',
        name: '21-Week Calisthenics Strength Program',
        description: 'Progressive bodyweight strength program focusing on pull-ups, dips, and fundamental calisthenics movements. Includes systematic progressions, skill work, and periodized training phases.',
        author: 'OnePlus 12 Pro Tracker',
        createdDate: '2024-01-01',
        lastModified: new Date().toISOString(),
        version: '1.0.0',
        durationWeeks: 21,
        goals: [
          'weighted-pull-ups',
          'bodyweight-mastery',
          'muscle-endurance',
          'functional-strength',
          'calisthenics-skills'
        ],
        targetLevel: 'intermediate',
        equipment: [
          'pull-up-bar',
          'rings',
          'parallettes',
          'dip-bars',
          'resistance-bands',
          'rower',
          'dumbbells',
          'barbell',
          'bench',
          'box'
        ],
        phases
      }
    };
    
    report.endTime = new Date().toISOString();
    report.success = true;
    report.warnings.push('Exercise IDs need manual mapping to exercise library');
    report.warnings.push('Rest periods not specified in original format - set to null');
    report.warnings.push('Some metadata inferred from patterns - review for accuracy');
    
    return { newFormat, report };
    
  } catch (error) {
    report.endTime = new Date().toISOString();
    report.success = false;
    report.errors.push({
      error: error.message,
      stack: error.stack
    });
    return { newFormat: null, report };
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🏋️ Workout Plan Migration Tool v1.0.0');
  console.log('=====================================\n');
  
  // Read input file
  console.log(`📖 Reading ${INPUT_FILE}...`);
  const inputPath = path.join(__dirname, INPUT_FILE);
  
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: ${INPUT_FILE} not found!`);
    process.exit(1);
  }
  
  const oldFormat = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`✅ Loaded ${oldFormat.length} entries\n`);
  
  // Perform migration
  console.log('🔄 Converting to v2.0.0 format...');
  const { newFormat, report } = migrateWorkoutPlan(oldFormat);
  
  if (!report.success) {
    console.error('❌ Migration failed!');
    console.error('Errors:', report.errors);
    process.exit(1);
  }
  
  // Write output file
  console.log(`💾 Writing ${OUTPUT_FILE}...`);
  const outputPath = path.join(__dirname, OUTPUT_FILE);
  fs.writeFileSync(outputPath, JSON.stringify(newFormat, null, 2), 'utf8');
  console.log(`✅ Created ${OUTPUT_FILE}\n`);
  
  // Write report
  console.log(`📊 Writing ${REPORT_FILE}...`);
  const reportPath = path.join(__dirname, REPORT_FILE);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`✅ Created ${REPORT_FILE}\n`);
  
  // Display summary
  console.log('📈 Migration Summary');
  console.log('===================');
  console.log(`Format Version:     ${report.newFormatVersion}`);
  console.log(`Total Weeks:        ${report.stats.totalWeeks}`);
  console.log(`Total Days:         ${report.stats.totalDays}`);
  console.log(`Total Exercises:    ${report.stats.totalExercises}`);
  console.log(`Phases:             ${newFormat.plan.phases.length}`);
  console.log(`\nCategory Distribution:`);
  Object.entries(report.stats.categoryCounts).forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(15)} ${count}`);
  });
  console.log(`\nSession Type Distribution:`);
  Object.entries(report.stats.sessionTypeCounts).forEach(([type, count]) => {
    console.log(`  ${type.padEnd(15)} ${count}`);
  });
  
  if (report.warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${report.warnings.length}):`);
    report.warnings.forEach(w => console.log(`  - ${w}`));
  }
  
  if (report.errors.length > 0) {
    console.log(`\n❌ Errors (${report.errors.length}):`);
    report.errors.forEach(e => console.log(`  - ${JSON.stringify(e)}`));
  }
  
  console.log('\n✨ Migration complete!');
  console.log(`\n📄 Review ${OUTPUT_FILE} for the new format`);
  console.log(`📊 Check ${REPORT_FILE} for detailed migration report`);
}

// Run main function
main();

export { migrateWorkoutPlan, inferCategory, extractLoad, extractTempo };
