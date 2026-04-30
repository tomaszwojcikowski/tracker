/**
 * Exercise Props Utilities
 *
 * Shared helper functions to extract common prop groups from WorkoutExercise.
 * Used across different view modes (FocusView, CompactExerciseRow, ExerciseCard)
 * to consolidate repeated prop extraction logic.
 */

import type { ExerciseOption, LoadRange, TempoRange } from '../workout-plan-utils';
import type { WorkoutExercise } from '../data/programData';

// ============================================================================
// SHARED PROP TYPES
// ============================================================================

/**
 * Props for exercise options - used across all view modes
 */
export interface ExerciseOptionsProps {
    exerciseOptions?: ExerciseOption[];
    selectedOption?: string;
    onShowOptions?: (exerciseId: string, exerciseName: string, options: ExerciseOption[]) => void;
}

/**
 * Common exercise type flags derived from WorkoutExercise
 */
export interface ExerciseTypeFlags {
    isBodyweight?: boolean;
    isEmom?: boolean;
    isUnilateral?: boolean;
    isAmrap: boolean;
    isLadder: boolean;
    ladderReps?: number[];
    isDensity: boolean;
    densityTimeMinutes?: number;
    densityRepsTotal?: number;
    isFlow?: boolean;
    flowTimeMinutes?: number;
    isTimeBased?: boolean;
    timeSeconds?: number;
    timeMinutes?: number;
}

/**
 * Common exercise metadata props (prescription, notes, ranges, etc.)
 */
export interface ExerciseMetadataProps {
    prescription: string;
    notes?: string;
    coachingNotes?: string;
    restTime?: number;
    loadRange?: LoadRange;
    tempoRange?: TempoRange;
    alternatives?: string[];
    supersetGroup?: number;
    supersetPosition?: 'first' | 'middle' | 'last' | 'only';
}

/**
 * Timer-related props passed to exercise cards
 */
export interface TimerProps {
    emomTimerActive: boolean;
    emomTimerInterval: number;
    onToggleEmomTimer: () => void;
    onStartRestTimer: (seconds: number) => void;
    restTimerActive?: boolean;
    densityTimerActive?: boolean;
    onToggleDensityTimer?: (timeMinutes: number) => void;
    flowTimerActive?: boolean;
    onToggleFlowTimer?: (timeMinutes: number) => void;
}

/**
 * RPE-related props passed to exercise cards
 */
