import { memo, ReactNode } from 'react';
import { AnimatedNumber } from '../animations/AnimatedNumber';

export interface WorkoutProgressProps {
    completedSets: number;
    totalSets: number;
    className?: string;
}

/**
 * WorkoutProgress Component
 * Shows overall workout completion percentage with animated progress bar
 */
export const WorkoutProgress = memo<WorkoutProgressProps>(({
    completedSets,
    totalSets,
    className = '',
}) => {
    const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

    return (
        <div className={`mb-4 ${className}`}>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-sys-onSurfaceVar">
                    {completedSets}/{totalSets} sets
                </span>
                <span className="text-white font-bold">
                    <AnimatedNumber value={percentage} duration={400} />%
                </span>
            </div>
            <div className="h-2 bg-sys-surfaceHigh rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-sys-accent to-sys-success transition-all duration-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Workout progress: ${completedSets} of ${totalSets} sets completed`}
                />
            </div>
        </div>
    );
});

WorkoutProgress.displayName = 'WorkoutProgress';

export interface WeightChangeIndicatorProps {
    current: number;
    previous: number | null | undefined;
    unit?: string;
    className?: string;
}

/**
 * WeightChangeIndicator Component
 * Shows weight change (+/-) compared to previous workout
 */
export const WeightChangeIndicator = memo<WeightChangeIndicatorProps>(({
    current,
    previous,
    unit = 'kg',
    className = '',
}) => {
    // Don't show anything if no previous data or no change
    if (previous === null || previous === undefined) return null;

    const diff = current - previous;
    if (diff === 0) return null;

    const isIncrease = diff > 0;
    const formattedDiff = Math.abs(diff).toFixed(diff % 1 === 0 ? 0 : 1);

    return (
        <span
            className={`text-xs font-bold ${isIncrease ? 'text-sys-success' : 'text-sys-error'} ${className}`}
            aria-label={`Weight ${isIncrease ? 'increased' : 'decreased'} by ${formattedDiff}${unit}`}
        >
            {isIncrease ? '+' : '-'}{formattedDiff}{unit}
        </span>
    );
});

WeightChangeIndicator.displayName = 'WeightChangeIndicator';

export interface TimerRingProps {
    current: number;
    total: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
    children?: ReactNode;
}

/**
 * TimerRing Component
 * Circular SVG progress ring for rest timer visual
 */
export const TimerRing = memo<TimerRingProps>(({
    current,
    total,
    size = 120,
    strokeWidth = 8,
    className = '',
    children,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = total > 0 ? (current / total) * circumference : 0;
    const offset = circumference - progress;

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
                role="progressbar"
                aria-valuenow={current}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={`Timer: ${current} seconds remaining`}
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--color-surface-high)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                />
            </svg>
            {/* Center content */}
            {children && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {children}
                </div>
            )}
        </div>
    );
});

TimerRing.displayName = 'TimerRing';

export interface ProgressRingProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    className?: string;
}

/**
 * ProgressRing Component
 * Generic circular progress indicator
 */
export const ProgressRing = memo<ProgressRingProps>(({
    percentage,
    size = 48,
    strokeWidth = 4,
    color = 'var(--color-accent)',
    className = '',
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg
            width={size}
            height={size}
            className={`transform -rotate-90 ${className}`}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--color-surface-high)"
                strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-300"
            />
        </svg>
    );
});

ProgressRing.displayName = 'ProgressRing';
