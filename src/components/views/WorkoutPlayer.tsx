/**
 * WorkoutPlayer Component
 *
 * Main workout execution view with exercise tracking, timers, and set logging.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { FloatingTimer } from '../FloatingTimer';
import { ActionBar } from '../ActionBar';
import { safeGetJSON, safeSetJSON } from '../../utils/storage';
import { useHaptic, useSwipe, useDebounce, type HapticFeedback } from '../../hooks';
import {
    Flame, Dumbbell, Snowflake, Activity, ChevronDown, ChevronUp, Timer, Repeat, Check, Plus, CheckCheck, Minus, PlusCircle, X, CheckCircle2
} from 'lucide-react';
import {
    DEBOUNCE_DELAY_MS,
    MAX_SETS,
} from '../../constants';
import { PROGRAM_DATA, type WorkoutExercise, type WorkoutSection } from '../../data/programData';
import {
    updateExerciseHistory,
    getExerciseHistory,
    calculateExerciseStats,
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
}) => {
    const sessionKey = useMemo(() => `session_w${week}d${day}`, [week, day]);
    const workout = useMemo(() => PROGRAM_DATA.getWorkout(week, day), [week, day]);

    // State
    const [logs, setLogs] = useState<WorkoutSessionData>({});
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [emomSeconds, setEmomSeconds] = useState(0);
    const [emomActive, setEmomActive] = useState(false);
    const [emomInterval, setEmomInterval] = useState(() => safeGetJSON<number>('emom_interval', 60) ?? 60);
    const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});
    const [showTimerToast, setShowTimerToast] = useState(false);
    const [addedExercises, setAddedExercises] = useState<AddedExercise[]>([]);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
    const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<MuscleFilter>('all');
    const [showExerciseHistory, setShowExerciseHistory] = useState<string | null>(null);
    const [workoutNotes, setWorkoutNotes] = useState('');

    const haptic = useHaptic();

    // Swipe handlers for back navigation
    const swipeHandlers = useSwipe({
        onSwipeRight: () => {
            haptic.tick();
            onComplete();
        },
    });

    // Debounce exercise search
    const debouncedExerciseSearch = useDebounce(exerciseSearchTerm, DEBOUNCE_DELAY_MS);

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
            }

            // Start rest timer if completing a set
            if (!wasCompleted && newSets[setIndex] && typeof restTime === 'number' && restTime > 0) {
                setTimerSeconds(restTime);
                setTimerActive(true);
            }
        } catch (error) {
            console.error('Failed to toggle set:', error);
        }
    };

    // @ts-expect-error - Reserved for future RPE UI feature
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _saveRPE = (exId: string, setIndex: number, rpe: RPEValue): void => {
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

    const completeAllSets = (exId: string, defaultSets: number): void => {
        haptic.success();
        const allCompleted = new Array(defaultSets).fill(true);
        saveLog(exId, 'sets', allCompleted);
    };

    const toggleExerciseCollapse = (exId: string): void => {
        setCollapsedExercises((prev) => ({ ...prev, [exId]: !prev[exId] }));
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
            const timestamp = new Date().toISOString();
            const updatedLogs: WorkoutSessionData = {
                ...logs,
                completed: true,
                completedAt: timestamp,
                lastModified: timestamp,
                week,
                day,
                workoutNotes,
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

            // Process scheduled exercises
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
                            week,
                            day,
                            sets: completedSets,
                            totalSets,
                            weight: parseWeight(exLog.weight) ?? undefined,
                            prescription: ex.prescription,
                            isBodyweight: ex.isBodyweight,
                        });
                    }
                });
            });

            // Process added exercises
            addedExercises.forEach((ex) => {
                const exId = `added_${ex.id}`;
                const exLog = getExerciseLogEntry(updatedLogs, exId);
                const sets = exLog.sets || [];
                const completedSets = sets.filter((s) => s).length;
                const totalSets = sets.length || ex.sets || 0;

                exerciseSummary.push({
                    name: `${ex.name} (Added)`,
                    prescription: `${ex.sets} sets`,
                    completedSets,
                    totalSets,
                    weight: ex.weight || exLog.weight || null,
                    isBodyweight: ex.isBodyweight,
                });

                if (completedSets > 0) {
                    updateExerciseHistory(ex.name, {
                        date: completionDate,
                        week,
                        day,
                        sets: completedSets,
                        totalSets,
                        weight: parseWeight(ex.weight || exLog.weight) ?? undefined,
                        prescription: `${ex.sets} sets`,
                        isBodyweight: ex.isBodyweight,
                    });
                }
            });

            // Save to global history
            const historyEntry = {
                week,
                day,
                date: completionDate,
                title: workout.title,
                exercises: exerciseSummary,
                workoutNotes: workoutNotes || null,
            };

            const history = safeGetJSON('global_history', [] as unknown[]) as unknown[];
            const cleanHistory = Array.isArray(history)
                ? history.filter((h: any) => !(h?.week === week && h?.day === day))
                : [];
            cleanHistory.push(historyEntry);
            safeSetJSON('global_history', cleanHistory);

            onComplete();
        } catch (error) {
            console.error('Failed to complete workout:', error);
            alert('Failed to save workout completion. Please try again.');
        }
    };

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================

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
            <FloatingTimer
                seconds={timerSeconds}
                active={timerActive}
                onStop={() => {
                    haptic.bump();
                    setTimerActive(false);
                    setTimerSeconds(0);
                }}
                onAddTime={() => {
                    haptic.bump();
                    setTimerSeconds((s) => s + 30);
                }}
            />

            <div {...swipeHandlers} className="px-5 pb-32 pt-6">
                {/* Workout Notes */}
                <div className="mb-6">
                    <label className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">
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
                        className="w-full h-20 px-4 py-3 bg-sys-surface rounded-xl text-white placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-accent resize-none border border-white/5"
                    />
                </div>

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
                        <div key={sIdx} className="mb-8">
                            {/* Section Header */}
                            <div className="mb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-sys-surfaceHigh">
                                        {section.type === 'prep' ? (
                                            <Flame size={16} className="text-sys-accent" />
                                        ) : section.type === 'main' ? (
                                            <Dumbbell size={16} className="text-sys-success" />
                                        ) : section.type === 'cool' ? (
                                            <Snowflake size={16} className="text-sys-accent" />
                                        ) : (
                                            <Activity size={16} className="text-white" />
                                        )}
                                    </div>
                                    <span className="text-base font-bold text-white uppercase tracking-wide">
                                        {section.name}
                                    </span>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                                    {sectionProgress > 0 && (
                                        <span className="text-xs font-bold text-sys-onSurfaceVar">
                                            {sectionCompletedExercises}/{sectionExercises}
                                        </span>
                                    )}
                                </div>
                                {sectionProgress > 0 && (
                                    <div className="h-1 bg-sys-surfaceHigh rounded-full overflow-hidden mx-1">
                                        <div
                                            className="h-full bg-gradient-to-r from-sys-accent to-sys-success transition-all duration-500"
                                            style={{ width: `${sectionProgress}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>

                            {/* Exercises */}
                            <div className="space-y-5">
                                {section.exercises.map((ex: WorkoutExercise, eIdx: number) => {
                                    const defaultSets = ex.sets || 3;
                                    const exId = ex.name.replace(/\s+/g, '_').toLowerCase();
                                    const exerciseLog = getExerciseLogEntry(logs, exId);
                                    const currentSetArray = exerciseLog.sets || new Array(defaultSets).fill(false);
                                    const completedSets = currentSetArray.filter((s) => s).length;
                                    const totalSets = currentSetArray.length;
                                    const hasHistory = getExerciseHistory(ex.name).length > 0;
                                    const isCollapsed = collapsedExercises[exId];

                                    return (
                                        <div key={eIdx} id={exId} className="relative scroll-mt-20">
                                            <div
                                                className={`bg-sys-surface rounded-3xl p-6 border relative z-10 overflow-hidden ${
                                                    completedSets === totalSets
                                                        ? 'border-sys-success/30 bg-sys-success/5'
                                                        : 'border-white/5'
                                                }`}
                                            >
                                                {/* Progress bar */}
                                                {completedSets > 0 && (
                                                    <div
                                                        className="progress-bar"
                                                        style={{ width: `${(completedSets / totalSets) * 100}%` }}
                                                    ></div>
                                                )}

                                                {/* Exercise Header */}
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex-1 pr-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (hasHistory) {
                                                                        haptic.tick();
                                                                        setShowExerciseHistory(ex.name);
                                                                    }
                                                                }}
                                                                className={`text-left ${hasHistory ? 'cursor-pointer active:opacity-70 transition-opacity' : 'cursor-default'}`}
                                                                aria-label={hasHistory ? `${ex.name} - tap to view history` : ex.name}
                                                            >
                                                                <h3 className="text-lg font-semibold text-white leading-snug">
                                                                    {ex.name}
                                                                </h3>
                                                            </button>
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
                                                        <p className="text-sm text-sys-onSurfaceVar">
                                                            {ex.prescription}
                                                        </p>
                                                        {ex.notes && (
                                                            <p className="text-xs text-sys-onSurfaceVar/70 mt-1">
                                                                {ex.notes}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Collapse button */}
                                                    <button
                                                        onClick={() => {
                                                            haptic.tick();
                                                            toggleExerciseCollapse(exId);
                                                        }}
                                                        className="h-10 w-10 min-w-[40px] rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                                                        aria-label={isCollapsed ? 'Expand exercise' : 'Collapse exercise'}
                                                    >
                                                        {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                                    </button>
                                                </div>

                                                {/* Collapsed content */}
                                                {!isCollapsed && (
                                                    <>
                                                        {/* Timer buttons */}
                                                        <div className="flex gap-2 mb-5">
                                                            {ex.rest && ex.rest > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        haptic.bump();
                                                                        setTimerSeconds(ex.rest);
                                                                        setTimerActive(true);
                                                                    }}
                                                                    className="h-10 px-4 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar text-sm font-semibold flex items-center justify-center gap-2 active:bg-sys-accent/20 transition-colors"
                                                                    aria-label={`Start ${ex.rest} second timer`}
                                                                >
                                                                    <Timer size={16} />
                                                                    <span>{ex.rest}s</span>
                                                                </button>
                                                            )}
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
                                                                className={`h-10 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                                                                    emomActive
                                                                        ? 'bg-sys-accent text-white'
                                                                        : 'bg-sys-surfaceHigh text-sys-onSurfaceVar active:bg-sys-accent/20'
                                                                }`}
                                                                aria-label={`Start EMOM timer with ${emomInterval} second interval`}
                                                            >
                                                                <Repeat size={16} />
                                                                <span>EMOM {emomInterval}s</span>
                                                            </button>
                                                        </div>

                                                        {/* Set buttons */}
                                                        <div className="flex flex-wrap gap-4 mb-5">
                                                            {currentSetArray.map((isDone, i) => (
                                                                <button
                                                                    key={`${exId}-set-${i}`}
                                                                    onClick={() => toggleSet(exId, i, defaultSets, ex.rest)}
                                                                    className={`set-button h-14 w-14 min-w-[56px] min-h-[56px] rounded-2xl flex items-center justify-center text-base font-bold ${
                                                                        isDone
                                                                            ? 'completed bg-sys-accent text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                                                                            : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                                                    }`}
                                                                    aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                                                >
                                                                    {isDone ? <Check size={24} /> : i + 1}
                                                                </button>
                                                            ))}

                                                            {/* Add set button */}
                                                            <button
                                                                onClick={() => addSet(exId, defaultSets)}
                                                                className="h-14 w-14 min-w-[56px] min-h-[56px] rounded-2xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center text-base font-bold border-2 border-dashed border-white/20 active:scale-95 transition-all"
                                                                aria-label="Add set"
                                                            >
                                                                <Plus size={20} />
                                                            </button>
                                                        </div>

                                                        {/* Complete all button */}
                                                        {currentSetArray.some((s) => !s) && (
                                                            <div className="flex gap-3 mb-5">
                                                                <button
                                                                    onClick={() => completeAllSets(exId, defaultSets)}
                                                                    className="flex-1 h-10 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar text-sm font-semibold flex items-center justify-center gap-2 active:bg-sys-accent/20 transition-colors"
                                                                    aria-label="Complete all sets"
                                                                >
                                                                    <CheckCheck size={16} />
                                                                    <span>Complete All</span>
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Weight input for weighted exercises */}
                                                        {!ex.isBodyweight && (
                                                            <div className="pt-4 border-t border-white/5">
                                                                <div className="flex items-center justify-between mb-2">
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
                                                                        className="h-14 w-12 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors shrink-0"
                                                                        aria-label="Decrease weight by 2.5kg"
                                                                    >
                                                                        <Minus size={18} />
                                                                    </button>
                                                                    <input
                                                                        id={`${exId}-weight`}
                                                                        type="number"
                                                                        inputMode="decimal"
                                                                        value={exerciseLog.weight || ''}
                                                                        onChange={(e) => saveLog(exId, 'weight', e.target.value)}
                                                                        placeholder={ex.load ? ex.load.replace(/[^0-9.]/g, '').split('-')[0] || '0' : '0'}
                                                                        className="w-24 h-14 px-2 bg-sys-surfaceHigh rounded-xl text-white text-center text-2xl font-bold font-mono outline-none focus:ring-2 focus:ring-sys-accent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            haptic.tick();
                                                                            const current = parseFloat(exerciseLog.weight || '0');
                                                                            saveLog(exId, 'weight', (current + 2.5).toString());
                                                                        }}
                                                                        className="h-14 w-12 rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors shrink-0"
                                                                        aria-label="Increase weight by 2.5kg"
                                                                    >
                                                                        <Plus size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Added Exercises Section */}
                {addedExercises.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-sys-surfaceHigh">
                                <PlusCircle size={16} className="text-sys-success" />
                            </div>
                            <span className="text-base font-bold text-white uppercase tracking-wide">
                                Added Exercises
                            </span>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                        </div>

                        <div className="space-y-5">
                            {addedExercises.map((ex) => {
                                const exId = `added_${ex.id}`;
                                const exerciseLog = getExerciseLogEntry(logs, exId);
                                const currentSetArray = exerciseLog.sets || new Array(ex.sets).fill(false);
                                const completedSets = currentSetArray.filter((s) => s).length;
                                const totalSets = currentSetArray.length;

                                return (
                                    <div key={ex.id} id={exId} className="relative scroll-mt-20">
                                        <div
                                            className={`bg-sys-surface rounded-3xl p-6 border relative z-10 overflow-hidden ${
                                                completedSets === totalSets
                                                    ? 'border-sys-success/30 bg-sys-success/5'
                                                    : 'border-white/5'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex-1 pr-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-semibold text-white leading-snug">
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
                                                    <p className="text-sm text-sys-onSurfaceVar">
                                                        {ex.sets} sets {ex.weight ? `@ ${ex.weight}kg` : ''}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeAddedExercise(ex.id)}
                                                    className="h-10 w-10 min-w-[40px] rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center active:scale-90 transition-all"
                                                    aria-label="Remove exercise"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            {/* Rest time indicator for added exercises */}
                                            {ex.rest && ex.rest > 0 && (
                                                <div className="mb-3">
                                                    <button
                                                        onClick={() => {
                                                            haptic.bump();
                                                            setTimerSeconds(ex.rest ?? 90);
                                                            setTimerActive(true);
                                                        }}
                                                        className="h-8 px-3 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar text-xs font-medium flex items-center gap-1.5 active:bg-sys-accent/20 transition-colors"
                                                        aria-label={`Start ${ex.rest} second timer`}
                                                    >
                                                        <Timer size={14} />
                                                        <span>{ex.rest}s rest</span>
                                                    </button>
                                                </div>
                                            )}

                                            {/* Set buttons for added exercises */}
                                            <div className="flex flex-wrap gap-4 mb-5">
                                                {currentSetArray.map((isDone, i) => (
                                                    <button
                                                        key={`${exId}-set-${i}`}
                                                        onClick={() => toggleSet(exId, i, ex.sets, ex.rest ?? 90)}
                                                        className={`set-button h-14 w-14 min-w-[56px] min-h-[56px] rounded-2xl flex items-center justify-center text-base font-bold ${
                                                            isDone
                                                                ? 'completed bg-sys-accent text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                                                                : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                                        }`}
                                                        aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                                    >
                                                        {isDone ? <Check size={24} /> : i + 1}
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
                    <div className="mb-6">
                        <button
                            onClick={() => {
                                haptic.bump();
                                setShowExerciseSelector(true);
                            }}
                            className="w-full h-12 px-6 rounded-xl bg-sys-success/10 border border-sys-success/30 text-sys-success font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <PlusCircle size={20} />
                            <span>Add Exercise</span>
                        </button>
                    </div>
                )}

                {/* Action Bar */}
                {!logs.completed && (
                    <ActionBar
                        onFinish={handleFinish}
                        timerState={{ time: timerSeconds, active: timerActive }}
                        setTimerActive={setTimerActive}
                        setTimerSeconds={setTimerSeconds}
                        emomState={{ active: emomActive, seconds: emomSeconds, interval: emomInterval }}
                        setEmomActive={setEmomActive}
                        setEmomSeconds={setEmomSeconds}
                        setEmomInterval={setEmomInterval}
                    />
                )}

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
                                <div className="space-y-3">
                                    {filteredExercises.map((exercise) => (
                                        <ExerciseListItem
                                            key={exercise.id}
                                            exercise={exercise}
                                            onAdd={addExerciseToWorkout}
                                            haptic={haptic}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Exercise History Modal */}
                {showExerciseHistory && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-slide-up">
                        <div className="bg-sys-surface rounded-t-3xl w-full max-h-[85vh] border-t border-white/10 flex flex-col">
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-bold text-white">{showExerciseHistory}</h3>
                                    <button
                                        onClick={() => {
                                            haptic.tick();
                                            setShowExerciseHistory(null);
                                        }}
                                        className="h-10 w-10 rounded-xl bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all"
                                        aria-label="Close"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {(() => {
                                    const history = getExerciseHistory(showExerciseHistory);
                                    const stats = calculateExerciseStats(showExerciseHistory);

                                    return (
                                        <>
                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                    <div className="text-xs text-sys-onSurfaceVar mb-1">Workouts</div>
                                                    <div className="text-2xl font-bold text-white">{stats.totalWorkouts}</div>
                                                </div>
                                                {stats.maxWeight && (
                                                    <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                        <div className="text-xs text-sys-onSurfaceVar mb-1">Max Weight</div>
                                                        <div className="text-2xl font-bold text-sys-accent">{stats.maxWeight}kg</div>
                                                    </div>
                                                )}
                                            </div>

                                            <h4 className="text-sm font-bold text-white mb-3">Recent History</h4>
                                            <div className="space-y-2">
                                                {history.slice(-5).reverse().map((entry, idx) => (
                                                    <div key={idx} className="bg-sys-surfaceHigh rounded-xl p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="text-sm font-semibold text-white">
                                                                    {new Date(entry.date).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                    })}
                                                                </div>
                                                                <div className="text-xs text-sys-onSurfaceVar">
                                                                    W{entry.week} D{entry.day}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-bold text-white">{entry.sets} sets</div>
                                                                {entry.weight && (
                                                                    <div className="text-xs text-sys-accent font-semibold">{entry.weight}kg</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
