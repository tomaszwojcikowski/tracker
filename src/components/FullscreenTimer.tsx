/**
 * FullscreenTimer Component
 *
 * A unified fullscreen timer that supports both REST and EMOM modes.
 * Features large countdown display, sound alerts, and can be minimized.
 * Designed for gym use with high visibility and easy controls.
 *
 * Updated with new mockup-inspired design:
 * - Clean background with subtle conic gradient progress ring
 * - Simplified mode badge
 * - Cleaner time display without heavy SVG animations
 * - Material Design 3 inspired buttons and controls
 *
 * REST Mode: Countdown timer that ends at 0
 * EMOM Mode: Repeating interval timer with round counter
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, Volume2, VolumeX, Plus, Minus, RotateCcw, Timer } from './icons';
import { playTickSound, playBeepSound } from '../utils/audio';
import { useHaptic } from '../hooks';
import { DensityRepControls } from './DensityRepControls';

// ============================================================================
// TYPES
// ============================================================================

export type TimerMode = 'rest' | 'emom' | 'density';

export interface FullscreenDensityRepControls {
  /** Total target reps for this density exercise */
  targetReps: number;
  /** Current rep chunks */
  repChunks: number[];
  /** Whether marked as complete */
  isComplete: boolean;
  /** Callback to update rep chunks */
  onUpdateRepChunks: (chunks: number[]) => void;
  /** Callback to mark as complete */
  onMarkComplete: (complete: boolean) => void;
}

export interface FullscreenTimerProps {
  /** Timer mode: 'rest' for countdown or 'emom' for repeating intervals */
  mode: TimerMode;
  /** Current seconds remaining */
  seconds: number;
  /** Total seconds (for progress calculation in rest mode, or interval duration in EMOM mode) */
  totalSeconds: number;
  /** Current round number (EMOM mode only) */
  round?: number;
  /** Total number of rounds (EMOM mode only) */
  totalRounds?: number;
  /** Callback when timer is stopped */
  onStop: () => void;
  /** Callback to add/subtract time */
  onAddTime: (amount: number) => void;
  /** Callback when timer is minimized */
  onMinimize: () => void;
  /** Callback to adjust interval (EMOM mode only) */
  onAdjustInterval?: (amount: number) => void;
  /** Whether the timer is currently paused (optional; enables pause UI) */
  isPaused?: boolean;
  /** Toggle pause/resume (optional). When provided, tapping the timer ring will toggle pause. */
  onTogglePause?: () => void;
  /** Whether sound is enabled */
  soundEnabled?: boolean;
  /** Callback to toggle sound */
  onToggleSound?: () => void;

