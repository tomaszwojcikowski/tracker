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
  /** Parsed reps range */
  repsRange?: RepsRange;
  /** Parsed tempo range */
  tempoRange?: TempoRange;
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
 * Get workout data for a specific week and day
 */
export function getWorkoutForDay(week: number, day: number): DayWorkout {
  const schedule = getCompleteSchedule();
  const dayExercises = schedule.filter((i) => i.w === week && i.d === day);

  if (dayExercises.length === 0) {
    return { title: 'Rest Day', sections: [] };
  }

  const finalSections: WorkoutSection[] = [];
  let currentSection: WorkoutSection | null = null;

  dayExercises.forEach((item) => {
    const sectionName = item.n || 'Main Work';

    // Start new section if needed
    if (!currentSection || currentSection.name !== sectionName) {
      const n = sectionName.toLowerCase();
      let type: WorkoutSection['type'] = 'main';
      if (n.includes('warm-up')) type = 'prep';
      else if (n.includes('cool-down')) type = 'cool';
      else if (
        item.ex.toLowerCase().includes('skill') ||
        n.includes('practice')
      )
        type = 'skill';
      else if (n.includes('accessory') || n.includes('core')) type = 'access';

      currentSection = {
        type,
        name: sectionName,
        exercises: [],
      };
      finalSections.push(currentSection);
    }

    // Determine if exercise is weighted based on loadRange
    // If loadRange exists with kg unit and min > 0, it's a weighted exercise
    const loadRange = item.loadRange;
    const isWeighted =
      loadRange && loadRange.unit === 'kg' && loadRange.min > 0;

    currentSection.exercises.push({
      name: item.ex,
      prescription: `${item.s} x ${item.r}`,
      notes: item.n || '',
      sets: item.s,
      rest: 90,
      isBodyweight: !isWeighted,
      load: item.load || undefined,
      loadRange: loadRange || undefined,
      repsRange: item.repsRange || undefined,
      tempoRange: item.tempoRange || undefined,
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
