/**
 * Application Constants
 *
 * Centralized configuration values used throughout the app.
 */

// Set limits
export const MAX_SETS = 20;
export const MAX_WEIGHT_KG = 999;
export const WEIGHT_INCREMENT_KG = 2.5;
export const WEIGHT_STEP = 0.5;

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
export type TabName = 'train' | 'library' | 'history' | 'coach' | 'profile';

/**
 * Valid view modes
 */
export type ViewMode = 'tab' | 'workout';

/**
 * Valid workout days (Day 4 is rest)
 */
export type WorkoutDay = 1 | 2 | 3 | 5;

// Validation arrays
export const VALID_TABS: TabName[] = [
  'train',
  'library',
  'history',
  'coach',
  'profile',
];
export const VALID_DAYS: WorkoutDay[] = [1, 2, 3, 5]; // Day 4 is rest
export const VALID_VIEW_MODES: ViewMode[] = ['tab', 'workout'];

// Defaults
export const DEFAULT_WEEK = 1;
export const DEFAULT_DAY: WorkoutDay = 1;
export const DEFAULT_TAB: TabName = 'train';

/**
 * Storage key names for localStorage
 * 
 * Note: Keys listed here are the base keys. For program-scoped data,
 * use the storageNamespace service to get namespaced keys.
 * 
 * Namespaced keys (program-specific data):
 * - EXERCISE_HISTORY, GLOBAL_HISTORY, and session keys are scoped per program
 * 
 * Global keys (shared across programs):
 * - APP_STATE, FIREBASE_*, EMOM_INTERVAL, TRACKER_WEEK
 */
export interface StorageKeysMap {
  APP_STATE: string;
  EXERCISE_HISTORY: string;
  GLOBAL_HISTORY: string;
  FIREBASE_SYNC_ENABLED: string;
  FIREBASE_LAST_SYNC: string;
  EMOM_INTERVAL: string;
  TRACKER_WEEK: string;
  /** Storage migration status key */
  MIGRATION_STATUS: string;
  /** Program registry key */
  PROGRAM_REGISTRY: string;
  /** Active program key */
  ACTIVE_PROGRAM: string;
}

// Storage keys
export const STORAGE_KEYS: StorageKeysMap = {
  APP_STATE: 'tracker_app_state',
  EXERCISE_HISTORY: 'exercise_history',
  GLOBAL_HISTORY: 'global_history',
  FIREBASE_SYNC_ENABLED: 'firebase_sync_enabled',
  FIREBASE_LAST_SYNC: 'firebase_last_sync_time',
  EMOM_INTERVAL: 'emom_interval',
  TRACKER_WEEK: 'tracker_week',
  MIGRATION_STATUS: 'tracker_storage_migration_v1',
  PROGRAM_REGISTRY: 'tracker_program_registry',
  ACTIVE_PROGRAM: 'tracker_active_program',
};

// Training blocks removed - now loaded from window.TRACKER_APP.workoutPlanMetadata.phases at runtime
// See src/data/programData.ts getBlockForWeek() for implementation

/**
 * Short names for long exercise names to improve compact row display
 * Used when the full name would overflow the available space
 */
export const EXERCISE_SHORT_NAMES: Record<string, string> = {
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
