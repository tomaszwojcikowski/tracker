/**
 * Dashboard Component
 *
 * Main training dashboard showing current week, progress, and daily workouts.
 * Uses program-scoped storage keys for data isolation between programs.
 * Phase 2 Mockup: Enhanced with status pills, week selector pills, and continue card.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useHaptic, useScrollToElement } from '../../hooks';
import { Play, ChevronRight, ChevronLeft, Plus, Clock, X } from '../icons';
import { safeGetJSON, getInProgressWorkout, getWorkoutProgress, type InProgressWorkout } from '../../utils/storage';
import { getBlockForWeek } from '../../data/programData';
import { getCompleteSchedule, type RawScheduleItem } from '../../utils/schedule';
import { getSessionKey, getGlobalHistoryKey } from '../../services/storageNamespace';
import { ProgramSelector } from '../ProgramSelector';
import { useProgram } from '../../context/ProgramContext';
import { WeeklyProgressRing } from '../progress';
import { StatusPill } from '../StatusPill';
import { WeekPills } from '../WeekPills';
import { ContinueWorkoutCard } from '../ContinueWorkoutCard';
import { BottomSheet } from '../BottomSheet';
import { WorkoutDetailModal } from '../modals';
import type { GlobalHistoryEntry } from '../../types';

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
          gradient: 'from-sys-primary to-sys-primary/80',
          border: 'border-sys-primary/30',
          badge: 'bg-sys-primaryContainer border-sys-primary/30 text-sys-onPrimaryContainer',
          iconBg: 'bg-sys-primary',
          iconColor: 'text-sys-onPrimary',
          text: 'text-sys-primary',
          container: 'bg-sys-primaryContainer',
          onContainer: 'text-sys-onPrimaryContainer'
        },
        card: {
          bg: 'bg-sys-primaryContainer',
          border: 'border-sys-primary/10',
          text: 'text-sys-onPrimaryContainer',
        }
      };
    case 2:
      return {
        hero: {
          gradient: 'from-sys-secondary to-sys-secondary/80',
          border: 'border-sys-secondary/30',
          badge: 'bg-sys-secondaryContainer border-sys-secondary/30 text-sys-onSecondaryContainer',
          iconBg: 'bg-sys-secondary',
          iconColor: 'text-sys-onSecondary',
          text: 'text-sys-secondary',
          container: 'bg-sys-secondaryContainer',
          onContainer: 'text-sys-onSecondaryContainer'
        },
        card: {
          bg: 'bg-sys-secondaryContainer',
          border: 'border-sys-secondary/10',
          text: 'text-sys-onSecondaryContainer',
        }
      };
    case 3:
      return {
        hero: {
          gradient: 'from-sys-tertiary to-sys-tertiary/80',
          border: 'border-sys-tertiary/30',
          badge: 'bg-sys-tertiaryContainer border-sys-tertiary/30 text-sys-onTertiaryContainer',
          iconBg: 'bg-sys-tertiary',
          iconColor: 'text-sys-onTertiary',
          text: 'text-sys-tertiary',
          container: 'bg-sys-tertiaryContainer',
          onContainer: 'text-sys-onTertiaryContainer'
        },
        card: {
          bg: 'bg-sys-tertiaryContainer',
          border: 'border-sys-tertiary/10',
          text: 'text-sys-onTertiaryContainer',
        }
      };
    case 5:
      return {
        hero: {
          gradient: 'from-sys-primary to-sys-secondary',
          border: 'border-sys-primary/30',
          badge: 'bg-sys-primaryContainer border-sys-primary/30 text-sys-onPrimaryContainer',
          iconBg: 'bg-sys-primary',
          iconColor: 'text-sys-onPrimary',
          text: 'text-sys-primary',
          container: 'bg-sys-primaryContainer',
          onContainer: 'text-sys-onPrimaryContainer'
        },
        card: {
          bg: 'bg-sys-primaryContainer',
          border: 'border-sys-primary/10',
          text: 'text-sys-onPrimaryContainer',
        }
      };
    default:
      return {
        hero: {
          gradient: 'from-sys-primary to-sys-primary/80',
          border: 'border-sys-primary/30',
          badge: 'bg-sys-primaryContainer border-sys-primary/30 text-sys-onPrimaryContainer',
          iconBg: 'bg-sys-primary',
          iconColor: 'text-sys-onPrimary',
          text: 'text-sys-primary',
          container: 'bg-sys-surfaceContainer',
          onContainer: 'text-sys-onSurface'
        },
        card: {
          bg: 'bg-sys-surfaceContainer',
          border: 'border-sys-outlineVariant',
          text: 'text-sys-onSurfaceVariant',
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

function getDayExercises(week: number, day: number): RawScheduleItem[] {
  const schedule = getCompleteSchedule();
  return schedule.filter((item) => item.w === week && item.d === day);
}

function formatScheduleItem(item: RawScheduleItem): string {
  // Keep this intentionally simple and stable for UI.
  const setsReps = item.s && item.r ? `${item.s}×${item.r}` : '';
  const load = item.load ? ` @ ${item.load}` : '';
  return `${item.ex}${setsReps ? ` — ${setsReps}` : ''}${load}`;
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
  const [detailWorkout, setDetailWorkout] = useState<GlobalHistoryEntry[] | null>(null);
  const haptic = useHaptic();

  // Get program context for program-aware features
  const { currentProgram, metadata } = useProgram();

  // Calculate max weeks based on current program
  const maxWeeks = metadata?.durationWeeks ?? currentProgram?.durationWeeks ?? 21;

  // Ref for the horizontal scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Track if we're programmatically scrolling to prevent scroll event feedback loop
  const isProgrammaticScroll = useRef(false);
  // Track if this is the initial mount to use instant scroll
  const isInitialMount = useRef(true);

  const handleViewDetails = (week: number, day: number) => {
    const historyKey = getGlobalHistoryKey();
    const history = safeGetJSON<GlobalHistoryEntry[]>(historyKey, []);
    // Find all entries for this specific week and day
    const entries = history.filter(h => h.week === week && h.day === day);
    if (entries.length > 0) {
      setDetailWorkout(entries);
    }
  };

  // Scroll to the current week when it changes (e.g., from button click or dot navigation)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const targetScroll = (currentWeek - 1) * container.clientWidth;
    // Only scroll if we're not already at the right position
    if (Math.abs(container.scrollLeft - targetScroll) > 10) {
      isProgrammaticScroll.current = true;
      // Use instant scroll on initial mount, smooth scroll for user navigation
      const behavior = isInitialMount.current ? 'auto' : 'smooth';
      container.scrollTo({ left: targetScroll, behavior });
      // Reset flag after scroll animation completes
      setTimeout(() => {
        isProgrammaticScroll.current = false;
        isInitialMount.current = false;
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

  const days = [1, 2, 3, 5];

  // Find the next workout to do across ALL weeks in the program (not just current week)
  // Returns { week, day } of the first incomplete workout, or null if all completed
  const findNextWorkout = useCallback((): { week: number; day: number } | null => {
    for (let week = 1; week <= maxWeeks; week++) {
      for (const day of days) {
        const sessionKey = getSessionKey(week, day);
        const session = safeGetJSON<{ completed?: boolean } | null>(
          sessionKey,
          null
        );
        if (session?.completed !== true) {
          return { week, day };
        }
      }
    }
    return null;
  }, [maxWeeks, days]);

  const nextWorkout = findNextWorkout();

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
            nextWorkout={nextWorkout}
            isCompleted={isCompleted}
            getDayProgress={getDayProgress}
            getExerciseSummary={getExerciseSummary}
            changeWeek={changeWeek}
            onStartWorkout={onStartWorkout}
            onViewDetails={handleViewDetails}
            onStartEmptyWorkout={onStartEmptyWorkout}
            haptic={haptic}
          />
        ))}
      </div>

      <WorkoutDetailModal
        isOpen={detailWorkout !== null}
        onClose={() => setDetailWorkout(null)}
        workouts={detailWorkout || []}
      />

      {/* Week navigation dots - above bottom nav */}
      <div className="py-4 pb-24 flex justify-center items-center gap-2">
        <button
          onClick={() => changeWeek(currentWeek - 1)}
          className="btn-icon h-12 w-12 bg-sys-surfaceHigh text-sys-onSurface disabled:opacity-30"
          disabled={currentWeek === 1}
          aria-label="Previous week"
        >
          <ChevronLeft size={24} />
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
                    ? 'w-8 h-2 bg-sys-primary'
                    : 'w-2 h-2 bg-sys-outlineVariant hover:bg-sys-onSurfaceVariant/50'
                }`}
                aria-label={`Week ${dotWeek}`}
              />
            );
          })}
        </div>
        <button
          onClick={() => changeWeek(currentWeek + 1)}
          className="btn-icon h-12 w-12 bg-sys-surfaceHigh text-sys-onSurface disabled:opacity-30"
          disabled={currentWeek === maxWeeks}
          aria-label="Next week"
        >
          <ChevronRight size={24} />
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
  nextWorkout: { week: number; day: number } | null;
  isCompleted: (day: number) => boolean;
  getDayProgress: (day: number) => { completedSets: number; totalSets: number; completedExercises: number; totalExercises: number; progress: number } | null;
  getExerciseSummary: (week: number, day: number) => string;
  changeWeek: (week: number) => void;
  onStartWorkout: (day: number) => void;
  onViewDetails: (week: number, day: number) => void;
  onStartEmptyWorkout?: () => void;
  haptic: ReturnType<typeof useHaptic>;
}

function WeekContent({
  week,
  currentWeek,
  maxWeeks: _maxWeeks,
  inProgressWorkout,
  days,
  nextWorkout,
  isCompleted,
  getDayProgress,
  getExerciseSummary,
  changeWeek,
  onStartWorkout,
  onViewDetails,
  onStartEmptyWorkout,
  haptic,
}: WeekContentProps) {
  const [previewDay, setPreviewDay] = useState<number | null>(null);

  const currentBlock = getBlockForWeek(week) || { name: `Week ${week}`, id: week, weeks: [week] };
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
      <BottomSheet
        isOpen={previewDay !== null}
        onClose={() => setPreviewDay(null)}
        ariaLabel={previewDay !== null ? `Preview Day ${previewDay} workout` : 'Preview workout'}
        maxHeight={85}
        showHandle={false}
      >
        <div className="p-6 space-y-4">
          <div className="divider divider-full-width" aria-hidden="true" />
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-sys-onSurface">
              {previewDay !== null ? `Day ${previewDay} Preview` : 'Preview'}
            </h3>
            <button
              onClick={() => {
                haptic.tick();
                setPreviewDay(null);
              }}
              className="btn-icon h-12 w-12 bg-sys-surfaceHigh"
              aria-label="Close preview"
            >
              <X size={24} />
            </button>
          </div>
          {previewDay !== null && (
            <div className="text-sm text-sys-onSurfaceVariant">
              Week {week}
            </div>
          )}
        </div>

        <div className="p-4 pb-8">
          {previewDay === null ? null : (
            (() => {
              const items = getDayExercises(week, previewDay);
              if (items.length === 0) {
                return <div className="text-sys-onSurfaceVariant">Rest day</div>;
              }

              return (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      // Raw schedule items do not have stable IDs; index is acceptable for read-only preview.
                      key={`${previewDay}-${idx}-${item.ex}`}
                      className="p-3 rounded-xl bg-sys-surface border border-sys-outlineVariant"
                    >
                      <div className="text-sm text-sys-onSurface font-medium">
                        {formatScheduleItem(item)}
                      </div>
                      {(item.category || item.n) && (
                        <div className="mt-1 text-xs text-sys-onSurfaceVariant">
                          {item.category ?? 'work'}
                          {item.n ? ` • ${item.n}` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </BottomSheet>

      {/* Weekly Progress Ring */}
      <WeeklyProgressRing
        completedWorkouts={completedWorkouts}
        totalWorkouts={totalWorkouts}
        currentWeek={week}
      />

      {/* Week Selector Pills - Phase 2 Mockup Feature */}
      <div className="mb-6">
        <WeekPills
          currentWeek={currentWeek}
          totalWeeks={21}
          onWeekSelect={changeWeek}
          visibleWeeks={4}
        />
      </div>

      {/* Continue Workout Card - Phase 2 Mockup Feature */}
      {inProgressWorkout && inProgressWorkout.week === week && (
        <div className="mb-6">
          <ContinueWorkoutCard
            workout={inProgressWorkout}
            onResume={handleResumeWorkout}
          />
        </div>
      )}

        <div className="flex justify-between items-end mb-5 px-1">
          <h3 className="text-title-lg text-sys-onSurface">Workouts</h3>
          <span className="text-label-md text-sys-primary font-medium uppercase tracking-wide">
            {currentBlock.name}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {days.map((day) => {
            const done = isCompleted(day);
            const dayProgress = getDayProgress(day);
            const isInProgress = !done && dayProgress !== null;
            void isInProgress;

            // Determine if this is the "Hero" card (next up)
            // It's the hero only if this week+day matches the next workout in the entire program
            // and there's no workout currently in progress (in which case the resume banner handles it)
            const isNextUp = nextWorkout !== null && 
                             nextWorkout.week === week && 
                             nextWorkout.day === day && 
                             !inProgressWorkout;
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
                        className={`relative overflow-hidden rounded-[32px] p-6 text-left transition-all active:scale-[0.98] group scroll-mt-16 ${theme.hero.container} shadow-elevation-2`}
                        aria-label={`Start Day ${day} workout`}
                    >
                        {/* Background with gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.hero.gradient} opacity-10 group-active:opacity-20 transition-opacity`} />
                        <div className={`absolute inset-0 border-2 ${theme.hero.border} rounded-[32px]`} />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        haptic.tick();
                                        setPreviewDay(day);
                                    }}
                                    className={`px-3 py-1 rounded-full ${theme.hero.badge} text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95`}
                                    aria-label={`Preview Day ${day} workout`}
                                >
                                    Next Up
                                </button>
                                <div className={`h-10 w-10 rounded-full ${theme.hero.iconBg} ${theme.hero.iconColor} flex items-center justify-center shadow-md`}>
                                    <Play size={20} fill="currentColor" />
                                </div>
                            </div>

                            <h3 className={`text-2xl font-bold ${theme.hero.onContainer} mb-1`}>Day {day}</h3>
                            <p className={`text-sm ${theme.hero.onContainer} opacity-80 mb-4 line-clamp-1`}>
                                {getExerciseSummary(week, day)}
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className={`h-1.5 w-1.5 rounded-full ${theme.hero.iconBg}`} />
                                    <span className={`text-xs font-bold ${theme.hero.onContainer} opacity-60 uppercase tracking-wider`}>
                                        {getDayExercises(week, day).length} Exercises
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className={`h-1.5 w-1.5 rounded-full ${theme.hero.iconBg}`} />
                                    <span className={`text-xs font-bold ${theme.hero.onContainer} opacity-60 uppercase tracking-wider`}>
                                        45-60 Min
                                    </span>
                                </div>
                            </div>
                        </div>
                    </button>
                );
            }

            return (
              <div
                key={day}
                id={`day-card-${day}`}
                className="day-card-enhanced"
              >
                {/* Day header with status pill */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-title-md font-bold text-sys-onSurface mb-1">
                      Day {day}
                    </h4>
                    <p className="text-body-sm text-sys-onSurfaceVariant line-clamp-1">
                      {getExerciseSummary(week, day)}
                    </p>
                  </div>
                  <StatusPill
                    status={done ? 'completed' : isInProgress ? 'up-next' : 'not-started'}
                  />
                </div>

                {/* Metadata row - Phase 2 Mockup Feature */}
                {(done || dayProgress) && (
                  <div className="day-metadata mb-4">
                    {dayProgress && (
                      <div className="day-metadata-item">
                        <span className="day-metadata-label">Sets</span>
                        <span className="day-metadata-value">
                          {dayProgress.completedSets} / {dayProgress.totalSets}
                        </span>
                      </div>
                    )}
                    {done && dayProgress && (
                      <div className="day-metadata-item">
                        <Clock className="w-3 h-3" />
                        <span className="day-metadata-value">48m</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      haptic.tick();
                      if (done) {
                        onViewDetails(week, day);
                      } else {
                        onStartWorkout(day);
                      }
                    }}
                    className={`btn-md3 flex-1 ${
                      isInProgress
                        ? 'btn-filled'
                        : done
                        ? 'btn-tonal'
                        : 'btn-filled'
                    } flex items-center justify-center gap-2`}
                    aria-label={`${done ? 'View' : isInProgress ? 'Resume' : 'Start'} Day ${day} workout`}
                  >
                    {done ? 'Details' : isInProgress ? 'Resume' : 'Start'}
                  </button>
                  {!done && !isInProgress && (
                    <button
                      onClick={() => {
                        haptic.tick();
                        setPreviewDay(day);
                      }}
                      className="btn-md3 btn-outlined px-4"
                      aria-label={`Preview Day ${day} workout`}
                    >
                      Preview
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Start Empty Workout Button - MD3 Outlined Button Style */}
        {onStartEmptyWorkout && (
          <div className="mt-6">
            <button
              onClick={() => {
                haptic.bump();
                onStartEmptyWorkout();
              }}
              className="w-full min-h-[64px] rounded-lg px-5 py-4 flex items-center justify-center gap-4 transition-all active:scale-[0.98] card-outlined hover:bg-sys-surfaceVariant/20"
              aria-label="Start an empty workout"
            >
              <div className="h-10 w-10 min-w-[40px] rounded-full bg-sys-primaryContainer flex items-center justify-center">
                <Plus className="text-sys-onPrimaryContainer" size={20} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-label-lg text-sys-onSurface">Start Custom Workout</span>
                <span className="text-body-sm text-sys-onSurfaceVar">Add your own exercises</span>
              </div>
            </button>
          </div>
        )}
    </div>
  );
}

