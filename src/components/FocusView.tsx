/**
 * FocusView Component
 *
 * Focus mode for workout player that shows one exercise (or superset group) at a time.
 * Supports swipe navigation with slide animations.
 * Supersets are displayed together with all exercises visible.
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Clock, Timer, Gauge, Dumbbell } from './icons';
import { ExerciseCard } from './ExerciseCard';
import { AddedExerciseCard } from './AddedExerciseCard';
import { TimeBadge, formatSecondsShort } from './TimeBadge';
import type { HapticFeedback } from '../hooks';
import type { ExerciseDetailRequest, ExerciseLogEntry } from '../types/workout';
import type { AddedExercise, RPEValue } from '../types';
import type { WorkoutExercise } from '../data/programData';
import { getExerciseHistory } from '../utils/exerciseHistory';
import { getExerciseLogEntry } from '../utils/workoutSession';
import { getExerciseTypeFlags, getExerciseMetadata, createTimerProps, createRPEProps, type TimerProps, type RPEProps, type SaveCallbacks } from '../utils/exerciseProps';
import { computeSetWeightsUpdate, computeSetRepsUpdate } from '../utils/setTableUpdates';
import type { WorkoutSessionData } from '../types/workout';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get section-based color class for progress dot
 */
function getSectionDotColor(sectionName?: string, sectionType?: string): string {
    // Default to on-surface for maximum contrast on both light and dark themes.
    if (!sectionName && !sectionType) return 'bg-sys-onSurface';

    const nameLower = (sectionName || '').toLowerCase();

    if (nameLower.includes('warm') || sectionType === 'prep') {
        return 'bg-warmup-500';
    }
    if (nameLower.includes('skill')) {
        return 'bg-skill-500';
    }
    if (nameLower.includes('main') || nameLower.includes('work') || sectionType === 'main') {
        return 'bg-main-500';
    }
    if (nameLower.includes('accessory') || nameLower.includes('assistance')) {
        return 'bg-accessory-500';
    }
    if (nameLower.includes('core') || nameLower.includes('ab')) {
        return 'bg-core-500';
    }
    if (nameLower.includes('cool') || nameLower.includes('stretch') || sectionType === 'cool') {
        return 'bg-cooldown-500';
    }

    // Fall back to primary (accent was removed in MD3 token cleanup).
    return 'bg-sys-primary';
}

/**
 * Get section-based text color class for labels
 */
function getSectionTextColor(sectionName?: string, sectionType?: string): string {
    if (!sectionName && !sectionType) return 'text-sys-accent';

    const nameLower = (sectionName || '').toLowerCase();

    if (nameLower.includes('warm') || sectionType === 'prep') {
        return 'text-warmup-500';
    }
    if (nameLower.includes('skill')) {
        return 'text-skill-500';
    }
    if (nameLower.includes('main') || nameLower.includes('work') || sectionType === 'main') {
        return 'text-main-500';
    }
    if (nameLower.includes('accessory') || nameLower.includes('assistance')) {
        return 'text-accessory-500';
    }
    if (nameLower.includes('core') || nameLower.includes('ab')) {
        return 'text-core-500';
    }
    if (nameLower.includes('cool') || nameLower.includes('stretch') || sectionType === 'cool') {
        return 'text-cooldown-500';
    }

    return 'text-sys-accent';
}

// ============================================================================
// TYPES
// ============================================================================

export interface FocusItem {
    type: 'single' | 'superset' | 'added';
    exercises: Array<{
        data: WorkoutExercise | AddedExercise;
        id: string;
        type: 'program' | 'added';
        sectionType?: string;
    }>;
    section?: string;
    sectionType?: string;
    supersetGroup?: number;
}

