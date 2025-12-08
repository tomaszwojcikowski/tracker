import React from 'react';

interface VolumeBreakdownItem {
    name: string;
    volume: number;
}

interface WeeklyVolumeItem {
    week: string | number;
    volume: number;
}

export interface VolumeCardProps {
    totalVolume: number;
    breakdown?: VolumeBreakdownItem[];
    className?: string;
}

/**
 * Format volume with K suffix for large numbers
 */
const formatVolume = (vol: number): string => {
    if (vol >= 10000) {
        return `${(vol / 1000).toFixed(1)}k`;
    }
    return vol.toLocaleString();
};

/**
 * VolumeCard - Displays volume for a single workout
 */
export const VolumeCard: React.FC<VolumeCardProps> = ({ totalVolume, breakdown = [], className = '' }) => {
    return (
        <div className={`bg-sys-surface rounded-2xl border border-white/5 p-4 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-sys-accent/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-sys-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18" />
                            <path d="M18 17V9" />
                            <path d="M13 17V5" />
                            <path d="M8 17v-3" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider">Volume</span>
                </div>
                <span className="text-lg font-bold text-white">
                    {formatVolume(totalVolume)} <span className="text-xs text-sys-onSurfaceVar">kg</span>
                </span>
            </div>

            {breakdown.length > 0 && (
                <div className="space-y-2">
                    {breakdown.slice(0, 3).map((ex, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-sys-onSurfaceVar truncate max-w-[60%]">{ex.name}</span>
                            <span className="text-white font-medium">{formatVolume(ex.volume)} kg</span>
                        </div>
                    ))}
                    {breakdown.length > 3 && (
                        <div className="text-xs text-sys-onSurfaceVar text-center pt-1">
                            +{breakdown.length - 3} more exercises
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export type VolumeTrend = 'increasing' | 'decreasing' | 'neutral';

export interface VolumeTrendBadgeProps {
    trend: VolumeTrend;
}

/**
 * VolumeTrendBadge - Shows volume trend indicator
 */
export const VolumeTrendBadge: React.FC<VolumeTrendBadgeProps> = ({ trend }) => {
    const config: Record<VolumeTrend, { icon: string; text: string; className: string }> = {
        increasing: {
            icon: '↑',
            text: 'Volume Up',
            className: 'bg-sys-success/10 text-sys-success'
        },
        decreasing: {
            icon: '↓',
            text: 'Volume Down',
            className: 'bg-sys-error/10 text-sys-error'
        },
        neutral: {
            icon: '→',
            text: 'Stable',
            className: 'bg-sys-tertiary/10 text-sys-tertiary'
        }
    };

    const { icon, text, className } = config[trend] || config.neutral;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${className}`}>
            <span>{icon}</span>
            <span>{text}</span>
        </span>
    );
};

export interface VolumeStatsCardProps {
    totalVolume: number;
    averagePerWorkout: number;
    workoutCount: number;
    trend: VolumeTrend;
    weeklyBreakdown?: WeeklyVolumeItem[];
    className?: string;
}

/**
 * VolumeStatsCard - Displays aggregate volume statistics
 */
export const VolumeStatsCard: React.FC<VolumeStatsCardProps> = ({
    totalVolume,
    averagePerWorkout,
    workoutCount,
    trend,
    weeklyBreakdown = [],
    className = ''
}) => {
    // Find max for chart scaling
    const maxWeekly = Math.max(...weeklyBreakdown.map(w => w.volume), 1);

    return (
        <div className={`bg-sys-surface rounded-2xl border border-white/5 p-5 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Volume Stats</h3>
                <VolumeTrendBadge trend={trend} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-sys-surfaceHigh rounded-xl p-3">
                    <div className="text-xs text-sys-onSurfaceVar mb-1">Total Volume</div>
                    <div className="text-lg font-bold text-white">{formatVolume(totalVolume)} kg</div>
                </div>
                <div className="bg-sys-surfaceHigh rounded-xl p-3">
                    <div className="text-xs text-sys-onSurfaceVar mb-1">Avg/Workout</div>
                    <div className="text-lg font-bold text-white">{formatVolume(averagePerWorkout)} kg</div>
                </div>
            </div>

            {weeklyBreakdown.length > 0 && (
                <div>
                    <div className="text-xs text-sys-onSurfaceVar mb-2">Weekly Volume</div>
                    <div className="flex items-end justify-between h-20 gap-1">
                        {weeklyBreakdown.map((week, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full bg-sys-accent/30 rounded-t transition-all"
                                    style={{
                                        height: `${(week.volume / maxWeekly) * 100}%`,
                                        minHeight: '4px'
                                    }}
                                />
                                <span className="text-[10px] text-sys-onSurfaceVar">{week.week}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-3 pt-3 border-t border-white/5 text-center">
                <span className="text-xs text-sys-onSurfaceVar">
                    Based on {workoutCount} workout{workoutCount !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
};

export default VolumeCard;
