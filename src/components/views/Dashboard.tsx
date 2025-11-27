/**
 * Dashboard Component
 *
 * Main training dashboard showing current week, progress, and daily workouts.
 */

import { useState, useEffect } from 'react';
import { useHaptic, useSwipeNavigation, useLucideIcons } from '../../hooks';
import { safeGetJSON, getInProgressWorkout, getWorkoutProgress, type InProgressWorkout } from '../../utils/storage';
import { formatRelativeTime } from '../../utils/time';
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
  const [inProgressWorkout, setInProgressWorkout] = useState<InProgressWorkout | null>(null);
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

  // Check for in-progress workouts on mount and when week changes
  useEffect(() => {
    const inProgress = getInProgressWorkout();
    setInProgressWorkout(inProgress);
  }, [currentWeek]);

  // Initialize Lucide icons when week changes (day completion status may update icons)
  useLucideIcons([currentWeek, inProgressWorkout]);

  const isCompleted = (day: number): boolean => {
    const session = safeGetJSON<{ completed?: boolean } | null>(
      `session_w${currentWeek}d${day}`,
      null
    );
    return session?.completed === true;
  };

  const getDayProgress = (day: number): { completedSets: number; totalSets: number; progress: number } | null => {
    return getWorkoutProgress(currentWeek, day);
  };

  const handleResumeWorkout = () => {
    if (inProgressWorkout) {
      haptic.bump();
      // Navigate to the in-progress workout week first, then start it
      if (inProgressWorkout.week !== currentWeek) {
        setCurrentWeek(inProgressWorkout.week);
      }
      onStartWorkout(inProgressWorkout.day);
    }
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
        {/* Resume Workout Banner */}
        {inProgressWorkout && (
          <button
            onClick={handleResumeWorkout}
            className="w-full mb-6 p-5 rounded-3xl bg-gradient-to-r from-sys-accent/20 to-sys-accent/10 border-2 border-sys-accent/30 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-sys-accent/20 flex items-center justify-center">
                  <i data-lucide="play-circle" className="text-sys-accent" width="24"></i>
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold text-white mb-1">
                    Resume Workout
                  </h3>
                  <p className="text-xs text-sys-onSurfaceVar">
                    Week {inProgressWorkout.week}, Day {inProgressWorkout.day} • {formatRelativeTime(inProgressWorkout.lastModified.toISOString()) ?? 'recently'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-bold text-sys-accent">
                  {inProgressWorkout.progress}%
                </span>
                <span className="text-xs text-sys-onSurfaceVar">
                  {inProgressWorkout.completedSets}/{inProgressWorkout.totalSets} sets
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 w-full bg-black/30 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-sys-accent transition-all duration-300 rounded-full"
                style={{ width: `${inProgressWorkout.progress}%` }}
              ></div>
            </div>
          </button>
        )}

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
            const dayProgress = getDayProgress(day);
            const isInProgress = !done && dayProgress !== null;
            return (
              <button
                key={day}
                onClick={() => {
                  haptic.tick();
                  onStartWorkout(day);
                }}
                className={`stagger-item relative min-h-[72px] rounded-3xl px-6 py-5 flex items-center justify-between transition-all active:scale-[0.97] ${
                  done
                    ? 'bg-sys-success/10 border-2 border-sys-success/30'
                    : isInProgress
                    ? 'bg-sys-accent/10 border-2 border-sys-accent/30'
                    : 'bg-sys-surface border-2 border-white/5'
                }`}
                aria-label={`${done ? 'Completed' : isInProgress ? 'Resume' : 'Start'} Day ${day} workout`}
              >
                <div className="flex flex-col items-start">
                  <span
                    className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                      done ? 'text-sys-success' : isInProgress ? 'text-sys-accent' : 'text-sys-onSurfaceVar'
                    }`}
                  >
                    Day {day}
                  </span>
                  <span
                    className={`text-xs ${
                      done
                        ? 'text-sys-success/70'
                        : isInProgress
                        ? 'text-sys-accent/70'
                        : 'text-sys-onSurfaceVar/70'
                    }`}
                  >
                    {done ? 'Completed' : isInProgress ? `In progress • ${dayProgress.progress}%` : 'Tap to start'}
                  </span>
                </div>

                <div
                  className={`h-12 w-12 min-w-[48px] rounded-2xl flex items-center justify-center ${
                    done
                      ? 'bg-sys-success text-sys-black'
                      : isInProgress
                      ? 'bg-sys-accent text-sys-black'
                      : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                  }`}
                >
                  {done ? (
                    <i data-lucide="check"></i>
                  ) : isInProgress ? (
                    <i data-lucide="play"></i>
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
