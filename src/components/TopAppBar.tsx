/**
 * TopAppBar Component
 *
 * A sticky header bar with optional back button, title, subtitle, workout timer,
 * and progress bar for workout progress tracking.
 */

import { memo, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
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
    <div className="h-1 bg-sys-surfaceHigh relative overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
        style={{ width: `${roundedProgress}%` }}
      />
      {/* Subtle shimmer effect on active progress */}
      {showShimmer && (
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
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
    <header className="bg-sys-surface sticky top-0 z-40 safe-pt border-b border-sys-outlineVariant transition-colors duration-200">
      <div className="h-16 flex items-center px-4 gap-4">
        {showBack ? (
          <button
            onClick={onBack}
            className="h-12 w-12 -ml-2 text-sys-onSurface rounded-full hover:bg-sys-surfaceVariant/30 active:bg-sys-surfaceVariant/50 transition-colors flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
        ) : null}

        <div className={clsx("flex-1 min-w-0 flex flex-col justify-center", !showBack && "pl-2")}>
          <h1 className="text-title-lg text-sys-onSurface truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-title-sm text-sys-onSurfaceVariant mt-0.5 truncate">
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
