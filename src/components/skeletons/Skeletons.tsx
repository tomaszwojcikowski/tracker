import React from 'react';

/**
 * ExerciseCardSkeleton - Loading placeholder for exercise cards
 */
export const ExerciseCardSkeleton: React.FC = () => (
    <div className="bg-sys-surface rounded-3xl p-5 border border-white/5 animate-pulse">
        <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-sys-surfaceHigh" />
            <div className="flex-1">
                <div className="h-5 bg-sys-surfaceHigh rounded w-3/4 mb-2" />
                <div className="h-3 bg-sys-surfaceHigh rounded w-1/2" />
            </div>
        </div>
        <div className="flex gap-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-14 flex-1 rounded-xl bg-sys-surfaceHigh" />
            ))}
        </div>
    </div>
);

/**
 * HistoryEntrySkeleton - Loading placeholder for history timeline entries
 */
export const HistoryEntrySkeleton: React.FC = () => (
    <div className="bg-sys-surface rounded-3xl p-5 border border-white/5 animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                <div className="h-5 bg-sys-surfaceHigh rounded w-1/3 mb-2" />
                <div className="h-4 bg-sys-surfaceHigh rounded w-1/4" />
            </div>
            <div className="h-10 w-10 rounded-full bg-sys-surfaceHigh" />
        </div>
        <div className="space-y-2">
            <div className="h-4 bg-sys-surfaceHigh rounded w-full" />
            <div className="h-4 bg-sys-surfaceHigh rounded w-2/3" />
        </div>
    </div>
);

/**
 * StatsCardSkeleton - Loading placeholder for stats cards
 */
export const StatsCardSkeleton: React.FC = () => (
    <div className="bg-sys-surface rounded-2xl p-4 border border-white/5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-sys-surfaceHigh" />
                <div className="h-4 bg-sys-surfaceHigh rounded w-16" />
            </div>
            <div className="h-6 bg-sys-surfaceHigh rounded w-20" />
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-sys-surfaceHigh rounded w-full" />
            <div className="h-3 bg-sys-surfaceHigh rounded w-3/4" />
        </div>
    </div>
);

/**
 * ExerciseLibraryItemSkeleton - Loading placeholder for exercise library items
 */
export const ExerciseLibraryItemSkeleton: React.FC = () => (
    <div className="bg-sys-surface rounded-2xl p-4 border border-white/5 animate-pulse">
        <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-sys-surfaceHigh flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="h-5 bg-sys-surfaceHigh rounded w-2/3 mb-2" />
                <div className="h-3 bg-sys-surfaceHigh rounded w-1/2" />
            </div>
            <div className="h-10 w-10 rounded-full bg-sys-surfaceHigh flex-shrink-0" />
        </div>
    </div>
);

/**
 * WorkoutDaySkeleton - Loading placeholder for the entire workout day view
 */
export const WorkoutDaySkeleton: React.FC = () => (
    <div className="px-5 pb-20 pt-6 animate-pulse">
        {/* Header */}
        <div className="mb-6">
            <div className="h-8 bg-sys-surfaceHigh rounded w-1/2 mb-2" />
            <div className="h-4 bg-sys-surfaceHigh rounded w-1/3" />
        </div>

        {/* Exercise cards */}
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <ExerciseCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

export interface SkeletonListProps {
    skeleton: React.ComponentType;
    count?: number;
    className?: string;
}

/**
 * SkeletonList - Renders multiple skeletons for loading lists
 */
export const SkeletonList: React.FC<SkeletonListProps> = ({ skeleton: Skeleton, count = 3, className = '' }) => (
    <div className={`space-y-3 ${className}`} aria-busy="true" aria-label="Loading content">
        {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} />
        ))}
    </div>
);

export default {
    ExerciseCardSkeleton,
    HistoryEntrySkeleton,
    StatsCardSkeleton,
    ExerciseLibraryItemSkeleton,
    WorkoutDaySkeleton,
    SkeletonList,
};
