import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart2,
    TrendingUp,
    Calendar,
    Layers,
    Dumbbell,
    Trophy,
    Clock,
    ChevronDown,
    CalendarDays,
    BarChart3,
    History,
    Plus,
    Check,
    MessageSquare
} from 'lucide-react';
import { safeGetJSON } from '../../utils/storage';
import { getGlobalHistoryKey } from '../../services/storageNamespace';
import { PullToRefresh } from '../PullToRefresh';
import { PRHighlights, calculateStreak, findRecentPRs } from '../PRHighlights';
import { useHaptic, useScrollToTop } from '../../hooks';
import { CalendarView } from '../CalendarView';

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

    const handleExerciseClick = (exerciseName: string) => {
        haptic.tick();
        setSelectedExercise(selectedExercise === exerciseName ? null : exerciseName);
    };

    if (exerciseStats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-2xl border border-white/5 px-6">
                <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-5">
                    <BarChart2 size={40} className="text-sys-onSurfaceVar" />
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
            <div className="bg-gradient-to-br from-sys-accent/20 via-sys-surface to-sys-surfaceHigh rounded-2xl p-5 border border-sys-accent/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-sys-accent/30 flex items-center justify-center" aria-hidden="true">
                        <TrendingUp size={20} className="text-sys-accent" />
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
            <AnimatePresence initial={false}>
                {exerciseStats.map((stat, idx) => {
                    const isExpanded = selectedExercise === stat.name;
                    const history = getExerciseHistory(stat.name);

                    return (
                        <motion.div
                            key={stat.name}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className="bg-sys-surface border border-white/5 rounded-2xl overflow-hidden"
                        >
                            <motion.button
                                layout="position"
                                onClick={() => handleExerciseClick(stat.name)}
                                className="w-full p-5 flex items-center gap-4 active:bg-sys-surfaceHigh transition-colors text-left"
                                aria-expanded={isExpanded}
                                whileTap={{ scale: 0.98 }}
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
                                <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isExpanded ? 'bg-sys-accent text-white' : 'bg-white/10 text-sys-onSurfaceVar'}`}
                                >
                                    <ChevronDown size={18} />
                                </motion.div>
                            </motion.button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-5 pb-5 border-t border-white/5">
                                            {/* Stats Summary Grid */}
                                            <div className="grid grid-cols-2 gap-3 mt-4 mb-5">
                                                <div className="bg-gradient-to-br from-sys-surfaceHigh to-sys-surface rounded-2xl p-4 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Calendar size={14} className="text-sys-onSurfaceVar" />
                                                        <span className="text-xs text-sys-onSurfaceVar font-medium">Workouts</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-white">{stat.totalWorkouts}</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-sys-surfaceHigh to-sys-surface rounded-2xl p-4 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Layers size={14} className="text-sys-onSurfaceVar" />
                                                        <span className="text-xs text-sys-onSurfaceVar font-medium">Max Sets</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-white">{stat.maxSets || 'N/A'}</div>
                                                </div>
                                                {stat.maxWeight && (
                                                    <div className="bg-gradient-to-br from-sys-accent/10 to-sys-surface rounded-2xl p-4 border border-sys-accent/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Dumbbell size={14} className="text-sys-accent" />
                                                            <span className="text-xs text-sys-accent font-medium">Max Weight</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-sys-accent">{stat.maxWeight} kg</div>
                                                    </div>
                                                )}
                                                {stat.estimated1RM && (
                                                    <div className="bg-gradient-to-br from-sys-success/10 to-sys-surface rounded-2xl p-4 border border-sys-success/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Trophy size={14} className="text-sys-success" />
                                                            <span className="text-xs text-sys-success font-medium">Est. 1RM</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-sys-success">{stat.estimated1RM} kg</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progress Graph */}
                                            {(() => {
                                                // Filter for valid weights and ensure we have at least 2 points
                                                const validProgress = stat.recentProgress?.filter(p => p.weight && p.weight > 0) || [];

                                                if (validProgress.length < 2) return null;

                                                // Ensure weights are numbers for the graph
                                                const graphData = validProgress.map(p => ({
                                                    ...p,
                                                    weight: Number(p.weight)
                                                }));

                                                return (
                                                    <div className="mb-5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <TrendingUp size={16} className="text-sys-accent" />
                                                            <h4 className="text-sm font-semibold text-white">Weight Progress</h4>
                                                        </div>
                                                        <SimpleWeightGraph data={graphData} />
                                                    </div>
                                                );
                                            })()}

                                            {/* Recent History */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Clock size={16} className="text-sys-onSurfaceVar" />
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
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};// Main HistoryView component
export const HistoryView: React.FC<HistoryViewProps> = ({
    calculateExerciseStats,
    getExerciseHistory,
    getAllExercisesWithHistory,
}) => {
    const [history, setHistory] = useState<GlobalHistoryEntry[]>([]);
    const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<GlobalHistoryEntry[] | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'stats'>('calendar');
    const haptic = useHaptic();

    // Scroll to top when view loads
    useScrollToTop();

    // Calculate PR highlights data
    const prHighlightsData = useMemo(() => {
        const streakData = calculateStreak(history);
        const recentPRs = findRecentPRs(
            getAllExercisesWithHistory,
            getExerciseHistory,
            30 // Last 30 days
        );

        return {
            recentPRs,
            streakDays: streakData.currentStreak,
            bestStreak: streakData.bestStreak,
            totalWorkouts: history.length,
        };
    }, [history, getAllExercisesWithHistory, getExerciseHistory]);

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

    // Pull-to-refresh handler
    const handlePullRefresh = async () => {
        haptic.bump();
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadHistory();
        haptic.success();
    };

    const handleDayClick = (_date: string, workouts: GlobalHistoryEntry[]) => {
        haptic.tick();
        setSelectedDayWorkouts(workouts);
    };

    const handleCloseDayDetail = () => {
        haptic.tick();
        setSelectedDayWorkouts(null);
    };

    return (
        <PullToRefresh onRefresh={handlePullRefresh} className="h-full">
            <div className="px-5 pb-20 pt-6">
                {/* Header with Toggle - mobile-optimized layout */}
                <div className="flex flex-col gap-4 mb-6">
                    {/* Segmented Control - full width on mobile */}
                    <div className="flex items-center gap-2">
                        <div className="flex flex-1 bg-sys-surfaceHigh rounded-2xl p-1 border border-white/5">
                            <button
                                onClick={() => { haptic.tick(); setViewMode('calendar'); setSelectedDayWorkouts(null); }}
                                className={`btn-md3 flex-1 flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-semibold ${viewMode === 'calendar' ? 'btn-filled shadow-lg shadow-sys-accent/25' : 'btn-text text-sys-onSurfaceVar'}`}
                            >
                                <CalendarDays size={16} />
                                <span>Calendar</span>
                            </button>
                            <button
                                onClick={() => { haptic.tick(); setViewMode('stats'); }}
                                className={`btn-md3 flex-1 flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-semibold ${viewMode === 'stats' ? 'btn-filled shadow-lg shadow-sys-accent/25' : 'btn-text text-sys-onSurfaceVar'}`}
                            >
                                <BarChart3 size={16} />
                                <span>Stats</span>
                            </button>
                        </div>
                    </div>
                </div>
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-2xl border border-white/5 px-6">
                        <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-5">
                            <History size={40} className="text-sys-onSurfaceVar" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Workouts Yet</h3>
                        <p className="text-sm text-sys-onSurfaceVar text-center max-w-[250px]">Complete your first workout to see it here. Pull down to refresh.</p>
                    </div>
                ) : viewMode === 'stats' ? (
                    <ExerciseStatsView
                        calculateExerciseStats={calculateExerciseStats}
                        getExerciseHistory={getExerciseHistory}
                        getAllExercisesWithHistory={getAllExercisesWithHistory}
                    />
                ) : (
                    <div className="space-y-4">
                        {/* PR Highlights Card - only show if there are PRs or streaks */}
                        {(prHighlightsData.recentPRs.length > 0 || prHighlightsData.streakDays > 0) && (
                            <PRHighlights
                                recentPRs={prHighlightsData.recentPRs}
                                streakDays={prHighlightsData.streakDays}
                                totalWorkouts={prHighlightsData.totalWorkouts}
                                bestStreak={prHighlightsData.bestStreak}
                                periodLabel="Last 30 Days"
                                compact={prHighlightsData.recentPRs.length > 3}
                            />
                        )}

                        {/* Calendar View */}
                        <CalendarView history={history} onDayClick={handleDayClick} />

                        {/* Selected Day Details Modal */}
                        <AnimatePresence>
                            {selectedDayWorkouts && selectedDayWorkouts.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
                                    onClick={handleCloseDayDetail}
                                >
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                                    <motion.div
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 100, opacity: 0 }}
                                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-sys-surface border border-white/10 rounded-2xl shadow-2xl"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="sticky top-0 bg-sys-surface border-b border-white/5 p-5 flex items-center justify-between z-10">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">
                                                    {new Date(selectedDayWorkouts[0].date).toLocaleDateString('en-US', { 
                                                        weekday: 'long', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                </h3>
                                                <p className="text-sm text-sys-onSurfaceVar">
                                                    {selectedDayWorkouts.length} workout{selectedDayWorkouts.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleCloseDayDetail}
                                                className="h-10 w-10 rounded-xl bg-sys-surfaceHigh hover:bg-sys-accent/20 transition-colors flex items-center justify-center"
                                            >
                                                <ChevronDown size={20} className="text-sys-onSurface" />
                                            </button>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            {selectedDayWorkouts.map((entry, idx) => {
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
                                                    <div key={idx} className="bg-sys-surfaceHigh rounded-2xl p-4 border border-white/5">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            {entry.isEmptyWorkout || (entry.week === 0 && entry.day === 0) ? (
                                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sys-success/20 to-sys-success/5 border border-sys-success/30 flex items-center justify-center">
                                                                    <Plus size={20} className="text-sys-success" />
                                                                </div>
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sys-accent/20 to-sys-accent/5 border border-sys-accent/30 flex flex-col items-center justify-center">
                                                                    <span className="text-[8px] font-semibold text-sys-accent uppercase">W</span>
                                                                    <span className="text-sm font-bold text-sys-accent leading-none">{entry.week}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-sm font-bold text-white">
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
                                                            <div className="mb-3 p-3 bg-sys-accent/10 rounded-xl border border-sys-accent/20">
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    <MessageSquare size={12} className="text-sys-accent" />
                                                                    <span className="text-[10px] font-bold text-sys-accent uppercase">Notes</span>
                                                                </div>
                                                                <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{entry.workoutNotes}</p>
                                                            </div>
                                                        )}

                                                        {hasExercises && (
                                                            <div className="space-y-2">
                                                                {entry.exercises!.map((ex, exIdx) => {
                                                                    const exComplete = ex.completedSets === ex.totalSets;
                                                                    return (
                                                                        <div key={exIdx} className={`bg-sys-surface rounded-xl p-3 border ${exComplete ? 'border-sys-success/20' : 'border-white/5'}`}>
                                                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <h5 className="text-xs font-bold text-white truncate">{ex.name}</h5>
                                                                                    <p className="text-[10px] text-sys-onSurfaceVar">{ex.prescription}</p>
                                                                                </div>
                                                                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                                                                    exComplete ? 'bg-sys-success/20 text-sys-success' : 'bg-sys-accent/15 text-sys-accent'
                                                                                }`}>
                                                                                    {exComplete && <Check size={10} />}
                                                                                    <span>{ex.completedSets}/{ex.totalSets}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                {ex.weight && (
                                                                                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-white font-medium">
                                                                                        {ex.weight} kg
                                                                                    </span>
                                                                                )}
                                                                                {ex.rpe && Object.keys(ex.rpe).length > 0 && (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <span className="text-[9px] text-sys-onSurfaceVar uppercase">RPE</span>
                                                                                        {Object.entries(ex.rpe).map(([setIdx, rpe]) => (
                                                                                            <span key={setIdx} className="text-[10px] w-5 h-5 flex items-center justify-center rounded-md bg-sys-accent/15 text-sys-accent font-semibold">
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
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
};

export type { HistoryViewProps, ExerciseStatData, ExerciseHistoryEntry, GlobalHistoryEntry };