  /** Density rep controls (density mode only) */
  densityRepControls?: FullscreenDensityRepControls;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Unified fullscreen timer with support for both REST and EMOM modes.
 * Features large, readable countdown and mode-specific controls.
 */
export const FullscreenTimer: React.FC<FullscreenTimerProps> = ({
  mode,
  seconds,
  totalSeconds,
  round = 0,
  totalRounds,
  onStop,
  onAddTime,
  onMinimize,
  onAdjustInterval,
  isPaused = false,
  onTogglePause,
  soundEnabled = true,
  onToggleSound,
  densityRepControls,
}) => {
  const haptic = useHaptic();
  const lastTickRef = useRef<number>(-1);
  const pendingTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isEmom = mode === 'emom';
  const isDensity = mode === 'density';

  // Format time for display
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;

  // Calculate progress percentage (inverted for conic gradient display)
  const progress = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
  const ringSize = 'min(80vw, 420px)';

  // Determine urgency state
  const isUrgent = seconds <= 10 && seconds > 0;
  const isComplete = seconds === 0 && !isEmom; // EMOM never "completes", it restarts

  const canTogglePause = !!onTogglePause && !isComplete;

  const handleTogglePause = useCallback(() => {
    if (!canTogglePause) return;
    haptic.tick();
    onTogglePause?.();
  }, [canTogglePause, haptic, onTogglePause]);

  // Play sounds at specific intervals (only for REST and DENSITY modes; EMOM handles its own sounds)
  useEffect(() => {
    if (isEmom) return; // EMOM hook handles its own sounds
    if (seconds === lastTickRef.current) return;
    const previousSeconds = lastTickRef.current;
    lastTickRef.current = seconds;

    // If the user added time after the timer hit zero, cancel any pending
    // auto-minimize / completion beeps from the previous countdown.
    if (seconds > 0 && previousSeconds === 0) {
      pendingTimeoutsRef.current.forEach(id => clearTimeout(id));
      pendingTimeoutsRef.current = [];
    }

    // Play tick sounds in the last 5 seconds (REST) or last 10 seconds (DENSITY)
    const tickThreshold = isDensity ? 10 : 5;
    if (soundEnabled && seconds <= tickThreshold && seconds >= 1) {
      playTickSound();
      haptic.tick();
    }

    // Timer just hit zero — play completion cues and auto-minimize.
    // The auto-minimize is independent of soundEnabled so users with
    // sound off still get their timer dismissed automatically.
    if (seconds === 0) {
      const queue = (cb: () => void, delay: number) => {
        const id = setTimeout(() => {
          // Drop completed timeout from the pending list
          pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter(t => t !== id);
          cb();
        }, delay);
        pendingTimeoutsRef.current.push(id);
      };

      if (soundEnabled) {
        playBeepSound();
        queue(() => playBeepSound(), 200);
        queue(() => playBeepSound(), 400);
      }
      haptic.timer();
      // Auto-minimize after a short delay when timer ends
      queue(() => onMinimize(), 1500);
    }
  }, [seconds, soundEnabled, haptic, onMinimize, isEmom, isDensity]);

  // Cancel any pending completion timeouts on unmount so we never call
  // onMinimize / playBeep after the component is gone.
  useEffect(() => {
    return () => {
      pendingTimeoutsRef.current.forEach(id => clearTimeout(id));
      pendingTimeoutsRef.current = [];
    };
  }, []);

  // Keyboard handler for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onMinimize();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (canTogglePause) {
            onTogglePause?.();
          }
          break;
        case '+':
        case '=':
          if (isEmom && onAdjustInterval) {
            onAdjustInterval(5);
          } else {
            onAddTime(30);
          }
          break;
        case '-':
        case '_':
          if (isEmom && onAdjustInterval) {
            onAdjustInterval(-5);
          } else {
            onAddTime(-30);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMinimize, onTogglePause, onAddTime, onAdjustInterval, isEmom, canTogglePause]);

  const handleAddTime = useCallback((amount: number) => {
    haptic.bump();
    onAddTime(amount);
  }, [haptic, onAddTime]);

  const handleAdjustInterval = useCallback((amount: number) => {
    haptic.bump();
    onAdjustInterval?.(amount);
  }, [haptic, onAdjustInterval]);

  const handleStop = useCallback(() => {
    haptic.bump();
    onStop();
  }, [haptic, onStop]);

  const handleMinimize = useCallback(() => {
    haptic.tick();
    onMinimize();
  }, [haptic, onMinimize]);

  const handleToggleSound = useCallback(() => {
    haptic.tick();
    onToggleSound?.();
  }, [haptic, onToggleSound]);

  const handleReset = useCallback(() => {
    // Only reset if there's time to add back and totalSeconds is valid
    if (totalSeconds <= 0) return;

    const diff = totalSeconds - seconds;
    if (diff > 0) {
      haptic.bump();
      onAddTime(diff);
    }
  }, [haptic, totalSeconds, seconds, onAddTime]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col backdrop-blur-2xl fullscreen-timer-container"
      role="dialog"
      aria-label={isEmom ? 'EMOM timer' : isDensity ? 'Density timer' : 'Rest timer'}
      aria-live="polite"
    >
      {/* Top controls */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5">
        <button
          onClick={handleMinimize}
          className="h-12 w-12 rounded-full bg-sys-surfaceContainerHigh text-sys-onSurface flex items-center justify-center active:scale-90 transition-all shadow-elevation-2 hover:shadow-elevation-3"
          aria-label="Minimize timer"
        >
          <ChevronDown size={28} />
        </button>

        {/* Timer mode badge */}
        <div className="px-4 py-2 rounded-full bg-sys-surfaceContainerHigh flex items-center gap-2 border border-sys-outlineVariant shadow-elevation-1">
          <Timer size={20} className="text-sys-primary" />
          <span className="text-sys-onSurface text-sm font-bold uppercase tracking-wider">
            {isEmom ? 'EMOM' : isDensity ? 'Density' : 'Rest Timer'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound toggle */}
          <button
            onClick={handleToggleSound}
            className="h-12 w-12 rounded-full bg-sys-surfaceContainerHigh text-sys-onSurface flex items-center justify-center active:scale-90 transition-all shadow-elevation-2 hover:shadow-elevation-3"
            aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
          </button>

          {/* Cancel timer */}
          <button
            onClick={handleStop}
            className="h-12 w-12 rounded-full bg-sys-surfaceContainerHigh text-sys-onSurface flex items-center justify-center active:scale-90 transition-all shadow-elevation-2 hover:shadow-elevation-3"
            aria-label="Cancel timer"
          >
            <X size={28} />
          </button>
        </div>
      </header>

      {/* Main timer display */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-5 pb-8">
        <div className="text-center flex flex-col items-center gap-4">
          {/* Round counter for EMOM - positioned above time */}
          {isEmom && round > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sys-onSurface/50 text-lg font-bold uppercase tracking-wider">Round</span>
              <span className="text-sys-onSurface text-4xl font-black tabular-nums">
                {totalRounds && totalRounds > 0 ? `${round} of ${totalRounds}` : round}
              </span>
            </div>
          )}

          {/* Main time display wrapped in centered progress ring */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: ringSize, height: ringSize }}
          >
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-700 ease-linear"
              style={{
                borderRadius: '50%',
                background: `conic-gradient(var(--color-primary) 0% ${progress}%, transparent ${progress}% 100%)`,
                opacity: 0.18,
                maskImage: 'radial-gradient(transparent 60%, black 61%)',
                WebkitMaskImage: 'radial-gradient(transparent 60%, black 61%)',
              }}
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={handleTogglePause}
              disabled={!canTogglePause}
              className={`relative z-10 font-mono font-black tracking-tight transition-all duration-300 leading-none tabular-nums ${
                isComplete
                  ? 'text-sys-success text-7xl md:text-8xl drop-shadow-2xl'
                  : isUrgent
                  ? 'text-sys-error text-7xl md:text-9xl animate-pulse drop-shadow-2xl'
                  : 'text-sys-onSurface text-7xl md:text-9xl drop-shadow-lg'
              } ${canTogglePause ? 'cursor-pointer active:scale-95' : 'cursor-default'} ${
                isComplete
                  ? 'px-8 py-5 md:px-10 md:py-6 rounded-md bg-sys-surfaceContainerHigh border border-sys-outlineVariant'
                  : ''
              }`}
              aria-label={canTogglePause ? (isPaused ? 'Resume timer' : 'Pause timer') : 'Timer display'}
            >
              {isComplete ? '✓' : timeString}
            </button>
          </div>

          {/* Subtitle */}
          {!isComplete && isEmom && (
            <p className="text-sys-onSurfaceVariant text-base font-semibold">
              {`${totalSeconds}s intervals`}
            </p>
          )}

          {/* Pause indicator */}
          {isPaused && !isComplete && (
            <div className="mt-2 px-4 py-2 rounded-full bg-sys-surfaceContainerHigh backdrop-blur-md border border-sys-outlineVariant">
              <span className="text-sys-onSurface text-sm font-bold uppercase tracking-wider">Paused</span>
            </div>
          )}
        </div>

        {/* Density rep controls (optional) */}
        {isDensity && densityRepControls && (
          <div className="mt-8 w-full max-w-md">
            <DensityRepControls
              targetReps={densityRepControls.targetReps}
              repChunks={densityRepControls.repChunks}
              isComplete={densityRepControls.isComplete}
              haptic={{ tick: haptic.tick, bump: haptic.bump, success: haptic.success }}
              onUpdateRepChunks={densityRepControls.onUpdateRepChunks}
              onMarkComplete={densityRepControls.onMarkComplete}
            />
          </div>
        )}
      </main>

      {/* Bottom controls */}
      <footer className="relative z-10 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-sys-surface border-t border-sys-outlineVariant">
        {!isComplete && (
          <div className="flex items-center justify-center gap-5">
            {isEmom ? (
              // EMOM controls: Adjust interval
              <>
                <button
                  onClick={() => handleAdjustInterval(-5)}
                  disabled={totalSeconds <= 10}
                  className="h-16 w-16 md:h-18 md:w-18 rounded-3xl bg-sys-surfaceContainerHigh hover:bg-sys-surfaceContainerHighest disabled:opacity-30 text-sys-onSurface flex flex-col items-center justify-center gap-1 active:scale-90 transition-all font-medium"
                  aria-label="Decrease interval by 5 seconds"
                >
                  <Minus size={20} />
                  <span className="text-[10px] uppercase font-bold tracking-wider">5s</span>
                </button>

                <button
                  onClick={() => handleAdjustInterval(5)}
                  disabled={totalSeconds >= 180}
                  className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-sys-primary text-sys-onPrimary hover:opacity-90 disabled:opacity-30 flex items-center justify-center active:scale-95 transition-all shadow-xl shadow-sys-primary/30"
                  aria-label="Increase interval by 5 seconds"
                >
                  <Plus size={28} />
                </button>
              </>
            ) : isDensity ? (
              // Density controls: adjust remaining time
              <>
                <button
                  onClick={() => handleAddTime(-30)}
                  disabled={seconds <= 30}
                  className="h-16 w-16 md:h-18 md:w-18 rounded-3xl bg-sys-surfaceContainerHigh hover:bg-sys-surfaceContainerHighest disabled:opacity-30 text-sys-onSurface flex flex-col items-center justify-center gap-1 active:scale-90 transition-all font-medium"
                  aria-label="Reduce density timer by 30 seconds"
                >
                  <Minus size={20} />
                  <span className="text-[10px] uppercase font-bold tracking-wider">30s</span>
                </button>

                <button
                  onClick={() => handleAddTime(30)}
                  className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-sys-primary text-sys-onPrimary hover:opacity-90 flex items-center justify-center active:scale-95 transition-all shadow-xl shadow-sys-primary/30"
                  aria-label="Add 30 seconds to density timer"
                >
                  <Plus size={28} />
                </button>

                <button
                  onClick={handleStop}
                  className="h-16 w-16 md:h-18 md:w-18 rounded-3xl bg-sys-surfaceContainerHigh hover:bg-sys-surfaceContainerHighest text-sys-onSurface flex items-center justify-center active:scale-90 transition-all"
                  aria-label="Stop timer"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              // REST controls: Add/subtract time
              <>
                <button
                  onClick={() => handleAddTime(-30)}
                  disabled={seconds <= 30}
                  className="h-16 w-16 md:h-18 md:w-18 rounded-3xl bg-sys-surfaceContainerHigh hover:bg-sys-surfaceContainerHighest disabled:opacity-30 text-sys-onSurface flex flex-col items-center justify-center gap-1 active:scale-90 transition-all font-medium"
                  aria-label="Subtract 30 seconds"
                >
                  <Minus size={20} />
                  <span className="text-[10px] uppercase font-bold tracking-wider">30s</span>
                </button>

                <button
                  onClick={() => handleAddTime(30)}
                  className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-sys-primary text-sys-onPrimary hover:opacity-90 flex items-center justify-center active:scale-95 transition-all shadow-xl shadow-sys-primary/30"
                  aria-label="Add 30 seconds"
                >
                  <Plus size={28} />
                </button>

                <button
                  onClick={handleReset}
                  disabled={seconds === totalSeconds || totalSeconds <= 0}
                  className="h-16 w-16 md:h-18 md:w-18 rounded-3xl bg-sys-surfaceContainerHigh hover:bg-sys-surfaceContainerHighest disabled:opacity-30 text-sys-onSurface flex items-center justify-center active:scale-90 transition-all"
                  aria-label="Reset timer"
                >
                  <RotateCcw size={20} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Complete state - prominent continue button (REST mode only) */}
        {isComplete && (
          <button
            onClick={handleStop}
            className="w-full max-w-md mx-auto h-14 rounded-2xl bg-sys-primary text-sys-onPrimary font-bold text-lg active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
            aria-label="Continue workout"
          >
            Continue Workout
          </button>
        )}

        {/* Bottom hint text */}
        <p className="text-center text-sys-onSurfaceVariant/60 text-sm mt-6">
          {isComplete
            ? '✨ Rest complete - Time for your next set!'
            : isEmom
            ? 'Press ESC to minimize • Space to pause • +/- to adjust'
            : 'Press ESC to minimize • Space to pause • +/- to adjust time'}
        </p>
      </footer>
    </div>
  );
};
