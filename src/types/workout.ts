/**
 * Workout Session Types
 *
 * Types shared between WorkoutPlayer, CompactExerciseRow, and SupersetGroup components.
 */

import type { RPEValue, AddedExercise } from './index';
import type { LoadRange } from '../workout-plan-utils';

// ============================================================================
// SESSION DATA TYPES
// ============================================================================

/**
 * RPE data for sets, keyed by set index
 */
export type RPEData = Record<number, RPEValue>;

/**
 * Exercise log entry within a workout session
 */
export interface ExerciseLogEntry {
    sets?: boolean[];
    weight?: string;
    rpe?: RPEData;
}

/**
 * Request payload for showing exercise details in the workout player
 */
export interface ExerciseDetailMetadata {
    /** Programmed prescription text */
    prescription?: string;
    /** Optional exercise notes */
    notes?: string;
    /** Rest time in seconds */
    restTime?: number;
    /** Whether the exercise is bodyweight */
    isBodyweight?: boolean;
    /** Whether the exercise follows an EMOM structure */
    isEmom?: boolean;
    /** Whether the exercise is unilateral */
    isUnilateral?: boolean;
    /** Suggested load range */
    loadRange?: LoadRange | null;
}

export interface ExerciseDetailRequest {
    /** Name currently displayed to the user (handles swaps/aliases) */
    displayName: string;
    /** Name to use when looking up history entries */
    historyLookupName: string;
    /** Original programmed exercise name */
    originalName: string;
    /** Optional alternative exercises available for swapping */
    alternatives?: string[];
    /** Whether the exercise is currently swapped to an alternative */
    isSwapped?: boolean;
    /** Optional metadata for detail view */
    metadata?: ExerciseDetailMetadata;
}

/**
 * Workout session data stored in localStorage
 */
export interface WorkoutSessionData {
    completed?: boolean;
    completedAt?: string;
    lastModified?: string;
    week?: number;
    day?: number;
    workoutNotes?: string;
    addedExercises?: AddedExercise[];
    /** Workout duration in seconds */
    durationSeconds?: number;
    /** Exercise log entries keyed by exercise ID */
    exercises?: Record<string, ExerciseLogEntry>;
}

// ============================================================================
// MUSCLE FILTER TYPES
// ============================================================================

/**
 * Available muscle filter options for exercise selector
 */
export const MUSCLE_FILTERS = [
    'all',
    'pull',
    'push',
    'legs',
    'core',
    'cardio',
    'skill',
    'arms',
    'shoulders',
    'olympic',
    'functional',
    'plyometric',
    'mobility',
] as const;

export type MuscleFilter = (typeof MUSCLE_FILTERS)[number];

// ============================================================================
// TIMER TYPES
// ============================================================================

/**
 * Rest timer state
 */
export interface RestTimerState {
    seconds: number;
    active: boolean;
    showToast: boolean;
}

/**
 * EMOM timer state
 */
export interface EmomTimerState {
    seconds: number;
    active: boolean;
    interval: number;
}

// ============================================================================
// WORKOUT PROGRESS TYPES
// ============================================================================

/**
 * Workout progress tracking
 */
export interface WorkoutProgress {
    completedSets: number;
    totalSets: number;
}
