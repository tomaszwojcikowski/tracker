/**
 * Dashboard Component
 *
 * Main training dashboard showing current week, progress, and daily workouts.
 */

import { useState, useEffect } from 'react';
import { useHaptic, useSwipeNavigation, useLucideIcons } from '../../hooks';
import { safeGetJSON } from '../../utils/storage';
import { SwipeIndicator } from '../SwipeIndicator';
import { getBlockForWeek } from '../../data/programData';

export interface DashboardProps {
  currentWeek: number;
  setCurrentWeek: (week: number) => void;
  onStartWorkout: (day: number) => void;
}

export function Dashboard({
  currentWeek,
  setCurrentWeek,
  onStartWorkout,
}: DashboardProps) {
  const [progress, setProgress] = useState(0);
  const haptic = useHaptic();

  // Enhanced swipe navigation with visual feedback
  const {
    swipeDirection,
    swipeProgress,
    handlers: swipeHandlers,
  } = useSwipeNavigation({
    onSwipeLeft: () => {
      if (currentWeek < 21) {
        haptic.swipe();
        setCurrentWeek(currentWeek + 1);
      }
    },
    onSwipeRight: () => {
      if (currentWeek > 1) {
        haptic.swipe();
        setCurrentWeek(currentWeek - 1);
      }
    },
  });

  useEffect(() => setProgress((currentWeek / 21) * 100), [currentWeek]);

  // Initialize Lucide icons when week changes (day completion status may update icons)
  useLucideIcons([currentWeek]);

  const isCompleted = (day: number): boolean => {
    const session = safeGetJSON<{ completed?: boolean } | null>(
      `session_w${currentWeek}d${day}`,
      null
    );
    return session?.completed === true;
  };

  const currentBlock = getBlockForWeek(currentWeek) || { name: 'Unknown' };

  return (
    <>
      <SwipeIndicator
        direction={swipeDirection}
        progress={swipeProgress}
        leftLabel={currentWeek < 21 ? `Week ${currentWeek + 1}` : null}
        rightLabel={currentWeek > 1 ? `Week ${currentWeek - 1}` : null}
      />
      <div
        {...swipeHandlers}
        className="flex-1 overflow-y-auto px-5 pb-32 pt-6"
      >
        <div className="card-modern p-7 mb-8 relative overflow-hidden border border-white/5">
          <div className="relative z-10">
            <h2 className="text-xs font-bold text-sys-onSurfaceVar uppercase tracking-wider mb-2">
              Current Phase
            </h2>
            <h1 className="text-3xl font-bold text-white mb-5 leading-tight">
              {currentBlock.name}
            </h1>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-5xl font-bold text-sys-accent tracking-tighter">
                W{currentWeek}
              </span>
              <span className="text-sys-onSurfaceVar font-mono text-xl">
                / 21
              </span>
            </div>
            <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
              <div
                className="progress-bar-fill h-full transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-6 px-1">
          <h3 className="text-2xl font-bold text-white">Weekly Plan</h3>
          <span className="text-sm text-sys-onSurfaceVar font-medium">
            Week {currentWeek}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 5].map((day) => {
            const done = isCompleted(day);
            return (
              <button
                key={day}
                onClick={() => {
                  haptic.tick();
                  onStartWorkout(day);
                }}
                className={`relative min-h-[72px] rounded-3xl px-6 py-5 flex items-center justify-between transition-all active:scale-[0.97] ${
                  done
                    ? 'bg-sys-success/10 border-2 border-sys-success/30'
                    : 'bg-sys-surface border-2 border-white/5'
                }`}
                aria-label={`${done ? 'Completed' : 'Start'} Day ${day} workout`}
              >
                <div className="flex flex-col items-start">
                  <span
                    className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                      done ? 'text-sys-success' : 'text-sys-onSurfaceVar'
                    }`}
                  >
                    Day {day}
                  </span>
                  <span
                    className={`text-xs ${
                      done
                        ? 'text-sys-success/70'
                        : 'text-sys-onSurfaceVar/70'
                    }`}
                  >
                    {done ? 'Completed' : 'Tap to start'}
                  </span>
                </div>

                <div
                  className={`h-12 w-12 min-w-[48px] rounded-2xl flex items-center justify-center ${
                    done
                      ? 'bg-sys-success text-sys-black'
                      : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                  }`}
                >
                  {done ? (
                    <i data-lucide="check"></i>
                  ) : (
                    <i data-lucide="chevron-right"></i>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
            className="h-8 w-8 rounded-lg bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
            disabled={currentWeek === 1}
            aria-label="Previous week"
          >
            <i data-lucide="chevron-left"></i>
          </button>
          <div className="flex gap-2 px-4">
            {[...Array(5)].map((_, i) => {
              const dotWeek = currentWeek - 2 + i;
              if (dotWeek < 1 || dotWeek > 21)
                return <div key={i} className="w-2 h-2" />;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentWeek(dotWeek)}
                  className={`rounded-full transition-all ${
                    dotWeek === currentWeek
                      ? 'w-8 h-2 bg-white'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Week ${dotWeek}`}
                />
              );
            })}
          </div>
          <button
            onClick={() => setCurrentWeek(Math.min(21, currentWeek + 1))}
            className="h-8 w-8 rounded-lg bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
            disabled={currentWeek === 21}
            aria-label="Next week"
          >
            <i data-lucide="chevron-right"></i>
          </button>
        </div>
      </div>
    </>
  );
}
