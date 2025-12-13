/**
 * ExerciseCard Component
 *
 * Individual exercise card for the workout player card view.
 * Handles exercise display, set toggling, weight input, and collapse state.
 */

import React, { useMemo } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Check,
    Plus,
    CheckCheck,
    Minus,
    Zap,
    ArrowRightLeft,
    TrendingUp,
    BarChart2,
    History,
    Timer,
    Gauge,
} from './icons';
import { getExerciseHistory } from '../utils/exerciseHistory';
import { RPESelector } from './RPESelector';
import { ExerciseOptionsBadge } from './ExerciseOptionsBadge';
import { FlowMovementsDisplay, FlowBadge } from './FlowMovementsDisplay';
import { DensityRepControls } from './DensityRepControls';
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
    /** Haptic feedback interface */
    haptic: Pick<HapticFeedback, 'tick' | 'bump' | 'success'>;
    /** Hide collapse button (for focus view) */
    hideCollapseButton?: boolean;
    /** Section type for determining if rest button should show (hide for prep/cool sections) */
    sectionType?: string;
    /** Callbacks */
    onToggleCollapse: (exId: string) => void;
    onToggleSet: (exId: string, setIndex: number, defaultSets: number, restTime?: number, sectionType?: string, isEmom?: boolean) => void;
    onAddSet: (exId: string, defaultSets: number) => void;
    onCompleteAllSets: (exId: string, defaultSets: number) => void;
    onSaveWeight: (exId: string, weight: string) => void;
    onSaveRPE: (exId: string, setIndex: number, rpe: RPEValue) => void;
    onSaveNotes: (exId: string, notes: string) => void;
    onClearRPEPrompt: () => void;
    onStartRestTimer: (seconds: number) => void;
    onToggleEmomTimer: () => void;
    /** Toggle density timer for this exercise (expects minutes) */
    onToggleDensityTimer?: (timeMinutes: number) => void;
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

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
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
    restTime,
    loadRange,
    tempoRange,
    alternatives,
    exerciseOptions,
    selectedOption,
    sets,
    defaultSets,
    exerciseLog,
    hasHistory,
    isFirstIncomplete,
    isCollapsed,
    supersetGroup,
    supersetPosition,
    rpePrompt,
    haptic,
    hideCollapseButton = false,
    sectionType,
    restTimerActive = false,
    densityTimerActive = false,
    onToggleCollapse,
    onToggleSet,
    onAddSet,
    onCompleteAllSets,
    onSaveWeight,
    onSaveRPE,
    onClearRPEPrompt,
    onStartRestTimer,
    onToggleDensityTimer,
    onShowHistory,
    onShowAlternatives,
    onShowOptions,
    onUpdateDensityRepChunks,
    onMarkDensityComplete,
}) => {
    const completedSets = sets.filter((s) => s).length;
    const totalSets = sets.length;
    const allComplete = completedSets === totalSets && totalSets > 0;

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
        onShowHistory({
            displayName: effectiveName,
            historyLookupName: effectiveName,
            originalName: name,
            alternatives,
            isSwapped: effectiveName !== name,
            exerciseId: exId,
            metadata: {
                prescription,
                notes,
                restTime,
                isBodyweight,
                isEmom,
                isUnilateral,
                isAmrap,
                isDensity,
                densityTimeMinutes,
                densityRepsTotal,
                loadRange,
                tempoRange,
            },
        });
    };

    // Superset connector styling
    const hasSupersetGroup = supersetGroup !== undefined;
    const isFirstInSuperset = supersetPosition === 'first';

    // Determine background and border colors based on state and section
    const containerClasses = useMemo(() => {
        if (completedSets === totalSets && totalSets > 0) return 'border-sys-success/10 bg-sys-success/5';
        if (hasSupersetGroup) return 'border-amber-500/30 bg-amber-500/5';

        // Section-based colors (applied even when isFirstIncomplete)
        let sectionColors = '';
        switch (sectionType) {
            case 'prep': sectionColors = 'bg-warmup-500/10 border-warmup-500/20'; break;
            case 'skill': sectionColors = 'bg-skill-500/10 border-skill-500/20'; break;
            case 'main': sectionColors = 'bg-main-500/10 border-main-500/20'; break;
            case 'access': sectionColors = 'bg-accessory-500/10 border-accessory-500/20'; break;
            case 'cool': sectionColors = 'bg-cooldown-500/10 border-cooldown-500/20'; break;
            default: sectionColors = 'bg-sys-surface border-white/5';
        }

        // First incomplete gets accent ring on top of section color (only when not in focus view)
        if (isFirstIncomplete && !hideCollapseButton) {
            return `${sectionColors} ring-2 ring-sys-accent/50`;
        }

        return sectionColors;
    }, [completedSets, totalSets, isFirstIncomplete, hasSupersetGroup, sectionType, hideCollapseButton]);

    return (
        <div id={exId} className={`relative scroll-mt-16 ${isFirstInSuperset ? 'mt-4' : ''}`}>
            {/* Superset Badge */}
            {isFirstInSuperset && (
                <div className="absolute left-2 -top-2 z-20">
                    <div className="flex items-center gap-1 bg-amber-500/90 text-amber-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                        <span>SUPERSET</span>
                    </div>
                </div>
            )}

            <div
                className={`rounded-2xl p-4 border relative z-10 overflow-hidden ${containerClasses}`}
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
                                <h3 className="text-base font-semibold text-white leading-tight">
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
                                    className="h-6 w-6 rounded-full bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                                    aria-label="Swap to alternative exercise"
                                >
                                    <ArrowRightLeft size={12} />
                                </button>
                            )}

                            {/* EMOM Badge */}
                            {isEmom && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sys-tertiary/20 text-sys-tertiary border border-sys-tertiary/30">
                                    <Zap size={10} strokeWidth={3} />
                                    EMOM
                                </span>
                            )}

                            {/* Density Badge */}
                            {isDensity && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                    <Gauge size={10} strokeWidth={3} />
                                    {densityRepsTotal && densityTimeMinutes && (
                                        <span>{densityRepsTotal}/{densityTimeMinutes}m</span>
                                    )}
                                </span>
                            )}

                            {/* AMRAP Badge */}
                            {isAmrap && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                    <TrendingUp size={10} strokeWidth={3} />
                                    AMRAP
                                </span>
                            )}

                            {/* Ladder Badge */}
                            {isLadder && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                                    <BarChart2 size={10} strokeWidth={3} />
                                    {ladderReps ? ladderReps.join('-') : 'LADDER'}
                                </span>
                            )}

                            {/* Unilateral Badge */}
                            {isUnilateral && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    <ArrowRightLeft size={10} strokeWidth={3} />
                                    PER SIDE
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
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        completedSets === totalSets
                                            ? 'bg-sys-success/10 text-sys-success'
                                            : 'bg-sys-accent/10 text-sys-accent'
                                    }`}
                                >
                                    {completedSets}/{totalSets}
                                </span>
                            )}

                        </div>
                        <p className="text-xs text-sys-onSurfaceVar">{displayPrescription}</p>
                    </div>

                    {/* Collapse button - hidden in focus view */}
                    {!hideCollapseButton && (
                        <button
                            onClick={() => {
                                haptic.tick();
                                onToggleCollapse(exId);
                            }}
                            className="h-8 w-8 min-w-[32px] rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                            aria-label={isCollapsed ? 'Expand exercise' : 'Collapse exercise'}
                        >
                            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>
                    )}
                </div>

                {/* Collapsed content */}
                {!isCollapsed && (
                    <>
                        {/* Density Rep Controls - for density exercises */}
                        {isDensity && densityRepsTotal && onUpdateDensityRepChunks && onMarkDensityComplete ? (
                            <>
                                {densityTimeMinutes && onToggleDensityTimer && (
                                    <div className="flex items-center mb-2">
                                        <div className="flex-1" />
                                        <button
                                            onClick={() => onToggleDensityTimer(densityTimeMinutes)}
                                            className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium ${
                                                densityTimerActive
                                                    ? 'bg-cyan-500 text-white ring-2 ring-cyan-500/50'
                                                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                            }`}
                                            aria-label={densityTimerActive ? 'Stop density timer' : `Start ${densityTimeMinutes}m density timer`}
                                        >
                                            <Gauge size={14} />
                                            <span>{densityTimeMinutes}m</span>
                                        </button>
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
                        ) : (
                            <>
                                {/* Set buttons and Weight input row - Progressive Reveal (non-density exercises) */}
                                <div className="flex flex-wrap gap-2 mb-3 items-center justify-start">
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
                                                        className={`set-button h-8 w-8 min-w-[32px] rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-90 ${
                                                            isDone
                                                                ? allComplete
                                                                    ? 'completed bg-sys-success text-white shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                                                    : 'completed bg-sys-accent text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                                                                : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                                        }`}
                                                        aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                                    >
                                                        {isDone ? <Check size={14} /> : i + 1}
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
                            <span className="text-xs text-sys-onSurfaceVar font-semibold">
                                ({completedSets}/{totalSets})
                            </span>

                            <div className="ml-auto flex items-center gap-2">
                                {/* Add set button */}
                                <button
                                    onClick={() => onAddSet(exId, defaultSets)}
                                    className="h-8 w-8 min-w-[32px] rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center text-xs font-bold border-2 border-dashed border-white/20 active:scale-95 transition-all"
                                    aria-label="Add set"
                                >
                                    <Plus size={14} />
                                </button>

                                {/* Complete all button - aligned right */}
                                {sets.filter((s) => !s).length > 1 && (
                                    <button
                                        onClick={() => onCompleteAllSets(exId, defaultSets)}
                                        className="h-8 w-8 min-w-[32px] rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-95 transition-all"
                                        aria-label="Complete all sets"
                                        title="Complete all sets"
                                    >
                                        <CheckCheck size={14} />
                                    </button>
                                )}

                                {/* Rest Timer Button - show for main/access sections */}
                                {restTime && restTime > 0 && (sectionType === 'main' || sectionType === 'access') && (
                                    <button
                                        onClick={() => onStartRestTimer(restTime)}
                                        className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium ${
                                            restTimerActive
                                                ? 'bg-sys-accent text-white ring-2 ring-sys-accent/50'
                                                : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                        }`}
                                        aria-label={`Start ${restTime}s rest timer`}
                                    >
                                        <Timer size={14} />
                                        <span>{restTime >= 60 ? `${Math.floor(restTime / 60)}m` : `${restTime}s`}</span>
                                    </button>
                                )}

                                {/* Weight input - inline with set buttons for weighted exercises */}
                                {!isBodyweight && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                haptic.tick();
                                                const current = parseFloat(exerciseLog.weight || '0');
                                                onSaveWeight(exId, Math.max(0, current - 2.5).toString());
                                            }}
                                            className="h-8 w-8 min-w-[32px] rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors shrink-0"
                                            aria-label="Decrease weight by 2.5kg"
                                        >
                                            <Minus size={14} />
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
                                            className="w-20 h-10 px-1 bg-sys-surfaceHigh rounded-lg text-white text-center text-xl font-bold font-mono outline-none focus:ring-2 focus:ring-sys-accent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            aria-label="Weight in kg"
                                        />
                                        <button
                                            onClick={() => {
                                                haptic.tick();
                                                const current = parseFloat(exerciseLog.weight || '0');
                                                onSaveWeight(exId, (current + 2.5).toString());
                                            }}
                                            className="h-8 w-8 min-w-[32px] rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors shrink-0"
                                            aria-label="Increase weight by 2.5kg"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Previous weight and load range hints - only for weighted exercises */}
                        {!isBodyweight && (previousWeight || loadRange) && (
                            <div className="flex items-center justify-end gap-2 mb-2 -mt-1">
                                {/* Previous weight quick-fill button */}
                                {previousWeight && !exerciseLog.weight && (
                                    <button
                                        onClick={handleUsePreviousWeight}
                                        className="flex items-center gap-1 text-xs text-sys-accent font-medium px-2 py-0.5 rounded-full bg-sys-accent/10 hover:bg-sys-accent/20 active:scale-95 transition-all"
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
                                    <span className="text-xs text-sys-accent font-medium">
                                        Suggested: {loadRange.min === loadRange.max
                                            ? `${loadRange.min}kg`
                                            : `${loadRange.min}-${loadRange.max}kg`}
                                        {loadRange.perHand ? ' per hand' : ''}
                                    </span>
                                )}
                            </div>
                        )}
                            </>
                        )}

                        {/* RPE Selector - more compact */}
                        {rpePrompt?.exerciseId === exId && (
                            <div className="mb-2">
                                <RPESelector
                                    value={exerciseLog.rpe?.[rpePrompt.setIndex]}
                                    onChange={(rpe: RPEValue) => {
                                        onSaveRPE(exId, rpePrompt.setIndex, rpe);
                                        onClearRPEPrompt();
                                    }}
                                    onSkip={() => onClearRPEPrompt()}
                                    setNumber={rpePrompt.setIndex + 1}
                                    compact
                                />
                            </div>
                        )}

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
