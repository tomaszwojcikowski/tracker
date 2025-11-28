/**
 * Workout Plan Utilities
 *
 * This module provides utilities for loading and working with workout plans
 * in v2.0.0 structured format.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Structured load range for weighted exercises
 */
export interface LoadRange {
  /** Minimum weight value */
  min: number;
  /** Maximum weight value (same as min for fixed loads) */
  max: number;
  /** Unit of measurement */
  unit: 'kg' | 'band' | 'bodyweight' | 'percent';
  /** Original string representation */
  raw: string;
  /** Per-hand indicator for dumbbell exercises */
  perHand?: boolean;
}

/**
 * Parse a load string into a structured LoadRange
 * @param load - Load string (e.g., "5-10kg", "light band", "bodyweight", "8kg per hand")
 * @returns LoadRange object or null if not parseable
 */
export function parseLoadRange(load: string | null | undefined): LoadRange | null {
  if (!load) return null;

  const raw = load.trim();
  const lower = raw.toLowerCase();

  // Handle bodyweight
  if (lower === 'bodyweight') {
    return { min: 0, max: 0, unit: 'bodyweight', raw };
  }

  // Handle bands
  if (lower.includes('band')) {
    // Map band resistance to approximate values
    let resistance = 1;
    if (lower.includes('light')) resistance = 1;
    if (lower.includes('medium')) resistance = 2;
    if (lower.includes('heavy')) resistance = 3;
    return { min: resistance, max: resistance, unit: 'band', raw };
  }

  // Handle percentage
  if (lower.includes('%')) {
    const match = raw.match(/(\d+)/);
    if (match) {
      const value = parseInt(match[1], 10);
      return { min: value, max: value, unit: 'percent', raw };
    }
  }

  // Handle per-hand notation
  const perHand = lower.includes('per hand');

  // Handle kg ranges: "5-10kg", "10kg", "+2kg", "~85kg"
  // Remove non-numeric prefix characters like + or ~
  const cleaned = raw.replace(/per hand/gi, '').replace(/kg/gi, '').trim();

  // Check for range (contains hyphen between numbers)
  const rangeMatch = cleaned.match(/^[+~]?(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2]),
      unit: 'kg',
      raw,
      perHand,
    };
  }

  // Check for single value
  const singleMatch = cleaned.match(/^[+~]?(\d+(?:\.\d+)?)$/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1]);
    return {
      min: value,
      max: value,
      unit: 'kg',
      raw,
      perHand,
    };
  }

  return null;
}

/**
 * Format version string
 */
export type FormatVersion = '2.0.0' | '2.1.0';

/**
 * Structured reps data for internal use
 */
export interface RepsRange {
  /** Type of rep scheme */
  type: RepsType;
  /** Primary value for reps (count, seconds, RM number, etc.) */
  value?: number | number[] | null;
  /** Minimum reps for rep ranges */
  min?: number;
  /** Maximum reps for rep ranges */
  max?: number;
  /** Unit for time-based reps */
  unit?: 'seconds';
  /** Whether reps are per side */
  perSide?: boolean;
  /** Modifier for AMRAP (e.g., -1, -20%) */
  modifier?: number;
  /** Original string representation */
  raw: string;
}

/**
 * Structured tempo data for internal use
 */
export interface TempoRange {
  /** Eccentric (lowering) phase duration in seconds */
  eccentric: number;
  /** Pause at bottom position in seconds */
  pauseBottom: number;
  /** Concentric (lifting) phase duration in seconds */
  concentric: number;
  /** Pause at top position in seconds */
  pauseTop: number;
  /** Original string representation */
  raw: string;
}

/**
 * Internal schedule entry (flat format for compatibility with existing code)
 */
export interface ScheduleEntry {
  /** Week number */
  w: number;
  /** Day number */
  d: number;
  /** Exercise name */
  ex: string;
  /** Number of sets */
  s: number;
  /** Rep prescription (e.g., "8-12" or "10") */
  r: string;
  /** Notes/category (multi-purpose field) */
  n?: string;
  /** Load/weight for weighted exercises (e.g., "10kg", "5-10kg", "light band") */
  load?: string;
  /** Parsed load range for weighted exercises */
  loadRange?: LoadRange;
  /** Parsed reps range for structured reps data */
  repsRange?: RepsRange;
  /** Parsed tempo data */
  tempoRange?: TempoRange;
}

