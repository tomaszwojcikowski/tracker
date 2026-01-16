/**
 * CompactExerciseRow Component
 *
 * High-density exercise row for power users.
 * Features: 32px set buttons, weight stepper (±1kg), tap-to-expand prescription,
 * auto-fill from history, auto-collapse when complete.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Check, Minus, Plus, ChevronDown, Zap, Info, TrendingUp, BarChart2, Timer, Gauge, Maximize2, Clock, Dumbbell } from './icons';
import { getExerciseHistory } from '../utils/exerciseHistory';
import { getShortExerciseName } from '../constants';
import { CompactSetButtons } from './CompactSetButtons';
import { formatSecondsShort, TimeBadge } from './TimeBadge';
import { ExerciseOptionsBadge } from './ExerciseOptionsBadge';
import { FlowMovementsDisplay, FlowBadge } from './FlowMovementsDisplay';
import { DensityRepControls } from './DensityRepControls';
import type { HapticFeedback } from '../hooks';
import type { ExerciseDetailRequest } from '../types/workout';
import type { TempoRange } from '../workout-plan-utils';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract rep count from prescription text
 * Examples: "3x8 reps" -> "8", "3 x 10-12 reps" -> "10-12", "5x5" -> "5"
 */
function extractReps(prescription?: string): string | null {
    if (!prescription) return null;

    // Try to match "x [number] reps" or "x [range] reps"
    const repsMatch =
        prescription.match(/x\s*(\d+(?:-\d+)?)\s*reps?/i) ||
        prescription.match(/x\s*(\d+(?:-\d+)?)/i) ||
        prescription.match(/^(\d+(?:-\d+)?)\s*reps?/i);

    return repsMatch ? repsMatch[1] : null;
}

