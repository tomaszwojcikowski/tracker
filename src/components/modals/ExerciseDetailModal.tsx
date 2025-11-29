/**
 * Exercise Detail Modal Component
 *
 * Slide-up modal for viewing exercise details, history, and stats.
 * Reduces navigation depth by keeping user on current screen.
 */

import React, { useEffect, useRef } from 'react';
import { X, TrendingUp, Calendar, Dumbbell, Trophy, Clock } from 'lucide-react';
import { getExerciseHistory, calculateExerciseStats } from '../../utils/exerciseHistory';

export interface ExerciseDetailModalProps {
    /** Exercise name to show details for */
    exerciseName: string;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Whether modal is visible */
    isOpen: boolean;
}

/**
 * Simple Weight Progress Graph (SVG-based)
 */
const WeightGraph: React.FC<{ data: Array<{ weight: number; date: string }> }> = ({ data }) => {
    if (!data || data.length < 2) return null;

    const weightData = data.filter(d => d.weight && d.weight > 0);
    if (weightData.length < 2) return null;

    const weights = weightData.map(d => d.weight);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const range = maxWeight - minWeight || 1;

    const width = 100;
    const height = 50;
    const padding = 6;

    const points = weightData.map((d, i) => {
        const x = (i / (weightData.length - 1)) * (width - 2 * padding) + padding;
        const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    return (
        <div className="bg-sys-surfaceHigh rounded-xl p-3">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="graphGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#graphGradient)" />
                <polyline
                    points={points}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <div className="flex justify-between text-xs mt-2">
                <span className="text-sys-onSurfaceVar">{minWeight}kg</span>
                <span className="text-sys-accent font-semibold">{maxWeight}kg</span>
            </div>
        </div>
    );
};

/**
 * Exercise Detail Modal - Slide-up modal for exercise info
 */
export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
    exerciseName,
    onClose,
    isOpen,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Focus trap
    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const history = getExerciseHistory(exerciseName);
    const stats = calculateExerciseStats(exerciseName);
    const recentHistory = history.slice(-5).reverse();

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="exercise-modal-title"
                tabIndex={-1}
                className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-sys-surface rounded-t-3xl animate-slide-up max-h-[80vh] overflow-hidden flex flex-col"
            >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-4 border-b border-white/5">
                    <div>
                        <h2 id="exercise-modal-title" className="text-lg font-bold text-white">
                            {exerciseName}
                        </h2>
                        <p className="text-xs text-sys-onSurfaceVar">
                            {stats.totalWorkouts} workout{stats.totalWorkouts !== 1 ? 's' : ''} logged
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 rounded-full bg-sys-surfaceHigh text-sys-onSurfaceVar flex items-center justify-center active:scale-90 transition-all"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {stats.totalWorkouts === 0 ? (
                        <div className="text-center py-8">
                            <div className="h-16 w-16 rounded-full bg-sys-surfaceHigh flex items-center justify-center mx-auto mb-4">
                                <Dumbbell size={28} className="text-sys-onSurfaceVar" />
                            </div>
                            <p className="text-sm text-sys-onSurfaceVar">
                                No history yet. Complete this exercise to see your progress.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-sys-surfaceHigh rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar size={14} className="text-sys-onSurfaceVar" />
                                        <span className="text-[10px] text-sys-onSurfaceVar uppercase tracking-wider">Workouts</span>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{stats.totalWorkouts}</span>
                                </div>
                                {stats.maxWeight && (
                                    <div className="bg-sys-accent/10 rounded-xl p-3 border border-sys-accent/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Dumbbell size={14} className="text-sys-accent" />
                                            <span className="text-[10px] text-sys-accent uppercase tracking-wider">Max Weight</span>
                                        </div>
                                        <span className="text-2xl font-bold text-sys-accent">{stats.maxWeight}kg</span>
                                    </div>
                                )}
                                {stats.maxSets && (
                                    <div className="bg-sys-surfaceHigh rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Trophy size={14} className="text-sys-onSurfaceVar" />
                                            <span className="text-[10px] text-sys-onSurfaceVar uppercase tracking-wider">Max Sets</span>
                                        </div>
                                        <span className="text-2xl font-bold text-white">{stats.maxSets}</span>
                                    </div>
                                )}
                                {stats.estimated1RM && (
                                    <div className="bg-sys-success/10 rounded-xl p-3 border border-sys-success/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp size={14} className="text-sys-success" />
                                            <span className="text-[10px] text-sys-success uppercase tracking-wider">Est. 1RM</span>
                                        </div>
                                        <span className="text-2xl font-bold text-sys-success">{stats.estimated1RM}kg</span>
                                    </div>
                                )}
                            </div>

                            {/* Progress Graph */}
                            {stats.recentProgress && stats.recentProgress.length > 1 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp size={14} className="text-sys-accent" />
                                        <span className="text-xs font-semibold text-white">Weight Progress</span>
                                    </div>
                                    <WeightGraph data={stats.recentProgress.map(p => ({ weight: p.weight || 0, date: p.date }))} />
                                </div>
                            )}

                            {/* Recent History */}
                            {recentHistory.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock size={14} className="text-sys-onSurfaceVar" />
                                        <span className="text-xs font-semibold text-white">Recent Sessions</span>
                                    </div>
                                    <div className="space-y-2">
                                        {recentHistory.map((entry, idx) => (
                                            <div key={idx} className="bg-sys-surfaceHigh rounded-xl p-3 flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-white leading-none">
                                                        {new Date(entry.date).getDate()}
                                                    </span>
                                                    <span className="text-[10px] text-sys-onSurfaceVar uppercase">
                                                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-white">
                                                        {entry.sets} sets
                                                    </div>
                                                    <div className="text-xs text-sys-onSurfaceVar">
                                                        Week {entry.week}, Day {entry.day}
                                                    </div>
                                                </div>
                                                {entry.weight && (
                                                    <span className="px-2.5 py-1 rounded-lg bg-sys-accent/15 text-sys-accent text-sm font-bold flex-shrink-0">
                                                        {entry.weight}kg
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default ExerciseDetailModal;
