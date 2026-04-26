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
    History
} from '../icons';
import { safeGetJSON, safeSetJSON } from '../../utils/storage';
import { getGlobalHistoryKey } from '../../services/storageNamespace';
import { PullToRefresh } from '../PullToRefresh';
import { PRHighlights, calculateStreak, findRecentPRs } from '../PRHighlights';
import { useHaptic, useScrollToTop } from '../../hooks';
import { CalendarView } from '../CalendarView';
import { WorkoutDetailModal } from '../modals';

// Storage key for HistoryView preferences
const HISTORY_VIEW_PREFERENCES_KEY = 'tracker_history_view_preferences';

// Types for HistoryView preferences
interface HistoryViewPreferences {
    timeFilter: 'week' | 'month' | 'all';
}

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
        <div className="bg-gradient-to-b from-sys-surfaceHigh to-sys-surface rounded-2xl p-4 border border-sys-outlineVariant">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24" preserveAspectRatio="none">
                {/* Gradient definition */}
                <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--color-outline-variant)" strokeOpacity="0.2" strokeWidth="0.5" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--color-outline-variant)" strokeOpacity="0.2" strokeWidth="0.5" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-outline-variant)" strokeOpacity="0.4" strokeWidth="0.5" />

                {/* Area fill */}
                <polygon points={areaPoints} fill="url(#areaGradient)" />

                {/* Weight line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="var(--color-primary)"
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
                            <circle cx={x} cy={y} r="4" fill="var(--color-primary)" opacity="0.3" />
                            <circle cx={x} cy={y} r="2.5" fill="var(--color-primary)" stroke="var(--color-on-primary)" strokeWidth="1" />
                        </g>
                    );
                })}
            </svg>
            <div className="flex justify-between text-xs mt-3">
                <span className="text-sys-onSurfaceVar font-medium">{minWeight} kg</span>
                <span className="text-sys-primary font-semibold">{maxWeight} kg</span>
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
            <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-2xl border border-sys-outlineVariant px-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-sys-primaryContainer/60 to-sys-tertiaryContainer/40 ring-1 ring-sys-primary/10 shadow-elevation-1 flex items-center justify-center mb-5">
                    <BarChart2 size={40} className="text-sys-primary" />
                </div>
                <h3 className="text-lg font-bold text-sys-onSurface mb-2">No Exercise Data</h3>
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
            <div className="bg-sys-surfaceContainerHigh rounded-2xl p-5 border border-sys-outlineVariant shadow-elevation-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-sys-primaryContainer flex items-center justify-center" aria-hidden="true">
                        <TrendingUp size={20} className="text-sys-onPrimaryContainer" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-sys-onSurface">Training Overview</h3>
                        <p className="text-xs text-sys-onSurfaceVar">{exerciseStats.length} exercises tracked</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-sys-surfaceContainerLow rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-sys-onSurface">{totalWorkoutsSum}</div>
                        <div className="text-xs text-sys-onSurfaceVar">Total Sessions</div>
                    </div>
                    <div className="bg-sys-surfaceContainerLow rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-sys-primary">{maxWeightOverall > 0 ? `${maxWeightOverall} kg` : 'N/A'}</div>
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
                            className="bg-sys-surface border border-sys-outlineVariant rounded-2xl overflow-hidden shadow-elevation-1"
                        >
                            <motion.button
                                layout="position"
                                onClick={() => handleExerciseClick(stat.name)}
                                className="w-full p-5 flex items-center gap-4 active:bg-sys-surfaceHigh transition-colors text-left"
                                aria-expanded={isExpanded}
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* Exercise Icon/Initial */}
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sys-primaryContainer/70 to-sys-primaryContainer/30 border border-sys-primary/20 flex items-center justify-center flex-shrink-0 shadow-elevation-1" aria-hidden="true">
                                    <span className="text-lg font-bold text-sys-onPrimaryContainer">{stat.name.charAt(0)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-sys-onSurface mb-1 truncate">{stat.name}</h3>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-sys-onSurfaceVar">{stat.totalWorkouts} workouts</span>
                                        {stat.maxWeight && (
                                            <span className="px-2 py-0.5 rounded-full bg-sys-primaryContainer text-sys-onPrimaryContainer font-semibold">
                                                Max: {stat.maxWeight} kg
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isExpanded ? 'bg-sys-primary text-sys-onPrimary' : 'bg-sys-surfaceContainerHigh text-sys-onSurfaceVar'}`}
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
                                        <div className="px-5 pb-5 space-y-5">
                                            <div className="divider divider-inset" aria-hidden="true" />
                                            {/* Stats Summary Grid */}
                                            <div className="grid grid-cols-2 gap-3 mt-4 mb-5">
                                                <div className="bg-gradient-to-br from-sys-surfaceHigh to-sys-surface rounded-2xl p-4 border border-sys-outlineVariant">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Calendar size={14} className="text-sys-onSurfaceVar" />
                                                        <span className="text-xs text-sys-onSurfaceVar font-medium">Workouts</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-sys-onSurface">{stat.totalWorkouts}</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-sys-surfaceHigh to-sys-surface rounded-2xl p-4 border border-sys-outlineVariant">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Layers size={14} className="text-sys-onSurfaceVar" />
                                                        <span className="text-xs text-sys-onSurfaceVar font-medium">Max Sets</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-sys-onSurface">{stat.maxSets || 'N/A'}</div>
                                                </div>
                                                {stat.maxWeight && (
                                                    <div className="bg-sys-surfaceContainerHigh rounded-2xl p-4 border border-sys-outlineVariant">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Dumbbell size={14} className="text-sys-primary" />
                                                            <span className="text-xs text-sys-primary font-medium">Max Weight</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-sys-primary">{stat.maxWeight} kg</div>
                                                    </div>
                                                )}
                                                {stat.estimated1RM && (
                                                    <div className="bg-sys-successContainer rounded-2xl p-4 border border-sys-outlineVariant">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Trophy size={14} className="text-sys-onSuccessContainer" />
                                                            <span className="text-xs text-sys-onSuccessContainer font-medium">Est. 1RM</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-sys-onSuccessContainer">{stat.estimated1RM} kg</div>
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
                                                            <TrendingUp size={16} className="text-sys-primary" />
                                                            <h4 className="text-sm font-semibold text-sys-onSurface">Weight Progress</h4>
                                                        </div>
                                                        <SimpleWeightGraph data={graphData} />
                                                    </div>
                                                );
                                            })()}

                                            {/* Recent History */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Clock size={16} className="text-sys-onSurfaceVar" />
                                                    <h4 className="text-sm font-semibold text-sys-onSurface">Recent History</h4>
                                                </div>
                                                <div className="space-y-2">
                                                    {history.slice(-5).reverse().map((entry, entryIdx) => (
                                                        <div key={entryIdx} className="bg-sys-surfaceHigh rounded-xl p-3 flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-sys-surfaceContainerLow flex flex-col items-center justify-center flex-shrink-0">
                                                                <span className="text-xs font-bold text-sys-onSurface leading-none">
                                                                    {new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric' })}
                                                                </span>
                                                                <span className="text-[10px] text-sys-onSurfaceVar uppercase">
                                                                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-semibold text-sys-onSurface">
                                                                    {entry.sets} sets completed
                                                                </div>
                                                                <div className="text-xs text-sys-onSurfaceVar">
                                                                    Week {entry.week}, Day {entry.day}
                                                                </div>
                                                            </div>
                                                            {entry.weight && (
                                                                <div className="px-3 py-1.5 rounded-lg bg-sys-primaryContainer text-sys-onPrimaryContainer text-sm font-bold flex-shrink-0">
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

    // Load time filter from localStorage, defaulting to 'all'
    const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>(() => {
        const preferences = safeGetJSON<HistoryViewPreferences>(HISTORY_VIEW_PREFERENCES_KEY, { timeFilter: 'all' });
        return preferences.timeFilter || 'all';
    });

    const haptic = useHaptic();

    // Scroll to top when view loads
    useScrollToTop();

    // Persist time filter to localStorage when it changes
    useEffect(() => {
        const preferences: HistoryViewPreferences = { timeFilter };
        safeSetJSON(HISTORY_VIEW_PREFERENCES_KEY, preferences);
    }, [timeFilter]);

    // Filter history based on time filter
    const filteredHistory = useMemo(() => {
        if (timeFilter === 'all') return history;

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return history.filter(entry => {
            const entryDate = new Date(entry.date);
            if (timeFilter === 'week') return entryDate >= weekAgo;
            if (timeFilter === 'month') return entryDate >= monthAgo;
            return true;
        });
    }, [history, timeFilter]);

    // Calculate PR highlights data
    const prHighlightsData = useMemo(() => {
        const streakData = calculateStreak(filteredHistory);
        const recentPRs = findRecentPRs(
            getAllExercisesWithHistory,
            getExerciseHistory,
            30 // Last 30 days
        );

        return {
            recentPRs,
            streakDays: streakData.currentStreak,
            bestStreak: streakData.bestStreak,
            totalWorkouts: filteredHistory.length,
        };
    }, [filteredHistory, getAllExercisesWithHistory, getExerciseHistory]);

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
                        <div className="segmented-button-container">
                            <button
                                onClick={() => { haptic.tick(); setViewMode('calendar'); setSelectedDayWorkouts(null); }}
                                className={`segmented-button ${viewMode === 'calendar' ? 'active' : ''}`}
                            >
                                <CalendarDays size={18} />
                                <span>Calendar</span>
                            </button>
                            <button
                                onClick={() => { haptic.tick(); setViewMode('stats'); }}
                                className={`segmented-button ${viewMode === 'stats' ? 'active' : ''}`}
                            >
                                <BarChart3 size={18} />
                                <span>Stats</span>
                            </button>
                        </div>
                    </div>
                </div>
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-2xl border border-sys-outlineVariant px-6">
                        <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-5">
                            <History size={40} className="text-sys-onSurfaceVar" />
                        </div>
                        <h3 className="text-lg font-bold text-sys-onSurface mb-2">No Workouts Yet</h3>
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
                        {/* Quick Filter Chips */}
                        <div className="chip-container overflow-x-auto hide-scrollbar pb-1">
                            <button
                                onClick={() => { haptic.tick(); setTimeFilter('week'); }}
                                className={`chip whitespace-nowrap ${timeFilter === 'week' ? 'active' : ''}`}
                                aria-pressed={timeFilter === 'week'}
                            >
                                <Clock size={14} />
                                <span>This Week</span>
                            </button>
                            <button
                                onClick={() => { haptic.tick(); setTimeFilter('month'); }}
                                className={`chip whitespace-nowrap ${timeFilter === 'month' ? 'active' : ''}`}
                                aria-pressed={timeFilter === 'month'}
                            >
                                <Calendar size={14} />
                                <span>This Month</span>
                            </button>
                            <button
                                onClick={() => { haptic.tick(); setTimeFilter('all'); }}
                                className={`chip whitespace-nowrap ${timeFilter === 'all' ? 'active' : ''}`}
                                aria-pressed={timeFilter === 'all'}
                            >
                                <CalendarDays size={14} />
                                <span>All Time</span>
                            </button>
                        </div>

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
                        <CalendarView history={filteredHistory} onDayClick={handleDayClick} />

                        {/* Selected Day Details Modal */}
                        <WorkoutDetailModal
                            isOpen={selectedDayWorkouts !== null && selectedDayWorkouts.length > 0}
                            onClose={handleCloseDayDetail}
                            workouts={selectedDayWorkouts || []}
                        />
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
};

export type { HistoryViewProps, ExerciseStatData, ExerciseHistoryEntry, GlobalHistoryEntry };
