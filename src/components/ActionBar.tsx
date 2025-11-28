/**
 * ActionBar Component
 *
 * Bottom action bar with EMOM timer display, rest timer display,
 * and a finish button with confirmation dialog.
 */

import { useState, useEffect } from 'react';
import { useHaptic } from '../hooks';
import { X, Minus, Plus, CheckCircle2 } from 'lucide-react';

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
  onFinish: () => void;
  timerState: TimerState;
  setTimerActive: (active: boolean) => void;
  setTimerSeconds: (seconds: number | ((s: number) => number)) => void;
  emomState?: EmomState;
  setEmomActive?: (active: boolean) => void;
  setEmomSeconds?: (seconds: number | ((s: number) => number)) => void;
  setEmomInterval?: (interval: number | ((i: number) => number)) => void;
  completedSets?: number;
  totalSets?: number;
}

export function ActionBar({
  onFinish,
  timerState,
  setTimerActive,
  setTimerSeconds,
  emomState,
  setEmomActive,
  setEmomSeconds,
  setEmomInterval,
  completedSets = 0,
  totalSets = 0,
}: ActionBarProps) {
  const haptic = useHaptic();
  const [showConfirm, setShowConfirm] = useState(false);

  // Keyboard shortcuts for dialog
  useEffect(() => {
    if (!showConfirm) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        haptic.tick();
        setShowConfirm(false);
      } else if (e.key === 'Enter') {
        haptic.success();
        setShowConfirm(false);
        onFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirm, onFinish, haptic]);

  return (
    <>
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
          <div className="px-4 pt-3 pb-2">
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

        <div className="px-4 py-3">
          <button
            onClick={() => {
              haptic.bump();
              setShowConfirm(true);
            }}
            className="w-full h-12 min-h-[44px] px-6 rounded-xl bg-sys-surfaceHigh border border-white/10 text-white font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform relative overflow-hidden"
          >
            {/* Progress bar background */}
            {totalSets > 0 && (
              <div
                className="absolute inset-0 bg-sys-success/20 transition-all duration-500"
                style={{ width: `${(completedSets / totalSets) * 100}%` }}
              />
            )}
            <span className="relative z-10 text-sm flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>Finish</span>
              {totalSets > 0 && (
                <span className="text-sys-onSurfaceVar text-xs">
                  ({completedSets}/{totalSets})
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-slide-up safe-pb">
          <div className="bg-sys-surface rounded-3xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Finish Workout?</h3>
            <p className="text-sys-onSurfaceVar mb-6">
              Your progress will be saved and logged to history.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  haptic.tick();
                  setShowConfirm(false);
                }}
                className="flex-1 h-14 rounded-xl bg-sys-surfaceHigh text-white font-semibold active:scale-95 transition-transform hover-lift"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  haptic.success();
                  setShowConfirm(false);
                  onFinish();
                }}
                className="flex-1 h-14 rounded-xl text-white font-semibold active:scale-95 transition-transform btn-gradient-success"
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
