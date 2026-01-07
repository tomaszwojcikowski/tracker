/**
 * WorkoutSummary Component
 *
 * Post-workout summary screen showing stats, highlights, and next workout preview.
 * Displays after completing a workout for celebration and review.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Clock,
    Dumbbell,
    Flame,
    TrendingUp,
    ChevronRight,
    Star,
    Zap,
    Award,
    CheckCircle2,
    Check,
    Target,
} from './icons';
import { useHaptic } from '../hooks';

// ============================================================================
// TYPES
// ============================================================================

export interface ExerciseSummaryItem {
    name: string;
    prescription: string;
    completedSets: number;
    totalSets: number;
    weight: number | string | null;
    isBodyweight?: boolean;
    isPR?: boolean;
    rpe?: Record<string, number | string>;
}

export interface WorkoutSummaryProps {
    /** Whether the summary is visible */
    isOpen: boolean;
    /** Callback to close the summary */
    onClose: () => void;
    /** Workout title */
    title: string;
    /** Workout duration in seconds */
    durationSeconds: number;
    /** List of exercises completed */
    exercises: ExerciseSummaryItem[];
    /** Current week number */
    week: number;
    /** Current day number */
    day: number;
    /** Is this an empty/custom workout */
    isEmptyWorkout?: boolean;
    /** Optional workout notes */
    workoutNotes?: string;
    /** Optional next workout preview */
    nextWorkout?: {
        day: number;
        exercises: string[];
    };
    /** Optional comparison with last session */
    comparison?: {
        volumeDiff: number; // positive = more volume
        durationDiff: number; // positive = longer
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) {
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
}

/**
 * Calculate total volume (weight × sets) for all exercises
 */
