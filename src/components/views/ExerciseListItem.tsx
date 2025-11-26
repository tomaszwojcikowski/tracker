import React, { useState } from 'react';
import type { Exercise } from '../../types';
import type { HapticFeedback } from '../../hooks';

export interface ExerciseListItemProps {
    exercise: Exercise;
    onAdd: (exercise: Exercise, sets?: number, weight?: string) => void;
    haptic: HapticFeedback;
}

export const ExerciseListItem: React.FC<ExerciseListItemProps> = ({ exercise, onAdd, haptic }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [sets, setSets] = useState(3);
    const [weight, setWeight] = useState('');

    return (
        <div className="bg-sys-surfaceHigh rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <h4 className="text-base font-semibold text-white mb-1">{exercise.name}</h4>
                    <p className="text-xs text-sys-onSurfaceVar mb-2">{exercise.primaryMuscles.join(', ')}</p>
                    <div className="flex flex-wrap gap-1">
                        {exercise.equipment.slice(0, 3).map((equipment) => (
                            <span key={equipment} className="text-xs px-2 py-1 bg-sys-surface rounded-lg text-sys-onSurfaceVar">
                                {equipment}
                            </span>
                        ))}
                        {!exercise.isBodyweight && (
                            <span className="text-xs px-2 py-1 bg-sys-accent/10 rounded-lg text-sys-accent">Weighted</span>
                        )}
                    </div>
                </div>

                {!showAddForm ? (
                    <button
                        onClick={() => {
                            haptic.tick();
                            setShowAddForm(true);
                        }}
                        className="h-10 px-4 rounded-xl text-white font-semibold text-sm active:scale-95 transition-transform flex-shrink-0 btn-gradient-primary"
                    >
                        Add
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            haptic.tick();
                            setShowAddForm(false);
                        }}
                        className="h-10 w-10 rounded-xl bg-sys-surface text-sys-onSurfaceVar flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
                        aria-label="Collapse form"
                    >
                        <i data-lucide="chevron-up" width="20"></i>
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">Sets</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={sets}
                                onChange={(event) => setSets(parseInt(event.target.value, 10) || 1)}
                                className="w-full h-10 px-3 bg-sys-surface rounded-xl text-white text-center font-mono outline-none focus:ring-2 focus:ring-sys-accent"
                            />
                        </div>
                        {!exercise.isBodyweight && (
                            <div>
                                <label className="text-xs text-sys-onSurfaceVar uppercase font-bold mb-2 block">Weight (kg)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={weight}
                                    onChange={(event) => setWeight(event.target.value)}
                                    placeholder="0"
                                    className="w-full h-10 px-3 bg-sys-surface rounded-xl text-white text-center font-mono outline-none focus:ring-2 focus:ring-sys-accent"
                                />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            haptic.success();
                            onAdd(exercise, sets, weight);
                            setShowAddForm(false);
                            setSets(3);
                            setWeight('');
                        }}
                        className="w-full h-10 rounded-xl text-white font-semibold active:scale-95 transition-transform btn-gradient-success"
                    >
                        Add to Workout
                    </button>
                </div>
            )}
        </div>
    );
};
