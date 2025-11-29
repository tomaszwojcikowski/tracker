/**
 * FullscreenRestTimer Component
 *
 * A prominent, fullscreen rest timer that can be viewed from a distance.
 * Features large countdown display, sound alerts, and can be minimized.
 * Designed for gym use with high visibility and easy controls.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X, Minimize2, Volume2, VolumeX, Plus, Minus, RotateCcw } from 'lucide-react';
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

  // Calculate progress percentage (remaining time)
  const progress = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;

  // Determine urgency state
  const isUrgent = seconds <= 10 && seconds > 0;
  const isWarning = seconds <= 30 && seconds > 10;
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

  const handleReset = useCallback(() => {
    haptic.bump();
    // Reset to total seconds by adding the difference
    const diff = totalSeconds - seconds;
    if (diff > 0) {
      onAddTime(diff);
    }
  }, [haptic, totalSeconds, seconds, onAddTime]);

  // Calculate circumference and offset for progress ring
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  // Dynamic gradient based on state
  const getGradientColors = () => {
    if (isComplete) return { from: '#22c55e', to: '#4ade80' }; // Green
    if (isUrgent) return { from: '#ef4444', to: '#f87171' }; // Red
    if (isWarning) return { from: '#f59e0b', to: '#fbbf24' }; // Amber
    return { from: '#0ea5e9', to: '#38bdf8' }; // Sky blue (primary)
  };
  const gradientColors = getGradientColors();

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-500 ${
        isComplete
          ? 'bg-gradient-to-br from-green-900 via-green-800 to-emerald-900'
          : isUrgent
          ? 'bg-gradient-to-br from-red-900 via-red-800 to-rose-900'
          : isWarning
          ? 'bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900'
          : 'bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900'
      }`}
      role="dialog"
      aria-label="Rest timer"
      aria-live="polite"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ${
            isComplete ? 'bg-green-500/30' : isUrgent ? 'bg-red-500/30' : isWarning ? 'bg-amber-500/30' : 'bg-sky-500/20'
          }`}
          style={{ animation: 'pulse 4s ease-in-out infinite' }}
        />
        <div 
          className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl transition-all duration-1000 ${
            isComplete ? 'bg-emerald-500/25' : isUrgent ? 'bg-rose-500/25' : isWarning ? 'bg-orange-500/25' : 'bg-cyan-500/15'
          }`}
          style={{ animation: 'pulse 5s ease-in-out infinite reverse' }}
        />
      </div>

      {/* Top controls - Glassmorphism style */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          onClick={handleMinimize}
          className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg"
          aria-label="Minimize timer"
        >
          <Minimize2 size={26} />
        </button>

        <div className="flex gap-3">
          {onToggleSound && (
            <button
              onClick={() => { haptic.tick(); onToggleSound(); }}
              className={`h-14 w-14 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-90 transition-all shadow-lg ${
                soundEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-white/50'
              }`}
              aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 size={26} /> : <VolumeX size={26} />}
            </button>
          )}

          <button
            onClick={handleStop}
            className="h-14 w-14 rounded-2xl bg-red-500/20 backdrop-blur-md border border-red-400/30 hover:bg-red-500/30 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg"
            aria-label="Stop timer"
          >
            <X size={26} />
          </button>
        </div>
      </div>

      {/* Main timer display */}
      <div className="relative flex flex-col items-center">
        {/* Progress ring with gradient */}
        <div className="relative">
          <svg
            className="transform -rotate-90 drop-shadow-2xl"
            width="320"
            height="320"
            viewBox="0 0 320 320"
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradientColors.from} />
                <stop offset="100%" stopColor={gradientColors.to} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Background circle with subtle pattern */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="12"
              fill="none"
            />
            
            {/* Progress circle with gradient and glow */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="url(#progressGradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              filter="url(#glow)"
              className={`transition-all duration-1000 ease-linear ${
                isUrgent ? 'animate-pulse' : ''
              }`}
            />
            
            {/* Inner decorative ring */}
            <circle
              cx="160"
              cy="160"
              r="120"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
              fill="none"
            />
          </svg>

          {/* Time display - centered in ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-mono font-black tracking-tight transition-all duration-300 ${
                isComplete
                  ? 'text-white text-8xl drop-shadow-lg'
                  : isUrgent
                  ? 'text-white text-[6.5rem] animate-pulse drop-shadow-lg'
                  : 'text-white text-[6.5rem] drop-shadow-md'
              }`}
            >
              {isComplete ? '✓' : timeString}
            </span>
            {!isComplete && (
              <div className="flex flex-col items-center mt-2">
                <span className="text-white/70 text-xl font-semibold uppercase tracking-[0.25em]">
                  Rest
                </span>
                <span className="text-white/40 text-sm mt-1">
                  {Math.round(progress)}% remaining
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Time adjustment controls */}
        {!isComplete && (
          <div className="flex items-center gap-4 mt-10">
            <button
              onClick={() => handleAddTime(-30)}
              disabled={seconds <= 30}
              className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg"
              aria-label="Subtract 30 seconds"
            >
              <Minus size={28} />
            </button>

            <button
              onClick={() => handleAddTime(30)}
              className="h-16 px-8 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 text-white font-bold text-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
              aria-label="Add 30 seconds"
            >
              <Plus size={22} />
              <span>30s</span>
            </button>

            <button
              onClick={handleReset}
              disabled={seconds >= totalSeconds}
              className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg"
              aria-label="Reset timer"
            >
              <RotateCcw size={24} />
            </button>
          </div>
        )}

        {/* Complete state - prominent dismiss button */}
        {isComplete && (
          <button
            onClick={handleStop}
            className="mt-10 px-10 py-5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 text-white font-bold text-xl active:scale-95 transition-all shadow-xl"
          >
            Continue Workout
          </button>
        )}
      </div>

      {/* Bottom hint text */}
      <p className="absolute bottom-0 left-0 right-0 text-center text-white/40 text-sm pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {isComplete ? '✨ Rest complete - Time for your next set!' : 'Swipe down or press ESC to minimize'}
      </p>
    </div>
  );
};

export default FullscreenRestTimer;
