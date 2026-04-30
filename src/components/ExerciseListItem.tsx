/**
 * ExerciseListItem Component
 *
 * Exercise item for the exercise selector modal with expandable add form.
 * Extracted from WorkoutPlayer for reuse.
 */

import React, { useState } from 'react';
import { ChevronUp } from './icons';
import { TextField } from './TextField';
import type { Exercise } from '../types';
import type { HapticFeedback } from '../hooks';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_REST_TIME = 90;

// ============================================================================
// TYPES
// ============================================================================

export interface ExerciseListItemProps {
    /** Exercise to display */
    exercise: Exercise;
    /** Callback when exercise is added */
    onAdd: (exercise: Exercise, sets?: number, weight?: string, rest?: number) => void;
    /** Haptic feedback interface */
    haptic: HapticFeedback;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ExerciseListItem: React.FC<ExerciseListItemProps> = ({
    exercise,
    onAdd,
    haptic,
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [sets, setSets] = useState(3);
    const [weight, setWeight] = useState('');
    const [rest, setRest] = useState(DEFAULT_REST_TIME);

    const handleAdd = () => {
        haptic.success();
        onAdd(exercise, sets, weight, rest);
        setShowAddForm(false);
        setSets(3);
        setWeight('');
        setRest(DEFAULT_REST_TIME);
    };

    return (
        <div className={`rounded-md p-4 border ${
            exercise.category === 'mobility'
                ? 'bg-sys-surfaceContainerLow border-sys-outline'
                : 'bg-sys-surfaceContainerLow border-sys-outlineVariant'
        }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <h4 className="text-base font-semibold text-sys-onSurface mb-1">
                        {exercise.name}
                    </h4>
                    <p className="eyebrow text-sys-onSurfaceVariant mb-2">
                        {exercise.primaryMuscles.join(', ')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {exercise.equipment.slice(0, 3).map((eq) => (
                            <span
                                key={eq}
                                className="text-xs px-2 py-1 bg-sys-surfaceContainerHigh border border-sys-outlineVariant rounded-sm text-sys-onSurfaceVariant"
                            >
                                {eq}
                            </span>
                        ))}
                        {!exercise.isBodyweight && (
                            <span className="text-xs px-2 py-1 bg-sys-surfaceContainerHigh border border-sys-outlineVariant rounded-sm text-sys-onSurface">
                                Weighted
                            </span>
                        )}
                    </div>
                </div>

                {!showAddForm ? (
                    <button
                        onClick={() => {
                            haptic.tick();
                            setShowAddForm(true);
                        }}
                        className="btn-filled h-10 px-4 rounded-sm font-semibold text-sm active:scale-95 transition-transform flex-shrink-0"
                    >
                        Add
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            haptic.tick();
                            setShowAddForm(false);
                        }}
                        className="h-10 w-10 rounded-sm bg-sys-surfaceContainerHigh border border-sys-outlineVariant text-sys-onSurface flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
                        aria-label="Collapse form"
                    >
                        <ChevronUp size={20} />
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="mt-4 pt-4 space-y-4">
                    <div className="divider divider-inset" aria-hidden="true" />
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <TextField
                            label="Sets"
                            type="number"
                            value={sets.toString()}
                            onChange={(v) => setSets(parseInt(v) || 1)}
                            variant="outlined"
                            inputMode="numeric"
                        />
                        {!exercise.isBodyweight && (
                            <TextField
                                label="Weight"
                                type="number"
                                value={weight}
                                onChange={setWeight}
                                placeholder="kg"
                                variant="outlined"
                                inputMode="decimal"
                            />
                        )}
                        <TextField
                            label="Rest (s)"
                            type="number"
                            value={rest.toString()}
                            onChange={(v) => setRest(parseInt(v) || DEFAULT_REST_TIME)}
                            variant="outlined"
                            inputMode="numeric"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="w-full h-12 rounded-md bg-sys-onSurface text-sys-surface font-bold active:scale-[0.99] transition-transform"
                    >
                        Add to Workout
                    </button>
                </div>
            )}
        </div>
    );
};
