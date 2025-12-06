/**
 * Dashboard Component
 *
 * Main training dashboard showing current week, progress, and daily workouts.
 * Uses program-scoped storage keys for data isolation between programs.
 */

import { useState, useEffect } from 'react';
import { useHaptic, useSwipeNavigation, useScrollToElement } from '../../hooks';
import { PlayCircle, Check, Play, ChevronRight, ChevronLeft, Plus, Trophy } from 'lucide-react';
import { safeGetJSON, getInProgressWorkout, getWorkoutProgress, hasWorkoutData, type InProgressWorkout } from '../../utils/storage';
import { formatRelativeTime } from '../../utils/time';
import { SwipeIndicator } from '../SwipeIndicator';
import { getBlockForWeek } from '../../data/programData';
import { getCompleteSchedule } from '../../utils/schedule';
import { getSessionKey } from '../../services/storageNamespace';
import { ProgramSelector } from '../ProgramSelector';
import { useProgram } from '../../context/ProgramContext';
import { WeeklyProgressRing } from '../progress';

/** Maximum number of exercises to show in the summary */
const MAX_EXERCISES_IN_SUMMARY = 3;

/**
 * Get a summary of main and skill exercises for a day (excluding warmup/accessory)
 */
function getExerciseSummary(week: number, day: number): string {
  const schedule = getCompleteSchedule();
  const dayExercises = schedule.filter((item) => item.w === week && item.d === day);

  if (dayExercises.length === 0) {
    return 'Rest day';
  }

  // Filter to only skill and main work exercises based on category
  const mainExercises = dayExercises
    .filter((item) => item.category === 'skill' || item.category === 'main')
    .map((item) => item.ex)
    .slice(0, MAX_EXERCISES_IN_SUMMARY);

  if (mainExercises.length === 0) {
    return 'Rest day';
  }

  return mainExercises.join(', ');
}

export interface DashboardProps {
  currentWeek: number;
  setCurrentWeek: (week: number) => void;
  onStartWorkout: (day: number) => void;
  onStartEmptyWorkout?: () => void;
  /** Optional callback when program changes */
  onProgramChange?: (programId: string) => void;
}

