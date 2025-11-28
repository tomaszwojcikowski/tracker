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
 */
export interface StorageKeysMap {
  APP_STATE: string;
  EXERCISE_HISTORY: string;
  GLOBAL_HISTORY: string;
  FIREBASE_SYNC_ENABLED: string;
  FIREBASE_LAST_SYNC: string;
  EMOM_INTERVAL: string;
  TRACKER_WEEK: string;
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
};

// Training blocks removed - use window.TRACKER_APP.workoutPlanMetadata.phases or src/data/programData.ts fallbacks

