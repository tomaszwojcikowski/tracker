/**
 * CompactExerciseRow Component
 *
 * High-density exercise row for power users.
 * Features: 32px set buttons, weight stepper (±1kg), tap-to-expand prescription,
 * auto-fill from history, auto-collapse when complete.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Check, Minus, Plus, ChevronDown, Zap, Info, TrendingUp, BarChart2, Timer } from 'lucide-react';
import { getExerciseHistory } from '../utils/exerciseHistory';
import { getShortExerciseName } from '../constants';
import { CompactSetButtons } from './CompactSetButtons';
import type { HapticFeedback } from '../hooks';
import type { ExerciseDetailRequest } from '../types/workout';
import type { TempoRange } from '../workout-plan-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface CompactExerciseRowProps {
    /** Exercise ID (normalized name) */
    exId: string;
    /** Display name */
    name: string;
    /** Optional override when exercise is swapped */
    displayName?: string;
    /** Prescription text (e.g., "3x8-10 reps") */
    prescription?: string;
    /** Optional notes */
    notes?: string;
    /** Array of set completion states */
    sets: boolean[];
    /** Default number of sets */
    defaultSets: number;
    /** Current weight value */
    weight: string;
    /** Whether this is a bodyweight exercise */
    isBodyweight?: boolean;
    /** Rest time in seconds */
    restTime?: number;
    /** Whether this is the first incomplete exercise (highlighted) */
    isFirstIncomplete?: boolean;
    /** Whether this exercise is an EMOM exercise */
    isEmom?: boolean;
    /** Whether this exercise is unilateral */
    isUnilateral?: boolean;
    /** Whether this exercise is AMRAP (as many reps as possible) */
    isAmrap?: boolean;
    /** Whether this exercise uses ladder reps (e.g., 1-2-3) */
    isLadder?: boolean;
    /** Ladder rep values (e.g., [1, 2, 3]) */
    ladderReps?: number[];
    /** Tempo range (e.g., 3-1-1-0) */
    tempoRange?: TempoRange;
    /** Superset group ID (consecutive EMOM exercises share the same group ID) */
    supersetGroup?: number;
    /** Position within superset: 'first', 'middle', 'last', or 'only' */
    supersetPosition?: 'first' | 'middle' | 'last' | 'only';
    /** Haptic feedback interface */
    haptic: HapticFeedback;
    /** Whether this exercise has any historical entries */
    hasHistory?: boolean;
    /** Alternative exercises available for swapping */
    alternatives?: string[];
    /** Callback when set is toggled */
    onToggleSet: (exId: string, setIndex: number, defaultSets: number, restTime?: number, sectionType?: string, isEmom?: boolean) => void;
    /** Callback when weight changes */
    onWeightChange: (exId: string, weight: string) => void;
    /** Callback when add set is clicked */
    onAddSet: (exId: string, defaultSets: number) => void;
    /** Callback when complete all sets is clicked */
    onCompleteAllSets: (exId: string, defaultSets: number) => void;
    /** Callback to show exercise details */
    onShowHistory?: (request: ExerciseDetailRequest) => void;
    /** Callback to start rest timer */
    onStartRestTimer?: (seconds: number) => void;
    /** Section type for determining if rest button should show (hide for prep/cool sections) */
    sectionType?: string;
    /** Rest timer active state */
    restTimerActive?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CompactExerciseRowInner: React.FC<CompactExerciseRowProps> = ({
    exId,
    name,
    displayName = name,
    prescription,
    notes,
    sets,
    defaultSets,
    weight,
    isBodyweight = false,
    restTime,
    isFirstIncomplete = false,
    isEmom = false,
    isUnilateral = false,
    isAmrap = false,
    isLadder = false,
    ladderReps,
    tempoRange,
    supersetGroup,
    supersetPosition,
    haptic,
    hasHistory = false,
    alternatives,
    onToggleSet,
    onWeightChange,
    onAddSet,
    onCompleteAllSets,
    onShowHistory,
    onStartRestTimer,
    sectionType,
    restTimerActive = false,
}) => {
    // State - auto-expand the first incomplete exercise
    const [isExpanded, setIsExpanded] = useState(isFirstIncomplete);
    const [isEditingWeight, setIsEditingWeight] = useState(false);
    const [localWeight, setLocalWeight] = useState(weight);
    const [isPrevWeight, setIsPrevWeight] = useState(false);
    const [userModified, setUserModified] = useState(false);
    const weightInputRef = useRef<HTMLInputElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    // Computed values
    const completedSets = sets.filter(Boolean).length;
    const totalSets = sets.length;
    const isComplete = completedSets === totalSets && totalSets > 0;

    const historyLookupName = displayName;

    // Get short name for display (moved up for use in clipping detection)
    const shortDisplayName = useMemo(() => getShortExerciseName(historyLookupName), [historyLookupName]);

    // Auto-fill weight from history on mount
    useEffect(() => {
        if (!isBodyweight && !weight && !userModified) {
            const history = getExerciseHistory(historyLookupName);
            if (history.length > 0) {
                // Get the most recent entry with a weight
                const lastWithWeight = [...history]
                    .reverse()
                    .find((entry) => entry.weight && entry.weight > 0);
                if (lastWithWeight?.weight) {
                    const prevWeight = String(lastWithWeight.weight);
                    setLocalWeight(prevWeight);
                    setIsPrevWeight(true);
                    onWeightChange(exId, prevWeight);
                }
            }
        }
    }, [historyLookupName, isBodyweight, weight, userModified, exId, onWeightChange]);

    // Sync local weight with prop
    useEffect(() => {
        if (weight !== localWeight && !isEditingWeight) {
            setLocalWeight(weight);
        }
    }, [weight, localWeight, isEditingWeight]);

    // Focus input when editing
    useEffect(() => {
        if (isEditingWeight && weightInputRef.current) {
            weightInputRef.current.focus();
            weightInputRef.current.select();
        }
    }, [isEditingWeight]);

    // Handlers
    const handleToggleExpand = useCallback(() => {
        haptic.tick();
        setIsExpanded((prev) => !prev);
    }, [haptic]);

    const handleWeightTap = useCallback(() => {
        if (!isBodyweight) {
            haptic.tick();
            setIsEditingWeight(true);
        }
    }, [isBodyweight, haptic]);

    const handleWeightBlur = useCallback(() => {
        setIsEditingWeight(false);
        if (localWeight !== weight) {
            setUserModified(true);
            setIsPrevWeight(false);
            onWeightChange(exId, localWeight);
        }
    }, [localWeight, weight, exId, onWeightChange]);

    const handleWeightKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
            }
        },
        []
    );

    const handleWeightStep = useCallback(
        (delta: number) => {
            haptic.tick();
            const currentValue = parseFloat(localWeight) || 0;
            const newValue = Math.max(0, currentValue + delta);
            const newWeight = newValue.toString();
            setLocalWeight(newWeight);
            setUserModified(true);
            setIsPrevWeight(false);
            onWeightChange(exId, newWeight);
        },
        [localWeight, exId, onWeightChange, haptic]
    );

    const handleSetToggle = useCallback(
        (setIndex: number) => {
            onToggleSet(exId, setIndex, defaultSets, restTime, sectionType, isEmom);
        },
        [exId, defaultSets, restTime, onToggleSet, sectionType, isEmom]
    );

    const handleAddSet = useCallback(() => {
        onAddSet(exId, defaultSets);
    }, [exId, defaultSets, onAddSet]);

    const handleCompleteAllSets = useCallback(() => {
        onCompleteAllSets(exId, defaultSets);
    }, [exId, defaultSets, onCompleteAllSets]);

    const handleShowDetails = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onShowHistory) return;
        haptic.tick();
        onShowHistory({
            displayName: historyLookupName,
            historyLookupName,
            originalName: name,
            alternatives,
            isSwapped: historyLookupName !== name,
            exerciseId: exId,
            metadata: {
                prescription,
                notes,
                restTime,
                isBodyweight,
                isEmom,
                isUnilateral,
                isAmrap,
                tempoRange,
            },
        });
    }, [
        onShowHistory,
        haptic,
        historyLookupName,
        name,
        exId,
        alternatives,
        restTime,
        isBodyweight,
        isEmom,
        isUnilateral,
        tempoRange,
    ]);

    // Superset indicator logic
    const hasSupersetGroup = supersetGroup !== undefined;
    const isFirstInSuperset = supersetPosition === 'first';
    const isMiddleInSuperset = supersetPosition === 'middle';
    const isLastInSuperset = supersetPosition === 'last';
    const showSupersetConnectorTop = isMiddleInSuperset || isLastInSuperset;
    const showSupersetConnectorBottom = isFirstInSuperset || isMiddleInSuperset;

    // Determine background and border colors based on state and section
    const containerClasses = useMemo(() => {
        if (hasSupersetGroup) return 'bg-amber-500/5 border-amber-500/20';

        // Section-based colors
        let sectionColors = '';
        switch (sectionType) {
            case 'prep': sectionColors = 'bg-warmup-500/10 border-warmup-500/20'; break;
            case 'skill': sectionColors = 'bg-skill-500/10 border-skill-500/20'; break;
            case 'main': sectionColors = 'bg-main-500/10 border-main-500/20'; break;
            case 'access': sectionColors = 'bg-accessory-500/10 border-accessory-500/20'; break;
            case 'cool': sectionColors = 'bg-cooldown-500/10 border-cooldown-500/20'; break;
            default: sectionColors = 'bg-sys-surface border-white/5';
        }

        // First incomplete gets accent ring on top of section color
        if (isFirstIncomplete) {
            return `${sectionColors} ring-2 ring-sys-accent/50`;
        }

        return sectionColors;
    }, [isFirstIncomplete, hasSupersetGroup, sectionType]);

    // ============================================================================
    // RENDER: COLLAPSED COMPLETE STATE
    // ============================================================================

    if (isComplete && !isExpanded) {
        return (
            <div className="relative">
                {/* Superset Connector Lines for compact completed state */}
                {hasSupersetGroup && (
                    <>
                        {showSupersetConnectorTop && (
                            <div className="absolute left-1 top-0 w-0.5 h-2 bg-amber-500/80 z-20" />
                        )}
                        {showSupersetConnectorBottom && (
                            <div className="absolute left-1 bottom-0 w-0.5 h-2 bg-amber-500/80 z-20" />
                        )}
                    </>
                )}
                <button
                    onClick={handleToggleExpand}
                    className={`w-full h-9 px-3 flex items-center gap-2 bg-sys-success/5 rounded-xl border border-sys-success/10 active:bg-sys-success/20 transition-colors ${hasSupersetGroup ? 'ml-3' : ''}`}
                    aria-label={`${historyLookupName} - completed, tap to edit`}
                >
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-sys-success text-white flex-shrink-0">
                        <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-white truncate text-left" title={historyLookupName}>
                        {shortDisplayName}
                    </span>
                    {isEmom && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex-shrink-0">
                            <Zap size={8} strokeWidth={3} />
                        </span>
                    )}
                    {isAmrap && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-orange-500/20 text-orange-400 flex-shrink-0">
                            <TrendingUp size={8} strokeWidth={3} />
                        </span>
                    )}
                    {isLadder && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-teal-500/20 text-teal-400 flex-shrink-0">
                            <BarChart2 size={8} strokeWidth={3} />
                            {ladderReps && <span className="text-[8px]">{ladderReps.join('-')}</span>}
                        </span>
                    )}
                    {isUnilateral && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex-shrink-0">
                            <span className="text-[8px]">L/R</span>
                        </span>
                    )}
                    <span className="text-xs text-sys-success font-semibold">
                        {completedSets}/{totalSets}
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
            {/* Superset Connector Lines */}
            {hasSupersetGroup && (
                <>
                    {showSupersetConnectorTop && (
                        <div className="absolute left-1 top-0 w-0.5 h-2 bg-amber-500/80 z-20" />
                    )}
                    {showSupersetConnectorBottom && (
                        <div className="absolute left-1 bottom-0 w-0.5 h-2 bg-amber-500/80 z-20" />
                    )}
                    {isFirstInSuperset && (
                        <div className="absolute left-0.5 top-1 z-20" aria-label="Superset exercise">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Superset" role="img" aria-hidden="true" />
                        </div>
                    )}
                </>
            )}
            <div
                className={`rounded-xl border overflow-hidden transition-all ${containerClasses} ${hasSupersetGroup ? 'ml-3' : ''}`}
            >
            {/* Main Row - Always visible */}
            <div className="h-14 px-3 flex items-center gap-2">
                {/* Exercise Name - Tap to expand prescription */}
                <button
                    onClick={handleToggleExpand}
                    className="flex-1 min-w-0 flex items-center gap-1.5 text-left active:opacity-70 transition-opacity"
                >
                    {/* EMOM Badge (inline with name for compact view) */}
                    {isEmom && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex-shrink-0">
                            <Zap size={8} strokeWidth={3} />
                        </span>
                    )}
                    {/* AMRAP Badge */}
                    {isAmrap && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-orange-500/20 text-orange-400 flex-shrink-0">
                            <TrendingUp size={8} strokeWidth={3} />
                        </span>
                    )}
                    {/* Ladder Badge */}
                    {isLadder && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-teal-500/20 text-teal-400 flex-shrink-0">
                            <BarChart2 size={8} strokeWidth={3} />
                            {ladderReps && <span className="text-[8px]">{ladderReps.join('-')}</span>}
                        </span>
                    )}
                    {/* Unilateral Badge */}
                    {isUnilateral && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex-shrink-0">
                            <span className="text-[8px]">L/R</span>
                        </span>
                    )}
                    <span ref={textRef} className="text-sm font-semibold text-white truncate min-w-0" title={historyLookupName}>
                        {shortDisplayName}
                    </span>
                    {(prescription || !isBodyweight) && (
                        <ChevronDown
                            size={14}
                            className={`text-sys-onSurfaceVar transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                            }`}
                        />
                    )}
                </button>

                {/* Display Details Button - always show to prevent layout shift */}
                {onShowHistory && (
                    <button
                        onClick={handleShowDetails}
                        className={`flex items-center gap-1.5 h-7 px-3 rounded-full bg-sys-surfaceHigh text-sys-onSurfaceVar text-[10px] font-bold tracking-wide uppercase flex-shrink-0 active:scale-95 transition-all ${!hasHistory ? 'opacity-80' : ''}`}
                        aria-label={`View details and history for ${historyLookupName}`}
                    >
                        <Info size={12} className="text-sys-onSurfaceVar" />
                    </button>
                )}

                {/* Set Buttons */}
                <CompactSetButtons
                    exId={exId}
                    sets={sets}
                    completedSets={completedSets}
                    totalSets={totalSets}
                    isComplete={isComplete}
                    onToggleSet={handleSetToggle}
                    onCompleteAllSets={handleCompleteAllSets}
                />
            </div>

            {/* Expandable Section - Contains prescription, weight, and add set */}
            <div
                className={`overflow-hidden transition-all duration-150 ease-out ${
                    isExpanded ? 'max-h-48' : 'max-h-0'
                }`}
            >
                <div className="px-3 pb-3 pt-0">
                    <div className="h-px bg-white/5 mb-2" />

                    {/* Prescription */}
                    {prescription && (
                        <p className="text-xs text-sys-onSurfaceVar mb-2">{prescription}</p>
                    )}

                    {/* Weight Stepper and Add Set Row */}
                    <div className="flex items-center gap-2 mt-2">
                        {/* Weight Stepper (only for weighted exercises) */}
                        {!isBodyweight && (
                            <div className="flex items-center gap-0.5 bg-sys-surfaceHigh rounded-lg overflow-hidden">
                                <button
                                    onClick={() => handleWeightStep(-1)}
                                    className="h-8 w-8 flex items-center justify-center text-sys-onSurfaceVar active:bg-white/10 transition-colors"
                                    aria-label="Decrease weight by 1kg"
                                >
                                    <Minus size={14} />
                                </button>
                                {isEditingWeight ? (
                                    <input
                                        ref={weightInputRef}
                                        type="number"
                                        inputMode="decimal"
                                        value={localWeight}
                                        onChange={(e) => setLocalWeight(e.target.value)}
                                        onBlur={handleWeightBlur}
                                        onKeyDown={handleWeightKeyDown}
                                        className="w-14 h-8 bg-transparent text-center text-sm font-mono text-white outline-none"
                                    />
                                ) : (
                                    <button
                                        onClick={handleWeightTap}
                                        className="w-14 h-8 flex items-center justify-center text-sm font-mono text-white active:bg-white/10 transition-colors"
                                        aria-label="Edit weight"
                                    >
                                        {localWeight || '0'}
                                        {isPrevWeight && (
                                            <span className="text-[10px] text-sys-onSurfaceVar ml-0.5">
                                                (prev)
                                            </span>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleWeightStep(1)}
                                    className="h-8 w-8 flex items-center justify-center text-sys-onSurfaceVar active:bg-white/10 transition-colors"
                                    aria-label="Increase weight by 1kg"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}

                        {/* Add Set Button */}
                        <button
                            onClick={handleAddSet}
                            className="h-8 px-3 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center gap-1.5 border border-dashed border-white/20 active:scale-95 transition-all text-xs font-medium"
                            aria-label="Add set"
                        >
                            <Plus size={12} />
                            <span>Add Set</span>
                        </button>

                        {/* Rest Timer Button - only for main section exercises */}
                        {onStartRestTimer && sectionType === 'main' && restTime && restTime > 0 && (
                            <button
                                onClick={() => onStartRestTimer(restTime)}
                                className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium ${
                                    restTimerActive
                                        ? 'bg-sys-accent text-white ring-2 ring-sys-accent/50'
                                        : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                }`}
                                aria-label={`Start ${restTime}s rest timer`}
                            >
                                <Timer size={12} />
                                <span>{restTime >= 60 ? `${Math.floor(restTime / 60)}m` : `${restTime}s`}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            </div>

        </div>
    );
};

// Memoize component to prevent unnecessary re-renders when parent state changes
// Props comparison uses shallow equality - callbacks must be stable (useCallback)
export const CompactExerciseRow = memo(CompactExerciseRowInner);

export default CompactExerciseRow;
