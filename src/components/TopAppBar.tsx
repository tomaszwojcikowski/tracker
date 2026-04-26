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

  return (
    <div className="h-1 bg-sys-surfaceContainerLow relative overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 transition-all duration-500 ease-out bg-sys-primary"
        style={{
          width: `${roundedProgress}%`,
        }}
      />
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
    <header className="glass-topbar sticky top-0 z-40 safe-pt transition-colors duration-200">
      <div className="h-14 flex items-center px-4 gap-3">
        {showBack ? (
          <button
            onClick={onBack}
            className="btn-icon h-12 w-12 -ml-1 text-sys-onSurfaceVariant hover:text-sys-primary"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
        ) : null}

        <div className={clsx("flex-1 min-w-0 flex flex-col justify-center", !showBack && "pl-1")}>
          <h1 className="text-lg font-extrabold text-sys-onSurface tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-sys-onSurfaceVariant truncate -mt-0.5 font-semibold">
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