/**
 * Load unit types for structured load data
 */
export type LoadUnit = 'kg' | 'band' | 'bodyweight' | 'percent';

/**
 * Rep type for structured reps data
 */
export type RepsType = 'reps' | 'time' | 'ladder' | 'amrap' | 'rm' | 'max' | 'effort' | 'submax' | 'none';

/**
 * V2.0.0 exercise definition
 */
export interface V2Exercise {
  exerciseName: string;
  sets: number;
  order?: number;
  notes?: string;
  category?: string;
  rest?: number;
  rpe?: number;

  // ---- Legacy fields (deprecated, for backward compatibility) ----
  /** @deprecated Use repsType/repsValue/repsMin/repsMax instead */
  reps?: string;
  /** @deprecated Use loadMin/loadMax/loadUnit instead */
  load?: string | null;
  /** @deprecated Use tempoEccentric/tempoPauseBottom/tempoConcentric/tempoPauseTop instead */
  tempo?: string;

  // ---- Structured load fields ----
  /** Minimum weight value for weight ranges */
  loadMin?: number;
  /** Maximum weight value for weight ranges (same as min for fixed loads) */
  loadMax?: number;
  /** Unit of measurement for load */
  loadUnit?: LoadUnit;
  /** Whether the load is per hand (for dumbbell exercises) */
  loadPerHand?: boolean;

  // ---- Structured reps fields ----
  /** Type of rep scheme */
  repsType?: RepsType;
  /** Primary value for reps (count, seconds, RM number, etc.) */
  repsValue?: number | number[] | null;
  /** Minimum reps for rep ranges */
  repsMin?: number;
  /** Maximum reps for rep ranges */
  repsMax?: number;
  /** Unit for time-based reps */
  repsUnit?: 'seconds';
  /** Whether reps are per side */
  repsPerSide?: boolean;
  /** Modifier for AMRAP (e.g., -1, -20%) */
  repsModifier?: number;

  // ---- Structured tempo fields ----
  /** Eccentric (lowering) phase duration in seconds */
  tempoEccentric?: number;
  /** Pause at bottom position in seconds */
  tempoPauseBottom?: number;
  /** Concentric (lifting) phase duration in seconds */
  tempoConcentric?: number;
  /** Pause at top position in seconds */
  tempoPauseTop?: number;
}

/**
 * V2.0.0 day definition
 */
export interface V2Day {
  dayNumber: number;
  /** Unique ID for referencing this day (v2.1+) */
  id?: string;
  name?: string;
  type?: string;
  estimatedDuration?: number;
  focus?: string;
  description?: string | null;
  /** Reference to another day or template (v2.1+) */
  $ref?: string;
  exercises?: V2Exercise[];
}

/**
 * V2.1.0 day template definition
 */
export interface V2DayTemplate {
  /** Unique ID for this template */
  id: string;
  name?: string;
  type?: string;
  estimatedDuration?: number;
  description?: string | null;
  exercises: V2Exercise[];
}

/**
 * V2.0.0 week definition
 */
export interface V2Week {
  weekNumber: number;
  days: V2Day[];
}

/**
 * V2.0.0 phase definition
 */
export interface V2Phase {
  phaseNumber: number;
  name: string;
  description?: string;
  startWeek: number;
  endWeek: number;
  focus?: string;
  weeks: V2Week[];
}

/**
 * V2.0.0 plan definition
 */
export interface V2Plan {
  id: string;
  name: string;
  description?: string;
  author?: string;
  durationWeeks: number;
  goals?: string[];
  targetLevel?: string;
  equipment?: string[];
  /** Day templates for v2.1+ format */
  dayTemplates?: V2DayTemplate[];
  phases: V2Phase[];
}

/**
 * V2.0.0/V2.1.0 format root structure
 */
export interface V2WorkoutPlan {
  formatVersion: '2.0.0' | '2.1.0';
  plan: V2Plan;
}

/**
 * Supported workout plan format (v2.0.0 and v2.1.0)
 */
export type WorkoutPlanData = V2WorkoutPlan;

/**
 * Internal schedule format (compatible with buildCompleteSchedule)
 */
export type InternalSchedule = ScheduleEntry[];

