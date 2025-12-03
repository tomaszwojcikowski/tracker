/**
 * CompactExerciseRow Component
 *
 * High-density exercise row for power users.
 * Features: 32px set buttons, weight stepper (±1kg), tap-to-expand prescription,
 * auto-fill from history, auto-collapse when complete.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check, Minus, Plus, ChevronDown, CheckCheck, Zap, History } from 'lucide-react';
import { getExerciseHistory } from '../utils/exerciseHistory';
import { getShortExerciseName } from '../constants';
import type { HapticFeedback } from '../hooks';
import type { ExerciseDetailRequest } from '../types/workout';

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
    onToggleSet: (exId: string, setIndex: number, defaultSets: number, restTime?: number) => void;
    /** Callback when weight changes */
    onWeightChange: (exId: string, weight: string) => void;
    /** Callback when add set is clicked */
    onAddSet: (exId: string, defaultSets: number) => void;
    /** Callback when complete all sets is clicked */
    onCompleteAllSets: (exId: string, defaultSets: number) => void;
    /** Callback to show exercise details */
    onShowHistory?: (request: ExerciseDetailRequest) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CompactExerciseRow: React.FC<CompactExerciseRowProps> = ({
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
}) => {
    // State - auto-expand the first incomplete exercise
    const [isExpanded, setIsExpanded] = useState(isFirstIncomplete);
    const [isEditingWeight, setIsEditingWeight] = useState(false);
    const [localWeight, setLocalWeight] = useState(weight);
    const [isPrevWeight, setIsPrevWeight] = useState(false);
    const [userModified, setUserModified] = useState(false);
    const weightInputRef = useRef<HTMLInputElement>(null);
    const setsContainerRef = useRef<HTMLDivElement>(null);

    // Computed values
    const completedSets = sets.filter(Boolean).length;
    const totalSets = sets.length;
    const isComplete = completedSets === totalSets && totalSets > 0;

    const historyLookupName = displayName;

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
            onToggleSet(exId, setIndex, defaultSets, restTime);

            // Auto-scroll to next incomplete set after toggling
            // We need to wait a frame for the state to update
            requestAnimationFrame(() => {
                if (!setsContainerRef.current) return;

                // Find the next incomplete set (after the current one, or from beginning)
                const buttons = setsContainerRef.current.querySelectorAll('button');
                let nextIncompleteIndex = -1;

                // First, look for incomplete sets after the current index
                for (let i = setIndex + 1; i < buttons.length; i++) {
                    const button = buttons[i];
                    // Check if button is NOT marked as complete (doesn't have check icon)
                    if (!button.querySelector('svg')) {
                        nextIncompleteIndex = i;
                        break;
                    }
                }

                // If no incomplete found after, look from the beginning
                if (nextIncompleteIndex === -1) {
                    for (let i = 0; i < setIndex; i++) {
                        const button = buttons[i];
                        if (!button.querySelector('svg')) {
                            nextIncompleteIndex = i;
                            break;
                        }
                    }
                }

                // Scroll to the next incomplete set if found
                if (nextIncompleteIndex !== -1 && buttons[nextIncompleteIndex]) {
                    const buttonWidth = 32; // h-8 = 32px
                    const gap = 4; // gap-1 = 4px
                    const scrollPosition = nextIncompleteIndex * (buttonWidth + gap);
                    setsContainerRef.current.scrollTo({
                        left: scrollPosition,
                        behavior: 'smooth'
                    });
                }
            });
        },
        [exId, defaultSets, restTime, onToggleSet]
    );

    const handleAddSet = useCallback(() => {
        onAddSet(exId, defaultSets);
    }, [exId, defaultSets, onAddSet]);

    const handleCompleteAllSets = useCallback(() => {
        onCompleteAllSets(exId, defaultSets);
    }, [exId, defaultSets, onCompleteAllSets]);

    // Memoize hasIncompleteSets - MUST be before any early returns to follow Rules of Hooks
    const hasIncompleteSets = useMemo(() => sets.some((s) => !s), [sets]);

    // Get short name for display
    const shortDisplayName = useMemo(() => getShortExerciseName(historyLookupName), [historyLookupName]);
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
            metadata: {
                prescription,
                notes,
                restTime,
                isBodyweight,
                isEmom,
                isUnilateral,
            },
        });
    }, [
        onShowHistory,
        haptic,
        historyLookupName,
        name,
        alternatives,
        restTime,
        isBodyweight,
        isEmom,
        isUnilateral,
    ]);

    // Only show complete-all button when there are 2+ sets and incomplete sets
    const showCompleteAllButton = totalSets > 1 && hasIncompleteSets;

    // Superset indicator logic
    const hasSupersetGroup = supersetGroup !== undefined;
    const isFirstInSuperset = supersetPosition === 'first';
    const isMiddleInSuperset = supersetPosition === 'middle';
    const isLastInSuperset = supersetPosition === 'last';
    const showSupersetConnectorTop = isMiddleInSuperset || isLastInSuperset;
    const showSupersetConnectorBottom = isFirstInSuperset || isMiddleInSuperset;

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
                    className={`w-full h-9 px-3 flex items-center gap-2 bg-sys-success/10 rounded-xl border border-sys-success/20 active:bg-sys-success/20 transition-colors ${hasSupersetGroup ? 'ml-3' : ''}`}
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
                className={`rounded-xl border overflow-hidden transition-all ${
                    isFirstIncomplete
                        ? 'bg-sys-accent/10 border-sys-accent/30'
                        : hasSupersetGroup
                            ? 'bg-amber-500/5 border-amber-500/20'
                            : 'bg-sys-surface border-white/5'
                } ${hasSupersetGroup ? 'ml-3' : ''}`}
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
                    {/* Unilateral Badge */}
                    {isUnilateral && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex-shrink-0">
                            <span className="text-[8px]">L/R</span>
                        </span>
                    )}
                    <span className="text-sm font-semibold text-white truncate" title={historyLookupName}>
                        {shortDisplayName}
                    </span>
                    {(prescription || !isBodyweight) && (
                        <ChevronDown
                            size={14}
                            className={`text-sys-onSurfaceVar flex-shrink-0 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                            }`}
                        />
                    )}
                </button>

                {/* Display Details Button */}
                {onShowHistory && (
                    <button
                        onClick={handleShowDetails}
                        className={`flex items-center gap-1.5 h-7 px-3 rounded-full bg-sys-surfaceHigh text-sys-onSurfaceVar text-[10px] font-bold tracking-wide uppercase flex-shrink-0 active:scale-95 transition-all ${!hasHistory ? 'opacity-80' : ''}`}
                        aria-label={`View details and history for ${historyLookupName}`}
                    >
                        <History size={12} className="text-sys-onSurfaceVar" />
                    </button>
                )}

                {/* Set Buttons - Progressive Reveal: Show completed + next incomplete + dots for future */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <div
                        ref={setsContainerRef}
                        className="flex items-center gap-1"
                    >
                        {sets.map((isDone, i) => {
                            // Find first incomplete set
                            const firstIncompleteIndex = sets.findIndex(s => !s);
                            const isNextIncomplete = i === firstIncompleteIndex;
                            const shouldShowAsButton = isDone || isNextIncomplete;
                            
                            if (shouldShowAsButton) {
                                return (
                                    <button
                                        key={`${exId}-set-${i}`}
                                        onClick={() => handleSetToggle(i)}
                                        className={`h-8 w-8 min-w-[32px] rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-90 ${
                                            isDone
                                                ? isComplete
                                                    ? 'bg-sys-success text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                                    : 'bg-sys-accent text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                                                : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                        }`}
                                        aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                    >
                                        {isDone ? <Check size={14} /> : i + 1}
                                    </button>
                                );
                            } else {
                                // Future sets shown as dots
                                return (
                                    <div
                                        key={`${exId}-dot-${i}`}
                                        className="w-2 h-2 rounded-full bg-sys-onSurfaceVar/30"
                                        aria-label={`Set ${i + 1} pending`}
                                    />
                                );
                            }
                        })}
                    </div>
                    {/* Progress indicator */}
                    <span className="text-xs text-sys-onSurfaceVar font-semibold ml-1">
                        ({completedSets}/{totalSets})
                    </span>
                    {/* Complete All Sets Button - only show when there are 2+ incomplete sets */}
                    {showCompleteAllButton && (
                        <button
                            onClick={handleCompleteAllSets}
                            className="h-8 w-8 rounded-lg bg-sys-success/20 text-sys-success flex items-center justify-center active:scale-90 transition-all ml-1"
                            aria-label="Complete all sets"
                        >
                            <CheckCheck size={14} />
                        </button>
                    )}
                </div>
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
                    </div>
                </div>
            </div>
            </div>

        </div>
    );
};

export default CompactExerciseRow;
