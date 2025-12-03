/**
 * SupersetGroup Component
 *
 * Groups multiple EMOM/superset exercises together with a shared set counter.
 * Instead of each exercise having its own set buttons, the group has one
 * unified round counter that advances all exercises together.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Check, Zap, Info, ChevronDown, CheckCheck, Minus, Plus, Repeat, History } from 'lucide-react';
import { getShortExerciseName } from '../constants';
import { NotesModal } from './modals';
import type { HapticFeedback } from '../hooks';
import type { ExerciseDetailRequest } from '../types/workout';
import type { LoadRange } from '../workout-plan-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface SupersetExercise {
    exId: string;
    name: string;
    originalName?: string;
    prescription?: string;
    notes?: string;
    sets: boolean[];
    defaultSets: number;
    weight: string;
    isBodyweight?: boolean;
    restTime?: number;
    hasHistory?: boolean;
    alternatives?: string[];
    isEmom?: boolean;
    isUnilateral?: boolean;
    loadRange?: LoadRange | null;
}

export interface SupersetGroupProps {
    /** Array of exercises in this superset */
    exercises: SupersetExercise[];
    /** Whether this is the first incomplete group */
    isFirstIncomplete?: boolean;
    /** Haptic feedback interface */
    haptic: HapticFeedback;
    /** EMOM timer state */
    emomTimerActive?: boolean;
    /** EMOM timer interval in seconds */
    emomTimerInterval?: number;
    /** Callback when a round is toggled for all exercises */
    onToggleRound: (exerciseIds: string[], roundIndex: number, defaultSets: number, restTime?: number) => void;
    /** Callback when weight changes for an exercise */
    onWeightChange: (exId: string, weight: string) => void;
    /** Callback to complete all rounds */
    onCompleteAllRounds: (exerciseIds: string[], defaultSets: number) => void;
    /** Callback to toggle EMOM timer */
    onToggleEmomTimer?: () => void;
    /** Callback to show exercise detail/history */
    onShowHistory?: (request: ExerciseDetailRequest) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SupersetGroup: React.FC<SupersetGroupProps> = ({
    exercises,
    isFirstIncomplete = false,
    haptic,
    emomTimerActive = false,
    emomTimerInterval = 60,
    onToggleRound,
    onWeightChange,
    onCompleteAllRounds,
    onToggleEmomTimer,
    onShowHistory,
}) => {
    const [isExpanded, setIsExpanded] = useState(isFirstIncomplete);
    const [showNotesFor, setShowNotesFor] = useState<{ name: string; notes: string } | null>(null);
    const [localWeights, setLocalWeights] = useState<Record<string, string>>(() => {
        const weights: Record<string, string> = {};
        exercises.forEach(ex => {
            weights[ex.exId] = ex.weight;
        });
        return weights;
    });

    // Calculate group completion - all exercises must have same set completed
    const totalRounds = exercises[0]?.defaultSets || 3;
    const completedRounds = useMemo(() => {
        // A round is complete when ALL exercises in the group have that set done
        let completed = 0;
        for (let i = 0; i < totalRounds; i++) {
            const allDone = exercises.every(ex => ex.sets[i] === true);
            if (allDone) completed++;
        }
        return completed;
    }, [exercises, totalRounds]);

    const isComplete = completedRounds === totalRounds && totalRounds > 0;
    const hasIncompleteRounds = completedRounds < totalRounds;

    // Get exercise IDs for callbacks
    const exerciseIds = useMemo(() => exercises.map(ex => ex.exId), [exercises]);

    // Handlers
    const handleToggleExpand = useCallback(() => {
        haptic.tick();
        setIsExpanded(prev => !prev);
    }, [haptic]);

    const handleToggleRound = useCallback((roundIndex: number) => {
        haptic.tick();
        const restTime = exercises[0]?.restTime;
        onToggleRound(exerciseIds, roundIndex, totalRounds, restTime);
    }, [haptic, exerciseIds, totalRounds, exercises, onToggleRound]);

    const handleCompleteAll = useCallback(() => {
        haptic.success();
        onCompleteAllRounds(exerciseIds, totalRounds);
    }, [haptic, exerciseIds, totalRounds, onCompleteAllRounds]);

    const handleToggleEmom = useCallback(() => {
        if (onToggleEmomTimer) {
            haptic.tick();
            onToggleEmomTimer();
        }
    }, [haptic, onToggleEmomTimer]);

    const handleShowNotes = useCallback((name: string, notes: string, e: React.MouseEvent) => {
        e.stopPropagation();
        haptic.tick();
        setShowNotesFor({ name, notes });
    }, [haptic]);

    const handleWeightChange = useCallback((exId: string, weight: string) => {
        setLocalWeights(prev => ({ ...prev, [exId]: weight }));
        onWeightChange(exId, weight);
    }, [onWeightChange]);

    const handleWeightStep = useCallback((exId: string, delta: number) => {
        haptic.tick();
        const currentValue = parseFloat(localWeights[exId]) || 0;
        const newValue = Math.max(0, currentValue + delta);
        const newWeight = newValue.toString();
        handleWeightChange(exId, newWeight);
    }, [haptic, localWeights, handleWeightChange]);

    const handleShowDetails = useCallback((exercise: SupersetExercise, e: React.MouseEvent) => {
        if (!onShowHistory) return;
        e.stopPropagation();
        haptic.tick();
        onShowHistory({
            displayName: exercise.name,
            historyLookupName: exercise.name,
            originalName: exercise.originalName ?? exercise.name,
            alternatives: exercise.alternatives,
            isSwapped: exercise.originalName ? exercise.originalName !== exercise.name : false,
            metadata: {
                prescription: exercise.prescription,
                notes: exercise.notes,
                restTime: exercise.restTime,
                isBodyweight: exercise.isBodyweight,
                isEmom: exercise.isEmom,
                isUnilateral: exercise.isUnilateral,
                loadRange: exercise.loadRange,
            },
        });
    }, [onShowHistory, haptic]);

    // Check which round indices are complete
    const roundStates = useMemo(() => {
        return Array.from({ length: totalRounds }, (_, i) =>
            exercises.every(ex => ex.sets[i] === true)
        );
    }, [exercises, totalRounds]);

    // ============================================================================
    // RENDER: COLLAPSED COMPLETE STATE
    // ============================================================================

    if (isComplete && !isExpanded) {
        return (
            <div className="relative">
                {/* Superset indicator line */}
                <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-amber-500/80 rounded-full" />

                <button
                    type="button"
                    onClick={handleToggleExpand}
                    className="w-full ml-3 h-auto min-h-[36px] px-3 py-2 flex items-center gap-2 bg-sys-success/10 rounded-xl border border-sys-success/20 active:bg-sys-success/20 transition-colors"
                    aria-label="Superset completed, tap to edit"
                >
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-sys-success text-white flex-shrink-0">
                        <Check size={12} strokeWidth={3} />
                    </div>

                    {/* Exercise names stacked */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        {exercises.map((ex, i) => (
                            <span key={i} className="text-sm font-medium text-white truncate text-left" title={ex.name}>
                                {getShortExerciseName(ex.name)}
                            </span>
                        ))}
                    </div>

                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex-shrink-0">
                        <Zap size={8} strokeWidth={3} />
                        EMOM
                    </span>

                    <span className="text-xs text-sys-success font-semibold">
                        {completedRounds}/{totalRounds}
                    </span>
                    <ChevronDown size={14} className="text-sys-onSurfaceVar flex-shrink-0" />
                </button>
            </div>
        );
    }

    // ============================================================================
    // RENDER: EXPANDED/ACTIVE STATE
    // ============================================================================

    return (
        <div className="relative">
            {/* Superset indicator line */}
            <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-amber-500/80 rounded-full" />

            {/* Superset badge */}
            <div className="absolute left-0 top-1 z-20">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
            </div>

            <div className={`ml-3 rounded-xl border overflow-hidden transition-all ${
                isFirstIncomplete
                    ? 'bg-sys-accent/10 border-sys-accent/30'
                    : 'bg-amber-500/5 border-amber-500/20'
            }`}>
                {/* Header with EMOM badge and shared round counter */}
                <div className="px-3 py-2 flex items-center gap-2 border-b border-white/5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sys-tertiary/20 text-sys-tertiary">
                        <Zap size={10} strokeWidth={3} />
                        EMOM SUPERSET
                    </span>

                    {/* EMOM Timer Button */}
                    {onToggleEmomTimer && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleEmom();
                            }}
                            className={`h-7 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                                emomTimerActive
                                    ? 'bg-sys-accent text-white'
                                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                            }`}
                            aria-label={`${emomTimerActive ? 'Stop' : 'Start'} EMOM timer with ${emomTimerInterval} second interval`}
                        >
                            <Repeat size={10} />
                            <span>{emomTimerInterval}s</span>
                        </button>
                    )}

                    <div className="flex-1 pointer-events-none" />

                    {/* Shared Round Buttons */}
                    <div className="flex items-center gap-1">
                        {roundStates.map((isDone, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleRound(i);
                                }}
                                className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-90 ${
                                    isDone
                                        ? 'bg-sys-accent text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                                        : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                }`}
                                aria-label={`Round ${i + 1}${isDone ? ' completed' : ''}`}
                            >
                                {isDone ? <Check size={14} /> : i + 1}
                            </button>
                        ))}
                        {hasIncompleteRounds && totalRounds > 1 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteAll();
                                }}
                                className="h-8 w-8 rounded-lg bg-sys-success/20 text-sys-success flex items-center justify-center active:scale-90 transition-all"
                                aria-label="Complete all rounds"
                            >
                                <CheckCheck size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Exercise List */}
                <div className="divide-y divide-white/5">
                            {exercises.map((ex, i) => (
                                <div key={i} className="px-3 py-2 flex items-center gap-2">
                            {/* Exercise name */}
                            <button
                                type="button"
                                onClick={handleToggleExpand}
                                className="flex-1 min-w-0 flex items-center gap-1.5 text-left"
                            >
                                <span className="text-sm font-medium text-white truncate" title={ex.name}>
                                    {getShortExerciseName(ex.name)}
                                </span>
                                {ex.prescription && (
                                    <span className="text-xs text-sys-onSurfaceVar flex-shrink-0">
                                        {ex.prescription}
                                    </span>
                                )}
                            </button>

                            {/* Notes button */}
                            {ex.notes && (
                                <button
                                    type="button"
                                    onClick={(e) => handleShowNotes(ex.name, ex.notes!, e)}
                                    className="h-6 w-6 rounded-full bg-sys-surfaceHigh flex items-center justify-center flex-shrink-0 active:scale-90"
                                    aria-label="View notes"
                                >
                                    <Info size={12} className="text-sys-onSurfaceVar" />
                                </button>
                            )}

                                    {/* Details button */}
                                    {onShowHistory && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleShowDetails(ex, e)}
                                            className={`h-6 w-6 rounded-full bg-sys-surfaceHigh flex items-center justify-center flex-shrink-0 active:scale-90 ${!ex.hasHistory ? 'opacity-80' : ''}`}
                                            aria-label={`View details and history for ${ex.name}`}
                                        >
                                            <History size={12} className="text-sys-onSurfaceVar" />
                                        </button>
                                    )}

                            {/* Weight stepper (only for weighted exercises) */}
                            {!ex.isBodyweight && (
                                <div className="flex items-center gap-0.5 bg-sys-surfaceHigh rounded-lg overflow-hidden flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleWeightStep(ex.exId, -1)}
                                        className="h-7 w-7 flex items-center justify-center text-sys-onSurfaceVar active:bg-white/10"
                                        aria-label="Decrease weight"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="w-10 text-center text-xs font-mono text-white">
                                        {localWeights[ex.exId] || '0'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleWeightStep(ex.exId, 1)}
                                        className="h-7 w-7 flex items-center justify-center text-sys-onSurfaceVar active:bg-white/10"
                                        aria-label="Increase weight"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Notes Modal */}
            {showNotesFor && (
                <NotesModal
                    exerciseName={showNotesFor.name}
                    notes={showNotesFor.notes}
                    isOpen={true}
                    onClose={() => setShowNotesFor(null)}
                />
            )}
        </div>
    );
};

export default SupersetGroup;
