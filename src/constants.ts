/**
 * Application Constants
 *
 * Centralized configuration values used throughout the app.
 */

// Set limits
export const MAX_SETS = 20;

// Timing
export const FETCH_TIMEOUT_MS = 10000;
export const DEBOUNCE_DELAY_MS = 300;

// Time calculations
export const MS_PER_MINUTE = 60 * 1000;
export const MS_PER_HOUR = 60 * 60 * 1000;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Valid tab names in the application
 */
export type TabName = 'train' | 'library' | 'history' | 'profile';

/**
 * Valid view modes
 */
export type ViewMode = 'tab' | 'workout' | 'empty-workout';

/**
 * Valid workout days (Day 4 is rest)
 */
export type WorkoutDay = 1 | 2 | 3 | 5;

// Validation arrays
export const VALID_TABS: TabName[] = [
  'train',
  'library',
  'history',
  'profile',
];
export const VALID_DAYS: WorkoutDay[] = [1, 2, 3, 5]; // Day 4 is rest
export const VALID_VIEW_MODES: ViewMode[] = ['tab', 'workout', 'empty-workout'];

// Defaults
export const DEFAULT_WEEK = 1;
export const DEFAULT_DAY: WorkoutDay = 1;
export const DEFAULT_TAB: TabName = 'train';

/**
 * Short names for long exercise names to improve compact row display
 * Used when the full name would overflow the available space
 */
const EXERCISE_SHORT_NAMES: Record<string, string> = {
  'Bulgarian Split Squat': 'BSS',
  'Bulgarian Split Squat (Left)': 'BSS (L)',
  'Bulgarian Split Squat (Right)': 'BSS (R)',
  'Scapular Pull-Ups (3s ISO-HOLD)': 'Scap Pull-Ups',
  'Light Weighted Jefferson Curl': 'Jefferson Curl',
  "Butcher's Block Stretch": 'Butcher Block',
  'Ground-Based Flutter Kicks': 'Flutter Kicks',
  'Neutral Grip Weighted Pull-Ups': 'Neutral Pull-Ups',
  'Dragon Flags OR Weighted V-Ups': 'Dragon Flags',
  'Max Quality Archer Negatives': 'Archer Negs',
  'Cluster Pull-Ups (Neutral)': 'Cluster Pull-Ups',
  'Weighted Hollow Rocks': 'W. Hollow Rocks',
  'Band External Rotations': 'Ext. Rotations',
  'Passive Dead Hang': 'Dead Hang',
  'Passive Bar Hang': 'Bar Hang',
  'Wrist Extensor Stretch': 'Wrist Stretch',
  'Standing Quad Stretch': 'Quad Stretch',
  'Banded Pec Stretch': 'Pec Stretch',
  '90/90 Hip Rotations': '90/90 Hip Rot.',
};

/**
 * Get the short name for an exercise, or return the original if no short name exists
 */
export function getShortExerciseName(name: string): string {
  return EXERCISE_SHORT_NAMES[name] || name;
}
