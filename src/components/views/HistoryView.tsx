import React, { useState, useEffect } from 'react';
import { safeGetJSON } from '../../utils/storage';
import { getGlobalHistoryKey } from '../../services/storageNamespace';
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

// Raw stats returned from calculateExerciseStats (without name)
interface RawExerciseStats {
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
    /** Whether this is a custom/empty workout (week=0, day=0) */
    isEmptyWorkout?: boolean;
}

interface ExerciseStatsViewProps {
    onSelectExercise?: (name: string | null) => void;
}

interface HistoryViewProps {
    // Props for external dependencies injected from parent
    calculateExerciseStats: (name: string) => RawExerciseStats;
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
    const padding = 8;

    // Calculate points for the line
    const points = weightData.map((d, i) => {
        const x = (i / (weightData.length - 1)) * (width - 2 * padding) + padding;
        const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    // Create gradient area
    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    return (
        <div className="bg-gradient-to-b from-sys-surfaceHigh to-sys-surface rounded-2xl p-4 border border-white/5">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24" preserveAspectRatio="none">
                {/* Gradient definition */}
                <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

                {/* Area fill */}
                <polygon points={areaPoints} fill="url(#areaGradient)" />

                {/* Weight line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {weightData.map((d, i) => {
                    const x = (i / (weightData.length - 1)) * (width - 2 * padding) + padding;
                    const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="var(--color-accent)" opacity="0.3" />
                            <circle cx={x} cy={y} r="2.5" fill="var(--color-accent)" stroke="white" strokeWidth="1" />
                        </g>
                    );
                })}
            </svg>
            <div className="flex justify-between text-xs mt-3">
                <span className="text-sys-onSurfaceVar font-medium">{minWeight} kg</span>
                <span className="text-sys-accent font-semibold">{maxWeight} kg</span>
            </div>
        </div>
    );
};

// Exercise Stats View component - shows stats for all exercises
interface ExerciseStatsViewInternalProps extends ExerciseStatsViewProps {
    calculateExerciseStats: (name: string) => RawExerciseStats;
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

    // Calculate stats for each exercise and include the name
    const exerciseStats: ExerciseStatData[] = trackedExercises.map(name => ({
        name,
        ...calculateExerciseStats(name),
    }));

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

    // Calculate overall summary stats
    const totalWorkoutsSum = exerciseStats.reduce((sum, stat) => sum + stat.totalWorkouts, 0);
    const exercisesWithWeight = exerciseStats.filter(s => s.maxWeight && s.maxWeight > 0);
    const maxWeightOverall = exercisesWithWeight.length > 0
        ? Math.max(...exercisesWithWeight.map(s => s.maxWeight || 0))
        : 0;

    return (
        <div className="space-y-5">
            {/* Summary Stats Banner */}
            <div className="bg-gradient-to-br from-sys-accent/20 via-sys-surface to-sys-surfaceHigh rounded-3xl p-5 border border-sys-accent/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-sys-accent/30 flex items-center justify-center" aria-hidden="true">
                        <i data-lucide="trending-up" width="20" className="text-sys-accent"></i>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Training Overview</h3>
                        <p className="text-xs text-sys-onSurfaceVar">{exerciseStats.length} exercises tracked</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-white">{totalWorkoutsSum}</div>
                        <div className="text-xs text-sys-onSurfaceVar">Total Sessions</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-sys-accent">{maxWeightOverall > 0 ? `${maxWeightOverall} kg` : 'N/A'}</div>
                        <div className="text-xs text-sys-onSurfaceVar">Max Weight</div>
                    </div>
                </div>
            </div>

            {/* Exercise Cards */}
            {exerciseStats.map((stat, idx) => {
                const isExpanded = selectedExercise === stat.name;
                const history = getExerciseHistory(stat.name);

                return (
                    <div key={idx} className="stagger-item bg-sys-surface border border-white/5 rounded-3xl overflow-hidden">
                        <button
                            onClick={() => handleExerciseClick(stat.name)}
                            className="w-full p-5 flex items-center gap-4 active:bg-sys-surfaceHigh transition-colors text-left"
                            aria-expanded={isExpanded}
                        >
                            {/* Exercise Icon/Initial */}
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sys-accent/30 to-sys-accent/10 border border-sys-accent/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                                <span className="text-lg font-bold text-sys-accent">{stat.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-white mb-1 truncate">{stat.name}</h3>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-sys-onSurfaceVar">{stat.totalWorkouts} workouts</span>
                                    {stat.maxWeight && (
                                        <span className="px-2 py-0.5 rounded-full bg-sys-accent/15 text-sys-accent font-semibold">
                                            Max: {stat.maxWeight} kg
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isExpanded ? 'bg-sys-accent text-white rotate-180' : 'bg-white/10 text-sys-onSurfaceVar'}`}>
                                <i data-lucide="chevron-down" width="18"></i>
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="px-5 pb-5 border-t border-white/5">
                                {/* Stats Summary Grid */}
                                <div className="grid grid-cols-2 gap-3 mt-4 mb-5">
                                    <div className="bg-gradient-to-br from-sys-surfaceHigh to-sys-surface rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <i data-lucide="calendar" width="14" className="text-sys-onSurfaceVar"></i>
                                            <span className="text-xs text-sys-onSurfaceVar font-medium">Workouts</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">{stat.totalWorkouts}</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-sys-surfaceHigh to-sys-surface rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <i data-lucide="layers" width="14" className="text-sys-onSurfaceVar"></i>
                                            <span className="text-xs text-sys-onSurfaceVar font-medium">Max Sets</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">{stat.maxSets || 'N/A'}</div>
                                    </div>
                                    {stat.maxWeight && (
                                        <div className="bg-gradient-to-br from-sys-accent/10 to-sys-surface rounded-2xl p-4 border border-sys-accent/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <i data-lucide="dumbbell" width="14" className="text-sys-accent"></i>
                                                <span className="text-xs text-sys-accent font-medium">Max Weight</span>
                                            </div>
                                            <div className="text-2xl font-bold text-sys-accent">{stat.maxWeight} kg</div>
                                        </div>
                                    )}
                                    {stat.estimated1RM && (
                                        <div className="bg-gradient-to-br from-sys-success/10 to-sys-surface rounded-2xl p-4 border border-sys-success/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <i data-lucide="trophy" width="14" className="text-sys-success"></i>
                                                <span className="text-xs text-sys-success font-medium">Est. 1RM</span>
                                            </div>
                                            <div className="text-2xl font-bold text-sys-success">{stat.estimated1RM} kg</div>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Graph */}
                                {stat.recentProgress && stat.recentProgress.length > 1 && (
                                    <div className="mb-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <i data-lucide="trending-up" width="16" className="text-sys-accent"></i>
                                            <h4 className="text-sm font-semibold text-white">Weight Progress</h4>
                                        </div>
                                        <SimpleWeightGraph data={stat.recentProgress} />
                                    </div>
                                )}

                                {/* Recent History */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <i data-lucide="clock" width="16" className="text-sys-onSurfaceVar"></i>
                                        <h4 className="text-sm font-semibold text-white">Recent History</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {history.slice(-5).reverse().map((entry, entryIdx) => (
                                            <div key={entryIdx} className="bg-sys-surfaceHigh rounded-xl p-3 flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-white leading-none">
                                                        {new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] text-sys-onSurfaceVar uppercase">
                                                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-white">
                                                        {entry.sets} sets completed
                                                    </div>
                                                    <div className="text-xs text-sys-onSurfaceVar">
                                                        Week {entry.week}, Day {entry.day}
                                                    </div>
                                                </div>
                                                {entry.weight && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-sys-accent/15 text-sys-accent text-sm font-bold flex-shrink-0">
                                                        {entry.weight} kg
                                                    </div>
                                                )}
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
        const globalHistoryKey = getGlobalHistoryKey();
        const h = safeGetJSON<GlobalHistoryEntry[]>(globalHistoryKey, []);

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
            typeof entry.week === 'number' &&
            typeof entry.day === 'number' &&
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
            <div className="px-5 pb-20 pt-6">
                {/* Header with Toggle */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">History</h2>
                        <p className="text-xs text-sys-onSurfaceVar mt-0.5">Track your progress</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Segmented Control */}
                        <div className="flex bg-sys-surfaceHigh rounded-2xl p-1.5 border border-white/5">
                            <button
                                onClick={() => { haptic.tick(); setViewMode('timeline'); }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === 'timeline' ? 'bg-sys-accent text-white shadow-lg shadow-sys-accent/25' : 'text-sys-onSurfaceVar hover:text-white'}`}
                            >
                                <i data-lucide="calendar-days" width="14"></i>
                                <span>Timeline</span>
                            </button>
                            <button
                                onClick={() => { haptic.tick(); setViewMode('stats'); }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === 'stats' ? 'bg-sys-accent text-white shadow-lg shadow-sys-accent/25' : 'text-sys-onSurfaceVar hover:text-white'}`}
                            >
                                <i data-lucide="bar-chart-3" width="14"></i>
                                <span>Stats</span>
                            </button>
                        </div>
                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            className={`h-11 w-11 rounded-2xl bg-sys-surfaceHigh border border-white/5 text-sys-onSurfaceVar hover:text-white flex items-center justify-center active:scale-90 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
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
                            const completionPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
                            const isFullyComplete = completedSets === totalSets && totalSets > 0;

                            return (
                                <div key={idx} className="stagger-item bg-sys-surface border border-white/5 rounded-3xl overflow-hidden">
                                    <button
                                        onClick={() => toggleExpanded(idx)}
                                        className="w-full p-5 flex items-center gap-4 active:bg-sys-surfaceHigh transition-colors"
                                        aria-expanded={isExpanded}
                                    >
                                        {/* Week Badge - Custom style for empty workouts */}
                                        {entry.isEmptyWorkout || (entry.week === 0 && entry.day === 0) ? (
                                            <div className="relative h-14 w-14 min-w-[56px] rounded-2xl bg-gradient-to-br from-sys-success/20 to-sys-success/5 border border-sys-success/30 flex flex-col items-center justify-center" aria-hidden="true">
                                                <i data-lucide="plus" width="24" className="text-sys-success"></i>
                                            </div>
                                        ) : (
                                            <div className="relative h-14 w-14 min-w-[56px] rounded-2xl bg-gradient-to-br from-sys-accent/20 to-sys-accent/5 border border-sys-accent/30 flex flex-col items-center justify-center" aria-hidden="true">
                                                <span className="text-[10px] font-semibold text-sys-accent uppercase tracking-wider">Week</span>
                                                <span className="text-lg font-bold text-sys-accent leading-none">{entry.week}</span>
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-bold text-white truncate">
                                                    {entry.isEmptyWorkout || (entry.week === 0 && entry.day === 0) ? 'Custom Workout' : `Day ${entry.day}`}
                                                </h3>
                                                {isFullyComplete && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sys-success/20 text-sys-success text-[10px] font-bold uppercase">
                                                        <i data-lucide="check" width="10"></i>
                                                        Complete
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-sys-onSurfaceVar">
                                                {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </p>
                                            {/* Summary stats in collapsed view */}
                                            {hasExercises && !isExpanded && (
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-xs text-sys-onSurfaceVar">
                                                        {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-sys-onSurfaceVar font-medium">
                                                        {completedSets}/{totalSets} sets
                                                    </span>
                                                    {completionPercent === 100 && (
                                                        <span className="text-xs text-sys-success font-semibold">100%</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Expand/Collapse Indicator */}
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isExpanded ? 'bg-sys-accent text-white rotate-180' : 'bg-white/10 text-sys-onSurfaceVar'}`}>
                                            <i data-lucide="chevron-down" width="18"></i>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-5 pb-5 border-t border-white/5">
                                            {/* Workout Notes */}
                                            {entry.workoutNotes && (
                                                <div className="mt-4 mb-4">
                                                    <div className="bg-gradient-to-br from-sys-accent/10 to-transparent rounded-2xl p-4 border border-sys-accent/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <i data-lucide="message-square" width="14" className="text-sys-accent"></i>
                                                            <h4 className="text-xs font-bold text-sys-accent uppercase tracking-wider">Notes</h4>
                                                        </div>
                                                        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{entry.workoutNotes}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Exercise Details */}
                                            {hasExercises && (
                                                <div className={entry.workoutNotes ? '' : 'mt-4'}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <i data-lucide="dumbbell" width="14" className="text-sys-onSurfaceVar"></i>
                                                        <h4 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider">Exercises</h4>
                                                        <span className="text-xs text-sys-onSurfaceVar/50">({exerciseCount})</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {entry.exercises!.map((ex, exIdx) => {
                                                            const exComplete = ex.completedSets === ex.totalSets;
                                                            return (
                                                                <div key={exIdx} className={`bg-sys-surfaceHigh rounded-2xl p-4 border ${exComplete ? 'border-sys-success/20' : 'border-white/5'}`}>
                                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <h5 className="text-sm font-bold text-white truncate">{ex.name}</h5>
                                                                            <p className="text-xs text-sys-onSurfaceVar mt-0.5">{ex.prescription}</p>
                                                                        </div>
                                                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                                            exComplete
                                                                                ? 'bg-sys-success/20 text-sys-success'
                                                                                : 'bg-sys-accent/15 text-sys-accent'
                                                                        }`}>
                                                                            {exComplete && <i data-lucide="check" width="12"></i>}
                                                                            <span>{ex.completedSets}/{ex.totalSets}</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Weight & RPE */}
                                                                    <div className="flex items-center gap-3 flex-wrap">
                                                                        {ex.weight && (
                                                                            <span className="text-xs px-2 py-1 rounded-lg bg-white/5 text-white font-medium">
                                                                                {ex.weight} kg
                                                                            </span>
                                                                        )}
                                                                        {ex.rpe && Object.keys(ex.rpe).length > 0 && (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="text-[10px] text-sys-onSurfaceVar uppercase tracking-wider">RPE</span>
                                                                                {Object.entries(ex.rpe).map(([setIdx, rpe]) => (
                                                                                    <span key={setIdx} className="text-xs w-6 h-6 flex items-center justify-center rounded-md bg-sys-accent/15 text-sys-accent font-semibold">
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
                                                </div>
                                            )}

                                            {!hasExercises && !entry.workoutNotes && (
                                                <p className="text-sm text-sys-onSurfaceVar text-center py-6 mt-4">
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
