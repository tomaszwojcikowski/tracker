/**
 * ExerciseCard Component
 *
 * Individual exercise card for the workout player card view.
 * Handles exercise display, set toggling, weight input, and collapse state.
 */

import React, { memo, useMemo } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Check,
    Plus,
    Minus,
    Zap,
    ArrowRightLeft,
    TrendingUp,
    BarChart2,
    History,
    Timer,
    Gauge,
    Maximize2,
    Clock,
    Dumbbell,
} from './icons';
import { getExerciseHistory } from '../utils/exerciseHistory';
import { getExerciseDisplayName } from '../utils/exerciseOptions';
import { useFeatureFlag } from '../utils/featureFlags';
import { ExerciseTable } from './ExerciseTable';
import { ExerciseOptionsBadge } from './ExerciseOptionsBadge';
import { getSectionTheme } from '../utils/themeUtils';
import { FlowMovementsDisplay, FlowBadge } from './FlowMovementsDisplay';
import { DensityRepControls } from './DensityRepControls';
import { formatSecondsShort, TimeBadge } from './TimeBadge';
import type { RPEValue } from '../types';
import type { ExerciseDetailRequest, ExerciseLogEntry } from '../types/workout';
import type { LoadRange, TempoRange } from '../workout-plan-utils';
import type { HapticFeedback } from '../hooks';

export interface ExerciseCardProps {
    /** Exercise ID */
    exId: string;
    /** Exercise name */
    name: string;
    /** Effective name (after swaps) */
    effectiveName: string;
    /** Exercise prescription (e.g., "3x8 reps") */
    prescription: string;
    /** Notes for the exercise */
    notes?: string;
    /** Whether this is a bodyweight exercise */
    isBodyweight?: boolean;
    /** EMOM exercise flag */
    isEmom?: boolean;
    /** Unilateral exercise flag */
    isUnilateral?: boolean;
    /** AMRAP exercise flag */
    isAmrap?: boolean;
    /** Ladder exercise flag (e.g., 1-2-3 reps) */
    isLadder?: boolean;
    /** Ladder rep values (e.g., [1, 2, 3]) */
    ladderReps?: number[];
    /** Density exercise flag (v2.5+) */
    isDensity?: boolean;
    /** Total time in minutes for density exercises (v2.5+) */
    densityTimeMinutes?: number;
    /** Total reps target for density exercises (v2.5+) */
    densityRepsTotal?: number;
    /** Flow exercise flag (v2.4+) */
    isFlow?: boolean;
    /** Total time in minutes for flow exercises (v2.4+) */
    flowTimeMinutes?: number;
    /** Rest time in seconds */
    restTime?: number;
    /** Load range suggestion */
    loadRange?: LoadRange;
    /** Tempo range (e.g., 3-1-1-0) */
    tempoRange?: TempoRange;
    /** Alternative exercises available */
    alternatives?: string[];
    /** Exercise options available for this exercise */
    exerciseOptions?: import('../workout-plan-utils').ExerciseOption[];
    /** Currently selected exercise option */
    selectedOption?: string;
    /** Coaching cues for the exercise */
    cues?: string[];
    /** Optional coaching notes for technique/execution */
    coachingNotes?: string;
    /** Current set completion array */
    sets: boolean[];
    /** Default number of sets */
    defaultSets: number;
    /** Exercise log entry */
    exerciseLog: ExerciseLogEntry;
    /** Whether exercise has history */
    hasHistory: boolean;
    /** Whether this is the first incomplete exercise */
    isFirstIncomplete: boolean;
    /** Whether card is collapsed */
    isCollapsed: boolean;
    /** Superset group number */
    supersetGroup?: number;
    /** Position in superset */
    supersetPosition?: 'first' | 'middle' | 'last' | 'only';
    /** RPE prompt state */
    rpePrompt: { exerciseId: string; setIndex: number } | null;
    /** EMOM timer state */
    emomTimerActive: boolean;
    /** EMOM timer interval */
    emomTimerInterval: number;
    /** Rest timer active state */
    restTimerActive?: boolean;
    /** Density timer active state */
    densityTimerActive?: boolean;
    /** Flow timer active state */
    flowTimerActive?: boolean;
    /** Haptic feedback interface */
    haptic: Pick<HapticFeedback, 'tick' | 'bump' | 'success'>;
    /** Hide collapse button (for focus view) */
    hideCollapseButton?: boolean;
    /** Section type for determining if rest button should show (hide for prep/cool sections) */
    sectionType?: string;

