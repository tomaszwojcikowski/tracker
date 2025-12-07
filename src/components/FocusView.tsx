/**
 * FocusView Component
 *
 * Focus mode for workout player that shows one exercise (or superset group) at a time.
 * Supports swipe navigation with slide animations.
 * Supersets are displayed together with all exercises visible.
 */

import React, { useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { ExerciseCard } from './ExerciseCard';
import { AddedExerciseCard } from './AddedExerciseCard';
import { useSwipeNavigation } from '../hooks';
import type { HapticFeedback } from '../hooks';
import type { ExerciseDetailRequest, ExerciseLogEntry } from '../types/workout';
import type { AddedExercise, RPEValue } from '../types';
import type { WorkoutExercise } from '../data/programData';
import { getExerciseHistory } from '../utils/exerciseHistory';
import { getExerciseLogEntry } from '../utils/workoutSession';
import type { WorkoutSessionData } from '../types/workout';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get section-based color class for progress dot
 */
function getSectionDotColor(sectionName?: string, sectionType?: string): string {
    if (!sectionName && !sectionType) return 'bg-sys-surfaceHigh';

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

    return 'bg-sys-accent';
}

/**
 * Get section-based text color class for labels
 */
function getSectionTextColor(sectionName?: string, sectionType?: string): string {
    if (!sectionName && !sectionType) return 'text-sys-accent';

    const nameLower = (sectionName || '').toLowerCase();

    if (nameLower.includes('warm') || sectionType === 'prep') {
        return 'text-warmup-400';
    }
    if (nameLower.includes('skill')) {
        return 'text-skill-400';
    }
    if (nameLower.includes('main') || nameLower.includes('work') || sectionType === 'main') {
        return 'text-main-400';
    }
    if (nameLower.includes('accessory') || nameLower.includes('assistance')) {
        return 'text-accessory-400';
    }
    if (nameLower.includes('core') || nameLower.includes('ab')) {
        return 'text-core-400';
    }
    if (nameLower.includes('cool') || nameLower.includes('stretch') || sectionType === 'cool') {
        return 'text-cooldown-400';
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
        start: (seconds: number) => void;
    };
    /** Haptic feedback */
    haptic: HapticFeedback;
    /** Get effective exercise name (with swaps) */
    getEffectiveExerciseName: (ex: WorkoutExercise) => string;
    /** Callbacks */
    onToggleSet: (exId: string, setIndex: number, defaultSets: number, restTime?: number, sectionType?: string, isEmom?: boolean) => void;
    onAddSet: (exId: string, defaultSets: number) => void;
    onCompleteAllSets: (exId: string, defaultSets: number) => void;
    onSaveLog: (id: string, field: keyof ExerciseLogEntry, value: ExerciseLogEntry[keyof ExerciseLogEntry]) => void;
    onSaveRPE: (exId: string, setIndex: number, rpe: RPEValue) => void;
    onClearRPEPrompt: () => void;
    onShowHistory: (request: ExerciseDetailRequest) => void;
    onShowAlternatives: (name: string, alternatives: string[]) => void;
    onRemoveAddedExercise: (id: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FocusView: React.FC<FocusViewProps> = ({
    allExercises,
    focusIndex,
    setFocusIndex,
    slideDirection,
    setSlideDirection,
    logs,
    firstIncompleteExerciseId,
    rpePrompt,
    emomTimer,
    restTimer,
    haptic,
    getEffectiveExerciseName,
    onToggleSet,
    onAddSet,
    onCompleteAllSets,
    onSaveLog,
    onSaveRPE,
    onClearRPEPrompt,
    onShowHistory,
    onShowAlternatives,
    onRemoveAddedExercise,
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

    // Navigation handlers with animation
    const navigatePrev = useCallback(() => {
        if (focusIndex > 0) {
            haptic.swipe();
            setSlideDirection('right');
            setFocusIndex(focusIndex - 1);
            setTimeout(() => setSlideDirection(null), 300);
        }
    }, [focusIndex, haptic, setFocusIndex, setSlideDirection]);

    const navigateNext = useCallback(() => {
        if (focusIndex < focusItems.length - 1) {
            haptic.swipe();
            setSlideDirection('left');
            setFocusIndex(focusIndex + 1);
            setTimeout(() => setSlideDirection(null), 300);
        }
    }, [focusIndex, focusItems.length, haptic, setFocusIndex, setSlideDirection]);

    // Swipe navigation support
    const { handlers: swipeHandlers } = useSwipeNavigation({
        onSwipeLeft: navigateNext,
        onSwipeRight: navigatePrev,
    });

    // Render current focus item
    const renderFocusItem = useCallback((item: FocusItem) => {
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
            return (
                <div className="space-y-2">
                    {/* Superset header */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                            <Zap size={12} strokeWidth={3} />
                            SUPERSET · {item.exercises.length} exercises
                        </span>
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
                                    prescription={ex.prescription}
                                    notes={ex.notes}
                                    isBodyweight={ex.isBodyweight}
                                    isEmom={ex.isEmom}
                                    isUnilateral={ex.isUnilateral}
                                    isAmrap={ex.repsRange?.type === 'amrap'}
                                    isLadder={ex.repsRange?.type === 'ladder'}
                                    ladderReps={ex.repsRange?.type === 'ladder' && Array.isArray(ex.repsRange?.value) ? ex.repsRange.value as number[] : undefined}
                                    restTime={ex.rest}
                                    loadRange={ex.loadRange}
                                    tempoRange={ex.tempoRange}
                                    alternatives={ex.alternatives}
                                    sets={currentSetArray}
                                    defaultSets={defaultSets}
                                    exerciseLog={exerciseLog}
                                    hasHistory={hasHistory}
                                    isFirstIncomplete={isFirstIncomplete}
                                    isCollapsed={false}
                                    supersetGroup={ex.supersetGroup}
                                    supersetPosition={ex.supersetPosition}
                                    rpePrompt={rpePrompt}
                                    emomTimerActive={emomTimer.active}
                                    emomTimerInterval={emomTimer.interval}
                                    haptic={haptic}
                                    hideCollapseButton={true}
                                    onToggleCollapse={() => {}}
                                    onToggleSet={onToggleSet}
                                    onAddSet={onAddSet}
                                    onCompleteAllSets={onCompleteAllSets}
                                    onSaveWeight={(id, weight) => onSaveLog(id, 'weight', weight)}
                                    onSaveRPE={onSaveRPE}
                                    onSaveNotes={(id, notes) => onSaveLog(id, 'notes', notes)}
                                    onClearRPEPrompt={onClearRPEPrompt}
                                    onStartRestTimer={restTimer.start}
                                    onToggleEmomTimer={emomTimer.toggle}
                                    onShowHistory={onShowHistory}
                                    onShowAlternatives={onShowAlternatives}
                                    sectionType={exercise.sectionType}
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
                prescription={ex.prescription}
                notes={ex.notes}
                isBodyweight={ex.isBodyweight}
                isEmom={ex.isEmom}
                isUnilateral={ex.isUnilateral}
                isAmrap={ex.repsRange?.type === 'amrap'}
                isLadder={ex.repsRange?.type === 'ladder'}
                ladderReps={ex.repsRange?.type === 'ladder' && Array.isArray(ex.repsRange?.value) ? ex.repsRange.value as number[] : undefined}
                restTime={ex.rest}
                loadRange={ex.loadRange}
                tempoRange={ex.tempoRange}
                alternatives={ex.alternatives}
                sets={currentSetArray}
                defaultSets={defaultSets}
                exerciseLog={exerciseLog}
                hasHistory={hasHistory}
                isFirstIncomplete={isFirstIncomplete}
                isCollapsed={false}
                supersetGroup={ex.supersetGroup}
                supersetPosition={ex.supersetPosition}
                rpePrompt={rpePrompt}
                emomTimerActive={emomTimer.active}
                emomTimerInterval={emomTimer.interval}
                haptic={haptic}
                hideCollapseButton={true}
                onToggleCollapse={() => {}}
                onToggleSet={onToggleSet}
                onAddSet={onAddSet}
                onCompleteAllSets={onCompleteAllSets}
                onSaveWeight={(id, weight) => onSaveLog(id, 'weight', weight)}
                onSaveRPE={onSaveRPE}
                onSaveNotes={(id, notes) => onSaveLog(id, 'notes', notes)}
                onClearRPEPrompt={onClearRPEPrompt}
                onStartRestTimer={restTimer.start}
                onToggleEmomTimer={emomTimer.toggle}
                onShowHistory={onShowHistory}
                onShowAlternatives={onShowAlternatives}
                sectionType={exercise.sectionType}
            />
        );
    }, [
        logs,
        haptic,
        firstIncompleteExerciseId,
        rpePrompt,
        emomTimer,
        restTimer,
        getEffectiveExerciseName,
        onToggleSet,
        onAddSet,
        onCompleteAllSets,
        onSaveLog,
        onSaveRPE,
        onClearRPEPrompt,
        onShowHistory,
        onShowAlternatives,
        onRemoveAddedExercise,
    ]);

    // Get current item info
    const currentItem = focusItems[focusIndex];
    const currentSection = currentItem?.section;
    const currentSectionType = currentItem?.sectionType;

    // Calculate completion status for each focus item (for progress dots)
    const focusItemCompletionStatus = useMemo(() => {
        return focusItems.map((item) => {
            // Check if all exercises in this focus item are complete
            return item.exercises.every((exercise) => {
                const exerciseLog = getExerciseLogEntry(logs, exercise.id);
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
                        className="h-10 w-10 rounded-full bg-sys-surfaceHigh text-white flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all"
                        aria-label="Previous"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col items-center gap-1.5">
                        {/* Progress dots */}
                        <div className="flex items-center gap-1">
                            {focusItemCompletionStatus.map((isComplete, idx) => {
                                const item = focusItems[idx];
                                const sectionColor = getSectionDotColor(item?.section, item?.sectionType);
                                return (
                                    <div
                                        key={idx}
                                        className={`rounded-full transition-all duration-300 ${
                                            idx === focusIndex
                                                ? 'h-2.5 w-2.5 ring-2 ring-white/50 ring-offset-1 ring-offset-sys-black'
                                                : 'h-2 w-2'
                                        } ${
                                            isComplete
                                                ? 'bg-emerald-400'
                                                : idx === focusIndex
                                                    ? sectionColor
                                                    : `${sectionColor} opacity-40`
                                        }`}
                                    />
                                );
                            })}
                        </div>
                        {/* Section label */}
                        {currentSection && (
                            <div className={`text-xs font-bold ${getSectionTextColor(currentSection, currentSectionType)}`}>
                                {currentSection}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={navigateNext}
                        disabled={focusIndex === focusItems.length - 1}
                        className="h-10 w-10 rounded-full bg-sys-surfaceHigh text-white flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all"
                        aria-label="Next"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Content with swipe animation - positioned container */}
                <div
                    {...swipeHandlers}
                    className="flex-1 relative overflow-hidden"
                >
                    <div
                        key={focusIndex}
                        className={`absolute inset-0 overflow-y-auto ${
                            slideDirection === 'left'
                                ? 'animate-slide-in-right'
                                : slideDirection === 'right'
                                    ? 'animate-slide-in-left'
                                    : ''
                        }`}
                    >
                        {currentItem && renderFocusItem(currentItem)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocusView;
