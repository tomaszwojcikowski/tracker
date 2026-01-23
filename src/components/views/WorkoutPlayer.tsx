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
import { GestureHint } from '../GestureHint';
import { BottomSheet } from '../BottomSheet';
import { ConfirmDialog } from '../Dialog';
import { Snackbar, useSnackbar } from '../Snackbar';
import { ExerciseDetailModal } from '../modals';
import { ExerciseOptionsModal } from '../modals/ExerciseOptionsModal';
import { AddedExerciseCard } from '../AddedExerciseCard';
import { ExerciseSelectorModal } from '../ExerciseSelectorModal';
import { ExerciseCard } from '../ExerciseCard';
import { FocusView } from '../FocusView';
import { WorkoutSummary } from '../WorkoutSummary';
import type { ExerciseSummaryItem } from '../WorkoutSummary';
import { safeGetJSON, safeSetJSON } from '../../utils/storage';
import {
    useHaptic,
    useSwipe,
    useDebounce,
    useRestTimer,
    useEmomTimer,
    useDensityTimer,
    useExerciseCollapse,
    useKeyboardShortcut,
    useScrollToElement,
} from '../../hooks';
import {
    Flame, Dumbbell, Snowflake, Activity, LayoutGrid, LayoutList, PlusCircle, X, CheckCircle2, Maximize2, StickyNote
} from '../icons';
import {
    DEBOUNCE_DELAY_MS,
    MAX_SETS,
} from '../../constants';
import { PROGRAM_DATA, type WorkoutExercise, type WorkoutSection } from '../../data/programData';
import { useProgram } from '../../context/ProgramContext';
import {
    updateExerciseHistory,
    getExerciseHistory,
} from '../../utils/exerciseHistory';
import {
    parseWeight,
    getExerciseLogEntry,
    normalizeAddedExercises,
    getExerciseId,
} from '../../utils/workoutSession';
import {
    applyExerciseOption,
    getDefaultExerciseOption,
} from '../../utils/exerciseOptions';
import { getSessionKey, getNamespacedKey, getGlobalHistoryKey } from '../../services/storageNamespace';
import { syncService } from '../../services/SyncService';
import type { WorkoutPlayerProps, AddedExercise, Exercise, RPEValue } from '../../types';
import type { WorkoutSessionData, ExerciseLogEntry, MuscleFilter, RPEData, ExerciseDetailRequest } from '../../types/workout';
import type { ExerciseOption } from '../../workout-plan-utils';
import {
    getExerciseTypeFlags,
    getExerciseMetadata,
    createTimerProps,
    createRPEProps,
    type ExerciseOptionsProps,
    type TimerProps,
    type RPEProps,
    type SaveCallbacks,
} from '../../utils/exerciseProps';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color classes for workout section based on name or type
 */
