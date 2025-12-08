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
} from 'lucide-react';
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
                ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30'
                : accent
                ? 'bg-gradient-to-br from-sys-accent/20 to-sys-accent/5 border-sys-accent/30'
                : 'bg-sys-surfaceHigh border-white/5'
        }`}
    >
        <div className={`mb-2 ${highlight ? 'text-yellow-400' : accent ? 'text-sys-accent' : 'text-sys-onSurfaceVar'}`}>
            {icon}
        </div>
        <div className={`text-2xl font-bold ${highlight ? 'text-yellow-400' : accent ? 'text-sys-accent' : 'text-white'}`}>
            {value}
        </div>
        <div className="text-xs text-sys-onSurfaceVar">{label}</div>
        {subValue && (
            <div className={`text-xs mt-1 ${highlight ? 'text-yellow-400/70' : 'text-sys-accent/70'}`}>
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
                className="fixed inset-0 z-50 bg-sys-black/95 backdrop-blur-md overflow-y-auto"
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
                            className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400/30 to-yellow-600/10 border-2 border-yellow-500/50 mb-4"
                        >
                            <Trophy size={40} className="text-yellow-400" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-white mb-1"
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
                                <Star size={18} className="text-yellow-400" />
                                <h2 className="text-lg font-bold text-white">Personal Records!</h2>
                            </div>
                            <div className="space-y-2">
                                {stats.prs.map((pr, idx) => (
                                    <motion.div
                                        key={pr.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + idx * 0.1 }}
                                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-xl border border-yellow-500/30"
                                    >
                                        <Award size={20} className="text-yellow-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-white truncate">{pr.name}</div>
                                            <div className="text-xs text-yellow-400/70">{pr.weight}kg × {pr.completedSets} sets</div>
                                        </div>
                                        <Zap size={16} className="text-yellow-400" />
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
                                <TrendingUp size={18} className="text-sys-accent" />
                                <h2 className="text-lg font-bold text-white">Highlights</h2>
                            </div>
                            <div className="p-4 bg-sys-surface rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-sys-accent/20 flex items-center justify-center">
                                        <Dumbbell size={20} className="text-sys-accent" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-sys-onSurfaceVar">Heaviest Lift</div>
                                        <div className="font-semibold text-white">{stats.heaviestLift.name}</div>
                                    </div>
                                    <div className="text-xl font-bold text-sys-accent">
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
                            <div className="p-4 bg-sys-surface rounded-xl border border-white/5">
                                <div className="text-xs text-sys-onSurfaceVar mb-1">Workout Notes</div>
                                <div className="text-sm text-white">{workoutNotes}</div>
                            </div>
                        </motion.div>
                    )}

                    {/* Next Workout Preview */}
                    {nextWorkout && !isEmptyWorkout && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="mb-6"
                        >
                            <div className="p-4 bg-sys-surfaceHigh rounded-xl border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs text-sys-onSurfaceVar">Next Up</div>
                                    <ChevronRight size={16} className="text-sys-onSurfaceVar" />
                                </div>
                                <div className="font-semibold text-white mb-1">Day {nextWorkout.day}</div>
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
                        className="w-full h-14 rounded-2xl btn-gradient-success text-white font-bold text-lg active:scale-95 transition-transform"
                    >
                        Done
                    </motion.button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
