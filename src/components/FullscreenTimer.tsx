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
  const isEmom = mode === 'emom';
  const isDensity = mode === 'density';

  // Format time for display
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;

  // Calculate progress percentage (inverted for conic gradient display)
  const progress = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;

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
    if (!soundEnabled || seconds === lastTickRef.current) return;
    lastTickRef.current = seconds;

    // Play tick sounds in the last 5 seconds (REST) or last 10 seconds (DENSITY)
    const tickThreshold = isDensity ? 10 : 5;
    if (seconds <= tickThreshold && seconds >= 1) {
      playTickSound();
      haptic.tick();
    }

    // Play beep when timer completes
    if (seconds === 0) {
      playBeepSound();
      // Play completion sequence (3 beeps)
      setTimeout(() => playBeepSound(), 200);
      setTimeout(() => playBeepSound(), 400);
      haptic.timer();
      // Auto-minimize after a short delay when timer ends
      setTimeout(() => onMinimize(), 1500);
    }
  }, [seconds, soundEnabled, haptic, onMinimize, isEmom, isDensity]);

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
      {/* Subtle background ring for visual progress indication */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-1000 ease-linear"
        style={{
          width: '120vw',
          maxWidth: '600px',
          height: '120vw',
          maxHeight: '600px',
          borderRadius: '50%',
          background: `conic-gradient(var(--color-primary) 0% ${progress}%, transparent ${progress}% 100%)`,
          opacity: 0.1,
        }}
      />

      {/* Top controls */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5">
        <button
          onClick={handleMinimize}
          className="h-12 w-12 rounded-full bg-sys-surfaceContainerHigh text-sys-onSurface flex items-center justify-center active:scale-90 transition-all shadow-sm"
          aria-label="Minimize timer"
        >
          <ChevronDown size={28} />
        </button>

        {/* Timer mode badge */}
        <div className="px-4 py-2 rounded-full bg-sys-surfaceContainerHigh flex items-center gap-2 border border-sys-outlineVariant shadow-sm">
          <Timer size={20} className="text-sys-primary" />
          <span className="text-sys-onSurface text-sm font-bold uppercase tracking-wider">
            {isEmom ? 'EMOM' : isDensity ? 'Density' : 'Rest Timer'}
          </span>
        </div>

        {/* Sound toggle */}
        <button
          onClick={handleToggleSound}
          className="h-12 w-12 rounded-full bg-sys-surfaceContainerHigh text-sys-onSurface flex items-center justify-center active:scale-90 transition-all shadow-sm"
          aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
        >
          {soundEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
        </button>
      </header>

      {/* Main timer display */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-5 pb-8">
        <div className="text-center flex flex-col items-center gap-4">
          {/* Round counter for EMOM - positioned above time */}
          {isEmom && round > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sys-onSurface/50 text-lg font-bold uppercase tracking-wider">Round</span>
              <span className="text-sys-onSurface text-4xl font-black tabular-nums">{round}</span>
            </div>
          )}

          {/* Main time display */}
          <button
            type="button"
            onClick={handleTogglePause}
            disabled={!canTogglePause}
            className={`font-mono font-black tracking-tight transition-all duration-300 leading-none tabular-nums ${
              isComplete
                ? 'text-sys-success text-8xl drop-shadow-2xl'
                : isUrgent
                ? 'text-sys-error text-8xl md:text-9xl animate-pulse drop-shadow-2xl'
                : 'text-sys-onSurface text-8xl md:text-9xl drop-shadow-lg'
            } ${canTogglePause ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
            aria-label={canTogglePause ? (isPaused ? 'Resume timer' : 'Pause timer') : 'Timer display'}
          >
            {isComplete ? '✓' : timeString}
          </button>

          {/* Subtitle */}
          {!isComplete && (
            <p className="text-sys-onSurfaceVariant text-base font-semibold">
              {isEmom ? `${totalSeconds}s intervals` : `${Math.round(progress)}% remaining`}
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
      <footer className="relative z-10 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-sys-surface via-sys-surface/95 to-transparent">
        {!isComplete && (
          <div className="flex items-center justify-center gap-5">
            {isEmom ? (
              // EMOM controls: Adjust interval
              <>
                <button
                  onClick={() => handleAdjustInterval(-5)}
                  disabled={totalSeconds <= 10}
                  className="h-18 w-18 rounded-3xl bg-sys-surfaceContainerHigh hover:bg-sys-surfaceContainerHighest disabled:opacity-30 text-sys-onSurface flex flex-col items-center justify-center gap-1 active:scale-90 transition-all"
                  aria-label="Decrease interval by 5 seconds"
                >
                  <Minus size={24} />
                  <span className="text-xs font-bold">10s</span>
                </button>

                <button
                  onClick={() => handleAdjustInterval(5)}
                  disabled={totalSeconds >= 180}
                  className="h-24 w-24 rounded-full bg-sys-primary text-sys-onPrimary hover:opacity-90 disabled:opacity-30 flex items-center justify-center active:scale-95 transition-all shadow-xl shadow-sys-primary/30"
                  aria-label="Increase interval by 5 seconds"
                >
                  <Plus size={32} />
                </button>
              </>
            ) : isDensity ? (
              // Density controls: adjust remaining time
              <>
                <button
                  onClick={() => handleAddTime(-30)}
                  disabled={seconds <= 30}
                  className="h-18 w-18 rounded-3xl bg-sys-surfaceContainerHigh hover:bg-sys-surfaceContainerHighest disabled:opacity-30 text-sys-onSurface flex flex-col items-center justify-center gap-1 active:scale-90 transition-all"
                  aria-label="Reduce density timer by 30 seconds"
                >
                  <Minus size={24} />
                  <span className="text-xs font-bold">30s</span>
                </button>

                <button
                  onClick={() => handleAddTime(30)}
                  className="h-24 w-24 rounded-full bg-sys-primary text-sys-onPrimary hover:opacity-90 flex items-center justify-center active:scale-95 transition-all shadow-xl shadow-sys-primary/30"
                  aria-label="Add 30 seconds to density timer"
                >
                  <Plus size={32} />
                </button>

                <button
                  onClick={handleStop}
                  className="h-18 w-18 rounded-3xl bg-sys-surfaceContainerHigh hover:bg-sys-surfaceContainerHighest text-sys-onSurface flex items-center justify-center active:scale-90 transition-all"
                  aria-label="Stop timer"
                >
                  <X size={24} />
                </button>
              </>
            ) : (
              // REST controls: Add/subtract time
              <>
                <button
                  onClick={() => handleAddTime(-30)}
                  disabled={seconds <= 30}
                  className="h-18 w-18 rounded-3xl bg-sys-surfaceContainerHigh hover:bg-sys-surfaceContainerHighest disabled:opacity-30 text-sys-onSurface flex flex-col items-center justify-center gap-1 active:scale-90 transition-all"
                  aria-label="Subtract 30 seconds"
                >
                  <Minus size={24} />
                  <span className="text-xs font-bold">30s</span>
                </button>

                <button
                  onClick={() => handleAddTime(30)}
                  className="h-24 w-24 rounded-full bg-sys-primary text-sys-onPrimary hover:opacity-90 flex items-center justify-center active:scale-95 transition-all shadow-xl shadow-sys-primary/30"
                  aria-label="Add 30 seconds"
                >
                  <Plus size={32} />
                </button>

                <button
                  onClick={handleReset}
                  disabled={seconds === totalSeconds || totalSeconds <= 0}
                  className="h-18 w-18 rounded-3xl bg-sys-surfaceContainerHigh hover:bg-sys-surfaceContainerHighest disabled:opacity-30 text-sys-onSurface flex items-center justify-center active:scale-90 transition-all"
                  aria-label="Reset timer"
                >
                  <RotateCcw size={24} />
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
