/**
 * ExerciseCard Component
 *
 * Individual exercise card for the workout player card view.
 * Handles exercise display, set toggling, weight input, and collapse state.
 */

import React from 'react';
import {
    ChevronDown,
    ChevronUp,
    Timer,
    Repeat,
    Check,
    Plus,
    CheckCheck,
    Minus,
    Link,
    Zap,
    ArrowRightLeft,
    Info,
} from 'lucide-react';
import { RPESelector } from './RPESelector';
import type { RPEValue } from '../types';
import type { ExerciseLogEntry } from '../types/workout';
import type { HapticFeedback } from '../hooks';

// ============================================================================
// TYPES
// ============================================================================

export interface LoadRange {
    min: number;
    max: number;
    unit: string;
    perHand?: boolean;
}

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
    /** Rest time in seconds */
    restTime?: number;
    /** Load range suggestion */
    loadRange?: LoadRange;
    /** Alternative exercises available */
    alternatives?: string[];
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
    /** Haptic feedback interface */
    haptic: Pick<HapticFeedback, 'tick' | 'bump' | 'success'>;
    /** Callbacks */
    onToggleCollapse: (exId: string) => void;
    onToggleSet: (exId: string, setIndex: number, defaultSets: number, restTime?: number) => void;
    onAddSet: (exId: string, defaultSets: number) => void;
    onCompleteAllSets: (exId: string, defaultSets: number) => void;
    onSaveWeight: (exId: string, weight: string) => void;
    onSaveRPE: (exId: string, setIndex: number, rpe: RPEValue) => void;
    onClearRPEPrompt: () => void;
    onStartRestTimer: (seconds: number) => void;
    onToggleEmomTimer: () => void;
    onShowHistory: (name: string) => void;
    onShowNotes: (exerciseName: string, notes: string) => void;
    onShowAlternatives: (name: string, alternatives: string[]) => void;
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
    restTime,
    loadRange,
    alternatives,
    sets,
    defaultSets,
    exerciseLog,
    hasHistory,
    isFirstIncomplete,
    isCollapsed,
    supersetGroup,
    supersetPosition,
    rpePrompt,
    emomTimerActive,
    emomTimerInterval,
    haptic,
    onToggleCollapse,
    onToggleSet,
    onAddSet,
    onCompleteAllSets,
    onSaveWeight,
    onSaveRPE,
    onClearRPEPrompt,
    onStartRestTimer,
    onToggleEmomTimer,
    onShowHistory,
    onShowNotes,
    onShowAlternatives,
}) => {
    const completedSets = sets.filter((s) => s).length;
    const totalSets = sets.length;

    // Superset connector styling
    const hasSupersetGroup = supersetGroup !== undefined;
    const isFirstInSuperset = supersetPosition === 'first';
    const isMiddleInSuperset = supersetPosition === 'middle';
    const isLastInSuperset = supersetPosition === 'last';
    const showSupersetConnectorTop = isMiddleInSuperset || isLastInSuperset;
    const showSupersetConnectorBottom = isFirstInSuperset || isMiddleInSuperset;

    return (
        <div id={exId} className="relative scroll-mt-16">
            {/* Superset Connector Line */}
            {hasSupersetGroup && (
                <>
                    {showSupersetConnectorTop && (
                        <div className="absolute left-2 top-0 w-0.5 h-3 bg-gradient-to-b from-amber-500/80 to-amber-500 z-20" />
                    )}
                    {showSupersetConnectorBottom && (
                        <div className="absolute left-2 bottom-0 w-0.5 h-3 bg-gradient-to-t from-amber-500/80 to-amber-500 z-20" />
                    )}
                    {isFirstInSuperset && (
                        <div className="absolute left-4 -top-2 z-20">
                            <div className="flex items-center gap-1 bg-amber-500/90 text-amber-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                                <Link size={8} strokeWidth={3} />
                                <span>SUPERSET</span>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div
                className={`bg-sys-surface rounded-2xl p-4 border relative z-10 overflow-hidden ${
                    completedSets === totalSets
                        ? 'border-sys-success/30 bg-sys-success/5'
                        : isFirstIncomplete
                            ? 'border-sys-accent/50 bg-sys-accent/10'
                            : hasSupersetGroup
                                ? 'border-amber-500/30 bg-amber-500/5'
                                : 'border-white/5'
                } ${hasSupersetGroup ? 'ml-4' : ''}`}
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
                                onClick={() => {
                                    if (hasHistory) {
                                        haptic.tick();
                                        onShowHistory(effectiveName);
                                    }
                                }}
                                className={`text-left ${hasHistory ? 'cursor-pointer active:opacity-70 transition-opacity' : 'cursor-default'}`}
                                aria-label={hasHistory ? `${effectiveName} - tap to view history` : effectiveName}
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
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    <Zap size={10} strokeWidth={3} />
                                    EMOM
                                </span>
                            )}

                            {/* Unilateral Badge */}
                            {isUnilateral && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    <ArrowRightLeft size={10} strokeWidth={3} />
                                    PER SIDE
                                </span>
                            )}

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

                            {/* Notes icon button */}
                            {notes && (
                                <button
                                    onClick={() => {
                                        haptic.tick();
                                        onShowNotes(effectiveName, notes);
                                    }}
                                    className="h-6 w-6 rounded-full bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                                    aria-label="View notes"
                                >
                                    <Info size={12} />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-sys-onSurfaceVar">{prescription}</p>
                    </div>

                    {/* Collapse button */}
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
                </div>

                {/* Collapsed content */}
                {!isCollapsed && (
                    <>
                        {/* Timer buttons */}
                        {((restTime && restTime > 0) || totalSets > 1) && (
                            <div className="flex gap-2 mb-3">
                                {restTime && restTime > 0 && (
                                    <button
                                        onClick={() => {
                                            haptic.bump();
                                            onStartRestTimer(restTime);
                                        }}
                                        className="h-8 px-3 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar text-xs font-semibold flex items-center justify-center gap-1.5 active:bg-sys-accent/20 transition-colors"
                                        aria-label={`Start ${restTime} second timer`}
                                    >
                                        <Timer size={14} />
                                        <span>{restTime}s</span>
                                    </button>
                                )}
                                {totalSets > 1 && (
                                    <button
                                        onClick={() => {
                                            haptic.bump();
                                            onToggleEmomTimer();
                                        }}
                                        className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                            emomTimerActive
                                                ? 'bg-sys-accent text-white'
                                                : 'bg-sys-surfaceHigh text-sys-onSurfaceVar active:bg-sys-accent/20'
                                        }`}
                                        aria-label={`Start EMOM timer with ${emomTimerInterval} second interval`}
                                    >
                                        <Repeat size={14} />
                                        <span>EMOM {emomTimerInterval}s</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Set buttons */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {sets.map((isDone, i) => (
                                <button
                                    key={`${exId}-set-${i}`}
                                    onClick={() => onToggleSet(exId, i, defaultSets, restTime)}
                                    className={`set-button h-11 w-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-sm font-bold ${
                                        isDone
                                            ? 'completed bg-sys-accent text-white shadow-[0_0_16px_rgba(59,130,246,0.5)]'
                                            : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                                    }`}
                                    aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                                >
                                    {isDone ? <Check size={20} /> : i + 1}
                                </button>
                            ))}

                            {/* Add set button */}
                            <button
                                onClick={() => onAddSet(exId, defaultSets)}
                                className="h-11 w-11 min-w-[44px] min-h-[44px] rounded-xl bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center text-sm font-bold border-2 border-dashed border-white/20 active:scale-95 transition-all"
                                aria-label="Add set"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {/* RPE Selector */}
                        {rpePrompt?.exerciseId === exId && (
                            <RPESelector
                                value={exerciseLog.rpe?.[rpePrompt.setIndex]}
                                onChange={(rpe: RPEValue) => {
                                    onSaveRPE(exId, rpePrompt.setIndex, rpe);
                                    onClearRPEPrompt();
                                }}
                                onSkip={() => onClearRPEPrompt()}
                                setNumber={rpePrompt.setIndex + 1}
                                showAsPrompt
                            />
                        )}

                        {/* Complete all button */}
                        {sets.filter((s) => !s).length > 1 && (
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => onCompleteAllSets(exId, defaultSets)}
                                    className="flex-1 h-8 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar text-xs font-semibold flex items-center justify-center gap-1.5 active:bg-sys-accent/20 transition-colors"
                                    aria-label="Complete all sets"
                                >
                                    <CheckCheck size={14} />
                                    <span>Complete All</span>
                                </button>
                            </div>
                        )}

                        {/* Weight input for weighted exercises */}
                        {!isBodyweight && (
                            <div className="pt-3 border-t border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <label
                                        htmlFor={`${exId}-weight`}
                                        className="text-xs text-sys-onSurfaceVar uppercase font-bold"
                                    >
                                        Load (kg)
                                    </label>
                                    {loadRange && loadRange.min > 0 && loadRange.unit === 'kg' && (
                                        <span className="text-xs text-sys-accent font-medium">
                                            Suggested: {loadRange.min === loadRange.max
                                                ? `${loadRange.min}kg`
                                                : `${loadRange.min}-${loadRange.max}kg`}
                                            {loadRange.perHand ? ' per hand' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="relative flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => {
                                            haptic.tick();
                                            const current = parseFloat(exerciseLog.weight || '0');
                                            onSaveWeight(exId, Math.max(0, current - 2.5).toString());
                                        }}
                                        className="h-10 w-10 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors shrink-0"
                                        aria-label="Decrease weight by 2.5kg"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        id={`${exId}-weight`}
                                        type="number"
                                        inputMode="decimal"
                                        value={exerciseLog.weight || ''}
                                        onChange={(e) => onSaveWeight(exId, e.target.value)}
                                        placeholder={loadRange && loadRange.unit === 'kg' && loadRange.min > 0 ? String(loadRange.min) : '0'}
                                        className="w-20 h-10 px-2 bg-sys-surfaceHigh rounded-lg text-white text-center text-xl font-bold font-mono outline-none focus:ring-2 focus:ring-sys-accent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        onClick={() => {
                                            haptic.tick();
                                            const current = parseFloat(exerciseLog.weight || '0');
                                            onSaveWeight(exId, (current + 2.5).toString());
                                        }}
                                        className="h-10 w-10 rounded-lg bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:bg-sys-onSurfaceVar/20 transition-colors shrink-0"
                                        aria-label="Increase weight by 2.5kg"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
