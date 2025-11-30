/**
 * Program Data Module
 *
 * Contains workout program structure and helper functions.
 */

import { getCompleteSchedule } from '../utils/schedule';
import type { LoadRange, RepsRange, TempoRange } from '../workout-plan-utils';

/**
 * Program block definition
 */
export interface ProgramBlock {
  id: number;
  name: string;
  weeks: number[];
}

/**
 * Exercise in a workout section
 */
export interface WorkoutExercise {
  name: string;
  prescription: string;
  notes: string;
  sets: number;
  rest: number;
  isBodyweight: boolean;
  /** Load/weight string for weighted exercises (e.g., "10kg", "5-10kg", "light band") */
  load?: string;
  /** Parsed load range for weighted exercises */
  loadRange?: LoadRange;
  /** Parsed reps range (includes type which can be 'amrap') */
  repsRange?: RepsRange;
  /** Parsed tempo range */
  tempoRange?: TempoRange;
  /** Whether this exercise is an EMOM exercise */
  isEmom?: boolean;
  /** Superset group ID (consecutive EMOM exercises share the same group ID) */
  supersetGroup?: number;
  /** Position within superset: 'first', 'middle', 'last', or 'only' */
  supersetPosition?: 'first' | 'middle' | 'last' | 'only';
  /** Array of alternative exercise names */
  alternatives?: string[];
}

/**
 * Section of a workout (e.g., Warm Up, Main Work)
 */
export interface WorkoutSection {
  type: 'prep' | 'skill' | 'main' | 'access' | 'cool';
  name: string;
  exercises: WorkoutExercise[];
}

/**
 * Complete workout for a day
 */
export interface DayWorkout {
  title: string;
  sections: WorkoutSection[];
}

/**
 * Get the block for a given week
 */
export function getBlockForWeek(week: number): ProgramBlock | undefined {
  // Try to get from loaded metadata first
  if (typeof window !== 'undefined' && window.TRACKER_APP?.workoutPlanMetadata?.phases) {
    const phase = window.TRACKER_APP.workoutPlanMetadata.phases.find(
      (p) => week >= p.startWeek && week <= p.endWeek
    );
    if (phase) {
      return {
        id: phase.number,
        name: phase.name,
        weeks: Array.from({ length: phase.endWeek - phase.startWeek + 1 }, (_, i) => phase.startWeek + i),
      };
    }
  }

  return undefined;
}

/**
 * Check if an exercise is an EMOM exercise based on notes or name (fallback for legacy data)
 */
function detectEmomFromText(name: string, notes: string): boolean {
  const combinedText = `${name} ${notes}`.toLowerCase();
  return combinedText.includes('emom');
}

/**
 * Get workout data for a specific week and day
 */
export function getWorkoutForDay(week: number, day: number): DayWorkout {
  const schedule = getCompleteSchedule();
  const dayExercises = schedule.filter((i) => i.w === week && i.d === day);

  if (dayExercises.length === 0) {
    return { title: 'Rest Day', sections: [] };
  }

  // Map category to section name and type
  const categoryToSection: Record<string, { name: string; type: WorkoutSection['type'] }> = {
    warmup: { name: 'Warm-up', type: 'prep' },
    skill: { name: 'Skill Practice', type: 'skill' },
    main: { name: 'Main Work', type: 'main' },
    accessory: { name: 'Accessory', type: 'access' },
    core: { name: 'Core', type: 'access' },
    mobility: { name: 'Mobility', type: 'cool' },
    cooldown: { name: 'Cool-down', type: 'cool' },
  };

  const finalSections: WorkoutSection[] = [];
  let currentSection: WorkoutSection | null = null;

  dayExercises.forEach((item) => {
    // Use category for section grouping, fall back to detecting from notes for legacy data
    const category = item.category?.toLowerCase() || '';
    const sectionInfo = categoryToSection[category] || { name: 'Main Work', type: 'main' as const };

    // Start new section if needed (group by category)
    if (!currentSection || currentSection.name !== sectionInfo.name) {
      currentSection = {
        type: sectionInfo.type,
        name: sectionInfo.name,
        exercises: [],
      };
      finalSections.push(currentSection);
    }

    // Determine if exercise is weighted based on loadRange
    // If loadRange exists with kg unit and min > 0, it's a weighted exercise
    const loadRange = item.loadRange;
    const isWeighted =
      loadRange && loadRange.unit === 'kg' && loadRange.min > 0;

    // Use isEmom from data if available, otherwise detect from text (fallback for legacy data)
    const isEmom = item.isEmom ?? detectEmomFromText(item.ex, item.n || '');

    // Use restSeconds from data if available, otherwise default to 90
    const restTime = item.restSeconds ?? 90;

    currentSection.exercises.push({
      name: item.ex,
      prescription: `${item.s} x ${item.r}`,
      notes: item.n || '',
      sets: item.s,
      rest: restTime,
      isBodyweight: !isWeighted,
      load: item.load || undefined,
      loadRange: loadRange || undefined,
      repsRange: item.repsRange || undefined,
      tempoRange: item.tempoRange || undefined,
      isEmom,
      // Use supersetGroup from data directly if available
      supersetGroup: item.supersetGroup,
      // Pass through alternatives
      alternatives: item.alternatives,
    });
  });

  // Second pass: Assign superset groups to consecutive EMOM exercises within each section
  finalSections.forEach((section) => {
    let currentSupersetGroup = 0;
    let groupStartIdx = -1;

    section.exercises.forEach((ex, idx) => {
      if (ex.isEmom) {
        if (groupStartIdx === -1) {
          // Start a new potential superset group
          groupStartIdx = idx;
          currentSupersetGroup++;
        }
        ex.supersetGroup = currentSupersetGroup;
      } else {
        // End of superset group
        if (groupStartIdx !== -1) {
          // Finalize the previous group
          groupStartIdx = -1;
        }
      }
    });

    // Third pass: Assign superset positions
    const groupCounts: Record<number, number> = {};
    const groupIndices: Record<number, number[]> = {};

    section.exercises.forEach((ex, idx) => {
      if (ex.supersetGroup) {
        if (!groupCounts[ex.supersetGroup]) {
          groupCounts[ex.supersetGroup] = 0;
          groupIndices[ex.supersetGroup] = [];
        }
        groupCounts[ex.supersetGroup]++;
        groupIndices[ex.supersetGroup].push(idx);
      }
    });

    // Assign positions within each group
    Object.entries(groupIndices).forEach(([, indices]) => {
      const count = indices.length;
      if (count === 1) {
        // Single EMOM exercise - not a superset
        section.exercises[indices[0]].supersetPosition = 'only';
        // Remove superset group for single exercises (not a true superset)
        section.exercises[indices[0]].supersetGroup = undefined;
      } else {
        indices.forEach((exIdx, posIdx) => {
          if (posIdx === 0) {
            section.exercises[exIdx].supersetPosition = 'first';
          } else if (posIdx === count - 1) {
            section.exercises[exIdx].supersetPosition = 'last';
          } else {
            section.exercises[exIdx].supersetPosition = 'middle';
          }
        });
      }
    });
  });

  return { title: `Week ${week} Day ${day}`, sections: finalSections };
}

/**
 * PROGRAM_DATA object for backward compatibility
 */
export const PROGRAM_DATA = {
  getWorkout: getWorkoutForDay,
};