    /** Hide the small time badge next to the exercise title (FocusView). */
    hideTimerBadges?: boolean;

    /** Hide in-card timer controls (rest/time-based/EMOM/density/flow) (FocusView). */
    hideTimerControls?: boolean;

    /** Completely disable the focus timer button (used for supersets in FocusView) */
    hideFocusTimer?: boolean;

    /** Callbacks */
    onToggleCollapse: (exId: string) => void;
    onToggleSet: (exId: string, setIndex: number, defaultSets: number, restTime?: number, sectionType?: string, isEmom?: boolean) => void;
    onAddSet: (exId: string, defaultSets: number) => void;
    onSaveWeight: (exId: string, weight: string) => void;
    onSaveRPE: (exId: string, setIndex: number, rpe: RPEValue) => void;
    /**
     * Optional v3 set-table callbacks. When the `set_table` feature flag is on,
     * `ExerciseCard` renders an `ExerciseTable` and routes per-set writes here.
     */
    onSaveSetWeight?: (exId: string, setIndex: number, value: string, totalSets: number) => void;
    onSaveSetReps?: (exId: string, setIndex: number, reps: number | undefined, totalSets: number) => void;
    onSaveNotes: (exId: string, notes: string) => void;
    onClearRPEPrompt: () => void;
    onStartRestTimer: (seconds: number) => void;
    onToggleEmomTimer: () => void;
    onExpandDensity?: () => void;
    /** Toggle density timer for this exercise (expects minutes) */
    onToggleDensityTimer?: (timeMinutes: number) => void;
    /** Toggle flow timer for this exercise (expects minutes) */
    onToggleFlowTimer?: (timeMinutes: number) => void;
    /** Time-based exercise duration in seconds */
    timeSeconds?: number;
    onShowHistory: (request: ExerciseDetailRequest) => void;
    onShowAlternatives: (name: string, alternatives: string[]) => void;
    onShowOptions?: (exerciseId: string, exerciseName: string, options: import('../workout-plan-utils').ExerciseOption[]) => void;
    /** Density exercise callbacks (v2.5+) */
    onUpdateDensityRepChunks?: (exId: string, chunks: number[]) => void;
    onMarkDensityComplete?: (exId: string, complete: boolean) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ExerciseCardImpl: React.FC<ExerciseCardProps> = ({
    exId,
    name,
    effectiveName,
    prescription,
    notes,
    isBodyweight,
    isEmom,
    isUnilateral,
    isAmrap,
    isLadder,
    ladderReps,
    isDensity,
    densityTimeMinutes,
    densityRepsTotal,
    isFlow,
    flowTimeMinutes,
    restTime,
    loadRange,
    tempoRange,
    alternatives,
    exerciseOptions,
    selectedOption,
    cues,
    coachingNotes,
    sets,
    defaultSets,
    exerciseLog,
    hasHistory,
    isFirstIncomplete,
    isCollapsed,
    supersetGroup,
    supersetPosition,
    rpePrompt: _rpePrompt,
    haptic,
    hideCollapseButton = false,
    sectionType,
    emomTimerActive = false,
    emomTimerInterval = 60,
    restTimerActive = false,
    densityTimerActive = false,
    flowTimerActive = false,
    hideTimerBadges = false,
    hideTimerControls = false,
    hideFocusTimer = false,
    onToggleCollapse,
    onToggleSet,
    onSaveWeight,
    onSaveRPE,
    onSaveSetWeight,
    onSaveSetReps,
    onClearRPEPrompt: _onClearRPEPrompt,
    onStartRestTimer,
    onToggleEmomTimer,
    onExpandDensity,
    onToggleDensityTimer,
    onToggleFlowTimer,
    timeSeconds,
    onShowHistory,
    onShowAlternatives,
    onShowOptions,
    onUpdateDensityRepChunks,
    onMarkDensityComplete,
}) => {
    const completedSets = sets.filter((s) => s).length;
    const totalSets = sets.length;
    const setTableEnabled = useFeatureFlag('set_table');
    const canUseSetTable =
        setTableEnabled &&
        !isDensity &&
        !isFlow &&
        !isEmom &&
        !!onSaveSetWeight &&
        !!onSaveSetReps;

    const focusTimerButton = useMemo(() => {
        // FocusView uses ExerciseCard with collapse hidden; when timer controls are hidden we
        // expose a single timer entrypoint in the top-right of the card.
        if (!hideCollapseButton || !hideTimerControls || hideFocusTimer) return null;

        // Priority: flow -> density -> EMOM -> time-based -> rest
        if (isFlow && flowTimeMinutes && onToggleFlowTimer) {
            return {
                ariaLabel: flowTimerActive ? 'Stop flow timer' : `Start ${flowTimeMinutes}m flow timer`,
                active: !!flowTimerActive,
                variant: 'flow',
                label: (
                    <>
                        <Timer size={18} />
                        <span>{flowTimeMinutes}m</span>
                    </>
                ),
                onClick: () => onToggleFlowTimer(flowTimeMinutes),
            };
        }

        if (isDensity && densityTimeMinutes && onToggleDensityTimer) {
            return {
                ariaLabel: densityTimerActive ? 'Stop density timer' : `Start ${densityTimeMinutes}m density timer`,
                active: !!densityTimerActive,
                variant: 'density',
                label: (
                    <>
                        <Gauge size={18} />
                        <span>{densityTimeMinutes}m</span>
                    </>
                ),
                onClick: () => {
                    const isStarting = !densityTimerActive;
                    onToggleDensityTimer(densityTimeMinutes);
                    if (isStarting && onExpandDensity) {
                        onExpandDensity();
                    }
                },
            };
        }

        if (isEmom && sectionType === 'main') {
            return {
                ariaLabel: emomTimerActive ? 'Stop EMOM timer' : `Start ${formatSecondsShort(emomTimerInterval)} EMOM timer`,
                active: !!emomTimerActive,
                variant: 'emom',
                label: (
                    <>
                        <Zap size={18} />
                        <span>{formatSecondsShort(emomTimerInterval)}</span>
                    </>
                ),
                onClick: () => onToggleEmomTimer(),
            };
        }

        if (!isFlow && !isEmom && !isDensity && timeSeconds && timeSeconds > 0) {
            return {
                ariaLabel: restTimerActive ? 'Stop timer' : `Start ${formatSecondsShort(timeSeconds)} timer`,
                active: !!restTimerActive,
                variant: 'exercise',
                label: (
                    <>
                        <Dumbbell size={18} />
                        <TimeBadge seconds={timeSeconds} variant="inline" />
                    </>
                ),
                onClick: () => onStartRestTimer(timeSeconds),
            };
        }

        if (!isFlow && !isEmom && !isDensity && restTime && restTime > 0 && (sectionType === 'main' || sectionType === 'access')) {
            return {
                ariaLabel: `Start ${formatSecondsShort(restTime)} rest timer`,
                active: !!restTimerActive,
                variant: 'rest',
                label: (
                    <>
                        <Clock size={18} />
                        <TimeBadge seconds={restTime} variant="inline" />
                    </>
                ),
                onClick: () => onStartRestTimer(restTime),
            };
        }

        return null;
    }, [
        hideCollapseButton,
        hideTimerControls,
        isFlow,
        flowTimeMinutes,
        onToggleFlowTimer,
        flowTimerActive,
        isDensity,
        densityTimeMinutes,
        onToggleDensityTimer,
        densityTimerActive,
        isEmom,
        sectionType,
        emomTimerActive,
        emomTimerInterval,
        onToggleEmomTimer,
        timeSeconds,
        restTime,
        restTimerActive,
        onStartRestTimer,
    ]);

    const displayPrescription = useMemo(() => {
        if (!isDensity) return prescription;
        // Density exercises are always a single set; avoid showing a leading "1x".
        return prescription.replace(/^\s*1\s*[x×]\s*/i, '');
    }, [prescription, isDensity]);

    // Smart defaults - get previous weight from history
    const previousWeight = useMemo(() => {
        if (isBodyweight) return null;
        const history = getExerciseHistory(effectiveName);
        if (history.length === 0) return null;

        // Find most recent entry with a weight
        const lastWithWeight = [...history]
            .reverse()
            .find((entry) => entry.weight && Number(entry.weight) > 0);

        return lastWithWeight?.weight ? String(lastWithWeight.weight) : null;
    }, [effectiveName, isBodyweight]);

    // Check if current weight matches previous (for visual indicator)
    const isUsingPreviousWeight = previousWeight && exerciseLog.weight === previousWeight;

    const handleUsePreviousWeight = (): void => {
        if (previousWeight) {
            haptic.tick();
            onSaveWeight(exId, previousWeight);
        }
    };

    const handleShowDetails = (): void => {
        haptic.tick();
        // Get display name considering selected exercise option
        const displayName = getExerciseDisplayName(effectiveName, exerciseOptions, selectedOption);
        onShowHistory({
            displayName,
            historyLookupName: effectiveName,
            originalName: name,
            alternatives,
            isSwapped: effectiveName !== name,
            exerciseId: exId,
            metadata: {
                prescription,
                notes,
                coachingNotes,
                restTime,
                isBodyweight,
                isEmom,
                isUnilateral,
                isAmrap,
                isFlow,
                isDensity,
                densityTimeMinutes,
                densityRepsTotal,
                loadRange,
                tempoRange,
                cues,
                exerciseOptions,
            },
            selectedOption,
        });
    };

    // Superset connector styling
    const hasSupersetGroup = supersetGroup !== undefined;
    const isFirstInSuperset = supersetPosition === 'first';

    // Determine background and border colors based on state and section
    const containerClasses = useMemo(() => {
        if (completedSets === totalSets && totalSets > 0) return 'border-sys-success/30 bg-sys-success/5';
        if (hasSupersetGroup) return 'border-sys-tertiary/40 bg-sys-tertiary/5';

        // Section-based colors (applied even when isFirstIncomplete)
        const sectionColors = getSectionTheme(sectionType || '').container;

        // First incomplete gets accent ring + subtle primary glow on top of section color (only when not in focus view)
        if (isFirstIncomplete && !hideCollapseButton) {
            return `${sectionColors} ring-1 ring-sys-onSurface`;
        }

        return sectionColors;
    }, [completedSets, totalSets, isFirstIncomplete, hasSupersetGroup, sectionType, hideCollapseButton]);

    return (
        <div id={exId} className={`relative scroll-mt-16 ${isFirstInSuperset ? 'mt-4' : ''}`}>
            {/* Superset Badge */}
            {isFirstInSuperset && (
                <div className="absolute left-2 -top-2 z-20">
                    <div className="flex items-center gap-1 bg-sys-onSurface text-sys-surface text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                        <span>SUPERSET</span>
                    </div>
                </div>
            )}

            <div
                className={`rounded-md p-4 border relative z-10 overflow-hidden ${containerClasses}`}
            >
                {/* Progress bar */}
                {completedSets > 0 && (
                    <div
                        className="progress-bar"
                        style={{ width: `${(completedSets / totalSets) * 100}%` }}
                    />
                )}

                {/* Exercise Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={handleShowDetails}
                                className={`text-left cursor-pointer active:opacity-70 transition-opacity ${!hasHistory ? 'opacity-90' : ''}`}
                                aria-label={`View details and history for ${effectiveName}`}
                            >
                                <h3 className="text-lg font-bold text-sys-onSurface leading-tight">
                                    {effectiveName}
                                </h3>
                            </button>

                            {/* Swap to alternative button */}
                            {alternatives && alternatives.length > 0 && (
                                <button
                                    onClick={() => {
                                        haptic.tick();
                                        onShowAlternatives(name, alternatives);
                                    }}
                                    className="h-6 w-6 rounded-sm bg-sys-surfaceContainerHigh border border-sys-outlineVariant text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                                    aria-label="Swap to alternative exercise"
                                >
                                    <ArrowRightLeft size={12} />
                                </button>
                            )}

                            {/* EMOM Badge */}
                            {isEmom && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-sys-tertiary/20 text-sys-tertiary border border-sys-tertiary/30">
                                    <Zap size={10} strokeWidth={3} />
                                    EMOM
                                </span>
                            )}

                            {/* Density Badge */}
                            {isDensity && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-sys-secondary/20 text-sys-onSecondaryContainer border border-sys-secondary/30">
                                    <Gauge size={10} strokeWidth={3} />
                                    {densityRepsTotal && densityTimeMinutes && (
                                        <span>{densityRepsTotal}/{densityTimeMinutes}m</span>
                                    )}
                                </span>
                            )}

