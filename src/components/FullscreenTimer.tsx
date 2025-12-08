/**
 * FullscreenTimer Component
 *
 * A unified fullscreen timer that supports both REST and EMOM modes.
 * Features large countdown display, sound alerts, and can be minimized.
 * Designed for gym use with high visibility and easy controls.
 *
 * REST Mode: Countdown timer that ends at 0
 * EMOM Mode: Repeating interval timer with round counter
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X, Minimize2, Volume2, VolumeX, Plus, Minus, RotateCcw, Timer, Repeat } from './icons';
import { playTickSound, playBeepSound } from '../utils/audio';
import { useHaptic } from '../hooks';

// ============================================================================
// TYPES
// ============================================================================

export type TimerMode = 'rest' | 'emom';

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
  /** Whether sound is enabled */
  soundEnabled?: boolean;
  /** Callback to toggle sound */
  onToggleSound?: () => void;
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
  soundEnabled = true,
  onToggleSound,
}) => {
  const haptic = useHaptic();
  const lastTickRef = useRef<number>(-1);
  const isEmom = mode === 'emom';

  // Format time for display
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;

  // Calculate progress percentage
  const progress = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;

  // Determine urgency state
  const isUrgent = seconds <= 10 && seconds > 0;
  const isWarning = seconds <= 30 && seconds > 10;
  const isComplete = seconds === 0 && !isEmom; // EMOM never "completes", it restarts

  // Play sounds at specific intervals (only for REST mode; EMOM handles its own sounds)
  useEffect(() => {
    if (isEmom) return; // EMOM hook handles its own sounds
    if (!soundEnabled || seconds === lastTickRef.current) return;
    lastTickRef.current = seconds;

    // Play tick sounds in the last 5 seconds
    if (seconds <= 5 && seconds >= 1) {
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
  }, [seconds, soundEnabled, haptic, onMinimize, isEmom]);

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
          onStop();
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
  }, [onMinimize, onStop, onAddTime, onAdjustInterval, isEmom]);

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

  const handleReset = useCallback(() => {
    // Only reset if there's time to add back and totalSeconds is valid
    if (totalSeconds <= 0) return;

    const diff = totalSeconds - seconds;
    if (diff > 0) {
      haptic.bump();
      onAddTime(diff);
    }
  }, [haptic, totalSeconds, seconds, onAddTime]);

  // Calculate circumference and offset for progress ring
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  // Dynamic colors based on mode and state
  const getGradientColors = () => {
    if (isComplete) return { from: '#22c55e', to: '#4ade80' }; // Green
    if (isUrgent) return { from: '#ef4444', to: '#f87171' }; // Red
    if (isWarning) return { from: '#f59e0b', to: '#fbbf24' }; // Amber
    if (isEmom) return { from: '#8b5cf6', to: '#a78bfa' }; // Purple for EMOM
    return { from: '#0ea5e9', to: '#38bdf8' }; // Sky blue for REST
  };
  const gradientColors = getGradientColors();

  // Background gradient based on mode and state
  const getBackgroundClass = () => {
    if (isComplete) return 'bg-gradient-to-br from-green-900 via-green-800 to-emerald-900';
    if (isUrgent) return 'bg-gradient-to-br from-red-900 via-red-800 to-rose-900';
    if (isWarning) return 'bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900';
    if (isEmom) return 'bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950';
    return 'bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900';
  };

  // Animated background blob colors
  const getBlobColors = () => {
    if (isComplete) return { blob1: 'bg-green-500/30', blob2: 'bg-emerald-500/25' };
    if (isUrgent) return { blob1: 'bg-red-500/30', blob2: 'bg-rose-500/25' };
    if (isWarning) return { blob1: 'bg-amber-500/30', blob2: 'bg-orange-500/25' };
    if (isEmom) return { blob1: 'bg-violet-500/25', blob2: 'bg-purple-500/20' };
    return { blob1: 'bg-sky-500/20', blob2: 'bg-cyan-500/15' };
  };
  const blobColors = getBlobColors();

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-500 ${getBackgroundClass()}`}
      role="dialog"
      aria-label={isEmom ? 'EMOM timer' : 'Rest timer'}
      aria-live="polite"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ${blobColors.blob1}`}
          style={{ animation: 'pulse 4s ease-in-out infinite' }}
        />
        <div
          className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl transition-all duration-1000 ${blobColors.blob2}`}
          style={{ animation: 'pulse 5s ease-in-out infinite reverse' }}
        />
      </div>

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          onClick={handleMinimize}
          className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg"
          aria-label="Minimize timer"
        >
          <Minimize2 size={22} />
        </button>

        {/* Mode indicator badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${
          isEmom
            ? 'bg-violet-500/20 border-violet-400/30 text-violet-200'
            : 'bg-sky-500/20 border-sky-400/30 text-sky-200'
        }`}>
          {isEmom ? <Repeat size={16} /> : <Timer size={16} />}
          <span className="text-sm font-semibold uppercase tracking-wider">
            {isEmom ? 'EMOM' : 'Rest'}
          </span>
        </div>

        <div className="flex gap-3">
          {onToggleSound && (
            <button
              onClick={() => { haptic.tick(); onToggleSound(); }}
              className={`h-12 w-12 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-90 transition-all shadow-lg ${
                soundEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-white/50'
              }`}
              aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>
          )}

          <button
            onClick={handleStop}
            className="h-12 w-12 rounded-2xl bg-red-500/20 backdrop-blur-md border border-red-400/30 hover:bg-red-500/30 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg"
            aria-label="Stop timer"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main timer display */}
      <div className="relative flex flex-col items-center">
        {/* Progress ring */}
        <div className="relative">
          <svg
            className="transform -rotate-90 drop-shadow-2xl"
            width="300"
            height="300"
            viewBox="0 0 320 320"
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="timerProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradientColors.from} />
                <stop offset="100%" stopColor={gradientColors.to} />
              </linearGradient>
              <filter id="timerGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background circle */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
              fill="none"
            />

            {/* Progress circle */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="url(#timerProgressGradient)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              filter="url(#timerGlow)"
              className={`transition-all duration-1000 ease-linear ${
                isUrgent ? 'animate-pulse' : ''
              }`}
            />
          </svg>

          {/* Time display - centered in ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Round counter for EMOM - positioned above time */}
            {isEmom && round > 0 && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/50 text-lg font-medium uppercase tracking-wider">Round</span>
                <span className="text-white text-3xl font-bold tabular-nums">{round}</span>
              </div>
            )}

            {/* Main time display */}
            <span
              className={`font-mono font-black tracking-tight transition-all duration-300 leading-none ${
                isComplete
                  ? 'text-white text-7xl drop-shadow-lg'
                  : isUrgent
                  ? 'text-white text-7xl animate-pulse drop-shadow-lg'
                  : 'text-white text-7xl drop-shadow-md'
              }`}
            >
              {isComplete ? '✓' : timeString}
            </span>

            {/* Subtitle */}
            {!isComplete && (
              <div className="flex flex-col items-center mt-3">
                {isEmom ? (
                  <span className="text-white/50 text-base font-medium">
                    {totalSeconds}s intervals
                  </span>
                ) : (
                  <span className="text-white/50 text-base font-medium">
                    {Math.round(progress)}% remaining
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        {!isComplete && (
          <div className="flex items-center gap-3 mt-8">
            {isEmom ? (
              // EMOM controls: Adjust interval
              <>
                <button
                  onClick={() => handleAdjustInterval(-5)}
                  disabled={totalSeconds <= 10}
                  className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg"
                  aria-label="Decrease interval by 5 seconds"
                >
                  <Minus size={24} />
                </button>

                <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 min-w-[100px] text-center">
                  <span className="text-white/60 text-xs uppercase tracking-wider block">Interval</span>
                  <span className="text-white font-bold text-xl">{totalSeconds}s</span>
                </div>

                <button
                  onClick={() => handleAdjustInterval(5)}
                  disabled={totalSeconds >= 180}
                  className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg"
                  aria-label="Increase interval by 5 seconds"
                >
                  <Plus size={24} />
                </button>
              </>
            ) : (
              // REST controls: Add/subtract time
              <>
                <button
                  onClick={() => handleAddTime(-30)}
                  disabled={seconds <= 30}
                  className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg"
                  aria-label="Subtract 30 seconds"
                >
                  <Minus size={24} />
                </button>

                <button
                  onClick={() => handleAddTime(30)}
                  className="h-14 px-6 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 hover:bg-white/25 text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                  aria-label="Add 30 seconds"
                >
                  <Plus size={20} />
                  <span>30s</span>
                </button>

                <button
                  onClick={handleReset}
                  disabled={seconds === totalSeconds || totalSeconds <= 0}
                  className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg"
                  aria-label="Reset timer"
                >
                  <RotateCcw size={22} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Complete state - prominent dismiss button (REST mode only) */}
        {isComplete && (
          <button
            onClick={handleStop}
            className="mt-8 px-8 py-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 text-white font-bold text-lg active:scale-95 transition-all shadow-xl"
          >
            Continue Workout
          </button>
        )}
      </div>

      {/* Bottom hint text */}
      <p className="absolute bottom-0 left-0 right-0 text-center text-white/40 text-sm pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {isComplete
          ? '✨ Rest complete - Time for your next set!'
          : isEmom
          ? 'Press ESC to minimize • +/- to adjust interval'
          : 'Press ESC to minimize • +/- to adjust time'}
      </p>
    </div>
  );
};
