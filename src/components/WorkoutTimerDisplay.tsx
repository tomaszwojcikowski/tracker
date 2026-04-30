/**
 * WorkoutTimerDisplay Component
 *
 * Displays the workout duration timer in the TopAppBar.
 * Shows elapsed time and allows pause/resume by tapping.
 */

import React from 'react';
import { Play, Pause, Timer } from './icons';
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

  // Base classes for the timer button
  const baseClasses = "flex items-center gap-2 px-4 h-12 rounded-full border transition-all active:scale-95";
  const runningClasses = "bg-sys-surfaceContainerHigh text-sys-primary border-transparent shadow-elevation-2";
  const pausedClasses = "bg-sys-surfaceContainerLow text-sys-onSurfaceVariant border-sys-outlineVariant";

  return (
    <button
      onClick={onToggle}
      className={clsx(baseClasses, isRunning ? runningClasses : pausedClasses)}
      aria-label={isRunning ? 'Pause workout timer' : 'Resume workout timer'}
      title={isRunning ? 'Tap to pause' : 'Tap to resume'}
    >
      {isRunning ? (
        <Timer size={16} className="text-sys-primary" />
      ) : (
        <Pause size={16} className="text-sys-onSurfaceVariant" />
      )}
      <span
        className={clsx(
          "text-mono-stat text-label-lg font-bold min-w-[48px] text-left",
          isRunning ? "text-sys-primary" : "text-sys-onSurfaceVariant"
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
