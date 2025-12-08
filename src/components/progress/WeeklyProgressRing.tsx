import React from 'react';

interface WeeklyProgressRingProps {
    completedWorkouts: number;
    totalWorkouts: number;
    currentWeek: number;
}

export const WeeklyProgressRing: React.FC<WeeklyProgressRingProps> = ({
    completedWorkouts,
    totalWorkouts,
    currentWeek,
}) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const progress = totalWorkouts > 0 ? Math.min(completedWorkouts / totalWorkouts, 1) : 0;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <div className="flex items-center gap-4 bg-sys-surface rounded-2xl p-4 border border-white/5 mb-6">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                {/* Background Ring */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-sys-surfaceHigh"
                    />
                    {/* Progress Ring */}
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="text-sys-accent transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-white leading-none">
                        {Math.round(progress * 100)}%
                    </span>
                </div>
            </div>
            
            <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Week {currentWeek}</h3>
                <p className="text-sm text-sys-onSurfaceVar mb-2">
                    {completedWorkouts} of {totalWorkouts} workouts completed
                </p>
                <div className="flex gap-1" data-testid="workout-indicators">
                    {Array.from({ length: totalWorkouts }).map((_, i) => (
                        <div
                            key={i}
                            data-testid={`workout-indicator-${i}`}
                            className={`h-1.5 flex-1 rounded-full ${
                                i < completedWorkouts ? 'bg-sys-accent' : 'bg-sys-surfaceHigh'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
