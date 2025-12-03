/**
 * Exercise Detail Modal Component
 *
 * Bottom sheet modal for viewing exercise details, history, and stats.
 * Uses MD3 BottomSheet pattern for consistent mobile UX.
 */

import React, { useMemo } from 'react';
import { X, TrendingUp, Calendar, Dumbbell, Trophy, Activity, ArrowRightLeft } from 'lucide-react';
import { getExerciseHistory, calculateExerciseStats } from '../../utils/exerciseHistory';
import type { ExerciseHistoryEntry } from '../../utils/exerciseHistory';
import { BottomSheet } from '../BottomSheet';

export interface ExerciseDetailModalProps {
    /** Exercise name to show details for */
    exerciseName: string;
    /** Optional override for which name to use when fetching history */
    historyLookupName?: string;
    /** Original programmed exercise name */
    originalName?: string;
    /** Whether exercise is currently swapped */
    isSwapped?: boolean;
    /** Available alternatives for swapping */
    alternatives?: string[];
    /** Callback to trigger swap flow */
    onSwapExercise?: (originalName: string, alternatives: string[]) => void;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Whether modal is visible */
    isOpen: boolean;
}

const extractRepsFromPrescription = (prescription?: string): string | null => {
    if (!prescription) return null;
    if (/amrap/i.test(prescription)) {
        return 'AMRAP';
    }

    const xMatch = prescription.match(/x\s*(\d+(?:\s*-\s*\d+)?)/i);
    if (xMatch?.[1]) {
        return xMatch[1].replace(/\s+/g, '');
    }

    const repsMatch = prescription.match(/(\d+(?:-\d+)?)\s*reps?/i);
    if (repsMatch?.[1]) {
        return repsMatch[1];
    }

    return null;
};

const formatSetsLabel = (entry: ExerciseHistoryEntry): string => {
    if (typeof entry.totalSets === 'number' && entry.totalSets > 0) {
        return `${entry.sets}/${entry.totalSets}`;
    }
    return entry.sets?.toString() ?? '—';
};

const formatWeightLabel = (entry: ExerciseHistoryEntry): string => {
    if (typeof entry.weight === 'number' && entry.weight > 0) {
        return `${entry.weight}kg`;
    }
    if (entry.isBodyweight || !entry.weight || entry.weight === 0) {
        return 'Bodyweight';
    }
    return '—';
};

/**
 * Enhanced Weight Progress Graph (SVG-based)
 */
const WeightGraph: React.FC<{ data: Array<{ weight: number; date: string }> }> = ({ data }) => {
    const sanitizedData = Array.isArray(data) ? data : [];
    const weightData = sanitizedData.filter((d) => typeof d.weight === 'number' && d.weight > 0);
    const hasGraph = weightData.length >= 2;

    const width = 300;
    const height = 150;
    const padding = 20;

    let graphContent: React.ReactNode = (
        <div className="h-40 flex flex-col items-center justify-center text-sys-onSurfaceVar text-xs gap-2 rounded-xl border border-dashed border-white/10 bg-sys-surfaceHigh/60">
            <Activity size={24} className="opacity-50" />
            <span>Not enough data for graph</span>
        </div>
    );

    if (hasGraph) {
        const weights = weightData.map((d) => d.weight);
        const maxWeight = Math.max(...weights);
        const minWeight = Math.min(...weights);
        const range = maxWeight - minWeight || 1;
        const paddingY = range * 0.1;
        const effectiveMin = Math.max(0, minWeight - paddingY);
        const effectiveMax = maxWeight + paddingY;
        const effectiveRange = effectiveMax - effectiveMin;

        const points = weightData.map((d, i) => {
            const x = padding + (i / (weightData.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((d.weight - effectiveMin) / effectiveRange) * (height - 2 * padding);
            return { x, y };
        });

        const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
        const areaPoints = `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`;

        graphContent = (
            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="graphGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                    <polygon points={areaPoints} fill="url(#graphGradient)" />

                    <polyline
                        points={polylinePoints}
                        fill="none"
                        stroke="var(--color-accent)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2" />
                    ))}
                </svg>

                <div className="absolute top-0 right-0 text-xs font-bold text-sys-accent transform -translate-y-1/2">
                    {maxWeight}kg
                </div>
                <div className="absolute bottom-0 left-0 text-xs text-sys-onSurfaceVar transform translate-y-1/2">
                    {minWeight}kg
                </div>
            </div>
        );
    }

    return (
        <div className="bg-sys-surfaceHigh rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-sys-accent" />
                    Progress
                </h3>
                <span className="text-xs text-sys-onSurfaceVar">
                    {hasGraph ? `Last ${weightData.length} sessions` : 'Complete 2 sessions to unlock'}
                </span>
            </div>
            {graphContent}
        </div>
    );
};