export interface RPEProps {
    rpePrompt: { exerciseId: string; setIndex: number } | null;
    onSaveRPE: (exId: string, setIndex: number, rpe: import('../types').RPEValue) => void;
    onClearRPEPrompt: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract exercise type flags from WorkoutExercise.
 * Consolidates the repeated pattern of extracting isAmrap, isLadder, ladderReps.
 */
export function getExerciseTypeFlags(ex: WorkoutExercise): ExerciseTypeFlags {
    const getTimeSecondsFromRepsRange = (repsRange: WorkoutExercise['repsRange']): number | undefined => {
        if (!repsRange || repsRange.type !== 'time') return undefined;

        // Prefer a single value (seconds), otherwise take the max of a range (or min as a fallback).
        if (typeof repsRange.value === 'number') return repsRange.value;
        if (typeof repsRange.max === 'number') return repsRange.max;
        if (typeof repsRange.min === 'number') return repsRange.min;
        return undefined;
    };

    // Calculate flow time in minutes from repsRange if flow exercise
    let flowTimeMinutes: number | undefined;
    if (ex.isFlow && ex.repsRange?.type === 'time') {
        const seconds = getTimeSecondsFromRepsRange(ex.repsRange);
        if (typeof seconds === 'number') flowTimeMinutes = seconds / 60;
    }

    // Calculate time-based exercise duration for warmup/cooldown exercises
    let timeSeconds: number | undefined;
    let timeMinutes: number | undefined;
    if (ex.repsRange?.type === 'time') {
        timeSeconds = getTimeSecondsFromRepsRange(ex.repsRange);
        if (typeof timeSeconds === 'number') timeMinutes = timeSeconds / 60;
    }

    return {
        isBodyweight: ex.isBodyweight,
        isEmom: ex.isEmom,
        isUnilateral: ex.isUnilateral,
        isAmrap: ex.repsRange?.type === 'amrap',
        isLadder: ex.repsRange?.type === 'ladder',
        ladderReps: ex.repsRange?.type === 'ladder' && Array.isArray(ex.repsRange?.value)
            ? ex.repsRange.value as number[]
            : undefined,
        isDensity: ex.repsRange?.type === 'density',
        densityTimeMinutes: ex.densityTimeMinutes,
        densityRepsTotal: ex.densityRepsTotal,
        isFlow: ex.isFlow,
        flowTimeMinutes,
        isTimeBased: ex.repsRange?.type === 'time',
        timeSeconds,
        timeMinutes,
    };
}

/**
 * Extract exercise metadata props from WorkoutExercise.
 * Consolidates prescription, notes, rest, load/tempo ranges, alternatives, superset info.
 */
export function getExerciseMetadata(ex: WorkoutExercise): ExerciseMetadataProps {
    return {
        prescription: ex.prescription,
        notes: ex.notes,
        coachingNotes: ex.coachingNotes,
        restTime: ex.rest,
        loadRange: ex.loadRange ?? undefined,
        tempoRange: ex.tempoRange ?? undefined,
        alternatives: ex.alternatives,
        supersetGroup: ex.supersetGroup,
        supersetPosition: ex.supersetPosition,
    };
}

/**
 * Create exercise options props for a specific exercise.
 * Used to pass exerciseOptions, selectedOption, and onShowOptions together.
 */
export function createExerciseOptionsProps(
    ex: WorkoutExercise,
    selectedExerciseOptions: Record<string, string>,
    exId: string,
    onShowOptions?: (exerciseId: string, exerciseName: string, options: ExerciseOption[]) => void
): ExerciseOptionsProps {
    return {
        exerciseOptions: ex.exerciseOptions,
        selectedOption: selectedExerciseOptions[exId],
        onShowOptions,
    };
}

/**
 * Create timer props from timer hook states.
 * Used to pass emom, density, flow, and rest timer state/callbacks together.
 */
export function createTimerProps(
    emomTimer: { active: boolean; interval: number; toggle: () => void },
    restTimer: { start: (seconds: number) => void; active?: boolean },
    densityTimer?: { active: boolean; toggle: (minutes: number) => void },
    flowTimer?: { active: boolean; toggle: (minutes: number) => void }
): TimerProps {
    return {
        emomTimerActive: emomTimer.active,
        emomTimerInterval: emomTimer.interval,
        onToggleEmomTimer: emomTimer.toggle,
        onStartRestTimer: restTimer.start,
        restTimerActive: restTimer.active,
        densityTimerActive: densityTimer?.active,
        onToggleDensityTimer: densityTimer?.toggle,
        flowTimerActive: flowTimer?.active,
        onToggleFlowTimer: flowTimer?.toggle,
    };
}

/**
 * Create RPE props from component state/callbacks.
 * Used to pass RPE prompt state and handlers together.
 */
export function createRPEProps(
    rpePrompt: { exerciseId: string; setIndex: number } | null,
    onSaveRPE: (exId: string, setIndex: number, rpe: import('../types').RPEValue) => void,
    onClearRPEPrompt: () => void
): RPEProps {
    return {
        rpePrompt,
        onSaveRPE,
        onClearRPEPrompt,
    };
}

// ============================================================================
// SET ACTION CALLBACKS
// ============================================================================

/**
 * Set action callbacks - onToggleSet, onAddSet, onCompleteAllSets
 */
export interface SetActionCallbacks {
    onToggleSet: (exId: string, setIndex: number, defaultSets: number, restTime?: number, sectionType?: string, isEmom?: boolean) => void;
    onAddSet: (exId: string, defaultSets: number) => void;
    onCompleteAllSets: (exId: string, defaultSets: number) => void;
}

/**
 * Save callbacks - onSaveWeight, onSaveNotes, plus per-set overrides
 */
export interface SaveCallbacks {
    onSaveWeight: (exId: string, weight: string) => void;
    onSaveNotes: (exId: string, notes: string) => void;
    /** v3 set-table: per-set weight override */
    onSaveSetWeight?: (exId: string, setIndex: number, value: string) => void;
    /** v3 set-table: per-set rep count */
    onSaveSetReps?: (exId: string, setIndex: number, reps: number | undefined) => void;
}

/**
 * Navigation callbacks - onShowHistory, onShowAlternatives
 */
export interface NavigationCallbacks {
    onShowHistory: (request: import('../types/workout').ExerciseDetailRequest) => void;
    onShowAlternatives: (name: string, alternatives: string[]) => void;
}

/**
 * Create save callbacks from a generic saveLog function.
 * Wraps saveLog to provide typed onSaveWeight and onSaveNotes.
 * The saveLog parameter accepts any function that can handle 'weight' and 'notes' fields.
 */
export function createSaveCallbacks<T extends (id: string, field: string, value: unknown) => void>(
    saveLog: T
): SaveCallbacks {
    return {
        onSaveWeight: (id, weight) => saveLog(id, 'weight', weight),
        onSaveNotes: (id, notes) => saveLog(id, 'notes', notes),
    };
}
