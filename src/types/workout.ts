/**
 * Workout Session Types
 *
 * Types shared between WorkoutPlayer, CompactExerciseRow, and SupersetGroup components.
 */

import type { RPEValue, AddedExercise, ExerciseOption } from './index';
import type { LoadRange, TempoRange } from '../workout-plan-utils';

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
    /** User's personal notes for this specific exercise in this workout session */
    userNotes?: string;
    /**
     * @deprecated Legacy field - use userNotes instead.
     * This field is maintained for backward compatibility with existing stored data.
     * Will be removed in a future major version (v2.0.0+).
     */
    notes?: string;
    /** Rep chunks for density exercises (v2.5+) - array of rep counts (e.g., [5, 3, 4] = 12 total) */
    densityRepChunks?: number[];
    /** Whether the density exercise is marked as complete (v2.5+) */
    densityComplete?: boolean;
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
    /** Whether the exercise is AMRAP (as many reps as possible) */
    isAmrap?: boolean;
    /** Whether the exercise uses ladder reps (e.g., 1-2-3) */
    isLadder?: boolean;
    /** Whether this is a mobility flow exercise (v2.4+) */
    isFlow?: boolean;
    /** Whether this is a density exercise (v2.5+) */
    isDensity?: boolean;
    /** Total time in minutes for density exercises (v2.5+) */
    densityTimeMinutes?: number;
    /** Total reps target for density exercises (v2.5+) */
    densityRepsTotal?: number;
    /** Suggested load range */
    loadRange?: LoadRange | null;
    /** Tempo for the exercise (eccentric-pauseBottom-concentric-pauseTop) */
    tempoRange?: TempoRange | null;
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
    /** Exercise ID for looking up current session notes */
    exerciseId?: string;
    /** Current user notes for this exercise in this session */
    currentUserNotes?: string;
    /** Callback to update user notes */
    onUpdateUserNotes?: (exerciseId: string, notes: string) => void;
    /** Available exercise options */
    exerciseOptions?: ExerciseOption[];
    /** Currently selected option name */
    selectedOption?: string;
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
    /** Selected exercise options keyed by exercise ID */
    exerciseOptions?: Record<string, string>;
    /** Active timer state for in-progress workouts (synced to cloud) */
    timerState?: {
        /** Elapsed time in seconds */
        elapsedSeconds: number;
        /** Whether timer is currently running */
        isRunning: boolean;
        /** Timestamp when timer was started or resumed (for accurate time tracking) */
        startedAt: number | null;
    };
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
