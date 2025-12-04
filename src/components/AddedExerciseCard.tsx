/**
 * AddedExerciseCard Component
 *
 * Simplified exercise card for added/custom exercises in the workout player.
 */

import React from 'react';
import { Check, X, Timer } from 'lucide-react';
import type { AddedExercise } from '../types';
import type { HapticFeedback } from '../hooks';

// ============================================================================
// TYPES
// ============================================================================

export interface AddedExerciseCardProps {
    /** Added exercise data */
    exercise: AddedExercise;
    /** Current set completion array */
    sets: boolean[];
    /** Haptic feedback interface */
    haptic: Pick<HapticFeedback, 'tick' | 'bump'>;
    /** Callbacks */
    onToggleSet: (exId: string, setIndex: number, defaultSets: number, restTime?: number) => void;
    onRemove: (exerciseId: string) => void;
    onStartRestTimer: (seconds: number) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AddedExerciseCard: React.FC<AddedExerciseCardProps> = ({
    exercise,
    sets,
    haptic,
    onToggleSet,
    onRemove,
    onStartRestTimer,
}) => {
    const exId = `added_${exercise.id}`;
    const completedSets = sets.filter((s) => s).length;
    const totalSets = sets.length;

    return (
        <div id={exId} className="relative scroll-mt-16">
            <div
                className={`bg-sys-surface rounded-2xl p-4 border relative z-10 overflow-hidden ${
                    completedSets === totalSets
                        ? 'border-sys-success/30 bg-sys-success/5'
                        : 'border-white/5'
                }`}
            >
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-white leading-tight">
                                {exercise.name}
                            </h3>
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
                        </div>
                        <p className="text-xs text-sys-onSurfaceVar">
                            {exercise.sets} sets {exercise.weight ? `@ ${exercise.weight}kg` : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => onRemove(exercise.id)}
                        className="h-8 w-8 min-w-[32px] rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center active:scale-90 transition-all"
                        aria-label="Remove exercise"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Rest time indicator */}
                {exercise.rest && exercise.rest > 0 && (
                    <div className="mb-2">
                        <button
                            onClick={() => {
                                haptic.bump();
                                onStartRestTimer(exercise.rest ?? 90);
                            }}
                            className="h-7 px-2.5 rounded-md bg-sys-surfaceHigh text-sys-onSurfaceVar text-xs font-medium flex items-center gap-1 active:bg-sys-accent/20 transition-colors"
                            aria-label={`Start ${exercise.rest} second timer`}
                        >
                            <Timer size={12} />
                            <span>{exercise.rest}s</span>
                        </button>
                    </div>
                )}

                {/* Set buttons */}
                <div className="flex flex-wrap gap-2">
                    {sets.map((isDone, i) => (
                        <button
                            key={`${exId}-set-${i}`}
                            onClick={() => onToggleSet(exId, i, exercise.sets, exercise.rest ?? 90)}
                            className={`set-button h-8 w-8 min-w-[32px] rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-90 ${
                                isDone
                                    ? 'completed bg-sys-accent text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                            }`}
                            aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                        >
                            {isDone ? <Check size={14} /> : i + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