/**
 * Exercise Detail Modal - Bottom sheet for exercise info
 */
export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
    exerciseName,
    historyLookupName,
    originalName,
    isSwapped = false,
    alternatives,
    onSwapExercise,
    onClose,
    isOpen,
}) => {
    const lookupName = historyLookupName || exerciseName;
    const history = lookupName ? getExerciseHistory(lookupName) : [];
    const stats = calculateExerciseStats(lookupName);
    const canSwap = Boolean(onSwapExercise && alternatives?.length && originalName);

    // Prepare graph data (chronological)
    const graphData = useMemo(() => {
        return history
            .filter(h => h.weight && typeof h.weight === 'number')
            .map(h => ({
                weight: h.weight as number,
                date: h.date
            }));
    }, [history]);

    const recentHistory = history.slice(-3).reverse();

    const handleSwapClick = (): void => {
        if (canSwap && originalName && alternatives) {
            onSwapExercise?.(originalName, alternatives);
        }
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            ariaLabelledBy="exercise-modal-title"
            maxHeight={85}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-white/5 gap-3">
                <div className="min-w-0">
                    <h2 id="exercise-modal-title" className="text-xl font-bold text-white truncate">
                        {exerciseName}
                    </h2>
                    {isSwapped && originalName && (
                        <p className="text-[11px] text-sys-onSurfaceVar mt-0.5 truncate">
                            Swapped from <span className="text-white font-medium">{originalName}</span>
                        </p>
                    )}
                    <p className="text-xs text-sys-onSurfaceVar mt-1">
                        {stats.totalWorkouts} sessions completed
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {canSwap && (
                        <button
                            onClick={handleSwapClick}
                            className="h-8 px-3 rounded-full bg-sys-surfaceHigh text-sys-onSurfaceVar text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all border border-white/10"
                            aria-label="Swap exercise"
                        >
                            <ArrowRightLeft size={14} />
                            <span>Swap</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-full bg-sys-surfaceHigh flex items-center justify-center text-sys-onSurfaceVar active:scale-90 transition-all"
                        aria-label="Close exercise details"
                    >
                        <X size={18} />
                    </button>
                </div>
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
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Calendar size={16} className="text-sys-accent" />
                            Recent Sessions
                        </h3>
                        <span className="text-[10px] uppercase text-sys-onSurfaceVar font-semibold tracking-wider">Last 3</span>
                    </div>

                    {recentHistory.length > 0 ? (
                        <div className="space-y-3">
                            {recentHistory.map((entry, idx) => {
                                const repsLabel = extractRepsFromPrescription(entry.prescription) ?? '—';
                                const setsLabel = formatSetsLabel(entry);
                                const weightLabel = formatWeightLabel(entry);
                                const isPr = Boolean(stats.maxWeight && entry.weight === stats.maxWeight && entry.weight);
                                const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                });

                                return (
                                    <div key={`${entry.date}-${idx}`} className="bg-sys-surfaceHigh rounded-xl p-4 border border-white/5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="text-sm font-semibold text-white">{formattedDate}</div>
                                                <div className="text-[11px] text-sys-onSurfaceVar">
                                                    Week {entry.week} • Day {entry.day}
                                                </div>
                                            </div>
                                            {isPr && (
                                                <div className="h-6 px-2 rounded-full bg-sys-accent/20 text-sys-accent text-[10px] font-bold flex items-center border border-sys-accent/30">
                                                    PR
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <div className="text-[10px] uppercase text-sys-onSurfaceVar tracking-wide">Sets</div>
                                                <div className="text-white font-semibold text-sm">{setsLabel}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-sys-onSurfaceVar tracking-wide">Reps</div>
                                                <div className="text-white font-semibold text-sm">{repsLabel}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-sys-onSurfaceVar tracking-wide">Weight</div>
                                                <div className="text-white font-semibold text-sm">{weightLabel}</div>
                                            </div>
                                        </div>
                                        {entry.prescription && (
                                            <p className="text-[11px] text-sys-onSurfaceVar mt-2 text-center">
                                                {entry.prescription}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-sys-onSurfaceVar text-sm bg-sys-surfaceHigh rounded-xl border border-dashed border-white/10">
                            No history yet. Complete this exercise to build your log.
                        </div>
                    )}
                </div>
            </div>
        </BottomSheet>
    );
};
