import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, ChevronRight, CheckSquare, Square, BarChart2 } from 'lucide-react';
import { useHaptic, useDebounce, useScrollToTop } from '../../hooks';
import { DEBOUNCE_DELAY_MS, getShortExerciseName } from '../../constants';
import type { Exercise } from '../../types';

// Exercise stats type for display
interface ExerciseStatData {
    totalWorkouts: number;
    maxWeight: number | null;
    maxSets: number | null;
    estimated1RM: number | null;
    maxWeightBySets: Record<string, number>;
    recentProgress?: Array<{ weight: number; date: string }>;
}

// Exercise history entry for display
interface ExerciseHistoryEntryData {
    date: string;
    week: number;
    day: number;
    sets: number;
    weight?: string | number;
    prescription?: string;
}

interface ExerciseLibraryViewProps {
    exerciseLibrary: Exercise[];
    getAllExercisesWithHistory: () => string[];
    calculateExerciseStats: (name: string) => ExerciseStatData;
    getExerciseHistory: (name: string) => ExerciseHistoryEntryData[];
}

interface ExerciseDetailViewProps {
    exercise: Exercise;
    onBack: () => void;
    getExerciseHistory: (name: string) => ExerciseHistoryEntryData[];
    calculateExerciseStats: (name: string) => ExerciseStatData;
}

/**
 * ExerciseDetailView - shows detailed information about a single exercise
 */
