/**
 * TopAppBar Component
 *
 * A modern sticky header bar with optional back button, title, subtitle, workout timer,
 * and progress bar for workout progress tracking. Follows MD3 design principles.
 */

import { memo, useMemo } from 'react';
import { ArrowLeft } from './icons';
import { WorkoutTimerDisplay } from './WorkoutTimerDisplay';
import { clsx } from 'clsx';

export interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  /** Workout timer props - when provided, shows timer in the header */
  workoutTimer?: {
    elapsedSeconds: number;
    isRunning: boolean;
    onToggle: () => void;
  };
  /** Progress bar props - when provided, shows progress bar at bottom of header */
  progressBar?: {
    progress: number; // 0-100
    completedSets: number;
    totalSets: number;
  };
}

// Memoized progress bar component to prevent unnecessary re-renders
const ProgressBar = memo(function ProgressBar({ progress }: { progress: number }) {
  // Round to nearest integer to reduce style recalculations
  const roundedProgress = useMemo(() => Math.round(progress), [progress]);
  const showShimmer = roundedProgress > 0 && roundedProgress < 100;

  return (
    <div className="h-0.5 bg-sys-surfaceHigh relative overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-sys-accent to-sys-primary transition-all duration-500 ease-out"
        style={{ width: `${roundedProgress}%` }}
      />
      {/* Subtle shimmer effect on active progress */}
      {showShimmer && (
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
          style={{ width: `${roundedProgress}%` }}
        />
      )}
    </div>
  );
});

export const TopAppBar = memo(function TopAppBar({
  title,
  subtitle,
  onBack,
  showBack = false,
  workoutTimer,
  progressBar,
}: TopAppBarProps) {
  return (
    <header className="bg-sys-black/95 backdrop-blur-md sticky top-0 z-40 safe-pt transition-colors duration-200">
      <div className="h-14 flex items-center px-4 gap-3">
        {showBack ? (
          <button
            onClick={onBack}
            className="btn-icon h-10 w-10 -ml-1 text-sys-onSurfaceVar hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
        ) : null}

        <div className={clsx("flex-1 min-w-0 flex flex-col justify-center", !showBack && "pl-1")}>
          <h1 className="text-lg font-semibold text-white tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-sys-onSurfaceVar truncate -mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Workout Timer - shows on the right side when in workout mode */}
        {workoutTimer && (
          <div className="flex items-center">
             <WorkoutTimerDisplay
                elapsedSeconds={workoutTimer.elapsedSeconds}
                isRunning={workoutTimer.isRunning}
                onToggle={workoutTimer.onToggle}
              />
          </div>
        )}
      </div>

      {/* Progress Bar - shows at bottom of header during workouts */}
      {progressBar && <ProgressBar progress={progressBar.progress} />}
    </header>
  );
});
