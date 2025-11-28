// Data modules
export {
  PROGRAM_DATA,
  getBlockForWeek,
  getWorkoutForDay,
} from './programData';

// Type exports
export type {
  ProgramBlock,
  WorkoutExercise,
  WorkoutSection,
  DayWorkout,
} from './programData';

/**
 * @deprecated PROGRAM_BLOCKS has been removed.
 *
 * The static PROGRAM_BLOCKS array has been removed in favor of dynamic phase data
 * loaded from workout-plan-v2.json metadata at runtime.
 *
 * Use `getBlockForWeek(week)` instead to get the training block for a specific week.
 * This function reads phase data from `window.TRACKER_APP.workoutPlanMetadata.phases`.
 *
 * Example migration:
 * ```typescript
 * // Before (deprecated):
 * const block = PROGRAM_BLOCKS.find(b => b.weeks.includes(currentWeek));
 *
 * // After (recommended):
 * import { getBlockForWeek } from '@/data';
 * const block = getBlockForWeek(currentWeek);
 * ```
 */