function calculateTotalVolume(exercises: ExerciseSummaryItem[]): number {
    return exercises.reduce((total, ex) => {
        if (ex.isBodyweight || !ex.weight) return total;
        const weight = typeof ex.weight === 'string' ? parseFloat(ex.weight) || 0 : ex.weight;
        return total + (weight * ex.completedSets);
    }, 0);
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    accent?: boolean;
    highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subValue, accent, highlight }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`rounded-2xl p-4 border ${
            highlight
                ? 'bg-sys-tertiaryContainer border-sys-tertiary/30'
                : accent
                ? 'bg-sys-primaryContainer border-sys-primary/30'
                : 'bg-sys-surfaceContainerHigh border-sys-outlineVariant'
        }`}
    >
        <div className={`mb-2 ${highlight ? 'text-sys-onTertiaryContainer' : accent ? 'text-sys-onPrimaryContainer' : 'text-sys-onSurfaceVar'}`}>
            {icon}
        </div>
        <div className={`text-2xl font-bold ${highlight ? 'text-sys-onTertiaryContainer' : accent ? 'text-sys-onPrimaryContainer' : 'text-sys-onSurface'}`}>
            {value}
        </div>
        <div className={`text-xs ${highlight ? 'text-sys-onTertiaryContainer/70' : accent ? 'text-sys-onPrimaryContainer/70' : 'text-sys-onSurfaceVar'}`}>{label}</div>
        {subValue && (
            <div className={`text-xs mt-1 ${highlight ? 'text-sys-onTertiaryContainer/70' : 'text-sys-onPrimaryContainer/70'}`}>
                {subValue}
            </div>
        )}
    </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
    isOpen,
    onClose,
    title,
    durationSeconds,
    exercises,
    week,
    day: _day,
    isEmptyWorkout,
    workoutNotes,
    nextWorkout,
    comparison,
}) => {
    // _day is available for future use (e.g., comparison features)
    const haptic = useHaptic();

    // Calculate stats
    const stats = useMemo(() => {
        const totalSets = exercises.reduce((sum, ex) => sum + ex.totalSets, 0);
        const completedSets = exercises.reduce((sum, ex) => sum + ex.completedSets, 0);
        const totalVolume = calculateTotalVolume(exercises);
        const prs = exercises.filter(ex => ex.isPR);
        const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

        // Find heaviest lift
        const heaviestLift = exercises.reduce<ExerciseSummaryItem | null>((max, ex) => {
            if (ex.isBodyweight || !ex.weight) return max;
            const weight = typeof ex.weight === 'string' ? parseFloat(ex.weight) || 0 : ex.weight;
            if (!max) return ex;
            const maxWeight = typeof max.weight === 'string' ? parseFloat(max.weight) || 0 : max.weight || 0;
            return weight > maxWeight ? ex : max;
        }, null);

        return {
            totalSets,
            completedSets,
            totalVolume,
            prs,
            completionRate,
            heaviestLift,
            exerciseCount: exercises.length,
        };
    }, [exercises]);

    // Trigger haptic on open
    React.useEffect(() => {
        if (isOpen) {
            haptic.milestone();
        }
    }, [isOpen, haptic]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-sys-surface/95 backdrop-blur-md overflow-y-auto workout-summary-container shadow-2xl"
            >
                <div className="min-h-full flex flex-col p-5 safe-pt safe-pb">
                    {/* Header with celebration */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mb-6"
                    >
                        {/* Trophy animation */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                type: 'spring',
                                stiffness: 260,
                                damping: 20,
                                delay: 0.2,
                            }}
                            className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-sys-tertiaryContainer border-2 border-sys-tertiary/30 mb-4"
                        >
                            <Trophy size={40} className="text-sys-onTertiaryContainer" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-sys-onSurface mb-1"
                        >
                            Workout Complete! 💪
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-sys-onSurfaceVar"
                        >
                            {isEmptyWorkout ? 'Custom Workout' : `${title} • Week ${week}`}
                        </motion.p>
                    </motion.div>

                    {/* Main Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-2 gap-3 mb-6"
                    >
                        <StatCard
                            icon={<Clock size={20} />}
                            label="Duration"
                            value={formatDuration(durationSeconds)}
                            accent
                        />
                        <StatCard
                            icon={<CheckCircle2 size={20} />}
                            label="Completion"
                            value={`${stats.completionRate}%`}
                            subValue={`${stats.completedSets}/${stats.totalSets} sets`}
                            accent={stats.completionRate === 100}
                        />
                        <StatCard
                            icon={<Dumbbell size={20} />}
                            label="Total Volume"
                            value={stats.totalVolume > 0 ? `${Math.round(stats.totalVolume)}kg` : 'N/A'}
                            subValue={comparison?.volumeDiff ? (comparison.volumeDiff > 0 ? `+${comparison.volumeDiff}kg vs last` : `${comparison.volumeDiff}kg vs last`) : undefined}
                        />
                        <StatCard
                            icon={<Flame size={20} />}
                            label="Exercises"
                            value={stats.exerciseCount}
                        />
                    </motion.div>

                    {/* PRs Section */}
                    {stats.prs.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mb-6"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Star size={18} className="text-sys-tertiary" />
                                <h2 className="text-lg font-bold text-sys-onSurface">Personal Records!</h2>
                            </div>
                            <div className="space-y-2">
                                {stats.prs.map((pr, idx) => (
                                    <motion.div
                                        key={pr.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + idx * 0.1 }}
                                        className="flex items-center gap-3 p-3 bg-sys-tertiaryContainer rounded-xl border border-sys-tertiary/30"
                                    >
                                        <Award size={20} className="text-sys-onTertiaryContainer flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sys-onTertiaryContainer truncate">{pr.name}</div>
                                            <div className="text-xs text-sys-onTertiaryContainer/70">{pr.weight}kg × {pr.completedSets} sets</div>
                                        </div>
                                        <Zap size={16} className="text-sys-onTertiaryContainer" />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Highlights */}
                    {stats.heaviestLift && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="mb-6"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp size={18} className="text-sys-primary" />
                                <h2 className="text-lg font-bold text-sys-onSurface">Highlights</h2>
                            </div>
                            <div className="p-4 bg-sys-surfaceContainerHigh rounded-xl border border-sys-outlineVariant">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-sys-primaryContainer flex items-center justify-center">
                                        <Dumbbell size={20} className="text-sys-onPrimaryContainer" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-sys-onSurfaceVar">Heaviest Lift</div>
                                        <div className="font-semibold text-sys-onSurface">{stats.heaviestLift.name}</div>
                                    </div>
                                    <div className="text-xl font-bold text-sys-primary">
                                        {stats.heaviestLift.weight}kg
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Workout Notes */}
                    {workoutNotes && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.65 }}
                            className="mb-6"
                        >
                            <div className="p-4 bg-sys-surfaceContainerHigh rounded-xl border border-sys-outlineVariant">
                                <div className="text-xs text-sys-onSurfaceVar mb-1">Workout Notes</div>
                                <div className="text-sm text-sys-onSurface">{workoutNotes}</div>
                            </div>
                        </motion.div>
                    )}

                    {/* Workout Details (Exercise List) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.68 }}
                        className="mb-6"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Target size={18} className="text-sys-secondary" />
                            <h2 className="text-lg font-bold text-sys-onSurface">Workout Details</h2>
                        </div>
                        <div className="space-y-3">
                            {exercises.map((ex, exIdx) => {
                                const isExComplete = ex.completedSets === ex.totalSets;
                                const hasRPE = ex.rpe && Object.keys(ex.rpe).length > 0;

                                return (
                                    <motion.div
                                        key={`${ex.name}-${exIdx}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 + exIdx * 0.05 }}
                                        className={`p-4 rounded-xl border ${
                                            isExComplete
                                                ? 'bg-sys-successContainer/10 border-sys-success/20'
                                                : 'bg-sys-surfaceContainer border-sys-outlineVariant'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-sys-onSurface truncate">{ex.name}</h3>
                                                <p className="text-xs text-sys-onSurfaceVar">{ex.prescription}</p>
                                            </div>
                                            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                isExComplete
                                                    ? 'bg-sys-successContainer text-sys-onSuccessContainer'
                                                    : 'bg-sys-primaryContainer text-sys-onPrimaryContainer'
                                            }`}>
                                                {isExComplete && <Check size={12} />}
                                                <span>{ex.completedSets}/{ex.totalSets}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {ex.weight !== null && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sys-surfaceContainerLow border border-sys-outlineVariant">
                                                    <Dumbbell size={12} className="text-sys-primary" />
                                                    <span className="text-xs font-bold text-sys-onSurface">
                                                        {ex.weight} {ex.isBodyweight ? 'BW' : 'kg'}
                                                    </span>
                                                </div>
                                            )}

                                            {hasRPE && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-sys-onSurfaceVar uppercase tracking-wider ml-1">RPE:</span>
                                                    <div className="flex gap-1">
                                                        {Object.entries(ex.rpe!).map(([setIdx, rpe]) => (
                                                            <div
                                                                key={setIdx}
                                                                className="w-6 h-6 flex items-center justify-center rounded-md bg-sys-tertiaryContainer text-sys-onTertiaryContainer text-[10px] font-bold border border-sys-tertiary/20"
                                                            >
                                                                {rpe}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Next Workout Preview */}
                    {nextWorkout && !isEmptyWorkout && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="mb-6"
                        >
                            <div className="p-4 bg-sys-surfaceContainerHighest rounded-xl border border-sys-outlineVariant">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs text-sys-onSurfaceVar">Next Up</div>
                                    <ChevronRight size={16} className="text-sys-onSurfaceVar" />
                                </div>
                                <div className="font-semibold text-sys-onSurface mb-1">Day {nextWorkout.day}</div>
                                <div className="text-sm text-sys-onSurfaceVar">
                                    {nextWorkout.exercises.slice(0, 3).join(', ')}
                                    {nextWorkout.exercises.length > 3 && ` +${nextWorkout.exercises.length - 3} more`}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Done Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        onClick={() => {
                            haptic.bump();
                            onClose();
                        }}
                        className="w-full h-14 rounded-2xl bg-sys-success text-sys-onSuccess font-bold text-lg active:scale-95 transition-transform shadow-lg"
                    >
                        Done
                    </motion.button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
