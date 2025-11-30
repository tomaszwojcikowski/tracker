/**
 * Workout Session Types
 *
 * Types shared between WorkoutPlayer, CompactExerciseRow, and SupersetGroup components.
 */

import type { RPEValue, AddedExercise } from './index';

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
    [exerciseId: string]: ExerciseLogEntry | AddedExercise[] | string | number | boolean | undefined;
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
