import React, { useState, useEffect } from 'react';
import { safeGetJSON } from '../../utils/storage';
import { PullToRefresh } from '../PullToRefresh';
import { useHaptic, useLucideIcons } from '../../hooks';

// Types for exercise stats display
interface ExerciseStatData {
    name: string;
    totalWorkouts: number;
    maxWeight: number | null;
    maxSets: number | null;
    estimated1RM: number | null;
    recentProgress: Array<{ weight: number; date: string }>;
}

interface ExerciseHistoryEntry {
    date: string;
    week: number;
    day: number;
    sets: number;
    weight?: string | number;
    rpe?: Record<string, string>;
    prescription?: string;
}

interface GlobalHistoryEntry {
    date: string;
    week: number;
    day: number;
    exercises?: Array<{
        name: string;
        prescription: string;
        completedSets: number;
        totalSets: number;
        weight?: string | number;
        rpe?: Record<string, string>;
    }>;
    workoutNotes?: string;
}

interface ExerciseStatsViewProps {
    onSelectExercise?: (name: string | null) => void;
}

interface HistoryViewProps {
    // Props for external dependencies injected from parent
    calculateExerciseStats: (name: string) => ExerciseStatData;
    getExerciseHistory: (name: string) => ExerciseHistoryEntry[];
    getAllExercisesWithHistory: () => string[];
}

// Simple Weight Progress Graph Component (SVG-based)
interface WeightDataPoint {
    weight: number;
    date?: string;
}

interface SimpleWeightGraphProps {
    data: WeightDataPoint[];
}

