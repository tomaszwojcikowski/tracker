/**
 * Exercise Detail Modal Component
 *
 * Bottom sheet modal for viewing exercise details, history, and stats.
 * Uses MD3 BottomSheet pattern for consistent mobile UX.
 */

import React, { useMemo } from 'react';
import { X, TrendingUp, Calendar, Dumbbell, Trophy, Activity } from 'lucide-react';
import { getExerciseHistory, calculateExerciseStats } from '../../utils/exerciseHistory';
import { BottomSheet } from '../BottomSheet';

export interface ExerciseDetailModalProps {
    /** Exercise name to show details for */
    exerciseName: string;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Whether modal is visible */
    isOpen: boolean;
}

/**
 * Enhanced Weight Progress Graph (SVG-based)
 */
const WeightGraph: React.FC<{ data: Array<{ weight: number; date: string }> }> = ({ data }) => {
    if (!data || data.length < 2) return (
        <div className="bg-sys-surfaceHigh rounded-xl p-6 flex flex-col items-center justify-center text-sys-onSurfaceVar h-40">
            <Activity size={24} className="mb-2 opacity-50" />
            <span className="text-xs">Not enough data for graph</span>
        </div>
    );

    const weightData = data.filter(d => d.weight && d.weight > 0);
    if (weightData.length < 2) return (
        <div className="bg-sys-surfaceHigh rounded-xl p-6 flex flex-col items-center justify-center text-sys-onSurfaceVar h-40">
            <Activity size={24} className="mb-2 opacity-50" />
            <span className="text-xs">Not enough data for graph</span>
        </div>
    );

    const weights = weightData.map(d => d.weight);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    // Add 10% padding to range
    const range = (maxWeight - minWeight) || 1;
    const paddingY = range * 0.1;
    const effectiveMin = Math.max(0, minWeight - paddingY);
    const effectiveMax = maxWeight + paddingY;
    const effectiveRange = effectiveMax - effectiveMin;

    const width = 300;
    const height = 150;
    const padding = 20;

    const points = weightData.map((d, i) => {
        const x = padding + (i / (weightData.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((d.weight - effectiveMin) / effectiveRange) * (height - 2 * padding);
        return { x, y };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPoints = `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`;

    return (
        <div className="bg-sys-surfaceHigh rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-sys-accent" />
                    Progress
                </h3>
                <span className="text-xs text-sys-onSurfaceVar">Last {weightData.length} sessions</span>
            </div>

            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="graphGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                    {/* Area fill */}
                    <polygon points={areaPoints} fill="url(#graphGradient)" />

                    {/* Line */}
                    <polyline
                        points={polylinePoints}
                        fill="none"
                        stroke="var(--color-accent)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="3"
                            fill="var(--color-surface)"
                            stroke="var(--color-accent)"
                            strokeWidth="2"
                        />
                    ))}
                </svg>

                {/* Labels */}
                <div className="absolute top-0 right-0 text-xs font-bold text-sys-accent transform -translate-y-1/2">
                    {maxWeight}kg
                </div>
                <div className="absolute bottom-0 left-0 text-xs text-sys-onSurfaceVar transform translate-y-1/2">
                    {minWeight}kg
                </div>
            </div>
        </div>
    );
};

/**
 * Exercise Detail Modal - Bottom sheet for exercise info
 */
export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
    exerciseName,
    onClose,
    isOpen,
}) => {
    const history = getExerciseHistory(exerciseName);
    const stats = calculateExerciseStats(exerciseName);

    // Prepare graph data (chronological)
    const graphData = useMemo(() => {
        return history
            .filter(h => h.weight && typeof h.weight === 'number')
            .map(h => ({
                weight: h.weight as number,
                date: h.date
            }));
    }, [history]);

    const recentHistory = [...history].reverse().slice(0, 10);

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            ariaLabelledBy="exercise-modal-title"
            maxHeight={85}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-white/5">
                <div>
                    <h2 id="exercise-modal-title" className="text-xl font-bold text-white">
                        {exerciseName}
                    </h2>
                    <p className="text-xs text-sys-onSurfaceVar mt-1">
                        {stats.totalWorkouts} sessions completed
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="h-8 w-8 rounded-full bg-sys-surfaceHigh flex items-center justify-center text-sys-onSurfaceVar active:scale-90 transition-all"
                    aria-label="Close exercise details"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto pb-safe">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-sys-surfaceHigh rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-10">
                            <Trophy size={32} />
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-sys-onSurfaceVar mb-1 font-bold">Est. 1RM</div>
                        <div className="text-xl font-bold text-white">
                            {stats.estimated1RM ? (
                                <span>{stats.estimated1RM}<span className="text-xs font-normal text-sys-onSurfaceVar ml-0.5">kg</span></span>
                            ) : '-'}
                        </div>
                    </div>
                    <div className="bg-sys-surfaceHigh rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-10">
                            <Dumbbell size={32} />
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-sys-onSurfaceVar mb-1 font-bold">Max Weight</div>
                        <div className="text-xl font-bold text-white">
                            {stats.maxWeight ? (
                                <span>{stats.maxWeight}<span className="text-xs font-normal text-sys-onSurfaceVar ml-0.5">kg</span></span>
                            ) : '-'}
                        </div>
                    </div>
                    <div className="bg-sys-surfaceHigh rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-10">
                            <Activity size={32} />
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-sys-onSurfaceVar mb-1 font-bold">Max Sets</div>
                        <div className="text-xl font-bold text-white">
                            {stats.maxSets !== null ? stats.maxSets : '-'}
                        </div>
                    </div>
                </div>

                {/* Progress Graph */}
                <WeightGraph data={graphData} />

                {/* History List */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Calendar size={16} className="text-sys-accent" />
                        History
                    </h3>

                    {recentHistory.length > 0 ? (
                        <div className="space-y-2">
                            {recentHistory.map((entry) => (
                                <div key={entry.date} className="bg-sys-surfaceHigh rounded-xl p-3 flex items-center justify-between border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-sys-surface flex flex-col items-center justify-center text-xs font-bold border border-white/5">
                                            <span className="text-sys-onSurfaceVar uppercase text-[10px]">
                                                {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-white text-sm">
                                                {new Date(entry.date).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-white font-medium text-sm">
                                                {entry.weight ? `${entry.weight}kg` : 'Bodyweight'}
                                            </div>
                                            <div className="text-xs text-sys-onSurfaceVar flex items-center gap-2">
                                                <span>{entry.sets} sets</span>
                                                {entry.prescription && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                                        <span>{entry.prescription}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Highlight PRs or good performance */}
                                    {stats.maxWeight && entry.weight === stats.maxWeight && (
                                        <div className="h-6 px-2 rounded-full bg-sys-accent/20 text-sys-accent text-[10px] font-bold flex items-center border border-sys-accent/30">
                                            PR
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-sys-onSurfaceVar text-sm bg-sys-surfaceHigh rounded-xl border border-dashed border-white/10">
                            No history available yet.
                        </div>
                    )}
                </div>
            </div>
        </BottomSheet>
    );
};
