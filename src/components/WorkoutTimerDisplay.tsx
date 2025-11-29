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
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sys-surfaceHigh/80 hover:bg-sys-surfaceHigh border border-white/5 transition-all active:scale-95"
      aria-label={isRunning ? 'Pause workout timer' : 'Resume workout timer'}
      title={isRunning ? 'Tap to pause' : 'Tap to resume'}
    >
      {isRunning ? (
        <Timer size={14} className="text-sys-accent" />
      ) : (
        <Pause size={14} className="text-sys-onSurfaceVar" />
      )}
      <span
        className={`font-mono text-sm font-semibold min-w-[48px] text-left ${
          isRunning ? 'text-white' : 'text-sys-onSurfaceVar'
        }`}
      >
        {formattedTime}
      </span>
      {!isRunning && (
        <Play size={12} className="text-sys-accent" />
      )}
    </button>
  );
};

export default WorkoutTimerDisplay;