/**
 * Phase metadata for UI display
 */
export interface PhaseMetadata {
  number: number;
  name: string;
  description?: string;
  startWeek: number;
  endWeek: number;
  focus?: string;
}

/**
 * Workout plan metadata
 */
export interface WorkoutPlanMetadata {
  version: FormatVersion;
  id?: string;
  name: string;
  description?: string | null;
  author?: string;
  durationWeeks: number;
  goals?: string[];
  targetLevel?: string;
  equipment?: string[];
  phases?: PhaseMetadata[];
}

/**
 * Result of loading a workout plan
 */
export interface LoadedWorkoutPlan {
  schedule: InternalSchedule;
  metadata: WorkoutPlanMetadata;
}

/**
 * Plan summary for display
 */
export interface PlanSummary {
  name: string;
  version: FormatVersion;
  weeks: number;
  phases: number;
  goals: string[];
  level: string;
  equipment: string[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate v2.0.0 or v2.1.0 format
 */
function validateV2Format(data: unknown): data is V2WorkoutPlan {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;
  // Support both 2.0.0 and 2.1.0
  if (!obj.formatVersion || (obj.formatVersion !== '2.0.0' && obj.formatVersion !== '2.1.0') || !obj.plan) return false;

  const plan = obj.plan as Record<string, unknown>;
  return (
    plan.id !== undefined &&
    plan.name !== undefined &&
    plan.durationWeeks !== undefined &&
    Array.isArray(plan.phases)
  );
}

// ============================================================================
// FORMAT CONVERSION
// ============================================================================

/**
 * Resolve a day reference to get the actual exercises
 * @param day - The day that may contain a $ref
 * @param dayTemplates - Array of day templates from the plan
 * @param dayRegistry - Registry of previously defined days by ID
 * @returns The resolved exercises array, or null if not resolvable
 */
function resolveDayReference(
  day: V2Day,
  dayTemplates: V2DayTemplate[] | undefined,
  dayRegistry: Map<string, V2Exercise[]>
): V2Exercise[] | null {
  // If day has exercises directly, return them
  if (day.exercises && day.exercises.length > 0) {
    return day.exercises;
  }

  // If day has a $ref, resolve it
  if (day.$ref) {
    // First, check day templates
    if (dayTemplates) {
      const template = dayTemplates.find(t => t.id === day.$ref);
      if (template) {
        return template.exercises;
      }
    }

    // Then, check previously defined days
    const resolvedExercises = dayRegistry.get(day.$ref);
    if (resolvedExercises) {
      return resolvedExercises;
    }

    throw new Error(`Day template "${day.$ref}" not found`);
  }

  // Day has neither exercises nor $ref
  return day.exercises ?? null;
}

/**
 * Convert v2.0.0/v2.1.0 structured format to internal schedule format
 * (Compatible with existing buildCompleteSchedule function)
 * @param v2Data - v2.0.0 or v2.1.0 format data
 * @returns Internal schedule format (flat array for compatibility)
 * @throws Error if format is invalid
 */
export function convertV2ToInternal(v2Data: unknown): InternalSchedule {
  if (!validateV2Format(v2Data)) {
    throw new Error('Invalid v2.0.0/v2.1.0 workout plan format');
  }

  const internalFormat: ScheduleEntry[] = [];

  // Registry for day IDs to their exercises (for v2.1 references)
  const dayRegistry = new Map<string, V2Exercise[]>();
  const dayTemplates = v2Data.plan.dayTemplates;

  // Flatten the structured format back to flat array for internal use
  // The 'n' field combines notes and category
  // Priority: notes (if present) > category (fallback) > empty string
  v2Data.plan.phases.forEach((phase) => {
    phase.weeks.forEach((week) => {
      week.days.forEach((day) => {
        // Resolve day references (v2.1 feature)
        const exercises = resolveDayReference(day, dayTemplates, dayRegistry);

        // Register this day's exercises if it has an ID (for future references)
        if (day.id && exercises) {
          dayRegistry.set(day.id, exercises);
        }

        // Skip days with no exercises (empty or unresolvable reference)
        if (!exercises || exercises.length === 0) {
          return;
        }

        exercises.forEach((exercise) => {
          // Use new structured load fields if available, fall back to parsing old load field
          let loadRange: LoadRange | null = null;

          if (exercise.loadMin !== undefined && exercise.loadMax !== undefined && exercise.loadUnit) {
            // New format: use structured fields directly
            // Generate a human-readable raw string based on unit type
            let rawStr: string;
            if (exercise.loadUnit === 'bodyweight') {
              rawStr = 'bodyweight';
            } else if (exercise.loadUnit === 'band') {
              const bandLevel = exercise.loadMin === 1 ? 'light' : exercise.loadMin === 2 ? 'medium' : 'heavy';
              rawStr = `${bandLevel} band`;
            } else if (exercise.loadUnit === 'percent') {
              rawStr = `${exercise.loadMin}%`;
            } else {
              // kg unit
              rawStr = exercise.loadMin === exercise.loadMax
                ? `${exercise.loadMin}kg`
                : `${exercise.loadMin}-${exercise.loadMax}kg`;
              if (exercise.loadPerHand) {
                rawStr += ' per hand';
              }
            }

            loadRange = {
              min: exercise.loadMin,
              max: exercise.loadMax,
              unit: exercise.loadUnit,
              raw: rawStr,
              perHand: exercise.loadPerHand,
            };
          } else if (exercise.load) {
            // Legacy format: parse load string (backward compatibility)
            loadRange = parseLoadRange(exercise.load);
          }

          // Use new structured reps fields if available, fall back to parsing old reps string
          let repsRange: RepsRange | null = null;
          let repsStr = '';

          if (exercise.repsType) {
            // New format: use structured reps fields directly
            repsRange = {
              type: exercise.repsType,
              value: exercise.repsValue,
              min: exercise.repsMin,
              max: exercise.repsMax,
              unit: exercise.repsUnit,
              perSide: exercise.repsPerSide,
              modifier: exercise.repsModifier,
              raw: buildRepsString(exercise),
            };
            repsStr = repsRange.raw;
          } else if (exercise.reps) {
            // Legacy format: use reps string directly
            repsStr = exercise.reps;
            repsRange = parseRepsRange(exercise.reps);
          }

          // Use new structured tempo fields if available
          let tempoRange: TempoRange | undefined;

          if (exercise.tempoEccentric !== undefined) {
            tempoRange = {
              eccentric: exercise.tempoEccentric,
              pauseBottom: exercise.tempoPauseBottom ?? 0,
              concentric: exercise.tempoConcentric ?? 0,
              pauseTop: exercise.tempoPauseTop ?? 0,
              raw: `${exercise.tempoEccentric}-${exercise.tempoPauseBottom ?? 0}-${exercise.tempoConcentric ?? 0}-${exercise.tempoPauseTop ?? 0}`,
            };
          } else if (exercise.tempo) {
            // Legacy format: parse tempo string
            tempoRange = parseTempoRange(exercise.tempo) || undefined;
          }

          internalFormat.push({
            w: week.weekNumber,
            d: day.dayNumber,
            ex: exercise.exerciseName,
            s: exercise.sets,
            r: repsStr,
            // Combine notes and category into single field
            n: exercise.notes || exercise.category || '',
            // Pass through load for weighted exercises
            load: loadRange?.raw,
            // Include parsed load range
            loadRange: loadRange || undefined,
            // Include parsed reps range
            repsRange: repsRange || undefined,
            // Include parsed tempo
            tempoRange,
          });
        });
      });
    });
  });

  return internalFormat;
}

/**
 * Build a human-readable reps string from structured reps data
 */
function buildRepsString(exercise: V2Exercise): string {
  const { repsType, repsValue, repsMin, repsMax, repsPerSide, repsModifier } = exercise;

  switch (repsType) {
    case 'reps':
      if (repsMin !== undefined && repsMax !== undefined) {
        return `${repsMin}-${repsMax} reps`;
      }
      if (repsValue !== null && repsValue !== undefined) {
        return repsPerSide ? `${repsValue}/side` : `${repsValue} reps`;
      }
      return '';

    case 'time':
      if (repsMin !== undefined && repsMax !== undefined) {
        return `${repsMin}-${repsMax}s`;
      }
      if (repsValue !== null && repsValue !== undefined) {
        const seconds = repsValue as number;
        if (seconds >= 60 && seconds % 60 === 0) {
          const mins = seconds / 60;
          return repsPerSide ? `${mins} min/side` : `${mins} min`;
        }
        return repsPerSide ? `${seconds}s/side` : `${seconds}s`;
      }
      return '';

    case 'ladder':
      if (Array.isArray(repsValue)) {
        return `(${repsValue.join('-')}) reps`;
      }
      return '';

    case 'amrap':
      if (repsModifier !== undefined) {
        // Modifiers >= 10 are percentages, < 10 are reps in reserve
        const isPercentage = repsModifier >= 10;
        return `AMRAP - ${repsModifier}${isPercentage ? '%' : ''}`;
      }
      return 'AMRAP Max';

    case 'rm':
      return repsValue !== null && repsValue !== undefined ? `${repsValue}RM` : '';

    case 'max':
      return 'Max';

    case 'effort':
      return repsValue !== null && repsValue !== undefined ? `${repsValue}% Effort` : '';

    case 'submax':
      return 'Sub-max';

    case 'none':
      return 'n/a';

    default:
      return '';
  }
}

/**
 * Parse a reps string into structured RepsRange
 */
function parseRepsRange(reps: string): RepsRange | null {
  if (!reps) return null;

  const raw = reps.trim();
  const lower = raw.toLowerCase();

  // Ladder reps
  const ladderMatch = raw.match(/^\((\d+(?:-\d+)+)\)\s*reps?$/i);
  if (ladderMatch) {
    return {
      type: 'ladder',
      value: ladderMatch[1].split('-').map(n => parseInt(n, 10)),
      raw,
    };
  }

  // AMRAP
  const amrapMatch = raw.match(/^AMRAP\s*(?:-\s*)?(\d+%?|Max)?$/i);
  if (amrapMatch) {
    const mod = amrapMatch[1];
    if (mod && mod.toLowerCase() !== 'max') {
      return { type: 'amrap', value: null, modifier: parseInt(mod, 10), raw };
    }
    return { type: 'amrap', value: null, raw };
  }

  // RM tests
  const rmMatch = raw.match(/^(\d+)RM$/i);
  if (rmMatch) {
    return { type: 'rm', value: parseInt(rmMatch[1], 10), raw };
  }

  // Max
  if (lower === 'max' || lower === 'pr attempt') {
    return { type: 'max', value: null, raw };
  }

  // Sub-max
  if (lower === 'sub-max') {
    return { type: 'submax', value: null, raw };
  }

  // N/A
  if (lower === 'n/a') {
    return { type: 'none', value: null, raw };
  }

  // Effort
  const effortMatch = raw.match(/^(\d+)%\s*Effort$/i);
  if (effortMatch) {
    return { type: 'effort', value: parseInt(effortMatch[1], 10), raw };
  }

  // Time-based
  const perSideTime = lower.includes('/side');
  const timeMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(s|sec|min|m)(?:\/side)?$/i);
  if (timeMatch) {
    const value = parseFloat(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    const seconds = (unit === 'min' || unit === 'm') ? value * 60 : value;
    return { type: 'time', value: seconds, unit: 'seconds', perSide: perSideTime ? true : undefined, raw };
  }

  // Time range
  const timeRangeMatch = raw.match(/^(\d+)\s*-\s*(\d+)\s*(s|sec)$/i);
  if (timeRangeMatch) {
    return {
      type: 'time',
      min: parseInt(timeRangeMatch[1], 10),
      max: parseInt(timeRangeMatch[2], 10),
      unit: 'seconds',
      raw,
    };
  }

  // Rep range
  const rangeMatch = raw.match(/^(\d+)\s*-\s*(\d+)\s*reps?$/i);
  if (rangeMatch) {
    return {
      type: 'reps',
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10),
      raw,
    };
  }

  // Fixed reps with per-side
  const perSideMatch = raw.match(/^(\d+)\s*(?:reps?)?\s*\/\s*side$/i);
  if (perSideMatch) {
    return { type: 'reps', value: parseInt(perSideMatch[1], 10), perSide: true, raw };
  }

  // Fixed reps
  const fixedMatch = raw.match(/^(\d+)\s*reps?$/i);
  if (fixedMatch) {
    return { type: 'reps', value: parseInt(fixedMatch[1], 10), raw };
  }

  // Plain number (just digits)
  const plainNumberMatch = raw.match(/^(\d+)$/);
  if (plainNumberMatch) {
    return { type: 'reps', value: parseInt(plainNumberMatch[1], 10), raw };
  }

  return null;
}

/**
 * Parse a tempo string into structured TempoRange
 */
function parseTempoRange(tempo: string): TempoRange | null {
  if (!tempo) return null;

  const match = tempo.match(/^(\d+)-(\d+)-(\d+)-(\d+)$/);
  if (match) {
    return {
      eccentric: parseInt(match[1], 10),
      pauseBottom: parseInt(match[2], 10),
      concentric: parseInt(match[3], 10),
      pauseTop: parseInt(match[4], 10),
      raw: tempo,
    };
  }

  return null;
}

// ============================================================================
// LOADING & METADATA
// ============================================================================

/**
 * Load workout plan and convert to internal format
 * @param data - Workout plan in any supported format
 * @returns Object with schedule and metadata
 * @throws Error if format is unsupported
 */
export function loadWorkoutPlan(data: unknown): LoadedWorkoutPlan {
  if (!validateV2Format(data)) {
    throw new Error('Invalid workout plan format. Only v2.0.0 format is supported.');
  }

  const v2Data = data as V2WorkoutPlan;
  const schedule = convertV2ToInternal(v2Data);

  // Extract metadata from v2.0.0 format
  const metadata: WorkoutPlanMetadata = {
    version: '2.0.0',
    id: v2Data.plan.id,
    name: v2Data.plan.name,
    description: v2Data.plan.description,
    author: v2Data.plan.author,
    durationWeeks: v2Data.plan.durationWeeks,
    goals: v2Data.plan.goals,
    targetLevel: v2Data.plan.targetLevel,
    equipment: v2Data.plan.equipment,
    phases: v2Data.plan.phases.map((p) => ({
      number: p.phaseNumber,
      name: p.name,
      description: p.description,
      startWeek: p.startWeek,
      endWeek: p.endWeek,
      focus: p.focus,
    })),
  };

  return { schedule, metadata };
}

/**
 * Get phase information for a given week
 * @param metadata - Workout plan metadata
 * @param weekNumber - Week number
 * @returns Phase information or null if not available
 */
export function getPhaseForWeek(
  metadata: WorkoutPlanMetadata,
  weekNumber: number
): PhaseMetadata | null {
  if (!metadata.phases) return null;

  return (
    metadata.phases.find(
      (phase) => weekNumber >= phase.startWeek && weekNumber <= phase.endWeek
    ) || null
  );
}

/**
 * Get exercise details from v2.0.0 format
 * @param v2Data - v2.0.0 format data
 * @param weekNumber - Week number
 * @param dayNumber - Day number
 * @returns Array of exercise objects with full details, or null if not found
 */
export function getExercisesWithDetails(
  v2Data: unknown,
  weekNumber: number,
  dayNumber: number
): V2Exercise[] | null {
  if (!validateV2Format(v2Data)) {
    return null;
  }

  // Find the phase containing this week
  const phase = v2Data.plan.phases.find(
    (p) => weekNumber >= p.startWeek && weekNumber <= p.endWeek
  );

  if (!phase) return null;

  // Find the week
  const week = phase.weeks.find((w) => w.weekNumber === weekNumber);
  if (!week) return null;

  // Find the day
  const day = week.days.find((d) => d.dayNumber === dayNumber);
  if (!day) return null;

  return day.exercises ?? null;
}

/**
 * Check if data is in v2.0.0 format
 * @param data - Data to check
 * @returns True if v2.0.0 format
 */
export function isV2Format(data: unknown): data is V2WorkoutPlan {
  return validateV2Format(data);
}

/**
 * Get workout plan summary
 * @param metadata - Workout plan metadata
 * @returns Summary information
 */
export function getPlanSummary(metadata: WorkoutPlanMetadata): PlanSummary {
  return {
    name: metadata.name || 'Workout Plan',
    version: metadata.version,
    weeks: metadata.durationWeeks,
    phases: metadata.phases ? metadata.phases.length : 0,
    goals: metadata.goals || [],
    level: metadata.targetLevel || 'unknown',
    equipment: metadata.equipment || [],
  };
}
