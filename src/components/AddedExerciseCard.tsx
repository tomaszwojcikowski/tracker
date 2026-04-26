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
                        ? 'border-sys-successContainer bg-sys-successContainer/10'
                        : 'border-sys-outlineVariant'
                }`}
            >
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-sys-onSurface leading-tight">
                                {exercise.name}
                            </h3>
                            {completedSets > 0 && (
                                <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        completedSets === totalSets
                                            ? 'bg-sys-successContainer text-sys-onSuccessContainer'
                                            : 'bg-sys-primaryContainer text-sys-onPrimaryContainer'
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
                                            className="flex items-center gap-1 text-xs text-sys-primary hover:text-sys-primary/80 transition-colors"
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
                                                className="w-16 h-6 px-2 bg-sys-surfaceContainerLow rounded text-sys-onSurface text-xs font-mono outline-none focus:ring-1 focus:ring-sys-primary"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleWeightSave();
                                                    if (e.key === 'Escape') handleWeightCancel();
                                                }}
                                            />
                                            <button
                                                onClick={handleWeightSave}
                                                className="h-6 w-6 rounded bg-sys-successContainer text-sys-onSuccessContainer flex items-center justify-center"
                                                aria-label="Save weight"
                                            >
                                                <Check size={12} />
                                            </button>
                                            <button
                                                onClick={handleWeightCancel}
                                                className="h-6 w-6 rounded bg-sys-surfaceContainerLow text-sys-onSurfaceVar flex items-center justify-center"
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
                        className="btn-icon h-12 w-12 min-w-[48px] bg-sys-errorContainer text-sys-onErrorContainer"
                        aria-label="Remove exercise"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Rest time indicator */}
                {exercise.rest && exercise.rest > 0 && (
                    <div className="mb-3">
                        <button
                            onClick={() => {
                                haptic.bump();
                                onStartRestTimer(exercise.rest ?? 90);
                            }}
                            className={`h-10 px-3 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all text-sm font-semibold ${restTimerActive
                                ? 'bg-sys-surfaceHigh text-sys-onSurface ring-2 ring-sys-primary/50'
                                : 'bg-sys-surfaceHigh text-sys-onSurfaceVar border border-sys-outlineVariant/30'
                            }`}
                            aria-label={`Start ${exercise.rest} second timer`}
                        >
                            <Timer size={16} className={restTimerActive ? 'text-sys-primary' : ''} />
                            <span>{exercise.rest}s</span>
                        </button>
                    </div>
                )}

                {/* Set buttons */}
                <div className="flex flex-wrap gap-2">
                    {sets.map((isDone, i) => {
                        const allComplete = completedSets === totalSets && totalSets > 0;
                        return (
                            <button
                                key={`${exId}-set-${i}`}
                                onClick={() => onToggleSet(exId, i, exercise.sets, exercise.rest ?? 90)}
                                className={`set-button h-12 w-12 min-w-[48px] rounded-xl flex items-center justify-center text-base font-bold transition-all active:scale-90 ${
                                    isDone
                                        ? allComplete
                                            ? 'completed bg-sys-success text-sys-onSuccess shadow-elevation-1'
                                            : 'completed bg-sys-primary text-sys-onPrimary shadow-elevation-1'
                                        : 'bg-sys-surfaceContainerHigh text-sys-onSurfaceVar border-2 border-sys-outlineVariant'
                                }`}
                                aria-label={`Set ${i + 1}${isDone ? ' completed' : ''}`}
                            >
                                {isDone ? (
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="animate-checkmark"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    i + 1
                                )}
                            </button>
                        );
                    })}
                    {/* Add Set button */}
                    {onAddSet && sets.length < 10 && (
                        <button
                            onClick={() => {
                                haptic.bump();
                                onAddSet(exercise.id);
                            }}
                            className="h-12 w-12 min-w-[48px] rounded-xl flex items-center justify-center text-base font-bold transition-all active:scale-90 bg-sys-surfaceContainerLow text-sys-primary border-2 border-dashed border-sys-outlineVariant hover:bg-sys-surfaceContainerHigh"
                            aria-label="Add another set"
                        >
                            <Plus size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
