/**
 * FullscreenRestTimer Component
 *
 * A prominent, fullscreen rest timer that can be viewed from a distance.
 * Features large countdown display, sound alerts, and can be minimized.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X, Minimize2, Volume2, VolumeX, Plus, Minus } from 'lucide-react';
import { playTickSound, playBeepSound } from '../utils/audio';
import { useHaptic } from '../hooks';

export interface FullscreenRestTimerProps {
  seconds: number;
  totalSeconds: number;
  onStop: () => void;
  onAddTime: (amount: number) => void;
  onMinimize: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

/**
 * Fullscreen rest timer with large, visible countdown.
 * Designed to be readable from across the gym.
 */
export const FullscreenRestTimer: React.FC<FullscreenRestTimerProps> = ({
  seconds,
  totalSeconds,
  onStop,
  onAddTime,
  onMinimize,
  soundEnabled = true,
  onToggleSound,
}) => {
  const haptic = useHaptic();
  const lastTickRef = useRef<number>(-1);

  // Format time for display
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;

  // Calculate progress percentage
  const progress = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;

  // Determine urgency state
  const isUrgent = seconds <= 10 && seconds > 0;
  const isComplete = seconds === 0;

  // Play sounds at specific intervals
  useEffect(() => {
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
  }, [seconds, soundEnabled, haptic, onMinimize]);

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
          onAddTime(30);
          break;
        case '-':
        case '_':
          onAddTime(-30);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMinimize, onStop, onAddTime]);

  const handleAddTime = useCallback((amount: number) => {
    haptic.bump();
    onAddTime(amount);
  }, [haptic, onAddTime]);

  const handleStop = useCallback(() => {
    haptic.bump();
    onStop();
  }, [haptic, onStop]);

  const handleMinimize = useCallback(() => {
    haptic.tick();
    onMinimize();
  }, [haptic, onMinimize]);

  // Dynamic background color based on urgency
  const bgColor = isComplete
    ? 'bg-sys-success'
    : isUrgent
    ? 'bg-sys-error'
    : 'bg-sys-black';

  return (
    <div
      className={`fixed inset-0 z-[100] ${bgColor} flex flex-col items-center justify-center transition-colors duration-300`}
      role="dialog"
      aria-label="Rest timer"
      aria-live="polite"
    >
      {/* Top controls */}
      <div className="absolute top-safe-top left-0 right-0 flex items-center justify-between px-4 pt-4">
        <button
          onClick={handleMinimize}
          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
          aria-label="Minimize timer"
        >
          <Minimize2 size={24} />
        </button>

        {onToggleSound && (
          <button
            onClick={() => { haptic.tick(); onToggleSound(); }}
            className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
            aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        )}

        <button
          onClick={handleStop}
          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
          aria-label="Stop timer"
        >
          <X size={24} />
        </button>
      </div>

      {/* Progress ring */}
      <div className="relative mb-8">
        <svg
          className="transform -rotate-90"
          width="280"
          height="280"
          viewBox="0 0 280 280"
        >
          {/* Background circle */}
          <circle
            cx="140"
            cy="140"
            r="130"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="140"
            cy="140"
            r="130"
            stroke={isComplete ? '#4ade80' : isUrgent ? 'white' : 'currentColor'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 130}
            strokeDashoffset={2 * Math.PI * 130 * (1 - progress / 100)}
            className={`transition-all duration-1000 ease-linear ${
              isUrgent ? 'animate-pulse text-white' : 'text-sys-accent'
            }`}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono font-black tracking-tight transition-all duration-300 ${
              isComplete
                ? 'text-white text-8xl'
                : isUrgent
                ? 'text-white text-9xl animate-pulse'
                : 'text-white text-9xl'
            }`}
          >
            {isComplete ? '✓' : timeString}
          </span>
          {!isComplete && (
            <span className="text-white/60 text-lg font-medium mt-2 uppercase tracking-widest">
              Rest
            </span>
          )}
        </div>
      </div>

      {/* Time adjustment buttons */}
      {!isComplete && (
        <div className="flex items-center gap-6 mb-8">
          <button
            onClick={() => handleAddTime(-30)}
            disabled={seconds <= 30}
            className="h-16 w-16 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all"
            aria-label="Subtract 30 seconds"
          >
            <Minus size={32} />
          </button>

          <button
            onClick={() => handleAddTime(30)}
            className="h-20 w-32 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xl flex items-center justify-center active:scale-95 transition-all"
            aria-label="Add 30 seconds"
          >
            +30s
          </button>

          <button
            onClick={() => handleAddTime(60)}
            className="h-16 w-16 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
            aria-label="Add 60 seconds"
          >
            <Plus size={32} />
          </button>
        </div>
      )}

      {/* Complete state - tap anywhere to dismiss */}
      {isComplete && (
        <button
          onClick={handleStop}
          className="px-8 py-4 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xl active:scale-95 transition-all"
        >
          Tap to Dismiss
        </button>
      )}

      {/* Hint text */}
      <p className="absolute bottom-safe-bottom text-white/40 text-sm pb-4">
        {isComplete ? 'Timer complete!' : 'Tap minimize to return to workout'}
      </p>
    </div>
  );
};

export default FullscreenRestTimer;
