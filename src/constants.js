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

// Validation
export const VALID_TABS = ['train', 'library', 'history', 'profile'];
export const VALID_DAYS = [1, 2, 3, 5]; // Day 4 is rest
export const VALID_VIEW_MODES = ['tab', 'workout'];

// Defaults
export const DEFAULT_WEEK = 1;
export const DEFAULT_DAY = 1;
export const DEFAULT_TAB = 'train';

// Storage keys
export const STORAGE_KEYS = {
    APP_STATE: 'tracker_app_state',
    EXERCISE_HISTORY: 'exercise_history',
    GLOBAL_HISTORY: 'global_history',
    FIREBASE_SYNC_ENABLED: 'firebase_sync_enabled',
    FIREBASE_LAST_SYNC: 'firebase_last_sync_time',
    EMOM_INTERVAL: 'emom_interval',
    TRACKER_WEEK: 'tracker_week'
};

// Training blocks
export const PROGRAM_BLOCKS = [
    { id: 1, name: "Foundation", weeks: [1, 2, 3, 4] },
    { id: 2, name: "Intensification", weeks: [5, 6, 7, 8] },
    { id: 3, name: "Neutral Grip", weeks: [9, 10, 11, 12] },
    { id: 4, name: "Accumulation", weeks: [13, 14, 15, 16] },
    { id: 5, name: "Peak & Taper", weeks: [17, 18, 19, 20] },
    { id: 6, name: "Reload", weeks: [21] }
];
