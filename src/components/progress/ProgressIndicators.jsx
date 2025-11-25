import { memo } from 'react';
import { AnimatedNumber } from '../animations/AnimatedNumber';

/**
 * WorkoutProgress Component
 * Shows overall workout completion percentage with animated progress bar
 *
 * @param {Object} props
 * @param {number} props.completedSets - Number of completed sets
 * @param {number} props.totalSets - Total number of sets in workout
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <WorkoutProgress completedSets={8} totalSets={15} />
 */
export const WorkoutProgress = memo(({
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

/**
 * WeightChangeIndicator Component
 * Shows weight change (+/-) compared to previous workout
 *
 * @param {Object} props
 * @param {number} props.current - Current weight value
 * @param {number} props.previous - Previous weight value
 * @param {string} props.unit - Weight unit (default: 'kg')
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <WeightChangeIndicator current={80} previous={75} />
 * <WeightChangeIndicator current={80} previous={85} unit="lb" />
 */
export const WeightChangeIndicator = memo(({
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

/**
 * TimerRing Component
 * Circular SVG progress ring for rest timer visual
 *
 * @param {Object} props
 * @param {number} props.current - Current time remaining in seconds
 * @param {number} props.total - Total time in seconds
 * @param {number} props.size - Ring size in pixels (default: 120)
 * @param {number} props.strokeWidth - Ring stroke width (default: 8)
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Content to display in center
 *
 * @example
 * <TimerRing current={45} total={90}>
 *   <span className="text-2xl font-bold">0:45</span>
 * </TimerRing>
 */
export const TimerRing = memo(({
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

/**
 * ProgressRing Component
 * Generic circular progress indicator
 *
 * @param {Object} props
 * @param {number} props.percentage - Progress percentage (0-100)
 * @param {number} props.size - Ring size in pixels (default: 48)
 * @param {number} props.strokeWidth - Ring stroke width (default: 4)
 * @param {string} props.color - Progress color (CSS variable or color value)
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <ProgressRing percentage={75} size={40} />
 */
export const ProgressRing = memo(({
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