const ExerciseDetailView: React.FC<ExerciseDetailViewProps> = ({
    exercise,
    onBack,
    getExerciseHistory,
    calculateExerciseStats,
}) => {
    const [showFullHistory, setShowFullHistory] = useState(false);
    const haptic = useHaptic();
    const history = getExerciseHistory(exercise.name);
    const stats = calculateExerciseStats(exercise.name);

    const displayHistory = showFullHistory ? history : history.slice(-5);

    return (
        <div className="px-5 pb-20 pt-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="h-10 w-10 rounded-xl bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all"
                    aria-label="Go back"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold text-white flex-1">{exercise.name}</h2>
            </div>

            {/* Exercise Info */}
            <div className="bg-sys-surface rounded-3xl border border-white/5 p-6 mb-6">
                <div className="mb-4">
                    <h3 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-2">Primary Muscles</h3>
                    <p className="text-base text-white">{exercise.primaryMuscles.join(', ')}</p>
                </div>
                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-2">Secondary Muscles</h3>
                        <p className="text-base text-white">{exercise.secondaryMuscles.join(', ')}</p>
                    </div>
                )}
                <div className="mb-4">
                    <h3 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-2">Equipment</h3>
                    <p className="text-base text-white">{exercise.equipment.join(', ')}</p>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-2">Category</h3>
                    <p className="text-base text-white capitalize">{exercise.category}</p>
                </div>
            </div>

            {/* Stats */}
            {history.length > 0 ? (
                <>
                    <div className="bg-sys-surface rounded-3xl border border-white/5 p-6 mb-6">
                        <h3 className="text-lg font-bold text-white mb-4">Statistics</h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                <div className="text-xs text-sys-onSurfaceVar mb-1">Total Workouts</div>
                                <div className="text-2xl font-bold text-white">{stats.totalWorkouts}</div>
                            </div>
                            <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                <div className="text-xs text-sys-onSurfaceVar mb-1">Max Sets</div>
                                <div className="text-2xl font-bold text-white">{stats.maxSets || 'N/A'}</div>
                            </div>
                        </div>

                        {stats.maxWeight && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                    <div className="text-xs text-sys-onSurfaceVar mb-1">Max Weight</div>
                                    <div className="text-2xl font-bold text-sys-accent">{stats.maxWeight} kg</div>
                                </div>
                                {stats.estimated1RM && (
                                    <div className="bg-sys-surfaceHigh rounded-xl p-4">
                                        <div className="text-xs text-sys-onSurfaceVar mb-1">Est. 1RM</div>
                                        <div className="text-2xl font-bold text-sys-success">{stats.estimated1RM} kg</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Max Weight by Set Count */}
                        {stats.maxWeightBySets && Object.keys(stats.maxWeightBySets).length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-white mb-3">Max Weight by Sets</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(stats.maxWeightBySets)
                                        .sort(([a], [b]) => +a - +b)
                                        .map(([sets, weight]) => (
                                            <div key={sets} className="bg-sys-surfaceHigh rounded-lg p-3 text-center">
                                                <div className="text-xs text-sys-onSurfaceVar mb-1">{sets} sets</div>
                                                <div className="text-base font-bold text-white">{weight}kg</div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>

                    {/* History */}
                    <div className="bg-sys-surface rounded-3xl border border-white/5 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">History</h3>
                            {history.length > 5 && (
                                <button
                                    onClick={() => { haptic.tick(); setShowFullHistory(!showFullHistory); }}
                                    className="text-sm text-sys-accent font-semibold"
                                >
                                    {showFullHistory ? 'Show Less' : `Show All (${history.length})`}
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {displayHistory.slice().reverse().map((entry, idx) => (
                                <div key={idx} className="bg-sys-surfaceHigh rounded-xl p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-white">
                                                {new Date(entry.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-xs text-sys-onSurfaceVar">
                                                Week {entry.week}, Day {entry.day}
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
                                    {entry.prescription && (
                                        <div className="text-xs text-sys-onSurfaceVar">
                                            {entry.prescription}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-3xl border border-white/5 px-6">
                    <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-5">
                        <BarChart2 size={40} className="text-sys-onSurfaceVar" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No History Yet</h3>
                    <p className="text-sm text-sys-onSurfaceVar text-center max-w-[250px]">
                        Complete workouts with this exercise to see your progress
                    </p>
                </div>
            )}
        </div>
    );
};

/**
 * ExerciseLibraryView - displays a searchable list of all exercises
 */
export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({
    exerciseLibrary,
    getAllExercisesWithHistory,
    calculateExerciseStats,
    getExerciseHistory,
}) => {
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [showOnlyTracked, setShowOnlyTracked] = useState(false);
    const haptic = useHaptic();

    // Scroll to top when view loads
    useScrollToTop();

    // Debounce search term to improve performance
    const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY_MS);

    const trackedExercises = getAllExercisesWithHistory();

    // Get all exercises to display
    const exercisesToShow = useMemo(() => {
        let exercises = [...exerciseLibrary];

        // Filter by search term (using debounced value)
        if (debouncedSearchTerm) {
            exercises = exercises.filter(ex =>
                ex.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                ex.primaryMuscles.some(m => m.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
            );
        }

        // Filter by category
        if (categoryFilter !== 'all') {
            exercises = exercises.filter(ex => ex.category === categoryFilter);
        }

        // Filter to show only tracked exercises
        if (showOnlyTracked) {
            exercises = exercises.filter(ex => trackedExercises.includes(ex.name));
        }

        return exercises;
    }, [exerciseLibrary, debouncedSearchTerm, categoryFilter, showOnlyTracked, trackedExercises]);

    const handleExerciseClick = (exercise: Exercise) => {
        haptic.tick();
        setSelectedExercise(exercise);
    };

    const handleBack = () => {
        haptic.tick();
        setSelectedExercise(null);
    };

    if (selectedExercise) {
        return (
            <ExerciseDetailView
                exercise={selectedExercise}
                onBack={handleBack}
                getExerciseHistory={getExerciseHistory}
                calculateExerciseStats={calculateExerciseStats}
            />
        );
    }

    return (
        <div className="px-5 pb-20 pt-6">
            {/* Search and Filters */}
            <div className="mb-6">
                <div className="relative mb-3">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sys-onSurfaceVar">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search exercises..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-sys-surfaceHigh rounded-xl text-white placeholder:text-sys-onSurfaceVar outline-none focus:ring-2 focus:ring-sys-accent transition-all"
                    />
                </div>

                {/* Category Filter - improved touch targets */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
                    {['all', 'pull', 'push', 'legs', 'core', 'cardio', 'skill', 'arms', 'shoulders'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setCategoryFilter(filter)}
                            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                categoryFilter === filter
                                    ? 'bg-sys-accent text-white'
                                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                            }`}
                        >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Show tracked only toggle */}
                <button
                    onClick={() => setShowOnlyTracked(!showOnlyTracked)}
                    className={`w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                        showOnlyTracked
                            ? 'bg-sys-success/20 text-sys-success border border-sys-success/30'
                            : 'bg-sys-surfaceHigh text-sys-onSurfaceVar border border-white/5'
                    }`}
                >
                    {showOnlyTracked ? <CheckSquare size={18} /> : <Square size={18} />}
                    <span>Show Only Tracked ({trackedExercises.length})</span>
                </button>
            </div>

            {/* Exercise List */}
            {exercisesToShow.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-sys-onSurfaceVar bg-sys-surface rounded-3xl border border-white/5 px-6">
                    <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-5">
                        <Search size={40} className="text-sys-onSurfaceVar" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Exercises Found</h3>
                    <p className="text-sm text-sys-onSurfaceVar text-center">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {exercisesToShow.map((exercise) => {
                        const isTracked = trackedExercises.includes(exercise.name);
                        const stats = isTracked ? calculateExerciseStats(exercise.name) : null;

                        return (
                            <button
                                key={exercise.id}
                                onClick={() => handleExerciseClick(exercise)}
                                className="stagger-item w-full bg-sys-surface rounded-2xl p-4 border border-white/5 hover:border-sys-accent/30 transition-all active:scale-[0.98] text-left"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-base font-semibold text-white truncate">{exercise.name}</h4>
                                            {isTracked && stats && (
                                                <span className="text-xs px-2 py-0.5 bg-sys-success/20 rounded-full text-sys-success font-bold flex-shrink-0">
                                                    {stats.totalWorkouts}
                                                </span>
                                            )}
                                        </div>
                                        {/* Show short name if different from full name */}
                                        {getShortExerciseName(exercise.name) !== exercise.name && (
                                            <p className="text-xs text-sys-accent mb-1">
                                                Short: {getShortExerciseName(exercise.name)}
                                            </p>
                                        )}
                                        <p className="text-xs text-sys-onSurfaceVar mb-2">
                                            {exercise.primaryMuscles.join(', ')}
                                        </p>
                                        {isTracked && stats && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {stats.maxWeight && (
                                                    <span className="text-xs px-2 py-1 bg-sys-accent/10 rounded-lg text-sys-accent">
                                                        Max: {stats.maxWeight}kg
                                                    </span>
                                                )}
                                                {stats.estimated1RM && (
                                                    <span className="text-xs px-2 py-1 bg-sys-accent/10 rounded-lg text-sys-accent">
                                                        Est 1RM: {stats.estimated1RM}kg
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0">
                                        <ChevronRight size={20} className="text-sys-onSurfaceVar" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export type { ExerciseLibraryViewProps, ExerciseDetailViewProps, ExerciseStatData, ExerciseHistoryEntryData };
