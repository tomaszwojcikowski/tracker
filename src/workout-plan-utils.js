/**
 * Workout Plan Utilities
 * 
 * This module provides utilities for loading and working with workout plans
 * in both v1.0.0 (flat array) and v2.0.0 (structured) formats.
 */

/**
 * Detect the format version of a workout plan
 * @param {Object|Array} data - The workout plan data
 * @returns {string} Format version ('1.0.0' or '2.0.0')
 */
export function detectFormatVersion(data) {
  // v2.0.0 has formatVersion field at root
  if (data && typeof data === 'object' && data.formatVersion) {
    return data.formatVersion;
  }
  
  // v1.0.0 is a flat array
  if (Array.isArray(data)) {
    return '1.0.0';
  }
  
  // Unknown format
  throw new Error('Unknown workout plan format');
}

/**
 * Validate v1.0.0 format
 * @param {Array} data - Workout plan data
 * @returns {boolean} True if valid
 */
function validateV1Format(data) {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;
  
  // Check first entry has required fields
  const entry = data[0];
  return entry.w !== undefined && 
         entry.d !== undefined && 
         entry.ex !== undefined && 
         entry.s !== undefined && 
         entry.r !== undefined;
}

/**
 * Validate v2.0.0 format
 * @param {Object} data - Workout plan data
 * @returns {boolean} True if valid
 */
function validateV2Format(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.formatVersion || !data.plan) return false;
  
  const plan = data.plan;
  return plan.id !== undefined &&
         plan.name !== undefined &&
         plan.durationWeeks !== undefined &&
         Array.isArray(plan.phases);
}

/**
 * Convert v1.0.0 flat format to internal schedule format
 * (Compatible with existing buildCompleteSchedule function)
 * @param {Array} v1Data - v1.0.0 format data
 * @returns {Array} Internal schedule format
 */
export function convertV1ToInternal(v1Data) {
  if (!validateV1Format(v1Data)) {
    throw new Error('Invalid v1.0.0 workout plan format');
  }
  
  // v1.0.0 format is already compatible with internal format
  return v1Data;
}

/**
 * Convert v2.0.0 structured format to internal schedule format
 * (Compatible with existing buildCompleteSchedule function)
 * @param {Object} v2Data - v2.0.0 format data
 * @returns {Array} Internal schedule format (flat array for compatibility)
 */
export function convertV2ToInternal(v2Data) {
  if (!validateV2Format(v2Data)) {
    throw new Error('Invalid v2.0.0 workout plan format');
  }
  
  const internalFormat = [];
  
  // Flatten the structured format back to flat array
  // Note: The 'n' field combines notes and category for v1.0.0 compatibility
  // Priority: notes (if present) > category (fallback) > empty string
  v2Data.plan.phases.forEach(phase => {
    phase.weeks.forEach(week => {
      week.days.forEach(day => {
        day.exercises.forEach(exercise => {
          internalFormat.push({
            w: week.weekNumber,
            d: day.dayNumber,
            ex: exercise.exerciseName,
            s: exercise.sets,
            r: exercise.reps,
            // For v1.0.0 compatibility, combine notes and category
            // This preserves the original behavior where 'n' was a multi-purpose field
            n: exercise.notes || exercise.category || ''
          });
        });
      });
    });
  });
  
  return internalFormat;
}

/**
 * Load workout plan and convert to internal format
 * @param {Object|Array} data - Workout plan in any supported format
 * @returns {Object} { schedule: Array, metadata: Object }
 */
export function loadWorkoutPlan(data) {
  const version = detectFormatVersion(data);
  
  let schedule;
  let metadata = {};
  
  if (version === '1.0.0') {
    schedule = convertV1ToInternal(data);
    // v1.0.0 has no metadata
    metadata = {
      version: '1.0.0',
      name: 'Workout Plan',
      description: null,
      durationWeeks: Math.max(...schedule.map(e => e.w))
    };
  } else if (version === '2.0.0') {
    schedule = convertV2ToInternal(data);
    // Extract metadata from v2.0.0 format
    metadata = {
      version: '2.0.0',
      id: data.plan.id,
      name: data.plan.name,
      description: data.plan.description,
      author: data.plan.author,
      durationWeeks: data.plan.durationWeeks,
      goals: data.plan.goals,
      targetLevel: data.plan.targetLevel,
      equipment: data.plan.equipment,
      phases: data.plan.phases.map(p => ({
        number: p.phaseNumber,
        name: p.name,
        description: p.description,
        startWeek: p.startWeek,
        endWeek: p.endWeek,
        focus: p.focus
      }))
    };
  } else {
    throw new Error(`Unsupported format version: ${version}`);
  }
  
  return { schedule, metadata };
}

/**
 * Get phase information for a given week
 * @param {Object} metadata - Workout plan metadata
 * @param {number} weekNumber - Week number
 * @returns {Object|null} Phase information or null if not available
 */
export function getPhaseForWeek(metadata, weekNumber) {
  if (!metadata.phases) return null;
  
  return metadata.phases.find(phase => 
    weekNumber >= phase.startWeek && weekNumber <= phase.endWeek
  ) || null;
}

/**
 * Get exercise details from v2.0.0 format
 * @param {Object} v2Data - v2.0.0 format data
 * @param {number} weekNumber - Week number
 * @param {number} dayNumber - Day number
 * @returns {Array} Array of exercise objects with full details
 */
export function getExercisesWithDetails(v2Data, weekNumber, dayNumber) {
  if (!validateV2Format(v2Data)) {
    return null;
  }
  
  // Find the phase containing this week
  const phase = v2Data.plan.phases.find(p => 
    weekNumber >= p.startWeek && weekNumber <= p.endWeek
  );
  
  if (!phase) return null;
  
  // Find the week
  const week = phase.weeks.find(w => w.weekNumber === weekNumber);
  if (!week) return null;
  
  // Find the day
  const day = week.days.find(d => d.dayNumber === dayNumber);
  if (!day) return null;
  
  return day.exercises;
}

/**
 * Check if data is in v2.0.0 format
 * @param {any} data - Data to check
 * @returns {boolean} True if v2.0.0 format
 */
export function isV2Format(data) {
  try {
    return detectFormatVersion(data) === '2.0.0';
  } catch (error) {
    // detectFormatVersion throws if format is unknown
    // This is expected for invalid data, so we return false
    return false;
  }
}

/**
 * Get workout plan summary
 * @param {Object} metadata - Workout plan metadata
 * @returns {Object} Summary information
 */
export function getPlanSummary(metadata) {
  return {
    name: metadata.name || 'Workout Plan',
    version: metadata.version,
    weeks: metadata.durationWeeks,
    phases: metadata.phases ? metadata.phases.length : 0,
    goals: metadata.goals || [],
    level: metadata.targetLevel || 'unknown',
    equipment: metadata.equipment || []
  };
}
