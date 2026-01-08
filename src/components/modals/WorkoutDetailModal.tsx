import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    Plus,
    Check,
    MessageSquare,
} from '../icons';
import type { GlobalHistoryEntry } from '../../types';

export interface WorkoutDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    workouts: GlobalHistoryEntry[];
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
    isOpen,
    onClose,
    workouts,
}) => {
    if (!workouts || workouts.length === 0) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-sys-scrim/60 backdrop-blur-sm" />
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-sys-surface border border-sys-outlineVariant rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-sys-surface p-5 z-10 space-y-3">
                            <div className="divider divider-full-width" aria-hidden="true" />
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-sys-onSurface">
                                        {new Date(workouts[0].date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h3>
                                    <p className="text-sm text-sys-onSurfaceVar">
                                        {workouts.length} workout{workouts.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="h-10 w-10 rounded-xl bg-sys-surfaceContainerHigh hover:bg-sys-primaryContainer/20 transition-colors flex items-center justify-center"
                                    aria-label="Close workout details"
                                >
                                    <ChevronDown size={20} className="text-sys-onSurface" />
                                </button>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            {workouts.map((entry, idx) => {
                                const hasExercises = entry.exercises && entry.exercises.length > 0;
                                const totalSets = hasExercises
                                    ? entry.exercises!.reduce((sum, ex) => sum + (ex.totalSets || 0), 0)
                                    : 0;
                                const completedSets = hasExercises
                                    ? entry.exercises!.reduce((sum, ex) => sum + (ex.completedSets || 0), 0)
                                    : 0;
                                const exerciseCount = hasExercises ? entry.exercises!.length : 0;
                                const isFullyComplete = completedSets === totalSets && totalSets > 0;

                                return (
                                    <div key={idx} className="bg-sys-surfaceHigh rounded-2xl p-4 border border-sys-outlineVariant shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            {entry.isEmptyWorkout || (entry.week === 0 && entry.day === 0) ? (
                                                <div className="h-10 w-10 rounded-xl bg-sys-successContainer border border-sys-outlineVariant flex items-center justify-center">
                                                    <Plus size={20} className="text-sys-onSuccessContainer" />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-10 rounded-xl bg-sys-primaryContainer border border-sys-outlineVariant flex flex-col items-center justify-center">
                                                    <span className="text-[8px] font-semibold text-sys-onPrimaryContainer uppercase">W</span>
                                                    <span className="text-sm font-bold text-sys-onPrimaryContainer leading-none">{entry.week}</span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-semibold text-sys-onSurface">
                                                        {entry.isEmptyWorkout || (entry.week === 0 && entry.day === 0) ? 'Custom Workout' : `Day ${entry.day}`}
                                                    </h4>
                                                    {isFullyComplete && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sys-success/20 text-sys-success text-[10px] font-bold">
                                                            <Check size={10} />
                                                        </span>
                                                    )}
                                                </div>
                                                {hasExercises && (
                                                    <p className="text-xs text-sys-onSurfaceVar mt-0.5">
                                                        {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} • {completedSets}/{totalSets} sets
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {entry.workoutNotes && (
                                            <div className="mb-3 p-3 bg-sys-surfaceContainerHighest rounded-xl border border-sys-outlineVariant">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <MessageSquare size={12} className="text-sys-primary" />
                                                    <span className="text-[10px] font-bold text-sys-primary uppercase">Notes</span>
                                                </div>
                                                <p className="text-xs text-sys-onSurface leading-relaxed whitespace-pre-wrap">{entry.workoutNotes}</p>
                                            </div>
                                        )}

                                        {hasExercises && (
                                            <div className="space-y-2">
                                                {entry.exercises!.map((ex, exIdx) => {
                                                    const exComplete = ex.completedSets === ex.totalSets;
                                                    return (
                                                        <div key={exIdx} className={`bg-sys-surface rounded-xl p-3 border ${exComplete ? 'border-sys-successContainer/30' : 'border-sys-outlineVariant'}`}>
                                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                                <div className="flex-1 min-w-0">
                                                                    <h5 className="text-xs font-bold text-sys-onSurface truncate">{ex.name}</h5>
                                                                    <p className="text-[10px] text-sys-onSurfaceVar">{ex.prescription}</p>
                                                                </div>
                                                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                                                    exComplete ? 'bg-sys-successContainer text-sys-onSuccessContainer' : 'bg-sys-primaryContainer text-sys-onPrimaryContainer'
                                                                }`}>
                                                                    {exComplete && <Check size={10} />}
                                                                    <span>{ex.completedSets}/{ex.totalSets}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {ex.weight && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-sys-surfaceContainerLow text-sys-onSurface font-medium border border-sys-outlineVariant">
                                                                        {ex.weight} kg
                                                                    </span>
                                                                )}
                                                                {ex.rpe && Object.keys(ex.rpe).length > 0 && (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-[9px] text-sys-onSurfaceVar uppercase font-bold tracking-wider ml-1">RPE</span>
                                                                        {Object.entries(ex.rpe).map(([setIdx, rpe]) => (
                                                                            <span key={setIdx} className="text-[10px] w-5 h-5 flex items-center justify-center rounded-md bg-sys-tertiaryContainer text-sys-onTertiaryContainer font-semibold border border-sys-tertiary/20">
                                                                                {rpe}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