const SimpleWeightGraph: React.FC<SimpleWeightGraphProps> = ({ data }) => {
    if (!data || data.length < 2) return null;

    // Filter out entries with no weight
    const weightData = data.filter(d => d.weight && d.weight > 0);
    if (weightData.length < 2) return null;

    const weights = weightData.map(d => d.weight);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const range = maxWeight - minWeight || 1; // Avoid division by zero

    const width = 100; // Use percentage-based width
    const height = 60;
    const padding = 5;

    // Calculate points for the line
    const points = weightData.map((d, i) => {
        const x = (i / (weightData.length - 1)) * (width - 2 * padding) + padding;
        const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="bg-sys-surfaceHigh rounded-xl p-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

                {/* Weight line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {weightData.map((d, i) => {
                    const x = (i / (weightData.length - 1)) * (width - 2 * padding) + padding;
                    const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="2"
                            fill="var(--color-primary-500)"
                            stroke="white"
                            strokeWidth="1"
                        />
                    );
                })}
            </svg>
            <div className="flex justify-between text-xs text-sys-onSurfaceVar mt-2">
                <span>{minWeight}kg</span>
                <span>{maxWeight}kg</span>
            </div>
        </div>
    );
};

// Exercise Stats View component - shows stats for all exercises
interface ExerciseStatsViewInternalProps extends ExerciseStatsViewProps {
    calculateExerciseStats: (name: string) => ExerciseStatData;
    getExerciseHistory: (name: string) => ExerciseHistoryEntry[];
    getAllExercisesWithHistory: () => string[];
}

const ExerciseStatsView: React.FC<ExerciseStatsViewInternalProps> = ({
    // onSelectExercise - currently unused, kept for API compatibility
    calculateExerciseStats,
    getExerciseHistory,
    getAllExercisesWithHistory,
}) => {
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
    const haptic = useHaptic();

    // Get all exercises that have history
    const trackedExercises = getAllExercisesWithHistory();

    // Calculate stats for each exercise
    const exerciseStats: ExerciseStatData[] = trackedExercises.map(name => calculateExerciseStats(name));

    // Initialize Lucide icons
    useLucideIcons([selectedExercise, exerciseStats]);

    const handleExerciseClick = (exerciseName: string) => {
        haptic.tick();
        setSelectedExercise(selectedExercise === exerciseName ? null : exerciseName);
    };

    if (exerciseStats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-3xl border border-white/5 px-6">
                <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-5">
                    <i data-lucide="bar-chart-2" width="40" className="text-sys-onSurfaceVar"></i>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Exercise Data</h3>
                <p className="text-sm text-sys-onSurfaceVar text-center max-w-[250px]">Complete workouts to see exercise statistics</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {exerciseStats.map((stat, idx) => {
                const isExpanded = selectedExercise === stat.name;
                const history = getExerciseHistory(stat.name);

                return (
                    <div key={idx} className="stagger-item bg-sys-surface border border-white/5 rounded-3xl overflow-hidden">
                        <button
                            onClick={() => handleExerciseClick(stat.name)}
                            className="w-full p-5 flex items-center gap-4 active:bg-sys-surfaceHigh transition-colors text-left"
                        >
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-white mb-1 truncate">{stat.name}</h3>
                                <div className="flex items-center gap-3 text-xs text-sys-onSurfaceVar">
                                    <span>{stat.totalWorkouts} workouts</span>
                                    {stat.maxWeight && <span>• Max: {stat.maxWeight}kg</span>}
                                    {stat.estimated1RM && <span>• Est 1RM: {stat.estimated1RM}kg</span>}
                                </div>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-sys-accent/20 flex items-center justify-center flex-shrink-0">
                                <i data-lucide={isExpanded ? "chevron-up" : "chevron-down"} width="20" className="text-sys-accent"></i>
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="px-5 pb-5">
                                {/* Stats Summary */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                        <div className="text-xs text-sys-onSurfaceVar mb-1">Total Workouts</div>
                                        <div className="text-2xl font-bold text-white">{stat.totalWorkouts}</div>
                                    </div>
                                    <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                        <div className="text-xs text-sys-onSurfaceVar mb-1">Max Sets</div>
                                        <div className="text-2xl font-bold text-white">{stat.maxSets || 'N/A'}</div>
                                    </div>
                                    {stat.maxWeight && (
                                        <>
                                            <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                <div className="text-xs text-sys-onSurfaceVar mb-1">Max Weight</div>
                                                <div className="text-2xl font-bold text-sys-accent">{stat.maxWeight} kg</div>
                                            </div>
                                            {stat.estimated1RM && (
                                                <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                                    <div className="text-xs text-sys-onSurfaceVar mb-1">Est. 1RM</div>
                                                    <div className="text-2xl font-bold text-sys-success">{stat.estimated1RM} kg</div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Simple Progress Graph */}
                                {stat.recentProgress && stat.recentProgress.length > 1 && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-bold text-white mb-3">Weight Progress (Last 10 Workouts)</h4>
                                        <SimpleWeightGraph data={stat.recentProgress} />
                                    </div>
                                )}

                                {/* Recent History */}
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-3">Recent History</h4>
                                    <div className="space-y-2">
                                        {history.slice(-5).reverse().map((entry, entryIdx) => (
                                            <div key={entryIdx} className="bg-sys-surfaceHigh rounded-xl p-3">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold text-white">
                                                            {new Date(entry.date).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-xs text-sys-onSurfaceVar">
                                                            W{entry.week}D{entry.day}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-white">
                                                            {entry.sets} sets
                                                        </div>
                                                        {entry.weight && (
                                                            <div className="text-xs text-sys-accent font-semibold">
                                                                {entry.weight} kg
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Main HistoryView component
export const HistoryView: React.FC<HistoryViewProps> = ({
    calculateExerciseStats,
    getExerciseHistory,
    getAllExercisesWithHistory,
}) => {
    const [history, setHistory] = useState<GlobalHistoryEntry[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedEntries, setExpandedEntries] = useState<Record<number, boolean>>({});
    const [viewMode, setViewMode] = useState<'timeline' | 'stats'>('timeline');
    const [selectedExerciseForGraph, setSelectedExerciseForGraph] = useState<string | null>(null);
    const haptic = useHaptic();

    const loadHistory = async () => {
        const h = safeGetJSON<GlobalHistoryEntry[]>('global_history', []);

        // Validate that history is an array
        if (!Array.isArray(h)) {
            console.warn('Invalid history format, resetting');
            setHistory([]);
            return;
        }

        // Filter out invalid entries and sort
        const validHistory = h.filter(entry =>
            entry &&
            typeof entry === 'object' &&
            entry.week &&
            entry.day &&
            entry.date
        );

        setHistory(validHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    useEffect(() => {
        loadHistory();
    }, []);

    // Initialize Lucide icons when history or UI state changes
    useLucideIcons([history, expandedEntries, viewMode, selectedExerciseForGraph]);

    // Pull-to-refresh handler
    const handlePullRefresh = async () => {
        haptic.bump();
        setIsRefreshing(true);
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadHistory();
        setIsRefreshing(false);
        haptic.success();
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            loadHistory();
            setIsRefreshing(false);
        }, 500);
    };

    const toggleExpanded = (idx: number) => {
        haptic.tick();
        setExpandedEntries(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <PullToRefresh onRefresh={handlePullRefresh} className="h-full">
            <div className="px-5 pb-32 pt-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">History</h2>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-sys-surfaceHigh rounded-xl p-1">
                            <button
                                onClick={() => { haptic.tick(); setViewMode('timeline'); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'timeline' ? 'bg-sys-accent text-white' : 'text-sys-onSurfaceVar'}`}
                            >
                                Timeline
                            </button>
                            <button
                                onClick={() => { haptic.tick(); setViewMode('stats'); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'stats' ? 'bg-sys-accent text-white' : 'text-sys-onSurfaceVar'}`}
                            >
                                Stats
                            </button>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className={`h-10 w-10 rounded-xl bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                            aria-label="Refresh history"
                        >
                            <i data-lucide="refresh-cw" width="18"></i>
                        </button>
                    </div>
                </div>
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-3xl border border-white/5 px-6">
                        <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-5">
                            <i data-lucide="history" width="40" className="text-sys-onSurfaceVar"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Workouts Yet</h3>
                        <p className="text-sm text-sys-onSurfaceVar text-center max-w-[250px]">Complete your first workout to see it here. Pull down to refresh.</p>
                    </div>
                ) : viewMode === 'stats' ? (
                    <ExerciseStatsView
                        onSelectExercise={setSelectedExerciseForGraph}
                        calculateExerciseStats={calculateExerciseStats}
                        getExerciseHistory={getExerciseHistory}
                        getAllExercisesWithHistory={getAllExercisesWithHistory}
                    />
                ) : (
                    <div className="space-y-4">
                        {history.map((entry, idx) => {
                            const isExpanded = expandedEntries[idx];
                            const hasExercises = entry.exercises && entry.exercises.length > 0;
                            
                            // Calculate summary stats for collapsed view
                            const totalSets = hasExercises 
                                ? entry.exercises!.reduce((sum, ex) => sum + (ex.totalSets || 0), 0)
                                : 0;
                            const completedSets = hasExercises 
                                ? entry.exercises!.reduce((sum, ex) => sum + (ex.completedSets || 0), 0)
                                : 0;
                            const exerciseCount = hasExercises ? entry.exercises!.length : 0;

                            return (
                                <div key={idx} className="stagger-item bg-sys-surface border border-white/5 rounded-3xl overflow-hidden">
                                    <button
                                        onClick={() => toggleExpanded(idx)}
                                        className="w-full p-5 flex items-center gap-5 active:bg-sys-surfaceHigh transition-colors"
                                    >
                                        <div className="h-14 w-14 min-w-[56px] rounded-2xl bg-sys-accent/10 border border-sys-accent/20 flex items-center justify-center">
                                            <span className="text-sm font-bold text-sys-accent">W{entry.week}</span>
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <h3 className="text-base font-bold text-white mb-1 truncate">Day {entry.day} Complete</h3>
                                            <p className="text-sm text-sys-onSurfaceVar">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                            {/* Summary stats in collapsed view */}
                                            {hasExercises && !isExpanded && (
                                                <p className="text-xs text-sys-onSurfaceVar/70 mt-1">
                                                    {exerciseCount} exercises • {completedSets}/{totalSets} sets
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-full bg-sys-success/20 flex items-center justify-center flex-shrink-0">
                                                <i data-lucide={isExpanded ? "chevron-up" : "chevron-down"} width="20" className="text-sys-success"></i>
                                            </div>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-5 pb-5">
                                            {/* Workout Notes */}
                                            {entry.workoutNotes && (
                                                <div className="mb-4">
                                                    <div className="bg-sys-surfaceHigh rounded-xl p-4 border border-white/5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <i data-lucide="file-text" width="14" className="text-sys-accent"></i>
                                                            <h4 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider">Workout Notes</h4>
                                                        </div>
                                                        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{entry.workoutNotes}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Exercise Details */}
                                            {hasExercises && (
                                                <div className="mb-4">
                                                    <h4 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-3">Exercises</h4>
                                                    <div className="space-y-2">
                                                        {entry.exercises!.map((ex, exIdx) => (
                                                            <div key={exIdx} className="bg-sys-surfaceHigh rounded-xl p-3">
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h5 className="text-sm font-semibold text-white truncate">{ex.name}</h5>
                                                                        <p className="text-xs text-sys-onSurfaceVar">{ex.prescription}</p>
                                                                    </div>
                                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                                                                        ex.completedSets === ex.totalSets
                                                                            ? 'bg-sys-success/20 text-sys-success'
                                                                            : 'bg-sys-accent/10 text-sys-accent'
                                                                    }`}>
                                                                        <span>{ex.completedSets}/{ex.totalSets}</span>
                                                                    </div>
                                                                </div>
                                                                {ex.weight && (
                                                                    <p className="text-xs text-sys-onSurfaceVar mt-1">
                                                                        Weight: {ex.weight} kg
                                                                    </p>
                                                                )}
                                                                {ex.rpe && Object.keys(ex.rpe).length > 0 && (
                                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                                        <span className="text-xs text-sys-onSurfaceVar">RPE:</span>
                                                                        {Object.entries(ex.rpe).map(([setIdx, rpe]) => (
                                                                            <span key={setIdx} className="text-xs px-2 py-0.5 bg-sys-accent/10 rounded-full text-sys-accent font-semibold">
                                                                                S{parseInt(setIdx) + 1}: {rpe}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {!hasExercises && !entry.workoutNotes && (
                                                <p className="text-sm text-sys-onSurfaceVar text-center py-4">
                                                    No detailed information available
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
};

export type { HistoryViewProps, ExerciseStatData, ExerciseHistoryEntry, GlobalHistoryEntry };
