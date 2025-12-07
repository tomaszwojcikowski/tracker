/**
 * Dashboard Component
 *
 * Main training dashboard showing current week, progress, and daily workouts.
 * Uses program-scoped storage keys for data isolation between programs.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useHaptic, useScrollToElement } from '../../hooks';
import { PlayCircle, Check, Play, ChevronRight, ChevronLeft, Plus, Trophy } from 'lucide-react';
import { safeGetJSON, getInProgressWorkout, getWorkoutProgress, hasWorkoutData, type InProgressWorkout } from '../../utils/storage';
import { formatRelativeTime } from '../../utils/time';
import { getBlockForWeek } from '../../data/programData';
import { getCompleteSchedule } from '../../utils/schedule';
import { getSessionKey } from '../../services/storageNamespace';
import { ProgramSelector } from '../ProgramSelector';
import { useProgram } from '../../context/ProgramContext';
import { WeeklyProgressRing } from '../progress';

/** Maximum number of exercises to show in the summary */
const MAX_EXERCISES_IN_SUMMARY = 3;

/**
 * Get color theme for a specific day
 */
function getDayTheme(day: number) {
  switch (day) {
    case 1:
      return {
        hero: {
          gradient: 'from-blue-500 to-blue-600',
          border: 'border-blue-500/30',
          badge: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
          iconBg: 'bg-blue-500',
          text: 'text-blue-400',
        },
        card: {
          bg: 'bg-blue-500/5',
          border: 'border-blue-500/10',
          text: 'text-blue-400',
        }
      };
    case 2:
      return {
        hero: {
          gradient: 'from-purple-500 to-purple-600',
          border: 'border-purple-500/30',
          badge: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
          iconBg: 'bg-purple-500',
          text: 'text-purple-400',
        },
        card: {
          bg: 'bg-purple-500/5',
          border: 'border-purple-500/10',
          text: 'text-purple-400',
        }
      };
    case 3:
      return {
        hero: {
          gradient: 'from-teal-500 to-teal-600',
          border: 'border-teal-500/30',
          badge: 'bg-teal-500/20 border-teal-500/30 text-teal-400',
          iconBg: 'bg-teal-500',
          text: 'text-teal-400',
        },
        card: {
          bg: 'bg-teal-500/5',
          border: 'border-teal-500/10',
          text: 'text-teal-400',
        }
      };
    case 5:
      return {
        hero: {
          gradient: 'from-orange-500 to-orange-600',
          border: 'border-orange-500/30',
          badge: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
          iconBg: 'bg-orange-500',
          text: 'text-orange-400',
        },
        card: {
          bg: 'bg-orange-500/5',
          border: 'border-orange-500/10',
          text: 'text-orange-400',
        }
      };
    default:
      return {
        hero: {
          gradient: 'from-sys-primary to-sys-primaryDim',
          border: 'border-sys-primary/30',
          badge: 'bg-sys-primary/20 border-sys-primary/30 text-sys-primary',
          iconBg: 'bg-sys-primary',
          text: 'text-sys-primary',
        },
        card: {
          bg: 'bg-sys-surface',
          border: 'border-white/5',
          text: 'text-sys-onSurfaceVar',
        }
      };
  }
}

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
  const haptic = useHaptic();

  // Get program context for program-aware features
  const { currentProgram, metadata } = useProgram();

  // Calculate max weeks based on current program
  const maxWeeks = metadata?.durationWeeks ?? currentProgram?.durationWeeks ?? 21;

  // Ref for the horizontal scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Track if we're programmatically scrolling to prevent scroll event feedback loop
  const isProgrammaticScroll = useRef(false);

  // Scroll to the current week when it changes (e.g., from button click or dot navigation)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const targetScroll = (currentWeek - 1) * container.clientWidth;
    // Only scroll if we're not already at the right position
    if (Math.abs(container.scrollLeft - targetScroll) > 10) {
      isProgrammaticScroll.current = true;
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
      // Reset flag after scroll animation completes
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 350);
    }
  }, [currentWeek]);

  // Handle scroll end to update week based on scroll position
  const handleScroll = useCallback(() => {
    // Skip if this is a programmatic scroll
    if (isProgrammaticScroll.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const itemWidth = container.clientWidth;
    const newWeek = Math.round(scrollLeft / itemWidth) + 1;

    if (newWeek !== currentWeek && newWeek >= 1 && newWeek <= maxWeeks) {
      haptic.swipe();
      setCurrentWeek(newWeek);
    }
  }, [currentWeek, maxWeeks, haptic, setCurrentWeek]);

  // Navigation handlers for buttons
  const changeWeek = useCallback((newWeek: number) => {
    if (newWeek === currentWeek || newWeek < 1 || newWeek > maxWeeks) return;
    haptic.swipe();
    setCurrentWeek(newWeek);
  }, [currentWeek, maxWeeks, haptic, setCurrentWeek]);

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

  const days = [1, 2, 3, 5];

  // Find the next workout to do (first incomplete day)
  // If all completed, show the last one or none as "next"
  const nextWorkoutDay = days.find(day => !isCompleted(day));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Program Selector - fixed at top */}
      <div className="px-5 pt-6">
        <ProgramSelector
          variant="card"
          className="mb-6"
          onProgramChange={onProgramChange}
        />
      </div>

      {/* Horizontal scroll container for weeks - native swipe support */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {Array.from({ length: maxWeeks }, (_, i) => i + 1).map((week) => (
          <WeekContent
            key={week}
            week={week}
            currentWeek={currentWeek}
            maxWeeks={maxWeeks}
            inProgressWorkout={inProgressWorkout}
            days={days}
            nextWorkoutDay={nextWorkoutDay}
            isCompleted={isCompleted}
            getDayProgress={getDayProgress}
            hasExistingData={hasExistingData}
            getExerciseSummary={getExerciseSummary}
            changeWeek={changeWeek}
            onStartWorkout={onStartWorkout}
            onStartEmptyWorkout={onStartEmptyWorkout}
            haptic={haptic}
          />
        ))}
      </div>

      {/* Week navigation dots - fixed at bottom */}
      <div className="py-4 flex justify-center items-center gap-2">
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
  );
}

