/**
 * PRHighlights Component
 *
 * Displays personal records, streaks, and achievements at the top of the history view.
 * Celebrates user accomplishments to boost motivation.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Star,
    Flame,
    TrendingUp,
    Award,
    ChevronRight,
} from './icons';
import { useHaptic } from '../hooks';
import { formatLocalISO } from '../utils/time';

// ============================================================================
// TYPES
// ============================================================================

export interface PRRecord {
    /** Exercise name */
    exerciseName: string;
    /** Weight achieved */
    weight: number;
    /** Date of the PR */
    date: string;
    /** Previous best weight (if available) */
    previousBest?: number;
}

export interface PRHighlightsProps {
    /** Recent PRs (within the specified time period) */
    recentPRs: PRRecord[];
    /** Current training streak in days */
    streakDays: number;
    /** Total workouts completed */
    totalWorkouts: number;
    /** Best streak ever */
    bestStreak?: number;
    /** Time period label (e.g., "This Week", "This Month") */
    periodLabel?: string;
    /** Callback when a PR is tapped */
    onPRTap?: (exerciseName: string) => void;
    /** Whether to show in compact mode */
    compact?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate training streak from history
 */
export function calculateStreak(
    history: Array<{ date: string }>
): { currentStreak: number; bestStreak: number } {
    if (!history.length) return { currentStreak: 0, bestStreak: 0 };

    // Sort by date descending
    const sorted = [...history].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    const countedDays = new Set<string>();

    for (const entry of sorted) {
        const entryDate = new Date(entry.date);
        const dateKey = formatLocalISO(entryDate);

        // Skip duplicate days
        if (countedDays.has(dateKey)) continue;
        countedDays.add(dateKey);

        if (!lastDate) {
            // First entry - check if it's today or yesterday
            const daysDiff = Math.floor(
                (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysDiff <= 1) {
                tempStreak = 1;
                lastDate = entryDate;
            } else {
                // Streak broken - start counting for best streak
                tempStreak = 1;
                lastDate = entryDate;
                currentStreak = 0;
            }
        } else {
            const daysDiff = Math.floor(
                (lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysDiff === 1) {
                // Consecutive day
                tempStreak++;
                lastDate = entryDate;
            } else if (daysDiff === 0) {
                // Same day, skip
                continue;
            } else {
                // Streak broken
                if (currentStreak === 0) {
                    currentStreak = tempStreak;
                }
                bestStreak = Math.max(bestStreak, tempStreak);
                tempStreak = 1;
                lastDate = entryDate;
            }
        }
    }

    // Finalize
    if (currentStreak === 0) {
        currentStreak = tempStreak;
    }
    bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

    return { currentStreak, bestStreak };
}

/**
 * Find recent PRs from exercise history
 */
export function findRecentPRs(
    getAllExercisesWithHistory: () => string[],
    getExerciseHistory: (name: string) => Array<{ date: string; weight?: string | number }>,
    daysBack: number = 30
): PRRecord[] {
    const prs: PRRecord[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const exercises = getAllExercisesWithHistory();

    for (const exerciseName of exercises) {
        const history = getExerciseHistory(exerciseName);
        if (!history.length) continue;

        // Find max weight and when it was achieved
        let maxWeight = 0;
        let maxDate = '';
        let secondBest = 0;

        for (const entry of history) {
            if (!entry.weight) continue;
            const weight = typeof entry.weight === 'string'
                ? parseFloat(entry.weight)
                : entry.weight;

            if (weight > maxWeight) {
                secondBest = maxWeight;
                maxWeight = weight;
                maxDate = entry.date;
            } else if (weight > secondBest) {
                secondBest = weight;
            }
        }

        // Check if the PR was recent
        if (maxDate && maxWeight > 0) {
            const prDate = new Date(maxDate);
            if (prDate >= cutoffDate) {
                prs.push({
                    exerciseName,
                    weight: maxWeight,
                    date: maxDate,
                    previousBest: secondBest > 0 ? secondBest : undefined,
                });
            }
        }
    }

    // Sort by date (most recent first)
    return prs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ============================================================================
// PR CARD COMPONENT
// ============================================================================

interface PRCardProps {
    pr: PRRecord;
    onTap?: () => void;
    delay: number;
}

const PRCard: React.FC<PRCardProps> = ({ pr, onTap, delay }) => {
    const improvement = pr.previousBest
        ? Math.round(((pr.weight - pr.previousBest) / pr.previousBest) * 100)
        : null;

    return (
        <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            onClick={onTap}
            className="flex items-center gap-3 p-3 bg-sys-tertiaryContainer/30 rounded-xl border border-sys-tertiary/30 w-full text-left active:scale-98 transition-transform"
        >
            <div className="h-10 w-10 rounded-xl bg-sys-tertiaryContainer flex items-center justify-center flex-shrink-0">
                <Trophy size={20} className="text-sys-tertiary" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-sys-onSurface text-sm truncate">{pr.exerciseName}</div>
                <div className="text-xs text-sys-onSurfaceVariant">
                    {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-sys-tertiary">{pr.weight}kg</div>
                {improvement !== null && improvement > 0 && (
                    <div className="text-xs text-sys-onSurfaceVariant flex items-center justify-end gap-0.5">
                        <TrendingUp size={10} />
                        +{improvement}%
                    </div>
                )}
            </div>
        </motion.button>
    );
};

// ============================================================================
// STREAK BADGE COMPONENT
// ============================================================================

interface StreakBadgeProps {
    days: number;
    bestStreak?: number;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ days, bestStreak }) => {
    const isOnFire = days >= 3;
    const isNewRecord = bestStreak !== undefined && days >= bestStreak && days > 0;

    if (days === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                isOnFire
                    ? 'bg-sys-secondaryContainer border-sys-secondary/30'
                    : 'bg-sys-surfaceContainerHigh border-sys-outlineVariant'
            }`}
        >
            <Flame
                size={20}
                className={isOnFire ? 'text-sys-secondary animate-pulse' : 'text-sys-onSurfaceVariant'}
            />
            <div>
                <div className="text-lg font-bold text-sys-onSurface leading-none">{days}</div>
                <div className="text-[10px] text-sys-onSurfaceVariant uppercase tracking-wide">
                    day streak
                </div>
            </div>
            {isNewRecord && (
                <div className="ml-1 px-1.5 py-0.5 rounded-sm bg-sys-tertiaryContainer text-sys-onTertiaryContainer text-[9px] font-bold uppercase">
                    Best!
                </div>
            )}
        </motion.div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PRHighlights: React.FC<PRHighlightsProps> = ({
    recentPRs,
    streakDays,
    totalWorkouts,
    bestStreak,
    periodLabel = 'This Month',
    onPRTap,
    compact = false,
}) => {
    const haptic = useHaptic();
    const [expanded, setExpanded] = React.useState(!compact);

    const handleToggle = () => {
        haptic.tick();
        setExpanded(!expanded);
    };

    const handlePRTap = (exerciseName: string) => {
        haptic.tick();
        onPRTap?.(exerciseName);
    };

    // Don't render if there's nothing to show
    if (recentPRs.length === 0 && streakDays === 0) {
        return null;
    }

    return (
        <div className="mb-6 space-y-3">
            {/* PRs Card */}
            {recentPRs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-sys-surfaceContainerHigh rounded-md border border-sys-outlineVariant overflow-hidden"
                >
                    <button
                        onClick={handleToggle}
                        className="w-full flex items-center justify-between p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-sys-tertiaryContainer flex items-center justify-center">
                                <Star size={20} className="text-sys-tertiary" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-base font-bold text-sys-onSurface">
                                    {recentPRs.length} New PR{recentPRs.length !== 1 ? 's' : ''}! 🎉
                                </h3>
                                <p className="text-xs text-sys-onSurfaceVariant">{periodLabel}</p>
                            </div>
                        </div>
                        <motion.div
                            animate={{ rotate: expanded ? 90 : 0 }}
                            className="h-8 w-8 rounded-full bg-sys-tertiaryContainer flex items-center justify-center"
                        >
                            <ChevronRight size={16} className="text-sys-tertiary" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="px-4 pb-4"
                            >
                                <div className="space-y-2">
                                    {recentPRs.slice(0, 5).map((pr, idx) => (
                                        <PRCard
                                            key={pr.exerciseName}
                                            pr={pr}
                                            onTap={onPRTap ? () => handlePRTap(pr.exerciseName) : undefined}
                                            delay={idx * 0.1}
                                        />
                                    ))}
                                </div>
                                {recentPRs.length > 5 && (
                                    <p className="text-xs text-sys-onSurfaceVariant text-center mt-3">
                                        +{recentPRs.length - 5} more PRs
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Stats Row: Streak + Workouts */}
            <div className="flex gap-3">
                <StreakBadge days={streakDays} bestStreak={bestStreak} />

                {totalWorkouts > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sys-surfaceContainerHigh border border-sys-outlineVariant"
                    >
                        <Award size={20} className="text-sys-primary" />
                        <div>
                            <div className="text-lg font-bold text-sys-onSurface leading-none">{totalWorkouts}</div>
                            <div className="text-[10px] text-sys-onSurfaceVariant uppercase tracking-wide">
                                workouts
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
