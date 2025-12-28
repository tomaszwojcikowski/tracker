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
  const baseClasses = "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95 chip-mockup";
  const runningClasses = "mockup-bg-surface-3 mockup-text-accent border-transparent shadow-md";
  const pausedClasses = "mockup-bg-surface-2 mockup-text-muted mockup-border";

  return (
    <button
      onClick={onToggle}
      className={clsx(baseClasses, isRunning ? runningClasses : pausedClasses)}
      aria-label={isRunning ? 'Pause workout timer' : 'Resume workout timer'}
      title={isRunning ? 'Tap to pause' : 'Tap to resume'}
    >
      {isRunning ? (
        <Timer size={16} className="mockup-text-accent" />
      ) : (
        <Pause size={16} className="mockup-text-muted" />
      )}
      <span
        className={clsx(
          "font-mono text-label-lg font-bold min-w-[48px] text-left timer-display-mockup",
          isRunning ? "mockup-text-accent" : "mockup-text-muted"
        )}
      >
        {formattedTime}
      </span>
      {!isRunning && (
        <Play size={14} className="mockup-text-accent" />
      )}
    </button>
  );
};
