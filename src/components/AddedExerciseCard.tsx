/**
 * AddedExerciseCard Component
 *
 * Simplified exercise card for added/custom exercises in the workout player.
 * Features weight editing and dynamic set management.
 */

import React, { useState } from 'react';
import { Check, X, Timer, Plus, Settings } from './icons';
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
    /** Rest timer active state */
    restTimerActive?: boolean;
    /** Callbacks */
    onToggleSet: (exId: string, setIndex: number, defaultSets: number, restTime?: number) => void;
    onRemove: (exerciseId: string) => void;
    onStartRestTimer: (seconds: number) => void;
    /** Callback to update exercise weight */
    onUpdateWeight?: (exerciseId: string, weight: string) => void;
    /** Callback to add a set */
    onAddSet?: (exerciseId: string) => void;
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
    restTimerActive = false,
    onUpdateWeight,
    onAddSet,
}) => {
    const exId = `added_${exercise.id}`;
    const completedSets = sets.filter((s) => s).length;
    const totalSets = sets.length;
    const [isEditingWeight, setIsEditingWeight] = useState(false);
    const [weightInput, setWeightInput] = useState(exercise.weight || '');

    const handleWeightSave = () => {
        if (onUpdateWeight) {
            onUpdateWeight(exercise.id, weightInput);
        }
        setIsEditingWeight(false);
        haptic.tick();
    };

    const handleWeightCancel = () => {
        setWeightInput(exercise.weight || '');
        setIsEditingWeight(false);
        haptic.tick();
    };

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
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-sys-onSurfaceVar">
                                {exercise.sets} sets
                            </p>
                            {!exercise.isBodyweight && (
                                <>
                                    {!isEditingWeight ? (
                                        <button
                                            onClick={() => {
                                                haptic.tick();
                                                setIsEditingWeight(true);
                                            }}
                                            className="flex items-center gap-1 text-xs text-sys-accent hover:text-sys-accent/80 transition-colors"
                                        >
                                            {exercise.weight ? (
                                                <>
                                                    <span>@ {exercise.weight}kg</span>
                                                    <Settings size={12} />
                                                </>
                                            ) : (
                                                <>
                                                    <span>Add weight</span>
                                                    <Plus size={12} />
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                min="0"
                                                step="0.5"
                                                value={weightInput}
                                                onChange={(e) => setWeightInput(e.target.value)}
                                                placeholder="kg"
                                                className="w-16 h-6 px-2 bg-sys-surfaceHigh rounded text-white text-xs font-mono outline-none focus:ring-1 focus:ring-sys-accent"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleWeightSave();
                                                    if (e.key === 'Escape') handleWeightCancel();
                                                }}
                                            />
                                            <button
                                                onClick={handleWeightSave}
                                                className="h-6 w-6 rounded bg-sys-success/20 text-sys-success flex items-center justify-center"
                                                aria-label="Save weight"
                                            >
                                                <Check size={12} />
                                            </button>
                                            <button
                                                onClick={handleWeightCancel}
                                                className="h-6 w-6 rounded bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center"
                                                aria-label="Cancel"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => onRemove(exercise.id)}
                        className="btn-icon h-8 w-8 min-w-[32px] bg-red-500/10 text-red-500"
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
                            className={`btn-md3 h-7 px-2.5 min-h-0 rounded-lg text-xs font-medium flex items-center gap-1 ${restTimerActive
                                ? 'btn-filled ring-2 ring-sys-accent/50'
                                : 'btn-tonal'
                            }`}
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
                    {/* Add Set button */}
                    {onAddSet && sets.length < 10 && (
                        <button
                            onClick={() => {
                                haptic.bump();
                                onAddSet(exercise.id);
                            }}
                            className="h-8 w-8 min-w-[32px] rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-90 bg-sys-surfaceHigh/50 text-sys-accent border border-dashed border-sys-accent/30 hover:bg-sys-surfaceHigh"
                            aria-label="Add another set"
                        >
                            <Plus size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
