/**
 * ActionBar Component
 *
 * Bottom action bar with EMOM timer display and rest timer display.
 * Only renders when a timer is active.
 */

import { useHaptic } from '../hooks';
import { X, Minus, Plus } from 'lucide-react';

export interface TimerState {
  time: number;
  active: boolean;
}

export interface EmomState {
  active: boolean;
  seconds: number;
  interval: number;
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

  // Only show the action bar if there's an active timer
  const hasActiveTimer = timerState.time > 0 || emomState?.active;

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
              <span className="text-xs font-semibold text-sys-accent uppercase tracking-wider">
                EMOM Timer
              </span>
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