                            {/* AMRAP Badge */}
                            {isAmrap && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-sys-secondaryContainer text-sys-onSecondaryContainer border border-sys-secondary/30">
                                    <TrendingUp size={10} strokeWidth={3} />
                                    AMRAP
                                </span>
                            )}

                            {/* Ladder Badge */}
                            {isLadder && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-sys-tertiaryContainer text-sys-onTertiaryContainer border border-sys-tertiary/30">
                                    <BarChart2 size={10} strokeWidth={3} />
                                    {ladderReps ? ladderReps.join('-') : 'LADDER'}
                                </span>
                            )}

                            {/* Unilateral Badge */}
                            {isUnilateral && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-sys-primaryContainer text-sys-onPrimaryContainer border border-sys-primary/30">
                                    <ArrowRightLeft size={10} strokeWidth={3} />
                                    PER SIDE
                                </span>
                            )}

                            {/* Timed Badge */}
                            {!hideTimerBadges && !isFlow && !isEmom && !isDensity && timeSeconds && timeSeconds > 0 && (
                                <TimeBadge seconds={timeSeconds} size="card" />
                            )}

                            {/* Flow Badge - show when flow is selected */}
                            {exerciseOptions && exerciseOptions.length > 0 && selectedOption && exerciseOptions.some(opt => opt.flowMovements?.length) && (
                                <FlowBadge
                                    movementCount={exerciseOptions.find(opt => opt.optionName === selectedOption)?.flowMovements?.length || 0}
                                    flowName={selectedOption}
                                    onClick={() => {
                                        haptic.bump();
                                        if (onShowOptions) {
                                            onShowOptions(exId, effectiveName, exerciseOptions);
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
                                    onClick={() => {
                                        haptic.bump();
                                        if (onShowOptions) {
                                            onShowOptions(exId, effectiveName, exerciseOptions);
                                        }
                                    }}
                                />
                            )}

                            {completedSets > 0 && !isDensity && (
                                <span
                                    className={`text-mono-stat text-xs font-bold px-2 py-0.5 rounded-full ${
                                        completedSets === totalSets
                                            ? 'bg-sys-successContainer text-sys-onSuccessContainer'
                                            : 'bg-sys-primaryContainer text-sys-onPrimaryContainer'
                                    }`}
                                >
                                    {completedSets}/{totalSets}
                                </span>
                            )}

                        </div>
                        <p className="text-sm font-semibold text-sys-onSurfaceVar mt-1">{displayPrescription}</p>
                    </div>

                    {/* Right-side header action */}
                    {focusTimerButton ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    haptic.tick();
                                    focusTimerButton.onClick();
                                }}
                                className={`h-12 px-4 rounded-lg flex items-center justify-center gap-1.5 active:scale-90 transition-all text-sm font-medium ${
                                    focusTimerButton.active
                                        ? focusTimerButton.variant === 'emom'
                                            ? 'bg-sys-tertiary text-sys-onTertiary ring-2 ring-sys-tertiary/50'
                                            : focusTimerButton.variant === 'density'
                                            ? 'bg-sys-secondary text-sys-onSecondary ring-2 ring-sys-secondary/50'
                                            : focusTimerButton.variant === 'rest'
                                            ? 'bg-sys-surfaceHigh text-sys-onSurfaceVar ring-2 ring-sys-primary/50 font-bold'
                                            : 'bg-sys-primary text-sys-onPrimary ring-2 ring-sys-primary/50'
                                        : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                }`}
                                aria-label={focusTimerButton.ariaLabel}
                            >
                                {focusTimerButton.label}
                            </button>
                            {focusTimerButton.variant === 'density' && focusTimerButton.active && onExpandDensity && (
                                <button
                                    onClick={() => {
                                        haptic.tick();
                                        onExpandDensity();
                                    }}
                                    className="h-12 w-12 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                                    aria-label="Expand density timer"
                                >
                                    <Maximize2 size={20} />
                                </button>
                            )}
                        </div>
                    ) : !hideCollapseButton ? (
                        <button
                            onClick={() => {
                                haptic.tick();
                                onToggleCollapse(exId);
                            }}
                            className="h-12 w-12 min-w-[48px] rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                            aria-label={isCollapsed ? 'Expand exercise' : 'Collapse exercise'}
                        >
                            {isCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                        </button>
                    ) : null}
                </div>

                {/* Collapsed content */}
                {!isCollapsed && (
                    <>
                        {/* Flow Exercise Timer - for flow exercises */}
                        {!hideTimerControls && isFlow && flowTimeMinutes && onToggleFlowTimer ? (
                            <div className="flex items-center mb-2">
                                <div className="flex-1" />
                                <button
                                    onClick={() => onToggleFlowTimer(flowTimeMinutes)}
                                    className={`h-12 px-4 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-sm font-medium ${
                                        flowTimerActive
                                            ? 'bg-sys-primary text-sys-onPrimary ring-2 ring-sys-primary/50'
                                            : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                    }`}
                                    aria-label={flowTimerActive ? 'Stop flow timer' : `Start ${flowTimeMinutes}m flow timer`}
                                >
                                    <Timer size={18} />
                                    <span>{flowTimeMinutes}m</span>
                                </button>
                            </div>
                        ) : null}

                        {/* Time-based Exercise Timer - for warmup/cooldown exercises with time */}
                        {!hideTimerControls && !isFlow && !isEmom && !isDensity && timeSeconds && timeSeconds > 0 && onStartRestTimer ? (
                            <div className="flex items-center mb-2">
                                <div className="flex-1" />
                                <button
                                    onClick={() => onStartRestTimer(timeSeconds)}
                                    className={`h-12 px-4 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-sm font-medium ${
                                        restTimerActive
                                            ? 'bg-sys-primary text-sys-onPrimary ring-2 ring-sys-primary/50'
                                            : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                    }`}
                                    aria-label={restTimerActive ? 'Stop timer' : `Start ${formatSecondsShort(timeSeconds)} timer`}
                                >
                                    <Dumbbell size={18} />
                                    <TimeBadge seconds={timeSeconds} variant="inline" />
                                </button>
                            </div>
                        ) : null}

                        {/* EMOM Timer - for EMOM exercises */}
                        {!hideTimerControls && isEmom && sectionType === 'main' ? (
                            <div className="flex items-center mb-2">
                                <div className="flex-1" />
                                <button
                                    onClick={onToggleEmomTimer}
                                    className={`h-12 px-4 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-sm font-medium ${
                                        emomTimerActive
                                            ? 'bg-sys-tertiary text-sys-onTertiary ring-2 ring-sys-tertiary/50'
                                            : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                    }`}
                                    aria-label={emomTimerActive ? 'Stop EMOM timer' : `Start ${formatSecondsShort(emomTimerInterval)} EMOM timer`}
                                >
                                    <Zap size={18} />
                                    <span>{formatSecondsShort(emomTimerInterval)}</span>
                                </button>
                            </div>
                        ) : null}

                        {/* Density Rep Controls - for density exercises */}
                        {isDensity && densityRepsTotal && onUpdateDensityRepChunks && onMarkDensityComplete ? (
                            <>
                                {!hideTimerControls && densityTimeMinutes && onToggleDensityTimer && (
                                    <div className="flex items-center mb-2">
                                        <div className="flex-1" />
                                        <button
                                            onClick={() => onToggleDensityTimer(densityTimeMinutes)}
                                            className={`h-12 px-4 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-sm font-medium ${
                                                densityTimerActive
                                                    ? 'bg-sys-secondary text-sys-onSecondary ring-2 ring-sys-secondary/50'
                                                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                            }`}
                                            aria-label={densityTimerActive ? 'Stop density timer' : `Start ${densityTimeMinutes}m density timer`}
                                        >
                                            <Gauge size={18} />
                                            <span>{densityTimeMinutes}m</span>
                                        </button>
                                        {densityTimerActive && onExpandDensity && (
                                            <button
                                                onClick={onExpandDensity}
                                                className="ml-2 h-12 w-12 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-95 transition-all shadow-elevation-1 hover:shadow-elevation-2"
                                                aria-label="Expand layout"
                                            >
                                                <Maximize2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                <DensityRepControls
                                    targetReps={densityRepsTotal}
                                    repChunks={exerciseLog.densityRepChunks || []}
                                    isComplete={exerciseLog.densityComplete || false}
                                    isFirstIncomplete={isFirstIncomplete}
                                    haptic={haptic}
                                    onUpdateRepChunks={(chunks) => onUpdateDensityRepChunks(exId, chunks)}
                                    onMarkComplete={(complete) => onMarkDensityComplete(exId, complete)}
                                />
                            </>
                        ) : !isFlow ? (
                            canUseSetTable ? (
                                <ExerciseTable
                                    exId={exId}
                                    effectiveName={effectiveName}
                                    sets={sets}
                                    defaultSets={defaultSets}
                                    exerciseLog={exerciseLog}
                                    isBodyweight={isBodyweight}
                                    prescription={prescription}
                                    haptic={haptic}
                                    onToggleSet={onToggleSet}
                                    onSaveSetWeight={onSaveSetWeight!}
                                    onSaveSetReps={onSaveSetReps!}
                                    onSaveRPE={onSaveRPE}
                                    restTime={restTime}
                                    sectionType={sectionType}
                                    isEmom={isEmom}
                                />
                            ) : (
                            <>
                                {/* Weight and timer controls row */}
                                <div className="flex items-center justify-between mb-3">
                                    {/* Weight input */}
                                    {!isBodyweight && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                onClick={() => {
                                                    haptic.tick();
                                                    const current = parseFloat(exerciseLog.weight || '0');
                                                    onSaveWeight(exId, Math.max(0, current - 2.5).toString());
                                                }}
                                                className="h-12 w-12 min-w-12 rounded-xl bg-sys-surfaceContainerHigh text-sys-primary flex items-center justify-center active:bg-sys-primaryContainer/40 transition-colors shrink-0"
                                                aria-label="Decrease weight by 2.5kg"
                                            >
                                                <Minus size={20} strokeWidth={2.5} />
                                            </button>
                                            <input
                                                id={`${exId}-weight`}
                                                type="number"
                                                inputMode="decimal"
                                                pattern="[0-9]*"
                                                enterKeyHint="done"
                                                value={exerciseLog.weight || ''}
                                                onChange={(e) => onSaveWeight(exId, e.target.value)}
                                                placeholder={loadRange && loadRange.unit === 'kg' && loadRange.min > 0 ? String(loadRange.min) : '0'}
                                                className="w-20 h-12 px-1 bg-sys-surfaceContainerHigh rounded-xl text-sys-onSurface text-center text-xl font-bold font-mono outline-none focus:ring-2 focus:ring-sys-primary focus:bg-sys-surface transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                aria-label="Weight in kg"
                                            />
                                            <button
                                                onClick={() => {
                                                    haptic.tick();
                                                    const current = parseFloat(exerciseLog.weight || '0');
                                                    onSaveWeight(exId, (current + 2.5).toString());
                                                }}
                                                className="h-12 w-12 min-w-12 rounded-xl bg-sys-surfaceContainerHigh text-sys-primary flex items-center justify-center active:bg-sys-primaryContainer/40 transition-colors shrink-0"
                                                aria-label="Increase weight by 2.5kg"
                                            >
                                                <Plus size={20} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Rest Timer Button - show for main/access sections, excluding EMOM/density/flow/time-based */}
                                    {!hideTimerControls && !isEmom && !isDensity && !isFlow && !timeSeconds && restTime && restTime > 0 && (sectionType === 'main' || sectionType === 'access') && (
                                        <button
                                            onClick={() => onStartRestTimer(restTime)}
                                            className={`h-12 px-3.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all text-sm font-semibold ${
                                                restTimerActive
                                                    ? 'bg-sys-surfaceHigh text-sys-onSurface ring-2 ring-sys-primary/50'
                                                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar border border-sys-outlineVariant/30'
                                            }`}
                                            aria-label={`Start ${formatSecondsShort(restTime)} rest timer`}
                                        >
                                            <Clock size={16} className={restTimerActive ? 'text-sys-primary' : ''} />
                                            <TimeBadge seconds={restTime} variant="inline" />
                                        </button>
                                    )}
                                </div>

                                {/* Previous weight and load range hints - now closer to weight input */}
                                {!isBodyweight && (previousWeight || loadRange) && (
                                    <div className="flex items-center justify-start gap-2 mb-4">
                                        {/* Previous weight quick-fill button */}
                                        {previousWeight && !exerciseLog.weight && (
                                            <button
                                                onClick={handleUsePreviousWeight}
                                                className="flex items-center gap-1 text-xs text-sys-onPrimaryContainer font-medium px-2 py-0.5 rounded-full bg-sys-primaryContainer hover:bg-sys-primaryContainer/80 active:scale-95 transition-all"
                                                aria-label={`Use previous weight of ${previousWeight}kg`}
                                            >
                                                <History size={10} />
                                                <span>Use {previousWeight}kg</span>
                                            </button>
                                        )}
                                        {/* Show indicator when using previous weight */}
                                        {isUsingPreviousWeight && (
                                            <span className="flex items-center gap-1 text-[10px] text-sys-onSurfaceVar">
                                                <History size={10} />
                                                <span>prev</span>
                                            </span>
                                        )}
                                        {/* Load range suggestion */}
                                        {loadRange && loadRange.min > 0 && loadRange.unit === 'kg' && (
                                            <span className="text-xs text-sys-primary font-medium">
                                                Suggested: {loadRange.min === loadRange.max
                                                    ? `${loadRange.min}kg`
                                                    : `${loadRange.min}-${loadRange.max}kg`}
                                                {loadRange.perHand ? ' per hand' : ''}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Set buttons row */}
                                <div className="flex flex-wrap gap-2 mb-3 items-center">
                                    {(() => {
                                        // Find first incomplete set once
                                        const firstIncompleteIndex = sets.findIndex(s => !s);

                                        return (
                                            <>
                                                {sets.map((isDone, i) => {
                                                    const isNextIncomplete = i === firstIncompleteIndex;
                                                    const shouldShowAsButton = isDone || isNextIncomplete;

                                                    if (shouldShowAsButton) {
                                                        return (
                                                            <button
                                                                key={`${exId}-set-${i}`}
                                                                onClick={() => onToggleSet(exId, i, defaultSets, restTime, sectionType, isEmom)}
                                                                className={`set-button h-12 w-12 min-w-[48px] rounded-xl flex items-center justify-center text-base font-bold transition-all active:scale-90 ${isDone ? 'completed bg-sys-onSurface text-sys-surface' : 'bg-sys-surfaceContainerHigh text-sys-onSurfaceVar border-2 border-sys-outlineVariant'}`}
                                                                aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                                            >
                                                                {isDone ? <Check size={18} /> : i + 1}
                                                            </button>
                                                        );
                                                    }
                                                    return null;
                                                }).filter(Boolean)}

                                                {/* Future sets shown as dots (max 2 dots) */}
                                                {firstIncompleteIndex !== -1 && sets.slice(firstIncompleteIndex + 1, firstIncompleteIndex + 3).map((_, i) => (
                                                    <div
                                                        key={`${exId}-dot-${firstIncompleteIndex + 1 + i}`}
                                                        className="w-2 h-2 rounded-full bg-sys-onSurfaceVar opacity-30"
                                                        aria-label={`Set ${firstIncompleteIndex + 2 + i} pending`}
                                                    />
                                                ))}
                                            </>
                                        );
                                    })()}

                                    {/* Progress indicator */}
                                    <span className="text-sm text-sys-onSurfaceVar font-bold">
                                        ({completedSets}/{totalSets})
                                    </span>
                                </div>
                            </>
                            )
                        ) : null}

                        {/* Flow Movements Display - for focus view card */}
                        {exerciseOptions && selectedOption && exerciseOptions.some(opt => opt.flowMovements?.length) && (
                            <FlowMovementsDisplay
                                selectedOption={exerciseOptions.find(opt => opt.optionName === selectedOption)}
                                options={exerciseOptions}
                                selectedOptionName={selectedOption}
                                onChooseFlow={onShowOptions ? () => {
                                    haptic.bump();
                                    onShowOptions(exId, effectiveName, exerciseOptions);
                                } : undefined}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

ExerciseCardImpl.displayName = 'ExerciseCardImpl';

/**
 * Memoized ExerciseCard. Re-renders only when one of its many props changes
 * (shallow compare). Parent components MUST stabilize callback props with
 * `useCallback` for the memoization to be effective.
 */
export const ExerciseCard = memo(ExerciseCardImpl);

