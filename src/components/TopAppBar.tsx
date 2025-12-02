/**
 * TopAppBar Component
 *
 * A sticky header bar with optional back button, title, subtitle, and workout timer.
 */

import { ArrowLeft } from 'lucide-react';
import { WorkoutTimerDisplay } from './WorkoutTimerDisplay';

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
}

export function TopAppBar({
  title,
  subtitle,
  onBack,
  showBack = false,
  workoutTimer,
}: TopAppBarProps) {
  return (
    <div className="bg-sys-black sticky top-0 z-40 safe-pt border-b border-white/10">
      <div className="h-16 flex items-center px-5 gap-4">
        {showBack ? (
          <button
            onClick={onBack}
            className="h-10 w-10 -ml-1 text-sys-onSurface rounded-xl hover:bg-sys-surfaceHigh transition-colors flex items-center justify-center active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
        ) : null}

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-sys-onSurface tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-sys-onSurfaceVar font-semibold mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Workout Timer - shows on the right side when in workout mode */}
        {workoutTimer && (
          <WorkoutTimerDisplay
            elapsedSeconds={workoutTimer.elapsedSeconds}
            isRunning={workoutTimer.isRunning}
            onToggle={workoutTimer.onToggle}
          />
        )}
      </div>
    </div>
  );
}