function stripSingleSetPrefixForDensity(prescription?: string, isDensity?: boolean): string | undefined {
    if (!prescription) return prescription;
    if (!isDensity) return prescription;
    return prescription.replace(/^\s*1\s*[x×]\s*/i, '');
}

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
    /** Whether this is a density exercise (v2.5+) */
    isDensity?: boolean;
    /** Total time in minutes for density exercises (v2.5+) */
    densityTimeMinutes?: number;
    /** Total reps target for density exercises (v2.5+) */
    densityRepsTotal?: number;
    /** Whether this is a flow exercise (v2.4+) */
    isFlow?: boolean;
    /** Total time in minutes for flow exercises (v2.4+) */
    flowTimeMinutes?: number;
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
    /** Exercise options available for this exercise */
    exerciseOptions?: import('../workout-plan-utils').ExerciseOption[];
    /** Currently selected exercise option */
    selectedOption?: string;
    /** Callback when set is toggled */
    onToggleSet: (exId: string, setIndex: number, defaultSets: number, restTime?: number, sectionType?: string, isEmom?: boolean) => void;
    /** Callback when weight changes */
    onWeightChange: (exId: string, weight: string) => void;
    /** Callback when add set is clicked */
    onAddSet: (exId: string, defaultSets: number) => void;
    /** Callback to show exercise details */
    onShowHistory?: (request: ExerciseDetailRequest) => void;
    /** Callback to start rest timer */
    onStartRestTimer?: (seconds: number) => void;
    /** Callback when exercise options button is clicked */
    onShowOptions?: (exerciseId: string, exerciseName: string, options: import('../workout-plan-utils').ExerciseOption[]) => void;
    /** Section type for determining if rest button should show (hide for prep/cool sections) */
    sectionType?: string;
    /** Rest timer active state */
    restTimerActive?: boolean;
    /** EMOM timer active state */
    emomTimerActive?: boolean;
    /** EMOM timer interval in seconds */
    emomTimerInterval?: number;
    /** Callback to toggle EMOM timer */
    onToggleEmomTimer?: () => void;
    /** Density timer active state */
    densityTimerActive?: boolean;
    /** Callback to toggle density timer */
    onToggleDensityTimer?: () => void;
    /** Callback to expand density timer */
    onExpandDensity?: () => void;
    /** Flow timer active state */
    flowTimerActive?: boolean;
    /** Callback to toggle flow timer */
    onToggleFlowTimer?: () => void;
    /** Time-based exercise duration in seconds */
    timeSeconds?: number;
    /** Density rep chunks (v2.5+) */
    densityRepChunks?: number[];
    /** Density complete flag (v2.5+) */
    densityComplete?: boolean;
    /** Callback to update density rep chunks */
    onUpdateDensityRepChunks?: (exId: string, chunks: number[]) => void;
    /** Callback to mark density as complete */
    onMarkDensityComplete?: (exId: string, complete: boolean) => void;
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
    isDensity = false,
    densityTimeMinutes,
    densityRepsTotal,
    isFlow = false,
    flowTimeMinutes,
    timeSeconds,
    tempoRange,
    supersetGroup,
    supersetPosition,
    haptic,
    hasHistory = false,
    alternatives,
    exerciseOptions,
    selectedOption,
    onToggleSet,
    onWeightChange,
    onShowHistory,
    onStartRestTimer,
    onShowOptions,
    sectionType,
    restTimerActive = false,
    emomTimerActive = false,
    emomTimerInterval = 60,
    onToggleEmomTimer,
    densityTimerActive = false,
    onToggleDensityTimer,
    onExpandDensity,
    flowTimerActive = false,
    onToggleFlowTimer,
    densityRepChunks = [],
    densityComplete = false,
    onUpdateDensityRepChunks,
    onMarkDensityComplete,
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

    const displayPrescription = useMemo(
        () => stripSingleSetPrefixForDensity(prescription, isDensity),
        [prescription, isDensity]
    );

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
            case 'prep': sectionColors = 'bg-warmup-500/15 border-warmup-500/50'; break;
            case 'skill': sectionColors = 'bg-skill-500/15 border-skill-500/45'; break;
            case 'main': sectionColors = 'bg-main-500/15 border-main-500/40'; break;
            case 'access': sectionColors = 'bg-accessory-500/15 border-accessory-500/40'; break;
            case 'cool': sectionColors = 'bg-cooldown-500/15 border-cooldown-500/50'; break;
            default: sectionColors = 'bg-sys-surface border-sys-outlineVariant';
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
                            <div className="absolute left-1 top-0 w-0.5 h-2 bg-sys-secondary z-20" />
                        )}
                        {showSupersetConnectorBottom && (
                            <div className="absolute left-1 bottom-0 w-0.5 h-2 bg-sys-secondary z-20" />
                        )}
                    </>
                )}
                <button
                    onClick={handleToggleExpand}
                    className={`w-full h-9 px-3 flex items-center gap-2 bg-sys-successContainer/10 rounded-xl border border-sys-success/10 active:bg-sys-successContainer/30 transition-colors ${hasSupersetGroup ? 'ml-3' : ''}`}
                    aria-label={`${historyLookupName} - completed, tap to edit`}
                >
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-sys-success text-sys-onSuccess flex-shrink-0">
                        <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-sys-onSurface truncate text-left" title={historyLookupName}>
                        {shortDisplayName}
                    </span>
                    {isEmom && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-sys-tertiaryContainer text-sys-onTertiaryContainer flex-shrink-0">
                            <Zap size={8} strokeWidth={3} />
                        </span>
                    )}
                    {isDensity && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-sys-primaryContainer text-sys-onPrimaryContainer flex-shrink-0">
                            <Gauge size={8} strokeWidth={3} />
                        </span>
                    )}
                    {isAmrap && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-sys-errorContainer text-sys-onErrorContainer flex-shrink-0">
                            <TrendingUp size={8} strokeWidth={3} />
                        </span>
                    )}
                    {isLadder && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-sys-successContainer text-sys-onSuccessContainer flex-shrink-0">
                            <BarChart2 size={8} strokeWidth={3} />
                            {ladderReps && <span className="text-[8px]">{ladderReps.join('-')}</span>}
                        </span>
                    )}
                    {isUnilateral && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-sys-secondaryContainer text-sys-onSecondaryContainer flex-shrink-0">
                            <span className="text-[8px]">L/R</span>
                        </span>
                    )}
                    {/* Flow Badge - show when flow is selected */}
                    {exerciseOptions && exerciseOptions.length > 0 && selectedOption && exerciseOptions.some(opt => opt.flowMovements?.length) && (
                        <FlowBadge
                            movementCount={exerciseOptions.find(opt => opt.optionName === selectedOption)?.flowMovements?.length || 0}
                            flowName={selectedOption}
                            onClick={() => {
                                haptic.bump();
                                if (onShowOptions) {
                                    onShowOptions(exId, displayName, exerciseOptions);
                                }
                            }}
                        />
                    )}
                    {/* Exercise Options Badge - show for non-flow options or when no flow selected */}
                    {exerciseOptions && exerciseOptions.length > 0 && !(selectedOption && exerciseOptions.some(opt => opt.flowMovements?.length)) && (
                        <ExerciseOptionsBadge
                            optionCount={exerciseOptions.length}
                            hasSelection={!!selectedOption}
                            selectedOptionName={selectedOption}
                            onClick={(e) => {
                                e?.stopPropagation();
                                haptic.bump();
                                if (onShowOptions) {
                                    onShowOptions(exId, displayName, exerciseOptions);
                                }
                            }}
                        />
                    )}
                    {!isDensity && (
                        <span className="text-xs text-sys-success font-semibold">
                            {completedSets}/{totalSets}
                        </span>
                    )}
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
                        <div className="absolute left-1 top-0 w-0.5 h-2 bg-sys-secondary z-20" />
                    )}
                    {showSupersetConnectorBottom && (
                        <div className="absolute left-1 bottom-0 w-0.5 h-2 bg-sys-secondary z-20" />
                    )}
                    {isFirstInSuperset && (
                        <div className="absolute left-0.5 top-1 z-20" aria-label="Superset exercise">
                            <div className="h-1.5 w-1.5 rounded-full bg-sys-secondary" title="Superset" role="img" aria-hidden="true" />
                        </div>
                    )}
                </>
            )}
            <div
                className={`rounded-xl border overflow-hidden transition-all ${containerClasses} ${hasSupersetGroup ? 'ml-3' : ''}`}
            >
            {/* Main Row - Always visible */}
            <div className="h-16 px-3 flex items-center gap-2">
                {/* Exercise Name - Tap to expand prescription */}
                <button
                    onClick={handleToggleExpand}
                    className="flex-1 min-w-0 flex items-center gap-1.5 text-left active:opacity-70 transition-opacity"
                >
                    {/* EMOM Badge (inline with name for compact view) */}
                    {isEmom && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-sys-tertiaryContainer text-sys-onTertiaryContainer flex-shrink-0">
                            <Zap size={8} strokeWidth={3} />
                        </span>
                    )}
                    {/* Density Badge */}
                    {isDensity && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-sys-primaryContainer text-sys-onPrimaryContainer flex-shrink-0">
                            <Gauge size={8} strokeWidth={3} />
                            {densityRepsTotal && densityTimeMinutes && (
                                <span className="text-[8px]">{densityRepsTotal}/{densityTimeMinutes}m</span>
                            )}
                        </span>
                    )}
                    {/* AMRAP Badge */}
                    {isAmrap && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-sys-errorContainer text-sys-onErrorContainer flex-shrink-0">
                            <TrendingUp size={8} strokeWidth={3} />
                        </span>
                    )}
                    {/* Ladder Badge */}
                    {isLadder && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-sys-successContainer text-sys-onSuccessContainer flex-shrink-0">
                            <BarChart2 size={8} strokeWidth={3} />
                            {ladderReps && <span className="text-[8px]">{ladderReps.join('-')}</span>}
                        </span>
                    )}
                    {/* Unilateral Badge */}
                    {isUnilateral && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-sys-secondaryContainer text-sys-onSecondaryContainer flex-shrink-0">
                            <span className="text-[8px]">L/R</span>
                        </span>
                    )}

                    {/* Timed Badge */}
                    {!isFlow && !isEmom && !isDensity && timeSeconds && timeSeconds > 0 && (
                        <TimeBadge seconds={timeSeconds} size="compact" />
                    )}
                    <span ref={textRef} className="text-base font-bold text-sys-onSurface truncate min-w-0" title={historyLookupName}>
                        {/* Active row shows full name, others show short name */}
                        {isFirstIncomplete ? historyLookupName : shortDisplayName}
                    </span>
                    {/* Show rep count for active exercise */}
                    {isFirstIncomplete && prescription && (() => {
                        const reps = extractReps(prescription);
                        return reps ? (
                            <span className="text-sm text-sys-onSurfaceVar font-semibold flex-shrink-0">
                                {reps} reps
                            </span>
                        ) : null;
                    })()}
                    {(prescription || !isBodyweight) && (
                        <ChevronDown
                            size={14}
                            className={`text-sys-onSurfaceVar transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                            }`}
                        />
                    )}
                </button>

                {/* Density Timer Button - show on active row for density exercises */}
                {isDensity && onToggleDensityTimer && sectionType === 'main' && densityTimeMinutes && (
                    <button
                        onClick={onToggleDensityTimer}
                        className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium flex-shrink-0 ${
                            densityTimerActive
                                ? 'bg-sys-tertiary text-sys-onTertiary ring-2 ring-sys-tertiary/50'
                                : 'bg-sys-surfaceContainerLow text-sys-onSurfaceVar'
                        }`}
                        aria-label={densityTimerActive ? 'Stop density timer' : `Start ${densityTimeMinutes}m density timer`}
                    >
                        <Gauge size={12} />
                        <span>{densityTimeMinutes}m</span>
                    </button>
                )}
                {isDensity && densityTimerActive && onExpandDensity && (
                    <button
                        onClick={onExpandDensity}
                        className="h-8 w-8 rounded-lg bg-sys-surfaceContainerLow text-sys-onSurfaceVar flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
                        aria-label="Expand density timer"
                    >
                        <Maximize2 size={12} />
                    </button>
                )}

                {/* Flow Timer Button - show on active row for flow exercises */}
                {isFlow && onToggleFlowTimer && flowTimeMinutes && (
                    <button
                        onClick={onToggleFlowTimer}
                        className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium flex-shrink-0 ${
                            flowTimerActive
                                ? 'bg-sys-primary text-sys-onPrimary ring-2 ring-sys-primary/50'
                                : 'bg-sys-surfaceContainerLow text-sys-onSurfaceVar'
                        }`}
                        aria-label={flowTimerActive ? 'Stop flow timer' : `Start ${flowTimeMinutes}m flow timer`}
                    >
                        <Timer size={12} />
                        <span>{flowTimeMinutes}m</span>
                    </button>
                )}

                {/* Time-based Exercise Timer - show on active row for warmup/cooldown exercises with time */}
                {!isFlow && !isEmom && !isDensity && timeSeconds && timeSeconds > 0 && onStartRestTimer && (
                    <button
                        onClick={() => onStartRestTimer(timeSeconds)}
                        className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium flex-shrink-0 ${
                            restTimerActive
                                ? 'bg-sys-primary text-sys-onPrimary ring-2 ring-sys-primary/50'
                                : 'bg-sys-surfaceContainerLow text-sys-onSurfaceVar'
                        }`}
                        aria-label={restTimerActive ? 'Stop timer' : `Start ${formatSecondsShort(timeSeconds)} timer`}
                    >
                        <Dumbbell size={12} />
                        <TimeBadge seconds={timeSeconds} size="compact" variant="inline" />
                    </button>
                )}

                {/* Rest Timer Button - show on active row for main section non-EMOM, non-density, non-flow, non-time-based exercises */}
                {isFirstIncomplete && !isEmom && !isDensity && !isFlow && !timeSeconds && onStartRestTimer && sectionType === 'main' && restTime && restTime > 0 && (
                    <button
                        onClick={() => onStartRestTimer(restTime)}
                        className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium flex-shrink-0 ${
                            restTimerActive
                                ? 'bg-sys-surfaceHigh text-sys-onSurface ring-2 ring-sys-primary/50'
                                : 'bg-sys-surfaceContainerLow text-sys-onSurfaceVar'
                        }`}
                        aria-label={`Start ${formatSecondsShort(restTime)} rest timer`}
                    >
                        <Clock size={12} className={restTimerActive ? 'text-sys-primary' : ''} />
                        <TimeBadge seconds={restTime} size="compact" variant="inline" />
                    </button>
                )}

                {/* Display Details Button - always show to prevent layout shift */}
                {onShowHistory && (
                    <button
                        onClick={handleShowDetails}
                        className={`flex items-center gap-1.5 h-7 px-3 rounded-full bg-sys-surfaceContainerLow text-sys-onSurfaceVar text-[10px] font-bold tracking-wide uppercase flex-shrink-0 active:scale-95 transition-all ${!hasHistory ? 'opacity-80' : ''}`}
                        aria-label={`View details and history for ${historyLookupName}`}
                    >
                        <Info size={12} className="text-sys-onSurfaceVar" />
                    </button>
                )}

                {/* Set Buttons - only for non-density, non-flow exercises */}
                {!isDensity && !isFlow && (
                    <CompactSetButtons
                        exId={exId}
                        sets={sets}
                        completedSets={completedSets}
                        totalSets={totalSets}
                        isComplete={isComplete}
                        onToggleSet={handleSetToggle}
                    />
                )}
            </div>

            {/* Expandable Section - Contains prescription, weight, and add set */}
            <div
                className={`overflow-hidden transition-all duration-150 ease-out ${
                    isExpanded ? 'max-h-[500px]' : 'max-h-0'
                }`}
            >
                <div className="px-3 pb-3 pt-0">
                    <div className="h-px bg-sys-outlineVariant mb-2" />

                    {/* Prescription */}
                    {displayPrescription && (
                        <p className="text-xs text-sys-onSurfaceVar mb-2">{displayPrescription}</p>
                    )}

                    {/* Flow Movements Display (for flow exercises with selected option) */}
                    {exerciseOptions && selectedOption && (
                        <FlowMovementsDisplay
                            selectedOption={exerciseOptions.find(opt => opt.optionName === selectedOption)}
                            options={exerciseOptions}
                            selectedOptionName={selectedOption}
                            showHandle={true}
                            onChooseFlow={onShowOptions ? () => {
                                haptic.bump();
                                onShowOptions(exId, displayName, exerciseOptions);
                            } : undefined}
                        />
                    )}

                    {/* Density Rep Controls - for density exercises */}
                    {isDensity && densityRepsTotal && onUpdateDensityRepChunks && onMarkDensityComplete && (
                        <div className="mb-3">
                            <DensityRepControls
                                targetReps={densityRepsTotal}
                                repChunks={densityRepChunks}
                                isComplete={densityComplete}
                                isFirstIncomplete={isFirstIncomplete}
                                haptic={haptic}
                                onUpdateRepChunks={(chunks) => onUpdateDensityRepChunks(exId, chunks)}
                                onMarkComplete={(complete) => onMarkDensityComplete(exId, complete)}
                            />
                        </div>
                    )}

                    {/* Weight Stepper and Add Set Row */}
                    <div className="flex items-center gap-2 mt-2">
                        {/* Weight Stepper (only for weighted exercises) */}
                        {!isBodyweight && (
                            <div className="flex items-center gap-0.5 bg-sys-surfaceContainerLow rounded-lg overflow-hidden">
                                <button
                                    onClick={() => handleWeightStep(-1)}
                                    className="h-8 w-8 flex items-center justify-center text-sys-onSurfaceVar active:bg-sys-onSurface/10 transition-colors"
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
                                        className="w-14 h-8 bg-transparent text-center text-sm font-mono text-sys-onSurface outline-none"
                                    />
                                ) : (
                                    <button
                                        onClick={handleWeightTap}
                                        className="w-14 h-8 flex items-center justify-center text-sm font-mono text-sys-onSurface active:bg-sys-onSurface/10 transition-colors"
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
                                    className="h-8 w-8 flex items-center justify-center text-sys-onSurfaceVar active:bg-sys-onSurface/10 transition-colors"
                                    aria-label="Increase weight by 1kg"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}

                        {/* Density Timer Button - for density exercises */}
                        {isDensity && onToggleDensityTimer && sectionType === 'main' && densityTimeMinutes && (
                            <button
                                onClick={onToggleDensityTimer}
                                className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium ${
                                    densityTimerActive
                                        ? 'bg-sys-tertiary text-sys-onTertiary ring-2 ring-sys-tertiary/50'
                                        : 'bg-sys-surfaceContainerLow text-sys-onSurfaceVar'
                                }`}
                                aria-label={densityTimerActive ? 'Stop density timer' : `Start ${densityTimeMinutes}m density timer`}
                            >
                                <Gauge size={12} />
                                <span>{densityTimeMinutes}m</span>
                            </button>
                        )}
                        {isDensity && densityTimerActive && onExpandDensity && (
                            <button
                                onClick={onExpandDensity}
                                className="h-8 w-8 rounded-lg bg-sys-surfaceContainerLow text-sys-onSurfaceVar flex items-center justify-center active:scale-95 transition-all"
                                aria-label="Expand density timer"
                            >
                                <Maximize2 size={12} />
                            </button>
                        )}

                        {/* Flow Timer Button - for flow exercises */}
                        {isFlow && onToggleFlowTimer && flowTimeMinutes && (
                            <button
                                onClick={onToggleFlowTimer}
                                className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium ${
                                    flowTimerActive
                                        ? 'bg-sys-primary text-sys-onPrimary ring-2 ring-sys-primary/50'
                                        : 'bg-sys-surfaceContainerHigh text-sys-onSurfaceVar'
                                }`}
                                aria-label={flowTimerActive ? 'Stop flow timer' : `Start ${flowTimeMinutes}m flow timer`}
                            >
                                <Timer size={12} />
                                <span>{flowTimeMinutes}m</span>
                            </button>
                        )}

                        {/* Time-based Exercise Timer - for warmup/cooldown exercises with time */}
                        {!isFlow && !isEmom && !isDensity && timeSeconds && timeSeconds > 0 && onStartRestTimer && (
                            <button
                                onClick={() => onStartRestTimer(timeSeconds)}
                                className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium ${
                                    restTimerActive
                                        ? 'bg-sys-primary text-sys-onPrimary ring-2 ring-sys-primary/50'
                                        : 'bg-sys-surfaceContainerHigh text-sys-onSurfaceVar'
                                }`}
                                aria-label={restTimerActive ? 'Stop timer' : `Start ${formatSecondsShort(timeSeconds)} timer`}
                            >
                                <Dumbbell size={12} />
                                <TimeBadge seconds={timeSeconds} size="compact" variant="inline" />
                            </button>
                        )}

                        {/* EMOM Timer Button - for EMOM exercises */}
                        {isEmom && onToggleEmomTimer && sectionType === 'main' && (
                            <button
                                onClick={onToggleEmomTimer}
                                className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium ${
                                    emomTimerActive
                                        ? 'bg-sys-tertiary text-sys-onTertiary ring-2 ring-sys-tertiary/50'
                                        : 'bg-sys-surfaceContainerHigh text-sys-onSurfaceVar'
                                }`}
                                aria-label={emomTimerActive ? 'Stop EMOM timer' : `Start ${formatSecondsShort(emomTimerInterval)} EMOM timer`}
                            >
                                <Zap size={12} />
                                <span>{formatSecondsShort(emomTimerInterval)}</span>
                            </button>
                        )}

                        {/* Rest Timer Button - for main section non-EMOM, non-density, non-flow, non-time-based exercises */}
                        {!isEmom && !isDensity && !isFlow && !timeSeconds && onStartRestTimer && sectionType === 'main' && restTime && restTime > 0 && (
                            <button
                                onClick={() => onStartRestTimer(restTime)}
                                className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium ${
                                    restTimerActive
                                        ? 'bg-sys-surfaceHigh text-sys-onSurface ring-2 ring-sys-primary/50'
                                        : 'bg-sys-surfaceContainerHigh text-sys-onSurfaceVar'
                                }`}
                                aria-label={`Start ${formatSecondsShort(restTime)} rest timer`}
                            >
                                <Clock size={12} className={restTimerActive ? 'text-sys-primary' : ''} />
                                <TimeBadge seconds={restTime} size="compact" variant="inline" />
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