export interface FocusViewProps {
    /** All exercises flattened */
    allExercises: Array<{
        type: 'program' | 'added';
        data: WorkoutExercise | AddedExercise;
        section?: string;
        sectionType?: string;
        id: string;
    }>;
    /** Current focus index */
    focusIndex: number;
    /** Set focus index */
    setFocusIndex: (index: number) => void;
    /** Slide direction for animation */
    slideDirection: 'left' | 'right' | null;
    /** Set slide direction */
    setSlideDirection: (dir: 'left' | 'right' | null) => void;
    /** Workout logs */
    logs: WorkoutSessionData;
    /** First incomplete exercise ID */
    firstIncompleteExerciseId: string | null;
    /** RPE prompt state */
    rpePrompt: { exerciseId: string; setIndex: number } | null;
    /** EMOM timer state */
    emomTimer: {
        active: boolean;
        interval: number;
        toggle: () => void;
    };
    /** Rest timer */
    restTimer: {
        active: boolean;
        start: (seconds: number) => void;
    };
    /** Density timer */
    densityTimer?: {
        active: boolean;
        toggle: (minutes: number) => void;
    };
    /** Flow timer */
    flowTimer?: {
        active: boolean;
        toggle: (minutes: number) => void;
    };
    /** Haptic feedback */
    haptic: HapticFeedback;
    /** Get effective exercise name (with swaps) */
    getEffectiveExerciseName: (ex: WorkoutExercise) => string;
    /** Callbacks */
    onToggleSet: (exId: string, setIndex: number, defaultSets: number, restTime?: number, sectionType?: string, isEmom?: boolean) => void;
    onAddSet: (exId: string, defaultSets: number) => void;
    onSaveLog: (id: string, field: keyof ExerciseLogEntry, value: ExerciseLogEntry[keyof ExerciseLogEntry]) => void;
    onSaveRPE: (exId: string, setIndex: number, rpe: RPEValue) => void;
    onClearRPEPrompt: () => void;
    onShowHistory: (request: ExerciseDetailRequest) => void;
    onShowAlternatives: (name: string, alternatives: string[]) => void;
    onRemoveAddedExercise: (id: string) => void;
    /** Density exercise callbacks for rep tracking and completion */
    onUpdateDensityRepChunks?: (exId: string, chunks: number[]) => void;
    onMarkDensityComplete?: (exId: string, complete: boolean) => void;
    onExpandDensity?: (exId: string) => void;
    /** Selected exercise options by exercise ID */
    selectedExerciseOptions?: Record<string, string>;
    /** Callback when exercise options button is clicked */
    onShowOptions?: (exerciseId: string, exerciseName: string, options: import('../workout-plan-utils').ExerciseOption[]) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FocusView: React.FC<FocusViewProps> = ({
    allExercises,
    focusIndex,
    setFocusIndex,
    slideDirection: _slideDirection, // Kept for API compatibility, native scroll handles animations
    setSlideDirection: _setSlideDirection, // Kept for API compatibility
    logs,
    firstIncompleteExerciseId,
    rpePrompt,
    emomTimer,
    restTimer,
    densityTimer,
    flowTimer,
    haptic,
    getEffectiveExerciseName,
    onToggleSet,
    onAddSet,
    onSaveLog,
    onSaveRPE,
    onClearRPEPrompt,
    onShowHistory,
    onShowAlternatives,
    onRemoveAddedExercise,
    onUpdateDensityRepChunks,
    onMarkDensityComplete,
    onExpandDensity,
    selectedExerciseOptions = {},
    onShowOptions,
}) => {
    // Group exercises into focus items (singles, supersets, added)
    const focusItems = useMemo(() => {
        const items: FocusItem[] = [];
        const processedSupersets = new Set<number>();

        allExercises.forEach((exercise) => {
            if (exercise.type === 'added') {
                // Added exercises are always single items
                items.push({
                    type: 'added',
                    exercises: [exercise],
                    section: undefined,
                    sectionType: undefined,
                });
            } else {
                const workoutEx = exercise.data as WorkoutExercise;

                if (workoutEx.supersetGroup !== undefined) {
                    // Check if we already processed this superset
                    if (processedSupersets.has(workoutEx.supersetGroup)) {
                        return;
                    }
                    processedSupersets.add(workoutEx.supersetGroup);

                    // Collect all exercises in this superset
                    const supersetExercises = allExercises.filter((ex) => {
                        if (ex.type !== 'program') return false;
                        const data = ex.data as WorkoutExercise;
                        return data.supersetGroup === workoutEx.supersetGroup;
                    });

                    items.push({
                        type: 'superset',
                        exercises: supersetExercises,
                        section: exercise.section,
                        sectionType: exercise.sectionType,
                        supersetGroup: workoutEx.supersetGroup,
                    });
                } else {
                    // Single exercise
                    items.push({
                        type: 'single',
                        exercises: [exercise],
                        section: exercise.section,
                        sectionType: exercise.sectionType,
                    });
                }
            }
        });

        return items;
    }, [allExercises]);

    // Ref for the horizontal scroll container
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // Track if we're programmatically scrolling to prevent scroll event feedback loop
    const isProgrammaticScroll = useRef(false);

    // Scroll to the current focus index when it changes (e.g., from button click)
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const targetScroll = focusIndex * container.clientWidth;
        // Only scroll if we're not already at the right position
        if (Math.abs(container.scrollLeft - targetScroll) > 10) {
            isProgrammaticScroll.current = true;
            container.scrollTo({ left: targetScroll, behavior: 'smooth' });
            // Reset flag after scroll animation completes
            setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 350);
        }
    }, [focusIndex]);

    // Handle scroll end to update focus index based on scroll position
    const handleScroll = useCallback(() => {
        // Skip if this is a programmatic scroll
        if (isProgrammaticScroll.current) return;

        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollLeft = container.scrollLeft;
        const itemWidth = container.clientWidth;
        const newIndex = Math.round(scrollLeft / itemWidth);

        if (newIndex !== focusIndex && newIndex >= 0 && newIndex < focusItems.length) {
            haptic.swipe();
            setFocusIndex(newIndex);
        }
    }, [focusIndex, focusItems.length, haptic, setFocusIndex]);

    // Navigation handlers for buttons
    const navigatePrev = useCallback(() => {
        if (focusIndex > 0 && !isProgrammaticScroll.current) {
            isProgrammaticScroll.current = true;
            haptic.swipe();
            setFocusIndex(focusIndex - 1);
        }
    }, [focusIndex, haptic, setFocusIndex]);

    const navigateNext = useCallback(() => {
        if (focusIndex < focusItems.length - 1 && !isProgrammaticScroll.current) {
            isProgrammaticScroll.current = true;
            haptic.swipe();
            setFocusIndex(focusIndex + 1);
        }
    }, [focusIndex, focusItems.length, haptic, setFocusIndex]);

    // Render current focus item
    const renderFocusItem = useCallback((item: FocusItem) => {
        // Create consolidated props for all ExerciseCards in this render
        const timerProps: TimerProps = createTimerProps(
            { active: emomTimer.active, interval: emomTimer.interval, toggle: emomTimer.toggle },
            { active: restTimer.active, start: restTimer.start },
            densityTimer ? { active: densityTimer.active, toggle: densityTimer.toggle } : undefined,
            flowTimer ? { active: flowTimer.active, toggle: flowTimer.toggle } : undefined
        );
        const rpeProps: RPEProps = createRPEProps(rpePrompt, onSaveRPE, onClearRPEPrompt);
        const saveCallbacks: SaveCallbacks = {
            onSaveWeight: (id, weight) => onSaveLog(id, 'weight', weight),
            onSaveNotes: (id, notes) => onSaveLog(id, 'notes', notes),
            onSaveSetWeight: (id, setIndex, value, totalSets) => {
                const entry = getExerciseLogEntry(logs, id);
                const next = computeSetWeightsUpdate(entry.setWeights, entry.sets, setIndex, value, totalSets);
                onSaveLog(id, 'setWeights', next);
            },
            onSaveSetReps: (id, setIndex, reps, totalSets) => {
                const entry = getExerciseLogEntry(logs, id);
                const next = computeSetRepsUpdate(entry.setReps, setIndex, reps, totalSets);
                onSaveLog(id, 'setReps', next);
            },
        };

        if (item.type === 'added') {
            const exercise = item.exercises[0];
            const ex = exercise.data as AddedExercise;
            const exId = exercise.id;
            const defaultSets = ex.sets || 3;
            const exerciseLog = getExerciseLogEntry(logs, exId);
            const currentSetArray = exerciseLog.sets || new Array(defaultSets).fill(false);

            return (
                <AddedExerciseCard
                    key={ex.id}
                    exercise={ex}
                    sets={currentSetArray}
                    haptic={haptic}
                    onToggleSet={onToggleSet}
                    onRemove={onRemoveAddedExercise}
                    onStartRestTimer={restTimer.start}
                />
            );
        }

        if (item.type === 'superset') {
            // Find the best timer for the superset.
            // Priority: Flow -> Density -> EMOM -> Time-based -> Rest
            let supersetTimer = null;

            // Pre-calculate flags and metadata for all exercises in the superset
            const exerciseProps = item.exercises.map(ex => {
                const data = ex.data as WorkoutExercise;
                return {
                    flags: getExerciseTypeFlags(data),
                    meta: getExerciseMetadata(data),
                    data
                };
            });

            // 1. Try Flow
            const flowEx = exerciseProps.find((p) => p.flags.isFlow);
            if (flowEx) {
                const { flags } = flowEx;
                supersetTimer = {
                    icon: <Timer size={16} />,
                    label: `${flags.flowTimeMinutes}m`,
                    active: flowTimer?.active,
                    onClick: () => flowTimer?.toggle(flags.flowTimeMinutes || 0),
                    ariaLabel: flowTimer?.active ? 'Stop flow timer' : `Start ${flags.flowTimeMinutes}m flow timer`,
                };
            }

            // 2. Try Density
            if (!supersetTimer) {
                const densityExIndex = exerciseProps.findIndex((p) => p.flags.isDensity);
                if (densityExIndex !== -1) {
                    const { flags } = exerciseProps[densityExIndex];
                    const densityExId = item.exercises[densityExIndex].id;
                        supersetTimer = {
                            icon: <Gauge size={16} />,
                            label: `${flags.densityTimeMinutes}m`,
                            active: densityTimer?.active,
                            onClick: () => {
                                const isStarting = !densityTimer?.active;
                                densityTimer?.toggle(flags.densityTimeMinutes || 0);
                                if (isStarting) {
                                    onExpandDensity?.(densityExId);
                                }
                            },
                            ariaLabel: densityTimer?.active ? 'Stop density timer' : `Start ${flags.densityTimeMinutes}m density timer`,
                        };
                }
            }

            // 3. Try EMOM (only for main section)
            if (!supersetTimer) {
                const emomEx = exerciseProps.find((p) => p.flags.isEmom);
                if (emomEx && item.sectionType === 'main') {
                    supersetTimer = {
                        icon: <Zap size={16} />,
                        label: formatSecondsShort(emomTimer.interval),
                        active: emomTimer.active,
                        onClick: () => emomTimer.toggle(),
                        ariaLabel: emomTimer.active ? 'Stop EMOM timer' : `Start ${formatSecondsShort(emomTimer.interval)} EMOM timer`,
                    };
                }
            }

            // 4. Try Time-based Exercise
            if (!supersetTimer) {
                const timedEx = exerciseProps.find((p) => {
                    return !!p.flags.timeSeconds && p.flags.timeSeconds > 0;
                });
                if (timedEx) {
                    const { flags } = timedEx;
                    const seconds = flags.timeSeconds || 0;
                    supersetTimer = {
                        icon: <Dumbbell size={16} />,
                        label: <TimeBadge seconds={seconds} variant="inline" />,
                        active: restTimer.active,
                        onClick: () => restTimer.start(seconds),
                        ariaLabel: restTimer.active ? 'Stop timer' : `Start ${formatSecondsShort(seconds)} timer`,
                    };
                }
            }

            // 5. Try Rest (fallback, from last exercise)
            if (!supersetTimer) {
                const restTime = exerciseProps.reduce((acc, p) => {
                    return p.meta.restTime || acc;
                }, 0);
                if (restTime > 0 && (item.sectionType === 'main' || item.sectionType === 'access')) {
                    supersetTimer = {
                        icon: <Clock size={16} />,
                        label: <TimeBadge seconds={restTime} variant="inline" />,
                        active: restTimer.active,
                        onClick: () => restTimer.start(restTime),
                        ariaLabel: `Start ${formatSecondsShort(restTime)} rest timer`,
                    };
                }
            }

            return (
                <div className="space-y-2">
                    {/* Superset header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-sys-tertiaryContainer text-sys-onTertiaryContainer">
                                <Zap size={12} strokeWidth={3} />
                                SUPERSET · {item.exercises.length} exercises
                            </span>
                        </div>

                        {supersetTimer && (
                            <button
                                onClick={() => {
                                    haptic.tick();
                                    supersetTimer.onClick();
                                }}
                                className={`h-11 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-medium ${
                                    supersetTimer.active
                                        ? 'bg-sys-primaryContainer text-sys-onPrimaryContainer shadow-elevation-2 border border-sys-primary/20 scale-[1.02]'
                                        : 'bg-sys-surfaceHigh text-sys-onSurface border border-sys-outline/30'
                                }`}
                                aria-label={supersetTimer.ariaLabel}
                            >
                                {supersetTimer.icon}
                                <span>{supersetTimer.label}</span>
                            </button>
                        )}
                    </div>

                    {/* Render each exercise in the superset */}
                    {item.exercises.map((exercise) => {
                        const ex = exercise.data as WorkoutExercise;
                        const exId = exercise.id;
                        const defaultSets = ex.sets || 3;
                        const exerciseLog = getExerciseLogEntry(logs, exId);
                        const currentSetArray = exerciseLog.sets || new Array(defaultSets).fill(false);
                        const effectiveName = getEffectiveExerciseName(ex);
                        const hasHistory = getExerciseHistory(effectiveName).length > 0;
                        const isFirstIncomplete = exId === firstIncompleteExerciseId;

                        return (
                            <div key={exId} className="mb-3">
                                <ExerciseCard
                                    exId={exId}
                                    name={ex.name}
                                    effectiveName={effectiveName}
                                    {...getExerciseMetadata(ex)}
                                    {...getExerciseTypeFlags(ex)}
                                    sets={currentSetArray}
                                    defaultSets={defaultSets}
                                    exerciseLog={exerciseLog}
                                    hasHistory={hasHistory}
                                    isFirstIncomplete={isFirstIncomplete}
                                    isCollapsed={false}
                                    {...rpeProps}
                                    {...timerProps}
                                    haptic={haptic}
                                    hideCollapseButton={true}
                                    hideTimerBadges={true}
                                    hideTimerControls={true}
                                    hideFocusTimer={true}
                                    onToggleCollapse={() => {}}
                                    onToggleSet={onToggleSet}
                                    onAddSet={onAddSet}
                                    {...saveCallbacks}
                                    onShowHistory={onShowHistory}
                                    onShowAlternatives={onShowAlternatives}
                                    sectionType={exercise.sectionType}
                                    exerciseOptions={ex.exerciseOptions}
                                    selectedOption={selectedExerciseOptions[exId]}
                                    onShowOptions={onShowOptions}
                                    onUpdateDensityRepChunks={onUpdateDensityRepChunks}
                                    onMarkDensityComplete={onMarkDensityComplete}
                                    onExpandDensity={() => onExpandDensity?.(exId)}
                                />
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Single exercise
        const exercise = item.exercises[0];
        const ex = exercise.data as WorkoutExercise;
        const exId = exercise.id;
        const defaultSets = ex.sets || 3;
        const exerciseLog = getExerciseLogEntry(logs, exId);
        const currentSetArray = exerciseLog.sets || new Array(defaultSets).fill(false);
        const effectiveName = getEffectiveExerciseName(ex);
        const hasHistory = getExerciseHistory(effectiveName).length > 0;
        const isFirstIncomplete = exId === firstIncompleteExerciseId;

        return (
            <ExerciseCard
                exId={exId}
                name={ex.name}
                effectiveName={effectiveName}
                {...getExerciseMetadata(ex)}
                {...getExerciseTypeFlags(ex)}
                sets={currentSetArray}
                defaultSets={defaultSets}
                exerciseLog={exerciseLog}
                hasHistory={hasHistory}
                isFirstIncomplete={isFirstIncomplete}
                isCollapsed={false}
                {...rpeProps}
                {...timerProps}
                haptic={haptic}
                hideCollapseButton={true}
                hideTimerBadges={true}
                hideTimerControls={true}
                onToggleCollapse={() => {}}
                onToggleSet={onToggleSet}
                onAddSet={onAddSet}
                {...saveCallbacks}
                onShowHistory={onShowHistory}
                onShowAlternatives={onShowAlternatives}
                sectionType={exercise.sectionType}
                exerciseOptions={ex.exerciseOptions}
                selectedOption={selectedExerciseOptions[exId]}
                onShowOptions={onShowOptions}
                onUpdateDensityRepChunks={onUpdateDensityRepChunks}
                onMarkDensityComplete={onMarkDensityComplete}
                onExpandDensity={() => onExpandDensity?.(exId)}
            />
        );
    }, [
        logs,
        haptic,
        firstIncompleteExerciseId,
        rpePrompt,
        emomTimer,
        restTimer,
        densityTimer,
        flowTimer,
        getEffectiveExerciseName,
        onToggleSet,
        onAddSet,
        onSaveLog,
        onSaveRPE,
        onClearRPEPrompt,
        onShowHistory,
        onShowAlternatives,
        onRemoveAddedExercise,
        selectedExerciseOptions,
        onShowOptions,
        onUpdateDensityRepChunks,
        onMarkDensityComplete,
    ]);

    // Get current item info
    const currentItem = focusItems[focusIndex];
    const currentSection = currentItem?.section;
    const currentSectionType = currentItem?.sectionType;

    /**
     * Get next exercise hint name for a specific index
     */
    const getNextExerciseName = useCallback((idx: number) => {
        if (idx >= focusItems.length - 1) return null;
        const nextItem = focusItems[idx + 1];

        if (nextItem.type === 'added') {
            return nextItem.exercises[0].data.name;
        }

        if (nextItem.type === 'superset') {
            return `Superset: ${nextItem.exercises.length} Exercises`;
        }

        const ex = nextItem.exercises[0].data as WorkoutExercise;
        return ex.name;
    }, [focusItems]);

    // Calculate completion status for each focus item (for progress dots)
    const focusItemCompletionStatus = useMemo(() => {
        return focusItems.map((item) => {
            // Check if all exercises in this focus item are complete
            return item.exercises.every((exercise) => {
                const exerciseLog = getExerciseLogEntry(logs, exercise.id);

                if (exercise.type === 'program') {
                    const ex = exercise.data as WorkoutExercise;
                    const flags = getExerciseTypeFlags(ex);
                    if (flags.isDensity) {
                        return !!exerciseLog.densityComplete;
                    }
                }

                const sets = exerciseLog.sets || [];
                return sets.length > 0 && sets.every((s) => s);
            });
        });
    }, [focusItems, logs]);

    if (focusItems.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-sys-onSurfaceVar min-h-[60vh]">
                No exercises found
            </div>
        );
    }

    // Ensure focusIndex is valid
    const validFocusIndex = Math.min(focusIndex, focusItems.length - 1);
    if (validFocusIndex !== focusIndex) {
        setFocusIndex(validFocusIndex);
    }

    return (
        <div className="flex-1 flex flex-col min-h-[60vh] overflow-hidden">
            <div className="flex-1 flex flex-col">
                {/* Navigation header with progress dots */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={navigatePrev}
                        disabled={focusIndex === 0}
                        className="h-10 w-10 rounded-full bg-sys-surfaceContainerHigh text-sys-onSurface flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all"
                        aria-label="Previous"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col items-center gap-1.5">
                        {/* Progress dots */}
                        <div className="flex items-center gap-1" aria-label="Focus progress">
                            {focusItemCompletionStatus.map((isComplete, idx) => {
                                const item = focusItems[idx];
                                const sectionColor = getSectionDotColor(item?.section, item?.sectionType);
                                return (
                                    <div
                                        key={idx}
                                        className={`rounded-full transition-all duration-300 ${
                                            idx === focusIndex
                                                ? 'h-2.5 w-2.5 ring-2 ring-sys-onSurface ring-offset-1 ring-offset-sys-surface'
                                                : 'h-2 w-2'
                                        } ${
                                            isComplete
                                                ? 'bg-sys-success'
                                                : idx === focusIndex
                                                    ? sectionColor
                                                    : 'bg-sys-onSurface opacity-80 border border-sys-outlineVariant'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                        {/* Section label */}
                        {currentSection && (
                            <div className={`text-[10px] sm:text-xs font-bold leading-tight ${getSectionTextColor(currentSection, currentSectionType)}`}>
                                {currentSection}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={navigateNext}
                            disabled={focusIndex === focusItems.length - 1}
                            className={`h-10 w-10 rounded-full bg-sys-surfaceContainerHigh text-sys-onSurface flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all ${isProgrammaticScroll.current ? 'cursor-wait' : ''}`}
                            aria-label="Next"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Horizontal scroll container with snap - native swipe support */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                    {focusItems.map((item, idx) => {
                        const nextName = getNextExerciseName(idx);
                        return (
                            <div
                                key={idx}
                                className="flex-shrink-0 w-full snap-center snap-always overflow-y-auto px-1 flex flex-col"
                            >
                                <div className="mb-4">
                                    {renderFocusItem(item)}
                                </div>

                                {/* Next exercise hint - displayed right after the card */}
                                {nextName && (
                                    <div className="mt-2 mb-8 text-center animate-in fade-in slide-in-from-bottom-1 duration-500">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-sys-onSurfaceVar opacity-40 mb-1">
                                            Coming Up Next
                                        </p>
                                        <p className="text-sm font-semibold text-sys-onSurface opacity-60 line-clamp-1 px-4">
                                            {nextName}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