function getSectionColorClasses(sectionName: string, sectionType?: string): {
    iconColor: string;
    gradientBar: string;
    iconBg: string;
} {
    const nameLower = sectionName.toLowerCase();

    // Match by common section names
    if (nameLower.includes('warm') || sectionType === 'prep') {
        return {
            iconColor: 'text-warmup-500',
            gradientBar: 'from-warmup-500/20 to-transparent',
            iconBg: 'bg-warmup-500/20'
        };
    }
    if (nameLower.includes('skill')) {
        return {
            iconColor: 'text-skill-500',
            gradientBar: 'from-skill-500/20 to-transparent',
            iconBg: 'bg-skill-500/20'
        };
    }
    if (nameLower.includes('main') || nameLower.includes('work') || sectionType === 'main') {
        return {
            iconColor: 'text-main-500',
            gradientBar: 'from-main-500/20 to-transparent',
            iconBg: 'bg-main-500/20'
        };
    }
    if (nameLower.includes('accessory') || nameLower.includes('assistance')) {
        return {
            iconColor: 'text-accessory-500',
            gradientBar: 'from-accessory-500/20 to-transparent',
            iconBg: 'bg-accessory-500/20'
        };
    }
    if (nameLower.includes('core') || nameLower.includes('ab')) {
        return {
            iconColor: 'text-core-500',
            gradientBar: 'from-core-500/20 to-transparent',
            iconBg: 'bg-core-500/20'
        };
    }
    if (nameLower.includes('cool') || nameLower.includes('stretch') || sectionType === 'cool') {
        return {
            iconColor: 'text-cooldown-500',
            gradientBar: 'from-cooldown-500/20 to-transparent',
            iconBg: 'bg-cooldown-500/20'
        };
    }

    // Default colors
    return {
        iconColor: 'text-sys-primary',
        gradientBar: 'from-sys-primary/20 to-transparent',
        iconBg: 'bg-sys-primaryContainer/20'
    };
}

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
    onWorkoutTimerStart,
    onProgressChange,
}) => {
    // Get the current program ID from the program context
    const { currentProgramId } = useProgram();

    // For empty workouts, generate a unique session key based on timestamp
    // This allows multiple empty workouts to be tracked separately
    // Empty workout keys are also namespaced per program
    const [emptyWorkoutId] = useState(() => {
        if (isEmptyWorkout) {
            // Check if we have an existing empty workout session to resume
            const existingKey = sessionStorage.getItem('current_empty_workout_key');
            if (existingKey) {
                return existingKey;
            }
            // Create a new empty workout session with namespaced key
            const baseKey = `session_empty_${Date.now()}`;
            const newKey = getNamespacedKey(baseKey);
            sessionStorage.setItem('current_empty_workout_key', newKey);
            return newKey;
        }
        return '';
    });

    const sessionKey = useMemo(() => {
        if (isEmptyWorkout) {
            return emptyWorkoutId;
        }
        // Use namespaced session key for program isolation
        return getSessionKey(week, day);
    }, [week, day, isEmptyWorkout, emptyWorkoutId]);

    const workout = useMemo(() => {
        if (isEmptyWorkout) {
            // Return an empty workout structure for custom workouts
            return { title: 'Custom Workout', sections: [] };
        }
        // Pass the current program ID to ensure we load the correct program's workout
        return PROGRAM_DATA.getWorkout(week, day, currentProgramId ?? undefined);
    }, [week, day, isEmptyWorkout, currentProgramId]);

    // State
    const snackbar = useSnackbar();
    const [logs, setLogs] = useState<WorkoutSessionData>({});
    const [addedExercises, setAddedExercises] = useState<AddedExercise[]>([]);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
    const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<MuscleFilter>('all');
    const [isDensityFullscreen, setIsDensityFullscreen] = useState(false);
    const [exerciseDetail, setExerciseDetail] = useState<ExerciseDetailRequest | null>(null);
    const [workoutNotes, setWorkoutNotes] = useState('');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState<{
        durationSeconds: number;
        exercises: ExerciseSummaryItem[];
    } | null>(null);
    const [compactView, setCompactView] = useState(() =>
        safeGetJSON<boolean>('workout_compact_view', false) ?? false
    );
    const [viewMode, setViewMode] = useState<'list' | 'focus'>(() =>
        safeGetJSON<'list' | 'focus'>('workout_view_mode', 'list') ?? 'list'
    );
    const [focusIndex, setFocusIndex] = useState(0);
    // Animation direction for focus mode transitions: 'left' | 'right' | null
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    // RPE selector state: { exerciseId, setIndex } or null
    const [rpePrompt, setRpePrompt] = useState<{ exerciseId: string; setIndex: number } | null>(null);

    // Exercise swaps: maps original exercise name to swapped alternative name
    const [exerciseSwaps, setExerciseSwaps] = useState<Record<string, string>>({});
    // Currently showing alternatives picker for which exercise
    const [showAlternativesFor, setShowAlternativesFor] = useState<{ name: string; alternatives: string[] } | null>(null);

    // Exercise options: maps exercise ID to selected option name
    const [selectedExerciseOptions, setSelectedExerciseOptions] = useState<Record<string, string>>({});
    // Currently showing options modal for which exercise
    const [showOptionsFor, setShowOptionsFor] = useState<{ exerciseId: string; exerciseName: string; options: import('../../workout-plan-utils').ExerciseOption[] } | null>(null);

    // Unified handler for showing exercise options modal - used across all view modes
    const handleShowOptions = useCallback((exerciseId: string, exerciseName: string, options: ExerciseOption[]) => {
        setShowOptionsFor({ exerciseId, exerciseName, options });
    }, []);

    // Unified handler for showing alternatives picker - used across all view modes
    const handleShowAlternatives = useCallback((name: string, alternatives: string[]) => {
        setShowAlternativesFor({ name, alternatives });
    }, []);

    // Helper to get exercise options props for a given exercise
    const getExerciseOptionsProps = useCallback((exId: string, ex: WorkoutExercise): ExerciseOptionsProps => ({
        exerciseOptions: ex.exerciseOptions,
        selectedOption: selectedExerciseOptions[exId],
        onShowOptions: handleShowOptions,
    }), [selectedExerciseOptions, handleShowOptions]);

    // Unified handler for clearing RPE prompt - used across all view modes
    const handleClearRPEPrompt = useCallback(() => {
        setRpePrompt(null);
    }, []);

    const handleShowExerciseDetail = useCallback((request: ExerciseDetailRequest) => {
        setExerciseDetail(request);
    }, []);

    const handleSwapFromDetails = useCallback((originalName: string, alternatives: string[]) => {
        setExerciseDetail(null);
        setShowAlternativesFor({ name: originalName, alternatives });
    }, []);

    const handleUpdateUserNotes = useCallback((exerciseId: string, notes: string): void => {
        const currentEntry = logs.exercises?.[exerciseId] || {};

        // Skip update if notes haven't changed
        if (currentEntry.userNotes === notes) {
            return;
        }

        const updatedExercises = { ...logs.exercises };
        updatedExercises[exerciseId] = {
            ...currentEntry,
            userNotes: notes,
        };

        const updatedLogs: WorkoutSessionData = {
            ...logs,
            exercises: updatedExercises,
            lastModified: new Date().toISOString(),
        };

        setLogs(updatedLogs);
        safeSetJSON(sessionKey, updatedLogs);

        // Trigger cloud sync if available
        syncService.scheduleSync();
    }, [logs, sessionKey]);

    const haptic = useHaptic();

    // Use extracted timer hooks
    const restTimer = useRestTimer({ haptic });
    const emomTimer = useEmomTimer({ haptic });
    const densityTimer = useDensityTimer({ haptic });
    const flowTimer = useDensityTimer({ haptic }); // Reuse density timer for flow exercises

    // Track which density exercise the current density timer is associated with
    const [activeDensityExerciseId, setActiveDensityExerciseId] = useState<string | null>(null);

    // Track which flow exercise the current flow timer is associated with (for future use)
    const [_activeFlowExerciseId, setActiveFlowExerciseId] = useState<string | null>(null);

    // Track totalRounds for the active EMOM superset
    const [emomTotalRounds, setEmomTotalRounds] = useState<number | undefined>(undefined);

    // ========================================================================
    // TIMER MANAGEMENT - Ensure only one timer runs at a time
    // ========================================================================

    /**
     * Stop all other timers when starting one.
     * Only one timer (rest, emom, or density) should run at a time.
     */
    const stopOtherTimers = useCallback((activeTimerType: 'rest' | 'emom' | 'density' | 'flow') => {
        if (activeTimerType !== 'rest') {
            restTimer.stop();
        }
        if (activeTimerType !== 'emom') {
            emomTimer.stop();
        }
        if (activeTimerType !== 'density') {
            densityTimer.stop();
        }
        if (activeTimerType !== 'flow') {
            flowTimer.stop();
        }
    }, [restTimer, emomTimer, densityTimer, flowTimer]);

    // Shared wrappers: always stop other timers before starting/toggling a timer.
    const wrappedEmomToggle = useCallback((totalRounds?: number) => {
        stopOtherTimers('emom');
        // Store totalRounds when starting the EMOM timer
        if (totalRounds !== undefined) {
            setEmomTotalRounds(totalRounds);
        }
        emomTimer.toggle();
        // Clear totalRounds when stopping (timer was active before toggle)
        if (emomTimer.active) {
            setEmomTotalRounds(undefined);
        }
    }, [stopOtherTimers, emomTimer]);

    const wrappedDensityToggle = useCallback((minutes: number) => {
        stopOtherTimers('density');
        densityTimer.toggle(minutes);
    }, [stopOtherTimers, densityTimer]);

    const wrappedFlowToggle = useCallback((minutes: number) => {
        stopOtherTimers('flow');
        flowTimer.toggle(minutes);
    }, [stopOtherTimers, flowTimer]);

    const wrappedRestStart = useCallback((seconds: number) => {
        stopOtherTimers('rest');
        restTimer.start(seconds);
    }, [stopOtherTimers, restTimer]);

    // Clear association when the density timer fully stops/completes
    useEffect(() => {
        if (!densityTimer.active && densityTimer.seconds === 0) {
            setActiveDensityExerciseId(null);
        }
    }, [densityTimer.active, densityTimer.seconds]);

    // Clear association when the flow timer fully stops/completes
    useEffect(() => {
        if (!flowTimer.active && flowTimer.seconds === 0) {
            setActiveFlowExerciseId(null);
        }
    }, [flowTimer.active, flowTimer.seconds]);

    // Toggle compact view and persist preference
    const toggleCompactView = useCallback(() => {
        haptic.tick();
        setCompactView((prev) => {
            const newValue = !prev;
            safeSetJSON('workout_compact_view', newValue);
            return newValue;
        });
    }, [haptic]);

    // Handle view mode change and persist preference
    const handleViewModeChange = useCallback((newMode: 'list' | 'focus') => {
        setViewMode(newMode);
        safeSetJSON('workout_view_mode', newMode);
    }, []);

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
                    const exId = getExerciseId(ex.name);
                    const exerciseLog = getExerciseLogEntry(logs, exId);
                    const flags = getExerciseTypeFlags(ex);

                    if (flags.isDensity) {
                        // Density is tracked via densityComplete and is always a single "set".
                        totalSets += 1;
                        completedSets += exerciseLog.densityComplete ? 1 : 0;
                    } else {
                        const sets = exerciseLog.sets || [];
                        const defaultSets = ex.sets || 3;
                        const exerciseTotalSets = sets.length > 0 ? sets.length : defaultSets;
                        const exerciseCompletedSets = sets.filter((s) => s).length;
                        totalSets += exerciseTotalSets;
                        completedSets += exerciseCompletedSets;
                    }
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

    // Report workout progress changes to parent for TopAppBar progress bar
    useEffect(() => {
        if (onProgressChange) {
            const progress = workoutProgress.totalSets > 0
                ? (workoutProgress.completedSets / workoutProgress.totalSets) * 100
                : 0;
            onProgressChange({
                progress,
                completedSets: workoutProgress.completedSets,
                totalSets: workoutProgress.totalSets,
            });
        }
    }, [workoutProgress, onProgressChange]);

    // Flatten exercises for focus mode navigation
    const allExercises = useMemo(() => {
        const exercises: Array<{
            type: 'program' | 'added';
            data: WorkoutExercise | AddedExercise;
            section?: string;
            sectionType?: string;
            id: string;
        }> = [];

        workout?.sections?.forEach(section => {
            section.exercises.forEach(ex => {
                exercises.push({
                    type: 'program',
                    data: ex,
                    section: section.name,
                    sectionType: section.type,
                    id: getExerciseId(ex.name)
                });
            });
        });

        addedExercises.forEach(ex => {
            exercises.push({
                type: 'added',
                data: ex,
                id: `added_${ex.id}`
            });
        });

        return exercises;
    }, [workout, addedExercises]);

    // Calculate focus items count (groups supersets together)
    const focusItemsCount = useMemo(() => {
        const processedSupersets = new Set<number>();
        let count = 0;

        allExercises.forEach((exercise) => {
            if (exercise.type === 'added') {
                count++;
            } else {
                const workoutEx = exercise.data as WorkoutExercise;
                if (workoutEx.supersetGroup !== undefined) {
                    if (!processedSupersets.has(workoutEx.supersetGroup)) {
                        processedSupersets.add(workoutEx.supersetGroup);
                        count++;
                    }
                } else {
                    count++;
                }
            }
        });

        return count;
    }, [allExercises]);

    // Swipe handlers - different behavior for focus mode vs list mode
    const swipeHandlers = useSwipe({
        onSwipeRight: () => {
            if (viewMode === 'focus' && focusIndex > 0) {
                haptic.swipe();
                setSlideDirection('right');
                setTimeout(() => {
                    setFocusIndex(focusIndex - 1);
                    setTimeout(() => setSlideDirection(null), 300);
                }, 10);
            } else if (viewMode === 'list') {
                haptic.tick();
                onComplete();
            }
        },
        onSwipeLeft: () => {
            if (viewMode === 'focus' && focusIndex < focusItemsCount - 1) {
                haptic.swipe();
                setSlideDirection('left');
                setTimeout(() => {
                    setFocusIndex(focusIndex + 1);
                    setTimeout(() => setSlideDirection(null), 300);
                }, 10);
            }
        },
    });

    // Ensure focusIndex is always within bounds of focusItems
    useEffect(() => {
        // If focusIndex is out of bounds, reset to last valid index or 0
        if (focusIndex >= focusItemsCount && focusItemsCount > 0) {
            setFocusIndex(focusItemsCount - 1);
        } else if (focusItemsCount === 0) {
            setFocusIndex(0);
        }
    }, [focusItemsCount, focusIndex]);

    // Keyboard navigation for focus mode
    useKeyboardShortcut('ArrowLeft', () => {
        if (viewMode === 'focus' && focusIndex > 0) {
            setSlideDirection('right');
            setTimeout(() => {
                setFocusIndex(focusIndex - 1);
                setTimeout(() => setSlideDirection(null), 300);
            }, 10);
        }
    }, { enabled: viewMode === 'focus' });

    useKeyboardShortcut('ArrowRight', () => {
        if (viewMode === 'focus' && focusIndex < focusItemsCount - 1) {
            setSlideDirection('left');
            setTimeout(() => {
                setFocusIndex(focusIndex + 1);
                setTimeout(() => setSlideDirection(null), 300);
            }, 10);
        }
    }, { enabled: viewMode === 'focus' });

    // Load session data on mount
    useEffect(() => {
        const parsedLogs = safeGetJSON<WorkoutSessionData>(sessionKey, {} as WorkoutSessionData);
        if (parsedLogs && typeof parsedLogs === 'object') {
            setLogs(parsedLogs);
            setAddedExercises(normalizeAddedExercises(parsedLogs.addedExercises));
            setWorkoutNotes(typeof parsedLogs.workoutNotes === 'string' ? parsedLogs.workoutNotes : '');

            // Load or initialize exercise options
            const loadedOptions = parsedLogs.exerciseOptions || {};
            const initializedOptions: Record<string, string> = { ...loadedOptions };

            // Initialize defaults for exercises that have options but no selection
            if (!isEmptyWorkout && workout?.sections) {
                workout.sections.forEach(section => {
                    section.exercises.forEach(ex => {
                        const exId = getExerciseId(ex.name);
                        if (ex.exerciseOptions && ex.exerciseOptions.length > 0 && !initializedOptions[exId]) {
                            // Set default option (first option)
                            const defaultOption = getDefaultExerciseOption(ex.exerciseOptions);
                            if (defaultOption) {
                                initializedOptions[exId] = defaultOption;
                            }
                        }
                    });
                });
            }

            setSelectedExerciseOptions(initializedOptions);
        } else {
            setLogs({});
            setAddedExercises([]);
            setWorkoutNotes('');
            setSelectedExerciseOptions({});
        }
    }, [sessionKey, workout, isEmptyWorkout]);

    // ============================================================================
    // PERSISTENCE FUNCTIONS
    // ============================================================================

    const persistLogs = useCallback((updatedLogs: WorkoutSessionData): void => {
        setLogs(updatedLogs);
        const success = safeSetJSON(sessionKey, updatedLogs);
        if (!success) {
            snackbar.showSnackbar({ message: 'Failed to save progress. Your storage might be full.', type: 'error' });
        } else {
            // Schedule a background sync to cloud
            syncService.scheduleSync();
        }
    }, [sessionKey, snackbar]);

    const saveLog = useCallback((
        id: string,
        field: keyof ExerciseLogEntry,
        value: ExerciseLogEntry[keyof ExerciseLogEntry]
    ): void => {
        const currentEntry = getExerciseLogEntry(logs, id);
        const updatedExercises = {
            ...(logs.exercises ?? {}),
            [id]: {
                ...currentEntry,
                [field]: value,
            },
        };
        const updatedLogs: WorkoutSessionData = {
            ...logs,
            exercises: updatedExercises,
            lastModified: new Date().toISOString(),
        };
        persistLogs(updatedLogs);
    }, [logs, persistLogs]);

    // Density exercise callbacks (v2.5+)
    const updateDensityRepChunks = useCallback((id: string, chunks: number[]): void => {
        saveLog(id, 'densityRepChunks', chunks);
    }, [saveLog]);

    const markDensityComplete = useCallback((id: string, complete: boolean): void => {
        saveLog(id, 'densityComplete', complete);
    }, [saveLog]);

    // Handle selecting an exercise option
    const handleSelectExerciseOption = useCallback((exerciseId: string, optionName: string) => {
        haptic.bump();
        setSelectedExerciseOptions((prev) => ({
            ...prev,
            [exerciseId]: optionName,
        }));

        // Persist to session storage
        const updatedLogs: WorkoutSessionData = {
            ...logs,
            exerciseOptions: {
                ...(logs.exerciseOptions || {}),
                [exerciseId]: optionName,
            },
            lastModified: new Date().toISOString(),
        };
        persistLogs(updatedLogs);
    }, [haptic, logs, persistLogs]);

    // Get effective exercise with selected option applied
    const getExerciseWithOption = useCallback((ex: WorkoutExercise): WorkoutExercise => {
        if (!ex.exerciseOptions || ex.exerciseOptions.length === 0) {
            return ex;
        }

        const exId = getExerciseId(ex.name);
        const selectedOption = selectedExerciseOptions[exId];

        if (!selectedOption) {
            return ex;
        }

        const option = ex.exerciseOptions.find(opt => opt.optionName === selectedOption);
        if (!option) {
            return ex;
        }

        // Apply option overrides to exercise by spreading properties
        const baseProps = ex as unknown as Record<string, unknown>;
        return applyExerciseOption(baseProps, option) as unknown as WorkoutExercise;
    }, [selectedExerciseOptions]);

    // ============================================================================
    // SET TOGGLE & RPE
    // ============================================================================

    const toggleSet = (
        exId: string,
        setIndex: number,
        defaultSets: number,
        restTime?: number,
        sectionType?: string,
        isEmom?: boolean
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
                // Start workout duration timer only when a set is completed.
                onWorkoutTimerStart?.();

                // Show RPE prompt for the completed set
                setRpePrompt({ exerciseId: exId, setIndex });

                // Only start rest timer between sets, not after completing the last set of an exercise.
                // This prevents the timer from activating when moving to the next exercise.
                // Timer should only run when there are still incomplete sets remaining.
                if (isEmom) {
                    // For EMOM exercises, ensure the EMOM timer is running
                    if (!emomTimer.active) {
                        stopOtherTimers('emom');
                        emomTimer.start();
                    }
                } else if (typeof restTime === 'number' && restTime > 0) {
                    // Check if rest timer should be disabled for this section (warmup/cooldown)
                    // sectionType 'prep' = Warm Up, 'cool' = Cooldown
                    const shouldDisableTimer = sectionType === 'prep' || sectionType === 'cool';

                    if (!shouldDisableTimer) {
                        const totalSets = newSets.length;
                        const completedSetsCount = newSets.filter(Boolean).length;
                        const hasIncompleteSets = completedSetsCount < totalSets;

                        if (hasIncompleteSets) {
                            stopOtherTimers('rest');
                            restTimer.start(restTime);
                        }
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
        restTime?: number,
        sectionType?: string,
        isEmom?: boolean
    ): void => {
        try {
            haptic.tick();

            if (!exerciseIds.length || roundIndex < 0 || !Number.isInteger(roundIndex)) {
                console.error('Invalid superset toggle parameters:', { exerciseIds, roundIndex, defaultSets });
                return;
            }

            // Build updated logs with all exercises toggled
            const updatedExercises = { ...(logs.exercises ?? {}) };
            let anyWasCompleted = false;
            let anyWasIncomplete = false;
            let hasIncompleteSetsAfter = false;

            exerciseIds.forEach((exId) => {
                const currentEntry = getExerciseLogEntry(logs, exId);
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

                // Build updated entry
                let updatedEntry: ExerciseLogEntry = {
                    ...currentEntry,
                    sets: newSets,
                };

                // Clear RPE if uncompleting a set
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
                ...logs,
                exercises: updatedExercises,
                lastModified: new Date().toISOString(),
            };
            persistLogs(updatedLogs);

            // Handle RPE prompt and timer - only if completing (not uncompleting)
            if (anyWasIncomplete) {
                // Start workout duration timer only when completing a round.
                onWorkoutTimerStart?.();

                // Clear any previous RPE prompt when completing superset round
                setRpePrompt(null);

                // Start rest timer if completing and there are incomplete sets remaining
                if (isEmom) {
                    // For EMOM supersets, ensure the EMOM timer is running
                    if (!emomTimer.active) {
                        stopOtherTimers('emom');
                        emomTimer.start();
                    }
                } else if (typeof restTime === 'number' && restTime > 0 && hasIncompleteSetsAfter) {
                    // Check if rest timer should be disabled for this section (warmup/cooldown)
                    const shouldDisableTimer = sectionType === 'prep' || sectionType === 'cool';

                    if (!shouldDisableTimer) {
                        stopOtherTimers('rest');
                        restTimer.start(restTime);
                    }
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
    }, [saveLog]);

    const addExerciseToWorkout = (
        exercise: Exercise,
        sets = 3,
        weight = '',
        rest = 90
    ): void => {
        try {
            if (!exercise || !exercise.id || !exercise.name) {
                console.error('Invalid exercise data:', exercise);
                snackbar.showSnackbar({ message: 'Failed to add exercise: Invalid exercise data', type: 'error' });
                return;
            }

            const validSets = Number.isInteger(sets) && sets > 0 && sets <= MAX_SETS ? sets : 3;
            const validRest = Number.isInteger(rest) && rest >= 0 && rest <= 300 ? rest : 90;

            const isDuplicate = addedExercises.some((ex) => ex.id === exercise.id);
            if (isDuplicate) {
                snackbar.showSnackbar({ message: 'This exercise has already been added to the workout', type: 'error' });
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
            snackbar.showSnackbar({ message: 'Failed to add exercise. Please try again.', type: 'error' });
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

    const updateAddedExerciseWeight = (exerciseId: string, weight: string): void => {
        const updatedAddedExercises = addedExercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, weight } : ex
        );
        setAddedExercises(updatedAddedExercises);

        const updatedLogs: WorkoutSessionData = {
            ...logs,
            addedExercises: updatedAddedExercises,
            lastModified: new Date().toISOString(),
        };
        persistLogs(updatedLogs);
    };

    const addSetToExercise = (exerciseId: string): void => {
        const exId = `added_${exerciseId}`;
        const currentEntry = getExerciseLogEntry(logs, exId);
        const currentSets = currentEntry.sets || [];

        // Don't add more than 10 sets (consistent with AddedExerciseCard UI limit)
        if (currentSets.length >= 10) {
            return;
        }

        // Add a new uncompleted set
        const newSets = [...currentSets, false];
        saveLog(exId, 'sets', newSets);
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

            const exerciseSummary: ExerciseSummaryItem[] = [];

            // Process scheduled exercises (only for non-empty workouts)
            if (!isEmptyWorkout) {
                // Get the exercise options from the logs
                const savedExerciseOptions = updatedLogs.exerciseOptions || {};

                workout.sections.forEach((section: WorkoutSection) => {
                    section.exercises.forEach((ex: WorkoutExercise) => {
                        const exId = getExerciseId(ex.name);
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
                            rpe: exLog.rpe || {},
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
                                rpe: exLog.rpe,
                                isBodyweight: ex.isBodyweight,
                                notes: exLog.userNotes || exLog.notes,
                                selectedOption: savedExerciseOptions[exId],
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
                    rpe: exLog.rpe || {},
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
                        rpe: exLog.rpe,
                        isBodyweight: ex.isBodyweight,
                        notes: exLog.userNotes || exLog.notes,
                    });
                }
            });

            // Save to global history with duration (use namespaced key for program isolation)
            const globalHistoryKey = getGlobalHistoryKey();
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

            const history = safeGetJSON(globalHistoryKey, [] as unknown[]) as unknown[];
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
            safeSetJSON(globalHistoryKey, cleanHistory);

            // Clear empty workout session key when completing
            if (isEmptyWorkout) {
                sessionStorage.removeItem('current_empty_workout_key');
            }

            // Automatically sync to cloud if Firebase is configured and user is logged in
            // This ensures workout data is backed up immediately after completion
            try {
                await syncService.syncNow();
            } catch (syncError) {
                // Don't block workout completion if sync fails
                // User can manually sync later from settings
                console.error('Failed to sync workout to cloud:', syncError);
            }

            // Show workout summary instead of immediately going back
            setSummaryData({
                durationSeconds: workoutDurationSeconds,
                exercises: exerciseSummary,
            });
            setShowSummary(true);
        } catch (error) {
            console.error('Failed to complete workout:', error);
            snackbar.showSnackbar({ message: 'Failed to save workout completion. Please try again.', type: 'error' });
        }
    };

    // Handle closing the summary and returning to dashboard
    const handleSummaryClose = useCallback(() => {
        setShowSummary(false);
        setSummaryData(null);
        onComplete();
    }, [onComplete]);

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================

    const activeDensityExercise = useMemo(() => {
        if (!activeDensityExerciseId) return null;

        for (const section of workout.sections) {
            for (const ex of section.exercises) {
                const exId = getExerciseId(ex.name);
                if (exId === activeDensityExerciseId) {
                    return getExerciseWithOption(ex);
                }
            }
        }

        return null;
    }, [activeDensityExerciseId, workout.sections, getExerciseWithOption]);

    const densityRepControlsForFullscreen = useMemo(() => {
        if (!activeDensityExerciseId || !activeDensityExercise) return undefined;

        const flags = getExerciseTypeFlags(activeDensityExercise);
        if (!flags.isDensity || !flags.densityRepsTotal) return undefined;

        const exerciseLog = getExerciseLogEntry(logs, activeDensityExerciseId);

        return {
            targetReps: flags.densityRepsTotal,
            repChunks: exerciseLog.densityRepChunks || [],
            isComplete: exerciseLog.densityComplete || false,
            onUpdateRepChunks: (chunks: number[]) => updateDensityRepChunks(activeDensityExerciseId, chunks),
            onMarkComplete: (complete: boolean) => markDensityComplete(activeDensityExerciseId, complete),
        };
    }, [activeDensityExerciseId, activeDensityExercise, logs, updateDensityRepChunks, markDensityComplete]);

    // Consolidated timer props - used across all exercise card variants
    // Wrapped with stopOtherTimers to ensure only one timer runs at a time
    const timerProps: TimerProps = useMemo(() => {
        return createTimerProps(
            { active: emomTimer.active, interval: emomTimer.interval, toggle: wrappedEmomToggle },
            { start: wrappedRestStart, active: restTimer.active },
            { active: densityTimer.active, toggle: wrappedDensityToggle },
            { active: flowTimer.active, toggle: wrappedFlowToggle }
        );
    }, [emomTimer.active, emomTimer.interval, wrappedEmomToggle, restTimer.active, wrappedRestStart, densityTimer.active, wrappedDensityToggle, flowTimer.active, wrappedFlowToggle]);

    // Consolidated RPE props - used across all exercise card variants
    const rpeProps: RPEProps = useMemo(() => createRPEProps(
        rpePrompt,
        saveRPE,
        handleClearRPEPrompt
    ), [rpePrompt, saveRPE, handleClearRPEPrompt]);

    // Consolidated save callbacks - used across all exercise card variants
    const saveCallbacks: SaveCallbacks = useMemo(() => ({
        onSaveWeight: (id: string, weight: string) => saveLog(id, 'weight', weight),
        onSaveNotes: (id: string, notes: string) => saveLog(id, 'notes', notes),
    }), [saveLog]);

    // Find the first incomplete exercise (the one that should be auto-expanded)
    const firstIncompleteExerciseId = useMemo(() => {
        for (const section of workout.sections) {
            for (const ex of section.exercises) {
                const exId = getExerciseId(ex.name);
                const exerciseWithOptions = getExerciseWithOption(ex);
                const flags = getExerciseTypeFlags(exerciseWithOptions);
                const entry = getExerciseLogEntry(logs, exId);

                if (flags.isDensity) {
                    if (!entry.densityComplete) {
                        return exId;
                    }
                    continue;
                }

                const defaultSets = exerciseWithOptions.sets || 3;
                const sets = entry.sets || new Array(defaultSets).fill(false);
                const completedSets = sets.filter((s) => s).length;
                const totalSets = sets.length;
                if (completedSets < totalSets) {
                    return exId;
                }
            }
        }
        // All exercises complete, return null
        return null;
    }, [workout.sections, logs, getExerciseWithOption]);

    // Use extracted collapse hook
    const exerciseCollapse = useExerciseCollapse({ firstIncompleteExerciseId });

    // Scroll to first incomplete exercise when workout view loads (only in list view)
    // Account for TopAppBar (68px) + section header (42px) so exercise is visible below both
    useScrollToElement({
        elementId: firstIncompleteExerciseId,
        delay: 150,
        enabled: viewMode === 'list',
        offset: 110, // TopAppBar + section header height
    });

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

            <div {...swipeHandlers} className="px-4 pb-20 pt-4">
                {/* Notes Modal */}
                <BottomSheet
                    isOpen={showNotesModal}
                    onClose={() => setShowNotesModal(false)}
                    ariaLabel="Workout Notes"
                    maxHeight={60}
                >
                    <div className="px-6 pt-2 pb-6 safe-pb">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-sys-primary/20 flex items-center justify-center">
                                <StickyNote size={20} className="text-sys-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-sys-onSurface">Workout Notes</h3>
                        </div>
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
                            className="w-full h-32 px-4 py-3 bg-sys-surfaceContainerHigh rounded-xl text-sys-onSurface text-base placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-primary resize-none border border-sys-outlineVariant"
                            autoFocus
                        />
                        <p className="text-xs text-sys-onSurfaceVar mt-2">Notes are saved automatically</p>
                    </div>
                </BottomSheet>

                {/* View Controls Row */}
                <div className="flex justify-between items-center mb-4">
                    {/* Notes Button */}
                    <button
                        onClick={() => {
                            haptic.tick();
                            setShowNotesModal(true);
                        }}
                        className={`btn-icon h-10 w-10 relative ${
                            workoutNotes.trim() ? 'bg-sys-primary/20 text-sys-primary' : 'bg-sys-surfaceContainerHigh text-sys-onSurfaceVar'
                        }`}
                        aria-label="Open workout notes"
                    >
                        <StickyNote size={22} />
                        {workoutNotes.trim() && (
                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-sys-primary rounded-full" />
                        )}
                    </button>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-sys-surfaceContainerHigh rounded-lg p-1 border border-sys-outlineVariant">
                        <button
                            onClick={() => {
                                if (viewMode === 'focus') {
                                    haptic.tick();
                                    handleViewModeChange('list');
                                    if (compactView) toggleCompactView(); // ensure compactView is false
                                } else {
                                    if (compactView) toggleCompactView(); // ensure compactView is false
                                }
                            }}
                            className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${
                                viewMode === 'list' && !compactView ? 'bg-sys-primary text-sys-onPrimary' : 'text-sys-onSurfaceVar'
                            }`}
                            aria-label="Card view"
                            aria-pressed={viewMode === 'list' && !compactView}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => {
                                haptic.tick();
                                handleViewModeChange('list');
                                if (!compactView) {
                                    setCompactView(true);
                                    safeSetJSON('workout_compact_view', true);
                                }
                            }}
                            className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${
                                viewMode === 'list' && compactView ? 'bg-sys-primary text-sys-onPrimary' : 'text-sys-onSurfaceVar'
                            }`}
                            aria-label="Compact list view"
                            aria-pressed={viewMode === 'list' && compactView}
                        >
                            <LayoutList size={20} />
                        </button>
                        <div className="w-[1px] h-4 bg-sys-outlineVariant mx-1" />
                        <button
                            onClick={() => {
                                haptic.tick();
                                handleViewModeChange(viewMode === 'focus' ? 'list' : 'focus');
                            }}
                            className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${
                                viewMode === 'focus' ? 'bg-sys-primary text-sys-onPrimary' : 'text-sys-onSurfaceVar'
                            }`}
                            aria-label="Focus mode"
                            aria-pressed={viewMode === 'focus'}
                        >
                            <Maximize2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Empty Workout Prompt */}
                {isEmptyWorkout && addedExercises.length === 0 && !logs.completed && (
                    <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-sys-primary/10 via-sys-surface to-sys-surfaceContainerHigh border-2 border-dashed border-sys-primary/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-16 w-16 rounded-2xl bg-sys-primary/20 flex items-center justify-center mb-4">
                                <PlusCircle size={32} className="text-sys-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-sys-onSurface mb-2">Build Your Workout</h3>
                            <p className="text-sm text-sys-onSurfaceVar mb-4 max-w-[280px]">
                                Add exercises from the library to create your custom workout session.
                            </p>
                            <button
                                onClick={() => {
                                    haptic.bump();
                                    setShowExerciseSelector(true);
                                }}
                                className="btn-filled h-12 px-6 rounded-xl font-semibold active:scale-95 transition-transform flex items-center gap-2"
                            >
                                <PlusCircle size={22} />
                                <span>Add First Exercise</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Workout Sections */}
                {viewMode === 'focus' ? (
                    <FocusView
                        allExercises={allExercises}
                        focusIndex={focusIndex}
                        setFocusIndex={setFocusIndex}
                        slideDirection={slideDirection}
                        setSlideDirection={setSlideDirection}
                        logs={logs}
                        firstIncompleteExerciseId={firstIncompleteExerciseId}
                        rpePrompt={rpePrompt}
                        emomTimer={{
                            active: emomTimer.active,
                            interval: emomTimer.interval,
                            toggle: wrappedEmomToggle,
                        }}
                        restTimer={{
                            active: restTimer.active,
                            start: wrappedRestStart,
                        }}
                        densityTimer={{
                            active: densityTimer.active,
                            toggle: wrappedDensityToggle,
                        }}
                        flowTimer={{
                            active: flowTimer.active,
                            toggle: wrappedFlowToggle,
                        }}
                        haptic={haptic}
                        getEffectiveExerciseName={getEffectiveExerciseName}
                        onToggleSet={toggleSet}
                        onAddSet={addSet}
                        onSaveLog={saveLog}
                        onSaveRPE={saveRPE}
                        onClearRPEPrompt={() => setRpePrompt(null)}
                        onShowHistory={handleShowExerciseDetail}
                        onShowAlternatives={(name, alts) => setShowAlternativesFor({ name, alternatives: alts })}
                        onRemoveAddedExercise={removeAddedExercise}
                        selectedExerciseOptions={selectedExerciseOptions}
                        onShowOptions={handleShowOptions}
                        onUpdateDensityRepChunks={updateDensityRepChunks}
                        onMarkDensityComplete={markDensityComplete}
                        onExpandDensity={(exId) => {
                            setActiveDensityExerciseId(exId);
                            setIsDensityFullscreen(true);
                        }}
                    />
                ) : (
                    <>
                {workout.sections.map((section: WorkoutSection, sIdx: number) => {
                    const sectionExercises = section.exercises.length;

                    // Single pass: compute completion status for all exercises (used for dots AND count)
                    const exerciseCompletionStatus = section.exercises.map((ex: WorkoutExercise) => {
                        const exId = getExerciseId(ex.name);
                        const entry = getExerciseLogEntry(logs, exId);
                        const flags = getExerciseTypeFlags(ex);

                        if (flags.isDensity) {
                            return !!entry.densityComplete;
                        }

                        const sets = entry.sets || [];
                        return sets.length > 0 && sets.every((s) => s);
                    });

                    // Derive completed count from the same data (no second iteration)
                    const sectionCompletedExercises = exerciseCompletionStatus.filter(Boolean).length;

                    const colors = getSectionColorClasses(section.name, section.type);

                    return (
                        <div key={sIdx} className="mb-5">
                            {/* Section Header - Always sticky below TopAppBar (h-16 + progress bar) */}
                            <div className="sticky top-[68px] z-20 bg-sys-surface/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-sys-outlineVariant">
                                <div className="flex items-center gap-2">
                                    <div className={`rounded-md flex items-center justify-center ${colors.iconBg} h-6 w-6`}>
                                        {section.type === 'prep' ? (
                                            <Flame size={14} className={colors.iconColor} />
                                        ) : section.type === 'main' ? (
                                            <Dumbbell size={14} className={colors.iconColor} />
                                        ) : section.type === 'cool' ? (
                                            <Snowflake size={14} className={colors.iconColor} />
                                        ) : (
                                            <Activity size={14} className={colors.iconColor} />
                                        )}
                                    </div>
                                    <span className="font-bold text-sys-onSurface uppercase tracking-wide text-sm">
                                        {section.name}
                                    </span>

                                    {/* Completion Dots */}
                                    <div className="flex items-center gap-1 ml-auto">
                                        {exerciseCompletionStatus.map((isComplete, dotIdx) => (
                                            <div
                                                key={dotIdx}
                                                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                                                    isComplete
                                                        ? 'bg-sys-success scale-110'
                                                        : 'bg-sys-surfaceContainerHigh border border-sys-outlineVariant'
                                                }`}
                                            />
                                        ))}
                                        {/* Counter for larger sections */}
                                        {sectionExercises > 6 && (
                                            <span className="text-xs font-medium text-sys-onSurfaceVar ml-1">
                                                {sectionCompletedExercises}/{sectionExercises}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Exercises */}
                            <div className="relative mt-2 bg-transparent">
                                <div className={`relative ${compactView ? 'space-y-1' : 'space-y-3'}`}>
                                    {(() => {
                                    // For compact view, group superset exercises together
                                    if (compactView) {
                                        const renderedGroups = new Set<number>();
                                        const elements: React.ReactNode[] = [];

                                        section.exercises.forEach((ex: WorkoutExercise, eIdx: number) => {
                                            // Apply exercise options if selected
                                            const exerciseWithOptions = getExerciseWithOption(ex);
                                            const exId = getExerciseId(ex.name);
                                            const exerciseLog = getExerciseLogEntry(logs, exId);
                                            const flags = getExerciseTypeFlags(exerciseWithOptions);
                                            const defaultSets = flags.isDensity ? 1 : (exerciseWithOptions.sets || 3);
                                            const currentSetArray = flags.isDensity
                                                ? [!!exerciseLog.densityComplete]
                                                : (exerciseLog.sets || new Array(defaultSets).fill(false));
                                            const effectiveName = getEffectiveExerciseName(exerciseWithOptions);
                                            const hasHistory = getExerciseHistory(effectiveName).length > 0;
                                            const isFirstIncomplete = exId === firstIncompleteExerciseId;

                                            // Check if this exercise is part of a superset group
                                            if (ex.supersetGroup !== undefined) {
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
                                                    const gexId = getExerciseId(gex.name);
                                                    const gexLog = getExerciseLogEntry(logs, gexId);
                                                    const gexDefaultSets = gex.sets || 3;
                                                    const gexSetArray = gexLog.sets || new Array(gexDefaultSets).fill(false);
                                                    const gexEffectiveName = getEffectiveExerciseName(gex);
                                                    const gexHasHistory = getExerciseHistory(gexEffectiveName).length > 0;
                                                    return {
                                                        exId: gexId,
                                                        name: gexEffectiveName,
                                                        originalName: gex.name,
                                                        prescription: gex.prescription,
                                                        notes: gex.notes,
                                                        sets: gexSetArray,
                                                        defaultSets: gexDefaultSets,
                                                        weight: gexLog.weight || '',
                                                        isBodyweight: gex.isBodyweight,
                                                        restTime: gex.rest,
                                                        hasHistory: gexHasHistory,
                                                        alternatives: gex.alternatives,
                                                        isEmom: gex.isEmom,
                                                        isUnilateral: gex.isUnilateral,
                                                        loadRange: gex.loadRange,
                                                    };
                                                });

                                                // Check if any exercise in the group is first incomplete
                                                const groupHasFirstIncomplete = groupExercises.some(
                                                    (gex) => getExerciseId(gex.name) === firstIncompleteExerciseId
                                                );

                                                elements.push(
                                                    <SupersetGroup
                                                        key={`superset-${ex.supersetGroup}`}
                                                        exercises={supersetExercises}
                                                        isFirstIncomplete={groupHasFirstIncomplete}
                                                        haptic={haptic}
                                                        emomTimerActive={emomTimer.active}
                                                        emomTimerInterval={emomTimer.interval}
                                                        onToggleRound={toggleSupersetRound}
                                                        onWeightChange={handleWeightChange}
                                                        onToggleEmomTimer={wrappedEmomToggle}
                                                        onShowHistory={handleShowExerciseDetail}
                                                        sectionType={section.type}
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
                                                    displayName={effectiveName}
                                                    {...getExerciseMetadata(exerciseWithOptions)}
                                                    sets={currentSetArray}
                                                    defaultSets={defaultSets}
                                                    weight={exerciseLog.weight || ''}
                                                    isFirstIncomplete={isFirstIncomplete}
                                                    {...getExerciseTypeFlags(exerciseWithOptions)}
                                                    haptic={haptic}
                                                    hasHistory={hasHistory}
                                                    {...getExerciseOptionsProps(exId, ex)}
                                                    onToggleSet={toggleSet}
                                                    onWeightChange={handleWeightChange}
                                                    onAddSet={addSet}
                                                    onShowHistory={handleShowExerciseDetail}
                                                    onStartRestTimer={wrappedRestStart}
                                                    sectionType={section.type}
                                                    restTimerActive={restTimer.active}
                                                    emomTimerActive={emomTimer.active}
                                                    emomTimerInterval={emomTimer.interval}
                                                    onToggleEmomTimer={wrappedEmomToggle}
                                                    densityTimerActive={densityTimer.active}
                                                    onToggleDensityTimer={() => {
                                                        if (exerciseWithOptions.densityTimeMinutes) {
                                                            const isStarting = !densityTimer.active;
                                                            setActiveDensityExerciseId(exId);
                                                            stopOtherTimers('density');
                                                            densityTimer.toggle(exerciseWithOptions.densityTimeMinutes);
                                                            if (isStarting) {
                                                                setIsDensityFullscreen(true);
                                                            }
                                                        }
                                                    }}
                                                    onExpandDensity={() => {
                                                        setActiveDensityExerciseId(exId);
                                                        setIsDensityFullscreen(true);
                                                    }}
                                                    flowTimerActive={flowTimer.active}
                                                    onToggleFlowTimer={() => {
                                                        const flags = getExerciseTypeFlags(exerciseWithOptions);
                                                        if (flags.flowTimeMinutes) {
                                                            setActiveFlowExerciseId(exId);
                                                            stopOtherTimers('flow');
                                                            flowTimer.toggle(flags.flowTimeMinutes);
                                                        }
                                                    }}
                                                    densityRepChunks={exerciseLog.densityRepChunks || []}
                                                    densityComplete={exerciseLog.densityComplete || false}
                                                    onUpdateDensityRepChunks={updateDensityRepChunks}
                                                    onMarkDensityComplete={markDensityComplete}
                                                />
                                            );
                                        });

                                        return elements;
                                    }

                                    // Card view - render exercises normally
                                    return section.exercises.map((ex: WorkoutExercise, eIdx: number) => {
                                        // Apply exercise options if selected
                                        const exerciseWithOptions = getExerciseWithOption(ex);
                                        const exId = getExerciseId(ex.name);
                                        const exerciseLog = getExerciseLogEntry(logs, exId);
                                        const flags = getExerciseTypeFlags(exerciseWithOptions);
                                        const defaultSets = flags.isDensity ? 1 : (exerciseWithOptions.sets || 3);
                                        const currentSetArray = flags.isDensity
                                            ? [!!exerciseLog.densityComplete]
                                            : (exerciseLog.sets || new Array(defaultSets).fill(false));
                                        const effectiveName = getEffectiveExerciseName(exerciseWithOptions);
                                        const hasHistory = getExerciseHistory(effectiveName).length > 0;
                                        const isCollapsed = exerciseCollapse.isCollapsed(exId);
                                        const isFirstIncomplete = exId === firstIncompleteExerciseId;

                                        return (
                                            <ExerciseCard
                                                key={eIdx}
                                                exId={exId}
                                                name={ex.name}
                                                effectiveName={effectiveName}
                                                {...getExerciseMetadata(exerciseWithOptions)}
                                                {...getExerciseTypeFlags(exerciseWithOptions)}
                                                {...getExerciseOptionsProps(exId, ex)}
                                                sets={currentSetArray}
                                                defaultSets={defaultSets}
                                                exerciseLog={exerciseLog}
                                                hasHistory={hasHistory}
                                                isFirstIncomplete={isFirstIncomplete}
                                                isCollapsed={isCollapsed}
                                                {...rpeProps}
                                                {...timerProps}
                                                onToggleDensityTimer={(timeMinutes) => {
                                                    const isStarting = !densityTimer.active;
                                                    setActiveDensityExerciseId(exId);
                                                    stopOtherTimers('density');
                                                    densityTimer.toggle(timeMinutes);
                                                    if (isStarting) {
                                                        setIsDensityFullscreen(true);
                                                    }
                                                }}
                                                onExpandDensity={() => {
                                                    setActiveDensityExerciseId(exId);
                                                    setIsDensityFullscreen(true);
                                                }}
                                                onToggleFlowTimer={(timeMinutes) => {
                                                    setActiveFlowExerciseId(exId);
                                                    stopOtherTimers('flow');
                                                    flowTimer.toggle(timeMinutes);
                                                }}
                                                haptic={haptic}
                                                onToggleCollapse={(id) => exerciseCollapse.toggle(id)}
                                                onToggleSet={toggleSet}
                                                onAddSet={addSet}
                                                {...saveCallbacks}
                                                onShowHistory={handleShowExerciseDetail}
                                                onShowAlternatives={handleShowAlternatives}
                                                onUpdateDensityRepChunks={updateDensityRepChunks}
                                                onMarkDensityComplete={markDensityComplete}
                                                sectionType={section.type}
                                            />
                                        );
                                    });
                                    })()}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Added Exercises Section */}
                {addedExercises.length > 0 && (
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-7 w-7 rounded-md flex items-center justify-center bg-sys-surfaceContainerHigh">
                                <PlusCircle size={18} className="text-sys-success" />
                            </div>
                            <span className="text-sm font-bold text-sys-onSurface uppercase tracking-wide">
                                {isEmptyWorkout ? 'Exercises' : 'Added Exercises'}
                            </span>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-sys-outlineVariant to-transparent rounded-full"></div>
                        </div>

                        <div className="space-y-3">
                            {addedExercises.map((ex) => {
                                const exId = `added_${ex.id}`;
                                const exerciseLog = getExerciseLogEntry(logs, exId);
                                const currentSetArray = exerciseLog.sets || new Array(ex.sets).fill(false);

                                return (
                                    <AddedExerciseCard
                                        key={ex.id}
                                        exercise={ex}
                                        sets={currentSetArray}
                                        haptic={haptic}
                                        onToggleSet={toggleSet}
                                        onRemove={removeAddedExercise}
                                        onStartRestTimer={wrappedRestStart}
                                        restTimerActive={restTimer.active}
                                        onUpdateWeight={updateAddedExerciseWeight}
                                        onAddSet={addSetToExercise}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
                </>
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
                            <PlusCircle size={22} />
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
                            className={`h-10 min-h-[40px] px-6 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-all relative overflow-hidden ${
                                workoutProgress.totalSets > 0 && workoutProgress.completedSets === workoutProgress.totalSets
                                    ? 'bg-sys-success text-sys-onSuccess shadow-lg shadow-sys-success/30 border-0'
                                    : 'bg-sys-surfaceContainerHigh border border-sys-outlineVariant text-sys-onSurface'
                            }`}
                        >
                            {/* Progress bar background for incomplete workouts */}
                            {workoutProgress.totalSets > 0 && workoutProgress.completedSets < workoutProgress.totalSets && (
                                <div
                                    className="absolute inset-0 bg-sys-success/20 transition-all duration-500"
                                    style={{ width: `${(workoutProgress.completedSets / workoutProgress.totalSets) * 100}%` }}
                                />
                            )}
                            <span className="relative z-10 text-sm flex items-center gap-2">
                                <CheckCircle2 size={20} />
                                <span>Finish</span>
                                {workoutProgress.totalSets > 0 && (
                                    <span className={workoutProgress.completedSets === workoutProgress.totalSets ? 'text-sys-onSuccess/90 text-xs' : 'text-sys-onSurfaceVar text-xs'}>
                                        ({workoutProgress.completedSets}/{workoutProgress.totalSets})
                                    </span>
                                )}
                            </span>
                        </button>
                    </div>
                )}

                {/* Action Bar (Timers only) */}
                <ActionBar
                    timerState={{ time: restTimer.seconds, active: restTimer.active }}
                    setTimerActive={restTimer.setActive}
                    setTimerSeconds={restTimer.setSeconds}
                    emomState={{ active: emomTimer.active, seconds: emomTimer.seconds, interval: emomTimer.interval, round: emomTimer.round, totalRounds: emomTotalRounds }}
                    setEmomActive={emomTimer.setActive}
                    setEmomSeconds={emomTimer.setSeconds}
                    setEmomInterval={emomTimer.setIntervalState}
                    densityState={{ active: densityTimer.active, seconds: densityTimer.seconds, timeMinutes: densityTimer.timeMinutes }}
                    setDensityActive={densityTimer.setActive}
                    setDensitySeconds={densityTimer.setSeconds}
                    densityRepControls={densityRepControlsForFullscreen}
                    isDensityFullscreen={isDensityFullscreen}
                    onDensityFullscreenChange={setIsDensityFullscreen}
                />

                {/* Finish Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={showFinishConfirm}
                    onClose={() => {
                        haptic.tick();
                        setShowFinishConfirm(false);
                    }}
                    onConfirm={() => {
                        haptic.success();
                        handleFinish();
                    }}
                    title="Finish Workout?"
                    message="Your progress will be saved and logged to history."
                    confirmLabel="Finish"
                    cancelLabel="Cancel"
                    success
                />

                {/* Exercise Selector Modal */}
                <ExerciseSelectorModal
                    isOpen={showExerciseSelector}
                    searchTerm={exerciseSearchTerm}
                    debouncedSearchTerm={debouncedExerciseSearch}
                    selectedFilter={selectedMuscleFilter}
                    filteredExercises={filteredExercises}
                    exerciseLibrary={exerciseLibrary}
                    haptic={haptic}
                    onSearchChange={setExerciseSearchTerm}
                    onFilterChange={setSelectedMuscleFilter}
                    onAddExercise={addExerciseToWorkout}
                    onClose={() => {
                        setShowExerciseSelector(false);
                        setExerciseSearchTerm('');
                    }}
                />

                {/* Exercise History Modal - Using new ExerciseDetailModal */}
                <ExerciseDetailModal
                    isOpen={!!exerciseDetail}
                    exerciseName={exerciseDetail?.displayName ?? ''}
                    historyLookupName={exerciseDetail?.historyLookupName}
                    originalName={exerciseDetail?.originalName}
                    alternatives={exerciseDetail?.alternatives}
                    isSwapped={exerciseDetail?.isSwapped}
                    metadata={exerciseDetail?.metadata}
                    exerciseId={exerciseDetail?.exerciseId}
                    currentUserNotes={
                        exerciseDetail?.exerciseId
                            ? getExerciseLogEntry(logs, exerciseDetail.exerciseId).userNotes
                            : undefined
                    }
                    onUpdateUserNotes={handleUpdateUserNotes}
                    onSwapExercise={exerciseDetail?.alternatives?.length ? handleSwapFromDetails : undefined}
                    onClose={() => {
                        haptic.tick();
                        setExerciseDetail(null);
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
                                <h3 className="text-lg font-bold text-sys-onSurface">Swap Exercise</h3>
                                <button
                                    onClick={() => {
                                        haptic.tick();
                                        setShowAlternativesFor(null);
                                    }}
                                    className="h-8 w-8 rounded-full bg-sys-surfaceContainerHigh text-sys-onSurfaceVar flex items-center justify-center"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-sm text-sys-onSurfaceVar mb-4">
                                Choose an alternative for <span className="text-sys-onSurface font-medium">{showAlternativesFor.name}</span>
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
                                            ? 'bg-sys-primary/10 border-sys-primary/30 text-sys-onSurface'
                                            : 'bg-sys-surfaceContainerHigh border-sys-outlineVariant text-sys-onSurfaceVar'
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
                                                ? 'bg-sys-primary/10 border-sys-primary/30 text-sys-onSurface'
                                                : 'bg-sys-surfaceContainerHigh border-sys-outlineVariant text-sys-onSurfaceVar'
                                        }`}
                                    >
                                        <span className="font-medium">{alt}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Exercise Options Modal */}
                {showOptionsFor && (
                    <ExerciseOptionsModal
                        isOpen={true}
                        onClose={() => {
                            haptic.tick();
                            setShowOptionsFor(null);
                        }}
                        exerciseName={showOptionsFor.exerciseName}
                        options={showOptionsFor.options}
                        selectedOption={selectedExerciseOptions[showOptionsFor.exerciseId]}
                        onSelectOption={(optionName) => {
                            handleSelectExerciseOption(showOptionsFor.exerciseId, optionName);
                        }}
                    />
                )}

                {/* Notes Modal */}

                {/* Workout Summary Modal */}
                <WorkoutSummary
                    isOpen={showSummary}
                    onClose={handleSummaryClose}
                    title={workout.title || 'Workout'}
                    durationSeconds={summaryData?.durationSeconds || 0}
                    exercises={summaryData?.exercises || []}
                    week={week}
                    day={day}
                    isEmptyWorkout={isEmptyWorkout}
                    workoutNotes={workoutNotes || undefined}
                />
            </div>
            <Snackbar {...snackbar.snackbarProps} />
        </>
    );
};

