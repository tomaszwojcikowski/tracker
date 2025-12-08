/**
 * WorkoutTimerDisplay Component
 *
 * Displays the workout duration timer in the TopAppBar.
 * Shows elapsed time and allows pause/resume by tapping.
 */

import React from 'react';
import { Play, Pause, Timer } from 'lucide-react';
import { formatTimerTime } from '../hooks/useWorkoutTimer';
import type { WorkoutTimerDisplayProps } from '../types';
import { clsx } from 'clsx';

/**
 * Compact workout timer display for the TopAppBar
 *
 * When running: Shows Timer icon (indicating active) - tap to pause
 * When paused: Shows Pause icon + Play icon (indicating paused, tap to resume)
 */
export const WorkoutTimerDisplay: React.FC<WorkoutTimerDisplayProps> = ({
  elapsedSeconds,
  isRunning,
  onToggle,
}) => {
  const formattedTime = formatTimerTime(elapsedSeconds);

  return (
    <button
      onClick={onToggle}
      className={clsx(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95",
        isRunning
          ? "bg-sys-primaryContainer text-sys-onPrimaryContainer border-transparent"
          : "bg-sys-surfaceVariant/30 text-sys-onSurfaceVariant border-sys-outlineVariant"
      )}
      aria-label={isRunning ? 'Pause workout timer' : 'Resume workout timer'}
      title={isRunning ? 'Tap to pause' : 'Tap to resume'}
    >
      {isRunning ? (
        <Timer size={16} className="text-sys-onPrimaryContainer" />
      ) : (
        <Pause size={16} className="text-sys-onSurfaceVariant" />
      )}
      <span
        className={clsx(
          "font-mono text-label-lg font-medium min-w-[48px] text-left",
          isRunning ? "text-sys-onPrimaryContainer" : "text-sys-onSurfaceVariant"
        )}
      >
        {formattedTime}
      </span>
      {!isRunning && (
        <Play size={14} className="text-sys-primary" />
      )}
    </button>
  );
};
