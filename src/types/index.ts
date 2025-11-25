/**
 * Core Type Definitions for OnePlus 12 Pro Tracker
 * 
 * This file contains TypeScript interfaces and types for the main data structures
 * used throughout the application.
 */

// ============================================================================
// EXERCISE TYPES
// ============================================================================

/**
 * Muscle groups that can be targeted by exercises
 */
export type MuscleGroup = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'lats'
  | 'upper_back'
  | 'lower_back'
  | 'hip_flexors'
  | 'adductors'
  | 'abductors'
  | 'traps'
  | 'neck'
  | 'full_body';

/**
 * Equipment types used in exercises
 */
export type Equipment = 
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'bar'
  | 'rings'
  | 'bands'
  | 'bench'
  | 'box'
  | 'foam_roller'
  | 'mat'
  | 'none';

/**
 * Exercise categories for filtering
 */
export type ExerciseCategory = 
  | 'push'
  | 'pull'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'mobility'
  | 'warmup'
  | 'cooldown'
  | 'compound'
  | 'isolation';

/**
 * Exercise definition from the exercise library
 */
export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment[];
  category: ExerciseCategory;
  isBodyweight: boolean;
  variations?: string[];
  instructions?: string[];
  tips?: string[];
}

// ============================================================================
// WORKOUT SCHEDULE TYPES
// ============================================================================

/**
 * Valid training days (Day 4 is always rest)
 */
export type TrainingDay = 1 | 2 | 3 | 5;

/**
 * All possible days including rest
 */
export type WeekDay = 1 | 2 | 3 | 4 | 5;

/**
 * Week number in the 21-week program
 */
export type WeekNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21;

/**
 * Exercise prescription within a workout
 */
export interface ExercisePrescription {
  id: string;
  name: string;
  sets: number;
  reps: string | number;
  notes?: string;
  restSeconds?: number;
  tempo?: string;
  rpe?: number;
}

/**
 * Warmup or cooldown protocol
 */
export interface WarmupCooldown {
  exercises: ExercisePrescription[];
  duration?: number;
  notes?: string;
}

/**
 * A single workout day in the schedule
 */
export interface ScheduleDay {
  week: WeekNumber;
  day: TrainingDay;
  focus?: string;
  warmup?: WarmupCooldown;
  exercises: ExercisePrescription[];
  cooldown?: WarmupCooldown;
  notes?: string;
}

// ============================================================================
// WORKOUT TRACKING TYPES
// ============================================================================

/**
 * RPE (Rate of Perceived Exertion) scale values
 */
export type RPEValue = '6' | '7' | '8' | '9' | '10';

/**
 * RPE data for sets, keyed by set index
 */
export type RPEData = Record<number, RPEValue>;

/**
 * Exercise history entry for tracking completed workouts
 */
export interface ExerciseHistoryEntry {
  date: string;           // ISO date string (YYYY-MM-DD)
  week: WeekNumber;
  day: TrainingDay;
  prescription: string;   // e.g., "3x8 reps"
  sets: boolean[];        // Set completion status
  weight?: string | number;
  rpe?: RPEData;
  notes?: string;
}

/**
 * Map of exercise ID to array of history entries
 */
export type ExerciseHistory = Record<string, ExerciseHistoryEntry[]>;

/**
 * Session storage key format
 */
export type SessionKey = `session_w${WeekNumber}d${TrainingDay}`;

/**
 * Session data stored in localStorage
 */
export interface SessionData {
  week: WeekNumber;
  day: TrainingDay;
  completedSets: Record<string, boolean[]>;
  weights: Record<string, string | number>;
  rpeData: Record<string, RPEData>;
  notes: Record<string, string>;
  lastModified: string;   // ISO timestamp
}

// ============================================================================
// APP STATE TYPES
// ============================================================================

/**
 * Navigation tabs
 */
export type TabId = 'train' | 'library' | 'history' | 'profile';

/**
 * View modes
 */
export type ViewMode = 'tab' | 'workout';

/**
 * Application state stored in URL/localStorage
 */
export interface AppState {
  viewMode: ViewMode;
  activeTab: TabId;
  currentWeek: WeekNumber;
  activeDay: TrainingDay;
}

/**
 * User settings
 */
export interface UserSettings {
  hapticFeedback: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  restTimerDefault: number;
  geminiApiKey?: string;
  showRPE: boolean;
  compactMode: boolean;
}

// ============================================================================
// FIREBASE / CLOUD SYNC TYPES
// ============================================================================

/**
 * Cloud data structure for sync
 */
export interface CloudData {
  sessions?: Record<SessionKey, SessionData>;
  exerciseHistory?: ExerciseHistory;
  settings?: UserSettings;
  lastSyncTime?: string;
}

/**
 * Firebase user info
 */
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

/**
 * Statistics for a single exercise
 */
export interface ExerciseStats {
  totalWorkouts: number;
  totalSets: number;
  maxWeight: number | null;
  maxSets: number;
  estimated1RM: number | null;
  lastWorkout: string | null;
  progressTrend: 'up' | 'down' | 'stable' | 'insufficient_data';
}

/**
 * Volume metrics for a workout or time period
 */
export interface VolumeMetrics {
  totalSets: number;
  totalReps: number;
  totalVolume: number;  // sets * reps * weight
  byMuscleGroup: Record<MuscleGroup, number>;
  byExercise: Record<string, number>;
}

// ============================================================================
// UI COMPONENT PROPS TYPES
// ============================================================================

/**
 * Navigation item configuration
 */
export interface NavItem {
  id: TabId;
  icon: string;
  label: string;
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification data
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic result type for operations that can fail
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Storage operation result
 */
export type StorageResult<T> = Result<T, string>;

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined;

/**
 * Deep partial type helper
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
