/**
 * useWorkoutSession Hook
 *
 * Manages workout session state including logs, set toggling, RPE tracking,
 * weight changes, and persistence to localStorage.
 *
 * This hook extracts common session management logic used by both regular
 * and compact workout views.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { safeGetJSON, safeSetJSON } from '../utils/storage';
import {
    getExerciseLogEntry,
    normalizeAddedExercises,
    getExerciseId,
    getAddedExerciseId,
} from '../utils/workoutSession';
import type { WorkoutSessionData, ExerciseLogEntry, RPEData, WorkoutProgress } from '../types/workout';
import type { AddedExercise, RPEValue, Exercise } from '../types';
import type { WorkoutSection } from '../data/programData';
import { MAX_SETS } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

export interface UseWorkoutSessionOptions {
    /** Week number (0 for empty workouts) */
    week: number;
    /** Day number (0 for empty workouts) */
    day: number;
    /** Whether this is an empty/custom workout */
    isEmptyWorkout?: boolean;
    /** Workout sections from program data */
    sections: WorkoutSection[];
}

export interface UseWorkoutSessionReturn {
    /** Current session key */
    sessionKey: string;
    /** Current workout logs */
    logs: WorkoutSessionData;
    /** Added exercises */
    addedExercises: AddedExercise[];
    /** Workout notes */
    workoutNotes: string;
    /** Set workout notes */
    setWorkoutNotes: (notes: string) => void;
    /** Workout progress */
    workoutProgress: WorkoutProgress;
    /** First incomplete exercise ID */
    firstIncompleteExerciseId: string | null;
    /** Get exercise log entry */
    getLogEntry: (exerciseId: string) => ExerciseLogEntry;
    /** Toggle a set */
    toggleSet: (
        exId: string,
        setIndex: number,
        defaultSets: number,
        restTime?: number,
        onRestTimerStart?: (seconds: number) => void
    ) => { wasCompleted: boolean; shouldShowRPE: boolean; shouldStartTimer: boolean };
    /** Toggle superset round */
    toggleSupersetRound: (
        exerciseIds: string[],
        roundIndex: number,
        defaultSets: number,
        restTime?: number
    ) => { shouldStartTimer: boolean };
    /** Save RPE for a set */
    saveRPE: (exId: string, setIndex: number, rpe: RPEValue) => void;
    /** Add a set to an exercise */
    addSet: (exId: string, defaultSets: number) => void;
    /** Save weight for an exercise */
    saveWeight: (exId: string, weight: string) => void;
    /** Complete all sets for an exercise */
    completeAllSets: (exId: string, defaultSets: number) => void;
    /** Complete all sets for superset exercises */
    completeAllSupersetSets: (exerciseIds: string[], defaultSets: number) => void;
    /** Add an exercise to the workout */
    addExerciseToWorkout: (
        exercise: Exercise,
        sets?: number,
        weight?: string,
        rest?: number
    ) => boolean;
    /** Remove an added exercise */
    removeAddedExercise: (exerciseId: string) => void;
    /** Mark workout as complete */
    markComplete: (durationSeconds: number) => WorkoutSessionData;
    /** Persist logs directly */
    persistLogs: (updatedLogs: WorkoutSessionData) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useWorkoutSession({
    week,
    day,
    isEmptyWorkout = false,
    sections,
}: UseWorkoutSessionOptions): UseWorkoutSessionReturn {
    // For empty workouts, generate a unique session key based on timestamp
    const [emptyWorkoutId] = useState(() => {
        if (isEmptyWorkout) {
            const existingKey = sessionStorage.getItem('current_empty_workout_key');
            if (existingKey) {
                return existingKey;
            }
            const newKey = `session_empty_${Date.now()}`;
            sessionStorage.setItem('current_empty_workout_key', newKey);
            return newKey;
        }
        return '';
    });

    const sessionKey = useMemo(() => {
        if (isEmptyWorkout) {
            return emptyWorkoutId;
        }
        return `session_w${week}d${day}`;
    }, [week, day, isEmptyWorkout, emptyWorkoutId]);

    // State
    const [logs, setLogs] = useState<WorkoutSessionData>({});
    const [addedExercises, setAddedExercises] = useState<AddedExercise[]>([]);
    const [workoutNotes, setWorkoutNotesState] = useState('');

    // Load session data on mount
    useEffect(() => {
        const parsedLogs = safeGetJSON<WorkoutSessionData>(sessionKey, {} as WorkoutSessionData);
        if (parsedLogs && typeof parsedLogs === 'object') {
            setLogs(parsedLogs);
            setAddedExercises(normalizeAddedExercises(parsedLogs.addedExercises));
            setWorkoutNotesState(typeof parsedLogs.workoutNotes === 'string' ? parsedLogs.workoutNotes : '');
        } else {
            setLogs({});
            setAddedExercises([]);
            setWorkoutNotesState('');
        }
    }, [sessionKey]);

    // ============================================================================
    // PERSISTENCE
    // ============================================================================

    const persistLogs = useCallback((updatedLogs: WorkoutSessionData): void => {
        setLogs(updatedLogs);
        const success = safeSetJSON(sessionKey, updatedLogs);
        if (!success) {
            alert('Failed to save progress. Your storage might be full.');
        }
    }, [sessionKey]);

    const saveLog = useCallback((
        id: string,
        field: keyof ExerciseLogEntry,
        value: ExerciseLogEntry[keyof ExerciseLogEntry]
    ): void => {
        setLogs(prevLogs => {
            const currentEntry = getExerciseLogEntry(prevLogs, id);
            const updatedExercises = {
                ...(prevLogs.exercises ?? {}),
                [id]: {
                    ...currentEntry,
                    [field]: value,
                },
            };
            const updatedLogs: WorkoutSessionData = {
                ...prevLogs,
                exercises: updatedExercises,
                lastModified: new Date().toISOString(),
            };
            const success = safeSetJSON(sessionKey, updatedLogs);
            if (!success) {
                alert('Failed to save progress. Your storage might be full.');
            }
            return updatedLogs;
        });
    }, [sessionKey]);

    // ============================================================================
    // WORKOUT NOTES
    // ============================================================================

    const setWorkoutNotes = useCallback((notes: string): void => {
        setWorkoutNotesState(notes);
        setLogs(prevLogs => {
            const updatedLogs: WorkoutSessionData = {
                ...prevLogs,
                workoutNotes: notes,
                lastModified: new Date().toISOString(),
            };
            safeSetJSON(sessionKey, updatedLogs);
            return updatedLogs;
        });
    }, [sessionKey]);

    // ============================================================================
    // SET TOGGLE
    // ============================================================================

    const toggleSet = useCallback((
        exId: string,
        setIndex: number,
        defaultSets: number,
        restTime?: number
    ): { wasCompleted: boolean; shouldShowRPE: boolean; shouldStartTimer: boolean } => {
        if (!exId || setIndex < 0 || !Number.isInteger(setIndex)) {
            console.error('Invalid set toggle parameters:', { exId, setIndex, defaultSets });
            return { wasCompleted: false, shouldShowRPE: false, shouldStartTimer: false };
        }

        let result = { wasCompleted: false, shouldShowRPE: false, shouldStartTimer: false };

        setLogs(prevLogs => {
            const currentEntry = getExerciseLogEntry(prevLogs, exId);
            const currentSets = currentEntry.sets || new Array(defaultSets).fill(false);
            const newSets = [...currentSets];
            while (newSets.length <= setIndex) newSets.push(false);
            const wasCompleted = newSets[setIndex];
            newSets[setIndex] = !newSets[setIndex];

            // Build updated entry
            let updatedEntry: ExerciseLogEntry = {
                ...currentEntry,
                sets: newSets,
            };

            // Clear RPE if uncompleting a set
            if (wasCompleted && !newSets[setIndex]) {
                const currentRPEs: RPEData = { ...(currentEntry.rpe ?? {}) };
                if (currentRPEs[setIndex]) {
                    const updatedRPEs: RPEData = { ...currentRPEs };
                    delete updatedRPEs[setIndex];
                    updatedEntry = {
                        ...updatedEntry,
                        rpe: updatedRPEs,
                    };
                }
            }

            const updatedLogs: WorkoutSessionData = {
                ...prevLogs,
                exercises: {
                    ...(prevLogs.exercises ?? {}),
                    [exId]: updatedEntry,
                },
                lastModified: new Date().toISOString(),
            };

            // Determine if we should start timer
            let shouldStartTimer = false;
            if (!wasCompleted && newSets[setIndex]) {
                if (typeof restTime === 'number' && restTime > 0) {
                    const totalSets = newSets.length;
                    const completedSetsCount = newSets.filter(Boolean).length;
                    const hasIncompleteSets = completedSetsCount < totalSets;
                    shouldStartTimer = hasIncompleteSets;
                }
            }

            result = {
                wasCompleted,
                shouldShowRPE: !wasCompleted && newSets[setIndex],
                shouldStartTimer,
            };

            safeSetJSON(sessionKey, updatedLogs);
            return updatedLogs;
        });

        return result;
    }, [sessionKey]);

    const toggleSupersetRound = useCallback((
        exerciseIds: string[],
        roundIndex: number,
        defaultSets: number,
        restTime?: number
    ): { shouldStartTimer: boolean } => {
        if (!exerciseIds.length || roundIndex < 0 || !Number.isInteger(roundIndex)) {
            console.error('Invalid superset toggle parameters:', { exerciseIds, roundIndex, defaultSets });
            return { shouldStartTimer: false };
        }

        let result = { shouldStartTimer: false };

        setLogs(prevLogs => {
            const updatedExercises = { ...(prevLogs.exercises ?? {}) };
            let anyWasIncomplete = false;
            let hasIncompleteSetsAfter = false;

            exerciseIds.forEach((exId) => {
                const currentEntry = getExerciseLogEntry(prevLogs, exId);
                const currentSets = currentEntry.sets || new Array(defaultSets).fill(false);
                const newSets = [...currentSets];
                while (newSets.length <= roundIndex) newSets.push(false);

                const wasCompleted = newSets[roundIndex];
                if (!wasCompleted) anyWasIncomplete = true;

                newSets[roundIndex] = !newSets[roundIndex];

                const completedSetsCount = newSets.filter(Boolean).length;
                if (completedSetsCount < newSets.length) hasIncompleteSetsAfter = true;

                // Build updated entry
                let updatedEntry: ExerciseLogEntry = {
                    ...currentEntry,
                    sets: newSets,
                };

                // Clear RPE if uncompleting
                if (wasCompleted && !newSets[roundIndex]) {
                    const currentRPEs: RPEData = { ...(currentEntry.rpe ?? {}) };
                    if (currentRPEs[roundIndex]) {
                        const updatedRPEs: RPEData = { ...currentRPEs };
                        delete updatedRPEs[roundIndex];
                        updatedEntry = {
                            ...updatedEntry,
                            rpe: updatedRPEs,
                        };
                    }
                }

                updatedExercises[exId] = updatedEntry;
            });

            const updatedLogs: WorkoutSessionData = {
                ...prevLogs,
                exercises: updatedExercises,
                lastModified: new Date().toISOString(),
            };

            // Start timer if completing and there are incomplete sets remaining
            if (anyWasIncomplete && typeof restTime === 'number' && restTime > 0 && hasIncompleteSetsAfter) {
                result = { shouldStartTimer: true };
            }

            safeSetJSON(sessionKey, updatedLogs);
            return updatedLogs;
        });

        return result;
    }, [sessionKey]);

    // ============================================================================
    // RPE
    // ============================================================================

    const saveRPE = useCallback((exId: string, setIndex: number, rpe: RPEValue): void => {
        setLogs(prevLogs => {
            const currentEntry = getExerciseLogEntry(prevLogs, exId);
            const currentRPEs: RPEData = { ...(currentEntry.rpe ?? {}) };
            const updatedRPEs: RPEData = { ...currentRPEs, [setIndex]: rpe };
            const updatedLogs: WorkoutSessionData = {
                ...prevLogs,
                exercises: {
                    ...(prevLogs.exercises ?? {}),
                    [exId]: {
                        ...currentEntry,
                        rpe: updatedRPEs,
                    },
                },
                lastModified: new Date().toISOString(),
            };
            safeSetJSON(sessionKey, updatedLogs);
            return updatedLogs;
        });
    }, [sessionKey]);

    // ============================================================================
    // SETS
    // ============================================================================

    const addSet = useCallback((exId: string, defaultSets: number): void => {
        const currentSets = getExerciseLogEntry(logs, exId).sets || new Array(defaultSets).fill(false);
        saveLog(exId, 'sets', [...currentSets, false]);
    }, [logs, saveLog]);

    const saveWeight = useCallback((exId: string, weight: string): void => {
        saveLog(exId, 'weight', weight);
    }, [saveLog]);

    const completeAllSets = useCallback((exId: string, defaultSets: number): void => {
        const allCompleted = new Array(defaultSets).fill(true);
        saveLog(exId, 'sets', allCompleted);
    }, [saveLog]);

    const completeAllSupersetSets = useCallback((exerciseIds: string[], defaultSets: number): void => {
        const allCompleted = new Array(defaultSets).fill(true);

        setLogs(prevLogs => {
            const updatedExercises = { ...(prevLogs.exercises ?? {}) };
            exerciseIds.forEach((exId) => {
                const currentEntry = getExerciseLogEntry(prevLogs, exId);
                updatedExercises[exId] = {
                    ...currentEntry,
                    sets: allCompleted,
                };
            });
            const updatedLogs: WorkoutSessionData = {
                ...prevLogs,
                exercises: updatedExercises,
                lastModified: new Date().toISOString(),
            };
            safeSetJSON(sessionKey, updatedLogs);
            return updatedLogs;
        });
    }, [sessionKey]);

    // ============================================================================
    // ADDED EXERCISES
    // ============================================================================

    const addExerciseToWorkout = useCallback((
        exercise: Exercise,
        sets = 3,
        weight = '',
        rest = 90
    ): boolean => {
        if (!exercise || !exercise.id || !exercise.name) {
            console.error('Invalid exercise data:', exercise);
            return false;
        }

        const validSets = Number.isInteger(sets) && sets > 0 && sets <= MAX_SETS ? sets : 3;
        const validRest = Number.isInteger(rest) && rest >= 0 && rest <= 300 ? rest : 90;

        const isDuplicate = addedExercises.some((ex) => ex.id === exercise.id);
        if (isDuplicate) {
            return false;
        }

        const newExercise: AddedExercise = {
            id: exercise.id,
            name: exercise.name,
            sets: validSets,
            rest: validRest,
            isBodyweight: exercise.isBodyweight || false,
            equipment: exercise.equipment || [],
            primaryMuscles: exercise.primaryMuscles || [],
            weight,
        };
        const updatedAddedExercises = [...addedExercises, newExercise];
        setAddedExercises(updatedAddedExercises);

        setLogs(prevLogs => {
            const updatedLogs: WorkoutSessionData = {
                ...prevLogs,
                addedExercises: updatedAddedExercises,
                lastModified: new Date().toISOString(),
            };
            safeSetJSON(sessionKey, updatedLogs);
            return updatedLogs;
        });

        return true;
    }, [addedExercises, sessionKey]);

    const removeAddedExercise = useCallback((exerciseId: string): void => {
        const updatedAddedExercises = addedExercises.filter((ex) => ex.id !== exerciseId);
        setAddedExercises(updatedAddedExercises);

        setLogs(prevLogs => {
            const updatedLogs: WorkoutSessionData = {
                ...prevLogs,
                addedExercises: updatedAddedExercises,
                lastModified: new Date().toISOString(),
            };
            safeSetJSON(sessionKey, updatedLogs);
            return updatedLogs;
        });
    }, [addedExercises, sessionKey]);

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================

    const getLogEntry = useCallback((exerciseId: string): ExerciseLogEntry => {
        return getExerciseLogEntry(logs, exerciseId);
    }, [logs]);

    const workoutProgress = useMemo((): WorkoutProgress => {
        let completedSets = 0;
        let totalSets = 0;

        // Count sets from workout sections
        for (const section of sections) {
            for (const ex of section.exercises) {
                const exId = getExerciseId(ex.name);
                const exerciseLog = getExerciseLogEntry(logs, exId);
                const sets = exerciseLog.sets || [];
                const defaultSets = ex.sets || 3;
                const exerciseTotalSets = sets.length > 0 ? sets.length : defaultSets;
                const exerciseCompletedSets = sets.filter((s) => s).length;
                totalSets += exerciseTotalSets;
                completedSets += exerciseCompletedSets;
            }
        }

        // Count sets from added exercises
        for (const addedEx of addedExercises) {
            const exId = getAddedExerciseId(addedEx.id);
            const exerciseLog = getExerciseLogEntry(logs, exId);
            const sets = exerciseLog.sets || [];
            const defaultSets = addedEx.sets || 3;
            const exerciseTotalSets = sets.length > 0 ? sets.length : defaultSets;
            const exerciseCompletedSets = sets.filter((s) => s).length;
            totalSets += exerciseTotalSets;
            completedSets += exerciseCompletedSets;
        }

        return { completedSets, totalSets };
    }, [sections, logs, addedExercises]);

    const firstIncompleteExerciseId = useMemo((): string | null => {
        for (const section of sections) {
            for (const ex of section.exercises) {
                const exId = getExerciseId(ex.name);
                const defaultSets = ex.sets || 3;
                const sets = getExerciseLogEntry(logs, exId).sets || new Array(defaultSets).fill(false);
                const completedSets = sets.filter((s) => s).length;
                const totalSets = sets.length;
                if (completedSets < totalSets) {
                    return exId;
                }
            }
        }
        return null;
    }, [sections, logs]);

    // ============================================================================
    // MARK COMPLETE
    // ============================================================================

    const markComplete = useCallback((durationSeconds: number): WorkoutSessionData => {
        const timestamp = new Date().toISOString();
        const effectiveWeek = isEmptyWorkout ? 0 : week;
        const effectiveDay = isEmptyWorkout ? 0 : day;

        const updatedLogs: WorkoutSessionData = {
            ...logs,
            completed: true,
            completedAt: timestamp,
            lastModified: timestamp,
            week: effectiveWeek,
            day: effectiveDay,
            workoutNotes,
            durationSeconds,
        };

        persistLogs(updatedLogs);

        // Clear empty workout session key when completing
        if (isEmptyWorkout) {
            sessionStorage.removeItem('current_empty_workout_key');
        }

        return updatedLogs;
    }, [logs, isEmptyWorkout, week, day, workoutNotes, persistLogs]);

    return {
        sessionKey,
        logs,
        addedExercises,
        workoutNotes,
        setWorkoutNotes,
        workoutProgress,
        firstIncompleteExerciseId,
        getLogEntry,
        toggleSet,
        toggleSupersetRound,
        saveRPE,
        addSet,
        saveWeight,
        completeAllSets,
        completeAllSupersetSets,
        addExerciseToWorkout,
        removeAddedExercise,
        markComplete,
        persistLogs,
    };
}
