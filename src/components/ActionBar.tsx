/**
 * ActionBar Component
 *
 * Bottom action bar with EMOM timer display and rest timer display.
 * Both timers can be expanded to fullscreen mode.
 * Only renders when a timer is active.
 */

import { useState, useCallback, useEffect } from 'react';
import { useHaptic } from '../hooks';
import { X, Minus, Plus, Maximize2, Repeat } from 'lucide-react';
import { FullscreenTimer } from './FullscreenTimer';
import { safeGetJSON, safeSetJSON } from '../utils/storage';

export interface TimerState {
  time: number;
  active: boolean;
  /** Total time the timer was started with (for progress calculation) */
  totalTime?: number;
}

export interface EmomState {
  active: boolean;
  seconds: number;
  interval: number;
  /** Current round number (1-based) */
  round?: number;
}

export interface ActionBarProps {
  timerState: TimerState;
  setTimerActive: (active: boolean) => void;
  setTimerSeconds: (seconds: number | ((s: number) => number)) => void;
  emomState?: EmomState;
  setEmomActive?: (active: boolean) => void;
  setEmomSeconds?: (seconds: number | ((s: number) => number)) => void;
  setEmomInterval?: (interval: number | ((i: number) => number)) => void;
}

export function ActionBar({
  timerState,
  setTimerActive,
  setTimerSeconds,
  emomState,
  setEmomActive,
  setEmomSeconds,
  setEmomInterval,
}: ActionBarProps) {
  const haptic = useHaptic();
  const [isRestFullscreen, setIsRestFullscreen] = useState(false);
  const [isEmomFullscreen, setIsEmomFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() =>
    safeGetJSON<boolean>('rest_timer_sound', true) ?? true
  );

  // Track total time when timer starts
  const [totalTime, setTotalTime] = useState(timerState.totalTime ?? timerState.time);

  // Update total time when timer starts fresh (time increases or resets to new value)
  useEffect(() => {
    if (timerState.time > 0 && timerState.time > totalTime) {
      setTotalTime(timerState.time);
    }
    // Reset total time when timer is stopped
    if (timerState.time === 0 && !timerState.active) {
      setTotalTime(0);
    }
  }, [timerState.time, timerState.active, totalTime]);

  // Also capture initial total time from props if provided
  useEffect(() => {
    if (timerState.totalTime && timerState.totalTime > 0) {
      setTotalTime(timerState.totalTime);
    }
  }, [timerState.totalTime]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      safeSetJSON('rest_timer_sound', newValue);
      return newValue;
    });
  }, []);

  // REST timer handlers
  const handleExpandRest = useCallback(() => {
    haptic.tick();
    setIsRestFullscreen(true);
  }, [haptic]);

  const handleMinimizeRest = useCallback(() => {
    haptic.tick();
    setIsRestFullscreen(false);
  }, [haptic]);

  const handleStopRest = useCallback(() => {
    setTimerActive(false);
    setTimerSeconds(0);
    setIsRestFullscreen(false);
  }, [setTimerActive, setTimerSeconds]);

  const handleAddTime = useCallback((amount: number) => {
    setTimerSeconds((s: number) => Math.max(0, s + amount));
    // Also increase total time to maintain progress bar accuracy
    if (amount > 0) {
      setTotalTime(prev => prev + amount);
    }
  }, [setTimerSeconds]);

  // EMOM timer handlers
  const handleExpandEmom = useCallback(() => {
    haptic.tick();
    setIsEmomFullscreen(true);
  }, [haptic]);

  const handleMinimizeEmom = useCallback(() => {
    haptic.tick();
    setIsEmomFullscreen(false);
  }, [haptic]);

  const handleStopEmom = useCallback(() => {
    setEmomActive?.(false);
    setEmomSeconds?.(0);
    setIsEmomFullscreen(false);
  }, [setEmomActive, setEmomSeconds]);

  const handleAdjustEmomInterval = useCallback((amount: number) => {
    setEmomInterval?.((i: number) => {
      const newInterval = i + amount;
      return Math.min(180, Math.max(10, newInterval));
    });
  }, [setEmomInterval]);

  // Only show the action bar if there's an active timer
  const hasActiveTimer = timerState.time > 0 || emomState?.active;

  // Render fullscreen REST timer if expanded
  if (isRestFullscreen && timerState.time > 0) {
    return (
      <FullscreenTimer
        mode="rest"
        seconds={timerState.time}
        totalSeconds={totalTime}
        onStop={handleStopRest}
        onAddTime={handleAddTime}
        onMinimize={handleMinimizeRest}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
    );
  }

  // Render fullscreen EMOM timer if expanded
  if (isEmomFullscreen && emomState?.active) {
    return (
      <FullscreenTimer
        mode="emom"
        seconds={emomState.seconds}
        totalSeconds={emomState.interval}
        round={emomState.round}
        onStop={handleStopEmom}
        onAddTime={() => {}} // EMOM doesn't use add time
        onMinimize={handleMinimizeEmom}
        onAdjustInterval={handleAdjustEmomInterval}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
    );
  }

  if (!hasActiveTimer) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-sys-black border-t border-white/10 z-50 safe-pb">
      {/* EMOM Timer Display */}
      {emomState?.active && setEmomActive && setEmomSeconds && setEmomInterval && (
        <div className="px-4 pt-3 pb-2">
          <div className="glass-panel px-5 py-4 rounded-2xl shadow-lg animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              {/* Expand button */}
              <button
                onClick={handleExpandEmom}
                className="h-8 w-8 rounded-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 flex items-center justify-center active:scale-90 transition-all"
                aria-label="Expand EMOM timer to fullscreen"
              >
                <Maximize2 size={16} />
              </button>
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                EMOM
              </span>
              {/* Round counter */}
              {emomState.round !== undefined && emomState.round > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/20">
                  <Repeat size={12} className="text-violet-300" />
                  <span className="text-xs font-bold text-violet-300">
                    Round {emomState.round}
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  haptic.bump();
                  setEmomActive(false);
                  setEmomSeconds(0);
                }}
                className="ml-auto h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
                aria-label="Stop EMOM timer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`text-3xl font-mono font-bold min-w-[90px] transition-colors ${
                  emomState.seconds <= 5
                    ? 'text-sys-error animate-pulse'
                    : 'text-white'
                }`}
              >
                {Math.floor(emomState.seconds / 60)}:
                {emomState.seconds % 60 < 10 ? '0' : ''}
                {emomState.seconds % 60}
              </span>
              <div className="h-6 w-[1px] bg-white/20"></div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    haptic.bump();
                    setEmomInterval((i: number) => Math.max(10, i - 5));
                  }}
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
                  aria-label="Decrease interval by 5 seconds"
                >
                  <Minus size={20} />
                </button>
                <span className="text-sm text-sys-onSurfaceVar font-semibold min-w-[40px] text-center">
                  {emomState.interval}s
                </span>
                <button
                  onClick={() => {
                    haptic.bump();
                    setEmomInterval((i: number) => Math.min(180, i + 5));
                  }}
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
                  aria-label="Increase interval by 5 seconds"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest Timer Display */}
      {timerState.time > 0 && (
        <div className="px-4 pt-3 pb-3">
          <div className="glass-panel px-5 py-4 rounded-2xl flex items-center gap-4 shadow-lg animate-slide-up">
            <button
              onClick={handleExpandRest}
              className="h-10 w-10 min-w-[40px] rounded-full bg-white/10 hover:bg-white/20 text-sys-accent flex items-center justify-center active:scale-90 transition-all"
              aria-label="Expand timer to fullscreen"
            >
              <Maximize2 size={20} />
            </button>
            <span className="text-2xl font-mono font-bold text-white min-w-[80px]">
              {Math.floor(timerState.time / 60)}:
              {timerState.time % 60 < 10 ? '0' : ''}
              {timerState.time % 60}
            </span>
            <div className="h-6 w-[1px] bg-white/20"></div>
            <button
              onClick={() => {
                haptic.bump();
                setTimerActive(false);
                setTimerSeconds(0);
              }}
              className="h-10 w-10 min-w-[40px] rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
              aria-label="Cancel timer"
            >
              <X size={20} />
            </button>
            <button
              onClick={() => {
                haptic.bump();
                setTimerSeconds((s: number) => s + 30);
              }}
              className="text-sys-accent font-bold text-base px-3 py-2 min-h-[44px]"
            >
              +30s
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
