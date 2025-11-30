/**
 * WorkoutPlayer Component
 *
 * Main workout execution view with exercise tracking, timers, and set logging.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ActionBar } from '../ActionBar';
import { CompactExerciseRow } from '../CompactExerciseRow';
import { SupersetGroup } from '../SupersetGroup';
import type { SupersetExercise } from '../SupersetGroup';
import { RPESelector } from '../RPESelector';
import { GestureHint } from '../GestureHint';
import { RecentExercisesList, addRecentExercise } from '../RecentExercises';
import { ExerciseDetailModal, NotesModal } from '../modals';
import { safeGetJSON, safeSetJSON } from '../../utils/storage';
import { useHaptic, useSwipe, useDebounce, type HapticFeedback } from '../../hooks';
import {
    Flame, Dumbbell, Snowflake, Activity, ChevronDown, ChevronUp, Timer, Repeat, Check, Plus, CheckCheck, Minus, PlusCircle, X, CheckCircle2, LayoutGrid, LayoutList, Link, Zap, ArrowRightLeft, Info
} from 'lucide-react';
import {
    DEBOUNCE_DELAY_MS,
    MAX_SETS,
} from '../../constants';
import { PROGRAM_DATA, type WorkoutExercise, type WorkoutSection } from '../../data/programData';
import {
    updateExerciseHistory,
    getExerciseHistory,
} from '../../utils/exerciseHistory';
import { playTickSound, playBeepSound } from '../../utils/audio';
import type { WorkoutPlayerProps, AddedExercise, Exercise, RPEValue } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

type RPEData = Record<number, RPEValue>;

interface ExerciseLogEntry {
    sets?: boolean[];
    weight?: string;
    rpe?: RPEData;
}

interface WorkoutSessionData {
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

const MUSCLE_FILTERS = [
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

type MuscleFilter = (typeof MUSCLE_FILTERS)[number];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const parseWeight = (weight: unknown): number | null => {
    if (weight === null || weight === undefined) return null;
    if (typeof weight === 'number') return weight;
    if (typeof weight !== 'string') return null;

    const cleaned = weight.replace(/[^0-9.\-]/g, '').trim();
    if (!cleaned) return null;

    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
};

const isExerciseLogEntry = (value: unknown): value is ExerciseLogEntry => {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !('id' in value && 'name' in value && 'sets' in value)
    );
};

const getExerciseLogEntry = (
    logs: WorkoutSessionData,
    exerciseId: string
): ExerciseLogEntry => {
    const entry = logs[exerciseId];
    if (isExerciseLogEntry(entry)) {
        return entry;
    }
    return {};
};

const normalizeAddedExercises = (value: unknown): AddedExercise[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is AddedExercise => {
        return (
            !!item &&
            typeof item === 'object' &&
            'id' in item &&
            'name' in item &&
            'sets' in item
        );
    });
};

// ============================================================================
// EXERCISE LIST ITEM COMPONENT
// ============================================================================

interface ExerciseListItemProps {
    exercise: Exercise;
    onAdd: (exercise: Exercise, sets?: number, weight?: string, rest?: number) => void;
    haptic: HapticFeedback;
}

const DEFAULT_REST_TIME = 90;

const ExerciseListItem: React.FC<ExerciseListItemProps> = ({ exercise, onAdd, haptic }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [sets, setSets] = useState(3);
    const [weight, setWeight] = useState('');
    const [rest, setRest] = useState(DEFAULT_REST_TIME);

    return (
        <div className="bg-sys-surfaceHigh rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <h4 className="text-base font-semibold text-white mb-1">{exercise.name}</h4>
                    <p className="text-xs text-sys-onSurfaceVar mb-2">
                        {exercise.primaryMuscles.join(', ')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {exercise.equipment.slice(0, 3).map((eq) => (
                            <span key={eq} className="text-xs px-2 py-1 bg-sys-surface rounded-lg text-sys-onSurfaceVar">
                                {eq}
                            </span>
                        ))}
                        {!exercise.isBodyweight && (
                            <span className="text-xs px-2 py-1 bg-sys-accent/10 rounded-lg text-sys-accent">
                                Weighted
                            </span>
                        )}
                    </div>
                </div>

                {!showAddForm ? (
                    <button
                        onClick={() => { haptic.tick(); setShowAddForm(true); }}
                        className="h-10 px-4 rounded-xl text-white font-semibold text-sm active:scale-95 transition-transform flex-shrink-0 btn-gradient-primary"
                    >
                        Add
                    </button>
                ) : (
                    <button
                        onClick={() => { haptic.tick(); setShowAddForm(false); }}
                        className="h-10 w-10 rounded-xl bg-sys-surface text-sys-onSurfaceVar flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
                        aria-label="Collapse form"
                    >
                        <ChevronUp size={20} />
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                            <label className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">Sets</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={sets}
                                onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                                className="w-full h-10 px-3 bg-sys-surface rounded-xl text-white text-center font-mono outline-none focus:ring-2 focus:ring-sys-accent"
                            />
                        </div>
                        {!exercise.isBodyweight && (
                            <div>
                                <label className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">Weight</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="kg"
                                    className="w-full h-10 px-3 bg-sys-surface rounded-xl text-white text-center font-mono outline-none focus:ring-2 focus:ring-sys-accent"
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">Rest (s)</label>
                            <input
                                type="number"
                                min="0"
                                max="300"
                                step="15"
                                value={rest}
                                onChange={(e) => setRest(parseInt(e.target.value) || DEFAULT_REST_TIME)}
                                className="w-full h-10 px-3 bg-sys-surface rounded-xl text-white text-center font-mono outline-none focus:ring-2 focus:ring-sys-accent"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            haptic.success();
                            onAdd(exercise, sets, weight, rest);
                            setShowAddForm(false);
                            setSets(3);
                            setWeight('');
                            setRest(DEFAULT_REST_TIME);
                        }}
                        className="w-full h-10 rounded-xl text-white font-semibold active:scale-95 transition-transform btn-gradient-success"
                    >
                        Add to Workout
                    </button>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// MAIN WORKOUT PLAYER COMPONENT
// ============================================================================

export const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({
    week,
    day,
    onComplete,
    exerciseLibrary,
    isEmptyWorkout = false,
    onWorkoutFinish,
}) => {
    // For empty workouts, generate a unique session key based on timestamp
    // This allows multiple empty workouts to be tracked separately
    const [emptyWorkoutId] = useState(() => {
        if (isEmptyWorkout) {
            // Check if we have an existing empty workout session to resume
            const existingKey = sessionStorage.getItem('current_empty_workout_key');
            if (existingKey) {
                return existingKey;
            }
            // Create a new empty workout session
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

    const workout = useMemo(() => {
        if (isEmptyWorkout) {
            // Return an empty workout structure for custom workouts
            return { title: 'Custom Workout', sections: [] };
        }
        return PROGRAM_DATA.getWorkout(week, day);
    }, [week, day, isEmptyWorkout]);

    // State
    const [logs, setLogs] = useState<WorkoutSessionData>({});
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [emomSeconds, setEmomSeconds] = useState(0);
    const [emomActive, setEmomActive] = useState(false);
    const [emomInterval, setEmomInterval] = useState(() => safeGetJSON<number>('emom_interval', 60) ?? 60);
    // Track manual user overrides for exercise collapse state (true = user wants expanded, false = user wants collapsed)
    const [manualCollapseOverrides, setManualCollapseOverrides] = useState<Record<string, boolean>>({});
    const [showTimerToast, setShowTimerToast] = useState(false);
    const [addedExercises, setAddedExercises] = useState<AddedExercise[]>([]);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
    const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<MuscleFilter>('all');
    const [showExerciseHistory, setShowExerciseHistory] = useState<string | null>(null);
    // Notes modal state: { exerciseName, notes } or null
    const [showNotesFor, setShowNotesFor] = useState<{ exerciseName: string; notes: string } | null>(null);
    const [workoutNotes, setWorkoutNotes] = useState('');
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);
    const [compactView, setCompactView] = useState(() =>
        safeGetJSON<boolean>('workout_compact_view', false) ?? false
    );
    // RPE selector state: { exerciseId, setIndex } or null
    const [rpePrompt, setRpePrompt] = useState<{ exerciseId: string; setIndex: number } | null>(null);
    // Exercise swaps: maps original exercise name to swapped alternative name
    const [exerciseSwaps, setExerciseSwaps] = useState<Record<string, string>>({});
    // Currently showing alternatives picker for which exercise
    const [showAlternativesFor, setShowAlternativesFor] = useState<{ name: string; alternatives: string[] } | null>(null);

    const haptic = useHaptic();

    // Toggle compact view and persist preference
    const toggleCompactView = useCallback(() => {
        haptic.tick();
        setCompactView((prev) => {
            const newValue = !prev;
            safeSetJSON('workout_compact_view', newValue);
            return newValue;
        });
    }, [haptic]);

    // Handle swapping an exercise to an alternative
    const handleSwapExercise = useCallback((originalName: string, alternativeName: string) => {
        haptic.bump();
        setExerciseSwaps((prev) => ({
            ...prev,
            [originalName]: alternativeName,
        }));
        setShowAlternativesFor(null);
    }, [haptic]);

    // Get the effective exercise name (swapped or original)
    const getEffectiveExerciseName = useCallback((ex: WorkoutExercise): string => {
        return exerciseSwaps[ex.name] || ex.name;
    }, [exerciseSwaps]);

    // Swipe handlers for back navigation
    const swipeHandlers = useSwipe({
        onSwipeRight: () => {
            haptic.tick();
            onComplete();
        },
    });

    // Debounce exercise search
    const debouncedExerciseSearch = useDebounce(exerciseSearchTerm, DEBOUNCE_DELAY_MS);

    // Calculate overall workout progress (completed sets / total sets)
    const workoutProgress = useMemo(() => {
        let completedSets = 0;
        let totalSets = 0;

        // Count sets from workout sections
        if (workout?.sections) {
            for (const section of workout.sections) {
                for (const ex of section.exercises) {
                    const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                    const exerciseLog = getExerciseLogEntry(logs, exId);
                    const sets = exerciseLog.sets || [];
                    const defaultSets = ex.sets || 3;
                    const exerciseTotalSets = sets.length > 0 ? sets.length : defaultSets;
                    const exerciseCompletedSets = sets.filter((s) => s).length;
                    totalSets += exerciseTotalSets;
                    completedSets += exerciseCompletedSets;
                }
            }
        }

        // Count sets from added exercises
        for (const addedEx of addedExercises) {
            const exId = `added_${addedEx.id}`;
            const exerciseLog = getExerciseLogEntry(logs, exId);
            const sets = exerciseLog.sets || [];
            const defaultSets = addedEx.sets || 3;
            const exerciseTotalSets = sets.length > 0 ? sets.length : defaultSets;
            const exerciseCompletedSets = sets.filter((s) => s).length;
            totalSets += exerciseTotalSets;
            completedSets += exerciseCompletedSets;
        }

        return { completedSets, totalSets };
    }, [workout, logs, addedExercises]);

    // Load session data on mount
    useEffect(() => {
        const parsedLogs = safeGetJSON<WorkoutSessionData>(sessionKey, {} as WorkoutSessionData);
        if (parsedLogs && typeof parsedLogs === 'object') {
            setLogs(parsedLogs);
            setAddedExercises(normalizeAddedExercises(parsedLogs.addedExercises));
            setWorkoutNotes(typeof parsedLogs.workoutNotes === 'string' ? parsedLogs.workoutNotes : '');
        } else {
            setLogs({});
            setAddedExercises([]);
            setWorkoutNotes('');
        }
    }, [sessionKey]);

    // Rest timer effect
    useEffect(() => {
        if (timerActive && timerSeconds > 0) {
            const interval = setInterval(() => setTimerSeconds((s) => s - 1), 1000);
            return () => clearInterval(interval);
        }
        if (timerSeconds === 0 && timerActive) {
            setTimerActive(false);
            haptic.timer();
            setShowTimerToast(true);
        }
    }, [timerActive, timerSeconds, haptic]);

    // EMOM timer effect
    useEffect(() => {
        if (emomActive && emomSeconds > 0) {
            const interval = setInterval(() => {
                setEmomSeconds((s) => {
                    const newValue = s - 1;
                    if (newValue <= 5 && newValue >= 1) {
                        playTickSound();
                    }
                    return newValue;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
        if (emomSeconds === 0 && emomActive) {
            setEmomSeconds(emomInterval);
            haptic.timer();
            playBeepSound();
        }
    }, [emomActive, emomSeconds, emomInterval, haptic]);

    // Save EMOM interval preference
    useEffect(() => {
        safeSetJSON('emom_interval', emomInterval);
    }, [emomInterval]);

    // Escape key to dismiss toast
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showTimerToast) {
                setShowTimerToast(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showTimerToast]);

    // ============================================================================
    // PERSISTENCE FUNCTIONS
    // ============================================================================

    const persistLogs = (updatedLogs: WorkoutSessionData): void => {
        setLogs(updatedLogs);
        const success = safeSetJSON(sessionKey, updatedLogs);
        if (!success) {
            alert('Failed to save progress. Your storage might be full.');
        }
    };

    const saveLog = (
        id: string,
        field: keyof ExerciseLogEntry,
        value: ExerciseLogEntry[keyof ExerciseLogEntry]
    ): void => {
        const currentEntry = getExerciseLogEntry(logs, id);
        const updatedLogs: WorkoutSessionData = {
            ...logs,
            [id]: {
                ...currentEntry,
                [field]: value,
            },
            lastModified: new Date().toISOString(),
        };
        persistLogs(updatedLogs);
    };

    // ============================================================================
    // SET TOGGLE & RPE
    // ============================================================================

    const toggleSet = (
        exId: string,
        setIndex: number,
        defaultSets: number,
        restTime?: number
    ): void => {
        try {
            haptic.tick();

            if (!exId || setIndex < 0 || !Number.isInteger(setIndex)) {
                console.error('Invalid set toggle parameters:', { exId, setIndex, defaultSets });
                return;
            }

            const currentSets = getExerciseLogEntry(logs, exId).sets || new Array(defaultSets).fill(false);
            const newSets = [...currentSets];
            while (newSets.length <= setIndex) newSets.push(false);
            const wasCompleted = newSets[setIndex];
            newSets[setIndex] = !newSets[setIndex];
            saveLog(exId, 'sets', newSets);

            // Clear RPE if uncompleting a set
            if (wasCompleted && !newSets[setIndex]) {
                const currentRPEs: RPEData = { ...(getExerciseLogEntry(logs, exId).rpe ?? {}) };
                if (currentRPEs[setIndex]) {
                    const updatedRPEs: RPEData = { ...currentRPEs };
                    delete updatedRPEs[setIndex];
                    saveLog(exId, 'rpe', updatedRPEs);
                }
                // Clear RPE prompt if uncompleting the set that was being prompted
                setRpePrompt(null);
            }

            // Start rest timer and show RPE prompt if completing a set
            if (!wasCompleted && newSets[setIndex]) {
                // Show RPE prompt for the completed set
                setRpePrompt({ exerciseId: exId, setIndex });

                // Only start rest timer between sets, not after completing the last set of an exercise.
                // This prevents the timer from activating when moving to the next exercise.
                // Timer should only run when there are still incomplete sets remaining.
                if (typeof restTime === 'number' && restTime > 0) {
                    const totalSets = newSets.length;
                    const completedSetsCount = newSets.filter(Boolean).length;
                    const hasIncompleteSets = completedSetsCount < totalSets;

                    if (hasIncompleteSets) {
                        setTimerSeconds(restTime);
                        setTimerActive(true);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to toggle set:', error);
        }
    };

    // Toggle a round for multiple exercises in a superset at once
    // This avoids the stale state issue when calling toggleSet multiple times
    const toggleSupersetRound = (
        exerciseIds: string[],
        roundIndex: number,
        defaultSets: number,
        restTime?: number
    ): void => {
        try {
            haptic.tick();

            if (!exerciseIds.length || roundIndex < 0 || !Number.isInteger(roundIndex)) {
                console.error('Invalid superset toggle parameters:', { exerciseIds, roundIndex, defaultSets });
                return;
            }

            // Build updated logs with all exercises toggled
            let updatedLogs: WorkoutSessionData = { ...logs };
            let anyWasCompleted = false;
            let anyWasIncomplete = false;
            let hasIncompleteSetsAfter = false;

            exerciseIds.forEach((exId) => {
                const currentEntry = getExerciseLogEntry(updatedLogs, exId);
                const currentSets = currentEntry.sets || new Array(defaultSets).fill(false);
                const newSets = [...currentSets];
                while (newSets.length <= roundIndex) newSets.push(false);

                const wasCompleted = newSets[roundIndex];
                if (wasCompleted) anyWasCompleted = true;
                if (!wasCompleted) anyWasIncomplete = true;

                newSets[roundIndex] = !newSets[roundIndex];

                // Check if there are incomplete sets after this toggle
                const completedSetsCount = newSets.filter(Boolean).length;
                if (completedSetsCount < newSets.length) hasIncompleteSetsAfter = true;

                updatedLogs = {
                    ...updatedLogs,
                    [exId]: {
                        ...currentEntry,
                        sets: newSets,
                    },
                };

                // Clear RPE if uncompleting a set
                if (wasCompleted && !newSets[roundIndex]) {
                    const currentRPEs: RPEData = { ...(currentEntry.rpe ?? {}) };
                    if (currentRPEs[roundIndex]) {
                        const updatedRPEs: RPEData = { ...currentRPEs };
                        delete updatedRPEs[roundIndex];
                        const existingEntry = updatedLogs[exId] as ExerciseLogEntry;
                        updatedLogs = {
                            ...updatedLogs,
                            [exId]: {
                                ...existingEntry,
                                rpe: updatedRPEs,
                            },
                        };
                    }
                }
            });

            updatedLogs.lastModified = new Date().toISOString();
            persistLogs(updatedLogs);

            // Handle RPE prompt and timer - only if completing (not uncompleting)
            if (anyWasIncomplete) {
                // Clear any previous RPE prompt when completing superset round
                setRpePrompt(null);

                // Start rest timer if completing and there are incomplete sets remaining
                if (typeof restTime === 'number' && restTime > 0 && hasIncompleteSetsAfter) {
                    setTimerSeconds(restTime);
                    setTimerActive(true);
                }
            } else if (anyWasCompleted) {
                // Clear RPE prompt if uncompleting
                setRpePrompt(null);
            }
        } catch (error) {
            console.error('Failed to toggle superset round:', error);
        }
    };

    const saveRPE = (exId: string, setIndex: number, rpe: RPEValue): void => {
        try {
            const currentRPEs: RPEData = { ...(getExerciseLogEntry(logs, exId).rpe ?? {}) };
            const updatedRPEs: RPEData = { ...currentRPEs, [setIndex]: rpe };
            saveLog(exId, 'rpe', updatedRPEs);
        } catch (error) {
            console.error('Failed to save RPE:', error);
        }
    };

    const addSet = (exId: string, defaultSets: number): void => {
        haptic.bump();
        const currentSets = getExerciseLogEntry(logs, exId).sets || new Array(defaultSets).fill(false);
        saveLog(exId, 'sets', [...currentSets, false]);
    };

    // Handler for weight changes from compact view
    const handleWeightChange = useCallback((exId: string, weight: string): void => {
        saveLog(exId, 'weight', weight);
    }, []);

    const completeAllSets = (exId: string, defaultSets: number): void => {
        haptic.success();
        const allCompleted = new Array(defaultSets).fill(true);
        saveLog(exId, 'sets', allCompleted);
    };

    // Complete all sets for multiple exercises in a superset at once
    const completeAllSupersetSets = (exerciseIds: string[], defaultSets: number): void => {
        haptic.success();
        const allCompleted = new Array(defaultSets).fill(true);

        let updatedLogs: WorkoutSessionData = { ...logs };
        exerciseIds.forEach((exId) => {
            const currentEntry = getExerciseLogEntry(updatedLogs, exId);
            updatedLogs = {
                ...updatedLogs,
                [exId]: {
                    ...currentEntry,
                    sets: allCompleted,
                },
            };
        });
        updatedLogs.lastModified = new Date().toISOString();
        persistLogs(updatedLogs);
    };

    const toggleExerciseCollapse = (exId: string): void => {
        setManualCollapseOverrides((prev) => {
            const currentOverride = prev[exId];
            // Toggle between: no override -> expanded -> collapsed -> no override
            // If user has never touched it, clicking sets it to opposite of auto state
            // If user has set it, clicking toggles the override
            if (currentOverride === undefined) {
                // First click: set explicit opposite of auto behavior
                // (auto behavior is expanded if first incomplete, collapsed otherwise)
                // We'll just toggle to the opposite
                return { ...prev, [exId]: true };
            }
            // Toggle existing override
            return { ...prev, [exId]: !currentOverride };
        });
    };

    // ============================================================================
    // ADD EXERCISE FUNCTIONS
    // ============================================================================

    const addExerciseToWorkout = (
        exercise: Exercise,
        sets = 3,
        weight = '',
        rest = 90
    ): void => {
        try {
            if (!exercise || !exercise.id || !exercise.name) {
                console.error('Invalid exercise data:', exercise);
                alert('Failed to add exercise: Invalid exercise data');
                return;
            }

            const validSets = Number.isInteger(sets) && sets > 0 && sets <= MAX_SETS ? sets : 3;
            const validRest = Number.isInteger(rest) && rest >= 0 && rest <= 300 ? rest : 90;

            const isDuplicate = addedExercises.some((ex) => ex.id === exercise.id);
            if (isDuplicate) {
                alert('This exercise has already been added to the workout');
                return;
            }

            haptic.success();
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

            const updatedLogs: WorkoutSessionData = {
                ...logs,
                addedExercises: updatedAddedExercises,
                lastModified: new Date().toISOString(),
            };
            persistLogs(updatedLogs);

            setShowExerciseSelector(false);
            setExerciseSearchTerm('');
        } catch (error) {
            console.error('Failed to add exercise:', error);
            alert('Failed to add exercise. Please try again.');
        }
    };

    const removeAddedExercise = (exerciseId: string): void => {
        haptic.tick();
        const updatedAddedExercises = addedExercises.filter((ex) => ex.id !== exerciseId);
        setAddedExercises(updatedAddedExercises);

        const updatedLogs: WorkoutSessionData = {
            ...logs,
            addedExercises: updatedAddedExercises,
            lastModified: new Date().toISOString(),
        };
        persistLogs(updatedLogs);
    };

    // ============================================================================
    // FINISH WORKOUT
    // ============================================================================

    const handleFinish = async (): Promise<void> => {
        try {
            // Stop the workout timer and get final duration
            const workoutDurationSeconds = onWorkoutFinish ? onWorkoutFinish() : 0;

            const timestamp = new Date().toISOString();

            // For empty workouts, use 0 for week/day
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
                durationSeconds: workoutDurationSeconds,
            };
            persistLogs(updatedLogs);

            const completionDate = new Date().toISOString();

            interface ExerciseSummaryItem {
                name: string;
                prescription: string;
                completedSets: number;
                totalSets: number;
                weight: number | string | null;
                isBodyweight?: boolean;
            }

            const exerciseSummary: ExerciseSummaryItem[] = [];

            // Process scheduled exercises (only for non-empty workouts)
            if (!isEmptyWorkout) {
                workout.sections.forEach((section: WorkoutSection) => {
                    section.exercises.forEach((ex: WorkoutExercise) => {
                        const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                        const exLog = getExerciseLogEntry(updatedLogs, exId);
                        const sets = exLog.sets || [];
                        const completedSets = sets.filter((s) => s).length;
                        const totalSets = sets.length || ex.sets || 0;
                        const parsedWeight = parseWeight(exLog.weight || '');

                        exerciseSummary.push({
                            name: ex.name,
                            prescription: ex.prescription,
                            completedSets,
                            totalSets,
                            weight: parsedWeight ?? null,
                            isBodyweight: ex.isBodyweight,
                        });

                        if (completedSets > 0) {
                            updateExerciseHistory(ex.name, {
                                date: completionDate,
                                week: effectiveWeek,
                                day: effectiveDay,
                                sets: completedSets,
                                totalSets,
                                weight: parseWeight(exLog.weight) ?? undefined,
                                prescription: ex.prescription,
                                isBodyweight: ex.isBodyweight,
                            });
                        }
                    });
                });
            }

            // Process added exercises (for both regular and empty workouts)
            addedExercises.forEach((ex) => {
                const exId = `added_${ex.id}`;
                const exLog = getExerciseLogEntry(updatedLogs, exId);
                const sets = exLog.sets || [];
                const completedSets = sets.filter((s) => s).length;
                const totalSets = sets.length || ex.sets || 0;

                // For empty workouts, don't label added exercises as "(Added)"
                const displayName = isEmptyWorkout ? ex.name : `${ex.name} (Added)`;

                exerciseSummary.push({
                    name: displayName,
                    prescription: `${ex.sets} sets`,
                    completedSets,
                    totalSets,
                    weight: ex.weight || exLog.weight || null,
                    isBodyweight: ex.isBodyweight,
                });

                if (completedSets > 0) {
                    updateExerciseHistory(ex.name, {
                        date: completionDate,
                        week: effectiveWeek,
                        day: effectiveDay,
                        sets: completedSets,
                        totalSets,
                        weight: parseWeight(ex.weight || exLog.weight) ?? undefined,
                        prescription: `${ex.sets} sets`,
                        isBodyweight: ex.isBodyweight,
                    });
                }
            });

            // Save to global history with duration
            const historyEntry = {
                week: effectiveWeek,
                day: effectiveDay,
                date: completionDate,
                title: isEmptyWorkout ? 'Custom Workout' : workout.title,
                exercises: exerciseSummary,
                workoutNotes: workoutNotes || null,
                isEmptyWorkout: isEmptyWorkout ? true : undefined,
                durationSeconds: workoutDurationSeconds,
            };

            const history = safeGetJSON('global_history', [] as unknown[]) as unknown[];
            let cleanHistory: unknown[];

            if (isEmptyWorkout) {
                // For empty workouts, always add as a new entry (don't deduplicate)
                cleanHistory = Array.isArray(history) ? history : [];
            } else {
                // For regular workouts, remove duplicates for the same week/day
                cleanHistory = Array.isArray(history)
                    ? history.filter((h: any) => !(h?.week === effectiveWeek && h?.day === effectiveDay))
                    : [];
            }
            cleanHistory.push(historyEntry);
            safeSetJSON('global_history', cleanHistory);

            // Clear empty workout session key when completing
            if (isEmptyWorkout) {
                sessionStorage.removeItem('current_empty_workout_key');
            }

            onComplete();
        } catch (error) {
            console.error('Failed to complete workout:', error);
            alert('Failed to save workout completion. Please try again.');
        }
    };

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================

    // Find the first incomplete exercise (the one that should be auto-expanded)
    const firstIncompleteExerciseId = useMemo(() => {
        for (const section of workout.sections) {
            for (const ex of section.exercises) {
                const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                const defaultSets = ex.sets || 3;
                const sets = getExerciseLogEntry(logs, exId).sets || new Array(defaultSets).fill(false);
                const completedSets = sets.filter((s) => s).length;
                const totalSets = sets.length;
                if (completedSets < totalSets) {
                    return exId;
                }
            }
        }
        // All exercises complete, return null
        return null;
    }, [workout.sections, logs]);

    // Compute effective collapsed state for an exercise
    const isExerciseCollapsed = (exId: string): boolean => {
        // Check if user has manually overridden the collapse state
        const manualOverride = manualCollapseOverrides[exId];
        if (manualOverride !== undefined) {
            // User override: true = user wants expanded, false = user wants collapsed
            return !manualOverride;
        }

        // Auto behavior: only the first incomplete exercise is expanded
        return exId !== firstIncompleteExerciseId;
    };

    // @ts-expect-error - Reserved for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _hasIncompleteExercises = workout.sections.some((section: WorkoutSection) =>
        section.exercises.some((ex: WorkoutExercise) => {
            const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
            const sets = getExerciseLogEntry(logs, exId).sets || [];
            return sets.length === 0 || !sets.every((s) => s);
        })
    );

    const filteredExercises = useMemo(() => {
        const normalizedFilter = selectedMuscleFilter.toLowerCase();
        const searchTerm = debouncedExerciseSearch.toLowerCase();

        return exerciseLibrary.filter((ex) => {
            const nameMatch = ex.name.toLowerCase().includes(searchTerm);
            const muscleMatch = ex.primaryMuscles.some((m) => m.toLowerCase().includes(searchTerm));
            const searchMatch = !searchTerm || nameMatch || muscleMatch;

            const category = String(ex.category || '').toLowerCase();
            const categoryMatch = normalizedFilter === 'all' || category === normalizedFilter;

            return searchMatch && categoryMatch;
        });
    }, [exerciseLibrary, debouncedExerciseSearch, selectedMuscleFilter]);

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <>
            {/* Gesture hint for swipe navigation - shown on first workout */}
            <GestureHint
                type="swipe-right"
                storageKey="workout_player_back"
                message="Swipe right to go back"
            />

            <div {...swipeHandlers} className="px-4 pb-32 pt-4">
                {/* Workout Notes */}
                <div className="mb-4">
                    <label className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-1 block">
                        Workout Notes
                    </label>
                    <textarea
                        value={workoutNotes}
                        onChange={(e) => {
                            setWorkoutNotes(e.target.value);
                            const updatedLogs: WorkoutSessionData = {
                                ...logs,
                                workoutNotes: e.target.value,
                                lastModified: new Date().toISOString(),
                            };
                            persistLogs(updatedLogs);
                        }}
                        placeholder="How are you feeling? Any notes for this workout..."
                        className="w-full h-14 px-3 py-2 bg-sys-surface rounded-xl text-white text-sm placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-accent resize-none border border-white/5"
                    />
                </div>

                {/* View Mode Toggle */}
                <div className="flex justify-end mb-4">
                    <div className="flex items-center bg-sys-surfaceHigh rounded-lg p-1 border border-white/5">
                        <button
                            onClick={toggleCompactView}
                            className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${
                                !compactView ? 'bg-sys-accent text-white' : 'text-sys-onSurfaceVar'
                            }`}
                            aria-label="Card view"
                            aria-pressed={!compactView}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={toggleCompactView}
                            className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${
                                compactView ? 'bg-sys-accent text-white' : 'text-sys-onSurfaceVar'
                            }`}
                            aria-label="Compact list view"
                            aria-pressed={compactView}
                        >
                            <LayoutList size={16} />
                        </button>
                    </div>
                </div>

                {/* Empty Workout Prompt */}
                {isEmptyWorkout && addedExercises.length === 0 && !logs.completed && (
                    <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-sys-accent/10 via-sys-surface to-sys-surfaceHigh border-2 border-dashed border-sys-accent/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-16 w-16 rounded-2xl bg-sys-accent/20 flex items-center justify-center mb-4">
                                <PlusCircle size={32} className="text-sys-accent" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Build Your Workout</h3>
                            <p className="text-sm text-sys-onSurfaceVar mb-4 max-w-[280px]">
                                Add exercises from the library to create your custom workout session.
                            </p>
                            <button
                                onClick={() => {
                                    haptic.bump();
                                    setShowExerciseSelector(true);
                                }}
                                className="h-12 px-6 rounded-xl text-white font-semibold active:scale-95 transition-transform btn-gradient-primary flex items-center gap-2"
                            >
                                <PlusCircle size={18} />
                                <span>Add First Exercise</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Workout Sections */}
                {workout.sections.map((section: WorkoutSection, sIdx: number) => {
                    const sectionExercises = section.exercises.length;
                    const sectionCompletedExercises = section.exercises.filter((ex: WorkoutExercise) => {
                        const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                        const sets = getExerciseLogEntry(logs, exId).sets || [];
                        return sets.length > 0 && sets.every((s) => s);
                    }).length;
                    const sectionProgress = sectionExercises > 0
                        ? (sectionCompletedExercises / sectionExercises) * 100
                        : 0;

                    return (
                        <div key={sIdx} className="mb-5">
                            {/* Section Header - Compact mode: sticky, minimal */}
                            <div className={`mb-2 ${compactView ? 'sticky top-0 z-10 bg-sys-black/95 backdrop-blur-sm py-1 -mx-4 px-4' : ''}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`rounded-md flex items-center justify-center bg-sys-surfaceHigh ${compactView ? 'h-5 w-5' : 'h-6 w-6'}`}>
                                        {section.type === 'prep' ? (
                                            <Flame size={compactView ? 12 : 14} className="text-sys-accent" />
                                        ) : section.type === 'main' ? (
                                            <Dumbbell size={compactView ? 12 : 14} className="text-sys-success" />
                                        ) : section.type === 'cool' ? (
                                            <Snowflake size={compactView ? 12 : 14} className="text-sys-accent" />
                                        ) : (
                                            <Activity size={compactView ? 12 : 14} className="text-white" />
                                        )}
                                    </div>
                                    <span className={`font-bold text-white uppercase tracking-wide ${compactView ? 'text-xs' : 'text-sm'}`}>
                                        {section.name}
                                    </span>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                                    {sectionProgress > 0 && (
                                        <span className="text-xs font-bold text-sys-onSurfaceVar">
                                            {sectionCompletedExercises}/{sectionExercises}
                                        </span>
                                    )}
                                </div>
                                {!compactView && sectionProgress > 0 && (
                                    <div className="h-1 bg-sys-surfaceHigh rounded-full overflow-hidden mx-1">
                                        <div
                                            className="h-full bg-gradient-to-r from-sys-accent to-sys-success transition-all duration-500"
                                            style={{ width: `${sectionProgress}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>

                            {/* Exercises */}
                            <div className={compactView ? 'space-y-1' : 'space-y-3'}>
                                {(() => {
                                    // For compact view, group superset exercises together
                                    if (compactView) {
                                        const renderedGroups = new Set<number>();
                                        const elements: React.ReactNode[] = [];

                                        section.exercises.forEach((ex: WorkoutExercise, eIdx: number) => {
                                            const defaultSets = ex.sets || 3;
                                            const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                                            const exerciseLog = getExerciseLogEntry(logs, exId);
                                            const currentSetArray = exerciseLog.sets || new Array(defaultSets).fill(false);
                                            const isFirstIncomplete = exId === firstIncompleteExerciseId;

                                            // Check if this exercise is part of a superset group
                                            if (ex.supersetGroup !== undefined && ex.isEmom) {
                                                // Skip if we already rendered this group
                                                if (renderedGroups.has(ex.supersetGroup)) {
                                                    return;
                                                }
                                                renderedGroups.add(ex.supersetGroup);

                                                // Collect all exercises in this superset group
                                                const groupExercises = section.exercises.filter(
                                                    (e) => e.supersetGroup === ex.supersetGroup
                                                );

                                                // Build SupersetExercise array
                                                const supersetExercises: SupersetExercise[] = groupExercises.map((gex) => {
                                                    const gexId = gex.name.replace(/\s+/g, '_').toLowerCase();
                                                    const gexLog = getExerciseLogEntry(logs, gexId);
                                                    const gexDefaultSets = gex.sets || 3;
                                                    const gexSetArray = gexLog.sets || new Array(gexDefaultSets).fill(false);
                                                    return {
                                                        exId: gexId,
                                                        name: gex.name,
                                                        prescription: gex.prescription,
                                                        notes: gex.notes,
                                                        sets: gexSetArray,
                                                        defaultSets: gexDefaultSets,
                                                        weight: gexLog.weight || '',
                                                        isBodyweight: gex.isBodyweight,
                                                        restTime: gex.rest,
                                                    };
                                                });

                                                // Check if any exercise in the group is first incomplete
                                                const groupHasFirstIncomplete = groupExercises.some(
                                                    (gex) => gex.name.replace(/\s+/g, '_').toLowerCase() === firstIncompleteExerciseId
                                                );

                                                elements.push(
                                                    <SupersetGroup
                                                        key={`superset-${ex.supersetGroup}`}
                                                        exercises={supersetExercises}
                                                        isFirstIncomplete={groupHasFirstIncomplete}
                                                        haptic={haptic}
                                                        onToggleRound={toggleSupersetRound}
                                                        onWeightChange={handleWeightChange}
                                                        onCompleteAllRounds={completeAllSupersetSets}
                                                    />
                                                );
                                                return;
                                            }

                                            // Regular exercise (not in superset)
                                            elements.push(
                                                <CompactExerciseRow
                                                    key={eIdx}
                                                    exId={exId}
                                                    name={ex.name}
                                                    prescription={ex.prescription}
                                                    notes={ex.notes}
                                                    sets={currentSetArray}
                                                    defaultSets={defaultSets}
                                                    weight={exerciseLog.weight || ''}
                                                    isBodyweight={ex.isBodyweight}
                                                    restTime={ex.rest}
                                                    isFirstIncomplete={isFirstIncomplete}
                                                    isEmom={ex.isEmom}
                                                    supersetGroup={ex.supersetGroup}
                                                    supersetPosition={ex.supersetPosition}
                                                    haptic={haptic}
                                                    onToggleSet={toggleSet}
                                                    onWeightChange={handleWeightChange}
                                                    onAddSet={addSet}
                                                    onCompleteAllSets={completeAllSets}
                                                />
                                            );
                                        });

                                        return elements;
                                    }

                                    // Card view - render exercises normally
                                    return section.exercises.map((ex: WorkoutExercise, eIdx: number) => {
                                        const defaultSets = ex.sets || 3;
                                        const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                                        const exerciseLog = getExerciseLogEntry(logs, exId);
                                        const currentSetArray = exerciseLog.sets || new Array(defaultSets).fill(false);

                                        // Card View Rendering (original)
                                        const completedSets = currentSetArray.filter((s) => s).length;
                                        const totalSets = currentSetArray.length;
                                        const hasHistory = getExerciseHistory(ex.name).length > 0;
                                        const isCollapsed = isExerciseCollapsed(exId);
                                        const isFirstIncomplete = exId === firstIncompleteExerciseId;

                                    // Determine superset connector styling
                                    const hasSupersetGroup = ex.supersetGroup !== undefined;
                                    const isFirstInSuperset = ex.supersetPosition === 'first';
                                    const isMiddleInSuperset = ex.supersetPosition === 'middle';
                                    const isLastInSuperset = ex.supersetPosition === 'last';
                                    const showSupersetConnectorTop = isMiddleInSuperset || isLastInSuperset;
                                    const showSupersetConnectorBottom = isFirstInSuperset || isMiddleInSuperset;

                                    return (
                                        <div key={eIdx} id={exId} className="relative scroll-mt-16">
                                            {/* Superset Connector Line (vertical line on the left) */}
                                            {hasSupersetGroup && (
                                                <>
                                                    {/* Top connector */}
                                                    {showSupersetConnectorTop && (
                                                        <div className="absolute left-2 top-0 w-0.5 h-3 bg-gradient-to-b from-amber-500/80 to-amber-500 z-20" />
                                                    )}
                                                    {/* Bottom connector */}
                                                    {showSupersetConnectorBottom && (
                                                        <div className="absolute left-2 bottom-0 w-0.5 h-3 bg-gradient-to-t from-amber-500/80 to-amber-500 z-20" />
                                                    )}
                                                    {/* Superset badge for first exercise in group - positioned above the card */}
                                                    {isFirstInSuperset && (
                                                        <div className="absolute left-4 -top-2 z-20">
                                                            <div className="flex items-center gap-1 bg-amber-500/90 text-amber-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                                                                <Link size={8} strokeWidth={3} />
                                                                <span>SUPERSET</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <div
                                                className={`bg-sys-surface rounded-2xl p-4 border relative z-10 overflow-hidden ${
                                                    completedSets === totalSets
                                                        ? 'border-sys-success/30 bg-sys-success/5'
                                                        : isFirstIncomplete
                                                            ? 'border-sys-accent/50 bg-sys-accent/10'
                                                            : hasSupersetGroup
                                                                ? 'border-amber-500/30 bg-amber-500/5'
                                                                : 'border-white/5'
                                                } ${hasSupersetGroup ? 'ml-4' : ''}`}
                                            >
                                                {/* Progress bar */}
                                                {completedSets > 0 && (
                                                    <div
                                                        className="progress-bar"
                                                        style={{ width: `${(completedSets / totalSets) * 100}%` }}
                                                    ></div>
                                                )}

                                                {/* Exercise Header */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1 pr-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {(() => {
                                                                const effectiveName = getEffectiveExerciseName(ex);
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (hasHistory) {
                                                                                haptic.tick();
                                                                                setShowExerciseHistory(effectiveName);
                                                                            }
                                                                        }}
                                                                        className={`text-left ${hasHistory ? 'cursor-pointer active:opacity-70 transition-opacity' : 'cursor-default'}`}
                                                                        aria-label={hasHistory ? `${effectiveName} - tap to view history` : effectiveName}
                                                                    >
                                                                        <h3 className="text-base font-semibold text-white leading-tight">
                                                                            {effectiveName}
                                                                        </h3>
                                                                    </button>
                                                                );
                                                            })()}
                                                            {/* Swap to alternative button */}
                                                            {ex.alternatives && ex.alternatives.length > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        haptic.tick();
                                                                        setShowAlternativesFor({ name: ex.name, alternatives: ex.alternatives || [] });
                                                                    }}
                                                                    className="h-6 w-6 rounded-full bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                                                                    aria-label="Swap to alternative exercise"
                                                                >
                                                                    <ArrowRightLeft size={12} />
                                                                </button>
                                                            )}
                                                            {/* EMOM Badge */}
                                                            {ex.isEmom && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                                    <Zap size={10} strokeWidth={3} />
                                                                    EMOM
                                                                </span>
                                                            )}
                                                            {completedSets > 0 && (
                                                                <span
                                                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                                        completedSets === totalSets
                                                                            ? 'bg-sys-success/20 text-sys-success'
                                                                            : 'bg-sys-accent/10 text-sys-accent'
                                                                    }`}
                                                                >
                                                                    {completedSets}/{totalSets}
                                                                </span>
                                                            )}
                                                            {/* Notes icon button */}
                                                            {ex.notes && (
                                                                <button
                                                                    onClick={() => {
                                                                        haptic.tick();
                                                                        setShowNotesFor({ exerciseName: getEffectiveExerciseName(ex), notes: ex.notes });
                                                                    }}
                                                                    className="h-6 w-6 rounded-full bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                                                                    aria-label="View notes"
                                                                >
                                                                    <Info size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-sys-onSurfaceVar">
                                                            {ex.prescription}
                                                        </p>
                                                    </div>

                                                    {/* Collapse button */}
                                                    <button
                                                        onClick={() => {
                                                            haptic.tick();
                                                            toggleExerciseCollapse(exId);
                                                        }}
                                                        className="h-8 w-8 min-w-[32px] rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                                                        aria-label={isCollapsed ? 'Expand exercise' : 'Collapse exercise'}
                                                    >
                                                        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                                    </button>
                                                </div>

                                                {/* Collapsed content */}
                                                {!isCollapsed && (
                                                    <>
                                                        {/* Timer buttons - only render if there's at least one button to show */}
                                                        {(ex.rest && ex.rest > 0 || totalSets > 1) && (
                                                            <div className="flex gap-2 mb-3">
                                                                {ex.rest && ex.rest > 0 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            haptic.bump();
                                                                            setTimerSeconds(ex.rest);
                                                                            setTimerActive(true);
                                                                        }}
                                                                        className="h-8 px-3 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar text-xs font-semibold flex items-center justify-center gap-1.5 active:bg-sys-accent/20 transition-colors"
                                                                        aria-label={`Start ${ex.rest} second timer`}
                                                                    >
                                                                        <Timer size={14} />
                                                                        <span>{ex.rest}s</span>
                                                                    </button>
                                                                )}
                                                                {/* EMOM button - only show for exercises with more than 1 set */}
                                                                {totalSets > 1 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            haptic.bump();
                                                                            if (!emomActive) {
                                                                                setEmomSeconds(emomInterval);
                                                                                setEmomActive(true);
                                                                            } else {
                                                                                setEmomActive(false);
                                                                            }
                                                                        }}
                                                                        className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                                                            emomActive
                                                                                ? 'bg-sys-accent text-white'
                                                                                : 'bg-sys-surfaceHigh text-sys-onSurfaceVar active:bg-sys-accent/20'
                                                                        }`}
                                                                        aria-label={`Start EMOM timer with ${emomInterval} second interval`}
                                                                    >
                                                                        <Repeat size={14} />
                                                                        <span>EMOM {emomInterval}s</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Set buttons */}
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {currentSetArray.map((isDone, i) => (
                                                                <button
                                                                    key={`${exId}-set-${i}`}
                                                                    onClick={() => toggleSet(exId, i, defaultSets, ex.rest)}
                                                                    className={`set-button h-11 w-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-sm font-bold ${
                                                                        isDone
                                                                            ? 'completed bg-sys-accent text-white shadow-[0_0_16px_rgba(59,130,246,0.5)]'
                                                                            : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                                                    }`}
                                                                    aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                                                >
                                                                    {isDone ? <Check size={20} /> : i + 1}
                                                                </button>
                                                            ))}

                                                            {/* Add set button */}
                                                            <button
                                                                onClick={() => addSet(exId, defaultSets)}
                                                                className="h-11 w-11 min-w-[44px] min-h-[44px] rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center text-sm font-bold border-2 border-dashed border-white/20 active:scale-95 transition-all"
                                                                aria-label="Add set"
                                                            >
                                                                <Plus size={18} />
                                                            </button>
                                                        </div>

                                                        {/* RPE Selector - shown after completing a set */}
                                                        {rpePrompt?.exerciseId === exId && (
                                                            <RPESelector
                                                                value={getExerciseLogEntry(logs, exId).rpe?.[rpePrompt.setIndex]}
                                                                onChange={(rpe: RPEValue) => {
                                                                    saveRPE(exId, rpePrompt.setIndex, rpe);
                                                                    setRpePrompt(null);
                                                                }}
                                                                onSkip={() => setRpePrompt(null)}
                                                                setNumber={rpePrompt.setIndex + 1}
                                                                showAsPrompt
                                                            />
                                                        )}

                                                        {/* Complete all button - only show if more than 1 set remains incomplete */}
                                                        {currentSetArray.filter((s) => !s).length > 1 && (
                                                            <div className="flex gap-2 mb-3">
                                                                <button
                                                                    onClick={() => completeAllSets(exId, defaultSets)}
                                                                    className="flex-1 h-8 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar text-xs font-semibold flex items-center justify-center gap-1.5 active:bg-sys-accent/20 transition-colors"
                                                                    aria-label="Complete all sets"
                                                                >
                                                                    <CheckCheck size={14} />
                                                                    <span>Complete All</span>
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Weight input for weighted exercises */}
                                                        {!ex.isBodyweight && (
                                                            <div className="pt-3 border-t border-white/5">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <label
                                                                        htmlFor={`${exId}-weight`}
                                                                        className="text-xs text-sys-onSurfaceVar uppercase font-bold"
                                                                    >
                                                                        Load (kg)
                                                                    </label>
                                                                    {/* Only show suggested load if min > 0 and unit is kg */}
                                                                    {ex.loadRange && ex.loadRange.min > 0 && ex.loadRange.unit === 'kg' && (
                                                                        <span className="text-xs text-sys-accent font-medium">
                                                                            Suggested: {ex.loadRange.min === ex.loadRange.max
                                                                                ? `${ex.loadRange.min}kg`
                                                                                : `${ex.loadRange.min}-${ex.loadRange.max}kg`}
                                                                            {ex.loadRange.perHand ? ' per hand' : ''}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="relative flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            haptic.tick();
                                                                            const current = parseFloat(exerciseLog.weight || '0');
                                                                            saveLog(exId, 'weight', Math.max(0, current - 2.5).toString());
                                                                        }}
                                                                        className="h-10 w-10 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors shrink-0"
                                                                        aria-label="Decrease weight by 2.5kg"
                                                                    >
                                                                        <Minus size={16} />
                                                                    </button>
                                                                    <input
                                                                        id={`${exId}-weight`}
                                                                        type="number"
                                                                        inputMode="decimal"
                                                                        value={exerciseLog.weight || ''}
                                                                        onChange={(e) => saveLog(exId, 'weight', e.target.value)}
                                                                        placeholder={ex.loadRange && ex.loadRange.unit === 'kg' && ex.loadRange.min > 0 ? String(ex.loadRange.min) : '0'}
                                                                        className="w-20 h-10 px-2 bg-sys-surfaceHigh rounded-lg text-white text-center text-xl font-bold font-mono outline-none focus:ring-2 focus:ring-sys-accent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            haptic.tick();
                                                                            const current = parseFloat(exerciseLog.weight || '0');
                                                                            saveLog(exId, 'weight', (current + 2.5).toString());
                                                                        }}
                                                                        className="h-10 w-10 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors shrink-0"
                                                                        aria-label="Increase weight by 2.5kg"
                                                                    >
                                                                        <Plus size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                                })()}
                            </div>
                        </div>
                    );
                })}

                {/* Added Exercises Section */}
                {addedExercises.length > 0 && (
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 rounded-md flex items-center justify-center bg-sys-surfaceHigh">
                                <PlusCircle size={14} className="text-sys-success" />
                            </div>
                            <span className="text-sm font-bold text-white uppercase tracking-wide">
                                {isEmptyWorkout ? 'Exercises' : 'Added Exercises'}
                            </span>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                        </div>

                        <div className="space-y-3">
                            {addedExercises.map((ex) => {
                                const exId = `added_${ex.id}`;
                                const exerciseLog = getExerciseLogEntry(logs, exId);
                                const currentSetArray = exerciseLog.sets || new Array(ex.sets).fill(false);
                                const completedSets = currentSetArray.filter((s) => s).length;
                                const totalSets = currentSetArray.length;

                                return (
                                    <div key={ex.id} id={exId} className="relative scroll-mt-16">
                                        <div
                                            className={`bg-sys-surface rounded-2xl p-4 border relative z-10 overflow-hidden ${
                                                completedSets === totalSets
                                                    ? 'border-sys-success/30 bg-sys-success/5'
                                                    : 'border-white/5'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1 pr-2">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-semibold text-white leading-tight">
                                                            {ex.name}
                                                        </h3>
                                                        {completedSets > 0 && (
                                                            <span
                                                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                                    completedSets === totalSets
                                                                        ? 'bg-sys-success/20 text-sys-success'
                                                                        : 'bg-sys-accent/10 text-sys-accent'
                                                                }`}
                                                            >
                                                                {completedSets}/{totalSets}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-sys-onSurfaceVar">
                                                        {ex.sets} sets {ex.weight ? `@ ${ex.weight}kg` : ''}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeAddedExercise(ex.id)}
                                                    className="h-8 w-8 min-w-[32px] rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center active:scale-90 transition-all"
                                                    aria-label="Remove exercise"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            {/* Rest time indicator for added exercises */}
                                            {ex.rest && ex.rest > 0 && (
                                                <div className="mb-2">
                                                    <button
                                                        onClick={() => {
                                                            haptic.bump();
                                                            setTimerSeconds(ex.rest ?? 90);
                                                            setTimerActive(true);
                                                        }}
                                                        className="h-7 px-2.5 rounded-md bg-sys-surfaceHigh text-sys-onSurfaceVar text-xs font-medium flex items-center gap-1 active:bg-sys-accent/20 transition-colors"
                                                        aria-label={`Start ${ex.rest} second timer`}
                                                    >
                                                        <Timer size={12} />
                                                        <span>{ex.rest}s</span>
                                                    </button>
                                                </div>
                                            )}

                                            {/* Set buttons for added exercises */}
                                            <div className="flex flex-wrap gap-2">
                                                {currentSetArray.map((isDone, i) => (
                                                    <button
                                                        key={`${exId}-set-${i}`}
                                                        onClick={() => toggleSet(exId, i, ex.sets, ex.rest ?? 90)}
                                                        className={`set-button h-11 w-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-sm font-bold ${
                                                            isDone
                                                                ? 'completed bg-sys-accent text-white shadow-[0_0_16px_rgba(59,130,246,0.5)]'
                                                                : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                                        }`}
                                                        aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                                    >
                                                        {isDone ? <Check size={20} /> : i + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Add Exercise Button */}
                {!logs.completed && (
                    <div className="mb-4">
                        <button
                            onClick={() => {
                                haptic.bump();
                                setShowExerciseSelector(true);
                            }}
                            className="w-full h-10 px-4 rounded-lg bg-sys-success/10 border border-sys-success/30 text-sys-success text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <PlusCircle size={18} />
                            <span>Add Exercise</span>
                        </button>
                    </div>
                )}

                {/* Finish Workout Button */}
                {!logs.completed && (
                    <div className="mb-8 flex justify-center">
                        <button
                            onClick={() => {
                                haptic.bump();
                                setShowFinishConfirm(true);
                            }}
                            className="h-10 min-h-[40px] px-6 rounded-xl bg-sys-surfaceHigh border border-white/10 text-white font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform relative overflow-hidden"
                        >
                            {/* Progress bar background */}
                            {workoutProgress.totalSets > 0 && (
                                <div
                                    className="absolute inset-0 bg-sys-success/20 transition-all duration-500"
                                    style={{ width: `${(workoutProgress.completedSets / workoutProgress.totalSets) * 100}%` }}
                                />
                            )}
                            <span className="relative z-10 text-sm flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                <span>Finish</span>
                                {workoutProgress.totalSets > 0 && (
                                    <span className="text-sys-onSurfaceVar text-xs">
                                        ({workoutProgress.completedSets}/{workoutProgress.totalSets})
                                    </span>
                                )}
                            </span>
                        </button>
                    </div>
                )}

                {/* Action Bar (Timers only) */}
                <ActionBar
                    timerState={{ time: timerSeconds, active: timerActive }}
                    setTimerActive={setTimerActive}
                    setTimerSeconds={setTimerSeconds}
                    emomState={{ active: emomActive, seconds: emomSeconds, interval: emomInterval }}
                    setEmomActive={setEmomActive}
                    setEmomSeconds={setEmomSeconds}
                    setEmomInterval={setEmomInterval}
                />

                {/* Timer Toast */}
                {showTimerToast && (
                    <div className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4 safe-pt animate-slide-up">
                        <div className="bg-sys-accent px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 max-w-md w-full border border-white/10">
                            <CheckCircle2 size={24} className="text-white flex-shrink-0" />
                            <span className="text-white font-bold text-base flex-1">Rest Complete!</span>
                            <button
                                onClick={() => {
                                    haptic.tick();
                                    setShowTimerToast(false);
                                }}
                                className="h-8 w-8 min-w-[32px] rounded-full hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
                                aria-label="Close notification"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Finish Confirmation Dialog */}
                {showFinishConfirm && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-slide-up safe-pb">
                        <div className="bg-sys-surface rounded-3xl p-6 w-full max-w-md border border-white/10">
                            <h3 className="text-xl font-bold text-white mb-2">Finish Workout?</h3>
                            <p className="text-sys-onSurfaceVar mb-6">
                                Your progress will be saved and logged to history.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        haptic.tick();
                                        setShowFinishConfirm(false);
                                    }}
                                    className="flex-1 h-14 rounded-xl bg-sys-surfaceHigh text-white font-semibold active:scale-95 transition-transform hover-lift"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        haptic.success();
                                        setShowFinishConfirm(false);
                                        handleFinish();
                                    }}
                                    className="flex-1 h-14 rounded-xl text-white font-semibold active:scale-95 transition-transform btn-gradient-success"
                                >
                                    Finish
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Exercise Selector Modal */}
                {showExerciseSelector && exerciseLibrary.length > 0 && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-slide-up">
                        <div className="bg-sys-surface rounded-t-3xl w-full max-h-[85vh] border-t border-white/10 flex flex-col">
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white">Add Exercise</h3>
                                    <button
                                        onClick={() => {
                                            haptic.tick();
                                            setShowExerciseSelector(false);
                                            setExerciseSearchTerm('');
                                        }}
                                        className="h-10 w-10 rounded-xl bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all"
                                        aria-label="Close"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Search exercises..."
                                    value={exerciseSearchTerm}
                                    onChange={(e) => setExerciseSearchTerm(e.target.value)}
                                    className="w-full h-12 px-4 bg-sys-surfaceHigh rounded-xl text-white placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-accent transition-all"
                                />

                                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                    {MUSCLE_FILTERS.map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setSelectedMuscleFilter(filter)}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                                selectedMuscleFilter === filter
                                                    ? 'bg-sys-accent text-white'
                                                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                            }`}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {/* Recent Exercises - shown at top when no search term */}
                                {!debouncedExerciseSearch && (
                                    <RecentExercisesList
                                        exerciseLibrary={exerciseLibrary}
                                        onSelect={(exercise) => {
                                            addExerciseToWorkout(exercise);
                                            addRecentExercise(exercise);
                                        }}
                                    />
                                )}

                                <div className="space-y-3">
                                    {filteredExercises.map((exercise) => (
                                        <ExerciseListItem
                                            key={exercise.id}
                                            exercise={exercise}
                                            onAdd={(ex, sets, weight, rest) => {
                                                addExerciseToWorkout(ex, sets, weight, rest);
                                                addRecentExercise(ex);
                                            }}
                                            haptic={haptic}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Exercise History Modal - Using new ExerciseDetailModal */}
                <ExerciseDetailModal
                    isOpen={!!showExerciseHistory}
                    exerciseName={showExerciseHistory ?? ''}
                    onClose={() => {
                        haptic.tick();
                        setShowExerciseHistory(null);
                    }}
                />

                {/* Alternatives Picker Modal */}
                {showAlternativesFor && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={() => setShowAlternativesFor(null)}>
                        <div
                            className="bg-sys-surface rounded-t-3xl w-full max-w-lg p-5 pb-8 animate-slide-up"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Swap Exercise</h3>
                                <button
                                    onClick={() => {
                                        haptic.tick();
                                        setShowAlternativesFor(null);
                                    }}
                                    className="h-8 w-8 rounded-full bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-sm text-sys-onSurfaceVar mb-4">
                                Choose an alternative for <span className="text-white font-medium">{showAlternativesFor.name}</span>
                            </p>
                            <div className="space-y-2">
                                {/* Option to use original */}
                                <button
                                    onClick={() => {
                                        // Reset to original
                                        setExerciseSwaps((prev) => {
                                            const next = { ...prev };
                                            delete next[showAlternativesFor.name];
                                            return next;
                                        });
                                        haptic.bump();
                                        setShowAlternativesFor(null);
                                    }}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                                        !exerciseSwaps[showAlternativesFor.name]
                                            ? 'bg-sys-accent/10 border-sys-accent/30 text-white'
                                            : 'bg-sys-surfaceHigh border-white/5 text-sys-onSurfaceVar'
                                    }`}
                                >
                                    <span className="font-medium">{showAlternativesFor.name}</span>
                                    <span className="text-xs ml-2 opacity-60">(original)</span>
                                </button>
                                {/* Alternative options */}
                                {showAlternativesFor.alternatives.map((alt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSwapExercise(showAlternativesFor.name, alt)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                                            exerciseSwaps[showAlternativesFor.name] === alt
                                                ? 'bg-sys-accent/10 border-sys-accent/30 text-white'
                                                : 'bg-sys-surfaceHigh border-white/5 text-sys-onSurfaceVar'
                                        }`}
                                    >
                                        <span className="font-medium">{alt}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes Modal */}
                <NotesModal
                    isOpen={!!showNotesFor}
                    exerciseName={showNotesFor?.exerciseName ?? ''}
                    notes={showNotesFor?.notes ?? ''}
                    onClose={() => {
                        haptic.tick();
                        setShowNotesFor(null);
                    }}
                />
            </div>
        </>
    );
};