// ============================================================================
// WEEK CONTENT COMPONENT
// ============================================================================

interface WeekContentProps {
  week: number;
  currentWeek: number;
  maxWeeks: number;
  inProgressWorkout: InProgressWorkout | null;
  days: number[];
  nextWorkoutDay: number | undefined;
  isCompleted: (day: number) => boolean;
  getDayProgress: (day: number) => { completedSets: number; totalSets: number; completedExercises: number; totalExercises: number; progress: number } | null;
  hasExistingData: (day: number) => boolean;
  getExerciseSummary: (week: number, day: number) => string;
  changeWeek: (week: number) => void;
  onStartWorkout: (day: number) => void;
  onStartEmptyWorkout?: () => void;
  haptic: ReturnType<typeof useHaptic>;
}

function WeekContent({
  week,
  currentWeek,
  maxWeeks: _maxWeeks,
  inProgressWorkout,
  days,
  nextWorkoutDay,
  isCompleted,
  getDayProgress,
  hasExistingData,
  getExerciseSummary,
  changeWeek,
  onStartWorkout,
  onStartEmptyWorkout,
  haptic,
}: WeekContentProps) {
  const currentBlock = getBlockForWeek(week) || { name: 'Unknown' };
  const completedWorkouts = days.filter(day => isCompleted(day)).length;
  const totalWorkouts = days.length;

  const handleResumeWorkout = () => {
    if (inProgressWorkout) {
      haptic.bump();
      if (inProgressWorkout.week !== currentWeek) {
        changeWeek(inProgressWorkout.week);
      }
      onStartWorkout(inProgressWorkout.day);
    }
  };

  return (
    <div
      className="flex-shrink-0 w-full snap-center overflow-y-auto px-5 pb-20"
    >
      {/* Weekly Progress Ring */}
      <WeeklyProgressRing
        completedWorkouts={completedWorkouts}
        totalWorkouts={totalWorkouts}
        currentWeek={week}
      />

      {/* Resume Workout Banner */}
      {inProgressWorkout && inProgressWorkout.week === week && (
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
            const theme = getDayTheme(day);

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
                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.hero.gradient} opacity-20 group-active:opacity-30 transition-opacity`} />
                        <div className={`absolute inset-0 border-2 ${theme.hero.border} rounded-[32px]`} />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-full ${theme.hero.badge} text-xs font-bold uppercase tracking-wider`}>
                                    Next Up
                                </div>
                                <div className={`h-10 w-10 rounded-full ${theme.hero.iconBg} text-sys-black flex items-center justify-center shadow-lg shadow-sys-primary/20`}>
                                    <Play size={20} fill="currentColor" />
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold text-white mb-2">Day {day}</h3>
                            <p className="text-sys-onSurfaceVar text-sm line-clamp-2 mb-4">
                                {getExerciseSummary(week, day)}
                            </p>

                            <div className={`flex items-center gap-2 ${theme.hero.text} text-sm font-bold`}>
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
                    : `${theme.card.bg} border ${theme.card.border}`
                }`}
                aria-label={`${done ? 'View completed' : isInProgress ? 'Resume' : hasPreviousData ? 'Continue' : 'Start'} Day ${day} workout`}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                        className={`text-sm font-bold uppercase tracking-wider ${
                        done ? 'text-sys-success' : isInProgress ? 'text-sys-accent' : theme.card.text
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
                      : getExerciseSummary(week, day)}
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
    </div>
  );
}