export function Dashboard({
  currentWeek,
  setCurrentWeek,
  onStartWorkout,
  onStartEmptyWorkout,
  onProgramChange,
}: DashboardProps) {
  const [inProgressWorkout, setInProgressWorkout] = useState<InProgressWorkout | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const haptic = useHaptic();

  // Get program context for program-aware features
  const { currentProgram, metadata } = useProgram();

  // Calculate max weeks based on current program
  const maxWeeks = metadata?.durationWeeks ?? currentProgram?.durationWeeks ?? 21;

  // Enhanced swipe navigation with visual feedback
  const {
    swipeDirection,
    swipeProgress,
    handlers: swipeHandlers,
  } = useSwipeNavigation({
    onSwipeLeft: () => {
      if (currentWeek < maxWeeks) {
        haptic.swipe();
        setSlideDirection('left');
        setTimeout(() => {
          setCurrentWeek(currentWeek + 1);
          setTimeout(() => setSlideDirection(null), 300);
        }, 50);
      }
    },
    onSwipeRight: () => {
      if (currentWeek > 1) {
        haptic.swipe();
        setSlideDirection('right');
        setTimeout(() => {
          setCurrentWeek(currentWeek - 1);
          setTimeout(() => setSlideDirection(null), 300);
        }, 50);
      }
    },
  });

  // Check for in-progress workouts on mount and when week changes
  useEffect(() => {
    const inProgress = getInProgressWorkout();
    setInProgressWorkout(inProgress);
  }, [currentWeek]);

  // Scroll to the active day card when the view loads
  // Priority: in-progress workout > next incomplete day
  const activeDayId = inProgressWorkout
    ? `day-card-${inProgressWorkout.day}`
    : undefined; // Let the page naturally show top (Weekly Progress Ring is prominent)

  useScrollToElement({
    elementId: activeDayId,
    delay: 150,
    enabled: !!activeDayId,
  });

  const isCompleted = (day: number): boolean => {
    const sessionKey = getSessionKey(currentWeek, day);
    const session = safeGetJSON<{ completed?: boolean } | null>(
      sessionKey,
      null
    );
    return session?.completed === true;
  };

  const getDayProgress = (day: number): { completedSets: number; totalSets: number; completedExercises: number; totalExercises: number; progress: number } | null => {
    return getWorkoutProgress(currentWeek, day);
  };

  const hasExistingData = (day: number): boolean => {
    return hasWorkoutData(currentWeek, day);
  };

  // Helper to change week with animation
  const changeWeek = (newWeek: number) => {
    if (newWeek === currentWeek || newWeek < 1 || newWeek > maxWeeks) return;
    const direction = newWeek > currentWeek ? 'left' : 'right';
    setSlideDirection(direction);
    setTimeout(() => {
      setCurrentWeek(newWeek);
      setTimeout(() => setSlideDirection(null), 300);
    }, 50);
  };

  const handleResumeWorkout = () => {
    if (inProgressWorkout) {
      haptic.bump();
      // Navigate to the in-progress workout week first, then start it
      if (inProgressWorkout.week !== currentWeek) {
        changeWeek(inProgressWorkout.week);
      }
      onStartWorkout(inProgressWorkout.day);
    }
  };

  const currentBlock = getBlockForWeek(currentWeek) || { name: 'Unknown' };
  const days = [1, 2, 3, 5];
  const completedWorkouts = days.filter(day => isCompleted(day)).length;
  const totalWorkouts = days.length;

  // Find the next workout to do (first incomplete day)
  // If all completed, show the last one or none as "next"
  const nextWorkoutDay = days.find(day => !isCompleted(day));

  return (
    <>
      <SwipeIndicator
        direction={swipeDirection}
        progress={swipeProgress}
        leftLabel={currentWeek < maxWeeks ? `Week ${currentWeek + 1}` : null}
        rightLabel={currentWeek > 1 ? `Week ${currentWeek - 1}` : null}
      />
      <div
        {...swipeHandlers}
        className="flex-1 overflow-y-auto px-5 pb-20 pt-6"
      >
        {/* Program Selector Card */}
        <ProgramSelector
          variant="card"
          className="mb-6"
          onProgramChange={onProgramChange}
        />

        {/* Animated week content container */}
        <div
          key={currentWeek}
          className={slideDirection === 'left' ? 'animate-slide-in-left' : slideDirection === 'right' ? 'animate-slide-in-right' : ''}
        >
          {/* Weekly Progress Ring */}
          <WeeklyProgressRing
              completedWorkouts={completedWorkouts}
              totalWorkouts={totalWorkouts}
              currentWeek={currentWeek}
          />

        {/* Resume Workout Banner */}
        {inProgressWorkout && (
          <button
            onClick={handleResumeWorkout}
            className="w-full mb-6 p-5 rounded-3xl bg-gradient-to-r from-sys-accent/20 to-sys-accent/10 border-2 border-sys-accent/30 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-sys-accent/20 flex items-center justify-center">
                  <PlayCircle className="text-sys-accent" width={24} />
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
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-sys-accent transition-all duration-300 rounded-full"
                style={{ width: `${inProgressWorkout.progress}%` }}
              ></div>
            </div>
          </button>
        )}

        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="text-xl font-bold text-white">Workouts</h3>
          <span className="text-sm text-sys-accent font-medium">
            {currentBlock.name}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {days.map((day) => {
            const done = isCompleted(day);
            const dayProgress = getDayProgress(day);
            const isInProgress = !done && dayProgress !== null;
            const hasPreviousData = !done && !isInProgress && hasExistingData(day);

            // Determine if this is the "Hero" card (next up)
            // It's the hero if it's the next workout day, OR if it's in progress

            // Let's simplify: Hero card is the next scheduled workout if no workout is in progress.
            // If a workout is in progress, the resume banner handles it, so we can show standard list.
            // But let's make the next available workout prominent.

            const isNextUp = day === nextWorkoutDay && !inProgressWorkout;

            if (isNextUp) {
                return (
                    <button
                        key={day}
                        id={`day-card-${day}`}
                        onClick={() => {
                            haptic.tick();
                            onStartWorkout(day);
                        }}
                        className="relative overflow-hidden rounded-[32px] p-6 text-left transition-all active:scale-[0.98] group scroll-mt-16"
                        aria-label={`Start Day ${day} workout`}
                    >
                        {/* Background with gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-sys-primary to-sys-primaryDim opacity-20 group-active:opacity-30 transition-opacity" />
                        <div className="absolute inset-0 border-2 border-sys-primary/30 rounded-[32px]" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="px-3 py-1 rounded-full bg-sys-primary/20 border border-sys-primary/30 text-sys-primary text-xs font-bold uppercase tracking-wider">
                                    Next Up
                                </div>
                                <div className="h-10 w-10 rounded-full bg-sys-primary text-sys-black flex items-center justify-center shadow-lg shadow-sys-primary/20">
                                    <Play size={20} fill="currentColor" />
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold text-white mb-2">Day {day}</h3>
                            <p className="text-sys-onSurfaceVar text-sm line-clamp-2 mb-4">
                                {getExerciseSummary(currentWeek, day)}
                            </p>

                            <div className="flex items-center gap-2 text-sys-primary text-sm font-bold">
                                <span>Start Workout</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </button>
                );
            }

            return (
              <button
                key={day}
                id={`day-card-${day}`}
                onClick={() => {
                  haptic.tick();
                  onStartWorkout(day);
                }}
                className={`relative min-h-[72px] rounded-3xl px-6 py-5 flex items-center justify-between transition-all active:scale-[0.97] scroll-mt-16 ${
                  done
                    ? 'bg-sys-surface border border-sys-success/30'
                    : isInProgress
                    ? 'bg-sys-surface border border-sys-accent/30'
                    : 'bg-sys-surface border border-white/5'
                }`}
                aria-label={`${done ? 'View completed' : isInProgress ? 'Resume' : hasPreviousData ? 'Continue' : 'Start'} Day ${day} workout`}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                        className={`text-sm font-bold uppercase tracking-wider ${
                        done ? 'text-sys-success' : isInProgress ? 'text-sys-accent' : 'text-sys-onSurfaceVar'
                        }`}
                    >
                        Day {day}
                    </span>
                    {done && <Check size={14} className="text-sys-success" />}
                  </div>
                  <span
                    className={`text-xs text-left line-clamp-1 ${
                      done
                        ? 'text-sys-success/70'
                        : isInProgress
                        ? 'text-sys-accent/70'
                        : 'text-sys-onSurfaceVar/70'
                    }`}
                  >
                    {done
                      ? 'Completed'
                      : isInProgress
                      ? `${dayProgress?.completedSets}/${dayProgress?.totalSets} sets • ${dayProgress?.progress}%`
                      : hasPreviousData
                      ? 'Has previous data'
                      : getExerciseSummary(currentWeek, day)}
                  </span>
                </div>

                <div
                  className={`h-10 w-10 min-w-[40px] rounded-full flex items-center justify-center ${
                    done
                      ? 'bg-sys-success/10 text-sys-success'
                      : isInProgress
                      ? 'bg-sys-accent/10 text-sys-accent'
                      : 'bg-sys-surfaceHigh text-sys-onSurfaceVar'
                  }`}
                >
                  {done ? (
                    <Trophy size={18} />
                  ) : isInProgress ? (
                    <Play size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Start Empty Workout Button */}
        {onStartEmptyWorkout && (
          <div className="mt-6">
            <button
              onClick={() => {
                haptic.bump();
                onStartEmptyWorkout();
              }}
              className="w-full min-h-[56px] rounded-3xl px-6 py-4 flex items-center justify-center gap-3 transition-all active:scale-[0.97] bg-sys-surface border border-dashed border-white/20 hover:border-sys-accent/40"
              aria-label="Start an empty workout"
            >
              <div className="h-10 w-10 min-w-[40px] rounded-2xl bg-sys-surfaceHigh flex items-center justify-center">
                <Plus className="text-sys-accent" size={20} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-bold text-white">Start Custom Workout</span>
                <span className="text-xs text-sys-onSurfaceVar">Add your own exercises</span>
              </div>
            </button>
          </div>
        )}
        </div>{/* End animated week content container */}

        <div className="mt-10 flex justify-center items-center gap-2">
          <button
            onClick={() => changeWeek(currentWeek - 1)}
            className="h-8 w-8 rounded-lg bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
            disabled={currentWeek === 1}
            aria-label="Previous week"
          >
            <ChevronLeft />
          </button>
          <div className="flex gap-2 px-4">
            {[...Array(5)].map((_, i) => {
              const dotWeek = currentWeek - 2 + i;
              if (dotWeek < 1 || dotWeek > maxWeeks)
                return <div key={i} className="w-2 h-2" />;
              return (
                <button
                  key={i}
                  onClick={() => changeWeek(dotWeek)}
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
            onClick={() => changeWeek(currentWeek + 1)}
            className="h-8 w-8 rounded-lg bg-sys-surfaceHigh text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
            disabled={currentWeek === maxWeeks}
            aria-label="Next week"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </>
  );
}

